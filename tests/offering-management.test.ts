/**
 * Unit tests for OfferingManagementService
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { OfferingManagementService } from '../server/services/offering-management.service';
import { TenantBusinessConfigService } from '../server/services/tenant-business-config.service';

// Mock the database and services
vi.mock('drizzle-orm/neon-serverless');
vi.mock('@neondatabase/serverless');
vi.mock('../server/services/tenant-business-config.service');

describe('OfferingManagementService', () => {
  let service: OfferingManagementService;
  let mockConfigService: vi.Mocked<TenantBusinessConfigService>;
  let mockDb: any;

  const mockTenantId = 'tenant-1';
  const mockOfferingId = 'offering-1';

  const mockBusinessConfig = {
    tenantId: mockTenantId,
    businessType: {
      id: 'business-type-1',
      name: 'restaurant',
      displayName: 'Restaurant',
      category: 'hospitality',
    },
    terminology: {
      offering: 'Menu Item',
      transaction: 'Order',
      customer: 'Guest',
    },
    configuration: {
      requiresScheduling: true,
      defaultDuration: 60,
    },
    customFields: [
      {
        id: 'field-1',
        tenantId: mockTenantId,
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
        isActive: true,
      },
    ],
    workflowStates: [],
    isConfigured: true,
  };

  const mockOffering = {
    id: mockOfferingId,
    tenantId: mockTenantId,
    name: 'Chicken Curry',
    description: 'Delicious chicken curry with rice',
    basePrice: 15.99,
    category: 'main-course',
    isActive: true,
    metadata: {},
    customFieldValues: { spice_level: 'medium' },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    // Setup mocks
    mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      offset: vi.fn().mockReturnThis(),
      groupBy: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
    };

    mockConfigService = {
      getTenantBusinessConfig: vi.fn(),
      getCustomFieldsByEntityType: vi.fn(),
      cleanup: vi.fn(),
    } as any;

    // Mock the constructor dependencies
    vi.mocked(TenantBusinessConfigService).mockImplementation(() => mockConfigService);

    service = new OfferingManagementService('mock-connection-string');
    (service as any).db = mockDb;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createOffering', () => {
    const createRequest = {
      name: 'Chicken Curry',
      description: 'Delicious chicken curry with rice',
      basePrice: 15.99,
      category: 'main-course',
      customFieldValues: { spice_level: 'medium' },
      variants: [
        {
          name: 'Large',
          description: 'Large portion',
          priceModifier: 5.00,
        },
      ],
      availability: {
        isScheduled: true,
        duration: 30,
        capacity: 10,
      },
    };

    it('should create offering successfully', async () => {
      // Setup mocks
      mockConfigService.getTenantBusinessConfig.mockResolvedValue({
        success: true,
        data: mockBusinessConfig,
      });

      mockConfigService.getCustomFieldsByEntityType.mockResolvedValue({
        success: true,
        data: mockBusinessConfig.customFields,
      });

      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockOffering]),
        }),
      });

      // Mock variant and availability creation
      mockDb.insert
        .mockReturnValueOnce({
          values: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([mockOffering]),
          }),
        })
        .mockReturnValueOnce({
          values: vi.fn().mockResolvedValue(undefined),
        })
        .mockReturnValueOnce({
          values: vi.fn().mockResolvedValue(undefined),
        });

      const result = await service.createOffering(mockTenantId, createRequest);

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        name: 'Chicken Curry',
        basePrice: 15.99,
        customFieldValues: { spice_level: 'medium' },
        businessTerminology: mockBusinessConfig.terminology,
      });
      expect(mockDb.insert).toHaveBeenCalledTimes(3); // offering, variants, availability
    });

    it('should fail if tenant is not configured', async () => {
      mockConfigService.getTenantBusinessConfig.mockResolvedValue({
        success: true,
        data: { ...mockBusinessConfig, isConfigured: false },
      });

      const result = await service.createOffering(mockTenantId, createRequest);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('TENANT_NOT_CONFIGURED');
    });

    it('should validate custom field values', async () => {
      mockConfigService.getTenantBusinessConfig.mockResolvedValue({
        success: true,
        data: mockBusinessConfig,
      });

      mockConfigService.getCustomFieldsByEntityType.mockResolvedValue({
        success: true,
        data: [
          {
            ...mockBusinessConfig.customFields[0],
            isRequired: true,
          },
        ],
      });

      const invalidRequest = {
        ...createRequest,
        customFieldValues: {}, // Missing required field
      };

      const result = await service.createOffering(mockTenantId, invalidRequest);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('CUSTOM_FIELD_VALIDATION_FAILED');
    });

    it('should handle database errors', async () => {
      mockConfigService.getTenantBusinessConfig.mockResolvedValue({
        success: true,
        data: mockBusinessConfig,
      });

      mockConfigService.getCustomFieldsByEntityType.mockResolvedValue({
        success: true,
        data: mockBusinessConfig.customFields,
      });

      mockDb.insert.mockRejectedValue(new Error('Database error'));

      const result = await service.createOffering(mockTenantId, createRequest);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('OFFERING_CREATE_FAILED');
    });
  });

  describe('getOffering', () => {
    it('should get offering successfully', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockOffering]),
          }),
        }),
      });

      mockConfigService.getTenantBusinessConfig.mockResolvedValue({
        success: true,
        data: mockBusinessConfig,
      });

      const result = await service.getOffering(mockTenantId, mockOfferingId);

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        id: mockOfferingId,
        name: 'Chicken Curry',
        businessTerminology: mockBusinessConfig.terminology,
      });
    });

    it('should handle offering not found', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await service.getOffering(mockTenantId, 'nonexistent');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('OFFERING_NOT_FOUND');
    });
  });

  describe('listOfferings', () => {
    const mockOfferings = [mockOffering];

    it('should list offerings with pagination', async () => {
      // Mock count query
      mockDb.select
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{ count: 1 }]),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  offset: vi.fn().mockResolvedValue(mockOfferings),
                }),
              }),
            }),
          }),
        });

      mockConfigService.getTenantBusinessConfig.mockResolvedValue({
        success: true,
        data: mockBusinessConfig,
      });

      const result = await service.listOfferings(mockTenantId, {
        page: 1,
        limit: 10,
        category: 'main-course',
        search: 'curry',
        isActive: true,
      });

      expect(result.success).toBe(true);
      expect(result.data?.data).toHaveLength(1);
      expect(result.data?.total).toBe(1);
      expect(result.data?.page).toBe(1);
      expect(result.data?.limit).toBe(10);
    });

    it('should handle empty results', async () => {
      mockDb.select
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{ count: 0 }]),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  offset: vi.fn().mockResolvedValue([]),
                }),
              }),
            }),
          }),
        });

      mockConfigService.getTenantBusinessConfig.mockResolvedValue({
        success: true,
        data: mockBusinessConfig,
      });

      const result = await service.listOfferings(mockTenantId);

      expect(result.success).toBe(true);
      expect(result.data?.data).toHaveLength(0);
      expect(result.data?.total).toBe(0);
    });
  });

  describe('updateOffering', () => {
    const updateRequest = {
      name: 'Updated Chicken Curry',
      basePrice: 17.99,
      customFieldValues: { spice_level: 'hot' },
    };

    it('should update offering successfully', async () => {
      // Mock getOffering call
      vi.spyOn(service, 'getOffering').mockResolvedValue({
        success: true,
        data: {
          ...mockOffering,
          businessTerminology: mockBusinessConfig.terminology,
        },
      });

      mockConfigService.getCustomFieldsByEntityType.mockResolvedValue({
        success: true,
        data: mockBusinessConfig.customFields,
      });

      const updatedOffering = {
        ...mockOffering,
        name: 'Updated Chicken Curry',
        basePrice: 17.99,
        customFieldValues: { spice_level: 'hot' },
      };

      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedOffering]),
          }),
        }),
      });

      mockConfigService.getTenantBusinessConfig.mockResolvedValue({
        success: true,
        data: mockBusinessConfig,
      });

      const result = await service.updateOffering(mockTenantId, mockOfferingId, updateRequest);

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('Updated Chicken Curry');
      expect(result.data?.basePrice).toBe(17.99);
      expect(result.data?.customFieldValues.spice_level).toBe('hot');
    });

    it('should handle offering not found', async () => {
      vi.spyOn(service, 'getOffering').mockResolvedValue({
        success: false,
        error: { code: 'OFFERING_NOT_FOUND', message: 'Offering not found' },
      });

      const result = await service.updateOffering(mockTenantId, 'nonexistent', updateRequest);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('OFFERING_NOT_FOUND');
    });

    it('should validate custom field values on update', async () => {
      vi.spyOn(service, 'getOffering').mockResolvedValue({
        success: true,
        data: {
          ...mockOffering,
          businessTerminology: mockBusinessConfig.terminology,
        },
      });

      mockConfigService.getCustomFieldsByEntityType.mockResolvedValue({
        success: true,
        data: [
          {
            ...mockBusinessConfig.customFields[0],
            fieldOptions: [{ value: 'mild', label: 'Mild' }], // Only mild allowed
          },
        ],
      });

      const invalidUpdate = {
        customFieldValues: { spice_level: 'super_hot' }, // Invalid option
      };

      const result = await service.updateOffering(mockTenantId, mockOfferingId, invalidUpdate);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('CUSTOM_FIELD_VALIDATION_FAILED');
    });
  });

  describe('deleteOffering', () => {
    it('should soft delete offering with active transactions', async () => {
      vi.spyOn(service, 'getOffering').mockResolvedValue({
        success: true,
        data: {
          ...mockOffering,
          businessTerminology: mockBusinessConfig.terminology,
        },
      });

      // Mock active transactions check
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ count: 5 }]),
        }),
      });

      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      });

      const result = await service.deleteOffering(mockTenantId, mockOfferingId);

      expect(result.success).toBe(true);
      expect(mockDb.update).toHaveBeenCalled(); // Soft delete
      expect(mockDb.delete).not.toHaveBeenCalled();
    });

    it('should hard delete offering with no transactions', async () => {
      vi.spyOn(service, 'getOffering').mockResolvedValue({
        success: true,
        data: {
          ...mockOffering,
          businessTerminology: mockBusinessConfig.terminology,
        },
      });

      // Mock no active transactions
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ count: 0 }]),
        }),
      });

      mockDb.delete.mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      });

      const result = await service.deleteOffering(mockTenantId, mockOfferingId);

      expect(result.success).toBe(true);
      expect(mockDb.delete).toHaveBeenCalled(); // Hard delete
    });

    it('should handle offering not found', async () => {
      vi.spyOn(service, 'getOffering').mockResolvedValue({
        success: false,
        error: { code: 'OFFERING_NOT_FOUND', message: 'Offering not found' },
      });

      const result = await service.deleteOffering(mockTenantId, 'nonexistent');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('OFFERING_NOT_FOUND');
    });
  });

  describe('getOfferingVariants', () => {
    const mockVariants = [
      {
        id: 'variant-1',
        offeringId: mockOfferingId,
        name: 'Large',
        description: 'Large portion',
        priceModifier: 5.00,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    it('should get offering variants successfully', async () => {
      vi.spyOn(service, 'getOffering').mockResolvedValue({
        success: true,
        data: {
          ...mockOffering,
          businessTerminology: mockBusinessConfig.terminology,
        },
      });

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(mockVariants),
          }),
        }),
      });

      const result = await service.getOfferingVariants(mockTenantId, mockOfferingId);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].name).toBe('Large');
    });
  });

  describe('getOfferingAvailability', () => {
    const mockAvailability = {
      id: 'availability-1',
      offeringId: mockOfferingId,
      isScheduled: true,
      duration: 30,
      capacity: 10,
      advanceBookingDays: 7,
      timeSlots: [
        { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should get offering availability successfully', async () => {
      vi.spyOn(service, 'getOffering').mockResolvedValue({
        success: true,
        data: {
          ...mockOffering,
          businessTerminology: mockBusinessConfig.terminology,
        },
      });

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockAvailability]),
          }),
        }),
      });

      const result = await service.getOfferingAvailability(mockTenantId, mockOfferingId);

      expect(result.success).toBe(true);
      expect(result.data?.isScheduled).toBe(true);
      expect(result.data?.duration).toBe(30);
    });

    it('should return null when no availability configured', async () => {
      vi.spyOn(service, 'getOffering').mockResolvedValue({
        success: true,
        data: {
          ...mockOffering,
          businessTerminology: mockBusinessConfig.terminology,
        },
      });

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await service.getOfferingAvailability(mockTenantId, mockOfferingId);

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });
  });

  describe('getOfferingAnalytics', () => {
    it('should get offering analytics successfully', async () => {
      // Mock various analytics queries
      mockDb.select
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{ count: 25 }]),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{ count: 20 }]),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{ avg: 15.50 }]),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              groupBy: vi.fn().mockReturnValue({
                orderBy: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue([
                    { category: 'main-course', count: 10 },
                    { category: 'appetizer', count: 5 },
                  ]),
                }),
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{ count: 3 }]),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([
              { customFieldValues: { spice_level: 'medium', allergens: ['nuts'] } },
              { customFieldValues: { spice_level: 'hot' } },
            ]),
          }),
        });

      const result = await service.getOfferingAnalytics(mockTenantId);

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        totalOfferings: 25,
        activeOfferings: 20,
        averagePrice: 15.50,
        popularCategories: [
          { category: 'main-course', count: 10 },
          { category: 'appetizer', count: 5 },
        ],
        recentlyCreated: 3,
        customFieldUsage: [
          { fieldName: 'spice_level', usageCount: 2 },
          { fieldName: 'allergens', usageCount: 1 },
        ],
      });
    });
  });

  describe('migrateLegacyServices', () => {
    const mockLegacyServices = [
      {
        id: 'service-1',
        tenantId: mockTenantId,
        name: 'Haircut',
        description: 'Professional haircut',
        price: 25.00,
        isActive: true,
        icon: 'scissors',
      },
      {
        id: 'service-2',
        tenantId: mockTenantId,
        name: 'Hair Wash',
        description: 'Hair washing service',
        price: 10.00,
        isActive: true,
        icon: 'water',
      },
    ];

    it('should migrate legacy services successfully', async () => {
      // Mock legacy services query
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(mockLegacyServices),
        }),
      });

      // Mock existing offering check (none exist)
      mockDb.select
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(mockLegacyServices),
          }),
        })
        .mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        });

      mockDb.insert.mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      });

      const result = await service.migrateLegacyServices(mockTenantId);

      expect(result.success).toBe(true);
      expect(result.data?.migratedCount).toBe(2);
      expect(result.data?.skippedCount).toBe(0);
      expect(result.data?.errors).toHaveLength(0);
    });

    it('should skip already migrated services', async () => {
      // Mock legacy services query
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(mockLegacyServices),
        }),
      });

      // Mock existing offering check (first service already exists)
      mockDb.select
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(mockLegacyServices),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([{ id: 'existing-offering' }]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        });

      mockDb.insert.mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      });

      const result = await service.migrateLegacyServices(mockTenantId);

      expect(result.success).toBe(true);
      expect(result.data?.migratedCount).toBe(1);
      expect(result.data?.skippedCount).toBe(1);
    });
  });

  describe('Custom Field Validation', () => {
    it('should validate required fields', async () => {
      const requiredField = {
        ...mockBusinessConfig.customFields[0],
        isRequired: true,
      };

      mockConfigService.getCustomFieldsByEntityType.mockResolvedValue({
        success: true,
        data: [requiredField],
      });

      // Test with missing required field
      const validation = await (service as any).validateCustomFieldValues(
        mockTenantId,
        'offering',
        {}
      );

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain("Field 'Spice Level' is required");
    });

    it('should validate field types', async () => {
      const numberField = {
        ...mockBusinessConfig.customFields[0],
        fieldType: 'number',
        name: 'portion_size',
        label: 'Portion Size',
      };

      mockConfigService.getCustomFieldsByEntityType.mockResolvedValue({
        success: true,
        data: [numberField],
      });

      // Test with invalid number
      const validation = await (service as any).validateCustomFieldValues(
        mockTenantId,
        'offering',
        { portion_size: 'not-a-number' }
      );

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain("Field 'Portion Size' must be a valid number");
    });

    it('should validate select field options', async () => {
      mockConfigService.getCustomFieldsByEntityType.mockResolvedValue({
        success: true,
        data: [mockBusinessConfig.customFields[0]],
      });

      // Test with invalid option
      const validation = await (service as any).validateCustomFieldValues(
        mockTenantId,
        'offering',
        { spice_level: 'super_hot' }
      );

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain("Field 'Spice Level' must be one of: mild, medium, hot");
    });

    it('should validate validation rules', async () => {
      const fieldWithRules = {
        ...mockBusinessConfig.customFields[0],
        fieldType: 'number',
        name: 'price',
        label: 'Price',
        validationRules: { min: 0, max: 100 },
      };

      mockConfigService.getCustomFieldsByEntityType.mockResolvedValue({
        success: true,
        data: [fieldWithRules],
      });

      // Test with value below minimum
      const validation = await (service as any).validateCustomFieldValues(
        mockTenantId,
        'offering',
        { price: -5 }
      );

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain("Field 'Price' must be at least 0");
    });
  });
});