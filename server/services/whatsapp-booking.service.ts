/**
 * WhatsApp Booking Integration Service v2.0
 * Handles appointment bookings from WhatsApp Bot and integrates with salon dashboard
 * Now with smart staff matching - no more manual staff selection!
 */

import { Pool } from '@neondatabase/serverless';
import { WhatsAppMessage } from './message-processor.service';
import { randomUUID } from 'crypto';

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
      
      console.log('🔍 processBookingMessage called with:', {
        messageText,
        currentStep: context.currentStep,
        context: JSON.stringify(context, null, 2)
      });

      // Handle different booking steps
      switch (context.currentStep) {
        case 'welcome':
          return await this.handleWelcome(messageText, context);
        
        case 'service_selection':
          return await this.handleServiceSelection(messageText, context);
        
        case 'date_selection':
          return await this.handleDateSelection(messageText, context);
        
        case 'time_selection':
          console.log('🔍 Routing to handleTimeSelection');
          return await this.handleTimeSelection(messageText, context);
        
        case 'confirmation':
          return await this.handleConfirmation(messageText, context);
        
        case 'completed':
          // If conversation is completed, start a new one
          console.log('🔄 Conversation completed, resetting to welcome');
          context.currentStep = 'welcome';
          // Clear any previous appointment data
          delete context.appointmentData;
          delete context.selectedService;
          delete context.selectedDate;
          delete context.selectedTime;
          delete context.selectedStaff;
          return await this.handleWelcome(messageText, context);
        
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
    const greetingKeywords = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening'];
    
    // Handle greeting messages
    if (greetingKeywords.some(keyword => messageText.includes(keyword))) {
      return {
        success: true,
        message: "Hi! 👋 Welcome to Bella Salon! To book an appointment, please type 'book appointment' or 'book'.",
        nextStep: 'welcome'
      };
    }
    
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
          return `${emoji} ${service.name} – ₹${service.price}`;
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
        // Try to match by service name (case insensitive, handle spaces)
        const messageTextLower = messageText.toLowerCase().trim().replace(/\s+/g, '');
        for (const service of services) {
          const serviceNameLower = service.name.toLowerCase().replace(/\s+/g, '');
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
          return `${index + 1}. ${emoji} ${service.name} – ₹${service.price}`;
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
💰 Price: ₹${selectedService.price}
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
        // Check if user sent a service name instead of date
        const serviceKeywords = ['hair', 'facial', 'bridal', 'manicure', 'pedicure', 'threading', 'makeup', 'spa', 'coloring', 'cut'];
        if (serviceKeywords.some(keyword => messageText.toLowerCase().includes(keyword))) {
          return {
            success: false,
            message: "It looks like you're trying to select a service, but we're currently selecting a date. Please choose a date from the list above, or type 'back' to change your service selection."
          };
        }
        
        return {
          success: false,
          message: "Please select a valid date from the list above."
        };
      }

      context.selectedDate = selectedDate.date;
      context.currentStep = 'time_selection';

      // Get available time slots for selected date, filtered by service
      const selectedService = await this.getServiceById(context.selectedService);
      const timeSlots = await this.getAvailableTimeSlots(context.tenantId, selectedDate.date, selectedService?.name);

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
      console.log('🔍 handleTimeSelection called with:', {
        messageText,
        selectedService: context.selectedService,
        selectedDate: context.selectedDate,
        tenantId: context.tenantId
      });
      
      // Check if selectedService is set
      if (!context.selectedService) {
        console.log('❌ No selectedService in context');
        return {
          success: false,
          message: "I'm sorry, I couldn't find your selected service. Please start over by typing 'book appointment'."
        };
      }
      
      const selectedService = await this.getServiceById(context.selectedService);
      console.log('🔍 Time selection - selected service:', selectedService?.name);
      console.log('🔍 Time selection - selected date:', context.selectedDate);
      
      if (!selectedService) {
        console.log('❌ Could not find service by ID:', context.selectedService);
        return {
          success: false,
          message: "I'm sorry, I couldn't find your selected service. Please start over by typing 'book appointment'."
        };
      }
      
      const availableTimeSlots = await this.getAvailableTimeSlots(context.tenantId, context.selectedDate!, selectedService?.name);
      const availableSlots = availableTimeSlots.filter(slot => slot.available);
      
      let selectedTime = null;
      const input = messageText.trim().toLowerCase();

      // First, try to match by number (slot selection)
      const timeNumber = parseInt(input);
      if (!isNaN(timeNumber) && timeNumber >= 1 && timeNumber <= availableSlots.length) {
        selectedTime = availableSlots[timeNumber - 1].time;
      } else {
        // Parse time from text input
        selectedTime = this.parseTimeFromText(input, availableSlots);
      }

      if (!selectedTime) {
        return {
          success: false,
          message: "Please select a valid time slot from the list above."
        };
      }

      context.selectedTime = selectedTime;
      
      // Find the assigned staff for this time slot
      const selectedSlot = availableSlots.find(slot => slot.time === selectedTime);
      console.log('🔍 Time selection debug:', {
        selectedTime,
        availableSlots: availableSlots.length,
        selectedSlot: selectedSlot ? 'found' : 'not found',
        hasAssignedStaff: selectedSlot?.assignedStaff ? 'yes' : 'no'
      });
      
      if (selectedSlot && selectedSlot.assignedStaff) {
        context.selectedStaff = selectedSlot.assignedStaff.id;
        context.currentStep = 'confirmation';
        
        // Get service details for confirmation
        const service = await this.getServiceById(context.selectedService);
        
        // Set appointment data for confirmation step
        const appointmentDateTime = new Date(`${context.selectedDate}T${selectedTime}:00`);
        const istOffset = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds
        const utcDateTime = new Date(appointmentDateTime.getTime() - istOffset);
        
        context.appointmentData = {
          customer_name: context.customerName || 'WhatsApp Customer',
          customer_phone: context.customerPhone,
          customer_email: context.customerEmail || '',
          service_id: context.selectedService,
          service_name: service?.name || 'Unknown Service',
          staff_id: selectedSlot.assignedStaff.id,
          staff_name: selectedSlot.assignedStaff.name,
          scheduled_at: utcDateTime.toISOString(),
          selectedTime: selectedTime,
          amount: service?.price || 0,
          currency: 'INR',
          notes: 'Booked via WhatsApp Bot',
          payment_status: 'pending'
        };
        
        return {
          success: true,
          message: `Perfect! You selected: ${selectedTime}

✅ **Appointment Summary:**
• Service: ${service?.name}
• Date: ${context.selectedDate}
• Time: ${selectedTime}
• Staff: ${selectedSlot.assignedStaff.name}
• Price: ₹${service?.price}
• Duration: ${service?.duration_minutes} minutes

Please reply with "confirm" to book this appointment, or "change" to modify your selection.`,
          nextStep: 'confirmation'
        };
      } else {
        return {
          success: false,
          message: "I'm sorry, this time slot is no longer available. Please select another time."
        };
      }

    } catch (error) {
      console.error('Error handling time selection:', error);
      return {
        success: false,
        message: "I'm sorry, there was an error. Please try again."
      };
    }
  }

  /**
   * Parse time from text input and match with available slots
   */
  private parseTimeFromText(input: string, availableSlots: Array<{ time: string; available: boolean }>): string | null {
    // Normalize input
    const normalizedInput = input.replace(/\s+/g, ' ').trim().toLowerCase();
    
    // Direct exact matches first
    for (const slot of availableSlots) {
      if (normalizedInput === slot.time.toLowerCase()) {
        return slot.time;
      }
    }
    
    // Handle AM/PM format (e.g., "9 am", "2 pm")
    const amPmMatch = normalizedInput.match(/^(\d{1,2})\s*(am|pm)$/);
    if (amPmMatch) {
      let hour = parseInt(amPmMatch[1]);
      const period = amPmMatch[2];
      
      // Convert to 24-hour format
      if (period === 'pm' && hour !== 12) {
        hour += 12;
      } else if (period === 'am' && hour === 12) {
        hour = 0;
      }
      
      const formattedTime = `${hour.toString().padStart(2, '0')}:00`;
      
      // Check if this time is available
      for (const slot of availableSlots) {
        if (slot.time === formattedTime) {
          return slot.time;
        }
      }
    }
    
    // Handle 24-hour format (e.g., "9", "17")
    const hourMatch = normalizedInput.match(/^(\d{1,2})$/);
    if (hourMatch) {
      const hour = parseInt(hourMatch[1]);
      
      // Try as 24-hour format
      if (hour >= 0 && hour <= 23) {
        const formattedTime = `${hour.toString().padStart(2, '0')}:00`;
        for (const slot of availableSlots) {
          if (slot.time === formattedTime) {
            return slot.time;
          }
        }
      }
    }
    
    return null;
  }


  /**
   * Handle confirmation and create appointment
   */
  private async handleConfirmation(messageText: string, context: BookingContext): Promise<BookingResponse> {
    try {
      console.log('🔍 handleConfirmation called with:', { messageText, context: JSON.stringify(context, null, 2) });
      
      const confirmKeywords = ['yes', 'confirm', 'book', 'ok', 'okay', 'proceed'];
      
      if (!confirmKeywords.some(keyword => messageText.includes(keyword))) {
        console.log('❌ Confirmation keyword not found');
        return {
          success: false,
          message: "Please type 'yes' or 'confirm' to book the appointment, or 'cancel' to start over."
        };
      }

      console.log('✅ Confirmation keyword found, proceeding with booking creation');
      console.log('📊 Appointment data:', context.appointmentData);

      if (!context.appointmentData) {
        console.log('❌ No appointment data found in context');
        return {
          success: false,
          message: "I'm sorry, there was an error with your appointment data. Please start over."
        };
      }

      // Create appointment in database
      console.log('📝 Calling createAppointment...');
      const appointmentId = await this.createAppointment(context.tenantId, context.appointmentData);

      console.log('📊 createAppointment result:', appointmentId);

      if (appointmentId) {
        context.currentStep = 'completed';
        
        console.log('✅ Appointment created successfully, returning success response');
        return {
          success: true,
          message: `🎉 **Appointment Booked Successfully!**

Your appointment has been confirmed:

📅 Date: ${context.selectedDate}
⏰ Time: ${context.selectedTime}
💇‍♀️ Service: ${context.appointmentData.service_name}
👩‍💼 Staff: ${context.appointmentData.staff_name}
💰 Price: ₹${context.appointmentData.amount}

You'll receive a confirmation SMS shortly. 

Thank you for choosing Bella Salon! We look forward to seeing you! ✨`,
          appointmentId,
          nextStep: 'completed'
        };
      } else {
        console.log('❌ createAppointment returned null');
        return {
          success: false,
          message: "I'm sorry, there was an error booking your appointment. Please try again or contact us directly."
        };
      }

    } catch (error) {
      console.error('❌ Error handling confirmation:', error);
      console.error('❌ Error details:', error.message);
      console.error('❌ Error stack:', error.stack);
      return {
        success: false,
        message: "I'm sorry, there was an error booking your appointment. Please try again or contact us directly.",
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get services for a tenant
   */
  private async getServices(tenantId: string): Promise<any[]> {
    try {
      // Use Bella Salon services from services table (now has Bella Salon data)
      const result = await this.pool.query(`
        SELECT id, name, description, price, is_active,
               CASE 
                 WHEN name = 'Bridal Makeup' THEN 180
                 WHEN name = 'Facial Cleanup' THEN 45
                 WHEN name = 'Gold Facial' THEN 60
                 WHEN name = 'Hair Coloring' THEN 90
                 WHEN name = 'Hair Cut & Style' THEN 45
                 WHEN name = 'Hair Spa' THEN 75
                 WHEN name = 'Manicure' THEN 30
                 WHEN name = 'Party Makeup' THEN 90
                 WHEN name = 'Pedicure' THEN 45
                 WHEN name = 'Threading' THEN 15
                 ELSE 60
               END as duration_minutes
        FROM services 
        WHERE is_active = true AND name IN (
          'Bridal Makeup', 'Facial Cleanup', 'Gold Facial', 'Hair Coloring', 
          'Hair Cut & Style', 'Hair Spa', 'Manicure', 'Party Makeup', 
          'Pedicure', 'Threading'
        )
        ORDER BY name
      `);
      
      console.log(`📋 Found ${result.rows.length} Bella Salon services`);
      return result.rows;
    } catch (error) {
      console.error('Error fetching Bella Salon services:', error);
      return [];
    }
  }

  /**
   * Get service by ID
   */
  private async getServiceById(tenantId: string, serviceId: string): Promise<any> {
    try {
      // Use Bella Salon services from services table
      const result = await this.pool.query(`
        SELECT id, name, description, price, is_active,
               CASE 
                 WHEN name = 'Bridal Makeup' THEN 180
                 WHEN name = 'Facial Cleanup' THEN 45
                 WHEN name = 'Gold Facial' THEN 60
                 WHEN name = 'Hair Coloring' THEN 90
                 WHEN name = 'Hair Cut & Style' THEN 45
                 WHEN name = 'Hair Spa' THEN 75
                 WHEN name = 'Manicure' THEN 30
                 WHEN name = 'Party Makeup' THEN 90
                 WHEN name = 'Pedicure' THEN 45
                 WHEN name = 'Threading' THEN 15
                 ELSE 60
               END as duration_minutes
        FROM services 
        WHERE id = $1 AND is_active = true
      `, [serviceId]);
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error fetching Bella Salon service:', error);
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
  private async getAvailableTimeSlots(tenantId: string, date: string, serviceName?: string): Promise<Array<{ time: string; available: boolean; assignedStaff?: { id: string; name: string } }>> {
    try {
      // Standard time slots
      const timeSlots = [
        '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'
      ];

      // If no service is specified, use the old logic
      if (!serviceName) {
        const bookedSlots = await this.pool.query(`
          SELECT appointment_time
          FROM bookings 
          WHERE appointment_date = $1 
          AND status != 'cancelled'
        `, [date]);

        const bookedTimes = bookedSlots.rows.map(row => row.appointment_time);

        return timeSlots.map(time => ({
          time,
          available: !bookedTimes.includes(time)
        }));
      }

      // Get staff who can perform this service
      const skilledStaff = await this.getStaffForService(tenantId, serviceName);
      console.log('🔍 getAvailableTimeSlots debug:', {
        serviceName,
        skilledStaffCount: skilledStaff.length,
        skilledStaff: skilledStaff.map(s => s.name)
      });
      
      if (skilledStaff.length === 0) {
        console.log(`No staff available for service: ${serviceName}`);
        return timeSlots.map(time => ({ time, available: false }));
      }

      // Check availability for each time slot
      const result = [];
      for (const time of timeSlots) {
        // Check if any skilled staff is available at this time
        const availableStaff = await this.getAvailableStaffAtTime(tenantId, date, time, skilledStaff);
        
        if (availableStaff.length > 0) {
          result.push({
            time,
            available: true,
            assignedStaff: availableStaff[0] // Assign the first available staff
          });
        } else {
          result.push({
            time,
            available: false
          });
        }
      }

      return result;

    } catch (error) {
      console.error('Error fetching time slots:', error);
      return [];
    }
  }

  /**
   * Get staff who can perform a specific service
   */
  private async getStaffForService(tenantId: string, serviceName: string): Promise<Array<{ id: string; name: string; role: string }>> {
    try {
      console.log('🔍 getStaffForService called with:', { tenantId, serviceName });
      
      const result = await this.pool.query(`
        SELECT id, name, role
        FROM staff 
        WHERE tenant_id = $1 
        AND is_active = true
        AND specializations @> $2::jsonb
      `, [tenantId, JSON.stringify([serviceName])]);

      console.log('🔍 getStaffForService result:', { 
        rowCount: result.rows.length,
        staff: result.rows.map(s => s.name)
      });

      return result.rows.map(staff => ({
        id: staff.id,
        name: staff.name,
        role: staff.role
      }));
    } catch (error) {
      console.error('❌ Error fetching staff for service:', error);
      return [];
    }
  }

  /**
   * Get available staff at a specific time from a list of skilled staff
   */
  private async getAvailableStaffAtTime(tenantId: string, date: string, time: string, skilledStaff: Array<{ id: string; name: string; role: string }>): Promise<Array<{ id: string; name: string }>> {
    try {
      if (skilledStaff.length === 0) {
        return [];
      }

      // Check which skilled staff are already booked at this time
      const staffIds = skilledStaff.map(staff => staff.id);
      const bookedStaff = await this.pool.query(`
        SELECT staff_id
        FROM bookings 
        WHERE appointment_date = $1 
        AND appointment_time = $2
        AND status != 'cancelled'
        AND staff_id = ANY($3)
      `, [date, time, staffIds]);

      const bookedStaffIds = bookedStaff.rows.map(row => row.staff_id);

      // Return staff who are not booked
      return skilledStaff
        .filter(staff => !bookedStaffIds.includes(staff.id))
        .map(staff => ({ id: staff.id, name: staff.name }));
    } catch (error) {
      console.error('Error checking staff availability:', error);
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

      console.log(`📋 Found ${result.rows.length} Bella Salon staff members`);
      
      return result.rows.map(staff => ({
        id: staff.id,
        name: staff.name,
        specialization: Array.isArray(staff.specializations) 
          ? staff.specializations.join(', ') 
          : 'General Services'
      }));

    } catch (error) {
      console.error('Error fetching Bella Salon staff:', error);
      return [];
    }
  }

  /**
   * Create appointment in database
   */
  private async createAppointment(tenantId: string, appointmentData: any): Promise<string | null> {
    try {
      console.log('🔍 Creating appointment with data:', JSON.stringify(appointmentData, null, 2));
      
      // Generate a unique booking ID
      const bookingId = randomUUID();
      
      // Create a conversation record first
      const conversationId = randomUUID();
      console.log(`📝 Creating conversation with ID: ${conversationId}`);
      
      await this.pool.query(`
        INSERT INTO conversations (
          id, phone_number, customer_name, current_state, 
          selected_service, selected_date, selected_time, context_data
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        conversationId,
        appointmentData.customer_phone,
        appointmentData.customer_name,
        'booking_completed',
        appointmentData.service_id,
        appointmentData.selectedDate,
        appointmentData.selectedTime,
        JSON.stringify({
          service_name: appointmentData.service_name,
          staff_name: appointmentData.staff_name,
          amount: appointmentData.amount
        })
      ]);
      
      console.log(`✅ Conversation created successfully: ${conversationId}`);
      
      // Now create the booking with the valid conversation_id
      console.log(`📝 Inserting booking with ID: ${bookingId}`);
      console.log(`📝 Service ID: ${appointmentData.service_id}`);
      console.log(`📝 Phone: ${appointmentData.customer_phone}`);
      console.log(`📝 Name: ${appointmentData.customer_name}`);
      console.log(`📝 Amount: ${appointmentData.amount}`);
      console.log(`📝 Scheduled At: ${appointmentData.scheduled_at}`);
      console.log(`📝 Selected Time: ${appointmentData.selectedTime}`);
      
      const result = await this.pool.query(`
        INSERT INTO bookings (
          id, conversation_id, service_id, phone_number, customer_name,
          amount, status, appointment_date, appointment_time, notes, staff_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id
      `, [
        bookingId,
        conversationId,
        appointmentData.service_id,
        appointmentData.customer_phone,
        appointmentData.customer_name,
        appointmentData.amount,
        'confirmed',
        appointmentData.scheduled_at,
        appointmentData.selectedTime,
        `WhatsApp booking: ${appointmentData.service_name} with ${appointmentData.staff_name}`,
        appointmentData.staff_id
      ]);

      console.log(`✅ Booking created successfully: ${bookingId}`);
      console.log(`📊 Query result:`, result.rows);
      
      // Send real-time notification for WhatsApp Bot bookings
      try {
        const notificationResponse = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/realtime/broadcast/${tenantId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type: 'new_whatsapp_booking',
            data: {
              appointment: {
                id: result.rows[0]?.id,
                customer_name: appointmentData.customer_name,
                customer_phone: appointmentData.customer_phone,
                service_name: appointmentData.service_name,
                staff_name: appointmentData.staff_name,
                scheduled_at: appointmentData.scheduled_at,
                amount: appointmentData.amount,
                source: 'WhatsApp Bot'
              },
              message: 'New WhatsApp Bot booking!',
              timestamp: new Date().toISOString()
            }
          })
        });
        
        if (notificationResponse.ok) {
          console.log('✅ Real-time notification sent for WhatsApp Bot booking');
        } else {
          console.log('⚠️ Failed to send real-time notification for WhatsApp Bot booking');
        }
      } catch (error) {
        console.error('❌ Error sending real-time notification for WhatsApp Bot booking:', error);
      }
      
      return result.rows[0]?.id || null;

    } catch (error) {
      console.error('❌ Error creating appointment:', error);
      console.error('❌ Error details:', error.message);
      console.error('❌ Error code:', error.code);
      console.error('❌ Error constraint:', error.constraint);
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
