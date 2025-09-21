/**
 * Pricing Configuration Service
 * Handles flexible pricing models and availability configurations for offerings
 */

import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import * as schema from '@shared/schema';
import { OfferingManagementService } from './offering-management.service';
import type { ServiceResponse } from '@shared/types/tenant';

export interface PricingRule {
  id: string;
  tenantId: string;
  offeringId: string;
  name: string;
  description?: string;
  pricingType: 'fixed' | 'tiered' | 'time_based' | 'dynamic' | 'percentage';
  isActive: boolean;
  priority: number;
  conditions: {
    minQuantity?: number;
    maxQuantity?: number;
    timeSlots?: Array<{
      dayOfWeek: number;
      startTime: string;
      endTime: string;
    }>;
    dateRange?: {
      startDate: string;
      endDate: string;
    };
    customerSegment?: string;
    seasonality?: string;
  };
  pricing: {
    basePrice?: number;
    priceModifier?: number;
    modifierType?: 'fixed' | 'percentage';
    tiers?: Array<{
      minQuantity: number;
      maxQuantity?: number;
      price: number;
    }>;
    dynamicFormula?: string;
  };
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface AvailabilitySlot {
  id: string;
  tenantId: string;
  offeringId: string;
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
  bookedCount: number;
  isAvailable: boolean;
  price?: number;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePricingRuleRequest {
  offeringId: string;
  name: string;
  description?: string;
  pricingType: 'fixed' | 'tiered' | 'time_based' | 'dynamic' | 'percentage';
  priority?: number;
  conditions: {
    minQuantity?: number;
    maxQuantity?: number;
    timeSlots?: Array<{
      dayOfWeek: number;
      startTime: string;
      endTime: string;
    }>;
    dateRange?: {
      startDate: string;
      endDate: string;
    };
    customerSegment?: string;
    seasonality?: string;
  };
  pricing: {
    basePrice?: number;
    priceModifier?: number;
    modifierType?: 'fixed' | 'percentage';
    tiers?: Array<{
      minQuantity: number;
      maxQuantity?: number;
      price: number;
    }>;
    dynamicFormula?: string;
  };
}

export interface PriceCalculationRequest {
  offeringId: string;
  quantity?: number;
  date?: string;
  time?: string;
  customerSegment?: string;
  variantId?: string;
  customParameters?: Record<string, any>;
}

export interface PriceCalculationResult {
  basePrice: number;
  finalPrice: number;
  appliedRules: Array<{
    ruleId: string;
    ruleName: string;
    priceModifier: number;
    modifierType: 'fixed' | 'percentage';
  }>;
  breakdown: {
    baseAmount: number;
    discounts: number;
    surcharges: number;
    taxes?: number;
    total: number;
  };
  currency: string;
}

export interface AvailabilityCheckRequest {
  offeringId: string;
  date: string;
  startTime?: string;
  endTime?: string;
  quantity?: number;
  duration?: number;
}

export interface AvailabilityCheckResult {
  isAvailable: boolean;
  availableSlots: Array<{
    startTime: string;
    endTime: string;
    capacity: number;
    availableCapacity: number;
    price?: number;
  }>;
  nextAvailableDate?: string;
  suggestedAlternatives?: Array<{
    date: string;
    startTime: string;
    endTime: string;
    price?: number;
  }>;
}

export interface GenerateAvailabilityRequest {
  offeringId: string;
  startDate: string;
  endDate: string;
  timeSlots: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    capacity: number;
  }>;
  excludeDates?: string[];
  specialPricing?: Array<{
    date: string;
    priceModifier: number;
    modifierType: 'fixed' | 'percentage';
  }>;
}

export class PricingConfigService {
  private db: ReturnType<typeof drizzle>;
  private pool: Pool;
  private offeringService: OfferingManagementService;

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString });
    this.db = drizzle({ client: this.pool, schema });
    this.offeringService = new OfferingManagementService(connectionString);
  }

  // ===== PRICING RULES MANAGEMENT =====

  /**
   * Create pricing rule
   */
  async createPricingRule(
    tenantId: string,
    request: CreatePricingRuleRequest
  ): Promise<ServiceResponse<PricingRule>> {
    try {
      // Verify offering exists and belongs to tenant
      const offeringResult = await this.offeringService.getOffering(tenantId, request.offeringId);
      if (!offeringResult.success) {
        return {
          success: false,
          error: {
            code: 'OFFERING_NOT_FOUND',
            message: 'Offering not found',
            tenantId,
          },
        };
      }

      // Validate pricing rule
      const validationResult = this.validatePricingRule(request);
      if (!validationResult.isValid) {
        return {
          success: false,
          error: {
            code: 'PRICING_RULE_VALIDATION_FAILED',
            message: 'Pricing rule validation failed',
            details: validationResult.errors,
            tenantId,
          },
        };
      }

      // Create pricing rule
      const [pricingRule] = await this.db
        .insert(schema.pricingRules)
        .values({
          tenantId,
          offeringId: request.offeringId,
          name: request.name,
          description: request.description,
          pricingType: request.pricingType,
          isActive: true,
          priority: request.priority || 0,
          conditions: request.conditions,
          pricing: request.pricing,
          metadata: {},
        })
        .returning();

      return {
        success: true,
        data: pricingRule,
      };
    } catch (error) {
      console.error('Error creating pricing rule:', error);
      return {
        success: false,
        error: {
          code: 'PRICING_RULE_CREATE_FAILED',
          message: 'Failed to create pricing rule',
          tenantId,
        },
      };
    }
  }

  /**
   * Get pricing rules for offering
   */
  async getPricingRules(
    tenantId: string,
    offeringId: string
  ): Promise<ServiceResponse<PricingRule[]>> {
    try {
      // Verify offering exists and belongs to tenant
      const offeringResult = await this.offeringService.getOffering(tenantId, offeringId);
      if (!offeringResult.success) {
        return offeringResult;
      }

      const pricingRules = await this.db
        .select()
        .from(schema.pricingRules)
        .where(and(
          eq(schema.pricingRules.tenantId, tenantId),
          eq(schema.pricingRules.offeringId, offeringId),
          eq(schema.pricingRules.isActive, true)
        ))
        .orderBy(schema.pricingRules.priority, schema.pricingRules.createdAt);

      return {
        success: true,
        data: pricingRules,
      };
    } catch (error) {
      console.error('Error getting pricing rules:', error);
      return {
        success: false,
        error: {
          code: 'PRICING_RULES_FETCH_FAILED',
          message: 'Failed to fetch pricing rules',
          tenantId,
        },
      };
    }
  }

  /**
   * Update pricing rule
   */
  async updatePricingRule(
    tenantId: string,
    ruleId: string,
    updates: Partial<CreatePricingRuleRequest>
  ): Promise<ServiceResponse<PricingRule>> {
    try {
      // Verify rule exists and belongs to tenant
      const [existingRule] = await this.db
        .select()
        .from(schema.pricingRules)
        .where(and(
          eq(schema.pricingRules.id, ruleId),
          eq(schema.pricingRules.tenantId, tenantId)
        ))
        .limit(1);

      if (!existingRule) {
        return {
          success: false,
          error: {
            code: 'PRICING_RULE_NOT_FOUND',
            message: 'Pricing rule not found',
            tenantId,
          },
        };
      }

      // Validate updates if provided
      if (updates.pricingType || updates.conditions || updates.pricing) {
        const validationRequest = {
          ...existingRule,
          ...updates,
        } as CreatePricingRuleRequest;

        const validationResult = this.validatePricingRule(validationRequest);
        if (!validationResult.isValid) {
          return {
            success: false,
            error: {
              code: 'PRICING_RULE_VALIDATION_FAILED',
              message: 'Pricing rule validation failed',
              details: validationResult.errors,
              tenantId,
            },
          };
        }
      }

      // Update pricing rule
      const updateData: Partial<PricingRule> = {};
      
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.pricingType !== undefined) updateData.pricingType = updates.pricingType;
      if (updates.priority !== undefined) updateData.priority = updates.priority;
      if (updates.conditions !== undefined) updateData.conditions = updates.conditions;
      if (updates.pricing !== undefined) updateData.pricing = updates.pricing;

      updateData.updatedAt = new Date();

      const [updatedRule] = await this.db
        .update(schema.pricingRules)
        .set(updateData)
        .where(eq(schema.pricingRules.id, ruleId))
        .returning();

      return {
        success: true,
        data: updatedRule,
      };
    } catch (error) {
      console.error('Error updating pricing rule:', error);
      return {
        success: false,
        error: {
          code: 'PRICING_RULE_UPDATE_FAILED',
          message: 'Failed to update pricing rule',
          tenantId,
        },
      };
    }
  }

  /**
   * Delete pricing rule
   */
  async deletePricingRule(
    tenantId: string,
    ruleId: string
  ): Promise<ServiceResponse<void>> {
    try {
      // Verify rule exists and belongs to tenant
      const [existingRule] = await this.db
        .select()
        .from(schema.pricingRules)
        .where(and(
          eq(schema.pricingRules.id, ruleId),
          eq(schema.pricingRules.tenantId, tenantId)
        ))
        .limit(1);

      if (!existingRule) {
        return {
          success: false,
          error: {
            code: 'PRICING_RULE_NOT_FOUND',
            message: 'Pricing rule not found',
            tenantId,
          },
        };
      }

      // Soft delete by setting isActive to false
      await this.db
        .update(schema.pricingRules)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(schema.pricingRules.id, ruleId));

      return {
        success: true,
      };
    } catch (error) {
      console.error('Error deleting pricing rule:', error);
      return {
        success: false,
        error: {
          code: 'PRICING_RULE_DELETE_FAILED',
          message: 'Failed to delete pricing rule',
          tenantId,
        },
      };
    }
  }

  // ===== PRICE CALCULATION =====

  /**
   * Calculate price for offering based on rules and parameters
   */
  async calculatePrice(
    tenantId: string,
    request: PriceCalculationRequest
  ): Promise<ServiceResponse<PriceCalculationResult>> {
    try {
      // Get offering
      const offeringResult = await this.offeringService.getOffering(tenantId, request.offeringId);
      if (!offeringResult.success) {
        return offeringResult;
      }

      const offering = offeringResult.data!;
      let basePrice = offering.basePrice;

      // Apply variant pricing if specified
      if (request.variantId) {
        const variantsResult = await this.offeringService.getOfferingVariants(tenantId, request.offeringId);
        if (variantsResult.success) {
          const variant = variantsResult.data?.find(v => v.id === request.variantId);
          if (variant) {
            basePrice += variant.priceModifier;
          }
        }
      }

      // Get applicable pricing rules
      const rulesResult = await this.getPricingRules(tenantId, request.offeringId);
      if (!rulesResult.success) {
        return rulesResult;
      }

      const applicableRules = this.filterApplicableRules(rulesResult.data!, request);
      const appliedRules: PriceCalculationResult['appliedRules'] = [];

      let finalPrice = basePrice;
      let totalDiscounts = 0;
      let totalSurcharges = 0;

      // Apply pricing rules in priority order
      for (const rule of applicableRules) {
        const ruleResult = this.applyPricingRule(rule, basePrice, finalPrice, request);
        
        if (ruleResult.applied) {
          appliedRules.push({
            ruleId: rule.id,
            ruleName: rule.name,
            priceModifier: ruleResult.priceModifier,
            modifierType: ruleResult.modifierType,
          });

          if (ruleResult.priceModifier > 0) {
            totalSurcharges += ruleResult.priceModifier;
          } else {
            totalDiscounts += Math.abs(ruleResult.priceModifier);
          }

          finalPrice = ruleResult.newPrice;
        }
      }

      // Ensure price doesn't go below zero
      finalPrice = Math.max(0, finalPrice);

      const result: PriceCalculationResult = {
        basePrice,
        finalPrice,
        appliedRules,
        breakdown: {
          baseAmount: basePrice,
          discounts: totalDiscounts,
          surcharges: totalSurcharges,
          total: finalPrice,
        },
        currency: 'USD', // TODO: Make configurable per tenant
      };

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error('Error calculating price:', error);
      return {
        success: false,
        error: {
          code: 'PRICE_CALCULATION_FAILED',
          message: 'Failed to calculate price',
          tenantId,
        },
      };
    }
  }

  // ===== AVAILABILITY MANAGEMENT =====

  /**
   * Generate availability slots for offering
   */
  async generateAvailability(
    tenantId: string,
    request: GenerateAvailabilityRequest
  ): Promise<ServiceResponse<{ slotsCreated: number }>> {
    try {
      // Verify offering exists and belongs to tenant
      const offeringResult = await this.offeringService.getOffering(tenantId, request.offeringId);
      if (!offeringResult.success) {
        return offeringResult;
      }

      const startDate = new Date(request.startDate);
      const endDate = new Date(request.endDate);
      const excludeDates = new Set(request.excludeDates || []);

      let slotsCreated = 0;
      const currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        
        // Skip excluded dates
        if (excludeDates.has(dateStr)) {
          currentDate.setDate(currentDate.getDate() + 1);
          continue;
        }

        const dayOfWeek = currentDate.getDay();
        
        // Find time slots for this day of week
        const daySlots = request.timeSlots.filter(slot => slot.dayOfWeek === dayOfWeek);

        for (const slot of daySlots) {
          // Check if slot already exists
          const [existingSlot] = await this.db
            .select()
            .from(schema.availabilitySlots)
            .where(and(
              eq(schema.availabilitySlots.tenantId, tenantId),
              eq(schema.availabilitySlots.offeringId, request.offeringId),
              eq(schema.availabilitySlots.date, dateStr),
              eq(schema.availabilitySlots.startTime, slot.startTime)
            ))
            .limit(1);

          if (!existingSlot) {
            // Calculate price for this slot
            let slotPrice: number | undefined;
            const specialPricing = request.specialPricing?.find(sp => sp.date === dateStr);
            
            if (specialPricing) {
              const priceResult = await this.calculatePrice(tenantId, {
                offeringId: request.offeringId,
                date: dateStr,
                time: slot.startTime,
              });

              if (priceResult.success) {
                const basePrice = priceResult.data!.basePrice;
                slotPrice = specialPricing.modifierType === 'percentage'
                  ? basePrice * (1 + specialPricing.priceModifier / 100)
                  : basePrice + specialPricing.priceModifier;
              }
            }

            // Create availability slot
            await this.db
              .insert(schema.availabilitySlots)
              .values({
                tenantId,
                offeringId: request.offeringId,
                date: dateStr,
                startTime: slot.startTime,
                endTime: slot.endTime,
                capacity: slot.capacity,
                bookedCount: 0,
                isAvailable: true,
                price: slotPrice,
                metadata: {},
              });

            slotsCreated++;
          }
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      return {
        success: true,
        data: { slotsCreated },
      };
    } catch (error) {
      console.error('Error generating availability:', error);
      return {
        success: false,
        error: {
          code: 'AVAILABILITY_GENERATION_FAILED',
          message: 'Failed to generate availability',
          tenantId,
        },
      };
    }
  }

  /**
   * Check availability for offering
   */
  async checkAvailability(
    tenantId: string,
    request: AvailabilityCheckRequest
  ): Promise<ServiceResponse<AvailabilityCheckResult>> {
    try {
      // Verify offering exists and belongs to tenant
      const offeringResult = await this.offeringService.getOffering(tenantId, request.offeringId);
      if (!offeringResult.success) {
        return offeringResult;
      }

      const quantity = request.quantity || 1;
      
      // Get availability slots for the requested date
      const slots = await this.db
        .select()
        .from(schema.availabilitySlots)
        .where(and(
          eq(schema.availabilitySlots.tenantId, tenantId),
          eq(schema.availabilitySlots.offeringId, request.offeringId),
          eq(schema.availabilitySlots.date, request.date),
          eq(schema.availabilitySlots.isAvailable, true)
        ))
        .orderBy(schema.availabilitySlots.startTime);

      // Filter slots by time range if specified
      let filteredSlots = slots;
      if (request.startTime && request.endTime) {
        filteredSlots = slots.filter(slot => 
          slot.startTime >= request.startTime! && slot.endTime <= request.endTime!
        );
      }

      // Check available capacity
      const availableSlots = filteredSlots
        .filter(slot => (slot.capacity - slot.bookedCount) >= quantity)
        .map(slot => ({
          startTime: slot.startTime,
          endTime: slot.endTime,
          capacity: slot.capacity,
          availableCapacity: slot.capacity - slot.bookedCount,
          price: slot.price,
        }));

      const isAvailable = availableSlots.length > 0;

      // Find next available date if current date is not available
      let nextAvailableDate: string | undefined;
      if (!isAvailable) {
        const futureSlots = await this.db
          .select()
          .from(schema.availabilitySlots)
          .where(and(
            eq(schema.availabilitySlots.tenantId, tenantId),
            eq(schema.availabilitySlots.offeringId, request.offeringId),
            gte(schema.availabilitySlots.date, request.date),
            eq(schema.availabilitySlots.isAvailable, true),
            sql`(${schema.availabilitySlots.capacity} - ${schema.availabilitySlots.bookedCount}) >= ${quantity}`
          ))
          .orderBy(schema.availabilitySlots.date, schema.availabilitySlots.startTime)
          .limit(1);

        if (futureSlots.length > 0) {
          nextAvailableDate = futureSlots[0].date;
        }
      }

      // Generate suggested alternatives (next 3 available slots)
      const suggestedAlternatives: AvailabilityCheckResult['suggestedAlternatives'] = [];
      if (!isAvailable) {
        const alternativeSlots = await this.db
          .select()
          .from(schema.availabilitySlots)
          .where(and(
            eq(schema.availabilitySlots.tenantId, tenantId),
            eq(schema.availabilitySlots.offeringId, request.offeringId),
            gte(schema.availabilitySlots.date, request.date),
            eq(schema.availabilitySlots.isAvailable, true),
            sql`(${schema.availabilitySlots.capacity} - ${schema.availabilitySlots.bookedCount}) >= ${quantity}`
          ))
          .orderBy(schema.availabilitySlots.date, schema.availabilitySlots.startTime)
          .limit(3);

        suggestedAlternatives.push(...alternativeSlots.map(slot => ({
          date: slot.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          price: slot.price,
        })));
      }

      const result: AvailabilityCheckResult = {
        isAvailable,
        availableSlots,
        nextAvailableDate,
        suggestedAlternatives,
      };

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error('Error checking availability:', error);
      return {
        success: false,
        error: {
          code: 'AVAILABILITY_CHECK_FAILED',
          message: 'Failed to check availability',
          tenantId,
        },
      };
    }
  }

  /**
   * Update availability slot booking count
   */
  async updateSlotBooking(
    tenantId: string,
    offeringId: string,
    date: string,
    startTime: string,
    bookingChange: number
  ): Promise<ServiceResponse<AvailabilitySlot>> {
    try {
      // Get the slot
      const [slot] = await this.db
        .select()
        .from(schema.availabilitySlots)
        .where(and(
          eq(schema.availabilitySlots.tenantId, tenantId),
          eq(schema.availabilitySlots.offeringId, offeringId),
          eq(schema.availabilitySlots.date, date),
          eq(schema.availabilitySlots.startTime, startTime)
        ))
        .limit(1);

      if (!slot) {
        return {
          success: false,
          error: {
            code: 'AVAILABILITY_SLOT_NOT_FOUND',
            message: 'Availability slot not found',
            tenantId,
          },
        };
      }

      const newBookedCount = slot.bookedCount + bookingChange;

      // Validate booking count doesn't exceed capacity or go below zero
      if (newBookedCount < 0 || newBookedCount > slot.capacity) {
        return {
          success: false,
          error: {
            code: 'INVALID_BOOKING_COUNT',
            message: 'Invalid booking count for availability slot',
            tenantId,
          },
        };
      }

      // Update slot
      const [updatedSlot] = await this.db
        .update(schema.availabilitySlots)
        .set({
          bookedCount: newBookedCount,
          updatedAt: new Date(),
        })
        .where(and(
          eq(schema.availabilitySlots.tenantId, tenantId),
          eq(schema.availabilitySlots.offeringId, offeringId),
          eq(schema.availabilitySlots.date, date),
          eq(schema.availabilitySlots.startTime, startTime)
        ))
        .returning();

      return {
        success: true,
        data: updatedSlot,
      };
    } catch (error) {
      console.error('Error updating slot booking:', error);
      return {
        success: false,
        error: {
          code: 'SLOT_BOOKING_UPDATE_FAILED',
          message: 'Failed to update slot booking',
          tenantId,
        },
      };
    }
  }

  // ===== UTILITY METHODS =====

  /**
   * Validate pricing rule
   */
  private validatePricingRule(rule: CreatePricingRuleRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate pricing type specific requirements
    switch (rule.pricingType) {
      case 'fixed':
        if (!rule.pricing.basePrice && !rule.pricing.priceModifier) {
          errors.push('Fixed pricing requires basePrice or priceModifier');
        }
        break;

      case 'tiered':
        if (!rule.pricing.tiers || rule.pricing.tiers.length === 0) {
          errors.push('Tiered pricing requires at least one tier');
        } else {
          // Validate tier structure
          for (let i = 0; i < rule.pricing.tiers.length; i++) {
            const tier = rule.pricing.tiers[i];
            if (tier.minQuantity < 0) {
              errors.push(`Tier ${i + 1}: minQuantity cannot be negative`);
            }
            if (tier.maxQuantity && tier.maxQuantity <= tier.minQuantity) {
              errors.push(`Tier ${i + 1}: maxQuantity must be greater than minQuantity`);
            }
            if (tier.price < 0) {
              errors.push(`Tier ${i + 1}: price cannot be negative`);
            }
          }
        }
        break;

      case 'time_based':
        if (!rule.conditions.timeSlots || rule.conditions.timeSlots.length === 0) {
          errors.push('Time-based pricing requires timeSlots in conditions');
        }
        break;

      case 'percentage':
        if (!rule.pricing.priceModifier) {
          errors.push('Percentage pricing requires priceModifier');
        }
        break;

      case 'dynamic':
        if (!rule.pricing.dynamicFormula) {
          errors.push('Dynamic pricing requires dynamicFormula');
        }
        break;
    }

    // Validate conditions
    if (rule.conditions.minQuantity && rule.conditions.maxQuantity) {
      if (rule.conditions.maxQuantity <= rule.conditions.minQuantity) {
        errors.push('maxQuantity must be greater than minQuantity');
      }
    }

    if (rule.conditions.dateRange) {
      const startDate = new Date(rule.conditions.dateRange.startDate);
      const endDate = new Date(rule.conditions.dateRange.endDate);
      if (endDate <= startDate) {
        errors.push('End date must be after start date');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Filter applicable pricing rules based on request parameters
   */
  private filterApplicableRules(
    rules: PricingRule[],
    request: PriceCalculationRequest
  ): PricingRule[] {
    return rules.filter(rule => {
      // Check quantity conditions
      if (request.quantity) {
        if (rule.conditions.minQuantity && request.quantity < rule.conditions.minQuantity) {
          return false;
        }
        if (rule.conditions.maxQuantity && request.quantity > rule.conditions.maxQuantity) {
          return false;
        }
      }

      // Check date range conditions
      if (request.date && rule.conditions.dateRange) {
        const requestDate = new Date(request.date);
        const startDate = new Date(rule.conditions.dateRange.startDate);
        const endDate = new Date(rule.conditions.dateRange.endDate);
        if (requestDate < startDate || requestDate > endDate) {
          return false;
        }
      }

      // Check time slot conditions
      if (request.date && request.time && rule.conditions.timeSlots) {
        const requestDate = new Date(request.date);
        const dayOfWeek = requestDate.getDay();
        
        const applicableTimeSlot = rule.conditions.timeSlots.find(slot => 
          slot.dayOfWeek === dayOfWeek &&
          request.time! >= slot.startTime &&
          request.time! <= slot.endTime
        );

        if (!applicableTimeSlot) {
          return false;
        }
      }

      // Check customer segment conditions
      if (request.customerSegment && rule.conditions.customerSegment) {
        if (request.customerSegment !== rule.conditions.customerSegment) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Apply pricing rule to calculate new price
   */
  private applyPricingRule(
    rule: PricingRule,
    basePrice: number,
    currentPrice: number,
    request: PriceCalculationRequest
  ): { applied: boolean; newPrice: number; priceModifier: number; modifierType: 'fixed' | 'percentage' } {
    let newPrice = currentPrice;
    let priceModifier = 0;
    let modifierType: 'fixed' | 'percentage' = 'fixed';

    switch (rule.pricingType) {
      case 'fixed':
        if (rule.pricing.basePrice !== undefined) {
          newPrice = rule.pricing.basePrice;
          priceModifier = rule.pricing.basePrice - currentPrice;
        } else if (rule.pricing.priceModifier !== undefined) {
          if (rule.pricing.modifierType === 'percentage') {
            priceModifier = currentPrice * (rule.pricing.priceModifier / 100);
            modifierType = 'percentage';
          } else {
            priceModifier = rule.pricing.priceModifier;
          }
          newPrice = currentPrice + priceModifier;
        }
        break;

      case 'tiered':
        if (rule.pricing.tiers && request.quantity) {
          const applicableTier = rule.pricing.tiers.find(tier => 
            request.quantity! >= tier.minQuantity &&
            (!tier.maxQuantity || request.quantity! <= tier.maxQuantity)
          );

          if (applicableTier) {
            newPrice = applicableTier.price * request.quantity;
            priceModifier = newPrice - currentPrice;
          }
        }
        break;

      case 'percentage':
        if (rule.pricing.priceModifier !== undefined) {
          priceModifier = currentPrice * (rule.pricing.priceModifier / 100);
          modifierType = 'percentage';
          newPrice = currentPrice + priceModifier;
        }
        break;

      case 'time_based':
        if (rule.pricing.priceModifier !== undefined) {
          if (rule.pricing.modifierType === 'percentage') {
            priceModifier = currentPrice * (rule.pricing.priceModifier / 100);
            modifierType = 'percentage';
          } else {
            priceModifier = rule.pricing.priceModifier;
          }
          newPrice = currentPrice + priceModifier;
        }
        break;

      case 'dynamic':
        // TODO: Implement dynamic formula evaluation
        // For now, treat as fixed modifier
        if (rule.pricing.priceModifier !== undefined) {
          priceModifier = rule.pricing.priceModifier;
          newPrice = currentPrice + priceModifier;
        }
        break;
    }

    return {
      applied: priceModifier !== 0,
      newPrice,
      priceModifier,
      modifierType,
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    try {
      await this.offeringService.cleanup();
      await this.pool.end();
    } catch (error) {
      console.error('Error cleaning up pricing config service:', error);
    }
  }
}