/**
 * Role-Based Access Control (RBAC) Middleware
 * Provides permission-based route protection and access control
 */

import { Request, Response, NextFunction } from 'express';
import { RBACService } from '../services/rbac.service';
import type { ApiPermission, TenantContext } from '@shared/types/tenant';

export interface RBACOptions {
  rbacService: RBACService;
  permissions?: ApiPermission[];
  requireAll?: boolean; // If true, user must have ALL permissions; if false, user needs ANY permission
  resource?: string;
  action?: 'create' | 'read' | 'update' | 'delete' | 'manage' | 'all';
  resourceIdParam?: string; // Parameter name for resource ID (e.g., 'serviceId')
  allowSelfAccess?: boolean; // Allow users to access their own resources
}

/**
 * Main RBAC middleware factory
 */
export function rbacMiddleware(options: RBACOptions) {
  const {
    rbacService,
    permissions = [],
    requireAll = false,
    resource,
    action,
    resourceIdParam,
    allowSelfAccess = false,
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Ensure user is authenticated
      if (!req.user || !req.tenantContext) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'User must be authenticated to access this resource',
        });
      }

      const { tenantContext, user } = req;
      const { tenantId, userId } = tenantContext;

      // Check explicit permissions if provided
      if (permissions.length > 0) {
        const hasPermission = requireAll
          ? await rbacService.hasAllPermissions(userId!, tenantId, permissions)
          : await rbacService.hasAnyPermission(userId!, tenantId, permissions);

        if (!hasPermission) {
          return res.status(403).json({
            error: 'Insufficient permissions',
            message: 'User does not have required permissions',
            required: permissions,
            requireAll,
          });
        }
      }

      // Check resource-based access if resource and action are provided
      if (resource && action) {
        const resourceId = resourceIdParam ? req.params[resourceIdParam] : undefined;

        // Allow self-access for user resources
        if (allowSelfAccess && resource === 'users' && resourceId === userId) {
          return next();
        }

        const accessCheck = await rbacService.checkAccess(
          userId!,
          tenantId,
          resource,
          action,
          resourceId
        );

        if (!accessCheck.allowed) {
          return res.status(403).json({
            error: 'Access denied',
            message: accessCheck.reason || 'Access to this resource is denied',
            resource,
            action,
            resourceId,
          });
        }
      }

      next();
    } catch (error) {
      console.error('RBAC middleware error:', error);
      res.status(500).json({
        error: 'Authorization error',
        message: 'Failed to check permissions',
      });
    }
  };
}

/**
 * Middleware to require specific permissions
 */
export function requirePermissions(...permissions: ApiPermission[]) {
  return (rbacService: RBACService, requireAll = false) =>
    rbacMiddleware({
      rbacService,
      permissions,
      requireAll,
    });
}

/**
 * Middleware to require ANY of the specified permissions
 */
export function requireAnyPermission(...permissions: ApiPermission[]) {
  return (rbacService: RBACService) =>
    rbacMiddleware({
      rbacService,
      permissions,
      requireAll: false,
    });
}

/**
 * Middleware to require ALL of the specified permissions
 */
export function requireAllPermissions(...permissions: ApiPermission[]) {
  return (rbacService: RBACService) =>
    rbacMiddleware({
      rbacService,
      permissions,
      requireAll: true,
    });
}

/**
 * Middleware for admin-only access
 */
export function requireAdmin(rbacService: RBACService) {
  return rbacMiddleware({
    rbacService,
    permissions: ['admin:all'],
  });
}

/**
 * Middleware for resource-based access control
 */
export function requireResourceAccess(
  resource: string,
  action: 'create' | 'read' | 'update' | 'delete' | 'manage' | 'all',
  resourceIdParam?: string
) {
  return (rbacService: RBACService) =>
    rbacMiddleware({
      rbacService,
      resource,
      action,
      resourceIdParam,
    });
}

/**
 * Middleware for user resource access (allows self-access)
 */
export function requireUserAccess(
  action: 'create' | 'read' | 'update' | 'delete' | 'manage' | 'all',
  resourceIdParam = 'userId'
) {
  return (rbacService: RBACService) =>
    rbacMiddleware({
      rbacService,
      resource: 'users',
      action,
      resourceIdParam,
      allowSelfAccess: true,
    });
}

/**
 * Middleware for service management
 */
export function requireServiceAccess(
  action: 'create' | 'read' | 'update' | 'delete' | 'manage',
  resourceIdParam = 'serviceId'
) {
  return (rbacService: RBACService) =>
    rbacMiddleware({
      rbacService,
      resource: 'services',
      action,
      resourceIdParam,
    });
}

/**
 * Middleware for conversation management
 */
export function requireConversationAccess(
  action: 'create' | 'read' | 'update' | 'delete' | 'manage',
  resourceIdParam = 'conversationId'
) {
  return (rbacService: RBACService) =>
    rbacMiddleware({
      rbacService,
      resource: 'conversations',
      action,
      resourceIdParam,
    });
}

/**
 * Middleware for booking management
 */
export function requireBookingAccess(
  action: 'create' | 'read' | 'update' | 'delete' | 'manage',
  resourceIdParam = 'bookingId'
) {
  return (rbacService: RBACService) =>
    rbacMiddleware({
      rbacService,
      resource: 'bookings',
      action,
      resourceIdParam,
    });
}

/**
 * Middleware for analytics access
 */
export function requireAnalyticsAccess(rbacService: RBACService) {
  return rbacMiddleware({
    rbacService,
    resource: 'analytics',
    action: 'read',
  });
}

/**
 * Middleware for settings management
 */
export function requireSettingsAccess(
  action: 'read' | 'update' | 'manage' = 'manage'
) {
  return (rbacService: RBACService) =>
    rbacMiddleware({
      rbacService,
      resource: 'settings',
      action,
    });
}

/**
 * Middleware for billing access
 */
export function requireBillingAccess(
  action: 'read' | 'update' | 'manage' = 'read'
) {
  return (rbacService: RBACService) =>
    rbacMiddleware({
      rbacService,
      resource: 'billing',
      action,
    });
}

/**
 * Middleware for webhook management
 */
export function requireWebhookAccess(
  action: 'create' | 'read' | 'update' | 'delete' | 'manage' = 'manage'
) {
  return (rbacService: RBACService) =>
    rbacMiddleware({
      rbacService,
      resource: 'webhooks',
      action,
    });
}

/**
 * Middleware to check role hierarchy (admin > manager > user > viewer)
 */
export function requireMinimumRole(minimumRole: 'admin' | 'manager' | 'user' | 'viewer') {
  return (rbacService: RBACService) => {
    return async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user || !req.tenantContext) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'User must be authenticated',
        });
      }

      const userRole = req.user.role;
      const roleHierarchy = ['viewer', 'user', 'manager', 'admin'];
      const userRoleLevel = roleHierarchy.indexOf(userRole);
      const minimumRoleLevel = roleHierarchy.indexOf(minimumRole);

      if (userRoleLevel < minimumRoleLevel) {
        return res.status(403).json({
          error: 'Insufficient role',
          message: `Minimum role required: ${minimumRole}`,
          userRole,
          minimumRole,
        });
      }

      next();
    };
  };
}

/**
 * Middleware to check subscription limits before allowing action
 */
export function checkSubscriptionLimits(
  metricName: 'messages_sent' | 'messages_received' | 'bookings_created' | 'api_calls'
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.tenantContext) {
      return next();
    }

    const { subscriptionLimits, currentUsage } = req.tenantContext;
    
    // Map metric names to limit names
    const limitMap = {
      messages_sent: 'messagesPerMonth',
      messages_received: 'messagesPerMonth',
      bookings_created: 'bookingsPerMonth',
      api_calls: 'apiCallsPerDay',
    } as const;

    const limitKey = limitMap[metricName];
    const limit = subscriptionLimits[limitKey];
    const usage = currentUsage[metricName];

    // -1 means unlimited
    if (limit !== -1 && usage >= limit) {
      return res.status(429).json({
        error: 'Usage limit exceeded',
        message: `${metricName} limit exceeded`,
        limit,
        usage,
        tenantId: req.tenantContext.tenantId,
      });
    }

    next();
  };
}

/**
 * Middleware to log access attempts for audit purposes
 */
export function auditAccess(resource: string, action: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.user && req.tenantContext) {
      // In a real implementation, would log to audit system
      console.log(`Audit: User ${req.user.id} in tenant ${req.tenantContext.tenantId} accessed ${resource}:${action}`);
    }
    next();
  };
}

/**
 * Middleware to validate tenant context matches request
 */
export function validateTenantContext() {
  return (req: Request, res: Response, next: NextFunction) => {
    const tenantIdFromPath = req.params.tenantId;
    const tenantIdFromContext = req.tenantContext?.tenantId;

    if (tenantIdFromPath && tenantIdFromContext && tenantIdFromPath !== tenantIdFromContext) {
      return res.status(403).json({
        error: 'Tenant mismatch',
        message: 'Request tenant does not match user context',
        requestTenant: tenantIdFromPath,
        userTenant: tenantIdFromContext,
      });
    }

    next();
  };
}

/**
 * Middleware factory for bulk permission checks
 */
export function requireBulkPermissions(
  checks: Array<{
    resource: string;
    action: 'create' | 'read' | 'update' | 'delete' | 'manage' | 'all';
    resourceId?: string;
  }>
) {
  return (rbacService: RBACService) => {
    return async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user || !req.tenantContext) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'User must be authenticated',
        });
      }

      const { userId, tenantId } = req.tenantContext;

      try {
        const result = await rbacService.checkBulkAccess(userId!, tenantId, checks);

        if (!result.success) {
          return res.status(500).json({
            error: 'Permission check failed',
            message: result.error!.message,
          });
        }

        const failedChecks = result.data!.filter(check => !check.allowed);

        if (failedChecks.length > 0) {
          return res.status(403).json({
            error: 'Insufficient permissions',
            message: 'One or more permission checks failed',
            failedChecks: failedChecks.map((check, index) => ({
              check: checks[index],
              reason: check.reason,
            })),
          });
        }

        next();
      } catch (error) {
        console.error('Bulk permission check error:', error);
        res.status(500).json({
          error: 'Authorization error',
          message: 'Failed to check permissions',
        });
      }
    };
  };
}