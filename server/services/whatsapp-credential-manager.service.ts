/**
 * WhatsApp Credential Management Service
 * Handles validation, refresh, and management of tenant WhatsApp credentials
 */

import { TenantSettingsService } from './tenant-settings.service';
import { TenantService } from './tenant.service';
import type { ServiceResponse } from '@shared/types/tenant';

export interface WhatsAppCredentials {
  phoneNumberId: string;
  accessToken: string;
  businessAccountId?: string;
  webhookVerifyToken?: string;
  appId?: string;
  appSecret?: string;
  systemUserToken?: string;
}

export interface CredentialValidationResult {
  valid: boolean;
  phoneNumber?: string;
  businessName?: string;
  verifiedName?: string;
  status?: string;
  errors?: string[];
  warnings?: string[];
  lastValidated?: Date;
  expiresAt?: Date;
  permissions?: string[];
}

export interface CredentialHealth {
  tenantId: string;
  phoneNumberId: string;
  status: 'healthy' | 'warning' | 'error' | 'expired' | 'invalid';
  lastCheck: Date;
  nextCheck: Date;
  issues: Array<{
    type: 'error' | 'warning';
    code: string;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }>;
  metrics: {
    responseTime: number;
    successRate: number;
    lastSuccessfulCall: Date;
    totalCalls: number;
    failedCalls: number;
  };
}

export interface NotificationPreferences {
  email?: string;
  webhookUrl?: string;
  slackWebhook?: string;
  notifyOnError: boolean;
  notifyOnWarning: boolean;
  notifyOnExpiry: boolean;
  expiryWarningDays: number;
}

export class WhatsAppCredentialManagerService {
  private tenantSettingsService: TenantSettingsService;
  private tenantService: TenantService;
  private credentialHealth: Map<string, CredentialHealth> = new Map();
  private validationCache: Map<string, { result: CredentialValidationResult; timestamp: number }> = new Map();
  private monitoringInterval: NodeJS.Timeout | null = null;
  
  private readonly CACHE_TTL = 15 * 60 * 1000; // 15 minutes
  private readonly HEALTH_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private readonly VALIDATION_TIMEOUT = 10000; // 10 seconds
  private readonly MAX_RETRY_ATTEMPTS = 3;

  constructor(connectionString: string) {
    this.tenantSettingsService = new TenantSettingsService(connectionString);
    this.tenantService = new TenantService(connectionString);
    
    // Start health monitoring
    this.startHealthMonitoring();
  }

  // ===== CREDENTIAL VALIDATION =====

  /**
   * Validate WhatsApp credentials for a tenant
   */
  async validateCredentials(
    tenantId: string,
    credentials?: WhatsAppCredentials
  ): Promise<ServiceResponse<CredentialValidationResult>> {
    try {
      // Get credentials if not provided
      if (!credentials) {
        const credResult = await this.getCredentials(tenantId);
        if (!credResult.success) {
          return {
            success: true,
            data: {
              valid: false,
              errors: ['Credentials not configured'],
            },
          };
        }
        credentials = credResult.data!;
      }

      // Check cache first
      const cacheKey = `${tenantId}-${credentials.phoneNumberId}`;
      const cached = this.validationCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        return { success: true, data: cached.result };
      }

      // Perform validation
      const validationResult = await this.performCredentialValidation(credentials);

      // Cache result
      this.validationCache.set(cacheKey, {
        result: validationResult,
        timestamp: Date.now(),
      });

      // Update health status
      await this.updateHealthStatus(tenantId, credentials.phoneNumberId, validationResult);

      // Store validation result
      await this.storeValidationResult(tenantId, validationResult);

      return {
        success: true,
        data: validationResult,
      };

    } catch (error) {
      console.error('Error validating credentials:', error);
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Failed to validate credentials',
          tenantId,
        },
      };
    }
  }

  /**
   * Validate multiple credentials in batch
   */
  async validateMultipleCredentials(
    credentialsList: Array<{ tenantId: string; credentials?: WhatsAppCredentials }>
  ): Promise<ServiceResponse<Array<{
    tenantId: string;
    validation: CredentialValidationResult;
    success: boolean;
  }>>> {
    try {
      const results = await Promise.all(
        credentialsList.map(async ({ tenantId, credentials }) => {
          const validationResult = await this.validateCredentials(tenantId, credentials);
          return {
            tenantId,
            validation: validationResult.success ? validationResult.data! : {
              valid: false,
              errors: [validationResult.error?.message || 'Validation failed'],
            },
            success: validationResult.success,
          };
        })
      );

      return {
        success: true,
        data: results,
      };
    } catch (error) {
      console.error('Error validating multiple credentials:', error);
      return {
        success: false,
        error: {
          code: 'BATCH_VALIDATION_ERROR',
          message: 'Failed to validate multiple credentials',
        },
      };
    }
  }

  /**
   * Perform actual credential validation against WhatsApp API
   */
  private async performCredentialValidation(
    credentials: WhatsAppCredentials
  ): Promise<CredentialValidationResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Basic validation
      if (!credentials.phoneNumberId || !credentials.accessToken) {
        return {
          valid: false,
          errors: ['Missing required credentials (phoneNumberId or accessToken)'],
        };
      }

      // Test phone number endpoint
      const phoneResult = await this.testPhoneNumberEndpoint(credentials);
      if (!phoneResult.success) {
        errors.push(`Phone number validation failed: ${phoneResult.error}`);
      }

      // Test business account endpoint
      const businessResult = await this.testBusinessAccountEndpoint(credentials);
      if (!businessResult.success) {
        warnings.push(`Business account validation failed: ${businessResult.error}`);
      }

      // Test permissions
      const permissionsResult = await this.testPermissions(credentials);
      if (!permissionsResult.success) {
        warnings.push(`Permissions check failed: ${permissionsResult.error}`);
      }

      // Check token expiry
      const expiryResult = await this.checkTokenExpiry(credentials);
      if (expiryResult.warning) {
        warnings.push(expiryResult.warning);
      }

      const responseTime = Date.now() - startTime;
      const isValid = errors.length === 0;

      return {
        valid: isValid,
        phoneNumber: phoneResult.data?.phoneNumber,
        businessName: businessResult.data?.businessName,
        verifiedName: phoneResult.data?.verifiedName,
        status: phoneResult.data?.status,
        errors: errors.length > 0 ? errors : undefined,
        warnings: warnings.length > 0 ? warnings : undefined,
        lastValidated: new Date(),
        expiresAt: expiryResult.expiresAt,
        permissions: permissionsResult.data?.permissions,
      };

    } catch (error) {
      return {
        valid: false,
        errors: [`Validation error: ${error}`],
        lastValidated: new Date(),
      };
    }
  }

  /**
   * Test phone number endpoint
   */
  private async testPhoneNumberEndpoint(
    credentials: WhatsAppCredentials
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${credentials.phoneNumberId}?fields=display_phone_number,verified_name,code_verification_status,quality_rating`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${credentials.accessToken}`,
          },
          signal: AbortSignal.timeout(this.VALIDATION_TIMEOUT),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorData.error?.message || 'Unknown error'}`,
        };
      }

      const data = await response.json();
      return {
        success: true,
        data: {
          phoneNumber: data.display_phone_number,
          verifiedName: data.verified_name,
          status: data.code_verification_status,
          qualityRating: data.quality_rating,
        },
      };

    } catch (error) {
      return {
        success: false,
        error: `Network error: ${error}`,
      };
    }
  }

  /**
   * Test business account endpoint
   */
  private async testBusinessAccountEndpoint(
    credentials: WhatsAppCredentials
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    if (!credentials.businessAccountId) {
      return { success: false, error: 'Business account ID not provided' };
    }

    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${credentials.businessAccountId}?fields=name,verification_status,business_verification_status`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${credentials.accessToken}`,
          },
          signal: AbortSignal.timeout(this.VALIDATION_TIMEOUT),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorData.error?.message || 'Unknown error'}`,
        };
      }

      const data = await response.json();
      return {
        success: true,
        data: {
          businessName: data.name,
          verificationStatus: data.verification_status,
          businessVerificationStatus: data.business_verification_status,
        },
      };

    } catch (error) {
      return {
        success: false,
        error: `Network error: ${error}`,
      };
    }
  }

  /**
   * Test token permissions
   */
  private async testPermissions(
    credentials: WhatsAppCredentials
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      // Test by attempting to get phone number permissions
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${credentials.phoneNumberId}/message_templates?limit=1`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${credentials.accessToken}`,
          },
          signal: AbortSignal.timeout(this.VALIDATION_TIMEOUT),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: `Permissions test failed: ${errorData.error?.message || 'Unknown error'}`,
        };
      }

      // If we can access templates, we have basic permissions
      return {
        success: true,
        data: {
          permissions: ['whatsapp_business_messaging', 'whatsapp_business_management'],
        },
      };

    } catch (error) {
      return {
        success: false,
        error: `Permissions test error: ${error}`,
      };
    }
  }

  /**
   * Check token expiry
   */
  private async checkTokenExpiry(
    credentials: WhatsAppCredentials
  ): Promise<{ expiresAt?: Date; warning?: string }> {
    try {
      // For system user tokens, we can check expiry via debug endpoint
      if (credentials.systemUserToken) {
        const response = await fetch(
          `https://graph.facebook.com/debug_token?input_token=${credentials.accessToken}&access_token=${credentials.systemUserToken}`,
          {
            method: 'GET',
            signal: AbortSignal.timeout(this.VALIDATION_TIMEOUT),
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.data?.expires_at) {
            const expiresAt = new Date(data.data.expires_at * 1000);
            const daysUntilExpiry = Math.floor((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            
            if (daysUntilExpiry <= 7) {
              return {
                expiresAt,
                warning: `Token expires in ${daysUntilExpiry} days`,
              };
            }
            
            return { expiresAt };
          }
        }
      }

      // For regular tokens, we can't easily check expiry, so return no warning
      return {};

    } catch (error) {
      return {
        warning: 'Could not check token expiry',
      };
    }
  }

  // ===== CREDENTIAL MANAGEMENT =====

  /**
   * Get credentials for a tenant
   */
  async getCredentials(tenantId: string): Promise<ServiceResponse<WhatsAppCredentials>> {
    try {
      const settingsResult = await this.tenantSettingsService.getSettings(tenantId, 'whatsapp');
      if (!settingsResult.success || !settingsResult.data) {
        return {
          success: false,
          error: {
            code: 'CREDENTIALS_NOT_FOUND',
            message: 'WhatsApp credentials not configured',
            tenantId,
          },
        };
      }

      const credentials = settingsResult.data.value as WhatsAppCredentials;
      return {
        success: true,
        data: credentials,
      };

    } catch (error) {
      console.error('Error getting credentials:', error);
      return {
        success: false,
        error: {
          code: 'CREDENTIALS_FETCH_ERROR',
          message: 'Failed to fetch credentials',
          tenantId,
        },
      };
    }
  }

  /**
   * Update credentials for a tenant
   */
  async updateCredentials(
    tenantId: string,
    credentials: Partial<WhatsAppCredentials>
  ): Promise<ServiceResponse<WhatsAppCredentials>> {
    try {
      // Get existing credentials
      const existingResult = await this.getCredentials(tenantId);
      const existingCredentials = existingResult.success ? existingResult.data! : {};

      // Merge with new credentials
      const updatedCredentials = {
        ...existingCredentials,
        ...credentials,
      };

      // Validate new credentials
      const validationResult = await this.validateCredentials(tenantId, updatedCredentials);
      if (!validationResult.success || !validationResult.data?.valid) {
        return {
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Credential validation failed',
            details: validationResult.data?.errors,
            tenantId,
          },
        };
      }

      // Store updated credentials
      const updateResult = await this.tenantSettingsService.updateSettings(
        tenantId,
        'whatsapp',
        updatedCredentials
      );

      if (!updateResult.success) {
        return {
          success: false,
          error: {
            code: 'CREDENTIALS_UPDATE_FAILED',
            message: 'Failed to update credentials',
            tenantId,
          },
        };
      }

      // Clear validation cache
      const cacheKey = `${tenantId}-${updatedCredentials.phoneNumberId}`;
      this.validationCache.delete(cacheKey);

      return {
        success: true,
        data: updatedCredentials,
      };

    } catch (error) {
      console.error('Error updating credentials:', error);
      return {
        success: false,
        error: {
          code: 'CREDENTIALS_UPDATE_ERROR',
          message: 'Failed to update credentials',
          tenantId,
        },
      };
    }
  }

  /**
   * Delete credentials for a tenant
   */
  async deleteCredentials(tenantId: string): Promise<ServiceResponse<void>> {
    try {
      // Get existing credentials to clear cache
      const existingResult = await this.getCredentials(tenantId);
      if (existingResult.success) {
        const cacheKey = `${tenantId}-${existingResult.data!.phoneNumberId}`;
        this.validationCache.delete(cacheKey);
        this.credentialHealth.delete(cacheKey);
      }

      // Delete settings
      const deleteResult = await this.tenantSettingsService.deleteSettings(tenantId, 'whatsapp');
      if (!deleteResult.success) {
        return {
          success: false,
          error: {
            code: 'CREDENTIALS_DELETE_FAILED',
            message: 'Failed to delete credentials',
            tenantId,
          },
        };
      }

      return { success: true };

    } catch (error) {
      console.error('Error deleting credentials:', error);
      return {
        success: false,
        error: {
          code: 'CREDENTIALS_DELETE_ERROR',
          message: 'Failed to delete credentials',
          tenantId,
        },
      };
    }
  }

  // ===== HEALTH MONITORING =====

  /**
   * Get health status for tenant credentials
   */
  async getHealthStatus(tenantId: string): Promise<ServiceResponse<CredentialHealth>> {
    try {
      const credentialsResult = await this.getCredentials(tenantId);
      if (!credentialsResult.success) {
        return {
          success: false,
          error: credentialsResult.error!,
        };
      }

      const cacheKey = `${tenantId}-${credentialsResult.data!.phoneNumberId}`;
      const health = this.credentialHealth.get(cacheKey);

      if (!health) {
        // Perform initial health check
        const validationResult = await this.validateCredentials(tenantId);
        if (!validationResult.success) {
          return {
            success: false,
            error: validationResult.error!,
          };
        }

        return {
          success: true,
          data: this.credentialHealth.get(cacheKey)!,
        };
      }

      return {
        success: true,
        data: health,
      };

    } catch (error) {
      console.error('Error getting health status:', error);
      return {
        success: false,
        error: {
          code: 'HEALTH_STATUS_ERROR',
          message: 'Failed to get health status',
          tenantId,
        },
      };
    }
  }

  /**
   * Get health status for all tenants
   */
  async getAllHealthStatuses(): Promise<ServiceResponse<CredentialHealth[]>> {
    try {
      const healthStatuses = Array.from(this.credentialHealth.values());
      return {
        success: true,
        data: healthStatuses,
      };
    } catch (error) {
      console.error('Error getting all health statuses:', error);
      return {
        success: false,
        error: {
          code: 'ALL_HEALTH_STATUS_ERROR',
          message: 'Failed to get all health statuses',
        },
      };
    }
  }

  /**
   * Update health status for a tenant
   */
  private async updateHealthStatus(
    tenantId: string,
    phoneNumberId: string,
    validationResult: CredentialValidationResult
  ): Promise<void> {
    const cacheKey = `${tenantId}-${phoneNumberId}`;
    const now = new Date();
    
    const existingHealth = this.credentialHealth.get(cacheKey);
    const issues: CredentialHealth['issues'] = [];

    // Determine status
    let status: CredentialHealth['status'] = 'healthy';
    
    if (validationResult.errors && validationResult.errors.length > 0) {
      status = 'error';
      validationResult.errors.forEach(error => {
        issues.push({
          type: 'error',
          code: 'VALIDATION_ERROR',
          message: error,
          severity: 'high',
        });
      });
    } else if (validationResult.warnings && validationResult.warnings.length > 0) {
      status = 'warning';
      validationResult.warnings.forEach(warning => {
        issues.push({
          type: 'warning',
          code: 'VALIDATION_WARNING',
          message: warning,
          severity: 'medium',
        });
      });
    }

    // Check for expiry
    if (validationResult.expiresAt) {
      const daysUntilExpiry = Math.floor((validationResult.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysUntilExpiry <= 0) {
        status = 'expired';
        issues.push({
          type: 'error',
          code: 'TOKEN_EXPIRED',
          message: 'Access token has expired',
          severity: 'critical',
        });
      } else if (daysUntilExpiry <= 7) {
        if (status === 'healthy') status = 'warning';
        issues.push({
          type: 'warning',
          code: 'TOKEN_EXPIRING',
          message: `Access token expires in ${daysUntilExpiry} days`,
          severity: 'medium',
        });
      }
    }

    const health: CredentialHealth = {
      tenantId,
      phoneNumberId,
      status,
      lastCheck: now,
      nextCheck: new Date(now.getTime() + this.HEALTH_CHECK_INTERVAL),
      issues,
      metrics: {
        responseTime: 0, // Would be calculated from actual API calls
        successRate: validationResult.valid ? 100 : 0,
        lastSuccessfulCall: validationResult.valid ? now : (existingHealth?.metrics.lastSuccessfulCall || now),
        totalCalls: (existingHealth?.metrics.totalCalls || 0) + 1,
        failedCalls: validationResult.valid ? (existingHealth?.metrics.failedCalls || 0) : (existingHealth?.metrics.failedCalls || 0) + 1,
      },
    };

    this.credentialHealth.set(cacheKey, health);

    // Send notifications if needed
    await this.checkAndSendNotifications(tenantId, health, existingHealth);
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    this.monitoringInterval = setInterval(async () => {
      await this.performHealthChecks();
    }, this.HEALTH_CHECK_INTERVAL);
  }

  /**
   * Stop health monitoring
   */
  private stopHealthMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Perform health checks for all tenants
   */
  private async performHealthChecks(): Promise<void> {
    try {
      // Get all tenants with WhatsApp credentials
      const tenantsResult = await this.tenantService.listTenants({ page: 1, limit: 1000 });
      if (!tenantsResult.success) return;

      const tenants = tenantsResult.data!.data;
      
      // Check each tenant's credentials
      for (const tenant of tenants) {
        try {
          const credentialsResult = await this.getCredentials(tenant.id);
          if (credentialsResult.success) {
            const cacheKey = `${tenant.id}-${credentialsResult.data!.phoneNumberId}`;
            const health = this.credentialHealth.get(cacheKey);
            
            // Only check if it's time for next check
            if (!health || health.nextCheck <= new Date()) {
              await this.validateCredentials(tenant.id);
            }
          }
        } catch (error) {
          console.error(`Error checking health for tenant ${tenant.id}:`, error);
        }
      }
    } catch (error) {
      console.error('Error performing health checks:', error);
    }
  }

  // ===== NOTIFICATION SYSTEM =====

  /**
   * Check and send notifications based on health status changes
   */
  private async checkAndSendNotifications(
    tenantId: string,
    currentHealth: CredentialHealth,
    previousHealth?: CredentialHealth
  ): Promise<void> {
    try {
      // Get notification preferences
      const preferencesResult = await this.getNotificationPreferences(tenantId);
      if (!preferencesResult.success) return;

      const preferences = preferencesResult.data!;
      
      // Check if we should send notifications
      const shouldNotify = this.shouldSendNotification(currentHealth, previousHealth, preferences);
      if (!shouldNotify) return;

      // Send notifications
      await this.sendNotifications(tenantId, currentHealth, preferences);

    } catch (error) {
      console.error('Error checking and sending notifications:', error);
    }
  }

  /**
   * Determine if notification should be sent
   */
  private shouldSendNotification(
    currentHealth: CredentialHealth,
    previousHealth: CredentialHealth | undefined,
    preferences: NotificationPreferences
  ): boolean {
    // Status changed to error
    if (currentHealth.status === 'error' && previousHealth?.status !== 'error' && preferences.notifyOnError) {
      return true;
    }

    // Status changed to warning
    if (currentHealth.status === 'warning' && previousHealth?.status !== 'warning' && preferences.notifyOnWarning) {
      return true;
    }

    // Token expiring
    if (currentHealth.status === 'expired' || 
        (currentHealth.issues.some(issue => issue.code === 'TOKEN_EXPIRING') && preferences.notifyOnExpiry)) {
      return true;
    }

    return false;
  }

  /**
   * Send notifications
   */
  private async sendNotifications(
    tenantId: string,
    health: CredentialHealth,
    preferences: NotificationPreferences
  ): Promise<void> {
    const message = this.buildNotificationMessage(tenantId, health);

    // Send email notification
    if (preferences.email) {
      await this.sendEmailNotification(preferences.email, message);
    }

    // Send webhook notification
    if (preferences.webhookUrl) {
      await this.sendWebhookNotification(preferences.webhookUrl, { tenantId, health, message });
    }

    // Send Slack notification
    if (preferences.slackWebhook) {
      await this.sendSlackNotification(preferences.slackWebhook, message);
    }
  }

  /**
   * Build notification message
   */
  private buildNotificationMessage(tenantId: string, health: CredentialHealth): string {
    const statusEmoji = {
      healthy: '✅',
      warning: '⚠️',
      error: '❌',
      expired: '🔴',
      invalid: '❌',
    };

    let message = `${statusEmoji[health.status]} WhatsApp Credentials Alert for Tenant: ${tenantId}\n\n`;
    message += `Status: ${health.status.toUpperCase()}\n`;
    message += `Phone Number ID: ${health.phoneNumberId}\n`;
    message += `Last Check: ${health.lastCheck.toISOString()}\n\n`;

    if (health.issues.length > 0) {
      message += 'Issues:\n';
      health.issues.forEach(issue => {
        message += `- ${issue.type.toUpperCase()}: ${issue.message}\n`;
      });
    }

    return message;
  }

  /**
   * Send email notification (placeholder - would integrate with email service)
   */
  private async sendEmailNotification(email: string, message: string): Promise<void> {
    // This would integrate with an email service like SendGrid, SES, etc.
    console.log(`Email notification to ${email}:`, message);
  }

  /**
   * Send webhook notification
   */
  private async sendWebhookNotification(webhookUrl: string, payload: any): Promise<void> {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(5000),
      });
    } catch (error) {
      console.error('Error sending webhook notification:', error);
    }
  }

  /**
   * Send Slack notification
   */
  private async sendSlackNotification(slackWebhook: string, message: string): Promise<void> {
    try {
      await fetch(slackWebhook, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: message }),
        signal: AbortSignal.timeout(5000),
      });
    } catch (error) {
      console.error('Error sending Slack notification:', error);
    }
  }

  /**
   * Get notification preferences for tenant
   */
  private async getNotificationPreferences(tenantId: string): Promise<ServiceResponse<NotificationPreferences>> {
    try {
      const settingsResult = await this.tenantSettingsService.getSettings(tenantId, 'whatsapp_notifications');
      
      if (!settingsResult.success || !settingsResult.data) {
        // Return default preferences
        return {
          success: true,
          data: {
            notifyOnError: true,
            notifyOnWarning: false,
            notifyOnExpiry: true,
            expiryWarningDays: 7,
          },
        };
      }

      return {
        success: true,
        data: settingsResult.data.value as NotificationPreferences,
      };

    } catch (error) {
      console.error('Error getting notification preferences:', error);
      return {
        success: false,
        error: {
          code: 'NOTIFICATION_PREFERENCES_ERROR',
          message: 'Failed to get notification preferences',
          tenantId,
        },
      };
    }
  }

  // ===== UTILITY METHODS =====

  /**
   * Store validation result for audit purposes
   */
  private async storeValidationResult(
    tenantId: string,
    validationResult: CredentialValidationResult
  ): Promise<void> {
    try {
      const auditData = {
        tenantId,
        validationResult,
        timestamp: new Date().toISOString(),
      };

      await this.tenantSettingsService.updateSettings(
        tenantId,
        'whatsapp_validation_history',
        auditData
      );
    } catch (error) {
      console.error('Error storing validation result:', error);
    }
  }

  /**
   * Get validation history for tenant
   */
  async getValidationHistory(tenantId: string): Promise<ServiceResponse<any[]>> {
    try {
      const historyResult = await this.tenantSettingsService.getSettings(tenantId, 'whatsapp_validation_history');
      
      if (!historyResult.success || !historyResult.data) {
        return {
          success: true,
          data: [],
        };
      }

      return {
        success: true,
        data: Array.isArray(historyResult.data.value) ? historyResult.data.value : [historyResult.data.value],
      };

    } catch (error) {
      console.error('Error getting validation history:', error);
      return {
        success: false,
        error: {
          code: 'VALIDATION_HISTORY_ERROR',
          message: 'Failed to get validation history',
          tenantId,
        },
      };
    }
  }

  /**
   * Clear validation cache
   */
  clearValidationCache(tenantId?: string): void {
    if (tenantId) {
      // Clear cache for specific tenant
      for (const [key] of this.validationCache.entries()) {
        if (key.startsWith(`${tenantId}-`)) {
          this.validationCache.delete(key);
        }
      }
    } else {
      // Clear all cache
      this.validationCache.clear();
    }
  }

  /**
   * Close service and cleanup resources
   */
  async close(): Promise<void> {
    this.stopHealthMonitoring();
    this.validationCache.clear();
    this.credentialHealth.clear();
    
    await this.tenantSettingsService.close();
    await this.tenantService.close();
  }
}