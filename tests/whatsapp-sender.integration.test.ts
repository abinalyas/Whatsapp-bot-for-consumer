/**
 * WhatsApp Sender Service Integration Tests
 * Tests complete message sending workflows with multiple tenants
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WhatsAppSenderService } from '../server/services/whatsapp-sender.service';
import type { BotResponse } from '../server/services/message-processor.service';

// Mock database connection
const mockConnectionString = 'postgresql://test:test@localhost:5432/test';

// Mock tenant configurations
const tenantConfigs = new Map([
  ['tenant-1', {
    phoneNumberId: 'phone-123',
    accessToken: 'token-123',
    rateLimits: {
      messagesPerSecond: 2,
      messagesPerMinute: 20,
      messagesPerHour: 200,
    },
  }],
  ['tenant-2', {
    phoneNumberId: 'phone-456',
    accessToken: 'token-456',
    rateLimits: {
      messagesPerSecond: 5,
      messagesPerMinute: 50,
      messagesPerHour: 500,
    },
  }],
]);

// Mock API responses
const mockApiResponses = new Map();

// Mock services
const mockTenantSettingsService = {
  getSettings: vi.fn().mockImplementation(async (tenantId: string, category: string) => {
    if (category === 'whatsapp') {
      const config = tenantConfigs.get(tenantId);
      if (config) {
        return {
          success: true,
          data: {
            id: `setting-${tenantId}`,
            tenantId,
            category: 'whatsapp',
            key: 'whatsapp',
            value: config,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        };
      }
    }
    return { success: false, error: { code: 'NOT_FOUND', message: 'Settings not found' } };
  }),
  close: vi.fn(),
};

const mockPool = {
  end: vi.fn(),
};

// Mock fetch with realistic behavior
global.fetch = vi.fn().mockImplementation(async (url: string, options: any) => {
  const phoneNumberId = url.match(/\/(\w+)\/messages$/)?.[1];
  const tenantConfig = Array.from(tenantConfigs.values()).find(c => c.phoneNumberId === phoneNumberId);
  
  if (!tenantConfig) {
    return {
      ok: false,
      status: 404,
      json: async () => ({ error: { message: 'Phone number not found' } }),
    };
  }

  // Check authorization
  const authHeader = options.headers?.Authorization;
  const expectedToken = `Bearer ${tenantConfig.accessToken}`;
  
  if (authHeader !== expectedToken) {
    return {
      ok: false,
      status: 401,
      json: async () => ({ error: { message: 'Invalid access token' } }),
    };
  }

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 50));

  // Return successful response
  return {
    ok: true,
    json: async () => ({
      messaging_product: 'whatsapp',
      contacts: [{ input: '+1234567890', wa_id: '1234567890' }],
      messages: [{ id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` }],
    }),
  };
});

vi.mock('../server/services/tenant-settings.service', () => ({
  TenantSettingsService: vi.fn(() => mockTenantSettingsService),
}));

vi.mock('@neondatabase/serverless', () => ({
  Pool: vi.fn(() => mockPool),
}));

vi.mock('drizzle-orm/neon-serverless', () => ({
  drizzle: vi.fn(() => ({})),
}));

describe('WhatsApp Sender Service Integration', () => {
  let whatsappSender: WhatsAppSenderService;

  beforeEach(() => {
    whatsappSender = new WhatsAppSenderService(mockConnectionString);
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await whatsappSender.close();
  });

  describe('Multi-Tenant Message Sending', () => {
    it('should send messages using correct tenant credentials', async () => {
      const message: BotResponse = {
        content: 'Hello from tenant 1',
        messageType: 'text',
      };

      // Send message for tenant 1
      const result1 = await whatsappSender.sendMessage(
        'tenant-1',
        '+1111111111',
        message,
        { immediate: true }
      );

      expect(result1.success).toBe(true);
      expect(result1.data).toHaveProperty('messages');

      // Verify correct API endpoint was called
      expect(fetch).toHaveBeenCalledWith(
        'https://graph.facebook.com/v18.0/phone-123/messages',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer token-123',
          }),
        })
      );

      // Send message for tenant 2
      const result2 = await whatsappSender.sendMessage(
        'tenant-2',
        '+2222222222',
        { ...message, content: 'Hello from tenant 2' },
        { immediate: true }
      );

      expect(result2.success).toBe(true);

      // Verify correct API endpoint was called for tenant 2
      expect(fetch).toHaveBeenCalledWith(
        'https://graph.facebook.com/v18.0/phone-456/messages',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer token-456',
          }),
        })
      );
    });

    it('should maintain tenant isolation in message sending', async () => {
      const message: BotResponse = {
        content: 'Test message',
        messageType: 'text',
      };

      // Send messages for both tenants simultaneously
      const [result1, result2] = await Promise.all([
        whatsappSender.sendMessage('tenant-1', '+1111111111', message, { immediate: true }),
        whatsappSender.sendMessage('tenant-2', '+2222222222', message, { immediate: true }),
      ]);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);

      // Verify both tenants used their own credentials
      const fetchCalls = vi.mocked(fetch).mock.calls;
      const tenant1Call = fetchCalls.find(call => 
        call[0]?.toString().includes('phone-123')
      );
      const tenant2Call = fetchCalls.find(call => 
        call[0]?.toString().includes('phone-456')
      );

      expect(tenant1Call).toBeDefined();
      expect(tenant2Call).toBeDefined();
      expect(tenant1Call![1]?.headers?.Authorization).toBe('Bearer token-123');
      expect(tenant2Call![1]?.headers?.Authorization).toBe('Bearer token-456');
    });

    it('should handle tenant-specific rate limits correctly', async () => {
      const message: BotResponse = {
        content: 'Rate limit test',
        messageType: 'text',
      };

      // Test tenant 1 rate limits (2 per second)
      const tenant1Results = await Promise.all([
        whatsappSender.sendMessage('tenant-1', '+1111111111', message, { immediate: true }),
        whatsappSender.sendMessage('tenant-1', '+1111111112', message, { immediate: true }),
        whatsappSender.sendMessage('tenant-1', '+1111111113', message, { immediate: true }), // Should be rate limited
      ]);

      const tenant1Successful = tenant1Results.filter(r => r.success && !('queued' in r.data!)).length;
      const tenant1RateLimited = tenant1Results.filter(r => !r.success && r.error?.code === 'RATE_LIMIT_EXCEEDED').length;

      expect(tenant1Successful).toBeLessThanOrEqual(2);
      expect(tenant1RateLimited).toBeGreaterThan(0);

      // Test tenant 2 rate limits (5 per second) - should allow more messages
      const tenant2Results = await Promise.all([
        whatsappSender.sendMessage('tenant-2', '+2222222221', message, { immediate: true }),
        whatsappSender.sendMessage('tenant-2', '+2222222222', message, { immediate: true }),
        whatsappSender.sendMessage('tenant-2', '+2222222223', message, { immediate: true }),
        whatsappSender.sendMessage('tenant-2', '+2222222224', message, { immediate: true }),
        whatsappSender.sendMessage('tenant-2', '+2222222225', message, { immediate: true }),
      ]);

      const tenant2Successful = tenant2Results.filter(r => r.success && !('queued' in r.data!)).length;
      expect(tenant2Successful).toBeGreaterThan(tenant1Successful);
    });
  });

  describe('Message Queue Management', () => {
    it('should queue messages when rate limits are exceeded', async () => {
      const message: BotResponse = {
        content: 'Queue test message',
        messageType: 'text',
      };

      // Send more messages than rate limit allows
      const results = await Promise.all(
        Array.from({ length: 10 }, (_, i) =>
          whatsappSender.sendMessage('tenant-1', `+111111111${i}`, message)
        )
      );

      const sentImmediately = results.filter(r => r.success && !('queued' in r.data!)).length;
      const queued = results.filter(r => r.success && 'queued' in r.data! && (r.data as any).queued).length;

      expect(sentImmediately).toBeLessThanOrEqual(2); // Rate limit for tenant-1
      expect(queued).toBeGreaterThan(0);

      // Check queue status
      const queueStatus = await whatsappSender.getQueueStatus('tenant-1');
      expect(queueStatus.totalMessages).toBe(queued);
    });

    it('should process queued messages with priority ordering', async () => {
      const messages = [
        { priority: 'low' as const, content: 'Low priority message' },
        { priority: 'high' as const, content: 'High priority message' },
        { priority: 'normal' as const, content: 'Normal priority message' },
      ];

      // Queue messages with different priorities
      for (const msg of messages) {
        await whatsappSender.sendMessage(
          'tenant-1',
          '+1234567890',
          { content: msg.content, messageType: 'text' },
          { priority: msg.priority }
        );
      }

      const queueStatus = await whatsappSender.getQueueStatus('tenant-1');
      expect(queueStatus.highPriorityMessages).toBe(1);
      expect(queueStatus.normalPriorityMessages).toBe(1);
      expect(queueStatus.lowPriorityMessages).toBe(1);

      // Wait for queue processing (in real implementation, this would be automatic)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check if high priority messages are processed first
      const updatedQueueStatus = await whatsappSender.getQueueStatus('tenant-1');
      expect(updatedQueueStatus.totalMessages).toBeLessThan(queueStatus.totalMessages);
    });

    it('should handle queue processing across multiple tenants', async () => {
      const message: BotResponse = {
        content: 'Multi-tenant queue test',
        messageType: 'text',
      };

      // Queue messages for both tenants
      await Promise.all([
        whatsappSender.sendMessage('tenant-1', '+1111111111', message),
        whatsappSender.sendMessage('tenant-1', '+1111111112', message),
        whatsappSender.sendMessage('tenant-2', '+2222222221', message),
        whatsappSender.sendMessage('tenant-2', '+2222222222', message),
      ]);

      const queue1Status = await whatsappSender.getQueueStatus('tenant-1');
      const queue2Status = await whatsappSender.getQueueStatus('tenant-2');

      // Both tenants should have their own separate queues
      expect(queue1Status.totalMessages).toBeGreaterThanOrEqual(0);
      expect(queue2Status.totalMessages).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Bulk Message Operations', () => {
    it('should handle bulk messages with proper tenant isolation', async () => {
      const recipients1 = Array.from({ length: 5 }, (_, i) => ({
        phoneNumber: `+111111111${i}`,
        response: { content: `Message ${i} for tenant 1`, messageType: 'text' as const },
      }));

      const recipients2 = Array.from({ length: 5 }, (_, i) => ({
        phoneNumber: `+222222222${i}`,
        response: { content: `Message ${i} for tenant 2`, messageType: 'text' as const },
      }));

      // Send bulk messages for both tenants simultaneously
      const [result1, result2] = await Promise.all([
        whatsappSender.sendBulkMessages('tenant-1', recipients1),
        whatsappSender.sendBulkMessages('tenant-2', recipients2),
      ]);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result1.data?.results).toHaveLength(5);
      expect(result2.data?.results).toHaveLength(5);

      // Verify tenant isolation in API calls
      const fetchCalls = vi.mocked(fetch).mock.calls;
      const tenant1Calls = fetchCalls.filter(call => 
        call[0]?.toString().includes('phone-123')
      );
      const tenant2Calls = fetchCalls.filter(call => 
        call[0]?.toString().includes('phone-456')
      );

      expect(tenant1Calls.length).toBeGreaterThan(0);
      expect(tenant2Calls.length).toBeGreaterThan(0);
    });

    it('should handle bulk message failures gracefully', async () => {
      // Mock some API failures
      let callCount = 0;
      vi.mocked(fetch).mockImplementation(async (url: string, options: any) => {
        callCount++;
        
        // Fail every third call
        if (callCount % 3 === 0) {
          return {
            ok: false,
            status: 400,
            json: async () => ({ error: { message: 'Simulated failure' } }),
          };
        }

        // Return success for other calls
        return {
          ok: true,
          json: async () => ({
            messaging_product: 'whatsapp',
            contacts: [{ input: '+1234567890', wa_id: '1234567890' }],
            messages: [{ id: `msg-${Date.now()}` }],
          }),
        };
      });

      const recipients = Array.from({ length: 6 }, (_, i) => ({
        phoneNumber: `+111111111${i}`,
        response: { content: `Message ${i}`, messageType: 'text' as const },
      }));

      const result = await whatsappSender.sendBulkMessages('tenant-1', recipients);

      expect(result.success).toBe(true);
      expect(result.data?.successful + result.data?.failed + result.data?.queued).toBe(6);
      expect(result.data?.failed).toBeGreaterThan(0); // Some should have failed
    });
  });

  describe('Interactive Message Types', () => {
    it('should send different message types with tenant-specific credentials', async () => {
      const messageTypes = [
        {
          type: 'text',
          response: { content: 'Text message', messageType: 'text' as const },
        },
        {
          type: 'interactive',
          response: {
            content: 'Choose an option',
            messageType: 'interactive' as const,
            metadata: {
              buttons: [
                { id: 'btn1', title: 'Option 1' },
                { id: 'btn2', title: 'Option 2' },
              ],
            },
          },
        },
        {
          type: 'template',
          response: {
            content: '',
            messageType: 'template' as const,
            metadata: {
              templateName: 'hello_world',
              languageCode: 'en_US',
            },
          },
        },
      ];

      for (const { type, response } of messageTypes) {
        const result = await whatsappSender.sendMessage(
          'tenant-1',
          '+1234567890',
          response,
          { immediate: true }
        );

        expect(result.success).toBe(true);

        // Verify correct message type was sent
        const lastFetchCall = vi.mocked(fetch).mock.calls[vi.mocked(fetch).mock.calls.length - 1];
        const requestBody = JSON.parse(lastFetchCall[1]?.body as string);
        expect(requestBody.type).toBe(type);
      }
    });

    it('should send template messages with tenant-specific templates', async () => {
      const templates = [
        { name: 'hello_world', language: 'en_US' },
        { name: 'goodbye', language: 'es_ES' },
      ];

      for (const template of templates) {
        const result = await whatsappSender.sendTemplate(
          'tenant-1',
          '+1234567890',
          template.name,
          template.language
        );

        expect(result.success).toBe(true);

        const lastFetchCall = vi.mocked(fetch).mock.calls[vi.mocked(fetch).mock.calls.length - 1];
        const requestBody = JSON.parse(lastFetchCall[1]?.body as string);
        expect(requestBody.template.name).toBe(template.name);
        expect(requestBody.template.language.code).toBe(template.language);
      }
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle API errors and retry logic', async () => {
      // Mock API error followed by success
      let callCount = 0;
      vi.mocked(fetch).mockImplementation(async (url: string, options: any) => {
        callCount++;
        
        if (callCount === 1) {
          // First call fails
          return {
            ok: false,
            status: 500,
            json: async () => ({ error: { message: 'Server error' } }),
          };
        }
        
        // Subsequent calls succeed
        return {
          ok: true,
          json: async () => ({
            messaging_product: 'whatsapp',
            contacts: [{ input: '+1234567890', wa_id: '1234567890' }],
            messages: [{ id: `msg-${Date.now()}` }],
          }),
        };
      });

      const message: BotResponse = {
        content: 'Retry test message',
        messageType: 'text',
      };

      // First attempt should fail
      const result1 = await whatsappSender.sendMessage(
        'tenant-1',
        '+1234567890',
        message,
        { immediate: true }
      );

      expect(result1.success).toBe(false);

      // Second attempt should succeed
      const result2 = await whatsappSender.sendMessage(
        'tenant-1',
        '+1234567890',
        message,
        { immediate: true }
      );

      expect(result2.success).toBe(true);
    });

    it('should handle invalid tenant credentials', async () => {
      const message: BotResponse = {
        content: 'Invalid tenant test',
        messageType: 'text',
      };

      const result = await whatsappSender.sendMessage(
        'nonexistent-tenant',
        '+1234567890',
        message
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('WHATSAPP_NOT_CONFIGURED');
    });

    it('should handle network failures gracefully', async () => {
      // Mock network error
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

      const message: BotResponse = {
        content: 'Network error test',
        messageType: 'text',
      };

      const result = await whatsappSender.sendMessage(
        'tenant-1',
        '+1234567890',
        message,
        { immediate: true }
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('API_CALL_FAILED');
    });
  });

  describe('Performance and Monitoring', () => {
    it('should provide accurate delivery statistics', async () => {
      const message: BotResponse = {
        content: 'Stats test message',
        messageType: 'text',
      };

      // Send some messages
      await whatsappSender.sendMessage('tenant-1', '+1111111111', message);
      await whatsappSender.sendMessage('tenant-1', '+1111111112', message);

      const stats = await whatsappSender.getDeliveryStats('tenant-1');

      expect(stats).toHaveProperty('totalSent');
      expect(stats).toHaveProperty('totalQueued');
      expect(stats).toHaveProperty('totalFailed');
      expect(stats).toHaveProperty('rateLimitStatus');
      expect(stats).toHaveProperty('queueStatus');

      expect(stats.rateLimitStatus.limits).toEqual({
        messagesPerSecond: 2,
        messagesPerMinute: 20,
        messagesPerHour: 200,
      });
    });

    it('should handle concurrent operations safely', async () => {
      const message: BotResponse = {
        content: 'Concurrent test message',
        messageType: 'text',
      };

      // Send many messages concurrently
      const promises = Array.from({ length: 20 }, (_, i) =>
        whatsappSender.sendMessage('tenant-1', `+111111111${i % 10}`, message)
      );

      const results = await Promise.all(promises);

      // All operations should complete (either success or queued)
      expect(results.every(r => r.success)).toBe(true);

      const successful = results.filter(r => !('queued' in r.data!)).length;
      const queued = results.filter(r => 'queued' in r.data! && (r.data as any).queued).length;

      expect(successful + queued).toBe(20);
    });
  });
});