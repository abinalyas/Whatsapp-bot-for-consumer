import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { Pool } from '@neondatabase/serverless';
import { TenantSettingsService } from '@server/services/tenant-settings.service';
import { TenantService } from '@server/services/tenant.service';
import type {
  CreateTenantRequest,
  BotSettings,
  WhatsAppCredentials,
  Tenant,
} from '@shared/types/tenant';

describe('Tenant Settings Service Tests', () => {
  let settingsService: TenantSettingsService;
  let tenantService: TenantService;
  let pool: Pool;
  let testTenant: Tenant;
  let testUserId: string;

  beforeAll(async () => {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is required for settings tests');
    }

    const encryptionKey = 'test-encryption-key-32-characters-long-12345678';
    settingsService = new TenantSettingsService(process.env.DATABASE_URL, encryptionKey);
    tenantService = new TenantService(process.env.DATABASE_URL);
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
  });

  afterAll(async () => {
    await settingsService.close();
    await tenantService.close();
    await pool.end();
  });

  beforeEach(async () => {
    // Create test tenant
    const tenantData: CreateTenantRequest = {
      businessName: 'Settings Test Business',
      domain: 'settings-test.example.com',
      email: 'admin@settings-test.example.com',
      phone: '+1234567890',
      adminUser: {
        email: 'admin@settings-test.example.com',
        password: 'SecurePass123!',
        firstName: 'Settings',
        lastName: 'Admin',
        role: 'admin',
      },
    };

    const result = await tenantService.createTenant(tenantData);
    expect(result.success).toBe(true);
    testTenant = result.data!;
    testUserId = 'test-user-id-123';
  });

  afterEach(async () => {
    // Clean up test tenant
    if (testTenant) {
      await tenantService.deleteTenant(testTenant.id);
    }
  });

  describe('Bot Settings Management', () => {
    it('should get default bot settings for new tenant', async () => {
      const result = await settingsService.getBotSettings(testTenant.id);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.greetingMessage).toBe('Welcome! How can I help you today?');
      expect(result.data!.businessHours.enabled).toBe(false);
      expect(result.data!.conversationFlow.steps.length).toBeGreaterThan(0);
    });

    it('should update bot settings with validation', async () => {
      const updatedSettings: Partial<BotSettings> = {
        greetingMessage: 'Updated greeting message!',
        businessHours: {
          enabled: true,
          timezone: 'America/New_York',
          schedule: {
            monday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
            tuesday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
            wednesday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
            thursday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
            friday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
            saturday: { isOpen: false, openTime: '09:00', closeTime: '17:00' },
            sunday: { isOpen: false, openTime: '09:00', closeTime: '17:00' },
          },
          closedMessage: 'We are closed. Please try again during business hours.',
        },
      };

      const result = await settingsService.updateBotSettings(
        testTenant.id,
        updatedSettings,
        testUserId
      );

      expect(result.success).toBe(true);
      expect(result.data!.greetingMessage).toBe('Updated greeting message!');
      expect(result.data!.businessHours.enabled).toBe(true);
      expect(result.data!.businessHours.timezone).toBe('America/New_York');
    });

    it('should validate bot settings without saving', async () => {
      const validSettings: BotSettings = {
        greetingMessage: 'Valid greeting',
        businessHours: {
          enabled: true,
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
          closedMessage: 'Closed',
        },
        autoResponses: {
          welcomeMessage: 'Welcome',
          serviceSelectionPrompt: 'Select service',
          dateSelectionPrompt: 'Select date',
          timeSelectionPrompt: 'Select time',
          confirmationMessage: 'Confirm',
          paymentInstructions: 'Payment',
          bookingConfirmedMessage: 'Confirmed',
          errorMessage: 'Error',
          invalidInputMessage: 'Invalid',
        },
        conversationFlow: {
          steps: [
            {
              id: 'greeting',
              name: 'Greeting',
              type: 'greeting',
              prompt: 'Hello',
              nextStep: 'service',
            },
            {
              id: 'service',
              name: 'Service',
              type: 'service_selection',
              prompt: 'Select service',
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
            name: 'Test Company',
          },
          customFields: [],
        },
      };

      const result = await settingsService.validateBotSettings(validSettings);
      expect(result.success).toBe(true);
      expect(result.data!.isValid).toBe(true);
      expect(result.data!.errors).toBeUndefined();
    });

    it('should reject invalid bot settings', async () => {
      const invalidSettings = {
        greetingMessage: '', // Empty greeting message
        businessHours: {
          enabled: true,
          timezone: 'Invalid/Timezone',
          schedule: {
            monday: { isOpen: true, openTime: '25:00', closeTime: '17:00' }, // Invalid time
          },
        },
      } as any;

      const result = await settingsService.validateBotSettings(invalidSettings);
      expect(result.success).toBe(true);
      expect(result.data!.isValid).toBe(false);
      expect(result.data!.errors).toBeDefined();
      expect(result.data!.errors!.length).toBeGreaterThan(0);
    });

    it('should reset bot settings to default', async () => {
      // First update settings
      await settingsService.updateBotSettings(
        testTenant.id,
        { greetingMessage: 'Custom greeting' },
        testUserId
      );

      // Then reset to default
      const result = await settingsService.resetBotSettings(testTenant.id, testUserId);
      
      expect(result.success).toBe(true);
      expect(result.data!.greetingMessage).toBe('Welcome! How can I help you today?');
    });

    it('should handle non-existent tenant', async () => {
      const fakeUuid = '00000000-0000-0000-0000-000000000000';
      const result = await settingsService.getBotSettings(fakeUuid);
      
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('TENANT_NOT_FOUND');
    });
  });

  describe('WhatsApp Credentials Management', () => {
    it('should handle missing WhatsApp configuration', async () => {
      const result = await settingsService.getWhatsAppConfig(testTenant.id);
      
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('WHATSAPP_NOT_CONFIGURED');
    });

    it('should update and encrypt WhatsApp credentials', async () => {
      const credentials: WhatsAppCredentials = {
        accessToken: 'EAABwzLixnjYBAOZBVZCxyz123456789',
        verifyToken: 'my_verify_token_123',
        phoneNumberId: '123456789012345',
        businessAccountId: '123456789012345',
        appId: '123456789012345',
        appSecret: 'abcdef1234567890abcdef1234567890',
      };

      const result = await settingsService.updateWhatsAppCredentials(testTenant.id, credentials);
      
      expect(result.success).toBe(true);
      expect(result.data!.success).toBe(true);
      expect(result.data!.verified).toBe(true);
    });

    it('should test WhatsApp credentials', async () => {
      const validCredentials: WhatsAppCredentials = {
        accessToken: 'EAABwzLixnjYBAOZBVZCxyz123456789',
        verifyToken: 'my_verify_token_123',
        phoneNumberId: '123456789012345',
        businessAccountId: '123456789012345',
        appId: '123456789012345',
        appSecret: 'abcdef1234567890abcdef1234567890',
      };

      const result = await settingsService.testWhatsAppCredentials(validCredentials);
      
      expect(result.isValid).toBe(true);
      expect(result.phoneNumber).toBeDefined();
      expect(result.businessName).toBeDefined();
      expect(result.webhookVerified).toBe(true);
    });

    it('should reject invalid WhatsApp credentials', async () => {
      const invalidCredentials: WhatsAppCredentials = {
        accessToken: 'invalid_token', // Invalid format
        verifyToken: '123', // Too short
        phoneNumberId: '123', // Too short
        businessAccountId: '123456789012345',
        appId: '123456789012345',
        appSecret: 'abcdef1234567890abcdef1234567890',
      };

      const result = await settingsService.testWhatsAppCredentials(invalidCredentials);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    });

    it('should verify webhook configuration', async () => {
      // First set up WhatsApp credentials
      const credentials: WhatsAppCredentials = {
        accessToken: 'EAABwzLixnjYBAOZBVZCxyz123456789',
        verifyToken: 'my_verify_token_123',
        phoneNumberId: '123456789012345',
        businessAccountId: '123456789012345',
        appId: '123456789012345',
        appSecret: 'abcdef1234567890abcdef1234567890',
      };

      await settingsService.updateWhatsAppCredentials(testTenant.id, credentials);

      // Then verify webhook
      const challenge = 'webhook_challenge_123';
      const result = await settingsService.verifyWebhook(testTenant.id, challenge);
      
      expect(result.success).toBe(true);
      expect(result.data).toBe(challenge);
    });
  });

  describe('Settings Versioning', () => {
    it('should get empty settings versions for new tenant', async () => {
      const result = await settingsService.getSettingsVersions(testTenant.id);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should handle version restore not implemented', async () => {
      const result = await settingsService.restoreSettingsVersion(testTenant.id, 1, testUserId);
      
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('VERSION_RESTORE_NOT_IMPLEMENTED');
    });
  });

  describe('Encryption and Security', () => {
    it('should encrypt and decrypt data correctly', async () => {
      const originalText = 'sensitive_data_123';
      
      // Access private methods through any casting for testing
      const service = settingsService as any;
      const encrypted = service.encrypt(originalText);
      const decrypted = service.decrypt(encrypted);
      
      expect(encrypted).not.toBe(originalText);
      expect(encrypted).toContain(':'); // Should contain separators
      expect(decrypted).toBe(originalText);
    });

    it('should handle encryption errors gracefully', async () => {
      const service = settingsService as any;
      
      expect(() => {
        service.decrypt('invalid:encrypted:data');
      }).toThrow('Failed to decrypt data');
    });

    it('should generate unique encryption keys', async () => {
      const service1 = new TenantSettingsService(process.env.DATABASE_URL!);
      const service2 = new TenantSettingsService(process.env.DATABASE_URL!);
      
      const key1 = (service1 as any).encryptionKey;
      const key2 = (service2 as any).encryptionKey;
      
      expect(key1).not.toBe(key2);
      expect(key1.length).toBeGreaterThan(0);
      expect(key2.length).toBeGreaterThan(0);
      
      await service1.close();
      await service2.close();
    });
  });

  describe('Conversation Flow Validation', () => {
    it('should validate conversation flow integrity', async () => {
      const validFlow = {
        steps: [
          {
            id: 'start',
            name: 'Start',
            type: 'greeting' as const,
            prompt: 'Hello!',
            nextStep: 'service',
          },
          {
            id: 'service',
            name: 'Service Selection',
            type: 'service_selection' as const,
            prompt: 'Select service:',
            nextStep: 'end',
          },
          {
            id: 'end',
            name: 'End',
            type: 'confirmation' as const,
            prompt: 'Thank you!',
          },
        ],
        fallbackBehavior: 'restart' as const,
        maxRetries: 3,
        sessionTimeout: 30,
      };

      const settings: Partial<BotSettings> = {
        conversationFlow: validFlow,
      };

      const result = await settingsService.updateBotSettings(
        testTenant.id,
        settings,
        testUserId
      );

      expect(result.success).toBe(true);
      expect(result.data!.conversationFlow.steps.length).toBe(3);
    });

    it('should reject invalid conversation flow', async () => {
      const invalidFlow = {
        steps: [
          {
            id: 'start',
            name: 'Start',
            type: 'greeting' as const,
            prompt: 'Hello!',
            nextStep: 'nonexistent', // References non-existent step
          },
        ],
        fallbackBehavior: 'restart' as const,
        maxRetries: 3,
        sessionTimeout: 30,
      };

      const settings: Partial<BotSettings> = {
        conversationFlow: invalidFlow,
      };

      const result = await settingsService.updateBotSettings(
        testTenant.id,
        settings,
        testUserId
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('SETTINGS_UPDATE_FAILED');
    });
  });

  describe('Webhook URL Validation', () => {
    it('should validate webhook URLs in notification settings', async () => {
      const settingsWithValidWebhook: Partial<BotSettings> = {
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
            enabled: true,
            endpoints: [
              {
                id: 'webhook-1',
                url: 'https://api.example.com/webhook',
                secret: 'webhook_secret_123',
                isActive: true,
                retryPolicy: {
                  maxRetries: 3,
                  backoffMultiplier: 2,
                  maxBackoffSeconds: 300,
                },
              },
            ],
            events: ['booking_created'],
          },
        },
      };

      const result = await settingsService.validateBotSettings({
        ...await (await settingsService.getBotSettings(testTenant.id)).data!,
        ...settingsWithValidWebhook,
      });

      expect(result.success).toBe(true);
      expect(result.data!.isValid).toBe(true);
    });

    it('should reject invalid webhook URLs', async () => {
      const settingsWithInvalidWebhook: Partial<BotSettings> = {
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
            enabled: true,
            endpoints: [
              {
                id: 'webhook-1',
                url: 'http://insecure.example.com/webhook', // HTTP instead of HTTPS
                secret: 'webhook_secret_123',
                isActive: true,
                retryPolicy: {
                  maxRetries: 3,
                  backoffMultiplier: 2,
                  maxBackoffSeconds: 300,
                },
              },
            ],
            events: ['booking_created'],
          },
        },
      };

      const result = await settingsService.validateBotSettings({
        ...await (await settingsService.getBotSettings(testTenant.id)).data!,
        ...settingsWithInvalidWebhook,
      });

      expect(result.success).toBe(true);
      expect(result.data!.isValid).toBe(false);
      expect(result.data!.errors).toBeDefined();
      expect(result.data!.errors!.some(error => error.includes('HTTPS'))).toBe(true);
    });
  });
});