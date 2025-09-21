/**
 * Dynamic Bot Configuration Service
 * Manages tenant-specific bot configurations with real-time updates and validation
 */

import { eq, and, desc } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import * as schema from '@shared/schema';
import { TenantSettingsService } from './tenant-settings.service';
import type {
  ServiceResponse,
  BotSettings,
  AutoResponses,
  ConversationFlow,
  ConversationStep,
  BusinessHours,
  PaymentSettings,
  NotificationSettings,
  BotCustomization,
} from '@shared/types/tenant';

export interface BotConfigurationUpdate {
  greetingMessage?: string;
  businessHours?: Partial<BusinessHours>;
  autoResponses?: Partial<AutoResponses>;
  conversationFlow?: Partial<ConversationFlow>;
  paymentSettings?: Partial<PaymentSettings>;
  notificationSettings?: Partial<NotificationSettings>;
  customization?: Partial<BotCustomization>;
}

export interface ConfigurationValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
    code: string;
  }>;
  warnings: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

export interface ConfigurationRollbackInfo {
  previousVersion: number;
  rollbackReason: string;
  rollbackBy: string;
  rollbackAt: Date;
}

export interface ConfigurationChangeEvent {
  tenantId: string;
  configType: 'bot_settings' | 'business_hours' | 'auto_responses' | 'conversation_flow' | 'payment_settings' | 'notifications' | 'customization';
  changeType: 'update' | 'rollback' | 'reset';
  oldValue: any;
  newValue: any;
  changedBy: string;
  timestamp: Date;
}

export class BotConfigurationService {
  private db: ReturnType<typeof drizzle>;
  private pool: Pool;
  private settingsService: TenantSettingsService;
  private configurationCache: Map<string, BotSettings> = new Map();
  private changeListeners: Map<string, Array<(event: ConfigurationChangeEvent) => void>> = new Map();

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString });
    this.db = drizzle({ client: this.pool, schema });
    this.settingsService = new TenantSettingsService(connectionString);
    
    // Set up cache refresh interval (every 5 minutes)
    setInterval(() => {
      this.refreshConfigurationCache();
    }, 5 * 60 * 1000);
  }

  // ===== CONFIGURATION RETRIEVAL =====

  /**
   * Get bot configuration for tenant with caching
   */
  async getBotConfiguration(tenantId: string): Promise<ServiceResponse<BotSettings>> {
    try {
      // Check cache first
      if (this.configurationCache.has(tenantId)) {
        return {
          success: true,
          data: this.configurationCache.get(tenantId)!,
          metadata: { fromCache: true },
        };
      }

      // Get from database
      const result = await this.settingsService.getSettings(tenantId);
      if (!result.success) {
        return {
          success: false,
          error: result.error!,
        };
      }

      const botSettings = result.data!.botSettings;
      
      // Cache the configuration
      this.configurationCache.set(tenantId, botSettings);

      return {
        success: true,
        data: botSettings,
        metadata: { fromCache: false },
      };
    } catch (error) {
      console.error('Error getting bot configuration:', error);
      return {
        success: false,
        error: {
          code: 'CONFIG_RETRIEVAL_FAILED',
          message: 'Failed to retrieve bot configuration',
          tenantId,
        },
      };
    }
  }

  /**
   * Get specific configuration section
   */
  async getConfigurationSection<T extends keyof BotSettings>(
    tenantId: string,
    section: T
  ): Promise<ServiceResponse<BotSettings[T]>> {
    try {
      const configResult = await this.getBotConfiguration(tenantId);
      if (!configResult.success) {
        return {
          success: false,
          error: configResult.error!,
        };
      }

      return {
        success: true,
        data: configResult.data![section],
      };
    } catch (error) {
      console.error('Error getting configuration section:', error);
      return {
        success: false,
        error: {
          code: 'CONFIG_SECTION_FAILED',
          message: `Failed to get configuration section: ${section}`,
          tenantId,
        },
      };
    }
  }

  // ===== CONFIGURATION UPDATES =====

  /**
   * Update bot configuration with validation and real-time updates
   */
  async updateBotConfiguration(
    tenantId: string,
    updates: BotConfigurationUpdate,
    updatedBy: string,
    validateOnly: boolean = false
  ): Promise<ServiceResponse<BotSettings>> {
    try {
      // Get current configuration
      const currentResult = await this.getBotConfiguration(tenantId);
      if (!currentResult.success) {
        return {
          success: false,
          error: currentResult.error!,
        };
      }

      const currentConfig = currentResult.data!;

      // Create updated configuration
      const updatedConfig: BotSettings = {
        ...currentConfig,
        ...updates,
        // Merge nested objects properly
        businessHours: updates.businessHours ? { ...currentConfig.businessHours, ...updates.businessHours } : currentConfig.businessHours,
        autoResponses: updates.autoResponses ? { ...currentConfig.autoResponses, ...updates.autoResponses } : currentConfig.autoResponses,
        conversationFlow: updates.conversationFlow ? { ...currentConfig.conversationFlow, ...updates.conversationFlow } : currentConfig.conversationFlow,
        paymentSettings: updates.paymentSettings ? { ...currentConfig.paymentSettings, ...updates.paymentSettings } : currentConfig.paymentSettings,
        notificationSettings: updates.notificationSettings ? { ...currentConfig.notificationSettings, ...updates.notificationSettings } : currentConfig.notificationSettings,
        customization: updates.customization ? { ...currentConfig.customization, ...updates.customization } : currentConfig.customization,
      };

      // Validate configuration
      const validationResult = await this.validateConfiguration(updatedConfig);
      if (!validationResult.isValid) {
        return {
          success: false,
          error: {
            code: 'CONFIG_VALIDATION_FAILED',
            message: 'Configuration validation failed',
            tenantId,
            details: {
              errors: validationResult.errors,
              warnings: validationResult.warnings,
            },
          },
        };
      }

      // If validation only, return the validated config without saving
      if (validateOnly) {
        return {
          success: true,
          data: updatedConfig,
          metadata: { validationOnly: true, warnings: validationResult.warnings },
        };
      }

      // Update settings in database
      const updateResult = await this.settingsService.updateSettings(
        tenantId,
        { botSettings: updatedConfig },
        updatedBy,
        'Bot configuration update'
      );

      if (!updateResult.success) {
        return {
          success: false,
          error: updateResult.error!,
        };
      }

      // Update cache
      this.configurationCache.set(tenantId, updatedConfig);

      // Emit change events
      await this.emitConfigurationChangeEvents(tenantId, currentConfig, updatedConfig, updatedBy);

      return {
        success: true,
        data: updatedConfig,
        metadata: { 
          updated: true, 
          warnings: validationResult.warnings,
          version: updateResult.data!.version,
        },
      };
    } catch (error) {
      console.error('Error updating bot configuration:', error);
      return {
        success: false,
        error: {
          code: 'CONFIG_UPDATE_FAILED',
          message: 'Failed to update bot configuration',
          tenantId,
        },
      };
    }
  }

  /**
   * Update specific configuration section
   */
  async updateConfigurationSection<T extends keyof BotSettings>(
    tenantId: string,
    section: T,
    sectionData: Partial<BotSettings[T]>,
    updatedBy: string
  ): Promise<ServiceResponse<BotSettings[T]>> {
    try {
      const updates = { [section]: sectionData } as BotConfigurationUpdate;
      const result = await this.updateBotConfiguration(tenantId, updates, updatedBy);
      
      if (!result.success) {
        return {
          success: false,
          error: result.error!,
        };
      }

      return {
        success: true,
        data: result.data![section],
        metadata: result.metadata,
      };
    } catch (error) {
      console.error('Error updating configuration section:', error);
      return {
        success: false,
        error: {
          code: 'CONFIG_SECTION_UPDATE_FAILED',
          message: `Failed to update configuration section: ${section}`,
          tenantId,
        },
      };
    }
  }

  // ===== CONFIGURATION VALIDATION =====

  /**
   * Validate bot configuration
   */
  async validateConfiguration(config: BotSettings): Promise<ConfigurationValidationResult> {
    const errors: Array<{ field: string; message: string; code: string }> = [];
    const warnings: Array<{ field: string; message: string; code: string }> = [];

    try {
      // Validate greeting message
      if (!config.greetingMessage || config.greetingMessage.trim().length === 0) {
        errors.push({
          field: 'greetingMessage',
          message: 'Greeting message is required',
          code: 'GREETING_MESSAGE_REQUIRED',
        });
      } else if (config.greetingMessage.length > 1000) {
        errors.push({
          field: 'greetingMessage',
          message: 'Greeting message must be less than 1000 characters',
          code: 'GREETING_MESSAGE_TOO_LONG',
        });
      }

      // Validate business hours
      if (config.businessHours.enabled) {
        if (!config.businessHours.timezone) {
          errors.push({
            field: 'businessHours.timezone',
            message: 'Timezone is required when business hours are enabled',
            code: 'TIMEZONE_REQUIRED',
          });
        }

        // Validate schedule
        const schedule = config.businessHours.schedule;
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
        
        for (const day of days) {
          const daySchedule = schedule[day];
          if (daySchedule.isOpen) {
            if (!daySchedule.openTime || !daySchedule.closeTime) {
              errors.push({
                field: `businessHours.schedule.${day}`,
                message: `Open and close times are required for ${day}`,
                code: 'SCHEDULE_TIMES_REQUIRED',
              });
            } else {
              // Validate time format (HH:MM)
              const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
              if (!timeRegex.test(daySchedule.openTime)) {
                errors.push({
                  field: `businessHours.schedule.${day}.openTime`,
                  message: `Invalid open time format for ${day}. Use HH:MM format`,
                  code: 'INVALID_TIME_FORMAT',
                });
              }
              if (!timeRegex.test(daySchedule.closeTime)) {
                errors.push({
                  field: `businessHours.schedule.${day}.closeTime`,
                  message: `Invalid close time format for ${day}. Use HH:MM format`,
                  code: 'INVALID_TIME_FORMAT',
                });
              }
            }
          }
        }
      }

      // Validate auto responses
      const requiredResponses = [
        'welcomeMessage',
        'serviceSelectionPrompt',
        'dateSelectionPrompt',
        'timeSelectionPrompt',
        'confirmationMessage',
        'errorMessage',
      ] as const;

      for (const response of requiredResponses) {
        if (!config.autoResponses[response] || config.autoResponses[response].trim().length === 0) {
          errors.push({
            field: `autoResponses.${response}`,
            message: `${response} is required`,
            code: 'AUTO_RESPONSE_REQUIRED',
          });
        }
      }

      // Validate conversation flow
      if (!config.conversationFlow.steps || config.conversationFlow.steps.length === 0) {
        errors.push({
          field: 'conversationFlow.steps',
          message: 'At least one conversation step is required',
          code: 'CONVERSATION_STEPS_REQUIRED',
        });
      } else {
        // Validate each step
        config.conversationFlow.steps.forEach((step, index) => {
          if (!step.id || step.id.trim().length === 0) {
            errors.push({
              field: `conversationFlow.steps[${index}].id`,
              message: `Step ${index + 1} must have an ID`,
              code: 'STEP_ID_REQUIRED',
            });
          }
          if (!step.name || step.name.trim().length === 0) {
            errors.push({
              field: `conversationFlow.steps[${index}].name`,
              message: `Step ${index + 1} must have a name`,
              code: 'STEP_NAME_REQUIRED',
            });
          }
          if (!step.prompt || step.prompt.trim().length === 0) {
            errors.push({
              field: `conversationFlow.steps[${index}].prompt`,
              message: `Step ${index + 1} must have a prompt`,
              code: 'STEP_PROMPT_REQUIRED',
            });
          }
        });

        // Check for duplicate step IDs
        const stepIds = config.conversationFlow.steps.map(step => step.id);
        const duplicateIds = stepIds.filter((id, index) => stepIds.indexOf(id) !== index);
        if (duplicateIds.length > 0) {
          errors.push({
            field: 'conversationFlow.steps',
            message: `Duplicate step IDs found: ${duplicateIds.join(', ')}`,
            code: 'DUPLICATE_STEP_IDS',
          });
        }
      }

      // Validate payment settings
      if (config.paymentSettings.enabled) {
        if (!config.paymentSettings.methods || config.paymentSettings.methods.length === 0) {
          errors.push({
            field: 'paymentSettings.methods',
            message: 'At least one payment method is required when payments are enabled',
            code: 'PAYMENT_METHODS_REQUIRED',
          });
        }

        if (!config.paymentSettings.currency) {
          errors.push({
            field: 'paymentSettings.currency',
            message: 'Currency is required when payments are enabled',
            code: 'CURRENCY_REQUIRED',
          });
        }

        if (config.paymentSettings.depositPercentage !== undefined) {
          if (config.paymentSettings.depositPercentage < 0 || config.paymentSettings.depositPercentage > 100) {
            errors.push({
              field: 'paymentSettings.depositPercentage',
              message: 'Deposit percentage must be between 0 and 100',
              code: 'INVALID_DEPOSIT_PERCENTAGE',
            });
          }
        }
      }

      // Validate customization
      if (config.customization.brandColors) {
        const colorFields = ['primary', 'secondary', 'accent', 'background', 'text'] as const;
        for (const colorField of colorFields) {
          const color = config.customization.brandColors[colorField];
          if (color && !/^#[0-9A-Fa-f]{6}$/.test(color)) {
            errors.push({
              field: `customization.brandColors.${colorField}`,
              message: `Invalid color format for ${colorField}. Use hex format (#RRGGBB)`,
              code: 'INVALID_COLOR_FORMAT',
            });
          }
        }
      }

      // Add warnings for potential issues
      if (config.conversationFlow.maxRetries > 5) {
        warnings.push({
          field: 'conversationFlow.maxRetries',
          message: 'High retry count may lead to poor user experience',
          code: 'HIGH_RETRY_COUNT',
        });
      }

      if (config.conversationFlow.sessionTimeout < 5) {
        warnings.push({
          field: 'conversationFlow.sessionTimeout',
          message: 'Very short session timeout may interrupt user conversations',
          code: 'SHORT_SESSION_TIMEOUT',
        });
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
      };
    } catch (error) {
      console.error('Error validating configuration:', error);
      return {
        isValid: false,
        errors: [{
          field: 'general',
          message: 'Configuration validation failed due to internal error',
          code: 'VALIDATION_ERROR',
        }],
        warnings: [],
      };
    }
  }

  // ===== CONFIGURATION ROLLBACK =====

  /**
   * Rollback configuration to previous version
   */
  async rollbackConfiguration(
    tenantId: string,
    targetVersion: number,
    rollbackInfo: ConfigurationRollbackInfo
  ): Promise<ServiceResponse<BotSettings>> {
    try {
      // Get the target version from settings history
      const rollbackResult = await this.settingsService.rollbackToVersion(
        tenantId,
        targetVersion,
        rollbackInfo.rollbackBy,
        rollbackInfo.rollbackReason
      );

      if (!rollbackResult.success) {
        return {
          success: false,
          error: rollbackResult.error!,
        };
      }

      const rolledBackSettings = rollbackResult.data!;
      const botSettings = rolledBackSettings.botSettings;

      // Update cache
      this.configurationCache.set(tenantId, botSettings);

      // Emit rollback event
      const changeEvent: ConfigurationChangeEvent = {
        tenantId,
        configType: 'bot_settings',
        changeType: 'rollback',
        oldValue: null, // We don't have the old value in this context
        newValue: botSettings,
        changedBy: rollbackInfo.rollbackBy,
        timestamp: rollbackInfo.rollbackAt,
      };

      await this.notifyChangeListeners(tenantId, changeEvent);

      return {
        success: true,
        data: botSettings,
        metadata: {
          rolledBack: true,
          targetVersion,
          rollbackReason: rollbackInfo.rollbackReason,
        },
      };
    } catch (error) {
      console.error('Error rolling back configuration:', error);
      return {
        success: false,
        error: {
          code: 'CONFIG_ROLLBACK_FAILED',
          message: 'Failed to rollback configuration',
          tenantId,
        },
      };
    }
  }

  /**
   * Get configuration history
   */
  async getConfigurationHistory(
    tenantId: string,
    limit: number = 10
  ): Promise<ServiceResponse<Array<{
    version: number;
    settings: BotSettings;
    createdBy: string;
    createdAt: Date;
    changeSummary?: string;
  }>>> {
    try {
      const historyResult = await this.settingsService.getSettingsHistory(tenantId, limit);
      if (!historyResult.success) {
        return {
          success: false,
          error: historyResult.error!,
        };
      }

      const history = historyResult.data!.map(version => ({
        version: version.version,
        settings: version.settings.botSettings,
        createdBy: version.createdBy,
        createdAt: version.createdAt,
        changeSummary: version.changeSummary,
      }));

      return {
        success: true,
        data: history,
      };
    } catch (error) {
      console.error('Error getting configuration history:', error);
      return {
        success: false,
        error: {
          code: 'CONFIG_HISTORY_FAILED',
          message: 'Failed to get configuration history',
          tenantId,
        },
      };
    }
  }

  // ===== REAL-TIME UPDATES =====

  /**
   * Subscribe to configuration changes
   */
  subscribeToConfigurationChanges(
    tenantId: string,
    listener: (event: ConfigurationChangeEvent) => void
  ): () => void {
    if (!this.changeListeners.has(tenantId)) {
      this.changeListeners.set(tenantId, []);
    }

    this.changeListeners.get(tenantId)!.push(listener);

    // Return unsubscribe function
    return () => {
      const listeners = this.changeListeners.get(tenantId);
      if (listeners) {
        const index = listeners.indexOf(listener);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }

  /**
   * Force refresh configuration from database
   */
  async refreshConfiguration(tenantId: string): Promise<ServiceResponse<BotSettings>> {
    try {
      // Remove from cache to force database fetch
      this.configurationCache.delete(tenantId);
      
      // Get fresh configuration
      return await this.getBotConfiguration(tenantId);
    } catch (error) {
      console.error('Error refreshing configuration:', error);
      return {
        success: false,
        error: {
          code: 'CONFIG_REFRESH_FAILED',
          message: 'Failed to refresh configuration',
          tenantId,
        },
      };
    }
  }

  // ===== PRIVATE HELPER METHODS =====

  /**
   * Emit configuration change events
   */
  private async emitConfigurationChangeEvents(
    tenantId: string,
    oldConfig: BotSettings,
    newConfig: BotSettings,
    changedBy: string
  ): Promise<void> {
    try {
      const timestamp = new Date();
      const events: ConfigurationChangeEvent[] = [];

      // Compare configurations and create change events
      if (JSON.stringify(oldConfig.businessHours) !== JSON.stringify(newConfig.businessHours)) {
        events.push({
          tenantId,
          configType: 'business_hours',
          changeType: 'update',
          oldValue: oldConfig.businessHours,
          newValue: newConfig.businessHours,
          changedBy,
          timestamp,
        });
      }

      if (JSON.stringify(oldConfig.autoResponses) !== JSON.stringify(newConfig.autoResponses)) {
        events.push({
          tenantId,
          configType: 'auto_responses',
          changeType: 'update',
          oldValue: oldConfig.autoResponses,
          newValue: newConfig.autoResponses,
          changedBy,
          timestamp,
        });
      }

      if (JSON.stringify(oldConfig.conversationFlow) !== JSON.stringify(newConfig.conversationFlow)) {
        events.push({
          tenantId,
          configType: 'conversation_flow',
          changeType: 'update',
          oldValue: oldConfig.conversationFlow,
          newValue: newConfig.conversationFlow,
          changedBy,
          timestamp,
        });
      }

      if (JSON.stringify(oldConfig.paymentSettings) !== JSON.stringify(newConfig.paymentSettings)) {
        events.push({
          tenantId,
          configType: 'payment_settings',
          changeType: 'update',
          oldValue: oldConfig.paymentSettings,
          newValue: newConfig.paymentSettings,
          changedBy,
          timestamp,
        });
      }

      if (JSON.stringify(oldConfig.notificationSettings) !== JSON.stringify(newConfig.notificationSettings)) {
        events.push({
          tenantId,
          configType: 'notifications',
          changeType: 'update',
          oldValue: oldConfig.notificationSettings,
          newValue: newConfig.notificationSettings,
          changedBy,
          timestamp,
        });
      }

      if (JSON.stringify(oldConfig.customization) !== JSON.stringify(newConfig.customization)) {
        events.push({
          tenantId,
          configType: 'customization',
          changeType: 'update',
          oldValue: oldConfig.customization,
          newValue: newConfig.customization,
          changedBy,
          timestamp,
        });
      }

      // Notify listeners
      for (const event of events) {
        await this.notifyChangeListeners(tenantId, event);
      }
    } catch (error) {
      console.error('Error emitting configuration change events:', error);
    }
  }

  /**
   * Notify change listeners
   */
  private async notifyChangeListeners(tenantId: string, event: ConfigurationChangeEvent): Promise<void> {
    try {
      const listeners = this.changeListeners.get(tenantId);
      if (listeners) {
        for (const listener of listeners) {
          try {
            listener(event);
          } catch (error) {
            console.error('Error in configuration change listener:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error notifying change listeners:', error);
    }
  }

  /**
   * Refresh configuration cache for all tenants
   */
  private async refreshConfigurationCache(): Promise<void> {
    try {
      console.log('Refreshing configuration cache...');
      
      // Get all cached tenant IDs
      const cachedTenantIds = Array.from(this.configurationCache.keys());
      
      for (const tenantId of cachedTenantIds) {
        try {
          // Remove from cache and refetch
          this.configurationCache.delete(tenantId);
          await this.getBotConfiguration(tenantId);
        } catch (error) {
          console.error(`Error refreshing cache for tenant ${tenantId}:`, error);
        }
      }
      
      console.log(`Refreshed configuration cache for ${cachedTenantIds.length} tenants`);
    } catch (error) {
      console.error('Error refreshing configuration cache:', error);
    }
  }

  /**
   * Close database connection and cleanup
   */
  async close(): Promise<void> {
    try {
      // Clear cache
      this.configurationCache.clear();
      
      // Clear listeners
      this.changeListeners.clear();
      
      // Close database connection
      await this.pool.end();
    } catch (error) {
      console.error('Error closing bot configuration service:', error);
    }
  }
}