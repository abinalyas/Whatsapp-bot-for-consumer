/**
 * Dynamic Flow Processor Service
 * Processes WhatsApp messages using dynamic bot flows
 */

import { BotFlow } from '../../shared/types/bot-flow.types';

export class DynamicFlowProcessorService {
  private static instance: DynamicFlowProcessorService;
  private activeFlow: BotFlow | null = null;

  private constructor() {}

  static getInstance(): DynamicFlowProcessorService {
    if (!DynamicFlowProcessorService.instance) {
      DynamicFlowProcessorService.instance = new DynamicFlowProcessorService();
    }
    return DynamicFlowProcessorService.instance;
  }

  /**
   * Load active flow from localStorage (simulated)
   */
  async loadActiveFlow(): Promise<BotFlow | null> {
    try {
      // In a real implementation, this would load from database
      // For now, we'll simulate loading from localStorage
      const fs = require('fs');
      const path = require('path');
      
      // Try to load from the exact WhatsApp flow file
      const flowPath = path.join(process.cwd(), 'whatsapp-bot-flow-exact.json');
      if (fs.existsSync(flowPath)) {
        const flowData = JSON.parse(fs.readFileSync(flowPath, 'utf8'));
        this.activeFlow = flowData;
        console.log('✅ Active flow loaded:', flowData.name);
        return flowData;
      }
      
      return null;
    } catch (error) {
      console.error('Error loading active flow:', error);
      return null;
    }
  }

  /**
   * Process message using dynamic flow
   */
  async processMessage(
    phoneNumber: string,
    messageText: string,
    conversationState: string
  ): Promise<{
    response: string;
    newState: string;
    contextData?: any;
  }> {
    try {
      // Load active flow if not already loaded
      if (!this.activeFlow) {
        await this.loadActiveFlow();
      }

      if (!this.activeFlow) {
        throw new Error('No active flow found');
      }

      console.log('Processing message with dynamic flow:', {
        phoneNumber,
        messageText,
        conversationState,
        flowName: this.activeFlow.name
      });

      // Process based on conversation state
      switch (conversationState) {
        case 'greeting':
          return this.handleGreetingState();
        
        case 'awaiting_service':
          return this.handleServiceSelectionState(messageText);
        
        case 'awaiting_date':
          return this.handleDateSelectionState(messageText);
        
        case 'awaiting_time':
          return this.handleTimeSelectionState(messageText);
        
        case 'awaiting_payment':
          return this.handlePaymentState(messageText);
        
        default:
          return this.handleGreetingState();
      }
    } catch (error) {
      console.error('Error processing dynamic flow message:', error);
      return {
        response: 'Sorry, I encountered an error. Please try again.',
        newState: 'greeting'
      };
    }
  }

  /**
   * Handle greeting state using dynamic flow
   */
  private handleGreetingState(): { response: string; newState: string } {
    // Find the greeting message node
    const greetingNode = this.activeFlow?.nodes.find(node => 
      node.id === 'welcome_msg' || node.type === 'message'
    );

    if (greetingNode?.configuration?.message) {
      return {
        response: greetingNode.configuration.message,
        newState: 'awaiting_service'
      };
    }

    // Fallback to default greeting
    return {
      response: '👋 Welcome to Spark Salon!\n\nHere are our services:\n\n💇‍♀️ Haircut – ₹120\n💇‍♀️ Hair Color – ₹600\n💇‍♀️ Hair Styling – ₹300\n💅 Manicure – ₹200\n🦶 Pedicure – ₹65\n\nReply with the number or name of the service to book.',
      newState: 'awaiting_service'
    };
  }

  /**
   * Handle service selection state using dynamic flow
   */
  private handleServiceSelectionState(messageText: string): { response: string; newState: string } {
    // Find the service confirmed message node
    const serviceConfirmedNode = this.activeFlow?.nodes.find(node => 
      node.id === 'service_confirmed'
    );

    if (serviceConfirmedNode?.configuration?.message) {
      // Replace placeholders with actual values
      let response = serviceConfirmedNode.configuration.message;
      
      // For now, use a default service selection
      response = response.replace('{selectedService}', 'Haircut');
      response = response.replace('{price}', '120');
      
      // Generate dynamic dates
      const today = new Date();
      for (let i = 1; i <= 7; i++) {
        const futureDate = new Date(today);
        futureDate.setDate(today.getDate() + i);
        const dateStr = futureDate.toLocaleDateString('en-GB', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
        response = response.replace(`{date${i}}`, dateStr);
      }
      
      return {
        response,
        newState: 'awaiting_date'
      };
    }

    // Fallback
    return {
      response: 'Perfect! You\'ve selected Haircut (₹120).\n\n📅 Now, please select your preferred appointment date.',
      newState: 'awaiting_date'
    };
  }

  /**
   * Handle date selection state using dynamic flow
   */
  private handleDateSelectionState(messageText: string): { response: string; newState: string } {
    const dateConfirmedNode = this.activeFlow?.nodes.find(node => 
      node.id === 'date_confirmed'
    );

    if (dateConfirmedNode?.configuration?.message) {
      let response = dateConfirmedNode.configuration.message;
      
      // Replace date placeholder
      const today = new Date();
      const selectedDate = new Date(today);
      selectedDate.setDate(today.getDate() + parseInt(messageText));
      const readableDateStr = selectedDate.toLocaleDateString('en-GB', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      response = response.replace('{selectedDate}', readableDateStr);
      
      return {
        response,
        newState: 'awaiting_time'
      };
    }

    // Fallback
    return {
      response: 'Great! You\'ve selected the date.\n\n🕐 Now, please choose your preferred time slot.',
      newState: 'awaiting_time'
    };
  }

  /**
   * Handle time selection state using dynamic flow
   */
  private handleTimeSelectionState(messageText: string): { response: string; newState: string } {
    const bookingSummaryNode = this.activeFlow?.nodes.find(node => 
      node.id === 'booking_summary'
    );

    if (bookingSummaryNode?.configuration?.message) {
      let response = bookingSummaryNode.configuration.message;
      
      // Replace placeholders
      const timeSlots = ['10:00 AM', '11:30 AM', '02:00 PM', '03:30 PM', '05:00 PM'];
      const selectedTime = timeSlots[parseInt(messageText) - 1] || '10:00 AM';
      
      response = response.replace('{selectedTime}', selectedTime);
      response = response.replace('{selectedService}', 'Haircut');
      response = response.replace('{selectedDate}', 'Tomorrow');
      response = response.replace('{price}', '120');
      response = response.replace('{upiLink}', 'https://paytm.me/example-link');
      
      return {
        response,
        newState: 'awaiting_payment'
      };
    }

    // Fallback
    return {
      response: 'Perfect! Your appointment is scheduled.\n\n📋 Booking Summary:\nService: Haircut\nDate: Tomorrow\nTime: 10:00 AM\nAmount: ₹120',
      newState: 'awaiting_payment'
    };
  }

  /**
   * Handle payment state using dynamic flow
   */
  private handlePaymentState(messageText: string): { response: string; newState: string } {
    const paymentConfirmedNode = this.activeFlow?.nodes.find(node => 
      node.id === 'payment_confirmed'
    );

    if (paymentConfirmedNode?.configuration?.message) {
      let response = paymentConfirmedNode.configuration.message;
      
      // Replace placeholders
      response = response.replace('{selectedService}', 'Haircut');
      response = response.replace('{selectedDate}', 'Tomorrow');
      response = response.replace('{selectedTime}', '10:00 AM');
      
      return {
        response,
        newState: 'completed'
      };
    }

    // Fallback
    return {
      response: '✅ Payment received! Your appointment is now confirmed.\n\n🎉 Thank you for choosing Spark Salon!',
      newState: 'completed'
    };
  }

  /**
   * Update flow with new data
   */
  async updateFlow(flowData: BotFlow): Promise<void> {
    this.activeFlow = flowData;
    console.log('✅ Flow updated:', flowData.name);
  }
}
