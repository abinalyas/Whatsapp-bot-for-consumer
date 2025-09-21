/**
 * Unit tests for PricingConfigService
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PricingConfigService } from '../server/services/pricing-config.service';
import { OfferingManagementService } from '../server/services/offering-management.service';

// Mock the database and services
vi.mock('drizzle-orm/neon-serverless');
vi.mock('@neondatabase/serverless');
vi.mock('../server/services/offering-management.service');

describe('PricingConfigService', () => {
  let service: PricingConfigService;
  let mockOfferingService: vi.Mocked<OfferingManagementService>;
  let mockDb: any;

  const mockTenantId = 'tenant-1';
  const mockOfferingId = 'offering-1';
  const mockRuleId = 'rule-1';

  const mockOffering = {
    id: mockOfferingId,
    tenantId: mockTenantId,
    name: 'Test Offering',
    basePrice: 20.00,
    isActive: true,
    customFieldValues: {},
    businessTerminology: {},
  };

  const mockPricingRule = {
    id: mockRuleId,
    tenantId: mockTenantId,
    offeringId: mockOfferingId,
    name: 'Happy Hour Discount',
    description: '20% off during happy hours',
    pricingType: 'time_based',
    isActive: true,
    priority: 1,
    conditions: {
      timeSlots: [
        { dayOfWeek: 1, startTime: '15:00', endTime: '18:00' },
        { dayOfWeek: 2, startTime: '15:00', endTime: '18:00' },
      ],
    },
    pricing: {
      priceModifier: -20,
      modifierType: 'percentage',
    },
    metadata: {},
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
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
    };

    mockOfferingService = {
      getOffering: vi.fn(),
      getOfferingVariants: vi.fn(),
      cleanup: vi.fn(),
    } as any;

    // Mock the constructor dependencies
    vi.mocked(OfferingManagementService).mockImplementation(() => mockOfferingService);

    service = new PricingConfigService('mock-connection-string');
    (service as any).db = mockDb;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createPricingRule', () => {
    const createRequest = {
      offeringId: mockOfferingId,
      name: 'Happy Hour Discount',
      description: '20% off during happy hours',
      pricingType: 'time_based' as const,
      priority: 1,
      conditions: {
        timeSlots: [
          { dayOfWeek: 1, startTime: '15:00', endTime: '18:00' },
        ],
      },
      pricing: {
        priceModifier: -20,
        modifierType: 'percentage' as const,
      },
    };

    it('should create pricing rule successfully', async () => {
      mockOfferingService.getOffering.mockResolvedValue({
        success: true,
        data: mockOffering,
      });

      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockPricingRule]),
        }),
      });

      const result = await service.createPricingRule(mockTenantId, createRequest);

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        name: 'Happy Hour Discount',
        pricingType: 'time_based',
        conditions: createRequest.conditions,
        pricing: createRequest.pricing,
      });
    });

    it('should fail if offering not found', async () => {
      mockOfferingService.getOffering.mockResolvedValue({
        success: false,
        error: { code: 'OFFERING_NOT_FOUND', message: 'Offering not found' },
      });

      const result = await service.createPricingRule(mockTenantId, createRequest);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('OFFERING_NOT_FOUND');
    });

    it('should validate pricing rule requirements', async () => {
      mockOfferingService.getOffering.mockResolvedValue({
        success: true,
        data: mockOffering,
      });

      const invalidRequest = {
        ...createRequest,
        pricingType: 'tiered' as const,
        pricing: {}, // Missing required tiers for tiered pricing
      };

      const result = await service.createPricingRule(mockTenantId, invalidRequest);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('PRICING_RULE_VALIDATION_FAILED');
      expect(result.error?.details).toContain('Tiered pricing requires at least one tier');
    });

    it('should validate time-based pricing requirements', async () => {
      mockOfferingService.getOffering.mockResolvedValue({
        success: true,
        data: mockOffering,
      });

      const invalidRequest = {
        ...createRequest,
        pricingType: 'time_based' as const,
        conditions: {}, // Missing timeSlots
      };

      const result = await service.createPricingRule(mockTenantId, invalidRequest);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('PRICING_RULE_VALIDATION_FAILED');
      expect(result.error?.details).toContain('Time-based pricing requires timeSlots in conditions');
    });

    it('should validate tiered pricing structure', async () => {
      mockOfferingService.getOffering.mockResolvedValue({
        success: true,
        data: mockOffering,
      });

      const invalidRequest = {
        ...createRequest,
        pricingType: 'tiered' as const,
        pricing: {
          tiers: [
            { minQuantity: 5, maxQuantity: 3, price: 15.00 }, // Invalid: max < min
            { minQuantity: -1, maxQuantity: 10, price: 12.00 }, // Invalid: negative min
          ],
        },
      };

      const result = await service.createPricingRule(mockTenantId, invalidRequest);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('PRICING_RULE_VALIDATION_FAILED');
      expect(result.error?.details).toContain('Tier 1: maxQuantity must be greater than minQuantity');
      expect(result.error?.details).toContain('Tier 2: minQuantity cannot be negative');
    });
  });

  describe('getPricingRules', () => {
    it('should get pricing rules for offering', async () => {
      mockOfferingService.getOffering.mockResolvedValue({
        success: true,
        data: mockOffering,
      });

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue([mockPricingRule]),
          }),
        }),
      });

      const result = await service.getPricingRules(mockTenantId, mockOfferingId);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].name).toBe('Happy Hour Discount');
    });

    it('should handle offering not found', async () => {
      mockOfferingService.getOffering.mockResolvedValue({
        success: false,
        error: { code: 'OFFERING_NOT_FOUND', message: 'Offering not found' },
      });

      const result = await service.getPricingRules(mockTenantId, 'nonexistent');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('OFFERING_NOT_FOUND');
    });
  });

  describe('calculatePrice', () => {
    const priceRequest = {
      offeringId: mockOfferingId,
      quantity: 2,
      date: '2024-01-15', // Monday
      time: '16:00', // During happy hour
    };

    it('should calculate price with applicable rules', async () => {
      mockOfferingService.getOffering.mockResolvedValue({
        success: true,
        data: mockOffering,
      });

      vi.spyOn(service, 'getPricingRules').mockResolvedValue({
        success: true,
        data: [mockPricingRule],
      });

      const result = await service.calculatePrice(mockTenantId, priceRequest);

      expect(result.success).toBe(true);
      expect(result.data?.basePrice).toBe(20.00);
      expect(result.data?.finalPrice).toBe(16.00); // 20% discount
      expect(result.data?.appliedRules).toHaveLength(1);
      expect(result.data?.appliedRules[0].ruleName).toBe('Happy Hour Discount');
      expect(result.data?.breakdown.discounts).toBe(4.00);
    });

    it('should calculate price with variant modifier', async () => {
      const offeringWithVariant = { ...mockOffering };
      const mockVariant = {
        id: 'variant-1',
        offeringId: mockOfferingId,
        name: 'Large',
        priceModifier: 5.00,
        isActive: true,
      };

      mockOfferingService.getOffering.mockResolvedValue({
        success: true,
        data: offeringWithVariant,
      });

      mockOfferingService.getOfferingVariants.mockResolvedValue({
        success: true,
        data: [mockVariant],
      });

      vi.spyOn(service, 'getPricingRules').mockResolvedValue({
        success: true,
        data: [],
      });

      const requestWithVariant = {
        ...priceRequest,
        variantId: 'variant-1',
      };

      const result = await service.calculatePrice(mockTenantId, requestWithVariant);

      expect(result.success).toBe(true);
      expect(result.data?.basePrice).toBe(25.00); // 20 + 5 variant modifier
      expect(result.data?.finalPrice).toBe(25.00);
    });

    it('should apply multiple pricing rules in priority order', async () => {
      const bulkDiscountRule = {
        ...mockPricingRule,
        id: 'rule-2',
        name: 'Bulk Discount',
        pricingType: 'tiered',
        priority: 2, // Lower priority
        conditions: {
          minQuantity: 2,
        },
        pricing: {
          priceModifier: -2,
          modifierType: 'fixed',
        },
      };

      mockOfferingService.getOffering.mockResolvedValue({
        success: true,
        data: mockOffering,
      });

      vi.spyOn(service, 'getPricingRules').mockResolvedValue({
        success: true,
        data: [mockPricingRule, bulkDiscountRule],
      });

      const result = await service.calculatePrice(mockTenantId, priceRequest);

      expect(result.success).toBe(true);
      expect(result.data?.appliedRules).toHaveLength(2);
      expect(result.data?.finalPrice).toBe(14.00); // 20 * 0.8 - 2 = 14
    });

    it('should not apply rules that do not match conditions', async () => {
      mockOfferingService.getOffering.mockResolvedValue({
        success: true,
        data: mockOffering,
      });

      vi.spyOn(service, 'getPricingRules').mockResolvedValue({
        success: true,
        data: [mockPricingRule],
      });

      const requestOutsideHappyHour = {
        ...priceRequest,
        time: '12:00', // Outside happy hour
      };

      const result = await service.calculatePrice(mockTenantId, requestOutsideHappyHour);

      expect(result.success).toBe(true);
      expect(result.data?.basePrice).toBe(20.00);
      expect(result.data?.finalPrice).toBe(20.00); // No discount applied
      expect(result.data?.appliedRules).toHaveLength(0);
    });

    it('should handle tiered pricing correctly', async () => {
      const tieredRule = {
        ...mockPricingRule,
        pricingType: 'tiered',
        conditions: {},
        pricing: {
          tiers: [
            { minQuantity: 1, maxQuantity: 5, price: 18.00 },
            { minQuantity: 6, maxQuantity: 10, price: 15.00 },
            { minQuantity: 11, price: 12.00 },
          ],
        },
      };

      mockOfferingService.getOffering.mockResolvedValue({
        success: true,
        data: mockOffering,
      });

      vi.spyOn(service, 'getPricingRules').mockResolvedValue({
        success: true,
        data: [tieredRule],
      });

      const bulkRequest = {
        ...priceRequest,
        quantity: 8,
      };

      const result = await service.calculatePrice(mockTenantId, bulkRequest);

      expect(result.success).toBe(true);
      expect(result.data?.finalPrice).toBe(120.00); // 8 * 15.00
    });

    it('should ensure price does not go below zero', async () => {
      const excessiveDiscountRule = {
        ...mockPricingRule,
        pricing: {
          priceModifier: -25.00,
          modifierType: 'fixed',
        },
      };

      mockOfferingService.getOffering.mockResolvedValue({
        success: true,
        data: mockOffering,
      });

      vi.spyOn(service, 'getPricingRules').mockResolvedValue({
        success: true,
        data: [excessiveDiscountRule],
      });

      const result = await service.calculatePrice(mockTenantId, priceRequest);

      expect(result.success).toBe(true);
      expect(result.data?.finalPrice).toBe(0); // Should not go below zero
    });
  });

  describe('generateAvailability', () => {
    const generateRequest = {
      offeringId: mockOfferingId,
      startDate: '2024-01-15',
      endDate: '2024-01-17',
      timeSlots: [
        { dayOfWeek: 1, startTime: '09:00', endTime: '10:00', capacity: 5 }, // Monday
        { dayOfWeek: 2, startTime: '09:00', endTime: '10:00', capacity: 5 }, // Tuesday
      ],
      excludeDates: ['2024-01-16'], // Exclude Tuesday
    };

    it('should generate availability slots successfully', async () => {
      mockOfferingService.getOffering.mockResolvedValue({
        success: true,
        data: mockOffering,
      });

      // Mock no existing slots
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      mockDb.insert.mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      });

      const result = await service.generateAvailability(mockTenantId, generateRequest);

      expect(result.success).toBe(true);
      expect(result.data?.slotsCreated).toBe(2); // Monday and Wednesday (Tuesday excluded)
    });

    it('should skip existing slots', async () => {
      mockOfferingService.getOffering.mockResolvedValue({
        success: true,
        data: mockOffering,
      });

      // Mock existing slot for Monday
      mockDb.select
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([{ id: 'existing-slot' }]),
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

      const result = await service.generateAvailability(mockTenantId, generateRequest);

      expect(result.success).toBe(true);
      expect(result.data?.slotsCreated).toBe(1); // Only Wednesday (Monday exists, Tuesday excluded)
    });

    it('should apply special pricing', async () => {
      const requestWithSpecialPricing = {
        ...generateRequest,
        specialPricing: [
          { date: '2024-01-15', priceModifier: 10, modifierType: 'percentage' as const },
        ],
      };

      mockOfferingService.getOffering.mockResolvedValue({
        success: true,
        data: mockOffering,
      });

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      vi.spyOn(service, 'calculatePrice').mockResolvedValue({
        success: true,
        data: {
          basePrice: 20.00,
          finalPrice: 20.00,
          appliedRules: [],
          breakdown: { baseAmount: 20, discounts: 0, surcharges: 0, total: 20 },
          currency: 'USD',
        },
      });

      mockDb.insert.mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      });

      const result = await service.generateAvailability(mockTenantId, requestWithSpecialPricing);

      expect(result.success).toBe(true);
      expect(service.calculatePrice).toHaveBeenCalledWith(mockTenantId, {
        offeringId: mockOfferingId,
        date: '2024-01-15',
        time: '09:00',
      });
    });
  });

  describe('checkAvailability', () => {
    const availabilityRequest = {
      offeringId: mockOfferingId,
      date: '2024-01-15',
      quantity: 2,
    };

    const mockSlots = [
      {
        id: 'slot-1',
        tenantId: mockTenantId,
        offeringId: mockOfferingId,
        date: '2024-01-15',
        startTime: '09:00',
        endTime: '10:00',
        capacity: 5,
        bookedCount: 1,
        isAvailable: true,
        price: 20.00,
      },
      {
        id: 'slot-2',
        tenantId: mockTenantId,
        offeringId: mockOfferingId,
        date: '2024-01-15',
        startTime: '10:00',
        endTime: '11:00',
        capacity: 3,
        bookedCount: 2,
        isAvailable: true,
        price: 20.00,
      },
    ];

    it('should check availability successfully', async () => {
      mockOfferingService.getOffering.mockResolvedValue({
        success: true,
        data: mockOffering,
      });

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(mockSlots),
          }),
        }),
      });

      const result = await service.checkAvailability(mockTenantId, availabilityRequest);

      expect(result.success).toBe(true);
      expect(result.data?.isAvailable).toBe(true);
      expect(result.data?.availableSlots).toHaveLength(2);
      expect(result.data?.availableSlots[0].availableCapacity).toBe(4); // 5 - 1
      expect(result.data?.availableSlots[1].availableCapacity).toBe(1); // 3 - 2
    });

    it('should filter slots by time range', async () => {
      mockOfferingService.getOffering.mockResolvedValue({
        success: true,
        data: mockOffering,
      });

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(mockSlots),
          }),
        }),
      });

      const requestWithTimeRange = {
        ...availabilityRequest,
        startTime: '09:00',
        endTime: '10:00',
      };

      const result = await service.checkAvailability(mockTenantId, requestWithTimeRange);

      expect(result.success).toBe(true);
      expect(result.data?.availableSlots).toHaveLength(1);
      expect(result.data?.availableSlots[0].startTime).toBe('09:00');
    });

    it('should handle insufficient capacity', async () => {
      const fullSlots = mockSlots.map(slot => ({
        ...slot,
        bookedCount: slot.capacity, // Fully booked
      }));

      mockOfferingService.getOffering.mockResolvedValue({
        success: true,
        data: mockOffering,
      });

      mockDb.select
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue(fullSlots),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([
                  { date: '2024-01-16', startTime: '09:00', endTime: '10:00' },
                ]),
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([
                  { date: '2024-01-16', startTime: '09:00', endTime: '10:00', price: 20.00 },
                ]),
              }),
            }),
          }),
        });

      const result = await service.checkAvailability(mockTenantId, availabilityRequest);

      expect(result.success).toBe(true);
      expect(result.data?.isAvailable).toBe(false);
      expect(result.data?.nextAvailableDate).toBe('2024-01-16');
      expect(result.data?.suggestedAlternatives).toHaveLength(1);
    });
  });

  describe('updateSlotBooking', () => {
    const mockSlot = {
      id: 'slot-1',
      tenantId: mockTenantId,
      offeringId: mockOfferingId,
      date: '2024-01-15',
      startTime: '09:00',
      endTime: '10:00',
      capacity: 5,
      bookedCount: 2,
      isAvailable: true,
    };

    it('should update slot booking successfully', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockSlot]),
          }),
        }),
      });

      const updatedSlot = { ...mockSlot, bookedCount: 3 };
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedSlot]),
          }),
        }),
      });

      const result = await service.updateSlotBooking(
        mockTenantId,
        mockOfferingId,
        '2024-01-15',
        '09:00',
        1 // Increase booking by 1
      );

      expect(result.success).toBe(true);
      expect(result.data?.bookedCount).toBe(3);
    });

    it('should handle slot not found', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await service.updateSlotBooking(
        mockTenantId,
        mockOfferingId,
        '2024-01-15',
        '09:00',
        1
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('AVAILABILITY_SLOT_NOT_FOUND');
    });

    it('should validate booking count limits', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockSlot]),
          }),
        }),
      });

      // Try to book more than capacity
      const result = await service.updateSlotBooking(
        mockTenantId,
        mockOfferingId,
        '2024-01-15',
        '09:00',
        4 // Would exceed capacity (2 + 4 > 5)
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_BOOKING_COUNT');
    });

    it('should validate negative booking count', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockSlot]),
          }),
        }),
      });

      // Try to reduce below zero
      const result = await service.updateSlotBooking(
        mockTenantId,
        mockOfferingId,
        '2024-01-15',
        '09:00',
        -3 // Would go below zero (2 - 3 < 0)
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_BOOKING_COUNT');
    });
  });

  describe('Pricing Rule Validation', () => {
    it('should validate fixed pricing requirements', () => {
      const invalidRule = {
        offeringId: mockOfferingId,
        name: 'Invalid Fixed Rule',
        pricingType: 'fixed' as const,
        conditions: {},
        pricing: {}, // Missing basePrice or priceModifier
      };

      const validation = (service as any).validatePricingRule(invalidRule);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Fixed pricing requires basePrice or priceModifier');
    });

    it('should validate percentage pricing requirements', () => {
      const invalidRule = {
        offeringId: mockOfferingId,
        name: 'Invalid Percentage Rule',
        pricingType: 'percentage' as const,
        conditions: {},
        pricing: {}, // Missing priceModifier
      };

      const validation = (service as any).validatePricingRule(invalidRule);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Percentage pricing requires priceModifier');
    });

    it('should validate dynamic pricing requirements', () => {
      const invalidRule = {
        offeringId: mockOfferingId,
        name: 'Invalid Dynamic Rule',
        pricingType: 'dynamic' as const,
        conditions: {},
        pricing: {}, // Missing dynamicFormula
      };

      const validation = (service as any).validatePricingRule(invalidRule);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Dynamic pricing requires dynamicFormula');
    });

    it('should validate quantity conditions', () => {
      const invalidRule = {
        offeringId: mockOfferingId,
        name: 'Invalid Quantity Rule',
        pricingType: 'fixed' as const,
        conditions: {
          minQuantity: 10,
          maxQuantity: 5, // Invalid: max < min
        },
        pricing: { basePrice: 15.00 },
      };

      const validation = (service as any).validatePricingRule(invalidRule);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('maxQuantity must be greater than minQuantity');
    });

    it('should validate date range conditions', () => {
      const invalidRule = {
        offeringId: mockOfferingId,
        name: 'Invalid Date Rule',
        pricingType: 'fixed' as const,
        conditions: {
          dateRange: {
            startDate: '2024-01-15',
            endDate: '2024-01-10', // Invalid: end before start
          },
        },
        pricing: { basePrice: 15.00 },
      };

      const validation = (service as any).validatePricingRule(invalidRule);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('End date must be after start date');
    });
  });
});