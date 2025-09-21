/**
 * Webhook Router Service
 * Handles routing of incoming WhatsApp webhooks to appropriate tenants
 * and manages tenant identification from phone numbers
 */

import { TenantService } from './tenant.service';
import { TenantSettingsService } from './tenant-settings.service';
import type { Tenant } from '@shared/schema';

export interface WebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{
          profile: {
            name: string;
          };
          wa_id: string;
        }>;
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          text?: {
            body: string;
          };
          type: string;
        }>;
        statuses?: Array<{
          id: string;
          status: string;
          timestamp: string;
          recipient_id: string;
        }>;
      };
      field: string;
    }>;
  }>;
}

export interface TenantRouteResult {
  success: boolean;
  tenant?: Tenant;
  phoneNumberId?: string;
  error?: {
    code: string;
    message: string;
  };
}

export interface WebhookVerificationRequest {
  'hub.mode': string;
  'hub.verify_token': string;
  'hub.challenge': string;
}

export class WebhookRouterService {
  private tenantService: TenantService;
  private tenantSettingsService: TenantSettingsService;
  private phoneNumberCache: Map<string, { tenantId: string; timestamp: number }>;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(connectionString: string) {
    this.tenantService = new TenantService(connectionString);
    this.tenantSettingsService = new TenantSettingsService(connectionString);
    this.phoneNumberCache = new Map();
  }

  /**
   * Route incoming webhook to appropriate tenant
   */
  async routeWebhook(payload: WebhookPayload): Promise<TenantRouteResult> {
    try {
      // Validate webhook payload structure
      if (!this.isValidWebhookPayload(payload)) {
        return {
          success: false,
          error: {
            code: 'INVALID_WEBHOOK_PAYLOAD',
            message: 'Invalid webhook payload structure',
          },
        };
      }

      // Extract phone number ID from webhook
      const phoneNumberId = this.extractPhoneNumberId(payload);
      if (!phoneNumberId) {
        return {
          success: false,
          error: {
            code: 'PHONE_NUMBER_ID_NOT_FOUND',
            message: 'Could not extract phone number ID from webhook',
          },
        };
      }

      // Find tenant by phone number ID
      const tenant = await this.findTenantByPhoneNumberId(phoneNumberId);
      if (!tenant) {
        return {
          success: false,
          error: {
            code: 'TENANT_NOT_FOUND',
            message: `No tenant found for phone number ID: ${phoneNumberId}`,
          },
        };
      }

      return {
        success: true,
        tenant,
        phoneNumberId,
      };
    } catch (error) {
      console.error('Error routing webhook:', error);
      return {
        success: false,
        error: {
          code: 'WEBHOOK_ROUTING_ERROR',
          message: 'Failed to route webhook',
        },
      };
    }
  }

  /**
   * Verify webhook for tenant
   */
  async verifyWebhook(
    phoneNumberId: string,
    verificationRequest: WebhookVerificationRequest
  ): Promise<{ success: boolean; challenge?: string; error?: { code: string; message: string } }> {
    try {
      // Find tenant by phone number ID
      const tenant = await this.findTenantByPhoneNumberId(phoneNumberId);
      if (!tenant) {
        return {
          success: false,
          error: {
            code: 'TENANT_NOT_FOUND',
            message: 'No tenant found for phone number ID',
          },
        };
      }

      // Get tenant's WhatsApp settings
      const settingsResult = await this.tenantSettingsService.getSettings(tenant.id, 'whatsapp');
      if (!settingsResult.success || !settingsResult.data) {
        return {
          success: false,
          error: {
            code: 'WHATSAPP_SETTINGS_NOT_FOUND',
            message: 'WhatsApp settings not configured for tenant',
          },
        };
      }

      const whatsappSettings = settingsResult.data.value as any;
      const expectedVerifyToken = whatsappSettings.webhookVerifyToken;

      // Verify the webhook
      if (
        verificationRequest['hub.mode'] === 'subscribe' &&
        verificationRequest['hub.verify_token'] === expectedVerifyToken
      ) {
        return {
          success: true,
          challenge: verificationRequest['hub.challenge'],
        };
      }

      return {
        success: false,
        error: {
          code: 'WEBHOOK_VERIFICATION_FAILED',
          message: 'Webhook verification failed - invalid verify token',
        },
      };
    } catch (error) {
      console.error('Error verifying webhook:', error);
      return {
        success: false,
        error: {
          code: 'WEBHOOK_VERIFICATION_ERROR',
          message: 'Failed to verify webhook',
        },
      };
    }
  }

  /**
   * Register phone number ID for tenant
   */
  async registerPhoneNumberId(tenantId: string, phoneNumberId: string): Promise<{ success: boolean; error?: { code: string; message: string } }> {
    try {
      // Verify tenant exists
      const tenantResult = await this.tenantService.getTenant(tenantId);
      if (!tenantResult.success) {
        return {
          success: false,
          error: {
            code: 'TENANT_NOT_FOUND',
            message: 'Tenant not found',
          },
        };
      }

      // Store phone number ID in tenant settings
      const phoneNumberMapping = {
        phoneNumberId,
        registeredAt: new Date().toISOString(),
        status: 'active',
      };

      const settingsResult = await this.tenantSettingsService.updateSettings(
        tenantId,
        'whatsapp_phone_mapping',
        phoneNumberMapping
      );

      if (!settingsResult.success) {
        return {
          success: false,
          error: {
            code: 'PHONE_NUMBER_REGISTRATION_FAILED',
            message: 'Failed to register phone number ID',
          },
        };
      }

      // Update cache
      this.phoneNumberCache.set(phoneNumberId, {
        tenantId,
        timestamp: Date.now(),
      });

      return { success: true };
    } catch (error) {
      console.error('Error registering phone number ID:', error);
      return {
        success: false,
        error: {
          code: 'PHONE_NUMBER_REGISTRATION_ERROR',
          message: 'Failed to register phone number ID',
        },
      };
    }
  }

  /**
   * Get tenant routing statistics
   */
  async getRoutingStats(tenantId: string): Promise<{
    success: boolean;
    data?: {
      totalWebhooks: number;
      successfulRoutes: number;
      failedRoutes: number;
      lastWebhookAt?: string;
    };
    error?: { code: string; message: string };
  }> {
    try {
      // This would typically query a metrics/analytics table
      // For now, return mock data structure
      return {
        success: true,
        data: {
          totalWebhooks: 0,
          successfulRoutes: 0,
          failedRoutes: 0,
        },
      };
    } catch (error) {
      console.error('Error getting routing stats:', error);
      return {
        success: false,
        error: {
          code: 'ROUTING_STATS_ERROR',
          message: 'Failed to get routing statistics',
        },
      };
    }
  }

  /**
   * Validate webhook payload structure
   */
  private isValidWebhookPayload(payload: any): payload is WebhookPayload {
    return (
      payload &&
      typeof payload === 'object' &&
      payload.object === 'whatsapp_business_account' &&
      Array.isArray(payload.entry) &&
      payload.entry.length > 0 &&
      payload.entry[0].changes &&
      Array.isArray(payload.entry[0].changes) &&
      payload.entry[0].changes.length > 0
    );
  }

  /**
   * Extract phone number ID from webhook payload
   */
  private extractPhoneNumberId(payload: WebhookPayload): string | null {
    try {
      const change = payload.entry[0]?.changes[0];
      return change?.value?.metadata?.phone_number_id || null;
    } catch (error) {
      console.error('Error extracting phone number ID:', error);
      return null;
    }
  }

  /**
   * Find tenant by phone number ID with caching
   */
  private async findTenantByPhoneNumberId(phoneNumberId: string): Promise<Tenant | null> {
    try {
      // Check cache first
      const cached = this.phoneNumberCache.get(phoneNumberId);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        const tenantResult = await this.tenantService.getTenant(cached.tenantId);
        if (tenantResult.success) {
          return tenantResult.data!;
        }
      }

      // Search all tenants for matching phone number ID
      const tenantsResult = await this.tenantService.listTenants({ page: 1, limit: 1000 });
      if (!tenantsResult.success) {
        return null;
      }

      for (const tenant of tenantsResult.data!.data) {
        const settingsResult = await this.tenantSettingsService.getSettings(tenant.id, 'whatsapp_phone_mapping');
        if (settingsResult.success && settingsResult.data) {
          const mapping = settingsResult.data.value as any;
          if (mapping.phoneNumberId === phoneNumberId && mapping.status === 'active') {
            // Update cache
            this.phoneNumberCache.set(phoneNumberId, {
              tenantId: tenant.id,
              timestamp: Date.now(),
            });
            return tenant;
          }
        }
      }

      return null;
    } catch (error) {
      console.error('Error finding tenant by phone number ID:', error);
      return null;
    }
  }

  /**
   * Clear expired cache entries
   */
  private clearExpiredCache(): void {
    const now = Date.now();
    for (const [phoneNumberId, entry] of this.phoneNumberCache.entries()) {
      if (now - entry.timestamp > this.CACHE_TTL) {
        this.phoneNumberCache.delete(phoneNumberId);
      }
    }
  }

  /**
   * Close service and cleanup resources
   */
  async close(): Promise<void> {
    await this.tenantService.close();
    await this.tenantSettingsService.close();
    this.phoneNumberCache.clear();
  }
}