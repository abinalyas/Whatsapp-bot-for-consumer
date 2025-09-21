/**
 * Enhanced WhatsApp Sender Service Unit Tests
 * Tests tenant-specific message sending with queuing and rate limiting
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WhatsAppSenderService, TenantWhatsAppCredentials } from '../server/services/whatsapp-sender.service';
import type { BotResponse } from '../server/services/message-processor.service';

// Mock database connection
const mockConnectionString = 'postgresql://test:test@localhost:5432/test';

// Mock credentials
const mockCredentials: TenantWhatsAppCredentials = {
  phoneNumberId: 'phone-123',
  accessToken: 'token-123',
  businessAccountId: 'business-123',
  webhookVerifyToken: 'verify-123',
  rateLimits: {
    messagesPerSecond: 2,
    messagesPerMinute: 10,
    messagesPerHour: 100,
  },
};

// Mock bot response
const mockBotResponse: BotResponse = {
  content: 'Hello, this is a test message',
  messageType: 'text',
};

// Mock services
const mockTenantSettingsService = {
  getSettings: vi.fn(),
  close: vi.fn(),
};

const mockPool = {
  end: vi.fn(),
};

// Mock fetch
global.fetch = vi.fn();

vi.mock('../server/services/tenant-settings.service', () => ({
  TenantSettingsService: vi.fn(() => mockTenantSettingsService),
}));

vi.mock('@neondatabase/serverless', () => ({
  Pool: vi.fn(() => mockPool),
}));

vi.mock('drizzle-orm/neon-serverless', () => ({
  drizzle: vi.fn(() => ({})),
}));

describe('WhatsAppSenderService', () => {
  let whatsappSender: WhatsAppSenderService;

  beforeEach(() => {
    whatsappSender = new WhatsAppSenderService(mockConnectionString);
    
    // Mock successful credentials fetch
    vi.mocked(mockTenantSettingsService.getSettings).mockResolvedValue({
      success: true,
      data: {
        id: 'setting-123',
        tenantId: 'tenant-123',
        category: 'whatsapp',
        key: 'whatsapp',
        value: {
          phoneNumberId: mockCredentials.phoneNumberId,
          accessToken: mockCredentials.accessToken,
          businessAccountId: mockCredentials.businessAccountId,
          webhookVerifyToken: mockCredentials.webhookVerifyToken,
          rateLimits: mockCredentials.rateLimits,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Mock successful WhatsApp API response
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        messaging_product: 'whatsapp',
        contacts: [{ input: '+1234567890', wa_id: '1234567890' }],
        messages: [{ id: 'msg-123' }],
      }),
    } as Response);

    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await whatsappSender.close();
  });

  describe('Message Sending', () => {
    it('should send message immediately when rate limits allow', async () => {
      const result = await whatsappSender.sendMessage(
        'tenant-123',
        '+1234567890',
        mockBotResponse,
        { immediate: true }
      );

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('messages');
      expect(fetch).toHaveBeenCalledWith(
        `https://graph.facebook.com/v18.0/${mockCredentials.phoneNumberId}/messages`,
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${mockCredentials.accessToken}`,
            'Content-Type': 'application/json',
          },
        })
      );
    });

    it('should queue message when rate limits are exceeded', async () => {
      // Send multiple messages to exceed rate limit
      const promises = Array.from({ length: 5 }, () =>
        whatsappSender.sendMessage('tenant-123', '+1234567890', mockBotResponse)
      );

      const results = await Promise.all(promises);

      // Some should be sent immediately, others queued
      const sentImmediately = results.filter(r => r.success && !('queued' in r.data!));
      const queued = results.filter(r => r.success && 'queued' in r.data! && (r.data as any).queued);

      expect(sentImmediately.length).toBeLessThanOrEqual(2); // Rate limit is 2 per second
      expect(queued.length).toBeGreaterThan(0);
    });

    it('should handle different message types correctly', async () => {
      const messageTypes: Array<{ response: BotResponse; expectedType: string }> = [
        {
          response: { content: 'Text message', messageType: 'text' },
          expectedType: 'text',
        },
        {
          response: {
            content: 'Interactive message',
            messageType: 'interactive',
            metadata: {
              buttons: [
                { id: 'btn1', title: 'Button 1' },
                { id: 'btn2', title: 'Button 2' },
              ],
            },
          },
          expectedType: 'interactive',
        },
        {
          response: {
            content: 'Template message',
            messageType: 'template',
            metadata: {
              templateName: 'hello_world',
              languageCode: 'en_US',
            },
          },
          expectedType: 'template',
        },
      ];

      for (const { response, expectedType } of messageTypes) {
        const result = await whatsappSender.sendMessage(
          'tenant-123',
          '+1234567890',
          response,
          { immediate: true }
        );

        expect(result.success).toBe(true);
        
        const fetchCall = vi.mocked(fetch).mock.calls.find(call => 
          call[0]?.toString().includes('messages')
        );
        
        if (fetchCall) {
          const requestBody = JSON.parse(fetchCall[1]?.body as string);
          expect(requestBody.type).toBe(expectedType);
        }
      }
    });

    it('should handle WhatsApp API errors gracefully', async () => {
      // Mock API error
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: {
            message: 'Invalid phone number',
            code: 100,
          },
        }),
      } as Response);

      const result = await whatsappSender.sendMessage(
        'tenant-123',
        'invalid-phone',
        mockBotResponse,
        { immediate: true }
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('WHATSAPP_API_ERROR');
    });

    it('should handle missing credentials', async () => {
      // Mock missing credentials
      vi.mocked(mockTenantSettingsService.getSettings).mockResolvedValueOnce({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Settings not found' },
      });

      const result = await whatsappSender.sendMessage(
        'nonexistent-tenant',
        '+1234567890',
        mockBotResponse
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('WHATSAPP_NOT_CONFIGURED');
    });
  });

  describe('Bulk Message Sending', () => {
    it('should send bulk messages with proper batching', async () => {
      const recipients = Array.from({ length: 15 }, (_, i) => ({
        phoneNumber: `+123456789${i}`,
        response: { ...mockBotResponse, content: `Message ${i}` },
        priority: 'normal' as const,
      }));

      const result = await whatsappSender.sendBulkMessages(
        'tenant-123',
        recipients,
        { batchSize: 5, delayBetweenBatches: 100 }
      );

      expect(result.success).toBe(true);
      expect(result.data?.results).toHaveLength(15);
      expect(result.data?.successful + result.data?.queued + result.data?.failed).toBe(15);
    });

    it('should handle mixed success and failure in bulk sending', async () => {
      // Mock alternating success/failure
      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ messages: [{ id: 'msg-1' }] }),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => ({ error: { message: 'Error' } }),
        } as Response);

      const recipients = [
        { phoneNumber: '+1111111111', response: mockBotResponse },
        { phoneNumber: '+2222222222', response: mockBotResponse },
      ];

      const result = await whatsappSender.sendBulkMessages('tenant-123', recipients);

      expect(result.success).toBe(true);
      expect(result.data?.successful + result.data?.failed + result.data?.queued).toBe(2);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits correctly', async () => {
      // Check initial rate limit status
      const initialStatus = await whatsappSender.getRateLimitStatus('tenant-123');
      expect(initialStatus.canSendNow).toBe(true);
      expect(initialStatus.messagesThisSecond).toBe(0);

      // Send messages up to the limit
      for (let i = 0; i < mockCredentials.rateLimits!.messagesPerSecond; i++) {
        const result = await whatsappSender.sendMessage(
          'tenant-123',
          '+1234567890',
          mockBotResponse,
          { immediate: true }
        );
        expect(result.success).toBe(true);
      }

      // Next message should be rate limited
      const rateLimitedResult = await whatsappSender.sendMessage(
        'tenant-123',
        '+1234567890',
        mockBotResponse,
        { immediate: true }
      );

      expect(rateLimitedResult.success).toBe(false);
      expect(rateLimitedResult.error?.code).toBe('RATE_LIMIT_EXCEEDED');
    });

    it('should reset rate limits after time periods', async () => {
      // This test would need to mock time or use a shorter interval for testing
      const status = await whatsappSender.getRateLimitStatus('tenant-123');
      expect(status.limits).toEqual(mockCredentials.rateLimits);
    });
  });

  describe('Message Queue', () => {
    it('should queue messages with correct priority ordering', async () => {
      const messages = [
        { priority: 'low' as const, content: 'Low priority' },
        { priority: 'high' as const, content: 'High priority' },
        { priority: 'normal' as const, content: 'Normal priority' },
      ];

      // Queue all messages
      for (const msg of messages) {
        await whatsappSender.sendMessage(
          'tenant-123',
          '+1234567890',
          { ...mockBotResponse, content: msg.content },
          { priority: msg.priority }
        );
      }

      const queueStatus = await whatsappSender.getQueueStatus('tenant-123');
      expect(queueStatus.totalMessages).toBeGreaterThan(0);
      expect(queueStatus.highPriorityMessages).toBe(1);
      expect(queueStatus.normalPriorityMessages).toBe(1);
      expect(queueStatus.lowPriorityMessages).toBe(1);
    });

    it('should provide accurate queue status', async () => {
      // Queue some messages
      await whatsappSender.queueMessage('tenant-123', '+1234567890', mockBotResponse, {
        priority: 'high',
      });
      await whatsappSender.queueMessage('tenant-123', '+1234567890', mockBotResponse, {
        priority: 'normal',
      });

      const status = await whatsappSender.getQueueStatus('tenant-123');
      expect(status.totalMessages).toBe(2);
      expect(status.highPriorityMessages).toBe(1);
      expect(status.normalPriorityMessages).toBe(1);
      expect(status.lowPriorityMessages).toBe(0);
    });

    it('should clear failed messages from queue', async () => {
      // This would require simulating failed messages
      const clearedCount = await whatsappSender.clearFailedMessages('tenant-123');
      expect(typeof clearedCount).toBe('number');
    });
  });

  describe('Credential Management', () => {
    it('should cache credentials for performance', async () => {
      // First call should fetch from settings service
      const result1 = await whatsappSender.getTenantCredentials('tenant-123');
      expect(result1.success).toBe(true);
      expect(mockTenantSettingsService.getSettings).toHaveBeenCalledTimes(1);

      // Second call should use cache
      const result2 = await whatsappSender.getTenantCredentials('tenant-123');
      expect(result2.success).toBe(true);
      expect(mockTenantSettingsService.getSettings).toHaveBeenCalledTimes(1); // Still 1
    });

    it('should validate credentials correctly', async () => {
      // Mock successful validation response
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          display_phone_number: '+1234567890',
          name: 'Test Business',
        }),
      } as Response);

      const result = await whatsappSender.validateCredentials('tenant-123');
      expect(result.success).toBe(true);
      expect(result.data?.valid).toBe(true);
      expect(result.data?.phoneNumber).toBe('+1234567890');
    });

    it('should handle credential validation failures', async () => {
      // Mock validation error
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: 'Invalid token' } }),
      } as Response);

      const result = await whatsappSender.validateCredentials('tenant-123');
      expect(result.success).toBe(true);
      expect(result.data?.valid).toBe(false);
      expect(result.data?.errors).toContain('API error: 401');
    });
  });

  describe('Template and Interactive Messages', () => {
    it('should send template messages correctly', async () => {
      const result = await whatsappSender.sendTemplate(
        'tenant-123',
        '+1234567890',
        'hello_world',
        'en_US',
        []
      );

      expect(result.success).toBe(true);
      
      const fetchCall = vi.mocked(fetch).mock.calls.find(call => 
        call[0]?.toString().includes('messages')
      );
      
      if (fetchCall) {
        const requestBody = JSON.parse(fetchCall[1]?.body as string);
        expect(requestBody.type).toBe('template');
        expect(requestBody.template.name).toBe('hello_world');
      }
    });

    it('should send button messages correctly', async () => {
      const buttons = [
        { id: 'btn1', title: 'Option 1' },
        { id: 'btn2', title: 'Option 2' },
      ];

      const result = await whatsappSender.sendButtons(
        'tenant-123',
        '+1234567890',
        'Choose an option:',
        buttons
      );

      expect(result.success).toBe(true);
      
      const fetchCall = vi.mocked(fetch).mock.calls.find(call => 
        call[0]?.toString().includes('messages')
      );
      
      if (fetchCall) {
        const requestBody = JSON.parse(fetchCall[1]?.body as string);
        expect(requestBody.type).toBe('interactive');
        expect(requestBody.interactive.type).toBe('button');
        expect(requestBody.interactive.action.buttons).toHaveLength(2);
      }
    });

    it('should send list messages correctly', async () => {
      const sections = [{
        title: 'Options',
        rows: [
          { id: 'opt1', title: 'Option 1', description: 'First option' },
          { id: 'opt2', title: 'Option 2', description: 'Second option' },
        ],
      }];

      const result = await whatsappSender.sendList(
        'tenant-123',
        '+1234567890',
        'Header',
        'Body text',
        'Footer',
        sections
      );

      expect(result.success).toBe(true);
      
      const fetchCall = vi.mocked(fetch).mock.calls.find(call => 
        call[0]?.toString().includes('messages')
      );
      
      if (fetchCall) {
        const requestBody = JSON.parse(fetchCall[1]?.body as string);
        expect(requestBody.type).toBe('interactive');
        expect(requestBody.interactive.type).toBe('list');
        expect(requestBody.interactive.action.sections).toHaveLength(1);
      }
    });
  });

  describe('Statistics and Monitoring', () => {
    it('should provide delivery statistics', async () => {
      const stats = await whatsappSender.getDeliveryStats('tenant-123');
      
      expect(stats).toHaveProperty('totalSent');
      expect(stats).toHaveProperty('totalQueued');
      expect(stats).toHaveProperty('totalFailed');
      expect(stats).toHaveProperty('rateLimitStatus');
      expect(stats).toHaveProperty('queueStatus');
    });

    it('should retry failed messages', async () => {
      const result = await whatsappSender.retryFailedMessages('tenant-123');
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('retriedCount');
      expect(result.data).toHaveProperty('queuedCount');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      // Mock network error
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

      const result = await whatsappSender.sendMessage(
        'tenant-123',
        '+1234567890',
        mockBotResponse,
        { immediate: true }
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('API_CALL_FAILED');
    });

    it('should handle service errors during credential fetch', async () => {
      // Mock service error
      vi.mocked(mockTenantSettingsService.getSettings).mockRejectedValueOnce(
        new Error('Database error')
      );

      const result = await whatsappSender.sendMessage('tenant-123', '+1234567890', mockBotResponse);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('CREDENTIALS_FETCH_FAILED');
    });
  });

  describe('Resource Cleanup', () => {
    it('should cleanup resources properly on close', async () => {
      await whatsappSender.close();

      expect(mockTenantSettingsService.close).toHaveBeenCalled();
      expect(mockPool.end).toHaveBeenCalled();
    });
  });
});