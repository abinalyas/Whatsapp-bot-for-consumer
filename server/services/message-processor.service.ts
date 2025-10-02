/**
 * Multi-Tenant Message Processing Service
 * Handles WhatsApp message processing with tenant isolation and conversation state management
 */

import { eq, and } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import * as schema from '@shared/schema';
import { ConversationRepository } from '../repositories/conversation.repository';
import { ServiceRepository } from '../repositories/service.repository';
import { BotConfigurationService } from './bot-configuration.service';
import { WhatsAppBookingService, BookingContext } from './whatsapp-booking.service';
import type {
  ServiceResponse,
  TenantContext,
  Conversation,
  Message,
  Service,
  InsertMessage,
  InsertConversation,
  BotSettings,
  ConversationStep,
} from '@shared/types/tenant';

export interface WhatsAppMessage {
  id: string;
  from: string; // Phone number
  to: string; // WhatsApp Business phone number
  text?: {
    body: string;
  };
  type: 'text' | 'image' | 'document' | 'audio' | 'video' | 'interactive';
  timestamp: string;
  context?: {
    from: string;
    id: string;
  };
  interactive?: {
    type: 'button_reply' | 'list_reply';
    button_reply?: {
      id: string;
      title: string;
    };
    list_reply?: {
      id: string;
      title: string;
      description?: string;
    };
  };
}

export interface WhatsAppWebhookPayload {
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
        messages?: WhatsAppMessage[];
        statuses?: Array<{
          id: string;
          status: 'sent' | 'delivered' | 'read' | 'failed';
          timestamp: string;
          recipient_id: string;
        }>;
      };
      field: string;
    }>;
  }>;
}

export interface ProcessedMessage {
  messageId: string;
  conversationId: string;
  tenantId: string;
  phoneNumber: string;
  content: string;
  messageType: string;
  isFromBot: boolean;
  response?: {
    content: string;
    messageType: string;
    metadata?: any;
  };
  newState?: string;
  contextData?: any;
}

export interface ConversationState {
  current: string;
  data: Record<string, any>;
  availableTransitions: string[];
}

export interface BotResponse {
  content: string;
  messageType: 'text' | 'interactive' | 'template';
  metadata?: {
    buttons?: Array<{
      id: string;
      title: string;
    }>;
    list?: {
      header?: string;
      body: string;
      footer?: string;
      sections: Array<{
        title: string;
        rows: Array<{
          id: string;
          title: string;
          description?: string;
        }>;
      }>;
    };
  };
}

export class MessageProcessorService {
  private db: ReturnType<typeof drizzle>;
  private pool: Pool;
  private conversationRepo: ConversationRepository;
  private serviceRepo: ServiceRepository;
  private botConfigService: BotConfigurationService;
  private bookingService: WhatsAppBookingService;

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString });
    this.db = drizzle({ client: this.pool, schema });
    this.conversationRepo = new ConversationRepository(connectionString);
    this.serviceRepo = new ServiceRepository(connectionString);
    this.botConfigService = new BotConfigurationService(connectionString);
    this.bookingService = new WhatsAppBookingService();
  }

  // ===== MAIN MESSAGE PROCESSING =====

  /**
   * Process incoming WhatsApp webhook payload
   */
  async processWebhookPayload(payload: WhatsAppWebhookPayload): Promise<ServiceResponse<ProcessedMessage[]>> {
    try {
      const processedMessages: ProcessedMessage[] = [];

      for (const entry of payload.entry) {
        for (const change of entry.changes) {
          if (change.field === 'messages' && change.value.messages) {
            for (const message of change.value.messages) {
              // Identify tenant from phone number
              const tenantResult = await this.identifyTenantFromPhoneNumber(
                change.value.metadata.phone_number_id
              );

              if (!tenantResult.success) {
                console.error('Failed to identify tenant:', tenantResult.error);
                continue;
              }

              const tenantContext = tenantResult.data!;

              // Process individual message
              const processResult = await this.processMessage(message, tenantContext);
              if (processResult.success) {
                processedMessages.push(processResult.data!);
              } else {
                console.error('Failed to process message:', processResult.error);
              }
            }
          }
        }
      }

      return {
        success: true,
        data: processedMessages,
      };
    } catch (error) {
      console.error('Error processing webhook payload:', error);
      return {
        success: false,
        error: {
          code: 'WEBHOOK_PROCESSING_FAILED',
          message: 'Failed to process webhook payload',
        },
      };
    }
  }

  /**
   * Process individual WhatsApp message
   */
  async processMessage(
    message: WhatsAppMessage,
    tenantContext: TenantContext
  ): Promise<ServiceResponse<ProcessedMessage>> {
    try {
      const { tenantId } = tenantContext;
      const phoneNumber = message.from;

      // Get or create conversation
      const conversationResult = await this.getOrCreateConversation(
        tenantId,
        phoneNumber,
        message
      );

      if (!conversationResult.success) {
        return {
          success: false,
          error: conversationResult.error!,
        };
      }

      const conversation = conversationResult.data!;

      // Extract message content
      const content = this.extractMessageContent(message);

      // Save incoming message
      const messageData: InsertMessage = {
        tenantId,
        conversationId: conversation.id,
        content,
        messageType: message.type,
        isFromBot: false,
        metadata: {
          whatsappMessageId: message.id,
          timestamp: message.timestamp,
          interactive: message.interactive,
        },
      };

      const [savedMessage] = await this.db
        .insert(schema.messages)
        .values(messageData)
        .returning();

      // Process conversation state and generate response
      const stateResult = await this.processConversationState(
        tenantId,
        conversation,
        content,
        message
      );

      if (!stateResult.success) {
        return {
          success: false,
          error: stateResult.error!,
        };
      }

      const { newState, response, contextData } = stateResult.data!;

      // Update conversation state if changed
      if (newState && newState !== conversation.currentState) {
        await this.conversationRepo.updateState(
          tenantId,
          conversation.id,
          newState,
          contextData
        );
      }

      // Save bot response message if generated
      let responseMessageId: string | undefined;
      if (response) {
        const responseMessageData: InsertMessage = {
          tenantId,
          conversationId: conversation.id,
          content: response.content,
          messageType: response.messageType,
          isFromBot: true,
          metadata: response.metadata || {},
        };

        const [responseMessage] = await this.db
          .insert(schema.messages)
          .values(responseMessageData)
          .returning();

        responseMessageId = responseMessage.id;
      }

      const processedMessage: ProcessedMessage = {
        messageId: savedMessage.id,
        conversationId: conversation.id,
        tenantId,
        phoneNumber,
        content,
        messageType: message.type,
        isFromBot: false,
        response,
        newState,
        contextData,
      };

      return {
        success: true,
        data: processedMessage,
        metadata: {
          responseMessageId,
          previousState: conversation.currentState,
        },
      };
    } catch (error) {
      console.error('Error processing message:', error);
      return {
        success: false,
        error: {
          code: 'MESSAGE_PROCESSING_FAILED',
          message: 'Failed to process message',
        },
      };
    }
  }

  // ===== TENANT IDENTIFICATION =====

  /**
   * Identify tenant from WhatsApp phone number ID
   */
  async identifyTenantFromPhoneNumber(phoneNumberId: string): Promise<ServiceResponse<TenantContext>> {
    try {
      const [tenant] = await this.db
        .select()
        .from(schema.tenants)
        .where(eq(schema.tenants.whatsappPhoneId, phoneNumberId))
        .limit(1);

      if (!tenant) {
        return {
          success: false,
          error: {
            code: 'TENANT_NOT_FOUND',
            message: 'No tenant found for WhatsApp phone number',
            details: { phoneNumberId },
          },
        };
      }

      // Get subscription limits (simplified)
      const subscriptionLimits = {
        messagesPerMonth: 1000,
        bookingsPerMonth: 100,
        apiCallsPerDay: 1000,
      };

      // Get current usage (simplified)
      const currentUsage = {
        messages_sent: 0,
        messages_received: 0,
        bookings_created: 0,
        api_calls: 0,
        storage_used: 0,
        webhook_calls: 0,
      };

      const tenantContext: TenantContext = {
        tenantId: tenant.id,
        permissions: ['webhook:receive'],
        subscriptionLimits,
        currentUsage,
      };

      return {
        success: true,
        data: tenantContext,
      };
    } catch (error) {
      console.error('Error identifying tenant:', error);
      return {
        success: false,
        error: {
          code: 'TENANT_IDENTIFICATION_FAILED',
          message: 'Failed to identify tenant',
        },
      };
    }
  }

  // ===== CONVERSATION MANAGEMENT =====

  /**
   * Get existing conversation or create new one
   */
  async getOrCreateConversation(
    tenantId: string,
    phoneNumber: string,
    message: WhatsAppMessage
  ): Promise<ServiceResponse<Conversation>> {
    try {
      // Try to find existing conversation
      const existingResult = await this.conversationRepo.findByPhoneNumber(tenantId, phoneNumber);

      if (existingResult.success) {
        return existingResult;
      }

      // Create new conversation
      const customerName = this.extractCustomerName(message);
      
      const conversationData: InsertConversation = {
        tenantId,
        phoneNumber,
        customerName,
        currentState: 'greeting',
        contextData: {
          firstMessageId: message.id,
          firstMessageTimestamp: message.timestamp,
        },
      };

      return this.conversationRepo.create(tenantId, conversationData);
    } catch (error) {
      console.error('Error getting or creating conversation:', error);
      return {
        success: false,
        error: {
          code: 'CONVERSATION_CREATION_FAILED',
          message: 'Failed to get or create conversation',
        },
      };
    }
  }

  // ===== CONVERSATION STATE PROCESSING =====

  /**
   * Process conversation state and generate appropriate response
   */
  async processConversationState(
    tenantId: string,
    conversation: Conversation,
    messageContent: string,
    message: WhatsAppMessage
  ): Promise<ServiceResponse<{
    newState?: string;
    response?: BotResponse;
    contextData?: any;
  }>> {
    try {
      const currentState = conversation.currentState;
      const contextData = conversation.contextData || {};

      switch (currentState) {
        case 'greeting':
          return this.handleGreetingState(tenantId, messageContent, contextData);

        case 'awaiting_service':
          return this.handleServiceSelectionState(tenantId, messageContent, message, contextData);

        case 'awaiting_date':
          return this.handleDateSelectionState(tenantId, messageContent, contextData);

        case 'awaiting_time':
          return this.handleTimeSelectionState(tenantId, messageContent, contextData);

        case 'awaiting_payment':
          return this.handlePaymentState(tenantId, messageContent, contextData);

        case 'completed':
          return this.handleCompletedState(tenantId, messageContent, contextData);

        case 'booking_flow':
          return this.handleBookingFlowState(tenantId, messageContent, message, contextData);

        default:
          return this.handleUnknownState(tenantId, messageContent, contextData);
      }
    } catch (error) {
      console.error('Error processing conversation state:', error);
      return {
        success: false,
        error: {
          code: 'STATE_PROCESSING_FAILED',
          message: 'Failed to process conversation state',
        },
      };
    }
  }

  /**
   * Handle greeting state
   */
  private async handleGreetingState(
    tenantId: string,
    messageContent: string,
    contextData: any
  ): Promise<ServiceResponse<{ newState?: string; response?: BotResponse; contextData?: any }>> {
    try {
      // Check if this is a booking request
      const bookingKeywords = ['book', 'appointment', 'booking', 'schedule', 'reserve'];
      const isBookingRequest = bookingKeywords.some(keyword => 
        messageContent.toLowerCase().includes(keyword)
      );

      if (isBookingRequest) {
        // Initialize booking context
        const bookingContext: BookingContext = {
          tenantId,
          customerPhone: contextData.customerPhone || 'unknown',
          currentStep: 'welcome'
        };

        // Process booking message
        const bookingResult = await this.bookingService.processBookingMessage(
          { text: { body: messageContent } } as any,
          tenantId,
          bookingContext
        );

        if (bookingResult.success) {
          return {
            success: true,
            data: {
              newState: 'booking_flow',
              response: {
                content: bookingResult.message,
                messageType: 'text',
              },
              contextData: {
                ...contextData,
                bookingContext: {
                  ...bookingContext,
                  currentStep: bookingResult.nextStep || 'service_selection'
                },
                isBookingFlow: true,
              },
            },
          };
        }
      }

      // Get bot configuration for personalized greeting
      const configResult = await this.botConfigService.getBotConfiguration(tenantId);
      if (!configResult.success) {
        console.error('Failed to get bot configuration:', configResult.error);
        // Fallback to default greeting
        const response: BotResponse = {
          content: 'Hello! Welcome to Bella Salon. I\'m here to help you book an appointment. Type "book appointment" to get started!',
          messageType: 'text',
        };

        return {
          success: true,
          data: {
            newState: 'greeting',
            response,
            contextData: {
              ...contextData,
              greetingSent: true,
            },
          },
        };
      }

      const botSettings = configResult.data!;
      
      // Check business hours if enabled
      if (botSettings.businessHours.enabled) {
        const isWithinBusinessHours = this.checkBusinessHours(botSettings.businessHours);
        if (!isWithinBusinessHours) {
          const response: BotResponse = {
            content: botSettings.businessHours.closedMessage || 'We are currently closed. Please try again during business hours.',
            messageType: 'text',
          };

          return {
            success: true,
            data: {
              newState: 'completed',
              response,
              contextData: {
                ...contextData,
                closedMessageSent: true,
              },
            },
          };
        }
      }

      // Use configured greeting message
      const greetingMessage = botSettings.greetingMessage || 'Hello! Welcome to our business.';
      const welcomeMessage = botSettings.autoResponses.welcomeMessage || 'How can I help you today?';
      
      const response: BotResponse = {
        content: `${greetingMessage}\n\n${welcomeMessage}`,
        messageType: 'text',
      };

      // Determine next state based on conversation flow
      const nextStep = this.getNextConversationStep(botSettings, 'greeting');
      const newState = nextStep?.id || 'awaiting_service';

      return {
        success: true,
        data: {
          newState,
          response,
          contextData: {
            ...contextData,
            greetingSent: true,
            configVersion: configResult.metadata?.version,
          },
        },
      };
    } catch (error) {
      console.error('Error in handleGreetingState:', error);
      return {
        success: false,
        error: {
          code: 'GREETING_STATE_ERROR',
          message: 'Failed to handle greeting state',
        },
      };
    }
  }

  /**
   * Handle service selection state
   */
  private async handleServiceSelectionState(
    tenantId: string,
    messageContent: string,
    message: WhatsAppMessage,
    contextData: any
  ): Promise<ServiceResponse<{ newState?: string; response?: BotResponse; contextData?: any }>> {
    // Get available services
    const servicesResult = await this.serviceRepo.list(tenantId, { page: 1, limit: 10 });
    
    if (!servicesResult.success || !servicesResult.data?.data.length) {
      const response: BotResponse = {
        content: 'Sorry, no services are currently available. Please contact us directly.',
        messageType: 'text',
      };

      return {
        success: true,
        data: {
          newState: 'completed',
          response,
          contextData,
        },
      };
    }

    const services = servicesResult.data.data;

    // Check if user selected a service by button or text
    let selectedService: Service | undefined;

    if (message.interactive?.button_reply) {
      const serviceId = message.interactive.button_reply.id;
      selectedService = services.find(s => s.id === serviceId);
    } else {
      // Try to match by service name
      const lowerContent = messageContent.toLowerCase();
      selectedService = services.find(s => 
        s.name.toLowerCase().includes(lowerContent) || 
        lowerContent.includes(s.name.toLowerCase())
      );
    }

    if (selectedService) {
      // Get bot configuration for customized prompts
      const configResult = await this.botConfigService.getBotConfiguration(tenantId);
      const botSettings = configResult.success ? configResult.data! : null;

      // Use configured date selection prompt
      const datePrompt = botSettings?.autoResponses.dateSelectionPrompt || 'Please select your preferred date (YYYY-MM-DD format, e.g., 2024-01-15):';
      const currency = botSettings?.paymentSettings.currency || 'USD';
      
      const response: BotResponse = {
        content: `Great! You've selected ${selectedService.name} (${selectedService.price} ${currency}). ${datePrompt}`,
        messageType: 'text',
      };

      // Determine next state from conversation flow
      const nextStep = this.getNextConversationStep(botSettings, 'service_selection');
      const newState = nextStep?.id || 'awaiting_date';

      return {
        success: true,
        data: {
          newState,
          response,
          contextData: {
            ...contextData,
            selectedServiceId: selectedService.id,
            selectedServiceName: selectedService.name,
            selectedServicePrice: selectedService.price,
          },
        },
      };
    }

    // Show service options
    const buttons = services.slice(0, 3).map(service => ({
      id: service.id,
      title: `${service.name} - $${service.price}`,
    }));

    // Get bot configuration for customized prompts
    const configResult = await this.botConfigService.getBotConfiguration(tenantId);
    const botSettings = configResult.success ? configResult.data! : null;

    // Show service options with configured prompt
    const servicePrompt = botSettings?.autoResponses.serviceSelectionPrompt || 'Please select a service:';

    const response: BotResponse = {
      content: servicePrompt,
      messageType: 'interactive',
      metadata: {
        buttons,
      },
    };

    return {
      success: true,
      data: {
        response,
        contextData,
      },
    };
  }

  /**
   * Handle date selection state
   */
  private async handleDateSelectionState(
    tenantId: string,
    messageContent: string,
    contextData: any
  ): Promise<ServiceResponse<{ newState?: string; response?: BotResponse; contextData?: any }>> {
    try {
      // Get bot configuration for customized prompts
      const configResult = await this.botConfigService.getBotConfiguration(tenantId);
      const botSettings = configResult.success ? configResult.data! : null;

      // Validate date format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(messageContent.trim())) {
        const invalidInputMessage = this.getConfiguredResponse(
          botSettings,
          'invalidInputMessage',
          'Please enter a valid date in YYYY-MM-DD format (e.g., 2024-01-15):'
        );
        
        const response: BotResponse = {
          content: invalidInputMessage,
          messageType: 'text',
        };

        return {
          success: true,
          data: {
            response,
            contextData,
          },
        };
      }

      const selectedDate = messageContent.trim();
      const date = new Date(selectedDate);
      
      // Check if date is in the future
      if (date <= new Date()) {
        const response: BotResponse = {
          content: 'Please select a future date. What date would you prefer?',
          messageType: 'text',
        };

        return {
          success: true,
          data: {
            response,
            contextData,
          },
        };
      }

      // Use configured time selection prompt
      const timePrompt = this.getConfiguredResponse(
        botSettings,
        'timeSelectionPrompt',
        'What time would you prefer? Please enter in HH:MM format (e.g., 14:30 for 2:30 PM):'
      );

      const response: BotResponse = {
        content: `Perfect! You've selected ${selectedDate}. ${timePrompt}`,
        messageType: 'text',
      };

      // Determine next state from conversation flow
      const nextStep = this.getNextConversationStep(botSettings, 'date_selection');
      const newState = nextStep?.id || 'awaiting_time';

      return {
        success: true,
        data: {
          newState,
          response,
          contextData: {
            ...contextData,
            selectedDate,
          },
        },
      };
    } catch (error) {
      console.error('Error in handleDateSelectionState:', error);
      return {
        success: false,
        error: {
          code: 'DATE_SELECTION_ERROR',
          message: 'Failed to handle date selection',
        },
      };
    }
  }

  /**
   * Handle time selection state
   */
  private async handleTimeSelectionState(
    tenantId: string,
    messageContent: string,
    contextData: any
  ): Promise<ServiceResponse<{ newState?: string; response?: BotResponse; contextData?: any }>> {
    // Validate time format
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(messageContent.trim())) {
      const response: BotResponse = {
        content: 'Please enter a valid time in HH:MM format (e.g., 14:30 for 2:30 PM):',
        messageType: 'text',
      };

      return {
        success: true,
        data: {
          response,
          contextData,
        },
      };
    }

    const selectedTime = messageContent.trim();
    const serviceName = contextData.selectedServiceName || 'the service';
    const servicePrice = contextData.selectedServicePrice || 0;
    const selectedDate = contextData.selectedDate;

    const response: BotResponse = {
      content: `Excellent! Here's your booking summary:
      
Service: ${serviceName}
Date: ${selectedDate}
Time: ${selectedTime}
Price: $${servicePrice}

To confirm your booking, please reply with "CONFIRM". To cancel, reply with "CANCEL".`,
      messageType: 'text',
    };

    return {
      success: true,
      data: {
        newState: 'awaiting_payment',
        response,
        contextData: {
          ...contextData,
          selectedTime,
        },
      },
    };
  }

  /**
   * Handle payment/confirmation state
   */
  private async handlePaymentState(
    tenantId: string,
    messageContent: string,
    contextData: any
  ): Promise<ServiceResponse<{ newState?: string; response?: BotResponse; contextData?: any }>> {
    // Get bot configuration for customized messages
    const configResult = await this.botConfigService.getBotConfiguration(tenantId);
    const botSettings = configResult.success ? configResult.data! : null;
    
    const content = messageContent.trim().toLowerCase();

    if (content === 'confirm') {
      // Create booking record
      const bookingData = {
        tenantId,
        conversationId: contextData.conversationId,
        serviceId: contextData.selectedServiceId,
        phoneNumber: contextData.phoneNumber,
        amount: contextData.selectedServicePrice,
        status: 'confirmed' as const,
        appointmentDate: new Date(`${contextData.selectedDate}T${contextData.selectedTime}:00`),
        appointmentTime: contextData.selectedTime,
      };

      // Use configured booking confirmation message
      const confirmationMessage = this.getConfiguredResponse(
        botSettings,
        'bookingConfirmedMessage',
        'Your booking has been confirmed! Thank you for choosing us!'
      );

      const currency = botSettings?.paymentSettings.currency || 'USD';

      // In a real implementation, would save to bookings table
      const response: BotResponse = {
        content: `🎉 ${confirmationMessage}

Service: ${contextData.selectedServiceName}
Date: ${contextData.selectedDate}
Time: ${contextData.selectedTime}
Price: ${contextData.selectedServicePrice} ${currency}

We'll send you a reminder before your appointment. Thank you for choosing us!`,
        messageType: 'text',
      };

      return {
        success: true,
        data: {
          newState: 'completed',
          response,
          contextData: {
            ...contextData,
            bookingConfirmed: true,
          },
        },
      };
    } else if (content === 'cancel') {
      const response: BotResponse = {
        content: 'Your booking has been cancelled. Feel free to start over anytime by sending us a message!',
        messageType: 'text',
      };

      return {
        success: true,
        data: {
          newState: 'completed',
          response,
          contextData: {
            ...contextData,
            bookingCancelled: true,
          },
        },
      };
    }

    // Use configured confirmation prompt
    const confirmationPrompt = this.getConfiguredResponse(
      botSettings,
      'confirmationMessage',
      'Please reply with "CONFIRM" to confirm your booking or "CANCEL" to cancel.'
    );

    const response: BotResponse = {
      content: confirmationPrompt,
      messageType: 'text',
    };

    return {
      success: true,
      data: {
        response,
        contextData,
      },
    };
  }

  /**
   * Handle completed state
   */
  private async handleCompletedState(
    tenantId: string,
    messageContent: string,
    contextData: any
  ): Promise<ServiceResponse<{ newState?: string; response?: BotResponse; contextData?: any }>> {
    const response: BotResponse = {
      content: 'Hello! Would you like to make a new booking? Just let me know what service you need!',
      messageType: 'text',
    };

    return {
      success: true,
      data: {
        newState: 'awaiting_service',
        response,
        contextData: {
          previousBooking: contextData,
        },
      },
    };
  }

  /**
   * Handle booking flow state
   */
  private async handleBookingFlowState(
    tenantId: string,
    messageContent: string,
    message: WhatsAppMessage,
    contextData: any
  ): Promise<ServiceResponse<{ newState?: string; response?: BotResponse; contextData?: any }>> {
    try {
      const bookingContext = contextData.bookingContext as BookingContext;
      
      if (!bookingContext) {
        return {
          success: false,
          error: {
            code: 'BOOKING_CONTEXT_MISSING',
            message: 'Booking context not found',
          },
        };
      }

      // Update customer phone from message
      bookingContext.customerPhone = message.from;

      // Process booking message
      const bookingResult = await this.bookingService.processBookingMessage(
        message,
        tenantId,
        bookingContext
      );

      if (bookingResult.success) {
        const newState = bookingResult.nextStep === 'completed' ? 'completed' : 'booking_flow';
        
        return {
          success: true,
          data: {
            newState,
            response: {
              content: bookingResult.message,
              messageType: 'text',
            },
            contextData: {
              ...contextData,
              bookingContext: {
                ...bookingContext,
                currentStep: bookingResult.nextStep || bookingContext.currentStep
              },
              appointmentId: bookingResult.appointmentId,
            },
          },
        };
      } else {
        return {
          success: true,
          data: {
            response: {
              content: bookingResult.message,
              messageType: 'text',
            },
            contextData,
          },
        };
      }
    } catch (error) {
      console.error('Error handling booking flow state:', error);
      return {
        success: false,
        error: {
          code: 'BOOKING_FLOW_ERROR',
          message: 'Failed to process booking flow',
        },
      };
    }
  }

  /**
   * Handle unknown state
   */
  private async handleUnknownState(
    tenantId: string,
    messageContent: string,
    contextData: any
  ): Promise<ServiceResponse<{ newState?: string; response?: BotResponse; contextData?: any }>> {
    const response: BotResponse = {
      content: 'I apologize, but something went wrong. Let me help you start over. What service would you like to book?',
      messageType: 'text',
    };

    return {
      success: true,
      data: {
        newState: 'awaiting_service',
        response,
        contextData: {
          error: 'unknown_state',
          previousState: contextData.currentState,
        },
      },
    };
  }

  // ===== UTILITY METHODS =====

  /**
   * Extract message content from WhatsApp message
   */
  private extractMessageContent(message: WhatsAppMessage): string {
    if (message.text?.body) {
      return message.text.body;
    }

    if (message.interactive?.button_reply) {
      return message.interactive.button_reply.title;
    }

    if (message.interactive?.list_reply) {
      return message.interactive.list_reply.title;
    }

    return `[${message.type} message]`;
  }

  /**
   * Extract customer name from message (simplified)
   */
  private extractCustomerName(message: WhatsAppMessage): string | undefined {
    // In a real implementation, would extract from WhatsApp contact info
    return undefined;
  }

  /**
   * Get conversation state information
   */
  async getConversationState(
    tenantId: string,
    conversationId: string
  ): Promise<ServiceResponse<ConversationState>> {
    try {
      const conversationResult = await this.conversationRepo.findById(tenantId, conversationId);
      
      if (!conversationResult.success) {
        return {
          success: false,
          error: conversationResult.error!,
        };
      }

      const conversation = conversationResult.data!;
      const availableTransitions = this.getAvailableStateTransitions(conversation.currentState);

      return {
        success: true,
        data: {
          current: conversation.currentState,
          data: conversation.contextData || {},
          availableTransitions,
        },
      };
    } catch (error) {
      console.error('Error getting conversation state:', error);
      return {
        success: false,
        error: {
          code: 'STATE_RETRIEVAL_FAILED',
          message: 'Failed to get conversation state',
        },
      };
    }
  }

  /**
   * Get available state transitions for current state
   */
  private getAvailableStateTransitions(currentState: string): string[] {
    const stateTransitions: Record<string, string[]> = {
      greeting: ['awaiting_service'],
      awaiting_service: ['awaiting_date', 'completed'],
      awaiting_date: ['awaiting_time', 'awaiting_service'],
      awaiting_time: ['awaiting_payment', 'awaiting_date'],
      awaiting_payment: ['completed', 'awaiting_time'],
      completed: ['awaiting_service'],
    };

    return stateTransitions[currentState] || [];
  }

  // ===== DYNAMIC CONFIGURATION HELPERS =====

  /**
   * Check if current time is within business hours
   */
  private checkBusinessHours(businessHours: any): boolean {
    try {
      if (!businessHours.enabled) {
        return true; // Always open if business hours not enabled
      }

      const now = new Date();
      const timezone = businessHours.timezone || 'UTC';
      
      // Convert current time to tenant's timezone
      const currentTime = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        weekday: 'long',
      });

      const parts = currentTime.formatToParts(now);
      const weekday = parts.find(p => p.type === 'weekday')?.value.toLowerCase();
      const hour = parts.find(p => p.type === 'hour')?.value;
      const minute = parts.find(p => p.type === 'minute')?.value;
      const currentTimeStr = `${hour}:${minute}`;

      if (!weekday) return true;

      // Map weekday names
      const dayMap: Record<string, string> = {
        'monday': 'monday',
        'tuesday': 'tuesday', 
        'wednesday': 'wednesday',
        'thursday': 'thursday',
        'friday': 'friday',
        'saturday': 'saturday',
        'sunday': 'sunday',
      };

      const dayKey = dayMap[weekday];
      if (!dayKey) return true;

      const daySchedule = businessHours.schedule[dayKey];
      if (!daySchedule || !daySchedule.isOpen) {
        return false;
      }

      // Check if current time is within open hours
      const openTime = daySchedule.openTime;
      const closeTime = daySchedule.closeTime;

      if (!openTime || !closeTime) return true;

      return currentTimeStr >= openTime && currentTimeStr <= closeTime;
    } catch (error) {
      console.error('Error checking business hours:', error);
      return true; // Default to open on error
    }
  }

  /**
   * Get next conversation step from bot configuration
   */
  private getNextConversationStep(botSettings: BotSettings | null, currentStepType: string): ConversationStep | null {
    try {
      if (!botSettings?.conversationFlow?.steps) {
        return null;
      }

      const currentStep = botSettings.conversationFlow.steps.find(step => step.type === currentStepType);
      if (!currentStep?.nextStep) {
        return null;
      }

      return botSettings.conversationFlow.steps.find(step => step.id === currentStep.nextStep) || null;
    } catch (error) {
      console.error('Error getting next conversation step:', error);
      return null;
    }
  }

  /**
   * Get configured response message
   */
  private getConfiguredResponse(botSettings: BotSettings | null, responseKey: keyof any, fallback: string): string {
    try {
      return botSettings?.autoResponses?.[responseKey] || fallback;
    } catch (error) {
      console.error('Error getting configured response:', error);
      return fallback;
    }
  }

  /**
   * Subscribe to configuration changes for real-time updates
   */
  subscribeToConfigurationChanges(tenantId: string): () => void {
    return this.botConfigService.subscribeToConfigurationChanges(tenantId, (event) => {
      console.log(`Configuration changed for tenant ${tenantId}:`, event.configType);
      // Could implement cache invalidation or other real-time updates here
    });
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    await this.botConfigService.close();
    await this.pool.end();
  }
}