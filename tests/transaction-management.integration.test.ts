/**
 * Integration tests for TransactionManagementService
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { TransactionManagementService } from '../server/services/transaction-management.service';
import { OfferingManagementService } from '../server/services/offering-management.service';
import { PricingConfigService } from '../server/services/pricing-config.service';
import { TenantBusinessConfigService } from '../server/services/tenant-business-config.service';
import { BusinessTypeService } from '../server/services/business-type.service';
import { TenantService } from '../server/services/tenant.service';
import { testDb, setupTestDatabase, cleanupTestDatabase } from './helpers/test-database';

describe('TransactionManagementService Integration Tests', () => {
  let transactionService: TransactionManagementService;
  let offeringService: OfferingManagementService;
  let pricingService: PricingConfigService;
  let configService: TenantBusinessConfigService;
  let businessTypeService: BusinessTypeService;
  let tenantService: TenantService;
  let testTenantId: string;
  let testOfferingId: string;
  let testBusinessTypeId: string;

  beforeAll(async () => {
    await setupTestDatabase();
    
    const connectionString = process.env.TEST_DATABASE_URL!;
    transactionService = new TransactionManagementService(connectionString);
    offeringService = new OfferingManagementService(connectionString);
    pricingService = new PricingConfigService(connectionString);
    configService = new TenantBusinessConfigService(connectionString);
    businessTypeService = new BusinessTypeService(connectionString);
    tenantService = new TenantService(connectionString);
  });

  afterAll(async () => {
    await transactionService.cleanup();
    await offeringService.cleanup();
    await pricingService.cleanup();
    await configService.cleanup();
    await businessTypeService.cleanup();
    await tenantService.cleanup();
    await cleanupTestDatabase();
  });

  beforeEach(async () => {
    // Clean up test data
    await testDb.delete(testDb.schema.transactionStateTransitions);
    await testDb.delete(testDb.schema.transactions);
    await testDb.delete(testDb.schema.availabilitySlots);
    await testDb.delete(testDb.schema.pricingRules);
    await testDb.delete(testDb.schema.offeringVariants);
    await testDb.delete(testDb.schema.offerings);
    await testDb.delete(testDb.schema.customFields);
    await testDb.delete(testDb.schema.workflowStates);
    await testDb.delete(testDb.schema.tenants);
    await testDb.delete(testDb.schema.businessTypes);

    // Setup test environment
    await setupTestEnvironment();
  });

  async function setupTestEnvironment() {
    // Create business type, tenant, and offering for testing
    const businessTypeResult = await businessTypeService.createBusinessType({
      name: 'test-restaurant',
      displayName: 'Test Restaurant',
      category: 'hospitality',
      terminology: { offering: 'Menu Item', transaction: 'Order', customer: 'Guest' },
      defaultConfig: { requiresScheduling: true, defaultDuration: 60 },
    });
    testBusinessTypeId = businessTypeResult.data!.id;

    const tenantResult = await tenantService.createTenant({
      name: 'Test Restaurant Inc',
      email: 'test@restaurant.com',
      phone: '+1234567890',
    });
    testTenantId = tenantResult.data!.id;

    await configService.configureTenantBusiness(testTenantId, {
      businessTypeId: testBusinessTypeId,
      customFields: [{
        entityType: 'transaction',
        name: 'special_requests',
        label: 'Special Requests',
        fieldType: 'text',
        isRequired: false,
      }],
    });

    const offeringResult = await offeringService.createOffering(testTenantId, {
      name: 'Chicken Curry',
      basePrice: 20.00,
      customFieldValues: { preparation_time: 25 },
    });
    testOfferingId = offeringResult.data!.id;
  }

  describe('Transaction Lifecycle Management', () => {
    it('should complete full transaction lifecycle', async () => {
      // 1. Create transaction
      const createResult = await transactionService.createTransaction(testTenantId, {
        offeringId: testOfferingId,
        customerPhone: '+1234567890',
        customerName: 'John Doe',
        quantity: 2,
        scheduledDate: '2024-01-15',
        scheduledTime: '18:00',
        customFieldValues: { special_requests: 'No onions' },
      });

      expect(createResult.success).toBe(true);
      expect(createResult.data?.customerName).toBe('John Doe');
      expect(createResult.data?.totalAmount).toBe(40.00);

      const transactionId = createResult.data!.id;

      // 2. Update transaction
      const updateResult = await transactionService.updateTransaction(testTenantId, transactionId, {
        customerEmail: 'john@example.com',
        paymentStatus: 'paid',
      });

      expect(updateResult.success).toBe(true);
      expect(updateResult.data?.customerEmail).toBe('john@example.com');
      expect(updateResult.data?.paymentStatus).toBe('paid');

      // 3. Get transaction details
      const getResult = await transactionService.getTransaction(testTenantId, transactionId);
      expect(getResult.success).toBe(true);
      expect(getResult.data?.offering?.name).toBe('Chicken Curry');

      // 4. List transactions
      const listResult = await transactionService.listTransactions(testTenantId, {
        customerPhone: '+1234567890',
      });
      expect(listResult.success).toBe(true);
      expect(listResult.data?.data).toHaveLength(1);

      // 5. Cancel transaction
      const cancelResult = await transactionService.cancelTransaction(testTenantId, transactionId);
      expect(cancelResult.success).toBe(true);
    });

    it('should handle workflow state transitions', async () => {
      const createResult = await transactionService.createTransaction(testTenantId, {
        offeringId: testOfferingId,
        customerPhone: '+1234567890',
        customerName: 'Jane Doe',
        quantity: 1,
      });

      const transactionId = createResult.data!.id;

      // Get available transitions
      const transitionsResult = await transactionService.getAvailableStateTransitions(testTenantId, transactionId);
      expect(transitionsResult.success).toBe(true);

      if (transitionsResult.data && transitionsResult.data.length > 0) {
        const targetStateId = transitionsResult.data[0].id;

        // Transition state
        const transitionResult = await transactionService.transitionTransactionState(
          testTenantId,
          transactionId,
          targetStateId,
          'Order confirmed'
        );
        expect(transitionResult.success).toBe(true);
      }
    });

    it('should generate analytics', async () => {
      // Create multiple transactions
      for (let i = 0; i < 3; i++) {
        await transactionService.createTransaction(testTenantId, {
          offeringId: testOfferingId,
          customerPhone: `+123456789${i}`,
          customerName: `Customer ${i}`,
          quantity: 1,
        });
      }

      const analyticsResult = await transactionService.getTransactionAnalytics(testTenantId);
      expect(analyticsResult.success).toBe(true);
      expect(analyticsResult.data?.totalTransactions).toBe(3);
    });
  });

  describe('Error Handling', () => {
    it('should handle tenant not configured', async () => {
      const unconfiguredTenantResult = await tenantService.createTenant({
        name: 'Unconfigured Tenant',
        email: 'unconfigured@test.com',
        phone: '+1234567891',
      });

      const result = await transactionService.createTransaction(unconfiguredTenantResult.data!.id, {
        offeringId: testOfferingId,
        customerPhone: '+1234567890',
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('TENANT_NOT_CONFIGURED');
    });

    it('should handle offering not found', async () => {
      const result = await transactionService.createTransaction(testTenantId, {
        offeringId: 'nonexistent-offering',
        customerPhone: '+1234567890',
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('OFFERING_NOT_FOUND');
    });
  });
});