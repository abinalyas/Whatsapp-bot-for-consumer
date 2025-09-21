/**
 * Booking Management Service Unit Tests
 * Tests tenant-specific booking workflows and payment processing
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BookingManagementService, CreateBookingRequest, UpdateBookingRequest, PaymentRequest } from '../server/services/booking-management.service';
import { BookingRepository } from '../server/repositories/booking.repository';
import { ServiceRepository } from '../server/repositories/service.repository';
import { ConversationRepository } from '../server/repositories/conversation.repository';
import type { Booking, Service } from '@shared/schema';

// Mock database connection
const mockConnectionString = 'postgresql://test:test@localhost:5432/test';

// Mock repositories
const mockBookingRepo = {
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  findById: vi.fn(),
  list: vi.fn(),
  search: vi.fn(),
  findByStatus: vi.fn(),
  findByService: vi.fn(),
  findByPhoneNumber: vi.fn(),
  findByDateRange: vi.fn(),
  updateStatus: vi.fn(),
  getStats: vi.fn(),
  getUpcoming: vi.fn(),
  getWithServiceDetails: vi.fn(),
  close: vi.fn(),
} as unknown as BookingRepository;

const mockServiceRepo = {
  findById: vi.fn(),
  close: vi.fn(),
} as unknown as ServiceRepository;

const mockConversationRepo = {
  findById: vi.fn(),
  close: vi.fn(),
} as unknown as ConversationRepository;

vi.mock('../server/repositories/booking.repository', () => ({
  BookingRepository: vi.fn(() => mockBookingRepo),
}));

vi.mock('../server/repositories/service.repository', () => ({
  ServiceRepository: vi.fn(() => mockServiceRepo),
}));

vi.mock('../server/repositories/conversation.repository', () => ({
  ConversationRepository: vi.fn(() => mockConversationRepo),
}));

describe('BookingManagementService', () => {
  let bookingManagement: BookingManagementService;
  let mockBooking: Booking;
  let mockService: Service;

  beforeEach(() => {
    bookingManagement = new BookingManagementService(mockConnectionString);
    
    mockBooking = {
      id: 'booking-123',
      tenantId: 'tenant-123',
      conversationId: 'conv-123',
      serviceId: 'service-123',
      phoneNumber: '+1234567890',
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      amount: 50,
      status: 'pending',
      paymentMethod: null,
      paymentReference: null,
      appointmentDate: new Date('2025-12-25T10:00:00Z'),
      appointmentTime: '10:00 AM',
      notes: 'Test booking',
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockService = {
      id: 'service-123',
      tenantId: 'tenant-123',
      name: 'Haircut',
      description: 'Professional haircut',
      price: 50,
      category: 'hair',
      icon: 'scissors',
      isActive: true,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await bookingManagement.close();
  });

  describe('Booking Creation', () => {
    it('should create a new booking successfully', async () => {
      const createRequest: CreateBookingRequest = {
        conversationId: 'conv-123',
        serviceId: 'service-123',
        phoneNumber: '+1234567890',
        customerName: 'John Doe',
        appointmentDate: new Date('2025-12-25T10:00:00Z'),
        appointmentTime: '10:00 AM',
      };

      // Mock service validation (called during validation)
      vi.mocked(mockServiceRepo.findById).mockResolvedValue({
        success: true,
        data: mockService,
      });

      // Mock conversation validation (called during validation)
      vi.mocked(mockConversationRepo.findById).mockResolvedValue({
        success: true,
        data: { id: 'conv-123', tenantId: 'tenant-123' },
      });

      // Mock conflict check (no conflicts)
      vi.mocked(mockBookingRepo.findByDateRange).mockResolvedValue({
        success: true,
        data: { data: [], pagination: { page: 1, limit: 100, total: 0, totalPages: 0, hasNext: false, hasPrev: false } },
      });

      // Mock booking creation
      vi.mocked(mockBookingRepo.create).mockResolvedValue({
        success: true,
        data: mockBooking,
      });

      const result = await bookingManagement.createBooking('tenant-123', createRequest);

      if (!result.success) {
        console.log('Error:', result.error);
      }
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockBooking);
      expect(mockBookingRepo.create).toHaveBeenCalledWith('tenant-123', {
        tenantId: 'tenant-123',
        conversationId: 'conv-123',
        serviceId: 'service-123',
        phoneNumber: '+1234567890',
        customerName: 'John Doe',
        customerEmail: undefined,
        amount: 50,
        status: 'pending',
        appointmentDate: new Date('2025-12-25T10:00:00Z'),
        appointmentTime: '10:00 AM',
        notes: undefined,
        metadata: {},
      });
    });

    it('should validate required fields', async () => {
      const invalidRequest: CreateBookingRequest = {
        conversationId: '',
        serviceId: '',
        phoneNumber: 'invalid-phone',
        appointmentDate: new Date('2020-01-01'), // Past date
        appointmentTime: 'invalid-time',
      };

      const result = await bookingManagement.createBooking('tenant-123', invalidRequest);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_FAILED');
      expect(result.error?.details).toContain('Conversation ID is required');
      expect(result.error?.details).toContain('Service ID is required');
      expect(result.error?.details).toContain('Invalid phone number format');
      expect(result.error?.details).toContain('Appointment date must be in the future');
      expect(result.error?.details).toContain('Invalid appointment time format');
    });

    it('should validate service exists and is active', async () => {
      const createRequest: CreateBookingRequest = {
        conversationId: 'conv-123',
        serviceId: 'service-123',
        phoneNumber: '+1234567890',
        appointmentDate: new Date('2025-12-25T10:00:00Z'),
        appointmentTime: '10:00 AM',
      };

      // Mock conversation validation first (called during validation)
      vi.mocked(mockConversationRepo.findById).mockResolvedValue({
        success: true,
        data: { id: 'conv-123', tenantId: 'tenant-123' },
      });

      // Mock inactive service (called during validation)
      vi.mocked(mockServiceRepo.findById).mockResolvedValue({
        success: true,
        data: { ...mockService, isActive: false },
      });

      const result = await bookingManagement.createBooking('tenant-123', createRequest);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_FAILED');
      expect(result.error?.details).toContain('Service is not available for booking');
    });

    it('should check for booking conflicts', async () => {
      const createRequest: CreateBookingRequest = {
        conversationId: 'conv-123',
        serviceId: 'service-123',
        phoneNumber: '+1234567890',
        appointmentDate: new Date('2025-12-25T10:00:00Z'),
        appointmentTime: '10:00 AM',
      };

      // Mock service validation (called during validation)
      vi.mocked(mockServiceRepo.findById).mockResolvedValue({
        success: true,
        data: mockService,
      });

      // Mock conversation validation (called during validation)
      vi.mocked(mockConversationRepo.findById).mockResolvedValue({
        success: true,
        data: { id: 'conv-123', tenantId: 'tenant-123' },
      });

      // Mock conflict (existing booking at same time)
      vi.mocked(mockBookingRepo.findByDateRange).mockResolvedValue({
        success: true,
        data: { 
          data: [{ ...mockBooking, appointmentTime: '10:00 AM', status: 'confirmed' }], 
          pagination: { page: 1, limit: 100, total: 1, totalPages: 1, hasNext: false, hasPrev: false } 
        },
      });

      const result = await bookingManagement.createBooking('tenant-123', createRequest);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('BOOKING_CONFLICT');
    });
  });

  describe('Booking Updates', () => {
    it('should update booking successfully', async () => {
      const updateRequest: UpdateBookingRequest = {
        customerName: 'Jane Doe',
        notes: 'Updated notes',
      };

      vi.mocked(mockBookingRepo.findById).mockResolvedValue({
        success: true,
        data: mockBooking,
      });

      vi.mocked(mockBookingRepo.update).mockResolvedValue({
        success: true,
        data: { ...mockBooking, ...updateRequest },
      });

      const result = await bookingManagement.updateBooking('tenant-123', 'booking-123', updateRequest);

      expect(result.success).toBe(true);
      expect(mockBookingRepo.update).toHaveBeenCalledWith('tenant-123', 'booking-123', updateRequest);
    });

    it('should prevent updating cancelled bookings', async () => {
      const updateRequest: UpdateBookingRequest = {
        customerName: 'Jane Doe',
      };

      vi.mocked(mockBookingRepo.findById).mockResolvedValue({
        success: true,
        data: { ...mockBooking, status: 'cancelled' },
      });

      const result = await bookingManagement.updateBooking('tenant-123', 'booking-123', updateRequest);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('BOOKING_CANCELLED');
    });

    it('should check conflicts when updating appointment time', async () => {
      const updateRequest: UpdateBookingRequest = {
        appointmentTime: '11:00 AM',
      };

      vi.mocked(mockBookingRepo.findById).mockResolvedValue({
        success: true,
        data: mockBooking,
      });

      // Mock conflict check
      vi.mocked(mockBookingRepo.findByDateRange).mockResolvedValue({
        success: true,
        data: { 
          data: [{ ...mockBooking, id: 'other-booking', appointmentTime: '11:00 AM', status: 'confirmed' }], 
          pagination: { page: 1, limit: 100, total: 1, totalPages: 1, hasNext: false, hasPrev: false } 
        },
      });

      const result = await bookingManagement.updateBooking('tenant-123', 'booking-123', updateRequest);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('BOOKING_CONFLICT');
    });

    it('should prevent empty updates', async () => {
      const result = await bookingManagement.updateBooking('tenant-123', 'booking-123', {});

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NO_UPDATE_DATA');
    });
  });

  describe('Booking Cancellation', () => {
    it('should cancel booking successfully', async () => {
      vi.mocked(mockBookingRepo.findById).mockResolvedValue({
        success: true,
        data: mockBooking,
      });

      vi.mocked(mockBookingRepo.update).mockResolvedValue({
        success: true,
        data: { ...mockBooking, status: 'cancelled' },
      });

      const result = await bookingManagement.cancelBooking('tenant-123', 'booking-123', 'Customer request');

      expect(result.success).toBe(true);
      expect(mockBookingRepo.update).toHaveBeenCalledWith('tenant-123', 'booking-123', {
        status: 'cancelled',
        metadata: {
          ...mockBooking.metadata,
          cancellationReason: 'Customer request',
          cancelledAt: expect.any(String),
        },
      });
    });

    it('should prevent cancelling already cancelled booking', async () => {
      vi.mocked(mockBookingRepo.findById).mockResolvedValue({
        success: true,
        data: { ...mockBooking, status: 'cancelled' },
      });

      const result = await bookingManagement.cancelBooking('tenant-123', 'booking-123');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('ALREADY_CANCELLED');
    });
  });

  describe('Payment Processing', () => {
    it('should process payment successfully', async () => {
      const paymentRequest: PaymentRequest = {
        paymentMethod: 'credit_card',
        paymentReference: 'txn_123456',
      };

      vi.mocked(mockBookingRepo.findById).mockResolvedValue({
        success: true,
        data: mockBooking,
      });

      vi.mocked(mockBookingRepo.update).mockResolvedValue({
        success: true,
        data: { ...mockBooking, status: 'paid', ...paymentRequest },
      });

      const result = await bookingManagement.processPayment('tenant-123', 'booking-123', paymentRequest);

      expect(result.success).toBe(true);
      expect(mockBookingRepo.update).toHaveBeenCalledWith('tenant-123', 'booking-123', {
        status: 'paid',
        paymentMethod: 'credit_card',
        paymentReference: 'txn_123456',
        metadata: {
          ...mockBooking.metadata,
          paymentProcessedAt: expect.any(String),
        },
      });
    });

    it('should prevent payment for cancelled booking', async () => {
      const paymentRequest: PaymentRequest = {
        paymentMethod: 'credit_card',
      };

      vi.mocked(mockBookingRepo.findById).mockResolvedValue({
        success: true,
        data: { ...mockBooking, status: 'cancelled' },
      });

      const result = await bookingManagement.processPayment('tenant-123', 'booking-123', paymentRequest);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('BOOKING_CANCELLED');
    });

    it('should prevent duplicate payment', async () => {
      const paymentRequest: PaymentRequest = {
        paymentMethod: 'credit_card',
      };

      vi.mocked(mockBookingRepo.findById).mockResolvedValue({
        success: true,
        data: { ...mockBooking, status: 'paid' },
      });

      const result = await bookingManagement.processPayment('tenant-123', 'booking-123', paymentRequest);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('ALREADY_PAID');
    });
  });

  describe('Booking Confirmation', () => {
    it('should confirm booking successfully', async () => {
      vi.mocked(mockBookingRepo.findById).mockResolvedValue({
        success: true,
        data: { ...mockBooking, status: 'paid' },
      });

      vi.mocked(mockBookingRepo.update).mockResolvedValue({
        success: true,
        data: { ...mockBooking, status: 'confirmed' },
      });

      const result = await bookingManagement.confirmBooking('tenant-123', 'booking-123');

      expect(result.success).toBe(true);
      expect(mockBookingRepo.update).toHaveBeenCalledWith('tenant-123', 'booking-123', {
        status: 'confirmed',
        metadata: {
          ...mockBooking.metadata,
          confirmedAt: expect.any(String),
        },
      });
    });

    it('should prevent confirming cancelled booking', async () => {
      vi.mocked(mockBookingRepo.findById).mockResolvedValue({
        success: true,
        data: { ...mockBooking, status: 'cancelled' },
      });

      const result = await bookingManagement.confirmBooking('tenant-123', 'booking-123');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('BOOKING_CANCELLED');
    });
  });

  describe('Booking Queries', () => {
    it('should get booking by ID', async () => {
      vi.mocked(mockBookingRepo.findById).mockResolvedValue({
        success: true,
        data: mockBooking,
      });

      const result = await bookingManagement.getBooking('tenant-123', 'booking-123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockBooking);
    });

    it('should list bookings with pagination', async () => {
      const mockPaginatedResponse = {
        data: [mockBooking],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1, hasNext: false, hasPrev: false },
      };

      vi.mocked(mockBookingRepo.list).mockResolvedValue({
        success: true,
        data: mockPaginatedResponse,
      });

      const result = await bookingManagement.listBookings('tenant-123', { page: 1, limit: 10 });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockPaginatedResponse);
    });

    it('should search bookings with filters', async () => {
      const filters = { status: ['pending'], serviceId: 'service-123' };
      const mockSearchResponse = {
        data: [mockBooking],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1, hasNext: false, hasPrev: false },
      };

      vi.mocked(mockBookingRepo.search).mockResolvedValue({
        success: true,
        data: mockSearchResponse,
      });

      const result = await bookingManagement.listBookings('tenant-123', { page: 1, limit: 10 }, filters);

      expect(result.success).toBe(true);
      expect(mockBookingRepo.search).toHaveBeenCalledWith('tenant-123', filters, { page: 1, limit: 10 });
    });

    it('should get bookings by phone number', async () => {
      vi.mocked(mockBookingRepo.findByPhoneNumber).mockResolvedValue({
        success: true,
        data: [mockBooking],
      });

      const result = await bookingManagement.getBookingsByPhoneNumber('tenant-123', '+1234567890');

      expect(result.success).toBe(true);
      expect(result.data).toEqual([mockBooking]);
    });

    it('should get upcoming bookings', async () => {
      vi.mocked(mockBookingRepo.getUpcoming).mockResolvedValue({
        success: true,
        data: [mockBooking],
      });

      const result = await bookingManagement.getUpcomingBookings('tenant-123', 5);

      expect(result.success).toBe(true);
      expect(result.data).toEqual([mockBooking]);
      expect(mockBookingRepo.getUpcoming).toHaveBeenCalledWith('tenant-123', 5);
    });

    it('should get bookings with service details', async () => {
      const mockBookingWithDetails = {
        ...mockBooking,
        service: mockService,
      };

      vi.mocked(mockBookingRepo.getWithServiceDetails).mockResolvedValue({
        success: true,
        data: {
          data: [mockBookingWithDetails],
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1, hasNext: false, hasPrev: false },
        },
      });

      const result = await bookingManagement.getBookingsWithDetails('tenant-123', { page: 1, limit: 10 });

      expect(result.success).toBe(true);
      expect(result.data!.data[0]).toEqual(mockBookingWithDetails);
    });
  });

  describe('Booking Analytics', () => {
    it('should get booking statistics', async () => {
      const mockStats = {
        totalBookings: 10,
        pendingBookings: 3,
        confirmedBookings: 5,
        cancelledBookings: 2,
        totalRevenue: 500,
        averageBookingValue: 50,
      };

      vi.mocked(mockBookingRepo.getStats).mockResolvedValue({
        success: true,
        data: mockStats,
      });

      const result = await bookingManagement.getBookingStats('tenant-123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockStats);
    });

    it('should get booking statistics with date range', async () => {
      const dateFrom = new Date('2024-01-01');
      const dateTo = new Date('2024-12-31');
      const mockStats = {
        totalBookings: 5,
        pendingBookings: 1,
        confirmedBookings: 3,
        cancelledBookings: 1,
        totalRevenue: 250,
        averageBookingValue: 50,
      };

      vi.mocked(mockBookingRepo.getStats).mockResolvedValue({
        success: true,
        data: mockStats,
      });

      const result = await bookingManagement.getBookingStats('tenant-123', dateFrom, dateTo);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockStats);
      expect(mockBookingRepo.getStats).toHaveBeenCalledWith('tenant-123', dateFrom, dateTo);
    });
  });

  describe('Error Handling', () => {
    it('should handle repository errors during creation', async () => {
      const createRequest: CreateBookingRequest = {
        conversationId: 'conv-123',
        serviceId: 'service-123',
        phoneNumber: '+1234567890',
        appointmentDate: new Date('2025-12-25T10:00:00Z'),
        appointmentTime: '10:00 AM',
      };

      // Mock conversation validation first
      vi.mocked(mockConversationRepo.findById).mockResolvedValue({
        success: true,
        data: { id: 'conv-123', tenantId: 'tenant-123' },
      });

      // Mock service validation error
      vi.mocked(mockServiceRepo.findById).mockRejectedValue(new Error('Database error'));

      const result = await bookingManagement.createBooking('tenant-123', createRequest);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_FAILED');
      expect(result.error?.details).toContain('Error validating service');
    });

    it('should handle repository errors during listing', async () => {
      vi.mocked(mockBookingRepo.list).mockRejectedValue(new Error('Database error'));

      const result = await bookingManagement.listBookings('tenant-123', { page: 1, limit: 10 });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('BOOKING_LIST_FAILED');
    });
  });
});