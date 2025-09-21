/**
 * Service Repository with Tenant Isolation
 * Handles CRUD operations for services with automatic tenant filtering
 */

import { eq, and, like, inArray, or, gte, lte, asc, desc, sql } from 'drizzle-orm';
import { BaseRepository } from './base.repository';
import * as schema from '@shared/schema';
import type {
  ServiceResponse,
  PaginationParams,
  FilterParams,
  PaginatedResponse,
} from '@shared/types/tenant';
import type { Service, InsertService } from '@shared/schema';

export class ServiceRepository extends BaseRepository<
  typeof schema.services,
  Service,
  InsertService
> {
  constructor(connectionString: string) {
    super(connectionString, schema.services);
  }

  /**
   * Find services by category
   */
  async findByCategory(
    tenantId: string,
    category: string
  ): Promise<ServiceResponse<Service[]>> {
    return this.executeWithTenantContext(tenantId, async (db) => {
      const results = await db
        .select()
        .from(schema.services)
        .where(
          and(
            eq(schema.services.tenantId, tenantId),
            eq(schema.services.category, category),
            eq(schema.services.isActive, true)
          )
        );

      return results as Service[];
    });
  }

  /**
   * Find active services only
   */
  async findActive(
    tenantId: string,
    pagination: PaginationParams
  ): Promise<ServiceResponse<PaginatedResponse<Service>>> {
    return this.list(
      tenantId,
      pagination,
      undefined,
      eq(schema.services.isActive, true)
    );
  }

  /**
   * Search services by name or description
   */
  async search(
    tenantId: string,
    query: string,
    pagination: PaginationParams
  ): Promise<ServiceResponse<PaginatedResponse<Service>>> {
    return this.executeWithTenantContext(tenantId, async (db) => {
      const whereConditions = [
        eq(schema.services.tenantId, tenantId),
        eq(schema.services.isActive, true),
      ];

      if (query) {
        whereConditions.push(
          or(
            like(schema.services.name, `%${query}%`),
            like(schema.services.description, `%${query}%`)
          )
        );
      }

      const whereClause = and(...whereConditions);

      // Get total count
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.services)
        .where(whereClause);

      // Get paginated data
      const offset = (pagination.page - 1) * pagination.limit;
      const results = await db
        .select()
        .from(schema.services)
        .where(whereClause)
        .orderBy(desc(schema.services.createdAt))
        .limit(pagination.limit)
        .offset(offset);

      const totalPages = Math.ceil(count / pagination.limit);

      return {
        data: results as Service[],
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
   * Update service availability
   */
  async updateAvailability(
    tenantId: string,
    serviceId: string,
    isActive: boolean
  ): Promise<ServiceResponse<Service>> {
    return this.update(tenantId, serviceId, { isActive } as any);
  }

  /**
   * Get services by price range
   */
  async findByPriceRange(
    tenantId: string,
    minPrice: number,
    maxPrice: number
  ): Promise<ServiceResponse<Service[]>> {
    return this.executeWithTenantContext(tenantId, async (db) => {
      const results = await db
        .select()
        .from(schema.services)
        .where(
          and(
            eq(schema.services.tenantId, tenantId),
            eq(schema.services.isActive, true),
            gte(schema.services.price, minPrice),
            lte(schema.services.price, maxPrice)
          )
        )
        .orderBy(asc(schema.services.price));

      return results as Service[];
    });
  }
}