/**
 * RBAC Middleware Unit Tests
 * Tests permission-based route protection middleware
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import {
  rbacMiddleware,
  requirePermissions,
  requireAnyPermission,
  requireAllPermissions,
  requireAdmin,
  requireResourceAccess,
  requireUserAccess,
  requireMinimumRole,
  checkSubscriptionLimits,
  validateTenantContext,
} from '../server/middleware/rbac.middleware';
import { RBACService } from '../server/services/rbac.service';
import type { TenantContext, ApiPermission } from '@shared/types/tenant';

// Mock RBACService
const mockRBACService = {
  hasPermission: vi.fn(),
  hasAnyPermission: vi.fn(),
  hasAllPermissions: vi.fn(),
  checkAccess: vi.fn(),
  checkBulkAccess: vi.fn(),
} as unknown as RBACService;

// Mock Express objects
const createMockRequest = (overrides: Partial<Request> = {}): Request => ({
  user: {
    id: 'user-123',
    email: 'test@example.com',
    role: 'user',
    tenantId: 'tenant-123',
  },
  tenantContext: {
    tenantId: 'tenant-123',
    userId: 'user-123',
    userRole: 'user',
    permissions: ['read:services', 'write:services'],
    subscriptionLimits: {
      messagesPerMonth: 1000,
      bookingsPerMonth: 100,
      apiCallsPerDay: 1000,
    },
    currentUsage: {
      messages_sent: 50,
      messages_received: 30,
      bookings_created: 5,
      api_calls: 100,
      storage_used: 0,
      webhook_calls: 0,
    },
  } as TenantContext,
  params: {},
  ...overrides,
} as Request);

const createMockResponse = (): Response => {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

const createMockNext = (): NextFunction => vi.fn();

describe('RBAC Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rbacMiddleware', () => {
    it('should require authentication', async () => {
      const req = createMockRequest({ user: undefined, tenantContext: undefined });
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = rbacMiddleware({ rbacService: mockRBACService });
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Authentication required',
        message: 'User must be authenticated to access this resource',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should check explicit permissions when provided', async () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      vi.mocked(mockRBACService.hasAnyPermission).mockResolvedValue(true);

      const middleware = rbacMiddleware({
        rbacService: mockRBACService,
        permissions: ['read:services'],
      });
      await middleware(req, res, next);

      expect(mockRBACService.hasAnyPermission).toHaveBeenCalledWith(
        'user-123',
        'tenant-123',
        ['read:services']
      );
      expect(next).toHaveBeenCalled();
    });

    it('should deny access when permissions are insufficient', async () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      vi.mocked(mockRBACService.hasAnyPermission).mockResolvedValue(false);

      const middleware = rbacMiddleware({
        rbacService: mockRBACService,
        permissions: ['admin:all'],
      });
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Insufficient permissions',
        message: 'User does not have required permissions',
        required: ['admin:all'],
        requireAll: false,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should check resource-based access when resource and action provided', async () => {
      const req = createMockRequest({
        params: { serviceId: 'service-123' },
      });
      const res = createMockResponse();
      const next = createMockNext();

      vi.mocked(mockRBACService.checkAccess).mockResolvedValue({
        allowed: true,
      });

      const middleware = rbacMiddleware({
        rbacService: mockRBACService,
        resource: 'services',
        action: 'read',
        resourceIdParam: 'serviceId',
      });
      await middleware(req, res, next);

      expect(mockRBACService.checkAccess).toHaveBeenCalledWith(
        'user-123',
        'tenant-123',
        'services',
        'read',
        'service-123'
      );
      expect(next).toHaveBeenCalled();
    });

    it('should allow self-access for user resources', async () => {
      const req = createMockRequest({
        params: { userId: 'user-123' },
      });
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = rbacMiddleware({
        rbacService: mockRBACService,
        resource: 'users',
        action: 'read',
        resourceIdParam: 'userId',
        allowSelfAccess: true,
      });
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(mockRBACService.checkAccess).not.toHaveBeenCalled();
    });

    it('should deny resource access when not allowed', async () => {
      const req = createMockRequest({
        params: { serviceId: 'service-123' },
      });
      const res = createMockResponse();
      const next = createMockNext();

      vi.mocked(mockRBACService.checkAccess).mockResolvedValue({
        allowed: false,
        reason: 'Insufficient permissions for this resource',
      });

      const middleware = rbacMiddleware({
        rbacService: mockRBACService,
        resource: 'services',
        action: 'delete',
        resourceIdParam: 'serviceId',
      });
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Access denied',
        message: 'Insufficient permissions for this resource',
        resource: 'services',
        action: 'delete',
        resourceId: 'service-123',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      vi.mocked(mockRBACService.hasAnyPermission).mockRejectedValue(
        new Error('Database error')
      );

      const middleware = rbacMiddleware({
        rbacService: mockRBACService,
        permissions: ['read:services'],
      });
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Authorization error',
        message: 'Failed to check permissions',
      });
    });
  });

  describe('Permission Helper Functions', () => {
    it('should create middleware for any permission requirement', async () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      vi.mocked(mockRBACService.hasAnyPermission).mockResolvedValue(true);

      const middleware = requireAnyPermission('read:services', 'read:bookings')(mockRBACService);
      await middleware(req, res, next);

      expect(mockRBACService.hasAnyPermission).toHaveBeenCalledWith(
        'user-123',
        'tenant-123',
        ['read:services', 'read:bookings']
      );
      expect(next).toHaveBeenCalled();
    });

    it('should create middleware for all permissions requirement', async () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      vi.mocked(mockRBACService.hasAllPermissions).mockResolvedValue(true);

      const middleware = requireAllPermissions('read:services', 'write:services')(mockRBACService);
      await middleware(req, res, next);

      expect(mockRBACService.hasAllPermissions).toHaveBeenCalledWith(
        'user-123',
        'tenant-123',
        ['read:services', 'write:services']
      );
      expect(next).toHaveBeenCalled();
    });

    it('should create admin-only middleware', async () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      vi.mocked(mockRBACService.hasAnyPermission).mockResolvedValue(true);

      const middleware = requireAdmin(mockRBACService);
      await middleware(req, res, next);

      expect(mockRBACService.hasAnyPermission).toHaveBeenCalledWith(
        'user-123',
        'tenant-123',
        ['admin:all']
      );
    });

    it('should create resource access middleware', async () => {
      const req = createMockRequest({
        params: { bookingId: 'booking-123' },
      });
      const res = createMockResponse();
      const next = createMockNext();

      vi.mocked(mockRBACService.checkAccess).mockResolvedValue({
        allowed: true,
      });

      const middleware = requireResourceAccess('bookings', 'update', 'bookingId')(mockRBACService);
      await middleware(req, res, next);

      expect(mockRBACService.checkAccess).toHaveBeenCalledWith(
        'user-123',
        'tenant-123',
        'bookings',
        'update',
        'booking-123'
      );
    });

    it('should create user access middleware with self-access', async () => {
      const req = createMockRequest({
        params: { userId: 'user-123' },
      });
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = requireUserAccess('read')(mockRBACService);
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(mockRBACService.checkAccess).not.toHaveBeenCalled();
    });
  });

  describe('Role-Based Middleware', () => {
    it('should allow access for users with sufficient role', async () => {
      const req = createMockRequest({
        user: {
          id: 'user-123',
          email: 'admin@example.com',
          role: 'admin',
          tenantId: 'tenant-123',
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = requireMinimumRole('manager')(mockRBACService);
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should deny access for users with insufficient role', async () => {
      const req = createMockRequest({
        user: {
          id: 'user-123',
          email: 'viewer@example.com',
          role: 'viewer',
          tenantId: 'tenant-123',
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = requireMinimumRole('user')(mockRBACService);
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Insufficient role',
        message: 'Minimum role required: user',
        userRole: 'viewer',
        minimumRole: 'user',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should validate role hierarchy correctly', async () => {
      const testCases = [
        { userRole: 'admin', requiredRole: 'manager', shouldPass: true },
        { userRole: 'manager', requiredRole: 'user', shouldPass: true },
        { userRole: 'user', requiredRole: 'viewer', shouldPass: true },
        { userRole: 'viewer', requiredRole: 'user', shouldPass: false },
        { userRole: 'user', requiredRole: 'admin', shouldPass: false },
      ];

      for (const testCase of testCases) {
        const req = createMockRequest({
          user: {
            id: 'user-123',
            email: 'test@example.com',
            role: testCase.userRole,
            tenantId: 'tenant-123',
          },
        });
        const res = createMockResponse();
        const next = createMockNext();

        const middleware = requireMinimumRole(testCase.requiredRole as any)(mockRBACService);
        await middleware(req, res, next);

        if (testCase.shouldPass) {
          expect(next).toHaveBeenCalled();
        } else {
          expect(res.status).toHaveBeenCalledWith(403);
        }

        vi.clearAllMocks();
      }
    });
  });

  describe('Subscription Limits Middleware', () => {
    it('should allow access when under limits', async () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = checkSubscriptionLimits('messages_sent');
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should deny access when over limits', async () => {
      const req = createMockRequest({
        tenantContext: {
          ...createMockRequest().tenantContext!,
          currentUsage: {
            ...createMockRequest().tenantContext!.currentUsage,
            messages_sent: 1500, // Over the 1000 limit
          },
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = checkSubscriptionLimits('messages_sent');
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Usage limit exceeded',
        message: 'messages_sent limit exceeded',
        limit: 1000,
        usage: 1500,
        tenantId: 'tenant-123',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should allow unlimited usage when limit is -1', async () => {
      const req = createMockRequest({
        tenantContext: {
          ...createMockRequest().tenantContext!,
          subscriptionLimits: {
            ...createMockRequest().tenantContext!.subscriptionLimits,
            messagesPerMonth: -1, // Unlimited
          },
          currentUsage: {
            ...createMockRequest().tenantContext!.currentUsage,
            messages_sent: 10000, // High usage but unlimited
          },
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = checkSubscriptionLimits('messages_sent');
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should handle missing tenant context gracefully', async () => {
      const req = createMockRequest({ tenantContext: undefined });
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = checkSubscriptionLimits('messages_sent');
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('Tenant Context Validation', () => {
    it('should allow access when tenant contexts match', async () => {
      const req = createMockRequest({
        params: { tenantId: 'tenant-123' },
      });
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = validateTenantContext();
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should deny access when tenant contexts mismatch', async () => {
      const req = createMockRequest({
        params: { tenantId: 'different-tenant' },
      });
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = validateTenantContext();
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Tenant mismatch',
        message: 'Request tenant does not match user context',
        requestTenant: 'different-tenant',
        userTenant: 'tenant-123',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should allow access when no tenant ID in path', async () => {
      const req = createMockRequest({
        params: {},
      });
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = validateTenantContext();
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing authentication gracefully', async () => {
      const req = createMockRequest({ user: undefined });
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = requireMinimumRole('user')(mockRBACService);
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Authentication required',
        message: 'User must be authenticated',
      });
    });

    it('should handle RBAC service errors', async () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      vi.mocked(mockRBACService.hasAnyPermission).mockRejectedValue(
        new Error('Service unavailable')
      );

      const middleware = requireAnyPermission('read:services')(mockRBACService);
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Authorization error',
        message: 'Failed to check permissions',
      });
    });
  });
});