/**
 * WhatsApp Sender Service with Multi-Tenant Support
 * Handles sending WhatsApp messages using tenant-specific credentials
 */

import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import * as schema from '@shared/schema';
import type { ServiceResponse } from '@shared/types/tenant';
import type { BotResponse } from './message-processor.service';

export interface WhatsAppSendRequest {
  messaging_product: 'whatsapp';
  to: string;
  type: 'text' | 'interactive' | 'template';
  text?: {
    body: string;
  };
  interactive?: {
    type: 'button' | 'list';
    header?: {
      type: 'text';
      text: string;
    };
    body: {
      text: string;
    };
    footer?: {
      text: string;
    };
    action: {
      buttons?: Array<{
        type: 'reply';
        reply: {
          id: string;
          title: string;
        };
      }>;
      sections?: Array<{
        title: string;
        rows: Array<{
          id: string;
          title: string;
          description?: string;
        }>;
      }>;
    };
  };
  template?: {
    name: string;
    language: {
      code: string;
    };
    components?: Array<{
      type: string;
      parameters: Array<{
        type: string;
        text: string;
      }>;
    }>;
  };
}

export interface WhatsAppSendResponse {
  messaging_product: string;
  contacts: Array<{
    input: string;
    wa_id: string;
  }>;
  messages: Array<{
    id: string;
  }>;
}

export interface TenantWhatsAppCredentials {
  phoneNumberId: string;
  accessToken: string;
  businessAccountId?: string;
}

export class WhatsAppSenderService {
  private db: ReturnType<typeof drizzle>;
  private pool: Pool;
  private credentialsCache: Map<string, TenantWhatsAppCredentials> = new Map();

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString });
    this.db = drizzle({ client: this.pool, schema });
  }

  // ===== MESSAGE SENDING =====

  /**
   * Send WhatsApp message using tenant-specific credentials
   */
  async sendMessage(
    tenantId: string,
    phoneNumber: string,
    response: BotResponse
  ): Promise<ServiceResponse<WhatsAppSendResponse>> {
    try {
      // Get tenant credentials
      const credentialsResult = await this.getTenantCredentials(tenantId);
      if (!credentialsResult.success) {
        return {
          success: false,
          error: credentialsResult.error!,
        };
      }

      const credentials = credentialsResult.data!;

      // Build WhatsApp API request
      const sendRequest = this.buildSendRequest(phoneNumber, response);

      // Send message via WhatsApp API
      const sendResult = await this.sendToWhatsAppAPI(credentials, sendRequest);

      if (!sendResult.success) {
        return {
          success: false,
          error: sendResult.error!,
        };
      }

      // Log successful send
      console.log(`Message sent successfully to ${phoneNumber} for tenant ${tenantId}`);

      return {
        success: true,
        data: sendResult.data!,
        metadata: {
          tenantId,
          phoneNumber,
          messageType: response.messageType,
        },
      };

    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      return {
        success: false,
        error: {
          code: 'MESSAGE_SEND_FAILED',
          message: 'Failed to send WhatsApp message',
          tenantId,
        },
      };
    }
  }

  /**
   * Send bulk messages to multiple recipients
   */
  async sendBulkMessages(
    tenantId: string,
    recipients: Array<{
      phoneNumber: string;
      response: BotResponse;
    }>
  ): Promise<ServiceResponse<{
    successful: number;
    failed: number;
    results: Array<{
      phoneNumber: string;
      success: boolean;
      messageId?: string;
      error?: string;
    }>;
  }>> {
    try {
      const results = [];
      let successful = 0;
      let failed = 0;

      for (const recipient of recipients) {
        const sendResult = await this.sendMessage(
          tenantId,
          recipient.phoneNumber,
          recipient.response
        );

        if (sendResult.success) {
          successful++;
          results.push({
            phoneNumber: recipient.phoneNumber,
            success: true,
            messageId: sendResult.data!.messages[0]?.id,
          });
        } else {
          failed++;
          results.push({
            phoneNumber: recipient.phoneNumber,
            success: false,
            error: sendResult.error!.message,
          });
        }

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      return {
        success: true,
        data: {
          successful,
          failed,
          results,
        },
      };

    } catch (error) {
      console.error('Error sending bulk messages:', error);
      return {
        success: false,
        error: {
          code: 'BULK_SEND_FAILED',
          message: 'Failed to send bulk messages',
          tenantId,
        },
      };
    }
  }

  // ===== CREDENTIAL MANAGEMENT =====

  /**
   * Get tenant WhatsApp credentials
   */
  async getTenantCredentials(tenantId: string): Promise<ServiceResponse<TenantWhatsAppCredentials>> {
    try {
      // Check cache first
      if (this.credentialsCache.has(tenantId)) {
        return {
          success: true,
          data: this.credentialsCache.get(tenantId)!,
        };
      }

      // Get from database
      const [tenant] = await this.db
        .select()
        .from(schema.tenants)
        .where(eq(schema.tenants.id, tenantId))
        .limit(1);

      if (!tenant) {
        return {
          success: false,
          error: {
            code: 'TENANT_NOT_FOUND',
            message: 'Tenant not found',
            tenantId,
          },
        };
      }

      if (!tenant.whatsappPhoneId || !tenant.whatsappToken) {
        return {
          success: false,
          error: {
            code: 'WHATSAPP_NOT_CONFIGURED',
            message: 'WhatsApp credentials not configured for tenant',
            tenantId,
          },
        };
      }

      const credentials: TenantWhatsAppCredentials = {
        phoneNumberId: tenant.whatsappPhoneId,
        accessToken: tenant.whatsappToken,
      };

      // Cache credentials for 5 minutes
      this.credentialsCache.set(tenantId, credentials);
      setTimeout(() => {
        this.credentialsCache.delete(tenantId);
      }, 5 * 60 * 1000);

      return {
        success: true,
        data: credentials,
      };

    } catch (error) {
      console.error('Error getting tenant credentials:', error);
      return {
        success: false,
        error: {
          code: 'CREDENTIALS_FETCH_FAILED',
          message: 'Failed to fetch tenant credentials',
          tenantId,
        },
      };
    }
  }

  /**
   * Validate tenant WhatsApp credentials
   */
  async validateCredentials(tenantId: string): Promise<ServiceResponse<{
    valid: boolean;
    phoneNumber?: string;
    businessName?: string;
    errors?: string[];
  }>> {
    try {
      const credentialsResult = await this.getTenantCredentials(tenantId);
      if (!credentialsResult.success) {
        return {
          success: true,
          data: {
            valid: false,
            errors: [credentialsResult.error!.message],
          },
        };
      }

      const credentials = credentialsResult.data!;

      // Test credentials by making a simple API call
      const testResult = await this.testWhatsAppConnection(credentials);

      return {
        success: true,
        data: testResult,
      };

    } catch (error) {
      console.error('Error validating credentials:', error);
      return {
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Failed to validate credentials',
          tenantId,
        },
      };
    }
  }

  // ===== WHATSAPP API INTEGRATION =====

  /**
   * Build WhatsApp API send request from bot response
   */
  private buildSendRequest(phoneNumber: string, response: BotResponse): WhatsAppSendRequest {
    const baseRequest: WhatsAppSendRequest = {
      messaging_product: 'whatsapp',
      to: phoneNumber,
      type: response.messageType,
    };

    switch (response.messageType) {
      case 'text':
        return {
          ...baseRequest,
          text: {
            body: response.content,
          },
        };

      case 'interactive':
        if (response.metadata?.buttons) {
          return {
            ...baseRequest,
            interactive: {
              type: 'button',
              body: {
                text: response.content,
              },
              action: {
                buttons: response.metadata.buttons.map(button => ({
                  type: 'reply',
                  reply: {
                    id: button.id,
                    title: button.title,
                  },
                })),
              },
            },
          };
        } else if (response.metadata?.list) {
          return {
            ...baseRequest,
            interactive: {
              type: 'list',
              header: response.metadata.list.header ? {
                type: 'text',
                text: response.metadata.list.header,
              } : undefined,
              body: {
                text: response.metadata.list.body,
              },
              footer: response.metadata.list.footer ? {
                text: response.metadata.list.footer,
              } : undefined,
              action: {
                sections: response.metadata.list.sections,
              },
            },
          };
        }
        break;

      case 'template':
        return {
          ...baseRequest,
          template: {
            name: response.metadata?.templateName || 'hello_world',
            language: {
              code: response.metadata?.languageCode || 'en_US',
            },
            components: response.metadata?.components || [],
          },
        };
    }

    // Fallback to text message
    return {
      ...baseRequest,
      type: 'text',
      text: {
        body: response.content,
      },
    };
  }

  /**
   * Send request to WhatsApp API
   */
  private async sendToWhatsAppAPI(
    credentials: TenantWhatsAppCredentials,
    sendRequest: WhatsAppSendRequest
  ): Promise<ServiceResponse<WhatsAppSendResponse>> {
    try {
      const url = `https://graph.facebook.com/v18.0/${credentials.phoneNumberId}/messages`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${credentials.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sendRequest),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('WhatsApp API error:', response.status, errorData);

        return {
          success: false,
          error: {
            code: 'WHATSAPP_API_ERROR',
            message: `WhatsApp API error: ${response.status}`,
            details: errorData,
          },
        };
      }

      const responseData: WhatsAppSendResponse = await response.json();

      return {
        success: true,
        data: responseData,
      };

    } catch (error) {
      console.error('Error calling WhatsApp API:', error);
      return {
        success: false,
        error: {
          code: 'API_CALL_FAILED',
          message: 'Failed to call WhatsApp API',
        },
      };
    }
  }

  /**
   * Test WhatsApp connection
   */
  private async testWhatsAppConnection(
    credentials: TenantWhatsAppCredentials
  ): Promise<{
    valid: boolean;
    phoneNumber?: string;
    businessName?: string;
    errors?: string[];
  }> {
    try {
      const url = `https://graph.facebook.com/v18.0/${credentials.phoneNumberId}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${credentials.accessToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          valid: false,
          errors: [`API error: ${response.status}`, JSON.stringify(errorData)],
        };
      }

      const data = await response.json();

      return {
        valid: true,
        phoneNumber: data.display_phone_number,
        businessName: data.name,
      };

    } catch (error) {
      return {
        valid: false,
        errors: [`Connection test failed: ${error}`],
      };
    }
  }

  // ===== MESSAGE TEMPLATES =====

  /**
   * Send template message
   */
  async sendTemplate(
    tenantId: string,
    phoneNumber: string,
    templateName: string,
    languageCode: string = 'en_US',
    components: any[] = []
  ): Promise<ServiceResponse<WhatsAppSendResponse>> {
    const templateResponse: BotResponse = {
      content: '',
      messageType: 'template',
      metadata: {
        templateName,
        languageCode,
        components,
      },
    };

    return this.sendMessage(tenantId, phoneNumber, templateResponse);
  }

  /**
   * Send interactive button message
   */
  async sendButtons(
    tenantId: string,
    phoneNumber: string,
    text: string,
    buttons: Array<{ id: string; title: string }>
  ): Promise<ServiceResponse<WhatsAppSendResponse>> {
    const buttonResponse: BotResponse = {
      content: text,
      messageType: 'interactive',
      metadata: {
        buttons,
      },
    };

    return this.sendMessage(tenantId, phoneNumber, buttonResponse);
  }

  /**
   * Send interactive list message
   */
  async sendList(
    tenantId: string,
    phoneNumber: string,
    header: string,
    body: string,
    footer: string,
    sections: Array<{
      title: string;
      rows: Array<{
        id: string;
        title: string;
        description?: string;
      }>;
    }>
  ): Promise<ServiceResponse<WhatsAppSendResponse>> {
    const listResponse: BotResponse = {
      content: body,
      messageType: 'interactive',
      metadata: {
        list: {
          header,
          body,
          footer,
          sections,
        },
      },
    };

    return this.sendMessage(tenantId, phoneNumber, listResponse);
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}