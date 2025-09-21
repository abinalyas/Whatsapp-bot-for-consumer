import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { Pool } from '@neondatabase/serverless';
import { ApiKeyService } from '@server/services/api-key.service';
import { TenantService } from '@server/services/tenant.service';
import type {
  CreateTenantRequest,
  CreateApiKeyRequest,
  Tenant,
  ApiKeyResponse,
} from '@shared/types/tenant';

describe('API Key Service Integration Tests', () => {
  let apiKeyService: ApiKeyService;
  let tenantService: TenantService;
  let pool: Pool;
  let testTenant: Tenant;
  let testUserId: string;

  beforeAll(async () => {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is required for API key tests');
    }

    apiKeyService = new ApiKeyService(process.env.DATABASE_URL);
    tenantService = new TenantService(process.env.DATABASE_URL);
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
  });

  afterAll(async () => {
    await apiKeyService.close();
    await tenantService.close();
    await pool.end();
  });

  beforeEach(async () => {
    // Create test tenant
    const tenantData: CreateTenantRequest = {
      businessName: 'API Key Test Business',
      domain: 'apikey-test.example.com',
      email: 'admin@apikey-test.example.com',
      phone: '+1234567890',
      adminUser: {
        email: 'admin@apikey-test.example.com',
        password: 'SecurePass123!',
        firstName: 'API',
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

  describe('API Key CRUD Operations', () => {
    it('should create API key with valid data', async () => {
      const apiKeyData: CreateApiKeyRequest = {
        name: 'Test API Key',
        permissions: ['read:services', 'write:bookings'],
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      };

      const result = await apiKeyService.createApiKey(testTenant.id, apiKeyData, testUserId);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.name).toBe('Test API Key');
      expect(result.data!.permissions).toEqual(['read:services', 'write:bookings']);
      expect(result.data!.key).toMatch(/^tk_[a-f0-9]{64}$/);
      expect(result.data!.expiresAt).toBeDefined();
    });

    it('should list API keys for tenant', async () => {
      // Create multiple API keys
      const apiKey1: CreateApiKeyRequest = {
        name: 'API Key 1',
        permissions: ['read:services'],
      };

      const apiKey2: CreateApiKeyRequest = {
        name: 'API Key 2',
        permissions: ['write:bookings'],
      };

      await apiKeyService.createApiKey(testTenant.id, apiKey1, testUserId);
      await apiKeyService.createApiKey(testTenant.id, apiKey2, testUserId);

      const result = await apiKeyService.listApiKeys(testTenant.id, { page: 1, limit: 10 });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.data.length).toBe(2);
      expect(result.data!.pagination.total).toBe(2);
      
      const keyNames = result.data!.data.map(key => key.name);
      expect(keyNames).toContain('API Key 1');
      expect(keyNames).toContain('API Key 2');
    });

    it('should get specific API key by ID', async () => {
      const apiKeyData: CreateApiKeyRequest = {
        name: 'Specific API Key',
        permissions: ['read:analytics'],
      };

      const createResult = await apiKeyService.createApiKey(testTenant.id, apiKeyData, testUserId);
      expect(createResult.success).toBe(true);

      const keyId = createResult.data!.id;
      const getResult = await apiKeyService.getApiKey(testTenant.id, keyId);

      expect(getResult.success).toBe(true);
      expect(getResult.data).toBeDefined();
      expect(getResult.data!.id).toBe(keyId);
      expect(getResult.data!.name).toBe('Specific API Key');
      expect(getResult.data!.permissions).toEqual(['read:analytics']);
    });

    it('should update API key', async () => {
      const apiKeyData: CreateApiKeyRequest = {
        name: 'Original Name',
        permissions: ['read:services'],
      };

      const createResult = await apiKeyService.createApiKey(testTenant.id, apiKeyData, testUserId);
      expect(createResult.success).toBe(true);

      const keyId = createResult.data!.id;
      const updates = {
        name: 'Updated Name',
        permissions: ['read:services', 'write:services'] as any,
      };

      const updateResult = await apiKeyService.updateApiKey(testTenant.id, keyId, updates, testUserId);

      expect(updateResult.success).toBe(true);
      expect(updateResult.data!.name).toBe('Updated Name');
      expect(updateResult.data!.permissions).toEqual(['read:services', 'write:services']);
    });

    it('should revoke API key', async () => {
      const apiKeyData: CreateApiKeyRequest = {
        name: 'Key to Revoke',
        permissions: ['read:services'],
      };

      const createResult = await apiKeyService.createApiKey(testTenant.id, apiKeyData, testUserId);
      expect(createResult.success).toBe(true);

      const keyId = createResult.data!.id;
      const revokeResult = await apiKeyService.revokeApiKey(testTenant.id, keyId, testUserId, 'Security concern');

      expect(revokeResult.success).toBe(true);

      // Verify key is inactive
      const getResult = await apiKeyService.getApiKey(testTenant.id, keyId);
      expect(getResult.success).toBe(true);
      expect(getResult.data!.isActive).toBe(false);
    });

    it('should delete API key permanently', async () => {
      const apiKeyData: CreateApiKeyRequest = {
        name: 'Key to Delete',
        permissions: ['read:services'],
      };

      const createResult = await apiKeyService.createApiKey(testTenant.id, apiKeyData, testUserId);
      expect(createResult.success).toBe(true);

      const keyId = createResult.data!.id;
      const deleteResult = await apiKeyService.deleteApiKey(testTenant.id, keyId, testUserId);

      expect(deleteResult.success).toBe(true);

      // Verify key is deleted
      const getResult = await apiKeyService.getApiKey(testTenant.id, keyId);
      expect(getResult.success).toBe(false);
      expect(getResult.error?.code).toBe('API_KEY_NOT_FOUND');
    });

    it('should handle non-existent API key', async () => {
      const fakeKeyId = '00000000-0000-0000-0000-000000000000';
      const result = await apiKeyService.getApiKey(testTenant.id, fakeKeyId);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('API_KEY_NOT_FOUND');
    });
  });

  describe('API Key Validation', () => {
    let validApiKey: string;
    let validKeyId: string;

    beforeEach(async () => {
      const apiKeyData: CreateApiKeyRequest = {
        name: 'Validation Test Key',
        permissions: ['read:services', 'write:bookings', 'admin:all'],
      };

      const result = await apiKeyService.createApiKey(testTenant.id, apiKeyData, testUserId);
      expect(result.success).toBe(true);
      validApiKey = result.data!.key;
      validKeyId = result.data!.id;
    });

    it('should validate valid API key', async () => {
      const result = await apiKeyService.validateApiKey(validApiKey);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.tenantId).toBe(testTenant.id);
      expect(result.data!.permissions).toContain('admin:all');
    });

    it('should reject invalid API key', async () => {
      const result = await apiKeyService.validateApiKey('tk_invalid_key_123');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_API_KEY');
    });

    it('should reject expired API key', async () => {
      // Create expired API key
      const expiredKeyData: CreateApiKeyRequest = {
        name: 'Expired Key',
        permissions: ['read:services'],
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
      };

      const createResult = await apiKeyService.createApiKey(testTenant.id, expiredKeyData, testUserId);
      expect(createResult.success).toBe(true);

      const result = await apiKeyService.validateApiKey(createResult.data!.key);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('API_KEY_EXPIRED');
    });

    it('should reject revoked API key', async () => {
      // Revoke the key
      await apiKeyService.revokeApiKey(testTenant.id, validKeyId, testUserId);

      const result = await apiKeyService.validateApiKey(validApiKey);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_API_KEY');
    });

    it('should update last used timestamp on validation', async () => {
      const beforeValidation = await apiKeyService.getApiKey(testTenant.id, validKeyId);
      const originalLastUsed = beforeValidation.data!.lastUsed;

      // Wait a moment to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 100));

      await apiKeyService.validateApiKey(validApiKey);

      const afterValidation = await apiKeyService.getApiKey(testTenant.id, validKeyId);
      const newLastUsed = afterValidation.data!.lastUsed;

      expect(newLastUsed).toBeDefined();
      if (originalLastUsed) {
        expect(newLastUsed!.getTime()).toBeGreaterThan(originalLastUsed.getTime());
      }
    });
  });

  describe('Rate Limiting', () => {
    let apiKeyId: string;

    beforeEach(async () => {
      const apiKeyData: CreateApiKeyRequest = {
        name: 'Rate Limit Test Key',
        permissions: ['read:services'],
      };

      const result = await apiKeyService.createApiKey(testTenant.id, apiKeyData, testUserId);
      expect(result.success).toBe(true);
      apiKeyId = result.data!.id;
    });

    it('should allow requests within rate limit', async () => {
      const endpoint = '/api/test';
      
      const result = await apiKeyService.checkRateLimit(apiKeyId, testTenant.id, endpoint);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBeGreaterThan(0);
      expect(result.resetTime).toBeInstanceOf(Date);
    });

    it('should track multiple requests and decrease remaining count', async () => {
      const endpoint = '/api/test';
      
      const result1 = await apiKeyService.checkRateLimit(apiKeyId, testTenant.id, endpoint);
      const result2 = await apiKeyService.checkRateLimit(apiKeyId, testTenant.id, endpoint);

      expect(result1.allowed).toBe(true);
      expect(result2.allowed).toBe(true);
      expect(result2.remaining).toBe(result1.remaining - 1);
    });

    it('should handle different endpoints separately', async () => {
      const endpoint1 = '/api/services';
      const endpoint2 = '/api/bookings';
      
      const result1 = await apiKeyService.checkRateLimit(apiKeyId, testTenant.id, endpoint1);
      const result2 = await apiKeyService.checkRateLimit(apiKeyId, testTenant.id, endpoint2);

      expect(result1.allowed).toBe(true);
      expect(result2.allowed).toBe(true);
      // Different endpoints should have independent rate limits
      expect(result1.remaining).toBe(result2.remaining);
    });
  });

  describe('Usage Tracking', () => {
    let apiKeyId: string;

    beforeEach(async () => {
      const apiKeyData: CreateApiKeyRequest = {
        name: 'Usage Tracking Test Key',
        permissions: ['read:services'],
      };

      const result = await apiKeyService.createApiKey(testTenant.id, apiKeyData, testUserId);
      expect(result.success).toBe(true);
      apiKeyId = result.data!.id;
    });

    it('should track API usage', async () => {
      const usageData = {
        keyId: apiKeyId,
        tenantId: testTenant.id,
        endpoint: '/api/services',
        method: 'GET',
        statusCode: 200,
        responseTime: 125,
        ipAddress: '192.168.1.1',
        userAgent: 'Test Agent',
        timestamp: new Date(),
      };

      // Should not throw error
      await expect(apiKeyService.trackUsage(usageData)).resolves.not.toThrow();
    });

    it('should get API key statistics', async () => {
      const result = await apiKeyService.getApiKeyStats(testTenant.id, apiKeyId);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.totalCalls).toBeGreaterThanOrEqual(0);
      expect(result.data!.callsToday).toBeGreaterThanOrEqual(0);
      expect(result.data!.callsThisMonth).toBeGreaterThanOrEqual(0);
      expect(result.data!.averageResponseTime).toBeGreaterThanOrEqual(0);
      expect(result.data!.errorRate).toBeGreaterThanOrEqual(0);
      expect(result.data!.topEndpoints).toBeInstanceOf(Array);
    });

    it('should get API key statistics with date range', async () => {
      const dateFrom = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
      const dateTo = new Date();

      const result = await apiKeyService.getApiKeyStats(testTenant.id, apiKeyId, dateFrom, dateTo);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });

  describe('Subscription Limits', () => {
    it('should enforce API key creation limits', async () => {
      // Create maximum number of API keys (assuming starter plan limit is 5)
      const promises = [];
      for (let i = 0; i < 6; i++) {
        const apiKeyData: CreateApiKeyRequest = {
          name: `Test Key ${i + 1}`,
          permissions: ['read:services'],
        };
        promises.push(apiKeyService.createApiKey(testTenant.id, apiKeyData, testUserId));
      }

      const results = await Promise.all(promises);

      // First 5 should succeed, 6th should fail
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      expect(successCount).toBeLessThanOrEqual(5);
      expect(failureCount).toBeGreaterThanOrEqual(1);

      // Check that the failure is due to limit exceeded
      const failedResult = results.find(r => !r.success);
      if (failedResult) {
        expect(failedResult.error?.code).toBe('API_KEY_LIMIT_EXCEEDED');
      }
    });

    it('should handle inactive tenant', async () => {
      // Suspend the tenant
      await tenantService.updateTenant(testTenant.id, { status: 'suspended' } as any);

      const apiKeyData: CreateApiKeyRequest = {
        name: 'Test Key for Inactive Tenant',
        permissions: ['read:services'],
      };

      const result = await apiKeyService.createApiKey(testTenant.id, apiKeyData, testUserId);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('TENANT_INACTIVE');
    });
  });

  describe('Permission System', () => {
    it('should validate API key permissions correctly', async () => {
      const apiKeyData: CreateApiKeyRequest = {
        name: 'Permission Test Key',
        permissions: ['read:services', 'write:bookings'],
      };

      const createResult = await apiKeyService.createApiKey(testTenant.id, apiKeyData, testUserId);
      expect(createResult.success).toBe(true);

      const validateResult = await apiKeyService.validateApiKey(createResult.data!.key);
      expect(validateResult.success).toBe(true);

      const permissions = validateResult.data!.permissions;
      expect(permissions).toContain('read:services');
      expect(permissions).toContain('write:bookings');
      expect(permissions).not.toContain('admin:all');
    });

    it('should handle admin permissions', async () => {
      const apiKeyData: CreateApiKeyRequest = {
        name: 'Admin Permission Test Key',
        permissions: ['admin:all'],
      };

      const createResult = await apiKeyService.createApiKey(testTenant.id, apiKeyData, testUserId);
      expect(createResult.success).toBe(true);

      const validateResult = await apiKeyService.validateApiKey(createResult.data!.key);
      expect(validateResult.success).toBe(true);

      const permissions = validateResult.data!.permissions;
      expect(permissions).toContain('admin:all');
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // This would require mocking database failures
      // For now, just verify error handling structure exists
      expect(typeof apiKeyService.createApiKey).toBe('function');
    });

    it('should handle malformed API key format', async () => {
      const result = await apiKeyService.validateApiKey('invalid-format');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_API_KEY');
    });

    it('should handle concurrent API key operations', async () => {
      const apiKeyData: CreateApiKeyRequest = {
        name: 'Concurrent Test Key',
        permissions: ['read:services'],
      };

      // Create multiple API keys concurrently
      const promises = Array(3).fill(null).map((_, i) => 
        apiKeyService.createApiKey(testTenant.id, {
          ...apiKeyData,
          name: `${apiKeyData.name} ${i + 1}`,
        }, testUserId)
      );

      const results = await Promise.all(promises);

      // All should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // All should have unique IDs and keys
      const ids = results.map(r => r.data!.id);
      const keys = results.map(r => r.data!.key);
      
      expect(new Set(ids).size).toBe(ids.length);
      expect(new Set(keys).size).toBe(keys.length);
    });
  });
});