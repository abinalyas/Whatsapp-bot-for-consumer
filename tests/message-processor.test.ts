/**
 * Message Processor Service Unit Tests
 * Tests individual components of the message processing system
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MessageProcessorService, WhatsAppMessage, BotResponse } from '../server/services/message-processor.service';
import type { TenantContext, Conversation, Service } from '@shared/types/tenant';

// Mock database connection
const mockConnectionString = 'postgresql://test:test@localhost:5432/test';

// Mock drizzle and database
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
        returning: vi.fn(() => Promise.resolve([{ id: 'msg-123' }])),
      })),
    })),
  })),
}));

vi.mock('@neondatabase/serverless', () => ({
  Pool: vi.fn(() => ({
    end: vi.fn(),
  })),
}));

describe('MessageProcessorService', () => {
  let messageProcessor: MessageProcessorService;
  let mockTenantContext: TenantContext;

  beforeEach(() => {
    messageProcessor = new MessageProcessorService(mockConnectionString);
    
    mockTenantContext = {
      tenantId: 'tenant-123',
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
  });

  afterEach(async () => {
    await messageProcessor.close();
  });

  describe('Message Content Extraction', () => {
    it('should extract text message content', () => {
      const message: WhatsAppMessage = {
        id: 'msg-1',
        from: '+1234567890',
        to: '1234567890',
        text: { body: 'Hello, world!' },
        type: 'text',
        timestamp: new Date().toISOString(),
      };

      const content = messageProcessor['extractMessageContent'](message);
      expect(content).toBe('Hello, world!');
    });

    it('should extract button reply content', () => {
      const message: WhatsAppMessage = {
        id: 'msg-1',
        from: '+1234567890',
        to: '1234567890',
        type: 'interactive',
        timestamp: new Date().toISOString(),
        interactive: {
          type: 'button_reply',
          button_reply: {
            id: 'btn-1',
            title: 'Book Appointment',
          },
        },
      };

      const content = messageProcessor['extractMessageContent'](message);
      expect(content).toBe('Book Appointment');
    });

    it('should extract list reply content', () => {
      const message: WhatsAppMessage = {
        id: 'msg-1',
        from: '+1234567890',
        to: '1234567890',
        type: 'interactive',
        timestamp: new Date().toISOString(),
        interactive: {
          type: 'list_reply',
          list_reply: {
            id: 'list-1',
            title: 'Haircut Service',
            description: 'Professional haircut',
          },
        },
      };

      const content = messageProcessor['extractMessageContent'](message);
      expect(content).toBe('Haircut Service');
    });

    it('should handle non-text message types', () => {
      const message: WhatsAppMessage = {
        id: 'msg-1',
        from: '+1234567890',
        to: '1234567890',
        type: 'image',
        timestamp: new Date().toISOString(),
      };

      const content = messageProcessor['extractMessageContent'](message);
      expect(content).toBe('[image message]');
    });
  });

  describe('Conversation State Transitions', () => {
    it('should get available state transitions', () => {
      const greetingTransitions = messageProcessor['getAvailableStateTransitions']('greeting');
      expect(greetingTransitions).toEqual(['awaiting_service']);

      const serviceTransitions = messageProcessor['getAvailableStateTransitions']('awaiting_service');
      expect(serviceTransitions).toEqual(['awaiting_date', 'completed']);

      const unknownTransitions = messageProcessor['getAvailableStateTransitions']('unknown_state');
      expect(unknownTransitions).toEqual([]);
    });

    it('should validate state transition logic', () => {
      const validStates = ['greeting', 'awaiting_service', 'awaiting_date', 'awaiting_time', 'awaiting_payment', 'completed'];
      
      validStates.forEach(state => {
        const transitions = messageProcessor['getAvailableStateTransitions'](state);
        expect(Array.isArray(transitions)).toBe(true);
        
        // Each transition should be a valid state
        transitions.forEach(transition => {
          expect(validStates).toContain(transition);
        });
      });
    });
  });

  describe('Greeting State Handler', () => {
    it('should handle greeting state correctly', async () => {
      // Mock tenant data
      vi.spyOn(messageProcessor['db'], 'select').mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{
              id: 'tenant-123',
              businessName: 'Test Business',
            }]),
          }),
        }),
      } as any);

      const result = await messageProcessor['handleGreetingState']('tenant-123', 'Hello', {});

      expect(result.success).toBe(true);
      expect(result.data!.newState).toBe('awaiting_service');
      expect(result.data!.response?.content).toContain('Test Business');
      expect(result.data!.contextData?.greetingSent).toBe(true);
    });

    it('should use default business name when tenant not found', async () => {
      // Mock empty tenant result
      vi.spyOn(messageProcessor['db'], 'select').mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      } as any);

      const result = await messageProcessor['handleGreetingState']('tenant-123', 'Hello', {});

      expect(result.success).toBe(true);
      expect(result.data!.response?.content).toContain('our business');
    });
  });

  describe('Service Selection State Handler', () => {
    it('should show service options when no services available', async () => {
      // Mock empty services result
      vi.spyOn(messageProcessor['serviceRepo'], 'list').mockResolvedValue({
        success: true,
        data: {
          data: [],
          pagination: { page: 1, limit: 10, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
        },
      });

      const message: WhatsAppMessage = {
        id: 'msg-1',
        from: '+1234567890',
        to: '1234567890',
        text: { body: 'haircut' },
        type: 'text',
        timestamp: new Date().toISOString(),
      };

      const result = await messageProcessor['handleServiceSelectionState']('tenant-123', 'haircut', message, {});

      expect(result.success).toBe(true);
      expect(result.data!.newState).toBe('completed');
      expect(result.data!.response?.content).toContain('no services are currently available');
    });

    it('should handle service selection by text matching', async () => {
      // Mock services result
      vi.spyOn(messageProcessor['serviceRepo'], 'list').mockResolvedValue({
        success: true,
        data: {
          data: [
            { id: 'service-1', name: 'Haircut', price: 30 } as Service,
            { id: 'service-2', name: 'Massage', price: 60 } as Service,
          ],
          pagination: { page: 1, limit: 10, total: 2, totalPages: 1, hasNext: false, hasPrev: false },
        },
      });

      const message: WhatsAppMessage = {
        id: 'msg-1',
        from: '+1234567890',
        to: '1234567890',
        text: { body: 'haircut' },
        type: 'text',
        timestamp: new Date().toISOString(),
      };

      const result = await messageProcessor['handleServiceSelectionState']('tenant-123', 'haircut', message, {});

      expect(result.success).toBe(true);
      expect(result.data!.newState).toBe('awaiting_date');
      expect(result.data!.contextData?.selectedServiceName).toBe('Haircut');
      expect(result.data!.contextData?.selectedServicePrice).toBe(30);
    });

    it('should handle service selection by button reply', async () => {
      // Mock services result
      vi.spyOn(messageProcessor['serviceRepo'], 'list').mockResolvedValue({
        success: true,
        data: {
          data: [
            { id: 'service-1', name: 'Haircut', price: 30 } as Service,
            { id: 'service-2', name: 'Massage', price: 60 } as Service,
          ],
          pagination: { page: 1, limit: 10, total: 2, totalPages: 1, hasNext: false, hasPrev: false },
        },
      });

      const message: WhatsAppMessage = {
        id: 'msg-1',
        from: '+1234567890',
        to: '1234567890',
        type: 'interactive',
        timestamp: new Date().toISOString(),
        interactive: {
          type: 'button_reply',
          button_reply: {
            id: 'service-2',
            title: 'Massage - $60',
          },
        },
      };

      const result = await messageProcessor['handleServiceSelectionState']('tenant-123', 'Massage - $60', message, {});

      expect(result.success).toBe(true);
      expect(result.data!.newState).toBe('awaiting_date');
      expect(result.data!.contextData?.selectedServiceName).toBe('Massage');
      expect(result.data!.contextData?.selectedServicePrice).toBe(60);
    });

    it('should show service options when no match found', async () => {
      // Mock services result
      vi.spyOn(messageProcessor['serviceRepo'], 'list').mockResolvedValue({
        success: true,
        data: {
          data: [
            { id: 'service-1', name: 'Haircut', price: 30 } as Service,
            { id: 'service-2', name: 'Massage', price: 60 } as Service,
          ],
          pagination: { page: 1, limit: 10, total: 2, totalPages: 1, hasNext: false, hasPrev: false },
        },
      });

      const message: WhatsAppMessage = {
        id: 'msg-1',
        from: '+1234567890',
        to: '1234567890',
        text: { body: 'unknown service' },
        type: 'text',
        timestamp: new Date().toISOString(),
      };

      const result = await messageProcessor['handleServiceSelectionState']('tenant-123', 'unknown service', message, {});

      expect(result.success).toBe(true);
      expect(result.data!.newState).toBeUndefined(); // Should stay in same state
      expect(result.data!.response?.messageType).toBe('interactive');
      expect(result.data!.response?.metadata?.buttons).toHaveLength(2);
    });
  });

  describe('Date Selection State Handler', () => {
    it('should validate date format', async () => {
      const invalidDateResult = await messageProcessor['handleDateSelectionState']('tenant-123', 'invalid-date', {});

      expect(invalidDateResult.success).toBe(true);
      expect(invalidDateResult.data!.newState).toBeUndefined(); // Should stay in same state
      expect(invalidDateResult.data!.response?.content).toContain('valid date in YYYY-MM-DD format');
    });

    it('should reject past dates', async () => {
      const pastDate = '2020-01-01';
      const pastDateResult = await messageProcessor['handleDateSelectionState']('tenant-123', pastDate, {});

      expect(pastDateResult.success).toBe(true);
      expect(pastDateResult.data!.newState).toBeUndefined(); // Should stay in same state
      expect(pastDateResult.data!.response?.content).toContain('select a future date');
    });

    it('should accept valid future date', async () => {
      const futureDate = '2025-12-25';
      const futureDateResult = await messageProcessor['handleDateSelectionState']('tenant-123', futureDate, {});

      expect(futureDateResult.success).toBe(true);
      expect(futureDateResult.data!.newState).toBe('awaiting_time');
      expect(futureDateResult.data!.contextData?.selectedDate).toBe(futureDate);
      expect(futureDateResult.data!.response?.content).toContain(futureDate);
    });
  });

  describe('Time Selection State Handler', () => {
    it('should validate time format', async () => {
      const invalidTimeResult = await messageProcessor['handleTimeSelectionState']('tenant-123', 'invalid-time', {});

      expect(invalidTimeResult.success).toBe(true);
      expect(invalidTimeResult.data!.newState).toBeUndefined(); // Should stay in same state
      expect(invalidTimeResult.data!.response?.content).toContain('valid time in HH:MM format');
    });

    it('should accept valid time format', async () => {
      const contextData = {
        selectedServiceName: 'Haircut',
        selectedServicePrice: 30,
        selectedDate: '2025-12-25',
      };

      const validTimeResult = await messageProcessor['handleTimeSelectionState']('tenant-123', '14:30', contextData);

      expect(validTimeResult.success).toBe(true);
      expect(validTimeResult.data!.newState).toBe('awaiting_payment');
      expect(validTimeResult.data!.contextData?.selectedTime).toBe('14:30');
      expect(validTimeResult.data!.response?.content).toContain('booking summary');
      expect(validTimeResult.data!.response?.content).toContain('Haircut');
      expect(validTimeResult.data!.response?.content).toContain('2025-12-25');
      expect(validTimeResult.data!.response?.content).toContain('14:30');
      expect(validTimeResult.data!.response?.content).toContain('$30');
    });
  });

  describe('Payment State Handler', () => {
    it('should handle booking confirmation', async () => {
      const contextData = {
        selectedServiceName: 'Haircut',
        selectedServicePrice: 30,
        selectedDate: '2025-12-25',
        selectedTime: '14:30',
      };

      const confirmResult = await messageProcessor['handlePaymentState']('tenant-123', 'CONFIRM', contextData);

      expect(confirmResult.success).toBe(true);
      expect(confirmResult.data!.newState).toBe('completed');
      expect(confirmResult.data!.contextData?.bookingConfirmed).toBe(true);
      expect(confirmResult.data!.response?.content).toContain('booking has been confirmed');
    });

    it('should handle booking cancellation', async () => {
      const contextData = {
        selectedServiceName: 'Haircut',
        selectedServicePrice: 30,
        selectedDate: '2025-12-25',
        selectedTime: '14:30',
      };

      const cancelResult = await messageProcessor['handlePaymentState']('tenant-123', 'CANCEL', contextData);

      expect(cancelResult.success).toBe(true);
      expect(cancelResult.data!.newState).toBe('completed');
      expect(cancelResult.data!.contextData?.bookingCancelled).toBe(true);
      expect(cancelResult.data!.response?.content).toContain('booking has been cancelled');
    });

    it('should handle invalid confirmation response', async () => {
      const contextData = {
        selectedServiceName: 'Haircut',
        selectedServicePrice: 30,
        selectedDate: '2025-12-25',
        selectedTime: '14:30',
      };

      const invalidResult = await messageProcessor['handlePaymentState']('tenant-123', 'maybe', contextData);

      expect(invalidResult.success).toBe(true);
      expect(invalidResult.data!.newState).toBeUndefined(); // Should stay in same state
      expect(invalidResult.data!.response?.content).toContain('CONFIRM" to confirm');
    });
  });

  describe('Completed State Handler', () => {
    it('should restart conversation flow', async () => {
      const contextData = { previousBooking: { confirmed: true } };

      const result = await messageProcessor['handleCompletedState']('tenant-123', 'Hello again', contextData);

      expect(result.success).toBe(true);
      expect(result.data!.newState).toBe('awaiting_service');
      expect(result.data!.response?.content).toContain('new booking');
      expect(result.data!.contextData?.previousBooking).toEqual(contextData);
    });
  });

  describe('Unknown State Handler', () => {
    it('should reset to service selection state', async () => {
      const contextData = { currentState: 'invalid_state' };

      const result = await messageProcessor['handleUnknownState']('tenant-123', 'help', contextData);

      expect(result.success).toBe(true);
      expect(result.data!.newState).toBe('awaiting_service');
      expect(result.data!.response?.content).toContain('something went wrong');
      expect(result.data!.contextData?.error).toBe('unknown_state');
    });
  });

  describe('Error Handling', () => {
    it('should handle service repository errors', async () => {
      // Mock service repository error
      vi.spyOn(messageProcessor['serviceRepo'], 'list').mockRejectedValue(new Error('Database error'));

      const message: WhatsAppMessage = {
        id: 'msg-1',
        from: '+1234567890',
        to: '1234567890',
        text: { body: 'haircut' },
        type: 'text',
        timestamp: new Date().toISOString(),
      };

      try {
        await messageProcessor['handleServiceSelectionState']('tenant-123', 'haircut', message, {});
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Database error');
      }
    });

    it('should handle conversation state processing errors', async () => {
      const conversation: Conversation = {
        id: 'conv-1',
        tenantId: 'tenant-123',
        phoneNumber: '+1234567890',
        currentState: 'greeting',
        contextData: {},
      } as Conversation;

      // Mock error in state processing
      vi.spyOn(messageProcessor, 'handleGreetingState' as any).mockRejectedValue(new Error('Processing error'));

      try {
        await messageProcessor.processConversationState(
          'tenant-123',
          conversation,
          'hello',
          { id: 'msg-1', from: '+1234567890', to: '1234567890', text: { body: 'hello' }, type: 'text', timestamp: new Date().toISOString() }
        );
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Processing error');
      }
    });
  });

  describe('Conversation State Information', () => {
    it('should get conversation state information', async () => {
      // Mock conversation repository
      vi.spyOn(messageProcessor['conversationRepo'], 'findById').mockResolvedValue({
        success: true,
        data: {
          id: 'conv-1',
          tenantId: 'tenant-123',
          phoneNumber: '+1234567890',
          currentState: 'awaiting_service',
          contextData: { greetingSent: true },
        } as Conversation,
      });

      const result = await messageProcessor.getConversationState('tenant-123', 'conv-1');

      expect(result.success).toBe(true);
      expect(result.data!.current).toBe('awaiting_service');
      expect(result.data!.data).toEqual({ greetingSent: true });
      expect(result.data!.availableTransitions).toEqual(['awaiting_date', 'completed']);
    });

    it('should handle conversation not found', async () => {
      // Mock conversation not found
      vi.spyOn(messageProcessor['conversationRepo'], 'findById').mockResolvedValue({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Conversation not found' },
      });

      const result = await messageProcessor.getConversationState('tenant-123', 'conv-1');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NOT_FOUND');
    });
  });
});