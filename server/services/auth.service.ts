/**
 * Authentication Service
 * Handles JWT-based authentication with tenant context and MFA support
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import speakeasy from 'speakeasy';
import crypto from 'crypto';
import { eq, and } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import * as schema from '@shared/schema';
import type {
  LoginCredentials,
  AuthResult,
  AuthTokens,
  UserProfile,
  TenantContext,
  MfaSetupRequest,
  MfaVerificationRequest,
  MfaMethod,
  ServiceResponse,
  ApiPermission,
} from '@shared/types/tenant';
import {
  tenantValidationSchemas,
  validatePasswordStrength,
} from '@shared/validation/tenant';

export interface JwtPayload {
  userId: string;
  tenantId: string;
  email: string;
  role: string;
  permissions: ApiPermission[];
  sessionId: string;
  iat: number;
  exp: number;
}

export interface MfaSession {
  userId: string;
  tenantId: string;
  method: MfaMethod;
  secret?: string;
  phoneNumber?: string;
  expiresAt: Date;
  verified: boolean;
}

export interface RefreshTokenData {
  userId: string;
  tenantId: string;
  sessionId: string;
  expiresAt: Date;
}

export class AuthService {
  private db: ReturnType<typeof drizzle>;
  private pool: Pool;
  private jwtSecret: string;
  private jwtRefreshSecret: string;
  private mfaSessions: Map<string, MfaSession> = new Map();
  private refreshTokens: Map<string, RefreshTokenData> = new Map();

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString });
    this.db = drizzle({ client: this.pool, schema });
    this.jwtSecret = process.env.JWT_SECRET || this.generateSecret();
    this.jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || this.generateSecret();
  }

  // ===== AUTHENTICATION METHODS =====

  /**
   * Authenticate user with email and password
   */
  async authenticateUser(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      const validatedCredentials = tenantValidationSchemas.loginCredentials.parse(credentials);

      // Find user by email and tenant domain (if provided)
      let user;
      let tenant;

      if (validatedCredentials.tenantDomain) {
        // Find tenant by domain first
        const [tenantResult] = await this.db
          .select()
          .from(schema.tenants)
          .where(eq(schema.tenants.domain, validatedCredentials.tenantDomain))
          .limit(1);

        if (!tenantResult) {
          return {
            success: false,
            error: 'Invalid tenant domain',
          };
        }

        tenant = tenantResult;

        // Find user within that tenant
        const [userResult] = await this.db
          .select()
          .from(schema.users)
          .where(
            and(
              eq(schema.users.tenantId, tenant.id),
              eq(schema.users.email, validatedCredentials.email)
            )
          )
          .limit(1);

        user = userResult;
      } else {
        // Find user by email across all tenants (for admin access)
        const results = await this.db
          .select({
            user: schema.users,
            tenant: schema.tenants,
          })
          .from(schema.users)
          .innerJoin(schema.tenants, eq(schema.users.tenantId, schema.tenants.id))
          .where(eq(schema.users.email, validatedCredentials.email))
          .limit(1);

        if (results.length > 0) {
          user = results[0].user;
          tenant = results[0].tenant;
        }
      }

      if (!user || !tenant) {
        return {
          success: false,
          error: 'Invalid email or password',
        };
      }

      // Check if user is active
      if (!user.isActive) {
        return {
          success: false,
          error: 'Account is disabled',
        };
      }

      // Check if tenant is active
      if (tenant.status === 'suspended') {
        return {
          success: false,
          error: 'Account is suspended',
        };
      }

      if (tenant.status === 'cancelled') {
        return {
          success: false,
          error: 'Account is cancelled',
        };
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(validatedCredentials.password, user.passwordHash);
      if (!isPasswordValid) {
        return {
          success: false,
          error: 'Invalid email or password',
        };
      }

      // Check if MFA is enabled for user (simplified - in real implementation would check user preferences)
      const requiresMfa = this.shouldRequireMfa(user, tenant);

      if (requiresMfa) {
        // Generate MFA session
        const mfaToken = this.generateMfaToken();
        const mfaSession: MfaSession = {
          userId: user.id,
          tenantId: tenant.id,
          method: 'totp', // Default to TOTP
          expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
          verified: false,
        };

        this.mfaSessions.set(mfaToken, mfaSession);

        return {
          success: true,
          requiresMfa: true,
          mfaToken,
        };
      }

      // Update last login
      await this.db
        .update(schema.users)
        .set({ lastLogin: new Date() })
        .where(eq(schema.users.id, user.id));

      // Generate tokens
      const sessionId = this.generateSessionId();
      const tokens = await this.generateTokens(user, tenant, sessionId);

      // Create user profile
      const userProfile: UserProfile = {
        id: user.id,
        email: user.email,
        role: user.role as any,
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
        isActive: user.isActive,
        lastLogin: new Date(),
        tenant: {
          id: tenant.id,
          businessName: tenant.businessName,
          domain: tenant.domain,
        },
      };

      return {
        success: true,
        user: userProfile,
        tokens,
      };
    } catch (error) {
      console.error('Authentication error:', error);
      return {
        success: false,
        error: 'Authentication failed',
      };
    }
  }

  /**
   * Verify MFA code and complete authentication
   */
  async verifyMfa(request: MfaVerificationRequest): Promise<AuthResult> {
    try {
      const validatedRequest = tenantValidationSchemas.mfaVerificationRequest.parse(request);

      const mfaSession = this.mfaSessions.get(validatedRequest.token);
      if (!mfaSession) {
        return {
          success: false,
          error: 'Invalid or expired MFA token',
        };
      }

      if (mfaSession.expiresAt < new Date()) {
        this.mfaSessions.delete(validatedRequest.token);
        return {
          success: false,
          error: 'MFA token expired',
        };
      }

      // Verify MFA code based on method
      let isCodeValid = false;
      switch (mfaSession.method) {
        case 'totp':
          isCodeValid = this.verifyTotpCode(validatedRequest.code, mfaSession.secret!);
          break;
        case 'sms':
          // In real implementation, would verify SMS code
          isCodeValid = validatedRequest.code === '123456'; // Simplified for demo
          break;
        case 'email':
          // In real implementation, would verify email code
          isCodeValid = validatedRequest.code === '123456'; // Simplified for demo
          break;
      }

      if (!isCodeValid) {
        return {
          success: false,
          error: 'Invalid MFA code',
        };
      }

      // Get user and tenant
      const [user] = await this.db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, mfaSession.userId))
        .limit(1);

      const [tenant] = await this.db
        .select()
        .from(schema.tenants)
        .where(eq(schema.tenants.id, mfaSession.tenantId))
        .limit(1);

      if (!user || !tenant) {
        return {
          success: false,
          error: 'User or tenant not found',
        };
      }

      // Clean up MFA session
      this.mfaSessions.delete(validatedRequest.token);

      // Update last login
      await this.db
        .update(schema.users)
        .set({ lastLogin: new Date() })
        .where(eq(schema.users.id, user.id));

      // Generate tokens
      const sessionId = this.generateSessionId();
      const tokens = await this.generateTokens(user, tenant, sessionId);

      // Create user profile
      const userProfile: UserProfile = {
        id: user.id,
        email: user.email,
        role: user.role as any,
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
        isActive: user.isActive,
        lastLogin: new Date(),
        tenant: {
          id: tenant.id,
          businessName: tenant.businessName,
          domain: tenant.domain,
        },
      };

      return {
        success: true,
        user: userProfile,
        tokens,
      };
    } catch (error) {
      console.error('MFA verification error:', error);
      return {
        success: false,
        error: 'MFA verification failed',
      };
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<ServiceResponse<AuthTokens>> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, this.jwtRefreshSecret) as any;
      const refreshData = this.refreshTokens.get(refreshToken);

      if (!refreshData || refreshData.expiresAt < new Date()) {
        this.refreshTokens.delete(refreshToken);
        return {
          success: false,
          error: {
            code: 'INVALID_REFRESH_TOKEN',
            message: 'Invalid or expired refresh token',
          },
        };
      }

      // Get user and tenant
      const [user] = await this.db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, refreshData.userId))
        .limit(1);

      const [tenant] = await this.db
        .select()
        .from(schema.tenants)
        .where(eq(schema.tenants.id, refreshData.tenantId))
        .limit(1);

      if (!user || !tenant || !user.isActive || tenant.status !== 'active') {
        this.refreshTokens.delete(refreshToken);
        return {
          success: false,
          error: {
            code: 'USER_OR_TENANT_INACTIVE',
            message: 'User or tenant is inactive',
          },
        };
      }

      // Generate new tokens
      const newTokens = await this.generateTokens(user, tenant, refreshData.sessionId);

      // Remove old refresh token
      this.refreshTokens.delete(refreshToken);

      return {
        success: true,
        data: newTokens,
      };
    } catch (error) {
      console.error('Token refresh error:', error);
      return {
        success: false,
        error: {
          code: 'TOKEN_REFRESH_FAILED',
          message: 'Failed to refresh token',
        },
      };
    }
  }

  /**
   * Validate JWT token and return tenant context
   */
  async validateToken(token: string): Promise<ServiceResponse<TenantContext>> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as JwtPayload;

      // Check if session is still valid
      const sessionExists = Array.from(this.refreshTokens.values()).some(
        data => data.sessionId === decoded.sessionId && data.expiresAt > new Date()
      );

      if (!sessionExists) {
        return {
          success: false,
          error: {
            code: 'SESSION_EXPIRED',
            message: 'Session has expired',
          },
        };
      }

      // Get current usage (simplified - in real implementation would query usage metrics)
      const currentUsage = {
        messages_sent: 0,
        messages_received: 0,
        bookings_created: 0,
        api_calls: 0,
        storage_used: 0,
        webhook_calls: 0,
      };

      // Get subscription limits
      const [subscription] = await this.db
        .select({
          subscription: schema.subscriptions,
          plan: schema.subscriptionPlans,
        })
        .from(schema.subscriptions)
        .innerJoin(schema.subscriptionPlans, eq(schema.subscriptions.planId, schema.subscriptionPlans.id))
        .where(eq(schema.subscriptions.tenantId, decoded.tenantId))
        .limit(1);

      const subscriptionLimits = subscription?.plan.limits as any || {
        messagesPerMonth: 1000,
        bookingsPerMonth: 100,
        apiCallsPerDay: 1000,
      };

      const tenantContext: TenantContext = {
        tenantId: decoded.tenantId,
        userId: decoded.userId,
        userRole: decoded.role as any,
        permissions: decoded.permissions,
        subscriptionLimits,
        currentUsage,
      };

      return {
        success: true,
        data: tenantContext,
      };
    } catch (error) {
      console.error('Token validation error:', error);
      return {
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired token',
        },
      };
    }
  }

  /**
   * Logout user and invalidate session
   */
  async logout(sessionId: string): Promise<ServiceResponse<void>> {
    try {
      // Remove all refresh tokens for this session
      for (const [token, data] of this.refreshTokens.entries()) {
        if (data.sessionId === sessionId) {
          this.refreshTokens.delete(token);
        }
      }

      return {
        success: true,
        metadata: { loggedOut: true },
      };
    } catch (error) {
      console.error('Logout error:', error);
      return {
        success: false,
        error: {
          code: 'LOGOUT_FAILED',
          message: 'Failed to logout',
        },
      };
    }
  }

  // ===== MFA METHODS =====

  /**
   * Setup MFA for user
   */
  async setupMfa(userId: string, request: MfaSetupRequest): Promise<ServiceResponse<{
    secret?: string;
    qrCode?: string;
    backupCodes?: string[];
  }>> {
    try {
      const validatedRequest = tenantValidationSchemas.mfaSetupRequest.parse(request);

      switch (validatedRequest.method) {
        case 'totp':
          const secret = speakeasy.generateSecret({
            name: 'Multi-Tenant SaaS Platform',
            account: userId,
            length: 32,
          });

          return {
            success: true,
            data: {
              secret: secret.base32,
              qrCode: secret.otpauth_url,
              backupCodes: this.generateBackupCodes(),
            },
          };

        case 'sms':
          if (!validatedRequest.phoneNumber) {
            return {
              success: false,
              error: {
                code: 'PHONE_NUMBER_REQUIRED',
                message: 'Phone number is required for SMS MFA',
              },
            };
          }

          // In real implementation, would send SMS verification
          return {
            success: true,
            data: {
              backupCodes: this.generateBackupCodes(),
            },
          };

        case 'email':
          // In real implementation, would send email verification
          return {
            success: true,
            data: {
              backupCodes: this.generateBackupCodes(),
            },
          };

        default:
          return {
            success: false,
            error: {
              code: 'UNSUPPORTED_MFA_METHOD',
              message: 'Unsupported MFA method',
            },
          };
      }
    } catch (error) {
      console.error('MFA setup error:', error);
      return {
        success: false,
        error: {
          code: 'MFA_SETUP_FAILED',
          message: 'Failed to setup MFA',
        },
      };
    }
  }

  // ===== PRIVATE HELPER METHODS =====

  /**
   * Generate JWT tokens
   */
  private async generateTokens(user: any, tenant: any, sessionId: string): Promise<AuthTokens> {
    const permissions = this.getUserPermissions(user.role);
    
    const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
      userId: user.id,
      tenantId: tenant.id,
      email: user.email,
      role: user.role,
      permissions,
      sessionId,
    };

    const accessToken = jwt.sign(payload, this.jwtSecret, {
      expiresIn: '15m', // Short-lived access token
    });

    const refreshToken = jwt.sign(
      { userId: user.id, tenantId: tenant.id, sessionId },
      this.jwtRefreshSecret,
      { expiresIn: '7d' } // Long-lived refresh token
    );

    // Store refresh token data
    const refreshData: RefreshTokenData = {
      userId: user.id,
      tenantId: tenant.id,
      sessionId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    };

    this.refreshTokens.set(refreshToken, refreshData);

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60, // 15 minutes in seconds
      tokenType: 'Bearer',
    };
  }

  /**
   * Get user permissions based on role
   */
  private getUserPermissions(role: string): ApiPermission[] {
    switch (role) {
      case 'admin':
        return ['admin:all'];
      case 'manager':
        return [
          'read:services',
          'write:services',
          'read:conversations',
          'write:conversations',
          'read:bookings',
          'write:bookings',
          'read:analytics',
          'read:users',
          'manage:settings',
        ];
      case 'user':
        return [
          'read:services',
          'write:services',
          'read:conversations',
          'write:conversations',
          'read:bookings',
          'write:bookings',
        ];
      case 'viewer':
        return [
          'read:services',
          'read:conversations',
          'read:bookings',
          'read:analytics',
        ];
      default:
        return [];
    }
  }

  /**
   * Check if user should require MFA
   */
  private shouldRequireMfa(user: any, tenant: any): boolean {
    // In real implementation, would check user preferences and tenant policies
    // For demo, require MFA for admin users
    return user.role === 'admin';
  }

  /**
   * Verify TOTP code
   */
  private verifyTotpCode(code: string, secret: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: code,
      window: 2, // Allow 2 time steps of variance
    });
  }

  /**
   * Generate MFA token
   */
  private generateMfaToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Generate backup codes for MFA
   */
  private generateBackupCodes(): string[] {
    const codes = [];
    for (let i = 0; i < 10; i++) {
      codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
  }

  /**
   * Generate secret key
   */
  private generateSecret(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}