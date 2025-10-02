/**
 * WhatsApp Booking Integration Service
 * Handles appointment bookings from WhatsApp Bot and integrates with salon dashboard
 */

import { Pool } from '@neondatabase/serverless';
import { WhatsAppMessage } from './message-processor.service';

export interface BookingContext {
  tenantId: string;
  customerPhone: string;
  customerName?: string;
  customerEmail?: string;
  currentStep: 'welcome' | 'service_selection' | 'date_selection' | 'time_selection' | 'staff_selection' | 'confirmation' | 'completed';
  selectedService?: string;
  selectedDate?: string;
  selectedTime?: string;
  selectedStaff?: string;
  appointmentData?: any;
}

export interface BookingResponse {
  success: boolean;
  message: string;
  nextStep?: string;
  options?: string[];
  appointmentId?: string;
  error?: string;
}

export class WhatsAppBookingService {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }

  /**
   * Process WhatsApp booking message and return appropriate response
   */
  async processBookingMessage(
    message: WhatsAppMessage,
    tenantId: string,
    context: BookingContext
  ): Promise<BookingResponse> {
    try {
      const messageText = message.text?.body?.toLowerCase().trim() || '';

      // Handle different booking steps
      switch (context.currentStep) {
        case 'welcome':
          return await this.handleWelcome(messageText, context);
        
        case 'service_selection':
          return await this.handleServiceSelection(messageText, context);
        
        case 'date_selection':
          return await this.handleDateSelection(messageText, context);
        
        case 'time_selection':
          return await this.handleTimeSelection(messageText, context);
        
        case 'staff_selection':
          return await this.handleStaffSelection(messageText, context);
        
        case 'confirmation':
          return await this.handleConfirmation(messageText, context);
        
        default:
          return {
            success: false,
            message: "I'm sorry, I didn't understand that. Please start over by typing 'book appointment'."
          };
      }
    } catch (error) {
      console.error('Error processing booking message:', error);
      return {
        success: false,
        message: "I'm sorry, there was an error processing your request. Please try again later.",
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Handle welcome message and start booking flow
   */
  private async handleWelcome(messageText: string, context: BookingContext): Promise<BookingResponse> {
    const bookingKeywords = ['book', 'appointment', 'booking', 'schedule', 'reserve'];
    
    if (bookingKeywords.some(keyword => messageText.includes(keyword))) {
      try {
        // Fetch actual services from database
        const services = await this.getServices(context.tenantId);
        
        if (services.length === 0) {
          return {
            success: false,
            message: "I'm sorry, no services are currently available. Please contact us directly."
          };
        }

        // Display services with emojis and pricing
        const serviceList = services.map((service, index) => {
          const emoji = this.getServiceEmoji(service.name, service.category);
          return `${emoji} ${service.name} – ₹${service.base_price}`;
        }).join('\n');

        return {
          success: true,
          message: `Hi! 👋 Welcome to Bella Salon! I'm here to help you book an appointment.

Here are our services:
${serviceList}

Reply with the number or name of the service to book.`,
          nextStep: 'service_selection',
          options: services.map(service => service.name)
        };
      } catch (error) {
        console.error('Error fetching services in welcome:', error);
        return {
          success: false,
          message: "I'm sorry, there was an error loading our services. Please try again later."
        };
      }
    }

    return {
      success: false,
      message: "Hi! 👋 Welcome to Bella Salon! To book an appointment, please type 'book appointment' or 'book'."
    };
  }

  /**
   * Handle service selection
   */
  private async handleServiceSelection(messageText: string, context: BookingContext): Promise<BookingResponse> {
    try {
      // Fetch all services from database
      const services = await this.getServices(context.tenantId);
      
      if (services.length === 0) {
        return {
          success: false,
          message: "I'm sorry, no services are currently available. Please contact us directly."
        };
      }

      let selectedService = null;

      // Try to match by number first
      const serviceNumber = parseInt(messageText.trim());
      if (!isNaN(serviceNumber) && serviceNumber >= 1 && serviceNumber <= services.length) {
        selectedService = services[serviceNumber - 1];
      } else {
        // Try to match by service name (case insensitive)
        const messageTextLower = messageText.toLowerCase().trim();
        for (const service of services) {
          const serviceNameLower = service.name.toLowerCase();
          if (serviceNameLower.includes(messageTextLower) || messageTextLower.includes(serviceNameLower)) {
            selectedService = service;
            break;
          }
        }
      }

      if (!selectedService) {
        // Show services again if no match found
        const serviceList = services.map((service, index) => {
          const emoji = this.getServiceEmoji(service.name, service.category);
          return `${index + 1}. ${emoji} ${service.name} – ₹${service.base_price}`;
        }).join('\n');

        return {
          success: false,
          message: `I couldn't find that service. Please select from our available services:\n\n${serviceList}\n\nReply with the number or name of the service.`
        };
      }

      // Update context with selected service
      context.selectedService = selectedService.id;
      context.currentStep = 'date_selection';

      // Get available dates (next 7 days)
      const availableDates = this.getAvailableDates();

      return {
        success: true,
        message: `Great choice! You selected: ${selectedService.name}
💰 Price: ₹${selectedService.base_price}
⏰ Duration: ${selectedService.duration_minutes} minutes

When would you like to book this service?

${availableDates.map((date, index) => `${index + 1}. ${date.formatted}`).join('\n')}

Please reply with the date number or date.`,
        nextStep: 'date_selection',
        options: availableDates.map(date => date.formatted)
      };

    } catch (error) {
      console.error('Error handling service selection:', error);
      return {
        success: false,
        message: "I'm sorry, there was an error. Please try again."
      };
    }
  }

  /**
   * Handle date selection
   */
  private async handleDateSelection(messageText: string, context: BookingContext): Promise<BookingResponse> {
    try {
      const availableDates = this.getAvailableDates();
      let selectedDate = null;

      // Try to match by number
      const dateNumber = parseInt(messageText);
      if (!isNaN(dateNumber) && dateNumber >= 1 && dateNumber <= availableDates.length) {
        selectedDate = availableDates[dateNumber - 1];
      } else {
        // Handle common date keywords
        if (messageText.includes('tomorrow') || messageText.includes('today')) {
          selectedDate = availableDates[0]; // First available date (tomorrow)
        } else {
          // Try to match by date string
          for (const date of availableDates) {
            if (messageText.includes(date.formatted.toLowerCase()) || 
                messageText.includes(date.date) ||
                messageText.includes(date.formatted.split(',')[0].toLowerCase())) { // Match day name
              selectedDate = date;
              break;
            }
          }
        }
      }

      if (!selectedDate) {
        return {
          success: false,
          message: "Please select a valid date from the list above."
        };
      }

      context.selectedDate = selectedDate.date;
      context.currentStep = 'time_selection';

      // Get available time slots for selected date
      const timeSlots = await this.getAvailableTimeSlots(context.tenantId, selectedDate.date);

      return {
        success: true,
        message: `Perfect! You selected: ${selectedDate.formatted}

Here are the available time slots:

${timeSlots.map((slot, index) => `${index + 1}. ${slot.time} (${slot.available ? 'Available' : 'Booked'})`).join('\n')}

Please reply with the time slot number or time.`,
        nextStep: 'time_selection',
        options: timeSlots.filter(slot => slot.available).map(slot => slot.time)
      };

    } catch (error) {
      console.error('Error handling date selection:', error);
      return {
        success: false,
        message: "I'm sorry, there was an error. Please try again."
      };
    }
  }

  /**
   * Handle time selection
   */
  private async handleTimeSelection(messageText: string, context: BookingContext): Promise<BookingResponse> {
    try {
      const availableTimeSlots = await this.getAvailableTimeSlots(context.tenantId, context.selectedDate!);
      const availableSlots = availableTimeSlots.filter(slot => slot.available);
      
      let selectedTime = null;

      // Try to match by number
      const timeNumber = parseInt(messageText);
      if (!isNaN(timeNumber) && timeNumber >= 1 && timeNumber <= availableSlots.length) {
        selectedTime = availableSlots[timeNumber - 1].time;
      } else {
        // Handle common time formats
        const timePatterns = [
          /(\d{1,2})\s*(am|pm)/i, // 10 am, 2 pm
          /(\d{1,2}):(\d{2})\s*(am|pm)/i, // 10:30 am, 2:45 pm
          /(\d{1,2}):(\d{2})/i, // 10:30, 14:30
          /(\d{1,2})/i // 10, 14
        ];
        
        let matchedTime = null;
        for (const pattern of timePatterns) {
          const match = messageText.match(pattern);
          if (match) {
            let hour = parseInt(match[1]);
            let minute = match[2] ? parseInt(match[2]) : 0;
            const period = match[3]?.toLowerCase();
            
            // Convert to 24-hour format if needed
            if (period === 'pm' && hour !== 12) {
              hour += 12;
            } else if (period === 'am' && hour === 12) {
              hour = 0;
            }
            
            // Format as HH:MM
            const formattedTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            
            // Check if this time is available
            for (const slot of availableSlots) {
              if (slot.time === formattedTime) {
                matchedTime = slot.time;
                break;
              }
            }
            
            if (matchedTime) break;
          }
        }
        
        if (matchedTime) {
          selectedTime = matchedTime;
        } else {
          // Try to match by time string (fallback)
          for (const slot of availableSlots) {
            if (messageText.includes(slot.time.toLowerCase()) || 
                messageText.includes(slot.time.replace(':', ''))) {
              selectedTime = slot.time;
              break;
            }
          }
        }
      }

      if (!selectedTime) {
        return {
          success: false,
          message: "Please select a valid time slot from the list above."
        };
      }

      context.selectedTime = selectedTime;
      context.currentStep = 'staff_selection';

      // Get available staff for the selected time
      const availableStaff = await this.getAvailableStaff(context.tenantId, context.selectedDate!, selectedTime);

      return {
        success: true,
        message: `Excellent! You selected: ${selectedTime}

Here are our available staff members:

${availableStaff.map((staff, index) => `${index + 1}. ${staff.name} - ${staff.specialization}`).join('\n')}

Please reply with the staff member number or name.`,
        nextStep: 'staff_selection',
        options: availableStaff.map(staff => staff.name)
      };

    } catch (error) {
      console.error('Error handling time selection:', error);
      return {
        success: false,
        message: "I'm sorry, there was an error. Please try again."
      };
    }
  }

  /**
   * Handle staff selection
   */
  private async handleStaffSelection(messageText: string, context: BookingContext): Promise<BookingResponse> {
    try {
      const availableStaff = await this.getAvailableStaff(context.tenantId, context.selectedDate!, context.selectedTime!);
      
      let selectedStaff = null;

      // Try to match by number
      const staffNumber = parseInt(messageText);
      if (!isNaN(staffNumber) && staffNumber >= 1 && staffNumber <= availableStaff.length) {
        selectedStaff = availableStaff[staffNumber - 1];
      } else {
        // Try to match by staff name
        for (const staff of availableStaff) {
          if (messageText.toLowerCase().includes(staff.name.toLowerCase())) {
            selectedStaff = staff;
            break;
          }
        }
      }

      if (!selectedStaff) {
        return {
          success: false,
          message: "Please select a valid staff member from the list above."
        };
      }

      context.selectedStaff = selectedStaff.id;
      context.currentStep = 'confirmation';

      // Get service details for confirmation
      const service = await this.getServiceById(context.tenantId, context.selectedService!);

      // Create appointment data
      const appointmentDateTime = new Date(`${context.selectedDate}T${context.selectedTime}:00`);
      context.appointmentData = {
        customer_name: context.customerName || 'WhatsApp Customer',
        customer_phone: context.customerPhone,
        customer_email: context.customerEmail || '',
        service_id: context.selectedService,
        staff_id: context.selectedStaff,
        scheduled_at: appointmentDateTime.toISOString(),
        amount: service?.base_price || 0,
        currency: 'INR',
        notes: 'Booked via WhatsApp Bot',
        payment_status: 'pending'
      };

      return {
        success: true,
        message: `Perfect! Here's your appointment summary:

📅 **Appointment Details:**
• Service: ${service?.name}
• Date: ${context.selectedDate}
• Time: ${context.selectedTime}
• Staff: ${selectedStaff.name}
• Price: ₹${service?.base_price}
• Duration: ${service?.duration_minutes} minutes

Please confirm by typing 'yes' or 'confirm' to book this appointment.`,
        nextStep: 'confirmation'
      };

    } catch (error) {
      console.error('Error handling staff selection:', error);
      return {
        success: false,
        message: "I'm sorry, there was an error. Please try again."
      };
    }
  }

  /**
   * Handle confirmation and create appointment
   */
  private async handleConfirmation(messageText: string, context: BookingContext): Promise<BookingResponse> {
    try {
      const confirmKeywords = ['yes', 'confirm', 'book', 'ok', 'okay', 'proceed'];
      
      if (!confirmKeywords.some(keyword => messageText.includes(keyword))) {
        return {
          success: false,
          message: "Please type 'yes' or 'confirm' to book the appointment, or 'cancel' to start over."
        };
      }

      // Create appointment in database
      const appointmentId = await this.createAppointment(context.tenantId, context.appointmentData!);

      if (appointmentId) {
        context.currentStep = 'completed';
        
        return {
          success: true,
          message: `🎉 **Appointment Booked Successfully!**

Your appointment has been confirmed:

📅 Date: ${context.selectedDate}
⏰ Time: ${context.selectedTime}
💇‍♀️ Service: ${context.appointmentData.service_id}
👩‍💼 Staff: ${context.selectedStaff}
💰 Price: ₹${context.appointmentData.amount}

You'll receive a confirmation SMS shortly. 

Thank you for choosing Bella Salon! We look forward to seeing you! ✨`,
          appointmentId,
          nextStep: 'completed'
        };
      } else {
        return {
          success: false,
          message: "I'm sorry, there was an error booking your appointment. Please try again or contact us directly."
        };
      }

    } catch (error) {
      console.error('Error handling confirmation:', error);
      return {
        success: false,
        message: "I'm sorry, there was an error booking your appointment. Please try again or contact us directly."
      };
    }
  }

  /**
   * Get services for a tenant
   */
  private async getServices(tenantId: string): Promise<any[]> {
    try {
      const result = await this.pool.query(`
        SELECT id, name, description, base_price, duration_minutes
        FROM offerings 
        WHERE tenant_id = $1 AND offering_type = 'service' AND is_active = true
        ORDER BY display_order, name
      `, [tenantId]);
      
      return result.rows;
    } catch (error) {
      console.error('Error fetching services:', error);
      return [];
    }
  }

  /**
   * Get service by ID
   */
  private async getServiceById(tenantId: string, serviceId: string): Promise<any> {
    try {
      const result = await this.pool.query(`
        SELECT id, name, description, base_price, duration_minutes
        FROM offerings 
        WHERE tenant_id = $1 AND id = $2 AND offering_type = 'service'
      `, [tenantId, serviceId]);
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error fetching service:', error);
      return null;
    }
  }

  /**
   * Get available dates (next 7 days)
   */
  private getAvailableDates(): Array<{ date: string; formatted: string }> {
    const dates = [];
    const today = new Date();
    
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const dateStr = date.toISOString().split('T')[0];
      const formatted = date.toLocaleDateString('en-IN', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      dates.push({ date: dateStr, formatted });
    }
    
    return dates;
  }

  /**
   * Get available time slots for a date
   */
  private async getAvailableTimeSlots(tenantId: string, date: string): Promise<Array<{ time: string; available: boolean }>> {
    try {
      // Standard time slots
      const timeSlots = [
        '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'
      ];

      // Check which slots are already booked
      const bookedSlots = await this.pool.query(`
        SELECT scheduled_at
        FROM transactions 
        WHERE tenant_id = $1 
        AND DATE(scheduled_at) = $2 
        AND transaction_type = 'booking'
      `, [tenantId, date]);

      const bookedTimes = bookedSlots.rows.map(row => 
        new Date(row.scheduled_at).toTimeString().substring(0, 5)
      );

      return timeSlots.map(time => ({
        time,
        available: !bookedTimes.includes(time)
      }));

    } catch (error) {
      console.error('Error fetching time slots:', error);
      return [];
    }
  }

  /**
   * Get available staff for a specific date and time
   */
  private async getAvailableStaff(tenantId: string, date: string, time: string): Promise<Array<{ id: string; name: string; specialization: string }>> {
    try {
      const result = await this.pool.query(`
        SELECT id, name, specializations
        FROM staff 
        WHERE tenant_id = $1 AND is_active = true
        ORDER BY name
      `, [tenantId]);

      return result.rows.map(staff => ({
        id: staff.id,
        name: staff.name,
        specialization: Array.isArray(staff.specializations) 
          ? staff.specializations.join(', ') 
          : 'General Services'
      }));

    } catch (error) {
      console.error('Error fetching staff:', error);
      return [];
    }
  }

  /**
   * Create appointment in database
   */
  private async createAppointment(tenantId: string, appointmentData: any): Promise<string | null> {
    try {
      const result = await this.pool.query(`
        INSERT INTO transactions (
          tenant_id, transaction_type, customer_name, customer_phone, customer_email,
          offering_id, staff_id, scheduled_at, duration_minutes,
          amount, currency, notes, payment_status
        ) VALUES ($1, 'booking', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id
      `, [
        tenantId,
        appointmentData.customer_name,
        appointmentData.customer_phone,
        appointmentData.customer_email,
        appointmentData.service_id,
        appointmentData.staff_id,
        appointmentData.scheduled_at,
        appointmentData.duration_minutes || 60,
        appointmentData.amount,
        appointmentData.currency,
        appointmentData.notes,
        appointmentData.payment_status
      ]);

      return result.rows[0]?.id || null;

    } catch (error) {
      console.error('Error creating appointment:', error);
      return null;
    }
  }

  /**
   * Get appropriate emoji for service based on name and category
   */
  private getServiceEmoji(serviceName: string, category?: string): string {
    const name = serviceName.toLowerCase();
    
    // Hair services
    if (name.includes('hair') || name.includes('cut') || name.includes('color') || name.includes('style')) {
      return '💇‍♀️';
    }
    
    // Nail services
    if (name.includes('nail') || name.includes('manicure') || name.includes('pedicure') || name.includes('polish')) {
      return '💅';
    }
    
    // Facial/skin services
    if (name.includes('facial') || name.includes('skin') || name.includes('treatment')) {
      return '✨';
    }
    
    // Massage services
    if (name.includes('massage') || name.includes('spa')) {
      return '🧘‍♀️';
    }
    
    // Makeup services
    if (name.includes('makeup') || name.includes('bridal') || name.includes('party')) {
      return '💄';
    }
    
    // Waxing services
    if (name.includes('wax') || name.includes('threading')) {
      return '🪒';
    }
    
    // Default emoji
    return '✨';
  }
}
