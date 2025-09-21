/**
 * Business Type Management Service
 * Handles CRUD operations for business types and templates
 */

import { eq, and, desc } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import * as schema from '@shared/schema';
import type { ServiceResponse } from '@shared/types/tenant';
import type { BusinessType, InsertBusinessType } from '@shared/schema';

export interface BusinessTypeTemplate {
  id: string;
  name: string;
  displayName: string;
  category: string;
  description: string;
  terminology: {
    offering: string;
    transaction: string;
    customer: string;
    plural_offering: string;
    plural_transaction: string;
  };
  defaultConfig: {
    offering_types: string[];
    transaction_types: string[];
    requires_scheduling: boolean;
    default_duration?: number;
    supports_variants?: boolean;
    supports_inventory?: boolean;
    supports_staff?: boolean;
    supports_capacity?: boolean;
  };
  customFields: Array<{
    entityType: string;
    name: string;
    label: string;
    fieldType: string;
    isRequired: boolean;
    fieldOptions?: any[];
  }>;
  workflowStates: Array<{
    name: string;
    displayName: string;
    stateType: string;
    color: string;
  }>;
  botFlowTemplate?: {
    name: string;
    description: string;
    nodes: any[];
    variables: Record<string, any>;
  };
}

export interface CreateBusinessTypeRequest {
  name: string;
  displayName: string;
  category: string;
  description?: string;
  terminology: Record<string, string>;
  defaultConfig: Record<string, any>;
  isSystem?: boolean;
}

export interface UpdateBusinessTypeRequest {
  displayName?: string;
  description?: string;
  terminology?: Record<string, string>;
  defaultConfig?: Record<string, any>;
  isActive?: boolean;
}

export class BusinessTypeService {
  private db: ReturnType<typeof drizzle>;
  private pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString });
    this.db = drizzle({ client: this.pool, schema });
  }

  // ===== BUSINESS TYPE CRUD OPERATIONS =====

  /**
   * Get all business types
   */
  async getBusinessTypes(includeInactive = false): Promise<ServiceResponse<BusinessType[]>> {
    try {
      const conditions = includeInactive ? [] : [eq(schema.businessTypes.isActive, true)];
      
      const businessTypes = await this.db
        .select()
        .from(schema.businessTypes)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(schema.businessTypes.isSystem), schema.businessTypes.displayName);

      return {
        success: true,
        data: businessTypes,
      };
    } catch (error) {
      console.error('Error getting business types:', error);
      return {
        success: false,
        error: {
          code: 'BUSINESS_TYPES_FETCH_FAILED',
          message: 'Failed to fetch business types',
        },
      };
    }
  }

  /**
   * Get business type by ID
   */
  async getBusinessType(id: string): Promise<ServiceResponse<BusinessType>> {
    try {
      const [businessType] = await this.db
        .select()
        .from(schema.businessTypes)
        .where(eq(schema.businessTypes.id, id))
        .limit(1);

      if (!businessType) {
        return {
          success: false,
          error: {
            code: 'BUSINESS_TYPE_NOT_FOUND',
            message: 'Business type not found',
          },
        };
      }

      return {
        success: true,
        data: businessType,
      };
    } catch (error) {
      console.error('Error getting business type:', error);
      return {
        success: false,
        error: {
          code: 'BUSINESS_TYPE_FETCH_FAILED',
          message: 'Failed to fetch business type',
        },
      };
    }
  }

  /**
   * Get business types by category
   */
  async getBusinessTypesByCategory(category: string): Promise<ServiceResponse<BusinessType[]>> {
    try {
      const businessTypes = await this.db
        .select()
        .from(schema.businessTypes)
        .where(and(
          eq(schema.businessTypes.category, category),
          eq(schema.businessTypes.isActive, true)
        ))
        .orderBy(schema.businessTypes.displayName);

      return {
        success: true,
        data: businessTypes,
      };
    } catch (error) {
      console.error('Error getting business types by category:', error);
      return {
        success: false,
        error: {
          code: 'BUSINESS_TYPES_FETCH_FAILED',
          message: 'Failed to fetch business types by category',
        },
      };
    }
  }

  /**
   * Create a new business type
   */
  async createBusinessType(data: CreateBusinessTypeRequest): Promise<ServiceResponse<BusinessType>> {
    try {
      // Validate that name is unique
      const existingType = await this.db
        .select()
        .from(schema.businessTypes)
        .where(eq(schema.businessTypes.name, data.name))
        .limit(1);

      if (existingType.length > 0) {
        return {
          success: false,
          error: {
            code: 'BUSINESS_TYPE_NAME_EXISTS',
            message: 'Business type with this name already exists',
          },
        };
      }

      // Create the business type
      const insertData: InsertBusinessType = {
        name: data.name,
        displayName: data.displayName,
        category: data.category,
        description: data.description,
        terminology: data.terminology,
        defaultConfig: data.defaultConfig,
        isSystem: data.isSystem || false,
        isActive: true,
      };

      const [businessType] = await this.db
        .insert(schema.businessTypes)
        .values(insertData)
        .returning();

      return {
        success: true,
        data: businessType,
      };
    } catch (error) {
      console.error('Error creating business type:', error);
      return {
        success: false,
        error: {
          code: 'BUSINESS_TYPE_CREATE_FAILED',
          message: 'Failed to create business type',
        },
      };
    }
  }

  /**
   * Update a business type
   */
  async updateBusinessType(
    id: string,
    data: UpdateBusinessTypeRequest
  ): Promise<ServiceResponse<BusinessType>> {
    try {
      // Check if business type exists
      const existingType = await this.getBusinessType(id);
      if (!existingType.success) {
        return existingType;
      }

      // Prevent updating system business types
      if (existingType.data!.isSystem) {
        return {
          success: false,
          error: {
            code: 'SYSTEM_BUSINESS_TYPE_UPDATE_FORBIDDEN',
            message: 'Cannot update system business types',
          },
        };
      }

      // Update the business type
      const [updatedBusinessType] = await this.db
        .update(schema.businessTypes)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(schema.businessTypes.id, id))
        .returning();

      return {
        success: true,
        data: updatedBusinessType,
      };
    } catch (error) {
      console.error('Error updating business type:', error);
      return {
        success: false,
        error: {
          code: 'BUSINESS_TYPE_UPDATE_FAILED',
          message: 'Failed to update business type',
        },
      };
    }
  }

  /**
   * Delete a business type
   */
  async deleteBusinessType(id: string): Promise<ServiceResponse<void>> {
    try {
      // Check if business type exists
      const existingType = await this.getBusinessType(id);
      if (!existingType.success) {
        return existingType;
      }

      // Prevent deleting system business types
      if (existingType.data!.isSystem) {
        return {
          success: false,
          error: {
            code: 'SYSTEM_BUSINESS_TYPE_DELETE_FORBIDDEN',
            message: 'Cannot delete system business types',
          },
        };
      }

      // Check if any tenants are using this business type
      const tenantsUsingType = await this.db
        .select()
        .from(schema.tenants)
        .where(eq(schema.tenants.businessTypeId, id))
        .limit(1);

      if (tenantsUsingType.length > 0) {
        return {
          success: false,
          error: {
            code: 'BUSINESS_TYPE_IN_USE',
            message: 'Cannot delete business type that is in use by tenants',
          },
        };
      }

      // Delete the business type
      await this.db
        .delete(schema.businessTypes)
        .where(eq(schema.businessTypes.id, id));

      return {
        success: true,
      };
    } catch (error) {
      console.error('Error deleting business type:', error);
      return {
        success: false,
        error: {
          code: 'BUSINESS_TYPE_DELETE_FAILED',
          message: 'Failed to delete business type',
        },
      };
    }
  }

  // ===== BUSINESS TYPE TEMPLATES =====

  /**
   * Get predefined business type templates
   */
  async getBusinessTypeTemplates(): Promise<ServiceResponse<BusinessTypeTemplate[]>> {
    try {
      const templates: BusinessTypeTemplate[] = [
        {
          id: 'restaurant',
          name: 'restaurant',
          displayName: 'Restaurant',
          category: 'hospitality',
          description: 'Full-service restaurant with table reservations and menu ordering',
          terminology: {
            offering: 'Menu Item',
            transaction: 'Reservation',
            customer: 'Guest',
            plural_offering: 'Menu Items',
            plural_transaction: 'Reservations',
          },
          defaultConfig: {
            offering_types: ['appetizer', 'main_course', 'dessert', 'beverage'],
            transaction_types: ['reservation', 'takeout', 'delivery'],
            requires_scheduling: true,
            default_duration: 120,
            supports_variants: true,
            supports_capacity: true,
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
                { value: 'dairy_free', label: 'Dairy Free' },
              ],
            },
            {
              entityType: 'transaction',
              name: 'party_size',
              label: 'Party Size',
              fieldType: 'number',
              isRequired: true,
            },
            {
              entityType: 'transaction',
              name: 'special_requests',
              label: 'Special Requests',
              fieldType: 'text',
              isRequired: false,
            },
          ],
          workflowStates: [
            { name: 'pending', displayName: 'Pending', stateType: 'initial', color: '#F59E0B' },
            { name: 'confirmed', displayName: 'Confirmed', stateType: 'intermediate', color: '#10B981' },
            { name: 'seated', displayName: 'Seated', stateType: 'intermediate', color: '#3B82F6' },
            { name: 'completed', displayName: 'Completed', stateType: 'final', color: '#059669' },
            { name: 'cancelled', displayName: 'Cancelled', stateType: 'final', color: '#EF4444' },
            { name: 'no_show', displayName: 'No Show', stateType: 'final', color: '#6B7280' },
          ],
          botFlowTemplate: {
            name: 'Restaurant Reservation Flow',
            description: 'Complete flow for restaurant table reservations',
            nodes: [
              {
                id: 'greeting',
                type: 'message',
                config: {
                  message: {
                    text: 'Welcome to our restaurant! I can help you make a reservation. What would you like to do?',
                    type: 'interactive',
                    buttons: [
                      { id: 'make_reservation', title: 'Make Reservation' },
                      { id: 'view_menu', title: 'View Menu' },
                      { id: 'contact_info', title: 'Contact Info' },
                    ],
                  },
                },
              },
              {
                id: 'ask_party_size',
                type: 'question',
                config: {
                  question: {
                    text: 'How many people will be dining with us?',
                    fieldName: 'party_size',
                    fieldType: 'number',
                    required: true,
                    validation: [
                      { type: 'min', value: 1, message: 'Party size must be at least 1' },
                      { type: 'max', value: 20, message: 'For parties larger than 20, please call us directly' },
                    ],
                  },
                },
              },
            ],
            variables: {
              party_size: { type: 'number', required: true },
              reservation_date: { type: 'date', required: true },
              reservation_time: { type: 'time', required: true },
              special_requests: { type: 'string', required: false },
            },
          },
        },
        {
          id: 'clinic',
          name: 'clinic',
          displayName: 'Medical Clinic',
          category: 'healthcare',
          description: 'Healthcare clinic with appointment scheduling and treatment management',
          terminology: {
            offering: 'Treatment',
            transaction: 'Appointment',
            customer: 'Patient',
            plural_offering: 'Treatments',
            plural_transaction: 'Appointments',
          },
          defaultConfig: {
            offering_types: ['consultation', 'treatment', 'procedure', 'follow_up'],
            transaction_types: ['appointment', 'emergency', 'telemedicine'],
            requires_scheduling: true,
            default_duration: 30,
            supports_staff: true,
          },
          customFields: [
            {
              entityType: 'transaction',
              name: 'symptoms',
              label: 'Symptoms',
              fieldType: 'text',
              isRequired: false,
            },
            {
              entityType: 'transaction',
              name: 'insurance_provider',
              label: 'Insurance Provider',
              fieldType: 'select',
              isRequired: false,
              fieldOptions: [
                { value: 'aetna', label: 'Aetna' },
                { value: 'blue_cross', label: 'Blue Cross Blue Shield' },
                { value: 'cigna', label: 'Cigna' },
                { value: 'united', label: 'United Healthcare' },
                { value: 'other', label: 'Other' },
              ],
            },
          ],
          workflowStates: [
            { name: 'scheduled', displayName: 'Scheduled', stateType: 'initial', color: '#F59E0B' },
            { name: 'confirmed', displayName: 'Confirmed', stateType: 'intermediate', color: '#10B981' },
            { name: 'checked_in', displayName: 'Checked In', stateType: 'intermediate', color: '#3B82F6' },
            { name: 'in_progress', displayName: 'In Progress', stateType: 'intermediate', color: '#8B5CF6' },
            { name: 'completed', displayName: 'Completed', stateType: 'final', color: '#059669' },
            { name: 'cancelled', displayName: 'Cancelled', stateType: 'final', color: '#EF4444' },
            { name: 'rescheduled', displayName: 'Rescheduled', stateType: 'intermediate', color: '#F97316' },
          ],
        },
        {
          id: 'retail_store',
          name: 'retail_store',
          displayName: 'Retail Store',
          category: 'retail',
          description: 'Retail business with product catalog and order management',
          terminology: {
            offering: 'Product',
            transaction: 'Order',
            customer: 'Customer',
            plural_offering: 'Products',
            plural_transaction: 'Orders',
          },
          defaultConfig: {
            offering_types: ['product'],
            transaction_types: ['order', 'pickup', 'delivery'],
            requires_scheduling: false,
            supports_inventory: true,
            supports_variants: true,
          },
          customFields: [
            {
              entityType: 'offering',
              name: 'sku',
              label: 'SKU',
              fieldType: 'text',
              isRequired: true,
            },
            {
              entityType: 'offering',
              name: 'stock_quantity',
              label: 'Stock Quantity',
              fieldType: 'number',
              isRequired: true,
            },
            {
              entityType: 'transaction',
              name: 'delivery_address',
              label: 'Delivery Address',
              fieldType: 'text',
              isRequired: false,
            },
          ],
          workflowStates: [
            { name: 'pending', displayName: 'Pending', stateType: 'initial', color: '#F59E0B' },
            { name: 'confirmed', displayName: 'Confirmed', stateType: 'intermediate', color: '#10B981' },
            { name: 'preparing', displayName: 'Preparing', stateType: 'intermediate', color: '#3B82F6' },
            { name: 'ready', displayName: 'Ready for Pickup', stateType: 'intermediate', color: '#8B5CF6' },
            { name: 'completed', displayName: 'Completed', stateType: 'final', color: '#059669' },
            { name: 'cancelled', displayName: 'Cancelled', stateType: 'final', color: '#EF4444' },
          ],
        },
        {
          id: 'salon',
          name: 'salon',
          displayName: 'Beauty Salon',
          category: 'service',
          description: 'Beauty salon with service bookings and staff scheduling',
          terminology: {
            offering: 'Service',
            transaction: 'Booking',
            customer: 'Client',
            plural_offering: 'Services',
            plural_transaction: 'Bookings',
          },
          defaultConfig: {
            offering_types: ['haircut', 'coloring', 'styling', 'treatment'],
            transaction_types: ['booking'],
            requires_scheduling: true,
            default_duration: 60,
            supports_staff: true,
          },
          customFields: [
            {
              entityType: 'transaction',
              name: 'preferred_stylist',
              label: 'Preferred Stylist',
              fieldType: 'select',
              isRequired: false,
              fieldOptions: [
                { value: 'any', label: 'Any Available' },
                { value: 'sarah', label: 'Sarah' },
                { value: 'mike', label: 'Mike' },
                { value: 'jessica', label: 'Jessica' },
              ],
            },
            {
              entityType: 'transaction',
              name: 'hair_type',
              label: 'Hair Type',
              fieldType: 'select',
              isRequired: false,
              fieldOptions: [
                { value: 'straight', label: 'Straight' },
                { value: 'wavy', label: 'Wavy' },
                { value: 'curly', label: 'Curly' },
                { value: 'coily', label: 'Coily' },
              ],
            },
          ],
          workflowStates: [
            { name: 'pending', displayName: 'Pending', stateType: 'initial', color: '#F59E0B' },
            { name: 'confirmed', displayName: 'Confirmed', stateType: 'intermediate', color: '#10B981' },
            { name: 'in_progress', displayName: 'In Progress', stateType: 'intermediate', color: '#3B82F6' },
            { name: 'completed', displayName: 'Completed', stateType: 'final', color: '#059669' },
            { name: 'cancelled', displayName: 'Cancelled', stateType: 'final', color: '#EF4444' },
          ],
        },
      ];

      return {
        success: true,
        data: templates,
      };
    } catch (error) {
      console.error('Error getting business type templates:', error);
      return {
        success: false,
        error: {
          code: 'TEMPLATES_FETCH_FAILED',
          message: 'Failed to fetch business type templates',
        },
      };
    }
  }

  /**
   * Get business type template by ID
   */
  async getBusinessTypeTemplate(templateId: string): Promise<ServiceResponse<BusinessTypeTemplate>> {
    try {
      const templatesResult = await this.getBusinessTypeTemplates();
      if (!templatesResult.success) {
        return templatesResult;
      }

      const template = templatesResult.data!.find(t => t.id === templateId);
      if (!template) {
        return {
          success: false,
          error: {
            code: 'TEMPLATE_NOT_FOUND',
            message: 'Business type template not found',
          },
        };
      }

      return {
        success: true,
        data: template,
      };
    } catch (error) {
      console.error('Error getting business type template:', error);
      return {
        success: false,
        error: {
          code: 'TEMPLATE_FETCH_FAILED',
          message: 'Failed to fetch business type template',
        },
      };
    }
  }

  /**
   * Create business type from template
   */
  async createBusinessTypeFromTemplate(
    templateId: string,
    customizations?: Partial<CreateBusinessTypeRequest>
  ): Promise<ServiceResponse<BusinessType>> {
    try {
      const templateResult = await this.getBusinessTypeTemplate(templateId);
      if (!templateResult.success) {
        return templateResult;
      }

      const template = templateResult.data!;

      // Create business type data from template
      const businessTypeData: CreateBusinessTypeRequest = {
        name: customizations?.name || template.name,
        displayName: customizations?.displayName || template.displayName,
        category: customizations?.category || template.category,
        description: customizations?.description || template.description,
        terminology: customizations?.terminology || template.terminology,
        defaultConfig: customizations?.defaultConfig || template.defaultConfig,
        isSystem: false, // Custom business types are never system types
      };

      return await this.createBusinessType(businessTypeData);
    } catch (error) {
      console.error('Error creating business type from template:', error);
      return {
        success: false,
        error: {
          code: 'TEMPLATE_CREATE_FAILED',
          message: 'Failed to create business type from template',
        },
      };
    }
  }

  // ===== UTILITY METHODS =====

  /**
   * Get business type categories
   */
  async getBusinessTypeCategories(): Promise<ServiceResponse<Array<{ category: string; count: number }>>> {
    try {
      const categories = await this.db
        .select({
          category: schema.businessTypes.category,
        })
        .from(schema.businessTypes)
        .where(eq(schema.businessTypes.isActive, true))
        .groupBy(schema.businessTypes.category);

      // Count business types per category
      const categoriesWithCount = await Promise.all(
        categories.map(async ({ category }) => {
          const [{ count }] = await this.db
            .select({
              count: schema.businessTypes.id,
            })
            .from(schema.businessTypes)
            .where(and(
              eq(schema.businessTypes.category, category),
              eq(schema.businessTypes.isActive, true)
            ));

          return {
            category,
            count: Number(count) || 0,
          };
        })
      );

      return {
        success: true,
        data: categoriesWithCount,
      };
    } catch (error) {
      console.error('Error getting business type categories:', error);
      return {
        success: false,
        error: {
          code: 'CATEGORIES_FETCH_FAILED',
          message: 'Failed to fetch business type categories',
        },
      };
    }
  }

  /**
   * Search business types
   */
  async searchBusinessTypes(query: string): Promise<ServiceResponse<BusinessType[]>> {
    try {
      // Simple text search - in production, you might want to use full-text search
      const businessTypes = await this.db
        .select()
        .from(schema.businessTypes)
        .where(and(
          eq(schema.businessTypes.isActive, true)
          // Add text search conditions here based on your database capabilities
        ))
        .orderBy(schema.businessTypes.displayName);

      // Filter results based on query (client-side for now)
      const filteredTypes = businessTypes.filter(bt =>
        bt.displayName.toLowerCase().includes(query.toLowerCase()) ||
        bt.description?.toLowerCase().includes(query.toLowerCase()) ||
        bt.category.toLowerCase().includes(query.toLowerCase())
      );

      return {
        success: true,
        data: filteredTypes,
      };
    } catch (error) {
      console.error('Error searching business types:', error);
      return {
        success: false,
        error: {
          code: 'SEARCH_FAILED',
          message: 'Failed to search business types',
        },
      };
    }
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}