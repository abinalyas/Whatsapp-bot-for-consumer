/**
 * Booking Management Service
 * Handles tenant-specific booking workflows and payment processing
 */

import { BookingRepository, BookingFilters, BookingStats } from '../repositories/booking.repository';
import { ServiceRepository } from '../repositories/service.repository';
import { ConversationRepository } from '../repositories/conversation.repository';
import type {
  ServiceResponse,
  PaginationParams,
  PaginatedResponse,
} from '@shared/types/tenant';
import type { Booking, InsertBooking, Service } from '@shared/schema';

export interface CreateBookingRequest {
  conversationId: string;
  serviceId: string;
  phoneNumber: string;
  customerName?: string;
  customerEmail?: string;
  appointmentDate: Date;
  appointmentTime: string;
  notes?: string;
  metadata?: any;
}

export interface UpdateBookingRequest {
  customerName?: string;
  customerEmail?: string;
  appointmentDate?: Date;
  appointmentTime?: string;
  notes?: string;
  metadata?: any;
}

export interface PaymentRequest {
  paymentMethod: string;
  paymentReference?: string;
  amount?: number;
}

export interface BookingWithDetails extends Booking {
  service?: Service;
  conversation?: any;
}

export class BookingManagementService {
  private bookingRepo: BookingRepository;
  private serviceRepo: ServiceRepository;
  private conversationRepo: ConversationRepository;

  constructor(connectionString: string) {
    this.bookingRepo = new BookingRepository(connectionString);
    this.serviceRepo = new ServiceRepository(connectionString);
    this.conversationRepo = new ConversationRepository(connectionString);
  }

  // ===== BOOKING CRUD OPERATIONS =====

  /**
   * Create a new booking for tenant
   */
  async createBooking(
    tenantId: string,
    bookingData: CreateBookingRequest
  ): Promise<ServiceResponse<Booking>> {
    try {
      // Validate booking data
      const validationResult = await this.validateBookingData(tenantId, bookingData);
      if (!validationResult.isValid) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: 'Booking validation failed',
            details: validationResult.errors,
          },
        };
      }

      // Get service details to calculate amount
      const serviceResult = await this.serviceRepo.findById(tenantId, bookingData.serviceId);
      if (!serviceResult.success) {
        return {
          success: false,
          error: {
            code: 'SERVICE_NOT_FOUND',
            message: 'Service not found',
            tenantId,
          },
        };
      }

      const service = serviceResult.data!;
      if (!service.isActive) {
        return {
          success: false,
          error: {
            code: 'SERVICE_INACTIVE',
            message: 'Service is not available for booking',
            tenantId,
          },
        };
      }

      // Check for booking conflicts (same service, date, and time)
      const conflictResult = await this.checkBookingConflict(
        tenantId,
        bookingData.serviceId,
        bookingData.appointmentDate,
        bookingData.appointmentTime
      );

      if (conflictResult.hasConflict) {
        return {
          success: false,
          error: {
            code: 'BOOKING_CONFLICT',
            message: 'A booking already exists for this service at the selected time',
            tenantId,
          },
        };
      }

      const insertData: InsertBooking = {
        tenantId,
        conversationId: bookingData.conversationId,
        serviceId: bookingData.serviceId,
        phoneNumber: bookingData.phoneNumber,
        customerName: bookingData.customerName,
        customerEmail: bookingData.customerEmail,
        amount: service.price,
        status: 'pending',
        appointmentDate: bookingData.appointmentDate,
        appointmentTime: bookingData.appointmentTime,
        notes: bookingData.notes,
        metadata: bookingData.metadata || {},
      };

      return await this.bookingRepo.create(tenantId, insertData);
    } catch (error) {
      console.error('Error creating booking:', error);
      return {
        success: false,
        error: {
          code: 'BOOKING_CREATION_FAILED',
          message: 'Failed to create booking',
          tenantId,
        },
      };
    }
  }

  /**
   * Update an existing booking
   */
  async updateBooking(
    tenantId: string,
    bookingId: string,
    updateData: UpdateBookingRequest
  ): Promise<ServiceResponse<Booking>> {
    try {
      if (Object.keys(updateData).length === 0) {
        return {
          success: false,
          error: {
            code: 'NO_UPDATE_DATA',
            message: 'No update data provided',
            tenantId,
          },
        };
      }

      // Get existing booking
      const existingResult = await this.bookingRepo.findById(tenantId, bookingId);
      if (!existingResult.success) {
        return existingResult;
      }

      const existingBooking = existingResult.data!;

      // Check if booking can be updated (not cancelled or completed)
      if (existingBooking.status === 'cancelled') {
        return {
          success: false,
          error: {
            code: 'BOOKING_CANCELLED',
            message: 'Cannot update a cancelled booking',
            tenantId,
          },
        };
      }

      // If updating appointment time/date, check for conflicts
      if (updateData.appointmentDate || updateData.appointmentTime) {
        const newDate = updateData.appointmentDate || existingBooking.appointmentDate!;
        const newTime = updateData.appointmentTime || existingBooking.appointmentTime!;

        const conflictResult = await this.checkBookingConflict(
          tenantId,
          existingBooking.serviceId,
          newDate,
          newTime,
          bookingId // Exclude current booking from conflict check
        );

        if (conflictResult.hasConflict) {
          return {
            success: false,
            error: {
              code: 'BOOKING_CONFLICT',
              message: 'A booking already exists for this service at the selected time',
              tenantId,
            },
          };
        }
      }

      return await this.bookingRepo.update(tenantId, bookingId, updateData as any);
    } catch (error) {
      console.error('Error updating booking:', error);
      return {
        success: false,
        error: {
          code: 'BOOKING_UPDATE_FAILED',
          message: 'Failed to update booking',
          tenantId,
        },
      };
    }
  }

  /**
   * Cancel a booking
   */
  async cancelBooking(
    tenantId: string,
    bookingId: string,
    reason?: string
  ): Promise<ServiceResponse<Booking>> {
    try {
      const existingResult = await this.bookingRepo.findById(tenantId, bookingId);
      if (!existingResult.success) {
        return existingResult;
      }

      const existingBooking = existingResult.data!;

      if (existingBooking.status === 'cancelled') {
        return {
          success: false,
          error: {
            code: 'ALREADY_CANCELLED',
            message: 'Booking is already cancelled',
            tenantId,
          },
        };
      }

      const updateData: Partial<InsertBooking> = {
        status: 'cancelled',
        metadata: {
          ...existingBooking.metadata,
          cancellationReason: reason,
          cancelledAt: new Date().toISOString(),
        },
      };

      return await this.bookingRepo.update(tenantId, bookingId, updateData as any);
    } catch (error) {
      console.error('Error cancelling booking:', error);
      return {
        success: false,
        error: {
          code: 'BOOKING_CANCELLATION_FAILED',
          message: 'Failed to cancel booking',
          tenantId,
        },
      };
    }
  }

  /**
   * Process payment for a booking
   */
  async processPayment(
    tenantId: string,
    bookingId: string,
    paymentData: PaymentRequest
  ): Promise<ServiceResponse<Booking>> {
    try {
      const existingResult = await this.bookingRepo.findById(tenantId, bookingId);
      if (!existingResult.success) {
        return existingResult;
      }

      const existingBooking = existingResult.data!;

      if (existingBooking.status === 'cancelled') {
        return {
          success: false,
          error: {
            code: 'BOOKING_CANCELLED',
            message: 'Cannot process payment for cancelled booking',
            tenantId,
          },
        };
      }

      if (existingBooking.status === 'paid') {
        return {
          success: false,
          error: {
            code: 'ALREADY_PAID',
            message: 'Booking is already paid',
            tenantId,
          },
        };
      }

      // Update booking with payment information
      const updateData: Partial<InsertBooking> = {
        status: 'paid',
        paymentMethod: paymentData.paymentMethod,
        paymentReference: paymentData.paymentReference,
        metadata: {
          ...existingBooking.metadata,
          paymentProcessedAt: new Date().toISOString(),
        },
      };

      // If amount is provided, update it (for partial payments or adjustments)
      if (paymentData.amount !== undefined) {
        updateData.amount = paymentData.amount;
      }

      return await this.bookingRepo.update(tenantId, bookingId, updateData as any);
    } catch (error) {
      console.error('Error processing payment:', error);
      return {
        success: false,
        error: {
          code: 'PAYMENT_PROCESSING_FAILED',
          message: 'Failed to process payment',
          tenantId,
        },
      };
    }
  }

  /**
   * Confirm a booking (after payment)
   */
  async confirmBooking(
    tenantId: string,
    bookingId: string
  ): Promise<ServiceResponse<Booking>> {
    try {
      const existingResult = await this.bookingRepo.findById(tenantId, bookingId);
      if (!existingResult.success) {
        return existingResult;
      }

      const existingBooking = existingResult.data!;

      if (existingBooking.status === 'cancelled') {
        return {
          success: false,
          error: {
            code: 'BOOKING_CANCELLED',
            message: 'Cannot confirm cancelled booking',
            tenantId,
          },
        };
      }

      const updateData: Partial<InsertBooking> = {
        status: 'confirmed',
        metadata: {
          ...existingBooking.metadata,
          confirmedAt: new Date().toISOString(),
        },
      };

      return await this.bookingRepo.update(tenantId, bookingId, updateData as any);
    } catch (error) {
      console.error('Error confirming booking:', error);
      return {
        success: false,
        error: {
          code: 'BOOKING_CONFIRMATION_FAILED',
          message: 'Failed to confirm booking',
          tenantId,
        },
      };
    }
  }

  // ===== BOOKING QUERIES =====

  /**
   * Get booking by ID
   */
  async getBooking(tenantId: string, bookingId: string): Promise<ServiceResponse<Booking>> {
    return await this.bookingRepo.findById(tenantId, bookingId);
  }

  /**
   * List bookings with filtering and pagination
   */
  async listBookings(
    tenantId: string,
    pagination: PaginationParams,
    filters?: BookingFilters
  ): Promise<ServiceResponse<PaginatedResponse<Booking>>> {
    try {
      if (filters) {
        return await this.bookingRepo.search(tenantId, filters, pagination);
      }

      return await this.bookingRepo.list(tenantId, pagination);
    } catch (error) {
      console.error('Error listing bookings:', error);
      return {
        success: false,
        error: {
          code: 'BOOKING_LIST_FAILED',
          message: 'Failed to list bookings',
          tenantId,
        },
      };
    }
  }

  /**
   * Get bookings with service details
   */
  async getBookingsWithDetails(
    tenantId: string,
    pagination: PaginationParams,
    filters?: BookingFilters
  ): Promise<ServiceResponse<PaginatedResponse<BookingWithDetails>>> {
    return await this.bookingRepo.getWithServiceDetails(tenantId, pagination, filters);
  }

  /**
   * Get bookings by phone number
   */
  async getBookingsByPhoneNumber(
    tenantId: string,
    phoneNumber: string
  ): Promise<ServiceResponse<Booking[]>> {
    return await this.bookingRepo.findByPhoneNumber(tenantId, phoneNumber);
  }

  /**
   * Get upcoming bookings
   */
  async getUpcomingBookings(
    tenantId: string,
    limit: number = 10
  ): Promise<ServiceResponse<Booking[]>> {
    return await this.bookingRepo.getUpcoming(tenantId, limit);
  }

  // ===== BOOKING ANALYTICS =====

  /**
   * Get booking statistics
   */
  async getBookingStats(
    tenantId: string,
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<ServiceResponse<BookingStats>> {
    return await this.bookingRepo.getStats(tenantId, dateFrom, dateTo);
  }

  // ===== VALIDATION HELPERS =====

  /**
   * Validate booking data
   */
  private async validateBookingData(
    tenantId: string,
    data: CreateBookingRequest
  ): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Validate required fields
    if (!data.conversationId) {
      errors.push('Conversation ID is required');
    }

    if (!data.serviceId) {
      errors.push('Service ID is required');
    }

    if (!data.phoneNumber) {
      errors.push('Phone number is required');
    } else if (!/^\+?[\d\s\-\(\)]+$/.test(data.phoneNumber)) {
      errors.push('Invalid phone number format');
    }

    if (!data.appointmentDate) {
      errors.push('Appointment date is required');
    } else if (data.appointmentDate <= new Date()) {
      errors.push('Appointment date must be in the future');
    }

    if (!data.appointmentTime) {
      errors.push('Appointment time is required');
    } else if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9](\s?(AM|PM))?$/i.test(data.appointmentTime)) {
      errors.push('Invalid appointment time format');
    }

    // Validate email if provided
    if (data.customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.customerEmail)) {
      errors.push('Invalid email format');
    }

    // Validate service exists and is active
    if (data.serviceId) {
      try {
        const serviceResult = await this.serviceRepo.findById(tenantId, data.serviceId);
        if (!serviceResult.success) {
          errors.push('Service not found');
        } else if (!serviceResult.data!.isActive) {
          errors.push('Service is not available for booking');
        }
      } catch (error) {
        errors.push('Error validating service');
      }
    }

    // Validate conversation exists
    if (data.conversationId) {
      try {
        const conversationResult = await this.conversationRepo.findById(tenantId, data.conversationId);
        if (!conversationResult.success) {
          errors.push('Conversation not found');
        }
      } catch (error) {
        errors.push('Error validating conversation');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check for booking conflicts
   */
  private async checkBookingConflict(
    tenantId: string,
    serviceId: string,
    appointmentDate: Date,
    appointmentTime: string,
    excludeBookingId?: string
  ): Promise<{ hasConflict: boolean; conflictingBooking?: Booking }> {
    try {
      // Get bookings for the same date
      const startOfDay = new Date(appointmentDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(appointmentDate);
      endOfDay.setHours(23, 59, 59, 999);

      const bookingsResult = await this.bookingRepo.findByDateRange(
        tenantId,
        startOfDay,
        endOfDay,
        { page: 1, limit: 100 }
      );

      if (!bookingsResult.success) {
        return { hasConflict: false };
      }

      // Check for conflicts with same service and time
      const conflictingBooking = bookingsResult.data!.data.find(booking => 
        booking.serviceId === serviceId &&
        booking.appointmentTime === appointmentTime &&
        booking.status !== 'cancelled' &&
        booking.id !== excludeBookingId
      );

      return {
        hasConflict: !!conflictingBooking,
        conflictingBooking,
      };
    } catch (error) {
      console.error('Error checking booking conflict:', error);
      return { hasConflict: false };
    }
  }

  /**
   * Close database connections
   */
  async close(): Promise<void> {
    await this.bookingRepo.close();
    await this.serviceRepo.close();
    await this.conversationRepo.close();
  }
}