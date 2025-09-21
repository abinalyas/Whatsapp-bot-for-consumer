/**
 * JWT Authentication Middleware
 * Validates JWT tokens and injects user/tenant context into requests
 */

import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import type { TenantContext, ApiPermission } from '@shared/types/tenant';

// Extend Express Request type to include auth context
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        tenantId: string;
      };
      tenantContext?: TenantContext;
      sessionId?: string;
    }
  }
}

export interface JwtAuthOptions {
  authService: AuthService;
  optional?: boolean;
  requiredPermissions?: ApiPermission[];
}

/**
 * JWT authentication middleware
 */
export function jwtAuthMiddleware(options: JwtAuthOptions) {
  const { authService, optional = false, requiredPermissions = [] } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = extractTokenFromRequest(req);

      if (!token) {
        if (optional) {
          return next();
        }
        return res.status(401).json({
          error: 'Authentication required',
          message: 'No authentication token provided',
        });
      }

      // Validate token and get tenant context
      const result = await authService.validateToken(token);

      if (!result.success) {
        if (optional) {
          return next();
        }
        return res.status(401).json({
          error: 'Invalid token',
          code: result.error!.code,
          message: result.error!.message,
        });
      }

      const tenantContext = result.data!;

      // Check required permissions
      if (requiredPermissions.length > 0) {
        const hasAllPermissions = requiredPermissions.every(permission =>
          tenantContext.permissions.includes(permission) ||
          tenantContext.permissions.includes('admin:all')
        );

        if (!hasAllPermissions) {
          return res.status(403).json({
            error: 'Insufficient permissions',
            message: 'Request requires additional permissions',
            required: requiredPermissions,
            current: tenantContext.permissions,
          });
        }
      }

      // Inject context into request
      req.user = {
        id: tenantContext.userId!,
        email: '', // Would be populated from token payload
        role: tenantContext.userRole!,
        tenantId: tenantContext.tenantId,
      };

      req.tenantContext = tenantContext;
      req.tenantId = tenantContext.tenantId;

      next();
    } catch (error) {
      console.error('JWT auth middleware error:', error);
      
      if (optional) {
        return next();
      }

      res.status(500).json({
        error: 'Authentication error',
        message: 'Failed to process authentication',
      });
    }
  };
}

/**
 * Middleware factory for specific permission requirements
 */
export function requirePermissions(...permissions: ApiPermission[]) {
  return (authService: AuthService) =>
    jwtAuthMiddleware({
      authService,
      requiredPermissions: permissions,
    });
}

/**
 * Middleware for optional authentication (doesn't require token)
 */
export function optionalAuth(authService: AuthService) {
  return jwtAuthMiddleware({
    authService,
    optional: true,
  });
}

/**
 * Middleware for admin-only routes
 */
export function requireAdmin(authService: AuthService) {
  return jwtAuthMiddleware({
    authService,
    requiredPermissions: ['admin:all'],
  });
}

/**
 * Middleware to check if user belongs to specific tenant
 */
export function requireTenant(tenantId: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || req.user.tenantId !== tenantId) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'User does not belong to the required tenant',
        requiredTenant: tenantId,
        userTenant: req.user?.tenantId,
      });
    }
    next();
  };
}

/**
 * Middleware to validate session is still active
 */
export function validateSession(authService: AuthService) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.sessionId) {
      return res.status(401).json({
        error: 'No session',
        message: 'No active session found',
      });
    }

    // In a real implementation, would check session validity
    // For now, just continue
    next();
  };
}

/**
 * Middleware to check subscription limits
 */
export function checkSubscriptionLimit(metricName: keyof TenantContext['currentUsage']) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.tenantContext) {
      return next();
    }

    const { subscriptionLimits, currentUsage } = req.tenantContext;
    
    // Map metric names to limit names
    const limitMap: Record<string, keyof typeof subscriptionLimits> = {
      messages_sent: 'messagesPerMonth',
      messages_received: 'messagesPerMonth',
      bookings_created: 'bookingsPerMonth',
      api_calls: 'apiCallsPerDay',
    };

    const limitKey = limitMap[metricName];
    if (!limitKey) {
      return next();
    }

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
 * Extract JWT token from request
 */
function extractTokenFromRequest(req: Request): string | null {
  // Check Authorization header (Bearer token)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    // Make sure it's not an API key
    if (!token.startsWith('tk_')) {
      return token;
    }
  }

  // Check cookies (for web applications)
  if (req.cookies && req.cookies.accessToken) {
    return req.cookies.accessToken;
  }

  return null;
}

/**
 * Error handler for authentication errors
 */
export function authErrorHandler() {
  return (error: any, req: Request, res: Response, next: NextFunction) => {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'JWT token is invalid',
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        message: 'JWT token has expired',
      });
    }

    if (error.code && error.code.startsWith('AUTH_')) {
      return res.status(401).json({
        error: error.code,
        message: error.message,
      });
    }

    next(error);
  };
}