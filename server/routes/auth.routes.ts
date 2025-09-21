/**
 * Authentication Routes
 * Handles login, logout, token refresh, and MFA operations
 */

import { Router, Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { jwtAuthMiddleware } from '../middleware/jwt-auth.middleware';
import type {
  LoginCredentials,
  MfaVerificationRequest,
  MfaSetupRequest,
} from '@shared/types/tenant';

export function createAuthRoutes(authService: AuthService): Router {
  const router = Router();

  /**
   * POST /auth/login
   * Authenticate user with email and password
   */
  router.post('/login', async (req: Request, res: Response) => {
    try {
      const credentials: LoginCredentials = req.body;
      const result = await authService.authenticateUser(credentials);

      if (!result.success) {
        return res.status(401).json({
          error: 'Authentication failed',
          message: result.error,
        });
      }

      if (result.requiresMfa) {
        return res.status(200).json({
          requiresMfa: true,
          mfaToken: result.mfaToken,
          message: 'MFA verification required',
        });
      }

      // Set HTTP-only cookie for web clients
      if (result.tokens) {
        res.cookie('accessToken', result.tokens.accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: result.tokens.expiresIn * 1000,
        });

        res.cookie('refreshToken', result.tokens.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
      }

      res.status(200).json({
        success: true,
        user: result.user,
        tokens: result.tokens,
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Login failed',
      });
    }
  });

  /**
   * POST /auth/mfa/verify
   * Verify MFA code and complete authentication
   */
  router.post('/mfa/verify', async (req: Request, res: Response) => {
    try {
      const request: MfaVerificationRequest = req.body;
      const result = await authService.verifyMfa(request);

      if (!result.success) {
        return res.status(401).json({
          error: 'MFA verification failed',
          message: result.error,
        });
      }

      // Set HTTP-only cookies
      if (result.tokens) {
        res.cookie('accessToken', result.tokens.accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: result.tokens.expiresIn * 1000,
        });

        res.cookie('refreshToken', result.tokens.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
      }

      res.status(200).json({
        success: true,
        user: result.user,
        tokens: result.tokens,
      });
    } catch (error) {
      console.error('MFA verification error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'MFA verification failed',
      });
    }
  });

  /**
   * POST /auth/refresh
   * Refresh access token using refresh token
   */
  router.post('/refresh', async (req: Request, res: Response) => {
    try {
      const refreshToken = req.body.refreshToken || req.cookies.refreshToken;

      if (!refreshToken) {
        return res.status(401).json({
          error: 'Refresh token required',
          message: 'No refresh token provided',
        });
      }

      const result = await authService.refreshToken(refreshToken);

      if (!result.success) {
        // Clear cookies on invalid refresh token
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');

        return res.status(401).json({
          error: 'Token refresh failed',
          code: result.error!.code,
          message: result.error!.message,
        });
      }

      const tokens = result.data!;

      // Set new cookies
      res.cookie('accessToken', tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: tokens.expiresIn * 1000,
      });

      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(200).json({
        success: true,
        tokens,
      });
    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Token refresh failed',
      });
    }
  });

  /**
   * POST /auth/logout
   * Logout user and invalidate session
   */
  router.post('/logout', jwtAuthMiddleware({ authService }), async (req: Request, res: Response) => {
    try {
      const sessionId = req.sessionId;

      if (sessionId) {
        await authService.logout(sessionId);
      }

      // Clear cookies
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');

      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Logout failed',
      });
    }
  });

  /**
   * GET /auth/me
   * Get current user information
   */
  router.get('/me', jwtAuthMiddleware({ authService }), async (req: Request, res: Response) => {
    try {
      res.status(200).json({
        success: true,
        user: req.user,
        tenantContext: {
          tenantId: req.tenantContext?.tenantId,
          permissions: req.tenantContext?.permissions,
          subscriptionLimits: req.tenantContext?.subscriptionLimits,
          currentUsage: req.tenantContext?.currentUsage,
        },
      });
    } catch (error) {
      console.error('Get user info error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get user information',
      });
    }
  });

  /**
   * POST /auth/mfa/setup
   * Setup MFA for current user
   */
  router.post('/mfa/setup', jwtAuthMiddleware({ authService }), async (req: Request, res: Response) => {
    try {
      const request: MfaSetupRequest = req.body;
      const userId = req.user!.id;

      const result = await authService.setupMfa(userId, request);

      if (!result.success) {
        return res.status(400).json({
          error: 'MFA setup failed',
          code: result.error!.code,
          message: result.error!.message,
        });
      }

      res.status(200).json({
        success: true,
        data: result.data,
      });
    } catch (error) {
      console.error('MFA setup error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'MFA setup failed',
      });
    }
  });

  /**
   * POST /auth/change-password
   * Change user password
   */
  router.post('/change-password', jwtAuthMiddleware({ authService }), async (req: Request, res: Response) => {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'Current password and new password are required',
        });
      }

      // In a real implementation, would validate current password and update
      // For now, just return success
      res.status(200).json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Password change failed',
      });
    }
  });

  /**
   * GET /auth/sessions
   * Get active sessions for current user
   */
  router.get('/sessions', jwtAuthMiddleware({ authService }), async (req: Request, res: Response) => {
    try {
      // In a real implementation, would return list of active sessions
      res.status(200).json({
        success: true,
        sessions: [
          {
            id: req.sessionId,
            current: true,
            createdAt: new Date(),
            lastActivity: new Date(),
            userAgent: req.headers['user-agent'],
            ipAddress: req.ip,
          },
        ],
      });
    } catch (error) {
      console.error('Get sessions error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get sessions',
      });
    }
  });

  /**
   * DELETE /auth/sessions/:sessionId
   * Revoke specific session
   */
  router.delete('/sessions/:sessionId', jwtAuthMiddleware({ authService }), async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;

      const result = await authService.logout(sessionId);

      if (!result.success) {
        return res.status(400).json({
          error: 'Session revocation failed',
          code: result.error!.code,
          message: result.error!.message,
        });
      }

      res.status(200).json({
        success: true,
        message: 'Session revoked successfully',
      });
    } catch (error) {
      console.error('Revoke session error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Session revocation failed',
      });
    }
  });

  return router;
}