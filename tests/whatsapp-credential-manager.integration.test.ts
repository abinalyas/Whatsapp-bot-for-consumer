/**
 * WhatsApp Credential Manager Integration Tests
 * Tests complete credential management workflows with realistic scenarios
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WhatsAppCredentialManagerService, WhatsAppCredentials } from '../server/services/whatsapp-credential-manager.service';

// Mock database connection
const mockConnectionString = 'postgresql://test:test@localhost:5432/test';

// Mock tenant configurations
const tenantCredentials = new Map([
  ['tenant-1', {
    phoneNumberId: 'phone-123',
    accessToken: 'valid-token-123',
    businessAccountId: 'business-123',
    webhookVerifyToken: 'verify-123',
  }],
  ['tenant-2', {
    phoneNumberId: 'phone-456',
    accessToken: 'expiring-token-456',
    businessAccountId: 'business-456',
    systemUserToken: 'system-token-456',
  }],
  ['tenant-3', {
    phoneNumberId: 'phone-789',
    accessToken: 'invalid-token-789',
  }],
]);

// Mock API responses based on credentials
const mockApiResponses = new Map([
  ['valid-token-123', {
    phoneEndpoint: {
      ok: true,
      data: {
        display_phone_number: '+1234567890',
        verified_name: 'Healthy Business',
        code_verification_status: 'VERIFIED',
        quality_rating: 'GREEN',
      },
    },
    businessEndpoint: {
      ok: true,
      data: {
        name: 'Healthy Business Inc',
        verification_status: 'verified',
        business_verification_status: 'verified',
      },
    },
    permissionsEndpoint: {
      ok: true,
      data: { data: [] },
    },
  }],
  ['expiring-token-456', {
    phoneEndpoint: {
      ok: true,
      data: {
        display_phone_number: '+9876543210',
        verified_name: 'Expiring Business',
        code_verification_status: 'VERIFIED',
      },
    },
    businessEndpoint: {
      ok: true,
      data: {
        name: 'Expiring Business Inc',
        verification_status: 'verified',
      },
    },
    tokenDebugEndpoint: {
      ok: true,
      data: {
        data: {
          expires_at: Math.floor((Date.now() + 3 * 24 * 60 * 60 * 1000) / 1000), // 3 days from now
        },
      },
    },
  }],
  ['invalid-token-789', {
    phoneEndpoint: {
      ok: false,
      status: 401,
      error: {
        error: {
          message: 'Invalid OAuth access token',
          code: 190,
        },
      },
    },
  }],
]);

// Mock services
const mockTenantSettingsService = {
  getSettings: vi.fn().mockImplementation(async (tenantId: string, category: string) => {
    if (category === 'whatsapp') {
      const credentials = tenantCredentials.get(tenantId);
      if (credentials) {
        return {
          success: true,
          data: {
            id: `setting-${tenantId}`,
            tenantId,
            category: 'whatsapp',
            key: 'whatsapp',
            value: credentials,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        };
      }
      return { success: false, error: { code: 'NOT_FOUND', message: 'Settings not found' } };
    }
    
    if (category === 'whatsapp_notifications') {
      return {
        success: true,
        data: {
          id: `notifications-${tenantId}`,
          tenantId,
          category: 'whatsapp_notifications',
          key: 'whatsapp_notifications',
          value: {
            email: `admin@${tenantId}.com`,
            notifyOnError: true,
            notifyOnWarning: false,
            notifyOnExpiry: true,
            expiryWarningDays: 7,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };
    }
    
    return { success: false, error: { code: 'NOT_FOUND', message: 'Settings not found' } };
  }),
  
  updateSettings: vi.fn().mockImplementation(async (tenantId: string, category: string, value: any) => {
    if (category === 'whatsapp') {
      tenantCredentials.set(tenantId, value);
    }
    
    return {
      success: true,
      data: {
        id: `setting-${tenantId}`,
        tenantId,
        category,
        key: category,
        value,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };
  }),
  
  deleteSettings: vi.fn().mockImplementation(async (tenantId: string, category: string) => {
    if (category === 'whatsapp') {
      tenantCredentials.delete(tenantId);
    }
    return { success: true };
  }),
  
  close: vi.fn(),
};

const mockTenantService = {
  listTenants: vi.fn().mockResolvedValue({
    success: true,
    data: {
      data: [
        { id: 'tenant-1', name: 'Tenant 1' },
        { id: 'tenant-2', name: 'Tenant 2' },
        { id: 'tenant-3', name: 'Tenant 3' },
      ],
      pagination: { page: 1, limit: 1000, total: 3, totalPages: 1, hasNext: false, hasPrev: false },
    },
  }),
  close: vi.fn(),
};

// Mock fetch with realistic WhatsApp API behavior
global.fetch = vi.fn().mockImplementation(async (url: string, options: any) => {
  const authHeader = options.headers?.Authorization;
  const token = authHeader?.replace('Bearer ', '');
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 50));
  
  const responses = mockApiResponses.get(token);
  if (!responses) {
    return {
      ok: false,
      status: 401,
      json: async () => ({
        error: {
          message: 'Invalid access token',
          code: 190,
        },
      }),
    };
  }
  
  // Determine which endpoint is being called
  if (url.includes('/message_templates')) {
    const response = responses.permissionsEndpoint || { ok: true, data: { data: [] } };
    return {
      ok: response.ok,
      status: response.ok ? 200 : 403,
      json: async () => response.data || response.error,
    };
  }
  
  if (url.includes('debug_token')) {
    const response = responses.tokenDebugEndpoint || { ok: false };
    return {
      ok: response.ok,
      json: async () => response.data,
    };
  }
  
  if (url.match(/\/\w+\?fields=/)) {
    // Phone number endpoint
    const response = responses.phoneEndpoint;
    return {
      ok: response.ok,
      status: response.ok ? 200 : (response.status || 400),
      json: async () => response.data || response.error,
    };
  }
  
  if (url.match(/\/business-\d+/)) {
    // Business account endpoint
    const response = responses.businessEndpoint || { ok: false };
    return {
      ok: response.ok,
      json: async () => response.data,
    };
  }
  
  // Default response
  return {
    ok: false,
    status: 404,
    json: async () => ({ error: { message: 'Endpoint not found' } }),
  };
});

vi.mock('../server/services/tenant-settings.service', () => ({
  TenantSettingsService: vi.fn(() => mockTenantSettingsService),
}));

vi.mock('../server/services/tenant.service', () => ({
  TenantService: vi.fn(() => mockTenantService),
}));

describe('WhatsApp Credential Manager Integration', () => {
  let credentialManager: WhatsAppCredentialManagerService;

  beforeEach(() => {
    credentialManager = new WhatsAppCredentialManagerService(mockConnectionString);
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await credentialManager.close();
  });

  describe('Multi-Tenant Credential Validation', () => {
    it('should validate credentials for multiple tenants with different statuses', async () => {
      const tenants = ['tenant-1', 'tenant-2', 'tenant-3'];
      const results = await Promise.all(
        tenants.map(tenantId => credentialManager.validateCredentials(tenantId))
      );

      // Tenant 1: Healthy credentials
      expect(results[0].success).toBe(true);
      expect(results[0].data?.valid).toBe(true);
      expect(results[0].data?.phoneNumber).toBe('+1234567890');
      expect(results[0].data?.businessName).toBe('Healthy Business Inc');
      expect(results[0].data?.errors).toBeUndefined();

      // Tenant 2: Expiring token (should have warnings)
      expect(results[1].success).toBe(true);
      expect(results[1].data?.valid).toBe(true);
      expect(results[1].data?.warnings).toContain('Token expires in 3 days');

      // Tenant 3: Invalid credentials
      expect(results[2].success).toBe(true);
      expect(results[2].data?.valid).toBe(false);
      expect(results[2].data?.errors).toContain('Phone number validation failed: HTTP 401: Invalid OAuth access token');
    });

    it('should maintain tenant isolation in credential validation', async () => {
      // Validate credentials for tenant-1
      const result1 = await credentialManager.validateCredentials('tenant-1');
      expect(result1.data?.phoneNumber).toBe('+1234567890');

      // Validate credentials for tenant-2
      const result2 = await credentialManager.validateCredentials('tenant-2');
      expect(result2.data?.phoneNumber).toBe('+9876543210');

      // Verify different tokens were used
      const fetchCalls = vi.mocked(fetch).mock.calls;
      const tenant1Calls = fetchCalls.filter(call => 
        call[1]?.headers?.Authorization?.includes('valid-token-123')
      );
      const tenant2Calls = fetchCalls.filter(call => 
        call[1]?.headers?.Authorization?.includes('expiring-token-456')
      );

      expect(tenant1Calls.length).toBeGreaterThan(0);
      expect(tenant2Calls.length).toBeGreaterThan(0);
    });

    it('should handle batch validation efficiently', async () => {
      const credentialsList = [
        { tenantId: 'tenant-1' },
        { tenantId: 'tenant-2' },
        { tenantId: 'tenant-3' },
      ];

      const result = await credentialManager.validateMultipleCredentials(credentialsList);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(3);

      // Check individual results
      const tenant1Result = result.data?.find(r => r.tenantId === 'tenant-1');
      const tenant2Result = result.data?.find(r => r.tenantId === 'tenant-2');
      const tenant3Result = result.data?.find(r => r.tenantId === 'tenant-3');

      expect(tenant1Result?.validation.valid).toBe(true);
      expect(tenant2Result?.validation.valid).toBe(true);
      expect(tenant2Result?.validation.warnings).toBeDefined();
      expect(tenant3Result?.validation.valid).toBe(false);
    });
  });

  describe('Health Monitoring and Status Tracking', () => {
    it('should track health status for all tenants', async () => {
      // Validate credentials for all tenants to populate health data
      await Promise.all([
        credentialManager.validateCredentials('tenant-1'),
        credentialManager.validateCredentials('tenant-2'),
        credentialManager.validateCredentials('tenant-3'),
      ]);

      // Get all health statuses
      const healthResult = await credentialManager.getAllHealthStatuses();

      expect(healthResult.success).toBe(true);
      expect(healthResult.data).toHaveLength(3);

      const healthStatuses = healthResult.data!;
      const tenant1Health = healthStatuses.find(h => h.tenantId === 'tenant-1');
      const tenant2Health = healthStatuses.find(h => h.tenantId === 'tenant-2');
      const tenant3Health = healthStatuses.find(h => h.tenantId === 'tenant-3');

      expect(tenant1Health?.status).toBe('healthy');
      expect(tenant2Health?.status).toBe('warning'); // Due to expiring token
      expect(tenant3Health?.status).toBe('error'); // Due to invalid credentials
    });

    it('should detect and categorize different types of issues', async () => {
      // Validate tenant with expiring token
      await credentialManager.validateCredentials('tenant-2');
      const healthResult = await credentialManager.getHealthStatus('tenant-2');

      expect(healthResult.success).toBe(true);
      expect(healthResult.data?.status).toBe('warning');
      expect(healthResult.data?.issues).toHaveLength(1);
      expect(healthResult.data?.issues[0].type).toBe('warning');
      expect(healthResult.data?.issues[0].code).toBe('TOKEN_EXPIRING');
      expect(healthResult.data?.issues[0].severity).toBe('medium');

      // Validate tenant with invalid credentials
      await credentialManager.validateCredentials('tenant-3');
      const errorHealthResult = await credentialManager.getHealthStatus('tenant-3');

      expect(errorHealthResult.success).toBe(true);
      expect(errorHealthResult.data?.status).toBe('error');
      expect(errorHealthResult.data?.issues[0].type).toBe('error');
      expect(errorHealthResult.data?.issues[0].severity).toBe('high');
    });

    it('should update metrics correctly', async () => {
      // Perform multiple validations
      await credentialManager.validateCredentials('tenant-1');
      await credentialManager.validateCredentials('tenant-1');
      await credentialManager.validateCredentials('tenant-3'); // This will fail

      const healthResult = await credentialManager.getHealthStatus('tenant-1');
      expect(healthResult.data?.metrics.totalCalls).toBeGreaterThan(0);
      expect(healthResult.data?.metrics.successRate).toBe(100);

      const errorHealthResult = await credentialManager.getHealthStatus('tenant-3');
      expect(errorHealthResult.data?.metrics.failedCalls).toBeGreaterThan(0);
      expect(errorHealthResult.data?.metrics.successRate).toBe(0);
    });
  });

  describe('Credential Management Workflows', () => {
    it('should handle complete credential lifecycle', async () => {
      const newTenantId = 'tenant-new';
      const newCredentials: WhatsAppCredentials = {
        phoneNumberId: 'phone-new',
        accessToken: 'valid-token-123', // Use valid token for testing
        businessAccountId: 'business-new',
      };

      // Initially no credentials
      const initialResult = await credentialManager.getCredentials(newTenantId);
      expect(initialResult.success).toBe(false);

      // Update (create) credentials
      const updateResult = await credentialManager.updateCredentials(newTenantId, newCredentials);
      expect(updateResult.success).toBe(true);
      expect(updateResult.data?.phoneNumberId).toBe('phone-new');

      // Get credentials
      const getResult = await credentialManager.getCredentials(newTenantId);
      expect(getResult.success).toBe(true);
      expect(getResult.data?.phoneNumberId).toBe('phone-new');

      // Validate credentials
      const validateResult = await credentialManager.validateCredentials(newTenantId);
      expect(validateResult.success).toBe(true);
      expect(validateResult.data?.valid).toBe(true);

      // Delete credentials
      const deleteResult = await credentialManager.deleteCredentials(newTenantId);
      expect(deleteResult.success).toBe(true);

      // Verify deletion
      const finalResult = await credentialManager.getCredentials(newTenantId);
      expect(finalResult.success).toBe(false);
    });

    it('should reject invalid credential updates', async () => {
      const invalidCredentials: WhatsAppCredentials = {
        phoneNumberId: 'phone-invalid',
        accessToken: 'invalid-token-789', // This will fail validation
      };

      const result = await credentialManager.updateCredentials('tenant-1', invalidCredentials);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_CREDENTIALS');
      expect(result.error?.details).toContain('Phone number validation failed: HTTP 401: Invalid OAuth access token');
    });

    it('should handle partial credential updates', async () => {
      // Update only access token
      const partialUpdate = {
        accessToken: 'valid-token-123', // Different but valid token
      };

      const result = await credentialManager.updateCredentials('tenant-1', partialUpdate);

      expect(result.success).toBe(true);
      expect(result.data?.accessToken).toBe('valid-token-123');
      expect(result.data?.phoneNumberId).toBe('phone-123'); // Should retain existing value
    });
  });

  describe('Caching and Performance', () => {
    it('should cache validation results for performance', async () => {
      // First validation
      const result1 = await credentialManager.validateCredentials('tenant-1');
      expect(result1.success).toBe(true);

      const initialFetchCount = vi.mocked(fetch).mock.calls.length;

      // Second validation should use cache
      const result2 = await credentialManager.validateCredentials('tenant-1');
      expect(result2.success).toBe(true);

      // Should not have made additional API calls
      expect(vi.mocked(fetch).mock.calls.length).toBe(initialFetchCount);
    });

    it('should invalidate cache when credentials are updated', async () => {
      // Initial validation
      await credentialManager.validateCredentials('tenant-1');
      const initialFetchCount = vi.mocked(fetch).mock.calls.length;

      // Update credentials
      await credentialManager.updateCredentials('tenant-1', {
        accessToken: 'valid-token-123', // Same valid token for testing
      });

      // Next validation should not use cache
      await credentialManager.validateCredentials('tenant-1');
      expect(vi.mocked(fetch).mock.calls.length).toBeGreaterThan(initialFetchCount);
    });

    it('should handle concurrent validations efficiently', async () => {
      // Perform multiple concurrent validations
      const promises = Array.from({ length: 5 }, () =>
        credentialManager.validateCredentials('tenant-1')
      );

      const results = await Promise.all(promises);

      // All should succeed
      expect(results.every(r => r.success)).toBe(true);
      expect(results.every(r => r.data?.valid)).toBe(true);

      // Should have made minimal API calls due to caching
      const uniqueApiCalls = new Set(
        vi.mocked(fetch).mock.calls.map(call => `${call[0]}-${call[1]?.headers?.Authorization}`)
      );
      expect(uniqueApiCalls.size).toBeLessThan(10); // Should be much less than 15 (5 validations * 3 endpoints)
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle network failures gracefully', async () => {
      // Mock network error
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

      const result = await credentialManager.validateCredentials('tenant-1');

      expect(result.success).toBe(true);
      expect(result.data?.valid).toBe(false);
      expect(result.data?.errors).toContain('Validation error: Error: Network error');
    });

    it('should handle API rate limiting', async () => {
      // Mock rate limit response
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({
          error: {
            message: 'Rate limit exceeded',
            code: 4,
          },
        }),
      } as Response);

      const result = await credentialManager.validateCredentials('tenant-1');

      expect(result.success).toBe(true);
      expect(result.data?.valid).toBe(false);
      expect(result.data?.errors).toContain('Phone number validation failed: HTTP 429: Rate limit exceeded');
    });

    it('should handle malformed API responses', async () => {
      // Mock malformed response
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      } as Response);

      const result = await credentialManager.validateCredentials('tenant-1');

      expect(result.success).toBe(true);
      expect(result.data?.valid).toBe(false);
      expect(result.data?.errors?.[0]).toContain('Validation error');
    });

    it('should recover from temporary failures', async () => {
      // First call fails
      vi.mocked(fetch)
        .mockRejectedValueOnce(new Error('Temporary network error'))
        .mockResolvedValue({
          ok: true,
          json: async () => ({
            display_phone_number: '+1234567890',
          }),
        } as Response);

      // First validation fails
      const result1 = await credentialManager.validateCredentials('tenant-1');
      expect(result1.data?.valid).toBe(false);

      // Clear cache to force re-validation
      credentialManager.clearValidationCache('tenant-1');

      // Second validation succeeds
      const result2 = await credentialManager.validateCredentials('tenant-1');
      expect(result2.data?.valid).toBe(true);
    });
  });

  describe('Validation History and Auditing', () => {
    it('should maintain validation history', async () => {
      // Perform several validations
      await credentialManager.validateCredentials('tenant-1');
      await credentialManager.validateCredentials('tenant-2');
      await credentialManager.validateCredentials('tenant-3');

      // Check if history is being stored (mocked)
      expect(mockTenantSettingsService.updateSettings).toHaveBeenCalledWith(
        expect.any(String),
        'whatsapp_validation_history',
        expect.any(Object)
      );
    });

    it('should track validation metrics over time', async () => {
      // Perform multiple validations for the same tenant
      await credentialManager.validateCredentials('tenant-1');
      await credentialManager.validateCredentials('tenant-1');
      await credentialManager.validateCredentials('tenant-1');

      const healthResult = await credentialManager.getHealthStatus('tenant-1');
      expect(healthResult.data?.metrics.totalCalls).toBeGreaterThan(1);
      expect(healthResult.data?.lastCheck).toBeInstanceOf(Date);
    });
  });

  describe('Real-world Scenarios', () => {
    it('should handle token expiry scenario', async () => {
      // Mock expired token
      const expiredCredentials = {
        phoneNumberId: 'phone-expired',
        accessToken: 'expired-token',
        systemUserToken: 'system-token',
      };

      // Mock expired token response
      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            display_phone_number: '+1234567890',
          }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: {
              expires_at: Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000), // Expired yesterday
            },
          }),
        } as Response);

      const result = await credentialManager.validateCredentials('tenant-1', expiredCredentials);

      expect(result.success).toBe(true);
      expect(result.data?.valid).toBe(true); // Phone validation passes
      expect(result.data?.expiresAt).toBeInstanceOf(Date);

      // Check health status
      const healthResult = await credentialManager.getHealthStatus('tenant-1');
      expect(healthResult.data?.status).toBe('expired');
      expect(healthResult.data?.issues.some(issue => issue.code === 'TOKEN_EXPIRED')).toBe(true);
    });

    it('should handle business verification issues', async () => {
      // Mock unverified business response
      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            display_phone_number: '+1234567890',
            code_verification_status: 'VERIFIED',
          }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            name: 'Unverified Business',
            verification_status: 'unverified',
            business_verification_status: 'pending',
          }),
        } as Response);

      const result = await credentialManager.validateCredentials('tenant-1');

      expect(result.success).toBe(true);
      expect(result.data?.valid).toBe(true);
      expect(result.data?.businessName).toBe('Unverified Business');
      // Business verification issues would typically generate warnings
    });

    it('should handle phone number quality issues', async () => {
      // Mock phone with quality issues
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          display_phone_number: '+1234567890',
          verified_name: 'Business',
          code_verification_status: 'VERIFIED',
          quality_rating: 'RED', // Poor quality rating
        }),
      } as Response);

      const result = await credentialManager.validateCredentials('tenant-1');

      expect(result.success).toBe(true);
      expect(result.data?.valid).toBe(true);
      // Quality issues might generate warnings in a real implementation
    });
  });
});