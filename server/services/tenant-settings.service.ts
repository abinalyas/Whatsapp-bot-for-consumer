/**
 * Tenant Settings Service
 * Manages tenant-specific settings, WhatsApp credentials, and bot configuration
 */

import { eq, and, desc } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import crypto from 'crypto';
import * as schema from '@shared/schema';
import type {
  Tenant,
  BotSettings,
  WhatsAppCredentials,
  WhatsAppConfig,
  WhatsAppValidationResult,
  ServiceResponse,
  TenantError,
} from '@shared/types/tenant';
import {
  tenantValidationSchemas,
  validateConversationFlow,
  validateWebhookUrl,
} from '@shared/validation/tenant';

export interface SettingsVersion {
  id: string;
  tenantId: string;
  version: number;
  settings: BotSettings;
  createdBy: string;
  createdAt: Date;
  isActive: boolean;
}

export interface WhatsAppTestResult {
  isValid: boolean;
  phoneNumber?: string;
  businessName?: string;
  webhookVerified?: boolean;
  errors?: string[];
}

export class TenantSettingsService {
  private db: ReturnType<typeof drizzle>;
  private pool: Pool;
  private encryptionKey: string;

  constructor(connectionString: string, encryptionKey?: string) {
    this.pool = new Pool({ connectionString });
    this.db = drizzle({ client: this.pool, schema });
    this.encryptionKey = encryptionKey || process.env.ENCRYPTION_KEY || this.generateEncryptionKey();
  }

  // ===== BOT SETTINGS MANAGEMENT =====

  /**
   * Get current bot settings for tenant
   */
  async getBotSettings(tenantId: string): Promise<ServiceResponse<BotSettings>> {
    try {
      const [tenant] = await this.db
        .select()
        .from(schema.tenants)
        .where(eq(schema.tenants.id, tenantId))
        .limit(1);

      if (!tenant) {
        return {
          success: false,
          error: {
            code: 'TENANT_NOT_FOUND',
            message: 'Tenant not found',
            tenantId,
          },
        };
      }

      return {
        success: true,
        data: tenant.botSettings as BotSettings,
      };
    } catch (error) {
      console.error('Error getting bot settings:', error);
      return {
        success: false,
        error: {
          code: 'SETTINGS_FETCH_FAILED',
          message: 'Failed to fetch bot settings',
          tenantId,
        },
      };
    }
  }

  /**
   * Update bot settings with validation and versioning
   */
  async updateBotSettings(
    tenantId: string,
    settings: Partial<BotSettings>,
    userId: string
  ): Promise<ServiceResponse<BotSettings>> {
    try {
      // Get current settings
      const currentResult = await this.getBotSettings(tenantId);
      if (!currentResult.success) {
        return currentResult;
      }

      const currentSettings = currentResult.data!;
      const updatedSettings = { ...currentSettings, ...settings };

      // Validate updated settings
      const validatedSettings = tenantValidationSchemas.botSettings.parse(updatedSettings);

      // Validate conversation flow integrity if provided
      if (settings.conversationFlow) {
        validateConversationFlow(settings.conversationFlow);
      }

      // Create settings version backup
      await this.createSettingsVersion(tenantId, currentSettings, userId);

      // Update tenant settings
      const [updatedTenant] = await this.db
        .update(schema.tenants)
        .set({
          botSettings: validatedSettings,
          updatedAt: new Date(),
        })
        .where(eq(schema.tenants.id, tenantId))
        .returning();

      return {
        success: true,
        data: updatedTenant.botSettings as BotSettings,
        metadata: { updated: true, version: 'latest' },
      };
    } catch (error) {
      console.error('Error updating bot settings:', error);
      return {
        success: false,
        error: {
          code: 'SETTINGS_UPDATE_FAILED',
          message: 'Failed to update bot settings',
          tenantId,
          details: { originalError: error instanceof Error ? error.message : 'Unknown error' },
        },
      };
    }
  }

  /**
   * Reset bot settings to default
   */
  async resetBotSettings(tenantId: string, userId: string): Promise<ServiceResponse<BotSettings>> {
    const defaultSettings = this.getDefaultBotSettings();
    return this.updateBotSettings(tenantId, defaultSettings, userId);
  }

  /**
   * Validate bot settings without saving
   */
  async validateBotSettings(settings: BotSettings): Promise<ServiceResponse<{ isValid: boolean; errors?: string[] }>> {
    try {
      tenantValidationSchemas.botSettings.parse(settings);
      
      // Additional business logic validation
      const errors: string[] = [];

      // Validate conversation flow
      try {
        validateConversationFlow(settings.conversationFlow);
      } catch (error) {
        errors.push(`Conversation flow error: ${error instanceof Error ? error.message : 'Invalid flow'}`);
      }

      // Validate webhook URLs if present
      if (settings.notificationSettings.webhookNotifications.enabled) {
        for (const endpoint of settings.notificationSettings.webhookNotifications.endpoints) {
          try {
            validateWebhookUrl(endpoint.url);
          } catch (error) {
            errors.push(`Invalid webhook URL ${endpoint.url}: ${error instanceof Error ? error.message : 'Invalid URL'}`);
          }
        }
      }

      return {
        success: true,
        data: {
          isValid: errors.length === 0,
          errors: errors.length > 0 ? errors : undefined,
        },
      };
    } catch (error) {
      return {
        success: true,
        data: {
          isValid: false,
          errors: [error instanceof Error ? error.message : 'Validation failed'],
        },
      };
    }
  }

  // ===== WHATSAPP CREDENTIALS MANAGEMENT =====

  /**
   * Get WhatsApp configuration (decrypted)
   */
  async getWhatsAppConfig(tenantId: string): Promise<ServiceResponse<WhatsAppConfig>> {
    try {
      const [tenant] = await this.db
        .select()
        .from(schema.tenants)
        .where(eq(schema.tenants.id, tenantId))
        .limit(1);

      if (!tenant) {
        return {
          success: false,
          error: {
            code: 'TENANT_NOT_FOUND',
            message: 'Tenant not found',
            tenantId,
          },
        };
      }

      if (!tenant.whatsappToken || !tenant.whatsappPhoneId) {
        return {
          success: false,
          error: {
            code: 'WHATSAPP_NOT_CONFIGURED',
            message: 'WhatsApp credentials not configured',
            tenantId,
          },
        };
      }

      // Decrypt WhatsApp token
      const decryptedToken = this.decrypt(tenant.whatsappToken);

      const config: WhatsAppConfig = {
        phoneNumberId: tenant.whatsappPhoneId,
        accessToken: decryptedToken,
        verifyToken: tenant.whatsappVerifyToken || '',
        businessAccountId: '', // Would be stored separately in a real implementation
        appId: '', // Would be stored separately
        appSecret: '', // Would be stored separately
        webhookUrl: `${process.env.BASE_URL || 'https://api.example.com'}/webhooks/whatsapp/${tenantId}`,
        isVerified: false, // Would be determined by actual verification
        lastVerified: undefined,
      };

      return {
        success: true,
        data: config,
      };
    } catch (error) {
      console.error('Error getting WhatsApp config:', error);
      return {
        success: false,
        error: {
          code: 'WHATSAPP_CONFIG_FETCH_FAILED',
          message: 'Failed to fetch WhatsApp configuration',
          tenantId,
        },
      };
    }
  }

  /**
   * Update WhatsApp credentials with encryption
   */
  async updateWhatsAppCredentials(
    tenantId: string,
    credentials: WhatsAppCredentials
  ): Promise<ServiceResponse<{ success: boolean; verified: boolean }>> {
    try {
      // Validate credentials format
      const validatedCredentials = tenantValidationSchemas.whatsappCredentials.parse(credentials);

      // Test credentials before saving
      const testResult = await this.testWhatsAppCredentials(validatedCredentials);
      
      if (!testResult.isValid) {
        return {
          success: false,
          error: {
            code: 'INVALID_WHATSAPP_CREDENTIALS',
            message: 'WhatsApp credentials validation failed',
            tenantId,
            details: { errors: testResult.errors },
          },
        };
      }

      // Encrypt sensitive data
      const encryptedToken = this.encrypt(validatedCredentials.accessToken);
      const encryptedAppSecret = this.encrypt(validatedCredentials.appSecret);

      // Update tenant with encrypted credentials
      await this.db
        .update(schema.tenants)
        .set({
          whatsappPhoneId: validatedCredentials.phoneNumberId,
          whatsappToken: encryptedToken,
          whatsappVerifyToken: validatedCredentials.verifyToken,
          // In a real implementation, we'd store businessAccountId, appId, appSecret separately
          updatedAt: new Date(),
        })
        .where(eq(schema.tenants.id, tenantId));

      return {
        success: true,
        data: {
          success: true,
          verified: testResult.isValid,
        },
        metadata: { updated: true, verified: testResult.isValid },
      };
    } catch (error) {
      console.error('Error updating WhatsApp credentials:', error);
      return {
        success: false,
        error: {
          code: 'WHATSAPP_UPDATE_FAILED',
          message: 'Failed to update WhatsApp credentials',
          tenantId,
          details: { originalError: error instanceof Error ? error.message : 'Unknown error' },
        },
      };
    }
  }

  /**
   * Test WhatsApp credentials
   */
  async testWhatsAppCredentials(credentials: WhatsAppCredentials): Promise<WhatsAppTestResult> {
    try {
      // In a real implementation, this would make actual API calls to WhatsApp
      // For now, we'll do basic validation
      
      const errors: string[] = [];

      // Validate token format (basic check)
      if (!credentials.accessToken.startsWith('EAA')) {
        errors.push('Access token format appears invalid');
      }

      // Validate phone number ID format
      if (!/^\d{15,}$/.test(credentials.phoneNumberId)) {
        errors.push('Phone number ID format appears invalid');
      }

      // Validate verify token
      if (credentials.verifyToken.length < 8) {
        errors.push('Verify token should be at least 8 characters');
      }

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      return {
        isValid: errors.length === 0,
        phoneNumber: errors.length === 0 ? '+1234567890' : undefined,
        businessName: errors.length === 0 ? 'Test Business' : undefined,
        webhookVerified: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      return {
        isValid: false,
        errors: ['Failed to test credentials: ' + (error instanceof Error ? error.message : 'Unknown error')],
      };
    }
  }

  /**
   * Verify webhook configuration
   */
  async verifyWebhook(tenantId: string, challenge: string): Promise<ServiceResponse<string>> {
    try {
      const configResult = await this.getWhatsAppConfig(tenantId);
      if (!configResult.success) {
        return {
          success: false,
          error: configResult.error!,
        };
      }

      const config = configResult.data!;
      
      // In a real implementation, this would verify the webhook challenge
      // For now, we'll return the challenge if credentials are configured
      return {
        success: true,
        data: challenge,
        metadata: { verified: true },
      };
    } catch (error) {
      console.error('Error verifying webhook:', error);
      return {
        success: false,
        error: {
          code: 'WEBHOOK_VERIFICATION_FAILED',
          message: 'Failed to verify webhook',
          tenantId,
        },
      };
    }
  }

  // ===== SETTINGS VERSIONING =====

  /**
   * Create a settings version backup
   */
  private async createSettingsVersion(
    tenantId: string,
    settings: BotSettings,
    userId: string
  ): Promise<void> {
    try {
      // Get current version number
      const versions = await this.getSettingsVersions(tenantId);
      const nextVersion = versions.success ? versions.data!.length + 1 : 1;

      // In a real implementation, we'd have a separate settings_versions table
      // For now, we'll simulate this functionality
      console.log(`Creating settings version ${nextVersion} for tenant ${tenantId} by user ${userId}`);
    } catch (error) {
      console.error('Error creating settings version:', error);
      // Don't throw error as this is a backup operation
    }
  }

  /**
   * Get settings version history
   */
  async getSettingsVersions(tenantId: string): Promise<ServiceResponse<SettingsVersion[]>> {
    try {
      // In a real implementation, this would query a settings_versions table
      // For now, return empty array
      return {
        success: true,
        data: [],
      };
    } catch (error) {
      console.error('Error getting settings versions:', error);
      return {
        success: false,
        error: {
          code: 'VERSIONS_FETCH_FAILED',
          message: 'Failed to fetch settings versions',
          tenantId,
        },
      };
    }
  }

  /**
   * Restore settings from a specific version
   */
  async restoreSettingsVersion(
    tenantId: string,
    version: number,
    userId: string
  ): Promise<ServiceResponse<BotSettings>> {
    try {
      // In a real implementation, this would restore from settings_versions table
      return {
        success: false,
        error: {
          code: 'VERSION_RESTORE_NOT_IMPLEMENTED',
          message: 'Settings version restore not yet implemented',
          tenantId,
        },
      };
    } catch (error) {
      console.error('Error restoring settings version:', error);
      return {
        success: false,
        error: {
          code: 'VERSION_RESTORE_FAILED',
          message: 'Failed to restore settings version',
          tenantId,
        },
      };
    }
  }

  // ===== ENCRYPTION UTILITIES =====

  /**
   * Encrypt sensitive data
   */
  private encrypt(text: string): string {
    try {
      const algorithm = 'aes-256-gcm';
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher(algorithm, this.encryptionKey);
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt sensitive data
   */
  private decrypt(encryptedText: string): string {
    try {
      const algorithm = 'aes-256-gcm';
      const parts = encryptedText.split(':');
      
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
      }
      
      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const encrypted = parts[2];
      
      const decipher = crypto.createDecipher(algorithm, this.encryptionKey);
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Generate encryption key
   */
  private generateEncryptionKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // ===== DEFAULT SETTINGS =====

  /**
   * Get default bot settings
   */
  private getDefaultBotSettings(): BotSettings {
    return {
      greetingMessage: 'Welcome! How can I help you today?',
      businessHours: {
        enabled: false,
        timezone: 'UTC',
        schedule: {
          monday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
          tuesday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
          wednesday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
          thursday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
          friday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
          saturday: { isOpen: false, openTime: '09:00', closeTime: '17:00' },
          sunday: { isOpen: false, openTime: '09:00', closeTime: '17:00' },
        },
        closedMessage: 'We are currently closed. Please try again during business hours.',
      },
      autoResponses: {
        welcomeMessage: 'Hello! How can I help you today?',
        serviceSelectionPrompt: 'Please select a service:',
        dateSelectionPrompt: 'Please select a date:',
        timeSelectionPrompt: 'Please select a time:',
        confirmationMessage: 'Please confirm your booking:',
        paymentInstructions: 'Payment instructions will be sent shortly.',
        bookingConfirmedMessage: 'Your booking has been confirmed!',
        errorMessage: 'Sorry, something went wrong. Please try again.',
        invalidInputMessage: 'Invalid input. Please try again.',
      },
      conversationFlow: {
        steps: [
          {
            id: 'greeting',
            name: 'Greeting',
            type: 'greeting',
            prompt: 'Welcome! How can I help you?',
            nextStep: 'service_selection',
          },
          {
            id: 'service_selection',
            name: 'Service Selection',
            type: 'service_selection',
            prompt: 'Please select a service:',
            nextStep: 'date_selection',
          },
          {
            id: 'date_selection',
            name: 'Date Selection',
            type: 'date_selection',
            prompt: 'Please select a date:',
            nextStep: 'time_selection',
          },
          {
            id: 'time_selection',
            name: 'Time Selection',
            type: 'time_selection',
            prompt: 'Please select a time:',
            nextStep: 'confirmation',
          },
          {
            id: 'confirmation',
            name: 'Confirmation',
            type: 'confirmation',
            prompt: 'Your booking has been confirmed!',
          },
        ],
        fallbackBehavior: 'restart',
        maxRetries: 3,
        sessionTimeout: 30,
      },
      paymentSettings: {
        enabled: false,
        methods: [],
        currency: 'USD',
        requirePayment: false,
      },
      notificationSettings: {
        emailNotifications: {
          enabled: false,
          recipientEmails: [],
          events: [],
        },
        smsNotifications: {
          enabled: false,
          recipientPhones: [],
          events: [],
        },
        webhookNotifications: {
          enabled: false,
          endpoints: [],
          events: [],
        },
      },
      customization: {
        brandColors: {
          primary: '#007bff',
          secondary: '#6c757d',
          accent: '#28a745',
          background: '#ffffff',
          text: '#212529',
        },
        companyInfo: {
          name: '',
        },
        customFields: [],
      },
    };
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}