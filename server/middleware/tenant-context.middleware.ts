/**
 * Tenant Context Middleware
 * Automatically injects tenant context into requests and enforces tenant isolation
 */

import { Request, Response, NextFunction } from 'express';
import { TenantService } from '../services/tenant.service';
import type { TenantContext, ApiPermission } from '@shared/types/tenant';

// Extend Express Request type to include tenant context
declare global {
  namespace Express {
    interface Request {
      tenantContext?: TenantContext;
      tenantId?: string;
      hasPermission?: (permission: ApiPermission) => boolean;
    }
  }
}

export interface TenantMiddlewareOptions {
  tenantService: TenantService;
  requireTenant?: boolean;
  requiredPermissions?: ApiPermission[];
}

/**
 * Middleware to extract and validate tenant context from various sources
 */
export function tenantContextMiddleware(options: TenantMiddlewareOptions) {
  const { tenantService, requireTenant = true, requiredPermissions = [] } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      let tenantContext: TenantContext | null = null;

      // 1. Try to extract tenant context from API key
      const apiKey = extractApiKey(req);
      if (apiKey) {
        const result = await tenantService.validateApiKey(apiKey);
        if (result.success) {
          tenantContext = result.data!;
        } else {
          return res.status(401).json({
            error: 'Invalid API key',
            code: result.error!.code,
            message: result.error!.message,
          });
        }
      }

      // 2. Try to extract tenant context from JWT token (if implemented)
      if (!tenantContext) {
        const jwtContext = extractJwtContext(req);
        if (jwtContext) {
          tenantContext = jwtContext;
        }
      }

      // 3. Try to extract tenant from subdomain
      if (!tenantContext) {
        const domain = extractDomainFromRequest(req);
        if (domain) {
          const result = await tenantService.getTenantByDomain(domain);
          if (result.success) {
            tenantContext = {
              tenantId: result.data!.id,
              permissions: ['read:services', 'read:conversations', 'read:bookings'], // Default permissions for domain-based access
              subscriptionLimits: {
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
          }
        }
      }

      // 4. Check if tenant context is required
      if (requireTenant && !tenantContext) {
        return res.status(401).json({
          error: 'Tenant context required',
          message: 'Request must include valid API key, JWT token, or be made from a registered domain',
        });
      }

      // 5. Validate tenant status if context exists
      if (tenantContext) {
        const tenantResult = await tenantService.getTenantById(tenantContext.tenantId);
        if (!tenantResult.success) {
          return res.status(404).json({
            error: 'Tenant not found',
            code: tenantResult.error!.code,
            message: tenantResult.error!.message,
          });
        }

        const tenant = tenantResult.data!;
        if (tenant.status === 'suspended') {
          return res.status(423).json({
            error: 'Tenant suspended',
            message: 'Tenant account has been suspended',
            tenantId: tenant.id,
          });
        }

        if (tenant.status === 'cancelled') {
          return res.status(410).json({
            error: 'Tenant cancelled',
            message: 'Tenant account has been cancelled',
            tenantId: tenant.id,
          });
        }
      }

      // 6. Check required permissions
      if (tenantContext && requiredPermissions.length > 0) {
        const hasAllPermissions = requiredPermissions.every(permission =>
          tenantContext!.permissions.includes(permission) ||
          tenantContext!.permissions.includes('admin:all')
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

      // 7. Attach context to request
      if (tenantContext) {
        req.tenantContext = tenantContext;
        req.tenantId = tenantContext.tenantId;
        req.hasPermission = (permission: ApiPermission) =>
          tenantContext!.permissions.includes(permission) ||
          tenantContext!.permissions.includes('admin:all');
      }

      next();
    } catch (error) {
      console.error('Tenant context middleware error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to process tenant context',
      });
    }
  };
}

/**
 * Middleware factory for specific permission requirements
 */
export function requirePermissions(...permissions: ApiPermission[]) {
  return (tenantService: TenantService) =>
    tenantContextMiddleware({
      tenantService,
      requireTenant: true,
      requiredPermissions: permissions,
    });
}

/**
 * Middleware for optional tenant context (doesn't require tenant)
 */
export function optionalTenantContext(tenantService: TenantService) {
  return tenantContextMiddleware({
    tenantService,
    requireTenant: false,
  });
}

/**
 * Extract API key from request headers
 */
function extractApiKey(req: Request): string | null {
  // Check Authorization header (Bearer token)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    if (token.startsWith('tk_')) {
      return token;
    }
  }

  // Check X-API-Key header
  const apiKeyHeader = req.headers['x-api-key'];
  if (typeof apiKeyHeader === 'string' && apiKeyHeader.startsWith('tk_')) {
    return apiKeyHeader;
  }

  return null;
}

/**
 * Extract JWT context from request (placeholder for JWT implementation)
 */
function extractJwtContext(req: Request): TenantContext | null {
  // This would be implemented when JWT authentication is added
  // For now, return null
  return null;
}

/**
 * Extract domain from request for tenant identification
 */
function extractDomainFromRequest(req: Request): string | null {
  const host = req.headers.host;
  if (!host) return null;

  // Remove port if present
  const domain = host.split(':')[0];

  // Skip localhost and IP addresses
  if (domain === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(domain)) {
    return null;
  }

  return domain;
}

/**
 * Middleware to set tenant context in database session
 */
export function setDatabaseTenantContext() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.tenantId) {
      // This would set the tenant context in the database session
      // Implementation depends on the database connection management
      // For now, we'll rely on application-level filtering
    }
    next();
  };
}

/**
 * Middleware to validate tenant-scoped resource access
 */
export function validateTenantResource(resourceTenantIdExtractor: (req: Request) => string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.tenantId) {
      return res.status(401).json({
        error: 'Tenant context required',
        message: 'Request must include valid tenant context',
      });
    }

    const resourceTenantId = resourceTenantIdExtractor(req);
    if (resourceTenantId !== req.tenantId) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Cannot access resource from different tenant',
        requestTenantId: req.tenantId,
        resourceTenantId,
      });
    }

    next();
  };
}

/**
 * Middleware to check subscription limits
 */
export function checkSubscriptionLimits(metricName: keyof TenantContext['currentUsage']) {
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
 * Error handler for tenant-related errors
 */
export function tenantErrorHandler() {
  return (error: any, req: Request, res: Response, next: NextFunction) => {
    if (error.code && error.code.startsWith('TENANT_')) {
      return res.status(400).json({
        error: error.code,
        message: error.message,
        tenantId: error.tenantId,
        details: error.details,
      });
    }

    next(error);
  };
}