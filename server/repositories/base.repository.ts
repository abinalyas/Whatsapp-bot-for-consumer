/**
 * Base Repository with Tenant Isolation
 * Provides common database operations with automatic tenant filtering
 */

import { eq, and, desc, asc, like, inArray, gte, lte, ne, or, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import { PgTable, PgColumn } from 'drizzle-orm/pg-core';
import * as schema from '@shared/schema';
import type {
  PaginationParams,
  FilterParams,
  PaginatedResponse,
  ServiceResponse,
  TenantError,
} from '@shared/types/tenant';

export interface TenantScopedTable {
  tenantId: PgColumn;
  [key: string]: any;
}

export interface RepositoryOptions {
  enforceRLS?: boolean;
  autoInjectTenantId?: boolean;
}

/**
 * Base repository class with tenant isolation enforcement
 */
export abstract class BaseRepository<T extends TenantScopedTable, TSelect, TInsert> {
  protected db: ReturnType<typeof drizzle>;
  protected pool: Pool;
  protected table: T;
  protected options: RepositoryOptions;

  constructor(
    connectionString: string,
    table: T,
    options: RepositoryOptions = {}
  ) {
    this.pool = new Pool({ connectionString });
    this.db = drizzle({ client: this.pool, schema });
    this.table = table;
    this.options = {
      enforceRLS: true,
      autoInjectTenantId: true,
      ...options,
    };
  }

  /**
   * Create a new record with automatic tenant_id injection
   */
  async create(tenantId: string, data: TInsert): Promise<ServiceResponse<TSelect>> {
    try {
      this.validateTenantId(tenantId);

      const insertData = this.options.autoInjectTenantId
        ? { ...data, tenantId }
        : data;

      const [result] = await this.db
        .insert(this.table)
        .values(insertData as any)
        .returning();

      return {
        success: true,
        data: result as TSelect,
        metadata: { created: true },
      };
    } catch (error) {
      console.error(`Error creating ${this.table}:`, error);
      return this.handleError('CREATE_FAILED', 'Failed to create record', tenantId, error);
    }
  }

  /**
   * Find record by ID with tenant isolation
   */
  async findById(tenantId: string, id: string): Promise<ServiceResponse<TSelect>> {
    try {
      this.validateTenantId(tenantId);

      const whereClause = this.buildTenantWhereClause(tenantId, eq(this.table.id, id));
      
      const [result] = await this.db
        .select()
        .from(this.table)
        .where(whereClause)
        .limit(1);

      if (!result) {
        return {
          success: false,
          error: {
            code: 'RECORD_NOT_FOUND',
            message: 'Record not found',
            tenantId,
            details: { id },
          },
        };
      }

      return {
        success: true,
        data: result as TSelect,
      };
    } catch (error) {
      console.error(`Error finding ${this.table} by ID:`, error);
      return this.handleError('FIND_FAILED', 'Failed to find record', tenantId, error);
    }
  }

  /**
   * Update record with tenant isolation
   */
  async update(
    tenantId: string,
    id: string,
    data: Partial<TInsert>
  ): Promise<ServiceResponse<TSelect>> {
    try {
      this.validateTenantId(tenantId);

      // First check if record exists and belongs to tenant
      const existingRecord = await this.findById(tenantId, id);
      if (!existingRecord.success) {
        return existingRecord;
      }

      const whereClause = this.buildTenantWhereClause(tenantId, eq(this.table.id, id));
      
      const updateData = {
        ...data,
        updatedAt: new Date(),
      };

      const [result] = await this.db
        .update(this.table)
        .set(updateData as any)
        .where(whereClause)
        .returning();

      return {
        success: true,
        data: result as TSelect,
        metadata: { updated: true },
      };
    } catch (error) {
      console.error(`Error updating ${this.table}:`, error);
      return this.handleError('UPDATE_FAILED', 'Failed to update record', tenantId, error);
    }
  }

  /**
   * Delete record with tenant isolation (soft delete if supported)
   */
  async delete(tenantId: string, id: string): Promise<ServiceResponse<void>> {
    try {
      this.validateTenantId(tenantId);

      // First check if record exists and belongs to tenant
      const existingRecord = await this.findById(tenantId, id);
      if (!existingRecord.success) {
        return {
          success: false,
          error: existingRecord.error!,
        };
      }

      const whereClause = this.buildTenantWhereClause(tenantId, eq(this.table.id, id));

      // Check if table supports soft delete
      if ('isActive' in this.table) {
        await this.db
          .update(this.table)
          .set({ isActive: false, updatedAt: new Date() } as any)
          .where(whereClause);
      } else {
        await this.db
          .delete(this.table)
          .where(whereClause);
      }

      return {
        success: true,
        metadata: { deleted: true },
      };
    } catch (error) {
      console.error(`Error deleting ${this.table}:`, error);
      return this.handleError('DELETE_FAILED', 'Failed to delete record', tenantId, error);
    }
  }

  /**
   * List records with pagination and filtering
   */
  async list(
    tenantId: string,
    pagination: PaginationParams,
    filters?: FilterParams,
    additionalWhere?: any
  ): Promise<ServiceResponse<PaginatedResponse<TSelect>>> {
    try {
      this.validateTenantId(tenantId);

      // Build where conditions
      const whereConditions = [eq(this.table.tenantId, tenantId)];

      if (additionalWhere) {
        whereConditions.push(additionalWhere);
      }

      if (filters?.search && 'name' in this.table) {
        whereConditions.push(like(this.table.name as any, `%${filters.search}%`));
      }

      if (filters?.status && 'status' in this.table) {
        whereConditions.push(inArray(this.table.status as any, filters.status));
      }

      if (filters?.dateFrom && 'createdAt' in this.table) {
        whereConditions.push(gte(this.table.createdAt as any, filters.dateFrom));
      }

      if (filters?.dateTo && 'createdAt' in this.table) {
        whereConditions.push(lte(this.table.createdAt as any, filters.dateTo));
      }

      const whereClause = and(...whereConditions);

      // Get total count
      const [{ count }] = await this.db
        .select({ count: sql<number>`count(*)` })
        .from(this.table)
        .where(whereClause);

      // Get paginated data
      const offset = (pagination.page - 1) * pagination.limit;
      const orderBy = this.buildOrderBy(pagination);

      const results = await this.db
        .select()
        .from(this.table)
        .where(whereClause)
        .orderBy(orderBy)
        .limit(pagination.limit)
        .offset(offset);

      const totalPages = Math.ceil(count / pagination.limit);

      return {
        success: true,
        data: {
          data: results as TSelect[],
          pagination: {
            page: pagination.page,
            limit: pagination.limit,
            total: count,
            totalPages,
            hasNext: pagination.page < totalPages,
            hasPrev: pagination.page > 1,
          },
        },
      };
    } catch (error) {
      console.error(`Error listing ${this.table}:`, error);
      return this.handleError('LIST_FAILED', 'Failed to list records', tenantId, error);
    }
  }

  /**
   * Count records with tenant isolation
   */
  async count(tenantId: string, additionalWhere?: any): Promise<ServiceResponse<number>> {
    try {
      this.validateTenantId(tenantId);

      const whereConditions = [eq(this.table.tenantId, tenantId)];
      if (additionalWhere) {
        whereConditions.push(additionalWhere);
      }

      const whereClause = and(...whereConditions);

      const [{ count }] = await this.db
        .select({ count: sql<number>`count(*)` })
        .from(this.table)
        .where(whereClause);

      return {
        success: true,
        data: count,
      };
    } catch (error) {
      console.error(`Error counting ${this.table}:`, error);
      return this.handleError('COUNT_FAILED', 'Failed to count records', tenantId, error);
    }
  }

  /**
   * Execute custom query with tenant isolation
   */
  async executeWithTenantContext<TResult>(
    tenantId: string,
    queryFn: (db: typeof this.db, tenantId: string) => Promise<TResult>
  ): Promise<ServiceResponse<TResult>> {
    try {
      this.validateTenantId(tenantId);

      const result = await queryFn(this.db, tenantId);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error(`Error executing custom query:`, error);
      return this.handleError('QUERY_FAILED', 'Failed to execute query', tenantId, error);
    }
  }

  /**
   * Bulk create with tenant isolation
   */
  async bulkCreate(
    tenantId: string,
    data: TInsert[]
  ): Promise<ServiceResponse<TSelect[]>> {
    try {
      this.validateTenantId(tenantId);

      const insertData = this.options.autoInjectTenantId
        ? data.map(item => ({ ...item, tenantId }))
        : data;

      const results = await this.db
        .insert(this.table)
        .values(insertData as any)
        .returning();

      return {
        success: true,
        data: results as TSelect[],
        metadata: { created: results.length },
      };
    } catch (error) {
      console.error(`Error bulk creating ${this.table}:`, error);
      return this.handleError('BULK_CREATE_FAILED', 'Failed to bulk create records', tenantId, error);
    }
  }

  /**
   * Transaction support with tenant context
   */
  async transaction<TResult>(
    tenantId: string,
    transactionFn: (tx: typeof this.db, tenantId: string) => Promise<TResult>
  ): Promise<ServiceResponse<TResult>> {
    try {
      this.validateTenantId(tenantId);

      const result = await this.db.transaction(async (tx) => {
        return await transactionFn(tx, tenantId);
      });

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error(`Error in transaction:`, error);
      return this.handleError('TRANSACTION_FAILED', 'Transaction failed', tenantId, error);
    }
  }

  // ===== PROTECTED HELPER METHODS =====

  /**
   * Build tenant-aware where clause
   */
  protected buildTenantWhereClause(tenantId: string, additionalWhere?: any): any {
    const tenantCondition = eq(this.table.tenantId, tenantId);
    return additionalWhere ? and(tenantCondition, additionalWhere) : tenantCondition;
  }

  /**
   * Build order by clause from pagination params
   */
  protected buildOrderBy(pagination: PaginationParams): any {
    if (pagination.sortBy && pagination.sortBy in this.table) {
      const column = this.table[pagination.sortBy as keyof T];
      return pagination.sortOrder === 'asc' ? asc(column) : desc(column);
    }

    // Default to createdAt desc if available
    if ('createdAt' in this.table) {
      return desc(this.table.createdAt as any);
    }

    // Fallback to id desc
    return desc(this.table.id);
  }

  /**
   * Validate tenant ID format
   */
  protected validateTenantId(tenantId: string): void {
    if (!tenantId || typeof tenantId !== 'string') {
      throw new Error('Invalid tenant ID');
    }

    // Basic UUID format validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(tenantId)) {
      throw new Error('Tenant ID must be a valid UUID');
    }
  }

  /**
   * Handle repository errors consistently
   */
  protected handleError(
    code: string,
    message: string,
    tenantId: string,
    originalError: any
  ): ServiceResponse<any> {
    return {
      success: false,
      error: {
        code,
        message,
        tenantId,
        details: {
          originalError: originalError instanceof Error ? originalError.message : 'Unknown error',
        },
      },
    };
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}