/**
 * Enhanced WhatsApp Sender Service with Multi-Tenant Support
 * Handles sending WhatsApp messages using tenant-specific credentials
 * with message queuing, retry logic, and rate limiting
 */

import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import * as schema from '@shared/schema';
import { TenantSettingsService } from './tenant-settings.service';
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
  webhookVerifyToken?: string;
  rateLimits?: {
    messagesPerSecond: number;
    messagesPerMinute: number;
    messagesPerHour: number;
  };
}

export interface MessageQueueItem {
  id: string;
  tenantId: string;
  phoneNumber: string;
  response: BotResponse;
  attempts: number;
  maxAttempts: number;
  scheduledAt: Date;
  createdAt: Date;
  priority: 'low' | 'normal' | 'high';
  metadata?: Record<string, any>;
}

export interface RateLimitInfo {
  tenantId: string;
  messagesThisSecond: number;
  messagesThisMinute: number;
  messagesThisHour: number;
  lastResetSecond: number;
  lastResetMinute: number;
  lastResetHour: number;
}

export class WhatsAppSenderService {
  private db: ReturnType<typeof drizzle>;
  private pool: Pool;
  private tenantSettingsService: TenantSettingsService;
  private credentialsCache: Map<string, TenantWhatsAppCredentials> = new Map();
  private messageQueue: Map<string, MessageQueueItem[]> = new Map(); // tenantId -> messages
  private rateLimits: Map<string, RateLimitInfo> = new Map(); // tenantId -> rate limit info
  private processingInterval: NodeJS.Timeout | null = null;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly QUEUE_PROCESS_INTERVAL = 1000; // 1 second
  private readonly DEFAULT_RATE_LIMITS = {
    messagesPerSecond: 10,
    messagesPerMinute: 100,
    messagesPerHour: 1000,
  };

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString });
    this.db = drizzle({ client: this.pool, schema });
    this.tenantSettingsService = new TenantSettingsService(connectionString);
    
    // Start message queue processing
    this.startQueueProcessing();
  }

  // ===== MESSAGE SENDING =====

  /**
   * Send WhatsApp message using tenant-specific credentials with queuing and rate limiting
   */
  async sendMessage(
    tenantId: string,
    phoneNumber: string,
    response: BotResponse,
    options: {
      priority?: 'low' | 'normal' | 'high';
      maxAttempts?: number;
      immediate?: boolean;
    } = {}
  ): Promise<ServiceResponse<WhatsAppSendResponse | { queued: true; queueId: string }>> {
    try {
      const { priority = 'normal', maxAttempts = 3, immediate = false } = options;

      // Check if we should send immediately or queue
      if (immediate || await this.canSendImmediately(tenantId)) {
        return await this.sendMessageImmediate(tenantId, phoneNumber, response);
      }

      // Queue the message
      const queueId = await this.queueMessage(tenantId, phoneNumber, response, {
        priority,
        maxAttempts,
      });

      return {
        success: true,
        data: { queued: true, queueId },
        metadata: {
          tenantId,
          phoneNumber,
          messageType: response.messageType,
          queued: true,
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
   * Send message immediately without queuing
   */
  async sendMessageImmediate(
    tenantId: string,
    phoneNumber: string,
    response: BotResponse
  ): Promise<ServiceResponse<WhatsAppSendResponse>> {
    try {
      // Check rate limits
      if (!await this.checkRateLimit(tenantId)) {
        return {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Rate limit exceeded for tenant',
            tenantId,
          },
        };
      }

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

      // Update rate limit counters
      await this.updateRateLimit(tenantId);

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
      console.error('Error sending WhatsApp message immediately:', error);
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
   * Send bulk messages to multiple recipients with intelligent queuing
   */
  async sendBulkMessages(
    tenantId: string,
    recipients: Array<{
      phoneNumber: string;
      response: BotResponse;
      priority?: 'low' | 'normal' | 'high';
    }>,
    options: {
      batchSize?: number;
      delayBetweenBatches?: number;
    } = {}
  ): Promise<ServiceResponse<{
    successful: number;
    failed: number;
    queued: number;
    results: Array<{
      phoneNumber: string;
      success: boolean;
      messageId?: string;
      queueId?: string;
      error?: string;
    }>;
  }>> {
    try {
      const { batchSize = 10, delayBetweenBatches = 1000 } = options;
      const results = [];
      let successful = 0;
      let failed = 0;
      let queued = 0;

      // Process recipients in batches
      for (let i = 0; i < recipients.length; i += batchSize) {
        const batch = recipients.slice(i, i + batchSize);
        
        // Process batch concurrently
        const batchPromises = batch.map(async (recipient) => {
          const sendResult = await this.sendMessage(
            tenantId,
            recipient.phoneNumber,
            recipient.response,
            { priority: recipient.priority }
          );

          if (sendResult.success) {
            if ('queued' in sendResult.data! && sendResult.data.queued) {
              queued++;
              return {
                phoneNumber: recipient.phoneNumber,
                success: true,
                queueId: sendResult.data.queueId,
              };
            } else {
              successful++;
              return {
                phoneNumber: recipient.phoneNumber,
                success: true,
                messageId: (sendResult.data as WhatsAppSendResponse).messages[0]?.id,
              };
            }
          } else {
            failed++;
            return {
              phoneNumber: recipient.phoneNumber,
              success: false,
              error: sendResult.error!.message,
            };
          }
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // Add delay between batches if not the last batch
        if (i + batchSize < recipients.length) {
          await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
        }
      }

      return {
        success: true,
        data: {
          successful,
          failed,
          queued,
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

  // ===== MESSAGE QUEUING =====

  /**
   * Queue a message for later delivery
   */
  async queueMessage(
    tenantId: string,
    phoneNumber: string,
    response: BotResponse,
    options: {
      priority?: 'low' | 'normal' | 'high';
      maxAttempts?: number;
      scheduledAt?: Date;
    } = {}
  ): Promise<string> {
    const {
      priority = 'normal',
      maxAttempts = 3,
      scheduledAt = new Date(),
    } = options;

    const queueItem: MessageQueueItem = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      tenantId,
      phoneNumber,
      response,
      attempts: 0,
      maxAttempts,
      scheduledAt,
      createdAt: new Date(),
      priority,
    };

    // Add to queue
    if (!this.messageQueue.has(tenantId)) {
      this.messageQueue.set(tenantId, []);
    }

    const tenantQueue = this.messageQueue.get(tenantId)!;
    tenantQueue.push(queueItem);

    // Sort by priority and scheduled time
    tenantQueue.sort((a, b) => {
      const priorityOrder = { high: 3, normal: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return a.scheduledAt.getTime() - b.scheduledAt.getTime();
    });

    console.log(`Message queued for tenant ${tenantId}: ${queueItem.id}`);
    return queueItem.id;
  }

  /**
   * Get queue status for tenant
   */
  async getQueueStatus(tenantId: string): Promise<{
    totalMessages: number;
    pendingMessages: number;
    highPriorityMessages: number;
    normalPriorityMessages: number;
    lowPriorityMessages: number;
    oldestMessage?: Date;
  }> {
    const tenantQueue = this.messageQueue.get(tenantId) || [];
    
    return {
      totalMessages: tenantQueue.length,
      pendingMessages: tenantQueue.filter(msg => msg.attempts < msg.maxAttempts).length,
      highPriorityMessages: tenantQueue.filter(msg => msg.priority === 'high').length,
      normalPriorityMessages: tenantQueue.filter(msg => msg.priority === 'normal').length,
      lowPriorityMessages: tenantQueue.filter(msg => msg.priority === 'low').length,
      oldestMessage: tenantQueue.length > 0 ? tenantQueue[tenantQueue.length - 1].createdAt : undefined,
    };
  }

  /**
   * Clear failed messages from queue
   */
  async clearFailedMessages(tenantId: string): Promise<number> {
    const tenantQueue = this.messageQueue.get(tenantId) || [];
    const initialLength = tenantQueue.length;
    
    const activeMessages = tenantQueue.filter(msg => msg.attempts < msg.maxAttempts);
    this.messageQueue.set(tenantId, activeMessages);
    
    const removedCount = initialLength - activeMessages.length;
    console.log(`Cleared ${removedCount} failed messages for tenant ${tenantId}`);
    
    return removedCount;
  }

  // ===== RATE LIMITING =====

  /**
   * Check if tenant can send message immediately based on rate limits
   */
  async canSendImmediately(tenantId: string): Promise<boolean> {
    return await this.checkRateLimit(tenantId);
  }

  /**
   * Check rate limit for tenant
   */
  async checkRateLimit(tenantId: string): Promise<boolean> {
    const rateLimitInfo = await this.getRateLimitInfo(tenantId);
    const credentials = await this.getTenantCredentials(tenantId);
    
    const limits = credentials.success && credentials.data?.rateLimits 
      ? credentials.data.rateLimits 
      : this.DEFAULT_RATE_LIMITS;

    const now = Date.now();
    const currentSecond = Math.floor(now / 1000);
    const currentMinute = Math.floor(now / 60000);
    const currentHour = Math.floor(now / 3600000);

    // Reset counters if time periods have changed
    if (rateLimitInfo.lastResetSecond !== currentSecond) {
      rateLimitInfo.messagesThisSecond = 0;
      rateLimitInfo.lastResetSecond = currentSecond;
    }
    if (rateLimitInfo.lastResetMinute !== currentMinute) {
      rateLimitInfo.messagesThisMinute = 0;
      rateLimitInfo.lastResetMinute = currentMinute;
    }
    if (rateLimitInfo.lastResetHour !== currentHour) {
      rateLimitInfo.messagesThisHour = 0;
      rateLimitInfo.lastResetHour = currentHour;
    }

    // Check limits
    return (
      rateLimitInfo.messagesThisSecond < limits.messagesPerSecond &&
      rateLimitInfo.messagesThisMinute < limits.messagesPerMinute &&
      rateLimitInfo.messagesThisHour < limits.messagesPerHour
    );
  }

  /**
   * Update rate limit counters after sending a message
   */
  async updateRateLimit(tenantId: string): Promise<void> {
    const rateLimitInfo = await this.getRateLimitInfo(tenantId);
    rateLimitInfo.messagesThisSecond++;
    rateLimitInfo.messagesThisMinute++;
    rateLimitInfo.messagesThisHour++;
  }

  /**
   * Get rate limit info for tenant
   */
  private async getRateLimitInfo(tenantId: string): Promise<RateLimitInfo> {
    if (!this.rateLimits.has(tenantId)) {
      const now = Date.now();
      this.rateLimits.set(tenantId, {
        tenantId,
        messagesThisSecond: 0,
        messagesThisMinute: 0,
        messagesThisHour: 0,
        lastResetSecond: Math.floor(now / 1000),
        lastResetMinute: Math.floor(now / 60000),
        lastResetHour: Math.floor(now / 3600000),
      });
    }
    return this.rateLimits.get(tenantId)!;
  }

  /**
   * Get rate limit status for tenant
   */
  async getRateLimitStatus(tenantId: string): Promise<{
    messagesThisSecond: number;
    messagesThisMinute: number;
    messagesThisHour: number;
    limits: {
      messagesPerSecond: number;
      messagesPerMinute: number;
      messagesPerHour: number;
    };
    canSendNow: boolean;
  }> {
    const rateLimitInfo = await this.getRateLimitInfo(tenantId);
    const credentials = await this.getTenantCredentials(tenantId);
    
    const limits = credentials.success && credentials.data?.rateLimits 
      ? credentials.data.rateLimits 
      : this.DEFAULT_RATE_LIMITS;

    const canSendNow = await this.checkRateLimit(tenantId);

    return {
      messagesThisSecond: rateLimitInfo.messagesThisSecond,
      messagesThisMinute: rateLimitInfo.messagesThisMinute,
      messagesThisHour: rateLimitInfo.messagesThisHour,
      limits,
      canSendNow,
    };
  }

  // ===== QUEUE PROCESSING =====

  /**
   * Start processing message queue
   */
  private startQueueProcessing(): void {
    this.processingInterval = setInterval(async () => {
      await this.processMessageQueue();
    }, this.QUEUE_PROCESS_INTERVAL);
  }

  /**
   * Process message queue for all tenants
   */
  private async processMessageQueue(): Promise<void> {
    for (const [tenantId, queue] of this.messageQueue.entries()) {
      if (queue.length === 0) continue;

      // Check if tenant can send messages
      if (!await this.checkRateLimit(tenantId)) {
        continue; // Skip this tenant due to rate limits
      }

      // Get next message to process
      const messageIndex = queue.findIndex(msg => 
        msg.attempts < msg.maxAttempts && 
        msg.scheduledAt <= new Date()
      );

      if (messageIndex === -1) continue;

      const message = queue[messageIndex];
      message.attempts++;

      try {
        const result = await this.sendMessageImmediate(
          message.tenantId,
          message.phoneNumber,
          message.response
        );

        if (result.success) {
          // Remove successful message from queue
          queue.splice(messageIndex, 1);
          console.log(`Queue message sent successfully: ${message.id}`);
        } else {
          console.error(`Queue message failed (attempt ${message.attempts}/${message.maxAttempts}): ${message.id}`, result.error);
          
          // If max attempts reached, remove from queue
          if (message.attempts >= message.maxAttempts) {
            queue.splice(messageIndex, 1);
            console.error(`Queue message failed permanently: ${message.id}`);
          } else {
            // Schedule retry with exponential backoff
            const backoffDelay = Math.pow(2, message.attempts) * 1000; // 2^attempts seconds
            message.scheduledAt = new Date(Date.now() + backoffDelay);
          }
        }
      } catch (error) {
        console.error(`Error processing queue message ${message.id}:`, error);
        
        if (message.attempts >= message.maxAttempts) {
          queue.splice(messageIndex, 1);
        } else {
          const backoffDelay = Math.pow(2, message.attempts) * 1000;
          message.scheduledAt = new Date(Date.now() + backoffDelay);
        }
      }
    }
  }

  /**
   * Stop queue processing
   */
  private stopQueueProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }

  // ===== CREDENTIAL MANAGEMENT =====

  /**
   * Get tenant WhatsApp credentials from settings service
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

      // Get WhatsApp settings from tenant settings service
      const settingsResult = await this.tenantSettingsService.getSettings(tenantId, 'whatsapp');
      if (!settingsResult.success || !settingsResult.data) {
        return {
          success: false,
          error: {
            code: 'WHATSAPP_NOT_CONFIGURED',
            message: 'WhatsApp credentials not configured for tenant',
            tenantId,
          },
        };
      }

      const whatsappSettings = settingsResult.data.value as any;
      
      if (!whatsappSettings.phoneNumberId || !whatsappSettings.accessToken) {
        return {
          success: false,
          error: {
            code: 'INCOMPLETE_WHATSAPP_CONFIG',
            message: 'Incomplete WhatsApp configuration for tenant',
            tenantId,
          },
        };
      }

      const credentials: TenantWhatsAppCredentials = {
        phoneNumberId: whatsappSettings.phoneNumberId,
        accessToken: whatsappSettings.accessToken,
        businessAccountId: whatsappSettings.businessAccountId,
        webhookVerifyToken: whatsappSettings.webhookVerifyToken,
        rateLimits: whatsappSettings.rateLimits || this.DEFAULT_RATE_LIMITS,
      };

      // Cache credentials
      this.credentialsCache.set(tenantId, credentials);
      setTimeout(() => {
        this.credentialsCache.delete(tenantId);
      }, this.CACHE_TTL);

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
   * Get message delivery statistics for tenant
   */
  async getDeliveryStats(tenantId: string): Promise<{
    totalSent: number;
    totalQueued: number;
    totalFailed: number;
    rateLimitStatus: any;
    queueStatus: any;
  }> {
    const queueStatus = await this.getQueueStatus(tenantId);
    const rateLimitStatus = await this.getRateLimitStatus(tenantId);

    // In a real implementation, you would track these stats in a database
    return {
      totalSent: 0, // Would be tracked in database
      totalQueued: queueStatus.totalMessages,
      totalFailed: 0, // Would be tracked in database
      rateLimitStatus,
      queueStatus,
    };
  }

  /**
   * Retry failed messages for tenant
   */
  async retryFailedMessages(tenantId: string): Promise<ServiceResponse<{
    retriedCount: number;
    queuedCount: number;
  }>> {
    try {
      const tenantQueue = this.messageQueue.get(tenantId) || [];
      const failedMessages = tenantQueue.filter(msg => msg.attempts >= msg.maxAttempts);
      
      let retriedCount = 0;
      let queuedCount = 0;

      for (const message of failedMessages) {
        // Reset attempts and reschedule
        message.attempts = 0;
        message.maxAttempts = Math.min(message.maxAttempts + 2, 10); // Increase max attempts
        message.scheduledAt = new Date();
        
        retriedCount++;
        queuedCount++;
      }

      return {
        success: true,
        data: {
          retriedCount,
          queuedCount,
        },
      };
    } catch (error) {
      console.error('Error retrying failed messages:', error);
      return {
        success: false,
        error: {
          code: 'RETRY_FAILED',
          message: 'Failed to retry messages',
          tenantId,
        },
      };
    }
  }

  /**
   * Close service and cleanup resources
   */
  async close(): Promise<void> {
    // Stop queue processing
    this.stopQueueProcessing();
    
    // Clear caches
    this.credentialsCache.clear();
    this.messageQueue.clear();
    this.rateLimits.clear();
    
    // Close services
    await this.tenantSettingsService.close();
    await this.pool.end();
  }
}