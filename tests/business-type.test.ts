/**
 * Business Type Service Unit Tests
 * Tests business type management and template functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BusinessTypeService, CreateBusinessTypeRequest } from '../server/services/business-type.service';
import type { BusinessType } from '@shared/schema';

// Mock database connection
const mockConnectionString = 'postgresql://test:test@localhost:5432/test';

// Mock business type data
const mockBusinessType: BusinessType = {
  id: 'bt-123',
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
};

// Mock database operations
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

vi.mock('@neondatabase/serverless', () => ({
  Pool: vi.fn(() => mockPool),
}));

vi.mock('drizzle-orm/neon-serverless', () => ({
  drizzle: vi.fn(() => mockDb),
}));

describe('BusinessTypeService', () => {
  let businessTypeService: BusinessTypeService;

  beforeEach(() => {
    businessTypeService = new BusinessTypeService(mockConnectionString);
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await businessTypeService.close();
  });

  describe('Business Type CRUD Operations', () => {
    it('should get all business types', async () => {
      // Mock database response
      vi.mocked(mockDb.select).mockResolvedValueOnce([mockBusinessType]);

      const result = await businessTypeService.getBusinessTypes();

      expect(result.success).toBe(true);
      expect(result.data).toEqual([mockBusinessType]);
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.from).toHaveBeenCalled();
      expect(mockDb.orderBy).toHaveBeenCalled();
    });

    it('should get business types including inactive ones', async () => {
      const inactiveBusinessType = { ...mockBusinessType, isActive: false };
      vi.mocked(mockDb.select).mockResolvedValueOnce([mockBusinessType, inactiveBusinessType]);

      const result = await businessTypeService.getBusinessTypes(true);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
    });

    it('should get business type by ID', async () => {
      vi.mocked(mockDb.select).mockResolvedValueOnce([mockBusinessType]);

      const result = await businessTypeService.getBusinessType('bt-123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockBusinessType);
      expect(mockDb.where).toHaveBeenCalled();
      expect(mockDb.limit).toHaveBeenCalledWith(1);
    });

    it('should return error when business type not found', async () => {
      vi.mocked(mockDb.select).mockResolvedValueOnce([]);

      const result = await businessTypeService.getBusinessType('nonexistent');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('BUSINESS_TYPE_NOT_FOUND');
    });

    it('should get business types by category', async () => {
      vi.mocked(mockDb.select).mockResolvedValueOnce([mockBusinessType]);

      const result = await businessTypeService.getBusinessTypesByCategory('hospitality');

      expect(result.success).toBe(true);
      expect(result.data).toEqual([mockBusinessType]);
      expect(mockDb.where).toHaveBeenCalled();
    });

    it('should create a new business type', async () => {
      const createRequest: CreateBusinessTypeRequest = {
        name: 'custom_business',
        displayName: 'Custom Business',
        category: 'custom',
        description: 'Custom business type',
        terminology: {
          offering: 'Item',
          transaction: 'Order',
          customer: 'Client',
        },
        defaultConfig: {
          requiresScheduling: false,
        },
      };

      // Mock check for existing name (none found)
      vi.mocked(mockDb.select).mockResolvedValueOnce([]);
      // Mock insert operation
      vi.mocked(mockDb.returning).mockResolvedValueOnce([{
        ...mockBusinessType,
        ...createRequest,
        id: 'bt-new',
        isSystem: false,
      }]);

      const result = await businessTypeService.createBusinessType(createRequest);

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('custom_business');
      expect(result.data?.isSystem).toBe(false);
      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockDb.values).toHaveBeenCalled();
      expect(mockDb.returning).toHaveBeenCalled();
    });

    it('should reject creating business type with duplicate name', async () => {
      const createRequest: CreateBusinessTypeRequest = {
        name: 'restaurant', // Duplicate name
        displayName: 'Another Restaurant',
        category: 'hospitality',
        terminology: {},
        defaultConfig: {},
      };

      // Mock existing business type found
      vi.mocked(mockDb.select).mockResolvedValueOnce([mockBusinessType]);

      const result = await businessTypeService.createBusinessType(createRequest);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('BUSINESS_TYPE_NAME_EXISTS');
    });

    it('should update a business type', async () => {
      const updateData = {
        displayName: 'Updated Restaurant',
        description: 'Updated description',
      };

      // Mock get business type (non-system)
      const nonSystemBusinessType = { ...mockBusinessType, isSystem: false };
      vi.mocked(mockDb.select).mockResolvedValueOnce([nonSystemBusinessType]);
      
      // Mock update operation
      vi.mocked(mockDb.returning).mockResolvedValueOnce([{
        ...nonSystemBusinessType,
        ...updateData,
      }]);

      const result = await businessTypeService.updateBusinessType('bt-123', updateData);

      expect(result.success).toBe(true);
      expect(result.data?.displayName).toBe('Updated Restaurant');
      expect(mockDb.update).toHaveBeenCalled();
      expect(mockDb.set).toHaveBeenCalled();
      expect(mockDb.returning).toHaveBeenCalled();
    });

    it('should prevent updating system business types', async () => {
      // Mock get business type (system type)
      vi.mocked(mockDb.select).mockResolvedValueOnce([mockBusinessType]);

      const result = await businessTypeService.updateBusinessType('bt-123', {
        displayName: 'Updated',
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('SYSTEM_BUSINESS_TYPE_UPDATE_FORBIDDEN');
    });

    it('should delete a business type', async () => {
      // Mock get business type (non-system)
      const nonSystemBusinessType = { ...mockBusinessType, isSystem: false };
      vi.mocked(mockDb.select)
        .mockResolvedValueOnce([nonSystemBusinessType]) // Get business type
        .mockResolvedValueOnce([]); // Check tenants using type (none)

      // Mock delete operation
      vi.mocked(mockDb.delete).mockResolvedValueOnce(undefined);

      const result = await businessTypeService.deleteBusinessType('bt-123');

      expect(result.success).toBe(true);
      expect(mockDb.delete).toHaveBeenCalled();
    });

    it('should prevent deleting system business types', async () => {
      // Mock get business type (system type)
      vi.mocked(mockDb.select).mockResolvedValueOnce([mockBusinessType]);

      const result = await businessTypeService.deleteBusinessType('bt-123');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('SYSTEM_BUSINESS_TYPE_DELETE_FORBIDDEN');
    });

    it('should prevent deleting business type in use by tenants', async () => {
      // Mock get business type (non-system)
      const nonSystemBusinessType = { ...mockBusinessType, isSystem: false };
      vi.mocked(mockDb.select)
        .mockResolvedValueOnce([nonSystemBusinessType]) // Get business type
        .mockResolvedValueOnce([{ id: 'tenant-1' }]); // Tenants using type

      const result = await businessTypeService.deleteBusinessType('bt-123');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('BUSINESS_TYPE_IN_USE');
    });
  });

  describe('Business Type Templates', () => {
    it('should get all business type templates', async () => {
      const result = await businessTypeService.getBusinessTypeTemplates();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.length).toBeGreaterThan(0);
      
      // Check that restaurant template exists
      const restaurantTemplate = result.data!.find(t => t.id === 'restaurant');
      expect(restaurantTemplate).toBeDefined();
      expect(restaurantTemplate?.terminology.offering).toBe('Menu Item');
      expect(restaurantTemplate?.terminology.transaction).toBe('Reservation');
    });

    it('should get specific business type template', async () => {
      const result = await businessTypeService.getBusinessTypeTemplate('restaurant');

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('restaurant');
      expect(result.data?.displayName).toBe('Restaurant');
      expect(result.data?.category).toBe('hospitality');
      expect(result.data?.customFields).toBeDefined();
      expect(result.data?.workflowStates).toBeDefined();
    });

    it('should return error for non-existent template', async () => {
      const result = await businessTypeService.getBusinessTypeTemplate('nonexistent');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('TEMPLATE_NOT_FOUND');
    });

    it('should create business type from template', async () => {
      // Mock check for existing name (none found)
      vi.mocked(mockDb.select).mockResolvedValueOnce([]);
      
      // Mock insert operation
      vi.mocked(mockDb.returning).mockResolvedValueOnce([{
        id: 'bt-new',
        name: 'restaurant',
        displayName: 'Restaurant',
        category: 'hospitality',
        terminology: {
          offering: 'Menu Item',
          transaction: 'Reservation',
          customer: 'Guest',
        },
        defaultConfig: {
          offering_types: ['appetizer', 'main_course', 'dessert', 'beverage'],
          requires_scheduling: true,
        },
        isSystem: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }]);

      const result = await businessTypeService.createBusinessTypeFromTemplate('restaurant');

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('restaurant');
      expect(result.data?.isSystem).toBe(false);
    });

    it('should create business type from template with customizations', async () => {
      const customizations = {
        name: 'my_restaurant',
        displayName: 'My Restaurant',
        description: 'My custom restaurant',
      };

      // Mock check for existing name (none found)
      vi.mocked(mockDb.select).mockResolvedValueOnce([]);
      
      // Mock insert operation
      vi.mocked(mockDb.returning).mockResolvedValueOnce([{
        id: 'bt-custom',
        ...customizations,
        category: 'hospitality',
        terminology: {
          offering: 'Menu Item',
          transaction: 'Reservation',
          customer: 'Guest',
        },
        defaultConfig: {},
        isSystem: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }]);

      const result = await businessTypeService.createBusinessTypeFromTemplate(
        'restaurant',
        customizations
      );

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('my_restaurant');
      expect(result.data?.displayName).toBe('My Restaurant');
    });

    it('should validate template structure', async () => {
      const templates = await businessTypeService.getBusinessTypeTemplates();
      expect(templates.success).toBe(true);

      // Validate each template has required fields
      templates.data!.forEach(template => {
        expect(template.id).toBeDefined();
        expect(template.name).toBeDefined();
        expect(template.displayName).toBeDefined();
        expect(template.category).toBeDefined();
        expect(template.terminology).toBeDefined();
        expect(template.terminology.offering).toBeDefined();
        expect(template.terminology.transaction).toBeDefined();
        expect(template.terminology.customer).toBeDefined();
        expect(template.defaultConfig).toBeDefined();
        expect(template.customFields).toBeDefined();
        expect(template.workflowStates).toBeDefined();
      });
    });
  });

  describe('Utility Methods', () => {
    it('should get business type categories', async () => {
      // Mock categories query
      vi.mocked(mockDb.select).mockResolvedValueOnce([
        { category: 'hospitality' },
        { category: 'healthcare' },
        { category: 'retail' },
      ]);

      // Mock count queries
      vi.mocked(mockDb.select)
        .mockResolvedValueOnce([{ count: '2' }]) // hospitality
        .mockResolvedValueOnce([{ count: '1' }]) // healthcare
        .mockResolvedValueOnce([{ count: '3' }]); // retail

      const result = await businessTypeService.getBusinessTypeCategories();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(3);
      expect(result.data![0]).toHaveProperty('category');
      expect(result.data![0]).toHaveProperty('count');
    });

    it('should search business types', async () => {
      const searchResults = [
        mockBusinessType,
        {
          ...mockBusinessType,
          id: 'bt-2',
          name: 'clinic',
          displayName: 'Medical Clinic',
          category: 'healthcare',
        },
      ];

      vi.mocked(mockDb.select).mockResolvedValueOnce(searchResults);

      const result = await businessTypeService.searchBusinessTypes('restaurant');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      // Should filter to only restaurant-related results
      const filteredResults = result.data!.filter(bt => 
        bt.displayName.toLowerCase().includes('restaurant')
      );
      expect(filteredResults.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // Mock database error
      vi.mocked(mockDb.select).mockRejectedValueOnce(new Error('Database error'));

      const result = await businessTypeService.getBusinessTypes();

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('BUSINESS_TYPES_FETCH_FAILED');
    });

    it('should handle create errors gracefully', async () => {
      const createRequest: CreateBusinessTypeRequest = {
        name: 'test',
        displayName: 'Test',
        category: 'test',
        terminology: {},
        defaultConfig: {},
      };

      // Mock check for existing name (none found)
      vi.mocked(mockDb.select).mockResolvedValueOnce([]);
      // Mock insert error
      vi.mocked(mockDb.returning).mockRejectedValueOnce(new Error('Insert error'));

      const result = await businessTypeService.createBusinessType(createRequest);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('BUSINESS_TYPE_CREATE_FAILED');
    });

    it('should handle update errors gracefully', async () => {
      // Mock get business type (non-system)
      const nonSystemBusinessType = { ...mockBusinessType, isSystem: false };
      vi.mocked(mockDb.select).mockResolvedValueOnce([nonSystemBusinessType]);
      
      // Mock update error
      vi.mocked(mockDb.returning).mockRejectedValueOnce(new Error('Update error'));

      const result = await businessTypeService.updateBusinessType('bt-123', {
        displayName: 'Updated',
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('BUSINESS_TYPE_UPDATE_FAILED');
    });
  });

  describe('Resource Cleanup', () => {
    it('should cleanup resources properly on close', async () => {
      await businessTypeService.close();

      expect(mockPool.end).toHaveBeenCalled();
    });
  });
});