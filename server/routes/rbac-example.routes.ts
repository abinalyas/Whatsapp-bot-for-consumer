/**
 * Example Routes with RBAC Implementation
 * Demonstrates how to use the RBAC middleware in practice
 */

import { Router, Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { RBACService } from '../services/rbac.service';
import { jwtAuthMiddleware } from '../middleware/jwt-auth.middleware';
import {
  requirePermissions,
  requireAdmin,
  requireResourceAccess,
  requireUserAccess,
  requireMinimumRole,
  checkSubscriptionLimits,
  validateTenantContext,
  auditAccess,
} from '../middleware/rbac.middleware';

export function createRBACExampleRoutes(
  authService: AuthService,
  rbacService: RBACService
): Router {
  const router = Router();

  // ===== PUBLIC ROUTES (No authentication required) =====
  
  router.get('/public/health', (req: Request, res: Response) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  });

  // ===== AUTHENTICATED ROUTES =====

  // Basic authenticated route
  router.get('/profile',
    jwtAuthMiddleware({ authService }),
    (req: Request, res: Response) => {
      res.json({
        message: 'User profile',
        user: req.user,
        tenant: req.tenantContext?.tenantId,
      });
    }
  );

  // ===== PERMISSION-BASED ROUTES =====

  // Services management - requires service permissions
  router.get('/services',
    jwtAuthMiddleware({ authService }),
    requirePermissions('read:services')(rbacService),
    auditAccess('services', 'list'),
    (req: Request, res: Response) => {
      res.json({
        message: 'Services list',
        services: [
          { id: '1', name: 'Haircut', price: 30 },
          { id: '2', name: 'Massage', price: 60 },
        ],
      });
    }
  );

  router.post('/services',
    jwtAuthMiddleware({ authService }),
    requirePermissions('write:services')(rbacService),
    checkSubscriptionLimits('api_calls'),
    auditAccess('services', 'create'),
    (req: Request, res: Response) => {
      res.json({
        message: 'Service created',
        service: { id: '3', ...req.body },
      });
    }
  );

  // Individual service - resource-based access control
  router.get('/services/:serviceId',
    jwtAuthMiddleware({ authService }),
    requireResourceAccess('services', 'read', 'serviceId')(rbacService),
    auditAccess('services', 'read'),
    (req: Request, res: Response) => {
      res.json({
        message: 'Service details',
        service: { id: req.params.serviceId, name: 'Sample Service' },
      });
    }
  );

  router.put('/services/:serviceId',
    jwtAuthMiddleware({ authService }),
    requireResourceAccess('services', 'update', 'serviceId')(rbacService),
    auditAccess('services', 'update'),
    (req: Request, res: Response) => {
      res.json({
        message: 'Service updated',
        service: { id: req.params.serviceId, ...req.body },
      });
    }
  );

  router.delete('/services/:serviceId',
    jwtAuthMiddleware({ authService }),
    requireResourceAccess('services', 'delete', 'serviceId')(rbacService),
    auditAccess('services', 'delete'),
    (req: Request, res: Response) => {
      res.json({
        message: 'Service deleted',
        serviceId: req.params.serviceId,
      });
    }
  );

  // ===== CONVERSATION MANAGEMENT =====

  router.get('/conversations',
    jwtAuthMiddleware({ authService }),
    requirePermissions('read:conversations')(rbacService),
    (req: Request, res: Response) => {
      res.json({
        message: 'Conversations list',
        conversations: [
          { id: '1', phoneNumber: '+1234567890', status: 'active' },
          { id: '2', phoneNumber: '+0987654321', status: 'completed' },
        ],
      });
    }
  );

  router.post('/conversations/:conversationId/messages',
    jwtAuthMiddleware({ authService }),
    requirePermissions('write:conversations')(rbacService),
    checkSubscriptionLimits('messages_sent'),
    (req: Request, res: Response) => {
      res.json({
        message: 'Message sent',
        conversationId: req.params.conversationId,
        messageId: 'msg-123',
      });
    }
  );

  // ===== BOOKING MANAGEMENT =====

  router.get('/bookings',
    jwtAuthMiddleware({ authService }),
    requirePermissions('read:bookings')(rbacService),
    (req: Request, res: Response) => {
      res.json({
        message: 'Bookings list',
        bookings: [
          { id: '1', serviceId: '1', customerName: 'John Doe', status: 'confirmed' },
          { id: '2', serviceId: '2', customerName: 'Jane Smith', status: 'pending' },
        ],
      });
    }
  );

  router.post('/bookings',
    jwtAuthMiddleware({ authService }),
    requirePermissions('write:bookings')(rbacService),
    checkSubscriptionLimits('bookings_created'),
    (req: Request, res: Response) => {
      res.json({
        message: 'Booking created',
        booking: { id: 'booking-123', ...req.body },
      });
    }
  );

  // ===== USER MANAGEMENT =====

  // List users - requires user read permission
  router.get('/users',
    jwtAuthMiddleware({ authService }),
    requirePermissions('read:users')(rbacService),
    (req: Request, res: Response) => {
      res.json({
        message: 'Users list',
        users: [
          { id: '1', email: 'admin@example.com', role: 'admin' },
          { id: '2', email: 'user@example.com', role: 'user' },
        ],
      });
    }
  );

  // Get user profile - allows self-access or requires user read permission
  router.get('/users/:userId',
    jwtAuthMiddleware({ authService }),
    requireUserAccess('read')(rbacService),
    (req: Request, res: Response) => {
      res.json({
        message: 'User profile',
        user: { id: req.params.userId, email: 'user@example.com' },
      });
    }
  );

  // Update user - allows self-access for basic info or requires user write permission
  router.put('/users/:userId',
    jwtAuthMiddleware({ authService }),
    requireUserAccess('update')(rbacService),
    (req: Request, res: Response) => {
      res.json({
        message: 'User updated',
        user: { id: req.params.userId, ...req.body },
      });
    }
  );

  // Create user - requires user write permission
  router.post('/users',
    jwtAuthMiddleware({ authService }),
    requirePermissions('write:users')(rbacService),
    (req: Request, res: Response) => {
      res.json({
        message: 'User created',
        user: { id: 'user-123', ...req.body },
      });
    }
  );

  // ===== ROLE-BASED ROUTES =====

  // Analytics - requires manager role or higher
  router.get('/analytics',
    jwtAuthMiddleware({ authService }),
    requireMinimumRole('manager')(rbacService),
    (req: Request, res: Response) => {
      res.json({
        message: 'Analytics data',
        metrics: {
          totalBookings: 150,
          totalRevenue: 4500,
          conversionRate: 0.25,
        },
      });
    }
  );

  // Settings - requires manager role or higher
  router.get('/settings',
    jwtAuthMiddleware({ authService }),
    requireMinimumRole('manager')(rbacService),
    (req: Request, res: Response) => {
      res.json({
        message: 'Tenant settings',
        settings: {
          businessName: 'Example Business',
          timezone: 'UTC',
          currency: 'USD',
        },
      });
    }
  );

  router.put('/settings',
    jwtAuthMiddleware({ authService }),
    requirePermissions('manage:settings')(rbacService),
    (req: Request, res: Response) => {
      res.json({
        message: 'Settings updated',
        settings: req.body,
      });
    }
  );

  // ===== ADMIN-ONLY ROUTES =====

  // Admin dashboard
  router.get('/admin/dashboard',
    jwtAuthMiddleware({ authService }),
    requireAdmin(rbacService),
    (req: Request, res: Response) => {
      res.json({
        message: 'Admin dashboard',
        stats: {
          totalTenants: 50,
          activeUsers: 200,
          systemHealth: 'good',
        },
      });
    }
  );

  // Billing management
  router.get('/billing',
    jwtAuthMiddleware({ authService }),
    requirePermissions('read:billing')(rbacService),
    (req: Request, res: Response) => {
      res.json({
        message: 'Billing information',
        subscription: {
          plan: 'Pro',
          status: 'active',
          nextBilling: '2024-02-01',
        },
      });
    }
  );

  router.put('/billing',
    jwtAuthMiddleware({ authService }),
    requirePermissions('manage:billing')(rbacService),
    (req: Request, res: Response) => {
      res.json({
        message: 'Billing updated',
        billing: req.body,
      });
    }
  );

  // ===== WEBHOOK MANAGEMENT =====

  // Receive webhooks - special permission for external systems
  router.post('/webhooks/whatsapp',
    jwtAuthMiddleware({ authService }),
    requirePermissions('webhook:receive')(rbacService),
    (req: Request, res: Response) => {
      res.json({
        message: 'Webhook received',
        processed: true,
      });
    }
  );

  // Manage webhook settings
  router.get('/webhooks/settings',
    jwtAuthMiddleware({ authService }),
    requirePermissions('manage:webhooks')(rbacService),
    (req: Request, res: Response) => {
      res.json({
        message: 'Webhook settings',
        webhooks: [
          { id: '1', url: 'https://example.com/webhook', active: true },
        ],
      });
    }
  );

  // ===== TENANT CONTEXT VALIDATION =====

  // Routes that validate tenant context from URL
  router.get('/tenants/:tenantId/services',
    jwtAuthMiddleware({ authService }),
    validateTenantContext(),
    requirePermissions('read:services')(rbacService),
    (req: Request, res: Response) => {
      res.json({
        message: 'Tenant-specific services',
        tenantId: req.params.tenantId,
        services: [],
      });
    }
  );

  // ===== COMPLEX PERMISSION SCENARIOS =====

  // Route requiring multiple permissions (ALL required)
  router.post('/advanced/bulk-import',
    jwtAuthMiddleware({ authService }),
    requirePermissions('write:services', 'manage:settings')(rbacService, true), // Requires ALL permissions
    checkSubscriptionLimits('api_calls'),
    (req: Request, res: Response) => {
      res.json({
        message: 'Bulk import completed',
        imported: req.body.items?.length || 0,
      });
    }
  );

  // Route with multiple middleware layers
  router.post('/advanced/admin-action',
    jwtAuthMiddleware({ authService }),
    requireMinimumRole('admin')(rbacService),
    requirePermissions('admin:all')(rbacService),
    auditAccess('admin', 'special_action'),
    (req: Request, res: Response) => {
      res.json({
        message: 'Admin action completed',
        action: req.body.action,
      });
    }
  );

  return router;
}

// Example usage in main application:
/*
import express from 'express';
import { AuthService } from './services/auth.service';
import { RBACService } from './services/rbac.service';
import { createRBACExampleRoutes } from './routes/rbac-example.routes';

const app = express();
const authService = new AuthService(process.env.DATABASE_URL!);
const rbacService = new RBACService(process.env.DATABASE_URL!);

app.use('/api', createRBACExampleRoutes(authService, rbacService));
*/