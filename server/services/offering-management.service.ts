/**
 * Offering Management Service
 * Replaces ServiceManagementService with flexible business model support
 * Handles offerings (generalized from services) with custom fields and business-specific terminology
 */

import { eq, and, like, desc, asc, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import * as schema from '@shared/schema';
import { TenantBusinessConfigService } from './tenant-business-config.service';
import type { ServiceResponse } from '@shared/types/tenant';
import type { Offering, CustomField, BusinessType } from '@shared/schema';

export interface OfferingWithCustomFields extends Offering {
  customFieldValues: Record<string, any>;
  businessTerminology: Record<string, string>;
}

export interface CreateOfferingRequest {
  name: string;
  description?: string;
  basePrice: number;
  category?: string;
  isActive?: boolean;
  metadata?: Record<string, any>;
  customFieldValues?: Record<string, any>;
  variants?: Array<{
    name: string;
    description?: string;
    priceModifier: number;
    isActive?: boolean;
  }>;
  availability?: {
    isScheduled: boolean;
    duration?: number;
    capacity?: number;
    advanceBookingDays?: number;
    timeSlots?: Array<{
      dayOfWeek: number;
      startTime: string;
      endTime: string;
    }>;
  };
}

export interface UpdateOfferingRequest {
  name?: string;
  description?: string;
  basePrice?: number;
  category?: string;
  isActive?: boolean;
  metadata?: Record<string, any>;
  customFieldValues?: Record<string, any>;
  variants?: Array<{
    id?: string;
    name: string;
    description?: string;
    priceModifier: number;
    isActive?: boolean;
  }>;
  availability?: {
    isScheduled?: boolean;
    duration?: number;
    capacity?: number;
    advanceBookingDays?: number;
    timeSlots?: Array<{
      dayOfWeek: number;
      startTime: string;
      endTime: string;
    }>;
  };
}

export interface ListOfferingsRequest {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  isActive?: boolean;
  sortBy?: 'name' | 'price' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface OfferingVariant {
  id: string;
  offeringId: string;
  name: string;
  description?: string;
  priceModifier: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface OfferingAvailability {
  id: string;
  offeringId: string;
  isScheduled: boolean;
  duration?: number;
  capacity?: number;
  advanceBookingDays?: number;
  timeSlots: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface OfferingAnalytics {
  totalOfferings: number;
  activeOfferings: number;
  averagePrice: number;
  popularCategories: Array<{
    category: string;
    count: number;
  }>;
  recentlyCreated: number;
  customFieldUsage: Array<{
    fieldName: string;
    usageCount: number;
  }>;
}

export class OfferingManagementService {
  private db: ReturnType<typeof drizzle>;
  private pool: Pool;
  private configService: TenantBusinessConfigService;

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString });
    this.db = drizzle({ client: this.pool, schema });
    this.configService = new TenantBusinessConfigService(connectionString);
  }

  // ===== OFFERING CRUD OPERATIONS =====

  /**
   * Create new offering with custom fields
   */
  async createOffering(
    tenantId: string,
    request: CreateOfferingRequest
  ): Promise<ServiceResponse<OfferingWithCustomFields>> {
    try {
      // Get tenant business configuration for validation
      const configResult = await this.configService.getTenantBusinessConfig(tenantId);
      if (!configResult.success || !configResult.data?.isConfigured) {
        return {
          success: false,
          error: {
            code: 'TENANT_NOT_CONFIGURED',
            message: 'Tenant business configuration is required before creating offerings',
            tenantId,
          },
        };
      }

      const config = configResult.data;

      // Validate custom field values
      const validationResult = await this.validateCustomFieldValues(
        tenantId,
        'offering',
        request.customFieldValues || {}
      );

      if (!validationResult.isValid) {
        return {
          success: false,
          error: {
            code: 'CUSTOM_FIELD_VALIDATION_FAILED',
            message: 'Custom field validation failed',
            details: validationResult.errors,
            tenantId,
          },
        };
      }

      // Create offering
      const [offering] = await this.db
        .insert(schema.offerings)
        .values({
          tenantId,
          name: request.name,
          description: request.description,
          basePrice: request.basePrice,
          category: request.category,
          isActive: request.isActive ?? true,
          metadata: request.metadata || {},
          customFieldValues: request.customFieldValues || {},
        })
        .returning();

      // Create variants if provided
      if (request.variants && request.variants.length > 0) {
        await this.createOfferingVariants(offering.id, request.variants);
      }

      // Create availability configuration if provided
      if (request.availability) {
        await this.createOfferingAvailability(offering.id, request.availability);
      }

      // Return offering with business terminology
      const offeringWithFields: OfferingWithCustomFields = {
        ...offering,
        customFieldValues: offering.customFieldValues,
        businessTerminology: config.terminology,
      };

      return {
        success: true,
        data: offeringWithFields,
      };
    } catch (error) {
      console.error('Error creating offering:', error);
      return {
        success: false,
        error: {
          code: 'OFFERING_CREATE_FAILED',
          message: 'Failed to create offering',
          tenantId,
        },
      };
    }
  }

  /**
   * Get offering by ID with custom fields
   */
  async getOffering(
    tenantId: string,
    offeringId: string
  ): Promise<ServiceResponse<OfferingWithCustomFields>> {
    try {
      // Get offering
      const [offering] = await this.db
        .select()
        .from(schema.offerings)
        .where(and(
          eq(schema.offerings.id, offeringId),
          eq(schema.offerings.tenantId, tenantId)
        ))
        .limit(1);

      if (!offering) {
        return {
          success: false,
          error: {
            code: 'OFFERING_NOT_FOUND',
            message: 'Offering not found',
            tenantId,
          },
        };
      }

      // Get business terminology
      const configResult = await this.configService.getTenantBusinessConfig(tenantId);
      const terminology = configResult.success ? configResult.data?.terminology || {} : {};

      const offeringWithFields: OfferingWithCustomFields = {
        ...offering,
        customFieldValues: offering.customFieldValues,
        businessTerminology: terminology,
      };

      return {
        success: true,
        data: offeringWithFields,
      };
    } catch (error) {
      console.error('Error getting offering:', error);
      return {
        success: false,
        error: {
          code: 'OFFERING_FETCH_FAILED',
          message: 'Failed to fetch offering',
          tenantId,
        },
      };
    }
  }

  /**
   * List offerings with filtering and pagination
   */
  async listOfferings(
    tenantId: string,
    request: ListOfferingsRequest = {}
  ): Promise<ServiceResponse<{
    data: OfferingWithCustomFields[];
    total: number;
    page: number;
    limit: number;
  }>> {
    try {
      const {
        page = 1,
        limit = 50,
        category,
        search,
        isActive,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = request;

      const offset = (page - 1) * limit;

      // Build where conditions
      const conditions = [eq(schema.offerings.tenantId, tenantId)];

      if (category) {
        conditions.push(eq(schema.offerings.category, category));
      }

      if (search) {
        conditions.push(
          sql`(${schema.offerings.name} ILIKE ${`%${search}%`} OR ${schema.offerings.description} ILIKE ${`%${search}%`})`
        );
      }

      if (typeof isActive === 'boolean') {
        conditions.push(eq(schema.offerings.isActive, isActive));
      }

      // Build order by
      const orderByColumn = schema.offerings[sortBy as keyof typeof schema.offerings];
      const orderBy = sortOrder === 'asc' ? asc(orderByColumn) : desc(orderByColumn);

      // Get total count
      const [{ count }] = await this.db
        .select({ count: sql<number>`count(*)` })
        .from(schema.offerings)
        .where(and(...conditions));

      // Get offerings
      const offerings = await this.db
        .select()
        .from(schema.offerings)
        .where(and(...conditions))
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset);

      // Get business terminology
      const configResult = await this.configService.getTenantBusinessConfig(tenantId);
      const terminology = configResult.success ? configResult.data?.terminology || {} : {};

      // Transform offerings with custom fields and terminology
      const offeringsWithFields: OfferingWithCustomFields[] = offerings.map(offering => ({
        ...offering,
        customFieldValues: offering.customFieldValues,
        businessTerminology: terminology,
      }));

      return {
        success: true,
        data: {
          data: offeringsWithFields,
          total: count,
          page,
          limit,
        },
      };
    } catch (error) {
      console.error('Error listing offerings:', error);
      return {
        success: false,
        error: {
          code: 'OFFERINGS_FETCH_FAILED',
          message: 'Failed to fetch offerings',
          tenantId,
        },
      };
    }
  }

  /**
   * Update offering with custom fields
   */
  async updateOffering(
    tenantId: string,
    offeringId: string,
    request: UpdateOfferingRequest
  ): Promise<ServiceResponse<OfferingWithCustomFields>> {
    try {
      // Verify offering exists and belongs to tenant
      const existingResult = await this.getOffering(tenantId, offeringId);
      if (!existingResult.success) {
        return existingResult;
      }

      // Validate custom field values if provided
      if (request.customFieldValues) {
        const validationResult = await this.validateCustomFieldValues(
          tenantId,
          'offering',
          request.customFieldValues
        );

        if (!validationResult.isValid) {
          return {
            success: false,
            error: {
              code: 'CUSTOM_FIELD_VALIDATION_FAILED',
              message: 'Custom field validation failed',
              details: validationResult.errors,
              tenantId,
            },
          };
        }
      }

      // Update offering
      const updateData: Partial<Offering> = {};
      
      if (request.name !== undefined) updateData.name = request.name;
      if (request.description !== undefined) updateData.description = request.description;
      if (request.basePrice !== undefined) updateData.basePrice = request.basePrice;
      if (request.category !== undefined) updateData.category = request.category;
      if (request.isActive !== undefined) updateData.isActive = request.isActive;
      if (request.metadata !== undefined) updateData.metadata = request.metadata;
      if (request.customFieldValues !== undefined) {
        // Merge with existing custom field values
        const existing = existingResult.data!;
        updateData.customFieldValues = {
          ...existing.customFieldValues,
          ...request.customFieldValues,
        };
      }

      updateData.updatedAt = new Date();

      const [updatedOffering] = await this.db
        .update(schema.offerings)
        .set(updateData)
        .where(and(
          eq(schema.offerings.id, offeringId),
          eq(schema.offerings.tenantId, tenantId)
        ))
        .returning();

      // Update variants if provided
      if (request.variants) {
        await this.updateOfferingVariants(offeringId, request.variants);
      }

      // Update availability if provided
      if (request.availability) {
        await this.updateOfferingAvailability(offeringId, request.availability);
      }

      // Get business terminology
      const configResult = await this.configService.getTenantBusinessConfig(tenantId);
      const terminology = configResult.success ? configResult.data?.terminology || {} : {};

      const offeringWithFields: OfferingWithCustomFields = {
        ...updatedOffering,
        customFieldValues: updatedOffering.customFieldValues,
        businessTerminology: terminology,
      };

      return {
        success: true,
        data: offeringWithFields,
      };
    } catch (error) {
      console.error('Error updating offering:', error);
      return {
        success: false,
        error: {
          code: 'OFFERING_UPDATE_FAILED',
          message: 'Failed to update offering',
          tenantId,
        },
      };
    }
  }

  /**
   * Delete offering (soft delete)
   */
  async deleteOffering(
    tenantId: string,
    offeringId: string
  ): Promise<ServiceResponse<void>> {
    try {
      // Verify offering exists and belongs to tenant
      const existingResult = await this.getOffering(tenantId, offeringId);
      if (!existingResult.success) {
        return existingResult;
      }

      // Check if offering has active transactions
      const [activeTransactions] = await this.db
        .select({ count: sql<number>`count(*)` })
        .from(schema.transactions)
        .where(and(
          eq(schema.transactions.offeringId, offeringId),
          eq(schema.transactions.tenantId, tenantId)
        ));

      if (activeTransactions.count > 0) {
        // Soft delete - just mark as inactive
        await this.db
          .update(schema.offerings)
          .set({
            isActive: false,
            updatedAt: new Date(),
          })
          .where(and(
            eq(schema.offerings.id, offeringId),
            eq(schema.offerings.tenantId, tenantId)
          ));
      } else {
        // Hard delete if no transactions
        await this.db
          .delete(schema.offerings)
          .where(and(
            eq(schema.offerings.id, offeringId),
            eq(schema.offerings.tenantId, tenantId)
          ));
      }

      return {
        success: true,
      };
    } catch (error) {
      console.error('Error deleting offering:', error);
      return {
        success: false,
        error: {
          code: 'OFFERING_DELETE_FAILED',
          message: 'Failed to delete offering',
          tenantId,
        },
      };
    }
  }

  // ===== OFFERING VARIANTS MANAGEMENT =====

  /**
   * Create offering variants
   */
  private async createOfferingVariants(
    offeringId: string,
    variants: CreateOfferingRequest['variants']
  ): Promise<void> {
    if (!variants || variants.length === 0) return;

    const variantValues = variants.map(variant => ({
      offeringId,
      name: variant.name,
      description: variant.description,
      priceModifier: variant.priceModifier,
      isActive: variant.isActive ?? true,
    }));

    await this.db
      .insert(schema.offeringVariants)
      .values(variantValues);
  }

  /**
   * Update offering variants
   */
  private async updateOfferingVariants(
    offeringId: string,
    variants: UpdateOfferingRequest['variants']
  ): Promise<void> {
    if (!variants) return;

    // Delete existing variants
    await this.db
      .delete(schema.offeringVariants)
      .where(eq(schema.offeringVariants.offeringId, offeringId));

    // Create new variants
    if (variants.length > 0) {
      const variantValues = variants.map(variant => ({
        offeringId,
        name: variant.name,
        description: variant.description,
        priceModifier: variant.priceModifier,
        isActive: variant.isActive ?? true,
      }));

      await this.db
        .insert(schema.offeringVariants)
        .values(variantValues);
    }
  }

  /**
   * Get offering variants
   */
  async getOfferingVariants(
    tenantId: string,
    offeringId: string
  ): Promise<ServiceResponse<OfferingVariant[]>> {
    try {
      // Verify offering belongs to tenant
      const offeringResult = await this.getOffering(tenantId, offeringId);
      if (!offeringResult.success) {
        return offeringResult;
      }

      const variants = await this.db
        .select()
        .from(schema.offeringVariants)
        .where(eq(schema.offeringVariants.offeringId, offeringId))
        .orderBy(asc(schema.offeringVariants.createdAt));

      return {
        success: true,
        data: variants,
      };
    } catch (error) {
      console.error('Error getting offering variants:', error);
      return {
        success: false,
        error: {
          code: 'VARIANTS_FETCH_FAILED',
          message: 'Failed to fetch offering variants',
          tenantId,
        },
      };
    }
  }

  // ===== OFFERING AVAILABILITY MANAGEMENT =====

  /**
   * Create offering availability
   */
  private async createOfferingAvailability(
    offeringId: string,
    availability: CreateOfferingRequest['availability']
  ): Promise<void> {
    if (!availability) return;

    await this.db
      .insert(schema.offeringAvailability)
      .values({
        offeringId,
        isScheduled: availability.isScheduled,
        duration: availability.duration,
        capacity: availability.capacity,
        advanceBookingDays: availability.advanceBookingDays,
        timeSlots: availability.timeSlots || [],
      });
  }

  /**
   * Update offering availability
   */
  private async updateOfferingAvailability(
    offeringId: string,
    availability: UpdateOfferingRequest['availability']
  ): Promise<void> {
    if (!availability) return;

    // Delete existing availability
    await this.db
      .delete(schema.offeringAvailability)
      .where(eq(schema.offeringAvailability.offeringId, offeringId));

    // Create new availability
    await this.db
      .insert(schema.offeringAvailability)
      .values({
        offeringId,
        isScheduled: availability.isScheduled ?? true,
        duration: availability.duration,
        capacity: availability.capacity,
        advanceBookingDays: availability.advanceBookingDays,
        timeSlots: availability.timeSlots || [],
      });
  }

  /**
   * Get offering availability
   */
  async getOfferingAvailability(
    tenantId: string,
    offeringId: string
  ): Promise<ServiceResponse<OfferingAvailability | null>> {
    try {
      // Verify offering belongs to tenant
      const offeringResult = await this.getOffering(tenantId, offeringId);
      if (!offeringResult.success) {
        return offeringResult;
      }

      const [availability] = await this.db
        .select()
        .from(schema.offeringAvailability)
        .where(eq(schema.offeringAvailability.offeringId, offeringId))
        .limit(1);

      return {
        success: true,
        data: availability || null,
      };
    } catch (error) {
      console.error('Error getting offering availability:', error);
      return {
        success: false,
        error: {
          code: 'AVAILABILITY_FETCH_FAILED',
          message: 'Failed to fetch offering availability',
          tenantId,
        },
      };
    }
  }

  // ===== CUSTOM FIELD VALIDATION =====

  /**
   * Validate custom field values against field definitions
   */
  private async validateCustomFieldValues(
    tenantId: string,
    entityType: string,
    fieldValues: Record<string, any>
  ): Promise<{ isValid: boolean; errors: string[] }> {
    try {
      // Get custom field definitions for entity type
      const fieldsResult = await this.configService.getCustomFieldsByEntityType(tenantId, entityType);
      if (!fieldsResult.success) {
        return { isValid: true, errors: [] }; // No custom fields defined
      }

      const customFields = fieldsResult.data!;
      const errors: string[] = [];

      // Validate each field
      for (const field of customFields) {
        const value = fieldValues[field.name];

        // Check required fields
        if (field.isRequired && (value === undefined || value === null || value === '')) {
          errors.push(`Field '${field.label}' is required`);
          continue;
        }

        // Skip validation if field is not provided and not required
        if (value === undefined || value === null) {
          continue;
        }

        // Type-specific validation
        switch (field.fieldType) {
          case 'number':
            if (typeof value !== 'number' && !Number.isFinite(Number(value))) {
              errors.push(`Field '${field.label}' must be a valid number`);
            }
            break;

          case 'boolean':
            if (typeof value !== 'boolean') {
              errors.push(`Field '${field.label}' must be a boolean value`);
            }
            break;

          case 'date':
            if (!Date.parse(value)) {
              errors.push(`Field '${field.label}' must be a valid date`);
            }
            break;

          case 'select':
            if (field.fieldOptions && field.fieldOptions.length > 0) {
              const validOptions = field.fieldOptions.map(opt => opt.value);
              if (!validOptions.includes(value)) {
                errors.push(`Field '${field.label}' must be one of: ${validOptions.join(', ')}`);
              }
            }
            break;

          case 'multiselect':
            if (Array.isArray(value) && field.fieldOptions && field.fieldOptions.length > 0) {
              const validOptions = field.fieldOptions.map(opt => opt.value);
              const invalidValues = value.filter(v => !validOptions.includes(v));
              if (invalidValues.length > 0) {
                errors.push(`Field '${field.label}' contains invalid values: ${invalidValues.join(', ')}`);
              }
            } else if (!Array.isArray(value)) {
              errors.push(`Field '${field.label}' must be an array`);
            }
            break;
        }

        // Validation rules
        if (field.validationRules) {
          const rules = field.validationRules;

          if (rules.min !== undefined && typeof value === 'number' && value < rules.min) {
            errors.push(`Field '${field.label}' must be at least ${rules.min}`);
          }

          if (rules.max !== undefined && typeof value === 'number' && value > rules.max) {
            errors.push(`Field '${field.label}' must be at most ${rules.max}`);
          }

          if (rules.minLength !== undefined && typeof value === 'string' && value.length < rules.minLength) {
            errors.push(`Field '${field.label}' must be at least ${rules.minLength} characters`);
          }

          if (rules.maxLength !== undefined && typeof value === 'string' && value.length > rules.maxLength) {
            errors.push(`Field '${field.label}' must be at most ${rules.maxLength} characters`);
          }

          if (rules.pattern && typeof value === 'string' && !new RegExp(rules.pattern).test(value)) {
            errors.push(`Field '${field.label}' format is invalid`);
          }
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
      };
    } catch (error) {
      console.error('Error validating custom field values:', error);
      return {
        isValid: false,
        errors: ['Custom field validation failed'],
      };
    }
  }

  // ===== ANALYTICS AND REPORTING =====

  /**
   * Get offering analytics for tenant
   */
  async getOfferingAnalytics(tenantId: string): Promise<ServiceResponse<OfferingAnalytics>> {
    try {
      // Total and active offerings count
      const [totalCount] = await this.db
        .select({ count: sql<number>`count(*)` })
        .from(schema.offerings)
        .where(eq(schema.offerings.tenantId, tenantId));

      const [activeCount] = await this.db
        .select({ count: sql<number>`count(*)` })
        .from(schema.offerings)
        .where(and(
          eq(schema.offerings.tenantId, tenantId),
          eq(schema.offerings.isActive, true)
        ));

      // Average price
      const [avgPrice] = await this.db
        .select({ avg: sql<number>`avg(${schema.offerings.basePrice})` })
        .from(schema.offerings)
        .where(and(
          eq(schema.offerings.tenantId, tenantId),
          eq(schema.offerings.isActive, true)
        ));

      // Popular categories
      const categories = await this.db
        .select({
          category: schema.offerings.category,
          count: sql<number>`count(*)`,
        })
        .from(schema.offerings)
        .where(and(
          eq(schema.offerings.tenantId, tenantId),
          eq(schema.offerings.isActive, true)
        ))
        .groupBy(schema.offerings.category)
        .orderBy(desc(sql`count(*)`))
        .limit(10);

      // Recently created (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const [recentCount] = await this.db
        .select({ count: sql<number>`count(*)` })
        .from(schema.offerings)
        .where(and(
          eq(schema.offerings.tenantId, tenantId),
          sql`${schema.offerings.createdAt} >= ${sevenDaysAgo}`
        ));

      // Custom field usage
      const offerings = await this.db
        .select({ customFieldValues: schema.offerings.customFieldValues })
        .from(schema.offerings)
        .where(eq(schema.offerings.tenantId, tenantId));

      const fieldUsage = new Map<string, number>();
      offerings.forEach(offering => {
        if (offering.customFieldValues) {
          Object.keys(offering.customFieldValues).forEach(fieldName => {
            fieldUsage.set(fieldName, (fieldUsage.get(fieldName) || 0) + 1);
          });
        }
      });

      const customFieldUsage = Array.from(fieldUsage.entries())
        .map(([fieldName, usageCount]) => ({ fieldName, usageCount }))
        .sort((a, b) => b.usageCount - a.usageCount)
        .slice(0, 10);

      const analytics: OfferingAnalytics = {
        totalOfferings: totalCount.count,
        activeOfferings: activeCount.count,
        averagePrice: Number(avgPrice.avg) || 0,
        popularCategories: categories.map(cat => ({
          category: cat.category || 'Uncategorized',
          count: cat.count,
        })),
        recentlyCreated: recentCount.count,
        customFieldUsage,
      };

      return {
        success: true,
        data: analytics,
      };
    } catch (error) {
      console.error('Error getting offering analytics:', error);
      return {
        success: false,
        error: {
          code: 'ANALYTICS_FETCH_FAILED',
          message: 'Failed to fetch offering analytics',
          tenantId,
        },
      };
    }
  }

  // ===== MIGRATION UTILITIES =====

  /**
   * Migrate legacy services to offerings
   */
  async migrateLegacyServices(tenantId: string): Promise<ServiceResponse<{
    migratedCount: number;
    skippedCount: number;
    errors: string[];
  }>> {
    try {
      // Get legacy services
      const legacyServices = await this.db
        .select()
        .from(schema.services)
        .where(eq(schema.services.tenantId, tenantId));

      let migratedCount = 0;
      let skippedCount = 0;
      const errors: string[] = [];

      for (const service of legacyServices) {
        try {
          // Check if already migrated
          const [existingOffering] = await this.db
            .select()
            .from(schema.offerings)
            .where(and(
              eq(schema.offerings.tenantId, tenantId),
              eq(schema.offerings.name, service.name)
            ))
            .limit(1);

          if (existingOffering) {
            skippedCount++;
            continue;
          }

          // Create offering from service
          await this.db
            .insert(schema.offerings)
            .values({
              tenantId,
              name: service.name,
              description: service.description,
              basePrice: service.price,
              category: 'migrated',
              isActive: service.isActive,
              metadata: {
                migratedFromServiceId: service.id,
                originalIcon: service.icon,
              },
              customFieldValues: {},
            });

          migratedCount++;
        } catch (error) {
          errors.push(`Failed to migrate service '${service.name}': ${error}`);
          skippedCount++;
        }
      }

      return {
        success: true,
        data: {
          migratedCount,
          skippedCount,
          errors,
        },
      };
    } catch (error) {
      console.error('Error migrating legacy services:', error);
      return {
        success: false,
        error: {
          code: 'MIGRATION_FAILED',
          message: 'Failed to migrate legacy services',
          tenantId,
        },
      };
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    try {
      await this.configService.cleanup();
      await this.pool.end();
    } catch (error) {
      console.error('Error cleaning up offering management service:', error);
    }
  }
}