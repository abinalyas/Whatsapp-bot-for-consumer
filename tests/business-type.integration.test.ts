/**
 * Business Type Service Integration Tests
 * Tests complete business type management workflows
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BusinessTypeService } from '../server/services/business-type.service';
import type { BusinessType } from '@shared/schema';

// Mock database connection
const mockConnectionString = 'postgresql://test:test@localhost:5432/test';

// Mock business types data
const mockBusinessTypes = new Map<string, BusinessType>();

// Mock database with realistic behavior
const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  groupBy: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  returning: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
};

const mockPool = {
  end: vi.fn(),
};

// Mock implementation with realistic data operations
vi.mocked(mockDb.select).mockImplementation(() => {
  const mockQuery = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    groupBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockImplementation((limit: number) => {
      // Return first item for single queries
      if (limit === 1) {
        const firstItem = Array.from(mockBusinessTypes.values())[0];
        return Promise.resolve(firstItem ? [firstItem] : []);
      }
      return Promise.resolve(Array.from(mockBusinessTypes.values()));
    }),
  };

  // Default behavior - return all business types
  Object.assign(mockQuery, {
    then: (callback: (value: BusinessType[]) => any) => {
      return callback(Array.from(mockBusinessTypes.values()));
    },
  });

  return mockQuery;
});

vi.mocked(mockDb.insert).mockImplementation(() => ({
  values: vi.fn().mockReturnThis(),
  returning: vi.fn().mockImplementation(() => {
    const newBusinessType: BusinessType = {
      id: `bt-${Date.now()}`,
      name: 'test_business',
      displayName: 'Test Business',
      category: 'test',
      description: 'Test business type',
      terminology: {},
      defaultConfig: {},
      isSystem: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockBusinessTypes.set(newBusinessType.id, newBusinessType);
    return Promise.resolve([newBusinessType]);
  }),
}));

vi.mocked(mockDb.update).mockImplementation(() => ({
  set: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  returning: vi.fn().mockImplementation(() => {
    const businessType = Array.from(mockBusinessTypes.values())[0];
    if (businessType) {
      const updated = { ...businessType, updatedAt: new Date() };
      mockBusinessTypes.set(businessType.id, updated);
      return Promise.resolve([updated]);
    }
    return Promise.resolve([]);
  }),
}));

vi.mocked(mockDb.delete).mockImplementation(() => ({
  where: vi.fn().mockImplementation(() => {
    // Clear all for simplicity in tests
    mockBusinessTypes.clear();
    return Promise.resolve();
  }),
}));

vi.mock('@neondatabase/serverless', () => ({
  Pool: vi.fn(() => mockPool),
}));

vi.mock('drizzle-orm/neon-serverless', () => ({
  drizzle: vi.fn(() => mockDb),
}));

describe('Business Type Service Integration', () => {
  let businessTypeService: BusinessTypeService;

  beforeEach(() => {
    businessTypeService = new BusinessTypeService(mockConnectionString);
    mockBusinessTypes.clear();
    
    // Add some default business types
    const systemBusinessTypes: BusinessType[] = [
      {
        id: 'bt-restaurant',
        name: 'restaurant',
        displayName: 'Restaurant',
        category: 'hospitality',
        description: 'Restaurant business type',
        terminology: {
          offering: 'Menu Item',
          transaction: 'Reservation',
          customer: 'Guest',
        },
        defaultConfig: {
          requiresScheduling: true,
          defaultDuration: 120,
        },
        isSystem: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'bt-clinic',
        name: 'clinic',
        displayName: 'Medical Clinic',
        category: 'healthcare',
        description: 'Healthcare clinic',
        terminology: {
          offering: 'Treatment',
          transaction: 'Appointment',
          customer: 'Patient',
        },
        defaultConfig: {
          requiresScheduling: true,
          defaultDuration: 30,
        },
        isSystem: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'bt-retail',
        name: 'retail_store',
        displayName: 'Retail Store',
        category: 'retail',
        description: 'Retail business',
        terminology: {
          offering: 'Product',
          transaction: 'Order',
          customer: 'Customer',
        },
        defaultConfig: {
          requiresScheduling: false,
          supportsInventory: true,
        },
        isSystem: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    systemBusinessTypes.forEach(bt => {
      mockBusinessTypes.set(bt.id, bt);
    });

    vi.clearAllMocks();
  });

  afterEach(async () => {
    await businessTypeService.close();
  });

  describe('Complete Business Type Lifecycle', () => {
    it('should handle complete CRUD workflow', async () => {
      // 1. Get all business types (should have system types)
      const allTypesResult = await businessTypeService.getBusinessTypes();
      expect(allTypesResult.success).toBe(true);
      expect(allTypesResult.data!.length).toBe(3);

      // 2. Create a custom business type
      const createResult = await businessTypeService.createBusinessType({
        name: 'custom_salon',
        displayName: 'Custom Salon',
        category: 'service',
        description: 'Custom salon business',
        terminology: {
          offering: 'Service',
          transaction: 'Booking',
          customer: 'Client',
        },
        defaultConfig: {
          requiresScheduling: true,
          defaultDuration: 60,
        },
      });

      expect(createResult.success).toBe(true);
      expect(createResult.data?.name).toBe('custom_salon');
      expect(createResult.data?.isSystem).toBe(false);

      const customBusinessTypeId = createResult.data!.id;

      // 3. Get the created business type
      const getResult = await businessTypeService.getBusinessType(customBusinessTypeId);
      expect(getResult.success).toBe(true);
      expect(getResult.data?.displayName).toBe('Custom Salon');

      // 4. Update the business type
      const updateResult = await businessTypeService.updateBusinessType(customBusinessTypeId, {
        displayName: 'Updated Custom Salon',
        description: 'Updated description',
      });

      expect(updateResult.success).toBe(true);
      expect(updateResult.data?.displayName).toBe('Updated Custom Salon');

      // 5. Delete the business type
      const deleteResult = await businessTypeService.deleteBusinessType(customBusinessTypeId);
      expect(deleteResult.success).toBe(true);

      // 6. Verify deletion
      const getDeletedResult = await businessTypeService.getBusinessType(customBusinessTypeId);
      expect(getDeletedResult.success).toBe(false);
    });

    it('should prevent operations on system business types', async () => {
      const systemBusinessType = Array.from(mockBusinessTypes.values()).find(bt => bt.isSystem);
      expect(systemBusinessType).toBeDefined();

      // Try to update system business type
      const updateResult = await businessTypeService.updateBusinessType(systemBusinessType!.id, {
        displayName: 'Updated System Type',
      });

      expect(updateResult.success).toBe(false);
      expect(updateResult.error?.code).toBe('SYSTEM_BUSINESS_TYPE_UPDATE_FORBIDDEN');

      // Try to delete system business type
      const deleteResult = await businessTypeService.deleteBusinessType(systemBusinessType!.id);

      expect(deleteResult.success).toBe(false);
      expect(deleteResult.error?.code).toBe('SYSTEM_BUSINESS_TYPE_DELETE_FORBIDDEN');
    });
  });

  describe('Business Type Templates Integration', () => {
    it('should provide comprehensive templates for different business models', async () => {
      const templatesResult = await businessTypeService.getBusinessTypeTemplates();

      expect(templatesResult.success).toBe(true);
      expect(templatesResult.data!.length).toBeGreaterThan(0);

      // Verify each template has complete configuration
      templatesResult.data!.forEach(template => {
        expect(template.id).toBeDefined();
        expect(template.name).toBeDefined();
        expect(template.displayName).toBeDefined();
        expect(template.category).toBeDefined();
        expect(template.terminology).toBeDefined();
        expect(template.defaultConfig).toBeDefined();
        expect(template.customFields).toBeDefined();
        expect(template.workflowStates).toBeDefined();

        // Verify terminology completeness
        expect(template.terminology.offering).toBeDefined();
        expect(template.terminology.transaction).toBeDefined();
        expect(template.terminology.customer).toBeDefined();

        // Verify workflow states have required fields
        template.workflowStates.forEach(state => {
          expect(state.name).toBeDefined();
          expect(state.displayName).toBeDefined();
          expect(state.stateType).toBeDefined();
          expect(state.color).toBeDefined();
        });

        // Verify custom fields have required structure
        template.customFields.forEach(field => {
          expect(field.entityType).toBeDefined();
          expect(field.name).toBeDefined();
          expect(field.label).toBeDefined();
          expect(field.fieldType).toBeDefined();
          expect(typeof field.isRequired).toBe('boolean');
        });
      });
    });

    it('should create business types from templates with proper configuration', async () => {
      // Test restaurant template
      const restaurantResult = await businessTypeService.createBusinessTypeFromTemplate('restaurant');

      expect(restaurantResult.success).toBe(true);
      expect(restaurantResult.data?.name).toBe('restaurant');
      expect(restaurantResult.data?.category).toBe('hospitality');
      expect(restaurantResult.data?.terminology.offering).toBe('Menu Item');
      expect(restaurantResult.data?.terminology.transaction).toBe('Reservation');

      // Test clinic template
      const clinicResult = await businessTypeService.createBusinessTypeFromTemplate('clinic');

      expect(clinicResult.success).toBe(true);
      expect(clinicResult.data?.name).toBe('clinic');
      expect(clinicResult.data?.category).toBe('healthcare');
      expect(clinicResult.data?.terminology.offering).toBe('Treatment');
      expect(clinicResult.data?.terminology.transaction).toBe('Appointment');

      // Test retail template
      const retailResult = await businessTypeService.createBusinessTypeFromTemplate('retail_store');

      expect(retailResult.success).toBe(true);
      expect(retailResult.data?.name).toBe('retail_store');
      expect(retailResult.data?.category).toBe('retail');
      expect(retailResult.data?.terminology.offering).toBe('Product');
      expect(retailResult.data?.terminology.transaction).toBe('Order');
    });

    it('should create customized business types from templates', async () => {
      const customizations = {
        name: 'my_restaurant',
        displayName: 'My Fine Dining Restaurant',
        description: 'Upscale restaurant with custom requirements',
        terminology: {
          offering: 'Dish',
          transaction: 'Table Booking',
          customer: 'Diner',
        },
      };

      const result = await businessTypeService.createBusinessTypeFromTemplate(
        'restaurant',
        customizations
      );

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('my_restaurant');
      expect(result.data?.displayName).toBe('My Fine Dining Restaurant');
      expect(result.data?.terminology.offering).toBe('Dish');
      expect(result.data?.terminology.transaction).toBe('Table Booking');
    });

    it('should handle template-specific business logic', async () => {
      // Get restaurant template
      const restaurantTemplate = await businessTypeService.getBusinessTypeTemplate('restaurant');
      expect(restaurantTemplate.success).toBe(true);

      const template = restaurantTemplate.data!;

      // Verify restaurant-specific configuration
      expect(template.defaultConfig.requires_scheduling).toBe(true);
      expect(template.defaultConfig.default_duration).toBe(120);
      expect(template.defaultConfig.supports_capacity).toBe(true);

      // Verify restaurant-specific custom fields
      const partySizeField = template.customFields.find(f => f.name === 'party_size');
      expect(partySizeField).toBeDefined();
      expect(partySizeField?.fieldType).toBe('number');
      expect(partySizeField?.isRequired).toBe(true);

      const dietaryField = template.customFields.find(f => f.name === 'dietary_restrictions');
      expect(dietaryField).toBeDefined();
      expect(dietaryField?.fieldType).toBe('multiselect');
      expect(dietaryField?.fieldOptions).toBeDefined();

      // Verify restaurant-specific workflow states
      const workflowStateNames = template.workflowStates.map(s => s.name);
      expect(workflowStateNames).toContain('seated');
      expect(workflowStateNames).toContain('no_show');

      // Get clinic template for comparison
      const clinicTemplate = await businessTypeService.getBusinessTypeTemplate('clinic');
      expect(clinicTemplate.success).toBe(true);

      const clinicData = clinicTemplate.data!;

      // Verify clinic-specific configuration
      expect(clinicData.defaultConfig.default_duration).toBe(30);
      expect(clinicData.defaultConfig.supports_staff).toBe(true);

      // Verify clinic-specific workflow states
      const clinicStateNames = clinicData.workflowStates.map(s => s.name);
      expect(clinicStateNames).toContain('checked_in');
      expect(clinicStateNames).toContain('in_progress');
      expect(clinicStateNames).toContain('rescheduled');
    });
  });

  describe('Business Type Categories and Search', () => {
    it('should organize business types by categories', async () => {
      const categoriesResult = await businessTypeService.getBusinessTypeCategories();

      expect(categoriesResult.success).toBe(true);
      expect(categoriesResult.data!.length).toBeGreaterThan(0);

      // Should have different categories
      const categories = categoriesResult.data!.map(c => c.category);
      expect(categories).toContain('hospitality');
      expect(categories).toContain('healthcare');
      expect(categories).toContain('retail');

      // Each category should have a count
      categoriesResult.data!.forEach(category => {
        expect(category.count).toBeGreaterThan(0);
      });
    });

    it('should filter business types by category', async () => {
      const hospitalityResult = await businessTypeService.getBusinessTypesByCategory('hospitality');

      expect(hospitalityResult.success).toBe(true);
      expect(hospitalityResult.data!.length).toBeGreaterThan(0);
      expect(hospitalityResult.data!.every(bt => bt.category === 'hospitality')).toBe(true);

      const healthcareResult = await businessTypeService.getBusinessTypesByCategory('healthcare');

      expect(healthcareResult.success).toBe(true);
      expect(healthcareResult.data!.length).toBeGreaterThan(0);
      expect(healthcareResult.data!.every(bt => bt.category === 'healthcare')).toBe(true);
    });

    it('should search business types effectively', async () => {
      const searchResult = await businessTypeService.searchBusinessTypes('restaurant');

      expect(searchResult.success).toBe(true);
      
      // Should find restaurant-related business types
      const hasRestaurantResults = searchResult.data!.some(bt => 
        bt.displayName.toLowerCase().includes('restaurant') ||
        bt.description?.toLowerCase().includes('restaurant')
      );
      expect(hasRestaurantResults).toBe(true);
    });
  });

  describe('Business Model Flexibility', () => {
    it('should support different business model configurations', async () => {
      const businessModels = [
        {
          name: 'subscription_service',
          displayName: 'Subscription Service',
          category: 'service',
          terminology: {
            offering: 'Plan',
            transaction: 'Subscription',
            customer: 'Subscriber',
          },
          defaultConfig: {
            requiresScheduling: false,
            supportsRecurring: true,
            billingCycle: 'monthly',
          },
        },
        {
          name: 'event_venue',
          displayName: 'Event Venue',
          category: 'hospitality',
          terminology: {
            offering: 'Venue Package',
            transaction: 'Event Booking',
            customer: 'Event Organizer',
          },
          defaultConfig: {
            requiresScheduling: true,
            defaultDuration: 480, // 8 hours
            supportsCapacity: true,
            requiresDeposit: true,
          },
        },
        {
          name: 'online_course',
          displayName: 'Online Course Platform',
          category: 'education',
          terminology: {
            offering: 'Course',
            transaction: 'Enrollment',
            customer: 'Student',
          },
          defaultConfig: {
            requiresScheduling: false,
            supportsDigitalDelivery: true,
            supportsCertificates: true,
          },
        },
      ];

      // Create each business model
      for (const model of businessModels) {
        const result = await businessTypeService.createBusinessType(model);
        expect(result.success).toBe(true);
        expect(result.data?.terminology).toEqual(model.terminology);
        expect(result.data?.defaultConfig).toEqual(model.defaultConfig);
      }
    });

    it('should handle complex terminology configurations', async () => {
      const complexTerminology = {
        offering: 'Learning Module',
        transaction: 'Course Registration',
        customer: 'Learner',
        plural_offering: 'Learning Modules',
        plural_transaction: 'Course Registrations',
        staff: 'Instructor',
        location: 'Virtual Classroom',
        duration: 'Session Length',
        capacity: 'Class Size',
      };

      const result = await businessTypeService.createBusinessType({
        name: 'online_education',
        displayName: 'Online Education Platform',
        category: 'education',
        terminology: complexTerminology,
        defaultConfig: {
          supportsVirtualDelivery: true,
          requiresPrerequisites: true,
          supportsCertification: true,
        },
      });

      expect(result.success).toBe(true);
      expect(result.data?.terminology).toEqual(complexTerminology);
    });
  });

  describe('Error Scenarios and Edge Cases', () => {
    it('should handle duplicate name prevention', async () => {
      // Create first business type
      const firstResult = await businessTypeService.createBusinessType({
        name: 'duplicate_test',
        displayName: 'First Business',
        category: 'test',
        terminology: {},
        defaultConfig: {},
      });

      expect(firstResult.success).toBe(true);

      // Try to create second with same name
      const secondResult = await businessTypeService.createBusinessType({
        name: 'duplicate_test',
        displayName: 'Second Business',
        category: 'test',
        terminology: {},
        defaultConfig: {},
      });

      expect(secondResult.success).toBe(false);
      expect(secondResult.error?.code).toBe('BUSINESS_TYPE_NAME_EXISTS');
    });

    it('should handle non-existent business type operations', async () => {
      const nonExistentId = 'bt-nonexistent';

      // Get non-existent business type
      const getResult = await businessTypeService.getBusinessType(nonExistentId);
      expect(getResult.success).toBe(false);
      expect(getResult.error?.code).toBe('BUSINESS_TYPE_NOT_FOUND');

      // Update non-existent business type
      const updateResult = await businessTypeService.updateBusinessType(nonExistentId, {
        displayName: 'Updated',
      });
      expect(updateResult.success).toBe(false);

      // Delete non-existent business type
      const deleteResult = await businessTypeService.deleteBusinessType(nonExistentId);
      expect(deleteResult.success).toBe(false);
    });

    it('should handle invalid template operations', async () => {
      const invalidTemplateResult = await businessTypeService.getBusinessTypeTemplate('nonexistent');
      expect(invalidTemplateResult.success).toBe(false);
      expect(invalidTemplateResult.error?.code).toBe('TEMPLATE_NOT_FOUND');

      const createFromInvalidResult = await businessTypeService.createBusinessTypeFromTemplate('nonexistent');
      expect(createFromInvalidResult.success).toBe(false);
    });
  });
});