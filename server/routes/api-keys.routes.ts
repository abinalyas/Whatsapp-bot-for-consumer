/**
 * API Key Management Routes
 * Handles API key CRUD operations, usage tracking, and statistics
 */

import { Router, Request, Response } from 'express';
import { ApiKeyService } from '../services/api-key.service';
import { jwtAuthMiddleware, requirePermissions } from '../middleware/jwt-auth.middleware';
import type {
  CreateApiKeyRequest,
  PaginationParams,
} from '@shared/types/tenant';

export function createApiKeyRoutes(apiKeyService: ApiKeyService): Router {
  const router = Router();

  // All routes require authentication
  router.use(jwtAuthMiddleware({ authService: apiKeyService as any }));

  /**
   * POST /api-keys
   * Create new API key
   */
  router.post('/', requirePermissions('admin:all')(apiKeyService as any), async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const userId = req.user!.id;
      const data: CreateApiKeyRequest = req.body;

      const result = await apiKeyService.createApiKey(tenantId, data, userId);

      if (!result.success) {
        const statusCode = result.error!.code === 'API_KEY_LIMIT_EXCEEDED' ? 429 : 400;
        return res.status(statusCode).json({
          error: result.error!.code,
          message: result.error!.message,
        });
      }

      res.status(201).json({
        success: true,
        data: result.data,
      });
    } catch (error) {
      console.error('Create API key error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to create API key',
      });
    }
  });

  /**
   * GET /api-keys
   * List API keys for tenant
   */
  router.get('/', async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const pagination: PaginationParams = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
        sortBy: req.query.sortBy as string,
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
      };

      const result = await apiKeyService.listApiKeys(tenantId, pagination);

      if (!result.success) {
        return res.status(400).json({
          error: result.error!.code,
          message: result.error!.message,
        });
      }

      res.status(200).json({
        success: true,
        data: result.data,
      });
    } catch (error) {
      console.error('List API keys error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to list API keys',
      });
    }
  });

  /**
   * GET /api-keys/:keyId
   * Get specific API key
   */
  router.get('/:keyId', async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const { keyId } = req.params;

      const result = await apiKeyService.getApiKey(tenantId, keyId);

      if (!result.success) {
        const statusCode = result.error!.code === 'API_KEY_NOT_FOUND' ? 404 : 400;
        return res.status(statusCode).json({
          error: result.error!.code,
          message: result.error!.message,
        });
      }

      res.status(200).json({
        success: true,
        data: result.data,
      });
    } catch (error) {
      console.error('Get API key error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get API key',
      });
    }
  });

  /**
   * PUT /api-keys/:keyId
   * Update API key
   */
  router.put('/:keyId', requirePermissions('admin:all')(apiKeyService as any), async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const userId = req.user!.id;
      const { keyId } = req.params;
      const updates = req.body;

      const result = await apiKeyService.updateApiKey(tenantId, keyId, updates, userId);

      if (!result.success) {
        const statusCode = result.error!.code === 'API_KEY_NOT_FOUND' ? 404 : 400;
        return res.status(statusCode).json({
          error: result.error!.code,
          message: result.error!.message,
        });
      }

      res.status(200).json({
        success: true,
        data: result.data,
      });
    } catch (error) {
      console.error('Update API key error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to update API key',
      });
    }
  });

  /**
   * POST /api-keys/:keyId/revoke
   * Revoke API key
   */
  router.post('/:keyId/revoke', requirePermissions('admin:all')(apiKeyService as any), async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const userId = req.user!.id;
      const { keyId } = req.params;
      const { reason } = req.body;

      const result = await apiKeyService.revokeApiKey(tenantId, keyId, userId, reason);

      if (!result.success) {
        const statusCode = result.error!.code === 'API_KEY_NOT_FOUND' ? 404 : 400;
        return res.status(statusCode).json({
          error: result.error!.code,
          message: result.error!.message,
        });
      }

      res.status(200).json({
        success: true,
        message: 'API key revoked successfully',
      });
    } catch (error) {
      console.error('Revoke API key error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to revoke API key',
      });
    }
  });

  /**
   * DELETE /api-keys/:keyId
   * Delete API key permanently
   */
  router.delete('/:keyId', requirePermissions('admin:all')(apiKeyService as any), async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const userId = req.user!.id;
      const { keyId } = req.params;

      const result = await apiKeyService.deleteApiKey(tenantId, keyId, userId);

      if (!result.success) {
        const statusCode = result.error!.code === 'API_KEY_NOT_FOUND' ? 404 : 400;
        return res.status(statusCode).json({
          error: result.error!.code,
          message: result.error!.message,
        });
      }

      res.status(200).json({
        success: true,
        message: 'API key deleted successfully',
      });
    } catch (error) {
      console.error('Delete API key error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to delete API key',
      });
    }
  });

  /**
   * GET /api-keys/:keyId/stats
   * Get API key usage statistics
   */
  router.get('/:keyId/stats', async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const { keyId } = req.params;
      const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined;
      const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : undefined;

      const result = await apiKeyService.getApiKeyStats(tenantId, keyId, dateFrom, dateTo);

      if (!result.success) {
        return res.status(400).json({
          error: result.error!.code,
          message: result.error!.message,
        });
      }

      res.status(200).json({
        success: true,
        data: result.data,
      });
    } catch (error) {
      console.error('Get API key stats error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get API key statistics',
      });
    }
  });

  /**
   * POST /api-keys/validate
   * Validate API key (for internal use)
   */
  router.post('/validate', async (req: Request, res: Response) => {
    try {
      const { apiKey } = req.body;

      if (!apiKey) {
        return res.status(400).json({
          error: 'API_KEY_REQUIRED',
          message: 'API key is required',
        });
      }

      const result = await apiKeyService.validateApiKey(apiKey);

      if (!result.success) {
        return res.status(401).json({
          error: result.error!.code,
          message: result.error!.message,
        });
      }

      res.status(200).json({
        success: true,
        data: result.data,
      });
    } catch (error) {
      console.error('Validate API key error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to validate API key',
      });
    }
  });

  /**
   * GET /api-keys/:keyId/rate-limit
   * Check rate limit status for API key
   */
  router.get('/:keyId/rate-limit', async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const { keyId } = req.params;
      const endpoint = req.query.endpoint as string || '/api/default';

      const rateLimitStatus = await apiKeyService.checkRateLimit(keyId, tenantId, endpoint);

      res.status(200).json({
        success: true,
        data: rateLimitStatus,
      });
    } catch (error) {
      console.error('Check rate limit error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to check rate limit',
      });
    }
  });

  /**
   * POST /api-keys/:keyId/usage
   * Track API key usage (for internal use)
   */
  router.post('/:keyId/usage', async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const { keyId } = req.params;
      const usageData = {
        keyId,
        tenantId,
        endpoint: req.body.endpoint,
        method: req.body.method,
        statusCode: req.body.statusCode,
        responseTime: req.body.responseTime,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        timestamp: new Date(),
      };

      await apiKeyService.trackUsage(usageData);

      res.status(200).json({
        success: true,
        message: 'Usage tracked successfully',
      });
    } catch (error) {
      console.error('Track usage error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to track usage',
      });
    }
  });

  return router;
}