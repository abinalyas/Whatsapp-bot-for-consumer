/**
 * Tenant Business Configuration Service
 * Handles tenant-specific business configurations, terminology, and setup
 */

import { eq, and } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import * as schema from '@shared/schema';
import { BusinessTypeService, BusinessTypeTemplate } from './business-type.service';
import { TenantService } from './tenant.service';
import type { ServiceResponse } from '@shared/types/tenant';
import type { Tenant, BusinessType, CustomField, WorkflowState } from '@shared/schema';

export interface TenantBusinessConfig {
  tenantId: string;
  businessType: BusinessType;
  terminology: Record<string, string>;
  configuration: Record<string, any>;
  customFields: CustomField[];
  workflowStates: WorkflowState[];
  isConfigured: boolean;
  lastConfiguredAt?: Date;
}

export interface BusinessConfigurationRequest {
  businessTypeId: string;
  terminologyOverrides?: Record<string, string>;
  configurationOverrides?: Record<string, any>;
  customFields?: Array<{
    entityType: string;
    name: string;
    label: string;
    fieldType: string;
    isRequired: boolean;
    validationRules?: Record<string, any>;
    fieldOptions?: any[];
    defaultValue?: any;
  }>;
  workflowCustomizations?: Array<{
    workflowType: string;
    states: Array<{
      name: string;
      displayName: string;
      stateType: string;
      color: string;
      description?: string;
    }>;
  }>;
}

export interface ConfigurationValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export class TenantBusinessConfigService {
  private db: ReturnType<typeof drizzle>;
  private pool: Pool;
  private businessTypeService: BusinessTypeService;
  private tenantService: TenantService;

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString });
    this.db = drizzle({ client: this.pool, schema });
    this.businessTypeService = new BusinessTypeService(connectionString);
    this.tenantService = new TenantService(connectionString);
  }

  // ===== TENANT BUSINESS CONFIGURATION =====

  /**
   * Get tenant business configuration
   */
  async getTenantBusinessConfig(tenantId: string): Promise<ServiceResponse<TenantBusinessConfig>> {
    try {
      // Get tenant with business type
      const tenantResult = await this.tenantService.getTenant(tenantId);
      if (!tenantResult.success) {
        return tenantResult;
      }

      const tenant = tenantResult.data!;

      // If no business type assigned, return unconfigured state
      if (!tenant.businessTypeId) {
        return {
          success: true,
          data: {
            tenantId,
            businessType: null as any,
            terminology: {},
            configuration: {},
            customFields: [],
            workflowStates: [],
            isConfigured: false,
          },
        };
      }

      // Get business type
      const businessTypeResult = await this.businessTypeService.getBusinessType(tenant.businessTypeId);
      if (!businessTypeResult.success) {
        return {
          success: false,
          error: {
            code: 'BUSINESS_TYPE_NOT_FOUND',
            message: 'Business type not found for tenant',
            tenantId,
          },
        };
      }

      const businessType = businessTypeResult.data!;

      // Get custom fields for tenant
      const customFields = await this.db
        .select()
        .from(schema.customFields)
        .where(and(
          eq(schema.customFields.tenantId, tenantId),
          eq(schema.customFields.isActive, true)
        ))
        .orderBy(schema.customFields.displayOrder);

      // Get workflow states for tenant
      const workflowStates = await this.db
        .select()
        .from(schema.workflowStates)
        .where(eq(schema.workflowStates.tenantId, tenantId))
        .orderBy(schema.workflowStates.displayOrder);

      // Merge terminology (business type + tenant overrides)
      const mergedTerminology = {
        ...businessType.terminology,
        ...tenant.terminology,
      };

      // Merge configuration (business type + tenant overrides)
      const mergedConfiguration = {
        ...businessType.defaultConfig,
        ...tenant.businessConfig,
      };

      return {
        success: true,
        data: {
          tenantId,
          businessType,
          terminology: mergedTerminology,
          configuration: mergedConfiguration,
          customFields,
          workflowStates,
          isConfigured: true,
          lastConfiguredAt: tenant.updatedAt,
        },
      };

    } catch (error) {
      console.error('Error getting tenant business config:', error);
      return {
        success: false,
        error: {
          code: 'CONFIG_FETCH_FAILED',
          message: 'Failed to fetch tenant business configuration',
          tenantId,
        },
      };
    }
  }

  /**
   * Configure tenant business type and settings
   */
  async configureTenantBusiness(
    tenantId: string,
    configuration: BusinessConfigurationRequest
  ): Promise<ServiceResponse<TenantBusinessConfig>> {
    try {
      // Validate configuration
      const validationResult = await this.validateConfiguration(tenantId, configuration);
      if (!validationResult.isValid) {
        return {
          success: false,
          error: {
            code: 'INVALID_CONFIGURATION',
            message: 'Configuration validation failed',
            details: validationResult.errors,
            tenantId,
          },
        };
      }

      // Get business type to validate it exists
      const businessTypeResult = await this.businessTypeService.getBusinessType(configuration.businessTypeId);
      if (!businessTypeResult.success) {
        return {
          success: false,
          error: {
            code: 'BUSINESS_TYPE_NOT_FOUND',
            message: 'Specified business type not found',
            tenantId,
          },
        };
      }

      // Update tenant with business type and configuration
      const tenantUpdateResult = await this.tenantService.updateTenant(tenantId, {
        businessTypeId: configuration.businessTypeId,
        businessConfig: configuration.configurationOverrides || {},
        terminology: configuration.terminologyOverrides || {},
      });

      if (!tenantUpdateResult.success) {
        return {
          success: false,
          error: {
            code: 'TENANT_UPDATE_FAILED',
            message: 'Failed to update tenant configuration',
            tenantId,
          },
        };
      }

      // Set up custom fields
      if (configuration.customFields && configuration.customFields.length > 0) {
        await this.setupCustomFields(tenantId, configuration.customFields);
      }

      // Set up workflow states
      if (configuration.workflowCustomizations && configuration.workflowCustomizations.length > 0) {
        await this.setupWorkflowStates(tenantId, configuration.workflowCustomizations);
      } else {
        // Set up default workflow states from business type
        await this.setupDefaultWorkflowStates(tenantId, configuration.businessTypeId);
      }

      // Get the complete configuration
      return await this.getTenantBusinessConfig(tenantId);

    } catch (error) {
      console.error('Error configuring tenant business:', error);
      return {
        success: false,
        error: {
          code: 'CONFIGURATION_FAILED',
          message: 'Failed to configure tenant business',
          tenantId,
        },
      };
    }
  }

  /**
   * Configure tenant from business type template
   */
  async configureTenantFromTemplate(
    tenantId: string,
    templateId: string,
    customizations?: Partial<BusinessConfigurationRequest>
  ): Promise<ServiceResponse<TenantBusinessConfig>> {
    try {
      // Get business type template
      const templateResult = await this.businessTypeService.getBusinessTypeTemplate(templateId);
      if (!templateResult.success) {
        return templateResult;
      }

      const template = templateResult.data!;

      // Create business type from template if it doesn't exist
      let businessTypeId = template.id;
      const existingTypeResult = await this.businessTypeService.getBusinessType(template.id);
      
      if (!existingTypeResult.success) {
        const createTypeResult = await this.businessTypeService.createBusinessTypeFromTemplate(templateId);
        if (!createTypeResult.success) {
          return createTypeResult;
        }
        businessTypeId = createTypeResult.data!.id;
      }

      // Build configuration from template
      const configuration: BusinessConfigurationRequest = {
        businessTypeId,
        terminologyOverrides: customizations?.terminologyOverrides || template.terminology,
        configurationOverrides: customizations?.configurationOverrides || template.defaultConfig,
        customFields: customizations?.customFields || template.customFields,
        workflowCustomizations: customizations?.workflowCustomizations || [{
          workflowType: 'transaction',
          states: template.workflowStates,
        }],
      };

      return await this.configureTenantBusiness(tenantId, configuration);

    } catch (error) {
      console.error('Error configuring tenant from template:', error);
      return {
        success: false,
        error: {
          code: 'TEMPLATE_CONFIGURATION_FAILED',
          message: 'Failed to configure tenant from template',
          tenantId,
        },
      };
    }
  }

  /**
   * Update tenant business configuration
   */
  async updateTenantBusinessConfig(
    tenantId: string,
    updates: Partial<BusinessConfigurationRequest>
  ): Promise<ServiceResponse<TenantBusinessConfig>> {
    try {
      // Get current configuration
      const currentConfigResult = await this.getTenantBusinessConfig(tenantId);
      if (!currentConfigResult.success) {
        return currentConfigResult;
      }

      const currentConfig = currentConfigResult.data!;

      // Build updated configuration
      const updatedConfiguration: BusinessConfigurationRequest = {
        businessTypeId: updates.businessTypeId || currentConfig.businessType.id,
        terminologyOverrides: updates.terminologyOverrides || currentConfig.terminology,
        configurationOverrides: updates.configurationOverrides || currentConfig.configuration,
        customFields: updates.customFields,
        workflowCustomizations: updates.workflowCustomizations,
      };

      return await this.configureTenantBusiness(tenantId, updatedConfiguration);

    } catch (error) {
      console.error('Error updating tenant business config:', error);
      return {
        success: false,
        error: {
          code: 'CONFIG_UPDATE_FAILED',
          message: 'Failed to update tenant business configuration',
          tenantId,
        },
      };
    }
  }

  /**
   * Reset tenant business configuration
   */
  async resetTenantBusinessConfig(tenantId: string): Promise<ServiceResponse<void>> {
    try {
      // Clear business type assignment
      await this.tenantService.updateTenant(tenantId, {
        businessTypeId: null,
        businessConfig: {},
        terminology: {},
      });

      // Remove custom fields
      await this.db
        .delete(schema.customFields)
        .where(eq(schema.customFields.tenantId, tenantId));

      // Remove workflow states
      await this.db
        .delete(schema.workflowStates)
        .where(eq(schema.workflowStates.tenantId, tenantId));

      return { success: true };

    } catch (error) {
      console.error('Error resetting tenant business config:', error);
      return {
        success: false,
        error: {
          code: 'CONFIG_RESET_FAILED',
          message: 'Failed to reset tenant business configuration',
          tenantId,
        },
      };
    }
  }

  // ===== CONFIGURATION VALIDATION =====

  /**
   * Validate business configuration
   */
  async validateConfiguration(
    tenantId: string,
    configuration: BusinessConfigurationRequest
  ): Promise<ConfigurationValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    try {
      // Validate business type exists
      const businessTypeResult = await this.businessTypeService.getBusinessType(configuration.businessTypeId);
      if (!businessTypeResult.success) {
        errors.push('Business type not found');
      }

      // Validate custom fields
      if (configuration.customFields) {
        for (const field of configuration.customFields) {
          if (!field.name || !field.label || !field.fieldType) {
            errors.push(`Custom field missing required properties: ${field.name || 'unnamed'}`);
          }

          if (field.fieldType === 'select' || field.fieldType === 'multiselect') {
            if (!field.fieldOptions || field.fieldOptions.length === 0) {
              errors.push(`Select field '${field.name}' must have options`);
            }
          }

          // Check for duplicate field names within entity type
          const duplicates = configuration.customFields!.filter(f => 
            f.entityType === field.entityType && f.name === field.name
          );
          if (duplicates.length > 1) {
            errors.push(`Duplicate custom field name '${field.name}' for entity type '${field.entityType}'`);
          }
        }
      }

      // Validate workflow customizations
      if (configuration.workflowCustomizations) {
        for (const workflow of configuration.workflowCustomizations) {
          if (!workflow.states || workflow.states.length === 0) {
            errors.push(`Workflow '${workflow.workflowType}' must have at least one state`);
          }

          // Check for initial and final states
          const hasInitialState = workflow.states.some(s => s.stateType === 'initial');
          const hasFinalState = workflow.states.some(s => s.stateType === 'final');

          if (!hasInitialState) {
            errors.push(`Workflow '${workflow.workflowType}' must have at least one initial state`);
          }

          if (!hasFinalState) {
            warnings.push(`Workflow '${workflow.workflowType}' should have at least one final state`);
          }

          // Check for duplicate state names
          const stateNames = workflow.states.map(s => s.name);
          const uniqueStateNames = new Set(stateNames);
          if (stateNames.length !== uniqueStateNames.size) {
            errors.push(`Workflow '${workflow.workflowType}' has duplicate state names`);
          }
        }
      }

      // Validate terminology
      if (configuration.terminologyOverrides) {
        const requiredTerms = ['offering', 'transaction', 'customer'];
        for (const term of requiredTerms) {
          if (!configuration.terminologyOverrides[term]) {
            warnings.push(`Missing terminology for '${term}' - will use business type default`);
          }
        }
      }

      // Add suggestions based on business type
      if (businessTypeResult.success) {
        const businessType = businessTypeResult.data!;
        
        if (businessType.category === 'hospitality' && !configuration.customFields?.some(f => f.name === 'party_size')) {
          suggestions.push('Consider adding a "party_size" field for hospitality businesses');
        }

        if (businessType.category === 'healthcare' && !configuration.customFields?.some(f => f.name === 'symptoms')) {
          suggestions.push('Consider adding a "symptoms" field for healthcare businesses');
        }

        if (businessType.category === 'retail' && !configuration.customFields?.some(f => f.name === 'delivery_address')) {
          suggestions.push('Consider adding a "delivery_address" field for retail businesses');
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        suggestions,
      };

    } catch (error) {
      console.error('Error validating configuration:', error);
      return {
        isValid: false,
        errors: ['Configuration validation failed'],
        warnings: [],
        suggestions: [],
      };
    }
  }

  /**
   * Get configuration recommendations for tenant
   */
  async getConfigurationRecommendations(
    tenantId: string,
    businessTypeId: string
  ): Promise<ServiceResponse<{
    recommendedFields: Array<{
      entityType: string;
      name: string;
      label: string;
      fieldType: string;
      reason: string;
    }>;
    recommendedWorkflows: Array<{
      workflowType: string;
      states: Array<{
        name: string;
        displayName: string;
        reason: string;
      }>;
    }>;
    recommendedIntegrations: Array<{
      name: string;
      description: string;
      reason: string;
    }>;
  }>> {
    try {
      // Get business type
      const businessTypeResult = await this.businessTypeService.getBusinessType(businessTypeId);
      if (!businessTypeResult.success) {
        return businessTypeResult;
      }

      const businessType = businessTypeResult.data!;
      const recommendations = {
        recommendedFields: [] as any[],
        recommendedWorkflows: [] as any[],
        recommendedIntegrations: [] as any[],
      };

      // Generate recommendations based on business type
      switch (businessType.category) {
        case 'hospitality':
          recommendations.recommendedFields.push(
            {
              entityType: 'transaction',
              name: 'party_size',
              label: 'Party Size',
              fieldType: 'number',
              reason: 'Essential for table management and capacity planning',
            },
            {
              entityType: 'transaction',
              name: 'seating_preference',
              label: 'Seating Preference',
              fieldType: 'select',
              reason: 'Improves customer experience with preferred seating',
            },
            {
              entityType: 'offering',
              name: 'dietary_info',
              label: 'Dietary Information',
              fieldType: 'multiselect',
              reason: 'Important for food allergies and dietary restrictions',
            }
          );
          
          recommendations.recommendedIntegrations.push(
            {
              name: 'POS System',
              description: 'Point of sale system integration',
              reason: 'Sync menu items and pricing automatically',
            },
            {
              name: 'Table Management',
              description: 'Restaurant table management system',
              reason: 'Real-time table availability and seating optimization',
            }
          );
          break;

        case 'healthcare':
          recommendations.recommendedFields.push(
            {
              entityType: 'transaction',
              name: 'symptoms',
              label: 'Symptoms',
              fieldType: 'text',
              reason: 'Helps healthcare providers prepare for appointments',
            },
            {
              entityType: 'transaction',
              name: 'insurance_info',
              label: 'Insurance Information',
              fieldType: 'select',
              reason: 'Required for billing and coverage verification',
            },
            {
              entityType: 'transaction',
              name: 'emergency_contact',
              label: 'Emergency Contact',
              fieldType: 'text',
              reason: 'Safety requirement for medical appointments',
            }
          );

          recommendations.recommendedIntegrations.push(
            {
              name: 'EMR System',
              description: 'Electronic Medical Records integration',
              reason: 'Sync patient data and appointment history',
            },
            {
              name: 'Insurance Verification',
              description: 'Real-time insurance verification service',
              reason: 'Verify coverage before appointments',
            }
          );
          break;

        case 'retail':
          recommendations.recommendedFields.push(
            {
              entityType: 'offering',
              name: 'sku',
              label: 'SKU',
              fieldType: 'text',
              reason: 'Essential for inventory management and tracking',
            },
            {
              entityType: 'offering',
              name: 'stock_level',
              label: 'Stock Level',
              fieldType: 'number',
              reason: 'Track inventory levels and prevent overselling',
            },
            {
              entityType: 'transaction',
              name: 'delivery_address',
              label: 'Delivery Address',
              fieldType: 'text',
              reason: 'Required for order fulfillment and shipping',
            }
          );

          recommendations.recommendedIntegrations.push(
            {
              name: 'Inventory Management',
              description: 'Inventory tracking system integration',
              reason: 'Real-time stock levels and automatic reordering',
            },
            {
              name: 'Shipping Provider',
              description: 'Shipping and logistics integration',
              reason: 'Automated shipping label generation and tracking',
            }
          );
          break;
      }

      return {
        success: true,
        data: recommendations,
      };

    } catch (error) {
      console.error('Error getting configuration recommendations:', error);
      return {
        success: false,
        error: {
          code: 'RECOMMENDATIONS_FAILED',
          message: 'Failed to get configuration recommendations',
          tenantId,
        },
      };
    }
  }

  // ===== SETUP UTILITIES =====

  /**
   * Set up custom fields for tenant
   */
  private async setupCustomFields(
    tenantId: string,
    customFieldsConfig: BusinessConfigurationRequest['customFields']
  ): Promise<void> {
    if (!customFieldsConfig) return;

    // Remove existing custom fields
    await this.db
      .delete(schema.customFields)
      .where(eq(schema.customFields.tenantId, tenantId));

    // Insert new custom fields
    for (const fieldConfig of customFieldsConfig) {
      await this.db
        .insert(schema.customFields)
        .values({
          tenantId,
          entityType: fieldConfig.entityType,
          name: fieldConfig.name,
          label: fieldConfig.label,
          fieldType: fieldConfig.fieldType,
          isRequired: fieldConfig.isRequired,
          validationRules: fieldConfig.validationRules || {},
          fieldOptions: fieldConfig.fieldOptions || [],
          defaultValue: fieldConfig.defaultValue,
          displayOrder: 0,
          isActive: true,
          metadata: {},
        });
    }
  }

  /**
   * Set up workflow states for tenant
   */
  private async setupWorkflowStates(
    tenantId: string,
    workflowCustomizations: BusinessConfigurationRequest['workflowCustomizations']
  ): Promise<void> {
    if (!workflowCustomizations) return;

    // Remove existing workflow states
    await this.db
      .delete(schema.workflowStates)
      .where(eq(schema.workflowStates.tenantId, tenantId));

    // Insert new workflow states
    for (const workflow of workflowCustomizations) {
      for (let i = 0; i < workflow.states.length; i++) {
        const state = workflow.states[i];
        await this.db
          .insert(schema.workflowStates)
          .values({
            tenantId,
            workflowType: workflow.workflowType,
            name: state.name,
            displayName: state.displayName,
            stateType: state.stateType,
            color: state.color,
            description: state.description,
            isSystem: false,
            displayOrder: i,
            metadata: {},
          });
      }
    }
  }

  /**
   * Set up default workflow states from business type
   */
  private async setupDefaultWorkflowStates(
    tenantId: string,
    businessTypeId: string
  ): Promise<void> {
    // This would typically call the database function setup_default_workflow_states
    // For now, we'll implement basic default states
    const defaultStates = [
      { name: 'pending', displayName: 'Pending', stateType: 'initial', color: '#F59E0B' },
      { name: 'confirmed', displayName: 'Confirmed', stateType: 'intermediate', color: '#10B981' },
      { name: 'in_progress', displayName: 'In Progress', stateType: 'intermediate', color: '#3B82F6' },
      { name: 'completed', displayName: 'Completed', stateType: 'final', color: '#059669' },
      { name: 'cancelled', displayName: 'Cancelled', stateType: 'final', color: '#EF4444' },
    ];

    for (let i = 0; i < defaultStates.length; i++) {
      const state = defaultStates[i];
      await this.db
        .insert(schema.workflowStates)
        .values({
          tenantId,
          workflowType: 'transaction',
          name: state.name,
          displayName: state.displayName,
          stateType: state.stateType,
          color: state.color,
          isSystem: true,
          displayOrder: i,
          metadata: {},
        });
    }
  }

  // ===== MIGRATION UTILITIES =====

  /**
   * Migrate tenant from legacy configuration
   */
  async migrateTenantFromLegacy(
    tenantId: string,
    targetBusinessTypeId: string
  ): Promise<ServiceResponse<{
    migratedServices: number;
    migratedBookings: number;
    migratedConversations: number;
  }>> {
    try {
      // This would implement migration logic from services/bookings to offerings/transactions
      // For now, return a placeholder response
      return {
        success: true,
        data: {
          migratedServices: 0,
          migratedBookings: 0,
          migratedConversations: 0,
        },
      };

    } catch (error) {
      console.error('Error migrating tenant from legacy:', error);
      return {
        success: false,
        error: {
          code: 'MIGRATION_FAILED',
          message: 'Failed to migrate tenant from legacy configuration',
          tenantId,
        },
      };
    }
  }

  /**
   * Get migration status for tenant
   */
  async getMigrationStatus(tenantId: string): Promise<ServiceResponse<{
    needsMigration: boolean;
    legacyServicesCount: number;
    legacyBookingsCount: number;
    newOfferingsCount: number;
    newTransactionsCount: number;
  }>> {
    try {
      // Count legacy data
      const [legacyServices] = await this.db
        .select({ count: schema.services.id })
        .from(schema.services)
        .where(eq(schema.services.tenantId, tenantId));

      const [legacyBookings] = await this.db
        .select({ count: schema.bookings.id })
        .from(schema.bookings)
        .where(eq(schema.bookings.tenantId, tenantId));

      // Count new data
      const [newOfferings] = await this.db
        .select({ count: schema.offerings.id })
        .from(schema.offerings)
        .where(eq(schema.offerings.tenantId, tenantId));

      const [newTransactions] = await this.db
        .select({ count: schema.transactions.id })
        .from(schema.transactions)
        .where(eq(schema.transactions.tenantId, tenantId));

      const legacyServicesCount = Number(legacyServices?.count) || 0;
      const legacyBookingsCount = Number(legacyBookings?.count) || 0;
      const newOfferingsCount = Number(newOfferings?.count) || 0;
      const newTransactionsCount = Number(newTransactions?.count) || 0;

      const needsMigration = (legacyServicesCount > 0 || legacyBookingsCount > 0) && 
                            (newOfferingsCount === 0 && newTransactionsCount === 0);

      return {
        success: true,
        data: {
          needsMigration,
          legacyServicesCount,
          legacyBookingsCount,
          newOfferingsCount,
          newTransactionsCount,
        },
      };

    } catch (error) {
      console.error('Error getting migration status:', error);
      return {
        success: false,
        error: {
          code: 'MIGRATION_STATUS_FAILED',
          message: 'Failed to get migration status',
          tenantId,
        },
      };
    }
  }

  // ===== UTILITY METHODS =====

  /**
   * Get all configured tenants
   */
  async getConfiguredTenants(): Promise<ServiceResponse<Array<{
    tenant: Tenant;
    businessType: BusinessType;
    configurationStatus: 'complete' | 'partial' | 'none';
  }>>> {
    try {
      // Get all tenants
      const tenantsResult = await this.tenantService.listTenants({ page: 1, limit: 1000 });
      if (!tenantsResult.success) {
        return tenantsResult;
      }

      const tenants = tenantsResult.data!.data;
      const configuredTenants = [];

      for (const tenant of tenants) {
        let businessType: BusinessType | null = null;
        let configurationStatus: 'complete' | 'partial' | 'none' = 'none';

        if (tenant.businessTypeId) {
          const businessTypeResult = await this.businessTypeService.getBusinessType(tenant.businessTypeId);
          if (businessTypeResult.success) {
            businessType = businessTypeResult.data!;
            
            // Check if configuration is complete
            const configResult = await this.getTenantBusinessConfig(tenant.id);
            if (configResult.success && configResult.data!.isConfigured) {
              configurationStatus = configResult.data!.customFields.length > 0 ? 'complete' : 'partial';
            } else {
              configurationStatus = 'partial';
            }
          }
        }

        if (businessType) {
          configuredTenants.push({
            tenant,
            businessType,
            configurationStatus,
          });
        }
      }

      return {
        success: true,
        data: configuredTenants,
      };

    } catch (error) {
      console.error('Error getting configured tenants:', error);
      return {
        success: false,
        error: {
          code: 'CONFIGURED_TENANTS_FETCH_FAILED',
          message: 'Failed to fetch configured tenants',
        },
      };
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    try {
      await this.pool.end();
    } catch (error) {
      console.error('Error cleaning up tenant business config service:', error);
    }
  }
}
      };

    } catch (error) {
      console.error('Error getting configured tenants:', error);
      return {
        success: false,
        error: {
          code: 'CONFIGURED_TENANTS_FETCH_FAILED',
          message: 'Failed to fetch configured tenants',
        },
      };
    }
  }

  /**
   * Close service and cleanup resources
   */
  async close(): Promise<void> {
    await this.businessTypeService.close();
    await this.tenantService.close();
    await this.pool.end();
  }
}