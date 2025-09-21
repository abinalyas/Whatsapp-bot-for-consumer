/**
 * Tenant-Specific Booking Flows Integration Tests
 * Tests complete booking workflows with tenant isolation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ServiceManagementService } from '../server/services/service-management.service';
import { BookingManagementService } from '../server/services/booking-management.service';
import { MessageProcessorService } from '../server/services/message-processor.service';
import type { Service, Booking } from '@shared/schema';

// Mock database connection
const mockConnectionString = 'postgresql://test:test@localhost:5432/test';

// Mock all dependencies
vi.mock('../server/repositories/service.repository');
vi.mock('../server/repositories/booking.repository');
vi.mock('../server/repositories/conversation.repository');
vi.mock('../server/services/bot-configuration.service');

describe('Tenant-Specific Booking Flows Integration', () => {
  let serviceManagement: ServiceManagementService;
  let bookingManagement: BookingManagementService;
  let messageProcessor: MessageProcessorService;

  const tenant1Id = '550e8400-e29b-41d4-a716-446655440001';
  const tenant2Id = '550e8400-e29b-41d4-a716-446655440002';

  beforeEach(() => {
    serviceManagement = new ServiceManagementService(mockConnectionString);
    bookingManagement = new BookingManagementService(mockConnectionString);
    messageProcessor = new MessageProcessorService(mockConnectionString);
  });

  afterEach(async () => {
    await serviceManagement.close();
    await bookingManagement.close();
    await messageProcessor.close();
  });

  describe('Multi-Tenant Service Management', () => {
    it('should maintain service isolation between tenants', async () => {
      // Mock service creation for tenant 1
      const tenant1Service = {
        id: 'service-t1-1',
        tenantId: tenant1Id,
        name: 'Tenant 1 Haircut',
        price: 50,
        isActive: true,
      };

      // Mock service creation for tenant 2
      const tenant2Service = {
        id: 'service-t2-1',
        tenantId: tenant2Id,
        name: 'Tenant 2 Haircut',
        price: 75,
        isActive: true,
      };

      // Mock repository responses
      vi.mocked(serviceManagement['serviceRepo'].search).mockImplementation(async (tenantId) => {
        return {
          success: true,
          data: { data: [], pagination: { page: 1, limit: 1, total: 0, totalPages: 0, hasNext: false, hasPrev: false } },
        };
      });

      vi.mocked(serviceManagement['serviceRepo'].create).mockImplementation(async (tenantId, data) => {
        const service = tenantId === tenant1Id ? tenant1Service : tenant2Service;
        return { success: true, data: service as any };
      });

      // Create services for both tenants
      const tenant1Result = await serviceManagement.createService(tenant1Id, {
        name: 'Tenant 1 Haircut',
        price: 50,
      });

      const tenant2Result = await serviceManagement.createService(tenant2Id, {
        name: 'Tenant 2 Haircut',
        price: 75,
      });

      // Verify both services were created successfully
      expect(tenant1Result.success).toBe(true);
      expect(tenant2Result.success).toBe(true);

      // Verify tenant isolation
      expect(tenant1Result.data!.tenantId).toBe(tenant1Id);
      expect(tenant2Result.data!.tenantId).toBe(tenant2Id);
      expect(tenant1Result.data!.price).toBe(50);
      expect(tenant2Result.data!.price).toBe(75);
    });

    it('should allow same service names across different tenants', async () => {
      const serviceName = 'Standard Haircut';

      // Mock no existing services for both tenants
      vi.mocked(serviceManagement['serviceRepo'].search).mockResolvedValue({
        success: true,
        data: { data: [], pagination: { page: 1, limit: 1, total: 0, totalPages: 0, hasNext: false, hasPrev: false } },
      });

      vi.mocked(serviceManagement['serviceRepo'].create).mockImplementation(async (tenantId, data) => {
        return {
          success: true,
          data: {
            id: `service-${tenantId}`,
            tenantId,
            name: serviceName,
            price: data.price,
            isActive: true,
          } as any,
        };
      });

      // Create same service name for both tenants
      const tenant1Result = await serviceManagement.createService(tenant1Id, {
        name: serviceName,
        price: 40,
      });

      const tenant2Result = await serviceManagement.createService(tenant2Id, {
        name: serviceName,
        price: 60,
      });

      // Both should succeed since they're in different tenants
      expect(tenant1Result.success).toBe(true);
      expect(tenant2Result.success).toBe(true);
      expect(tenant1Result.data!.name).toBe(serviceName);
      expect(tenant2Result.data!.name).toBe(serviceName);
    });
  });

  describe('Multi-Tenant Booking Management', () => {
    it('should maintain booking isolation between tenants', async () => {
      const appointmentDate = new Date('2024-12-25T10:00:00Z');

      // Mock service validation for both tenants
      vi.mocked(bookingManagement['serviceRepo'].findById).mockImplementation(async (tenantId, serviceId) => {
        return {
          success: true,
          data: {
            id: serviceId,
            tenantId,
            name: 'Test Service',
            price: 50,
            isActive: true,
          } as any,
        };
      });

      // Mock conversation validation
      vi.mocked(bookingManagement['conversationRepo'].findById).mockImplementation(async (tenantId, convId) => {
        return {
          success: true,
          data: { id: convId, tenantId } as any,
        };
      });

      // Mock no booking conflicts
      vi.mocked(bookingManagement['bookingRepo'].findByDateRange).mockResolvedValue({
        success: true,
        data: { data: [], pagination: { page: 1, limit: 100, total: 0, totalPages: 0, hasNext: false, hasPrev: false } },
      });

      // Mock booking creation
      vi.mocked(bookingManagement['bookingRepo'].create).mockImplementation(async (tenantId, data) => {
        return {
          success: true,
          data: {
            id: `booking-${tenantId}`,
            tenantId,
            ...data,
          } as any,
        };
      });

      // Create bookings for both tenants at the same time
      const tenant1Booking = await bookingManagement.createBooking(tenant1Id, {
        conversationId: 'conv-t1-1',
        serviceId: 'service-t1-1',
        phoneNumber: '+1234567890',
        appointmentDate,
        appointmentTime: '10:00 AM',
      });

      const tenant2Booking = await bookingManagement.createBooking(tenant2Id, {
        conversationId: 'conv-t2-1',
        serviceId: 'service-t2-1',
        phoneNumber: '+1234567890', // Same phone number, different tenant
        appointmentDate,
        appointmentTime: '10:00 AM', // Same time, different tenant
      });

      // Both bookings should succeed (no conflict across tenants)
      expect(tenant1Booking.success).toBe(true);
      expect(tenant2Booking.success).toBe(true);
      expect(tenant1Booking.data!.tenantId).toBe(tenant1Id);
      expect(tenant2Booking.data!.tenantId).toBe(tenant2Id);
    });

    it('should prevent booking conflicts within the same tenant', async () => {
      const appointmentDate = new Date('2024-12-25T10:00:00Z');
      const appointmentTime = '10:00 AM';

      // Mock service validation
      vi.mocked(bookingManagement['serviceRepo'].findById).mockResolvedValue({
        success: true,
        data: {
          id: 'service-123',
          tenantId: tenant1Id,
          name: 'Test Service',
          price: 50,
          isActive: true,
        } as any,
      });

      // Mock conversation validation
      vi.mocked(bookingManagement['conversationRepo'].findById).mockResolvedValue({
        success: true,
        data: { id: 'conv-123', tenantId: tenant1Id } as any,
      });

      // Mock existing booking conflict
      vi.mocked(bookingManagement['bookingRepo'].findByDateRange).mockResolvedValue({
        success: true,
        data: {
          data: [{
            id: 'existing-booking',
            tenantId: tenant1Id,
            serviceId: 'service-123',
            appointmentTime,
            status: 'confirmed',
          }] as any,
          pagination: { page: 1, limit: 100, total: 1, totalPages: 1, hasNext: false, hasPrev: false },
        },
      });

      const result = await bookingManagement.createBooking(tenant1Id, {
        conversationId: 'conv-123',
        serviceId: 'service-123',
        phoneNumber: '+1234567890',
        appointmentDate,
        appointmentTime,
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('BOOKING_CONFLICT');
    });
  });

  describe('Complete Booking Workflow', () => {
    it('should handle complete booking flow from creation to confirmation', async () => {
      const serviceId = 'service-123';
      const bookingId = 'booking-123';

      // Step 1: Mock service creation
      vi.mocked(serviceManagement['serviceRepo'].search).mockResolvedValue({
        success: true,
        data: { data: [], pagination: { page: 1, limit: 1, total: 0, totalPages: 0, hasNext: false, hasPrev: false } },
      });

      vi.mocked(serviceManagement['serviceRepo'].create).mockResolvedValue({
        success: true,
        data: {
          id: serviceId,
          tenantId: tenant1Id,
          name: 'Premium Haircut',
          price: 75,
          isActive: true,
        } as any,
      });

      // Create service
      const serviceResult = await serviceManagement.createService(tenant1Id, {
        name: 'Premium Haircut',
        price: 75,
      });

      expect(serviceResult.success).toBe(true);

      // Step 2: Mock booking creation
      vi.mocked(bookingManagement['serviceRepo'].findById).mockResolvedValue({
        success: true,
        data: serviceResult.data as any,
      });

      vi.mocked(bookingManagement['conversationRepo'].findById).mockResolvedValue({
        success: true,
        data: { id: 'conv-123', tenantId: tenant1Id } as any,
      });

      vi.mocked(bookingManagement['bookingRepo'].findByDateRange).mockResolvedValue({
        success: true,
        data: { data: [], pagination: { page: 1, limit: 100, total: 0, totalPages: 0, hasNext: false, hasPrev: false } },
      });

      vi.mocked(bookingManagement['bookingRepo'].create).mockResolvedValue({
        success: true,
        data: {
          id: bookingId,
          tenantId: tenant1Id,
          serviceId,
          status: 'pending',
          amount: 75,
        } as any,
      });

      // Create booking
      const bookingResult = await bookingManagement.createBooking(tenant1Id, {
        conversationId: 'conv-123',
        serviceId,
        phoneNumber: '+1234567890',
        appointmentDate: new Date('2024-12-25T10:00:00Z'),
        appointmentTime: '10:00 AM',
      });

      expect(bookingResult.success).toBe(true);
      expect(bookingResult.data!.status).toBe('pending');

      // Step 3: Process payment
      vi.mocked(bookingManagement['bookingRepo'].findById).mockResolvedValue({
        success: true,
        data: bookingResult.data as any,
      });

      vi.mocked(bookingManagement['bookingRepo'].update).mockResolvedValue({
        success: true,
        data: {
          ...bookingResult.data,
          status: 'paid',
          paymentMethod: 'credit_card',
        } as any,
      });

      const paymentResult = await bookingManagement.processPayment(tenant1Id, bookingId, {
        paymentMethod: 'credit_card',
        paymentReference: 'txn_123',
      });

      expect(paymentResult.success).toBe(true);
      expect(paymentResult.data!.status).toBe('paid');

      // Step 4: Confirm booking
      vi.mocked(bookingManagement['bookingRepo'].findById).mockResolvedValue({
        success: true,
        data: paymentResult.data as any,
      });

      vi.mocked(bookingManagement['bookingRepo'].update).mockResolvedValue({
        success: true,
        data: {
          ...paymentResult.data,
          status: 'confirmed',
        } as any,
      });

      const confirmResult = await bookingManagement.confirmBooking(tenant1Id, bookingId);

      expect(confirmResult.success).toBe(true);
      expect(confirmResult.data!.status).toBe('confirmed');
    });

    it('should handle booking cancellation workflow', async () => {
      const bookingId = 'booking-123';

      // Mock existing booking
      const existingBooking = {
        id: bookingId,
        tenantId: tenant1Id,
        status: 'pending',
        metadata: {},
      };

      vi.mocked(bookingManagement['bookingRepo'].findById).mockResolvedValue({
        success: true,
        data: existingBooking as any,
      });

      vi.mocked(bookingManagement['bookingRepo'].update).mockResolvedValue({
        success: true,
        data: {
          ...existingBooking,
          status: 'cancelled',
          metadata: {
            cancellationReason: 'Customer request',
            cancelledAt: expect.any(String),
          },
        } as any,
      });

      const result = await bookingManagement.cancelBooking(tenant1Id, bookingId, 'Customer request');

      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('cancelled');
      expect(result.data!.metadata.cancellationReason).toBe('Customer request');
    });
  });

  describe('Tenant Data Isolation', () => {
    it('should prevent cross-tenant booking access', async () => {
      // This test would verify that tenant 1 cannot access tenant 2's bookings
      // In a real implementation, this would be enforced by the repository layer
      
      // Mock booking that belongs to tenant 2
      vi.mocked(bookingManagement['bookingRepo'].findById).mockResolvedValue({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Booking not found',
        },
      });

      // Tenant 1 tries to access tenant 2's booking
      const result = await bookingManagement.getBooking(tenant1Id, 'tenant2-booking-123');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NOT_FOUND');
    });

    it('should prevent cross-tenant service access', async () => {
      // Mock service that belongs to tenant 2
      vi.mocked(serviceManagement['serviceRepo'].findById).mockResolvedValue({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Service not found',
        },
      });

      // Tenant 1 tries to access tenant 2's service
      const result = await serviceManagement.getService(tenant1Id, 'tenant2-service-123');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NOT_FOUND');
    });
  });

  describe('Business Logic Validation', () => {
    it('should enforce business rules across tenant operations', async () => {
      // Test that business rules are consistently applied across all tenant operations
      
      // Mock inactive service
      vi.mocked(bookingManagement['serviceRepo'].findById).mockResolvedValue({
        success: true,
        data: {
          id: 'service-123',
          tenantId: tenant1Id,
          name: 'Inactive Service',
          price: 50,
          isActive: false, // Service is inactive
        } as any,
      });

      // Try to create booking for inactive service
      const result = await bookingManagement.createBooking(tenant1Id, {
        conversationId: 'conv-123',
        serviceId: 'service-123',
        phoneNumber: '+1234567890',
        appointmentDate: new Date('2024-12-25T10:00:00Z'),
        appointmentTime: '10:00 AM',
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('SERVICE_INACTIVE');
    });

    it('should validate appointment times across tenant bookings', async () => {
      // Test that appointment time validation works correctly
      
      const invalidTimeRequest = {
        conversationId: 'conv-123',
        serviceId: 'service-123',
        phoneNumber: '+1234567890',
        appointmentDate: new Date('2024-12-25T10:00:00Z'),
        appointmentTime: '25:00', // Invalid time
      };

      const result = await bookingManagement.createBooking(tenant1Id, invalidTimeRequest);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_FAILED');
      expect(result.error?.details).toContain('Invalid appointment time format');
    });
  });
});