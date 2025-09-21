/**
 * API Key Management Service
 * Handles API key generation, validation, revocation, and usage tracking
 */

import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import * as schema from '@shared/schema';
import type {
  ApiKey,
  CreateApiKeyRequest,
  ApiKeyResponse,
  TenantContext,
  ApiPermission,
  ServiceResponse,
  PaginationParams,
  PaginatedResponse,
  UsageMetricName,
} from '@shared/types/tenant';
import { tenantValidationSchemas } from '@shared/validation/tenant';

export interface ApiKeyUsage {
  keyId: string;
  tenantId: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

export interface ApiKeyStats {
  totalCalls: number;
  callsToday: number;
  callsThisMonth: number;
  averageResponseTime: number;
  errorRate: number;
  lastUsed?: Date;
  topEndpoints: Array<{
    endpoint: string;
    calls: number;
    percentage: number;
  }>;
}

export interface RateLimitConfig {
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  burstLimit: number;
}

export interface RateLimitStatus {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  retryAfter?: number;
}

export class ApiKeyService {
  private db: ReturnType<typeof drizzle>;
  private pool: Pool;
  private usageCache: Map<string, ApiKeyUsage[]> = new Map();
  private rateLimitCache: Map<string, { count: number; resetTime: Date }> = new Map();

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString });
    this.db = drizzle({ client: this.pool, schema });
    
    // Clean up cache periodically
    setInterval(() => this.cleanupCache(), 5 * 60 * 1000); // Every 5 minutes
  }

  // ===== API KEY CRUD OPERATIONS =====

  /**
   * Create new API key for tenant
   */
  async createApiKey(
    tenantId: string,
    data: CreateApiKeyRequest,
    createdBy: string
  ): Promise<ServiceResponse<ApiKeyResponse>> {
    try {
      const validatedData = tenantValidationSchemas.createApiKeyRequest.parse(data);

      // Validate tenant exists and is active
      const [tenant] = await this.db
        .select()
        .from(schema.tenants)
        .where(eq(schema.tenants.id, tenantId))
        .limit(1);

      if (!tenant) {
        return {
          success: false,
          error: {
            code: 'TENANT_NOT_FOUND',
            message: 'Tenant not found',
            tenantId,
          },
        };
      }

      if (tenant.status !== 'active' && tenant.status !== 'trial') {
        return {
          success: false,
          error: {
            code: 'TENANT_INACTIVE',
            message: 'Cannot create API key for inactive tenant',
            tenantId,
          },
        };
      }

      // Check API key limits based on subscription
      const keyCount = await this.getApiKeyCount(tenantId);
      const subscription = await this.getTenantSubscription(tenantId);
      const maxKeys = subscription?.limits?.webhookEndpoints || 5; // Default limit

      if (keyCount >= maxKeys) {
        return {
          success: false,
          error: {
            code: 'API_KEY_LIMIT_EXCEEDED',
            message: `Maximum number of API keys (${maxKeys}) reached for current subscription`,
            tenantId,
          },
        };
      }

      // Generate API key
      const apiKey = this.generateApiKey();
      const keyHash = await bcrypt.hash(apiKey, 12);

      // Create API key record
      const [createdApiKey] = await this.db
        .insert(schema.apiKeys)
        .values({
          tenantId,
          keyHash,
          name: validatedData.name,
          permissions: validatedData.permissions,
          expiresAt: validatedData.expiresAt,
          isActive: true,
        })
        .returning();

      // Log API key creation
      await this.logApiKeyEvent(tenantId, createdApiKey.id, 'created', createdBy);

      const response: ApiKeyResponse = {
        id: createdApiKey.id,
        name: createdApiKey.name,
        key: apiKey, // Only returned on creation
        permissions: createdApiKey.permissions as ApiPermission[],
        expiresAt: createdApiKey.expiresAt || undefined,
        createdAt: createdApiKey.createdAt,
      };

      return {
        success: true,
        data: response,
        metadata: { created: true },
      };
    } catch (error) {
      console.error('Error creating API key:', error);
      return {
        success: false,
        error: {
          code: 'API_KEY_CREATION_FAILED',
          message: 'Failed to create API key',
          tenantId,
        },
      };
    }
  }

  /**
   * List API keys for tenant
   */
  async listApiKeys(
    tenantId: string,
    pagination: PaginationParams
  ): Promise<ServiceResponse<PaginatedResponse<Omit<ApiKey, 'keyHash'>>>> {
    try {
      const validatedPagination = tenantValidationSchemas.paginationParams.parse(pagination);

      // Get total count
      const [{ count }] = await this.db
        .select({ count: sql<number>`count(*)` })
        .from(schema.apiKeys)
        .where(eq(schema.apiKeys.tenantId, tenantId));

      // Get paginated data
      const offset = (validatedPagination.page - 1) * validatedPagination.limit;
      const apiKeys = await this.db
        .select({
          id: schema.apiKeys.id,
          tenantId: schema.apiKeys.tenantId,
          name: schema.apiKeys.name,
          permissions: schema.apiKeys.permissions,
          lastUsed: schema.apiKeys.lastUsed,
          expiresAt: schema.apiKeys.expiresAt,
          isActive: schema.apiKeys.isActive,
          createdAt: schema.apiKeys.createdAt,
        })
        .from(schema.apiKeys)
        .where(eq(schema.apiKeys.tenantId, tenantId))
        .orderBy(desc(schema.apiKeys.createdAt))
        .limit(validatedPagination.limit)
        .offset(offset);

      const totalPages = Math.ceil(count / validatedPagination.limit);

      return {
        success: true,
        data: {
          data: apiKeys as Omit<ApiKey, 'keyHash'>[],
          pagination: {
            page: validatedPagination.page,
            limit: validatedPagination.limit,
            total: count,
            totalPages,
            hasNext: validatedPagination.page < totalPages,
            hasPrev: validatedPagination.page > 1,
          },
        },
      };
    } catch (error) {
      console.error('Error listing API keys:', error);
      return {
        success: false,
        error: {
          code: 'API_KEY_LIST_FAILED',
          message: 'Failed to list API keys',
          tenantId,
        },
      };
    }
  }

  /**
   * Get API key by ID
   */
  async getApiKey(
    tenantId: string,
    keyId: string
  ): Promise<ServiceResponse<Omit<ApiKey, 'keyHash'>>> {
    try {
      const [apiKey] = await this.db
        .select({
          id: schema.apiKeys.id,
          tenantId: schema.apiKeys.tenantId,
          name: schema.apiKeys.name,
          permissions: schema.apiKeys.permissions,
          lastUsed: schema.apiKeys.lastUsed,
          expiresAt: schema.apiKeys.expiresAt,
          isActive: schema.apiKeys.isActive,
          createdAt: schema.apiKeys.createdAt,
        })
        .from(schema.apiKeys)
        .where(
          and(
            eq(schema.apiKeys.tenantId, tenantId),
            eq(schema.apiKeys.id, keyId)
          )
        )
        .limit(1);

      if (!apiKey) {
        return {
          success: false,
          error: {
            code: 'API_KEY_NOT_FOUND',
            message: 'API key not found',
            tenantId,
          },
        };
      }

      return {
        success: true,
        data: apiKey as Omit<ApiKey, 'keyHash'>,
      };
    } catch (error) {
      console.error('Error getting API key:', error);
      return {
        success: false,
        error: {
          code: 'API_KEY_FETCH_FAILED',
          message: 'Failed to fetch API key',
          tenantId,
        },
      };
    }
  }

  /**
   * Update API key
   */
  async updateApiKey(
    tenantId: string,
    keyId: string,
    updates: {
      name?: string;
      permissions?: ApiPermission[];
      isActive?: boolean;
      expiresAt?: Date;
    },
    updatedBy: string
  ): Promise<ServiceResponse<Omit<ApiKey, 'keyHash'>>> {
    try {
      // Check if API key exists
      const existingKey = await this.getApiKey(tenantId, keyId);
      if (!existingKey.success) {
        return existingKey;
      }

      // Update API key
      const [updatedKey] = await this.db
        .update(schema.apiKeys)
        .set(updates)
        .where(
          and(
            eq(schema.apiKeys.tenantId, tenantId),
            eq(schema.apiKeys.id, keyId)
          )
        )
        .returning({
          id: schema.apiKeys.id,
          tenantId: schema.apiKeys.tenantId,
          name: schema.apiKeys.name,
          permissions: schema.apiKeys.permissions,
          lastUsed: schema.apiKeys.lastUsed,
          expiresAt: schema.apiKeys.expiresAt,
          isActive: schema.apiKeys.isActive,
          createdAt: schema.apiKeys.createdAt,
        });

      // Log API key update
      await this.logApiKeyEvent(tenantId, keyId, 'updated', updatedBy, updates);

      return {
        success: true,
        data: updatedKey as Omit<ApiKey, 'keyHash'>,
        metadata: { updated: true },
      };
    } catch (error) {
      console.error('Error updating API key:', error);
      return {
        success: false,
        error: {
          code: 'API_KEY_UPDATE_FAILED',
          message: 'Failed to update API key',
          tenantId,
        },
      };
    }
  }

  /**
   * Revoke API key
   */
  async revokeApiKey(
    tenantId: string,
    keyId: string,
    revokedBy: string,
    reason?: string
  ): Promise<ServiceResponse<void>> {
    try {
      const result = await this.updateApiKey(tenantId, keyId, { isActive: false }, revokedBy);
      
      if (!result.success) {
        return {
          success: false,
          error: result.error!,
        };
      }

      // Log API key revocation
      await this.logApiKeyEvent(tenantId, keyId, 'revoked', revokedBy, { reason });

      return {
        success: true,
        metadata: { revoked: true },
      };
    } catch (error) {
      console.error('Error revoking API key:', error);
      return {
        success: false,
        error: {
          code: 'API_KEY_REVOCATION_FAILED',
          message: 'Failed to revoke API key',
          tenantId,
        },
      };
    }
  }

  /**
   * Delete API key permanently
   */
  async deleteApiKey(
    tenantId: string,
    keyId: string,
    deletedBy: string
  ): Promise<ServiceResponse<void>> {
    try {
      // Check if API key exists
      const existingKey = await this.getApiKey(tenantId, keyId);
      if (!existingKey.success) {
        return {
          success: false,
          error: existingKey.error!,
        };
      }

      // Log API key deletion before deleting
      await this.logApiKeyEvent(tenantId, keyId, 'deleted', deletedBy);

      // Delete API key
      await this.db
        .delete(schema.apiKeys)
        .where(
          and(
            eq(schema.apiKeys.tenantId, tenantId),
            eq(schema.apiKeys.id, keyId)
          )
        );

      return {
        success: true,
        metadata: { deleted: true },
      };
    } catch (error) {
      console.error('Error deleting API key:', error);
      return {
        success: false,
        error: {
          code: 'API_KEY_DELETE_FAILED',
          message: 'Failed to delete API key',
          tenantId,
        },
      };
    }
  }

  // ===== API KEY VALIDATION =====

  /**
   * Validate API key and return tenant context
   */
  async validateApiKey(apiKey: string): Promise<ServiceResponse<TenantContext>> {
    try {
      // Get all active API keys
      const apiKeys = await this.db
        .select({
          apiKey: schema.apiKeys,
          tenant: schema.tenants,
        })
        .from(schema.apiKeys)
        .innerJoin(schema.tenants, eq(schema.apiKeys.tenantId, schema.tenants.id))
        .where(
          and(
            eq(schema.apiKeys.isActive, true),
            eq(schema.tenants.status, 'active')
          )
        );

      // Find matching API key by comparing hashes
      let matchedApiKey = null;
      for (const { apiKey: dbApiKey, tenant } of apiKeys) {
        const isMatch = await bcrypt.compare(apiKey, dbApiKey.keyHash);
        if (isMatch) {
          matchedApiKey = { apiKey: dbApiKey, tenant };
          break;
        }
      }

      if (!matchedApiKey) {
        return {
          success: false,
          error: {
            code: 'INVALID_API_KEY',
            message: 'Invalid or expired API key',
          },
        };
      }

      const { apiKey: dbApiKey, tenant } = matchedApiKey;

      // Check expiration
      if (dbApiKey.expiresAt && dbApiKey.expiresAt < new Date()) {
        return {
          success: false,
          error: {
            code: 'API_KEY_EXPIRED',
            message: 'API key has expired',
            tenantId: tenant.id,
          },
        };
      }

      // Update last used timestamp
      await this.db
        .update(schema.apiKeys)
        .set({ lastUsed: new Date() })
        .where(eq(schema.apiKeys.id, dbApiKey.id));

      // Get subscription limits
      const subscription = await this.getTenantSubscription(tenant.id);
      const subscriptionLimits = subscription?.limits || {
        messagesPerMonth: 1000,
        bookingsPerMonth: 100,
        apiCallsPerDay: 1000,
      };

      // Get current usage (simplified)
      const currentUsage = {
        messages_sent: 0,
        messages_received: 0,
        bookings_created: 0,
        api_calls: 0,
        storage_used: 0,
        webhook_calls: 0,
      };

      const tenantContext: TenantContext = {
        tenantId: tenant.id,
        permissions: dbApiKey.permissions as ApiPermission[],
        subscriptionLimits,
        currentUsage,
      };

      return {
        success: true,
        data: tenantContext,
      };
    } catch (error) {
      console.error('Error validating API key:', error);
      return {
        success: false,
        error: {
          code: 'API_KEY_VALIDATION_FAILED',
          message: 'Failed to validate API key',
        },
      };
    }
  }

  // ===== RATE LIMITING =====

  /**
   * Check rate limit for API key
   */
  async checkRateLimit(
    apiKeyId: string,
    tenantId: string,
    endpoint: string
  ): Promise<RateLimitStatus> {
    try {
      const subscription = await this.getTenantSubscription(tenantId);
      const rateLimitConfig = this.getRateLimitConfig(subscription);

      const now = new Date();
      const cacheKey = `${apiKeyId}:${endpoint}`;
      
      // Get current rate limit status from cache
      let rateLimitData = this.rateLimitCache.get(cacheKey);
      
      if (!rateLimitData || rateLimitData.resetTime <= now) {
        // Reset rate limit window
        rateLimitData = {
          count: 0,
          resetTime: new Date(now.getTime() + 60 * 1000), // 1 minute window
        };
      }

      // Check if limit exceeded
      if (rateLimitData.count >= rateLimitConfig.requestsPerMinute) {
        return {
          allowed: false,
          remaining: 0,
          resetTime: rateLimitData.resetTime,
          retryAfter: Math.ceil((rateLimitData.resetTime.getTime() - now.getTime()) / 1000),
        };
      }

      // Increment counter
      rateLimitData.count++;
      this.rateLimitCache.set(cacheKey, rateLimitData);

      return {
        allowed: true,
        remaining: rateLimitConfig.requestsPerMinute - rateLimitData.count,
        resetTime: rateLimitData.resetTime,
      };
    } catch (error) {
      console.error('Error checking rate limit:', error);
      // Allow request on error to avoid blocking legitimate traffic
      return {
        allowed: true,
        remaining: 100,
        resetTime: new Date(Date.now() + 60 * 1000),
      };
    }
  }

  // ===== USAGE TRACKING =====

  /**
   * Track API key usage
   */
  async trackUsage(usage: ApiKeyUsage): Promise<void> {
    try {
      // Add to cache for immediate processing
      const cacheKey = usage.keyId;
      const existingUsage = this.usageCache.get(cacheKey) || [];
      existingUsage.push(usage);
      this.usageCache.set(cacheKey, existingUsage);

      // Batch insert usage data periodically (simplified for demo)
      if (existingUsage.length >= 10) {
        await this.flushUsageData(cacheKey);
      }
    } catch (error) {
      console.error('Error tracking API usage:', error);
    }
  }

  /**
   * Get API key usage statistics
   */
  async getApiKeyStats(
    tenantId: string,
    keyId: string,
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<ServiceResponse<ApiKeyStats>> {
    try {
      // In a real implementation, would query usage_metrics table
      // For now, return mock data
      const stats: ApiKeyStats = {
        totalCalls: 1250,
        callsToday: 45,
        callsThisMonth: 890,
        averageResponseTime: 125,
        errorRate: 2.1,
        lastUsed: new Date(),
        topEndpoints: [
          { endpoint: '/api/services', calls: 450, percentage: 36 },
          { endpoint: '/api/bookings', calls: 320, percentage: 25.6 },
          { endpoint: '/api/conversations', calls: 280, percentage: 22.4 },
          { endpoint: '/api/analytics', calls: 200, percentage: 16 },
        ],
      };

      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      console.error('Error getting API key stats:', error);
      return {
        success: false,
        error: {
          code: 'STATS_FETCH_FAILED',
          message: 'Failed to fetch API key statistics',
          tenantId,
        },
      };
    }
  }

  // ===== PRIVATE HELPER METHODS =====

  /**
   * Generate secure API key
   */
  private generateApiKey(): string {
    const randomBytes = crypto.randomBytes(32);
    return `tk_${randomBytes.toString('hex')}`;
  }

  /**
   * Get API key count for tenant
   */
  private async getApiKeyCount(tenantId: string): Promise<number> {
    const [{ count }] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.apiKeys)
      .where(
        and(
          eq(schema.apiKeys.tenantId, tenantId),
          eq(schema.apiKeys.isActive, true)
        )
      );

    return count;
  }

  /**
   * Get tenant subscription
   */
  private async getTenantSubscription(tenantId: string): Promise<any> {
    const [subscription] = await this.db
      .select({
        subscription: schema.subscriptions,
        plan: schema.subscriptionPlans,
      })
      .from(schema.subscriptions)
      .innerJoin(schema.subscriptionPlans, eq(schema.subscriptions.planId, schema.subscriptionPlans.id))
      .where(eq(schema.subscriptions.tenantId, tenantId))
      .limit(1);

    return subscription;
  }

  /**
   * Get rate limit configuration based on subscription
   */
  private getRateLimitConfig(subscription: any): RateLimitConfig {
    const planId = subscription?.plan?.id || 'starter';
    
    switch (planId) {
      case 'enterprise':
        return {
          requestsPerMinute: 1000,
          requestsPerHour: 50000,
          requestsPerDay: 1000000,
          burstLimit: 2000,
        };
      case 'professional':
        return {
          requestsPerMinute: 300,
          requestsPerHour: 15000,
          requestsPerDay: 300000,
          burstLimit: 600,
        };
      default: // starter
        return {
          requestsPerMinute: 60,
          requestsPerHour: 3000,
          requestsPerDay: 50000,
          burstLimit: 120,
        };
    }
  }

  /**
   * Log API key events
   */
  private async logApiKeyEvent(
    tenantId: string,
    keyId: string,
    action: string,
    performedBy: string,
    details?: any
  ): Promise<void> {
    try {
      // In a real implementation, would insert into audit log table
      console.log(`API Key Event: ${action} - Key: ${keyId}, Tenant: ${tenantId}, By: ${performedBy}`, details);
    } catch (error) {
      console.error('Error logging API key event:', error);
    }
  }

  /**
   * Flush usage data to database
   */
  private async flushUsageData(keyId: string): Promise<void> {
    try {
      const usageData = this.usageCache.get(keyId);
      if (!usageData || usageData.length === 0) return;

      // In a real implementation, would batch insert to usage_metrics table
      console.log(`Flushing ${usageData.length} usage records for key ${keyId}`);

      // Clear cache
      this.usageCache.delete(keyId);
    } catch (error) {
      console.error('Error flushing usage data:', error);
    }
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupCache(): void {
    const now = new Date();
    
    // Clean up rate limit cache
    for (const [key, data] of this.rateLimitCache.entries()) {
      if (data.resetTime <= now) {
        this.rateLimitCache.delete(key);
      }
    }

    // Clean up usage cache (flush old data)
    for (const [key, usageData] of this.usageCache.entries()) {
      if (usageData.length > 0) {
        this.flushUsageData(key);
      }
    }
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}