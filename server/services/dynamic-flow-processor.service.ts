import { IStorage } from '../storage';
import { BotFlow, BotFlowNode } from '../../shared/types/bot-flow.types';

export interface DynamicFlowContext {
  tenantId: string;
  phoneNumber: string;
  conversationId: string;
  currentState: string;
  selectedService?: string;
  selectedDate?: string;
  selectedTime?: string;
}

export interface ProcessedMessage {
  content: string;
  messageType: 'text' | 'interactive' | 'template';
  metadata?: Record<string, any>;
}

export class DynamicFlowProcessorService {
  constructor(private storage: IStorage) {}

  /**
   * Process a bot flow node with dynamic data from database
   */
  async processNode(
    node: BotFlowNode,
    context: DynamicFlowContext
  ): Promise<ProcessedMessage> {
    try {
      switch (node.type) {
        case 'message':
          return await this.processMessageNode(node, context);
        case 'service_message':
          return await this.processServiceMessageNode(node, context);
        case 'question':
          return await this.processQuestionNode(node, context);
        case 'service_list':
          return await this.processServiceListNode(node, context);
        case 'date_picker':
          return await this.processDatePickerNode(node, context);
        case 'time_slots':
          return await this.processTimeSlotsNode(node, context);
        case 'booking_summary':
          return await this.processBookingSummaryNode(node, context);
        default:
          return {
            content: node.configuration?.message || 'Hello!',
            messageType: 'text'
          };
      }
    } catch (error) {
      console.error('Error processing dynamic node:', error);
      return {
        content: node.configuration?.message || 'Sorry, I encountered an error.',
        messageType: 'text'
      };
    }
  }

  /**
   * Process service message node - shows services with real data
   */
  private async processServiceMessageNode(
    node: BotFlowNode,
    context: DynamicFlowContext
  ): Promise<ProcessedMessage> {
    try {
      // Load services from database
      const services = await this.storage.getServices();
      
      if (!services || services.length === 0) {
        return {
          content: 'Sorry, no services are currently available.',
          messageType: 'text'
        };
      }

      // Build dynamic service list
      const serviceList = services
        .filter(service => service.isActive)
        .map((service, index) => {
          const emoji = this.getServiceEmoji(service.category);
          return `${index + 1}. ${emoji} ${service.name} – ₹${service.price}`;
        })
        .join('\n');

      // Get welcome message from node configuration
      const welcomeText = node.configuration?.welcomeText || 'Welcome to our salon!';
      const serviceIntro = node.configuration?.serviceIntro || 'Here are our services:';
      const instruction = node.configuration?.instruction || 'Reply with the number or name of the service to book.';

      const content = `${welcomeText}\n\n${serviceIntro}\n${serviceList}\n\n${instruction}`;

      return {
        content,
        messageType: 'text',
        metadata: {
          services: services.map(s => ({
            id: s.id,
            name: s.name,
            price: s.price,
            category: s.category
          }))
        }
      };
    } catch (error) {
      console.error('Error processing service message node:', error);
      return {
        content: node.configuration?.message || 'Welcome! Please contact us for services.',
        messageType: 'text'
      };
    }
  }

  /**
   * Process service list node - interactive service selection
   */
  private async processServiceListNode(
    node: BotFlowNode,
    context: DynamicFlowContext
  ): Promise<ProcessedMessage> {
    try {
      const services = await this.storage.getServices();
      const activeServices = services.filter(service => service.isActive);

      if (activeServices.length === 0) {
        return {
          content: 'No services are currently available.',
          messageType: 'text'
        };
      }

      // Create interactive service list
      const serviceOptions = activeServices.map((service, index) => ({
        id: `service_${service.id}`,
        title: service.name,
        description: `₹${service.price} • ${service.durationMinutes || 60} min`,
        emoji: this.getServiceEmoji(service.category)
      }));

      return {
        content: 'Please select a service:',
        messageType: 'interactive',
        metadata: {
          type: 'service_selection',
          options: serviceOptions,
          maxSelections: 1
        }
      };
    } catch (error) {
      console.error('Error processing service list node:', error);
      return {
        content: 'Please contact us for service information.',
        messageType: 'text'
      };
    }
  }

  /**
   * Process date picker node - shows available dates
   */
  private async processDatePickerNode(
    node: BotFlowNode,
    context: DynamicFlowContext
  ): Promise<ProcessedMessage> {
    try {
      // Generate available dates (next 7-14 days)
      const availableDates = this.generateAvailableDates(7);
      
      const dateOptions = availableDates.map((date, index) => ({
        id: `date_${date}`,
        title: this.formatDate(date),
        description: this.getDayOfWeek(date)
      }));

      return {
        content: 'Please select your preferred date:',
        messageType: 'interactive',
        metadata: {
          type: 'date_selection',
          options: dateOptions,
          maxSelections: 1
        }
      };
    } catch (error) {
      console.error('Error processing date picker node:', error);
      return {
        content: 'Please contact us to schedule your appointment.',
        messageType: 'text'
      };
    }
  }

  /**
   * Process time slots node - shows available times for selected date
   */
  private async processTimeSlotsNode(
    node: BotFlowNode,
    context: DynamicFlowContext
  ): Promise<ProcessedMessage> {
    try {
      if (!context.selectedDate) {
        return {
          content: 'Please select a date first.',
          messageType: 'text'
        };
      }

      // Generate available time slots for the selected date
      const timeSlots = this.generateTimeSlots(context.selectedDate);
      
      const timeOptions = timeSlots.map((time, index) => ({
        id: `time_${time}`,
        title: time,
        description: this.getTimeDescription(time)
      }));

      return {
        content: `Please select your preferred time for ${this.formatDate(context.selectedDate)}:`,
        messageType: 'interactive',
        metadata: {
          type: 'time_selection',
          options: timeOptions,
          maxSelections: 1
        }
      };
    } catch (error) {
      console.error('Error processing time slots node:', error);
      return {
        content: 'Please contact us to schedule your appointment.',
        messageType: 'text'
      };
    }
  }

  /**
   * Process booking summary node - shows final booking details
   */
  private async processBookingSummaryNode(
    node: BotFlowNode,
    context: DynamicFlowContext
  ): Promise<ProcessedMessage> {
    try {
      if (!context.selectedService || !context.selectedDate || !context.selectedTime) {
        return {
          content: 'Please complete your service, date, and time selection.',
          messageType: 'text'
        };
      }

      // Get service details
      const service = await this.storage.getService(context.selectedService);
      if (!service) {
        return {
          content: 'Service not found. Please start over.',
          messageType: 'text'
        };
      }

      const summary = `📋 **Booking Summary**

🎯 **Service:** ${service.name}
💰 **Price:** ₹${service.price}
⏱️ **Duration:** ${service.durationMinutes || 60} minutes
📅 **Date:** ${this.formatDate(context.selectedDate)}
🕐 **Time:** ${context.selectedTime}

Please confirm your booking by replying "CONFIRM" or "YES".`;

      return {
        content: summary,
        messageType: 'text',
        metadata: {
          type: 'booking_summary',
          service: service,
          date: context.selectedDate,
          time: context.selectedTime
        }
      };
    } catch (error) {
      console.error('Error processing booking summary node:', error);
      return {
        content: 'Please contact us to complete your booking.',
        messageType: 'text'
      };
    }
  }

  /**
   * Process regular message node with placeholder replacement
   */
  private async processMessageNode(
    node: BotFlowNode,
    context: DynamicFlowContext
  ): Promise<ProcessedMessage> {
    let content = node.configuration?.message || 'Hello!';
    
    // Replace placeholders with dynamic data
    content = this.replacePlaceholders(content, context);
    
    return {
      content,
      messageType: 'text'
    };
  }

  /**
   * Process question node with dynamic options
   */
  private async processQuestionNode(
    node: BotFlowNode,
    context: DynamicFlowContext
  ): Promise<ProcessedMessage> {
    let content = node.configuration?.question || 'Please provide your answer.';
    
    // Replace placeholders
    content = this.replacePlaceholders(content, context);
    
    return {
      content,
      messageType: 'text'
    };
  }

  // Helper methods
  private getServiceEmoji(category?: string): string {
    const emojiMap: Record<string, string> = {
      'hair': '💇‍♀️',
      'nails': '💅',
      'spa': '🧖‍♀️',
      'massage': '💆‍♀️',
      'facial': '✨',
      'default': '💄'
    };
    return emojiMap[category?.toLowerCase() || 'default'];
  }

  private generateAvailableDates(days: number): string[] {
    const dates: string[] = [];
    const today = new Date();
    
    for (let i = 1; i <= days; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    
    return dates;
  }

  private generateTimeSlots(selectedDate: string): string[] {
    // Generate time slots (9 AM to 6 PM, every 30 minutes)
    const slots = [
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
      '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'
    ];
    
    return slots;
  }

  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  private getDayOfWeek(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { weekday: 'long' });
  }

  private getTimeDescription(time: string): string {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  private replacePlaceholders(content: string, context: DynamicFlowContext): string {
    // Replace common placeholders
    content = content.replace(/\{selectedService\}/g, context.selectedService || '');
    content = content.replace(/\{selectedDate\}/g, context.selectedDate || '');
    content = content.replace(/\{selectedTime\}/g, context.selectedTime || '');
    content = content.replace(/\{phoneNumber\}/g, context.phoneNumber || '');
    
    return content;
  }
}