/**
 * Integration tests for OfferingManagementService
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { OfferingManagementService } from '../server/services/offering-management.service';
import { TenantBusinessConfigService } from '../server/services/tenant-business-config.service';
import { BusinessTypeService } from '../server/services/business-type.service';
import { TenantService } from '../server/services/tenant.service';
import { testDb, setupTestDatabase, cleanupTestDatabase } from './helpers/test-database';

describe('OfferingManagementService Integration Tests', () => {
  let offeringService: OfferingManagementService;
  let configService: TenantBusinessConfigService;
  let businessTypeService: BusinessTypeService;
  let tenantService: TenantService;
  let testTenantId: string;
  let testBusinessTypeId: string;
  let testOfferingId: string;

  beforeAll(async () => {
    await setupTestDatabase();
    
    const connectionString = process.env.TEST_DATABASE_URL!;
    offeringService = new OfferingManagementService(connectionString);
    configService = new TenantBusinessConfigService(connectionString);
    businessTypeService = new BusinessTypeService(connectionString);
    tenantService = new TenantService(connectionString);
  });

  afterAll(async () => {
    await offeringService.cleanup();
    await configService.cleanup();
    await businessTypeService.cleanup();
    await tenantService.cleanup();
    await cleanupTestDatabase();
  });

  beforeEach(async () => {
    // Clean up test data
    await testDb.delete(testDb.schema.offeringVariants);
    await testDb.delete(testDb.schema.offeringAvailability);
    await testDb.delete(testDb.schema.offerings);
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

    // Configure tenant with business type
    const configResult = await configService.configureTenantBusiness(testTenantId, {
      businessTypeId: testBusinessTypeId,
      terminologyOverrides: {
        offering: 'Dish',
        transaction: 'Order',
        customer: 'Diner',
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
          entityType: 'offering',
          name: 'allergens',
          label: 'Allergens',
          fieldType: 'multiselect',
          isRequired: false,
          fieldOptions: [
            { value: 'nuts', label: 'Nuts' },
            { value: 'dairy', label: 'Dairy' },
            { value: 'gluten', label: 'Gluten' },
          ],
        },
        {
          entityType: 'offering',
          name: 'preparation_time',
          label: 'Preparation Time (minutes)',
          fieldType: 'number',
          isRequired: true,
          validationRules: { min: 5, max: 120 },
        },
      ],
    });

    expect(configResult.success).toBe(true);
  });

  describe('Offering Lifecycle Management', () => {
    it('should complete full offering lifecycle', async () => {
      // 1. Create offering with custom fields and variants
      const createRequest = {
        name: 'Chicken Tikka Masala',
        description: 'Creamy tomato-based curry with tender chicken pieces',
        basePrice: 18.99,
        category: 'main-course',
        customFieldValues: {
          spice_level: 'medium',
          allergens: ['dairy'],
          preparation_time: 25,
        },
        variants: [
          {
            name: 'Large Portion',
            description: 'Extra large serving',
            priceModifier: 5.00,
          },
          {
            name: 'Extra Spicy',
            description: 'With extra spices',
            priceModifier: 2.00,
          },
        ],
        availability: {
          isScheduled: true,
          duration: 30,
          capacity: 20,
          advanceBookingDays: 1,
          timeSlots: [
            { dayOfWeek: 1, startTime: '11:00', endTime: '22:00' },
            { dayOfWeek: 2, startTime: '11:00', endTime: '22:00' },
            { dayOfWeek: 3, startTime: '11:00', endTime: '22:00' },
          ],
        },
      };

      const createResult = await offeringService.createOffering(testTenantId, createRequest);
      expect(createResult.success).toBe(true);
      expect(createResult.data?.name).toBe('Chicken Tikka Masala');
      expect(createResult.data?.customFieldValues.spice_level).toBe('medium');
      expect(createResult.data?.businessTerminology.offering).toBe('Dish');

      testOfferingId = createResult.data!.id;

      // 2. Get offering and verify all data
      const getResult = await offeringService.getOffering(testTenantId, testOfferingId);
      expect(getResult.success).toBe(true);
      expect(getResult.data?.name).toBe('Chicken Tikka Masala');
      expect(getResult.data?.customFieldValues).toEqual({
        spice_level: 'medium',
        allergens: ['dairy'],
        preparation_time: 25,
      });

      // 3. Get variants
      const variantsResult = await offeringService.getOfferingVariants(testTenantId, testOfferingId);
      expect(variantsResult.success).toBe(true);
      expect(variantsResult.data).toHaveLength(2);
      expect(variantsResult.data?.[0].name).toBe('Large Portion');
      expect(variantsResult.data?.[0].priceModifier).toBe(5.00);

      // 4. Get availability
      const availabilityResult = await offeringService.getOfferingAvailability(testTenantId, testOfferingId);
      expect(availabilityResult.success).toBe(true);
      expect(availabilityResult.data?.isScheduled).toBe(true);
      expect(availabilityResult.data?.duration).toBe(30);
      expect(availabilityResult.data?.timeSlots).toHaveLength(3);

      // 5. Update offering
      const updateRequest = {
        name: 'Premium Chicken Tikka Masala',
        basePrice: 22.99,
        customFieldValues: {
          spice_level: 'hot',
          allergens: ['dairy', 'nuts'],
          preparation_time: 30,
        },
        variants: [
          {
            name: 'Family Size',
            description: 'Serves 4 people',
            priceModifier: 15.00,
          },
        ],
      };

      const updateResult = await offeringService.updateOffering(testTenantId, testOfferingId, updateRequest);
      expect(updateResult.success).toBe(true);
      expect(updateResult.data?.name).toBe('Premium Chicken Tikka Masala');
      expect(updateResult.data?.basePrice).toBe(22.99);
      expect(updateResult.data?.customFieldValues.spice_level).toBe('hot');

      // 6. Verify variants were updated
      const updatedVariantsResult = await offeringService.getOfferingVariants(testTenantId, testOfferingId);
      expect(updatedVariantsResult.success).toBe(true);
      expect(updatedVariantsResult.data).toHaveLength(1);
      expect(updatedVariantsResult.data?.[0].name).toBe('Family Size');

      // 7. List offerings with filters
      const listResult = await offeringService.listOfferings(testTenantId, {
        page: 1,
        limit: 10,
        category: 'main-course',
        search: 'tikka',
        isActive: true,
      });

      expect(listResult.success).toBe(true);
      expect(listResult.data?.data).toHaveLength(1);
      expect(listResult.data?.total).toBe(1);
      expect(listResult.data?.data[0].name).toBe('Premium Chicken Tikka Masala');

      // 8. Delete offering (should be soft delete since no transactions)
      const deleteResult = await offeringService.deleteOffering(testTenantId, testOfferingId);
      expect(deleteResult.success).toBe(true);

      // 9. Verify offering is deleted/deactivated
      const deletedResult = await offeringService.getOffering(testTenantId, testOfferingId);
      expect(deletedResult.success).toBe(false);
    });

    it('should handle multiple offerings with different configurations', async () => {
      // Create multiple offerings with different custom field configurations
      const offerings = [
        {
          name: 'Vegetable Curry',
          description: 'Mixed vegetable curry',
          basePrice: 14.99,
          category: 'main-course',
          customFieldValues: {
            spice_level: 'mild',
            allergens: [],
            preparation_time: 20,
          },
        },
        {
          name: 'Lamb Biryani',
          description: 'Aromatic rice dish with tender lamb',
          basePrice: 24.99,
          category: 'main-course',
          customFieldValues: {
            spice_level: 'hot',
            allergens: ['dairy'],
            preparation_time: 45,
          },
        },
        {
          name: 'Mango Lassi',
          description: 'Refreshing yogurt drink',
          basePrice: 4.99,
          category: 'beverage',
          customFieldValues: {
            allergens: ['dairy'],
            preparation_time: 5,
          },
        },
      ];

      const createdOfferings = [];
      for (const offering of offerings) {
        const result = await offeringService.createOffering(testTenantId, offering);
        expect(result.success).toBe(true);
        createdOfferings.push(result.data!);
      }

      // List all offerings
      const listResult = await offeringService.listOfferings(testTenantId);
      expect(listResult.success).toBe(true);
      expect(listResult.data?.data).toHaveLength(3);

      // Filter by category
      const mainCourseResult = await offeringService.listOfferings(testTenantId, {
        category: 'main-course',
      });
      expect(mainCourseResult.success).toBe(true);
      expect(mainCourseResult.data?.data).toHaveLength(2);

      // Search by name
      const searchResult = await offeringService.listOfferings(testTenantId, {
        search: 'curry',
      });
      expect(searchResult.success).toBe(true);
      expect(searchResult.data?.data).toHaveLength(1);
      expect(searchResult.data?.data[0].name).toBe('Vegetable Curry');

      // Sort by price
      const sortedResult = await offeringService.listOfferings(testTenantId, {
        sortBy: 'basePrice',
        sortOrder: 'desc',
      });
      expect(sortedResult.success).toBe(true);
      expect(sortedResult.data?.data[0].name).toBe('Lamb Biryani'); // Highest price
      expect(sortedResult.data?.data[2].name).toBe('Mango Lassi'); // Lowest price
    });
  });

  describe('Custom Field Validation', () => {
    it('should validate required custom fields', async () => {
      const invalidRequest = {
        name: 'Test Dish',
        description: 'Test description',
        basePrice: 10.00,
        customFieldValues: {
          spice_level: 'medium',
          allergens: ['nuts'],
          // Missing required preparation_time field
        },
      };

      const result = await offeringService.createOffering(testTenantId, invalidRequest);
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('CUSTOM_FIELD_VALIDATION_FAILED');
      expect(result.error?.details).toContain("Field 'Preparation Time (minutes)' is required");
    });

    it('should validate field types and constraints', async () => {
      const invalidRequest = {
        name: 'Test Dish',
        description: 'Test description',
        basePrice: 10.00,
        customFieldValues: {
          spice_level: 'super_hot', // Invalid option
          allergens: 'not-an-array', // Should be array
          preparation_time: 200, // Exceeds max value
        },
      };

      const result = await offeringService.createOffering(testTenantId, invalidRequest);
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('CUSTOM_FIELD_VALIDATION_FAILED');
      expect(result.error?.details).toContain("Field 'Spice Level' must be one of: mild, medium, hot");
      expect(result.error?.details).toContain("Field 'Allergens' must be an array");
      expect(result.error?.details).toContain("Field 'Preparation Time (minutes)' must be at most 120");
    });

    it('should allow valid custom field values', async () => {
      const validRequest = {
        name: 'Valid Dish',
        description: 'Valid description',
        basePrice: 15.00,
        customFieldValues: {
          spice_level: 'medium',
          allergens: ['dairy', 'gluten'],
          preparation_time: 30,
        },
      };

      const result = await offeringService.createOffering(testTenantId, validRequest);
      expect(result.success).toBe(true);
      expect(result.data?.customFieldValues).toEqual({
        spice_level: 'medium',
        allergens: ['dairy', 'gluten'],
        preparation_time: 30,
      });
    });
  });

  describe('Business Configuration Integration', () => {
    it('should fail to create offering without tenant configuration', async () => {
      // Create a new unconfigured tenant
      const unconfiguredTenantResult = await tenantService.createTenant({
        name: 'Unconfigured Tenant',
        email: 'unconfigured@test.com',
        phone: '+1234567891',
      });

      expect(unconfiguredTenantResult.success).toBe(true);
      const unconfiguredTenantId = unconfiguredTenantResult.data!.id;

      const offeringRequest = {
        name: 'Test Offering',
        description: 'Test description',
        basePrice: 10.00,
      };

      const result = await offeringService.createOffering(unconfiguredTenantId, offeringRequest);
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('TENANT_NOT_CONFIGURED');
    });

    it('should use business terminology in responses', async () => {
      const offeringRequest = {
        name: 'Test Dish',
        description: 'Test description',
        basePrice: 12.00,
        customFieldValues: {
          preparation_time: 15,
        },
      };

      const result = await offeringService.createOffering(testTenantId, offeringRequest);
      expect(result.success).toBe(true);
      expect(result.data?.businessTerminology).toEqual({
        offering: 'Dish',
        transaction: 'Order',
        customer: 'Diner',
      });
    });
  });

  describe('Analytics and Reporting', () => {
    beforeEach(async () => {
      // Create sample offerings for analytics
      const sampleOfferings = [
        {
          name: 'Chicken Curry',
          basePrice: 16.99,
          category: 'main-course',
          customFieldValues: { preparation_time: 25 },
        },
        {
          name: 'Vegetable Biryani',
          basePrice: 14.99,
          category: 'main-course',
          customFieldValues: { preparation_time: 30 },
        },
        {
          name: 'Samosa',
          basePrice: 6.99,
          category: 'appetizer',
          customFieldValues: { preparation_time: 10 },
        },
        {
          name: 'Mango Juice',
          basePrice: 3.99,
          category: 'beverage',
          customFieldValues: { preparation_time: 2 },
        },
      ];

      for (const offering of sampleOfferings) {
        const result = await offeringService.createOffering(testTenantId, offering);
        expect(result.success).toBe(true);
      }
    });

    it('should generate comprehensive analytics', async () => {
      const analyticsResult = await offeringService.getOfferingAnalytics(testTenantId);
      expect(analyticsResult.success).toBe(true);

      const analytics = analyticsResult.data!;
      expect(analytics.totalOfferings).toBe(4);
      expect(analytics.activeOfferings).toBe(4);
      expect(analytics.averagePrice).toBeCloseTo(10.74, 2);
      expect(analytics.popularCategories).toHaveLength(3);
      expect(analytics.popularCategories[0].category).toBe('main-course');
      expect(analytics.popularCategories[0].count).toBe(2);
      expect(analytics.customFieldUsage).toContainEqual({
        fieldName: 'preparation_time',
        usageCount: 4,
      });
    });
  });

  describe('Legacy Service Migration', () => {
    beforeEach(async () => {
      // Create some legacy services
      await testDb.insert(testDb.schema.services).values([
        {
          tenantId: testTenantId,
          name: 'Haircut',
          description: 'Professional haircut service',
          price: 25.00,
          isActive: true,
          icon: 'scissors',
        },
        {
          tenantId: testTenantId,
          name: 'Hair Wash',
          description: 'Hair washing and conditioning',
          price: 15.00,
          isActive: true,
          icon: 'water',
        },
        {
          tenantId: testTenantId,
          name: 'Beard Trim',
          description: 'Beard trimming and styling',
          price: 12.00,
          isActive: false,
          icon: 'beard',
        },
      ]);
    });

    it('should migrate legacy services to offerings', async () => {
      const migrationResult = await offeringService.migrateLegacyServices(testTenantId);
      expect(migrationResult.success).toBe(true);
      expect(migrationResult.data?.migratedCount).toBe(3);
      expect(migrationResult.data?.skippedCount).toBe(0);
      expect(migrationResult.data?.errors).toHaveLength(0);

      // Verify offerings were created
      const listResult = await offeringService.listOfferings(testTenantId);
      expect(listResult.success).toBe(true);
      expect(listResult.data?.data).toHaveLength(3);

      // Check migration metadata
      const haircutOffering = listResult.data?.data.find(o => o.name === 'Haircut');
      expect(haircutOffering).toBeDefined();
      expect(haircutOffering?.category).toBe('migrated');
      expect(haircutOffering?.metadata.migratedFromServiceId).toBeDefined();
      expect(haircutOffering?.metadata.originalIcon).toBe('scissors');
    });

    it('should skip already migrated services', async () => {
      // Run migration once
      await offeringService.migrateLegacyServices(testTenantId);

      // Run migration again
      const secondMigrationResult = await offeringService.migrateLegacyServices(testTenantId);
      expect(secondMigrationResult.success).toBe(true);
      expect(secondMigrationResult.data?.migratedCount).toBe(0);
      expect(secondMigrationResult.data?.skippedCount).toBe(3);
    });
  });

  describe('Error Handling', () => {
    it('should handle tenant not found', async () => {
      const result = await offeringService.getOffering('nonexistent-tenant', 'some-offering');
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('OFFERING_NOT_FOUND');
    });

    it('should handle offering not found', async () => {
      const result = await offeringService.getOffering(testTenantId, 'nonexistent-offering');
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('OFFERING_NOT_FOUND');
    });

    it('should handle database errors gracefully', async () => {
      // Close the database connection to simulate a database error
      await offeringService.cleanup();

      const result = await offeringService.createOffering(testTenantId, {
        name: 'Test Offering',
        description: 'Test description',
        basePrice: 10.00,
        customFieldValues: { preparation_time: 15 },
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('OFFERING_CREATE_FAILED');

      // Recreate the service for cleanup
      offeringService = new OfferingManagementService(process.env.TEST_DATABASE_URL!);
    });
  });
});