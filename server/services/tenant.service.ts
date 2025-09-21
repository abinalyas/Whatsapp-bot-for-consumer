/**
 * TenantService - Core tenant management service with CRUD operations
 * Provides complete tenant lifecycle management with database integration
 */

import { eq, and, desc, asc, like, inArray, gte, lte, ne, or, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import * as schema from '@shared/schema';
import type {
  Tenant,
  CreateTenantRequest,
  UpdateTenantRequest,
  User,
  CreateUserRequest,
  UpdateUserRequest,
  UserProfile,
  ApiKey,
  CreateApiKeyRequest,
  ApiKeyResponse,
  TenantContext,
  ServiceResponse,
  PaginatedResponse,
  PaginationParams,
  FilterParams,
  TenantError,
  BulkOperationResult,
} from '@shared/types/tenant';
import {
  tenantValidationSchemas,
  validatePasswordStrength,
  validateDomainUniqueness,
  validateEmailUniqueness,
} from '@shared/validation/tenant';

export class TenantService {
  private db: ReturnType<typeof drizzle>;
  private pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString });
    this.db = drizzle({ client: this.pool, schema });
  }

  // ===== TENANT CRUD OPERATIONS =====

  /**
   * Create a new tenant with admin user
   */
  async createTenant(data: CreateTenantRequest): Promise<ServiceResponse<Tenant>> {
    try {
      // Validate input data
      const validatedData = tenantValidationSchemas.createTenantRequest.parse(data);

      // Check domain uniqueness
      const existingTenant = await this.db
        .select({ id: schema.tenants.id })
        .from(schema.tenants)
        .where(eq(schema.tenants.domain, validatedData.domain))
        .limit(1);

      if (existingTenant.length > 0) {
        return {
          success: false,
          error: {
            code: 'DOMAIN_ALREADY_EXISTS',
            message: 'Domain is already registered',
            details: { domain: validatedData.domain },
          },
        };
      }

      // Hash admin user password
      const passwordHash = await bcrypt.hash(validatedData.adminUser.password, 12);

      // Start transaction
      const result = await this.db.transaction(async (tx) => {
        // Create tenant
        const [tenant] = await tx
          .insert(schema.tenants)
          .values({
            businessName: validatedData.businessName,
            domain: validatedData.domain,
            email: validatedData.email,
            phone: validatedData.phone,
            subscriptionPlan: validatedData.subscriptionPlan || 'starter',
            status: 'trial',
            botSettings: this.getDefaultBotSettings(),
            billingSettings: this.getDefaultBillingSettings(validatedData),
          })
          .returning();

        // Create admin user
        await tx.insert(schema.users).values({
          tenantId: tenant.id,
          email: validatedData.adminUser.email,
          passwordHash,
          role: validatedData.adminUser.role || 'admin',
          firstName: validatedData.adminUser.firstName,
          lastName: validatedData.adminUser.lastName,
          isActive: true,
        });

        // Create default subscription
        const currentDate = new Date();
        const trialEndDate = new Date(currentDate.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days trial

        await tx.insert(schema.subscriptions).values({
          tenantId: tenant.id,
          planId: validatedData.subscriptionPlan || 'starter',
          status: 'trialing',
          billingCycle: 'monthly',
          currentPeriodStart: currentDate,
          currentPeriodEnd: trialEndDate,
        });

        return tenant;
      });

      return {
        success: true,
        data: result as Tenant,
        metadata: { created: true },
      };
    } catch (error) {
      console.error('Error creating tenant:', error);
      return {
        success: false,
        error: {
          code: 'TENANT_CREATION_FAILED',
          message: 'Failed to create tenant',
          details: { originalError: error instanceof Error ? error.message : 'Unknown error' },
        },
      };
    }
  }

  /**
   * Get tenant by ID
   */
  async getTenantById(tenantId: string): Promise<ServiceResponse<Tenant>> {
    try {
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

      return {
        success: true,
        data: tenant as Tenant,
      };
    } catch (error) {
      console.error('Error getting tenant:', error);
      return {
        success: false,
        error: {
          code: 'TENANT_FETCH_FAILED',
          message: 'Failed to fetch tenant',
          tenantId,
        },
      };
    }
  }

  /**
   * Get tenant by domain
   */
  async getTenantByDomain(domain: string): Promise<ServiceResponse<Tenant>> {
    try {
      validateDomainUniqueness(domain);

      const [tenant] = await this.db
        .select()
        .from(schema.tenants)
        .where(eq(schema.tenants.domain, domain))
        .limit(1);

      if (!tenant) {
        return {
          success: false,
          error: {
            code: 'TENANT_NOT_FOUND',
            message: 'Tenant not found for domain',
            details: { domain },
          },
        };
      }

      return {
        success: true,
        data: tenant as Tenant,
      };
    } catch (error) {
      console.error('Error getting tenant by domain:', error);
      return {
        success: false,
        error: {
          code: 'TENANT_FETCH_FAILED',
          message: 'Failed to fetch tenant by domain',
          details: { domain },
        },
      };
    }
  }

  /**
   * Update tenant
   */
  async updateTenant(
    tenantId: string,
    data: UpdateTenantRequest
  ): Promise<ServiceResponse<Tenant>> {
    try {
      const validatedData = tenantValidationSchemas.updateTenantRequest.parse(data);

      // Check if tenant exists
      const existingTenant = await this.getTenantById(tenantId);
      if (!existingTenant.success) {
        return existingTenant;
      }

      // Check domain uniqueness if domain is being updated
      if (validatedData.domain && validatedData.domain !== existingTenant.data!.domain) {
        const domainExists = await this.db
          .select({ id: schema.tenants.id })
          .from(schema.tenants)
          .where(
            and(
              eq(schema.tenants.domain, validatedData.domain),
              eq(schema.tenants.id, tenantId)
            )
          )
          .limit(1);

        if (domainExists.length > 0) {
          return {
            success: false,
            error: {
              code: 'DOMAIN_ALREADY_EXISTS',
              message: 'Domain is already registered',
              tenantId,
              details: { domain: validatedData.domain },
            },
          };
        }
      }

      const [updatedTenant] = await this.db
        .update(schema.tenants)
        .set({
          ...validatedData,
          updatedAt: new Date(),
        })
        .where(eq(schema.tenants.id, tenantId))
        .returning();

      return {
        success: true,
        data: updatedTenant as Tenant,
        metadata: { updated: true },
      };
    } catch (error) {
      console.error('Error updating tenant:', error);
      return {
        success: false,
        error: {
          code: 'TENANT_UPDATE_FAILED',
          message: 'Failed to update tenant',
          tenantId,
        },
      };
    }
  }

  /**
   * Delete tenant (soft delete by setting status to cancelled)
   */
  async deleteTenant(tenantId: string): Promise<ServiceResponse<void>> {
    try {
      const existingTenant = await this.getTenantById(tenantId);
      if (!existingTenant.success) {
        return {
          success: false,
          error: existingTenant.error!,
        };
      }

      await this.db
        .update(schema.tenants)
        .set({
          status: 'cancelled',
          updatedAt: new Date(),
        })
        .where(eq(schema.tenants.id, tenantId));

      return {
        success: true,
        metadata: { deleted: true },
      };
    } catch (error) {
      console.error('Error deleting tenant:', error);
      return {
        success: false,
        error: {
          code: 'TENANT_DELETE_FAILED',
          message: 'Failed to delete tenant',
          tenantId,
        },
      };
    }
  }

  /**
   * List tenants with pagination and filtering
   */
  async listTenants(
    pagination: PaginationParams,
    filters?: FilterParams
  ): Promise<ServiceResponse<PaginatedResponse<Tenant>>> {
    try {
      const validatedPagination = tenantValidationSchemas.paginationParams.parse(pagination);
      const validatedFilters = filters
        ? tenantValidationSchemas.filterParams.parse(filters)
        : {};

      // Build where conditions
      const whereConditions = [];

      if (validatedFilters.status && validatedFilters.status.length > 0) {
        whereConditions.push(inArray(schema.tenants.status, validatedFilters.status));
      }

      if (validatedFilters.search) {
        whereConditions.push(
          like(schema.tenants.businessName, `%${validatedFilters.search}%`)
        );
      }

      if (validatedFilters.dateFrom) {
        whereConditions.push(gte(schema.tenants.createdAt, validatedFilters.dateFrom));
      }

      if (validatedFilters.dateTo) {
        whereConditions.push(lte(schema.tenants.createdAt, validatedFilters.dateTo));
      }

      const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

      // Get total count
      const [{ count }] = await this.db
        .select({ count: sql<number>`count(*)` })
        .from(schema.tenants)
        .where(whereClause);

      // Get paginated data
      const offset = (validatedPagination.page - 1) * validatedPagination.limit;
      const orderBy = validatedPagination.sortBy
        ? validatedPagination.sortOrder === 'asc'
          ? asc(schema.tenants[validatedPagination.sortBy as keyof typeof schema.tenants])
          : desc(schema.tenants[validatedPagination.sortBy as keyof typeof schema.tenants])
        : desc(schema.tenants.createdAt);

      const tenants = await this.db
        .select()
        .from(schema.tenants)
        .where(whereClause)
        .orderBy(orderBy)
        .limit(validatedPagination.limit)
        .offset(offset);

      const totalPages = Math.ceil(count / validatedPagination.limit);

      return {
        success: true,
        data: {
          data: tenants as Tenant[],
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
      console.error('Error listing tenants:', error);
      return {
        success: false,
        error: {
          code: 'TENANT_LIST_FAILED',
          message: 'Failed to list tenants',
        },
      };
    }
  }

  // ===== USER MANAGEMENT OPERATIONS =====

  /**
   * Create user for tenant
   */
  async createUser(
    tenantId: string,
    data: CreateUserRequest
  ): Promise<ServiceResponse<UserProfile>> {
    try {
      const validatedData = tenantValidationSchemas.createUserRequest.parse(data);

      // Validate tenant exists
      const tenantResult = await this.getTenantById(tenantId);
      if (!tenantResult.success) {
        return {
          success: false,
          error: tenantResult.error!,
        };
      }

      // Check email uniqueness within tenant
      const existingUser = await this.db
        .select({ id: schema.users.id })
        .from(schema.users)
        .where(
          and(
            eq(schema.users.tenantId, tenantId),
            eq(schema.users.email, validatedData.email)
          )
        )
        .limit(1);

      if (existingUser.length > 0) {
        return {
          success: false,
          error: {
            code: 'EMAIL_ALREADY_EXISTS',
            message: 'Email is already registered for this tenant',
            tenantId,
            details: { email: validatedData.email },
          },
        };
      }

      // Hash password
      const passwordHash = await bcrypt.hash(validatedData.password, 12);

      const [user] = await this.db
        .insert(schema.users)
        .values({
          tenantId,
          email: validatedData.email,
          passwordHash,
          role: validatedData.role || 'user',
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          isActive: true,
        })
        .returning();

      // Return user profile with tenant info
      const userProfile: UserProfile = {
        id: user.id,
        email: user.email,
        role: user.role as any,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        tenant: {
          id: tenantResult.data!.id,
          businessName: tenantResult.data!.businessName,
          domain: tenantResult.data!.domain,
        },
      };

      return {
        success: true,
        data: userProfile,
        metadata: { created: true },
      };
    } catch (error) {
      console.error('Error creating user:', error);
      return {
        success: false,
        error: {
          code: 'USER_CREATION_FAILED',
          message: 'Failed to create user',
          tenantId,
        },
      };
    }
  }

  /**
   * Get user by ID within tenant
   */
  async getUserById(tenantId: string, userId: string): Promise<ServiceResponse<UserProfile>> {
    try {
      const result = await this.db
        .select({
          user: schema.users,
          tenant: {
            id: schema.tenants.id,
            businessName: schema.tenants.businessName,
            domain: schema.tenants.domain,
          },
        })
        .from(schema.users)
        .innerJoin(schema.tenants, eq(schema.users.tenantId, schema.tenants.id))
        .where(
          and(eq(schema.users.tenantId, tenantId), eq(schema.users.id, userId))
        )
        .limit(1);

      if (result.length === 0) {
        return {
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
            tenantId,
            details: { userId },
          },
        };
      }

      const { user, tenant } = result[0];
      const userProfile: UserProfile = {
        id: user.id,
        email: user.email,
        role: user.role as any,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        tenant,
      };

      return {
        success: true,
        data: userProfile,
      };
    } catch (error) {
      console.error('Error getting user:', error);
      return {
        success: false,
        error: {
          code: 'USER_FETCH_FAILED',
          message: 'Failed to fetch user',
          tenantId,
        },
      };
    }
  }

  /**
   * Update user within tenant
   */
  async updateUser(
    tenantId: string,
    userId: string,
    data: UpdateUserRequest
  ): Promise<ServiceResponse<UserProfile>> {
    try {
      const validatedData = tenantValidationSchemas.updateUserRequest.parse(data);

      // Check if user exists
      const existingUser = await this.getUserById(tenantId, userId);
      if (!existingUser.success) {
        return existingUser;
      }

      // Check email uniqueness if email is being updated
      if (validatedData.email && validatedData.email !== existingUser.data!.email) {
        const emailExists = await this.db
          .select({ id: schema.users.id })
          .from(schema.users)
          .where(
            and(
              eq(schema.users.tenantId, tenantId),
              eq(schema.users.email, validatedData.email),
              ne(schema.users.id, userId)
            )
          )
          .limit(1);

        if (emailExists.length > 0) {
          return {
            success: false,
            error: {
              code: 'EMAIL_ALREADY_EXISTS',
              message: 'Email is already registered for this tenant',
              tenantId,
              details: { email: validatedData.email },
            },
          };
        }
      }

      await this.db
        .update(schema.users)
        .set({
          ...validatedData,
          updatedAt: new Date(),
        })
        .where(and(eq(schema.users.tenantId, tenantId), eq(schema.users.id, userId)));

      // Return updated user profile
      return await this.getUserById(tenantId, userId);
    } catch (error) {
      console.error('Error updating user:', error);
      return {
        success: false,
        error: {
          code: 'USER_UPDATE_FAILED',
          message: 'Failed to update user',
          tenantId,
        },
      };
    }
  }

  /**
   * List users for tenant
   */
  async listUsers(
    tenantId: string,
    pagination: PaginationParams,
    filters?: FilterParams
  ): Promise<ServiceResponse<PaginatedResponse<UserProfile>>> {
    try {
      const validatedPagination = tenantValidationSchemas.paginationParams.parse(pagination);
      const validatedFilters = filters
        ? tenantValidationSchemas.filterParams.parse(filters)
        : {};

      // Build where conditions
      const whereConditions = [eq(schema.users.tenantId, tenantId)];

      if (validatedFilters.status && validatedFilters.status.length > 0) {
        // Map status to isActive boolean
        const isActiveValues = validatedFilters.status.map(status => status === 'active');
        whereConditions.push(inArray(schema.users.isActive, isActiveValues));
      }

      if (validatedFilters.search) {
        whereConditions.push(
          or(
            like(schema.users.email, `%${validatedFilters.search}%`),
            like(schema.users.firstName, `%${validatedFilters.search}%`),
            like(schema.users.lastName, `%${validatedFilters.search}%`)
          )
        );
      }

      const whereClause = and(...whereConditions);

      // Get total count
      const [{ count }] = await this.db
        .select({ count: sql<number>`count(*)` })
        .from(schema.users)
        .where(whereClause);

      // Get paginated data with tenant info
      const offset = (validatedPagination.page - 1) * validatedPagination.limit;
      const orderBy = validatedPagination.sortBy
        ? validatedPagination.sortOrder === 'asc'
          ? asc(schema.users[validatedPagination.sortBy as keyof typeof schema.users])
          : desc(schema.users[validatedPagination.sortBy as keyof typeof schema.users])
        : desc(schema.users.createdAt);

      const results = await this.db
        .select({
          user: schema.users,
          tenant: {
            id: schema.tenants.id,
            businessName: schema.tenants.businessName,
            domain: schema.tenants.domain,
          },
        })
        .from(schema.users)
        .innerJoin(schema.tenants, eq(schema.users.tenantId, schema.tenants.id))
        .where(whereClause)
        .orderBy(orderBy)
        .limit(validatedPagination.limit)
        .offset(offset);

      const users: UserProfile[] = results.map(({ user, tenant }) => ({
        id: user.id,
        email: user.email,
        role: user.role as any,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        tenant,
      }));

      const totalPages = Math.ceil(count / validatedPagination.limit);

      return {
        success: true,
        data: {
          data: users,
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
      console.error('Error listing users:', error);
      return {
        success: false,
        error: {
          code: 'USER_LIST_FAILED',
          message: 'Failed to list users',
          tenantId,
        },
      };
    }
  }

  // ===== API KEY MANAGEMENT =====

  /**
   * Create API key for tenant
   */
  async createApiKey(
    tenantId: string,
    data: CreateApiKeyRequest
  ): Promise<ServiceResponse<ApiKeyResponse>> {
    try {
      const validatedData = tenantValidationSchemas.createApiKeyRequest.parse(data);

      // Validate tenant exists
      const tenantResult = await this.getTenantById(tenantId);
      if (!tenantResult.success) {
        return {
          success: false,
          error: tenantResult.error!,
        };
      }

      // Generate API key
      const apiKey = this.generateApiKey();
      const keyHash = await bcrypt.hash(apiKey, 12);

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

      const response: ApiKeyResponse = {
        id: createdApiKey.id,
        name: createdApiKey.name,
        key: apiKey, // Only returned on creation
        permissions: createdApiKey.permissions as any,
        expiresAt: createdApiKey.expiresAt,
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
      const [subscription] = await this.db
        .select({
          subscription: schema.subscriptions,
          plan: schema.subscriptionPlans,
        })
        .from(schema.subscriptions)
        .innerJoin(schema.subscriptionPlans, eq(schema.subscriptions.planId, schema.subscriptionPlans.id))
        .where(eq(schema.subscriptions.tenantId, tenant.id))
        .limit(1);

      const tenantContext: TenantContext = {
        tenantId: tenant.id,
        permissions: dbApiKey.permissions as any,
        subscriptionLimits: subscription?.plan.limits as any || {
          messagesPerMonth: 1000,
          bookingsPerMonth: 100,
          apiCallsPerDay: 1000,
        },
        currentUsage: {
          messages_sent: 0,
          messages_received: 0,
          bookings_created: 0,
          api_calls: 0,
          storage_used: 0,
          webhook_calls: 0,
        },
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

  // ===== UTILITY METHODS =====

  /**
   * Generate secure API key
   */
  private generateApiKey(): string {
    const randomBytes = crypto.randomBytes(32);
    return `tk_${randomBytes.toString('hex')}`;
  }

  /**
   * Get default bot settings for new tenant
   */
  private getDefaultBotSettings(): any {
    return {
      greetingMessage: 'Welcome! How can I help you today?',
      businessHours: {
        enabled: false,
        timezone: 'UTC',
        schedule: {
          monday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
          tuesday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
          wednesday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
          thursday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
          friday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
          saturday: { isOpen: false, openTime: '09:00', closeTime: '17:00' },
          sunday: { isOpen: false, openTime: '09:00', closeTime: '17:00' },
        },
        closedMessage: 'We are currently closed. Please try again during business hours.',
      },
      autoResponses: {
        welcomeMessage: 'Hello! How can I help you today?',
        serviceSelectionPrompt: 'Please select a service:',
        dateSelectionPrompt: 'Please select a date:',
        timeSelectionPrompt: 'Please select a time:',
        confirmationMessage: 'Please confirm your booking:',
        paymentInstructions: 'Payment instructions will be sent shortly.',
        bookingConfirmedMessage: 'Your booking has been confirmed!',
        errorMessage: 'Sorry, something went wrong. Please try again.',
        invalidInputMessage: 'Invalid input. Please try again.',
      },
      conversationFlow: {
        steps: [
          {
            id: 'greeting',
            name: 'Greeting',
            type: 'greeting',
            prompt: 'Welcome! How can I help you?',
            nextStep: 'service_selection',
          },
          {
            id: 'service_selection',
            name: 'Service Selection',
            type: 'service_selection',
            prompt: 'Please select a service:',
            nextStep: 'date_selection',
          },
          {
            id: 'date_selection',
            name: 'Date Selection',
            type: 'date_selection',
            prompt: 'Please select a date:',
            nextStep: 'time_selection',
          },
          {
            id: 'time_selection',
            name: 'Time Selection',
            type: 'time_selection',
            prompt: 'Please select a time:',
            nextStep: 'confirmation',
          },
          {
            id: 'confirmation',
            name: 'Confirmation',
            type: 'confirmation',
            prompt: 'Your booking has been confirmed!',
          },
        ],
        fallbackBehavior: 'restart',
        maxRetries: 3,
        sessionTimeout: 30,
      },
      paymentSettings: {
        enabled: false,
        methods: [],
        currency: 'USD',
        requirePayment: false,
      },
      notificationSettings: {
        emailNotifications: {
          enabled: false,
          recipientEmails: [],
          events: [],
        },
        smsNotifications: {
          enabled: false,
          recipientPhones: [],
          events: [],
        },
        webhookNotifications: {
          enabled: false,
          endpoints: [],
          events: [],
        },
      },
      customization: {
        brandColors: {
          primary: '#007bff',
          secondary: '#6c757d',
          accent: '#28a745',
          background: '#ffffff',
          text: '#212529',
        },
        companyInfo: {
          name: '',
        },
        customFields: [],
      },
    };
  }

  /**
   * Get default billing settings for new tenant
   */
  private getDefaultBillingSettings(data: CreateTenantRequest): any {
    return {
      companyName: data.businessName,
      billingEmail: data.email,
      billingAddress: {
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'US',
      },
      invoiceSettings: {
        autoSend: true,
        dueNetDays: 30,
        includeUsageDetails: true,
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