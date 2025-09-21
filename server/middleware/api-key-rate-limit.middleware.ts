/**
 * API Key Rate Limiting Middleware
 * Handles rate limiting and usage tracking for API key requests
 */

import { Request, Response, NextFunction } from 'express';
import { ApiKeyService } from '../services/api-key.service';

export interface ApiKeyRateLimitOptions {
  apiKeyService: ApiKeyService;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: Request) => string;
}

/**
 * Rate limiting middleware for API key requests
 */
export function apiKeyRateLimit(options: ApiKeyRateLimitOptions) {
  const { 
    apiKeyService, 
    skipSuccessfulRequests = false, 
    skipFailedRequests = false,
    keyGenerator = (req) => req.ip || 'unknown'
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Skip if no tenant context (not an API key request)
      if (!req.tenantContext || !req.tenantId) {
        return next();
      }

      const tenantId = req.tenantId;
      const endpoint = req.route?.path || req.path;
      const apiKeyId = req.headers['x-api-key-id'] as string;

      if (!apiKeyId) {
        return next();
      }

      // Check rate limit
      const rateLimitStatus = await apiKeyService.checkRateLimit(apiKeyId, tenantId, endpoint);

      // Set rate limit headers
      res.set({
        'X-RateLimit-Limit': '60', // Would be dynamic based on subscription
        'X-RateLimit-Remaining': rateLimitStatus.remaining.toString(),
        'X-RateLimit-Reset': Math.ceil(rateLimitStatus.resetTime.getTime() / 1000).toString(),
      });

      if (!rateLimitStatus.allowed) {
        res.set('Retry-After', rateLimitStatus.retryAfter?.toString() || '60');
        return res.status(429).json({
          error: 'Rate limit exceeded',
          message: 'Too many requests, please try again later',
          retryAfter: rateLimitStatus.retryAfter,
          resetTime: rateLimitStatus.resetTime,
        });
      }

      // Track request start time for response time calculation
      const startTime = Date.now();
      req.startTime = startTime;

      // Override res.end to track usage after response
      const originalEnd = res.end;
      res.end = function(chunk?: any, encoding?: any) {
        const responseTime = Date.now() - startTime;
        const statusCode = res.statusCode;

        // Track usage based on options
        const shouldTrack = 
          (!skipSuccessfulRequests || statusCode >= 400) &&
          (!skipFailedRequests || statusCode < 400);

        if (shouldTrack) {
          // Track usage asynchronously
          setImmediate(() => {
            apiKeyService.trackUsage({
              keyId: apiKeyId,
              tenantId,
              endpoint,
              method: req.method,
              statusCode,
              responseTime,
              ipAddress: req.ip,
              userAgent: req.headers['user-agent'],
              timestamp: new Date(startTime),
            }).catch(error => {
              console.error('Error tracking API usage:', error);
            });
          });
        }

        // Call original end method
        originalEnd.call(this, chunk, encoding);
      };

      next();
    } catch (error) {
      console.error('API key rate limit middleware error:', error);
      // Continue on error to avoid blocking requests
      next();
    }
  };
}

/**
 * Middleware to extract API key ID from request
 */
export function extractApiKeyId() {
  return (req: Request, res: Response, next: NextFunction) => {
    const apiKey = req.headers['x-api-key'] as string;
    
    if (apiKey && apiKey.startsWith('tk_')) {
      // In a real implementation, would decode or lookup the key ID
      // For now, use a hash of the key as ID
      const crypto = require('crypto');
      const keyId = crypto.createHash('sha256').update(apiKey).digest('hex').substring(0, 16);
      req.headers['x-api-key-id'] = keyId;
    }

    next();
  };
}

/**
 * Middleware to check API key permissions for specific endpoints
 */
export function requireApiKeyPermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.tenantContext) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Valid API key required',
      });
    }

    const hasPermission = 
      req.tenantContext.permissions.includes(permission as any) ||
      req.tenantContext.permissions.includes('admin:all');

    if (!hasPermission) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: `API key does not have required permission: ${permission}`,
        required: [permission],
        current: req.tenantContext.permissions,
      });
    }

    next();
  };
}

/**
 * Middleware to validate API key format
 */
export function validateApiKeyFormat() {
  return (req: Request, res: Response, next: NextFunction) => {
    const apiKey = req.headers['x-api-key'] as string;
    
    if (apiKey && !apiKey.match(/^tk_[a-f0-9]{64}$/)) {
      return res.status(400).json({
        error: 'Invalid API key format',
        message: 'API key must be in format: tk_[64 hex characters]',
      });
    }

    next();
  };
}

/**
 * Middleware to log API key usage for analytics
 */
export function logApiKeyUsage() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.tenantContext && req.headers['x-api-key-id']) {
      // Log API key usage for analytics
      console.log(`API Key Usage: ${req.method} ${req.path} - Tenant: ${req.tenantId} - Key: ${req.headers['x-api-key-id']}`);
    }

    next();
  };
}

/**
 * Error handler for API key related errors
 */
export function apiKeyErrorHandler() {
  return (error: any, req: Request, res: Response, next: NextFunction) => {
    if (error.code && error.code.startsWith('API_KEY_')) {
      const statusCode = getStatusCodeForError(error.code);
      return res.status(statusCode).json({
        error: error.code,
        message: error.message,
        tenantId: error.tenantId,
      });
    }

    next(error);
  };
}

/**
 * Get appropriate HTTP status code for API key errors
 */
function getStatusCodeForError(errorCode: string): number {
  switch (errorCode) {
    case 'API_KEY_NOT_FOUND':
    case 'INVALID_API_KEY':
      return 401;
    case 'API_KEY_EXPIRED':
      return 401;
    case 'API_KEY_REVOKED':
      return 401;
    case 'API_KEY_LIMIT_EXCEEDED':
      return 429;
    case 'INSUFFICIENT_PERMISSIONS':
      return 403;
    default:
      return 400;
  }
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      startTime?: number;
    }
  }
}