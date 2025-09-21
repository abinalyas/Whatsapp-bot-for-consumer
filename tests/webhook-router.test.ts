/**
 * Webhook Router Service Unit Tests
 * Tests tenant identification and webhook routing functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WebhookRouterService, WebhookPayload, WebhookVerificationRequest } from '../server/services/webhook-router.service';
import type { Tenant } from '@shared/schema';

// Mock database connection
const mockConnectionString = 'postgresql://test:test@localhost:5432/test';

// Mock tenant data
const mockTenant: Tenant = {
  id: 'tenant-123',
  domain: 'test-business.com',
  name: 'Test Business',
  email: 'admin@test-business.com',
  status: 'active',
  subscriptionPlan: 'pro',
  subscriptionStatus: 'active',
  metadata: {},
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Mock services
const mockTenantService = {
  getTenant: vi.fn(),
  listTenants: vi.fn(),
  close: vi.fn(),
};

const mockTenantSettingsService = {
  getSettings: vi.fn(),
  updateSettings: vi.fn(),
  close: vi.fn(),
};

vi.mock('../server/services/tenant.service', () => ({
  TenantService: vi.fn(() => mockTenantService),
}));

vi.mock('../server/services/tenant-settings.service', () => ({
  TenantSettingsService: vi.fn(() => mockTenantSettingsService),
}));

describe('WebhookRouterService', () => {
  let webhookRouter: WebhookRouterService;
  let mockWebhookPayload: WebhookPayload;

  beforeEach(() => {
    webhookRouter = new WebhookRouterService(mockConnectionString);
    
    mockWebhookPayload = {
      object: 'whatsapp_business_account',
      entry: [{
        id: 'entry-123',
        changes: [{
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '+1234567890',
              phone_number_id: 'phone-123',
            },
            messages: [{
              from: '+1111111111',
              id: 'msg-123',
              timestamp: '1234567890',
              text: {
                body: 'Hello',
              },
              type: 'text',
            }],
          },
          field: 'messages',
        }],
      }],
    };

    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await webhookRouter.close();
  });

  describe('Webhook Routing', () => {
    it('should successfully route webhook to correct tenant', async () => {
      // Mock tenant lookup
      vi.mocked(mockTenantService.listTenants).mockResolvedValue({
        success: true,
        data: {
          data: [mockTenant],
          pagination: { page: 1, limit: 1000, total: 1, totalPages: 1, hasNext: false, hasPrev: false },
        },
      });

      // Mock phone number mapping
      vi.mocked(mockTenantSettingsService.getSettings).mockResolvedValue({
        success: true,
        data: {
          id: 'setting-123',
          tenantId: 'tenant-123',
          category: 'whatsapp_phone_mapping',
          key: 'whatsapp_phone_mapping',
          value: {
            phoneNumberId: 'phone-123',
            registeredAt: new Date().toISOString(),
            status: 'active',
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      const result = await webhookRouter.routeWebhook(mockWebhookPayload);

      expect(result.success).toBe(true);
      expect(result.tenant).toEqual(mockTenant);
      expect(result.phoneNumberId).toBe('phone-123');
    });

    it('should fail with invalid webhook payload', async () => {
      const invalidPayload = {
        object: 'invalid',
        entry: [],
      } as any;

      const result = await webhookRouter.routeWebhook(invalidPayload);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_WEBHOOK_PAYLOAD');
    });

    it('should fail when phone number ID not found in payload', async () => {
      const payloadWithoutPhoneId = {
        ...mockWebhookPayload,
        entry: [{
          ...mockWebhookPayload.entry[0],
          changes: [{
            ...mockWebhookPayload.entry[0].changes[0],
            value: {
              ...mockWebhookPayload.entry[0].changes[0].value,
              metadata: {
                display_phone_number: '+1234567890',
                // phone_number_id missing
              },
            },
          }],
        }],
      };

      const result = await webhookRouter.routeWebhook(payloadWithoutPhoneId);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('PHONE_NUMBER_ID_NOT_FOUND');
    });

    it('should fail when no tenant found for phone number ID', async () => {
      // Mock empty tenant list
      vi.mocked(mockTenantService.listTenants).mockResolvedValue({
        success: true,
        data: {
          data: [],
          pagination: { page: 1, limit: 1000, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
        },
      });

      const result = await webhookRouter.routeWebhook(mockWebhookPayload);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('TENANT_NOT_FOUND');
    });

    it('should use cache for repeated phone number lookups', async () => {
      // Mock tenant lookup
      vi.mocked(mockTenantService.listTenants).mockResolvedValue({
        success: true,
        data: {
          data: [mockTenant],
          pagination: { page: 1, limit: 1000, total: 1, totalPages: 1, hasNext: false, hasPrev: false },
        },
      });

      // Mock phone number mapping
      vi.mocked(mockTenantSettingsService.getSettings).mockResolvedValue({
        success: true,
        data: {
          id: 'setting-123',
          tenantId: 'tenant-123',
          category: 'whatsapp_phone_mapping',
          key: 'whatsapp_phone_mapping',
          value: {
            phoneNumberId: 'phone-123',
            registeredAt: new Date().toISOString(),
            status: 'active',
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // First call
      const result1 = await webhookRouter.routeWebhook(mockWebhookPayload);
      expect(result1.success).toBe(true);

      // Second call should use cache
      const result2 = await webhookRouter.routeWebhook(mockWebhookPayload);
      expect(result2.success).toBe(true);

      // Should only call listTenants once due to caching
      expect(mockTenantService.listTenants).toHaveBeenCalledTimes(1);
    });
  });

  describe('Webhook Verification', () => {
    it('should successfully verify webhook with correct token', async () => {
      const verificationRequest: WebhookVerificationRequest = {
        'hub.mode': 'subscribe',
        'hub.verify_token': 'correct-token',
        'hub.challenge': 'challenge-123',
      };

      // Mock tenant lookup
      vi.mocked(mockTenantService.listTenants).mockResolvedValue({
        success: true,
        data: {
          data: [mockTenant],
          pagination: { page: 1, limit: 1000, total: 1, totalPages: 1, hasNext: false, hasPrev: false },
        },
      });

      // Mock phone number mapping
      vi.mocked(mockTenantSettingsService.getSettings)
        .mockResolvedValueOnce({
          success: true,
          data: {
            id: 'setting-123',
            tenantId: 'tenant-123',
            category: 'whatsapp_phone_mapping',
            key: 'whatsapp_phone_mapping',
            value: {
              phoneNumberId: 'phone-123',
              registeredAt: new Date().toISOString(),
              status: 'active',
            },
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        })
        .mockResolvedValueOnce({
          success: true,
          data: {
            id: 'setting-456',
            tenantId: 'tenant-123',
            category: 'whatsapp',
            key: 'whatsapp',
            value: {
              webhookVerifyToken: 'correct-token',
            },
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

      const result = await webhookRouter.verifyWebhook('phone-123', verificationRequest);

      expect(result.success).toBe(true);
      expect(result.challenge).toBe('challenge-123');
    });

    it('should fail verification with incorrect token', async () => {
      const verificationRequest: WebhookVerificationRequest = {
        'hub.mode': 'subscribe',
        'hub.verify_token': 'wrong-token',
        'hub.challenge': 'challenge-123',
      };

      // Mock tenant lookup
      vi.mocked(mockTenantService.listTenants).mockResolvedValue({
        success: true,
        data: {
          data: [mockTenant],
          pagination: { page: 1, limit: 1000, total: 1, totalPages: 1, hasNext: false, hasPrev: false },
        },
      });

      // Mock phone number mapping
      vi.mocked(mockTenantSettingsService.getSettings)
        .mockResolvedValueOnce({
          success: true,
          data: {
            id: 'setting-123',
            tenantId: 'tenant-123',
            category: 'whatsapp_phone_mapping',
            key: 'whatsapp_phone_mapping',
            value: {
              phoneNumberId: 'phone-123',
              registeredAt: new Date().toISOString(),
              status: 'active',
            },
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        })
        .mockResolvedValueOnce({
          success: true,
          data: {
            id: 'setting-456',
            tenantId: 'tenant-123',
            category: 'whatsapp',
            key: 'whatsapp',
            value: {
              webhookVerifyToken: 'correct-token',
            },
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

      const result = await webhookRouter.verifyWebhook('phone-123', verificationRequest);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('WEBHOOK_VERIFICATION_FAILED');
    });

    it('should fail verification when tenant not found', async () => {
      const verificationRequest: WebhookVerificationRequest = {
        'hub.mode': 'subscribe',
        'hub.verify_token': 'any-token',
        'hub.challenge': 'challenge-123',
      };

      // Mock empty tenant list
      vi.mocked(mockTenantService.listTenants).mockResolvedValue({
        success: true,
        data: {
          data: [],
          pagination: { page: 1, limit: 1000, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
        },
      });

      const result = await webhookRouter.verifyWebhook('nonexistent-phone', verificationRequest);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('TENANT_NOT_FOUND');
    });

    it('should fail verification when WhatsApp settings not found', async () => {
      const verificationRequest: WebhookVerificationRequest = {
        'hub.mode': 'subscribe',
        'hub.verify_token': 'any-token',
        'hub.challenge': 'challenge-123',
      };

      // Mock tenant lookup
      vi.mocked(mockTenantService.listTenants).mockResolvedValue({
        success: true,
        data: {
          data: [mockTenant],
          pagination: { page: 1, limit: 1000, total: 1, totalPages: 1, hasNext: false, hasPrev: false },
        },
      });

      // Mock phone number mapping but no WhatsApp settings
      vi.mocked(mockTenantSettingsService.getSettings)
        .mockResolvedValueOnce({
          success: true,
          data: {
            id: 'setting-123',
            tenantId: 'tenant-123',
            category: 'whatsapp_phone_mapping',
            key: 'whatsapp_phone_mapping',
            value: {
              phoneNumberId: 'phone-123',
              registeredAt: new Date().toISOString(),
              status: 'active',
            },
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        })
        .mockResolvedValueOnce({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Settings not found' },
        });

      const result = await webhookRouter.verifyWebhook('phone-123', verificationRequest);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('WHATSAPP_SETTINGS_NOT_FOUND');
    });
  });

  describe('Phone Number Registration', () => {
    it('should successfully register phone number ID for tenant', async () => {
      // Mock tenant exists
      vi.mocked(mockTenantService.getTenant).mockResolvedValue({
        success: true,
        data: mockTenant,
      });

      // Mock settings update
      vi.mocked(mockTenantSettingsService.updateSettings).mockResolvedValue({
        success: true,
        data: {
          id: 'setting-123',
          tenantId: 'tenant-123',
          category: 'whatsapp_phone_mapping',
          key: 'whatsapp_phone_mapping',
          value: {
            phoneNumberId: 'phone-123',
            registeredAt: expect.any(String),
            status: 'active',
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      const result = await webhookRouter.registerPhoneNumberId('tenant-123', 'phone-123');

      expect(result.success).toBe(true);
      expect(mockTenantSettingsService.updateSettings).toHaveBeenCalledWith(
        'tenant-123',
        'whatsapp_phone_mapping',
        {
          phoneNumberId: 'phone-123',
          registeredAt: expect.any(String),
          status: 'active',
        }
      );
    });

    it('should fail registration when tenant not found', async () => {
      // Mock tenant not found
      vi.mocked(mockTenantService.getTenant).mockResolvedValue({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Tenant not found' },
      });

      const result = await webhookRouter.registerPhoneNumberId('nonexistent-tenant', 'phone-123');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('TENANT_NOT_FOUND');
    });

    it('should fail registration when settings update fails', async () => {
      // Mock tenant exists
      vi.mocked(mockTenantService.getTenant).mockResolvedValue({
        success: true,
        data: mockTenant,
      });

      // Mock settings update failure
      vi.mocked(mockTenantSettingsService.updateSettings).mockResolvedValue({
        success: false,
        error: { code: 'UPDATE_FAILED', message: 'Failed to update settings' },
      });

      const result = await webhookRouter.registerPhoneNumberId('tenant-123', 'phone-123');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('PHONE_NUMBER_REGISTRATION_FAILED');
    });
  });

  describe('Routing Statistics', () => {
    it('should return routing statistics for tenant', async () => {
      const result = await webhookRouter.getRoutingStats('tenant-123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        totalWebhooks: 0,
        successfulRoutes: 0,
        failedRoutes: 0,
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      // Mock service error
      vi.mocked(mockTenantService.listTenants).mockRejectedValue(new Error('Database error'));

      const result = await webhookRouter.routeWebhook(mockWebhookPayload);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('WEBHOOK_ROUTING_ERROR');
    });

    it('should handle verification errors gracefully', async () => {
      const verificationRequest: WebhookVerificationRequest = {
        'hub.mode': 'subscribe',
        'hub.verify_token': 'any-token',
        'hub.challenge': 'challenge-123',
      };

      // Mock service error
      vi.mocked(mockTenantService.listTenants).mockRejectedValue(new Error('Database error'));

      const result = await webhookRouter.verifyWebhook('phone-123', verificationRequest);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('WEBHOOK_VERIFICATION_ERROR');
    });

    it('should handle registration errors gracefully', async () => {
      // Mock service error
      vi.mocked(mockTenantService.getTenant).mockRejectedValue(new Error('Database error'));

      const result = await webhookRouter.registerPhoneNumberId('tenant-123', 'phone-123');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('PHONE_NUMBER_REGISTRATION_ERROR');
    });
  });

  describe('Payload Validation', () => {
    it('should validate webhook payload structure correctly', async () => {
      const validPayloads = [
        mockWebhookPayload,
        {
          object: 'whatsapp_business_account',
          entry: [{
            id: 'entry-456',
            changes: [{
              value: {
                messaging_product: 'whatsapp',
                metadata: {
                  display_phone_number: '+9876543210',
                  phone_number_id: 'phone-456',
                },
                statuses: [{
                  id: 'status-123',
                  status: 'delivered',
                  timestamp: '1234567890',
                  recipient_id: '+1111111111',
                }],
              },
              field: 'messages',
            }],
          }],
        },
      ];

      for (const payload of validPayloads) {
        // Mock tenant lookup for valid payloads
        vi.mocked(mockTenantService.listTenants).mockResolvedValue({
          success: true,
          data: {
            data: [mockTenant],
            pagination: { page: 1, limit: 1000, total: 1, totalPages: 1, hasNext: false, hasPrev: false },
          },
        });

        vi.mocked(mockTenantSettingsService.getSettings).mockResolvedValue({
          success: true,
          data: {
            id: 'setting-123',
            tenantId: 'tenant-123',
            category: 'whatsapp_phone_mapping',
            key: 'whatsapp_phone_mapping',
            value: {
              phoneNumberId: payload.entry[0].changes[0].value.metadata.phone_number_id,
              registeredAt: new Date().toISOString(),
              status: 'active',
            },
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

        const result = await webhookRouter.routeWebhook(payload);
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid webhook payload structures', async () => {
      const invalidPayloads = [
        null,
        undefined,
        {},
        { object: 'invalid' },
        { object: 'whatsapp_business_account' },
        { object: 'whatsapp_business_account', entry: [] },
        { object: 'whatsapp_business_account', entry: [{}] },
        { object: 'whatsapp_business_account', entry: [{ changes: [] }] },
      ];

      for (const payload of invalidPayloads) {
        const result = await webhookRouter.routeWebhook(payload as any);
        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('INVALID_WEBHOOK_PAYLOAD');
      }
    });
  });
});