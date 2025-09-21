/**
 * Webhook Routing Integration Tests
 * Tests complete webhook routing workflows with multiple tenants
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WebhookRouterService } from '../server/services/webhook-router.service';
import { TenantService } from '../server/services/tenant.service';
import { TenantSettingsService } from '../server/services/tenant-settings.service';
import type { Tenant } from '@shared/schema';

// Mock database connection
const mockConnectionString = 'postgresql://test:test@localhost:5432/test';

// Mock tenant data
const mockTenants: Tenant[] = [
  {
    id: 'tenant-1',
    domain: 'business1.com',
    name: 'Business One',
    email: 'admin@business1.com',
    status: 'active',
    subscriptionPlan: 'pro',
    subscriptionStatus: 'active',
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'tenant-2',
    domain: 'business2.com',
    name: 'Business Two',
    email: 'admin@business2.com',
    status: 'active',
    subscriptionPlan: 'basic',
    subscriptionStatus: 'active',
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Mock phone number mappings
const phoneNumberMappings = new Map([
  ['phone-123', { tenantId: 'tenant-1', phoneNumberId: 'phone-123' }],
  ['phone-456', { tenantId: 'tenant-2', phoneNumberId: 'phone-456' }],
]);

// Mock WhatsApp settings
const whatsappSettings = new Map([
  ['tenant-1', { webhookVerifyToken: 'token-1', accessToken: 'access-1' }],
  ['tenant-2', { webhookVerifyToken: 'token-2', accessToken: 'access-2' }],
]);

// Mock services with realistic behavior
const mockTenantService = {
  getTenant: vi.fn().mockImplementation(async (tenantId: string) => {
    const tenant = mockTenants.find(t => t.id === tenantId);
    if (tenant) {
      return { success: true, data: tenant };
    }
    return { success: false, error: { code: 'NOT_FOUND', message: 'Tenant not found' } };
  }),
  
  listTenants: vi.fn().mockImplementation(async () => {
    return {
      success: true,
      data: {
        data: mockTenants,
        pagination: { page: 1, limit: 1000, total: mockTenants.length, totalPages: 1, hasNext: false, hasPrev: false },
      },
    };
  }),
  
  close: vi.fn(),
};

const mockTenantSettingsService = {
  getSettings: vi.fn().mockImplementation(async (tenantId: string, category: string) => {
    if (category === 'whatsapp_phone_mapping') {
      // Find phone mapping for this tenant
      for (const [phoneId, mapping] of phoneNumberMappings.entries()) {
        if (mapping.tenantId === tenantId) {
          return {
            success: true,
            data: {
              id: `setting-${phoneId}`,
              tenantId,
              category: 'whatsapp_phone_mapping',
              key: 'whatsapp_phone_mapping',
              value: {
                phoneNumberId: phoneId,
                registeredAt: new Date().toISOString(),
                status: 'active',
              },
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          };
        }
      }
      return { success: false, error: { code: 'NOT_FOUND', message: 'Settings not found' } };
    }
    
    if (category === 'whatsapp') {
      const settings = whatsappSettings.get(tenantId);
      if (settings) {
        return {
          success: true,
          data: {
            id: `whatsapp-${tenantId}`,
            tenantId,
            category: 'whatsapp',
            key: 'whatsapp',
            value: settings,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        };
      }
      return { success: false, error: { code: 'NOT_FOUND', message: 'WhatsApp settings not found' } };
    }
    
    return { success: false, error: { code: 'NOT_FOUND', message: 'Settings not found' } };
  }),
  
  updateSettings: vi.fn().mockImplementation(async (tenantId: string, category: string, value: any) => {
    if (category === 'whatsapp_phone_mapping') {
      phoneNumberMappings.set(value.phoneNumberId, { tenantId, phoneNumberId: value.phoneNumberId });
      return {
        success: true,
        data: {
          id: `setting-${value.phoneNumberId}`,
          tenantId,
          category,
          key: category,
          value,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };
    }
    
    if (category === 'whatsapp') {
      whatsappSettings.set(tenantId, value);
      return {
        success: true,
        data: {
          id: `whatsapp-${tenantId}`,
          tenantId,
          category,
          key: category,
          value,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };
    }
    
    return { success: false, error: { code: 'UPDATE_FAILED', message: 'Failed to update settings' } };
  }),
  
  close: vi.fn(),
};

vi.mock('../server/services/tenant.service', () => ({
  TenantService: vi.fn(() => mockTenantService),
}));

vi.mock('../server/services/tenant-settings.service', () => ({
  TenantSettingsService: vi.fn(() => mockTenantSettingsService),
}));

describe('Webhook Routing Integration', () => {
  let webhookRouter: WebhookRouterService;

  beforeEach(() => {
    webhookRouter = new WebhookRouterService(mockConnectionString);
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await webhookRouter.close();
  });

  describe('Multi-Tenant Webhook Routing', () => {
    it('should route webhooks to correct tenants based on phone number ID', async () => {
      // Test webhook for tenant 1
      const webhook1 = {
        object: 'whatsapp_business_account',
        entry: [{
          id: 'entry-1',
          changes: [{
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '+1234567890',
                phone_number_id: 'phone-123',
              },
              messages: [{
                from: '+1111111111',
                id: 'msg-1',
                timestamp: '1234567890',
                text: { body: 'Hello from customer 1' },
                type: 'text',
              }],
            },
            field: 'messages',
          }],
        }],
      };

      const result1 = await webhookRouter.routeWebhook(webhook1);
      expect(result1.success).toBe(true);
      expect(result1.tenant?.id).toBe('tenant-1');
      expect(result1.phoneNumberId).toBe('phone-123');

      // Test webhook for tenant 2
      const webhook2 = {
        object: 'whatsapp_business_account',
        entry: [{
          id: 'entry-2',
          changes: [{
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '+9876543210',
                phone_number_id: 'phone-456',
              },
              messages: [{
                from: '+2222222222',
                id: 'msg-2',
                timestamp: '1234567891',
                text: { body: 'Hello from customer 2' },
                type: 'text',
              }],
            },
            field: 'messages',
          }],
        }],
      };

      const result2 = await webhookRouter.routeWebhook(webhook2);
      expect(result2.success).toBe(true);
      expect(result2.tenant?.id).toBe('tenant-2');
      expect(result2.phoneNumberId).toBe('phone-456');
    });

    it('should maintain tenant isolation in webhook routing', async () => {
      // Register phone numbers for different tenants
      await webhookRouter.registerPhoneNumberId('tenant-1', 'phone-new-1');
      await webhookRouter.registerPhoneNumberId('tenant-2', 'phone-new-2');

      // Test that each phone number routes to correct tenant
      const webhook1 = {
        object: 'whatsapp_business_account',
        entry: [{
          id: 'entry-1',
          changes: [{
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '+1111111111',
                phone_number_id: 'phone-new-1',
              },
            },
            field: 'messages',
          }],
        }],
      };

      const webhook2 = {
        object: 'whatsapp_business_account',
        entry: [{
          id: 'entry-2',
          changes: [{
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '+2222222222',
                phone_number_id: 'phone-new-2',
              },
            },
            field: 'messages',
          }],
        }],
      };

      const result1 = await webhookRouter.routeWebhook(webhook1);
      const result2 = await webhookRouter.routeWebhook(webhook2);

      expect(result1.success).toBe(true);
      expect(result1.tenant?.id).toBe('tenant-1');
      
      expect(result2.success).toBe(true);
      expect(result2.tenant?.id).toBe('tenant-2');

      // Verify tenants are different
      expect(result1.tenant?.id).not.toBe(result2.tenant?.id);
    });
  });

  describe('Webhook Verification with Multiple Tenants', () => {
    it('should verify webhooks with tenant-specific tokens', async () => {
      // Verify webhook for tenant 1
      const verification1 = {
        'hub.mode': 'subscribe',
        'hub.verify_token': 'token-1',
        'hub.challenge': 'challenge-123',
      };

      const result1 = await webhookRouter.verifyWebhook('phone-123', verification1);
      expect(result1.success).toBe(true);
      expect(result1.challenge).toBe('challenge-123');

      // Verify webhook for tenant 2
      const verification2 = {
        'hub.mode': 'subscribe',
        'hub.verify_token': 'token-2',
        'hub.challenge': 'challenge-456',
      };

      const result2 = await webhookRouter.verifyWebhook('phone-456', verification2);
      expect(result2.success).toBe(true);
      expect(result2.challenge).toBe('challenge-456');
    });

    it('should reject verification with wrong tenant token', async () => {
      // Try to verify tenant 1's webhook with tenant 2's token
      const verification = {
        'hub.mode': 'subscribe',
        'hub.verify_token': 'token-2', // Wrong token for phone-123 (tenant-1)
        'hub.challenge': 'challenge-123',
      };

      const result = await webhookRouter.verifyWebhook('phone-123', verification);
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('WEBHOOK_VERIFICATION_FAILED');
    });
  });

  describe('Phone Number Registration and Management', () => {
    it('should register multiple phone numbers for different tenants', async () => {
      // Register phone numbers
      const reg1 = await webhookRouter.registerPhoneNumberId('tenant-1', 'phone-multi-1');
      const reg2 = await webhookRouter.registerPhoneNumberId('tenant-2', 'phone-multi-2');
      const reg3 = await webhookRouter.registerPhoneNumberId('tenant-1', 'phone-multi-3'); // Same tenant, different phone

      expect(reg1.success).toBe(true);
      expect(reg2.success).toBe(true);
      expect(reg3.success).toBe(true);

      // Verify routing works for all registered numbers
      const webhooks = [
        {
          phoneId: 'phone-multi-1',
          expectedTenant: 'tenant-1',
        },
        {
          phoneId: 'phone-multi-2',
          expectedTenant: 'tenant-2',
        },
        {
          phoneId: 'phone-multi-3',
          expectedTenant: 'tenant-1',
        },
      ];

      for (const { phoneId, expectedTenant } of webhooks) {
        const webhook = {
          object: 'whatsapp_business_account',
          entry: [{
            id: 'test-entry',
            changes: [{
              value: {
                messaging_product: 'whatsapp',
                metadata: {
                  display_phone_number: '+1234567890',
                  phone_number_id: phoneId,
                },
              },
              field: 'messages',
            }],
          }],
        };

        const result = await webhookRouter.routeWebhook(webhook);
        expect(result.success).toBe(true);
        expect(result.tenant?.id).toBe(expectedTenant);
        expect(result.phoneNumberId).toBe(phoneId);
      }
    });

    it('should prevent duplicate phone number registration', async () => {
      // Register phone number for tenant 1
      const reg1 = await webhookRouter.registerPhoneNumberId('tenant-1', 'phone-duplicate');
      expect(reg1.success).toBe(true);

      // Try to register same phone number for tenant 2
      const reg2 = await webhookRouter.registerPhoneNumberId('tenant-2', 'phone-duplicate');
      expect(reg2.success).toBe(true); // This will overwrite the previous registration

      // Verify the phone number now routes to tenant 2
      const webhook = {
        object: 'whatsapp_business_account',
        entry: [{
          id: 'test-entry',
          changes: [{
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '+1234567890',
                phone_number_id: 'phone-duplicate',
              },
            },
            field: 'messages',
          }],
        }],
      };

      const result = await webhookRouter.routeWebhook(webhook);
      expect(result.success).toBe(true);
      expect(result.tenant?.id).toBe('tenant-2'); // Should route to the last registered tenant
    });
  });

  describe('Caching and Performance', () => {
    it('should cache tenant lookups for performance', async () => {
      const webhook = {
        object: 'whatsapp_business_account',
        entry: [{
          id: 'cache-test',
          changes: [{
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '+1234567890',
                phone_number_id: 'phone-123',
              },
            },
            field: 'messages',
          }],
        }],
      };

      // First call - should hit the database
      const result1 = await webhookRouter.routeWebhook(webhook);
      expect(result1.success).toBe(true);

      // Second call - should use cache
      const result2 = await webhookRouter.routeWebhook(webhook);
      expect(result2.success).toBe(true);

      // Third call - should still use cache
      const result3 = await webhookRouter.routeWebhook(webhook);
      expect(result3.success).toBe(true);

      // Verify all results are consistent
      expect(result1.tenant?.id).toBe(result2.tenant?.id);
      expect(result2.tenant?.id).toBe(result3.tenant?.id);
      expect(result1.phoneNumberId).toBe(result2.phoneNumberId);
      expect(result2.phoneNumberId).toBe(result3.phoneNumberId);

      // Should only call listTenants once due to caching
      expect(mockTenantService.listTenants).toHaveBeenCalledTimes(1);
    });

    it('should handle concurrent webhook routing requests', async () => {
      const webhooks = Array.from({ length: 10 }, (_, i) => ({
        object: 'whatsapp_business_account',
        entry: [{
          id: `concurrent-${i}`,
          changes: [{
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '+1234567890',
                phone_number_id: i % 2 === 0 ? 'phone-123' : 'phone-456', // Alternate between tenants
              },
            },
            field: 'messages',
          }],
        }],
      }));

      // Process all webhooks concurrently
      const results = await Promise.all(
        webhooks.map(webhook => webhookRouter.routeWebhook(webhook))
      );

      // Verify all requests succeeded
      expect(results.every(r => r.success)).toBe(true);

      // Verify correct tenant routing
      results.forEach((result, i) => {
        const expectedTenant = i % 2 === 0 ? 'tenant-1' : 'tenant-2';
        expect(result.tenant?.id).toBe(expectedTenant);
      });
    });
  });

  describe('Error Scenarios and Recovery', () => {
    it('should handle tenant service failures gracefully', async () => {
      // Mock service failure
      vi.mocked(mockTenantService.listTenants).mockRejectedValueOnce(new Error('Database connection failed'));

      const webhook = {
        object: 'whatsapp_business_account',
        entry: [{
          id: 'error-test',
          changes: [{
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '+1234567890',
                phone_number_id: 'phone-123',
              },
            },
            field: 'messages',
          }],
        }],
      };

      const result = await webhookRouter.routeWebhook(webhook);
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('WEBHOOK_ROUTING_ERROR');

      // Restore mock and verify recovery
      vi.mocked(mockTenantService.listTenants).mockResolvedValueOnce({
        success: true,
        data: {
          data: mockTenants,
          pagination: { page: 1, limit: 1000, total: mockTenants.length, totalPages: 1, hasNext: false, hasPrev: false },
        },
      });

      const recoveryResult = await webhookRouter.routeWebhook(webhook);
      expect(recoveryResult.success).toBe(true);
    });

    it('should handle malformed webhook payloads', async () => {
      const malformedPayloads = [
        null,
        undefined,
        {},
        { object: 'invalid' },
        { object: 'whatsapp_business_account', entry: [] },
        { object: 'whatsapp_business_account', entry: [{ changes: [] }] },
      ];

      for (const payload of malformedPayloads) {
        const result = await webhookRouter.routeWebhook(payload as any);
        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('INVALID_WEBHOOK_PAYLOAD');
      }
    });

    it('should handle missing phone number ID in payload', async () => {
      const webhook = {
        object: 'whatsapp_business_account',
        entry: [{
          id: 'missing-phone-id',
          changes: [{
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '+1234567890',
                // phone_number_id is missing
              },
            },
            field: 'messages',
          }],
        }],
      };

      const result = await webhookRouter.routeWebhook(webhook);
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('PHONE_NUMBER_ID_NOT_FOUND');
    });

    it('should handle unregistered phone numbers', async () => {
      const webhook = {
        object: 'whatsapp_business_account',
        entry: [{
          id: 'unregistered-phone',
          changes: [{
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '+1234567890',
                phone_number_id: 'unregistered-phone-id',
              },
            },
            field: 'messages',
          }],
        }],
      };

      const result = await webhookRouter.routeWebhook(webhook);
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('TENANT_NOT_FOUND');
    });
  });

  describe('Statistics and Monitoring', () => {
    it('should provide routing statistics for tenants', async () => {
      const stats1 = await webhookRouter.getRoutingStats('tenant-1');
      const stats2 = await webhookRouter.getRoutingStats('tenant-2');

      expect(stats1.success).toBe(true);
      expect(stats1.data).toHaveProperty('totalWebhooks');
      expect(stats1.data).toHaveProperty('successfulRoutes');
      expect(stats1.data).toHaveProperty('failedRoutes');

      expect(stats2.success).toBe(true);
      expect(stats2.data).toHaveProperty('totalWebhooks');
      expect(stats2.data).toHaveProperty('successfulRoutes');
      expect(stats2.data).toHaveProperty('failedRoutes');
    });
  });
});