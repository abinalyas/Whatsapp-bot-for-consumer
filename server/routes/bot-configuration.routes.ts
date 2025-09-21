/**
 * Bot Configuration Management Routes
 * Provides API endpoints for managing tenant-specific bot configurations
 */

import { Router, Request, Response } from 'express';
import { BotConfigurationService, BotConfigurationUpdate, ConfigurationRollbackInfo } from '../services/bot-configuration.service';
import { AuthService } from '../services/auth.service';
import { RBACService } from '../services/rbac.service';
import { jwtAuthMiddleware } from '../middleware/jwt-auth.middleware';
import { requirePermissions, validateTenantContext } from '../middleware/rbac.middleware';
import type { BotSettings } from '@shared/types/tenant';

export function createBotConfigurationRoutes(
  botConfigService: BotConfigurationService,
  authService: AuthService,
  rbacService: RBACService
): Router {
  const router = Router();

  // Apply authentication and tenant validation to all routes
  router.use(jwtAuthMiddleware({ authService }));
  router.use(validateTenantContext());

  // ===== CONFIGURATION RETRIEVAL =====

  /**
   * Get complete bot configuration for tenant
   */
  router.get('/:tenantId/configuration',
    requirePermissions('read:services', 'manage:settings')(rbacService),
    async (req: Request, res: Response) => {
      try {
        const { tenantId } = req.params;

        const result = await botConfigService.getBotConfiguration(tenantId);

        if (!result.success) {
          return res.status(404).json({
            error: result.error!.code,
            message: result.error!.message,
          });
        }

        res.json({
          success: true,
          data: result.data,
          metadata: result.metadata,
        });
      } catch (error) {
        console.error('Error getting bot configuration:', error);
        res.status(500).json({
          error: 'CONFIG_RETRIEVAL_ERROR',
          message: 'Failed to retrieve bot configuration',
        });
      }
    }
  );

  // ===== CONFIGURATION HISTORY AND ROLLBACK =====

  /**
   * Get configuration history
   */
  router.get('/:tenantId/configuration/history',
    requirePermissions('manage:settings')(rbacService),
    async (req: Request, res: Response) => {
      try {
        const { tenantId } = req.params;
        const limit = parseInt(req.query.limit as string) || 10;

        if (limit < 1 || limit > 50) {
          return res.status(400).json({
            error: 'INVALID_LIMIT',
            message: 'Limit must be between 1 and 50',
          });
        }

        const result = await botConfigService.getConfigurationHistory(tenantId, limit);

        if (!result.success) {
          return res.status(404).json({
            error: result.error!.code,
            message: result.error!.message,
          });
        }

        res.json({
          success: true,
          data: result.data,
          metadata: {
            limit,
            count: result.data!.length,
          },
        });
      } catch (error) {
        console.error('Error getting configuration history:', error);
        res.status(500).json({
          error: 'CONFIG_HISTORY_ERROR',
          message: 'Failed to retrieve configuration history',
        });
      }
    }
  );

  /**
   * Rollback configuration to previous version
   */
  router.post('/:tenantId/configuration/rollback',
    requirePermissions('manage:settings')(rbacService),
    async (req: Request, res: Response) => {
      try {
        const { tenantId } = req.params;
        const { targetVersion, reason } = req.body;
        const rollbackBy = req.user!.id;

        if (!targetVersion || typeof targetVersion !== 'number') {
          return res.status(400).json({
            error: 'INVALID_TARGET_VERSION',
            message: 'Target version must be a valid number',
          });
        }

        if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
          return res.status(400).json({
            error: 'ROLLBACK_REASON_REQUIRED',
            message: 'Rollback reason is required',
          });
        }

        const rollbackInfo: ConfigurationRollbackInfo = {
          previousVersion: targetVersion,
          rollbackReason: reason.trim(),
          rollbackBy,
          rollbackAt: new Date(),
        };

        const result = await botConfigService.rollbackConfiguration(
          tenantId,
          targetVersion,
          rollbackInfo
        );

        if (!result.success) {
          return res.status(400).json({
            error: result.error!.code,
            message: result.error!.message,
          });
        }

        res.json({
          success: true,
          data: result.data,
          metadata: result.metadata,
        });
      } catch (error) {
        console.error('Error rolling back configuration:', error);
        res.status(500).json({
          error: 'CONFIG_ROLLBACK_ERROR',
          message: 'Failed to rollback configuration',
        });
      }
    }
  );

  // ===== CONFIGURATION VALIDATION =====

  /**
   * Validate configuration without saving
   */
  router.post('/:tenantId/configuration/validate',
    requirePermissions('manage:settings')(rbacService),
    async (req: Request, res: Response) => {
      try {
        const { tenantId } = req.params;
        const updates: BotConfigurationUpdate = req.body;
        const updatedBy = req.user!.id;

        if (!updates || Object.keys(updates).length === 0) {
          return res.status(400).json({
            error: 'NO_UPDATES',
            message: 'No configuration updates provided for validation',
          });
        }

        const result = await botConfigService.updateBotConfiguration(
          tenantId,
          updates,
          updatedBy,
          true // validateOnly = true
        );

        if (!result.success) {
          return res.status(400).json({
            error: result.error!.code,
            message: result.error!.message,
            details: result.error!.details,
          });
        }

        res.json({
          success: true,
          valid: true,
          data: result.data,
          warnings: result.metadata?.warnings || [],
        });
      } catch (error) {
        console.error('Error validating configuration:', error);
        res.status(500).json({
          error: 'CONFIG_VALIDATION_ERROR',
          message: 'Failed to validate configuration',
        });
      }
    }
  );

  // ===== REAL-TIME CONFIGURATION MANAGEMENT =====

  /**
   * Refresh configuration from database
   */
  router.post('/:tenantId/configuration/refresh',
    requirePermissions('manage:settings')(rbacService),
    async (req: Request, res: Response) => {
      try {
        const { tenantId } = req.params;

        const result = await botConfigService.refreshConfiguration(tenantId);

        if (!result.success) {
          return res.status(500).json({
            error: result.error!.code,
            message: result.error!.message,
          });
        }

        res.json({
          success: true,
          data: result.data,
          metadata: {
            refreshed: true,
            timestamp: new Date().toISOString(),
          },
        });
      } catch (error) {
        console.error('Error refreshing configuration:', error);
        res.status(500).json({
          error: 'CONFIG_REFRESH_ERROR',
          message: 'Failed to refresh configuration',
        });
      }
    }
  );

  // ===== CONFIGURATION UPDATES =====

  /**
   * Update bot configuration
   */
  router.put('/:tenantId/configuration',
    requirePermissions('manage:settings')(rbacService),
    async (req: Request, res: Response) => {
      try {
        const { tenantId } = req.params;
        const updates: BotConfigurationUpdate = req.body;
        const updatedBy = req.user!.id;
        const validateOnly = req.query.validate === 'true';

        if (!updates || Object.keys(updates).length === 0) {
          return res.status(400).json({
            error: 'NO_UPDATES',
            message: 'No configuration updates provided',
          });
        }

        const result = await botConfigService.updateBotConfiguration(
          tenantId,
          updates,
          updatedBy,
          validateOnly
        );

        if (!result.success) {
          const statusCode = result.error!.code === 'CONFIG_VALIDATION_FAILED' ? 400 : 500;
          return res.status(statusCode).json({
            error: result.error!.code,
            message: result.error!.message,
            details: result.error!.details,
          });
        }

        const statusCode = validateOnly ? 200 : 200;
        res.status(statusCode).json({
          success: true,
          data: result.data,
          metadata: result.metadata,
        });
      } catch (error) {
        console.error('Error updating bot configuration:', error);
        res.status(500).json({
          error: 'CONFIG_UPDATE_ERROR',
          message: 'Failed to update bot configuration',
        });
      }
    }
  );

  /**
   * Update specific configuration section
   */
  router.put('/:tenantId/configuration/:section',
    requirePermissions('manage:settings')(rbacService),
    async (req: Request, res: Response) => {
      try {
        const { tenantId, section } = req.params;
        const sectionData = req.body;
        const updatedBy = req.user!.id;

        // Validate section parameter
        const validSections = [
          'businessHours',
          'autoResponses',
          'conversationFlow',
          'paymentSettings',
          'notificationSettings',
          'customization',
        ];

        if (!validSections.includes(section)) {
          return res.status(400).json({
            error: 'INVALID_SECTION',
            message: 'Invalid configuration section',
            validSections,
          });
        }

        if (!sectionData || Object.keys(sectionData).length === 0) {
          return res.status(400).json({
            error: 'NO_SECTION_DATA',
            message: 'No section data provided',
          });
        }

        const result = await botConfigService.updateConfigurationSection(
          tenantId,
          section as keyof BotSettings,
          sectionData,
          updatedBy
        );

        if (!result.success) {
          const statusCode = result.error!.code === 'CONFIG_VALIDATION_FAILED' ? 400 : 500;
          return res.status(statusCode).json({
            error: result.error!.code,
            message: result.error!.message,
            details: result.error!.details,
          });
        }

        res.json({
          success: true,
          section,
          data: result.data,
          metadata: result.metadata,
        });
      } catch (error) {
        console.error('Error updating configuration section:', error);
        res.status(500).json({
          error: 'CONFIG_SECTION_UPDATE_ERROR',
          message: 'Failed to update configuration section',
        });
      }
    }
  );

  /**
   * Get specific configuration section
   */
  router.get('/:tenantId/configuration/:section',
    requirePermissions('read:services', 'manage:settings')(rbacService),
    async (req: Request, res: Response) => {
      try {
        const { tenantId, section } = req.params;

        // Validate section parameter
        const validSections = [
          'greetingMessage',
          'businessHours',
          'autoResponses',
          'conversationFlow',
          'paymentSettings',
          'notificationSettings',
          'customization',
        ];

        if (!validSections.includes(section)) {
          return res.status(400).json({
            error: 'INVALID_SECTION',
            message: 'Invalid configuration section',
            validSections,
          });
        }

        const result = await botConfigService.getConfigurationSection(tenantId, section as keyof BotSettings);

        if (!result.success) {
          return res.status(404).json({
            error: result.error!.code,
            message: result.error!.message,
          });
        }

        res.json({
          success: true,
          section,
          data: result.data,
        });
      } catch (error) {
        console.error('Error getting configuration section:', error);
        res.status(500).json({
          error: 'CONFIG_SECTION_ERROR',
          message: 'Failed to retrieve configuration section',
        });
      }
    }
  );

  // ===== CONFIGURATION TEMPLATES =====

  /**
   * Get default configuration template
   */
  router.get('/templates/default',
    requirePermissions('manage:settings')(rbacService),
    async (req: Request, res: Response) => {
      try {
        // Return a default configuration template
        const defaultConfig: BotSettings = {
          greetingMessage: 'Hello! Welcome to our business. I\'m here to help you book an appointment.',
          businessHours: {
            enabled: true,
            timezone: 'UTC',
            schedule: {
              monday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
              tuesday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
              wednesday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
              thursday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
              friday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
              saturday: { isOpen: false, openTime: '09:00', closeTime: '17:00' },
              sunday: { isOpen: false, openTime: '09:00', closeTime: '17:00' },
            },
            closedMessage: 'We are currently closed. Our business hours are Monday to Friday, 9 AM to 5 PM.',
          },
          autoResponses: {
            welcomeMessage: 'Welcome! How can I help you today?',
            serviceSelectionPrompt: 'Please select the service you would like to book:',
            dateSelectionPrompt: 'Please select your preferred date (YYYY-MM-DD):',
            timeSelectionPrompt: 'Please select your preferred time (HH:MM):',
            confirmationMessage: 'Please confirm your booking details:',
            paymentInstructions: 'Please proceed with payment to confirm your booking.',
            bookingConfirmedMessage: 'Your booking has been confirmed! We look forward to seeing you.',
            errorMessage: 'I apologize, but something went wrong. Please try again or contact us directly.',
            invalidInputMessage: 'I didn\'t understand that. Please try again.',
          },
          conversationFlow: {
            steps: [
              {
                id: 'greeting',
                name: 'Greeting',
                type: 'greeting',
                prompt: 'Hello! Welcome to our business.',
                nextStep: 'service_selection',
              },
              {
                id: 'service_selection',
                name: 'Service Selection',
                type: 'service_selection',
                prompt: 'What service would you like to book?',
                nextStep: 'date_selection',
              },
              {
                id: 'date_selection',
                name: 'Date Selection',
                type: 'date_selection',
                prompt: 'What date would you prefer?',
                nextStep: 'time_selection',
              },
              {
                id: 'time_selection',
                name: 'Time Selection',
                type: 'time_selection',
                prompt: 'What time works best for you?',
                nextStep: 'confirmation',
              },
              {
                id: 'confirmation',
                name: 'Confirmation',
                type: 'confirmation',
                prompt: 'Please confirm your booking.',
              },
            ],
            fallbackBehavior: 'restart',
            maxRetries: 3,
            sessionTimeout: 30,
          },
          paymentSettings: {
            enabled: false,
            methods: [],
            currency: 'USD',
            requirePayment: false,
          },
          notificationSettings: {
            emailNotifications: {
              enabled: false,
              recipientEmails: [],
              events: [],
            },
            smsNotifications: {
              enabled: false,
              recipientPhones: [],
              events: [],
            },
            webhookNotifications: {
              enabled: false,
              endpoints: [],
              events: [],
            },
          },
          customization: {
            brandColors: {
              primary: '#007bff',
              secondary: '#6c757d',
              accent: '#28a745',
              background: '#ffffff',
              text: '#212529',
            },
            companyInfo: {
              name: 'Your Business Name',
              email: 'contact@yourbusiness.com',
              phone: '+1234567890',
            },
            customFields: [],
          },
        };

        res.json({
          success: true,
          template: 'default',
          data: defaultConfig,
        });
      } catch (error) {
        console.error('Error getting default configuration template:', error);
        res.status(500).json({
          error: 'TEMPLATE_ERROR',
          message: 'Failed to get configuration template',
        });
      }
    }
  );

  return router;
}