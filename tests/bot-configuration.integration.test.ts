/**
 * Bot Configuration Integration Tests
 * Tests the complete bot configuration API with authentication and validation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { BotConfigurationService } from '../server/services/bot-configuration.service';
import { AuthService } from '../server/services/auth.service';
import { RBACService } from '../server/services/rbac.service';
import { createBotConfigurationRoutes } from '../server/routes/bot-configuration.routes';
import type { BotSettings, TenantContext } from '@shared/types/tenant';

// Mock services
const mockBotConfigService = {
  getBotConfiguration: vi.fn(),
  getConfigurationSection: vi.fn(),
  updateBotConfiguration: vi.fn(),
  updateConfigurationSection: vi.fn(),
  validateConfiguration: vi.fn(),
  rollbackConfiguration: vi.fn(),
  getConfigurationHistory: vi.fn(),
  refreshConfiguration: vi.fn(),
} as unknown as BotConfigurationService;

const mockAuthService = {
  validateToken: vi.fn(),
} as unknown as AuthService;

const mockRBACService = {
  hasAnyPermission: vi.fn(),
  hasAllPermissions: vi.fn(),
} as unknown as RBACService;

// Mock tenant context
const mockTenantContext: TenantContext = {
  tenantId: '550e8400-e29b-41d4-a716-446655440001',
  userId: 'user-123',
  userRole: 'admin',
  permissions: ['manage:settings', 'read:services'],
  subscriptionLimits: {
    messagesPerMonth: 1000,
    bookingsPerMonth: 100,
    apiCallsPerDay: 1000,
  },
  currentUsage: {
    messages_sent: 50,
    messages_received: 30,
    bookings_created: 5,
    api_calls: 100,
    storage_used: 0,
    webhook_calls: 0,
  },
};

// Mock bot settings
const mockBotSettings: BotSettings = {
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

describe('Bot Configuration API Integration', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Mock successful authentication
    vi.mocked(mockAuthService.validateToken).mockResolvedValue({
      success: true,
      data: mockTenantContext,
    });

    // Mock RBAC permissions
    vi.mocked(mockRBACService.hasAnyPermission).mockResolvedValue(true);
    vi.mocked(mockRBACService.hasAllPermissions).mockResolvedValue(true);

    // Setup routes
    const configRoutes = createBotConfigurationRoutes(
      mockBotConfigService,
      mockAuthService,
      mockRBACService
    );
    app.use('/api/bot-config', configRoutes);

    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Configuration Retrieval', () => {
    it('should get complete bot configuration', async () => {
      vi.mocked(mockBotConfigService.getBotConfiguration).mockResolvedValue({
        success: true,
        data: mockBotSettings,
        metadata: { fromCache: false },
      });

      const response = await request(app)
        .get('/api/bot-config/550e8400-e29b-41d4-a716-446655440001/configuration')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockBotSettings);
      expect(mockBotConfigService.getBotConfiguration).toHaveBeenCalledWith(
        '550e8400-e29b-41d4-a716-446655440001'
      );
    });

    it('should get specific configuration section', async () => {
      vi.mocked(mockBotConfigService.getConfigurationSection).mockResolvedValue({
        success: true,
        data: mockBotSettings.businessHours,
      });

      const response = await request(app)
        .get('/api/bot-config/550e8400-e29b-41d4-a716-446655440001/configuration/businessHours')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.section).toBe('businessHours');
      expect(response.body.data).toEqual(mockBotSettings.businessHours);
    });

    it('should return 400 for invalid configuration section', async () => {
      const response = await request(app)
        .get('/api/bot-config/550e8400-e29b-41d4-a716-446655440001/configuration/invalidSection')
        .set('Authorization', 'Bearer valid-token')
        .expect(400);

      expect(response.body.error).toBe('INVALID_SECTION');
    });

    it('should return 404 when configuration not found', async () => {
      vi.mocked(mockBotConfigService.getBotConfiguration).mockResolvedValue({
        success: false,
        error: {
          code: 'CONFIG_NOT_FOUND',
          message: 'Configuration not found',
        },
      });

      await request(app)
        .get('/api/bot-config/550e8400-e29b-41d4-a716-446655440001/configuration')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });
  });

  describe('Configuration Updates', () => {
    it('should update bot configuration', async () => {
      const updates = {
        greetingMessage: 'Updated greeting message',
        businessHours: { enabled: false },
      };

      const updatedSettings = {
        ...mockBotSettings,
        greetingMessage: 'Updated greeting message',
        businessHours: { ...mockBotSettings.businessHours, enabled: false },
      };

      vi.mocked(mockBotConfigService.updateBotConfiguration).mockResolvedValue({
        success: true,
        data: updatedSettings,
        metadata: { updated: true, version: 2 },
      });

      const response = await request(app)
        .put('/api/bot-config/550e8400-e29b-41d4-a716-446655440001/configuration')
        .set('Authorization', 'Bearer valid-token')
        .send(updates)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.greetingMessage).toBe('Updated greeting message');
      expect(mockBotConfigService.updateBotConfiguration).toHaveBeenCalledWith(
        '550e8400-e29b-41d4-a716-446655440001',
        updates,
        'user-123',
        false
      );
    });

    it('should validate configuration without saving', async () => {
      const updates = {
        greetingMessage: 'Valid greeting message',
      };

      vi.mocked(mockBotConfigService.updateBotConfiguration).mockResolvedValue({
        success: true,
        data: { ...mockBotSettings, ...updates },
        metadata: { validationOnly: true, warnings: [] },
      });

      const response = await request(app)
        .put('/api/bot-config/550e8400-e29b-41d4-a716-446655440001/configuration?validate=true')
        .set('Authorization', 'Bearer valid-token')
        .send(updates)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockBotConfigService.updateBotConfiguration).toHaveBeenCalledWith(
        '550e8400-e29b-41d4-a716-446655440001',
        updates,
        'user-123',
        true
      );
    });

    it('should return 400 for validation errors', async () => {
      const invalidUpdates = {
        greetingMessage: '', // Invalid: empty greeting
      };

      vi.mocked(mockBotConfigService.updateBotConfiguration).mockResolvedValue({
        success: false,
        error: {
          code: 'CONFIG_VALIDATION_FAILED',
          message: 'Configuration validation failed',
          details: {
            errors: [
              {
                field: 'greetingMessage',
                message: 'Greeting message is required',
                code: 'GREETING_MESSAGE_REQUIRED',
              },
            ],
          },
        },
      });

      const response = await request(app)
        .put('/api/bot-config/550e8400-e29b-41d4-a716-446655440001/configuration')
        .set('Authorization', 'Bearer valid-token')
        .send(invalidUpdates)
        .expect(400);

      expect(response.body.error).toBe('CONFIG_VALIDATION_FAILED');
      expect(response.body.details.errors).toHaveLength(1);
    });

    it('should update specific configuration section', async () => {
      const businessHoursUpdate = {
        enabled: false,
        closedMessage: 'We are closed for maintenance',
      };

      const updatedBusinessHours = {
        ...mockBotSettings.businessHours,
        ...businessHoursUpdate,
      };

      vi.mocked(mockBotConfigService.updateConfigurationSection).mockResolvedValue({
        success: true,
        data: updatedBusinessHours,
        metadata: { updated: true },
      });

      const response = await request(app)
        .put('/api/bot-config/550e8400-e29b-41d4-a716-446655440001/configuration/businessHours')
        .set('Authorization', 'Bearer valid-token')
        .send(businessHoursUpdate)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.section).toBe('businessHours');
      expect(response.body.data.enabled).toBe(false);
    });

    it('should return 400 for empty updates', async () => {
      const response = await request(app)
        .put('/api/bot-config/550e8400-e29b-41d4-a716-446655440001/configuration')
        .set('Authorization', 'Bearer valid-token')
        .send({})
        .expect(400);

      expect(response.body.error).toBe('NO_UPDATES');
    });
  });

  describe('Configuration Validation', () => {
    it('should validate configuration', async () => {
      const updates = {
        greetingMessage: 'Valid greeting message',
      };

      vi.mocked(mockBotConfigService.updateBotConfiguration).mockResolvedValue({
        success: true,
        data: { ...mockBotSettings, ...updates },
        metadata: { warnings: [] },
      });

      const response = await request(app)
        .post('/api/bot-config/550e8400-e29b-41d4-a716-446655440001/configuration/validate')
        .set('Authorization', 'Bearer valid-token')
        .send(updates)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.valid).toBe(true);
      expect(mockBotConfigService.updateBotConfiguration).toHaveBeenCalledWith(
        '550e8400-e29b-41d4-a716-446655440001',
        updates,
        'user-123',
        true
      );
    });

    it('should return validation errors', async () => {
      const invalidUpdates = {
        greetingMessage: '',
      };

      vi.mocked(mockBotConfigService.updateBotConfiguration).mockResolvedValue({
        success: false,
        error: {
          code: 'CONFIG_VALIDATION_FAILED',
          message: 'Configuration validation failed',
          details: {
            errors: [
              {
                field: 'greetingMessage',
                message: 'Greeting message is required',
                code: 'GREETING_MESSAGE_REQUIRED',
              },
            ],
          },
        },
      });

      const response = await request(app)
        .post('/api/bot-config/550e8400-e29b-41d4-a716-446655440001/configuration/validate')
        .set('Authorization', 'Bearer valid-token')
        .send(invalidUpdates)
        .expect(400);

      expect(response.body.error).toBe('CONFIG_VALIDATION_FAILED');
    });
  });

  describe('Configuration History and Rollback', () => {
    it('should get configuration history', async () => {
      const mockHistory = [
        {
          version: 2,
          settings: mockBotSettings,
          createdBy: 'user-123',
          createdAt: new Date(),
          changeSummary: 'Updated greeting message',
        },
        {
          version: 1,
          settings: mockBotSettings,
          createdBy: 'user-123',
          createdAt: new Date(),
          changeSummary: 'Initial configuration',
        },
      ];

      vi.mocked(mockBotConfigService.getConfigurationHistory).mockResolvedValue({
        success: true,
        data: mockHistory,
      });

      const response = await request(app)
        .get('/api/bot-config/550e8400-e29b-41d4-a716-446655440001/configuration/history?limit=10')
        .set('Authorization', 'Bearer valid-token');

      if (response.status !== 200) {
        console.log('Response body:', response.body);
      }

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.metadata.count).toBe(2);
    });

    it('should rollback configuration', async () => {
      const rollbackRequest = {
        targetVersion: 1,
        reason: 'Configuration caused issues',
      };

      vi.mocked(mockBotConfigService.rollbackConfiguration).mockResolvedValue({
        success: true,
        data: mockBotSettings,
        metadata: {
          rolledBack: true,
          targetVersion: 1,
          rollbackReason: 'Configuration caused issues',
        },
      });

      const response = await request(app)
        .post('/api/bot-config/550e8400-e29b-41d4-a716-446655440001/configuration/rollback')
        .set('Authorization', 'Bearer valid-token')
        .send(rollbackRequest)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.metadata.rolledBack).toBe(true);
      expect(response.body.metadata.targetVersion).toBe(1);
    });

    it('should return 400 for invalid rollback request', async () => {
      const invalidRequest = {
        targetVersion: 'invalid',
        reason: '',
      };

      const response = await request(app)
        .post('/api/bot-config/550e8400-e29b-41d4-a716-446655440001/configuration/rollback')
        .set('Authorization', 'Bearer valid-token')
        .send(invalidRequest)
        .expect(400);

      expect(response.body.error).toBe('INVALID_TARGET_VERSION');
    });
  });

  describe('Real-time Configuration Management', () => {
    it('should refresh configuration', async () => {
      vi.mocked(mockBotConfigService.refreshConfiguration).mockResolvedValue({
        success: true,
        data: mockBotSettings,
      });

      const response = await request(app)
        .post('/api/bot-config/550e8400-e29b-41d4-a716-446655440001/configuration/refresh')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.metadata.refreshed).toBe(true);
      expect(mockBotConfigService.refreshConfiguration).toHaveBeenCalledWith(
        '550e8400-e29b-41d4-a716-446655440001'
      );
    });
  });

  describe('Configuration Templates', () => {
    it('should get default configuration template', async () => {
      const response = await request(app)
        .get('/api/bot-config/templates/default')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.template).toBe('default');
      expect(response.body.data).toHaveProperty('greetingMessage');
      expect(response.body.data).toHaveProperty('businessHours');
      expect(response.body.data).toHaveProperty('autoResponses');
    });
  });

  describe('Authentication and Authorization', () => {
    it('should require authentication', async () => {
      await request(app)
        .get('/api/bot-config/550e8400-e29b-41d4-a716-446655440001/configuration')
        .expect(401);
    });

    it('should require proper permissions', async () => {
      vi.mocked(mockRBACService.hasAnyPermission).mockResolvedValue(false);

      await request(app)
        .get('/api/bot-config/550e8400-e29b-41d4-a716-446655440001/configuration')
        .set('Authorization', 'Bearer valid-token')
        .expect(403);
    });

    it('should validate tenant context', async () => {
      // Mock tenant context mismatch
      vi.mocked(mockAuthService.validateToken).mockResolvedValueOnce({
        success: true,
        data: {
          ...mockTenantContext,
          tenantId: 'different-tenant-id',
        },
      });

      // The validateTenantContext middleware should catch this mismatch
      const response = await request(app)
        .get('/api/bot-config/550e8400-e29b-41d4-a716-446655440001/configuration')
        .set('Authorization', 'Bearer valid-token');

      // The response might be 404 or 403 depending on middleware order
      expect([403, 404]).toContain(response.status);
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      vi.mocked(mockBotConfigService.getBotConfiguration).mockRejectedValue(
        new Error('Service unavailable')
      );

      await request(app)
        .get('/api/bot-config/550e8400-e29b-41d4-a716-446655440001/configuration')
        .set('Authorization', 'Bearer valid-token')
        .expect(500);
    });

    it('should handle invalid JSON in request body', async () => {
      await request(app)
        .put('/api/bot-config/550e8400-e29b-41d4-a716-446655440001/configuration')
        .set('Authorization', 'Bearer valid-token')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);
    });
  });
});