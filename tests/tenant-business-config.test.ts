/**
 * Unit tests for TenantBusinessConfigService
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TenantBusinessConfigService } from '../server/services/tenant-business-config.service';
import { BusinessTypeService } from '../server/services/business-type.service';
import { TenantService } from '../server/services/tenant.service';

// Mock the database and services
vi.mock('drizzle-orm/neon-serverless');
vi.mock('@neondatabase/serverless');
vi.mock('../server/services/business-type.service');
vi.mock('../server/services/tenant.service');

describe('TenantBusinessConfigService', () => {
  let service: TenantBusinessConfigService;
  let mockBusinessTypeService: vi.Mocked<BusinessTypeService>;
  let mockTenantService: vi.Mocked<TenantService>;
  let mockDb: any;

  const mockTenant = {
    id: 'tenant-1',
    name: 'Test Restaurant',
    businessTypeId: 'business-type-1',
    businessConfig: { requiresScheduling: true },
    terminology: { offering: 'Menu Item', transaction: 'Order' },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockBusinessType = {
    id: 'business-type-1',
    name: 'restaurant',
    displayName: 'Restaurant',
    category: 'hospitality',
    description: 'Restaurant business model',
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
    isActive: true,
    isSystem: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCustomFields = [
    {
      id: 'field-1',
      tenantId: 'tenant-1',
      entityType: 'offering',
      name: 'dietary_info',
      label: 'Dietary Information',
      fieldType: 'multiselect',
      isRequired: false,
      fieldOptions: [
        { value: 'vegetarian', label: 'Vegetarian' },
        { value: 'vegan', label: 'Vegan' },
      ],
      displayOrder: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockWorkflowStates = [
    {
      id: 'state-1',
      tenantId: 'tenant-1',
      workflowType: 'transaction',
      name: 'pending',
      displayName: 'Pending',
      stateType: 'initial',
      color: '#F59E0B',
      isSystem: true,
      displayOrder: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'state-2',
      tenantId: 'tenant-1',
      workflowType: 'transaction',
      name: 'confirmed',
      displayName: 'Confirmed',
      stateType: 'intermediate',
      color: '#10B981',
      isSystem: true,
      displayOrder: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeEach(() => {
    // Setup mocks
    mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      onConflictDoNothing: vi.fn().mockReturnThis(),
    };

    mockBusinessTypeService = {
      getBusinessType: vi.fn(),
      getBusinessTypeTemplate: vi.fn(),
      createBusinessTypeFromTemplate: vi.fn(),
    } as any;

    mockTenantService = {
      getTenant: vi.fn(),
      updateTenant: vi.fn(),
      listTenants: vi.fn(),
    } as any;

    // Mock the constructor dependencies
    vi.mocked(BusinessTypeService).mockImplementation(() => mockBusinessTypeService);
    vi.mocked(TenantService).mockImplementation(() => mockTenantService);

    service = new TenantBusinessConfigService('mock-connection-string');
    (service as any).db = mockDb;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getTenantBusinessConfig', () => {
    it('should return tenant business configuration successfully', async () => {
      // Setup mocks
      mockTenantService.getTenant.mockResolvedValue({
        success: true,
        data: mockTenant,
      });

      mockBusinessTypeService.getBusinessType.mockResolvedValue({
        success: true,
        data: mockBusinessType,
      });

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(mockCustomFields),
          }),
        }),
      });

      // Mock workflow states query (second call)
      mockDb.select
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue(mockCustomFields),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue(mockWorkflowStates),
            }),
          }),
        });

      const result = await service.getTenantBusinessConfig('tenant-1');

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        tenantId: 'tenant-1',
        businessType: mockBusinessType,
        terminology: {
          offering: 'Menu Item',
          transaction: 'Order',
          customer: 'Guest',
        },
        configuration: {
          requiresScheduling: true,
          defaultDuration: 60,
          supportsVariants: true,
        },
        customFields: mockCustomFields,
        workflowStates: mockWorkflowStates,
        isConfigured: true,
      });
    });

    it('should return unconfigured state when no business type assigned', async () => {
      const tenantWithoutBusinessType = { ...mockTenant, businessTypeId: null };

      mockTenantService.getTenant.mockResolvedValue({
        success: true,
        data: tenantWithoutBusinessType,
      });

      const result = await service.getTenantBusinessConfig('tenant-1');

      expect(result.success).toBe(true);
      expect(result.data?.isConfigured).toBe(false);
      expect(result.data?.businessType).toBeNull();
    });

    it('should handle tenant not found', async () => {
      mockTenantService.getTenant.mockResolvedValue({
        success: false,
        error: { code: 'TENANT_NOT_FOUND', message: 'Tenant not found' },
      });

      const result = await service.getTenantBusinessConfig('nonexistent');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('TENANT_NOT_FOUND');
    });

    it('should handle business type not found', async () => {
      mockTenantService.getTenant.mockResolvedValue({
        success: true,
        data: mockTenant,
      });

      mockBusinessTypeService.getBusinessType.mockResolvedValue({
        success: false,
        error: { code: 'BUSINESS_TYPE_NOT_FOUND', message: 'Business type not found' },
      });

      const result = await service.getTenantBusinessConfig('tenant-1');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('BUSINESS_TYPE_NOT_FOUND');
    });
  });

  describe('configureTenantBusiness', () => {
    const mockConfiguration = {
      businessTypeId: 'business-type-1',
      terminologyOverrides: { offering: 'Dish' },
      configurationOverrides: { defaultDuration: 90 },
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
      ],
    };

    it('should configure tenant business successfully', async () => {
      // Mock validation
      vi.spyOn(service as any, 'validateConfiguration').mockResolvedValue({
        isValid: true,
        errors: [],
        warnings: [],
        suggestions: [],
      });

      mockBusinessTypeService.getBusinessType.mockResolvedValue({
        success: true,
        data: mockBusinessType,
      });

      mockTenantService.updateTenant.mockResolvedValue({
        success: true,
        data: mockTenant,
      });

      // Mock setup methods
      vi.spyOn(service as any, 'setupCustomFields').mockResolvedValue(undefined);
      vi.spyOn(service as any, 'setupDefaultWorkflowStates').mockResolvedValue(undefined);

      // Mock getTenantBusinessConfig for final result
      vi.spyOn(service, 'getTenantBusinessConfig').mockResolvedValue({
        success: true,
        data: {
          tenantId: 'tenant-1',
          businessType: mockBusinessType,
          terminology: { offering: 'Dish' },
          configuration: { defaultDuration: 90 },
          customFields: [],
          workflowStates: [],
          isConfigured: true,
        },
      });

      const result = await service.configureTenantBusiness('tenant-1', mockConfiguration);

      expect(result.success).toBe(true);
      expect(mockTenantService.updateTenant).toHaveBeenCalledWith('tenant-1', {
        businessTypeId: 'business-type-1',
        businessConfig: { defaultDuration: 90 },
        terminology: { offering: 'Dish' },
      });
    });

    it('should handle validation errors', async () => {
      vi.spyOn(service as any, 'validateConfiguration').mockResolvedValue({
        isValid: false,
        errors: ['Business type not found'],
        warnings: [],
        suggestions: [],
      });

      const result = await service.configureTenantBusiness('tenant-1', mockConfiguration);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_CONFIGURATION');
      expect(result.error?.details).toEqual(['Business type not found']);
    });

    it('should handle business type not found', async () => {
      vi.spyOn(service as any, 'validateConfiguration').mockResolvedValue({
        isValid: true,
        errors: [],
        warnings: [],
        suggestions: [],
      });

      mockBusinessTypeService.getBusinessType.mockResolvedValue({
        success: false,
        error: { code: 'BUSINESS_TYPE_NOT_FOUND', message: 'Business type not found' },
      });

      const result = await service.configureTenantBusiness('tenant-1', mockConfiguration);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('BUSINESS_TYPE_NOT_FOUND');
    });

    it('should handle tenant update failure', async () => {
      vi.spyOn(service as any, 'validateConfiguration').mockResolvedValue({
        isValid: true,
        errors: [],
        warnings: [],
        suggestions: [],
      });

      mockBusinessTypeService.getBusinessType.mockResolvedValue({
        success: true,
        data: mockBusinessType,
      });

      mockTenantService.updateTenant.mockResolvedValue({
        success: false,
        error: { code: 'UPDATE_FAILED', message: 'Update failed' },
      });

      const result = await service.configureTenantBusiness('tenant-1', mockConfiguration);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('TENANT_UPDATE_FAILED');
    });
  });

  describe('configureTenantFromTemplate', () => {
    const mockTemplate = {
      id: 'template-1',
      name: 'restaurant',
      displayName: 'Restaurant',
      category: 'hospitality',
      terminology: {
        offering: 'Menu Item',
        transaction: 'Order',
        customer: 'Guest',
      },
      defaultConfig: {
        requiresScheduling: true,
        defaultDuration: 60,
      },
      customFields: [
        {
          entityType: 'offering',
          name: 'dietary_info',
          label: 'Dietary Information',
          fieldType: 'multiselect',
          isRequired: false,
          fieldOptions: [
            { value: 'vegetarian', label: 'Vegetarian' },
            { value: 'vegan', label: 'Vegan' },
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
      ],
    };

    it('should configure tenant from template successfully', async () => {
      mockBusinessTypeService.getBusinessTypeTemplate.mockResolvedValue({
        success: true,
        data: mockTemplate,
      });

      mockBusinessTypeService.getBusinessType.mockResolvedValue({
        success: true,
        data: mockBusinessType,
      });

      vi.spyOn(service, 'configureTenantBusiness').mockResolvedValue({
        success: true,
        data: {
          tenantId: 'tenant-1',
          businessType: mockBusinessType,
          terminology: mockTemplate.terminology,
          configuration: mockTemplate.defaultConfig,
          customFields: [],
          workflowStates: [],
          isConfigured: true,
        },
      });

      const result = await service.configureTenantFromTemplate('tenant-1', 'template-1');

      expect(result.success).toBe(true);
      expect(service.configureTenantBusiness).toHaveBeenCalledWith('tenant-1', {
        businessTypeId: 'business-type-1',
        terminologyOverrides: mockTemplate.terminology,
        configurationOverrides: mockTemplate.defaultConfig,
        customFields: mockTemplate.customFields,
        workflowCustomizations: [{
          workflowType: 'transaction',
          states: mockTemplate.workflowStates,
        }],
      });
    });

    it('should handle template not found', async () => {
      mockBusinessTypeService.getBusinessTypeTemplate.mockResolvedValue({
        success: false,
        error: { code: 'TEMPLATE_NOT_FOUND', message: 'Template not found' },
      });

      const result = await service.configureTenantFromTemplate('tenant-1', 'nonexistent');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('TEMPLATE_NOT_FOUND');
    });

    it('should create business type from template if it does not exist', async () => {
      mockBusinessTypeService.getBusinessTypeTemplate.mockResolvedValue({
        success: true,
        data: mockTemplate,
      });

      mockBusinessTypeService.getBusinessType.mockResolvedValue({
        success: false,
        error: { code: 'BUSINESS_TYPE_NOT_FOUND', message: 'Business type not found' },
      });

      mockBusinessTypeService.createBusinessTypeFromTemplate.mockResolvedValue({
        success: true,
        data: mockBusinessType,
      });

      vi.spyOn(service, 'configureTenantBusiness').mockResolvedValue({
        success: true,
        data: {
          tenantId: 'tenant-1',
          businessType: mockBusinessType,
          terminology: mockTemplate.terminology,
          configuration: mockTemplate.defaultConfig,
          customFields: [],
          workflowStates: [],
          isConfigured: true,
        },
      });

      const result = await service.configureTenantFromTemplate('tenant-1', 'template-1');

      expect(result.success).toBe(true);
      expect(mockBusinessTypeService.createBusinessTypeFromTemplate).toHaveBeenCalledWith('template-1');
    });
  });

  describe('validateConfiguration', () => {
    it('should validate configuration successfully', async () => {
      const validConfiguration = {
        businessTypeId: 'business-type-1',
        customFields: [
          {
            entityType: 'offering',
            name: 'spice_level',
            label: 'Spice Level',
            fieldType: 'select',
            isRequired: false,
            fieldOptions: [
              { value: 'mild', label: 'Mild' },
              { value: 'hot', label: 'Hot' },
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

      mockBusinessTypeService.getBusinessType.mockResolvedValue({
        success: true,
        data: mockBusinessType,
      });

      const result = await service.validateConfiguration('tenant-1', validConfiguration);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect validation errors', async () => {
      const invalidConfiguration = {
        businessTypeId: 'nonexistent',
        customFields: [
          {
            entityType: 'offering',
            name: '', // Missing name
            label: 'Invalid Field',
            fieldType: 'select',
            isRequired: false,
            fieldOptions: [], // Missing options for select field
          },
          {
            entityType: 'offering',
            name: 'duplicate',
            label: 'Duplicate 1',
            fieldType: 'text',
            isRequired: false,
          },
          {
            entityType: 'offering',
            name: 'duplicate', // Duplicate name
            label: 'Duplicate 2',
            fieldType: 'text',
            isRequired: false,
          },
        ],
        workflowCustomizations: [
          {
            workflowType: 'transaction',
            states: [], // No states
          },
        ],
      };

      mockBusinessTypeService.getBusinessType.mockResolvedValue({
        success: false,
        error: { code: 'BUSINESS_TYPE_NOT_FOUND', message: 'Business type not found' },
      });

      const result = await service.validateConfiguration('tenant-1', invalidConfiguration);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Business type not found');
      expect(result.errors).toContain('Custom field missing required properties: ');
      expect(result.errors).toContain('Select field \'\' must have options');
      expect(result.errors).toContain('Duplicate custom field name \'duplicate\' for entity type \'offering\'');
      expect(result.errors).toContain('Workflow \'transaction\' must have at least one state');
    });

    it('should detect workflow validation issues', async () => {
      const configurationWithWorkflowIssues = {
        businessTypeId: 'business-type-1',
        workflowCustomizations: [
          {
            workflowType: 'transaction',
            states: [
              {
                name: 'pending',
                displayName: 'Pending',
                stateType: 'intermediate', // No initial state
                color: '#F59E0B',
              },
              {
                name: 'pending', // Duplicate name
                displayName: 'Pending Again',
                stateType: 'intermediate',
                color: '#F59E0B',
              },
            ],
          },
        ],
      };

      mockBusinessTypeService.getBusinessType.mockResolvedValue({
        success: true,
        data: mockBusinessType,
      });

      const result = await service.validateConfiguration('tenant-1', configurationWithWorkflowIssues);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Workflow \'transaction\' must have at least one initial state');
      expect(result.errors).toContain('Workflow \'transaction\' has duplicate state names');
      expect(result.warnings).toContain('Workflow \'transaction\' should have at least one final state');
    });
  });

  describe('getConfigurationRecommendations', () => {
    it('should provide recommendations for hospitality business', async () => {
      mockBusinessTypeService.getBusinessType.mockResolvedValue({
        success: true,
        data: { ...mockBusinessType, category: 'hospitality' },
      });

      const result = await service.getConfigurationRecommendations('tenant-1', 'business-type-1');

      expect(result.success).toBe(true);
      expect(result.data?.recommendedFields).toContainEqual(
        expect.objectContaining({
          name: 'party_size',
          reason: 'Essential for table management and capacity planning',
        })
      );
      expect(result.data?.recommendedIntegrations).toContainEqual(
        expect.objectContaining({
          name: 'POS System',
          reason: 'Sync menu items and pricing automatically',
        })
      );
    });

    it('should provide recommendations for healthcare business', async () => {
      mockBusinessTypeService.getBusinessType.mockResolvedValue({
        success: true,
        data: { ...mockBusinessType, category: 'healthcare' },
      });

      const result = await service.getConfigurationRecommendations('tenant-1', 'business-type-1');

      expect(result.success).toBe(true);
      expect(result.data?.recommendedFields).toContainEqual(
        expect.objectContaining({
          name: 'symptoms',
          reason: 'Helps healthcare providers prepare for appointments',
        })
      );
      expect(result.data?.recommendedIntegrations).toContainEqual(
        expect.objectContaining({
          name: 'EMR System',
          reason: 'Sync patient data and appointment history',
        })
      );
    });

    it('should provide recommendations for retail business', async () => {
      mockBusinessTypeService.getBusinessType.mockResolvedValue({
        success: true,
        data: { ...mockBusinessType, category: 'retail' },
      });

      const result = await service.getConfigurationRecommendations('tenant-1', 'business-type-1');

      expect(result.success).toBe(true);
      expect(result.data?.recommendedFields).toContainEqual(
        expect.objectContaining({
          name: 'sku',
          reason: 'Essential for inventory management and tracking',
        })
      );
      expect(result.data?.recommendedIntegrations).toContainEqual(
        expect.objectContaining({
          name: 'Inventory Management',
          reason: 'Real-time stock levels and automatic reordering',
        })
      );
    });

    it('should handle business type not found', async () => {
      mockBusinessTypeService.getBusinessType.mockResolvedValue({
        success: false,
        error: { code: 'BUSINESS_TYPE_NOT_FOUND', message: 'Business type not found' },
      });

      const result = await service.getConfigurationRecommendations('tenant-1', 'nonexistent');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('BUSINESS_TYPE_NOT_FOUND');
    });
  });

  describe('resetTenantBusinessConfig', () => {
    it('should reset tenant business configuration successfully', async () => {
      mockTenantService.updateTenant.mockResolvedValue({
        success: true,
        data: mockTenant,
      });

      mockDb.delete.mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      });

      const result = await service.resetTenantBusinessConfig('tenant-1');

      expect(result.success).toBe(true);
      expect(mockTenantService.updateTenant).toHaveBeenCalledWith('tenant-1', {
        businessTypeId: null,
        businessConfig: {},
        terminology: {},
      });
    });

    it('should handle reset failure', async () => {
      mockTenantService.updateTenant.mockRejectedValue(new Error('Database error'));

      const result = await service.resetTenantBusinessConfig('tenant-1');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('CONFIG_RESET_FAILED');
    });
  });

  describe('getMigrationStatus', () => {
    it('should return migration status correctly', async () => {
      // Mock legacy data counts
      mockDb.select
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{ count: '5' }]),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{ count: '10' }]),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{ count: '0' }]),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{ count: '0' }]),
          }),
        });

      const result = await service.getMigrationStatus('tenant-1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        needsMigration: true,
        legacyServicesCount: 5,
        legacyBookingsCount: 10,
        newOfferingsCount: 0,
        newTransactionsCount: 0,
      });
    });

    it('should indicate no migration needed when new data exists', async () => {
      // Mock data counts showing new data exists
      mockDb.select
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{ count: '5' }]),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{ count: '10' }]),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{ count: '3' }]),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{ count: '8' }]),
          }),
        });

      const result = await service.getMigrationStatus('tenant-1');

      expect(result.success).toBe(true);
      expect(result.data?.needsMigration).toBe(false);
    });
  });

  describe('getConfiguredTenants', () => {
    it('should return configured tenants successfully', async () => {
      const mockTenants = [mockTenant];

      mockTenantService.listTenants.mockResolvedValue({
        success: true,
        data: {
          data: mockTenants,
          total: 1,
          page: 1,
          limit: 1000,
        },
      });

      mockBusinessTypeService.getBusinessType.mockResolvedValue({
        success: true,
        data: mockBusinessType,
      });

      vi.spyOn(service, 'getTenantBusinessConfig').mockResolvedValue({
        success: true,
        data: {
          tenantId: 'tenant-1',
          businessType: mockBusinessType,
          terminology: {},
          configuration: {},
          customFields: mockCustomFields,
          workflowStates: [],
          isConfigured: true,
        },
      });

      const result = await service.getConfiguredTenants();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0]).toMatchObject({
        tenant: mockTenant,
        businessType: mockBusinessType,
        configurationStatus: 'complete',
      });
    });

    it('should handle tenants list failure', async () => {
      mockTenantService.listTenants.mockResolvedValue({
        success: false,
        error: { code: 'FETCH_FAILED', message: 'Failed to fetch tenants' },
      });

      const result = await service.getConfiguredTenants();

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('FETCH_FAILED');
    });
  });
});