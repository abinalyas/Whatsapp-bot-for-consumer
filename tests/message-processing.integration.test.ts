/**
 * Multi-Tenant Message Processing Integration Tests
 * Tests the complete message processing flow with tenant isolation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MessageProcessorService, WhatsAppWebhookPayload, WhatsAppMessage } from '../server/services/message-processor.service';
import { WhatsAppSenderService } from '../server/services/whatsapp-sender.service';
import { ConversationRepository } from '../server/repositories/conversation.repository';
import { MessageRepository } from '../server/repositories/message.repository';
import { ServiceRepository } from '../server/repositories/service.repository';
import type { TenantContext, Conversation, Service } from '@shared/types/tenant';

// Mock database connection
const mockConnectionString = 'postgresql://test:test@localhost:5432/test';

// Mock fetch for WhatsApp API calls
global.fetch = vi.fn();

// Mock database operations
vi.mock('drizzle-orm/neon-serverless', () => ({
  drizzle: vi.fn(() => ({
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve([])),
        })),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([])),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve([])),
        })),
      })),
    })),
  })),
}));

vi.mock('@neondatabase/serverless', () => ({
  Pool: vi.fn(() => ({
    end: vi.fn(),
  })),
}));

describe('Multi-Tenant Message Processing Integration', () => {
  let messageProcessor: MessageProcessorService;
  let whatsappSender: WhatsAppSenderService;
  let conversationRepo: ConversationRepository;
  let messageRepo: MessageRepository;
  let serviceRepo: ServiceRepository;

  // Mock tenant contexts with valid UUIDs
  const tenant1Context: TenantContext = {
    tenantId: '550e8400-e29b-41d4-a716-446655440001',
    permissions: ['webhook:receive'],
    subscriptionLimits: {
      messagesPerMonth: 1000,
      bookingsPerMonth: 100,
      apiCallsPerDay: 1000,
    },
    currentUsage: {
      messages_sent: 50,
      messages_received: 30,
      bookings_created: 5,
      api_calls: 100,
      storage_used: 0,
      webhook_calls: 0,
    },
  };

  const tenant2Context: TenantContext = {
    tenantId: '550e8400-e29b-41d4-a716-446655440002',
    permissions: ['webhook:receive'],
    subscriptionLimits: {
      messagesPerMonth: 500,
      bookingsPerMonth: 50,
      apiCallsPerDay: 500,
    },
    currentUsage: {
      messages_sent: 25,
      messages_received: 15,
      bookings_created: 2,
      api_calls: 50,
      storage_used: 0,
      webhook_calls: 0,
    },
  };

  beforeEach(() => {
    messageProcessor = new MessageProcessorService(mockConnectionString);
    whatsappSender = new WhatsAppSenderService(mockConnectionString);
    conversationRepo = new ConversationRepository(mockConnectionString);
    messageRepo = new MessageRepository(mockConnectionString);
    serviceRepo = new ServiceRepository(mockConnectionString);

    // Reset mocks
    vi.clearAllMocks();
    
    // Mock the database operations to avoid UUID validation
    vi.spyOn(messageProcessor['db'], 'select').mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    } as any);
    
    vi.spyOn(messageProcessor['db'], 'insert').mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 'msg-123' }]),
      }),
    } as any);
  });

  afterEach(async () => {
    await messageProcessor.close();
    await whatsappSender.close();
  });

  describe('Webhook Payload Processing', () => {
    it('should process webhook payload with multiple tenants', async () => {
      // Mock tenant identification
      vi.spyOn(messageProcessor, 'identifyTenantFromPhoneNumber' as any)
        .mockImplementation(async (phoneNumberId: string) => {
          if (phoneNumberId === 'phone-1') {
            return { success: true, data: tenant1Context };
          } else if (phoneNumberId === 'phone-2') {
            return { success: true, data: tenant2Context };
          }
          return { success: false, error: { code: 'TENANT_NOT_FOUND', message: 'Tenant not found' } };
        });

      // Mock conversation creation
      vi.spyOn(conversationRepo, 'findByPhoneNumber').mockResolvedValue({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Not found' },
      });

      vi.spyOn(conversationRepo, 'create').mockResolvedValue({
        success: true,
        data: {
          id: 'conv-1',
          tenantId: 'tenant-1',
          phoneNumber: '+1234567890',
          currentState: 'greeting',
          contextData: {},
        } as Conversation,
      });

      const webhookPayload: WhatsAppWebhookPayload = {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: 'entry-1',
            changes: [
              {
                value: {
                  messaging_product: 'whatsapp',
                  metadata: {
                    display_phone_number: '1234567890',
                    phone_number_id: 'phone-1',
                  },
                  messages: [
                    {
                      id: 'msg-1',
                      from: '+1234567890',
                      to: '1234567890',
                      text: { body: 'Hello' },
                      type: 'text',
                      timestamp: new Date().toISOString(),
                    },
                  ],
                },
                field: 'messages',
              },
            ],
          },
          {
            id: 'entry-2',
            changes: [
              {
                value: {
                  messaging_product: 'whatsapp',
                  metadata: {
                    display_phone_number: '0987654321',
                    phone_number_id: 'phone-2',
                  },
                  messages: [
                    {
                      id: 'msg-2',
                      from: '+0987654321',
                      to: '0987654321',
                      text: { body: 'Hi there' },
                      type: 'text',
                      timestamp: new Date().toISOString(),
                    },
                  ],
                },
                field: 'messages',
              },
            ],
          },
        ],
      };

      const result = await messageProcessor.processWebhookPayload(webhookPayload);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data![0].tenantId).toBe('550e8400-e29b-41d4-a716-446655440001');
      expect(result.data![1].tenantId).toBe('550e8400-e29b-41d4-a716-446655440002');
    });

    it('should handle tenant identification failures gracefully', async () => {
      vi.spyOn(messageProcessor, 'identifyTenantFromPhoneNumber' as any)
        .mockResolvedValue({
          success: false,
          error: { code: 'TENANT_NOT_FOUND', message: 'Tenant not found' },
        });

      const webhookPayload: WhatsAppWebhookPayload = {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: 'entry-1',
            changes: [
              {
                value: {
                  messaging_product: 'whatsapp',
                  metadata: {
                    display_phone_number: '1234567890',
                    phone_number_id: 'unknown-phone',
                  },
                  messages: [
                    {
                      id: 'msg-1',
                      from: '+1234567890',
                      to: '1234567890',
                      text: { body: 'Hello' },
                      type: 'text',
                      timestamp: new Date().toISOString(),
                    },
                  ],
                },
                field: 'messages',
              },
            ],
          },
        ],
      };

      const result = await messageProcessor.processWebhookPayload(webhookPayload);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0); // No messages processed due to tenant identification failure
    });
  });

  describe('Conversation State Management', () => {
    it('should maintain separate conversation states for different tenants', async () => {
      // Mock services for tenant 1
      vi.spyOn(serviceRepo, 'list').mockImplementation(async (tenantId) => {
        if (tenantId === '550e8400-e29b-41d4-a716-446655440001') {
          return {
            success: true,
            data: {
              data: [
                { id: 'service-1', name: 'Haircut', price: 30 } as Service,
                { id: 'service-2', name: 'Massage', price: 60 } as Service,
              ],
              pagination: { page: 1, limit: 10, total: 2, totalPages: 1, hasNext: false, hasPrev: false },
            },
          };
        }
        return {
          success: true,
          data: {
            data: [
              { id: 'service-3', name: 'Consultation', price: 50 } as Service,
            ],
            pagination: { page: 1, limit: 10, total: 1, totalPages: 1, hasNext: false, hasPrev: false },
          },
        };
      });

      // Test tenant 1 conversation
      const tenant1Conversation: Conversation = {
        id: 'conv-1',
        tenantId: 'tenant-1',
        phoneNumber: '+1234567890',
        currentState: 'awaiting_service',
        contextData: {},
      } as Conversation;

      const tenant1Result = await messageProcessor.processConversationState(
        '550e8400-e29b-41d4-a716-446655440001',
        tenant1Conversation,
        'haircut',
        { id: 'msg-1', from: '+1234567890', to: '1234567890', text: { body: 'haircut' }, type: 'text', timestamp: new Date().toISOString() }
      );

      expect(tenant1Result.success).toBe(true);
      expect(tenant1Result.data!.newState).toBe('awaiting_date');
      expect(tenant1Result.data!.contextData?.selectedServiceName).toBe('Haircut');

      // Test tenant 2 conversation
      const tenant2Conversation: Conversation = {
        id: 'conv-2',
        tenantId: 'tenant-2',
        phoneNumber: '+0987654321',
        currentState: 'awaiting_service',
        contextData: {},
      } as Conversation;

      const tenant2Result = await messageProcessor.processConversationState(
        'tenant-2',
        tenant2Conversation,
        'consultation',
        { id: 'msg-2', from: '+0987654321', to: '0987654321', text: { body: 'consultation' }, type: 'text', timestamp: new Date().toISOString() }
      );

      expect(tenant2Result.success).toBe(true);
      expect(tenant2Result.data!.newState).toBe('awaiting_date');
      expect(tenant2Result.data!.contextData?.selectedServiceName).toBe('Consultation');
    });

    it('should handle complete booking flow for tenant', async () => {
      // Mock services
      vi.spyOn(serviceRepo, 'list').mockResolvedValue({
        success: true,
        data: {
          data: [{ id: 'service-1', name: 'Haircut', price: 30 } as Service],
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1, hasNext: false, hasPrev: false },
        },
      });

      const conversation: Conversation = {
        id: 'conv-1',
        tenantId: 'tenant-1',
        phoneNumber: '+1234567890',
        currentState: 'greeting',
        contextData: {},
      } as Conversation;

      // Step 1: Greeting -> Service Selection
      const step1 = await messageProcessor.processConversationState(
        'tenant-1',
        conversation,
        'hello',
        { id: 'msg-1', from: '+1234567890', to: '1234567890', text: { body: 'hello' }, type: 'text', timestamp: new Date().toISOString() }
      );

      expect(step1.success).toBe(true);
      expect(step1.data!.newState).toBe('awaiting_service');

      // Step 2: Service Selection -> Date Selection
      conversation.currentState = 'awaiting_service';
      const step2 = await messageProcessor.processConversationState(
        'tenant-1',
        conversation,
        'haircut',
        { id: 'msg-2', from: '+1234567890', to: '1234567890', text: { body: 'haircut' }, type: 'text', timestamp: new Date().toISOString() }
      );

      expect(step2.success).toBe(true);
      expect(step2.data!.newState).toBe('awaiting_date');

      // Step 3: Date Selection -> Time Selection
      conversation.currentState = 'awaiting_date';
      conversation.contextData = step2.data!.contextData;
      const step3 = await messageProcessor.processConversationState(
        'tenant-1',
        conversation,
        '2024-12-25',
        { id: 'msg-3', from: '+1234567890', to: '1234567890', text: { body: '2024-12-25' }, type: 'text', timestamp: new Date().toISOString() }
      );

      expect(step3.success).toBe(true);
      expect(step3.data!.newState).toBe('awaiting_time');

      // Step 4: Time Selection -> Payment
      conversation.currentState = 'awaiting_time';
      conversation.contextData = { ...conversation.contextData, ...step3.data!.contextData };
      const step4 = await messageProcessor.processConversationState(
        'tenant-1',
        conversation,
        '14:30',
        { id: 'msg-4', from: '+1234567890', to: '1234567890', text: { body: '14:30' }, type: 'text', timestamp: new Date().toISOString() }
      );

      expect(step4.success).toBe(true);
      expect(step4.data!.newState).toBe('awaiting_payment');

      // Step 5: Confirmation -> Completed
      conversation.currentState = 'awaiting_payment';
      conversation.contextData = { ...conversation.contextData, ...step4.data!.contextData };
      const step5 = await messageProcessor.processConversationState(
        'tenant-1',
        conversation,
        'CONFIRM',
        { id: 'msg-5', from: '+1234567890', to: '1234567890', text: { body: 'CONFIRM' }, type: 'text', timestamp: new Date().toISOString() }
      );

      expect(step5.success).toBe(true);
      expect(step5.data!.newState).toBe('completed');
      expect(step5.data!.contextData?.bookingConfirmed).toBe(true);
    });
  });

  describe('Tenant Isolation', () => {
    it('should ensure complete tenant isolation in message processing', async () => {
      // Mock different tenant data
      vi.spyOn(messageProcessor, 'identifyTenantFromPhoneNumber' as any)
        .mockImplementation(async (phoneNumberId: string) => {
          if (phoneNumberId === 'tenant1-phone') {
            return { success: true, data: tenant1Context };
          } else if (phoneNumberId === 'tenant2-phone') {
            return { success: true, data: tenant2Context };
          }
          return { success: false, error: { code: 'TENANT_NOT_FOUND', message: 'Tenant not found' } };
        });

      // Mock tenant-specific services
      vi.spyOn(serviceRepo, 'list').mockImplementation(async (tenantId) => {
        if (tenantId === 'tenant-1') {
          return {
            success: true,
            data: {
              data: [{ id: 'tenant1-service', name: 'Tenant 1 Service', price: 100 } as Service],
              pagination: { page: 1, limit: 10, total: 1, totalPages: 1, hasNext: false, hasPrev: false },
            },
          };
        } else if (tenantId === 'tenant-2') {
          return {
            success: true,
            data: {
              data: [{ id: 'tenant2-service', name: 'Tenant 2 Service', price: 200 } as Service],
              pagination: { page: 1, limit: 10, total: 1, totalPages: 1, hasNext: false, hasPrev: false },
            },
          };
        }
        return { success: true, data: { data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0, hasNext: false, hasPrev: false } } };
      });

      // Mock conversation creation for different tenants
      vi.spyOn(conversationRepo, 'findByPhoneNumber').mockResolvedValue({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Not found' },
      });

      vi.spyOn(conversationRepo, 'create').mockImplementation(async (tenantId, data) => ({
        success: true,
        data: {
          id: `conv-${tenantId}`,
          tenantId,
          phoneNumber: data.phoneNumber,
          currentState: 'greeting',
          contextData: {},
        } as Conversation,
      }));

      // Process messages for both tenants
      const tenant1Message: WhatsAppMessage = {
        id: 'msg-tenant1',
        from: '+1111111111',
        to: 'tenant1-phone',
        text: { body: 'Hello from tenant 1' },
        type: 'text',
        timestamp: new Date().toISOString(),
      };

      const tenant2Message: WhatsAppMessage = {
        id: 'msg-tenant2',
        from: '+2222222222',
        to: 'tenant2-phone',
        text: { body: 'Hello from tenant 2' },
        type: 'text',
        timestamp: new Date().toISOString(),
      };

      const tenant1Result = await messageProcessor.processMessage(tenant1Message, tenant1Context);
      const tenant2Result = await messageProcessor.processMessage(tenant2Message, tenant2Context);

      // Verify tenant isolation
      expect(tenant1Result.success).toBe(true);
      expect(tenant1Result.data!.tenantId).toBe('tenant-1');
      expect(tenant1Result.data!.conversationId).toBe('conv-tenant-1');

      expect(tenant2Result.success).toBe(true);
      expect(tenant2Result.data!.tenantId).toBe('tenant-2');
      expect(tenant2Result.data!.conversationId).toBe('conv-tenant-2');

      // Verify that tenants cannot access each other's data
      expect(tenant1Result.data!.tenantId).not.toBe(tenant2Result.data!.tenantId);
      expect(tenant1Result.data!.conversationId).not.toBe(tenant2Result.data!.conversationId);
    });

    it('should prevent cross-tenant data access', async () => {
      // Attempt to access tenant 1 data with tenant 2 context
      const crossTenantAttempt = await conversationRepo.findByPhoneNumber('tenant-2', '+1111111111');

      // Should not find conversation from different tenant
      expect(crossTenantAttempt.success).toBe(false);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle database errors gracefully', async () => {
      // Mock database error
      vi.spyOn(conversationRepo, 'findByPhoneNumber').mockRejectedValue(new Error('Database connection failed'));

      const message: WhatsAppMessage = {
        id: 'msg-error',
        from: '+1234567890',
        to: '1234567890',
        text: { body: 'Hello' },
        type: 'text',
        timestamp: new Date().toISOString(),
      };

      const result = await messageProcessor.processMessage(message, tenant1Context);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('MESSAGE_PROCESSING_FAILED');
    });

    it('should handle invalid message formats', async () => {
      const invalidMessage = {
        id: 'invalid-msg',
        from: '+1234567890',
        to: '1234567890',
        type: 'unknown_type',
        timestamp: new Date().toISOString(),
      } as WhatsAppMessage;

      const result = await messageProcessor.processMessage(invalidMessage, tenant1Context);

      // Should still process but extract appropriate content
      expect(result.success).toBe(true);
      expect(result.data!.content).toBe('[unknown_type message]');
    });

    it('should handle conversation state errors', async () => {
      const conversation: Conversation = {
        id: 'conv-1',
        tenantId: 'tenant-1',
        phoneNumber: '+1234567890',
        currentState: 'invalid_state',
        contextData: {},
      } as Conversation;

      const result = await messageProcessor.processConversationState(
        'tenant-1',
        conversation,
        'test message',
        { id: 'msg-1', from: '+1234567890', to: '1234567890', text: { body: 'test message' }, type: 'text', timestamp: new Date().toISOString() }
      );

      expect(result.success).toBe(true);
      expect(result.data!.newState).toBe('awaiting_service'); // Should reset to valid state
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle concurrent message processing for multiple tenants', async () => {
      // Mock tenant identification for multiple tenants
      vi.spyOn(messageProcessor, 'identifyTenantFromPhoneNumber' as any)
        .mockImplementation(async (phoneNumberId: string) => {
          const tenantId = phoneNumberId.replace('phone-', 'tenant-');
          return {
            success: true,
            data: {
              tenantId,
              permissions: ['webhook:receive'],
              subscriptionLimits: { messagesPerMonth: 1000, bookingsPerMonth: 100, apiCallsPerDay: 1000 },
              currentUsage: { messages_sent: 0, messages_received: 0, bookings_created: 0, api_calls: 0, storage_used: 0, webhook_calls: 0 },
            },
          };
        });

      // Mock conversation operations
      vi.spyOn(conversationRepo, 'findByPhoneNumber').mockResolvedValue({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Not found' },
      });

      vi.spyOn(conversationRepo, 'create').mockImplementation(async (tenantId, data) => ({
        success: true,
        data: {
          id: `conv-${tenantId}`,
          tenantId,
          phoneNumber: data.phoneNumber,
          currentState: 'greeting',
          contextData: {},
        } as Conversation,
      }));

      // Create multiple concurrent messages
      const messages = Array.from({ length: 10 }, (_, i) => ({
        id: `msg-${i}`,
        from: `+123456789${i}`,
        to: `phone-${i % 3}`, // Distribute across 3 tenants
        text: { body: `Message ${i}` },
        type: 'text' as const,
        timestamp: new Date().toISOString(),
      }));

      const webhookPayload: WhatsAppWebhookPayload = {
        object: 'whatsapp_business_account',
        entry: messages.map((msg, i) => ({
          id: `entry-${i}`,
          changes: [{
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: msg.to,
                phone_number_id: msg.to,
              },
              messages: [msg],
            },
            field: 'messages',
          }],
        })),
      };

      const startTime = Date.now();
      const result = await messageProcessor.processWebhookPayload(webhookPayload);
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(10);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds

      // Verify tenant isolation in concurrent processing
      const tenantIds = result.data!.map(msg => msg.tenantId);
      const uniqueTenantIds = [...new Set(tenantIds)];
      expect(uniqueTenantIds).toHaveLength(3); // Should have 3 different tenants
    });
  });
});