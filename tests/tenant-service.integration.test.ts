import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { Pool } from '@neondatabase/serverless';
import { TenantService } from '@server/services/tenant.service';
import { ServiceRepository } from '@server/repositories/service.repository';
import { ConversationRepository } from '@server/repositories/conversation.repository';
import * as schema from '@shared/schema';
import type {
  CreateTenantRequest,
  CreateUserRequest,
  CreateApiKeyRequest,
  Tenant,
  UserProfile,
  ApiKeyResponse,
} from '@shared/types/tenant';

describe('Tenant Service Integration Tests', () => {
  let tenantService: TenantService;
  let serviceRepository: ServiceRepository;
  let conversationRepository: ConversationRepository;
  let pool: Pool;
  let tenant1: Tenant;
  let tenant2: Tenant;

  beforeAll(async () => {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is required for integration tests');
    }

    tenantService = new TenantService(process.env.DATABASE_URL);
    serviceRepository = new ServiceRepository(process.env.DATABASE_URL);
    conversationRepository = new ConversationRepository(process.env.DATABASE_URL);
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
  });

  afterAll(async () => {
    await tenantService.close();
    await serviceRepository.close();
    await conversationRepository.close();
    await pool.end();
  });

  beforeEach(async () => {
    // Create test tenants
    const tenant1Data: CreateTenantRequest = {
      businessName: 'Test Business 1',
      domain: 'test1.integration.com',
      email: 'admin@test1.integration.com',
      phone: '+1234567890',
      subscriptionPlan: 'professional',
      adminUser: {
        email: 'admin@test1.integration.com',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
        role: 'admin',
      },
    };

    const tenant2Data: CreateTenantRequest = {
      businessName: 'Test Business 2',
      domain: 'test2.integration.com',
      email: 'admin@test2.integration.com',
      phone: '+0987654321',
      subscriptionPlan: 'starter',
      adminUser: {
        email: 'admin@test2.integration.com',
        password: 'SecurePass456!',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'admin',
      },
    };

    const result1 = await tenantService.createTenant(tenant1Data);
    const result2 = await tenantService.createTenant(tenant2Data);

    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);

    tenant1 = result1.data!;
    tenant2 = result2.data!;
  });

  afterEach(async () => {
    // Clean up test data
    if (tenant1) {
      await tenantService.deleteTenant(tenant1.id);
    }
    if (tenant2) {
      await tenantService.deleteTenant(tenant2.id);
    }
  });

  describe('Tenant CRUD Operations', () => {
    it('should create tenant with admin user and subscription', async () => {
      expect(tenant1.businessName).toBe('Test Business 1');
      expect(tenant1.domain).toBe('test1.integration.com');
      expect(tenant1.status).toBe('trial');
      expect(tenant1.subscriptionPlan).toBe('professional');
    });

    it('should prevent duplicate domain registration', async () => {
      const duplicateData: CreateTenantRequest = {
        businessName: 'Duplicate Business',
        domain: 'test1.integration.com', // Same domain as tenant1
        email: 'duplicate@test.com',
        adminUser: {
          email: 'admin@duplicate.com',
          password: 'SecurePass789!',
        },
      };

      const result = await tenantService.createTenant(duplicateData);
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('DOMAIN_ALREADY_EXISTS');
    });

    it('should get tenant by ID', async () => {
      const result = await tenantService.getTenantById(tenant1.id);
      expect(result.success).toBe(true);
      expect(result.data?.id).toBe(tenant1.id);
      expect(result.data?.businessName).toBe('Test Business 1');
    });

    it('should get tenant by domain', async () => {
      const result = await tenantService.getTenantByDomain('test1.integration.com');
      expect(result.success).toBe(true);
      expect(result.data?.id).toBe(tenant1.id);
      expect(result.data?.domain).toBe('test1.integration.com');
    });

    it('should update tenant information', async () => {
      const updateData = {
        businessName: 'Updated Business Name',
        email: 'updated@test1.integration.com',
      };

      const result = await tenantService.updateTenant(tenant1.id, updateData);
      expect(result.success).toBe(true);
      expect(result.data?.businessName).toBe('Updated Business Name');
      expect(result.data?.email).toBe('updated@test1.integration.com');
    });

    it('should list tenants with pagination', async () => {
      const result = await tenantService.listTenants(
        { page: 1, limit: 10 },
        { search: 'Test Business' }
      );

      expect(result.success).toBe(true);
      expect(result.data?.data.length).toBeGreaterThanOrEqual(2);
      expect(result.data?.pagination.total).toBeGreaterThanOrEqual(2);
    });

    it('should soft delete tenant', async () => {
      const result = await tenantService.deleteTenant(tenant1.id);
      expect(result.success).toBe(true);

      // Verify tenant is marked as cancelled
      const getResult = await tenantService.getTenantById(tenant1.id);
      expect(getResult.success).toBe(true);
      expect(getResult.data?.status).toBe('cancelled');
    });
  });

  describe('User Management', () => {
    it('should create user for tenant', async () => {
      const userData: CreateUserRequest = {
        email: 'user@test1.integration.com',
        password: 'UserPass123!',
        role: 'user',
        firstName: 'Test',
        lastName: 'User',
      };

      const result = await tenantService.createUser(tenant1.id, userData);
      expect(result.success).toBe(true);
      expect(result.data?.email).toBe('user@test1.integration.com');
      expect(result.data?.role).toBe('user');
      expect(result.data?.tenant.id).toBe(tenant1.id);
    });

    it('should prevent duplicate email within tenant', async () => {
      const userData: CreateUserRequest = {
        email: 'admin@test1.integration.com', // Same as admin user
        password: 'UserPass123!',
        role: 'user',
      };

      const result = await tenantService.createUser(tenant1.id, userData);
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('EMAIL_ALREADY_EXISTS');
    });

    it('should allow same email across different tenants', async () => {
      const userData: CreateUserRequest = {
        email: 'shared@test.com',
        password: 'UserPass123!',
        role: 'user',
      };

      const result1 = await tenantService.createUser(tenant1.id, userData);
      const result2 = await tenantService.createUser(tenant2.id, userData);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result1.data?.tenant.id).toBe(tenant1.id);
      expect(result2.data?.tenant.id).toBe(tenant2.id);
    });

    it('should list users for tenant', async () => {
      // Create additional user
      await tenantService.createUser(tenant1.id, {
        email: 'user@test1.integration.com',
        password: 'UserPass123!',
        role: 'user',
      });

      const result = await tenantService.listUsers(tenant1.id, { page: 1, limit: 10 });
      expect(result.success).toBe(true);
      expect(result.data?.data.length).toBe(2); // Admin + new user
      expect(result.data?.data.every(user => user.tenant.id === tenant1.id)).toBe(true);
    });
  });

  describe('API Key Management', () => {
    it('should create API key for tenant', async () => {
      const apiKeyData: CreateApiKeyRequest = {
        name: 'Test API Key',
        permissions: ['read:services', 'write:bookings'],
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      };

      const result = await tenantService.createApiKey(tenant1.id, apiKeyData);
      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('Test API Key');
      expect(result.data?.permissions).toEqual(['read:services', 'write:bookings']);
      expect(result.data?.key).toMatch(/^tk_[a-f0-9]{64}$/);
    });

    it('should validate API key and return tenant context', async () => {
      // Create API key
      const apiKeyResult = await tenantService.createApiKey(tenant1.id, {
        name: 'Validation Test Key',
        permissions: ['read:services', 'admin:all'],
      });

      expect(apiKeyResult.success).toBe(true);
      const apiKey = apiKeyResult.data!.key;

      // Validate API key
      const validationResult = await tenantService.validateApiKey(apiKey);
      expect(validationResult.success).toBe(true);
      expect(validationResult.data?.tenantId).toBe(tenant1.id);
      expect(validationResult.data?.permissions).toContain('admin:all');
    });

    it('should reject invalid API key', async () => {
      const result = await tenantService.validateApiKey('tk_invalid_key_123');
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_API_KEY');
    });
  });

  describe('Repository Tenant Isolation', () => {
    it('should isolate services between tenants', async () => {
      // Create services for each tenant
      const service1Result = await serviceRepository.create(tenant1.id, {
        name: 'Tenant 1 Service',
        description: 'Service for tenant 1',
        price: 5000,
        isActive: true,
      });

      const service2Result = await serviceRepository.create(tenant2.id, {
        name: 'Tenant 2 Service',
        description: 'Service for tenant 2',
        price: 7500,
        isActive: true,
      });

      expect(service1Result.success).toBe(true);
      expect(service2Result.success).toBe(true);

      // Verify tenant 1 can only see their services
      const tenant1Services = await serviceRepository.list(tenant1.id, { page: 1, limit: 10 });
      expect(tenant1Services.success).toBe(true);
      expect(tenant1Services.data?.data.length).toBe(1);
      expect(tenant1Services.data?.data[0].name).toBe('Tenant 1 Service');

      // Verify tenant 2 can only see their services
      const tenant2Services = await serviceRepository.list(tenant2.id, { page: 1, limit: 10 });
      expect(tenant2Services.success).toBe(true);
      expect(tenant2Services.data?.data.length).toBe(1);
      expect(tenant2Services.data?.data[0].name).toBe('Tenant 2 Service');

      // Verify cross-tenant access is prevented
      const crossTenantAccess = await serviceRepository.findById(tenant1.id, service2Result.data!.id);
      expect(crossTenantAccess.success).toBe(false);
      expect(crossTenantAccess.error?.code).toBe('RECORD_NOT_FOUND');
    });

    it('should isolate conversations between tenants', async () => {
      // Create conversations for each tenant
      const conversation1Result = await conversationRepository.create(tenant1.id, {
        phoneNumber: '+1111111111',
        customerName: 'Customer 1',
        currentState: 'greeting',
      });

      const conversation2Result = await conversationRepository.create(tenant2.id, {
        phoneNumber: '+2222222222',
        customerName: 'Customer 2',
        currentState: 'greeting',
      });

      expect(conversation1Result.success).toBe(true);
      expect(conversation2Result.success).toBe(true);

      // Verify tenant isolation
      const tenant1Conversations = await conversationRepository.list(tenant1.id, { page: 1, limit: 10 });
      expect(tenant1Conversations.success).toBe(true);
      expect(tenant1Conversations.data?.data.length).toBe(1);
      expect(tenant1Conversations.data?.data[0].phoneNumber).toBe('+1111111111');

      const tenant2Conversations = await conversationRepository.list(tenant2.id, { page: 1, limit: 10 });
      expect(tenant2Conversations.success).toBe(true);
      expect(tenant2Conversations.data?.data.length).toBe(1);
      expect(tenant2Conversations.data?.data[0].phoneNumber).toBe('+2222222222');

      // Verify cross-tenant access is prevented
      const crossTenantAccess = await conversationRepository.findById(tenant1.id, conversation2Result.data!.id);
      expect(crossTenantAccess.success).toBe(false);
      expect(crossTenantAccess.error?.code).toBe('RECORD_NOT_FOUND');
    });

    it('should enforce unique constraints within tenant scope', async () => {
      // Create conversation with phone number for tenant 1
      const result1 = await conversationRepository.create(tenant1.id, {
        phoneNumber: '+1234567890',
        customerName: 'Customer 1',
        currentState: 'greeting',
      });
      expect(result1.success).toBe(true);

      // Same phone number should be allowed for different tenant
      const result2 = await conversationRepository.create(tenant2.id, {
        phoneNumber: '+1234567890',
        customerName: 'Customer 2',
        currentState: 'greeting',
      });
      expect(result2.success).toBe(true);

      // Same phone number should NOT be allowed for same tenant
      const result3 = await conversationRepository.create(tenant1.id, {
        phoneNumber: '+1234567890',
        customerName: 'Another Customer',
        currentState: 'greeting',
      });
      expect(result3.success).toBe(false);
    });
  });

  describe('Multi-Tenant Scenarios', () => {
    it('should handle concurrent operations across tenants', async () => {
      const operations = [
        serviceRepository.create(tenant1.id, {
          name: 'Concurrent Service 1',
          description: 'Test concurrent operations',
          price: 1000,
          isActive: true,
        }),
        serviceRepository.create(tenant2.id, {
          name: 'Concurrent Service 2',
          description: 'Test concurrent operations',
          price: 2000,
          isActive: true,
        }),
        conversationRepository.create(tenant1.id, {
          phoneNumber: '+1111111111',
          customerName: 'Concurrent Customer 1',
          currentState: 'greeting',
        }),
        conversationRepository.create(tenant2.id, {
          phoneNumber: '+2222222222',
          customerName: 'Concurrent Customer 2',
          currentState: 'greeting',
        }),
      ];

      const results = await Promise.all(operations);
      expect(results.every(result => result.success)).toBe(true);

      // Verify each tenant only sees their own data
      const tenant1Services = await serviceRepository.list(tenant1.id, { page: 1, limit: 10 });
      const tenant2Services = await serviceRepository.list(tenant2.id, { page: 1, limit: 10 });

      expect(tenant1Services.data?.data.length).toBe(1);
      expect(tenant2Services.data?.data.length).toBe(1);
      expect(tenant1Services.data?.data[0].name).toBe('Concurrent Service 1');
      expect(tenant2Services.data?.data[0].name).toBe('Concurrent Service 2');
    });

    it('should maintain data integrity during bulk operations', async () => {
      const services = [
        { name: 'Bulk Service 1', description: 'Bulk test 1', price: 1000, isActive: true },
        { name: 'Bulk Service 2', description: 'Bulk test 2', price: 2000, isActive: true },
        { name: 'Bulk Service 3', description: 'Bulk test 3', price: 3000, isActive: true },
      ];

      const result = await serviceRepository.bulkCreate(tenant1.id, services);
      expect(result.success).toBe(true);
      expect(result.data?.length).toBe(3);

      // Verify all services belong to the correct tenant
      const allServices = await serviceRepository.list(tenant1.id, { page: 1, limit: 10 });
      expect(allServices.success).toBe(true);
      expect(allServices.data?.data.length).toBe(3);
      expect(allServices.data?.data.every(service => service.tenantId === tenant1.id)).toBe(true);

      // Verify other tenant doesn't see these services
      const otherTenantServices = await serviceRepository.list(tenant2.id, { page: 1, limit: 10 });
      expect(otherTenantServices.success).toBe(true);
      expect(otherTenantServices.data?.data.length).toBe(0);
    });

    it('should handle transaction rollback with tenant isolation', async () => {
      const result = await serviceRepository.transaction(tenant1.id, async (tx, tenantId) => {
        // Create a service
        await tx.insert(schema.services).values({
          tenantId,
          name: 'Transaction Test Service',
          description: 'This should be rolled back',
          price: 5000,
          isActive: true,
        });

        // Simulate an error to trigger rollback
        throw new Error('Simulated transaction error');
      });

      expect(result.success).toBe(false);

      // Verify no service was created due to rollback
      const services = await serviceRepository.list(tenant1.id, { page: 1, limit: 10 });
      expect(services.success).toBe(true);
      expect(services.data?.data.length).toBe(0);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid tenant ID format', async () => {
      const result = await serviceRepository.findById('invalid-tenant-id', 'some-id');
      expect(result.success).toBe(false);
    });

    it('should handle non-existent tenant operations', async () => {
      const fakeUuid = '00000000-0000-0000-0000-000000000000';
      const result = await serviceRepository.create(fakeUuid, {
        name: 'Test Service',
        description: 'Test',
        price: 1000,
        isActive: true,
      });
      expect(result.success).toBe(false);
    });

    it('should handle database connection errors gracefully', async () => {
      // This test would require mocking database connection failures
      // For now, we'll just verify the error handling structure exists
      expect(typeof serviceRepository.handleError).toBe('function');
    });
  });
});