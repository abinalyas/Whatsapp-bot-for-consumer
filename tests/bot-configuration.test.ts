/**
 * Bot Configuration Service Unit Tests
 * Tests dynamic bot configuration management with validation and real-time updates
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BotConfigurationService, BotConfigurationUpdate, ConfigurationRollbackInfo } from '../server/services/bot-configuration.service';
import { TenantSettingsService } from '../server/services/tenant-settings.service';
import type { BotSettings, BusinessHours, AutoResponses } from '@shared/types/tenant';

// Mock database connection
const mockConnectionString = 'postgresql://test:test@localhost:5432/test';

// Mock TenantSettingsService
const mockTenantSettingsService = {
  getSettings: vi.fn(),
  updateSettings: vi.fn(),
  rollbackToVersion: vi.fn(),
  getSettingsHistory: vi.fn(),
} as unknown as TenantSettingsService;

// Mock drizzle and database
vi.mock('drizzle-orm/neon-serverless', () => ({
  drizzle: vi.fn(() => ({})),
}));

vi.mock('@neondatabase/serverless', () => ({
  Pool: vi.fn(() => ({
    end: vi.fn(),
  })),
}));

// Mock TenantSettingsService
vi.mock('../server/services/tenant-settings.service', () => ({
  TenantSettingsService: vi.fn(() => mockTenantSettingsService),
}));

describe('BotConfigurationService', () => {
  let botConfigService: BotConfigurationService;
  let mockBotSettings: BotSettings;

  beforeEach(() => {
    botConfigService = new BotConfigurationService(mockConnectionString);
    
    // Mock bot settings
    mockBotSettings = {
      greetingMessage: 'Hello! Welcome to our business.',
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
        closedMessage: 'We are currently closed.',
      },
      autoResponses: {
        welcomeMessage: 'Welcome!',
        serviceSelectionPrompt: 'Please select a service:',
        dateSelectionPrompt: 'Please select a date:',
        timeSelectionPrompt: 'Please select a time:',
        confirmationMessage: 'Please confirm:',
        paymentInstructions: 'Please pay:',
        bookingConfirmedMessage: 'Confirmed!',
        errorMessage: 'Error occurred.',
        invalidInputMessage: 'Invalid input.',
      },
      conversationFlow: {
        steps: [
          {
            id: 'greeting',
            name: 'Greeting',
            type: 'greeting',
            prompt: 'Hello!',
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
          name: 'Test Business',
          email: 'test@business.com',
        },
        customFields: [],
      },
    };

    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await botConfigService.close();
  });

  describe('Configuration Retrieval', () => {
    it('should get bot configuration from database when not cached', async () => {
      vi.mocked(mockTenantSettingsService.getSettings).mockResolvedValue({
        success: true,
        data: {
          id: 'settings-1',
          tenantId: 'tenant-123',
          version: 1,
          botSettings: mockBotSettings,
          billingSettings: {},
          createdBy: 'user-1',
          createdAt: new Date(),
          isActive: true,
        },
      });

      const result = await botConfigService.getBotConfiguration('tenant-123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockBotSettings);
      expect(result.metadata?.fromCache).toBe(false);
      expect(mockTenantSettingsService.getSettings).toHaveBeenCalledWith('tenant-123');
    });

    it('should get bot configuration from cache when available', async () => {
      // First call to populate cache
      vi.mocked(mockTenantSettingsService.getSettings).mockResolvedValue({
        success: true,
        data: {
          id: 'settings-1',
          tenantId: 'tenant-123',
          version: 1,
          botSettings: mockBotSettings,
          billingSettings: {},
          createdBy: 'user-1',
          createdAt: new Date(),
          isActive: true,
        },
      });

      await botConfigService.getBotConfiguration('tenant-123');

      // Second call should use cache
      const result = await botConfigService.getBotConfiguration('tenant-123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockBotSettings);
      expect(result.metadata?.fromCache).toBe(true);
      expect(mockTenantSettingsService.getSettings).toHaveBeenCalledTimes(1);
    });

    it('should get specific configuration section', async () => {
      vi.mocked(mockTenantSettingsService.getSettings).mockResolvedValue({
        success: true,
        data: {
          id: 'settings-1',
          tenantId: 'tenant-123',
          version: 1,
          botSettings: mockBotSettings,
          billingSettings: {},
          createdBy: 'user-1',
          createdAt: new Date(),
          isActive: true,
        },
      });

      const result = await botConfigService.getConfigurationSection('tenant-123', 'businessHours');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockBotSettings.businessHours);
    });

    it('should handle settings service errors', async () => {
      vi.mocked(mockTenantSettingsService.getSettings).mockResolvedValue({
        success: false,
        error: {
          code: 'SETTINGS_NOT_FOUND',
          message: 'Settings not found',
        },
      });

      const result = await botConfigService.getBotConfiguration('tenant-123');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('SETTINGS_NOT_FOUND');
    });
  });

  describe('Configuration Updates', () => {
    beforeEach(() => {
      // Mock successful settings retrieval
      vi.mocked(mockTenantSettingsService.getSettings).mockResolvedValue({
        success: true,
        data: {
          id: 'settings-1',
          tenantId: 'tenant-123',
          version: 1,
          botSettings: mockBotSettings,
          billingSettings: {},
          createdBy: 'user-1',
          createdAt: new Date(),
          isActive: true,
        },
      });
    });

    it('should update bot configuration successfully', async () => {
      const updates: BotConfigurationUpdate = {
        greetingMessage: 'Updated greeting message',
        businessHours: {
          enabled: false,
        },
      };

      vi.mocked(mockTenantSettingsService.updateSettings).mockResolvedValue({
        success: true,
        data: {
          id: 'settings-1',
          tenantId: 'tenant-123',
          version: 2,
          botSettings: { ...mockBotSettings, ...updates },
          billingSettings: {},
          createdBy: 'user-1',
          createdAt: new Date(),
          isActive: true,
        },
      });

      const result = await botConfigService.updateBotConfiguration(
        'tenant-123',
        updates,
        'user-1'
      );

      expect(result.success).toBe(true);
      expect(result.data!.greetingMessage).toBe('Updated greeting message');
      expect(result.data!.businessHours.enabled).toBe(false);
      expect(result.metadata?.updated).toBe(true);
    });

    it('should validate configuration before updating', async () => {
      const invalidUpdates: BotConfigurationUpdate = {
        greetingMessage: '', // Invalid: empty greeting message
        businessHours: {
          enabled: true,
          timezone: '', // Invalid: empty timezone when enabled
        },
      };

      const result = await botConfigService.updateBotConfiguration(
        'tenant-123',
        invalidUpdates,
        'user-1'
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('CONFIG_VALIDATION_FAILED');
      expect(result.error?.details?.errors).toHaveLength(2);
    });

    it('should support validation-only mode', async () => {
      const updates: BotConfigurationUpdate = {
        greetingMessage: 'Valid greeting message',
      };

      const result = await botConfigService.updateBotConfiguration(
        'tenant-123',
        updates,
        'user-1',
        true // validateOnly
      );

      expect(result.success).toBe(true);
      expect(result.metadata?.validationOnly).toBe(true);
      expect(mockTenantSettingsService.updateSettings).not.toHaveBeenCalled();
    });

    it('should update specific configuration section', async () => {
      const businessHoursUpdate: Partial<BusinessHours> = {
        enabled: false,
        closedMessage: 'We are closed for maintenance',
      };

      vi.mocked(mockTenantSettingsService.updateSettings).mockResolvedValue({
        success: true,
        data: {
          id: 'settings-1',
          tenantId: 'tenant-123',
          version: 2,
          botSettings: {
            ...mockBotSettings,
            businessHours: { ...mockBotSettings.businessHours, ...businessHoursUpdate },
          },
          billingSettings: {},
          createdBy: 'user-1',
          createdAt: new Date(),
          isActive: true,
        },
      });

      const result = await botConfigService.updateConfigurationSection(
        'tenant-123',
        'businessHours',
        businessHoursUpdate,
        'user-1'
      );

      expect(result.success).toBe(true);
      expect(result.data!.enabled).toBe(false);
      expect(result.data!.closedMessage).toBe('We are closed for maintenance');
    });
  });

  describe('Configuration Validation', () => {
    it('should validate greeting message', async () => {
      const validConfig = { ...mockBotSettings };
      const invalidConfig = { ...mockBotSettings, greetingMessage: '' };

      const validResult = await botConfigService.validateConfiguration(validConfig);
      const invalidResult = await botConfigService.validateConfiguration(invalidConfig);

      expect(validResult.isValid).toBe(true);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors).toContainEqual({
        field: 'greetingMessage',
        message: 'Greeting message is required',
        code: 'GREETING_MESSAGE_REQUIRED',
      });
    });

    it('should validate business hours', async () => {
      const invalidConfig = {
        ...mockBotSettings,
        businessHours: {
          ...mockBotSettings.businessHours,
          enabled: true,
          timezone: '', // Invalid: empty timezone
          schedule: {
            ...mockBotSettings.businessHours.schedule,
            monday: { isOpen: true, openTime: '25:00', closeTime: '17:00' }, // Invalid time format
          },
        },
      };

      const result = await botConfigService.validateConfiguration(invalidConfig);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'businessHours.timezone',
        message: 'Timezone is required when business hours are enabled',
        code: 'TIMEZONE_REQUIRED',
      });
      expect(result.errors).toContainEqual({
        field: 'businessHours.schedule.monday.openTime',
        message: 'Invalid open time format for monday. Use HH:MM format',
        code: 'INVALID_TIME_FORMAT',
      });
    });

    it('should validate auto responses', async () => {
      const invalidConfig = {
        ...mockBotSettings,
        autoResponses: {
          ...mockBotSettings.autoResponses,
          welcomeMessage: '', // Invalid: empty required field
          errorMessage: '', // Invalid: empty required field
        },
      };

      const result = await botConfigService.validateConfiguration(invalidConfig);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'autoResponses.welcomeMessage',
        message: 'welcomeMessage is required',
        code: 'AUTO_RESPONSE_REQUIRED',
      });
      expect(result.errors).toContainEqual({
        field: 'autoResponses.errorMessage',
        message: 'errorMessage is required',
        code: 'AUTO_RESPONSE_REQUIRED',
      });
    });

    it('should validate conversation flow', async () => {
      const invalidConfig = {
        ...mockBotSettings,
        conversationFlow: {
          ...mockBotSettings.conversationFlow,
          steps: [
            { id: '', name: 'Invalid Step', type: 'greeting', prompt: '' }, // Invalid: empty id and prompt
            { id: 'step1', name: '', type: 'service_selection', prompt: 'Valid prompt' }, // Invalid: empty name
            { id: 'step1', name: 'Duplicate', type: 'date_selection', prompt: 'Another prompt' }, // Invalid: duplicate id
          ],
        },
      };

      const result = await botConfigService.validateConfiguration(invalidConfig);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'STEP_ID_REQUIRED')).toBe(true);
      expect(result.errors.some(e => e.code === 'STEP_PROMPT_REQUIRED')).toBe(true);
      expect(result.errors.some(e => e.code === 'STEP_NAME_REQUIRED')).toBe(true);
      expect(result.errors.some(e => e.code === 'DUPLICATE_STEP_IDS')).toBe(true);
    });

    it('should validate payment settings', async () => {
      const invalidConfig = {
        ...mockBotSettings,
        paymentSettings: {
          enabled: true,
          methods: [], // Invalid: no payment methods when enabled
          currency: '', // Invalid: empty currency when enabled
          requirePayment: true,
          depositPercentage: 150, // Invalid: percentage > 100
        },
      };

      const result = await botConfigService.validateConfiguration(invalidConfig);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'paymentSettings.methods',
        message: 'At least one payment method is required when payments are enabled',
        code: 'PAYMENT_METHODS_REQUIRED',
      });
      expect(result.errors).toContainEqual({
        field: 'paymentSettings.currency',
        message: 'Currency is required when payments are enabled',
        code: 'CURRENCY_REQUIRED',
      });
      expect(result.errors).toContainEqual({
        field: 'paymentSettings.depositPercentage',
        message: 'Deposit percentage must be between 0 and 100',
        code: 'INVALID_DEPOSIT_PERCENTAGE',
      });
    });

    it('should validate brand colors', async () => {
      const invalidConfig = {
        ...mockBotSettings,
        customization: {
          ...mockBotSettings.customization,
          brandColors: {
            primary: 'invalid-color', // Invalid: not hex format
            secondary: '#12345', // Invalid: wrong length
            accent: '#GGGGGG', // Invalid: invalid hex characters
            background: '#ffffff',
            text: '#000000',
          },
        },
      };

      const result = await botConfigService.validateConfiguration(invalidConfig);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'customization.brandColors.primary' && e.code === 'INVALID_COLOR_FORMAT')).toBe(true);
      expect(result.errors.some(e => e.field === 'customization.brandColors.secondary' && e.code === 'INVALID_COLOR_FORMAT')).toBe(true);
      expect(result.errors.some(e => e.field === 'customization.brandColors.accent' && e.code === 'INVALID_COLOR_FORMAT')).toBe(true);
    });

    it('should generate warnings for potential issues', async () => {
      const configWithWarnings = {
        ...mockBotSettings,
        conversationFlow: {
          ...mockBotSettings.conversationFlow,
          maxRetries: 10, // Warning: high retry count
          sessionTimeout: 2, // Warning: very short timeout
        },
      };

      const result = await botConfigService.validateConfiguration(configWithWarnings);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContainEqual({
        field: 'conversationFlow.maxRetries',
        message: 'High retry count may lead to poor user experience',
        code: 'HIGH_RETRY_COUNT',
      });
      expect(result.warnings).toContainEqual({
        field: 'conversationFlow.sessionTimeout',
        message: 'Very short session timeout may interrupt user conversations',
        code: 'SHORT_SESSION_TIMEOUT',
      });
    });
  });

  describe('Configuration Rollback', () => {
    it('should rollback configuration to previous version', async () => {
      const rollbackInfo: ConfigurationRollbackInfo = {
        previousVersion: 1,
        rollbackReason: 'Configuration caused issues',
        rollbackBy: 'user-1',
        rollbackAt: new Date(),
      };

      vi.mocked(mockTenantSettingsService.rollbackToVersion).mockResolvedValue({
        success: true,
        data: {
          id: 'settings-1',
          tenantId: 'tenant-123',
          version: 3,
          botSettings: mockBotSettings,
          billingSettings: {},
          createdBy: 'user-1',
          createdAt: new Date(),
          isActive: true,
        },
      });

      const result = await botConfigService.rollbackConfiguration(
        'tenant-123',
        1,
        rollbackInfo
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockBotSettings);
      expect(result.metadata?.rolledBack).toBe(true);
      expect(result.metadata?.targetVersion).toBe(1);
      expect(mockTenantSettingsService.rollbackToVersion).toHaveBeenCalledWith(
        'tenant-123',
        1,
        'user-1',
        'Configuration caused issues'
      );
    });

    it('should handle rollback failures', async () => {
      const rollbackInfo: ConfigurationRollbackInfo = {
        previousVersion: 999,
        rollbackReason: 'Test rollback',
        rollbackBy: 'user-1',
        rollbackAt: new Date(),
      };

      vi.mocked(mockTenantSettingsService.rollbackToVersion).mockResolvedValue({
        success: false,
        error: {
          code: 'VERSION_NOT_FOUND',
          message: 'Version not found',
        },
      });

      const result = await botConfigService.rollbackConfiguration(
        'tenant-123',
        999,
        rollbackInfo
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('VERSION_NOT_FOUND');
    });
  });

  describe('Configuration History', () => {
    it('should get configuration history', async () => {
      const mockHistory = [
        {
          version: 2,
          settings: { botSettings: mockBotSettings },
          createdBy: 'user-1',
          createdAt: new Date(),
          changeSummary: 'Updated greeting message',
        },
        {
          version: 1,
          settings: { botSettings: mockBotSettings },
          createdBy: 'user-1',
          createdAt: new Date(),
          changeSummary: 'Initial configuration',
        },
      ];

      vi.mocked(mockTenantSettingsService.getSettingsHistory).mockResolvedValue({
        success: true,
        data: mockHistory,
      });

      const result = await botConfigService.getConfigurationHistory('tenant-123', 5);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data![0].version).toBe(2);
      expect(result.data![0].settings).toEqual(mockBotSettings);
      expect(mockTenantSettingsService.getSettingsHistory).toHaveBeenCalledWith('tenant-123', 5);
    });
  });

  describe('Real-time Updates', () => {
    it('should support configuration change subscriptions', async () => {
      const changeEvents: any[] = [];
      const unsubscribe = botConfigService.subscribeToConfigurationChanges(
        'tenant-123',
        (event) => changeEvents.push(event)
      );

      // Mock settings update
      vi.mocked(mockTenantSettingsService.getSettings).mockResolvedValue({
        success: true,
        data: {
          id: 'settings-1',
          tenantId: 'tenant-123',
          version: 1,
          botSettings: mockBotSettings,
          billingSettings: {},
          createdBy: 'user-1',
          createdAt: new Date(),
          isActive: true,
        },
      });

      vi.mocked(mockTenantSettingsService.updateSettings).mockResolvedValue({
        success: true,
        data: {
          id: 'settings-1',
          tenantId: 'tenant-123',
          version: 2,
          botSettings: {
            ...mockBotSettings,
            greetingMessage: 'Updated message',
          },
          billingSettings: {},
          createdBy: 'user-1',
          createdAt: new Date(),
          isActive: true,
        },
      });

      // Update configuration with nested object change
      const updatedBusinessHours = {
        ...mockBotSettings.businessHours,
        enabled: false,
      };

      vi.mocked(mockTenantSettingsService.updateSettings).mockResolvedValueOnce({
        success: true,
        data: {
          id: 'settings-1',
          tenantId: 'tenant-123',
          version: 2,
          botSettings: {
            ...mockBotSettings,
            businessHours: updatedBusinessHours,
          },
          billingSettings: {},
          createdBy: 'user-1',
          createdAt: new Date(),
          isActive: true,
        },
      });

      await botConfigService.updateBotConfiguration(
        'tenant-123',
        { businessHours: { enabled: false } },
        'user-1'
      );

      // Should have received change events for business hours change
      expect(changeEvents.length).toBeGreaterThan(0);
      expect(changeEvents[0].configType).toBe('business_hours');

      // Unsubscribe should work
      unsubscribe();
      expect(typeof unsubscribe).toBe('function');
    });

    it('should refresh configuration from database', async () => {
      // First, populate cache
      vi.mocked(mockTenantSettingsService.getSettings).mockResolvedValue({
        success: true,
        data: {
          id: 'settings-1',
          tenantId: 'tenant-123',
          version: 1,
          botSettings: mockBotSettings,
          billingSettings: {},
          createdBy: 'user-1',
          createdAt: new Date(),
          isActive: true,
        },
      });

      await botConfigService.getBotConfiguration('tenant-123');

      // Now refresh should clear cache and fetch again
      const result = await botConfigService.refreshConfiguration('tenant-123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockBotSettings);
      expect(mockTenantSettingsService.getSettings).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      vi.mocked(mockTenantSettingsService.getSettings).mockRejectedValue(
        new Error('Database connection failed')
      );

      const result = await botConfigService.getBotConfiguration('tenant-123');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('CONFIG_RETRIEVAL_FAILED');
    });

    it('should handle validation errors gracefully', async () => {
      // Mock a configuration that will cause validation to throw
      const invalidConfig = null as any;

      const result = await botConfigService.validateConfiguration(invalidConfig);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'general',
        message: 'Configuration validation failed due to internal error',
        code: 'VALIDATION_ERROR',
      });
    });
  });
});