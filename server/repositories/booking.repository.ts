/**
 * Booking Repository with Tenant Isolation
 * Handles CRUD operations for bookings with automatic tenant filtering
 */

import { eq, and, like, inArray, or, gte, lte, asc, desc, sql, between } from 'drizzle-orm';
import { BaseRepository } from './base.repository';
import * as schema from '@shared/schema';
import type {
  ServiceResponse,
  PaginationParams,
  FilterParams,
  PaginatedResponse,
} from '@shared/types/tenant';
import type { Booking, InsertBooking } from '@shared/schema';

export interface BookingFilters {
  status?: string[];
  serviceId?: string;
  phoneNumber?: string;
  dateFrom?: Date;
  dateTo?: Date;
  paymentMethod?: string;
}

export interface BookingStats {
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
  averageBookingValue: number;
}

export class BookingRepository extends BaseRepository<
  typeof schema.bookings,
  Booking,
  InsertBooking
> {
  constructor(connectionString: string) {
    super(connectionString, schema.bookings);
  }

  /**
   * Find bookings by status
   */
  async findByStatus(
    tenantId: string,
    status: string,
    pagination: PaginationParams
  ): Promise<ServiceResponse<PaginatedResponse<Booking>>> {
    return this.list(
      tenantId,
      pagination,
      undefined,
      eq(schema.bookings.status, status)
    );
  }

  /**
   * Find bookings by service
   */
  async findByService(
    tenantId: string,
    serviceId: string,
    pagination: PaginationParams
  ): Promise<ServiceResponse<PaginatedResponse<Booking>>> {
    return this.list(
      tenantId,
      pagination,
      undefined,
      eq(schema.bookings.serviceId, serviceId)
    );
  }

  /**
   * Find bookings by phone number
   */
  async findByPhoneNumber(
    tenantId: string,
    phoneNumber: string
  ): Promise<ServiceResponse<Booking[]>> {
    return this.executeWithTenantContext(tenantId, async (db) => {
      const results = await db
        .select()
        .from(schema.bookings)
        .where(
          and(
            eq(schema.bookings.tenantId, tenantId),
            eq(schema.bookings.phoneNumber, phoneNumber)
          )
        )
        .orderBy(desc(schema.bookings.createdAt));

      return results as Booking[];
    });
  }

  /**
   * Find bookings by date range
   */
  async findByDateRange(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    pagination: PaginationParams
  ): Promise<ServiceResponse<PaginatedResponse<Booking>>> {
    return this.executeWithTenantContext(tenantId, async (db) => {
      const whereConditions = [
        eq(schema.bookings.tenantId, tenantId),
        gte(schema.bookings.appointmentDate, startDate),
        lte(schema.bookings.appointmentDate, endDate),
      ];

      const whereClause = and(...whereConditions);

      // Get total count
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.bookings)
        .where(whereClause);

      // Get paginated data
      const offset = (pagination.page - 1) * pagination.limit;
      const results = await db
        .select()
        .from(schema.bookings)
        .where(whereClause)
        .orderBy(desc(schema.bookings.appointmentDate))
        .limit(pagination.limit)
        .offset(offset);

      const totalPages = Math.ceil(count / pagination.limit);

      return {
        data: results as Booking[],
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total: count,
          totalPages,
          hasNext: pagination.page < totalPages,
          hasPrev: pagination.page > 1,
        },
      };
    });
  }

  /**
   * Advanced booking search with filters
   */
  async search(
    tenantId: string,
    filters: BookingFilters,
    pagination: PaginationParams
  ): Promise<ServiceResponse<PaginatedResponse<Booking>>> {
    return this.executeWithTenantContext(tenantId, async (db) => {
      const whereConditions = [eq(schema.bookings.tenantId, tenantId)];

      // Apply filters
      if (filters.status && filters.status.length > 0) {
        whereConditions.push(inArray(schema.bookings.status, filters.status));
      }

      if (filters.serviceId) {
        whereConditions.push(eq(schema.bookings.serviceId, filters.serviceId));
      }

      if (filters.phoneNumber) {
        whereConditions.push(like(schema.bookings.phoneNumber, `%${filters.phoneNumber}%`));
      }

      if (filters.dateFrom && filters.dateTo) {
        whereConditions.push(
          between(schema.bookings.appointmentDate, filters.dateFrom, filters.dateTo)
        );
      } else if (filters.dateFrom) {
        whereConditions.push(gte(schema.bookings.appointmentDate, filters.dateFrom));
      } else if (filters.dateTo) {
        whereConditions.push(lte(schema.bookings.appointmentDate, filters.dateTo));
      }

      if (filters.paymentMethod) {
        whereConditions.push(eq(schema.bookings.paymentMethod, filters.paymentMethod));
      }

      const whereClause = and(...whereConditions);

      // Get total count
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.bookings)
        .where(whereClause);

      // Get paginated data
      const offset = (pagination.page - 1) * pagination.limit;
      const results = await db
        .select()
        .from(schema.bookings)
        .where(whereClause)
        .orderBy(desc(schema.bookings.createdAt))
        .limit(pagination.limit)
        .offset(offset);

      const totalPages = Math.ceil(count / pagination.limit);

      return {
        data: results as Booking[],
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total: count,
          totalPages,
          hasNext: pagination.page < totalPages,
          hasPrev: pagination.page > 1,
        },
      };
    });
  }

  /**
   * Update booking status
   */
  async updateStatus(
    tenantId: string,
    bookingId: string,
    status: string,
    paymentReference?: string
  ): Promise<ServiceResponse<Booking>> {
    const updateData: Partial<InsertBooking> = { status };
    if (paymentReference) {
      updateData.paymentReference = paymentReference;
    }
    return this.update(tenantId, bookingId, updateData as any);
  }

  /**
   * Get booking statistics for tenant
   */
  async getStats(
    tenantId: string,
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<ServiceResponse<BookingStats>> {
    return this.executeWithTenantContext(tenantId, async (db) => {
      const whereConditions = [eq(schema.bookings.tenantId, tenantId)];

      if (dateFrom && dateTo) {
        whereConditions.push(
          between(schema.bookings.createdAt, dateFrom, dateTo)
        );
      } else if (dateFrom) {
        whereConditions.push(gte(schema.bookings.createdAt, dateFrom));
      } else if (dateTo) {
        whereConditions.push(lte(schema.bookings.createdAt, dateTo));
      }

      const whereClause = and(...whereConditions);

      const [stats] = await db
        .select({
          totalBookings: sql<number>`count(*)`,
          pendingBookings: sql<number>`count(*) filter (where status = 'pending')`,
          confirmedBookings: sql<number>`count(*) filter (where status = 'confirmed')`,
          cancelledBookings: sql<number>`count(*) filter (where status = 'cancelled')`,
          totalRevenue: sql<number>`coalesce(sum(case when status in ('confirmed', 'paid') then amount else 0 end), 0)`,
          averageBookingValue: sql<number>`coalesce(avg(case when status in ('confirmed', 'paid') then amount else null end), 0)`,
        })
        .from(schema.bookings)
        .where(whereClause);

      return {
        totalBookings: stats.totalBookings,
        pendingBookings: stats.pendingBookings,
        confirmedBookings: stats.confirmedBookings,
        cancelledBookings: stats.cancelledBookings,
        totalRevenue: stats.totalRevenue,
        averageBookingValue: Math.round(stats.averageBookingValue * 100) / 100, // Round to 2 decimal places
      };
    });
  }

  /**
   * Get upcoming bookings for a tenant
   */
  async getUpcoming(
    tenantId: string,
    limit: number = 10
  ): Promise<ServiceResponse<Booking[]>> {
    return this.executeWithTenantContext(tenantId, async (db) => {
      const now = new Date();
      const results = await db
        .select()
        .from(schema.bookings)
        .where(
          and(
            eq(schema.bookings.tenantId, tenantId),
            inArray(schema.bookings.status, ['confirmed', 'paid']),
            gte(schema.bookings.appointmentDate, now)
          )
        )
        .orderBy(asc(schema.bookings.appointmentDate))
        .limit(limit);

      return results as Booking[];
    });
  }

  /**
   * Get bookings with service details (joined query)
   */
  async getWithServiceDetails(
    tenantId: string,
    pagination: PaginationParams,
    filters?: BookingFilters
  ): Promise<ServiceResponse<PaginatedResponse<Booking & { service: any }>>> {
    return this.executeWithTenantContext(tenantId, async (db) => {
      const whereConditions = [eq(schema.bookings.tenantId, tenantId)];

      // Apply filters if provided
      if (filters?.status && filters.status.length > 0) {
        whereConditions.push(inArray(schema.bookings.status, filters.status));
      }

      if (filters?.serviceId) {
        whereConditions.push(eq(schema.bookings.serviceId, filters.serviceId));
      }

      const whereClause = and(...whereConditions);

      // Get total count
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.bookings)
        .leftJoin(schema.services, eq(schema.bookings.serviceId, schema.services.id))
        .where(whereClause);

      // Get paginated data with service details
      const offset = (pagination.page - 1) * pagination.limit;
      const results = await db
        .select({
          // Booking fields
          id: schema.bookings.id,
          tenantId: schema.bookings.tenantId,
          conversationId: schema.bookings.conversationId,
          serviceId: schema.bookings.serviceId,
          phoneNumber: schema.bookings.phoneNumber,
          customerName: schema.bookings.customerName,
          customerEmail: schema.bookings.customerEmail,
          amount: schema.bookings.amount,
          status: schema.bookings.status,
          paymentMethod: schema.bookings.paymentMethod,
          paymentReference: schema.bookings.paymentReference,
          appointmentDate: schema.bookings.appointmentDate,
          appointmentTime: schema.bookings.appointmentTime,
          notes: schema.bookings.notes,
          metadata: schema.bookings.metadata,
          createdAt: schema.bookings.createdAt,
          updatedAt: schema.bookings.updatedAt,
          // Service fields
          service: {
            id: schema.services.id,
            name: schema.services.name,
            description: schema.services.description,
            price: schema.services.price,
            category: schema.services.category,
            icon: schema.services.icon,
          },
        })
        .from(schema.bookings)
        .leftJoin(schema.services, eq(schema.bookings.serviceId, schema.services.id))
        .where(whereClause)
        .orderBy(desc(schema.bookings.createdAt))
        .limit(pagination.limit)
        .offset(offset);

      const totalPages = Math.ceil(count / pagination.limit);

      return {
        data: results as any,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total: count,
          totalPages,
          hasNext: pagination.page < totalPages,
          hasPrev: pagination.page > 1,
        },
      };
    });
  }
}