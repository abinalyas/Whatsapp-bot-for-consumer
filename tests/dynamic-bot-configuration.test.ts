/**
 * Dynamic Bot Configuration Integration Test
 * Tests the integration between MessageProcessorService and BotConfigurationService
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MessageProcessorService } from '../server/services/message-processor.service';
import { BotConfigurationService } from '../server/services/bot-configuration.service';
import type { BotSettings } from '@shared/types/tenant';

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

// Mock BotConfigurationService
const mockBotConfigService = {
  getBotConfiguration: vi.fn(),
  subscribeToConfigurationChanges: vi.fn(() => () => {}),
  close: vi.fn(),
};

vi.mock('../server/services/bot-configuration.service', () => ({
  BotConfigurationService: vi.fn(() => mockBotConfigService),
}));

// Mock repositories
vi.mock('../server/repositories/conversation.repository', () => ({
  ConversationRepository: vi.fn(() => ({
    findByPhoneNumber: vi.fn(),
    create: vi.fn(),
    updateState: vi.fn(),
  })),
}));

vi.mock('../server/repositories/service.repository', () => ({
  ServiceRepository: vi.fn(() => ({
    list: vi.fn(),
  })),
}));

describe('Dynamic Bot Configuration Integration', () => {
  let messageProcessor: MessageProcessorService;
  let mockBotConfig: BotSettings;

  beforeEach(() => {
    messageProcessor = new MessageProcessorService(mockConnectionString);
    
    // Mock bot configuration
    mockBotConfig = {
      greetingMessage: 'Welcome to Dynamic Business!',
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
        closedMessage: 'We are currently closed. Please try again during business hours.',
      },
      autoResponses: {
        welcomeMessage: 'How can I help you today?',
        serviceSelectionPrompt: 'Please choose from our services:',
        dateSelectionPrompt: 'What date works for you?',
        timeSelectionPrompt: 'What time would you prefer?',
        confirmationMessage: 'Please confirm your booking:',
        paymentInstructions: 'Please proceed with payment:',
        bookingConfirmedMessage: 'Your booking is confirmed! Thank you!',
        errorMessage: 'Something went wrong. Please try again.',
        invalidInputMessage: 'Invalid input. Please try again.',
      },
      conversationFlow: {
        steps: [
          {
            id: 'greeting',
            name: 'Greeting',
            type: 'greeting',
            prompt: 'Hello!',
            nextStep: 'service_selection',
          },
          {
            id: 'service_selection',
            name: 'Service Selection',
            type: 'service_selection',
            prompt: 'Choose a service',
            nextStep: 'date_selection',
          },
        ],
        fallbackBehavior: 'restart',
        maxRetries: 3,
        sessionTimeout: 30,
      },
      paymentSettings: {
        enabled: false,
        methods: [],
        currency: 'EUR',
        requirePayment: false,
      },
      notificationSettings: {
        emailNotifications: { enabled: false, recipientEmails: [], events: [] },
        smsNotifications: { enabled: false, recipientPhones: [], events: [] },
        webhookNotifications: { enabled: false, endpoints: [], events: [] },
      },
      customization: {
        brandColors: {
          primary: '#ff6b35',
          secondary: '#004e89',
          accent: '#009ffd',
          background: '#ffffff',
          text: '#333333',
        },
        companyInfo: {
          name: 'Dynamic Business',
          email: 'contact@dynamic.com',
        },
        customFields: [],
      },
    };

    // Mock the bot configuration service
    mockBotConfigService.getBotConfiguration.mockResolvedValue({
      success: true,
      data: mockBotConfig,
    });
  });

  afterEach(async () => {
    await messageProcessor.close();
  });

  describe('Dynamic Configuration Usage', () => {
    it('should use dynamic greeting message from configuration', async () => {
      // Disable business hours for this test
      const configWithoutBusinessHours = {
        ...mockBotConfig,
        businessHours: {
          ...mockBotConfig.businessHours,
          enabled: false,
        },
      };

      mockBotConfigService.getBotConfiguration.mockResolvedValueOnce({
        success: true,
        data: configWithoutBusinessHours,
      });

      const result = await messageProcessor['handleGreetingState']('550e8400-e29b-41d4-a716-446655440001', 'Hello', {});

      expect(result.success).toBe(true);
      expect(result.data!.response?.content).toContain('Welcome to Dynamic Business!');
      expect(result.data!.response?.content).toContain('How can I help you today?');
      expect(result.data!.newState).toBe('service_selection'); // From conversation flow
    });

    it('should use dynamic currency from payment settings', async () => {
      // Mock service repository to return a service
      vi.mocked(messageProcessor['serviceRepo'].list).mockResolvedValue({
        success: true,
        data: {
          data: [{
            id: 'service-1',
            tenantId: '550e8400-e29b-41d4-a716-446655440001',
            name: 'Haircut',
            price: 50,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          }],
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
        },
      });

      const message = {
        id: 'msg-1',
        from: '+1234567890',
        to: '+0987654321',
        text: { body: 'Haircut' },
        type: 'text' as const,
        timestamp: '2024-01-01T00:00:00Z',
      };

      const result = await messageProcessor['handleServiceSelectionState'](
        '550e8400-e29b-41d4-a716-446655440001',
        'Haircut',
        message,
        {}
      );

      expect(result.success).toBe(true);
      expect(result.data!.response?.content).toContain('50 EUR'); // Dynamic currency
      expect(result.data!.response?.content).toContain('What date works for you?'); // Dynamic prompt
    });

    it('should use dynamic invalid input message', async () => {
      const result = await messageProcessor['handleDateSelectionState'](
        '550e8400-e29b-41d4-a716-446655440001',
        'invalid-date',
        {}
      );

      expect(result.success).toBe(true);
      expect(result.data!.response?.content).toBe('Invalid input. Please try again.');
    });

    it('should use dynamic confirmation message', async () => {
      const result = await messageProcessor['handlePaymentState'](
        '550e8400-e29b-41d4-a716-446655440001',
        'maybe',
        {
          selectedServiceName: 'Haircut',
          selectedDate: '2024-12-25',
          selectedTime: '14:00',
          selectedServicePrice: 50,
        }
      );

      expect(result.success).toBe(true);
      expect(result.data!.response?.content).toContain('Please confirm your booking:');
    });

    it('should use dynamic booking confirmed message', async () => {
      const result = await messageProcessor['handlePaymentState'](
        '550e8400-e29b-41d4-a716-446655440001',
        'confirm',
        {
          selectedServiceName: 'Haircut',
          selectedDate: '2024-12-25',
          selectedTime: '14:00',
          selectedServicePrice: 50,
        }
      );

      expect(result.success).toBe(true);
      expect(result.data!.response?.content).toContain('Your booking is confirmed! Thank you!');
      expect(result.data!.response?.content).toContain('Thank you for choosing us!');
      expect(result.data!.response?.content).toContain('EUR'); // Dynamic currency
    });

    it('should handle business hours configuration', async () => {
      // Mock business hours as closed
      const closedConfig = {
        ...mockBotConfig,
        businessHours: {
          ...mockBotConfig.businessHours,
          enabled: true,
          schedule: {
            ...mockBotConfig.businessHours.schedule,
            // All days closed for this test
            monday: { isOpen: false, openTime: '09:00', closeTime: '17:00' },
            tuesday: { isOpen: false, openTime: '09:00', closeTime: '17:00' },
            wednesday: { isOpen: false, openTime: '09:00', closeTime: '17:00' },
            thursday: { isOpen: false, openTime: '09:00', closeTime: '17:00' },
            friday: { isOpen: false, openTime: '09:00', closeTime: '17:00' },
            saturday: { isOpen: false, openTime: '09:00', closeTime: '17:00' },
            sunday: { isOpen: false, openTime: '09:00', closeTime: '17:00' },
          },
        },
      };

      mockBotConfigService.getBotConfiguration.mockResolvedValueOnce({
        success: true,
        data: closedConfig,
      });

      const result = await messageProcessor['handleGreetingState']('550e8400-e29b-41d4-a716-446655440001', 'Hello', {});

      expect(result.success).toBe(true);
      expect(result.data!.response?.content).toBe('We are currently closed. Please try again during business hours.');
      expect(result.data!.newState).toBe('completed');
    });

    it('should handle configuration retrieval failures gracefully', async () => {
      mockBotConfigService.getBotConfiguration.mockResolvedValueOnce({
        success: false,
        error: {
          code: 'CONFIG_NOT_FOUND',
          message: 'Configuration not found',
        },
      });

      const result = await messageProcessor['handleGreetingState']('550e8400-e29b-41d4-a716-446655440001', 'Hello', {});

      expect(result.success).toBe(true);
      expect(result.data!.response?.content).toContain('our business'); // Fallback message
    });
  });

  describe('Real-time Configuration Updates', () => {
    it('should support configuration change subscriptions', () => {
      const unsubscribe = messageProcessor.subscribeToConfigurationChanges('550e8400-e29b-41d4-a716-446655440001');
      
      expect(typeof unsubscribe).toBe('function');
      expect(mockBotConfigService.subscribeToConfigurationChanges).toHaveBeenCalledWith(
        '550e8400-e29b-41d4-a716-446655440001',
        expect.any(Function)
      );
      
      // Test unsubscribe
      unsubscribe();
    });
  });
});