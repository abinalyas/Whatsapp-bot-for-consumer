/**
 * Integration tests for PricingConfigService
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PricingConfigService } from '../server/services/pricing-config.service';
import { OfferingManagementService } from '../server/services/offering-management.service';
import { TenantBusinessConfigService } from '../server/services/tenant-business-config.service';
import { BusinessTypeService } from '../server/services/business-type.service';
import { TenantService } from '../server/services/tenant.service';
import { testDb, setupTestDatabase, cleanupTestDatabase } from './helpers/test-database';

describe('PricingConfigService Integration Tests', () => {
  let pricingService: PricingConfigService;
  let offeringService: OfferingManagementService;
  let configService: TenantBusinessConfigService;
  let businessTypeService: BusinessTypeService;
  let tenantService: TenantService;
  let testTenantId: string;
  let testOfferingId: string;
  let testBusinessTypeId: string;

  beforeAll(async () => {
    await setupTestDatabase();
    
    const connectionString = process.env.TEST_DATABASE_URL!;
    pricingService = new PricingConfigService(connectionString);
    offeringService = new OfferingManagementService(connectionString);
    configService = new TenantBusinessConfigService(connectionString);
    businessTypeService = new BusinessTypeService(connectionString);
    tenantService = new TenantService(connectionString);
  });

  afterAll(async () => {
    await pricingService.cleanup();
    await offeringService.cleanup();
    await configService.cleanup();
    await businessTypeService.cleanup();
    await tenantService.cleanup();
    await cleanupTestDatabase();
  });

  beforeEach(async () => {
    // Clean up test data
    await testDb.delete(testDb.schema.availabilitySlots);
    await testDb.delete(testDb.schema.pricingRules);
    await testDb.delete(testDb.schema.offeringVariants);
    await testDb.delete(testDb.schema.offerings);
    await testDb.delete(testDb.schema.customFields);
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

    // Configure tenant
    const configResult = await configService.configureTenantBusiness(testTenantId, {
      businessTypeId: testBusinessTypeId,
      customFields: [
        {
          entityType: 'offering',
          name: 'preparation_time',
          label: 'Preparation Time',
          fieldType: 'number',
          isRequired: true,
        },
      ],
    });

    expect(configResult.success).toBe(true);

    // Create test offering
    const offeringResult = await offeringService.createOffering(testTenantId, {
      name: 'Chicken Curry',
      description: 'Delicious chicken curry',
      basePrice: 20.00,
      category: 'main-course',
      customFieldValues: {
        preparation_time: 25,
      },
      variants: [
        {
          name: 'Large',
          description: 'Large portion',
          priceModifier: 5.00,
        },
        {
          name: 'Extra Spicy',
          description: 'With extra spices',
          priceModifier: 2.00,
        },
      ],
    });

    expect(offeringResult.success).toBe(true);
    testOfferingId = offeringResult.data!.id;
  });

  describe('Pricing Rules Management', () => {
    it('should create and manage pricing rules', async () => {
      // 1. Create time-based pricing rule (happy hour discount)
      const happyHourRule = {
        offeringId: testOfferingId,
        name: 'Happy Hour Discount',
        description: '20% off during happy hours',
        pricingType: 'time_based' as const,
        priority: 1,
        conditions: {
          timeSlots: [
            { dayOfWeek: 1, startTime: '15:00', endTime: '18:00' }, // Monday
            { dayOfWeek: 2, startTime: '15:00', endTime: '18:00' }, // Tuesday
            { dayOfWeek: 3, startTime: '15:00', endTime: '18:00' }, // Wednesday
          ],
        },
        pricing: {
          priceModifier: -20,
          modifierType: 'percentage' as const,
        },
      };

      const happyHourResult = await pricingService.createPricingRule(testTenantId, happyHourRule);
      expect(happyHourResult.success).toBe(true);
      expect(happyHourResult.data?.name).toBe('Happy Hour Discount');

      // 2. Create tiered pricing rule (bulk discount)
      const bulkDiscountRule = {
        offeringId: testOfferingId,
        name: 'Bulk Discount',
        description: 'Discounts for larger quantities',
        pricingType: 'tiered' as const,
        priority: 2,
        conditions: {},
        pricing: {
          tiers: [
            { minQuantity: 1, maxQuantity: 2, price: 20.00 },
            { minQuantity: 3, maxQuantity: 5, price: 18.00 },
            { minQuantity: 6, price: 15.00 },
          ],
        },
      };

      const bulkDiscountResult = await pricingService.createPricingRule(testTenantId, bulkDiscountRule);
      expect(bulkDiscountResult.success).toBe(true);
      expect(bulkDiscountResult.data?.name).toBe('Bulk Discount');

      // 3. Create seasonal pricing rule
      const seasonalRule = {
        offeringId: testOfferingId,
        name: 'Summer Special',
        description: 'Summer season pricing',
        pricingType: 'percentage' as const,
        priority: 3,
        conditions: {
          dateRange: {
            startDate: '2024-06-01',
            endDate: '2024-08-31',
          },
        },
        pricing: {
          priceModifier: -10,
          modifierType: 'percentage' as const,
        },
      };

      const seasonalResult = await pricingService.createPricingRule(testTenantId, seasonalRule);
      expect(seasonalResult.success).toBe(true);

      // 4. Get all pricing rules
      const rulesResult = await pricingService.getPricingRules(testTenantId, testOfferingId);
      expect(rulesResult.success).toBe(true);
      expect(rulesResult.data).toHaveLength(3);

      // 5. Update pricing rule
      const updateResult = await pricingService.updatePricingRule(
        testTenantId,
        happyHourResult.data!.id,
        {
          name: 'Extended Happy Hour',
          pricing: {
            priceModifier: -25,
            modifierType: 'percentage',
          },
        }
      );

      expect(updateResult.success).toBe(true);
      expect(updateResult.data?.name).toBe('Extended Happy Hour');
      expect(updateResult.data?.pricing.priceModifier).toBe(-25);

      // 6. Delete pricing rule
      const deleteResult = await pricingService.deletePricingRule(
        testTenantId,
        seasonalResult.data!.id
      );

      expect(deleteResult.success).toBe(true);

      // 7. Verify rule is deactivated
      const updatedRulesResult = await pricingService.getPricingRules(testTenantId, testOfferingId);
      expect(updatedRulesResult.success).toBe(true);
      expect(updatedRulesResult.data).toHaveLength(2); // One rule deactivated
    });

    it('should validate pricing rule constraints', async () => {
      // Test invalid tiered pricing
      const invalidTieredRule = {
        offeringId: testOfferingId,
        name: 'Invalid Tiered Rule',
        pricingType: 'tiered' as const,
        conditions: {},
        pricing: {
          tiers: [
            { minQuantity: 5, maxQuantity: 3, price: 15.00 }, // Invalid: max < min
          ],
        },
      };

      const result = await pricingService.createPricingRule(testTenantId, invalidTieredRule);
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('PRICING_RULE_VALIDATION_FAILED');

      // Test missing requirements for time-based pricing
      const invalidTimeRule = {
        offeringId: testOfferingId,
        name: 'Invalid Time Rule',
        pricingType: 'time_based' as const,
        conditions: {}, // Missing timeSlots
        pricing: {
          priceModifier: -10,
          modifierType: 'percentage' as const,
        },
      };

      const timeResult = await pricingService.createPricingRule(testTenantId, invalidTimeRule);
      expect(timeResult.success).toBe(false);
      expect(timeResult.error?.code).toBe('PRICING_RULE_VALIDATION_FAILED');
    });
  });

  describe('Price Calculation', () => {
    let happyHourRuleId: string;
    let bulkDiscountRuleId: string;

    beforeEach(async () => {
      // Create pricing rules for testing
      const happyHourResult = await pricingService.createPricingRule(testTenantId, {
        offeringId: testOfferingId,
        name: 'Happy Hour Discount',
        pricingType: 'time_based',
        priority: 1,
        conditions: {
          timeSlots: [
            { dayOfWeek: 1, startTime: '15:00', endTime: '18:00' },
          ],
        },
        pricing: {
          priceModifier: -20,
          modifierType: 'percentage',
        },
      });

      const bulkDiscountResult = await pricingService.createPricingRule(testTenantId, {
        offeringId: testOfferingId,
        name: 'Bulk Discount',
        pricingType: 'tiered',
        priority: 2,
        conditions: {},
        pricing: {
          tiers: [
            { minQuantity: 1, maxQuantity: 2, price: 20.00 },
            { minQuantity: 3, maxQuantity: 5, price: 18.00 },
            { minQuantity: 6, price: 15.00 },
          ],
        },
      });

      expect(happyHourResult.success).toBe(true);
      expect(bulkDiscountResult.success).toBe(true);
      happyHourRuleId = happyHourResult.data!.id;
      bulkDiscountRuleId = bulkDiscountResult.data!.id;
    });

    it('should calculate base price without rules', async () => {
      const priceResult = await pricingService.calculatePrice(testTenantId, {
        offeringId: testOfferingId,
        quantity: 1,
        date: '2024-01-16', // Tuesday, outside happy hour
        time: '12:00',
      });

      expect(priceResult.success).toBe(true);
      expect(priceResult.data?.basePrice).toBe(20.00);
      expect(priceResult.data?.finalPrice).toBe(20.00);
      expect(priceResult.data?.appliedRules).toHaveLength(0);
    });

    it('should apply time-based pricing during happy hour', async () => {
      const priceResult = await pricingService.calculatePrice(testTenantId, {
        offeringId: testOfferingId,
        quantity: 1,
        date: '2024-01-15', // Monday
        time: '16:00', // During happy hour
      });

      expect(priceResult.success).toBe(true);
      expect(priceResult.data?.basePrice).toBe(20.00);
      expect(priceResult.data?.finalPrice).toBe(16.00); // 20% discount
      expect(priceResult.data?.appliedRules).toHaveLength(1);
      expect(priceResult.data?.appliedRules[0].ruleName).toBe('Happy Hour Discount');
      expect(priceResult.data?.breakdown.discounts).toBe(4.00);
    });

    it('should apply tiered pricing for bulk quantities', async () => {
      const priceResult = await pricingService.calculatePrice(testTenantId, {
        offeringId: testOfferingId,
        quantity: 4, // Should get tier 2 pricing (18.00 each)
        date: '2024-01-16', // Tuesday, outside happy hour
        time: '12:00',
      });

      expect(priceResult.success).toBe(true);
      expect(priceResult.data?.finalPrice).toBe(72.00); // 4 * 18.00
      expect(priceResult.data?.appliedRules).toHaveLength(1);
      expect(priceResult.data?.appliedRules[0].ruleName).toBe('Bulk Discount');
    });

    it('should apply multiple rules in priority order', async () => {
      // Create a fixed discount rule with higher priority
      const fixedDiscountResult = await pricingService.createPricingRule(testTenantId, {
        offeringId: testOfferingId,
        name: 'Fixed Discount',
        pricingType: 'fixed',
        priority: 0, // Higher priority than happy hour
        conditions: {
          minQuantity: 1,
        },
        pricing: {
          priceModifier: -3,
          modifierType: 'fixed',
        },
      });

      expect(fixedDiscountResult.success).toBe(true);

      const priceResult = await pricingService.calculatePrice(testTenantId, {
        offeringId: testOfferingId,
        quantity: 1,
        date: '2024-01-15', // Monday
        time: '16:00', // During happy hour
      });

      expect(priceResult.success).toBe(true);
      expect(priceResult.data?.appliedRules).toHaveLength(2);
      expect(priceResult.data?.finalPrice).toBe(13.60); // (20 - 3) * 0.8 = 13.60
    });

    it('should calculate price with variant modifiers', async () => {
      // Get variant ID
      const variantsResult = await offeringService.getOfferingVariants(testTenantId, testOfferingId);
      expect(variantsResult.success).toBe(true);
      const largeVariant = variantsResult.data?.find(v => v.name === 'Large');
      expect(largeVariant).toBeDefined();

      const priceResult = await pricingService.calculatePrice(testTenantId, {
        offeringId: testOfferingId,
        quantity: 1,
        variantId: largeVariant!.id,
        date: '2024-01-15', // Monday
        time: '16:00', // During happy hour
      });

      expect(priceResult.success).toBe(true);
      expect(priceResult.data?.basePrice).toBe(25.00); // 20 + 5 variant modifier
      expect(priceResult.data?.finalPrice).toBe(20.00); // 25 * 0.8 (20% discount)
    });

    it('should ensure price does not go below zero', async () => {
      // Create excessive discount rule
      const excessiveDiscountResult = await pricingService.createPricingRule(testTenantId, {
        offeringId: testOfferingId,
        name: 'Excessive Discount',
        pricingType: 'fixed',
        priority: 0,
        conditions: {},
        pricing: {
          priceModifier: -25,
          modifierType: 'fixed',
        },
      });

      expect(excessiveDiscountResult.success).toBe(true);

      const priceResult = await pricingService.calculatePrice(testTenantId, {
        offeringId: testOfferingId,
        quantity: 1,
      });

      expect(priceResult.success).toBe(true);
      expect(priceResult.data?.finalPrice).toBe(0); // Should not go below zero
    });
  });

  describe('Availability Management', () => {
    it('should generate and manage availability slots', async () => {
      // 1. Generate availability for a week
      const generateResult = await pricingService.generateAvailability(testTenantId, {
        offeringId: testOfferingId,
        startDate: '2024-01-15', // Monday
        endDate: '2024-01-19', // Friday
        timeSlots: [
          { dayOfWeek: 1, startTime: '09:00', endTime: '10:00', capacity: 5 }, // Monday
          { dayOfWeek: 1, startTime: '14:00', endTime: '15:00', capacity: 3 }, // Monday
          { dayOfWeek: 2, startTime: '09:00', endTime: '10:00', capacity: 5 }, // Tuesday
          { dayOfWeek: 3, startTime: '09:00', endTime: '10:00', capacity: 5 }, // Wednesday
          { dayOfWeek: 4, startTime: '09:00', endTime: '10:00', capacity: 5 }, // Thursday
          { dayOfWeek: 5, startTime: '09:00', endTime: '10:00', capacity: 5 }, // Friday
        ],
        excludeDates: ['2024-01-17'], // Exclude Wednesday
        specialPricing: [
          { date: '2024-01-19', priceModifier: 10, modifierType: 'percentage' }, // Friday premium
        ],
      });

      expect(generateResult.success).toBe(true);
      expect(generateResult.data?.slotsCreated).toBe(6); // 5 days * slots - excluded day + extra Monday slot

      // 2. Check availability for Monday
      const availabilityResult = await pricingService.checkAvailability(testTenantId, {
        offeringId: testOfferingId,
        date: '2024-01-15',
        quantity: 2,
      });

      expect(availabilityResult.success).toBe(true);
      expect(availabilityResult.data?.isAvailable).toBe(true);
      expect(availabilityResult.data?.availableSlots).toHaveLength(2); // Two slots on Monday
      expect(availabilityResult.data?.availableSlots[0].availableCapacity).toBe(5);
      expect(availabilityResult.data?.availableSlots[1].availableCapacity).toBe(3);

      // 3. Check availability with time range filter
      const filteredAvailabilityResult = await pricingService.checkAvailability(testTenantId, {
        offeringId: testOfferingId,
        date: '2024-01-15',
        startTime: '09:00',
        endTime: '10:00',
        quantity: 1,
      });

      expect(filteredAvailabilityResult.success).toBe(true);
      expect(filteredAvailabilityResult.data?.availableSlots).toHaveLength(1); // Only morning slot
      expect(filteredAvailabilityResult.data?.availableSlots[0].startTime).toBe('09:00');

      // 4. Update slot booking (simulate booking)
      const bookingResult = await pricingService.updateSlotBooking(
        testTenantId,
        testOfferingId,
        '2024-01-15',
        '09:00',
        3 // Book 3 spots
      );

      expect(bookingResult.success).toBe(true);
      expect(bookingResult.data?.bookedCount).toBe(3);

      // 5. Check availability after booking
      const updatedAvailabilityResult = await pricingService.checkAvailability(testTenantId, {
        offeringId: testOfferingId,
        date: '2024-01-15',
        startTime: '09:00',
        endTime: '10:00',
        quantity: 2,
      });

      expect(updatedAvailabilityResult.success).toBe(true);
      expect(updatedAvailabilityResult.data?.availableSlots[0].availableCapacity).toBe(2); // 5 - 3

      // 6. Try to book more than available capacity
      const excessiveBookingResult = await pricingService.updateSlotBooking(
        testTenantId,
        testOfferingId,
        '2024-01-15',
        '09:00',
        3 // Would exceed capacity (3 + 3 > 5)
      );

      expect(excessiveBookingResult.success).toBe(false);
      expect(excessiveBookingResult.error?.code).toBe('INVALID_BOOKING_COUNT');
    });

    it('should handle unavailable dates and suggest alternatives', async () => {
      // Generate limited availability
      await pricingService.generateAvailability(testTenantId, {
        offeringId: testOfferingId,
        startDate: '2024-01-15',
        endDate: '2024-01-16',
        timeSlots: [
          { dayOfWeek: 1, startTime: '09:00', endTime: '10:00', capacity: 2 }, // Monday, small capacity
          { dayOfWeek: 2, startTime: '09:00', endTime: '10:00', capacity: 5 }, // Tuesday
        ],
      });

      // Book all spots on Monday
      await pricingService.updateSlotBooking(
        testTenantId,
        testOfferingId,
        '2024-01-15',
        '09:00',
        2
      );

      // Check availability for Monday (should be unavailable)
      const unavailableResult = await pricingService.checkAvailability(testTenantId, {
        offeringId: testOfferingId,
        date: '2024-01-15',
        quantity: 1,
      });

      expect(unavailableResult.success).toBe(true);
      expect(unavailableResult.data?.isAvailable).toBe(false);
      expect(unavailableResult.data?.nextAvailableDate).toBe('2024-01-16');
      expect(unavailableResult.data?.suggestedAlternatives).toHaveLength(1);
      expect(unavailableResult.data?.suggestedAlternatives[0].date).toBe('2024-01-16');
    });

    it('should skip existing slots during generation', async () => {
      // Generate initial availability
      const firstGeneration = await pricingService.generateAvailability(testTenantId, {
        offeringId: testOfferingId,
        startDate: '2024-01-15',
        endDate: '2024-01-16',
        timeSlots: [
          { dayOfWeek: 1, startTime: '09:00', endTime: '10:00', capacity: 5 },
          { dayOfWeek: 2, startTime: '09:00', endTime: '10:00', capacity: 5 },
        ],
      });

      expect(firstGeneration.success).toBe(true);
      expect(firstGeneration.data?.slotsCreated).toBe(2);

      // Generate again (should skip existing slots)
      const secondGeneration = await pricingService.generateAvailability(testTenantId, {
        offeringId: testOfferingId,
        startDate: '2024-01-15',
        endDate: '2024-01-16',
        timeSlots: [
          { dayOfWeek: 1, startTime: '09:00', endTime: '10:00', capacity: 5 },
          { dayOfWeek: 2, startTime: '09:00', endTime: '10:00', capacity: 5 },
        ],
      });

      expect(secondGeneration.success).toBe(true);
      expect(secondGeneration.data?.slotsCreated).toBe(0); // No new slots created
    });
  });

  describe('Complex Pricing Scenarios', () => {
    it('should handle restaurant peak hours pricing', async () => {
      // Create lunch rush surcharge
      await pricingService.createPricingRule(testTenantId, {
        offeringId: testOfferingId,
        name: 'Lunch Rush Surcharge',
        pricingType: 'time_based',
        priority: 1,
        conditions: {
          timeSlots: [
            { dayOfWeek: 1, startTime: '12:00', endTime: '14:00' },
            { dayOfWeek: 2, startTime: '12:00', endTime: '14:00' },
            { dayOfWeek: 3, startTime: '12:00', endTime: '14:00' },
            { dayOfWeek: 4, startTime: '12:00', endTime: '14:00' },
            { dayOfWeek: 5, startTime: '12:00', endTime: '14:00' },
          ],
        },
        pricing: {
          priceModifier: 15,
          modifierType: 'percentage',
        },
      });

      // Create weekend premium
      await pricingService.createPricingRule(testTenantId, {
        offeringId: testOfferingId,
        name: 'Weekend Premium',
        pricingType: 'time_based',
        priority: 2,
        conditions: {
          timeSlots: [
            { dayOfWeek: 6, startTime: '00:00', endTime: '23:59' }, // Saturday
            { dayOfWeek: 0, startTime: '00:00', endTime: '23:59' }, // Sunday
          ],
        },
        pricing: {
          priceModifier: 10,
          modifierType: 'percentage',
        },
      });

      // Test weekday lunch pricing
      const lunchPriceResult = await pricingService.calculatePrice(testTenantId, {
        offeringId: testOfferingId,
        quantity: 1,
        date: '2024-01-15', // Monday
        time: '13:00', // Lunch rush
      });

      expect(lunchPriceResult.success).toBe(true);
      expect(lunchPriceResult.data?.finalPrice).toBe(23.00); // 20 * 1.15

      // Test weekend pricing
      const weekendPriceResult = await pricingService.calculatePrice(testTenantId, {
        offeringId: testOfferingId,
        quantity: 1,
        date: '2024-01-20', // Saturday
        time: '19:00',
      });

      expect(weekendPriceResult.success).toBe(true);
      expect(weekendPriceResult.data?.finalPrice).toBe(22.00); // 20 * 1.10
    });

    it('should handle group booking discounts', async () => {
      // Create group discount tiers
      await pricingService.createPricingRule(testTenantId, {
        offeringId: testOfferingId,
        name: 'Group Booking Discount',
        pricingType: 'tiered',
        priority: 1,
        conditions: {},
        pricing: {
          tiers: [
            { minQuantity: 1, maxQuantity: 4, price: 20.00 }, // Regular price
            { minQuantity: 5, maxQuantity: 9, price: 18.00 }, // 10% group discount
            { minQuantity: 10, maxQuantity: 19, price: 16.00 }, // 20% group discount
            { minQuantity: 20, price: 14.00 }, // 30% group discount
          ],
        },
      });

      // Test small group (no discount)
      const smallGroupResult = await pricingService.calculatePrice(testTenantId, {
        offeringId: testOfferingId,
        quantity: 3,
      });

      expect(smallGroupResult.success).toBe(true);
      expect(smallGroupResult.data?.finalPrice).toBe(60.00); // 3 * 20

      // Test medium group (10% discount)
      const mediumGroupResult = await pricingService.calculatePrice(testTenantId, {
        offeringId: testOfferingId,
        quantity: 7,
      });

      expect(mediumGroupResult.success).toBe(true);
      expect(mediumGroupResult.data?.finalPrice).toBe(126.00); // 7 * 18

      // Test large group (30% discount)
      const largeGroupResult = await pricingService.calculatePrice(testTenantId, {
        offeringId: testOfferingId,
        quantity: 25,
      });

      expect(largeGroupResult.success).toBe(true);
      expect(largeGroupResult.data?.finalPrice).toBe(350.00); // 25 * 14
    });
  });

  describe('Error Handling', () => {
    it('should handle offering not found', async () => {
      const result = await pricingService.createPricingRule(testTenantId, {
        offeringId: 'nonexistent-offering',
        name: 'Test Rule',
        pricingType: 'fixed',
        conditions: {},
        pricing: { basePrice: 15.00 },
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('OFFERING_NOT_FOUND');
    });

    it('should handle pricing rule not found', async () => {
      const result = await pricingService.updatePricingRule(
        testTenantId,
        'nonexistent-rule',
        { name: 'Updated Rule' }
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('PRICING_RULE_NOT_FOUND');
    });

    it('should handle availability slot not found', async () => {
      const result = await pricingService.updateSlotBooking(
        testTenantId,
        testOfferingId,
        '2024-01-15',
        '09:00',
        1
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('AVAILABILITY_SLOT_NOT_FOUND');
    });

    it('should handle database errors gracefully', async () => {
      // Close the database connection to simulate a database error
      await pricingService.cleanup();

      const result = await pricingService.calculatePrice(testTenantId, {
        offeringId: testOfferingId,
        quantity: 1,
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('PRICE_CALCULATION_FAILED');

      // Recreate the service for cleanup
      pricingService = new PricingConfigService(process.env.TEST_DATABASE_URL!);
    });
  });
});