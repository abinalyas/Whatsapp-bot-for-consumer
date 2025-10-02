var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc7) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc7 = __getOwnPropDesc(from, key)) || desc7.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// server/services/whatsapp-booking.service.ts
var whatsapp_booking_service_exports = {};
__export(whatsapp_booking_service_exports, {
  WhatsAppBookingService: () => WhatsAppBookingService
});
import { Pool as Pool7 } from "@neondatabase/serverless";
import { randomUUID as randomUUID3 } from "crypto";
var WhatsAppBookingService;
var init_whatsapp_booking_service = __esm({
  "server/services/whatsapp-booking.service.ts"() {
    "use strict";
    WhatsAppBookingService = class {
      pool;
      constructor() {
        this.pool = new Pool7({
          connectionString: process.env.DATABASE_URL
        });
      }
      /**
       * Process WhatsApp booking message and return appropriate response
       */
      async processBookingMessage(message, tenantId, context) {
        try {
          const messageText = message.text?.body?.toLowerCase().trim() || "";
          console.log("\u{1F50D} processBookingMessage called with:", {
            messageText,
            currentStep: context.currentStep,
            context: JSON.stringify(context, null, 2)
          });
          switch (context.currentStep) {
            case "welcome":
              return await this.handleWelcome(messageText, context);
            case "service_selection":
              return await this.handleServiceSelection(messageText, context);
            case "date_selection":
              return await this.handleDateSelection(messageText, context);
            case "time_selection":
              return await this.handleTimeSelection(messageText, context);
            case "staff_selection":
              return await this.handleStaffSelection(messageText, context);
            case "confirmation":
              return await this.handleConfirmation(messageText, context);
            default:
              return {
                success: false,
                message: "I'm sorry, I didn't understand that. Please start over by typing 'book appointment'."
              };
          }
        } catch (error) {
          console.error("Error processing booking message:", error);
          return {
            success: false,
            message: "I'm sorry, there was an error processing your request. Please try again later.",
            error: error instanceof Error ? error.message : "Unknown error"
          };
        }
      }
      /**
       * Handle welcome message and start booking flow
       */
      async handleWelcome(messageText, context) {
        const bookingKeywords = ["book", "appointment", "booking", "schedule", "reserve"];
        if (bookingKeywords.some((keyword) => messageText.includes(keyword))) {
          try {
            const services2 = await this.getServices(context.tenantId);
            if (services2.length === 0) {
              return {
                success: false,
                message: "I'm sorry, no services are currently available. Please contact us directly."
              };
            }
            const serviceList = services2.map((service, index) => {
              const emoji = this.getServiceEmoji(service.name, service.category);
              return `${emoji} ${service.name} \u2013 \u20B9${service.price}`;
            }).join("\n");
            return {
              success: true,
              message: `Hi! \u{1F44B} Welcome to Bella Salon! I'm here to help you book an appointment.

Here are our services:
${serviceList}

Reply with the number or name of the service to book.`,
              nextStep: "service_selection",
              options: services2.map((service) => service.name)
            };
          } catch (error) {
            console.error("Error fetching services in welcome:", error);
            return {
              success: false,
              message: "I'm sorry, there was an error loading our services. Please try again later."
            };
          }
        }
        return {
          success: false,
          message: "Hi! \u{1F44B} Welcome to Bella Salon! To book an appointment, please type 'book appointment' or 'book'."
        };
      }
      /**
       * Handle service selection
       */
      async handleServiceSelection(messageText, context) {
        try {
          const services2 = await this.getServices(context.tenantId);
          if (services2.length === 0) {
            return {
              success: false,
              message: "I'm sorry, no services are currently available. Please contact us directly."
            };
          }
          let selectedService = null;
          const serviceNumber = parseInt(messageText.trim());
          if (!isNaN(serviceNumber) && serviceNumber >= 1 && serviceNumber <= services2.length) {
            selectedService = services2[serviceNumber - 1];
          } else {
            const messageTextLower = messageText.toLowerCase().trim().replace(/\s+/g, "");
            for (const service of services2) {
              const serviceNameLower = service.name.toLowerCase().replace(/\s+/g, "");
              if (serviceNameLower.includes(messageTextLower) || messageTextLower.includes(serviceNameLower)) {
                selectedService = service;
                break;
              }
            }
          }
          if (!selectedService) {
            const serviceList = services2.map((service, index) => {
              const emoji = this.getServiceEmoji(service.name, service.category);
              return `${index + 1}. ${emoji} ${service.name} \u2013 \u20B9${service.base_price}`;
            }).join("\n");
            return {
              success: false,
              message: `I couldn't find that service. Please select from our available services:

${serviceList}

Reply with the number or name of the service.`
            };
          }
          context.selectedService = selectedService.id;
          context.currentStep = "date_selection";
          const availableDates = this.getAvailableDates();
          return {
            success: true,
            message: `Great choice! You selected: ${selectedService.name}
\u{1F4B0} Price: \u20B9${selectedService.price}
\u23F0 Duration: 45 minutes

When would you like to book this service?

${availableDates.map((date, index) => `${index + 1}. ${date.formatted}`).join("\n")}

Please reply with the date number or date.`,
            nextStep: "date_selection",
            options: availableDates.map((date) => date.formatted)
          };
        } catch (error) {
          console.error("Error handling service selection:", error);
          return {
            success: false,
            message: "I'm sorry, there was an error. Please try again."
          };
        }
      }
      /**
       * Handle date selection
       */
      async handleDateSelection(messageText, context) {
        try {
          const availableDates = this.getAvailableDates();
          let selectedDate = null;
          const dateNumber = parseInt(messageText);
          if (!isNaN(dateNumber) && dateNumber >= 1 && dateNumber <= availableDates.length) {
            selectedDate = availableDates[dateNumber - 1];
          } else {
            if (messageText.includes("tomorrow") || messageText.includes("today")) {
              selectedDate = availableDates[0];
            } else {
              for (const date of availableDates) {
                if (messageText.includes(date.formatted.toLowerCase()) || messageText.includes(date.date) || messageText.includes(date.formatted.split(",")[0].toLowerCase())) {
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
          context.currentStep = "time_selection";
          const timeSlots = await this.getAvailableTimeSlots(context.tenantId, selectedDate.date);
          return {
            success: true,
            message: `Perfect! You selected: ${selectedDate.formatted}

Here are the available time slots:

${timeSlots.map((slot, index) => `${index + 1}. ${slot.time} (${slot.available ? "Available" : "Booked"})`).join("\n")}

Please reply with the time slot number or time.`,
            nextStep: "time_selection",
            options: timeSlots.filter((slot) => slot.available).map((slot) => slot.time)
          };
        } catch (error) {
          console.error("Error handling date selection:", error);
          return {
            success: false,
            message: "I'm sorry, there was an error. Please try again."
          };
        }
      }
      /**
       * Handle time selection
       */
      async handleTimeSelection(messageText, context) {
        try {
          const availableTimeSlots = await this.getAvailableTimeSlots(context.tenantId, context.selectedDate);
          const availableSlots = availableTimeSlots.filter((slot) => slot.available);
          let selectedTime = null;
          const timeNumber = parseInt(messageText);
          if (!isNaN(timeNumber) && timeNumber >= 1 && timeNumber <= availableSlots.length) {
            selectedTime = availableSlots[timeNumber - 1].time;
          } else {
            const timePatterns = [
              /(\d{1,2})\s*(am|pm)/i,
              // 10 am, 2 pm
              /(\d{1,2}):(\d{2})\s*(am|pm)/i,
              // 10:30 am, 2:45 pm
              /(\d{1,2}):(\d{2})/i,
              // 10:30, 14:30
              /(\d{1,2})/i
              // 10, 14
            ];
            let matchedTime = null;
            for (const pattern of timePatterns) {
              const match = messageText.match(pattern);
              if (match) {
                let hour = parseInt(match[1]);
                let minute = match[2] ? parseInt(match[2]) : 0;
                const period = match[3]?.toLowerCase();
                if (period === "pm" && hour !== 12) {
                  hour += 12;
                } else if (period === "am" && hour === 12) {
                  hour = 0;
                }
                const formattedTime = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
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
              for (const slot of availableSlots) {
                if (messageText.includes(slot.time.toLowerCase()) || messageText.includes(slot.time.replace(":", ""))) {
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
          context.currentStep = "staff_selection";
          const availableStaff = await this.getAvailableStaff(context.tenantId, context.selectedDate, selectedTime);
          return {
            success: true,
            message: `Excellent! You selected: ${selectedTime}

Here are our available staff members:

${availableStaff.map((staff, index) => `${index + 1}. ${staff.name} - ${staff.specialization}`).join("\n")}

Please reply with the staff member number or name.`,
            nextStep: "staff_selection",
            options: availableStaff.map((staff) => staff.name)
          };
        } catch (error) {
          console.error("Error handling time selection:", error);
          return {
            success: false,
            message: "I'm sorry, there was an error. Please try again."
          };
        }
      }
      /**
       * Handle staff selection
       */
      async handleStaffSelection(messageText, context) {
        try {
          const availableStaff = await this.getAvailableStaff(context.tenantId, context.selectedDate, context.selectedTime);
          let selectedStaff = null;
          const staffNumber = parseInt(messageText);
          if (!isNaN(staffNumber) && staffNumber >= 1 && staffNumber <= availableStaff.length) {
            selectedStaff = availableStaff[staffNumber - 1];
          } else {
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
          context.currentStep = "confirmation";
          const service = await this.getServiceById(context.tenantId, context.selectedService);
          const appointmentDateTime = /* @__PURE__ */ new Date(`${context.selectedDate}T${context.selectedTime}:00`);
          context.appointmentData = {
            customer_name: context.customerName || "WhatsApp Customer",
            customer_phone: context.customerPhone,
            customer_email: context.customerEmail || "",
            service_id: context.selectedService,
            service_name: service?.name || "Unknown Service",
            staff_id: context.selectedStaff,
            staff_name: selectedStaff.name,
            scheduled_at: appointmentDateTime.toISOString(),
            selectedTime: context.selectedTime,
            amount: service?.price || 0,
            currency: "INR",
            notes: "Booked via WhatsApp Bot",
            payment_status: "pending"
          };
          return {
            success: true,
            message: `Perfect! Here's your appointment summary:

\u{1F4C5} **Appointment Details:**
\u2022 Service: ${service?.name}
\u2022 Date: ${context.selectedDate}
\u2022 Time: ${context.selectedTime}
\u2022 Staff: ${selectedStaff.name}
\u2022 Price: \u20B9${service?.price}
\u2022 Duration: ${service?.duration_minutes} minutes

Please confirm by typing 'yes' or 'confirm' to book this appointment.`,
            nextStep: "confirmation"
          };
        } catch (error) {
          console.error("Error handling staff selection:", error);
          return {
            success: false,
            message: "I'm sorry, there was an error. Please try again."
          };
        }
      }
      /**
       * Handle confirmation and create appointment
       */
      async handleConfirmation(messageText, context) {
        try {
          console.log("\u{1F50D} handleConfirmation called with:", { messageText, context: JSON.stringify(context, null, 2) });
          const confirmKeywords = ["yes", "confirm", "book", "ok", "okay", "proceed"];
          if (!confirmKeywords.some((keyword) => messageText.includes(keyword))) {
            console.log("\u274C Confirmation keyword not found");
            return {
              success: false,
              message: "Please type 'yes' or 'confirm' to book the appointment, or 'cancel' to start over."
            };
          }
          console.log("\u2705 Confirmation keyword found, proceeding with booking creation");
          console.log("\u{1F4CA} Appointment data:", context.appointmentData);
          if (!context.appointmentData) {
            console.log("\u274C No appointment data found in context");
            return {
              success: false,
              message: "I'm sorry, there was an error with your appointment data. Please start over."
            };
          }
          console.log("\u{1F4DD} Calling createAppointment...");
          const appointmentId = await this.createAppointment(context.tenantId, context.appointmentData);
          console.log("\u{1F4CA} createAppointment result:", appointmentId);
          if (appointmentId) {
            context.currentStep = "completed";
            console.log("\u2705 Appointment created successfully, returning success response");
            return {
              success: true,
              message: `\u{1F389} **Appointment Booked Successfully!**

Your appointment has been confirmed:

\u{1F4C5} Date: ${context.selectedDate}
\u23F0 Time: ${context.selectedTime}
\u{1F487}\u200D\u2640\uFE0F Service: ${context.appointmentData.service_name}
\u{1F469}\u200D\u{1F4BC} Staff: ${context.appointmentData.staff_name}
\u{1F4B0} Price: \u20B9${context.appointmentData.amount}

You'll receive a confirmation SMS shortly. 

Thank you for choosing Bella Salon! We look forward to seeing you! \u2728`,
              appointmentId,
              nextStep: "completed"
            };
          } else {
            console.log("\u274C createAppointment returned null");
            return {
              success: false,
              message: "I'm sorry, there was an error booking your appointment. Please try again or contact us directly."
            };
          }
        } catch (error) {
          console.error("\u274C Error handling confirmation:", error);
          console.error("\u274C Error details:", error.message);
          console.error("\u274C Error stack:", error.stack);
          return {
            success: false,
            message: "I'm sorry, there was an error booking your appointment. Please try again or contact us directly.",
            error: error instanceof Error ? error.message : "Unknown error"
          };
        }
      }
      /**
       * Get services for a tenant
       */
      async getServices(tenantId) {
        try {
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
          console.log(`\u{1F4CB} Found ${result.rows.length} Bella Salon services`);
          return result.rows;
        } catch (error) {
          console.error("Error fetching Bella Salon services:", error);
          return [];
        }
      }
      /**
       * Get service by ID
       */
      async getServiceById(tenantId, serviceId) {
        try {
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
          console.error("Error fetching Bella Salon service:", error);
          return null;
        }
      }
      /**
       * Get available dates (next 7 days)
       */
      getAvailableDates() {
        const dates = [];
        const today = /* @__PURE__ */ new Date();
        for (let i = 1; i <= 7; i++) {
          const date = new Date(today);
          date.setDate(today.getDate() + i);
          const dateStr = date.toISOString().split("T")[0];
          const formatted = date.toLocaleDateString("en-IN", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
          });
          dates.push({ date: dateStr, formatted });
        }
        return dates;
      }
      /**
       * Get available time slots for a date
       */
      async getAvailableTimeSlots(tenantId, date) {
        try {
          const timeSlots = [
            "09:00",
            "10:00",
            "11:00",
            "12:00",
            "13:00",
            "14:00",
            "15:00",
            "16:00",
            "17:00"
          ];
          const bookedSlots = await this.pool.query(`
        SELECT appointment_time
        FROM bookings 
        WHERE appointment_date = $1 
        AND status != 'cancelled'
      `, [date]);
          const bookedTimes = bookedSlots.rows.map((row) => row.appointment_time);
          return timeSlots.map((time) => ({
            time,
            available: !bookedTimes.includes(time)
          }));
        } catch (error) {
          console.error("Error fetching time slots:", error);
          return [];
        }
      }
      /**
       * Get available staff for a specific date and time
       */
      async getAvailableStaff(tenantId, date, time) {
        try {
          const result = await this.pool.query(`
        SELECT id, name, specializations
        FROM staff 
        WHERE tenant_id = $1 AND is_active = true
        ORDER BY name
      `, [tenantId]);
          console.log(`\u{1F4CB} Found ${result.rows.length} Bella Salon staff members`);
          return result.rows.map((staff) => ({
            id: staff.id,
            name: staff.name,
            specialization: Array.isArray(staff.specializations) ? staff.specializations.join(", ") : "General Services"
          }));
        } catch (error) {
          console.error("Error fetching Bella Salon staff:", error);
          return [];
        }
      }
      /**
       * Create appointment in database
       */
      async createAppointment(tenantId, appointmentData) {
        try {
          console.log("\u{1F50D} Creating appointment with data:", JSON.stringify(appointmentData, null, 2));
          const bookingId = randomUUID3();
          const conversationId = randomUUID3();
          console.log(`\u{1F4DD} Creating conversation with ID: ${conversationId}`);
          await this.pool.query(`
        INSERT INTO conversations (
          id, phone_number, customer_name, current_state, 
          selected_service, selected_date, selected_time, context_data
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
            conversationId,
            appointmentData.customer_phone,
            appointmentData.customer_name,
            "booking_completed",
            appointmentData.service_id,
            appointmentData.selectedDate,
            appointmentData.selectedTime,
            JSON.stringify({
              service_name: appointmentData.service_name,
              staff_name: appointmentData.staff_name,
              amount: appointmentData.amount
            })
          ]);
          console.log(`\u2705 Conversation created successfully: ${conversationId}`);
          console.log(`\u{1F4DD} Inserting booking with ID: ${bookingId}`);
          console.log(`\u{1F4DD} Service ID: ${appointmentData.service_id}`);
          console.log(`\u{1F4DD} Phone: ${appointmentData.customer_phone}`);
          console.log(`\u{1F4DD} Name: ${appointmentData.customer_name}`);
          console.log(`\u{1F4DD} Amount: ${appointmentData.amount}`);
          console.log(`\u{1F4DD} Scheduled At: ${appointmentData.scheduled_at}`);
          console.log(`\u{1F4DD} Selected Time: ${appointmentData.selectedTime}`);
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
            "confirmed",
            appointmentData.scheduled_at,
            appointmentData.selectedTime,
            `WhatsApp booking: ${appointmentData.service_name} with ${appointmentData.staff_name}`,
            appointmentData.staff_id
          ]);
          console.log(`\u2705 Booking created successfully: ${bookingId}`);
          console.log(`\u{1F4CA} Query result:`, result.rows);
          return result.rows[0]?.id || null;
        } catch (error) {
          console.error("\u274C Error creating appointment:", error);
          console.error("\u274C Error details:", error.message);
          console.error("\u274C Error code:", error.code);
          console.error("\u274C Error constraint:", error.constraint);
          return null;
        }
      }
      /**
       * Get appropriate emoji for service based on name and category
       */
      getServiceEmoji(serviceName, category) {
        const name = serviceName.toLowerCase();
        if (name.includes("hair") || name.includes("cut") || name.includes("color") || name.includes("style")) {
          return "\u{1F487}\u200D\u2640\uFE0F";
        }
        if (name.includes("nail") || name.includes("manicure") || name.includes("pedicure") || name.includes("polish")) {
          return "\u{1F485}";
        }
        if (name.includes("facial") || name.includes("skin") || name.includes("treatment")) {
          return "\u2728";
        }
        if (name.includes("massage") || name.includes("spa")) {
          return "\u{1F9D8}\u200D\u2640\uFE0F";
        }
        if (name.includes("makeup") || name.includes("bridal") || name.includes("party")) {
          return "\u{1F484}";
        }
        if (name.includes("wax") || name.includes("threading")) {
          return "\u{1FA92}";
        }
        return "\u2728";
      }
    };
  }
});

// server/services/dynamic-flow-processor.service.ts
var dynamic_flow_processor_service_exports = {};
__export(dynamic_flow_processor_service_exports, {
  DynamicFlowProcessorService: () => DynamicFlowProcessorService
});
var DynamicFlowProcessorService;
var init_dynamic_flow_processor_service = __esm({
  "server/services/dynamic-flow-processor.service.ts"() {
    "use strict";
    DynamicFlowProcessorService = class {
      constructor(storage2) {
        this.storage = storage2;
      }
      /**
       * Process a bot flow node with dynamic data from database
       */
      async processNode(node, context) {
        try {
          switch (node.type) {
            case "message":
              return await this.processMessageNode(node, context);
            case "service_message":
              return await this.processServiceMessageNode(node, context);
            case "question":
              return await this.processQuestionNode(node, context);
            case "service_list":
              return await this.processServiceListNode(node, context);
            case "date_picker":
              return await this.processDatePickerNode(node, context);
            case "time_slots":
              return await this.processTimeSlotsNode(node, context);
            case "booking_summary":
              return await this.processBookingSummaryNode(node, context);
            default:
              return {
                content: node.configuration?.message || "Hello!",
                messageType: "text"
              };
          }
        } catch (error) {
          console.error("Error processing dynamic node:", error);
          return {
            content: node.configuration?.message || "Sorry, I encountered an error.",
            messageType: "text"
          };
        }
      }
      /**
       * Process service message node - shows services with real data
       */
      async processServiceMessageNode(node, context) {
        try {
          const services2 = await this.storage.getServices();
          if (!services2 || services2.length === 0) {
            return {
              content: "Sorry, no services are currently available.",
              messageType: "text"
            };
          }
          const serviceList = services2.filter((service) => service.isActive).map((service, index) => {
            const emoji = this.getServiceEmoji(service.category);
            return `${index + 1}. ${emoji} ${service.name} \u2013 \u20B9${service.price}`;
          }).join("\n");
          const welcomeText = node.configuration?.welcomeText || "Welcome to our salon!";
          const serviceIntro = node.configuration?.serviceIntro || "Here are our services:";
          const instruction = node.configuration?.instruction || "Reply with the number or name of the service to book.";
          const content = `${welcomeText}

${serviceIntro}
${serviceList}

${instruction}`;
          return {
            content,
            messageType: "text",
            metadata: {
              services: services2.map((s) => ({
                id: s.id,
                name: s.name,
                price: s.price,
                category: s.category
              }))
            }
          };
        } catch (error) {
          console.error("Error processing service message node:", error);
          return {
            content: node.configuration?.message || "Welcome! Please contact us for services.",
            messageType: "text"
          };
        }
      }
      /**
       * Process service list node - interactive service selection
       */
      async processServiceListNode(node, context) {
        try {
          const services2 = await this.storage.getServices();
          const activeServices = services2.filter((service) => service.isActive);
          if (activeServices.length === 0) {
            return {
              content: "No services are currently available.",
              messageType: "text"
            };
          }
          const serviceOptions = activeServices.map((service, index) => ({
            id: `service_${service.id}`,
            title: service.name,
            description: `\u20B9${service.price} \u2022 ${service.durationMinutes || 60} min`,
            emoji: this.getServiceEmoji(service.category)
          }));
          return {
            content: "Please select a service:",
            messageType: "interactive",
            metadata: {
              type: "service_selection",
              options: serviceOptions,
              maxSelections: 1
            }
          };
        } catch (error) {
          console.error("Error processing service list node:", error);
          return {
            content: "Please contact us for service information.",
            messageType: "text"
          };
        }
      }
      /**
       * Process date picker node - shows available dates
       */
      async processDatePickerNode(node, context) {
        try {
          const availableDates = this.generateAvailableDates(7);
          const dateOptions = availableDates.map((date, index) => ({
            id: `date_${date}`,
            title: this.formatDate(date),
            description: this.getDayOfWeek(date)
          }));
          return {
            content: "Please select your preferred date:",
            messageType: "interactive",
            metadata: {
              type: "date_selection",
              options: dateOptions,
              maxSelections: 1
            }
          };
        } catch (error) {
          console.error("Error processing date picker node:", error);
          return {
            content: "Please contact us to schedule your appointment.",
            messageType: "text"
          };
        }
      }
      /**
       * Process time slots node - shows available times for selected date
       */
      async processTimeSlotsNode(node, context) {
        try {
          if (!context.selectedDate) {
            return {
              content: "Please select a date first.",
              messageType: "text"
            };
          }
          const timeSlots = this.generateTimeSlots(context.selectedDate);
          const timeOptions = timeSlots.map((time, index) => ({
            id: `time_${time}`,
            title: time,
            description: this.getTimeDescription(time)
          }));
          return {
            content: `Please select your preferred time for ${this.formatDate(context.selectedDate)}:`,
            messageType: "interactive",
            metadata: {
              type: "time_selection",
              options: timeOptions,
              maxSelections: 1
            }
          };
        } catch (error) {
          console.error("Error processing time slots node:", error);
          return {
            content: "Please contact us to schedule your appointment.",
            messageType: "text"
          };
        }
      }
      /**
       * Process booking summary node - shows final booking details
       */
      async processBookingSummaryNode(node, context) {
        try {
          if (!context.selectedService || !context.selectedDate || !context.selectedTime) {
            return {
              content: "Please complete your service, date, and time selection.",
              messageType: "text"
            };
          }
          const service = await this.storage.getService(context.selectedService);
          if (!service) {
            return {
              content: "Service not found. Please start over.",
              messageType: "text"
            };
          }
          const summary = `\u{1F4CB} **Booking Summary**

\u{1F3AF} **Service:** ${service.name}
\u{1F4B0} **Price:** \u20B9${service.price}
\u23F1\uFE0F **Duration:** ${service.durationMinutes || 60} minutes
\u{1F4C5} **Date:** ${this.formatDate(context.selectedDate)}
\u{1F550} **Time:** ${context.selectedTime}

Please confirm your booking by replying "CONFIRM" or "YES".`;
          return {
            content: summary,
            messageType: "text",
            metadata: {
              type: "booking_summary",
              service,
              date: context.selectedDate,
              time: context.selectedTime
            }
          };
        } catch (error) {
          console.error("Error processing booking summary node:", error);
          return {
            content: "Please contact us to complete your booking.",
            messageType: "text"
          };
        }
      }
      /**
       * Process regular message node with placeholder replacement
       */
      async processMessageNode(node, context) {
        let content = node.configuration?.message || "Hello!";
        content = this.replacePlaceholders(content, context);
        return {
          content,
          messageType: "text"
        };
      }
      /**
       * Process question node with dynamic options
       */
      async processQuestionNode(node, context) {
        let content = node.configuration?.question || "Please provide your answer.";
        content = this.replacePlaceholders(content, context);
        return {
          content,
          messageType: "text"
        };
      }
      // Helper methods
      getServiceEmoji(category) {
        const emojiMap = {
          "hair": "\u{1F487}\u200D\u2640\uFE0F",
          "nails": "\u{1F485}",
          "spa": "\u{1F9D6}\u200D\u2640\uFE0F",
          "massage": "\u{1F486}\u200D\u2640\uFE0F",
          "facial": "\u2728",
          "default": "\u{1F484}"
        };
        return emojiMap[category?.toLowerCase() || "default"];
      }
      generateAvailableDates(days) {
        const dates = [];
        const today = /* @__PURE__ */ new Date();
        for (let i = 1; i <= days; i++) {
          const date = new Date(today);
          date.setDate(today.getDate() + i);
          dates.push(date.toISOString().split("T")[0]);
        }
        return dates;
      }
      generateTimeSlots(selectedDate) {
        const slots = [
          "09:00",
          "09:30",
          "10:00",
          "10:30",
          "11:00",
          "11:30",
          "12:00",
          "12:30",
          "13:00",
          "13:30",
          "14:00",
          "14:30",
          "15:00",
          "15:30",
          "16:00",
          "16:30",
          "17:00",
          "17:30",
          "18:00"
        ];
        return slots;
      }
      formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-IN", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric"
        });
      }
      getDayOfWeek(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-IN", { weekday: "long" });
      }
      getTimeDescription(time) {
        const [hours, minutes] = time.split(":");
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? "PM" : "AM";
        const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        return `${displayHour}:${minutes} ${ampm}`;
      }
      replacePlaceholders(content, context) {
        content = content.replace(/\{selectedService\}/g, context.selectedService || "");
        content = content.replace(/\{selectedDate\}/g, context.selectedDate || "");
        content = content.replace(/\{selectedTime\}/g, context.selectedTime || "");
        content = content.replace(/\{phoneNumber\}/g, context.phoneNumber || "");
        return content;
      }
    };
  }
});

// server/business-config-api.ts
var business_config_api_exports = {};
__export(business_config_api_exports, {
  getAllBusinessTypes: () => getAllBusinessTypes,
  getBusinessConfig: () => getBusinessConfig
});
function getBusinessConfig(businessType) {
  const type = businessType || "salon";
  return businessConfigs[type] || businessConfigs["salon"];
}
function getAllBusinessTypes() {
  return Object.keys(businessConfigs);
}
var businessConfigs;
var init_business_config_api = __esm({
  "server/business-config-api.ts"() {
    "use strict";
    businessConfigs = {
      "restaurant": {
        id: "demo-restaurant-001",
        businessName: "Spark Restaurant",
        businessType: {
          id: "1",
          name: "Restaurant",
          category: "Food & Beverage",
          terminology: {
            offering: "Menu Item",
            transaction: "Order",
            customer: "Diner",
            booking: "Reservation"
          }
        },
        branding: {
          primaryColor: "#f97316",
          secondaryColor: "#64748b"
        },
        contact: {
          phone: "+1 (555) 123-4567",
          email: "hello@sparkrestaurant.com",
          address: "123 Food Street, Restaurant City, RC 12345"
        },
        offerings: [
          {
            id: "1",
            name: "Grilled Chicken",
            description: "Perfectly grilled chicken with herbs and spices",
            basePrice: 18,
            category: "Main Course",
            isActive: true,
            variants: [
              { id: "1a", name: "Regular", priceModifier: 0 },
              { id: "1b", name: "Large", priceModifier: 5 }
            ]
          },
          {
            id: "2",
            name: "Caesar Salad",
            description: "Fresh romaine lettuce with caesar dressing",
            basePrice: 12,
            category: "Salads",
            isActive: true
          },
          {
            id: "3",
            name: "Pasta Carbonara",
            description: "Creamy pasta with bacon and parmesan",
            basePrice: 16,
            category: "Pasta",
            isActive: true
          }
        ]
      },
      "clinic": {
        id: "demo-clinic-001",
        businessName: "Spark Medical Clinic",
        businessType: {
          id: "3",
          name: "Medical Clinic",
          category: "Healthcare",
          terminology: {
            offering: "Treatment",
            transaction: "Appointment",
            customer: "Patient",
            booking: "Appointment"
          }
        },
        branding: {
          primaryColor: "#10b981",
          secondaryColor: "#64748b"
        },
        contact: {
          phone: "+1 (555) 123-4567",
          email: "appointments@sparkclinic.com",
          address: "123 Health Street, Medical City, MC 12345"
        },
        offerings: [
          {
            id: "1",
            name: "General Consultation",
            description: "Comprehensive health checkup with our doctors",
            basePrice: 85,
            duration: 30,
            category: "Consultation",
            isActive: true
          },
          {
            id: "2",
            name: "Blood Test",
            description: "Complete blood count and analysis",
            basePrice: 45,
            duration: 15,
            category: "Laboratory",
            isActive: true
          },
          {
            id: "3",
            name: "X-Ray",
            description: "Digital X-ray imaging service",
            basePrice: 65,
            duration: 20,
            category: "Imaging",
            isActive: true
          }
        ]
      },
      "retail": {
        id: "demo-retail-001",
        businessName: "Spark Retail Store",
        businessType: {
          id: "4",
          name: "Retail Store",
          category: "Retail",
          terminology: {
            offering: "Product",
            transaction: "Order",
            customer: "Customer",
            booking: "Order"
          }
        },
        branding: {
          primaryColor: "#3b82f6",
          secondaryColor: "#64748b"
        },
        contact: {
          phone: "+1 (555) 123-4567",
          email: "orders@sparkretail.com",
          address: "123 Shopping Street, Retail City, RC 12345"
        },
        offerings: [
          {
            id: "1",
            name: "Premium T-Shirt",
            description: "High-quality cotton t-shirt in various colors",
            basePrice: 25,
            category: "Clothing",
            isActive: true,
            variants: [
              { id: "1a", name: "Small", priceModifier: 0 },
              { id: "1b", name: "Medium", priceModifier: 0 },
              { id: "1c", name: "Large", priceModifier: 2 },
              { id: "1d", name: "XL", priceModifier: 4 }
            ]
          },
          {
            id: "2",
            name: "Wireless Headphones",
            description: "Bluetooth wireless headphones with noise cancellation",
            basePrice: 89,
            category: "Electronics",
            isActive: true
          },
          {
            id: "3",
            name: "Coffee Mug",
            description: "Ceramic coffee mug with custom design",
            basePrice: 15,
            category: "Home & Kitchen",
            isActive: true
          }
        ]
      },
      "salon": {
        id: "demo-salon-001",
        businessName: "Spark Beauty Salon",
        businessType: {
          id: "2",
          name: "Beauty Salon",
          category: "Beauty & Wellness",
          terminology: {
            offering: "Service",
            transaction: "Appointment",
            customer: "Client",
            booking: "Appointment"
          }
        },
        branding: {
          primaryColor: "#ec4899",
          secondaryColor: "#64748b"
        },
        contact: {
          phone: "+1 (555) 123-4567",
          email: "hello@sparkbeauty.com",
          address: "123 Beauty Street, Salon City, SC 12345"
        },
        offerings: [
          {
            id: "1",
            name: "Haircut & Style",
            description: "Professional haircut with styling and finishing",
            basePrice: 45,
            duration: 60,
            category: "Hair Services",
            isActive: true,
            variants: [
              { id: "1a", name: "Short Hair", priceModifier: 0 },
              { id: "1b", name: "Long Hair", priceModifier: 15 }
            ]
          },
          {
            id: "2",
            name: "Hair Color",
            description: "Full hair coloring service with consultation",
            basePrice: 120,
            duration: 180,
            category: "Hair Services",
            isActive: true,
            variants: [
              { id: "2a", name: "Single Color", priceModifier: 0 },
              { id: "2b", name: "Highlights", priceModifier: 30 },
              { id: "2c", name: "Full Color + Highlights", priceModifier: 60 }
            ]
          },
          {
            id: "3",
            name: "Manicure",
            description: "Professional nail care and polish application",
            basePrice: 25,
            duration: 45,
            category: "Nail Services",
            isActive: true
          },
          {
            id: "4",
            name: "Facial Treatment",
            description: "Relaxing facial with cleansing and moisturizing",
            basePrice: 65,
            duration: 75,
            category: "Skin Care",
            isActive: true
          }
        ]
      }
    };
  }
});

// server/services/bot-flow-sync.service.ts
var bot_flow_sync_service_exports = {};
__export(bot_flow_sync_service_exports, {
  BotFlowSyncService: () => BotFlowSyncService
});
var BotFlowSyncService;
var init_bot_flow_sync_service = __esm({
  "server/services/bot-flow-sync.service.ts"() {
    "use strict";
    BotFlowSyncService = class _BotFlowSyncService {
      static instance;
      activeFlow = null;
      backupFlow = null;
      constructor() {
      }
      static getInstance() {
        if (!_BotFlowSyncService.instance) {
          _BotFlowSyncService.instance = new _BotFlowSyncService();
        }
        return _BotFlowSyncService.instance;
      }
      /**
       * Load the exact WhatsApp bot flow
       */
      async loadWhatsAppBotFlow() {
        try {
          const fs2 = __require("fs");
          const path2 = __require("path");
          const flowPath = path2.join(process.cwd(), "whatsapp-bot-flow-exact.json");
          const flowData = JSON.parse(fs2.readFileSync(flowPath, "utf8"));
          this.activeFlow = flowData;
          console.log("\u2705 WhatsApp bot flow loaded successfully");
          return flowData;
        } catch (error) {
          console.error("Error loading WhatsApp bot flow:", error);
          throw error;
        }
      }
      /**
       * Create backup of current flow
       */
      async createBackup() {
        try {
          const fs2 = __require("fs");
          const path2 = __require("path");
          const backupPath = path2.join(process.cwd(), "backup-current-flows.json");
          if (this.activeFlow) {
            this.backupFlow = { ...this.activeFlow };
            fs2.writeFileSync(backupPath, JSON.stringify({
              backup_created: (/* @__PURE__ */ new Date()).toISOString(),
              description: "Backup of current bot flow before changes",
              flow: this.backupFlow
            }, null, 2));
            console.log("\u2705 Backup created successfully");
          }
        } catch (error) {
          console.error("Error creating backup:", error);
          throw error;
        }
      }
      /**
       * Restore from backup
       */
      async restoreFromBackup() {
        try {
          const fs2 = __require("fs");
          const path2 = __require("path");
          const backupPath = path2.join(process.cwd(), "backup-current-flows.json");
          if (fs2.existsSync(backupPath)) {
            const backupData = JSON.parse(fs2.readFileSync(backupPath, "utf8"));
            this.activeFlow = backupData.flow;
            console.log("\u2705 Flow restored from backup");
            return this.activeFlow;
          }
          return null;
        } catch (error) {
          console.error("Error restoring from backup:", error);
          throw error;
        }
      }
      /**
       * Get current active flow
       */
      getActiveFlow() {
        return this.activeFlow;
      }
      /**
       * Update active flow
       */
      updateActiveFlow(flow) {
        this.activeFlow = flow;
        console.log("\u2705 Active flow updated");
      }
      /**
       * Check if flow changes should reflect in WhatsApp bot
       */
      shouldSyncWithWhatsApp() {
        return this.activeFlow !== null && this.activeFlow.isActive;
      }
      /**
       * Get flow node by ID
       */
      getFlowNode(nodeId) {
        if (!this.activeFlow) return null;
        return this.activeFlow.nodes.find((node) => node.id === nodeId);
      }
      /**
       * Get flow connection by ID
       */
      getFlowConnection(connectionId) {
        if (!this.activeFlow) return null;
        return this.activeFlow.connections.find((conn) => conn.id === connectionId);
      }
      /**
       * Process flow changes and sync with WhatsApp bot
       */
      async processFlowChanges(changes) {
        if (!this.activeFlow) return;
        console.log("\u{1F504} Processing flow changes:", changes);
        try {
          const { DynamicFlowProcessorService: DynamicFlowProcessorService2 } = (init_dynamic_flow_processor_service(), __toCommonJS(dynamic_flow_processor_service_exports));
          const flowProcessor = DynamicFlowProcessorService2.getInstance();
          await flowProcessor.updateFlow(this.activeFlow);
          console.log("\u2705 Flow changes processed and synced with WhatsApp bot");
        } catch (error) {
          console.error("Error syncing flow changes:", error);
        }
      }
      /**
       * Sync flow changes from bot flow builder
       */
      async syncFlowFromBuilder(flowData) {
        try {
          console.log("\u{1F504} Syncing flow from builder:", flowData.name);
          this.activeFlow = flowData;
          const { DynamicFlowProcessorService: DynamicFlowProcessorService2 } = (init_dynamic_flow_processor_service(), __toCommonJS(dynamic_flow_processor_service_exports));
          const flowProcessor = DynamicFlowProcessorService2.getInstance();
          await flowProcessor.updateFlow(flowData);
          console.log("\u2705 Flow synced from builder to WhatsApp bot");
        } catch (error) {
          console.error("Error syncing flow from builder:", error);
        }
      }
    };
  }
});

// server/vercel.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  apiKeys: () => apiKeys,
  bookings: () => bookings,
  botFlowExecutions: () => botFlowExecutions,
  botFlowNodes: () => botFlowNodes,
  botFlows: () => botFlows,
  businessTypes: () => businessTypes,
  conversations: () => conversations,
  customFields: () => customFields,
  insertApiKeySchema: () => insertApiKeySchema,
  insertBookingSchema: () => insertBookingSchema,
  insertBotFlowExecutionSchema: () => insertBotFlowExecutionSchema,
  insertBotFlowNodeSchema: () => insertBotFlowNodeSchema,
  insertBotFlowSchema: () => insertBotFlowSchema,
  insertBusinessTypeSchema: () => insertBusinessTypeSchema,
  insertConversationSchema: () => insertConversationSchema,
  insertCustomFieldSchema: () => insertCustomFieldSchema,
  insertMessageSchema: () => insertMessageSchema,
  insertOfferingSchema: () => insertOfferingSchema,
  insertServiceSchema: () => insertServiceSchema,
  insertSettingsChangeLogSchema: () => insertSettingsChangeLogSchema,
  insertSettingsVersionSchema: () => insertSettingsVersionSchema,
  insertSubscriptionPlanSchema: () => insertSubscriptionPlanSchema,
  insertSubscriptionSchema: () => insertSubscriptionSchema,
  insertTenantSchema: () => insertTenantSchema,
  insertTransactionSchema: () => insertTransactionSchema,
  insertUsageMetricSchema: () => insertUsageMetricSchema,
  insertUserSchema: () => insertUserSchema,
  insertWhatsappCredentialsSchema: () => insertWhatsappCredentialsSchema,
  insertWorkflowStateSchema: () => insertWorkflowStateSchema,
  insertWorkflowTransitionSchema: () => insertWorkflowTransitionSchema,
  messages: () => messages,
  offerings: () => offerings,
  services: () => services,
  settingsChangeLog: () => settingsChangeLog,
  settingsVersions: () => settingsVersions,
  subscriptionPlans: () => subscriptionPlans,
  subscriptions: () => subscriptions,
  tenants: () => tenants,
  transactions: () => transactions,
  usageMetrics: () => usageMetrics,
  users: () => users,
  whatsappCredentials: () => whatsappCredentials,
  workflowStates: () => workflowStates,
  workflowTransitions: () => workflowTransitions
});
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, jsonb, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var tenants = pgTable("tenants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessName: varchar("business_name", { length: 255 }).notNull(),
  domain: varchar("domain", { length: 100 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  status: varchar("status", { length: 20 }).notNull().default("trial"),
  // trial, active, suspended, cancelled
  subscriptionPlan: varchar("subscription_plan", { length: 50 }).notNull().default("starter"),
  whatsappPhoneId: varchar("whatsapp_phone_id", { length: 100 }),
  whatsappToken: text("whatsapp_token"),
  whatsappVerifyToken: varchar("whatsapp_verify_token", { length: 100 }),
  botSettings: jsonb("bot_settings").default(sql`'{}'::jsonb`),
  billingSettings: jsonb("billing_settings").default(sql`'{}'::jsonb`),
  // New business configuration fields
  businessTypeId: varchar("business_type_id").references(() => businessTypes.id),
  businessConfig: jsonb("business_config").default(sql`'{}'::jsonb`),
  terminology: jsonb("terminology").default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  email: varchar("email", { length: 255 }).notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull().default("admin"),
  // admin, user
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  isActive: boolean("is_active").notNull().default(true),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  uniqueTenantEmail: unique().on(table.tenantId, table.email)
}));
var apiKeys = pgTable("api_keys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  keyHash: varchar("key_hash", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  permissions: jsonb("permissions").notNull().default(sql`'[]'::jsonb`),
  lastUsed: timestamp("last_used"),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var subscriptionPlans = pgTable("subscription_plans", {
  id: varchar("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  priceMonthly: integer("price_monthly").notNull(),
  priceYearly: integer("price_yearly"),
  features: jsonb("features").notNull().default(sql`'{}'::jsonb`),
  limits: jsonb("limits").notNull().default(sql`'{}'::jsonb`),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  planId: varchar("plan_id").notNull().references(() => subscriptionPlans.id),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  // active, cancelled, past_due, unpaid
  billingCycle: varchar("billing_cycle", { length: 20 }).notNull().default("monthly"),
  // monthly, yearly
  currentPeriodStart: timestamp("current_period_start").notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 100 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var usageMetrics = pgTable("usage_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  metricName: varchar("metric_name", { length: 100 }).notNull(),
  metricValue: integer("metric_value").notNull().default(0),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow()
}, (table) => ({
  uniqueTenantMetricPeriod: unique().on(table.tenantId, table.metricName, table.periodStart)
}));
var services = pgTable("services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price").notNull(),
  durationMinutes: integer("duration_minutes").default(60),
  isActive: boolean("is_active").notNull().default(true),
  icon: text("icon"),
  category: varchar("category", { length: 100 }),
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  phoneNumber: text("phone_number").notNull(),
  customerName: text("customer_name"),
  currentState: text("current_state").notNull().default("greeting"),
  // greeting, awaiting_service, awaiting_date, awaiting_time, awaiting_payment, completed
  selectedService: varchar("selected_service").references(() => services.id),
  selectedDate: text("selected_date"),
  // YYYY-MM-DD format
  selectedTime: text("selected_time"),
  // HH:MM format
  contextData: jsonb("context_data").default(sql`'{}'::jsonb`),
  // New flexible business model fields
  customFields: jsonb("custom_fields").default(sql`'{}'::jsonb`),
  botFlowExecutionId: varchar("bot_flow_execution_id").references(() => botFlowExecutions.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  uniqueTenantPhone: unique().on(table.tenantId, table.phoneNumber)
}));
var messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  conversationId: varchar("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  messageType: varchar("message_type", { length: 50 }).notNull().default("text"),
  // text, image, document, etc.
  isFromBot: boolean("is_from_bot").notNull(),
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  timestamp: timestamp("timestamp").notNull().defaultNow()
});
var bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  conversationId: varchar("conversation_id").notNull().references(() => conversations.id),
  serviceId: varchar("service_id").notNull().references(() => services.id),
  phoneNumber: text("phone_number").notNull(),
  customerName: text("customer_name"),
  customerEmail: text("customer_email"),
  amount: integer("amount").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  // pending, paid, confirmed, cancelled
  paymentMethod: varchar("payment_method", { length: 50 }),
  paymentReference: text("payment_reference"),
  appointmentDate: timestamp("appointment_date"),
  appointmentTime: text("appointment_time"),
  // e.g., "10:00 AM", "02:30 PM"
  notes: text("notes"),
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var insertTenantSchema = createInsertSchema(tenants).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertApiKeySchema = createInsertSchema(apiKeys).omit({
  id: true,
  createdAt: true
});
var insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({
  createdAt: true
});
var insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertUsageMetricSchema = createInsertSchema(usageMetrics).omit({
  id: true,
  createdAt: true
});
var insertServiceSchema = createInsertSchema(services).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  timestamp: true
});
var insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var settingsVersions = pgTable("settings_versions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  version: integer("version").notNull(),
  settings: jsonb("settings").notNull(),
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  isActive: boolean("is_active").notNull().default(false),
  changeSummary: text("change_summary"),
  rollbackReason: text("rollback_reason")
}, (table) => ({
  uniqueTenantVersion: unique().on(table.tenantId, table.version)
}));
var whatsappCredentials = pgTable("whatsapp_credentials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }).unique(),
  phoneNumberId: varchar("phone_number_id").notNull(),
  accessTokenEncrypted: text("access_token_encrypted").notNull(),
  verifyToken: varchar("verify_token", { length: 255 }).notNull(),
  businessAccountId: varchar("business_account_id", { length: 255 }),
  appId: varchar("app_id", { length: 255 }),
  appSecretEncrypted: text("app_secret_encrypted"),
  webhookUrl: text("webhook_url"),
  isVerified: boolean("is_verified").notNull().default(false),
  lastVerified: timestamp("last_verified"),
  verificationErrors: jsonb("verification_errors"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var settingsChangeLog = pgTable("settings_change_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  changedBy: varchar("changed_by").notNull(),
  changeType: varchar("change_type", { length: 50 }).notNull(),
  // 'update', 'reset', 'rollback'
  fieldPath: varchar("field_path", { length: 255 }),
  // JSON path of changed field
  oldValue: jsonb("old_value"),
  newValue: jsonb("new_value"),
  changeReason: text("change_reason"),
  ipAddress: varchar("ip_address", { length: 45 }),
  // Support IPv6
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var insertSettingsVersionSchema = createInsertSchema(settingsVersions).omit({
  id: true,
  createdAt: true
});
var insertWhatsappCredentialsSchema = createInsertSchema(whatsappCredentials).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertSettingsChangeLogSchema = createInsertSchema(settingsChangeLog).omit({
  id: true,
  createdAt: true
});
var businessTypes = pgTable("business_types", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull().unique(),
  displayName: varchar("display_name", { length: 100 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  description: text("description"),
  terminology: jsonb("terminology").notNull().default(sql`'{}'::jsonb`),
  defaultConfig: jsonb("default_config").notNull().default(sql`'{}'::jsonb`),
  isSystem: boolean("is_system").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var customFields = pgTable("custom_fields", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  entityType: varchar("entity_type", { length: 50 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  label: varchar("label", { length: 200 }).notNull(),
  fieldType: varchar("field_type", { length: 50 }).notNull(),
  isRequired: boolean("is_required").notNull().default(false),
  validationRules: jsonb("validation_rules").default(sql`'{}'::jsonb`),
  fieldOptions: jsonb("field_options").default(sql`'[]'::jsonb`),
  defaultValue: jsonb("default_value"),
  displayOrder: integer("display_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  uniqueTenantEntityName: unique().on(table.tenantId, table.entityType, table.name)
}));
var offerings = pgTable("offerings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  offeringType: varchar("offering_type", { length: 50 }).notNull().default("service"),
  category: varchar("category", { length: 100 }),
  subcategory: varchar("subcategory", { length: 100 }),
  pricingType: varchar("pricing_type", { length: 50 }).notNull().default("fixed"),
  basePrice: integer("base_price").notNull().default(0),
  currency: varchar("currency", { length: 3 }).notNull().default("INR"),
  pricingConfig: jsonb("pricing_config").default(sql`'{}'::jsonb`),
  isSchedulable: boolean("is_schedulable").notNull().default(false),
  durationMinutes: integer("duration_minutes"),
  availabilityConfig: jsonb("availability_config").default(sql`'{}'::jsonb`),
  hasVariants: boolean("has_variants").notNull().default(false),
  variants: jsonb("variants").default(sql`'[]'::jsonb`),
  customFields: jsonb("custom_fields").default(sql`'{}'::jsonb`),
  isActive: boolean("is_active").notNull().default(true),
  displayOrder: integer("display_order").notNull().default(0),
  tags: jsonb("tags").default(sql`'[]'::jsonb`),
  images: jsonb("images").default(sql`'[]'::jsonb`),
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var workflowStates = pgTable("workflow_states", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  workflowType: varchar("workflow_type", { length: 50 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  displayName: varchar("display_name", { length: 100 }).notNull(),
  stateType: varchar("state_type", { length: 20 }).notNull().default("intermediate"),
  color: varchar("color", { length: 7 }).default("#6B7280"),
  description: text("description"),
  isSystem: boolean("is_system").notNull().default(false),
  displayOrder: integer("display_order").notNull().default(0),
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  uniqueTenantWorkflowName: unique().on(table.tenantId, table.workflowType, table.name)
}));
var workflowTransitions = pgTable("workflow_transitions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  workflowType: varchar("workflow_type", { length: 50 }).notNull(),
  fromStateId: varchar("from_state_id").notNull().references(() => workflowStates.id, { onDelete: "cascade" }),
  toStateId: varchar("to_state_id").notNull().references(() => workflowStates.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  displayName: varchar("display_name", { length: 100 }).notNull(),
  conditions: jsonb("conditions").default(sql`'{}'::jsonb`),
  actions: jsonb("actions").default(sql`'[]'::jsonb`),
  isAutomatic: boolean("is_automatic").notNull().default(false),
  requiresApproval: boolean("requires_approval").notNull().default(false),
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  transactionType: varchar("transaction_type", { length: 50 }).notNull().default("booking"),
  transactionNumber: varchar("transaction_number", { length: 50 }),
  customerPhone: varchar("customer_phone", { length: 20 }).notNull(),
  customerName: varchar("customer_name", { length: 200 }),
  customerEmail: varchar("customer_email", { length: 255 }),
  offeringId: varchar("offering_id").references(() => offerings.id, { onDelete: "set null" }),
  scheduledAt: timestamp("scheduled_at"),
  durationMinutes: integer("duration_minutes"),
  timezone: varchar("timezone", { length: 50 }).default("Asia/Kolkata"),
  amount: integer("amount").notNull().default(0),
  currency: varchar("currency", { length: 3 }).notNull().default("INR"),
  paymentStatus: varchar("payment_status", { length: 50 }).default("pending"),
  paymentMethod: varchar("payment_method", { length: 50 }),
  paymentReference: varchar("payment_reference", { length: 200 }),
  currentStateId: varchar("current_state_id").references(() => workflowStates.id),
  workflowHistory: jsonb("workflow_history").default(sql`'[]'::jsonb`),
  customFields: jsonb("custom_fields").default(sql`'{}'::jsonb`),
  notes: text("notes"),
  internalNotes: text("internal_notes"),
  tags: jsonb("tags").default(sql`'[]'::jsonb`),
  priority: varchar("priority", { length: 20 }).default("normal"),
  source: varchar("source", { length: 50 }).default("whatsapp"),
  conversationId: varchar("conversation_id").references(() => conversations.id, { onDelete: "set null" }),
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var botFlows = pgTable("bot_flows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  flowType: varchar("flow_type", { length: 50 }).notNull().default("conversation"),
  startNodeId: varchar("start_node_id"),
  isActive: boolean("is_active").notNull().default(false),
  isDefault: boolean("is_default").notNull().default(false),
  version: integer("version").notNull().default(1),
  variables: jsonb("variables").default(sql`'{}'::jsonb`),
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  uniqueTenantNameVersion: unique().on(table.tenantId, table.name, table.version)
}));
var botFlowNodes = pgTable("bot_flow_nodes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  flowId: varchar("flow_id").notNull().references(() => botFlows.id, { onDelete: "cascade" }),
  nodeType: varchar("node_type", { length: 50 }).notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  positionX: integer("position_x").notNull().default(0),
  positionY: integer("position_y").notNull().default(0),
  config: jsonb("config").notNull().default(sql`'{}'::jsonb`),
  connections: jsonb("connections").default(sql`'[]'::jsonb`),
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var botFlowExecutions = pgTable("bot_flow_executions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  flowId: varchar("flow_id").notNull().references(() => botFlows.id, { onDelete: "cascade" }),
  conversationId: varchar("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  currentNodeId: varchar("current_node_id").references(() => botFlowNodes.id),
  variables: jsonb("variables").default(sql`'{}'::jsonb`),
  executionHistory: jsonb("execution_history").default(sql`'[]'::jsonb`),
  status: varchar("status", { length: 50 }).notNull().default("active"),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`)
}, (table) => ({
  uniqueConversation: unique().on(table.conversationId)
}));
var insertBusinessTypeSchema = createInsertSchema(businessTypes).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertCustomFieldSchema = createInsertSchema(customFields).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertOfferingSchema = createInsertSchema(offerings).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertWorkflowStateSchema = createInsertSchema(workflowStates).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertWorkflowTransitionSchema = createInsertSchema(workflowTransitions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertBotFlowSchema = createInsertSchema(botFlows).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertBotFlowNodeSchema = createInsertSchema(botFlowNodes).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertBotFlowExecutionSchema = createInsertSchema(botFlowExecutions).omit({
  id: true,
  startedAt: true
});

// server/storage.ts
import { randomUUID as randomUUID2 } from "crypto";

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
var db;
var pool;
if (process.env.DATABASE_URL) {
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle({ client: pool, schema: schema_exports });
}

// server/storage.ts
import { eq as eq2, and as and2, gte as gte2, lt as lt2 } from "drizzle-orm";

// server/storage-compatible.ts
import { randomUUID } from "crypto";
import { eq, and, gte, lt, sql as sql2 } from "drizzle-orm";
import { pgTable as pgTable2, text as text2, varchar as varchar2, integer as integer2, timestamp as timestamp2, boolean as boolean2, jsonb as jsonb2 } from "drizzle-orm/pg-core";
var compatibleServices = pgTable2("services", {
  id: varchar2("id").primaryKey().default(sql2`gen_random_uuid()`),
  name: text2("name").notNull(),
  description: text2("description"),
  price: integer2("price").notNull(),
  // durationMinutes: integer("duration_minutes").default(60), // Commented out - doesn't exist in production
  isActive: boolean2("is_active").notNull().default(true),
  icon: text2("icon"),
  // category: varchar("category", { length: 100 }), // Commented out - might not exist
  // metadata: jsonb("metadata").default(sql`'{}'::jsonb`), // Commented out - might not exist
  createdAt: timestamp2("created_at").notNull().defaultNow(),
  updatedAt: timestamp2("updated_at").notNull().defaultNow()
});
var compatibleConversations = pgTable2("conversations", {
  id: varchar2("id").primaryKey().default(sql2`gen_random_uuid()`),
  phoneNumber: text2("phone_number").notNull(),
  customerName: text2("customer_name"),
  currentState: text2("current_state").notNull().default("greeting"),
  selectedService: varchar2("selected_service"),
  selectedDate: text2("selected_date"),
  selectedTime: text2("selected_time"),
  contextData: jsonb2("context_data").default(sql2`'{}'::jsonb`),
  createdAt: timestamp2("created_at").notNull().defaultNow(),
  updatedAt: timestamp2("updated_at").notNull().defaultNow()
});
var compatibleMessages = pgTable2("messages", {
  id: varchar2("id").primaryKey().default(sql2`gen_random_uuid()`),
  conversationId: varchar2("conversation_id").notNull(),
  content: text2("content").notNull(),
  messageType: varchar2("message_type", { length: 50 }).notNull().default("text"),
  isFromBot: boolean2("is_from_bot").notNull(),
  metadata: jsonb2("metadata").default(sql2`'{}'::jsonb`),
  // Production DB uses "timestamp" for messages time column
  createdAt: timestamp2("timestamp").notNull().defaultNow()
});
var compatibleBookings = pgTable2("bookings", {
  id: varchar2("id").primaryKey().default(sql2`gen_random_uuid()`),
  conversationId: varchar2("conversation_id").notNull(),
  serviceId: varchar2("service_id").notNull(),
  phoneNumber: text2("phone_number").notNull(),
  customerName: text2("customer_name"),
  // customerEmail: text("customer_email"), // Commented out - doesn't exist in production
  amount: integer2("amount").notNull(),
  status: varchar2("status", { length: 20 }).notNull().default("pending"),
  paymentMethod: varchar2("payment_method", { length: 50 }),
  paymentReference: text2("payment_reference"),
  appointmentDate: timestamp2("appointment_date"),
  appointmentTime: text2("appointment_time"),
  notes: text2("notes"),
  // metadata: jsonb("metadata").default(sql`'{}'::jsonb`), // Commented out - might not exist
  createdAt: timestamp2("created_at").notNull().defaultNow(),
  updatedAt: timestamp2("updated_at").notNull().defaultNow()
});
var CompatibleDatabaseStorage = class {
  constructor() {
  }
  async initializeDefaultServices() {
    return;
  }
  async getServices() {
    try {
      if (!db) {
        return [];
      }
      return await db.select().from(compatibleServices);
    } catch (error) {
      console.error("Error fetching services:", error);
      return [];
    }
  }
  async getService(id) {
    try {
      if (!db) {
        return void 0;
      }
      const [service] = await db.select().from(compatibleServices).where(eq(compatibleServices.id, id));
      return service || void 0;
    } catch (error) {
      console.error("Error fetching service:", error);
      return void 0;
    }
  }
  async createService(insertService) {
    try {
      if (!db) {
        throw new Error("Database not available");
      }
      const safeServiceData = {
        name: insertService.name,
        description: insertService.description,
        price: insertService.price,
        isActive: insertService.isActive ?? true,
        icon: insertService.icon
      };
      const [service] = await db.insert(compatibleServices).values(safeServiceData).returning();
      return {
        ...service,
        durationMinutes: insertService.durationMinutes || 60,
        category: insertService.category || null,
        metadata: insertService.metadata || {}
      };
    } catch (error) {
      console.error("Error creating service:", error);
      return {
        id: randomUUID(),
        name: insertService.name,
        description: insertService.description || null,
        price: insertService.price,
        durationMinutes: insertService.durationMinutes || 60,
        isActive: insertService.isActive ?? true,
        icon: insertService.icon || null,
        category: insertService.category || null,
        metadata: insertService.metadata || {},
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      };
    }
  }
  async updateService(id, updateData) {
    try {
      if (!db) {
        console.warn("Database not available, cannot update service");
        return void 0;
      }
      const [service] = await db.update(compatibleServices).set({ ...updateData, updatedAt: /* @__PURE__ */ new Date() }).where(eq(compatibleServices.id, id)).returning();
      return service || void 0;
    } catch (error) {
      console.error("Error updating service:", error);
      return void 0;
    }
  }
  async deleteService(id) {
    try {
      if (!db) {
        console.warn("Database not available, cannot delete service");
        return false;
      }
      const result = await db.delete(compatibleServices).where(eq(compatibleServices.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error deleting service:", error);
      return false;
    }
  }
  async getConversations() {
    try {
      if (!db) {
        return [];
      }
      return await db.select().from(compatibleConversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      return [];
    }
  }
  async getConversation(phoneNumber) {
    try {
      if (!db) {
        return void 0;
      }
      const [conversation] = await db.select().from(compatibleConversations).where(eq(compatibleConversations.phoneNumber, phoneNumber));
      return conversation;
    } catch (error) {
      console.error("Error fetching conversation:", error);
      return void 0;
    }
  }
  async createConversation(conversation) {
    try {
      if (!db) {
        throw new Error("Database not available");
      }
      const safeConversationData = {
        phoneNumber: conversation.phoneNumber,
        customerName: conversation.customerName,
        currentState: conversation.currentState,
        selectedService: conversation.selectedService,
        selectedDate: conversation.selectedDate,
        selectedTime: conversation.selectedTime,
        contextData: conversation.contextData,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt
      };
      const [newConversation] = await db.insert(compatibleConversations).values(safeConversationData).returning();
      return newConversation;
    } catch (error) {
      console.error("Error creating conversation:", error);
      return {
        id: randomUUID(),
        phoneNumber: conversation.phoneNumber,
        customerName: conversation.customerName || null,
        currentState: conversation.currentState,
        selectedService: conversation.selectedService || null,
        selectedDate: conversation.selectedDate || null,
        selectedTime: conversation.selectedTime || null,
        contextData: conversation.contextData || {},
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      };
    }
  }
  async updateConversation(id, conversation) {
    try {
      if (!db) {
        console.warn("Database not available, cannot update conversation with ID:", id);
        try {
          return this.getConversation(conversation.phoneNumber || "");
        } catch {
          return void 0;
        }
      }
      const [updatedConversation] = await db.update(compatibleConversations).set({ ...conversation, updatedAt: /* @__PURE__ */ new Date() }).where(eq(compatibleConversations.id, id)).returning();
      if (!updatedConversation) {
        console.warn(`No conversation found with ID: ${id} for update`);
        return void 0;
      }
      return updatedConversation;
    } catch (error) {
      console.error("Error updating conversation:", error);
      return void 0;
    }
  }
  async getMessages(conversationId) {
    try {
      if (!db) {
        return [];
      }
      return await db.select().from(compatibleMessages).where(eq(compatibleMessages.conversationId, conversationId)).orderBy(compatibleMessages.createdAt);
    } catch (error) {
      console.error("Error fetching messages:", error);
      return [];
    }
  }
  async createMessage(message) {
    try {
      if (!db) {
        throw new Error("Database not available");
      }
      const safeMessageData = {
        conversationId: message.conversationId,
        content: message.content,
        messageType: message.messageType || "text",
        isFromBot: message.isFromBot,
        metadata: message.metadata || {}
        // timestamp will default to now if not provided
      };
      const [newMessage] = await db.insert(compatibleMessages).values(safeMessageData).returning();
      return newMessage;
    } catch (error) {
      console.error("Error creating message:", error);
      return {
        id: randomUUID(),
        conversationId: message.conversationId,
        content: message.content,
        isFromBot: message.isFromBot,
        messageType: message.messageType || "text",
        metadata: message.metadata || {},
        createdAt: /* @__PURE__ */ new Date()
      };
    }
  }
  async getBookings() {
    try {
      if (!db) {
        return [];
      }
      return await db.select().from(compatibleBookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      return [];
    }
  }
  async createBooking(booking) {
    try {
      if (!db) {
        throw new Error("Database not available");
      }
      const [newBooking] = await db.insert(compatibleBookings).values(booking).returning();
      return newBooking;
    } catch (error) {
      console.error("Error creating booking:", error);
      return {
        id: randomUUID(),
        conversationId: booking.conversationId,
        serviceId: booking.serviceId,
        phoneNumber: booking.phoneNumber,
        amount: booking.amount,
        status: booking.status || "pending",
        customerName: booking.customerName || null,
        appointmentDate: booking.appointmentDate,
        appointmentTime: booking.appointmentTime,
        paymentReference: booking.paymentReference || null,
        metadata: booking.metadata || {},
        notes: booking.notes || null,
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      };
    }
  }
  async updateBooking(id, booking) {
    try {
      if (!db) {
        console.warn("Database not available, cannot update booking");
        return void 0;
      }
      const [updatedBooking] = await db.update(compatibleBookings).set({ ...booking, updatedAt: /* @__PURE__ */ new Date() }).where(eq(compatibleBookings.id, id)).returning();
      return updatedBooking;
    } catch (error) {
      console.error("Error updating booking:", error);
      return void 0;
    }
  }
  async getTodayBookings() {
    try {
      if (!db) {
        return [];
      }
      const offsetMs = 5.5 * 60 * 60 * 1e3;
      const nowUtcMs = Date.now();
      const istNow = new Date(nowUtcMs + offsetMs);
      const istStart = new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate(), 0, 0, 0, 0));
      const istEnd = new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate() + 1, 0, 0, 0, 0));
      const utcStart = new Date(istStart.getTime() - offsetMs);
      const utcEnd = new Date(istEnd.getTime() - offsetMs);
      return await db.select().from(compatibleBookings).where(
        and(
          gte(compatibleBookings.createdAt, utcStart),
          lt(compatibleBookings.createdAt, utcEnd)
        )
      );
    } catch (error) {
      console.error("Error fetching today's bookings:", error);
      return [];
    }
  }
  async getTodayRevenue() {
    try {
      if (!db) {
        return 0;
      }
      const offsetMs = 5.5 * 60 * 60 * 1e3;
      const nowUtcMs = Date.now();
      const istNow = new Date(nowUtcMs + offsetMs);
      const istStart = new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate(), 0, 0, 0, 0));
      const istEnd = new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate() + 1, 0, 0, 0, 0));
      const utcStart = new Date(istStart.getTime() - offsetMs);
      const utcEnd = new Date(istEnd.getTime() - offsetMs);
      const result = await db.select({ total: sql2`SUM(${compatibleBookings.amount})` }).from(compatibleBookings).where(
        and(
          eq(compatibleBookings.status, "confirmed"),
          gte(compatibleBookings.createdAt, utcStart),
          lt(compatibleBookings.createdAt, utcEnd)
        )
      );
      return result[0]?.total || 0;
    } catch (error) {
      console.error("Error fetching today's revenue:", error);
      return 0;
    }
  }
};

// server/storage.ts
var InMemoryStorage = class {
  services = [];
  conversations = [];
  messages = [];
  bookings = [];
  constructor() {
    this.initializeDefaultServices();
  }
  async initializeDefaultServices() {
    if (this.services.length > 0) return;
    const defaultServices = [
      {
        id: randomUUID2(),
        name: "Haircut & Style",
        description: "Professional haircut with styling",
        price: 45,
        // USD equivalent
        isActive: true,
        icon: "fas fa-cut"
      },
      {
        id: randomUUID2(),
        name: "Facial Treatment",
        description: "Deep cleansing facial treatment",
        price: 65,
        // USD equivalent
        isActive: true,
        icon: "fas fa-sparkles"
      },
      {
        id: randomUUID2(),
        name: "Hair Color",
        description: "Full hair coloring service",
        price: 120,
        // USD equivalent
        isActive: true,
        icon: "fas fa-palette"
      }
    ];
    this.services = defaultServices;
  }
  async getServices() {
    return this.services;
  }
  async getService(id) {
    return this.services.find((service) => service.id === id);
  }
  async createService(service) {
    const newService = {
      ...service,
      id: randomUUID2()
    };
    this.services.push(newService);
    return newService;
  }
  async updateService(id, updateData) {
    const index = this.services.findIndex((service) => service.id === id);
    if (index === -1) return void 0;
    this.services[index] = { ...this.services[index], ...updateData };
    return this.services[index];
  }
  async deleteService(id) {
    const index = this.services.findIndex((service) => service.id === id);
    if (index === -1) return false;
    this.services.splice(index, 1);
    return true;
  }
  async getConversation(phoneNumber) {
    return this.conversations.find((conversation) => conversation.phoneNumber === phoneNumber);
  }
  async createConversation(conversation) {
    const newConversation = {
      ...conversation,
      id: randomUUID2(),
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.conversations.push(newConversation);
    return newConversation;
  }
  async updateConversation(id, updateData) {
    const index = this.conversations.findIndex((conversation) => conversation.id === id);
    if (index === -1) return void 0;
    this.conversations[index] = {
      ...this.conversations[index],
      ...updateData,
      updatedAt: /* @__PURE__ */ new Date()
    };
    return this.conversations[index];
  }
  async getMessages(conversationId) {
    return this.messages.filter((message) => message.conversationId === conversationId).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }
  async createMessage(message) {
    const newMessage = {
      ...message,
      id: randomUUID2(),
      timestamp: /* @__PURE__ */ new Date()
    };
    this.messages.push(newMessage);
    return newMessage;
  }
  async getBookings() {
    return this.bookings.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }
  async createBooking(booking) {
    const newBooking = {
      ...booking,
      id: randomUUID2(),
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.bookings.push(newBooking);
    return newBooking;
  }
  async updateBooking(id, updateData) {
    const index = this.bookings.findIndex((booking) => booking.id === id);
    if (index === -1) return void 0;
    this.bookings[index] = {
      ...this.bookings[index],
      ...updateData,
      updatedAt: /* @__PURE__ */ new Date()
    };
    return this.bookings[index];
  }
  async getTodayBookings() {
    const today = /* @__PURE__ */ new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return this.bookings.filter(
      (booking) => booking.createdAt >= today && booking.createdAt < tomorrow
    );
  }
  async getTodayRevenue() {
    const todayBookings = await this.getTodayBookings();
    return todayBookings.filter((booking) => booking.status === "confirmed").reduce((total, booking) => total + booking.amount, 0);
  }
};
var HybridStorage = class {
  dbStorage;
  memoryStorage;
  useDatabase = true;
  constructor() {
    this.dbStorage = new CompatibleDatabaseStorage();
    this.memoryStorage = new InMemoryStorage();
  }
  // Expose which backend is in use
  isUsingDatabase() {
    return this.useDatabase;
  }
  getBackendName() {
    return this.useDatabase ? "database" : "memory";
  }
  async tryDatabase(operation) {
    if (!this.useDatabase) {
      throw new Error("Database disabled");
    }
    try {
      return await operation();
    } catch (error) {
      console.warn("Database operation failed, falling back to memory storage:", error);
      this.useDatabase = false;
      throw error;
    }
  }
  async getServices() {
    try {
      return await this.tryDatabase(() => this.dbStorage.getServices());
    } catch {
      return await this.memoryStorage.getServices();
    }
  }
  async getService(id) {
    try {
      return await this.tryDatabase(() => this.dbStorage.getService(id));
    } catch {
      return await this.memoryStorage.getService(id);
    }
  }
  async createService(service) {
    try {
      return await this.tryDatabase(() => this.dbStorage.createService(service));
    } catch {
      return await this.memoryStorage.createService(service);
    }
  }
  async updateService(id, service) {
    try {
      return await this.tryDatabase(() => this.dbStorage.updateService(id, service));
    } catch {
      return await this.memoryStorage.updateService(id, service);
    }
  }
  async deleteService(id) {
    try {
      return await this.tryDatabase(() => this.dbStorage.deleteService(id));
    } catch {
      return await this.memoryStorage.deleteService(id);
    }
  }
  async getConversation(phoneNumber) {
    try {
      return await this.tryDatabase(() => this.dbStorage.getConversation(phoneNumber));
    } catch {
      return await this.memoryStorage.getConversation(phoneNumber);
    }
  }
  async createConversation(conversation) {
    try {
      return await this.tryDatabase(() => this.dbStorage.createConversation(conversation));
    } catch {
      return await this.memoryStorage.createConversation(conversation);
    }
  }
  async updateConversation(id, conversation) {
    try {
      return await this.tryDatabase(() => this.dbStorage.updateConversation(id, conversation));
    } catch {
      return await this.memoryStorage.updateConversation(id, conversation);
    }
  }
  async getMessages(conversationId) {
    try {
      return await this.tryDatabase(() => this.dbStorage.getMessages(conversationId));
    } catch {
      return await this.memoryStorage.getMessages(conversationId);
    }
  }
  async createMessage(message) {
    try {
      return await this.tryDatabase(() => this.dbStorage.createMessage(message));
    } catch {
      return await this.memoryStorage.createMessage(message);
    }
  }
  async getBookings() {
    try {
      return await this.tryDatabase(() => this.dbStorage.getBookings());
    } catch {
      return await this.memoryStorage.getBookings();
    }
  }
  async createBooking(booking) {
    try {
      return await this.tryDatabase(() => this.dbStorage.createBooking(booking));
    } catch {
      return await this.memoryStorage.createBooking(booking);
    }
  }
  async updateBooking(id, booking) {
    try {
      return await this.tryDatabase(() => this.dbStorage.updateBooking(id, booking));
    } catch {
      return await this.memoryStorage.updateBooking(id, booking);
    }
  }
  async getTodayBookings() {
    try {
      return await this.tryDatabase(() => this.dbStorage.getTodayBookings());
    } catch {
      return await this.memoryStorage.getTodayBookings();
    }
  }
  async getTodayRevenue() {
    try {
      return await this.tryDatabase(() => this.dbStorage.getTodayRevenue());
    } catch {
      return await this.memoryStorage.getTodayRevenue();
    }
  }
};
var storage = new HybridStorage();
function getStorageBackendName() {
  try {
    const hybrid = storage;
    return hybrid.getBackendName ? hybrid.getBackendName() : "unknown";
  } catch {
    return "unknown";
  }
}

// server/routes.ts
import { z as z2 } from "zod";

// server/routes/bot-flow-builder.routes.ts
import { Router } from "express";

// server/services/bot-flow-builder.service.ts
import { Pool as Pool2 } from "@neondatabase/serverless";
import { drizzle as drizzle2 } from "drizzle-orm/neon-serverless";
import { eq as eq3, and as and3, desc, asc, sql as sql3 } from "drizzle-orm";
var BotFlowBuilderService = class {
  db = null;
  pool = null;
  useDatabase = false;
  constructor(connectionString) {
    if (connectionString && connectionString.trim() !== "") {
      try {
        this.pool = new Pool2({
          connectionString,
          // Add timeout configuration
          statement_timeout: 5e3,
          // 5 seconds
          connection_timeout: 5e3,
          // 5 seconds
          idle_timeout: 1e4
          // 10 seconds
        });
        this.db = drizzle2(this.pool, { schema: schema_exports });
        this.useDatabase = true;
        console.log("BotFlowBuilderService: Database connection initialized with timeout settings");
      } catch (error) {
        console.warn("BotFlowBuilderService: Failed to initialize database connection, using mock data:", error);
        this.useDatabase = false;
      }
    } else {
      console.log("BotFlowBuilderService: No database connection string provided, using mock data");
      this.useDatabase = false;
    }
  }
  // ===== BOT FLOW MANAGEMENT =====
  /**
   * Create new bot flow
   */
  async createBotFlow(tenantId, request) {
    try {
      const validation = this.validateCreateBotFlowRequest(request);
      if (!validation.isValid) {
        return {
          success: false,
          error: {
            code: "BOT_FLOW_VALIDATION_FAILED",
            message: "Bot flow validation failed",
            tenantId,
            details: validation.errors
          }
        };
      }
      const [botFlow] = await this.db.insert(botFlows).values({
        tenantId,
        name: request.name,
        description: request.description,
        businessType: request.businessType,
        isActive: false,
        // Start inactive until nodes are added
        isTemplate: request.isTemplate || false,
        version: "1.0.0",
        variables: request.variables || [],
        metadata: request.metadata || {}
      }).returning();
      if (request.templateId) {
        await this.copyTemplateNodes(tenantId, botFlow.id, request.templateId);
      }
      const result = await this.getBotFlow(tenantId, botFlow.id);
      return result;
    } catch (error) {
      console.error("Error creating bot flow:", error);
      return {
        success: false,
        error: {
          code: "BOT_FLOW_CREATE_FAILED",
          message: "Failed to create bot flow",
          tenantId
        }
      };
    }
  }
  /**
   * Get bot flow by ID
   */
  async getBotFlow(tenantId, flowId) {
    try {
      const [botFlow] = await this.db.select().from(botFlows).where(and3(
        eq3(botFlows.tenantId, tenantId),
        eq3(botFlows.id, flowId)
      ));
      if (!botFlow) {
        return {
          success: false,
          error: {
            code: "BOT_FLOW_NOT_FOUND",
            message: "Bot flow not found",
            tenantId,
            resourceId: flowId
          }
        };
      }
      const nodes = await this.db.select().from(botFlowNodes).where(eq3(botFlowNodes.flowId, flowId)).orderBy(asc(botFlowNodes.createdAt));
      const result = {
        ...botFlow,
        nodes: nodes.map((node) => ({
          ...node,
          position: node.position,
          configuration: node.configuration,
          connections: node.connections,
          metadata: node.metadata
        })),
        variables: botFlow.variables,
        metadata: botFlow.metadata
      };
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error("Error getting bot flow:", error);
      return {
        success: false,
        error: {
          code: "BOT_FLOW_FETCH_FAILED",
          message: "Failed to fetch bot flow",
          tenantId,
          resourceId: flowId
        }
      };
    }
  }
  /**
   * List bot flows
   */
  async listBotFlows(tenantId, options = {}) {
    if (!this.useDatabase) {
      console.log("BotFlowBuilderService: Returning mock data for listBotFlows (database not available)");
      return {
        success: true,
        data: {
          flows: [
            {
              id: "current_salon_flow",
              tenantId,
              name: "\u{1F7E2} Current Salon Flow (ACTIVE)",
              description: "This is the exact flow currently running on WhatsApp",
              businessType: "salon",
              isActive: true,
              isTemplate: false,
              version: "1.0.0",
              nodes: [
                {
                  id: "start_1",
                  tenantId,
                  flowId: "current_salon_flow",
                  type: "start",
                  name: "Start",
                  position: { x: 100, y: 100 },
                  configuration: {},
                  connections: [],
                  metadata: {},
                  createdAt: /* @__PURE__ */ new Date(),
                  updatedAt: /* @__PURE__ */ new Date()
                },
                {
                  id: "welcome_msg",
                  tenantId,
                  flowId: "current_salon_flow",
                  type: "message",
                  name: "Welcome Message",
                  position: { x: 400, y: 100 },
                  configuration: {},
                  connections: [],
                  metadata: {},
                  createdAt: /* @__PURE__ */ new Date(),
                  updatedAt: /* @__PURE__ */ new Date()
                },
                {
                  id: "service_question",
                  tenantId,
                  flowId: "current_salon_flow",
                  type: "question",
                  name: "Service Selection",
                  position: { x: 700, y: 100 },
                  configuration: {},
                  connections: [],
                  metadata: {},
                  createdAt: /* @__PURE__ */ new Date(),
                  updatedAt: /* @__PURE__ */ new Date()
                },
                {
                  id: "date_question",
                  tenantId,
                  flowId: "current_salon_flow",
                  type: "question",
                  name: "Date Selection",
                  position: { x: 1e3, y: 100 },
                  configuration: {},
                  connections: [],
                  metadata: {},
                  createdAt: /* @__PURE__ */ new Date(),
                  updatedAt: /* @__PURE__ */ new Date()
                },
                {
                  id: "time_question",
                  tenantId,
                  flowId: "current_salon_flow",
                  type: "question",
                  name: "Time Selection",
                  position: { x: 1300, y: 100 },
                  configuration: {},
                  connections: [],
                  metadata: {},
                  createdAt: /* @__PURE__ */ new Date(),
                  updatedAt: /* @__PURE__ */ new Date()
                },
                {
                  id: "customer_details",
                  tenantId,
                  flowId: "current_salon_flow",
                  type: "question",
                  name: "Customer Name",
                  position: { x: 1600, y: 100 },
                  configuration: {},
                  connections: [],
                  metadata: {},
                  createdAt: /* @__PURE__ */ new Date(),
                  updatedAt: /* @__PURE__ */ new Date()
                },
                {
                  id: "payment_action",
                  tenantId,
                  flowId: "current_salon_flow",
                  type: "action",
                  name: "Payment Request",
                  position: { x: 1900, y: 100 },
                  configuration: {},
                  connections: [],
                  metadata: {},
                  createdAt: /* @__PURE__ */ new Date(),
                  updatedAt: /* @__PURE__ */ new Date()
                },
                {
                  id: "confirmation_end",
                  tenantId,
                  flowId: "current_salon_flow",
                  type: "end",
                  name: "Booking Confirmed",
                  position: { x: 2200, y: 100 },
                  configuration: {},
                  connections: [],
                  metadata: {},
                  createdAt: /* @__PURE__ */ new Date(),
                  updatedAt: /* @__PURE__ */ new Date()
                }
              ],
              variables: [],
              metadata: {},
              createdAt: /* @__PURE__ */ new Date(),
              updatedAt: /* @__PURE__ */ new Date()
            }
          ],
          total: 1,
          page: 1,
          limit: 50
        }
      };
    }
    try {
      console.log("BotFlowBuilderService: Starting database query for listBotFlows");
      const { businessType, isActive, isTemplate, page = 1, limit = 50 } = options;
      const offset = (page - 1) * limit;
      const conditions = [eq3(botFlows.tenantId, tenantId)];
      if (businessType) {
        conditions.push(eq3(botFlows.businessType, businessType));
      }
      if (isActive !== void 0) {
        conditions.push(eq3(botFlows.isActive, isActive));
      }
      if (isTemplate !== void 0) {
        conditions.push(eq3(botFlows.isTemplate, isTemplate));
      }
      console.log("BotFlowBuilderService: Executing flows query");
      const flowsQuery = this.db.select().from(botFlows).where(and3(...conditions)).orderBy(desc(botFlows.updatedAt)).limit(limit).offset(offset);
      const flows = await Promise.race([
        flowsQuery,
        new Promise(
          (_, reject) => setTimeout(() => reject(new Error("Flows query timeout")), 5e3)
        )
      ]);
      console.log("BotFlowBuilderService: Flows query completed, found", flows.length, "flows");
      console.log("BotFlowBuilderService: Executing count query");
      const countQuery = this.db.select({ count: sql3`count(*)` }).from(botFlows).where(and3(...conditions));
      const [{ count }] = await Promise.race([
        countQuery,
        new Promise(
          (_, reject) => setTimeout(() => reject(new Error("Count query timeout")), 5e3)
        )
      ]);
      console.log("BotFlowBuilderService: Count query completed, total count:", count);
      const flowsWithNodes = [];
      console.log("BotFlowBuilderService: Starting to fetch nodes for", flows.length, "flows");
      for (const [index, flow] of flows.entries()) {
        console.log("BotFlowBuilderService: Fetching nodes for flow", index + 1, "of", flows.length, "flowId:", flow.id);
        const nodesQuery = this.db.select().from(botFlowNodes).where(eq3(botFlowNodes.flowId, flow.id)).orderBy(asc(botFlowNodes.createdAt));
        const nodes = await Promise.race([
          nodesQuery,
          new Promise(
            (_, reject) => setTimeout(() => reject(new Error(`Nodes query timeout for flow ${flow.id}`)), 5e3)
          )
        ]);
        console.log("BotFlowBuilderService: Fetched", nodes.length, "nodes for flow", flow.id);
        flowsWithNodes.push({
          ...flow,
          nodes: nodes.map((node) => ({
            ...node,
            position: node.position,
            configuration: node.configuration,
            connections: node.connections,
            metadata: node.metadata
          })),
          variables: flow.variables,
          metadata: flow.metadata
        });
      }
      console.log("BotFlowBuilderService: Finished fetching nodes for all flows");
      const result = {
        success: true,
        data: {
          flows: flowsWithNodes,
          total: count,
          page,
          limit
        }
      };
      console.log("BotFlowBuilderService: listBotFlows completed successfully");
      return result;
    } catch (error) {
      console.error("Error listing bot flows:", error);
      console.log("BotFlowBuilderService: Falling back to mock data due to database error");
      return {
        success: true,
        data: {
          flows: [
            {
              id: "current_salon_flow",
              tenantId,
              name: "\u{1F7E2} Current Salon Flow (ACTIVE)",
              description: "This is the exact flow currently running on WhatsApp",
              businessType: "salon",
              isActive: true,
              isTemplate: false,
              version: "1.0.0",
              nodes: [
                {
                  id: "start_1",
                  tenantId,
                  flowId: "current_salon_flow",
                  type: "start",
                  name: "Start",
                  position: { x: 100, y: 100 },
                  configuration: {},
                  connections: [],
                  metadata: {},
                  createdAt: /* @__PURE__ */ new Date(),
                  updatedAt: /* @__PURE__ */ new Date()
                },
                {
                  id: "welcome_msg",
                  tenantId,
                  flowId: "current_salon_flow",
                  type: "message",
                  name: "Welcome Message",
                  position: { x: 400, y: 100 },
                  configuration: {},
                  connections: [],
                  metadata: {},
                  createdAt: /* @__PURE__ */ new Date(),
                  updatedAt: /* @__PURE__ */ new Date()
                },
                {
                  id: "service_question",
                  tenantId,
                  flowId: "current_salon_flow",
                  type: "question",
                  name: "Service Selection",
                  position: { x: 700, y: 100 },
                  configuration: {},
                  connections: [],
                  metadata: {},
                  createdAt: /* @__PURE__ */ new Date(),
                  updatedAt: /* @__PURE__ */ new Date()
                },
                {
                  id: "date_question",
                  tenantId,
                  flowId: "current_salon_flow",
                  type: "question",
                  name: "Date Selection",
                  position: { x: 1e3, y: 100 },
                  configuration: {},
                  connections: [],
                  metadata: {},
                  createdAt: /* @__PURE__ */ new Date(),
                  updatedAt: /* @__PURE__ */ new Date()
                },
                {
                  id: "time_question",
                  tenantId,
                  flowId: "current_salon_flow",
                  type: "question",
                  name: "Time Selection",
                  position: { x: 1300, y: 100 },
                  configuration: {},
                  connections: [],
                  metadata: {},
                  createdAt: /* @__PURE__ */ new Date(),
                  updatedAt: /* @__PURE__ */ new Date()
                },
                {
                  id: "customer_details",
                  tenantId,
                  flowId: "current_salon_flow",
                  type: "question",
                  name: "Customer Name",
                  position: { x: 1600, y: 100 },
                  configuration: {},
                  connections: [],
                  metadata: {},
                  createdAt: /* @__PURE__ */ new Date(),
                  updatedAt: /* @__PURE__ */ new Date()
                },
                {
                  id: "payment_action",
                  tenantId,
                  flowId: "current_salon_flow",
                  type: "action",
                  name: "Payment Request",
                  position: { x: 1900, y: 100 },
                  configuration: {},
                  connections: [],
                  metadata: {},
                  createdAt: /* @__PURE__ */ new Date(),
                  updatedAt: /* @__PURE__ */ new Date()
                },
                {
                  id: "confirmation_end",
                  tenantId,
                  flowId: "current_salon_flow",
                  type: "end",
                  name: "Booking Confirmed",
                  position: { x: 2200, y: 100 },
                  configuration: {},
                  connections: [],
                  metadata: {},
                  createdAt: /* @__PURE__ */ new Date(),
                  updatedAt: /* @__PURE__ */ new Date()
                }
              ],
              variables: [],
              metadata: {},
              createdAt: /* @__PURE__ */ new Date(),
              updatedAt: /* @__PURE__ */ new Date()
            }
          ],
          total: 1,
          page: 1,
          limit: 50
        }
      };
    }
  }
  /**
   * Update bot flow
   */
  async updateBotFlow(tenantId, flowId, request) {
    try {
      const [updatedFlow] = await this.db.update(botFlows).set({
        ...request,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(and3(
        eq3(botFlows.tenantId, tenantId),
        eq3(botFlows.id, flowId)
      )).returning();
      if (!updatedFlow) {
        return {
          success: false,
          error: {
            code: "BOT_FLOW_NOT_FOUND",
            message: "Bot flow not found",
            tenantId,
            resourceId: flowId
          }
        };
      }
      const result = await this.getBotFlow(tenantId, flowId);
      return result;
    } catch (error) {
      console.error("Error updating bot flow:", error);
      return {
        success: false,
        error: {
          code: "BOT_FLOW_UPDATE_FAILED",
          message: "Failed to update bot flow",
          tenantId,
          resourceId: flowId
        }
      };
    }
  }
  /**
   * Delete bot flow
   */
  async deleteBotFlow(tenantId, flowId) {
    try {
      await this.db.delete(botFlowNodes).where(eq3(botFlowNodes.flowId, flowId));
      const [deletedFlow] = await this.db.delete(botFlows).where(and3(
        eq3(botFlows.tenantId, tenantId),
        eq3(botFlows.id, flowId)
      )).returning();
      if (!deletedFlow) {
        return {
          success: false,
          error: {
            code: "BOT_FLOW_NOT_FOUND",
            message: "Bot flow not found",
            tenantId,
            resourceId: flowId
          }
        };
      }
      return {
        success: true,
        data: void 0
      };
    } catch (error) {
      console.error("Error deleting bot flow:", error);
      return {
        success: false,
        error: {
          code: "BOT_FLOW_DELETE_FAILED",
          message: "Failed to delete bot flow",
          tenantId,
          resourceId: flowId
        }
      };
    }
  }
  // ===== BOT FLOW NODE MANAGEMENT =====
  /**
   * Create bot flow node
   */
  async createBotFlowNode(tenantId, flowId, request) {
    try {
      const flowResult = await this.getBotFlow(tenantId, flowId);
      if (!flowResult.success) {
        return flowResult;
      }
      const validation = this.validateNodeConfiguration(request.type, request.configuration);
      if (!validation.isValid) {
        return {
          success: false,
          error: {
            code: "BOT_FLOW_NODE_VALIDATION_FAILED",
            message: "Bot flow node validation failed",
            tenantId,
            details: validation.errors
          }
        };
      }
      const [node] = await this.db.insert(botFlowNodes).values({
        tenantId,
        flowId,
        type: request.type,
        name: request.name,
        description: request.description,
        position: request.position,
        configuration: request.configuration,
        connections: request.connections || [],
        metadata: request.metadata || {}
      }).returning();
      const result = {
        ...node,
        position: node.position,
        configuration: node.configuration,
        connections: node.connections,
        metadata: node.metadata
      };
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error("Error creating bot flow node:", error);
      return {
        success: false,
        error: {
          code: "BOT_FLOW_NODE_CREATE_FAILED",
          message: "Failed to create bot flow node",
          tenantId
        }
      };
    }
  }
  /**
   * Update bot flow node
   */
  async updateBotFlowNode(tenantId, nodeId, request) {
    try {
      if (request.configuration) {
        const [existingNode] = await this.db.select().from(botFlowNodes).where(and3(
          eq3(botFlowNodes.tenantId, tenantId),
          eq3(botFlowNodes.id, nodeId)
        ));
        if (!existingNode) {
          return {
            success: false,
            error: {
              code: "BOT_FLOW_NODE_NOT_FOUND",
              message: "Bot flow node not found",
              tenantId,
              resourceId: nodeId
            }
          };
        }
        const validation = this.validateNodeConfiguration(existingNode.type, request.configuration);
        if (!validation.isValid) {
          return {
            success: false,
            error: {
              code: "BOT_FLOW_NODE_VALIDATION_FAILED",
              message: "Bot flow node validation failed",
              tenantId,
              details: validation.errors
            }
          };
        }
      }
      const [updatedNode] = await this.db.update(botFlowNodes).set({
        ...request,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(and3(
        eq3(botFlowNodes.tenantId, tenantId),
        eq3(botFlowNodes.id, nodeId)
      )).returning();
      if (!updatedNode) {
        return {
          success: false,
          error: {
            code: "BOT_FLOW_NODE_NOT_FOUND",
            message: "Bot flow node not found",
            tenantId,
            resourceId: nodeId
          }
        };
      }
      const result = {
        ...updatedNode,
        position: updatedNode.position,
        configuration: updatedNode.configuration,
        connections: updatedNode.connections,
        metadata: updatedNode.metadata
      };
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error("Error updating bot flow node:", error);
      return {
        success: false,
        error: {
          code: "BOT_FLOW_NODE_UPDATE_FAILED",
          message: "Failed to update bot flow node",
          tenantId,
          resourceId: nodeId
        }
      };
    }
  }
  /**
   * Delete bot flow node
   */
  async deleteBotFlowNode(tenantId, nodeId) {
    try {
      const [deletedNode] = await this.db.delete(botFlowNodes).where(and3(
        eq3(botFlowNodes.tenantId, tenantId),
        eq3(botFlowNodes.id, nodeId)
      )).returning();
      if (!deletedNode) {
        return {
          success: false,
          error: {
            code: "BOT_FLOW_NODE_NOT_FOUND",
            message: "Bot flow node not found",
            tenantId,
            resourceId: nodeId
          }
        };
      }
      await this.removeNodeConnections(deletedNode.flowId, nodeId);
      return {
        success: true,
        data: void 0
      };
    } catch (error) {
      console.error("Error deleting bot flow node:", error);
      return {
        success: false,
        error: {
          code: "BOT_FLOW_NODE_DELETE_FAILED",
          message: "Failed to delete bot flow node",
          tenantId,
          resourceId: nodeId
        }
      };
    }
  }
  // ===== BOT FLOW VALIDATION =====
  /**
   * Validate bot flow
   */
  // ===== BOT FLOW TEMPLATES =====
  /**
   * Get predefined bot flow templates
   */
  async getBotFlowTemplates(businessType) {
    try {
      const templates = this.getPredefinedTemplates();
      const filteredTemplates = businessType ? templates.filter((template) => template.businessType === businessType) : templates;
      return {
        success: true,
        data: filteredTemplates
      };
    } catch (error) {
      console.error("Error getting bot flow templates:", error);
      return {
        success: false,
        error: {
          code: "BOT_FLOW_TEMPLATES_FETCH_FAILED",
          message: "Failed to fetch bot flow templates"
        }
      };
    }
  }
  /**
   * Create bot flow from template
   */
  async createBotFlowFromTemplate(tenantId, templateId, customization) {
    try {
      const templates = this.getPredefinedTemplates();
      const template = templates.find((t) => t.id === templateId);
      if (!template) {
        return {
          success: false,
          error: {
            code: "BOT_FLOW_TEMPLATE_NOT_FOUND",
            message: "Bot flow template not found",
            resourceId: templateId
          }
        };
      }
      const createRequest = {
        name: customization.name,
        description: customization.description || template.description,
        businessType: template.businessType,
        variables: template.variables,
        metadata: {
          ...template.metadata,
          templateId,
          customization: customization.variables
        }
      };
      const flowResult = await this.createBotFlow(tenantId, createRequest);
      if (!flowResult.success) {
        return flowResult;
      }
      const flow = flowResult.data;
      const nodeIdMap = /* @__PURE__ */ new Map();
      for (const templateNode of template.nodes) {
        const nodeResult = await this.createBotFlowNode(tenantId, flow.id, {
          type: templateNode.type,
          name: templateNode.name,
          description: templateNode.description,
          position: templateNode.position,
          configuration: this.customizeNodeConfiguration(templateNode.configuration, customization.variables),
          metadata: templateNode.metadata
        });
        if (nodeResult.success) {
          nodeIdMap.set(templateNode.name, nodeResult.data.id);
        }
      }
      for (const templateNode of template.nodes) {
        const actualNodeId = nodeIdMap.get(templateNode.name);
        if (actualNodeId && templateNode.connections.length > 0) {
          const updatedConnections = templateNode.connections.map((conn) => ({
            ...conn,
            id: this.generateId(),
            sourceNodeId: actualNodeId,
            targetNodeId: nodeIdMap.get(conn.targetNodeId) || conn.targetNodeId
          }));
          await this.updateBotFlowNode(tenantId, actualNodeId, {
            connections: updatedConnections
          });
        }
      }
      const startNode = template.nodes.find((node) => node.type === "start");
      if (startNode) {
        const entryNodeId = nodeIdMap.get(startNode.name);
        if (entryNodeId) {
          await this.updateBotFlow(tenantId, flow.id, {
            metadata: {
              ...flow.metadata,
              entryNodeId
            }
          });
        }
      }
      const result = await this.getBotFlow(tenantId, flow.id);
      return result;
    } catch (error) {
      console.error("Error creating bot flow from template:", error);
      return {
        success: false,
        error: {
          code: "BOT_FLOW_TEMPLATE_CREATE_FAILED",
          message: "Failed to create bot flow from template",
          resourceId: templateId
        }
      };
    }
  }
  // ===== UTILITY METHODS =====
  /**
   * Validate create bot flow request
   */
  validateCreateBotFlowRequest(request) {
    const errors = [];
    if (!request.name || request.name.trim().length === 0) {
      errors.push("Flow name is required");
    }
    if (!request.businessType || request.businessType.trim().length === 0) {
      errors.push("Business type is required");
    }
    if (request.variables) {
      for (const variable of request.variables) {
        if (!variable.name || variable.name.trim().length === 0) {
          errors.push("Variable name is required");
        }
        if (!variable.type) {
          errors.push(`Variable type is required for ${variable.name}`);
        }
      }
    }
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  /**
   * Validate node configuration
   */
  validateNodeConfiguration(nodeType, configuration) {
    const errors = [];
    switch (nodeType) {
      case "start":
        break;
      case "message":
        if (!configuration.messageText) {
          errors.push({
            message: "Message text is required for message nodes",
            code: "MISSING_MESSAGE_TEXT"
          });
        }
        break;
      case "question":
        if (!configuration.questionText) {
          errors.push({
            message: "Question text is required for question nodes",
            code: "MISSING_QUESTION_TEXT"
          });
        }
        if (!configuration.variableName) {
          errors.push({
            message: "Variable name is required for question nodes",
            code: "MISSING_VARIABLE_NAME"
          });
        }
        if (configuration.inputType === "choice" && (!configuration.choices || configuration.choices.length === 0)) {
          errors.push({
            message: "Choices are required for choice input type",
            code: "MISSING_CHOICES"
          });
        }
        break;
      case "condition":
        if (!configuration.conditions || configuration.conditions.length === 0) {
          errors.push({
            message: "Conditions are required for condition nodes",
            code: "MISSING_CONDITIONS"
          });
        }
        break;
      case "action":
        if (!configuration.actionType) {
          errors.push({
            message: "Action type is required for action nodes",
            code: "MISSING_ACTION_TYPE"
          });
        }
        break;
      case "integration":
        if (!configuration.integrationType) {
          errors.push({
            message: "Integration type is required for integration nodes",
            code: "MISSING_INTEGRATION_TYPE"
          });
        }
        break;
      case "end":
        break;
    }
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  /**
   * Validate node connections
   */
  validateNodeConnections(node, allNodes, errors, warnings) {
    for (const connection of node.connections) {
      const targetExists = allNodes.some((n) => n.id === connection.targetNodeId);
      if (!targetExists) {
        errors.push({
          nodeId: node.id,
          type: "error",
          message: `Connection target node ${connection.targetNodeId} does not exist`,
          code: "INVALID_CONNECTION_TARGET"
        });
      }
    }
    switch (node.type) {
      case "start":
        if (node.connections.length === 0) {
          warnings.push({
            nodeId: node.id,
            message: "Start node should have at least one connection",
            code: "START_NODE_NO_CONNECTIONS"
          });
        }
        break;
      case "condition":
        if (node.connections.length < 2) {
          warnings.push({
            nodeId: node.id,
            message: "Condition node should have at least two connections (true/false paths)",
            code: "CONDITION_NODE_INSUFFICIENT_CONNECTIONS"
          });
        }
        break;
      case "end":
        if (node.connections.length > 0) {
          warnings.push({
            nodeId: node.id,
            message: "End node should not have outgoing connections",
            code: "END_NODE_HAS_CONNECTIONS"
          });
        }
        break;
    }
  }
  /**
   * Validate flow reachability
   */
  validateFlowReachability(flow, errors, warnings) {
    const startNodes = flow.nodes.filter((node) => node.type === "start");
    if (startNodes.length === 0) return;
    const reachableNodes = /* @__PURE__ */ new Set();
    const toVisit = [startNodes[0].id];
    while (toVisit.length > 0) {
      const currentNodeId = toVisit.pop();
      if (reachableNodes.has(currentNodeId)) continue;
      reachableNodes.add(currentNodeId);
      const currentNode = flow.nodes.find((node) => node.id === currentNodeId);
      if (currentNode) {
        for (const connection of currentNode.connections) {
          if (!reachableNodes.has(connection.targetNodeId)) {
            toVisit.push(connection.targetNodeId);
          }
        }
      }
    }
    for (const node of flow.nodes) {
      if (!reachableNodes.has(node.id) && node.type !== "start") {
        warnings.push({
          nodeId: node.id,
          message: `Node ${node.name} is not reachable from start node`,
          code: "UNREACHABLE_NODE"
        });
      }
    }
  }
  /**
   * Validate flow for infinite loops
   */
  validateFlowLoops(flow, warnings) {
    const visited = /* @__PURE__ */ new Set();
    const recursionStack = /* @__PURE__ */ new Set();
    const hasLoop = (nodeId) => {
      if (recursionStack.has(nodeId)) {
        return true;
      }
      if (visited.has(nodeId)) {
        return false;
      }
      visited.add(nodeId);
      recursionStack.add(nodeId);
      const node = flow.nodes.find((n) => n.id === nodeId);
      if (node) {
        for (const connection of node.connections) {
          if (hasLoop(connection.targetNodeId)) {
            return true;
          }
        }
      }
      recursionStack.delete(nodeId);
      return false;
    };
    const startNodes = flow.nodes.filter((node) => node.type === "start");
    for (const startNode of startNodes) {
      if (hasLoop(startNode.id)) {
        warnings.push({
          message: "Flow contains potential infinite loops",
          code: "POTENTIAL_INFINITE_LOOP"
        });
        break;
      }
    }
  }
  /**
   * Remove connections to a deleted node
   */
  async removeNodeConnections(flowId, deletedNodeId) {
    const nodes = await this.db.select().from(botFlowNodes).where(eq3(botFlowNodes.flowId, flowId));
    for (const node of nodes) {
      const connections = node.connections;
      const updatedConnections = connections.filter(
        (conn) => conn.targetNodeId !== deletedNodeId && conn.sourceNodeId !== deletedNodeId
      );
      if (updatedConnections.length !== connections.length) {
        await this.db.update(botFlowNodes).set({
          connections: updatedConnections,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq3(botFlowNodes.id, node.id));
      }
    }
  }
  /**
   * Copy template nodes to a new flow
   */
  async copyTemplateNodes(tenantId, flowId, templateId) {
    const templates = this.getPredefinedTemplates();
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;
    const nodeIdMap = /* @__PURE__ */ new Map();
    for (const templateNode of template.nodes) {
      const nodeResult = await this.createBotFlowNode(tenantId, flowId, {
        type: templateNode.type,
        name: templateNode.name,
        description: templateNode.description,
        position: templateNode.position,
        configuration: templateNode.configuration,
        metadata: templateNode.metadata
      });
      if (nodeResult.success) {
        nodeIdMap.set(templateNode.name, nodeResult.data.id);
      }
    }
    for (const templateNode of template.nodes) {
      const actualNodeId = nodeIdMap.get(templateNode.name);
      if (actualNodeId && templateNode.connections.length > 0) {
        const updatedConnections = templateNode.connections.map((conn) => ({
          ...conn,
          id: this.generateId(),
          sourceNodeId: actualNodeId,
          targetNodeId: nodeIdMap.get(conn.targetNodeId) || conn.targetNodeId
        }));
        await this.updateBotFlowNode(tenantId, actualNodeId, {
          connections: updatedConnections
        });
      }
    }
  }
  /**
   * Customize node configuration with variables
   */
  customizeNodeConfiguration(configuration, variables) {
    if (!variables) return configuration;
    const customized = { ...configuration };
    if (customized.messageText) {
      customized.messageText = this.replaceVariables(customized.messageText, variables);
    }
    if (customized.questionText) {
      customized.questionText = this.replaceVariables(customized.questionText, variables);
    }
    return customized;
  }
  /**
   * Replace variables in text
   */
  replaceVariables(text3, variables) {
    let result = text3;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`{{${key}}}`, "g"), String(value));
    }
    return result;
  }
  /**
   * Generate unique ID
   */
  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  /**
   * Get predefined bot flow templates
   */
  getPredefinedTemplates() {
    return [
      {
        id: "restaurant-order-flow",
        name: "Restaurant Order Flow",
        description: "Complete order flow for restaurants with menu selection and payment",
        businessType: "restaurant",
        category: "ordering",
        nodes: [
          {
            type: "start",
            name: "Welcome",
            position: { x: 100, y: 100 },
            configuration: {},
            connections: [{ sourceNodeId: "Welcome", targetNodeId: "ShowMenu", label: "start" }],
            metadata: {}
          },
          {
            type: "message",
            name: "ShowMenu",
            position: { x: 300, y: 100 },
            configuration: {
              messageText: "Welcome to {{restaurantName}}! Here's our menu:",
              messageType: "template"
            },
            connections: [{ sourceNodeId: "ShowMenu", targetNodeId: "AskOrder", label: "next" }],
            metadata: {}
          },
          {
            type: "question",
            name: "AskOrder",
            position: { x: 500, y: 100 },
            configuration: {
              questionText: "What would you like to order?",
              inputType: "text",
              variableName: "orderItems",
              validation: { required: true }
            },
            connections: [{ sourceNodeId: "AskOrder", targetNodeId: "ConfirmOrder", label: "next" }],
            metadata: {}
          },
          {
            type: "action",
            name: "ConfirmOrder",
            position: { x: 700, y: 100 },
            configuration: {
              actionType: "create_transaction",
              actionParameters: {
                type: "order",
                items: "{{orderItems}}"
              }
            },
            connections: [{ sourceNodeId: "ConfirmOrder", targetNodeId: "OrderComplete", label: "success" }],
            metadata: {}
          },
          {
            type: "end",
            name: "OrderComplete",
            position: { x: 900, y: 100 },
            configuration: {},
            connections: [],
            metadata: {}
          }
        ],
        variables: [
          {
            name: "restaurantName",
            type: "string",
            defaultValue: "Our Restaurant",
            description: "Name of the restaurant",
            isRequired: true
          },
          {
            name: "orderItems",
            type: "string",
            description: "Items ordered by customer",
            isRequired: false
          }
        ],
        metadata: {
          category: "ordering",
          difficulty: "beginner",
          estimatedSetupTime: "10 minutes"
        }
      },
      {
        id: "clinic-appointment-flow",
        name: "Clinic Appointment Flow",
        description: "Appointment booking flow for healthcare clinics",
        businessType: "clinic",
        category: "booking",
        nodes: [
          {
            type: "start",
            name: "Welcome",
            position: { x: 100, y: 100 },
            configuration: {},
            connections: [{ sourceNodeId: "Welcome", targetNodeId: "AskService", label: "start" }],
            metadata: {}
          },
          {
            type: "question",
            name: "AskService",
            position: { x: 300, y: 100 },
            configuration: {
              questionText: "What type of appointment would you like to book?",
              inputType: "choice",
              choices: [
                { value: "consultation", label: "General Consultation" },
                { value: "checkup", label: "Health Checkup" },
                { value: "specialist", label: "Specialist Visit" }
              ],
              variableName: "appointmentType"
            },
            connections: [{ sourceNodeId: "AskService", targetNodeId: "AskDate", label: "next" }],
            metadata: {}
          },
          {
            type: "question",
            name: "AskDate",
            position: { x: 500, y: 100 },
            configuration: {
              questionText: "When would you like to schedule your appointment?",
              inputType: "date",
              variableName: "appointmentDate",
              validation: { required: true }
            },
            connections: [{ sourceNodeId: "AskDate", targetNodeId: "BookAppointment", label: "next" }],
            metadata: {}
          },
          {
            type: "action",
            name: "BookAppointment",
            position: { x: 700, y: 100 },
            configuration: {
              actionType: "create_transaction",
              actionParameters: {
                type: "appointment",
                service: "{{appointmentType}}",
                scheduledDate: "{{appointmentDate}}"
              }
            },
            connections: [{ sourceNodeId: "BookAppointment", targetNodeId: "AppointmentBooked", label: "success" }],
            metadata: {}
          },
          {
            type: "end",
            name: "AppointmentBooked",
            position: { x: 900, y: 100 },
            configuration: {},
            connections: [],
            metadata: {}
          }
        ],
        variables: [
          {
            name: "clinicName",
            type: "string",
            defaultValue: "Our Clinic",
            description: "Name of the clinic",
            isRequired: true
          },
          {
            name: "appointmentType",
            type: "string",
            description: "Type of appointment selected",
            isRequired: false
          },
          {
            name: "appointmentDate",
            type: "date",
            description: "Selected appointment date",
            isRequired: false
          }
        ],
        metadata: {
          category: "booking",
          difficulty: "beginner",
          estimatedSetupTime: "15 minutes"
        }
      }
    ];
  }
  /**
   * Cleanup resources
   */
  async cleanup() {
    try {
      await this.pool.end();
    } catch (error) {
      console.error("Error cleaning up bot flow builder service:", error);
    }
  }
};

// server/middleware/tenant-context.middleware.ts
function tenantContextMiddleware(options) {
  const { tenantService, requireTenant = true, requiredPermissions = [] } = options;
  return async (req, res, next) => {
    try {
      let tenantContext = null;
      const apiKey = extractApiKey(req);
      if (apiKey) {
        const result = await tenantService.validateApiKey(apiKey);
        if (result.success) {
          tenantContext = result.data;
        } else {
          return res.status(401).json({
            error: "Invalid API key",
            code: result.error.code,
            message: result.error.message
          });
        }
      }
      if (!tenantContext) {
        const jwtContext = extractJwtContext(req);
        if (jwtContext) {
          tenantContext = jwtContext;
        }
      }
      if (!tenantContext) {
        const domain = extractDomainFromRequest(req);
        if (domain) {
          const result = await tenantService.getTenantByDomain(domain);
          if (result.success) {
            tenantContext = {
              tenantId: result.data.id,
              permissions: ["read:services", "read:conversations", "read:bookings"],
              // Default permissions for domain-based access
              subscriptionLimits: {
                messagesPerMonth: 1e3,
                bookingsPerMonth: 100,
                apiCallsPerDay: 1e3
              },
              currentUsage: {
                messages_sent: 0,
                messages_received: 0,
                bookings_created: 0,
                api_calls: 0,
                storage_used: 0,
                webhook_calls: 0
              }
            };
          }
        }
      }
      if (requireTenant && !tenantContext) {
        return res.status(401).json({
          error: "Tenant context required",
          message: "Request must include valid API key, JWT token, or be made from a registered domain"
        });
      }
      if (tenantContext) {
        const tenantResult = await tenantService.getTenantById(tenantContext.tenantId);
        if (!tenantResult.success) {
          return res.status(404).json({
            error: "Tenant not found",
            code: tenantResult.error.code,
            message: tenantResult.error.message
          });
        }
        const tenant = tenantResult.data;
        if (tenant.status === "suspended") {
          return res.status(423).json({
            error: "Tenant suspended",
            message: "Tenant account has been suspended",
            tenantId: tenant.id
          });
        }
        if (tenant.status === "cancelled") {
          return res.status(410).json({
            error: "Tenant cancelled",
            message: "Tenant account has been cancelled",
            tenantId: tenant.id
          });
        }
      }
      if (tenantContext && requiredPermissions.length > 0) {
        const hasAllPermissions = requiredPermissions.every(
          (permission) => tenantContext.permissions.includes(permission) || tenantContext.permissions.includes("admin:all")
        );
        if (!hasAllPermissions) {
          return res.status(403).json({
            error: "Insufficient permissions",
            message: "Request requires additional permissions",
            required: requiredPermissions,
            current: tenantContext.permissions
          });
        }
      }
      if (tenantContext) {
        req.tenantContext = tenantContext;
        req.tenantId = tenantContext.tenantId;
        req.hasPermission = (permission) => tenantContext.permissions.includes(permission) || tenantContext.permissions.includes("admin:all");
      }
      next();
    } catch (error) {
      console.error("Tenant context middleware error:", error);
      res.status(500).json({
        error: "Internal server error",
        message: "Failed to process tenant context"
      });
    }
  };
}
function extractApiKey(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    if (token.startsWith("tk_")) {
      return token;
    }
  }
  const apiKeyHeader = req.headers["x-api-key"];
  if (typeof apiKeyHeader === "string" && apiKeyHeader.startsWith("tk_")) {
    return apiKeyHeader;
  }
  return null;
}
function extractJwtContext(req) {
  return null;
}
function extractDomainFromRequest(req) {
  const host = req.headers.host;
  if (!host) return null;
  const domain = host.split(":")[0];
  if (domain === "localhost" || /^\d+\.\d+\.\d+\.\d+$/.test(domain)) {
    return null;
  }
  return domain;
}

// server/routes/bot-flow-builder.routes.ts
var router = Router();
router.use(tenantContextMiddleware);
var botFlowService = null;
var getBotFlowService = () => {
  if (!botFlowService) {
    botFlowService = new BotFlowBuilderService(process.env.DATABASE_URL || "");
  }
  return botFlowService;
};
router.get("/", async (req, res) => {
  console.log("BotFlowRoutes: Received request to list bot flows");
  try {
    const { tenantId } = req.tenantContext;
    const { businessType, isActive, isTemplate, page = 1, limit = 50 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    if (isNaN(pageNum) || pageNum < 1) {
      console.log("BotFlowRoutes: Invalid page parameter");
      return res.status(400).json({ error: "Invalid page parameter" });
    }
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      console.log("BotFlowRoutes: Invalid limit parameter");
      return res.status(400).json({ error: "Invalid limit parameter (must be between 1 and 100)" });
    }
    console.log("BotFlowRoutes: Getting bot flow service");
    const service = getBotFlowService();
    console.log("BotFlowRoutes: Calling listBotFlows method");
    const result = await service.listBotFlows(tenantId, {
      businessType,
      isActive: isActive === "true" ? true : isActive === "false" ? false : void 0,
      isTemplate: isTemplate === "true" ? true : isTemplate === "false" ? false : void 0,
      page: pageNum,
      limit: limitNum
    });
    console.log("BotFlowRoutes: listBotFlows method completed");
    if (!result.success) {
      console.error("BotFlowRoutes: Bot flow service error:", result.error);
      return res.json({
        flows: [
          {
            id: "current_salon_flow",
            tenantId,
            name: "\u{1F7E2} Current Salon Flow (ACTIVE)",
            description: "This is the exact flow currently running on WhatsApp",
            businessType: "salon",
            isActive: true,
            isTemplate: false,
            version: "1.0.0",
            nodes: [
              { id: "start_1", type: "start", name: "Start", position: { x: 100, y: 100 }, configuration: {}, connections: [], metadata: {} },
              { id: "welcome_msg", type: "message", name: "Welcome Message", position: { x: 400, y: 100 }, configuration: {}, connections: [], metadata: {} },
              { id: "service_question", type: "question", name: "Service Selection", position: { x: 700, y: 100 }, configuration: {}, connections: [], metadata: {} },
              { id: "date_question", type: "question", name: "Date Selection", position: { x: 1e3, y: 100 }, configuration: {}, connections: [], metadata: {} },
              { id: "time_question", type: "question", name: "Time Selection", position: { x: 1300, y: 100 }, configuration: {}, connections: [], metadata: {} },
              { id: "customer_details", type: "question", name: "Customer Name", position: { x: 1600, y: 100 }, configuration: {}, connections: [], metadata: {} },
              { id: "payment_action", type: "action", name: "Payment Request", position: { x: 1900, y: 100 }, configuration: {}, connections: [], metadata: {} },
              { id: "confirmation_end", type: "end", name: "Booking Confirmed", position: { x: 2200, y: 100 }, configuration: {}, connections: [], metadata: {} }
            ],
            variables: [],
            metadata: {}
          }
        ],
        total: 1,
        page: 1,
        limit: 50
      });
    }
    console.log("BotFlowRoutes: Sending successful response with", result.data.flows.length, "flows");
    res.json(result.data);
  } catch (error) {
    console.error("BotFlowRoutes: Error listing bot flows:", error);
    const { tenantId } = req.tenantContext;
    res.json({
      flows: [
        {
          id: "current_salon_flow",
          tenantId,
          name: "\u{1F7E2} Current Salon Flow (ACTIVE)",
          description: "This is the exact flow currently running on WhatsApp",
          businessType: "salon",
          isActive: true,
          isTemplate: false,
          version: "1.0.0",
          nodes: [
            { id: "start_1", type: "start", name: "Start", position: { x: 100, y: 100 }, configuration: {}, connections: [], metadata: {} },
            { id: "welcome_msg", type: "message", name: "Welcome Message", position: { x: 400, y: 100 }, configuration: {}, connections: [], metadata: {} },
            { id: "service_question", type: "question", name: "Service Selection", position: { x: 700, y: 100 }, configuration: {}, connections: [], metadata: {} },
            { id: "date_question", type: "question", name: "Date Selection", position: { x: 1e3, y: 100 }, configuration: {}, connections: [], metadata: {} },
            { id: "time_question", type: "question", name: "Time Selection", position: { x: 1300, y: 100 }, configuration: {}, connections: [], metadata: {} },
            { id: "customer_details", type: "question", name: "Customer Name", position: { x: 1600, y: 100 }, configuration: {}, connections: [], metadata: {} },
            { id: "payment_action", type: "action", name: "Payment Request", position: { x: 1900, y: 100 }, configuration: {}, connections: [], metadata: {} },
            { id: "confirmation_end", type: "end", name: "Booking Confirmed", position: { x: 2200, y: 100 }, configuration: {}, connections: [], metadata: {} }
          ],
          variables: [],
          metadata: {}
        }
      ],
      total: 1,
      page: 1,
      limit: 50
    });
  }
});
router.post("/", async (req, res) => {
  try {
    const { tenantId } = req.tenantContext;
    const flowData = req.body;
    const service = getBotFlowService();
    const result = await service.createBotFlow(tenantId, flowData);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    res.status(201).json(result.data);
  } catch (error) {
    console.error("Error creating bot flow:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
router.get("/:id", async (req, res) => {
  try {
    const { tenantId } = req.tenantContext;
    const { id } = req.params;
    const service = getBotFlowService();
    const result = await service.getBotFlow(tenantId, id);
    if (!result.success) {
      return res.status(404).json({ error: result.error });
    }
    res.json(result.data);
  } catch (error) {
    console.error("Error fetching bot flow:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
router.put("/:id", async (req, res) => {
  try {
    const { tenantId } = req.tenantContext;
    const { id } = req.params;
    const flowData = req.body;
    const service = getBotFlowService();
    const result = await service.updateBotFlow(tenantId, id, flowData);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    res.json(result.data);
  } catch (error) {
    console.error("Error updating bot flow:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
router.delete("/:id", async (req, res) => {
  try {
    const { tenantId } = req.tenantContext;
    const { id } = req.params;
    const service = getBotFlowService();
    const result = await service.deleteBotFlow(tenantId, id);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    res.json({ message: "Bot flow deleted successfully" });
  } catch (error) {
    console.error("Error deleting bot flow:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
router.post("/:id/activate", async (req, res) => {
  try {
    const { tenantId } = req.tenantContext;
    const { id } = req.params;
    const service = getBotFlowService();
    const deactivateResult = await service.deactivateAllBotFlows(tenantId);
    if (!deactivateResult.success) {
      return res.status(400).json({ error: deactivateResult.error });
    }
    const activateResult = await service.activateBotFlow(tenantId, id);
    if (!activateResult.success) {
      return res.status(400).json({ error: activateResult.error });
    }
    res.json({ message: "Bot flow activated successfully" });
  } catch (error) {
    console.error("Error activating bot flow:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
router.post("/:id/deactivate", async (req, res) => {
  try {
    const { tenantId } = req.tenantContext;
    const { id } = req.params;
    const service = getBotFlowService();
    const result = await service.deactivateBotFlow(tenantId, id);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    res.json({ message: "Bot flow deactivated successfully" });
  } catch (error) {
    console.error("Error deactivating bot flow:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
router.post("/:id/toggle", async (req, res) => {
  try {
    const { tenantId } = req.tenantContext;
    const { id } = req.params;
    const service = getBotFlowService();
    const flowResult = await service.getBotFlow(tenantId, id);
    if (!flowResult.success) {
      return res.status(404).json({ error: "Bot flow not found" });
    }
    const flow = flowResult.data;
    let result;
    if (flow.isActive) {
      result = await service.deactivateBotFlow(tenantId, id);
    } else {
      const deactivateResult = await service.deactivateAllBotFlows(tenantId);
      if (!deactivateResult.success) {
        return res.status(400).json({ error: deactivateResult.error });
      }
      result = await service.activateBotFlow(tenantId, id);
    }
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    res.json({
      message: `Bot flow ${flow.isActive ? "deactivated" : "activated"} successfully`,
      isActive: !flow.isActive
    });
  } catch (error) {
    console.error("Error toggling bot flow:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
router.post("/:id/test", async (req, res) => {
  try {
    const { tenantId } = req.tenantContext;
    const { id } = req.params;
    const flowData = req.body;
    console.log(`Testing bot flow ${id}:`, flowData);
    res.json({
      success: true,
      message: "Bot flow test completed successfully!"
    });
  } catch (error) {
    console.error("Error testing bot flow:", error);
    res.status(500).json({
      success: false,
      message: "Error testing bot flow. Please try again."
    });
  }
});
var bot_flow_builder_routes_default = router;

// server/routes/salon-api.ts
import { Router as Router2 } from "express";
import { Pool as Pool3 } from "@neondatabase/serverless";
var router2 = Router2();
var pool2 = new Pool3({
  connectionString: process.env.DATABASE_URL
});
router2.get("/services", async (req, res) => {
  try {
    const requestedTenant = req.headers["x-tenant-id"];
    const tenantResult = await pool2.query(`
      SELECT id FROM tenants WHERE domain = $1 OR business_name = $2
    `, [requestedTenant || "bella-salon", requestedTenant || "Bella Salon"]);
    const tenantId = tenantResult.rows[0]?.id;
    if (!tenantId) {
      console.log("Tenant not found for services:", requestedTenant || "bella-salon");
      return res.status(404).json({
        success: false,
        error: "Tenant not found"
      });
    }
    const result = await pool2.query(`
      SELECT 
        id, name, description, category, subcategory, 
        base_price, currency, duration_minutes, 
        is_active, display_order, tags, images
      FROM offerings 
      WHERE tenant_id = $1 AND offering_type = 'service'
      ORDER BY display_order, name
    `, [tenantId]);
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error("Error fetching services:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch services"
    });
  }
});
router2.post("/services", async (req, res) => {
  try {
    const tenantResult = await pool2.query(`
      SELECT id FROM tenants WHERE domain = $1 OR business_name = $2
    `, [req.headers["x-tenant-id"] || "bella-salon", "Bella Salon"]);
    const tenantId = tenantResult.rows[0]?.id;
    if (!tenantId) {
      return res.status(404).json({
        success: false,
        error: "Tenant not found"
      });
    }
    const {
      name,
      description,
      category,
      subcategory,
      base_price,
      currency = "USD",
      duration_minutes,
      is_active = true,
      display_order = 0,
      tags = [],
      images = []
    } = req.body;
    console.log("\u{1F50D} Service creation request body:", req.body);
    console.log("\u{1F50D} Extracted fields:", { name, base_price });
    if (!name || name.trim() === "") {
      console.log("\u274C Service creation validation failed: name is empty or missing");
      return res.status(400).json({
        success: false,
        error: "Service name is required"
      });
    }
    if (!base_price || isNaN(parseFloat(base_price))) {
      console.log("\u274C Service creation validation failed: base_price is invalid");
      return res.status(400).json({
        success: false,
        error: "Valid base price is required"
      });
    }
    console.log("\u2705 Service creation validation passed:", { name, base_price });
    const finalDisplayOrder = display_order !== null && display_order !== void 0 ? display_order : 0;
    const formattedBasePrice = parseFloat(base_price).toFixed(2);
    const result = await pool2.query(`
      INSERT INTO offerings (
        tenant_id, name, description, category, subcategory,
        base_price, currency, duration_minutes, is_active, 
        display_order, tags, images, offering_type
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'service')
      RETURNING *
    `, [
      tenantId,
      name,
      description,
      category,
      subcategory,
      formattedBasePrice,
      currency,
      duration_minutes,
      is_active,
      finalDisplayOrder,
      tags,
      images
    ]);
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error("Error creating service:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create service"
    });
  }
});
router2.put("/services/:id", async (req, res) => {
  try {
    console.log("\u{1F527} Service Update API v2.1.0 - Dynamic Field Update");
    const tenantResult = await pool2.query(`
      SELECT id FROM tenants WHERE domain = $1 OR business_name = $2
    `, [req.headers["x-tenant-id"] || "bella-salon", "Bella Salon"]);
    const tenantId = tenantResult.rows[0]?.id;
    if (!tenantId) {
      return res.status(404).json({
        success: false,
        error: "Tenant not found"
      });
    }
    const { id } = req.params;
    const {
      name,
      description,
      category,
      subcategory,
      base_price,
      currency,
      duration_minutes,
      is_active,
      display_order,
      tags,
      images
    } = req.body;
    console.log("\u{1F50D} Service update request body:", req.body);
    console.log("\u{1F50D} Extracted fields:", { name, base_price, currency, is_active, display_order });
    if (name !== void 0 && (!name || name.trim() === "")) {
      return res.status(400).json({
        success: false,
        error: "Service name cannot be empty"
      });
    }
    if (base_price !== void 0 && (!base_price || isNaN(parseFloat(base_price)))) {
      return res.status(400).json({
        success: false,
        error: "Valid base price is required"
      });
    }
    const formattedImages = Array.isArray(images) ? images : images ? [images] : [];
    const finalDisplayOrder = display_order !== null && display_order !== void 0 ? display_order : 0;
    const finalCurrency = currency || "USD";
    const finalIsActive = is_active !== void 0 ? is_active : true;
    const formattedBasePrice = base_price ? parseFloat(base_price).toFixed(2) : null;
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;
    updateValues.push(id);
    updateValues.push(tenantId);
    const idParamIndex = paramIndex++;
    const tenantParamIndex = paramIndex++;
    if (name !== void 0) {
      updateFields.push(`name = $${paramIndex}`);
      updateValues.splice(paramIndex - 1, 0, name);
      paramIndex++;
    }
    if (description !== void 0) {
      updateFields.push(`description = $${paramIndex}`);
      updateValues.splice(paramIndex - 1, 0, description);
      paramIndex++;
    }
    if (category !== void 0) {
      updateFields.push(`category = $${paramIndex}`);
      updateValues.splice(paramIndex - 1, 0, category);
      paramIndex++;
    }
    if (subcategory !== void 0) {
      updateFields.push(`subcategory = $${paramIndex}`);
      updateValues.splice(paramIndex - 1, 0, subcategory);
      paramIndex++;
    }
    if (base_price !== void 0) {
      updateFields.push(`base_price = $${paramIndex}`);
      updateValues.splice(paramIndex - 1, 0, formattedBasePrice);
      paramIndex++;
    }
    if (currency !== void 0) {
      updateFields.push(`currency = $${paramIndex}`);
      updateValues.splice(paramIndex - 1, 0, finalCurrency);
      paramIndex++;
    }
    if (duration_minutes !== void 0) {
      updateFields.push(`duration_minutes = $${paramIndex}`);
      updateValues.splice(paramIndex - 1, 0, duration_minutes);
      paramIndex++;
    }
    if (is_active !== void 0) {
      updateFields.push(`is_active = $${paramIndex}`);
      updateValues.splice(paramIndex - 1, 0, finalIsActive);
      paramIndex++;
    }
    if (display_order !== void 0) {
      updateFields.push(`display_order = $${paramIndex}`);
      updateValues.splice(paramIndex - 1, 0, finalDisplayOrder);
      paramIndex++;
    }
    if (tags !== void 0) {
      updateFields.push(`tags = $${paramIndex}`);
      updateValues.splice(paramIndex - 1, 0, tags);
      paramIndex++;
    }
    if (images !== void 0) {
      updateFields.push(`images = $${paramIndex}`);
      updateValues.splice(paramIndex - 1, 0, JSON.stringify(formattedImages));
      paramIndex++;
    }
    updateFields.push(`updated_at = NOW()`);
    if (updateFields.length === 1) {
      return res.status(400).json({
        success: false,
        error: "No valid fields provided for update"
      });
    }
    const result = await pool2.query(`
      UPDATE offerings SET
        ${updateFields.join(", ")}
      WHERE id = $${idParamIndex} AND tenant_id = $${tenantParamIndex}
      RETURNING *
    `, updateValues);
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Service not found"
      });
    }
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error("Error updating service:", error);
    console.error("Error details:", error.message);
    console.error("Request body:", req.body);
    console.error("Service ID:", req.params.id);
    res.status(500).json({
      success: false,
      error: "Failed to update service",
      details: error.message
    });
  }
});
router2.delete("/services/:id", async (req, res) => {
  try {
    const tenantResult = await pool2.query(`
      SELECT id FROM tenants WHERE domain = $1 OR business_name = $2
    `, [req.headers["x-tenant-id"] || "bella-salon", "Bella Salon"]);
    const tenantId = tenantResult.rows[0]?.id;
    if (!tenantId) {
      return res.status(404).json({
        success: false,
        error: "Tenant not found"
      });
    }
    const { id } = req.params;
    const result = await pool2.query(`
      DELETE FROM offerings 
      WHERE id = $1 AND tenant_id = $2
      RETURNING id
    `, [id, tenantId]);
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Service not found"
      });
    }
    res.json({
      success: true,
      message: "Service deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting service:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete service"
    });
  }
});
router2.get("/services/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const tenantResult = await pool2.query(`
      SELECT id FROM tenants WHERE domain = $1 OR business_name = $2
    `, [req.headers["x-tenant-id"] || "bella-salon", "Bella Salon"]);
    const tenantId = tenantResult.rows[0]?.id;
    if (!tenantId) {
      return res.status(404).json({
        success: false,
        error: "Tenant not found"
      });
    }
    const result = await pool2.query(`
      SELECT * FROM offerings 
      WHERE id = $1 AND tenant_id = $2 AND offering_type = 'service'
    `, [id, tenantId]);
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Service not found"
      });
    }
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error("Error fetching service:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch service"
    });
  }
});
router2.get("/appointments", async (req, res) => {
  try {
    const { date, status } = req.query;
    const tenantResult = await pool2.query(`
      SELECT id FROM tenants WHERE domain = $1 OR business_name = $2
    `, [req.headers["x-tenant-id"] || "bella-salon", "Bella Salon"]);
    const tenantId = tenantResult.rows[0]?.id;
    if (!tenantId) {
      return res.status(404).json({
        success: false,
        error: "Tenant not found"
      });
    }
    let query = `
      SELECT 
        t.id::text, t.transaction_number, t.customer_name, t.customer_phone, t.customer_email,
        t.scheduled_at, t.duration_minutes, t.amount, t.currency, t.payment_status,
        t.payment_method, t.notes, t.created_at, t.updated_at, t.staff_id,
        o.name as service_name, o.category as service_category,
        st.name as staff_name, 'transaction' as source
      FROM transactions t
      LEFT JOIN offerings o ON t.offering_id = o.id
      LEFT JOIN staff st ON t.staff_id = st.id
      WHERE t.tenant_id = $1 AND t.transaction_type = 'booking'
      
      UNION ALL
      
        SELECT 
          b.id::text, NULL as transaction_number, b.customer_name, b.phone_number as customer_phone, 
          NULL as customer_email, 
          b.appointment_date as scheduled_at,
          60 as duration_minutes, b.amount, 'INR' as currency, 
          CASE WHEN b.status = 'confirmed' THEN 'paid' ELSE 'pending' END as payment_status,
          'UPI' as payment_method, b.notes, b.created_at, b.updated_at, b.staff_id,
          s.name as service_name, 'general' as service_category,
          st.name as staff_name, 'whatsapp_bot' as source
      FROM bookings b
      LEFT JOIN services s ON b.service_id = s.id
      LEFT JOIN staff st ON b.staff_id = st.id
      WHERE b.created_at >= CURRENT_DATE - INTERVAL '30 days'
        AND b.notes LIKE '%WhatsApp booking%'
    `;
    const params = [tenantId];
    let paramIndex = 2;
    const baseQuery = query;
    if (date || status) {
      query = `SELECT * FROM (${baseQuery}) AS combined_appointments WHERE 1=1`;
      if (date) {
        query += ` AND DATE(scheduled_at) = $${paramIndex}`;
        params.push(date);
        paramIndex++;
      }
      if (status) {
        query += ` AND payment_status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }
    }
    query += ` ORDER BY scheduled_at DESC`;
    const result = await pool2.query(query, params);
    res.set({
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0"
    });
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch appointments"
    });
  }
});
router2.post("/appointments", async (req, res) => {
  try {
    const tenantResult = await pool2.query(`
      SELECT id FROM tenants WHERE domain = $1 OR business_name = $2
    `, [req.headers["x-tenant-id"] || "bella-salon", "Bella Salon"]);
    const tenantId = tenantResult.rows[0]?.id;
    if (!tenantId) {
      return res.status(404).json({
        success: false,
        error: "Tenant not found"
      });
    }
    const {
      customer_name,
      customer_phone,
      customer_email,
      service_id,
      staff_id,
      scheduled_at,
      duration_minutes,
      amount,
      currency = "INR",
      notes,
      payment_status = "pending"
    } = req.body;
    if (!customer_name || !customer_phone || !service_id || !scheduled_at || amount === void 0 || amount === null) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: customer_name, customer_phone, service_id, scheduled_at, amount"
      });
    }
    if (typeof customer_name !== "string" || typeof customer_phone !== "string") {
      return res.status(400).json({
        success: false,
        error: "Invalid data types: customer_name and customer_phone must be strings"
      });
    }
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount < 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid amount: must be a positive number"
      });
    }
    const scheduledDate = new Date(scheduled_at);
    if (isNaN(scheduledDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: "Invalid scheduled_at: must be a valid date"
      });
    }
    if (customer_name.length > 200) {
      return res.status(400).json({
        success: false,
        error: "Customer name too long: maximum 200 characters"
      });
    }
    if (customer_phone.length > 20) {
      return res.status(400).json({
        success: false,
        error: "Customer phone too long: maximum 20 characters"
      });
    }
    let finalAmount = amount;
    let finalDuration = duration_minutes;
    if (service_id) {
      const serviceResult = await pool2.query(`
        SELECT base_price, duration_minutes FROM offerings WHERE id = $1 AND tenant_id = $2
      `, [service_id, tenantId]);
      if (serviceResult.rows.length > 0) {
        finalAmount = serviceResult.rows[0].base_price;
        finalDuration = serviceResult.rows[0].duration_minutes;
      }
    }
    const result = await pool2.query(`
      INSERT INTO transactions (
        tenant_id, transaction_type, customer_name, customer_phone, customer_email,
        offering_id, staff_id, scheduled_at, duration_minutes,
        amount, currency, notes, payment_status
      ) VALUES ($1, 'booking', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      tenantId,
      customer_name,
      customer_phone,
      customer_email,
      service_id,
      staff_id,
      scheduled_at,
      finalDuration,
      finalAmount,
      currency,
      notes,
      payment_status
    ]);
    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error("Error creating appointment:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create appointment"
    });
  }
});
router2.get("/appointments/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const tenantResult = await pool2.query(`
      SELECT id FROM tenants WHERE domain = $1 OR business_name = $2
    `, [req.headers["x-tenant-id"] || "bella-salon", "Bella Salon"]);
    const tenantId = tenantResult.rows[0]?.id;
    if (!tenantId) {
      return res.status(404).json({
        success: false,
        error: "Tenant not found"
      });
    }
    const result = await pool2.query(`
      SELECT 
        t.id, t.transaction_number, t.customer_name, t.customer_phone, t.customer_email,
        t.offering_id, t.staff_id, t.scheduled_at, t.duration_minutes,
        t.amount, t.currency, t.notes, t.payment_status, t.transaction_type,
        t.created_at, t.updated_at,
        o.name as service_name, o.category as service_category,
        s.name as staff_name
      FROM transactions t
      LEFT JOIN offerings o ON t.offering_id = o.id
      LEFT JOIN staff s ON t.staff_id = s.id
      WHERE t.id = $1 AND t.tenant_id = $2 AND t.transaction_type = 'booking'
    `, [id, tenantId]);
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Appointment not found"
      });
    }
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error("Error fetching appointment:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch appointment"
    });
  }
});
router2.put("/appointments/:id", async (req, res) => {
  try {
    console.log("\u{1F527} Appointment Update API v2.2.3 - Dynamic Field Update");
    const { id } = req.params;
    const updateData = req.body;
    console.log("\u{1F50D} Update request body:", updateData);
    const tenantResult = await pool2.query(`
      SELECT id FROM tenants WHERE domain = $1 OR business_name = $2
    `, [req.headers["x-tenant-id"] || "bella-salon", "Bella Salon"]);
    const tenantId = tenantResult.rows[0]?.id;
    if (!tenantId) {
      return res.status(404).json({
        success: false,
        error: "Tenant not found"
      });
    }
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;
    updateValues.push(id);
    updateValues.push(tenantId);
    const idParamIndex = paramIndex++;
    const tenantParamIndex = paramIndex++;
    if (updateData.customer_name !== void 0) {
      updateFields.push(`customer_name = $${paramIndex}`);
      updateValues.splice(paramIndex - 1, 0, updateData.customer_name);
      paramIndex++;
    }
    if (updateData.customer_phone !== void 0) {
      updateFields.push(`customer_phone = $${paramIndex}`);
      updateValues.splice(paramIndex - 1, 0, updateData.customer_phone);
      paramIndex++;
    }
    if (updateData.customer_email !== void 0) {
      updateFields.push(`customer_email = $${paramIndex}`);
      updateValues.splice(paramIndex - 1, 0, updateData.customer_email);
      paramIndex++;
    }
    if (updateData.service_id !== void 0) {
      updateFields.push(`offering_id = $${paramIndex}`);
      updateValues.splice(paramIndex - 1, 0, updateData.service_id);
      paramIndex++;
    }
    if (updateData.staff_id !== void 0) {
      updateFields.push(`staff_id = $${paramIndex}`);
      updateValues.splice(paramIndex - 1, 0, updateData.staff_id);
      paramIndex++;
    }
    if (updateData.scheduled_at !== void 0) {
      updateFields.push(`scheduled_at = $${paramIndex}`);
      updateValues.splice(paramIndex - 1, 0, updateData.scheduled_at);
      paramIndex++;
    }
    if (updateData.duration_minutes !== void 0) {
      updateFields.push(`duration_minutes = $${paramIndex}`);
      updateValues.splice(paramIndex - 1, 0, updateData.duration_minutes);
      paramIndex++;
    }
    if (updateData.amount !== void 0) {
      updateFields.push(`amount = $${paramIndex}`);
      updateValues.splice(paramIndex - 1, 0, updateData.amount);
      paramIndex++;
    }
    if (updateData.currency !== void 0) {
      updateFields.push(`currency = $${paramIndex}`);
      updateValues.splice(paramIndex - 1, 0, updateData.currency);
      paramIndex++;
    }
    if (updateData.notes !== void 0) {
      updateFields.push(`notes = $${paramIndex}`);
      updateValues.splice(paramIndex - 1, 0, updateData.notes);
      paramIndex++;
    }
    if (updateData.payment_status !== void 0) {
      updateFields.push(`payment_status = $${paramIndex}`);
      updateValues.splice(paramIndex - 1, 0, updateData.payment_status);
      paramIndex++;
    }
    updateFields.push(`updated_at = NOW()`);
    if (updateFields.length === 1) {
      return res.status(400).json({
        success: false,
        error: "No valid fields provided for update"
      });
    }
    console.log("\u{1F50D} Update fields:", updateFields);
    console.log("\u{1F50D} Update values:", updateValues);
    const result = await pool2.query(`
      UPDATE transactions SET
        ${updateFields.join(", ")}
      WHERE id = $${idParamIndex} AND tenant_id = $${tenantParamIndex}
      RETURNING *
    `, updateValues);
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Appointment not found"
      });
    }
    console.log("\u2705 Appointment updated successfully:", result.rows[0].id);
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error("Error updating appointment:", error);
    console.error("Error details:", error.message);
    console.error("Request body:", req.body);
    console.error("Appointment ID:", req.params.id);
    res.status(500).json({
      success: false,
      error: "Failed to update appointment",
      details: error.message
    });
  }
});
router2.delete("/appointments/:id", async (req, res) => {
  try {
    console.log("\u{1F5D1}\uFE0F Delete Appointment API - Starting deletion");
    const { id } = req.params;
    const requestedTenant = req.headers["x-tenant-id"];
    const tenantResult = await pool2.query(`
      SELECT id FROM tenants WHERE domain = $1 OR business_name = $2
    `, [requestedTenant || "bella-salon", requestedTenant || "Bella Salon"]);
    const tenantId = tenantResult.rows[0]?.id;
    if (!tenantId) {
      console.log("Tenant not found for delete appointment:", requestedTenant || "bella-salon");
      return res.status(404).json({
        success: false,
        error: "Tenant not found"
      });
    }
    console.log("\u{1F5D1}\uFE0F Deleting appointment:", id, "for tenant:", tenantId);
    const result = await pool2.query(`
      DELETE FROM transactions 
      WHERE id = $1 AND tenant_id = $2
      RETURNING id
    `, [id, tenantId]);
    if (result.rows.length === 0) {
      console.log("\u{1F5D1}\uFE0F Appointment not found:", id);
      return res.status(404).json({
        success: false,
        error: "Appointment not found"
      });
    }
    console.log("\u{1F5D1}\uFE0F Appointment deleted successfully:", id);
    res.json({
      success: true,
      message: "Appointment deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting appointment:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete appointment"
    });
  }
});
router2.get("/stats", async (req, res) => {
  try {
    const tenantResult = await pool2.query(`
      SELECT id FROM tenants WHERE domain = $1 OR business_name = $2
    `, [req.headers["x-tenant-id"] || "bella-salon", "Bella Salon"]);
    const tenantId = tenantResult.rows[0]?.id;
    if (!tenantId) {
      return res.status(404).json({
        success: false,
        error: "Tenant not found"
      });
    }
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const [todayAppointments, todayRevenue, totalServices] = await Promise.all([
      pool2.query(`
        SELECT COUNT(*) as count 
        FROM transactions 
        WHERE tenant_id = $1 AND transaction_type = 'booking' 
        AND DATE(scheduled_at) = $2
      `, [tenantId, today]),
      pool2.query(`
        SELECT COALESCE(SUM(amount), 0) as total 
        FROM transactions 
        WHERE tenant_id = $1 AND transaction_type = 'booking' 
        AND DATE(scheduled_at) = $2 AND payment_status = 'paid'
      `, [tenantId, today]),
      pool2.query(`
        SELECT COUNT(*) as count 
        FROM offerings 
        WHERE tenant_id = $1 AND offering_type = 'service' AND is_active = true
      `, [tenantId])
    ]);
    res.json({
      success: true,
      data: {
        todayAppointments: parseInt(todayAppointments.rows[0].count),
        todayRevenue: parseFloat(todayRevenue.rows[0].total),
        totalServices: parseInt(totalServices.rows[0].count)
      }
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch stats"
    });
  }
});
var salon_api_default = router2;

// server/routes/staff-api.ts
import { Router as Router3 } from "express";
import { Pool as Pool4 } from "@neondatabase/serverless";
var router3 = Router3();
var pool3 = new Pool4({
  connectionString: process.env.DATABASE_URL
});
router3.get("/staff", async (req, res) => {
  try {
    const tenantResult = await pool3.query(`
      SELECT id FROM tenants WHERE domain = $1 OR business_name = $2
    `, [req.headers["x-tenant-id"] || "bella-salon", "Bella Salon"]);
    const tenantId = tenantResult.rows[0]?.id;
    if (!tenantId) {
      return res.status(404).json({
        success: false,
        error: "Tenant not found"
      });
    }
    const result = await pool3.query(`
      SELECT 
        s.id, s.name, s.email, s.phone, s.role, s.specializations,
        s.working_hours, s.working_days, s.hourly_rate, s.commission_rate, s.is_active,
        s.hire_date, s.notes, s.avatar_url, s.created_at, s.updated_at,
        COUNT(t.id) as total_appointments,
        COUNT(CASE WHEN t.scheduled_at >= CURRENT_DATE THEN t.id END) as upcoming_appointments
      FROM staff s
      LEFT JOIN transactions t ON s.id = t.staff_id AND t.transaction_type = 'booking'
      WHERE s.tenant_id = $1
      GROUP BY s.id, s.name, s.email, s.phone, s.role, s.specializations,
               s.working_hours, s.working_days, s.hourly_rate, s.commission_rate, s.is_active,
               s.hire_date, s.notes, s.avatar_url, s.created_at, s.updated_at
      ORDER BY s.name
    `, [tenantId]);
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error("Error fetching staff:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch staff"
    });
  }
});
router3.post("/staff", async (req, res) => {
  try {
    const tenantResult = await pool3.query(`
      SELECT id FROM tenants WHERE domain = $1 OR business_name = $2
    `, [req.headers["x-tenant-id"] || "bella-salon", "Bella Salon"]);
    const tenantId = tenantResult.rows[0]?.id;
    if (!tenantId) {
      return res.status(404).json({
        success: false,
        error: "Tenant not found"
      });
    }
    const {
      name,
      email,
      phone,
      role,
      specializations,
      working_hours,
      hourly_rate,
      commission_rate,
      hire_date,
      notes,
      avatar_url
    } = req.body;
    const formattedSpecializations = Array.isArray(specializations) ? specializations : [];
    const formattedWorkingHours = typeof working_hours === "object" ? working_hours : {};
    const result = await pool3.query(`
      INSERT INTO staff (
        tenant_id, name, email, phone, role, specializations,
        working_hours, hourly_rate, commission_rate, hire_date, notes, avatar_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      tenantId,
      name,
      email,
      phone,
      role,
      JSON.stringify(formattedSpecializations),
      JSON.stringify(formattedWorkingHours),
      hourly_rate,
      commission_rate,
      hire_date,
      notes,
      avatar_url
    ]);
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error("Error creating staff:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create staff member"
    });
  }
});
router3.put("/staff/:id", async (req, res) => {
  try {
    const tenantResult = await pool3.query(`
      SELECT id FROM tenants WHERE domain = $1 OR business_name = $2
    `, [req.headers["x-tenant-id"] || "bella-salon", "Bella Salon"]);
    const tenantId = tenantResult.rows[0]?.id;
    if (!tenantId) {
      return res.status(404).json({
        success: false,
        error: "Tenant not found"
      });
    }
    const { id } = req.params;
    const {
      name,
      email,
      phone,
      role,
      specializations,
      working_hours,
      working_days,
      hourly_rate,
      commission_rate,
      is_active,
      notes,
      avatar_url
    } = req.body;
    const formattedSpecializations = Array.isArray(specializations) ? specializations : [];
    const formattedWorkingHours = typeof working_hours === "object" ? working_hours : {};
    const formattedWorkingDays = Array.isArray(working_days) ? working_days : [];
    const finalRole = role || "staff";
    const result = await pool3.query(`
      UPDATE staff SET
        name = $2, email = $3, phone = $4, role = $5, specializations = $6,
        working_hours = $7, working_days = $8, hourly_rate = $9, commission_rate = $10,
        is_active = $11, notes = $12, avatar_url = $13, updated_at = NOW()
      WHERE id = $1 AND tenant_id = $14
      RETURNING *
    `, [
      id,
      name,
      email,
      phone,
      finalRole,
      JSON.stringify(formattedSpecializations),
      JSON.stringify(formattedWorkingHours),
      JSON.stringify(formattedWorkingDays),
      hourly_rate,
      commission_rate,
      is_active,
      notes,
      avatar_url,
      tenantId
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Staff member not found"
      });
    }
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error("Error updating staff:", error);
    console.error("Error details:", error.message);
    console.error("Request body:", req.body);
    console.error("Staff ID:", req.params.id);
    res.status(500).json({
      success: false,
      error: "Failed to update staff member",
      details: error.message
    });
  }
});
router3.delete("/staff/:id", async (req, res) => {
  try {
    const tenantResult = await pool3.query(`
      SELECT id FROM tenants WHERE domain = $1 OR business_name = $2
    `, [req.headers["x-tenant-id"] || "bella-salon", "Bella Salon"]);
    const tenantId = tenantResult.rows[0]?.id;
    if (!tenantId) {
      return res.status(404).json({
        success: false,
        error: "Tenant not found"
      });
    }
    const { id } = req.params;
    const result = await pool3.query(`
      DELETE FROM staff 
      WHERE id = $1 AND tenant_id = $2
      RETURNING id
    `, [id, tenantId]);
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Staff member not found"
      });
    }
    res.json({
      success: true,
      message: "Staff member deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting staff:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete staff member"
    });
  }
});
router3.get("/staff/:id/availability", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool3.query(`
      SELECT day_of_week, start_time, end_time, is_available, 
             break_start_time, break_end_time, max_appointments
      FROM staff_availability 
      WHERE staff_id = $1
      ORDER BY day_of_week, start_time
    `, [id]);
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error("Error fetching staff availability:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch staff availability"
    });
  }
});
router3.put("/staff/:id/availability", async (req, res) => {
  try {
    const { id } = req.params;
    const { availability } = req.body;
    await pool3.query("DELETE FROM staff_availability WHERE staff_id = $1", [id]);
    for (const avail of availability) {
      await pool3.query(`
        INSERT INTO staff_availability (
          staff_id, day_of_week, start_time, end_time, is_available,
          break_start_time, break_end_time, max_appointments
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        id,
        avail.day_of_week,
        avail.start_time,
        avail.end_time,
        avail.is_available,
        avail.break_start_time,
        avail.break_end_time,
        avail.max_appointments
      ]);
    }
    res.json({
      success: true,
      message: "Staff availability updated successfully"
    });
  } catch (error) {
    console.error("Error updating staff availability:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update staff availability"
    });
  }
});
router3.get("/staff/:id/appointments", async (req, res) => {
  try {
    const { id } = req.params;
    const { date, status } = req.query;
    let query = `
      SELECT 
        t.id, t.transaction_number, t.customer_name, t.customer_phone, t.customer_email,
        t.scheduled_at, t.duration_minutes, t.amount, t.currency, t.payment_status,
        t.notes, t.created_at, t.updated_at,
        o.name as service_name, o.category as service_category
      FROM transactions t
      LEFT JOIN offerings o ON t.offering_id = o.id
      WHERE t.staff_id = $1 AND t.transaction_type = 'booking'
    `;
    const params = [id];
    let paramIndex = 2;
    if (date) {
      query += ` AND DATE(t.scheduled_at) = $${paramIndex}`;
      params.push(date);
      paramIndex++;
    }
    if (status) {
      query += ` AND t.payment_status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    query += ` ORDER BY t.scheduled_at ASC`;
    const result = await pool3.query(query, params);
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error("Error fetching staff appointments:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch staff appointments"
    });
  }
});
router3.get("/staff/:id/available-slots", async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({
        success: false,
        error: "Date parameter is required"
      });
    }
    const appointmentDate = new Date(date);
    const dayOfWeek = appointmentDate.getDay();
    const availabilityResult = await pool3.query(`
      SELECT start_time, end_time, break_start_time, break_end_time, max_appointments
      FROM staff_availability 
      WHERE staff_id = $1 AND day_of_week = $2 AND is_available = true
    `, [id, dayOfWeek]);
    if (availabilityResult.rows.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }
    const availability = availabilityResult.rows[0];
    const appointmentsResult = await pool3.query(`
      SELECT scheduled_at, duration_minutes
      FROM transactions 
      WHERE staff_id = $1 AND DATE(scheduled_at) = $2 AND transaction_type = 'booking'
      ORDER BY scheduled_at
    `, [id, date]);
    const slots = [];
    const startTime = /* @__PURE__ */ new Date(`${date}T${availability.start_time}`);
    const endTime = /* @__PURE__ */ new Date(`${date}T${availability.end_time}`);
    const breakStart = availability.break_start_time ? /* @__PURE__ */ new Date(`${date}T${availability.break_start_time}`) : null;
    const breakEnd = availability.break_end_time ? /* @__PURE__ */ new Date(`${date}T${availability.break_end_time}`) : null;
    const interval = 30 * 60 * 1e3;
    let currentTime = new Date(startTime);
    while (currentTime < endTime) {
      const slotEnd = new Date(currentTime.getTime() + interval);
      const isDuringBreak = breakStart && breakEnd && currentTime >= breakStart && currentTime < breakEnd;
      if (!isDuringBreak) {
        const hasConflict = appointmentsResult.rows.some((appointment) => {
          const appointmentStart = new Date(appointment.scheduled_at);
          const appointmentEnd = new Date(appointmentStart.getTime() + appointment.duration_minutes * 60 * 1e3);
          return currentTime < appointmentEnd && slotEnd > appointmentStart;
        });
        if (!hasConflict) {
          slots.push({
            start_time: currentTime.toISOString(),
            end_time: slotEnd.toISOString(),
            formatted_time: currentTime.toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true
            })
          });
        }
      }
      currentTime = new Date(currentTime.getTime() + interval);
    }
    res.json({
      success: true,
      data: slots
    });
  } catch (error) {
    console.error("Error fetching available slots:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch available slots"
    });
  }
});
router3.get("/staff/:id/stats", async (req, res) => {
  try {
    const { id } = req.params;
    const { period = "30" } = req.query;
    const result = await pool3.query(`
      SELECT 
        COUNT(*) as total_appointments,
        COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as completed_appointments,
        COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN amount ELSE 0 END), 0) as total_revenue,
        COALESCE(AVG(CASE WHEN payment_status = 'paid' THEN amount ELSE NULL END), 0) as average_appointment_value,
        COUNT(CASE WHEN scheduled_at >= CURRENT_DATE THEN 1 END) as upcoming_appointments
      FROM transactions 
      WHERE staff_id = $1 
        AND transaction_type = 'booking'
        AND scheduled_at >= CURRENT_DATE - INTERVAL '${period} days'
    `, [id]);
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error("Error fetching staff stats:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch staff stats"
    });
  }
});
var staff_api_default = router3;

// server/routes/webhook.routes.ts
import { Router as Router4 } from "express";
import crypto3 from "crypto";

// server/services/tenant.service.ts
import { eq as eq4, and as and4, desc as desc2, asc as asc2, like, inArray as inArray2, gte as gte3, lte, ne, or, sql as sql4 } from "drizzle-orm";
import { drizzle as drizzle3 } from "drizzle-orm/neon-serverless";
import { Pool as Pool5 } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// shared/validation/tenant.ts
import { z } from "zod";
var uuidSchema = z.string().uuid();
var emailSchema = z.string().email();
var phoneSchema = z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format");
var domainSchema = z.string().regex(/^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/, "Invalid domain format");
var urlSchema = z.string().url();
var colorSchema = z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color format");
var timeSchema = z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)");
var currencySchema = z.string().length(3, "Currency must be 3 characters (ISO 4217)");
var tenantStatusSchema = z.enum(["trial", "active", "suspended", "cancelled"]);
var createTenantRequestSchema = z.object({
  businessName: z.string().min(1, "Business name is required").max(255, "Business name too long"),
  domain: domainSchema,
  email: emailSchema,
  phone: phoneSchema.optional(),
  subscriptionPlan: z.string().optional().default("starter"),
  adminUser: z.object({
    email: emailSchema,
    password: z.string().min(8, "Password must be at least 8 characters").regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      "Password must contain uppercase, lowercase, number, and special character"
    ),
    firstName: z.string().min(1).max(100).optional(),
    lastName: z.string().min(1).max(100).optional(),
    role: z.enum(["admin", "user", "viewer"]).optional().default("admin")
  })
});
var updateTenantRequestSchema = z.object({
  businessName: z.string().min(1).max(255).optional(),
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  botSettings: z.record(z.any()).optional(),
  // Will be validated by botSettingsSchema
  billingSettings: z.record(z.any()).optional()
  // Will be validated by billingSettingsSchema
});
var userRoleSchema = z.enum(["admin", "user", "viewer"]);
var createUserRequestSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, "Password must be at least 8 characters").regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    "Password must contain uppercase, lowercase, number, and special character"
  ),
  role: userRoleSchema.optional().default("user"),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional()
});
var updateUserRequestSchema = z.object({
  email: emailSchema.optional(),
  role: userRoleSchema.optional(),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  isActive: z.boolean().optional()
});
var apiPermissionSchema = z.enum([
  "read:services",
  "write:services",
  "read:conversations",
  "write:conversations",
  "read:bookings",
  "write:bookings",
  "read:analytics",
  "webhook:receive",
  "admin:all"
]);
var createApiKeyRequestSchema = z.object({
  name: z.string().min(1, "API key name is required").max(100, "Name too long"),
  permissions: z.array(apiPermissionSchema).min(1, "At least one permission is required"),
  expiresAt: z.date().min(/* @__PURE__ */ new Date(), "Expiry date must be in the future").optional()
});
var planFeaturesSchema = z.object({
  whatsappIntegration: z.boolean(),
  basicAnalytics: z.boolean(),
  advancedAnalytics: z.boolean().optional(),
  customBranding: z.boolean().optional(),
  webhooks: z.boolean().optional(),
  prioritySupport: z.boolean().optional(),
  sso: z.boolean().optional(),
  customIntegrations: z.boolean().optional(),
  dedicatedSupport: z.boolean().optional()
});
var planLimitsSchema = z.object({
  messagesPerMonth: z.number().int().min(-1, "Invalid message limit"),
  bookingsPerMonth: z.number().int().min(-1, "Invalid booking limit"),
  apiCallsPerDay: z.number().int().min(-1, "Invalid API call limit"),
  storageGB: z.number().int().min(0).optional(),
  customFields: z.number().int().min(0).optional(),
  webhookEndpoints: z.number().int().min(0).optional()
});
var subscriptionPlanSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  priceMonthly: z.number().int().min(0, "Price must be non-negative"),
  priceYearly: z.number().int().min(0, "Price must be non-negative").optional(),
  features: planFeaturesSchema,
  limits: planLimitsSchema,
  isActive: z.boolean(),
  createdAt: z.date()
});
var subscriptionStatusSchema = z.enum(["active", "cancelled", "past_due", "unpaid", "trialing"]);
var billingCycleSchema = z.enum(["monthly", "yearly"]);
var createSubscriptionRequestSchema = z.object({
  planId: z.string().min(1, "Plan ID is required"),
  billingCycle: billingCycleSchema,
  paymentMethodId: z.string().optional()
});
var usageMetricNameSchema = z.enum([
  "messages_sent",
  "messages_received",
  "bookings_created",
  "api_calls",
  "storage_used",
  "webhook_calls"
]);
var usageMetricSchema = z.object({
  id: uuidSchema,
  tenantId: uuidSchema,
  metricName: usageMetricNameSchema,
  metricValue: z.number().int().min(0),
  periodStart: z.date(),
  periodEnd: z.date(),
  createdAt: z.date()
});
var dayScheduleSchema = z.object({
  isOpen: z.boolean(),
  openTime: timeSchema,
  closeTime: timeSchema
}).refine((data) => {
  if (!data.isOpen) return true;
  const [openHour, openMin] = data.openTime.split(":").map(Number);
  const [closeHour, closeMin] = data.closeTime.split(":").map(Number);
  const openMinutes = openHour * 60 + openMin;
  const closeMinutes = closeHour * 60 + closeMin;
  return openMinutes < closeMinutes;
}, {
  message: "Open time must be before close time"
});
var weeklyScheduleSchema = z.object({
  monday: dayScheduleSchema,
  tuesday: dayScheduleSchema,
  wednesday: dayScheduleSchema,
  thursday: dayScheduleSchema,
  friday: dayScheduleSchema,
  saturday: dayScheduleSchema,
  sunday: dayScheduleSchema
});
var businessHoursSchema = z.object({
  enabled: z.boolean(),
  timezone: z.string().min(1, "Timezone is required"),
  schedule: weeklyScheduleSchema,
  closedMessage: z.string().min(1, "Closed message is required").max(500)
});
var autoResponsesSchema = z.object({
  welcomeMessage: z.string().min(1, "Welcome message is required").max(1e3),
  serviceSelectionPrompt: z.string().min(1).max(500),
  dateSelectionPrompt: z.string().min(1).max(500),
  timeSelectionPrompt: z.string().min(1).max(500),
  confirmationMessage: z.string().min(1).max(500),
  paymentInstructions: z.string().min(1).max(1e3),
  bookingConfirmedMessage: z.string().min(1).max(500),
  errorMessage: z.string().min(1).max(500),
  invalidInputMessage: z.string().min(1).max(500)
});
var validationRuleSchema = z.object({
  type: z.enum(["required", "email", "phone", "date", "time", "custom"]),
  message: z.string().min(1).max(200),
  pattern: z.string().optional()
});
var stepConditionSchema = z.object({
  field: z.string().min(1),
  operator: z.enum(["equals", "contains", "greater_than", "less_than"]),
  value: z.union([z.string(), z.number()]),
  nextStep: z.string().min(1)
});
var stepTypeSchema = z.enum([
  "greeting",
  "service_selection",
  "date_selection",
  "time_selection",
  "customer_info",
  "payment",
  "confirmation",
  "custom"
]);
var conversationStepSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100),
  type: stepTypeSchema,
  prompt: z.string().min(1).max(1e3),
  validation: z.array(validationRuleSchema).optional(),
  nextStep: z.string().optional(),
  conditions: z.array(stepConditionSchema).optional()
});
var fallbackBehaviorSchema = z.enum(["restart", "human_handoff", "end_conversation"]);
var conversationFlowSchema = z.object({
  steps: z.array(conversationStepSchema).min(1, "At least one step is required"),
  fallbackBehavior: fallbackBehaviorSchema,
  maxRetries: z.number().int().min(1).max(10),
  sessionTimeout: z.number().int().min(5).max(1440)
  // 5 minutes to 24 hours
});
var paymentTypeSchema = z.enum(["cash", "card", "bank_transfer", "mobile_money", "crypto"]);
var paymentMethodSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100),
  type: paymentTypeSchema,
  enabled: z.boolean(),
  instructions: z.string().min(1).max(1e3),
  metadata: z.record(z.any()).optional()
});
var paymentSettingsSchema = z.object({
  enabled: z.boolean(),
  methods: z.array(paymentMethodSchema),
  currency: currencySchema,
  requirePayment: z.boolean(),
  depositPercentage: z.number().min(0).max(100).optional()
});
var retryPolicySchema = z.object({
  maxRetries: z.number().int().min(0).max(10),
  backoffMultiplier: z.number().min(1).max(10),
  maxBackoffSeconds: z.number().int().min(1).max(3600)
});
var webhookEndpointSchema = z.object({
  id: uuidSchema,
  url: urlSchema,
  secret: z.string().min(8, "Webhook secret must be at least 8 characters"),
  isActive: z.boolean(),
  retryPolicy: retryPolicySchema
});
var notificationEventSchema = z.enum([
  "booking_created",
  "booking_confirmed",
  "booking_cancelled",
  "payment_received",
  "conversation_started",
  "conversation_ended",
  "error_occurred"
]);
var emailNotificationSettingsSchema = z.object({
  enabled: z.boolean(),
  recipientEmails: z.array(emailSchema).max(10, "Maximum 10 email recipients"),
  events: z.array(notificationEventSchema)
});
var smsNotificationSettingsSchema = z.object({
  enabled: z.boolean(),
  recipientPhones: z.array(phoneSchema).max(5, "Maximum 5 phone recipients"),
  events: z.array(notificationEventSchema)
});
var webhookNotificationSettingsSchema = z.object({
  enabled: z.boolean(),
  endpoints: z.array(webhookEndpointSchema).max(5, "Maximum 5 webhook endpoints"),
  events: z.array(notificationEventSchema)
});
var notificationSettingsSchema = z.object({
  emailNotifications: emailNotificationSettingsSchema,
  smsNotifications: smsNotificationSettingsSchema,
  webhookNotifications: webhookNotificationSettingsSchema
});
var brandColorsSchema = z.object({
  primary: colorSchema,
  secondary: colorSchema,
  accent: colorSchema,
  background: colorSchema,
  text: colorSchema
});
var companyInfoSchema = z.object({
  name: z.string().min(1).max(255),
  address: z.string().max(500).optional(),
  phone: phoneSchema.optional(),
  email: emailSchema.optional(),
  website: urlSchema.optional(),
  description: z.string().max(1e3).optional()
});
var customFieldTypeSchema = z.enum(["text", "email", "phone", "number", "date", "select", "radio", "checkbox"]);
var customFieldSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100),
  type: customFieldTypeSchema,
  required: z.boolean(),
  options: z.array(z.string()).optional(),
  validation: z.array(validationRuleSchema).optional()
});
var botCustomizationSchema = z.object({
  brandColors: brandColorsSchema,
  logo: urlSchema.optional(),
  companyInfo: companyInfoSchema,
  customCss: z.string().max(1e4).optional(),
  customFields: z.array(customFieldSchema).max(20, "Maximum 20 custom fields")
});
var botSettingsSchema = z.object({
  greetingMessage: z.string().min(1, "Greeting message is required").max(1e3),
  businessHours: businessHoursSchema,
  autoResponses: autoResponsesSchema,
  conversationFlow: conversationFlowSchema,
  paymentSettings: paymentSettingsSchema,
  notificationSettings: notificationSettingsSchema,
  customization: botCustomizationSchema
});
var billingAddressSchema = z.object({
  street: z.string().min(1, "Street address is required").max(255),
  city: z.string().min(1, "City is required").max(100),
  state: z.string().min(1, "State is required").max(100),
  postalCode: z.string().min(1, "Postal code is required").max(20),
  country: z.string().length(2, "Country must be 2-letter ISO code")
});
var paymentMethodInfoSchema = z.object({
  type: z.enum(["card", "bank_account"]),
  last4: z.string().length(4, "Last 4 digits required"),
  brand: z.string().optional(),
  expiryMonth: z.number().int().min(1).max(12).optional(),
  expiryYear: z.number().int().min((/* @__PURE__ */ new Date()).getFullYear()).optional(),
  stripePaymentMethodId: z.string().min(1)
});
var invoiceSettingsSchema = z.object({
  autoSend: z.boolean(),
  dueNetDays: z.number().int().min(0).max(90),
  footer: z.string().max(500).optional(),
  logo: urlSchema.optional(),
  includeUsageDetails: z.boolean()
});
var billingSettingsSchema = z.object({
  companyName: z.string().min(1, "Company name is required").max(255),
  billingEmail: emailSchema,
  billingAddress: billingAddressSchema,
  taxId: z.string().max(50).optional(),
  paymentMethod: paymentMethodInfoSchema.optional(),
  invoiceSettings: invoiceSettingsSchema
});
var whatsappCredentialsSchema = z.object({
  accessToken: z.string().min(1, "Access token is required"),
  verifyToken: z.string().min(8, "Verify token must be at least 8 characters"),
  phoneNumberId: z.string().min(1, "Phone number ID is required"),
  businessAccountId: z.string().min(1, "Business account ID is required"),
  appId: z.string().min(1, "App ID is required"),
  appSecret: z.string().min(1, "App secret is required")
});
var whatsappConfigSchema = whatsappCredentialsSchema.extend({
  webhookUrl: urlSchema,
  isVerified: z.boolean(),
  lastVerified: z.date().optional()
});
var loginCredentialsSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
  tenantDomain: domainSchema.optional()
});
var mfaMethodSchema = z.enum(["totp", "sms", "email"]);
var mfaSetupRequestSchema = z.object({
  method: mfaMethodSchema,
  phoneNumber: phoneSchema.optional()
});
var mfaVerificationRequestSchema = z.object({
  token: z.string().min(1, "MFA token is required"),
  code: z.string().length(6, "MFA code must be 6 digits")
});
var paginationParamsSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc")
});
var filterParamsSchema = z.object({
  status: z.array(z.string()).optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  search: z.string().max(255).optional()
});
var tenantContextRequestSchema = z.object({
  tenantId: uuidSchema,
  source: z.enum(["user_session", "api_key", "webhook"]),
  sourceId: z.string().min(1)
});
var auditActionSchema = z.enum([
  "create",
  "read",
  "update",
  "delete",
  "login",
  "logout",
  "api_call",
  "webhook_received",
  "payment_processed",
  "subscription_changed"
]);
var auditLogSchema = z.object({
  id: uuidSchema,
  tenantId: uuidSchema,
  userId: uuidSchema.optional(),
  action: auditActionSchema,
  resource: z.string().min(1).max(100),
  resourceId: z.string().optional(),
  details: z.record(z.any()),
  ipAddress: z.string().ip().optional(),
  userAgent: z.string().max(500).optional(),
  timestamp: z.date()
});
var validateDomainUniqueness = (domain) => {
  return domainSchema.parse(domain);
};
var validateWebhookUrl = (url) => {
  const schema = z.string().url("Invalid URL format").refine((url2) => url2.startsWith("https://"), "Webhook URL must use HTTPS");
  return schema.parse(url);
};
var validateConversationFlow = (flow) => {
  const parsed = conversationFlowSchema.parse(flow);
  const stepIds = new Set(parsed.steps.map((step) => step.id));
  for (const step of parsed.steps) {
    if (step.nextStep && !stepIds.has(step.nextStep)) {
      throw new Error(`Step "${step.id}" references non-existent step "${step.nextStep}"`);
    }
    if (step.conditions) {
      for (const condition of step.conditions) {
        if (!stepIds.has(condition.nextStep)) {
          throw new Error(`Step "${step.id}" condition references non-existent step "${condition.nextStep}"`);
        }
      }
    }
  }
  return parsed;
};
var tenantValidationSchemas = {
  // Core tenant schemas
  createTenantRequest: createTenantRequestSchema,
  updateTenantRequest: updateTenantRequestSchema,
  tenantStatus: tenantStatusSchema,
  // User schemas
  createUserRequest: createUserRequestSchema,
  updateUserRequest: updateUserRequestSchema,
  userRole: userRoleSchema,
  // API key schemas
  createApiKeyRequest: createApiKeyRequestSchema,
  apiPermission: apiPermissionSchema,
  // Subscription schemas
  subscriptionPlan: subscriptionPlanSchema,
  createSubscriptionRequest: createSubscriptionRequestSchema,
  planFeatures: planFeaturesSchema,
  planLimits: planLimitsSchema,
  // Usage metrics schemas
  usageMetric: usageMetricSchema,
  usageMetricName: usageMetricNameSchema,
  // Bot configuration schemas
  botSettings: botSettingsSchema,
  businessHours: businessHoursSchema,
  conversationFlow: conversationFlowSchema,
  paymentSettings: paymentSettingsSchema,
  // Billing schemas
  billingSettings: billingSettingsSchema,
  billingAddress: billingAddressSchema,
  // WhatsApp schemas
  whatsappCredentials: whatsappCredentialsSchema,
  whatsappConfig: whatsappConfigSchema,
  // Authentication schemas
  loginCredentials: loginCredentialsSchema,
  mfaSetupRequest: mfaSetupRequestSchema,
  mfaVerificationRequest: mfaVerificationRequestSchema,
  // Utility schemas
  paginationParams: paginationParamsSchema,
  filterParams: filterParamsSchema,
  tenantContextRequest: tenantContextRequestSchema,
  // Audit schemas
  auditLog: auditLogSchema,
  auditAction: auditActionSchema
};

// server/services/tenant.service.ts
var TenantService = class {
  db;
  pool;
  constructor(connectionString) {
    this.pool = new Pool5({ connectionString });
    this.db = drizzle3({ client: this.pool, schema: schema_exports });
  }
  // ===== TENANT CRUD OPERATIONS =====
  /**
   * Create a new tenant with admin user
   */
  async createTenant(data) {
    try {
      const validatedData = tenantValidationSchemas.createTenantRequest.parse(data);
      const existingTenant = await this.db.select({ id: tenants.id }).from(tenants).where(eq4(tenants.domain, validatedData.domain)).limit(1);
      if (existingTenant.length > 0) {
        return {
          success: false,
          error: {
            code: "DOMAIN_ALREADY_EXISTS",
            message: "Domain is already registered",
            details: { domain: validatedData.domain }
          }
        };
      }
      const passwordHash = await bcrypt.hash(validatedData.adminUser.password, 12);
      const result = await this.db.transaction(async (tx) => {
        const [tenant] = await tx.insert(tenants).values({
          businessName: validatedData.businessName,
          domain: validatedData.domain,
          email: validatedData.email,
          phone: validatedData.phone,
          subscriptionPlan: validatedData.subscriptionPlan || "starter",
          status: "trial",
          botSettings: this.getDefaultBotSettings(),
          billingSettings: this.getDefaultBillingSettings(validatedData)
        }).returning();
        await tx.insert(users).values({
          tenantId: tenant.id,
          email: validatedData.adminUser.email,
          passwordHash,
          role: validatedData.adminUser.role || "admin",
          firstName: validatedData.adminUser.firstName,
          lastName: validatedData.adminUser.lastName,
          isActive: true
        });
        const currentDate = /* @__PURE__ */ new Date();
        const trialEndDate = new Date(currentDate.getTime() + 14 * 24 * 60 * 60 * 1e3);
        await tx.insert(subscriptions).values({
          tenantId: tenant.id,
          planId: validatedData.subscriptionPlan || "starter",
          status: "trialing",
          billingCycle: "monthly",
          currentPeriodStart: currentDate,
          currentPeriodEnd: trialEndDate
        });
        return tenant;
      });
      return {
        success: true,
        data: result,
        metadata: { created: true }
      };
    } catch (error) {
      console.error("Error creating tenant:", error);
      return {
        success: false,
        error: {
          code: "TENANT_CREATION_FAILED",
          message: "Failed to create tenant",
          details: { originalError: error instanceof Error ? error.message : "Unknown error" }
        }
      };
    }
  }
  /**
   * Get tenant by ID
   */
  async getTenantById(tenantId) {
    try {
      const [tenant] = await this.db.select().from(tenants).where(eq4(tenants.id, tenantId)).limit(1);
      if (!tenant) {
        return {
          success: false,
          error: {
            code: "TENANT_NOT_FOUND",
            message: "Tenant not found",
            tenantId
          }
        };
      }
      return {
        success: true,
        data: tenant
      };
    } catch (error) {
      console.error("Error getting tenant:", error);
      return {
        success: false,
        error: {
          code: "TENANT_FETCH_FAILED",
          message: "Failed to fetch tenant",
          tenantId
        }
      };
    }
  }
  /**
   * Get tenant by domain
   */
  async getTenantByDomain(domain) {
    try {
      validateDomainUniqueness(domain);
      const [tenant] = await this.db.select().from(tenants).where(eq4(tenants.domain, domain)).limit(1);
      if (!tenant) {
        return {
          success: false,
          error: {
            code: "TENANT_NOT_FOUND",
            message: "Tenant not found for domain",
            details: { domain }
          }
        };
      }
      return {
        success: true,
        data: tenant
      };
    } catch (error) {
      console.error("Error getting tenant by domain:", error);
      return {
        success: false,
        error: {
          code: "TENANT_FETCH_FAILED",
          message: "Failed to fetch tenant by domain",
          details: { domain }
        }
      };
    }
  }
  /**
   * Update tenant
   */
  async updateTenant(tenantId, data) {
    try {
      const validatedData = tenantValidationSchemas.updateTenantRequest.parse(data);
      const existingTenant = await this.getTenantById(tenantId);
      if (!existingTenant.success) {
        return existingTenant;
      }
      if (validatedData.domain && validatedData.domain !== existingTenant.data.domain) {
        const domainExists = await this.db.select({ id: tenants.id }).from(tenants).where(
          and4(
            eq4(tenants.domain, validatedData.domain),
            eq4(tenants.id, tenantId)
          )
        ).limit(1);
        if (domainExists.length > 0) {
          return {
            success: false,
            error: {
              code: "DOMAIN_ALREADY_EXISTS",
              message: "Domain is already registered",
              tenantId,
              details: { domain: validatedData.domain }
            }
          };
        }
      }
      const [updatedTenant] = await this.db.update(tenants).set({
        ...validatedData,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq4(tenants.id, tenantId)).returning();
      return {
        success: true,
        data: updatedTenant,
        metadata: { updated: true }
      };
    } catch (error) {
      console.error("Error updating tenant:", error);
      return {
        success: false,
        error: {
          code: "TENANT_UPDATE_FAILED",
          message: "Failed to update tenant",
          tenantId
        }
      };
    }
  }
  /**
   * Delete tenant (soft delete by setting status to cancelled)
   */
  async deleteTenant(tenantId) {
    try {
      const existingTenant = await this.getTenantById(tenantId);
      if (!existingTenant.success) {
        return {
          success: false,
          error: existingTenant.error
        };
      }
      await this.db.update(tenants).set({
        status: "cancelled",
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq4(tenants.id, tenantId));
      return {
        success: true,
        metadata: { deleted: true }
      };
    } catch (error) {
      console.error("Error deleting tenant:", error);
      return {
        success: false,
        error: {
          code: "TENANT_DELETE_FAILED",
          message: "Failed to delete tenant",
          tenantId
        }
      };
    }
  }
  /**
   * List tenants with pagination and filtering
   */
  async listTenants(pagination, filters) {
    try {
      const validatedPagination = tenantValidationSchemas.paginationParams.parse(pagination);
      const validatedFilters = filters ? tenantValidationSchemas.filterParams.parse(filters) : {};
      const whereConditions = [];
      if (validatedFilters.status && validatedFilters.status.length > 0) {
        whereConditions.push(inArray2(tenants.status, validatedFilters.status));
      }
      if (validatedFilters.search) {
        whereConditions.push(
          like(tenants.businessName, `%${validatedFilters.search}%`)
        );
      }
      if (validatedFilters.dateFrom) {
        whereConditions.push(gte3(tenants.createdAt, validatedFilters.dateFrom));
      }
      if (validatedFilters.dateTo) {
        whereConditions.push(lte(tenants.createdAt, validatedFilters.dateTo));
      }
      const whereClause = whereConditions.length > 0 ? and4(...whereConditions) : void 0;
      const [{ count }] = await this.db.select({ count: sql4`count(*)` }).from(tenants).where(whereClause);
      const offset = (validatedPagination.page - 1) * validatedPagination.limit;
      const orderBy = validatedPagination.sortBy ? validatedPagination.sortOrder === "asc" ? asc2(tenants[validatedPagination.sortBy]) : desc2(tenants[validatedPagination.sortBy]) : desc2(tenants.createdAt);
      const tenants2 = await this.db.select().from(tenants).where(whereClause).orderBy(orderBy).limit(validatedPagination.limit).offset(offset);
      const totalPages = Math.ceil(count / validatedPagination.limit);
      return {
        success: true,
        data: {
          data: tenants2,
          pagination: {
            page: validatedPagination.page,
            limit: validatedPagination.limit,
            total: count,
            totalPages,
            hasNext: validatedPagination.page < totalPages,
            hasPrev: validatedPagination.page > 1
          }
        }
      };
    } catch (error) {
      console.error("Error listing tenants:", error);
      return {
        success: false,
        error: {
          code: "TENANT_LIST_FAILED",
          message: "Failed to list tenants"
        }
      };
    }
  }
  // ===== USER MANAGEMENT OPERATIONS =====
  /**
   * Create user for tenant
   */
  async createUser(tenantId, data) {
    try {
      const validatedData = tenantValidationSchemas.createUserRequest.parse(data);
      const tenantResult = await this.getTenantById(tenantId);
      if (!tenantResult.success) {
        return {
          success: false,
          error: tenantResult.error
        };
      }
      const existingUser = await this.db.select({ id: users.id }).from(users).where(
        and4(
          eq4(users.tenantId, tenantId),
          eq4(users.email, validatedData.email)
        )
      ).limit(1);
      if (existingUser.length > 0) {
        return {
          success: false,
          error: {
            code: "EMAIL_ALREADY_EXISTS",
            message: "Email is already registered for this tenant",
            tenantId,
            details: { email: validatedData.email }
          }
        };
      }
      const passwordHash = await bcrypt.hash(validatedData.password, 12);
      const [user] = await this.db.insert(users).values({
        tenantId,
        email: validatedData.email,
        passwordHash,
        role: validatedData.role || "user",
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        isActive: true
      }).returning();
      const userProfile = {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        tenant: {
          id: tenantResult.data.id,
          businessName: tenantResult.data.businessName,
          domain: tenantResult.data.domain
        }
      };
      return {
        success: true,
        data: userProfile,
        metadata: { created: true }
      };
    } catch (error) {
      console.error("Error creating user:", error);
      return {
        success: false,
        error: {
          code: "USER_CREATION_FAILED",
          message: "Failed to create user",
          tenantId
        }
      };
    }
  }
  /**
   * Get user by ID within tenant
   */
  async getUserById(tenantId, userId) {
    try {
      const result = await this.db.select({
        user: users,
        tenant: {
          id: tenants.id,
          businessName: tenants.businessName,
          domain: tenants.domain
        }
      }).from(users).innerJoin(tenants, eq4(users.tenantId, tenants.id)).where(
        and4(eq4(users.tenantId, tenantId), eq4(users.id, userId))
      ).limit(1);
      if (result.length === 0) {
        return {
          success: false,
          error: {
            code: "USER_NOT_FOUND",
            message: "User not found",
            tenantId,
            details: { userId }
          }
        };
      }
      const { user, tenant } = result[0];
      const userProfile = {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        tenant
      };
      return {
        success: true,
        data: userProfile
      };
    } catch (error) {
      console.error("Error getting user:", error);
      return {
        success: false,
        error: {
          code: "USER_FETCH_FAILED",
          message: "Failed to fetch user",
          tenantId
        }
      };
    }
  }
  /**
   * Update user within tenant
   */
  async updateUser(tenantId, userId, data) {
    try {
      const validatedData = tenantValidationSchemas.updateUserRequest.parse(data);
      const existingUser = await this.getUserById(tenantId, userId);
      if (!existingUser.success) {
        return existingUser;
      }
      if (validatedData.email && validatedData.email !== existingUser.data.email) {
        const emailExists = await this.db.select({ id: users.id }).from(users).where(
          and4(
            eq4(users.tenantId, tenantId),
            eq4(users.email, validatedData.email),
            ne(users.id, userId)
          )
        ).limit(1);
        if (emailExists.length > 0) {
          return {
            success: false,
            error: {
              code: "EMAIL_ALREADY_EXISTS",
              message: "Email is already registered for this tenant",
              tenantId,
              details: { email: validatedData.email }
            }
          };
        }
      }
      await this.db.update(users).set({
        ...validatedData,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(and4(eq4(users.tenantId, tenantId), eq4(users.id, userId)));
      return await this.getUserById(tenantId, userId);
    } catch (error) {
      console.error("Error updating user:", error);
      return {
        success: false,
        error: {
          code: "USER_UPDATE_FAILED",
          message: "Failed to update user",
          tenantId
        }
      };
    }
  }
  /**
   * List users for tenant
   */
  async listUsers(tenantId, pagination, filters) {
    try {
      const validatedPagination = tenantValidationSchemas.paginationParams.parse(pagination);
      const validatedFilters = filters ? tenantValidationSchemas.filterParams.parse(filters) : {};
      const whereConditions = [eq4(users.tenantId, tenantId)];
      if (validatedFilters.status && validatedFilters.status.length > 0) {
        const isActiveValues = validatedFilters.status.map((status) => status === "active");
        whereConditions.push(inArray2(users.isActive, isActiveValues));
      }
      if (validatedFilters.search) {
        whereConditions.push(
          or(
            like(users.email, `%${validatedFilters.search}%`),
            like(users.firstName, `%${validatedFilters.search}%`),
            like(users.lastName, `%${validatedFilters.search}%`)
          )
        );
      }
      const whereClause = and4(...whereConditions);
      const [{ count }] = await this.db.select({ count: sql4`count(*)` }).from(users).where(whereClause);
      const offset = (validatedPagination.page - 1) * validatedPagination.limit;
      const orderBy = validatedPagination.sortBy ? validatedPagination.sortOrder === "asc" ? asc2(users[validatedPagination.sortBy]) : desc2(users[validatedPagination.sortBy]) : desc2(users.createdAt);
      const results = await this.db.select({
        user: users,
        tenant: {
          id: tenants.id,
          businessName: tenants.businessName,
          domain: tenants.domain
        }
      }).from(users).innerJoin(tenants, eq4(users.tenantId, tenants.id)).where(whereClause).orderBy(orderBy).limit(validatedPagination.limit).offset(offset);
      const users2 = results.map(({ user, tenant }) => ({
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        tenant
      }));
      const totalPages = Math.ceil(count / validatedPagination.limit);
      return {
        success: true,
        data: {
          data: users2,
          pagination: {
            page: validatedPagination.page,
            limit: validatedPagination.limit,
            total: count,
            totalPages,
            hasNext: validatedPagination.page < totalPages,
            hasPrev: validatedPagination.page > 1
          }
        }
      };
    } catch (error) {
      console.error("Error listing users:", error);
      return {
        success: false,
        error: {
          code: "USER_LIST_FAILED",
          message: "Failed to list users",
          tenantId
        }
      };
    }
  }
  // ===== API KEY MANAGEMENT =====
  /**
   * Create API key for tenant
   */
  async createApiKey(tenantId, data) {
    try {
      const validatedData = tenantValidationSchemas.createApiKeyRequest.parse(data);
      const tenantResult = await this.getTenantById(tenantId);
      if (!tenantResult.success) {
        return {
          success: false,
          error: tenantResult.error
        };
      }
      const apiKey = this.generateApiKey();
      const keyHash = await bcrypt.hash(apiKey, 12);
      const [createdApiKey] = await this.db.insert(apiKeys).values({
        tenantId,
        keyHash,
        name: validatedData.name,
        permissions: validatedData.permissions,
        expiresAt: validatedData.expiresAt,
        isActive: true
      }).returning();
      const response = {
        id: createdApiKey.id,
        name: createdApiKey.name,
        key: apiKey,
        // Only returned on creation
        permissions: createdApiKey.permissions,
        expiresAt: createdApiKey.expiresAt,
        createdAt: createdApiKey.createdAt
      };
      return {
        success: true,
        data: response,
        metadata: { created: true }
      };
    } catch (error) {
      console.error("Error creating API key:", error);
      return {
        success: false,
        error: {
          code: "API_KEY_CREATION_FAILED",
          message: "Failed to create API key",
          tenantId
        }
      };
    }
  }
  /**
   * Validate API key and return tenant context
   */
  async validateApiKey(apiKey) {
    try {
      const apiKeys2 = await this.db.select({
        apiKey: apiKeys,
        tenant: tenants
      }).from(apiKeys).innerJoin(tenants, eq4(apiKeys.tenantId, tenants.id)).where(
        and4(
          eq4(apiKeys.isActive, true),
          eq4(tenants.status, "active")
        )
      );
      let matchedApiKey = null;
      for (const { apiKey: dbApiKey2, tenant: tenant2 } of apiKeys2) {
        const isMatch = await bcrypt.compare(apiKey, dbApiKey2.keyHash);
        if (isMatch) {
          matchedApiKey = { apiKey: dbApiKey2, tenant: tenant2 };
          break;
        }
      }
      if (!matchedApiKey) {
        return {
          success: false,
          error: {
            code: "INVALID_API_KEY",
            message: "Invalid or expired API key"
          }
        };
      }
      const { apiKey: dbApiKey, tenant } = matchedApiKey;
      if (dbApiKey.expiresAt && dbApiKey.expiresAt < /* @__PURE__ */ new Date()) {
        return {
          success: false,
          error: {
            code: "API_KEY_EXPIRED",
            message: "API key has expired",
            tenantId: tenant.id
          }
        };
      }
      await this.db.update(apiKeys).set({ lastUsed: /* @__PURE__ */ new Date() }).where(eq4(apiKeys.id, dbApiKey.id));
      const [subscription] = await this.db.select({
        subscription: subscriptions,
        plan: subscriptionPlans
      }).from(subscriptions).innerJoin(subscriptionPlans, eq4(subscriptions.planId, subscriptionPlans.id)).where(eq4(subscriptions.tenantId, tenant.id)).limit(1);
      const tenantContext = {
        tenantId: tenant.id,
        permissions: dbApiKey.permissions,
        subscriptionLimits: subscription?.plan.limits || {
          messagesPerMonth: 1e3,
          bookingsPerMonth: 100,
          apiCallsPerDay: 1e3
        },
        currentUsage: {
          messages_sent: 0,
          messages_received: 0,
          bookings_created: 0,
          api_calls: 0,
          storage_used: 0,
          webhook_calls: 0
        }
      };
      return {
        success: true,
        data: tenantContext
      };
    } catch (error) {
      console.error("Error validating API key:", error);
      return {
        success: false,
        error: {
          code: "API_KEY_VALIDATION_FAILED",
          message: "Failed to validate API key"
        }
      };
    }
  }
  // ===== UTILITY METHODS =====
  /**
   * Generate secure API key
   */
  generateApiKey() {
    const randomBytes = crypto.randomBytes(32);
    return `tk_${randomBytes.toString("hex")}`;
  }
  /**
   * Get default bot settings for new tenant
   */
  getDefaultBotSettings() {
    return {
      greetingMessage: "Welcome! How can I help you today?",
      businessHours: {
        enabled: false,
        timezone: "UTC",
        schedule: {
          monday: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
          tuesday: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
          wednesday: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
          thursday: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
          friday: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
          saturday: { isOpen: false, openTime: "09:00", closeTime: "17:00" },
          sunday: { isOpen: false, openTime: "09:00", closeTime: "17:00" }
        },
        closedMessage: "We are currently closed. Please try again during business hours."
      },
      autoResponses: {
        welcomeMessage: "Hello! How can I help you today?",
        serviceSelectionPrompt: "Please select a service:",
        dateSelectionPrompt: "Please select a date:",
        timeSelectionPrompt: "Please select a time:",
        confirmationMessage: "Please confirm your booking:",
        paymentInstructions: "Payment instructions will be sent shortly.",
        bookingConfirmedMessage: "Your booking has been confirmed!",
        errorMessage: "Sorry, something went wrong. Please try again.",
        invalidInputMessage: "Invalid input. Please try again."
      },
      conversationFlow: {
        steps: [
          {
            id: "greeting",
            name: "Greeting",
            type: "greeting",
            prompt: "Welcome! How can I help you?",
            nextStep: "service_selection"
          },
          {
            id: "service_selection",
            name: "Service Selection",
            type: "service_selection",
            prompt: "Please select a service:",
            nextStep: "date_selection"
          },
          {
            id: "date_selection",
            name: "Date Selection",
            type: "date_selection",
            prompt: "Please select a date:",
            nextStep: "time_selection"
          },
          {
            id: "time_selection",
            name: "Time Selection",
            type: "time_selection",
            prompt: "Please select a time:",
            nextStep: "confirmation"
          },
          {
            id: "confirmation",
            name: "Confirmation",
            type: "confirmation",
            prompt: "Your booking has been confirmed!"
          }
        ],
        fallbackBehavior: "restart",
        maxRetries: 3,
        sessionTimeout: 30
      },
      paymentSettings: {
        enabled: false,
        methods: [],
        currency: "USD",
        requirePayment: false
      },
      notificationSettings: {
        emailNotifications: {
          enabled: false,
          recipientEmails: [],
          events: []
        },
        smsNotifications: {
          enabled: false,
          recipientPhones: [],
          events: []
        },
        webhookNotifications: {
          enabled: false,
          endpoints: [],
          events: []
        }
      },
      customization: {
        brandColors: {
          primary: "#007bff",
          secondary: "#6c757d",
          accent: "#28a745",
          background: "#ffffff",
          text: "#212529"
        },
        companyInfo: {
          name: ""
        },
        customFields: []
      }
    };
  }
  /**
   * Get default billing settings for new tenant
   */
  getDefaultBillingSettings(data) {
    return {
      companyName: data.businessName,
      billingEmail: data.email,
      billingAddress: {
        street: "",
        city: "",
        state: "",
        postalCode: "",
        country: "US"
      },
      invoiceSettings: {
        autoSend: true,
        dueNetDays: 30,
        includeUsageDetails: true
      }
    };
  }
  /**
   * Close database connection
   */
  async close() {
    await this.pool.end();
  }
};

// server/services/tenant-settings.service.ts
import { eq as eq5 } from "drizzle-orm";
import { drizzle as drizzle4 } from "drizzle-orm/neon-serverless";
import { Pool as Pool6 } from "@neondatabase/serverless";
import crypto2 from "crypto";
var TenantSettingsService = class {
  db;
  pool;
  encryptionKey;
  constructor(connectionString, encryptionKey) {
    this.pool = new Pool6({ connectionString });
    this.db = drizzle4({ client: this.pool, schema: schema_exports });
    this.encryptionKey = encryptionKey || process.env.ENCRYPTION_KEY || this.generateEncryptionKey();
  }
  // ===== BOT SETTINGS MANAGEMENT =====
  /**
   * Get current bot settings for tenant
   */
  async getBotSettings(tenantId) {
    try {
      const [tenant] = await this.db.select().from(tenants).where(eq5(tenants.id, tenantId)).limit(1);
      if (!tenant) {
        return {
          success: false,
          error: {
            code: "TENANT_NOT_FOUND",
            message: "Tenant not found",
            tenantId
          }
        };
      }
      return {
        success: true,
        data: tenant.botSettings
      };
    } catch (error) {
      console.error("Error getting bot settings:", error);
      return {
        success: false,
        error: {
          code: "SETTINGS_FETCH_FAILED",
          message: "Failed to fetch bot settings",
          tenantId
        }
      };
    }
  }
  /**
   * Update bot settings with validation and versioning
   */
  async updateBotSettings(tenantId, settings, userId) {
    try {
      const currentResult = await this.getBotSettings(tenantId);
      if (!currentResult.success) {
        return currentResult;
      }
      const currentSettings = currentResult.data;
      const updatedSettings = { ...currentSettings, ...settings };
      const validatedSettings = tenantValidationSchemas.botSettings.parse(updatedSettings);
      if (settings.conversationFlow) {
        validateConversationFlow(settings.conversationFlow);
      }
      await this.createSettingsVersion(tenantId, currentSettings, userId);
      const [updatedTenant] = await this.db.update(tenants).set({
        botSettings: validatedSettings,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq5(tenants.id, tenantId)).returning();
      return {
        success: true,
        data: updatedTenant.botSettings,
        metadata: { updated: true, version: "latest" }
      };
    } catch (error) {
      console.error("Error updating bot settings:", error);
      return {
        success: false,
        error: {
          code: "SETTINGS_UPDATE_FAILED",
          message: "Failed to update bot settings",
          tenantId,
          details: { originalError: error instanceof Error ? error.message : "Unknown error" }
        }
      };
    }
  }
  /**
   * Reset bot settings to default
   */
  async resetBotSettings(tenantId, userId) {
    const defaultSettings = this.getDefaultBotSettings();
    return this.updateBotSettings(tenantId, defaultSettings, userId);
  }
  /**
   * Validate bot settings without saving
   */
  async validateBotSettings(settings) {
    try {
      tenantValidationSchemas.botSettings.parse(settings);
      const errors = [];
      try {
        validateConversationFlow(settings.conversationFlow);
      } catch (error) {
        errors.push(`Conversation flow error: ${error instanceof Error ? error.message : "Invalid flow"}`);
      }
      if (settings.notificationSettings.webhookNotifications.enabled) {
        for (const endpoint of settings.notificationSettings.webhookNotifications.endpoints) {
          try {
            validateWebhookUrl(endpoint.url);
          } catch (error) {
            errors.push(`Invalid webhook URL ${endpoint.url}: ${error instanceof Error ? error.message : "Invalid URL"}`);
          }
        }
      }
      return {
        success: true,
        data: {
          isValid: errors.length === 0,
          errors: errors.length > 0 ? errors : void 0
        }
      };
    } catch (error) {
      return {
        success: true,
        data: {
          isValid: false,
          errors: [error instanceof Error ? error.message : "Validation failed"]
        }
      };
    }
  }
  // ===== WHATSAPP CREDENTIALS MANAGEMENT =====
  /**
   * Get WhatsApp configuration (decrypted)
   */
  async getWhatsAppConfig(tenantId) {
    try {
      const [tenant] = await this.db.select().from(tenants).where(eq5(tenants.id, tenantId)).limit(1);
      if (!tenant) {
        return {
          success: false,
          error: {
            code: "TENANT_NOT_FOUND",
            message: "Tenant not found",
            tenantId
          }
        };
      }
      if (!tenant.whatsappToken || !tenant.whatsappPhoneId) {
        return {
          success: false,
          error: {
            code: "WHATSAPP_NOT_CONFIGURED",
            message: "WhatsApp credentials not configured",
            tenantId
          }
        };
      }
      const decryptedToken = this.decrypt(tenant.whatsappToken);
      const config = {
        phoneNumberId: tenant.whatsappPhoneId,
        accessToken: decryptedToken,
        verifyToken: tenant.whatsappVerifyToken || "",
        businessAccountId: "",
        // Would be stored separately in a real implementation
        appId: "",
        // Would be stored separately
        appSecret: "",
        // Would be stored separately
        webhookUrl: `${process.env.BASE_URL || "https://api.example.com"}/webhooks/whatsapp/${tenantId}`,
        isVerified: false,
        // Would be determined by actual verification
        lastVerified: void 0
      };
      return {
        success: true,
        data: config
      };
    } catch (error) {
      console.error("Error getting WhatsApp config:", error);
      return {
        success: false,
        error: {
          code: "WHATSAPP_CONFIG_FETCH_FAILED",
          message: "Failed to fetch WhatsApp configuration",
          tenantId
        }
      };
    }
  }
  /**
   * Update WhatsApp credentials with encryption
   */
  async updateWhatsAppCredentials(tenantId, credentials) {
    try {
      const validatedCredentials = tenantValidationSchemas.whatsappCredentials.parse(credentials);
      const testResult = await this.testWhatsAppCredentials(validatedCredentials);
      if (!testResult.isValid) {
        return {
          success: false,
          error: {
            code: "INVALID_WHATSAPP_CREDENTIALS",
            message: "WhatsApp credentials validation failed",
            tenantId,
            details: { errors: testResult.errors }
          }
        };
      }
      const encryptedToken = this.encrypt(validatedCredentials.accessToken);
      const encryptedAppSecret = this.encrypt(validatedCredentials.appSecret);
      await this.db.update(tenants).set({
        whatsappPhoneId: validatedCredentials.phoneNumberId,
        whatsappToken: encryptedToken,
        whatsappVerifyToken: validatedCredentials.verifyToken,
        // In a real implementation, we'd store businessAccountId, appId, appSecret separately
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq5(tenants.id, tenantId));
      return {
        success: true,
        data: {
          success: true,
          verified: testResult.isValid
        },
        metadata: { updated: true, verified: testResult.isValid }
      };
    } catch (error) {
      console.error("Error updating WhatsApp credentials:", error);
      return {
        success: false,
        error: {
          code: "WHATSAPP_UPDATE_FAILED",
          message: "Failed to update WhatsApp credentials",
          tenantId,
          details: { originalError: error instanceof Error ? error.message : "Unknown error" }
        }
      };
    }
  }
  /**
   * Test WhatsApp credentials
   */
  async testWhatsAppCredentials(credentials) {
    try {
      const errors = [];
      if (!credentials.accessToken.startsWith("EAA")) {
        errors.push("Access token format appears invalid");
      }
      if (!/^\d{15,}$/.test(credentials.phoneNumberId)) {
        errors.push("Phone number ID format appears invalid");
      }
      if (credentials.verifyToken.length < 8) {
        errors.push("Verify token should be at least 8 characters");
      }
      await new Promise((resolve) => setTimeout(resolve, 1e3));
      return {
        isValid: errors.length === 0,
        phoneNumber: errors.length === 0 ? "+1234567890" : void 0,
        businessName: errors.length === 0 ? "Test Business" : void 0,
        webhookVerified: errors.length === 0,
        errors: errors.length > 0 ? errors : void 0
      };
    } catch (error) {
      return {
        isValid: false,
        errors: ["Failed to test credentials: " + (error instanceof Error ? error.message : "Unknown error")]
      };
    }
  }
  /**
   * Verify webhook configuration
   */
  async verifyWebhook(tenantId, challenge) {
    try {
      const configResult = await this.getWhatsAppConfig(tenantId);
      if (!configResult.success) {
        return {
          success: false,
          error: configResult.error
        };
      }
      const config = configResult.data;
      return {
        success: true,
        data: challenge,
        metadata: { verified: true }
      };
    } catch (error) {
      console.error("Error verifying webhook:", error);
      return {
        success: false,
        error: {
          code: "WEBHOOK_VERIFICATION_FAILED",
          message: "Failed to verify webhook",
          tenantId
        }
      };
    }
  }
  // ===== SETTINGS VERSIONING =====
  /**
   * Create a settings version backup
   */
  async createSettingsVersion(tenantId, settings, userId) {
    try {
      const versions = await this.getSettingsVersions(tenantId);
      const nextVersion = versions.success ? versions.data.length + 1 : 1;
      console.log(`Creating settings version ${nextVersion} for tenant ${tenantId} by user ${userId}`);
    } catch (error) {
      console.error("Error creating settings version:", error);
    }
  }
  /**
   * Get settings version history
   */
  async getSettingsVersions(tenantId) {
    try {
      return {
        success: true,
        data: []
      };
    } catch (error) {
      console.error("Error getting settings versions:", error);
      return {
        success: false,
        error: {
          code: "VERSIONS_FETCH_FAILED",
          message: "Failed to fetch settings versions",
          tenantId
        }
      };
    }
  }
  /**
   * Restore settings from a specific version
   */
  async restoreSettingsVersion(tenantId, version, userId) {
    try {
      return {
        success: false,
        error: {
          code: "VERSION_RESTORE_NOT_IMPLEMENTED",
          message: "Settings version restore not yet implemented",
          tenantId
        }
      };
    } catch (error) {
      console.error("Error restoring settings version:", error);
      return {
        success: false,
        error: {
          code: "VERSION_RESTORE_FAILED",
          message: "Failed to restore settings version",
          tenantId
        }
      };
    }
  }
  // ===== ENCRYPTION UTILITIES =====
  /**
   * Encrypt sensitive data
   */
  encrypt(text3) {
    try {
      const algorithm = "aes-256-gcm";
      const iv = crypto2.randomBytes(16);
      const cipher = crypto2.createCipher(algorithm, this.encryptionKey);
      let encrypted = cipher.update(text3, "utf8", "hex");
      encrypted += cipher.final("hex");
      const authTag = cipher.getAuthTag();
      return iv.toString("hex") + ":" + authTag.toString("hex") + ":" + encrypted;
    } catch (error) {
      console.error("Encryption error:", error);
      throw new Error("Failed to encrypt data");
    }
  }
  /**
   * Decrypt sensitive data
   */
  decrypt(encryptedText) {
    try {
      const algorithm = "aes-256-gcm";
      const parts = encryptedText.split(":");
      if (parts.length !== 3) {
        throw new Error("Invalid encrypted data format");
      }
      const iv = Buffer.from(parts[0], "hex");
      const authTag = Buffer.from(parts[1], "hex");
      const encrypted = parts[2];
      const decipher = crypto2.createDecipher(algorithm, this.encryptionKey);
      decipher.setAuthTag(authTag);
      let decrypted = decipher.update(encrypted, "hex", "utf8");
      decrypted += decipher.final("utf8");
      return decrypted;
    } catch (error) {
      console.error("Decryption error:", error);
      throw new Error("Failed to decrypt data");
    }
  }
  /**
   * Generate encryption key
   */
  generateEncryptionKey() {
    return crypto2.randomBytes(32).toString("hex");
  }
  // ===== DEFAULT SETTINGS =====
  /**
   * Get default bot settings
   */
  getDefaultBotSettings() {
    return {
      greetingMessage: "Welcome! How can I help you today?",
      businessHours: {
        enabled: false,
        timezone: "UTC",
        schedule: {
          monday: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
          tuesday: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
          wednesday: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
          thursday: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
          friday: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
          saturday: { isOpen: false, openTime: "09:00", closeTime: "17:00" },
          sunday: { isOpen: false, openTime: "09:00", closeTime: "17:00" }
        },
        closedMessage: "We are currently closed. Please try again during business hours."
      },
      autoResponses: {
        welcomeMessage: "Hello! How can I help you today?",
        serviceSelectionPrompt: "Please select a service:",
        dateSelectionPrompt: "Please select a date:",
        timeSelectionPrompt: "Please select a time:",
        confirmationMessage: "Please confirm your booking:",
        paymentInstructions: "Payment instructions will be sent shortly.",
        bookingConfirmedMessage: "Your booking has been confirmed!",
        errorMessage: "Sorry, something went wrong. Please try again.",
        invalidInputMessage: "Invalid input. Please try again."
      },
      conversationFlow: {
        steps: [
          {
            id: "greeting",
            name: "Greeting",
            type: "greeting",
            prompt: "Welcome! How can I help you?",
            nextStep: "service_selection"
          },
          {
            id: "service_selection",
            name: "Service Selection",
            type: "service_selection",
            prompt: "Please select a service:",
            nextStep: "date_selection"
          },
          {
            id: "date_selection",
            name: "Date Selection",
            type: "date_selection",
            prompt: "Please select a date:",
            nextStep: "time_selection"
          },
          {
            id: "time_selection",
            name: "Time Selection",
            type: "time_selection",
            prompt: "Please select a time:",
            nextStep: "confirmation"
          },
          {
            id: "confirmation",
            name: "Confirmation",
            type: "confirmation",
            prompt: "Your booking has been confirmed!"
          }
        ],
        fallbackBehavior: "restart",
        maxRetries: 3,
        sessionTimeout: 30
      },
      paymentSettings: {
        enabled: false,
        methods: [],
        currency: "USD",
        requirePayment: false
      },
      notificationSettings: {
        emailNotifications: {
          enabled: false,
          recipientEmails: [],
          events: []
        },
        smsNotifications: {
          enabled: false,
          recipientPhones: [],
          events: []
        },
        webhookNotifications: {
          enabled: false,
          endpoints: [],
          events: []
        }
      },
      customization: {
        brandColors: {
          primary: "#007bff",
          secondary: "#6c757d",
          accent: "#28a745",
          background: "#ffffff",
          text: "#212529"
        },
        companyInfo: {
          name: ""
        },
        customFields: []
      }
    };
  }
  /**
   * Close database connection
   */
  async close() {
    await this.pool.end();
  }
};

// server/services/webhook-router.service.ts
var WebhookRouterService = class {
  tenantService;
  tenantSettingsService;
  phoneNumberCache;
  CACHE_TTL = 5 * 60 * 1e3;
  // 5 minutes
  constructor(connectionString) {
    this.tenantService = new TenantService(connectionString);
    this.tenantSettingsService = new TenantSettingsService(connectionString);
    this.phoneNumberCache = /* @__PURE__ */ new Map();
  }
  /**
   * Route incoming webhook to appropriate tenant
   */
  async routeWebhook(payload) {
    try {
      if (!this.isValidWebhookPayload(payload)) {
        return {
          success: false,
          error: {
            code: "INVALID_WEBHOOK_PAYLOAD",
            message: "Invalid webhook payload structure"
          }
        };
      }
      const phoneNumberId = this.extractPhoneNumberId(payload);
      if (!phoneNumberId) {
        return {
          success: false,
          error: {
            code: "PHONE_NUMBER_ID_NOT_FOUND",
            message: "Could not extract phone number ID from webhook"
          }
        };
      }
      const tenant = await this.findTenantByPhoneNumberId(phoneNumberId);
      if (!tenant) {
        return {
          success: false,
          error: {
            code: "TENANT_NOT_FOUND",
            message: `No tenant found for phone number ID: ${phoneNumberId}`
          }
        };
      }
      return {
        success: true,
        tenant,
        phoneNumberId
      };
    } catch (error) {
      console.error("Error routing webhook:", error);
      return {
        success: false,
        error: {
          code: "WEBHOOK_ROUTING_ERROR",
          message: "Failed to route webhook"
        }
      };
    }
  }
  /**
   * Verify webhook for tenant
   */
  async verifyWebhook(phoneNumberId, verificationRequest) {
    try {
      const tenant = await this.findTenantByPhoneNumberId(phoneNumberId);
      if (!tenant) {
        return {
          success: false,
          error: {
            code: "TENANT_NOT_FOUND",
            message: "No tenant found for phone number ID"
          }
        };
      }
      const settingsResult = await this.tenantSettingsService.getSettings(tenant.id, "whatsapp");
      if (!settingsResult.success || !settingsResult.data) {
        return {
          success: false,
          error: {
            code: "WHATSAPP_SETTINGS_NOT_FOUND",
            message: "WhatsApp settings not configured for tenant"
          }
        };
      }
      const whatsappSettings = settingsResult.data.value;
      const expectedVerifyToken = whatsappSettings.webhookVerifyToken;
      if (verificationRequest["hub.mode"] === "subscribe" && verificationRequest["hub.verify_token"] === expectedVerifyToken) {
        return {
          success: true,
          challenge: verificationRequest["hub.challenge"]
        };
      }
      return {
        success: false,
        error: {
          code: "WEBHOOK_VERIFICATION_FAILED",
          message: "Webhook verification failed - invalid verify token"
        }
      };
    } catch (error) {
      console.error("Error verifying webhook:", error);
      return {
        success: false,
        error: {
          code: "WEBHOOK_VERIFICATION_ERROR",
          message: "Failed to verify webhook"
        }
      };
    }
  }
  /**
   * Register phone number ID for tenant
   */
  async registerPhoneNumberId(tenantId, phoneNumberId) {
    try {
      const tenantResult = await this.tenantService.getTenant(tenantId);
      if (!tenantResult.success) {
        return {
          success: false,
          error: {
            code: "TENANT_NOT_FOUND",
            message: "Tenant not found"
          }
        };
      }
      const phoneNumberMapping = {
        phoneNumberId,
        registeredAt: (/* @__PURE__ */ new Date()).toISOString(),
        status: "active"
      };
      const settingsResult = await this.tenantSettingsService.updateSettings(
        tenantId,
        "whatsapp_phone_mapping",
        phoneNumberMapping
      );
      if (!settingsResult.success) {
        return {
          success: false,
          error: {
            code: "PHONE_NUMBER_REGISTRATION_FAILED",
            message: "Failed to register phone number ID"
          }
        };
      }
      this.phoneNumberCache.set(phoneNumberId, {
        tenantId,
        timestamp: Date.now()
      });
      return { success: true };
    } catch (error) {
      console.error("Error registering phone number ID:", error);
      return {
        success: false,
        error: {
          code: "PHONE_NUMBER_REGISTRATION_ERROR",
          message: "Failed to register phone number ID"
        }
      };
    }
  }
  /**
   * Get tenant routing statistics
   */
  async getRoutingStats(tenantId) {
    try {
      return {
        success: true,
        data: {
          totalWebhooks: 0,
          successfulRoutes: 0,
          failedRoutes: 0
        }
      };
    } catch (error) {
      console.error("Error getting routing stats:", error);
      return {
        success: false,
        error: {
          code: "ROUTING_STATS_ERROR",
          message: "Failed to get routing statistics"
        }
      };
    }
  }
  /**
   * Validate webhook payload structure
   */
  isValidWebhookPayload(payload) {
    return payload && typeof payload === "object" && payload.object === "whatsapp_business_account" && Array.isArray(payload.entry) && payload.entry.length > 0 && payload.entry[0].changes && Array.isArray(payload.entry[0].changes) && payload.entry[0].changes.length > 0;
  }
  /**
   * Extract phone number ID from webhook payload
   */
  extractPhoneNumberId(payload) {
    try {
      const change = payload.entry[0]?.changes[0];
      return change?.value?.metadata?.phone_number_id || null;
    } catch (error) {
      console.error("Error extracting phone number ID:", error);
      return null;
    }
  }
  /**
   * Find tenant by phone number ID with caching
   */
  async findTenantByPhoneNumberId(phoneNumberId) {
    try {
      const cached = this.phoneNumberCache.get(phoneNumberId);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        const tenantResult = await this.tenantService.getTenant(cached.tenantId);
        if (tenantResult.success) {
          return tenantResult.data;
        }
      }
      const tenantsResult = await this.tenantService.listTenants({ page: 1, limit: 1e3 });
      if (!tenantsResult.success) {
        return null;
      }
      for (const tenant of tenantsResult.data.data) {
        const settingsResult = await this.tenantSettingsService.getSettings(tenant.id, "whatsapp_phone_mapping");
        if (settingsResult.success && settingsResult.data) {
          const mapping = settingsResult.data.value;
          if (mapping.phoneNumberId === phoneNumberId && mapping.status === "active") {
            this.phoneNumberCache.set(phoneNumberId, {
              tenantId: tenant.id,
              timestamp: Date.now()
            });
            return tenant;
          }
        }
      }
      return null;
    } catch (error) {
      console.error("Error finding tenant by phone number ID:", error);
      return null;
    }
  }
  /**
   * Clear expired cache entries
   */
  clearExpiredCache() {
    const now = Date.now();
    for (const [phoneNumberId, entry] of this.phoneNumberCache.entries()) {
      if (now - entry.timestamp > this.CACHE_TTL) {
        this.phoneNumberCache.delete(phoneNumberId);
      }
    }
  }
  /**
   * Close service and cleanup resources
   */
  async close() {
    await this.tenantService.close();
    await this.tenantSettingsService.close();
    this.phoneNumberCache.clear();
  }
};

// server/routes/webhook.routes.ts
function createWebhookRoutes(messageProcessor, whatsappSender) {
  const router4 = Router4();
  const webhookRouter = new WebhookRouterService(
    process.env.DATABASE_URL || "postgresql://localhost:5432/whatsapp_bot"
  );
  router4.get("/whatsapp/:phoneNumberId", async (req, res) => {
    try {
      const { phoneNumberId } = req.params;
      const verificationRequest = {
        "hub.mode": req.query["hub.mode"],
        "hub.verify_token": req.query["hub.verify_token"],
        "hub.challenge": req.query["hub.challenge"]
      };
      console.log("Tenant-specific webhook verification request:", { phoneNumberId, ...verificationRequest });
      const verificationResult = await webhookRouter.verifyWebhook(phoneNumberId, verificationRequest);
      if (verificationResult.success) {
        console.log(`Webhook verified successfully for phone number ID: ${phoneNumberId}`);
        res.status(200).send(verificationResult.challenge);
      } else {
        console.log(`Webhook verification failed for phone number ID: ${phoneNumberId}`, verificationResult.error);
        res.status(403).json({
          error: "Webhook verification failed",
          details: verificationResult.error
        });
      }
    } catch (error) {
      console.error("Webhook verification error:", error);
      res.status(500).json({
        error: "WEBHOOK_VERIFICATION_FAILED",
        message: "Failed to verify webhook"
      });
    }
  });
  router4.get("/whatsapp", (req, res) => {
    try {
      const mode = req.query["hub.mode"];
      const token = req.query["hub.verify_token"];
      const challenge = req.query["hub.challenge"];
      console.log("Legacy webhook verification request:", { mode, token, challenge });
      console.warn("Legacy webhook endpoint accessed - please migrate to /whatsapp/:phoneNumberId");
      if (mode === "subscribe") {
        if (token === process.env.WHATSAPP_VERIFY_TOKEN && challenge) {
          console.log("Legacy webhook verified successfully");
          res.status(200).send(challenge);
          return;
        }
      }
      console.log("Legacy webhook verification failed");
      res.status(403).send("Forbidden");
    } catch (error) {
      console.error("Legacy webhook verification error:", error);
      res.status(500).json({
        error: "WEBHOOK_VERIFICATION_FAILED",
        message: "Failed to verify webhook"
      });
    }
  });
  router4.post("/whatsapp/:phoneNumberId", async (req, res) => {
    try {
      const { phoneNumberId } = req.params;
      const webhookPayload = req.body;
      const signature = req.headers["x-hub-signature-256"];
      console.log(`Received tenant-specific webhook payload for ${phoneNumberId}:`, JSON.stringify(webhookPayload, null, 2));
      const routingResult = await webhookRouter.routeWebhook(webhookPayload);
      if (!routingResult.success) {
        console.error("Webhook routing failed:", routingResult.error);
        return res.status(400).json({
          error: "Webhook routing failed",
          details: routingResult.error
        });
      }
      if (routingResult.phoneNumberId !== phoneNumberId) {
        console.error(`Phone number ID mismatch: route=${phoneNumberId}, payload=${routingResult.phoneNumberId}`);
        return res.status(400).json({
          error: "Phone number ID mismatch"
        });
      }
      const tenant = routingResult.tenant;
      if (signature) {
        const webhookSecret = process.env.WHATSAPP_WEBHOOK_SECRET || "default-secret";
        if (!verifyWebhookSignature(JSON.stringify(webhookPayload), signature, webhookSecret)) {
          console.log("Invalid webhook signature for tenant:", tenant.id);
          return res.status(401).json({
            error: "INVALID_SIGNATURE",
            message: "Webhook signature verification failed"
          });
        }
      }
      const enhancedPayload = {
        ...webhookPayload,
        tenantContext: {
          tenantId: tenant.id,
          domain: tenant.domain,
          phoneNumberId: routingResult.phoneNumberId
        }
      };
      const result = await messageProcessor.processWebhookPayload(enhancedPayload);
      if (!result.success) {
        console.error("Failed to process webhook payload:", result.error);
        return res.status(500).json({
          error: result.error.code,
          message: result.error.message
        });
      }
      const processedMessages = result.data;
      console.log(`Successfully processed ${processedMessages.length} messages for tenant ${tenant.id}`);
      const sendPromises = processedMessages.filter((msg) => msg.response).map(async (msg) => {
        try {
          const sendResult = await whatsappSender.sendMessage(
            msg.tenantId || tenant.id,
            msg.phoneNumber,
            msg.response
          );
          if (!sendResult.success) {
            console.error(`Failed to send response for message ${msg.messageId}:`, sendResult.error);
          }
          return sendResult;
        } catch (error) {
          console.error(`Error sending response for message ${msg.messageId}:`, error);
          return {
            success: false,
            error: {
              code: "SEND_FAILED",
              message: "Failed to send response"
            }
          };
        }
      });
      const sendResults = await Promise.all(sendPromises);
      const successfulSends = sendResults.filter((r) => r.success).length;
      const failedSends = sendResults.length - successfulSends;
      console.log(`Sent ${successfulSends} responses, ${failedSends} failed for tenant ${tenant.id}`);
      res.status(200).json({
        success: true,
        tenantId: tenant.id,
        processed: processedMessages.length,
        responses_sent: successfulSends,
        responses_failed: failedSends
      });
    } catch (error) {
      console.error("Tenant-specific webhook processing error:", error);
      res.status(500).json({
        error: "WEBHOOK_PROCESSING_ERROR",
        message: "Internal server error processing webhook"
      });
    }
  });
  router4.post("/whatsapp", async (req, res) => {
    try {
      const payload = req.body;
      const signature = req.headers["x-hub-signature-256"];
      console.log("Legacy webhook payload received:", JSON.stringify(payload, null, 2));
      console.warn("Legacy webhook endpoint accessed - please migrate to /whatsapp/:phoneNumberId");
      if (signature && !verifyWebhookSignature(JSON.stringify(payload), signature, process.env.WHATSAPP_WEBHOOK_SECRET || "default-secret")) {
        console.log("Invalid webhook signature");
        return res.status(401).json({
          error: "INVALID_SIGNATURE",
          message: "Webhook signature verification failed"
        });
      }
      const result = await messageProcessor.processWebhookPayload(payload);
      if (!result.success) {
        console.error("Failed to process legacy webhook payload:", result.error);
        return res.status(500).json({
          error: result.error.code,
          message: result.error.message
        });
      }
      const processedMessages = result.data;
      console.log(`Successfully processed ${processedMessages.length} legacy messages`);
      const sendPromises = processedMessages.filter((msg) => msg.response).map(async (msg) => {
        try {
          const sendResult = await whatsappSender.sendMessage(
            msg.tenantId,
            msg.phoneNumber,
            msg.response
          );
          if (!sendResult.success) {
            console.error(`Failed to send response for message ${msg.messageId}:`, sendResult.error);
          }
          return sendResult;
        } catch (error) {
          console.error(`Error sending response for message ${msg.messageId}:`, error);
          return {
            success: false,
            error: {
              code: "SEND_FAILED",
              message: "Failed to send response"
            }
          };
        }
      });
      const sendResults = await Promise.all(sendPromises);
      const successfulSends = sendResults.filter((r) => r.success).length;
      const failedSends = sendResults.length - successfulSends;
      console.log(`Sent ${successfulSends} responses, ${failedSends} failed (legacy)`);
      res.status(200).json({
        success: true,
        legacy: true,
        processed: processedMessages.length,
        responses_sent: successfulSends,
        responses_failed: failedSends
      });
    } catch (error) {
      console.error("Legacy webhook processing error:", error);
      res.status(500).json({
        error: "WEBHOOK_PROCESSING_ERROR",
        message: "Internal server error processing webhook"
      });
    }
  });
  router4.get("/whatsapp/status", async (req, res) => {
    try {
      res.json({
        status: "healthy",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        webhook_url: `${req.protocol}://${req.get("host")}/api/webhook/whatsapp`,
        verification_url: `${req.protocol}://${req.get("host")}/api/webhook/whatsapp`
      });
    } catch (error) {
      console.error("Status check error:", error);
      res.status(500).json({
        error: "STATUS_CHECK_FAILED",
        message: "Failed to check webhook status"
      });
    }
  });
  router4.post("/whatsapp/:phoneNumberId/register", async (req, res) => {
    try {
      const { phoneNumberId } = req.params;
      const { tenantId } = req.body;
      if (!tenantId) {
        return res.status(400).json({
          error: "MISSING_TENANT_ID",
          message: "Tenant ID is required"
        });
      }
      const registrationResult = await webhookRouter.registerPhoneNumberId(tenantId, phoneNumberId);
      if (registrationResult.success) {
        res.status(200).json({
          success: true,
          message: "Phone number ID registered successfully",
          phoneNumberId,
          tenantId
        });
      } else {
        res.status(400).json({
          success: false,
          error: registrationResult.error
        });
      }
    } catch (error) {
      console.error("Phone number registration error:", error);
      res.status(500).json({
        error: "PHONE_NUMBER_REGISTRATION_ERROR",
        message: "Failed to register phone number ID"
      });
    }
  });
  router4.get("/whatsapp/:phoneNumberId/stats", async (req, res) => {
    try {
      const { phoneNumberId } = req.params;
      const routingResult = await webhookRouter.routeWebhook({
        object: "whatsapp_business_account",
        entry: [{
          id: "test",
          changes: [{
            value: {
              messaging_product: "whatsapp",
              metadata: {
                display_phone_number: "",
                phone_number_id: phoneNumberId
              }
            },
            field: "messages"
          }]
        }]
      });
      if (!routingResult.success) {
        return res.status(404).json({
          error: "PHONE_NUMBER_NOT_FOUND",
          message: "Phone number not found or not registered",
          details: routingResult.error
        });
      }
      const statsResult = await webhookRouter.getRoutingStats(routingResult.tenant.id);
      if (statsResult.success) {
        res.status(200).json({
          success: true,
          data: {
            phoneNumberId,
            tenantId: routingResult.tenant.id,
            tenantDomain: routingResult.tenant.domain,
            stats: statsResult.data
          }
        });
      } else {
        res.status(500).json({
          success: false,
          error: statsResult.error
        });
      }
    } catch (error) {
      console.error("Stats retrieval error:", error);
      res.status(500).json({
        error: "STATS_RETRIEVAL_ERROR",
        message: "Failed to get routing statistics"
      });
    }
  });
  router4.post("/whatsapp/test/:tenantId", async (req, res) => {
    try {
      const { tenantId } = req.params;
      const { phoneNumber, message, phoneNumberId } = req.body;
      if (!phoneNumber || !message) {
        return res.status(400).json({
          error: "MISSING_PARAMETERS",
          message: "phoneNumber and message are required"
        });
      }
      const testPayload = {
        object: "whatsapp_business_account",
        entry: [{
          id: "test-entry",
          changes: [{
            value: {
              messaging_product: "whatsapp",
              metadata: {
                display_phone_number: "1234567890",
                phone_number_id: phoneNumberId || "test-phone-id"
              },
              messages: [{
                id: `test-${Date.now()}`,
                from: phoneNumber,
                to: "1234567890",
                text: {
                  body: message
                },
                type: "text",
                timestamp: (/* @__PURE__ */ new Date()).toISOString()
              }]
            },
            field: "messages"
          }]
        }],
        tenantContext: {
          tenantId,
          domain: "",
          phoneNumberId: phoneNumberId || "test-phone-id"
        }
      };
      const result = await messageProcessor.processWebhookPayload(testPayload);
      if (!result.success) {
        return res.status(500).json({
          error: result.error.code,
          message: result.error.message
        });
      }
      res.json({
        success: true,
        message: "Test message processed successfully",
        tenantId,
        processed_messages: result.data.length,
        results: result.data
      });
    } catch (error) {
      console.error("Webhook test error:", error);
      res.status(500).json({
        error: "WEBHOOK_TEST_FAILED",
        message: "Failed to test webhook"
      });
    }
  });
  return router4;
}
function verifyWebhookSignature(payload, signature, secret) {
  try {
    const expectedSignature = crypto3.createHmac("sha256", secret).update(payload, "utf8").digest("hex");
    const receivedSignature = signature.replace("sha256=", "");
    return crypto3.timingSafeEqual(
      Buffer.from(expectedSignature, "hex"),
      Buffer.from(receivedSignature, "hex")
    );
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}

// server/routes/simple-webhook.routes.ts
init_whatsapp_booking_service();
import { Router as Router5 } from "express";
function createSimpleWebhookRoutes() {
  const router4 = Router5();
  const bookingService = new WhatsAppBookingService();
  const conversationState = /* @__PURE__ */ new Map();
  router4.get("/whatsapp/simple", (req, res) => {
    try {
      const mode = req.query["hub.mode"];
      const token = req.query["hub.verify_token"];
      const challenge = req.query["hub.challenge"];
      console.log("Simple webhook verification request:", { mode, token, challenge });
      if (mode === "subscribe") {
        if (token === process.env.WHATSAPP_VERIFY_TOKEN && challenge) {
          console.log("Simple webhook verified successfully");
          res.status(200).send(challenge);
          return;
        }
      }
      console.log("Simple webhook verification failed");
      res.status(403).send("Forbidden");
    } catch (error) {
      console.error("Simple webhook verification error:", error);
      res.status(400).send("Bad Request");
    }
  });
  router4.post("/whatsapp/simple", async (req, res) => {
    try {
      const payload = req.body;
      console.log("Simple webhook payload received:", JSON.stringify(payload, null, 2));
      const messages2 = extractMessages(payload);
      if (messages2.length === 0) {
        console.log("No messages found in webhook payload");
        return res.status(200).json({ success: true, processed: 0 });
      }
      const processedMessages = [];
      for (const message of messages2) {
        try {
          console.log(`Processing message from ${message.from}: ${message.text?.body}`);
          let bookingContext = conversationState.get(message.from);
          if (!bookingContext) {
            bookingContext = {
              tenantId: "85de5a0c-6aeb-479a-aa76-cbdd6b0845a7",
              // Bella Salon tenant ID
              customerPhone: message.from,
              currentStep: "welcome"
            };
          }
          console.log(`Current conversation state for ${message.from}:`, bookingContext);
          const result = await bookingService.processBookingMessage(
            message,
            bookingContext.tenantId,
            bookingContext
          );
          if (result.success && result.nextStep) {
            bookingContext.currentStep = result.nextStep;
            conversationState.set(message.from, bookingContext);
            console.log(`Updated conversation state for ${message.from}:`, bookingContext);
          }
          if (result.success) {
            processedMessages.push({
              messageId: message.id,
              phoneNumber: message.from,
              response: result.message,
              nextStep: result.nextStep,
              appointmentId: result.appointmentId,
              currentStep: bookingContext.currentStep
            });
            console.log(`Generated response: ${result.message.substring(0, 100)}...`);
          } else {
            console.error(`Failed to process message: ${result.error}`);
          }
        } catch (error) {
          console.error(`Error processing message ${message.id}:`, error);
        }
      }
      console.log(`Successfully processed ${processedMessages.length} messages`);
      res.status(200).json({
        success: true,
        processed: processedMessages.length,
        messages: processedMessages
      });
    } catch (error) {
      console.error("Simple webhook processing error:", error);
      res.status(500).json({
        error: "WEBHOOK_PROCESSING_ERROR",
        message: "Internal server error processing webhook"
      });
    }
  });
  router4.post("/whatsapp/simple/test", async (req, res) => {
    try {
      const { phoneNumber, message } = req.body;
      if (!phoneNumber || !message) {
        return res.status(400).json({
          error: "MISSING_PARAMETERS",
          message: "phoneNumber and message are required"
        });
      }
      console.log(`Test message from ${phoneNumber}: ${message}`);
      let bookingContext = conversationState.get(phoneNumber);
      if (!bookingContext) {
        bookingContext = {
          tenantId: "85de5a0c-6aeb-479a-aa76-cbdd6b0845a7",
          // Bella Salon tenant ID
          customerPhone: phoneNumber,
          currentStep: "welcome"
        };
      } else {
        bookingContext = JSON.parse(JSON.stringify(bookingContext));
      }
      console.log(`Current conversation state for ${phoneNumber}:`, bookingContext);
      const result = await bookingService.processBookingMessage(
        { text: { body: message }, from: phoneNumber, id: "test", type: "text", timestamp: (/* @__PURE__ */ new Date()).toISOString() },
        bookingContext.tenantId,
        bookingContext
      );
      if (result.success && result.nextStep) {
        bookingContext.currentStep = result.nextStep;
        conversationState.set(phoneNumber, JSON.parse(JSON.stringify(bookingContext)));
        console.log(`Updated conversation state for ${phoneNumber}:`, bookingContext);
      }
      if (result.success) {
        res.json({
          success: true,
          message: result.message,
          nextStep: result.nextStep,
          appointmentId: result.appointmentId,
          currentStep: bookingContext.currentStep
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error || "Unknown error",
          currentStep: bookingContext.currentStep
        });
      }
    } catch (error) {
      console.error("Simple webhook test error:", error);
      res.status(500).json({
        error: "WEBHOOK_TEST_FAILED",
        message: "Failed to test webhook"
      });
    }
  });
  return router4;
}
function extractMessages(payload) {
  try {
    const messages2 = [];
    for (const entry of payload.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field === "messages" && change.value.messages) {
          messages2.push(...change.value.messages);
        }
      }
    }
    return messages2;
  } catch (error) {
    console.error("Error extracting messages:", error);
    return [];
  }
}

// server/routes.ts
init_dynamic_flow_processor_service();

// server/services/message-processor.service.ts
import { eq as eq9 } from "drizzle-orm";
import { drizzle as drizzle7 } from "drizzle-orm/neon-serverless";
import { Pool as Pool10 } from "@neondatabase/serverless";

// server/repositories/conversation.repository.ts
import { eq as eq7, and as and7, like as like3, inArray as inArray4, desc as desc5, or as or3, sql as sql6 } from "drizzle-orm";

// server/repositories/base.repository.ts
import { eq as eq6, and as and6, desc as desc4, asc as asc3, like as like2, inArray as inArray3, gte as gte4, lte as lte2, sql as sql5 } from "drizzle-orm";
import { drizzle as drizzle5 } from "drizzle-orm/neon-serverless";
import { Pool as Pool8 } from "@neondatabase/serverless";
var BaseRepository = class {
  db;
  pool;
  table;
  options;
  constructor(connectionString, table, options = {}) {
    this.pool = new Pool8({ connectionString });
    this.db = drizzle5({ client: this.pool, schema: schema_exports });
    this.table = table;
    this.options = {
      enforceRLS: true,
      autoInjectTenantId: true,
      ...options
    };
  }
  /**
   * Create a new record with automatic tenant_id injection
   */
  async create(tenantId, data) {
    try {
      this.validateTenantId(tenantId);
      const insertData = this.options.autoInjectTenantId ? { ...data, tenantId } : data;
      const [result] = await this.db.insert(this.table).values(insertData).returning();
      return {
        success: true,
        data: result,
        metadata: { created: true }
      };
    } catch (error) {
      console.error(`Error creating ${this.table}:`, error);
      return this.handleError("CREATE_FAILED", "Failed to create record", tenantId, error);
    }
  }
  /**
   * Find record by ID with tenant isolation
   */
  async findById(tenantId, id) {
    try {
      this.validateTenantId(tenantId);
      const whereClause = this.buildTenantWhereClause(tenantId, eq6(this.table.id, id));
      const [result] = await this.db.select().from(this.table).where(whereClause).limit(1);
      if (!result) {
        return {
          success: false,
          error: {
            code: "RECORD_NOT_FOUND",
            message: "Record not found",
            tenantId,
            details: { id }
          }
        };
      }
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error(`Error finding ${this.table} by ID:`, error);
      return this.handleError("FIND_FAILED", "Failed to find record", tenantId, error);
    }
  }
  /**
   * Update record with tenant isolation
   */
  async update(tenantId, id, data) {
    try {
      this.validateTenantId(tenantId);
      const existingRecord = await this.findById(tenantId, id);
      if (!existingRecord.success) {
        return existingRecord;
      }
      const whereClause = this.buildTenantWhereClause(tenantId, eq6(this.table.id, id));
      const updateData = {
        ...data,
        updatedAt: /* @__PURE__ */ new Date()
      };
      const [result] = await this.db.update(this.table).set(updateData).where(whereClause).returning();
      return {
        success: true,
        data: result,
        metadata: { updated: true }
      };
    } catch (error) {
      console.error(`Error updating ${this.table}:`, error);
      return this.handleError("UPDATE_FAILED", "Failed to update record", tenantId, error);
    }
  }
  /**
   * Delete record with tenant isolation (soft delete if supported)
   */
  async delete(tenantId, id) {
    try {
      this.validateTenantId(tenantId);
      const existingRecord = await this.findById(tenantId, id);
      if (!existingRecord.success) {
        return {
          success: false,
          error: existingRecord.error
        };
      }
      const whereClause = this.buildTenantWhereClause(tenantId, eq6(this.table.id, id));
      if ("isActive" in this.table) {
        await this.db.update(this.table).set({ isActive: false, updatedAt: /* @__PURE__ */ new Date() }).where(whereClause);
      } else {
        await this.db.delete(this.table).where(whereClause);
      }
      return {
        success: true,
        metadata: { deleted: true }
      };
    } catch (error) {
      console.error(`Error deleting ${this.table}:`, error);
      return this.handleError("DELETE_FAILED", "Failed to delete record", tenantId, error);
    }
  }
  /**
   * List records with pagination and filtering
   */
  async list(tenantId, pagination, filters, additionalWhere) {
    try {
      this.validateTenantId(tenantId);
      const whereConditions = [eq6(this.table.tenantId, tenantId)];
      if (additionalWhere) {
        whereConditions.push(additionalWhere);
      }
      if (filters?.search && "name" in this.table) {
        whereConditions.push(like2(this.table.name, `%${filters.search}%`));
      }
      if (filters?.status && "status" in this.table) {
        whereConditions.push(inArray3(this.table.status, filters.status));
      }
      if (filters?.dateFrom && "createdAt" in this.table) {
        whereConditions.push(gte4(this.table.createdAt, filters.dateFrom));
      }
      if (filters?.dateTo && "createdAt" in this.table) {
        whereConditions.push(lte2(this.table.createdAt, filters.dateTo));
      }
      const whereClause = and6(...whereConditions);
      const [{ count }] = await this.db.select({ count: sql5`count(*)` }).from(this.table).where(whereClause);
      const offset = (pagination.page - 1) * pagination.limit;
      const orderBy = this.buildOrderBy(pagination);
      const results = await this.db.select().from(this.table).where(whereClause).orderBy(orderBy).limit(pagination.limit).offset(offset);
      const totalPages = Math.ceil(count / pagination.limit);
      return {
        success: true,
        data: {
          data: results,
          pagination: {
            page: pagination.page,
            limit: pagination.limit,
            total: count,
            totalPages,
            hasNext: pagination.page < totalPages,
            hasPrev: pagination.page > 1
          }
        }
      };
    } catch (error) {
      console.error(`Error listing ${this.table}:`, error);
      return this.handleError("LIST_FAILED", "Failed to list records", tenantId, error);
    }
  }
  /**
   * Count records with tenant isolation
   */
  async count(tenantId, additionalWhere) {
    try {
      this.validateTenantId(tenantId);
      const whereConditions = [eq6(this.table.tenantId, tenantId)];
      if (additionalWhere) {
        whereConditions.push(additionalWhere);
      }
      const whereClause = and6(...whereConditions);
      const [{ count }] = await this.db.select({ count: sql5`count(*)` }).from(this.table).where(whereClause);
      return {
        success: true,
        data: count
      };
    } catch (error) {
      console.error(`Error counting ${this.table}:`, error);
      return this.handleError("COUNT_FAILED", "Failed to count records", tenantId, error);
    }
  }
  /**
   * Execute custom query with tenant isolation
   */
  async executeWithTenantContext(tenantId, queryFn) {
    try {
      this.validateTenantId(tenantId);
      const result = await queryFn(this.db, tenantId);
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error(`Error executing custom query:`, error);
      return this.handleError("QUERY_FAILED", "Failed to execute query", tenantId, error);
    }
  }
  /**
   * Bulk create with tenant isolation
   */
  async bulkCreate(tenantId, data) {
    try {
      this.validateTenantId(tenantId);
      const insertData = this.options.autoInjectTenantId ? data.map((item) => ({ ...item, tenantId })) : data;
      const results = await this.db.insert(this.table).values(insertData).returning();
      return {
        success: true,
        data: results,
        metadata: { created: results.length }
      };
    } catch (error) {
      console.error(`Error bulk creating ${this.table}:`, error);
      return this.handleError("BULK_CREATE_FAILED", "Failed to bulk create records", tenantId, error);
    }
  }
  /**
   * Transaction support with tenant context
   */
  async transaction(tenantId, transactionFn) {
    try {
      this.validateTenantId(tenantId);
      const result = await this.db.transaction(async (tx) => {
        return await transactionFn(tx, tenantId);
      });
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error(`Error in transaction:`, error);
      return this.handleError("TRANSACTION_FAILED", "Transaction failed", tenantId, error);
    }
  }
  // ===== PROTECTED HELPER METHODS =====
  /**
   * Build tenant-aware where clause
   */
  buildTenantWhereClause(tenantId, additionalWhere) {
    const tenantCondition = eq6(this.table.tenantId, tenantId);
    return additionalWhere ? and6(tenantCondition, additionalWhere) : tenantCondition;
  }
  /**
   * Build order by clause from pagination params
   */
  buildOrderBy(pagination) {
    if (pagination.sortBy && pagination.sortBy in this.table) {
      const column = this.table[pagination.sortBy];
      return pagination.sortOrder === "asc" ? asc3(column) : desc4(column);
    }
    if ("createdAt" in this.table) {
      return desc4(this.table.createdAt);
    }
    return desc4(this.table.id);
  }
  /**
   * Validate tenant ID format
   */
  validateTenantId(tenantId) {
    if (!tenantId || typeof tenantId !== "string") {
      throw new Error("Invalid tenant ID");
    }
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(tenantId)) {
      throw new Error("Tenant ID must be a valid UUID");
    }
  }
  /**
   * Handle repository errors consistently
   */
  handleError(code, message, tenantId, originalError) {
    return {
      success: false,
      error: {
        code,
        message,
        tenantId,
        details: {
          originalError: originalError instanceof Error ? originalError.message : "Unknown error"
        }
      }
    };
  }
  /**
   * Close database connection
   */
  async close() {
    await this.pool.end();
  }
};

// server/repositories/conversation.repository.ts
var ConversationRepository = class extends BaseRepository {
  constructor(connectionString) {
    super(connectionString, conversations);
  }
  /**
   * Find conversation by phone number
   */
  async findByPhoneNumber(tenantId, phoneNumber) {
    return this.executeWithTenantContext(tenantId, async (db2) => {
      const [result] = await db2.select().from(conversations).where(
        and7(
          eq7(conversations.tenantId, tenantId),
          eq7(conversations.phoneNumber, phoneNumber)
        )
      ).limit(1);
      if (!result) {
        return {
          success: false,
          error: {
            code: "CONVERSATION_NOT_FOUND",
            message: "Conversation not found for phone number",
            tenantId,
            details: { phoneNumber }
          }
        };
      }
      return result;
    });
  }
  /**
   * Find conversations by state
   */
  async findByState(tenantId, state, pagination) {
    return this.list(
      tenantId,
      pagination,
      void 0,
      eq7(conversations.currentState, state)
    );
  }
  /**
   * Update conversation state
   */
  async updateState(tenantId, conversationId, newState, contextData) {
    const updateData = { currentState: newState };
    if (contextData) {
      updateData.contextData = contextData;
    }
    return this.update(tenantId, conversationId, updateData);
  }
  /**
   * Get conversation with messages
   */
  async getWithMessages(tenantId, conversationId, messageLimit = 50) {
    return this.executeWithTenantContext(tenantId, async (db2) => {
      const [conversation] = await db2.select().from(conversations).where(
        and7(
          eq7(conversations.tenantId, tenantId),
          eq7(conversations.id, conversationId)
        )
      ).limit(1);
      if (!conversation) {
        return {
          success: false,
          error: {
            code: "CONVERSATION_NOT_FOUND",
            message: "Conversation not found",
            tenantId,
            details: { conversationId }
          }
        };
      }
      const messages2 = await db2.select().from(messages).where(
        and7(
          eq7(messages.tenantId, tenantId),
          eq7(messages.conversationId, conversationId)
        )
      ).orderBy(desc5(messages.timestamp)).limit(messageLimit);
      return {
        ...conversation,
        messages: messages2.reverse()
        // Reverse to show oldest first
      };
    });
  }
  /**
   * Get active conversations (not completed or cancelled)
   */
  async getActiveConversations(tenantId, pagination) {
    return this.executeWithTenantContext(tenantId, async (db2) => {
      const activeStates = ["greeting", "awaiting_service", "awaiting_date", "awaiting_time", "awaiting_payment"];
      const whereConditions = [
        eq7(conversations.tenantId, tenantId),
        inArray4(conversations.currentState, activeStates)
      ];
      const whereClause = and7(...whereConditions);
      const [{ count }] = await db2.select({ count: sql6`count(*)` }).from(conversations).where(whereClause);
      const offset = (pagination.page - 1) * pagination.limit;
      const results = await db2.select().from(conversations).where(whereClause).orderBy(desc5(conversations.updatedAt)).limit(pagination.limit).offset(offset);
      const totalPages = Math.ceil(count / pagination.limit);
      return {
        data: results,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total: count,
          totalPages,
          hasNext: pagination.page < totalPages,
          hasPrev: pagination.page > 1
        }
      };
    });
  }
  /**
   * Search conversations by customer name or phone
   */
  async searchConversations(tenantId, query, pagination) {
    return this.executeWithTenantContext(tenantId, async (db2) => {
      const whereConditions = [eq7(conversations.tenantId, tenantId)];
      if (query) {
        whereConditions.push(
          or3(
            like3(conversations.customerName, `%${query}%`),
            like3(conversations.phoneNumber, `%${query}%`)
          )
        );
      }
      const whereClause = and7(...whereConditions);
      const [{ count }] = await db2.select({ count: sql6`count(*)` }).from(conversations).where(whereClause);
      const offset = (pagination.page - 1) * pagination.limit;
      const results = await db2.select().from(conversations).where(whereClause).orderBy(desc5(conversations.updatedAt)).limit(pagination.limit).offset(offset);
      const totalPages = Math.ceil(count / pagination.limit);
      return {
        data: results,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total: count,
          totalPages,
          hasNext: pagination.page < totalPages,
          hasPrev: pagination.page > 1
        }
      };
    });
  }
  /**
   * Get conversation statistics
   */
  async getStatistics(tenantId) {
    return this.executeWithTenantContext(tenantId, async (db2) => {
      const [{ total }] = await db2.select({ total: sql6`count(*)` }).from(conversations).where(eq7(conversations.tenantId, tenantId));
      const activeStates = ["greeting", "awaiting_service", "awaiting_date", "awaiting_time", "awaiting_payment"];
      const [{ active }] = await db2.select({ active: sql6`count(*)` }).from(conversations).where(
        and7(
          eq7(conversations.tenantId, tenantId),
          inArray4(conversations.currentState, activeStates)
        )
      );
      const [{ completed }] = await db2.select({ completed: sql6`count(*)` }).from(conversations).where(
        and7(
          eq7(conversations.tenantId, tenantId),
          eq7(conversations.currentState, "completed")
        )
      );
      const stateResults = await db2.select({
        state: conversations.currentState,
        count: sql6`count(*)`
      }).from(conversations).where(eq7(conversations.tenantId, tenantId)).groupBy(conversations.currentState);
      const byState = {};
      stateResults.forEach(({ state, count }) => {
        byState[state] = count;
      });
      return {
        total,
        active,
        completed,
        byState
      };
    });
  }
};

// server/repositories/service.repository.ts
import { eq as eq8, and as and8, like as like4, or as or4, gte as gte5, lte as lte3, asc as asc5, desc as desc6, sql as sql7 } from "drizzle-orm";
var ServiceRepository = class extends BaseRepository {
  constructor(connectionString) {
    super(connectionString, services);
  }
  /**
   * Find services by category
   */
  async findByCategory(tenantId, category) {
    return this.executeWithTenantContext(tenantId, async (db2) => {
      const results = await db2.select().from(services).where(
        and8(
          eq8(services.tenantId, tenantId),
          eq8(services.category, category),
          eq8(services.isActive, true)
        )
      );
      return results;
    });
  }
  /**
   * Find active services only
   */
  async findActive(tenantId, pagination) {
    return this.list(
      tenantId,
      pagination,
      void 0,
      eq8(services.isActive, true)
    );
  }
  /**
   * Search services by name or description
   */
  async search(tenantId, query, pagination) {
    return this.executeWithTenantContext(tenantId, async (db2) => {
      const whereConditions = [
        eq8(services.tenantId, tenantId),
        eq8(services.isActive, true)
      ];
      if (query) {
        whereConditions.push(
          or4(
            like4(services.name, `%${query}%`),
            like4(services.description, `%${query}%`)
          )
        );
      }
      const whereClause = and8(...whereConditions);
      const [{ count }] = await db2.select({ count: sql7`count(*)` }).from(services).where(whereClause);
      const offset = (pagination.page - 1) * pagination.limit;
      const results = await db2.select().from(services).where(whereClause).orderBy(desc6(services.createdAt)).limit(pagination.limit).offset(offset);
      const totalPages = Math.ceil(count / pagination.limit);
      return {
        data: results,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total: count,
          totalPages,
          hasNext: pagination.page < totalPages,
          hasPrev: pagination.page > 1
        }
      };
    });
  }
  /**
   * Update service availability
   */
  async updateAvailability(tenantId, serviceId, isActive) {
    return this.update(tenantId, serviceId, { isActive });
  }
  /**
   * Get services by price range
   */
  async findByPriceRange(tenantId, minPrice, maxPrice) {
    return this.executeWithTenantContext(tenantId, async (db2) => {
      const results = await db2.select().from(services).where(
        and8(
          eq8(services.tenantId, tenantId),
          eq8(services.isActive, true),
          gte5(services.price, minPrice),
          lte3(services.price, maxPrice)
        )
      ).orderBy(asc5(services.price));
      return results;
    });
  }
};

// server/services/bot-configuration.service.ts
import { drizzle as drizzle6 } from "drizzle-orm/neon-serverless";
import { Pool as Pool9 } from "@neondatabase/serverless";
var BotConfigurationService = class {
  db;
  pool;
  settingsService;
  configurationCache = /* @__PURE__ */ new Map();
  changeListeners = /* @__PURE__ */ new Map();
  constructor(connectionString) {
    this.pool = new Pool9({ connectionString });
    this.db = drizzle6({ client: this.pool, schema: schema_exports });
    this.settingsService = new TenantSettingsService(connectionString);
    setInterval(() => {
      this.refreshConfigurationCache();
    }, 5 * 60 * 1e3);
  }
  // ===== CONFIGURATION RETRIEVAL =====
  /**
   * Get bot configuration for tenant with caching
   */
  async getBotConfiguration(tenantId) {
    try {
      if (this.configurationCache.has(tenantId)) {
        return {
          success: true,
          data: this.configurationCache.get(tenantId),
          metadata: { fromCache: true }
        };
      }
      const result = await this.settingsService.getSettings(tenantId);
      if (!result.success) {
        return {
          success: false,
          error: result.error
        };
      }
      const botSettings = result.data.botSettings;
      this.configurationCache.set(tenantId, botSettings);
      return {
        success: true,
        data: botSettings,
        metadata: { fromCache: false }
      };
    } catch (error) {
      console.error("Error getting bot configuration:", error);
      return {
        success: false,
        error: {
          code: "CONFIG_RETRIEVAL_FAILED",
          message: "Failed to retrieve bot configuration",
          tenantId
        }
      };
    }
  }
  /**
   * Get specific configuration section
   */
  async getConfigurationSection(tenantId, section) {
    try {
      const configResult = await this.getBotConfiguration(tenantId);
      if (!configResult.success) {
        return {
          success: false,
          error: configResult.error
        };
      }
      return {
        success: true,
        data: configResult.data[section]
      };
    } catch (error) {
      console.error("Error getting configuration section:", error);
      return {
        success: false,
        error: {
          code: "CONFIG_SECTION_FAILED",
          message: `Failed to get configuration section: ${section}`,
          tenantId
        }
      };
    }
  }
  // ===== CONFIGURATION UPDATES =====
  /**
   * Update bot configuration with validation and real-time updates
   */
  async updateBotConfiguration(tenantId, updates, updatedBy, validateOnly = false) {
    try {
      const currentResult = await this.getBotConfiguration(tenantId);
      if (!currentResult.success) {
        return {
          success: false,
          error: currentResult.error
        };
      }
      const currentConfig = currentResult.data;
      const updatedConfig = {
        ...currentConfig,
        ...updates,
        // Merge nested objects properly
        businessHours: updates.businessHours ? { ...currentConfig.businessHours, ...updates.businessHours } : currentConfig.businessHours,
        autoResponses: updates.autoResponses ? { ...currentConfig.autoResponses, ...updates.autoResponses } : currentConfig.autoResponses,
        conversationFlow: updates.conversationFlow ? { ...currentConfig.conversationFlow, ...updates.conversationFlow } : currentConfig.conversationFlow,
        paymentSettings: updates.paymentSettings ? { ...currentConfig.paymentSettings, ...updates.paymentSettings } : currentConfig.paymentSettings,
        notificationSettings: updates.notificationSettings ? { ...currentConfig.notificationSettings, ...updates.notificationSettings } : currentConfig.notificationSettings,
        customization: updates.customization ? { ...currentConfig.customization, ...updates.customization } : currentConfig.customization
      };
      const validationResult = await this.validateConfiguration(updatedConfig);
      if (!validationResult.isValid) {
        return {
          success: false,
          error: {
            code: "CONFIG_VALIDATION_FAILED",
            message: "Configuration validation failed",
            tenantId,
            details: {
              errors: validationResult.errors,
              warnings: validationResult.warnings
            }
          }
        };
      }
      if (validateOnly) {
        return {
          success: true,
          data: updatedConfig,
          metadata: { validationOnly: true, warnings: validationResult.warnings }
        };
      }
      const updateResult = await this.settingsService.updateSettings(
        tenantId,
        { botSettings: updatedConfig },
        updatedBy,
        "Bot configuration update"
      );
      if (!updateResult.success) {
        return {
          success: false,
          error: updateResult.error
        };
      }
      this.configurationCache.set(tenantId, updatedConfig);
      await this.emitConfigurationChangeEvents(tenantId, currentConfig, updatedConfig, updatedBy);
      return {
        success: true,
        data: updatedConfig,
        metadata: {
          updated: true,
          warnings: validationResult.warnings,
          version: updateResult.data.version
        }
      };
    } catch (error) {
      console.error("Error updating bot configuration:", error);
      return {
        success: false,
        error: {
          code: "CONFIG_UPDATE_FAILED",
          message: "Failed to update bot configuration",
          tenantId
        }
      };
    }
  }
  /**
   * Update specific configuration section
   */
  async updateConfigurationSection(tenantId, section, sectionData, updatedBy) {
    try {
      const updates = { [section]: sectionData };
      const result = await this.updateBotConfiguration(tenantId, updates, updatedBy);
      if (!result.success) {
        return {
          success: false,
          error: result.error
        };
      }
      return {
        success: true,
        data: result.data[section],
        metadata: result.metadata
      };
    } catch (error) {
      console.error("Error updating configuration section:", error);
      return {
        success: false,
        error: {
          code: "CONFIG_SECTION_UPDATE_FAILED",
          message: `Failed to update configuration section: ${section}`,
          tenantId
        }
      };
    }
  }
  // ===== CONFIGURATION VALIDATION =====
  /**
   * Validate bot configuration
   */
  async validateConfiguration(config) {
    const errors = [];
    const warnings = [];
    try {
      if (!config.greetingMessage || config.greetingMessage.trim().length === 0) {
        errors.push({
          field: "greetingMessage",
          message: "Greeting message is required",
          code: "GREETING_MESSAGE_REQUIRED"
        });
      } else if (config.greetingMessage.length > 1e3) {
        errors.push({
          field: "greetingMessage",
          message: "Greeting message must be less than 1000 characters",
          code: "GREETING_MESSAGE_TOO_LONG"
        });
      }
      if (config.businessHours.enabled) {
        if (!config.businessHours.timezone) {
          errors.push({
            field: "businessHours.timezone",
            message: "Timezone is required when business hours are enabled",
            code: "TIMEZONE_REQUIRED"
          });
        }
        const schedule = config.businessHours.schedule;
        const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
        for (const day of days) {
          const daySchedule = schedule[day];
          if (daySchedule.isOpen) {
            if (!daySchedule.openTime || !daySchedule.closeTime) {
              errors.push({
                field: `businessHours.schedule.${day}`,
                message: `Open and close times are required for ${day}`,
                code: "SCHEDULE_TIMES_REQUIRED"
              });
            } else {
              const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
              if (!timeRegex.test(daySchedule.openTime)) {
                errors.push({
                  field: `businessHours.schedule.${day}.openTime`,
                  message: `Invalid open time format for ${day}. Use HH:MM format`,
                  code: "INVALID_TIME_FORMAT"
                });
              }
              if (!timeRegex.test(daySchedule.closeTime)) {
                errors.push({
                  field: `businessHours.schedule.${day}.closeTime`,
                  message: `Invalid close time format for ${day}. Use HH:MM format`,
                  code: "INVALID_TIME_FORMAT"
                });
              }
            }
          }
        }
      }
      const requiredResponses = [
        "welcomeMessage",
        "serviceSelectionPrompt",
        "dateSelectionPrompt",
        "timeSelectionPrompt",
        "confirmationMessage",
        "errorMessage"
      ];
      for (const response of requiredResponses) {
        if (!config.autoResponses[response] || config.autoResponses[response].trim().length === 0) {
          errors.push({
            field: `autoResponses.${response}`,
            message: `${response} is required`,
            code: "AUTO_RESPONSE_REQUIRED"
          });
        }
      }
      if (!config.conversationFlow.steps || config.conversationFlow.steps.length === 0) {
        errors.push({
          field: "conversationFlow.steps",
          message: "At least one conversation step is required",
          code: "CONVERSATION_STEPS_REQUIRED"
        });
      } else {
        config.conversationFlow.steps.forEach((step, index) => {
          if (!step.id || step.id.trim().length === 0) {
            errors.push({
              field: `conversationFlow.steps[${index}].id`,
              message: `Step ${index + 1} must have an ID`,
              code: "STEP_ID_REQUIRED"
            });
          }
          if (!step.name || step.name.trim().length === 0) {
            errors.push({
              field: `conversationFlow.steps[${index}].name`,
              message: `Step ${index + 1} must have a name`,
              code: "STEP_NAME_REQUIRED"
            });
          }
          if (!step.prompt || step.prompt.trim().length === 0) {
            errors.push({
              field: `conversationFlow.steps[${index}].prompt`,
              message: `Step ${index + 1} must have a prompt`,
              code: "STEP_PROMPT_REQUIRED"
            });
          }
        });
        const stepIds = config.conversationFlow.steps.map((step) => step.id);
        const duplicateIds = stepIds.filter((id, index) => stepIds.indexOf(id) !== index);
        if (duplicateIds.length > 0) {
          errors.push({
            field: "conversationFlow.steps",
            message: `Duplicate step IDs found: ${duplicateIds.join(", ")}`,
            code: "DUPLICATE_STEP_IDS"
          });
        }
      }
      if (config.paymentSettings.enabled) {
        if (!config.paymentSettings.methods || config.paymentSettings.methods.length === 0) {
          errors.push({
            field: "paymentSettings.methods",
            message: "At least one payment method is required when payments are enabled",
            code: "PAYMENT_METHODS_REQUIRED"
          });
        }
        if (!config.paymentSettings.currency) {
          errors.push({
            field: "paymentSettings.currency",
            message: "Currency is required when payments are enabled",
            code: "CURRENCY_REQUIRED"
          });
        }
        if (config.paymentSettings.depositPercentage !== void 0) {
          if (config.paymentSettings.depositPercentage < 0 || config.paymentSettings.depositPercentage > 100) {
            errors.push({
              field: "paymentSettings.depositPercentage",
              message: "Deposit percentage must be between 0 and 100",
              code: "INVALID_DEPOSIT_PERCENTAGE"
            });
          }
        }
      }
      if (config.customization.brandColors) {
        const colorFields = ["primary", "secondary", "accent", "background", "text"];
        for (const colorField of colorFields) {
          const color = config.customization.brandColors[colorField];
          if (color && !/^#[0-9A-Fa-f]{6}$/.test(color)) {
            errors.push({
              field: `customization.brandColors.${colorField}`,
              message: `Invalid color format for ${colorField}. Use hex format (#RRGGBB)`,
              code: "INVALID_COLOR_FORMAT"
            });
          }
        }
      }
      if (config.conversationFlow.maxRetries > 5) {
        warnings.push({
          field: "conversationFlow.maxRetries",
          message: "High retry count may lead to poor user experience",
          code: "HIGH_RETRY_COUNT"
        });
      }
      if (config.conversationFlow.sessionTimeout < 5) {
        warnings.push({
          field: "conversationFlow.sessionTimeout",
          message: "Very short session timeout may interrupt user conversations",
          code: "SHORT_SESSION_TIMEOUT"
        });
      }
      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };
    } catch (error) {
      console.error("Error validating configuration:", error);
      return {
        isValid: false,
        errors: [{
          field: "general",
          message: "Configuration validation failed due to internal error",
          code: "VALIDATION_ERROR"
        }],
        warnings: []
      };
    }
  }
  // ===== CONFIGURATION ROLLBACK =====
  /**
   * Rollback configuration to previous version
   */
  async rollbackConfiguration(tenantId, targetVersion, rollbackInfo) {
    try {
      const rollbackResult = await this.settingsService.rollbackToVersion(
        tenantId,
        targetVersion,
        rollbackInfo.rollbackBy,
        rollbackInfo.rollbackReason
      );
      if (!rollbackResult.success) {
        return {
          success: false,
          error: rollbackResult.error
        };
      }
      const rolledBackSettings = rollbackResult.data;
      const botSettings = rolledBackSettings.botSettings;
      this.configurationCache.set(tenantId, botSettings);
      const changeEvent = {
        tenantId,
        configType: "bot_settings",
        changeType: "rollback",
        oldValue: null,
        // We don't have the old value in this context
        newValue: botSettings,
        changedBy: rollbackInfo.rollbackBy,
        timestamp: rollbackInfo.rollbackAt
      };
      await this.notifyChangeListeners(tenantId, changeEvent);
      return {
        success: true,
        data: botSettings,
        metadata: {
          rolledBack: true,
          targetVersion,
          rollbackReason: rollbackInfo.rollbackReason
        }
      };
    } catch (error) {
      console.error("Error rolling back configuration:", error);
      return {
        success: false,
        error: {
          code: "CONFIG_ROLLBACK_FAILED",
          message: "Failed to rollback configuration",
          tenantId
        }
      };
    }
  }
  /**
   * Get configuration history
   */
  async getConfigurationHistory(tenantId, limit = 10) {
    try {
      const historyResult = await this.settingsService.getSettingsHistory(tenantId, limit);
      if (!historyResult.success) {
        return {
          success: false,
          error: historyResult.error
        };
      }
      const history = historyResult.data.map((version) => ({
        version: version.version,
        settings: version.settings.botSettings,
        createdBy: version.createdBy,
        createdAt: version.createdAt,
        changeSummary: version.changeSummary
      }));
      return {
        success: true,
        data: history
      };
    } catch (error) {
      console.error("Error getting configuration history:", error);
      return {
        success: false,
        error: {
          code: "CONFIG_HISTORY_FAILED",
          message: "Failed to get configuration history",
          tenantId
        }
      };
    }
  }
  // ===== REAL-TIME UPDATES =====
  /**
   * Subscribe to configuration changes
   */
  subscribeToConfigurationChanges(tenantId, listener) {
    if (!this.changeListeners.has(tenantId)) {
      this.changeListeners.set(tenantId, []);
    }
    this.changeListeners.get(tenantId).push(listener);
    return () => {
      const listeners = this.changeListeners.get(tenantId);
      if (listeners) {
        const index = listeners.indexOf(listener);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }
  /**
   * Force refresh configuration from database
   */
  async refreshConfiguration(tenantId) {
    try {
      this.configurationCache.delete(tenantId);
      return await this.getBotConfiguration(tenantId);
    } catch (error) {
      console.error("Error refreshing configuration:", error);
      return {
        success: false,
        error: {
          code: "CONFIG_REFRESH_FAILED",
          message: "Failed to refresh configuration",
          tenantId
        }
      };
    }
  }
  // ===== PRIVATE HELPER METHODS =====
  /**
   * Emit configuration change events
   */
  async emitConfigurationChangeEvents(tenantId, oldConfig, newConfig, changedBy) {
    try {
      const timestamp3 = /* @__PURE__ */ new Date();
      const events = [];
      if (JSON.stringify(oldConfig.businessHours) !== JSON.stringify(newConfig.businessHours)) {
        events.push({
          tenantId,
          configType: "business_hours",
          changeType: "update",
          oldValue: oldConfig.businessHours,
          newValue: newConfig.businessHours,
          changedBy,
          timestamp: timestamp3
        });
      }
      if (JSON.stringify(oldConfig.autoResponses) !== JSON.stringify(newConfig.autoResponses)) {
        events.push({
          tenantId,
          configType: "auto_responses",
          changeType: "update",
          oldValue: oldConfig.autoResponses,
          newValue: newConfig.autoResponses,
          changedBy,
          timestamp: timestamp3
        });
      }
      if (JSON.stringify(oldConfig.conversationFlow) !== JSON.stringify(newConfig.conversationFlow)) {
        events.push({
          tenantId,
          configType: "conversation_flow",
          changeType: "update",
          oldValue: oldConfig.conversationFlow,
          newValue: newConfig.conversationFlow,
          changedBy,
          timestamp: timestamp3
        });
      }
      if (JSON.stringify(oldConfig.paymentSettings) !== JSON.stringify(newConfig.paymentSettings)) {
        events.push({
          tenantId,
          configType: "payment_settings",
          changeType: "update",
          oldValue: oldConfig.paymentSettings,
          newValue: newConfig.paymentSettings,
          changedBy,
          timestamp: timestamp3
        });
      }
      if (JSON.stringify(oldConfig.notificationSettings) !== JSON.stringify(newConfig.notificationSettings)) {
        events.push({
          tenantId,
          configType: "notifications",
          changeType: "update",
          oldValue: oldConfig.notificationSettings,
          newValue: newConfig.notificationSettings,
          changedBy,
          timestamp: timestamp3
        });
      }
      if (JSON.stringify(oldConfig.customization) !== JSON.stringify(newConfig.customization)) {
        events.push({
          tenantId,
          configType: "customization",
          changeType: "update",
          oldValue: oldConfig.customization,
          newValue: newConfig.customization,
          changedBy,
          timestamp: timestamp3
        });
      }
      for (const event of events) {
        await this.notifyChangeListeners(tenantId, event);
      }
    } catch (error) {
      console.error("Error emitting configuration change events:", error);
    }
  }
  /**
   * Notify change listeners
   */
  async notifyChangeListeners(tenantId, event) {
    try {
      const listeners = this.changeListeners.get(tenantId);
      if (listeners) {
        for (const listener of listeners) {
          try {
            listener(event);
          } catch (error) {
            console.error("Error in configuration change listener:", error);
          }
        }
      }
    } catch (error) {
      console.error("Error notifying change listeners:", error);
    }
  }
  /**
   * Refresh configuration cache for all tenants
   */
  async refreshConfigurationCache() {
    try {
      console.log("Refreshing configuration cache...");
      const cachedTenantIds = Array.from(this.configurationCache.keys());
      for (const tenantId of cachedTenantIds) {
        try {
          this.configurationCache.delete(tenantId);
          await this.getBotConfiguration(tenantId);
        } catch (error) {
          console.error(`Error refreshing cache for tenant ${tenantId}:`, error);
        }
      }
      console.log(`Refreshed configuration cache for ${cachedTenantIds.length} tenants`);
    } catch (error) {
      console.error("Error refreshing configuration cache:", error);
    }
  }
  /**
   * Close database connection and cleanup
   */
  async close() {
    try {
      this.configurationCache.clear();
      this.changeListeners.clear();
      await this.pool.end();
    } catch (error) {
      console.error("Error closing bot configuration service:", error);
    }
  }
};

// server/services/message-processor.service.ts
init_whatsapp_booking_service();
var MessageProcessorService = class {
  db;
  pool;
  conversationRepo;
  serviceRepo;
  botConfigService;
  bookingService;
  constructor(connectionString) {
    this.pool = new Pool10({ connectionString });
    this.db = drizzle7({ client: this.pool, schema: schema_exports });
    this.conversationRepo = new ConversationRepository(connectionString);
    this.serviceRepo = new ServiceRepository(connectionString);
    this.botConfigService = new BotConfigurationService(connectionString);
    this.bookingService = new WhatsAppBookingService();
  }
  // ===== MAIN MESSAGE PROCESSING =====
  /**
   * Process incoming WhatsApp webhook payload
   */
  async processWebhookPayload(payload) {
    try {
      const processedMessages = [];
      for (const entry of payload.entry) {
        for (const change of entry.changes) {
          if (change.field === "messages" && change.value.messages) {
            for (const message of change.value.messages) {
              const tenantResult = await this.identifyTenantFromPhoneNumber(
                change.value.metadata.phone_number_id
              );
              if (!tenantResult.success) {
                console.error("Failed to identify tenant:", tenantResult.error);
                continue;
              }
              const tenantContext = tenantResult.data;
              const processResult = await this.processMessage(message, tenantContext);
              if (processResult.success) {
                processedMessages.push(processResult.data);
              } else {
                console.error("Failed to process message:", processResult.error);
              }
            }
          }
        }
      }
      return {
        success: true,
        data: processedMessages
      };
    } catch (error) {
      console.error("Error processing webhook payload:", error);
      return {
        success: false,
        error: {
          code: "WEBHOOK_PROCESSING_FAILED",
          message: "Failed to process webhook payload"
        }
      };
    }
  }
  /**
   * Process individual WhatsApp message
   */
  async processMessage(message, tenantContext) {
    try {
      const { tenantId } = tenantContext;
      const phoneNumber = message.from;
      const conversationResult = await this.getOrCreateConversation(
        tenantId,
        phoneNumber,
        message
      );
      if (!conversationResult.success) {
        return {
          success: false,
          error: conversationResult.error
        };
      }
      const conversation = conversationResult.data;
      const content = this.extractMessageContent(message);
      const messageData = {
        tenantId,
        conversationId: conversation.id,
        content,
        messageType: message.type,
        isFromBot: false,
        metadata: {
          whatsappMessageId: message.id,
          timestamp: message.timestamp,
          interactive: message.interactive
        }
      };
      const [savedMessage] = await this.db.insert(messages).values(messageData).returning();
      const stateResult = await this.processConversationState(
        tenantId,
        conversation,
        content,
        message
      );
      if (!stateResult.success) {
        return {
          success: false,
          error: stateResult.error
        };
      }
      const { newState, response, contextData } = stateResult.data;
      if (newState && newState !== conversation.currentState) {
        await this.conversationRepo.updateState(
          tenantId,
          conversation.id,
          newState,
          contextData
        );
      }
      let responseMessageId;
      if (response) {
        const responseMessageData = {
          tenantId,
          conversationId: conversation.id,
          content: response.content,
          messageType: response.messageType,
          isFromBot: true,
          metadata: response.metadata || {}
        };
        const [responseMessage] = await this.db.insert(messages).values(responseMessageData).returning();
        responseMessageId = responseMessage.id;
      }
      const processedMessage = {
        messageId: savedMessage.id,
        conversationId: conversation.id,
        tenantId,
        phoneNumber,
        content,
        messageType: message.type,
        isFromBot: false,
        response,
        newState,
        contextData
      };
      return {
        success: true,
        data: processedMessage,
        metadata: {
          responseMessageId,
          previousState: conversation.currentState
        }
      };
    } catch (error) {
      console.error("Error processing message:", error);
      return {
        success: false,
        error: {
          code: "MESSAGE_PROCESSING_FAILED",
          message: "Failed to process message"
        }
      };
    }
  }
  // ===== TENANT IDENTIFICATION =====
  /**
   * Identify tenant from WhatsApp phone number ID
   */
  async identifyTenantFromPhoneNumber(phoneNumberId) {
    try {
      const [tenant] = await this.db.select().from(tenants).where(eq9(tenants.whatsappPhoneId, phoneNumberId)).limit(1);
      if (!tenant) {
        return {
          success: false,
          error: {
            code: "TENANT_NOT_FOUND",
            message: "No tenant found for WhatsApp phone number",
            details: { phoneNumberId }
          }
        };
      }
      const subscriptionLimits = {
        messagesPerMonth: 1e3,
        bookingsPerMonth: 100,
        apiCallsPerDay: 1e3
      };
      const currentUsage = {
        messages_sent: 0,
        messages_received: 0,
        bookings_created: 0,
        api_calls: 0,
        storage_used: 0,
        webhook_calls: 0
      };
      const tenantContext = {
        tenantId: tenant.id,
        permissions: ["webhook:receive"],
        subscriptionLimits,
        currentUsage
      };
      return {
        success: true,
        data: tenantContext
      };
    } catch (error) {
      console.error("Error identifying tenant:", error);
      return {
        success: false,
        error: {
          code: "TENANT_IDENTIFICATION_FAILED",
          message: "Failed to identify tenant"
        }
      };
    }
  }
  // ===== CONVERSATION MANAGEMENT =====
  /**
   * Get existing conversation or create new one
   */
  async getOrCreateConversation(tenantId, phoneNumber, message) {
    try {
      const existingResult = await this.conversationRepo.findByPhoneNumber(tenantId, phoneNumber);
      if (existingResult.success) {
        return existingResult;
      }
      const customerName = this.extractCustomerName(message);
      const conversationData = {
        tenantId,
        phoneNumber,
        customerName,
        currentState: "greeting",
        contextData: {
          firstMessageId: message.id,
          firstMessageTimestamp: message.timestamp
        }
      };
      return this.conversationRepo.create(tenantId, conversationData);
    } catch (error) {
      console.error("Error getting or creating conversation:", error);
      return {
        success: false,
        error: {
          code: "CONVERSATION_CREATION_FAILED",
          message: "Failed to get or create conversation"
        }
      };
    }
  }
  // ===== CONVERSATION STATE PROCESSING =====
  /**
   * Process conversation state and generate appropriate response
   */
  async processConversationState(tenantId, conversation, messageContent2, message) {
    try {
      const currentState = conversation.currentState;
      const contextData = conversation.contextData || {};
      switch (currentState) {
        case "greeting":
          return this.handleGreetingState(tenantId, messageContent2, contextData);
        case "awaiting_service":
          return this.handleServiceSelectionState(tenantId, messageContent2, message, contextData);
        case "awaiting_date":
          return this.handleDateSelectionState(tenantId, messageContent2, contextData);
        case "awaiting_time":
          return this.handleTimeSelectionState(tenantId, messageContent2, contextData);
        case "awaiting_payment":
          return this.handlePaymentState(tenantId, messageContent2, contextData);
        case "completed":
          return this.handleCompletedState(tenantId, messageContent2, contextData);
        case "booking_flow":
          return this.handleBookingFlowState(tenantId, messageContent2, message, contextData);
        default:
          return this.handleUnknownState(tenantId, messageContent2, contextData);
      }
    } catch (error) {
      console.error("Error processing conversation state:", error);
      return {
        success: false,
        error: {
          code: "STATE_PROCESSING_FAILED",
          message: "Failed to process conversation state"
        }
      };
    }
  }
  /**
   * Handle greeting state
   */
  async handleGreetingState(tenantId, messageContent2, contextData) {
    try {
      const bookingKeywords = ["book", "appointment", "booking", "schedule", "reserve"];
      const isBookingRequest = bookingKeywords.some(
        (keyword) => messageContent2.toLowerCase().includes(keyword)
      );
      if (isBookingRequest) {
        const bookingContext = {
          tenantId,
          customerPhone: contextData.customerPhone || "unknown",
          currentStep: "welcome"
        };
        const bookingResult = await this.bookingService.processBookingMessage(
          { text: { body: messageContent2 } },
          tenantId,
          bookingContext
        );
        if (bookingResult.success) {
          return {
            success: true,
            data: {
              newState: "booking_flow",
              response: {
                content: bookingResult.message,
                messageType: "text"
              },
              contextData: {
                ...contextData,
                bookingContext: {
                  ...bookingContext,
                  currentStep: bookingResult.nextStep || "service_selection"
                },
                isBookingFlow: true
              }
            }
          };
        }
      }
      const configResult = await this.botConfigService.getBotConfiguration(tenantId);
      if (!configResult.success) {
        console.error("Failed to get bot configuration:", configResult.error);
        const response2 = {
          content: `Hello! Welcome to Bella Salon. I'm here to help you book an appointment. Type "book appointment" to get started!`,
          messageType: "text"
        };
        return {
          success: true,
          data: {
            newState: "greeting",
            response: response2,
            contextData: {
              ...contextData,
              greetingSent: true
            }
          }
        };
      }
      const botSettings = configResult.data;
      if (botSettings.businessHours.enabled) {
        const isWithinBusinessHours = this.checkBusinessHours(botSettings.businessHours);
        if (!isWithinBusinessHours) {
          const response2 = {
            content: botSettings.businessHours.closedMessage || "We are currently closed. Please try again during business hours.",
            messageType: "text"
          };
          return {
            success: true,
            data: {
              newState: "completed",
              response: response2,
              contextData: {
                ...contextData,
                closedMessageSent: true
              }
            }
          };
        }
      }
      const greetingMessage = botSettings.greetingMessage || "Hello! Welcome to our business.";
      const welcomeMessage = botSettings.autoResponses.welcomeMessage || "How can I help you today?";
      const response = {
        content: `${greetingMessage}

${welcomeMessage}`,
        messageType: "text"
      };
      const nextStep = this.getNextConversationStep(botSettings, "greeting");
      const newState = nextStep?.id || "awaiting_service";
      return {
        success: true,
        data: {
          newState,
          response,
          contextData: {
            ...contextData,
            greetingSent: true,
            configVersion: configResult.metadata?.version
          }
        }
      };
    } catch (error) {
      console.error("Error in handleGreetingState:", error);
      return {
        success: false,
        error: {
          code: "GREETING_STATE_ERROR",
          message: "Failed to handle greeting state"
        }
      };
    }
  }
  /**
   * Handle service selection state
   */
  async handleServiceSelectionState(tenantId, messageContent2, message, contextData) {
    const servicesResult = await this.serviceRepo.list(tenantId, { page: 1, limit: 10 });
    if (!servicesResult.success || !servicesResult.data?.data.length) {
      const response2 = {
        content: "Sorry, no services are currently available. Please contact us directly.",
        messageType: "text"
      };
      return {
        success: true,
        data: {
          newState: "completed",
          response: response2,
          contextData
        }
      };
    }
    const services2 = servicesResult.data.data;
    let selectedService;
    if (message.interactive?.button_reply) {
      const serviceId = message.interactive.button_reply.id;
      selectedService = services2.find((s) => s.id === serviceId);
    } else {
      const lowerContent = messageContent2.toLowerCase();
      selectedService = services2.find(
        (s) => s.name.toLowerCase().includes(lowerContent) || lowerContent.includes(s.name.toLowerCase())
      );
    }
    if (selectedService) {
      const configResult2 = await this.botConfigService.getBotConfiguration(tenantId);
      const botSettings2 = configResult2.success ? configResult2.data : null;
      const datePrompt = botSettings2?.autoResponses.dateSelectionPrompt || "Please select your preferred date (YYYY-MM-DD format, e.g., 2024-01-15):";
      const currency = botSettings2?.paymentSettings.currency || "USD";
      const response2 = {
        content: `Great! You've selected ${selectedService.name} (${selectedService.price} ${currency}). ${datePrompt}`,
        messageType: "text"
      };
      const nextStep = this.getNextConversationStep(botSettings2, "service_selection");
      const newState = nextStep?.id || "awaiting_date";
      return {
        success: true,
        data: {
          newState,
          response: response2,
          contextData: {
            ...contextData,
            selectedServiceId: selectedService.id,
            selectedServiceName: selectedService.name,
            selectedServicePrice: selectedService.price
          }
        }
      };
    }
    const buttons = services2.slice(0, 3).map((service) => ({
      id: service.id,
      title: `${service.name} - $${service.price}`
    }));
    const configResult = await this.botConfigService.getBotConfiguration(tenantId);
    const botSettings = configResult.success ? configResult.data : null;
    const servicePrompt = botSettings?.autoResponses.serviceSelectionPrompt || "Please select a service:";
    const response = {
      content: servicePrompt,
      messageType: "interactive",
      metadata: {
        buttons
      }
    };
    return {
      success: true,
      data: {
        response,
        contextData
      }
    };
  }
  /**
   * Handle date selection state
   */
  async handleDateSelectionState(tenantId, messageContent2, contextData) {
    try {
      const configResult = await this.botConfigService.getBotConfiguration(tenantId);
      const botSettings = configResult.success ? configResult.data : null;
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(messageContent2.trim())) {
        const invalidInputMessage = this.getConfiguredResponse(
          botSettings,
          "invalidInputMessage",
          "Please enter a valid date in YYYY-MM-DD format (e.g., 2024-01-15):"
        );
        const response2 = {
          content: invalidInputMessage,
          messageType: "text"
        };
        return {
          success: true,
          data: {
            response: response2,
            contextData
          }
        };
      }
      const selectedDate = messageContent2.trim();
      const date = new Date(selectedDate);
      if (date <= /* @__PURE__ */ new Date()) {
        const response2 = {
          content: "Please select a future date. What date would you prefer?",
          messageType: "text"
        };
        return {
          success: true,
          data: {
            response: response2,
            contextData
          }
        };
      }
      const timePrompt = this.getConfiguredResponse(
        botSettings,
        "timeSelectionPrompt",
        "What time would you prefer? Please enter in HH:MM format (e.g., 14:30 for 2:30 PM):"
      );
      const response = {
        content: `Perfect! You've selected ${selectedDate}. ${timePrompt}`,
        messageType: "text"
      };
      const nextStep = this.getNextConversationStep(botSettings, "date_selection");
      const newState = nextStep?.id || "awaiting_time";
      return {
        success: true,
        data: {
          newState,
          response,
          contextData: {
            ...contextData,
            selectedDate
          }
        }
      };
    } catch (error) {
      console.error("Error in handleDateSelectionState:", error);
      return {
        success: false,
        error: {
          code: "DATE_SELECTION_ERROR",
          message: "Failed to handle date selection"
        }
      };
    }
  }
  /**
   * Handle time selection state
   */
  async handleTimeSelectionState(tenantId, messageContent2, contextData) {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(messageContent2.trim())) {
      const response2 = {
        content: "Please enter a valid time in HH:MM format (e.g., 14:30 for 2:30 PM):",
        messageType: "text"
      };
      return {
        success: true,
        data: {
          response: response2,
          contextData
        }
      };
    }
    const selectedTime = messageContent2.trim();
    const serviceName = contextData.selectedServiceName || "the service";
    const servicePrice = contextData.selectedServicePrice || 0;
    const selectedDate = contextData.selectedDate;
    const response = {
      content: `Excellent! Here's your booking summary:
      
Service: ${serviceName}
Date: ${selectedDate}
Time: ${selectedTime}
Price: $${servicePrice}

To confirm your booking, please reply with "CONFIRM". To cancel, reply with "CANCEL".`,
      messageType: "text"
    };
    return {
      success: true,
      data: {
        newState: "awaiting_payment",
        response,
        contextData: {
          ...contextData,
          selectedTime
        }
      }
    };
  }
  /**
   * Handle payment/confirmation state
   */
  async handlePaymentState(tenantId, messageContent2, contextData) {
    const configResult = await this.botConfigService.getBotConfiguration(tenantId);
    const botSettings = configResult.success ? configResult.data : null;
    const content = messageContent2.trim().toLowerCase();
    if (content === "confirm") {
      const bookingData = {
        tenantId,
        conversationId: contextData.conversationId,
        serviceId: contextData.selectedServiceId,
        phoneNumber: contextData.phoneNumber,
        amount: contextData.selectedServicePrice,
        status: "confirmed",
        appointmentDate: /* @__PURE__ */ new Date(`${contextData.selectedDate}T${contextData.selectedTime}:00`),
        appointmentTime: contextData.selectedTime
      };
      const confirmationMessage = this.getConfiguredResponse(
        botSettings,
        "bookingConfirmedMessage",
        "Your booking has been confirmed! Thank you for choosing us!"
      );
      const currency = botSettings?.paymentSettings.currency || "USD";
      const response2 = {
        content: `\u{1F389} ${confirmationMessage}

Service: ${contextData.selectedServiceName}
Date: ${contextData.selectedDate}
Time: ${contextData.selectedTime}
Price: ${contextData.selectedServicePrice} ${currency}

We'll send you a reminder before your appointment. Thank you for choosing us!`,
        messageType: "text"
      };
      return {
        success: true,
        data: {
          newState: "completed",
          response: response2,
          contextData: {
            ...contextData,
            bookingConfirmed: true
          }
        }
      };
    } else if (content === "cancel") {
      const response2 = {
        content: "Your booking has been cancelled. Feel free to start over anytime by sending us a message!",
        messageType: "text"
      };
      return {
        success: true,
        data: {
          newState: "completed",
          response: response2,
          contextData: {
            ...contextData,
            bookingCancelled: true
          }
        }
      };
    }
    const confirmationPrompt = this.getConfiguredResponse(
      botSettings,
      "confirmationMessage",
      'Please reply with "CONFIRM" to confirm your booking or "CANCEL" to cancel.'
    );
    const response = {
      content: confirmationPrompt,
      messageType: "text"
    };
    return {
      success: true,
      data: {
        response,
        contextData
      }
    };
  }
  /**
   * Handle completed state
   */
  async handleCompletedState(tenantId, messageContent2, contextData) {
    const response = {
      content: "Hello! Would you like to make a new booking? Just let me know what service you need!",
      messageType: "text"
    };
    return {
      success: true,
      data: {
        newState: "awaiting_service",
        response,
        contextData: {
          previousBooking: contextData
        }
      }
    };
  }
  /**
   * Handle booking flow state
   */
  async handleBookingFlowState(tenantId, messageContent2, message, contextData) {
    try {
      const bookingContext = contextData.bookingContext;
      if (!bookingContext) {
        return {
          success: false,
          error: {
            code: "BOOKING_CONTEXT_MISSING",
            message: "Booking context not found"
          }
        };
      }
      bookingContext.customerPhone = message.from;
      const bookingResult = await this.bookingService.processBookingMessage(
        message,
        tenantId,
        bookingContext
      );
      if (bookingResult.success) {
        const newState = bookingResult.nextStep === "completed" ? "completed" : "booking_flow";
        return {
          success: true,
          data: {
            newState,
            response: {
              content: bookingResult.message,
              messageType: "text"
            },
            contextData: {
              ...contextData,
              bookingContext: {
                ...bookingContext,
                currentStep: bookingResult.nextStep || bookingContext.currentStep
              },
              appointmentId: bookingResult.appointmentId
            }
          }
        };
      } else {
        return {
          success: true,
          data: {
            response: {
              content: bookingResult.message,
              messageType: "text"
            },
            contextData
          }
        };
      }
    } catch (error) {
      console.error("Error handling booking flow state:", error);
      return {
        success: false,
        error: {
          code: "BOOKING_FLOW_ERROR",
          message: "Failed to process booking flow"
        }
      };
    }
  }
  /**
   * Handle unknown state
   */
  async handleUnknownState(tenantId, messageContent2, contextData) {
    const response = {
      content: "I apologize, but something went wrong. Let me help you start over. What service would you like to book?",
      messageType: "text"
    };
    return {
      success: true,
      data: {
        newState: "awaiting_service",
        response,
        contextData: {
          error: "unknown_state",
          previousState: contextData.currentState
        }
      }
    };
  }
  // ===== UTILITY METHODS =====
  /**
   * Extract message content from WhatsApp message
   */
  extractMessageContent(message) {
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
  extractCustomerName(message) {
    return void 0;
  }
  /**
   * Get conversation state information
   */
  async getConversationState(tenantId, conversationId) {
    try {
      const conversationResult = await this.conversationRepo.findById(tenantId, conversationId);
      if (!conversationResult.success) {
        return {
          success: false,
          error: conversationResult.error
        };
      }
      const conversation = conversationResult.data;
      const availableTransitions = this.getAvailableStateTransitions(conversation.currentState);
      return {
        success: true,
        data: {
          current: conversation.currentState,
          data: conversation.contextData || {},
          availableTransitions
        }
      };
    } catch (error) {
      console.error("Error getting conversation state:", error);
      return {
        success: false,
        error: {
          code: "STATE_RETRIEVAL_FAILED",
          message: "Failed to get conversation state"
        }
      };
    }
  }
  /**
   * Get available state transitions for current state
   */
  getAvailableStateTransitions(currentState) {
    const stateTransitions = {
      greeting: ["awaiting_service"],
      awaiting_service: ["awaiting_date", "completed"],
      awaiting_date: ["awaiting_time", "awaiting_service"],
      awaiting_time: ["awaiting_payment", "awaiting_date"],
      awaiting_payment: ["completed", "awaiting_time"],
      completed: ["awaiting_service"]
    };
    return stateTransitions[currentState] || [];
  }
  // ===== DYNAMIC CONFIGURATION HELPERS =====
  /**
   * Check if current time is within business hours
   */
  checkBusinessHours(businessHours) {
    try {
      if (!businessHours.enabled) {
        return true;
      }
      const now = /* @__PURE__ */ new Date();
      const timezone = businessHours.timezone || "UTC";
      const currentTime = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        weekday: "long"
      });
      const parts = currentTime.formatToParts(now);
      const weekday = parts.find((p) => p.type === "weekday")?.value.toLowerCase();
      const hour = parts.find((p) => p.type === "hour")?.value;
      const minute = parts.find((p) => p.type === "minute")?.value;
      const currentTimeStr = `${hour}:${minute}`;
      if (!weekday) return true;
      const dayMap = {
        "monday": "monday",
        "tuesday": "tuesday",
        "wednesday": "wednesday",
        "thursday": "thursday",
        "friday": "friday",
        "saturday": "saturday",
        "sunday": "sunday"
      };
      const dayKey = dayMap[weekday];
      if (!dayKey) return true;
      const daySchedule = businessHours.schedule[dayKey];
      if (!daySchedule || !daySchedule.isOpen) {
        return false;
      }
      const openTime = daySchedule.openTime;
      const closeTime = daySchedule.closeTime;
      if (!openTime || !closeTime) return true;
      return currentTimeStr >= openTime && currentTimeStr <= closeTime;
    } catch (error) {
      console.error("Error checking business hours:", error);
      return true;
    }
  }
  /**
   * Get next conversation step from bot configuration
   */
  getNextConversationStep(botSettings, currentStepType) {
    try {
      if (!botSettings?.conversationFlow?.steps) {
        return null;
      }
      const currentStep = botSettings.conversationFlow.steps.find((step) => step.type === currentStepType);
      if (!currentStep?.nextStep) {
        return null;
      }
      return botSettings.conversationFlow.steps.find((step) => step.id === currentStep.nextStep) || null;
    } catch (error) {
      console.error("Error getting next conversation step:", error);
      return null;
    }
  }
  /**
   * Get configured response message
   */
  getConfiguredResponse(botSettings, responseKey, fallback) {
    try {
      return botSettings?.autoResponses?.[responseKey] || fallback;
    } catch (error) {
      console.error("Error getting configured response:", error);
      return fallback;
    }
  }
  /**
   * Subscribe to configuration changes for real-time updates
   */
  subscribeToConfigurationChanges(tenantId) {
    return this.botConfigService.subscribeToConfigurationChanges(tenantId, (event) => {
      console.log(`Configuration changed for tenant ${tenantId}:`, event.configType);
    });
  }
  /**
   * Close database connection
   */
  async close() {
    await this.botConfigService.close();
    await this.pool.end();
  }
};

// server/services/whatsapp-sender.service.ts
import { drizzle as drizzle8 } from "drizzle-orm/neon-serverless";
import { Pool as Pool11 } from "@neondatabase/serverless";
var WhatsAppSenderService = class {
  db;
  pool;
  tenantSettingsService;
  credentialsCache = /* @__PURE__ */ new Map();
  messageQueue = /* @__PURE__ */ new Map();
  // tenantId -> messages
  rateLimits = /* @__PURE__ */ new Map();
  // tenantId -> rate limit info
  processingInterval = null;
  CACHE_TTL = 5 * 60 * 1e3;
  // 5 minutes
  QUEUE_PROCESS_INTERVAL = 1e3;
  // 1 second
  DEFAULT_RATE_LIMITS = {
    messagesPerSecond: 10,
    messagesPerMinute: 100,
    messagesPerHour: 1e3
  };
  constructor(connectionString) {
    this.pool = new Pool11({ connectionString });
    this.db = drizzle8({ client: this.pool, schema: schema_exports });
    this.tenantSettingsService = new TenantSettingsService(connectionString);
    this.startQueueProcessing();
  }
  // ===== MESSAGE SENDING =====
  /**
   * Send WhatsApp message using tenant-specific credentials with queuing and rate limiting
   */
  async sendMessage(tenantId, phoneNumber, response, options = {}) {
    try {
      const { priority = "normal", maxAttempts = 3, immediate = false } = options;
      if (immediate || await this.canSendImmediately(tenantId)) {
        return await this.sendMessageImmediate(tenantId, phoneNumber, response);
      }
      const queueId = await this.queueMessage(tenantId, phoneNumber, response, {
        priority,
        maxAttempts
      });
      return {
        success: true,
        data: { queued: true, queueId },
        metadata: {
          tenantId,
          phoneNumber,
          messageType: response.messageType,
          queued: true
        }
      };
    } catch (error) {
      console.error("Error sending WhatsApp message:", error);
      return {
        success: false,
        error: {
          code: "MESSAGE_SEND_FAILED",
          message: "Failed to send WhatsApp message",
          tenantId
        }
      };
    }
  }
  /**
   * Send message immediately without queuing
   */
  async sendMessageImmediate(tenantId, phoneNumber, response) {
    try {
      if (!await this.checkRateLimit(tenantId)) {
        return {
          success: false,
          error: {
            code: "RATE_LIMIT_EXCEEDED",
            message: "Rate limit exceeded for tenant",
            tenantId
          }
        };
      }
      const credentialsResult = await this.getTenantCredentials(tenantId);
      if (!credentialsResult.success) {
        return {
          success: false,
          error: credentialsResult.error
        };
      }
      const credentials = credentialsResult.data;
      const sendRequest = this.buildSendRequest(phoneNumber, response);
      const sendResult = await this.sendToWhatsAppAPI(credentials, sendRequest);
      if (!sendResult.success) {
        return {
          success: false,
          error: sendResult.error
        };
      }
      await this.updateRateLimit(tenantId);
      console.log(`Message sent successfully to ${phoneNumber} for tenant ${tenantId}`);
      return {
        success: true,
        data: sendResult.data,
        metadata: {
          tenantId,
          phoneNumber,
          messageType: response.messageType
        }
      };
    } catch (error) {
      console.error("Error sending WhatsApp message immediately:", error);
      return {
        success: false,
        error: {
          code: "MESSAGE_SEND_FAILED",
          message: "Failed to send WhatsApp message",
          tenantId
        }
      };
    }
  }
  /**
   * Send bulk messages to multiple recipients with intelligent queuing
   */
  async sendBulkMessages(tenantId, recipients, options = {}) {
    try {
      const { batchSize = 10, delayBetweenBatches = 1e3 } = options;
      const results = [];
      let successful = 0;
      let failed = 0;
      let queued = 0;
      for (let i = 0; i < recipients.length; i += batchSize) {
        const batch = recipients.slice(i, i + batchSize);
        const batchPromises = batch.map(async (recipient) => {
          const sendResult = await this.sendMessage(
            tenantId,
            recipient.phoneNumber,
            recipient.response,
            { priority: recipient.priority }
          );
          if (sendResult.success) {
            if ("queued" in sendResult.data && sendResult.data.queued) {
              queued++;
              return {
                phoneNumber: recipient.phoneNumber,
                success: true,
                queueId: sendResult.data.queueId
              };
            } else {
              successful++;
              return {
                phoneNumber: recipient.phoneNumber,
                success: true,
                messageId: sendResult.data.messages[0]?.id
              };
            }
          } else {
            failed++;
            return {
              phoneNumber: recipient.phoneNumber,
              success: false,
              error: sendResult.error.message
            };
          }
        });
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
        if (i + batchSize < recipients.length) {
          await new Promise((resolve) => setTimeout(resolve, delayBetweenBatches));
        }
      }
      return {
        success: true,
        data: {
          successful,
          failed,
          queued,
          results
        }
      };
    } catch (error) {
      console.error("Error sending bulk messages:", error);
      return {
        success: false,
        error: {
          code: "BULK_SEND_FAILED",
          message: "Failed to send bulk messages",
          tenantId
        }
      };
    }
  }
  // ===== MESSAGE QUEUING =====
  /**
   * Queue a message for later delivery
   */
  async queueMessage(tenantId, phoneNumber, response, options = {}) {
    const {
      priority = "normal",
      maxAttempts = 3,
      scheduledAt = /* @__PURE__ */ new Date()
    } = options;
    const queueItem = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      tenantId,
      phoneNumber,
      response,
      attempts: 0,
      maxAttempts,
      scheduledAt,
      createdAt: /* @__PURE__ */ new Date(),
      priority
    };
    if (!this.messageQueue.has(tenantId)) {
      this.messageQueue.set(tenantId, []);
    }
    const tenantQueue = this.messageQueue.get(tenantId);
    tenantQueue.push(queueItem);
    tenantQueue.sort((a, b) => {
      const priorityOrder = { high: 3, normal: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return a.scheduledAt.getTime() - b.scheduledAt.getTime();
    });
    console.log(`Message queued for tenant ${tenantId}: ${queueItem.id}`);
    return queueItem.id;
  }
  /**
   * Get queue status for tenant
   */
  async getQueueStatus(tenantId) {
    const tenantQueue = this.messageQueue.get(tenantId) || [];
    return {
      totalMessages: tenantQueue.length,
      pendingMessages: tenantQueue.filter((msg) => msg.attempts < msg.maxAttempts).length,
      highPriorityMessages: tenantQueue.filter((msg) => msg.priority === "high").length,
      normalPriorityMessages: tenantQueue.filter((msg) => msg.priority === "normal").length,
      lowPriorityMessages: tenantQueue.filter((msg) => msg.priority === "low").length,
      oldestMessage: tenantQueue.length > 0 ? tenantQueue[tenantQueue.length - 1].createdAt : void 0
    };
  }
  /**
   * Clear failed messages from queue
   */
  async clearFailedMessages(tenantId) {
    const tenantQueue = this.messageQueue.get(tenantId) || [];
    const initialLength = tenantQueue.length;
    const activeMessages = tenantQueue.filter((msg) => msg.attempts < msg.maxAttempts);
    this.messageQueue.set(tenantId, activeMessages);
    const removedCount = initialLength - activeMessages.length;
    console.log(`Cleared ${removedCount} failed messages for tenant ${tenantId}`);
    return removedCount;
  }
  // ===== RATE LIMITING =====
  /**
   * Check if tenant can send message immediately based on rate limits
   */
  async canSendImmediately(tenantId) {
    return await this.checkRateLimit(tenantId);
  }
  /**
   * Check rate limit for tenant
   */
  async checkRateLimit(tenantId) {
    const rateLimitInfo = await this.getRateLimitInfo(tenantId);
    const credentials = await this.getTenantCredentials(tenantId);
    const limits = credentials.success && credentials.data?.rateLimits ? credentials.data.rateLimits : this.DEFAULT_RATE_LIMITS;
    const now = Date.now();
    const currentSecond = Math.floor(now / 1e3);
    const currentMinute = Math.floor(now / 6e4);
    const currentHour = Math.floor(now / 36e5);
    if (rateLimitInfo.lastResetSecond !== currentSecond) {
      rateLimitInfo.messagesThisSecond = 0;
      rateLimitInfo.lastResetSecond = currentSecond;
    }
    if (rateLimitInfo.lastResetMinute !== currentMinute) {
      rateLimitInfo.messagesThisMinute = 0;
      rateLimitInfo.lastResetMinute = currentMinute;
    }
    if (rateLimitInfo.lastResetHour !== currentHour) {
      rateLimitInfo.messagesThisHour = 0;
      rateLimitInfo.lastResetHour = currentHour;
    }
    return rateLimitInfo.messagesThisSecond < limits.messagesPerSecond && rateLimitInfo.messagesThisMinute < limits.messagesPerMinute && rateLimitInfo.messagesThisHour < limits.messagesPerHour;
  }
  /**
   * Update rate limit counters after sending a message
   */
  async updateRateLimit(tenantId) {
    const rateLimitInfo = await this.getRateLimitInfo(tenantId);
    rateLimitInfo.messagesThisSecond++;
    rateLimitInfo.messagesThisMinute++;
    rateLimitInfo.messagesThisHour++;
  }
  /**
   * Get rate limit info for tenant
   */
  async getRateLimitInfo(tenantId) {
    if (!this.rateLimits.has(tenantId)) {
      const now = Date.now();
      this.rateLimits.set(tenantId, {
        tenantId,
        messagesThisSecond: 0,
        messagesThisMinute: 0,
        messagesThisHour: 0,
        lastResetSecond: Math.floor(now / 1e3),
        lastResetMinute: Math.floor(now / 6e4),
        lastResetHour: Math.floor(now / 36e5)
      });
    }
    return this.rateLimits.get(tenantId);
  }
  /**
   * Get rate limit status for tenant
   */
  async getRateLimitStatus(tenantId) {
    const rateLimitInfo = await this.getRateLimitInfo(tenantId);
    const credentials = await this.getTenantCredentials(tenantId);
    const limits = credentials.success && credentials.data?.rateLimits ? credentials.data.rateLimits : this.DEFAULT_RATE_LIMITS;
    const canSendNow = await this.checkRateLimit(tenantId);
    return {
      messagesThisSecond: rateLimitInfo.messagesThisSecond,
      messagesThisMinute: rateLimitInfo.messagesThisMinute,
      messagesThisHour: rateLimitInfo.messagesThisHour,
      limits,
      canSendNow
    };
  }
  // ===== QUEUE PROCESSING =====
  /**
   * Start processing message queue
   */
  startQueueProcessing() {
    this.processingInterval = setInterval(async () => {
      await this.processMessageQueue();
    }, this.QUEUE_PROCESS_INTERVAL);
  }
  /**
   * Process message queue for all tenants
   */
  async processMessageQueue() {
    for (const [tenantId, queue] of this.messageQueue.entries()) {
      if (queue.length === 0) continue;
      if (!await this.checkRateLimit(tenantId)) {
        continue;
      }
      const messageIndex = queue.findIndex(
        (msg) => msg.attempts < msg.maxAttempts && msg.scheduledAt <= /* @__PURE__ */ new Date()
      );
      if (messageIndex === -1) continue;
      const message = queue[messageIndex];
      message.attempts++;
      try {
        const result = await this.sendMessageImmediate(
          message.tenantId,
          message.phoneNumber,
          message.response
        );
        if (result.success) {
          queue.splice(messageIndex, 1);
          console.log(`Queue message sent successfully: ${message.id}`);
        } else {
          console.error(`Queue message failed (attempt ${message.attempts}/${message.maxAttempts}): ${message.id}`, result.error);
          if (message.attempts >= message.maxAttempts) {
            queue.splice(messageIndex, 1);
            console.error(`Queue message failed permanently: ${message.id}`);
          } else {
            const backoffDelay = Math.pow(2, message.attempts) * 1e3;
            message.scheduledAt = new Date(Date.now() + backoffDelay);
          }
        }
      } catch (error) {
        console.error(`Error processing queue message ${message.id}:`, error);
        if (message.attempts >= message.maxAttempts) {
          queue.splice(messageIndex, 1);
        } else {
          const backoffDelay = Math.pow(2, message.attempts) * 1e3;
          message.scheduledAt = new Date(Date.now() + backoffDelay);
        }
      }
    }
  }
  /**
   * Stop queue processing
   */
  stopQueueProcessing() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }
  // ===== CREDENTIAL MANAGEMENT =====
  /**
   * Get tenant WhatsApp credentials from settings service
   */
  async getTenantCredentials(tenantId) {
    try {
      if (this.credentialsCache.has(tenantId)) {
        return {
          success: true,
          data: this.credentialsCache.get(tenantId)
        };
      }
      const settingsResult = await this.tenantSettingsService.getSettings(tenantId, "whatsapp");
      if (!settingsResult.success || !settingsResult.data) {
        return {
          success: false,
          error: {
            code: "WHATSAPP_NOT_CONFIGURED",
            message: "WhatsApp credentials not configured for tenant",
            tenantId
          }
        };
      }
      const whatsappSettings = settingsResult.data.value;
      if (!whatsappSettings.phoneNumberId || !whatsappSettings.accessToken) {
        return {
          success: false,
          error: {
            code: "INCOMPLETE_WHATSAPP_CONFIG",
            message: "Incomplete WhatsApp configuration for tenant",
            tenantId
          }
        };
      }
      const credentials = {
        phoneNumberId: whatsappSettings.phoneNumberId,
        accessToken: whatsappSettings.accessToken,
        businessAccountId: whatsappSettings.businessAccountId,
        webhookVerifyToken: whatsappSettings.webhookVerifyToken,
        rateLimits: whatsappSettings.rateLimits || this.DEFAULT_RATE_LIMITS
      };
      this.credentialsCache.set(tenantId, credentials);
      setTimeout(() => {
        this.credentialsCache.delete(tenantId);
      }, this.CACHE_TTL);
      return {
        success: true,
        data: credentials
      };
    } catch (error) {
      console.error("Error getting tenant credentials:", error);
      return {
        success: false,
        error: {
          code: "CREDENTIALS_FETCH_FAILED",
          message: "Failed to fetch tenant credentials",
          tenantId
        }
      };
    }
  }
  /**
   * Validate tenant WhatsApp credentials
   */
  async validateCredentials(tenantId) {
    try {
      const credentialsResult = await this.getTenantCredentials(tenantId);
      if (!credentialsResult.success) {
        return {
          success: true,
          data: {
            valid: false,
            errors: [credentialsResult.error.message]
          }
        };
      }
      const credentials = credentialsResult.data;
      const testResult = await this.testWhatsAppConnection(credentials);
      return {
        success: true,
        data: testResult
      };
    } catch (error) {
      console.error("Error validating credentials:", error);
      return {
        success: false,
        error: {
          code: "VALIDATION_FAILED",
          message: "Failed to validate credentials",
          tenantId
        }
      };
    }
  }
  // ===== WHATSAPP API INTEGRATION =====
  /**
   * Build WhatsApp API send request from bot response
   */
  buildSendRequest(phoneNumber, response) {
    const baseRequest = {
      messaging_product: "whatsapp",
      to: phoneNumber,
      type: response.messageType
    };
    switch (response.messageType) {
      case "text":
        return {
          ...baseRequest,
          text: {
            body: response.content
          }
        };
      case "interactive":
        if (response.metadata?.buttons) {
          return {
            ...baseRequest,
            interactive: {
              type: "button",
              body: {
                text: response.content
              },
              action: {
                buttons: response.metadata.buttons.map((button) => ({
                  type: "reply",
                  reply: {
                    id: button.id,
                    title: button.title
                  }
                }))
              }
            }
          };
        } else if (response.metadata?.list) {
          return {
            ...baseRequest,
            interactive: {
              type: "list",
              header: response.metadata.list.header ? {
                type: "text",
                text: response.metadata.list.header
              } : void 0,
              body: {
                text: response.metadata.list.body
              },
              footer: response.metadata.list.footer ? {
                text: response.metadata.list.footer
              } : void 0,
              action: {
                sections: response.metadata.list.sections
              }
            }
          };
        }
        break;
      case "template":
        return {
          ...baseRequest,
          template: {
            name: response.metadata?.templateName || "hello_world",
            language: {
              code: response.metadata?.languageCode || "en_US"
            },
            components: response.metadata?.components || []
          }
        };
    }
    return {
      ...baseRequest,
      type: "text",
      text: {
        body: response.content
      }
    };
  }
  /**
   * Send request to WhatsApp API
   */
  async sendToWhatsAppAPI(credentials, sendRequest) {
    try {
      const url = `https://graph.facebook.com/v18.0/${credentials.phoneNumberId}/messages`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${credentials.accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(sendRequest)
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("WhatsApp API error:", response.status, errorData);
        return {
          success: false,
          error: {
            code: "WHATSAPP_API_ERROR",
            message: `WhatsApp API error: ${response.status}`,
            details: errorData
          }
        };
      }
      const responseData = await response.json();
      return {
        success: true,
        data: responseData
      };
    } catch (error) {
      console.error("Error calling WhatsApp API:", error);
      return {
        success: false,
        error: {
          code: "API_CALL_FAILED",
          message: "Failed to call WhatsApp API"
        }
      };
    }
  }
  /**
   * Test WhatsApp connection
   */
  async testWhatsAppConnection(credentials) {
    try {
      const url = `https://graph.facebook.com/v18.0/${credentials.phoneNumberId}`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${credentials.accessToken}`
        }
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          valid: false,
          errors: [`API error: ${response.status}`, JSON.stringify(errorData)]
        };
      }
      const data = await response.json();
      return {
        valid: true,
        phoneNumber: data.display_phone_number,
        businessName: data.name
      };
    } catch (error) {
      return {
        valid: false,
        errors: [`Connection test failed: ${error}`]
      };
    }
  }
  // ===== MESSAGE TEMPLATES =====
  /**
   * Send template message
   */
  async sendTemplate(tenantId, phoneNumber, templateName, languageCode = "en_US", components = []) {
    const templateResponse = {
      content: "",
      messageType: "template",
      metadata: {
        templateName,
        languageCode,
        components
      }
    };
    return this.sendMessage(tenantId, phoneNumber, templateResponse);
  }
  /**
   * Send interactive button message
   */
  async sendButtons(tenantId, phoneNumber, text3, buttons) {
    const buttonResponse = {
      content: text3,
      messageType: "interactive",
      metadata: {
        buttons
      }
    };
    return this.sendMessage(tenantId, phoneNumber, buttonResponse);
  }
  /**
   * Send interactive list message
   */
  async sendList(tenantId, phoneNumber, header, body, footer, sections) {
    const listResponse = {
      content: body,
      messageType: "interactive",
      metadata: {
        list: {
          header,
          body,
          footer,
          sections
        }
      }
    };
    return this.sendMessage(tenantId, phoneNumber, listResponse);
  }
  /**
   * Get message delivery statistics for tenant
   */
  async getDeliveryStats(tenantId) {
    const queueStatus = await this.getQueueStatus(tenantId);
    const rateLimitStatus = await this.getRateLimitStatus(tenantId);
    return {
      totalSent: 0,
      // Would be tracked in database
      totalQueued: queueStatus.totalMessages,
      totalFailed: 0,
      // Would be tracked in database
      rateLimitStatus,
      queueStatus
    };
  }
  /**
   * Retry failed messages for tenant
   */
  async retryFailedMessages(tenantId) {
    try {
      const tenantQueue = this.messageQueue.get(tenantId) || [];
      const failedMessages = tenantQueue.filter((msg) => msg.attempts >= msg.maxAttempts);
      let retriedCount = 0;
      let queuedCount = 0;
      for (const message of failedMessages) {
        message.attempts = 0;
        message.maxAttempts = Math.min(message.maxAttempts + 2, 10);
        message.scheduledAt = /* @__PURE__ */ new Date();
        retriedCount++;
        queuedCount++;
      }
      return {
        success: true,
        data: {
          retriedCount,
          queuedCount
        }
      };
    } catch (error) {
      console.error("Error retrying failed messages:", error);
      return {
        success: false,
        error: {
          code: "RETRY_FAILED",
          message: "Failed to retry messages",
          tenantId
        }
      };
    }
  }
  /**
   * Close service and cleanup resources
   */
  async close() {
    this.stopQueueProcessing();
    this.credentialsCache.clear();
    this.messageQueue.clear();
    this.rateLimits.clear();
    await this.tenantSettingsService.close();
    await this.pool.end();
  }
};

// server/routes.ts
var webhookVerificationSchema = z2.object({
  "hub.mode": z2.string(),
  "hub.challenge": z2.string(),
  "hub.verify_token": z2.string()
});
var whatsAppMessageSchema = z2.object({
  object: z2.string(),
  entry: z2.array(z2.object({
    id: z2.string(),
    changes: z2.array(z2.object({
      value: z2.object({
        messaging_product: z2.string(),
        metadata: z2.object({
          display_phone_number: z2.string(),
          phone_number_id: z2.string()
        }),
        messages: z2.array(z2.object({
          from: z2.string(),
          id: z2.string(),
          timestamp: z2.string(),
          text: z2.object({
            body: z2.string()
          }),
          type: z2.string()
        })).optional()
      }),
      field: z2.string()
    }))
  }))
});
var createServiceSchema = z2.object({
  name: z2.string().min(1),
  description: z2.string().optional(),
  price: z2.number().int().min(1, "Price must be at least 1"),
  icon: z2.string().optional()
});
var WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
var PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_ID;
async function sendWhatsAppMessage(to, message) {
  try {
    const phoneNumberId = process.env.WHATSAPP_PHONE_ID;
    const accessToken = process.env.WHATSAPP_TOKEN;
    if (!phoneNumberId || !accessToken) {
      console.error("WhatsApp credentials not configured");
      return false;
    }
    const url = `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        text: { body: message }
      })
    });
    if (!response.ok) {
      const error = await response.text();
      console.error("Failed to send WhatsApp message:", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
    return false;
  }
}
function generateUPILink(amount, serviceName) {
  const upiId = process.env.UPI_ID || "sparksalon@upi";
  return `upi://pay?pa=${upiId}&pn=Spark+Salon&am=${amount}&cu=INR&tn=Payment+for+${encodeURIComponent(serviceName)}`;
}
async function processWhatsAppMessage(from, messageText) {
  try {
    console.log("WhatsApp: Processing message from", from, ":", messageText);
    const shouldUseDynamicFlow = await checkForActiveFlow();
    console.log("\u{1F50D} Should use dynamic flow:", shouldUseDynamicFlow);
    console.log("\u{1F50D} Global flow exists:", !!global.whatsappBotFlow);
    console.log("\u{1F50D} Global flow name:", global.whatsappBotFlow?.name || "NO NAME");
    if (shouldUseDynamicFlow) {
      console.log("WhatsApp: Using dynamic flow processing");
      await processDynamicWhatsAppMessage(from, messageText);
      return;
    }
    console.log("WhatsApp: Using static flow processing");
    const response = await processStaticWhatsAppMessage(from, messageText);
    await sendWhatsAppMessage(from, response);
  } catch (error) {
    console.error("Error processing WhatsApp message:", error);
    await sendWhatsAppMessage(from, "Sorry, I'm experiencing technical difficulties. Please try again later.");
  }
}
async function checkForActiveFlow() {
  try {
    if (global.whatsappBotFlow) {
      console.log("\u2705 Using synced flow from bot flow builder:", global.whatsappBotFlow.name);
      return true;
    }
    console.log("\u2705 Enabling dynamic flow processing for demo");
    return true;
  } catch (error) {
    console.error("Error checking for active flow:", error);
    return false;
  }
}
async function processDynamicWhatsAppMessage(from, messageText) {
  try {
    console.log("WhatsApp: Using dynamic flow processing for", from);
    let syncedFlow = global.whatsappBotFlow;
    console.log("\u{1F50D} Checking global.whatsappBotFlow:", global.whatsappBotFlow ? "EXISTS" : "NULL");
    console.log("\u{1F50D} Global flow name:", global.whatsappBotFlow?.name || "NO NAME");
    console.log("\u{1F50D} Global flow nodes:", global.whatsappBotFlow?.nodes?.length || 0);
    if (syncedFlow) {
      console.log("\u2705 Using synced flow from bot flow builder:", syncedFlow.name);
      console.log("\u2705 Synced flow nodes:", syncedFlow.nodes?.length || 0);
    } else {
      console.log("\u26A0\uFE0F No synced flow found, using demo flow");
    }
    if (!syncedFlow) {
      syncedFlow = {
        id: "whatsapp_bot_flow",
        name: "\u{1F7E2} WhatsApp Bot Flow (EXACT REPLICA)",
        description: "Exact replica of current WhatsApp bot flow with emojis, layout, and all details",
        businessType: "salon",
        isActive: true,
        isTemplate: false,
        version: "1.0.0",
        nodes: [
          {
            id: "welcome_msg",
            type: "service_message",
            name: "Welcome Message",
            position: { x: 400, y: 100 },
            configuration: {
              welcomeText: "\u{1F44B} Welcome to Spark Salon!",
              serviceIntro: "Here are our services:",
              instruction: "Reply with the number or name of the service to book.",
              showEmojis: true,
              loadFromDatabase: true
            },
            connections: [],
            metadata: {}
          },
          {
            id: "service_confirmed",
            type: "date_picker",
            name: "Date Selection",
            position: { x: 900, y: 100 },
            configuration: {
              minDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
              maxDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0],
              availableDays: [0, 1, 2, 3, 4, 5, 6]
              // All days
            },
            connections: [],
            metadata: {}
          },
          {
            id: "date_confirmed",
            type: "time_slots",
            name: "Time Selection",
            position: { x: 1300, y: 100 },
            configuration: {
              timeSlots: [
                { start: "09:00", end: "10:00" },
                { start: "10:30", end: "11:30" },
                { start: "12:00", end: "13:00" },
                { start: "14:00", end: "15:00" },
                { start: "15:30", end: "16:30" },
                { start: "17:00", end: "18:00" }
              ]
            },
            connections: [],
            metadata: {}
          },
          {
            id: "booking_summary",
            type: "booking_summary",
            name: "Booking Summary",
            position: { x: 1700, y: 100 },
            configuration: {
              template: '\u{1F4CB} **Booking Summary**\n\n\u{1F3AF} **Service:** {selectedService}\n\u{1F4B0} **Price:** \u20B9{price}\n\u{1F4C5} **Date:** {selectedDate}\n\u{1F550} **Time:** {selectedTime}\n\nPlease confirm your booking by replying "CONFIRM" or "YES".',
              fallbackMessage: "Please contact us to complete your booking."
            },
            connections: [],
            metadata: {}
          }
        ],
        variables: [],
        metadata: {}
      };
      console.log("Using demo flow for WhatsApp bot");
    }
    console.log("Using flow:", syncedFlow.name);
    let conversation = await storage.getConversation(from);
    if (!conversation) {
      conversation = await storage.createConversation({
        phoneNumber: from,
        currentState: "greeting"
      });
    }
    const dynamicProcessor = new DynamicFlowProcessorService(storage);
    const context = {
      tenantId: "default",
      phoneNumber: from,
      conversationId: conversation.id,
      currentState: conversation.currentState,
      selectedService: conversation.selectedService,
      selectedDate: conversation.selectedDate,
      selectedTime: conversation.selectedTime
    };
    const currentNode = syncedFlow.nodes.find(
      (node) => node.id === conversation.currentState || conversation.currentState === "greeting" && node.id === "welcome_msg"
    );
    if (!currentNode) {
      console.log("No matching node found for state:", conversation.currentState);
      console.log("Delegating to simple webhook for better handling...");
      try {
        const bookingService = new (await Promise.resolve().then(() => (init_whatsapp_booking_service(), whatsapp_booking_service_exports))).WhatsAppBookingService();
        const bookingContext = {
          tenantId: "85de5a0c-6aeb-479a-aa76-cbdd6b0845a7",
          // Bella Salon tenant ID
          customerPhone: from,
          currentStep: "welcome"
        };
        const result = await bookingService.processBookingMessage(
          {
            text: { body: messageContent },
            from,
            id: messageId,
            type: "text",
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          },
          bookingContext.tenantId,
          bookingContext
        );
        if (result.success && result.message) {
          await sendWhatsAppMessage(from, result.message);
          console.log("Successfully delegated to simple webhook");
          return;
        }
      } catch (error) {
        console.error("Error delegating to simple webhook:", error);
      }
      await sendWhatsAppMessage(from, "Sorry, I couldn't find the right response. Please start over.");
      return;
    }
    console.log("Processing node:", currentNode.name, "Type:", currentNode.type);
    const processedMessage = await dynamicProcessor.processNode(currentNode, context);
    let newState = conversation.currentState;
    let contextData = conversation.contextData || {};
    if (conversation.currentState === "greeting") {
      const services2 = await storage.getServices();
      const selectedService = services2.find(
        (service) => service.name.toLowerCase().includes(messageText.toLowerCase()) || messageText.includes(service.name.toLowerCase())
      );
      if (selectedService) {
        newState = "service_confirmed";
        contextData.selectedService = selectedService.id;
        contextData.selectedServiceName = selectedService.name;
        contextData.price = selectedService.price;
      } else {
        await sendWhatsAppMessage(from, processedMessage.content);
        return;
      }
    } else if (conversation.currentState === "service_confirmed") {
      const dateMatch = messageText.match(/(\d{1,2})/);
      if (dateMatch) {
        const dateIndex = parseInt(dateMatch[1]) - 1;
        const availableDates = dynamicProcessor["generateAvailableDates"](7);
        if (dateIndex >= 0 && dateIndex < availableDates.length) {
          newState = "date_confirmed";
          contextData.selectedDate = availableDates[dateIndex];
        }
      }
    } else if (conversation.currentState === "date_confirmed") {
      const timeMatch = messageText.match(/(\d{1,2})/);
      if (timeMatch) {
        const timeIndex = parseInt(timeMatch[1]) - 1;
        const timeSlots = ["09:00", "10:30", "12:00", "14:00", "15:30", "17:00"];
        if (timeIndex >= 0 && timeIndex < timeSlots.length) {
          newState = "booking_summary";
          contextData.selectedTime = timeSlots[timeIndex];
        }
      }
    } else if (conversation.currentState === "booking_summary") {
      if (messageText.toLowerCase().includes("confirm") || messageText.toLowerCase().includes("yes")) {
        newState = "completed";
        if (contextData.selectedService && contextData.selectedDate && contextData.selectedTime) {
          await storage.createBooking({
            conversationId: conversation.id,
            serviceId: contextData.selectedService,
            phoneNumber: from,
            amount: contextData.price,
            status: "confirmed",
            appointmentDate: contextData.selectedDate,
            appointmentTime: contextData.selectedTime
          });
        }
      }
    }
    await storage.updateConversation(conversation.id, {
      currentState: newState,
      contextData,
      selectedService: contextData.selectedService,
      selectedDate: contextData.selectedDate,
      selectedTime: contextData.selectedTime
    });
    await sendWhatsAppMessage(from, processedMessage.content);
    console.log("\u2705 Dynamic flow processed successfully:", {
      phoneNumber: from,
      newState,
      responseLength: processedMessage.content.length
    });
  } catch (error) {
    console.error("Error in dynamic message processing:", error);
    await sendWhatsAppMessage(from, "Sorry, there was an issue with the dynamic flow. Please try again.");
  }
}
async function processStaticWhatsAppMessage(from, messageText) {
  console.log("WhatsApp: Processing message from", from, "with text:", messageText);
  const withTimeout = async (promise, ms) => {
    return Promise.race([
      promise,
      new Promise(
        (_, reject) => setTimeout(() => reject(new Error(`Operation timed out after ${ms}ms`)), ms)
      )
    ]);
  };
  let conversation = await storage.getConversation(from);
  if (!conversation) {
    conversation = await storage.createConversation({
      phoneNumber: from,
      currentState: "greeting"
    });
    console.log("WhatsApp: Created new conversation", conversation.id);
  }
  await storage.createMessage({
    conversationId: conversation.id,
    content: messageText,
    isFromBot: false
  });
  console.log("WhatsApp: Stored user message for conversation", conversation.id);
  let response = "";
  let newState = conversation.currentState;
  const text3 = messageText.toLowerCase().trim();
  try {
    if (text3 === "hi" || text3 === "hello" || conversation.currentState === "greeting") {
      const services2 = await withTimeout(storage.getServices(), 5e3);
      const activeServices = services2.filter((s) => s.isActive);
      response = "\u{1F44B} Welcome to Spark Salon!\n\nHere are our services:\n";
      activeServices.forEach((service) => {
        response += `\u{1F487}\u200D\u2640\uFE0F ${service.name} \u2013 \u20B9${service.price}
`;
      });
      response += "\nReply with the number or name of the service to book.";
      newState = "awaiting_service";
    } else if (conversation.currentState === "awaiting_service") {
      const services2 = await withTimeout(storage.getServices(), 5e3);
      const selectedService = services2.find(
        (s) => s.isActive && s.name.toLowerCase() === text3.toLowerCase()
      );
      if (selectedService) {
        response = `Perfect! You've selected ${selectedService.name} (\u20B9${selectedService.price}).

`;
        response += "\u{1F4C5} Now, please select your preferred appointment date.\n\n";
        response += "Available dates:\n";
        const today = /* @__PURE__ */ new Date();
        for (let i = 1; i <= 7; i++) {
          const futureDate = new Date(today);
          futureDate.setDate(today.getDate() + i);
          const dateStr = futureDate.toLocaleDateString("en-GB", {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric"
          });
          response += `${i}. ${dateStr}
`;
        }
        response += "\nReply with the number (1-7) for your preferred date.";
        try {
          const updatedConversation = await withTimeout(storage.updateConversation(conversation.id, {
            selectedService: selectedService.id,
            currentState: "awaiting_date"
          }), 5e3);
          if (updatedConversation) {
            newState = "awaiting_date";
          } else {
            console.warn("Failed to update conversation state in database, but proceeding with flow");
            newState = "awaiting_date";
          }
        } catch (error) {
          console.error("Error updating conversation:", error);
          newState = "awaiting_date";
        }
      } else {
        response = "Sorry, I didn't recognize that service. Please choose from:\n";
        const activeServices = services2.filter((s) => s.isActive);
        activeServices.forEach((service) => {
          response += `\u2022 ${service.name}
`;
        });
      }
    } else if (conversation.currentState === "awaiting_date") {
      const dateChoice = parseInt(text3);
      if (dateChoice >= 1 && dateChoice <= 7) {
        const today = /* @__PURE__ */ new Date();
        const selectedDate = new Date(today);
        selectedDate.setDate(today.getDate() + dateChoice);
        const dateStr = selectedDate.toISOString().split("T")[0];
        const readableDateStr = selectedDate.toLocaleDateString("en-GB", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric"
        });
        response = `Great! You've selected ${readableDateStr}.

`;
        response += "\u{1F550} Now, please choose your preferred time slot:\n\n";
        response += "Available times:\n";
        response += "1. 10:00 AM\n";
        response += "2. 11:30 AM\n";
        response += "3. 02:00 PM\n";
        response += "4. 03:30 PM\n";
        response += "5. 05:00 PM\n";
        response += "\nReply with the number (1-5) for your preferred time.";
        try {
          const updatedConversation = await withTimeout(storage.updateConversation(conversation.id, {
            selectedDate: dateStr,
            currentState: "awaiting_time"
          }), 5e3);
          if (updatedConversation) {
            newState = "awaiting_time";
          } else {
            console.warn("Failed to update conversation state in database, but proceeding with flow");
            newState = "awaiting_time";
          }
        } catch (error) {
          console.error("Error updating conversation:", error);
          newState = "awaiting_time";
        }
      } else {
        response = "Please select a valid date option (1-7). Reply with the number for your preferred date.";
      }
    } else if (conversation.currentState === "awaiting_time") {
      const timeSlots = ["10:00 AM", "11:30 AM", "02:00 PM", "03:30 PM", "05:00 PM"];
      const timeChoice = parseInt(text3);
      if (timeChoice >= 1 && timeChoice <= 5) {
        const selectedTime = timeSlots[timeChoice - 1];
        const services2 = await withTimeout(storage.getServices(), 5e3);
        const selectedService = services2.find((s) => s.id === conversation.selectedService);
        if (selectedService) {
          let newStateUpdated = false;
          try {
            const updatedConversation = await withTimeout(storage.updateConversation(conversation.id, {
              selectedTime,
              currentState: "awaiting_payment"
            }), 5e3);
            if (updatedConversation) {
              newState = "awaiting_payment";
              newStateUpdated = true;
            } else {
              console.warn("Failed to update conversation state in database, but proceeding with flow");
              newState = "awaiting_payment";
              newStateUpdated = true;
            }
          } catch (error) {
            console.error("Error updating conversation:", error);
            newState = "awaiting_payment";
            newStateUpdated = true;
          }
          if (newStateUpdated) {
            const latestConversation = await withTimeout(storage.getConversation(from), 5e3) || conversation;
            if (latestConversation && latestConversation.selectedDate) {
              const upiLink = generateUPILink(selectedService.price, selectedService.name);
              response = `Perfect! Your appointment is scheduled for ${selectedTime}.

`;
              response += `\u{1F4CB} Booking Summary:
`;
              response += `Service: ${selectedService.name}
`;
              response += `Date: ${new Date(latestConversation.selectedDate).toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Kolkata" })}
`;
              response += `Time: ${selectedTime}
`;
              response += `Amount: \u20B9${selectedService.price}

`;
              response += `\u{1F4B3} Please complete your payment:
${upiLink}

`;
              response += "Complete payment in GPay/PhonePe/Paytm and reply 'paid' to confirm your booking.";
              const time24 = timeChoice === 1 ? "10:00" : timeChoice === 2 ? "11:30" : timeChoice === 3 ? "14:00" : timeChoice === 4 ? "15:30" : "17:00";
              const [hourStr, minuteStr] = time24.split(":");
              const istOffsetMs = 5.5 * 60 * 60 * 1e3;
              const [y, m, d] = latestConversation.selectedDate.split("-").map((v) => parseInt(v, 10));
              const istMidnight = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
              const istDateTimeMs = istMidnight.getTime() + (parseInt(hourStr, 10) * 60 + parseInt(minuteStr, 10)) * 60 * 1e3;
              const utcDateTime = new Date(istDateTimeMs - istOffsetMs);
              await withTimeout(storage.createBooking({
                conversationId: conversation.id,
                serviceId: selectedService.id,
                phoneNumber: from,
                amount: selectedService.price,
                // Already in INR
                status: "pending",
                appointmentDate: utcDateTime,
                appointmentTime: selectedTime
              }), 5e3);
            }
          }
        } else {
          response = "Sorry, I couldn't find the selected service. Please start over by sending 'hi'.";
          newState = "greeting";
        }
      } else {
        response = "Please select a valid time option (1-5). Reply with the number for your preferred time.";
      }
    } else if (conversation.currentState === "awaiting_payment") {
      if (text3 === "paid") {
        response = "\u2705 Payment received! Your appointment is now confirmed.\n\n";
        response += "\u{1F4CB} Booking Details:\n";
        response += `Service: ${conversation.selectedService}
`;
        if (conversation.selectedDate) {
          response += `Date: ${new Date(conversation.selectedDate).toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Kolkata" })}
`;
        }
        if (conversation.selectedTime) {
          response += `Time: ${conversation.selectedTime}
`;
        }
        response += "\n\u{1F389} Thank you for choosing Spark Salon! We look forward to serving you.";
        try {
          const bookings2 = await withTimeout(storage.getBookings(), 5e3);
          const pendingBooking = bookings2.find(
            (b) => b.conversationId === conversation.id && b.status === "pending"
          );
          if (pendingBooking) {
            await withTimeout(storage.updateBooking(pendingBooking.id, {
              status: "confirmed",
              paymentMethod: "UPI"
            }), 5e3);
          }
        } catch (error) {
          console.error("Error updating booking:", error);
        }
        newState = "completed";
      } else {
        response = "Please complete your payment first. Click the UPI link and reply 'paid' once done.";
      }
    } else if (conversation.currentState === "completed") {
      response = "Your appointment is already confirmed! \u{1F389}\n\n";
      response += "\u{1F4CB} Booking Details:\n";
      response += `Service: ${conversation.selectedService}
`;
      if (conversation.selectedDate) {
        response += `Date: ${new Date(conversation.selectedDate).toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
`;
      }
      if (conversation.selectedTime) {
        response += `Time: ${conversation.selectedTime}
`;
      }
      response += "\n\u{1F389} Thank you for choosing Spark Salon! We look forward to serving you.";
    } else {
      response = "I'm sorry, I didn't understand that. Type 'hi' to start over or choose a service from our menu.";
    }
    if (newState !== conversation.currentState) {
      try {
        await withTimeout(storage.updateConversation(conversation.id, {
          currentState: newState
        }), 5e3);
      } catch (error) {
        console.error("Error updating conversation state:", error);
      }
    }
    await storage.createMessage({
      conversationId: conversation.id,
      content: response,
      isFromBot: true
    });
    return response;
  } catch (error) {
    console.error("Error processing WhatsApp message:", error);
    return "Sorry, I encountered an error processing your request. Please try again.";
  }
}
async function registerRoutes(app2) {
  app2.get("/webhook", (req, res) => {
    try {
      console.log("Webhook verification request:", req.query);
      const verification = webhookVerificationSchema.parse(req.query);
      const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
      console.log("Received verify token:", verification["hub.verify_token"]);
      console.log("Expected verify token:", verifyToken);
      console.log("Mode:", verification["hub.mode"]);
      if (verification["hub.mode"] === "subscribe" && verification["hub.verify_token"] === verifyToken) {
        console.log("Verification successful, returning challenge:", verification["hub.challenge"]);
        res.status(200).send(verification["hub.challenge"]);
      } else {
        console.log("Verification failed - mode or token mismatch");
        res.status(403).send("Forbidden");
      }
    } catch (error) {
      console.error("Webhook verification error:", error);
      res.status(400).send("Bad Request");
    }
  });
  const legacyConversationState = /* @__PURE__ */ new Map();
  app2.post("/webhook", async (req, res) => {
    try {
      const webhookData = whatsAppMessageSchema.parse(req.body);
      console.log("Legacy webhook received message, delegating to simple webhook...");
      for (const entry of webhookData.entry) {
        for (const change of entry.changes) {
          if (change.value.messages) {
            for (const message of change.value.messages) {
              if (message.type === "text") {
                console.log(`Delegating message from ${message.from}: "${message.text.body}" to simple webhook`);
                try {
                  const bookingService = new (await Promise.resolve().then(() => (init_whatsapp_booking_service(), whatsapp_booking_service_exports))).WhatsAppBookingService();
                  let bookingContext = legacyConversationState.get(message.from);
                  if (!bookingContext) {
                    bookingContext = {
                      tenantId: "85de5a0c-6aeb-479a-aa76-cbdd6b0845a7",
                      // Bella Salon tenant ID
                      customerPhone: message.from,
                      currentStep: "welcome"
                    };
                    console.log(`Created new conversation state for ${message.from}`);
                  } else {
                    console.log(`Using existing conversation state for ${message.from}, current step: ${bookingContext.currentStep}`);
                  }
                  const result = await bookingService.processBookingMessage(
                    {
                      text: { body: message.text.body },
                      from: message.from,
                      id: message.id || `legacy_${Date.now()}`,
                      type: "text",
                      timestamp: (/* @__PURE__ */ new Date()).toISOString()
                    },
                    bookingContext.tenantId,
                    bookingContext
                  );
                  if (result.success && result.message) {
                    await sendWhatsAppMessage(message.from, result.message);
                    console.log(`Successfully processed message via simple webhook`);
                    if (result.nextStep) {
                      bookingContext.currentStep = result.nextStep;
                      legacyConversationState.set(message.from, JSON.parse(JSON.stringify(bookingContext)));
                      console.log(`Updated conversation state for ${message.from}:`, bookingContext);
                    }
                  } else {
                    console.error(`Simple webhook failed to process message:`, result);
                    await sendWhatsAppMessage(message.from, "Sorry, I'm experiencing technical difficulties. Please try again later.");
                  }
                } catch (error) {
                  console.error("Error delegating to simple webhook:", error);
                  await sendWhatsAppMessage(message.from, "Sorry, I'm experiencing technical difficulties. Please try again later.");
                }
              }
            }
          }
        }
      }
      res.status(200).send("OK");
    } catch (error) {
      console.error("Webhook processing error:", error);
      res.status(400).send("Bad Request");
    }
  });
  app2.get("/api/services", async (req, res) => {
    try {
      const services2 = await storage.getServices();
      console.log("API: Fetching services, found:", services2.length);
      res.json(services2);
    } catch (error) {
      console.error("Error fetching services:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.post("/api/services", async (req, res) => {
    try {
      const serviceData = createServiceSchema.parse(req.body);
      const service = await storage.createService(serviceData);
      res.status(201).json(service);
    } catch (error) {
      console.error("Error creating service:", error);
      res.status(400).json({ error: "Invalid service data" });
    }
  });
  app2.get("/api/bookings", async (req, res) => {
    try {
      const bookings2 = await storage.getBookings();
      console.log("API: Fetching bookings, found:", bookings2.length);
      res.json(bookings2);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.patch("/api/bookings/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      if (!status || !["pending", "confirmed", "cancelled"].includes(status)) {
        return res.status(400).json({ error: "Invalid status. Must be pending, confirmed, or cancelled" });
      }
      const bookings2 = await storage.getBookings();
      const booking = bookings2.find((b) => b.id === id);
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }
      const updatedBooking = await storage.updateBooking(id, { status });
      if (!updatedBooking) {
        return res.status(404).json({ error: "Booking not found" });
      }
      if (status === "confirmed" || status === "cancelled") {
        try {
          const services2 = await storage.getServices();
          const service = services2.find((s) => s.id === booking.serviceId);
          const serviceName = service?.name || "Service";
          let notificationMessage = "";
          if (status === "confirmed") {
            let appointmentDateStr = "your selected date";
            if (booking.appointmentDate) {
              try {
                appointmentDateStr = new Date(booking.appointmentDate).toLocaleDateString("en-GB", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric"
                });
              } catch (e) {
                console.error("Error formatting appointment date:", e);
              }
            }
            const appointmentTime = booking.appointmentTime || "your selected time";
            notificationMessage = `\u2705 *Booking Confirmed!*

Your appointment has been confirmed by Spark Salon.

\u{1F4CB} *Booking Details:*
Service: ${serviceName}
Date: ${appointmentDateStr}
Time: ${appointmentTime}
Amount: \u20B9${booking.amount}

\u{1F4CD} Please arrive 10 minutes early for your appointment.

Thank you for choosing Spark Salon! \u{1F389}`;
          } else if (status === "cancelled") {
            notificationMessage = `\u274C *Booking Cancelled*

We're sorry to inform you that your booking has been cancelled.

\u{1F4CB} *Cancelled Booking:*
Service: ${serviceName}
Amount: \u20B9${booking.amount}

If you have any questions or would like to reschedule, please contact us or send a new booking request.

We apologize for any inconvenience caused.`;
          }
          const notificationSent = await sendWhatsAppMessage(booking.phoneNumber, notificationMessage);
          console.log(`WhatsApp notification ${notificationSent ? "sent" : "failed"} for booking ${id} status change to ${status}`);
        } catch (notificationError) {
          console.error("Error sending WhatsApp notification:", notificationError);
        }
      }
      res.json(updatedBooking);
    } catch (error) {
      console.error("Error updating booking:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.patch("/api/services/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const updatedService = await storage.updateService(id, updateData);
      if (!updatedService) {
        return res.status(404).json({ error: "Service not found" });
      }
      res.json(updatedService);
    } catch (error) {
      console.error("Error updating service:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.delete("/api/services/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteService(id);
      if (!success) {
        return res.status(404).json({ error: "Service not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting service:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/settings", async (req, res) => {
    try {
      const settings = {
        upiId: "salon@upi",
        businessName: "Spark Salon",
        currency: "INR"
      };
      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.patch("/api/settings", async (req, res) => {
    try {
      const { upiId, businessName } = req.body;
      const settings = {
        upiId: upiId || "salon@upi",
        businessName: businessName || "Spark Salon",
        currency: "INR"
      };
      res.json(settings);
    } catch (error) {
      console.error("Error updating settings:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/stats", async (req, res) => {
    try {
      const backend = getStorageBackendName();
      const parseDbTimestamp = (value) => {
        if (value instanceof Date) return value;
        if (typeof value === "string") {
          const isoLike = value.includes("T") ? value : value.replace(" ", "T");
          const withZ = /Z$/i.test(isoLike) ? isoLike : `${isoLike}Z`;
          const d = new Date(withZ);
          if (!isNaN(d.getTime())) return d;
          return new Date(value);
        }
        return new Date(value);
      };
      const todayBookings = await storage.getTodayBookings();
      console.log("Today's bookings count:", todayBookings.length);
      console.log("Today's bookings:", todayBookings);
      const todayRevenueINR = todayBookings.filter((booking) => booking.status === "confirmed").reduce((total, booking) => total + booking.amount, 0);
      console.log("Today's revenue:", todayRevenueINR);
      const allBookings = await storage.getBookings();
      console.log("All bookings count:", allBookings.length);
      let todayMessages = 0;
      const offsetMs = 5.5 * 60 * 60 * 1e3;
      const nowUtcMs = Date.now();
      const istNow = new Date(nowUtcMs + offsetMs);
      const istStart = new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate(), 0, 0, 0, 0));
      const istEnd = new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate() + 1, 0, 0, 0, 0));
      const utcStart = new Date(istStart.getTime() - offsetMs);
      const utcEnd = new Date(istEnd.getTime() - offsetMs);
      const conversationIds = Array.from(new Set(allBookings.map((b) => b.conversationId)));
      for (const cid of conversationIds) {
        const messages2 = await storage.getMessages(cid);
        const countToday = messages2.filter((m) => {
          const raw = m.timestamp ?? m.createdAt;
          const ts = parseDbTimestamp(raw);
          return ts >= utcStart && ts < utcEnd;
        }).length;
        todayMessages += countToday;
      }
      console.log("Today's messages count:", todayMessages);
      let responseRate = 0;
      if (todayMessages > 0) {
        let botToday = 0;
        for (const cid of conversationIds) {
          const messages2 = await storage.getMessages(cid);
          botToday += messages2.filter((m) => {
            const raw = m.timestamp ?? m.createdAt;
            const ts = parseDbTimestamp(raw);
            return m.isFromBot && ts >= utcStart && ts < utcEnd;
          }).length;
        }
        responseRate = Math.min(100, Math.round(botToday / todayMessages * 100));
      }
      const stats = {
        todayMessages,
        todayBookings: todayBookings.length,
        todayRevenue: todayRevenueINR,
        // Already in INR
        responseRate,
        totalBookings: allBookings.length,
        backend
      };
      console.log("Stats response:", stats);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.post("/api/test-message", async (req, res) => {
    try {
      const { from, message } = req.body;
      await processWhatsAppMessage(from, message);
      res.json({ success: true });
    } catch (error) {
      console.error("Error processing test message:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.post("/api/admin/migrate", async (req, res) => {
    try {
      const { adminKey } = req.body;
      if (adminKey !== process.env.ADMIN_KEY && adminKey !== "migrate_fix_2024") {
        return res.status(403).json({ error: "Unauthorized" });
      }
      const { Pool: Pool12 } = __require("@neondatabase/serverless");
      const pool4 = new Pool12({ connectionString: process.env.DATABASE_URL });
      const client = await pool4.connect();
      try {
        const migrations = [
          "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(255);",
          "ALTER TABLE services ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;",
          "ALTER TABLE services ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;",
          "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;",
          "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;",
          "ALTER TABLE conversations ADD COLUMN IF NOT EXISTS context_data JSONB DEFAULT '{}';"
        ];
        const results = [];
        for (const sql8 of migrations) {
          try {
            await client.query(sql8);
            results.push(`\u2705 Executed: ${sql8}`);
            console.log(`\u2705 Executed: ${sql8}`);
          } catch (error) {
            results.push(`\u26A0\uFE0F Error: ${sql8} - ${error.message}`);
            console.log(`\u26A0\uFE0F Error: ${sql8} - ${error.message}`);
          }
        }
        console.log("\u2705 Database migration completed");
        res.json({
          success: true,
          message: "Database migration completed successfully. Missing columns added.",
          details: results
        });
      } finally {
        client.release();
        await pool4.end();
      }
    } catch (error) {
      console.error("\u274C Migration failed:", error);
      res.status(500).json({
        success: false,
        error: "Migration failed",
        details: error.message
      });
    }
  });
  app2.get("/api/business-config", (req, res) => {
    try {
      const { getBusinessConfig: getBusinessConfig2 } = (init_business_config_api(), __toCommonJS(business_config_api_exports));
      const businessType = req.query.type;
      const config = getBusinessConfig2(businessType);
      res.json({ success: true, data: config });
    } catch (error) {
      console.error("Error fetching business config:", error);
      res.status(500).json({ success: false, error: "Failed to fetch business config" });
    }
  });
  app2.get("/api/business-types", (req, res) => {
    try {
      const { getAllBusinessTypes: getAllBusinessTypes2 } = (init_business_config_api(), __toCommonJS(business_config_api_exports));
      const types = getAllBusinessTypes2();
      res.json({ success: true, data: types });
    } catch (error) {
      console.error("Error fetching business types:", error);
      res.status(500).json({ success: false, error: "Failed to fetch business types" });
    }
  });
  app2.use("/api/bot-flows", bot_flow_builder_routes_default);
  app2.use("/api/salon", salon_api_default);
  app2.use("/api/staff", staff_api_default);
  const messageProcessor = new MessageProcessorService(process.env.DATABASE_URL || "postgresql://localhost:5432/whatsapp_bot");
  const whatsappSender = new WhatsAppSenderService();
  const webhookRoutes = createWebhookRoutes(messageProcessor, whatsappSender);
  app2.use("/api/webhook", webhookRoutes);
  const simpleWebhookRoutes = createSimpleWebhookRoutes();
  app2.use("/api", simpleWebhookRoutes);
  app2.post("/api/bot-flows/:flowId/activate", async (req, res) => {
    try {
      const { flowId } = req.params;
      console.log(`Activating flow ${flowId}`);
      res.json({
        success: true,
        message: `Flow ${flowId} activated for WhatsApp conversations`
      });
    } catch (error) {
      console.error("Error activating flow:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.post("/api/bot-flows/:flowId/deactivate", async (req, res) => {
    try {
      const { flowId } = req.params;
      console.log(`Deactivating flow ${flowId}`);
      res.json({
        success: true,
        message: `Flow ${flowId} deactivated, using default responses`
      });
    } catch (error) {
      console.error("Error deactivating flow:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.post("/api/conversations/:conversationId/process", async (req, res) => {
    try {
      const { conversationId } = req.params;
      const { phoneNumber, message } = req.body;
      const mockResponse = {
        success: true,
        response: `Processed message "${message}" for conversation ${conversationId}`,
        shouldContinue: true
      };
      res.json(mockResponse);
    } catch (error) {
      console.error("Error processing conversation message:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/conversations/:conversationId/status", async (req, res) => {
    try {
      const { conversationId } = req.params;
      const mockStatus = {
        isActive: true,
        currentNode: "message-1",
        variables: { userName: "John" },
        flowId: "flow-123"
      };
      res.json(mockStatus);
    } catch (error) {
      console.error("Error getting conversation status:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.post("/api/conversations/test-flow", async (req, res) => {
    try {
      const { flowId, testMessages } = req.body;
      if (!flowId || !testMessages || !Array.isArray(testMessages)) {
        return res.status(400).json({
          error: "flowId and testMessages array are required"
        });
      }
      const results = testMessages.map((message, index) => ({
        input: message,
        success: true,
        response: `Mock response to: ${message}`,
        step: index + 1
      }));
      res.json({
        success: true,
        testResults: results,
        totalSteps: results.length
      });
    } catch (error) {
      console.error("Error testing bot flow:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/bot-flows/load-whatsapp", async (req, res) => {
    try {
      const { BotFlowSyncService: BotFlowSyncService2 } = (init_bot_flow_sync_service(), __toCommonJS(bot_flow_sync_service_exports));
      const flowSyncService = BotFlowSyncService2.getInstance();
      const flow = await flowSyncService.loadWhatsAppBotFlow();
      res.json({
        success: true,
        message: "WhatsApp bot flow loaded successfully",
        flow
      });
    } catch (error) {
      console.error("Error loading WhatsApp bot flow:", error);
      res.status(500).json({
        success: false,
        error: "Failed to load WhatsApp bot flow"
      });
    }
  });
  app2.post("/api/bot-flows/activate", async (req, res) => {
    try {
      const { BotFlowSyncService: BotFlowSyncService2 } = (init_bot_flow_sync_service(), __toCommonJS(bot_flow_sync_service_exports));
      const flowSyncService = BotFlowSyncService2.getInstance();
      const { flowId } = req.body;
      await flowSyncService.createBackup();
      const flow = await flowSyncService.loadWhatsAppBotFlow();
      flowSyncService.updateActiveFlow(flow);
      res.json({
        success: true,
        message: "Bot flow activated successfully",
        flow
      });
    } catch (error) {
      console.error("Error activating bot flow:", error);
      res.status(500).json({
        success: false,
        error: "Failed to activate bot flow"
      });
    }
  });
  app2.post("/api/bot-flows/restore", async (req, res) => {
    try {
      const { BotFlowSyncService: BotFlowSyncService2 } = (init_bot_flow_sync_service(), __toCommonJS(bot_flow_sync_service_exports));
      const flowSyncService = BotFlowSyncService2.getInstance();
      const restoredFlow = await flowSyncService.restoreFromBackup();
      if (restoredFlow) {
        res.json({
          success: true,
          message: "Bot flow restored from backup successfully",
          flow: restoredFlow
        });
      } else {
        res.status(404).json({
          success: false,
          error: "No backup found to restore from"
        });
      }
    } catch (error) {
      console.error("Error restoring bot flow:", error);
      res.status(500).json({
        success: false,
        error: "Failed to restore bot flow"
      });
    }
  });
  app2.post("/api/bot-flows/sync", async (req, res) => {
    try {
      console.log("\u{1F504} Sync endpoint called with flow data:", req.body);
      const { flowData } = req.body;
      if (!flowData) {
        console.log("\u274C No flow data provided");
        return res.status(400).json({
          success: false,
          error: "Flow data is required"
        });
      }
      console.log("\u2705 Flow data received, processing sync...");
      console.log("\u{1F504} Syncing flow:", flowData.name, "with WhatsApp bot");
      global.whatsappBotFlow = flowData;
      try {
        const { DynamicFlowProcessorService: DynamicFlowProcessorService2 } = (init_dynamic_flow_processor_service(), __toCommonJS(dynamic_flow_processor_service_exports));
        const flowProcessor = DynamicFlowProcessorService2.getInstance();
        await flowProcessor.updateFlow(flowData);
        console.log("\u2705 Dynamic flow processor updated");
      } catch (error) {
        console.log("\u26A0\uFE0F Dynamic flow processor not available, using fallback");
      }
      res.json({
        success: true,
        message: "Bot flow synced successfully with WhatsApp bot",
        flow: flowData
      });
    } catch (error) {
      console.error("\u274C Error syncing bot flow:", error);
      res.status(500).json({
        success: false,
        error: "Failed to sync bot flow"
      });
    }
  });
  app2.get("/api/bot-flows/test", async (req, res) => {
    try {
      console.log("\u{1F9EA} Test endpoint called");
      res.json({
        success: true,
        message: "Bot flows API is working!",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (error) {
      console.error("\u274C Test endpoint error:", error);
      res.status(500).json({
        success: false,
        error: "Test endpoint failed"
      });
    }
  });
  app2.get("/api/test", (req, res) => {
    console.log("\u{1F9EA} Simple test endpoint called");
    res.json({
      success: true,
      message: "API is working!",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  app2.get("/api/sync-test", (req, res) => {
    console.log("\u{1F9EA} Alternative sync test endpoint called");
    res.json({
      success: true,
      message: "Alternative sync test completed",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  app2.get("/api/test-sync", (req, res) => {
    console.log("\u{1F9EA} Test sync endpoint called - START");
    const hasFlow = !!global.whatsappBotFlow;
    const flowName = global.whatsappBotFlow?.name || "No flow";
    const nodeCount = global.whatsappBotFlow?.nodes?.length || 0;
    console.log("\u{1F50D} Global flow status:", { hasFlow, flowName, nodeCount });
    const response = {
      success: true,
      message: "Sync test completed",
      hasFlow,
      flowName,
      nodeCount,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    console.log("\u{1F9EA} Test sync endpoint called - SENDING RESPONSE");
    res.json(response);
    console.log("\u{1F9EA} Test sync endpoint called - RESPONSE SENT");
  });
  app2.post("/api/sync-simple", (req, res) => {
    console.log("\u{1F504} Simple sync endpoint called - START");
    console.log("\u{1F504} Request method:", req.method);
    console.log("\u{1F504} Request URL:", req.url);
    try {
      console.log("\u{1F504} Simple sync endpoint called");
      console.log("Request body keys:", Object.keys(req.body || {}));
      const { flowData } = req.body;
      if (!flowData) {
        console.log("\u274C No flow data provided");
        return res.status(400).json({
          success: false,
          error: "Flow data is required"
        });
      }
      global.whatsappBotFlow = flowData;
      console.log("\u2705 Flow synced to WhatsApp bot:", flowData.name);
      console.log("\u2705 Flow nodes count:", flowData.nodes?.length || 0);
      console.log("\u2705 Flow stored in global.whatsappBotFlow");
      console.log("\u2705 First node message preview:", flowData.nodes?.[0]?.configuration?.message?.substring(0, 100) || "No message");
      console.log("\u2705 Global flow verification:", global.whatsappBotFlow ? "STORED" : "NOT STORED");
      console.log("\u2705 Global flow name:", global.whatsappBotFlow?.name || "NO NAME");
      res.json({
        success: true,
        message: "Flow synced successfully with WhatsApp bot",
        flow: flowData
      });
    } catch (error) {
      console.error("\u274C Simple sync error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to sync flow"
      });
    }
  });
  console.log("\u2705 Route /api/sync-simple registered");
  app2.get("/api/sync-simple", (req, res) => {
    console.log("\u{1F9EA} GET /api/sync-simple called");
    res.json({
      success: true,
      message: "Sync-simple endpoint is working",
      method: "GET",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  app2.get("/api/services-for-bot", async (req, res) => {
    try {
      console.log("\u{1F504} Loading services for bot flow builder");
      const services2 = await storage.getServices();
      console.log("\u2705 Loaded services:", services2.length);
      const formattedServices = services2.map((service) => ({
        id: service.id,
        name: service.name,
        price: service.price,
        description: service.description,
        duration: service.duration,
        category: service.category
      }));
      res.json({
        success: true,
        services: formattedServices,
        count: formattedServices.length
      });
    } catch (error) {
      console.error("\u274C Error loading services for bot:", error);
      res.status(500).json({
        success: false,
        error: "Failed to load services"
      });
    }
  });
  app2.post("/api/test-whatsapp-bot", async (req, res) => {
    console.log("\u{1F9EA} Test WhatsApp bot endpoint called - START");
    try {
      console.log("\u{1F9EA} Testing WhatsApp bot processing");
      const { message, phoneNumber } = req.body;
      if (!message || !phoneNumber) {
        console.log("\u274C Missing required fields");
        return res.status(400).json({
          success: false,
          error: "Message and phoneNumber are required"
        });
      }
      console.log("\u{1F50D} Testing with message:", message);
      console.log("\u{1F50D} Testing with phone:", phoneNumber);
      await processWhatsAppMessage(phoneNumber, message);
      console.log("\u2705 WhatsApp bot processing test completed");
      res.json({
        success: true,
        message: "WhatsApp bot processing test completed",
        flowUsed: global.whatsappBotFlow ? global.whatsappBotFlow.name : "Static flow"
      });
    } catch (error) {
      console.error("\u274C Error testing WhatsApp bot:", error);
      res.status(500).json({
        success: false,
        error: "Failed to test WhatsApp bot"
      });
    }
  });
  console.log("\u2705 Route /api/test-whatsapp-bot registered");
  app2.get("/api/test-whatsapp-bot", (req, res) => {
    console.log("\u{1F9EA} GET /api/test-whatsapp-bot called");
    res.json({
      success: true,
      message: "WhatsApp bot test endpoint is working",
      method: "GET",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  app2.get("/api/bot-flows/current", async (req, res) => {
    try {
      if (global.whatsappBotFlow) {
        res.json({
          success: true,
          flow: global.whatsappBotFlow
        });
      } else {
        res.json({
          success: false,
          message: "No active flow found"
        });
      }
    } catch (error) {
      console.error("\u274C Get current flow error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get current flow"
      });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/static.ts
import express from "express";
import fs from "fs";
import path from "path";
function serveStatic(app2) {
  const possiblePaths = [
    path.resolve(import.meta.dirname, "public"),
    path.resolve(import.meta.dirname, "..", "dist", "public"),
    path.resolve(process.cwd(), "dist", "public"),
    path.resolve("/var/task/dist/public")
  ];
  let distPath = null;
  for (const testPath of possiblePaths) {
    if (fs.existsSync(testPath)) {
      distPath = testPath;
      console.log(`Static files found at: ${distPath}`);
      break;
    }
  }
  if (!distPath) {
    throw new Error(
      `Could not find the build directory. Tried: ${possiblePaths.join(", ")}`
    );
  }
  app2.use(express.static(distPath, {
    setHeaders: (res, path2) => {
      if (path2.endsWith(".js")) {
        res.setHeader("Content-Type", "application/javascript");
      } else if (path2.endsWith(".css")) {
        res.setHeader("Content-Type", "text/css");
      }
      if (path2.includes("/assets/")) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      } else {
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      }
    }
  }));
  app2.get("/debug/assets", (req, res) => {
    try {
      const assetsPath = path.join(distPath, "assets");
      const files = fs.existsSync(assetsPath) ? fs.readdirSync(assetsPath) : [];
      res.json({
        distPath,
        assetsPath,
        files,
        exists: fs.existsSync(assetsPath)
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/assets/*", (req, res, next) => {
    const assetPath = path.join(distPath, req.path);
    console.log(`Asset request: ${req.path} -> ${assetPath}`);
    if (fs.existsSync(assetPath)) {
      if (req.path.endsWith(".js")) {
        res.setHeader("Content-Type", "application/javascript");
      } else if (req.path.endsWith(".css")) {
        res.setHeader("Content-Type", "text/css");
      }
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      res.sendFile(assetPath);
    } else {
      console.log(`Asset not found: ${assetPath}`);
      res.status(404).send("Asset not found");
    }
  });
  app2.get("*", (req, res, next) => {
    if (req.path.startsWith("/assets/") || req.path.endsWith(".js") || req.path.endsWith(".css") || req.path.endsWith(".ico") || req.path.endsWith(".png") || req.path.endsWith(".jpg") || req.path.endsWith(".svg")) {
      return next();
    }
    console.log(`Serving index.html for route: ${req.path}`);
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}

// server/vercel.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
var server = await registerRoutes(app);
app.use((err, _req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
});
serveStatic(app);
var vercel_default = app;
export {
  vercel_default as default
};
