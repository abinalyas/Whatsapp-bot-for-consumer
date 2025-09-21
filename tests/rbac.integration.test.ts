/**
 * RBAC Integration Tests
 * Tests the complete RBAC system integration with routes and middleware
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import express, { Request, Response } from 'express';
import request from 'supertest';
import { RBACService } from '../server/services/rbac.service';
import { AuthService } from '../server/services/auth.service';
import { jwtAuthMiddleware } from '../server/middleware/jwt-auth.middleware';
import {
  requirePermissions,
  requireAdmin,
  requireResourceAccess,
  requireMinimumRole,
  checkSubscriptionLimits,
} from '../server/middleware/rbac.middleware';
import type { TenantContext } from '@shared/types/tenant';

// Mock database connection
const mockConnectionString = 'postgresql://test:test@localhost:5432/test';

// Mock services
const mockAuthService = {
  validateToken: vi.fn(),
} as unknown as AuthService;

const mockRBACService = {
  hasAnyPermission: vi.fn(),
  hasAllPermissions: vi.fn(),
  checkAccess: vi.fn(),
  getUserPermissions: vi.fn(),
} as unknown as RBACService;

// Mock tenant context
const mockTenantContext: TenantContext = {
  tenantId: 'tenant-123',
  userId: 'user-123',
  userRole: 'user',
  permissions: ['read:services', 'write:services', 'read:bookings', 'write:bookings'],
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
};

const mockAdminContext: TenantContext = {
  ...mockTenantContext,
  userRole: 'admin',
  permissions: ['admin:all'],
};

describe('RBAC Integration Tests', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Mock successful authentication
    vi.mocked(mockAuthService.validateToken).mockResolvedValue({
      success: true,
      data: mockTenantContext,
    });

    // Setup test routes
    setupTestRoutes();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  function setupTestRoutes() {
    // Public route (no auth required)
    app.get('/public', (req: Request, res: Response) => {
      res.json({ message: 'Public endpoint' });
    });

    // Protected route requiring authentication
    app.get('/protected',
      jwtAuthMiddleware({ authService: mockAuthService }),
      (req: Request, res: Response) => {
        res.json({ message: 'Protected endpoint', user: req.user });
      }
    );

    // Route requiring specific permissions
    app.get('/services',
      jwtAuthMiddleware({ authService: mockAuthService }),
      requirePermissions('read:services')(mockRBACService),
      (req: Request, res: Response) => {
        res.json({ message: 'Services list' });
      }
    );

    // Route requiring admin access
    app.get('/admin',
      jwtAuthMiddleware({ authService: mockAuthService }),
      requireAdmin(mockRBACService),
      (req: Request, res: Response) => {
        res.json({ message: 'Admin panel' });
      }
    );

    // Route with resource-based access control
    app.get('/services/:serviceId',
      jwtAuthMiddleware({ authService: mockAuthService }),
      requireResourceAccess('services', 'read', 'serviceId')(mockRBACService),
      (req: Request, res: Response) => {
        res.json({ message: 'Service details', serviceId: req.params.serviceId });
      }
    );

    // Route with role-based access
    app.get('/analytics',
      jwtAuthMiddleware({ authService: mockAuthService }),
      requireMinimumRole('manager')(mockRBACService),
      (req: Request, res: Response) => {
        res.json({ message: 'Analytics data' });
      }
    );

    // Route with subscription limits
    app.post('/messages',
      jwtAuthMiddleware({ authService: mockAuthService }),
      checkSubscriptionLimits('messages_sent'),
      (req: Request, res: Response) => {
        res.json({ message: 'Message sent' });
      }
    );

    // Route requiring multiple permissions
    app.post('/services',
      jwtAuthMiddleware({ authService: mockAuthService }),
      requirePermissions('write:services', 'manage:settings')(mockRBACService, true),
      (req: Request, res: Response) => {
        res.json({ message: 'Service created' });
      }
    );
  }

  describe('Authentication Flow', () => {
    it('should allow access to public routes without authentication', async () => {
      const response = await request(app)
        .get('/public')
        .expect(200);

      expect(response.body.message).toBe('Public endpoint');
    });

    it('should require authentication for protected routes', async () => {
      await request(app)
        .get('/protected')
        .expect(401);
    });

    it('should allow access with valid token', async () => {
      const response = await request(app)
        .get('/protected')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.message).toBe('Protected endpoint');
    });

    it('should reject invalid tokens', async () => {
      vi.mocked(mockAuthService.validateToken).mockResolvedValue({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid token',
        },
      });

      await request(app)
        .get('/protected')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('Permission-Based Access Control', () => {
    it('should allow access with correct permissions', async () => {
      vi.mocked(mockRBACService.hasAnyPermission).mockResolvedValue(true);

      const response = await request(app)
        .get('/services')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.message).toBe('Services list');
      expect(mockRBACService.hasAnyPermission).toHaveBeenCalledWith(
        'user-123',
        'tenant-123',
        ['read:services']
      );
    });

    it('should deny access without correct permissions', async () => {
      vi.mocked(mockRBACService.hasAnyPermission).mockResolvedValue(false);

      await request(app)
        .get('/services')
        .set('Authorization', 'Bearer valid-token')
        .expect(403);
    });

    it('should require all permissions when specified', async () => {
      vi.mocked(mockRBACService.hasAllPermissions).mockResolvedValue(false);

      await request(app)
        .post('/services')
        .set('Authorization', 'Bearer valid-token')
        .send({ name: 'Test Service' })
        .expect(403);

      expect(mockRBACService.hasAllPermissions).toHaveBeenCalledWith(
        'user-123',
        'tenant-123',
        ['write:services', 'manage:settings']
      );
    });
  });

  describe('Admin Access Control', () => {
    it('should allow admin access for admin users', async () => {
      vi.mocked(mockAuthService.validateToken).mockResolvedValue({
        success: true,
        data: mockAdminContext,
      });
      vi.mocked(mockRBACService.hasAnyPermission).mockResolvedValue(true);

      const response = await request(app)
        .get('/admin')
        .set('Authorization', 'Bearer admin-token')
        .expect(200);

      expect(response.body.message).toBe('Admin panel');
    });

    it('should deny admin access for regular users', async () => {
      vi.mocked(mockRBACService.hasAnyPermission).mockResolvedValue(false);

      await request(app)
        .get('/admin')
        .set('Authorization', 'Bearer user-token')
        .expect(403);
    });
  });

  describe('Resource-Based Access Control', () => {
    it('should allow resource access when permitted', async () => {
      vi.mocked(mockRBACService.checkAccess).mockResolvedValue({
        allowed: true,
      });

      const response = await request(app)
        .get('/services/service-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.serviceId).toBe('service-123');
      expect(mockRBACService.checkAccess).toHaveBeenCalledWith(
        'user-123',
        'tenant-123',
        'services',
        'read',
        'service-123'
      );
    });

    it('should deny resource access when not permitted', async () => {
      vi.mocked(mockRBACService.checkAccess).mockResolvedValue({
        allowed: false,
        reason: 'Insufficient permissions for this resource',
      });

      await request(app)
        .get('/services/service-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(403);
    });
  });

  describe('Role-Based Access Control', () => {
    it('should deny access for insufficient role', async () => {
      // User role trying to access manager-only endpoint
      await request(app)
        .get('/analytics')
        .set('Authorization', 'Bearer user-token')
        .expect(403);
    });

    it('should allow access for sufficient role', async () => {
      // Set up manager context
      vi.mocked(mockAuthService.validateToken).mockResolvedValue({
        success: true,
        data: {
          ...mockTenantContext,
          userRole: 'manager',
        },
      });

      const response = await request(app)
        .get('/analytics')
        .set('Authorization', 'Bearer manager-token')
        .expect(200);

      expect(response.body.message).toBe('Analytics data');
    });
  });

  describe('Subscription Limits', () => {
    it('should allow actions under subscription limits', async () => {
      const response = await request(app)
        .post('/messages')
        .set('Authorization', 'Bearer valid-token')
        .send({ content: 'Test message' })
        .expect(200);

      expect(response.body.message).toBe('Message sent');
    });

    it('should deny actions over subscription limits', async () => {
      // Set up context with exceeded limits
      vi.mocked(mockAuthService.validateToken).mockResolvedValue({
        success: true,
        data: {
          ...mockTenantContext,
          currentUsage: {
            ...mockTenantContext.currentUsage,
            messages_sent: 1500, // Over the 1000 limit
          },
        },
      });

      await request(app)
        .post('/messages')
        .set('Authorization', 'Bearer valid-token')
        .send({ content: 'Test message' })
        .expect(429);
    });

    it('should allow unlimited usage when limit is -1', async () => {
      // Set up context with unlimited plan
      vi.mocked(mockAuthService.validateToken).mockResolvedValue({
        success: true,
        data: {
          ...mockTenantContext,
          subscriptionLimits: {
            ...mockTenantContext.subscriptionLimits,
            messagesPerMonth: -1, // Unlimited
          },
          currentUsage: {
            ...mockTenantContext.currentUsage,
            messages_sent: 10000, // High usage but unlimited
          },
        },
      });

      const response = await request(app)
        .post('/messages')
        .set('Authorization', 'Bearer unlimited-token')
        .send({ content: 'Test message' })
        .expect(200);

      expect(response.body.message).toBe('Message sent');
    });
  });

  describe('Error Handling', () => {
    it('should handle authentication service errors', async () => {
      vi.mocked(mockAuthService.validateToken).mockRejectedValue(
        new Error('Database connection failed')
      );

      await request(app)
        .get('/protected')
        .set('Authorization', 'Bearer valid-token')
        .expect(500);
    });

    it('should handle RBAC service errors', async () => {
      vi.mocked(mockRBACService.hasAnyPermission).mockRejectedValue(
        new Error('Permission check failed')
      );

      await request(app)
        .get('/services')
        .set('Authorization', 'Bearer valid-token')
        .expect(500);
    });

    it('should handle resource access check errors', async () => {
      vi.mocked(mockRBACService.checkAccess).mockRejectedValue(
        new Error('Resource check failed')
      );

      await request(app)
        .get('/services/service-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(500);
    });
  });

  describe('Complex Permission Scenarios', () => {
    it('should handle multiple middleware layers correctly', async () => {
      // Route with multiple middleware layers
      app.get('/complex',
        jwtAuthMiddleware({ authService: mockAuthService }),
        requireMinimumRole('user')(mockRBACService),
        requirePermissions('read:services')(mockRBACService),
        checkSubscriptionLimits('api_calls'),
        (req: Request, res: Response) => {
          res.json({ message: 'Complex endpoint accessed' });
        }
      );

      vi.mocked(mockRBACService.hasAnyPermission).mockResolvedValue(true);

      const response = await request(app)
        .get('/complex')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.message).toBe('Complex endpoint accessed');
    });

    it('should fail at first middleware that denies access', async () => {
      // Route that should fail at permission check
      app.get('/fail-early',
        jwtAuthMiddleware({ authService: mockAuthService }),
        requirePermissions('admin:all')(mockRBACService), // This should fail
        checkSubscriptionLimits('api_calls'), // This should not be reached
        (req: Request, res: Response) => {
          res.json({ message: 'Should not reach here' });
        }
      );

      vi.mocked(mockRBACService.hasAnyPermission).mockResolvedValue(false);

      await request(app)
        .get('/fail-early')
        .set('Authorization', 'Bearer valid-token')
        .expect(403);
    });
  });
});