/**
 * Integration tests for TenantBusinessConfigService
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { TenantBusinessConfigService } from '../server/services/tenant-business-config.service';
import { BusinessTypeService } from '../server/services/business-type.service';
import { TenantService } from '../server/services/tenant.service';
import { testDb, setupTestDatabase, cleanupTestDatabase } from './helpers/test-database';

describe('TenantBusinessConfigService Integration Tests', () => {
  let configService: TenantBusinessConfigService;
  let businessTypeService: BusinessTypeService;
  let tenantService: TenantService;
  let testTenantId: string;
  let testBusinessTypeId: string;

  beforeAll(async () => {
    await setupTestDatabase();
    
    const connectionString = process.env.TEST_DATABASE_URL!;
    configService = new TenantBusinessConfigService(connectionString);
    businessTypeService = new BusinessTypeService(connectionString);
    tenantService = new TenantService(connectionString);
  });

  afterAll(async () => {
    await configService.cleanup();
    await businessTypeService.cleanup();
    await tenantService.cleanup();
    await cleanupTestDatabase();
  });

  beforeEach(async () => {
    // Clean up test data
    await testDb.delete(testDb.schema.customFields);
    await testDb.delete(testDb.schema.workflowStates);
    await testDb.delete(testDb.schema.tenants);
    await testDb.delete(testDb.schema.businessTypes);

    // Create test business type
    const businessTypeResult = await businessTypeService.createBusinessType({
      name: 'test-restaurant',
      displayName: 'Test Restaurant',
      category: 'hospitality',
      description: 'Test restaurant business type',
      terminology: {
        offering: 'Menu Item',
        transaction: 'Order',
        customer: 'Guest',
      },
      defaultConfig: {
        requiresScheduling: true,
        defaultDuration: 60,
        supportsVariants: true,
        supportsInventory: false,
      },
    });

    expect(businessTypeResult.success).toBe(true);
    testBusinessTypeId = businessTypeResult.data!.id;

    // Create test tenant
    const tenantResult = await tenantService.createTenant({
      name: 'Test Restaurant Inc',
      email: 'test@restaurant.com',
      phone: '+1234567890',
    });

    expect(tenantResult.success).toBe(true);
    testTenantId = tenantResult.data!.id;
  });

  describe('Tenant Business Configuration Lifecycle', () => {
    it('should complete full configuration lifecycle', async () => {
      // 1. Get initial unconfigured state
      const initialConfig = await configService.getTenantBusinessConfig(testTenantId);
      expect(initialConfig.success).toBe(true);
      expect(initialConfig.data?.isConfigured).toBe(false);

      // 2. Configure tenant with business type
      const configuration = {
        businessTypeId: testBusinessTypeId,
        terminologyOverrides: {
          offering: 'Dish',
          transaction: 'Order',
          customer: 'Diner',
        },
        configurationOverrides: {
          requiresScheduling: true,
          defaultDuration: 90,
          supportsVariants: true,
        },
        customFields: [
          {
            entityType: 'offering',
            name: 'spice_level',
            label: 'Spice Level',
            fieldType: 'select',
            isRequired: false,
            fieldOptions: [
              { value: 'mild', label: 'Mild' },
              { value: 'medium', label: 'Medium' },
              { value: 'hot', label: 'Hot' },
            ],
          },
          {
            entityType: 'transaction',
            name: 'party_size',
            label: 'Party Size',
            fieldType: 'number',
            isRequired: true,
            validationRules: { min: 1, max: 20 },
          },
        ],
        workflowCustomizations: [
          {
            workflowType: 'transaction',
            states: [
              {
                name: 'pending',
                displayName: 'Pending',
                stateType: 'initial',
                color: '#F59E0B',
                description: 'Order received and pending confirmation',
              },
              {
                name: 'confirmed',
                displayName: 'Confirmed',
                stateType: 'intermediate',
                color: '#10B981',
                description: 'Order confirmed by restaurant',
              },
              {
                name: 'preparing',
                displayName: 'Preparing',
                stateType: 'intermediate',
                color: '#3B82F6',
                description: 'Food is being prepared',
              },
              {
                name: 'ready',
                displayName: 'Ready for Pickup',
                stateType: 'intermediate',
                color: '#8B5CF6',
                description: 'Food is ready for pickup or delivery',
              },
              {
                name: 'completed',
                displayName: 'Completed',
                stateType: 'final',
                color: '#059669',
                description: 'Order completed successfully',
              },
              {
                name: 'cancelled',
                displayName: 'Cancelled',
                stateType: 'final',
                color: '#EF4444',
                description: 'Order was cancelled',
              },
            ],
          },
        ],
      };

      const configResult = await configService.configureTenantBusiness(testTenantId, configuration);
      expect(configResult.success).toBe(true);

      // 3. Verify configuration was applied
      const configuredState = await configService.getTenantBusinessConfig(testTenantId);
      expect(configuredState.success).toBe(true);
      expect(configuredState.data?.isConfigured).toBe(true);
      expect(configuredState.data?.businessType.id).toBe(testBusinessTypeId);
      expect(configuredState.data?.terminology).toEqual({
        offering: 'Dish',
        transaction: 'Order',
        customer: 'Diner',
      });
      expect(configuredState.data?.configuration).toMatchObject({
        requiresScheduling: true,
        defaultDuration: 90,
        supportsVariants: true,
      });
      expect(configuredState.data?.customFields).toHaveLength(2);
      expect(configuredState.data?.workflowStates).toHaveLength(6);

      // 4. Update configuration
      const updateResult = await configService.updateTenantBusinessConfig(testTenantId, {
        terminologyOverrides: {
          offering: 'Specialty Dish',
          transaction: 'Order',
          customer: 'Valued Guest',
        },
        configurationOverrides: {
          requiresScheduling: true,
          defaultDuration: 120,
          supportsVariants: true,
          maxPartySize: 15,
        },
      });

      expect(updateResult.success).toBe(true);
      expect(updateResult.data?.terminology.offering).toBe('Specialty Dish');
      expect(updateResult.data?.terminology.customer).toBe('Valued Guest');
      expect(updateResult.data?.configuration.defaultDuration).toBe(120);
      expect(updateResult.data?.configuration.maxPartySize).toBe(15);

      // 5. Reset configuration
      const resetResult = await configService.resetTenantBusinessConfig(testTenantId);
      expect(resetResult.success).toBe(true);

      // 6. Verify reset
      const resetState = await configService.getTenantBusinessConfig(testTenantId);
      expect(resetState.success).toBe(true);
      expect(resetState.data?.isConfigured).toBe(false);
    });

    it('should configure tenant from business type template', async () => {
      // Create a business type template
      const templateResult = await businessTypeService.createBusinessTypeTemplate({
        name: 'restaurant-template',
        displayName: 'Restaurant Template',
        category: 'hospitality',
        description: 'Standard restaurant configuration template',
        terminology: {
          offering: 'Menu Item',
          transaction: 'Order',
          customer: 'Guest',
        },
        defaultConfig: {
          requiresScheduling: true,
          defaultDuration: 60,
          supportsVariants: true,
        },
        customFields: [
          {
            entityType: 'offering',
            name: 'dietary_restrictions',
            label: 'Dietary Restrictions',
            fieldType: 'multiselect',
            isRequired: false,
            fieldOptions: [
              { value: 'vegetarian', label: 'Vegetarian' },
              { value: 'vegan', label: 'Vegan' },
              { value: 'gluten_free', label: 'Gluten Free' },
            ],
          },
        ],
        workflowStates: [
          {
            name: 'pending',
            displayName: 'Pending',
            stateType: 'initial',
            color: '#F59E0B',
          },
          {
            name: 'confirmed',
            displayName: 'Confirmed',
            stateType: 'intermediate',
            color: '#10B981',
          },
          {
            name: 'completed',
            displayName: 'Completed',
            stateType: 'final',
            color: '#059669',
          },
        ],
      });

      expect(templateResult.success).toBe(true);

      // Configure tenant from template
      const configResult = await configService.configureTenantFromTemplate(
        testTenantId,
        templateResult.data!.id,
        {
          terminologyOverrides: {
            customer: 'Valued Customer',
          },
        }
      );

      expect(configResult.success).toBe(true);
      expect(configResult.data?.isConfigured).toBe(true);
      expect(configResult.data?.terminology.customer).toBe('Valued Customer');
      expect(configResult.data?.terminology.offering).toBe('Menu Item');
      expect(configResult.data?.customFields).toHaveLength(1);
      expect(configResult.data?.workflowStates).toHaveLength(3);
    });
  });

  describe('Configuration Validation', () => {
    it('should validate configuration correctly', async () => {
      const validConfiguration = {
        businessTypeId: testBusinessTypeId,
        customFields: [
          {
            entityType: 'offering',
            name: 'allergens',
            label: 'Allergens',
            fieldType: 'multiselect',
            isRequired: false,
            fieldOptions: [
              { value: 'nuts', label: 'Nuts' },
              { value: 'dairy', label: 'Dairy' },
            ],
          },
        ],
        workflowCustomizations: [
          {
            workflowType: 'transaction',
            states: [
              {
                name: 'pending',
                displayName: 'Pending',
                stateType: 'initial',
                color: '#F59E0B',
              },
              {
                name: 'completed',
                displayName: 'Completed',
                stateType: 'final',
                color: '#10B981',
              },
            ],
          },
        ],
      };

      const validation = await configService.validateConfiguration(testTenantId, validConfiguration);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect validation errors', async () => {
      const invalidConfiguration = {
        businessTypeId: 'nonexistent-business-type',
        customFields: [
          {
            entityType: 'offering',
            name: '',
            label: 'Invalid Field',
            fieldType: 'select',
            isRequired: false,
            fieldOptions: [],
          },
        ],
        workflowCustomizations: [
          {
            workflowType: 'transaction',
            states: [],
          },
        ],
      };

      const validation = await configService.validateConfiguration(testTenantId, invalidConfiguration);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors).toContain('Business type not found');
    });
  });

  describe('Configuration Recommendations', () => {
    it('should provide recommendations for hospitality business', async () => {
      const recommendations = await configService.getConfigurationRecommendations(
        testTenantId,
        testBusinessTypeId
      );

      expect(recommendations.success).toBe(true);
      expect(recommendations.data?.recommendedFields.length).toBeGreaterThan(0);
      expect(recommendations.data?.recommendedIntegrations.length).toBeGreaterThan(0);

      // Check for hospitality-specific recommendations
      const partySize = recommendations.data?.recommendedFields.find(f => f.name === 'party_size');
      expect(partySize).toBeDefined();
      expect(partySize?.reason).toContain('table management');

      const posIntegration = recommendations.data?.recommendedIntegrations.find(i => i.name === 'POS System');
      expect(posIntegration).toBeDefined();
    });
  });

  describe('Migration Status', () => {
    it('should track migration status correctly', async () => {
      // Initially no migration needed (no legacy data)
      const initialStatus = await configService.getMigrationStatus(testTenantId);
      expect(initialStatus.success).toBe(true);
      expect(initialStatus.data?.needsMigration).toBe(false);
      expect(initialStatus.data?.legacyServicesCount).toBe(0);
      expect(initialStatus.data?.legacyBookingsCount).toBe(0);

      // Create some legacy data (this would be done by creating services/bookings)
      // For this test, we'll simulate the scenario where legacy data exists
      // but new offerings/transactions don't exist yet

      // The actual implementation would check for existing services and bookings
      // and determine if migration is needed based on the presence of new data structures
    });
  });

  describe('Error Handling', () => {
    it('should handle tenant not found', async () => {
      const result = await configService.getTenantBusinessConfig('nonexistent-tenant');
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('TENANT_NOT_FOUND');
    });

    it('should handle business type not found during configuration', async () => {
      const configuration = {
        businessTypeId: 'nonexistent-business-type',
      };

      const result = await configService.configureTenantBusiness(testTenantId, configuration);
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_CONFIGURATION');
    });

    it('should handle database errors gracefully', async () => {
      // Close the database connection to simulate a database error
      await configService.cleanup();

      const result = await configService.getTenantBusinessConfig(testTenantId);
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('CONFIG_FETCH_FAILED');

      // Recreate the service for cleanup
      configService = new TenantBusinessConfigService(process.env.TEST_DATABASE_URL!);
    });
  });

  describe('Configured Tenants Management', () => {
    it('should list configured tenants correctly', async () => {
      // Configure the test tenant
      await configService.configureTenantBusiness(testTenantId, {
        businessTypeId: testBusinessTypeId,
        customFields: [
          {
            entityType: 'offering',
            name: 'test_field',
            label: 'Test Field',
            fieldType: 'text',
            isRequired: false,
          },
        ],
      });

      const configuredTenants = await configService.getConfiguredTenants();
      expect(configuredTenants.success).toBe(true);
      expect(configuredTenants.data?.length).toBeGreaterThan(0);

      const testTenant = configuredTenants.data?.find(ct => ct.tenant.id === testTenantId);
      expect(testTenant).toBeDefined();
      expect(testTenant?.businessType.id).toBe(testBusinessTypeId);
      expect(testTenant?.configurationStatus).toBe('complete');
    });
  });
});