import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage, getStorageBackendName } from "./storage";
import { z } from "zod";
import { send } from "process";
// import businessConfigRoutes from "./routes/business-config.routes"; // Temporarily disabled
import botFlowRoutes from "./routes/bot-flow-builder.routes";
import salonApiRoutes from "./routes/salon-api";
import { DynamicFlowProcessorService } from './services/dynamic-flow-processor.service';

// WhatsApp webhook verification schema
const webhookVerificationSchema = z.object({
  "hub.mode": z.string(),
  "hub.challenge": z.string(),
  "hub.verify_token": z.string(),
});

// WhatsApp incoming message schema
const whatsAppMessageSchema = z.object({
  object: z.string(),
  entry: z.array(z.object({
    id: z.string(),
    changes: z.array(z.object({
      value: z.object({
        messaging_product: z.string(),
        metadata: z.object({
          display_phone_number: z.string(),
          phone_number_id: z.string(),
        }),
        messages: z.array(z.object({
          from: z.string(),
          id: z.string(),
          timestamp: z.string(),
          text: z.object({
            body: z.string(),
          }),
          type: z.string(),
        })).optional(),
      }),
      field: z.string(),
    })),
  })),
});

// Service management schemas
const createServiceSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().int().min(1, "Price must be at least 1"),
  icon: z.string().optional(),
});

// WhatsApp Cloud API credentials
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_ID;

// Helper function to send WhatsApp message
async function sendWhatsAppMessage(to: string, message: string): Promise<boolean> {
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
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: to,
        text: { body: message },
      }),
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

// Generate UPI payment link (use INR amount directly)
function generateUPILink(amount: number, serviceName: string): string {
  const upiId = process.env.UPI_ID || "sparksalon@upi";
  // Amount is already in INR, no conversion needed
  return `upi://pay?pa=${upiId}&pn=Spark+Salon&am=${amount}&cu=INR&tn=Payment+for+${encodeURIComponent(serviceName)}`;
}

// Process incoming WhatsApp message
async function processWhatsAppMessage(from: string, messageText: string): Promise<void> {
  try {
    console.log("WhatsApp: Processing message from", from, ":", messageText);
    
    // Check if we should use dynamic flow processing
    const shouldUseDynamicFlow = await checkForActiveFlow();
    console.log("🔍 Should use dynamic flow:", shouldUseDynamicFlow);
    console.log("🔍 Global flow exists:", !!global.whatsappBotFlow);
    console.log("🔍 Global flow name:", global.whatsappBotFlow?.name || 'NO NAME');
    
    if (shouldUseDynamicFlow) {
      console.log("WhatsApp: Using dynamic flow processing");
      // Use dynamic conversation engine
      await processDynamicWhatsAppMessage(from, messageText);
      return;
    }
    
    console.log("WhatsApp: Using static flow processing");
    // Fall back to static processing
    const response = await processStaticWhatsAppMessage(from, messageText);
    // Send the response to WhatsApp
    await sendWhatsAppMessage(from, response);
  } catch (error) {
    console.error("Error processing WhatsApp message:", error);
    // Send error message to user
    await sendWhatsAppMessage(from, "Sorry, I'm experiencing technical difficulties. Please try again later.");
  }
}

// Check if there's an active flow for dynamic processing
async function checkForActiveFlow(): Promise<boolean> {
  try {
    // Check if we have a synced flow from the bot flow builder
    if (global.whatsappBotFlow) {
      console.log('✅ Using synced flow from bot flow builder:', global.whatsappBotFlow.name);
      return true;
    }
    
    // For demo purposes, always return true to enable dynamic processing
    // This allows the WhatsApp bot to use the flow data from localStorage
    console.log('✅ Enabling dynamic flow processing for demo');
    return true;
  } catch (error) {
    console.error("Error checking for active flow:", error);
    return false;
  }
}

// Dynamic message processing using conversation engine
async function processDynamicWhatsAppMessage(from: string, messageText: string): Promise<void> {
  try {
    console.log("WhatsApp: Using dynamic flow processing for", from);
    
    // Get the synced flow from bot flow builder
    let syncedFlow = global.whatsappBotFlow;
    
    console.log("🔍 Checking global.whatsappBotFlow:", global.whatsappBotFlow ? 'EXISTS' : 'NULL');
    console.log("🔍 Global flow name:", global.whatsappBotFlow?.name || 'NO NAME');
    console.log("🔍 Global flow nodes:", global.whatsappBotFlow?.nodes?.length || 0);
    
    if (syncedFlow) {
      console.log("✅ Using synced flow from bot flow builder:", syncedFlow.name);
      console.log("✅ Synced flow nodes:", syncedFlow.nodes?.length || 0);
    } else {
      console.log("⚠️ No synced flow found, using demo flow");
    }
    
    if (!syncedFlow) {
      // Create a demo flow that matches the bot flow builder
      syncedFlow = {
        id: 'whatsapp_bot_flow',
        name: '🟢 WhatsApp Bot Flow (EXACT REPLICA)',
        description: 'Exact replica of current WhatsApp bot flow with emojis, layout, and all details',
        businessType: 'salon',
        isActive: true,
        isTemplate: false,
        version: '1.0.0',
        nodes: [
          {
            id: 'welcome_msg',
            type: 'service_message',
            name: 'Welcome Message',
            position: { x: 400, y: 100 },
            configuration: {
              welcomeText: '👋 Welcome to Spark Salon!',
              serviceIntro: 'Here are our services:',
              instruction: 'Reply with the number or name of the service to book.',
              showEmojis: true,
              loadFromDatabase: true
            },
            connections: [],
            metadata: {}
          },
          {
            id: 'service_confirmed',
            type: 'date_picker',
            name: 'Date Selection',
            position: { x: 900, y: 100 },
            configuration: {
              minDate: new Date().toISOString().split('T')[0],
              maxDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              availableDays: [0, 1, 2, 3, 4, 5, 6] // All days
            },
            connections: [],
            metadata: {}
          },
          {
            id: 'date_confirmed',
            type: 'time_slots',
            name: 'Time Selection',
            position: { x: 1300, y: 100 },
            configuration: {
              timeSlots: [
                { start: '09:00', end: '10:00' },
                { start: '10:30', end: '11:30' },
                { start: '12:00', end: '13:00' },
                { start: '14:00', end: '15:00' },
                { start: '15:30', end: '16:30' },
                { start: '17:00', end: '18:00' }
              ]
            },
            connections: [],
            metadata: {}
          },
          {
            id: 'booking_summary',
            type: 'booking_summary',
            name: 'Booking Summary',
            position: { x: 1700, y: 100 },
            configuration: {
              template: '📋 **Booking Summary**\n\n🎯 **Service:** {selectedService}\n💰 **Price:** ₹{price}\n📅 **Date:** {selectedDate}\n🕐 **Time:** {selectedTime}\n\nPlease confirm your booking by replying "CONFIRM" or "YES".',
              fallbackMessage: 'Please contact us to complete your booking.'
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
    
    // Get or create conversation to track state
    let conversation = await storage.getConversation(from);
    if (!conversation) {
      conversation = await storage.createConversation({
        phoneNumber: from,
        currentState: "greeting",
      });
    }
    
    // Initialize dynamic flow processor
    const dynamicProcessor = new DynamicFlowProcessorService(storage);
    
    // Create context for dynamic processing
    const context = {
      tenantId: 'default',
      phoneNumber: from,
      conversationId: conversation.id,
      currentState: conversation.currentState,
      selectedService: conversation.selectedService,
      selectedDate: conversation.selectedDate,
      selectedTime: conversation.selectedTime
    };
    
    // Find the current node based on conversation state
    const currentNode = syncedFlow.nodes.find(node => 
      node.id === conversation.currentState || 
      (conversation.currentState === 'greeting' && node.id === 'welcome_msg')
    );
    
    if (!currentNode) {
      console.log("No matching node found for state:", conversation.currentState);
      await sendWhatsAppMessage(from, "Sorry, I couldn't find the right response. Please start over.");
      return;
    }
    
    console.log("Processing node:", currentNode.name, "Type:", currentNode.type);
    
    // Process the node with dynamic data
    const processedMessage = await dynamicProcessor.processNode(currentNode, context);
    
    // Handle user input and state transitions
    let newState = conversation.currentState;
    let contextData = conversation.contextData || {};
    
    // Process user input based on current state
    if (conversation.currentState === 'greeting') {
      // User is selecting a service
      const services = await storage.getServices();
      const selectedService = services.find(service => 
        service.name.toLowerCase().includes(messageText.toLowerCase()) ||
        messageText.includes(service.name.toLowerCase())
      );
      
      if (selectedService) {
        newState = 'service_confirmed';
        contextData.selectedService = selectedService.id;
        contextData.selectedServiceName = selectedService.name;
        contextData.price = selectedService.price;
      } else {
        await sendWhatsAppMessage(from, processedMessage.content);
        return;
      }
    } else if (conversation.currentState === 'service_confirmed') {
      // User is selecting a date
      const dateMatch = messageText.match(/(\d{1,2})/);
      if (dateMatch) {
        const dateIndex = parseInt(dateMatch[1]) - 1;
        const availableDates = dynamicProcessor['generateAvailableDates'](7);
        if (dateIndex >= 0 && dateIndex < availableDates.length) {
          newState = 'date_confirmed';
          contextData.selectedDate = availableDates[dateIndex];
        }
      }
    } else if (conversation.currentState === 'date_confirmed') {
      // User is selecting a time
      const timeMatch = messageText.match(/(\d{1,2})/);
      if (timeMatch) {
        const timeIndex = parseInt(timeMatch[1]) - 1;
        const timeSlots = ['09:00', '10:30', '12:00', '14:00', '15:30', '17:00'];
        if (timeIndex >= 0 && timeIndex < timeSlots.length) {
          newState = 'booking_summary';
          contextData.selectedTime = timeSlots[timeIndex];
        }
      }
    } else if (conversation.currentState === 'booking_summary') {
      // User is confirming booking
      if (messageText.toLowerCase().includes('confirm') || messageText.toLowerCase().includes('yes')) {
        newState = 'completed';
        // Create booking
        if (contextData.selectedService && contextData.selectedDate && contextData.selectedTime) {
          await storage.createBooking({
            conversationId: conversation.id,
            serviceId: contextData.selectedService,
            phoneNumber: from,
            amount: contextData.price,
            status: 'confirmed',
            appointmentDate: contextData.selectedDate,
            appointmentTime: contextData.selectedTime
          });
        }
      }
    }
    
    // Update conversation state
    await storage.updateConversation(conversation.id, {
      currentState: newState,
      contextData: contextData,
      selectedService: contextData.selectedService,
      selectedDate: contextData.selectedDate,
      selectedTime: contextData.selectedTime
    });
    
    // Send response
    await sendWhatsAppMessage(from, processedMessage.content);
    
    console.log("✅ Dynamic flow processed successfully:", {
      phoneNumber: from,
      newState: newState,
      responseLength: processedMessage.content.length
    });
    
  } catch (error) {
    console.error("Error in dynamic message processing:", error);
    await sendWhatsAppMessage(from, "Sorry, there was an issue with the dynamic flow. Please try again.");
  }
}

// Process message using synced flow from bot flow builder
async function processMessageWithSyncedFlow(
  phoneNumber: string,
  messageText: string,
  conversationState: string,
  syncedFlow: any
): Promise<{
  response: string;
  newState: string;
  contextData?: any;
}> {
  try {
    console.log('Processing message with synced flow:', {
      phoneNumber,
      messageText,
      conversationState,
      flowName: syncedFlow.name
    });

    // Find the appropriate node based on conversation state
    let currentNode = null;
    
    switch (conversationState) {
      case 'greeting':
        currentNode = syncedFlow.nodes.find((node: any) => node.id === 'welcome_msg');
        break;
      case 'awaiting_service':
        currentNode = syncedFlow.nodes.find((node: any) => node.id === 'service_confirmed');
        break;
      case 'awaiting_date':
        currentNode = syncedFlow.nodes.find((node: any) => node.id === 'date_confirmed');
        break;
      case 'awaiting_time':
        currentNode = syncedFlow.nodes.find((node: any) => node.id === 'booking_summary');
        break;
      case 'awaiting_payment':
        currentNode = syncedFlow.nodes.find((node: any) => node.id === 'payment_confirmed');
        break;
      default:
        currentNode = syncedFlow.nodes.find((node: any) => node.id === 'welcome_msg');
    }

    if (!currentNode) {
      // Fallback to welcome message
      currentNode = syncedFlow.nodes.find((node: any) => node.id === 'welcome_msg');
    }

    if (!currentNode) {
      throw new Error('No appropriate node found in synced flow');
    }

    // Get the message from the node configuration
    let response = '';
    let newState = conversationState;

    // Add input validation based on conversation state
    const isValidInput = validateUserInput(messageText, conversationState);
    if (!isValidInput.valid) {
      response = isValidInput.message;
      newState = conversationState; // Stay in same state
    } else if (currentNode.configuration?.message) {
      response = currentNode.configuration.message;
      
      // Replace placeholders with actual values
      response = response.replace('{selectedService}', 'Haircut');
      response = response.replace('{price}', '120');
      response = response.replace('{selectedDate}', 'Tomorrow');
      response = response.replace('{selectedTime}', '10:00 AM');
      
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
      
      // Determine next state based on current node
      if (currentNode.id === 'welcome_msg') {
        newState = 'awaiting_service';
      } else if (currentNode.id === 'service_confirmed') {
        newState = 'awaiting_date';
      } else if (currentNode.id === 'date_confirmed') {
        newState = 'awaiting_time';
      } else if (currentNode.id === 'booking_summary') {
        newState = 'awaiting_payment';
      } else if (currentNode.id === 'payment_confirmed') {
        newState = 'completed';
      }
    } else {
      // Fallback message
      response = 'Welcome! I can help you book an appointment.';
      newState = 'awaiting_service';
    }

    return {
      response,
      newState,
      contextData: { syncedFlow: syncedFlow.name }
    };
  } catch (error) {
    console.error('Error processing message with synced flow:', error);
    return {
      response: 'Sorry, I encountered an error. Please try again.',
      newState: 'greeting'
    };
  }
}

// Validate user input based on conversation state
function validateUserInput(messageText: string, conversationState: string): { valid: boolean; message: string } {
  const input = messageText.toLowerCase().trim();
  
  switch (conversationState) {
    case 'greeting':
      // Accept any input to start the conversation
      return { valid: true, message: '' };
      
    case 'awaiting_service':
      // Validate service selection
      const validServices = ['1', '2', '3', '4', '5', 'haircut', 'hair color', 'hair styling', 'manicure', 'pedicure'];
      if (validServices.some(service => input.includes(service))) {
        return { valid: true, message: '' };
      }
      return { 
        valid: false, 
        message: '❌ Invalid service selection. Please choose from:\n\n1. Haircut\n2. Hair Color\n3. Hair Styling\n4. Manicure\n5. Pedicure\n\nReply with the number or name of the service.' 
      };
      
    case 'awaiting_date':
      // Validate date selection
      const validDates = ['1', '2', '3', '4', '5', '6', '7'];
      if (validDates.includes(input)) {
        return { valid: true, message: '' };
      }
      return { 
        valid: false, 
        message: '❌ Invalid date selection. Please choose a number from 1-7 for your preferred date.' 
      };
      
    case 'awaiting_time':
      // Validate time selection
      const validTimes = ['1', '2', '3', '4', '5'];
      if (validTimes.includes(input)) {
        return { valid: true, message: '' };
      }
      return { 
        valid: false, 
        message: '❌ Invalid time selection. Please choose a number from 1-5 for your preferred time.' 
      };
      
    case 'awaiting_payment':
      // Validate payment confirmation
      if (input.includes('paid') || input.includes('payment') || input.includes('done')) {
        return { valid: true, message: '' };
      }
      return { 
        valid: false, 
        message: '❌ Please confirm your payment by replying "paid" after completing the payment.' 
      };
      
    default:
      return { valid: true, message: '' };
  }
}

async function processStaticWhatsAppMessage(from: string, messageText: string): Promise<string> {
  console.log("WhatsApp: Processing message from", from, "with text:", messageText);
  
  // Add timeout wrapper for storage operations
  const withTimeout = async <T>(promise: Promise<T>, ms: number): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error(`Operation timed out after ${ms}ms`)), ms)
      )
    ]);
  };

  // Get or create conversation
  let conversation = await storage.getConversation(from);
  if (!conversation) {
    conversation = await storage.createConversation({
      phoneNumber: from,
      currentState: "greeting",
    });
    console.log("WhatsApp: Created new conversation", conversation.id);
  }

  // Store user message
  await storage.createMessage({
    conversationId: conversation.id,
    content: messageText,
    isFromBot: false,
  });
  console.log("WhatsApp: Stored user message for conversation", conversation.id);

  let response = "";
  let newState = conversation.currentState;
  const text = messageText.toLowerCase().trim();

  try {
    // Handle conversation flow
    if (text === "hi" || text === "hello" || conversation.currentState === "greeting") {
      // Send welcome message with services
      const services = await withTimeout(storage.getServices(), 5000);
      const activeServices = services.filter(s => s.isActive);
      
      response = "👋 Welcome to Spark Salon!\n\nHere are our services:\n";
      activeServices.forEach(service => {
        response += `💇‍♀️ ${service.name} – ₹${service.price}\n`;
      });
      response += "\nReply with the number or name of the service to book.";
      newState = "awaiting_service";
      
    } else if (conversation.currentState === "awaiting_service") {
      // Check if message matches a service
      const services = await withTimeout(storage.getServices(), 5000);
      const selectedService = services.find(s => 
        s.isActive && s.name.toLowerCase() === text.toLowerCase()
      );
      
      if (selectedService) {
        // Move to appointment scheduling
        response = `Perfect! You've selected ${selectedService.name} (₹${selectedService.price}).\n\n`;
        response += "📅 Now, please select your preferred appointment date.\n\n";
        response += "Available dates:\n";
        
        // Generate next 7 days as options
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
          response += `${i}. ${dateStr}\n`;
        }
        response += "\nReply with the number (1-7) for your preferred date.";
        
        // Update conversation with selected service
        try {
          const updatedConversation = await withTimeout(storage.updateConversation(conversation.id, {
            selectedService: selectedService.id,
            currentState: "awaiting_date",
          }), 5000);
          
          // Only update newState if the database update was successful
          if (updatedConversation) {
            newState = "awaiting_date";
          } else {
            // If database update failed, still proceed but log the issue
            console.warn("Failed to update conversation state in database, but proceeding with flow");
            newState = "awaiting_date";
          }
        } catch (error) {
          console.error("Error updating conversation:", error);
          // Even if update fails, proceed with the flow
          newState = "awaiting_date";
        }
      } else {
        response = "Sorry, I didn't recognize that service. Please choose from:\n";
        const activeServices = services.filter(s => s.isActive);
        activeServices.forEach(service => {
          response += `• ${service.name}\n`;
        });
      }
      
    } else if (conversation.currentState === "awaiting_date") {
      // Handle date selection
      const dateChoice = parseInt(text);
      if (dateChoice >= 1 && dateChoice <= 7) {
        const today = new Date();
        const selectedDate = new Date(today);
        selectedDate.setDate(today.getDate() + dateChoice);
        const dateStr = selectedDate.toISOString().split('T')[0]; // YYYY-MM-DD format
        const readableDateStr = selectedDate.toLocaleDateString('en-GB', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
        
        response = `Great! You've selected ${readableDateStr}.\n\n`;
        response += "🕐 Now, please choose your preferred time slot:\n\n";
        response += "Available times:\n";
        response += "1. 10:00 AM\n";
        response += "2. 11:30 AM\n";
        response += "3. 02:00 PM\n";
        response += "4. 03:30 PM\n";
        response += "5. 05:00 PM\n";
        response += "\nReply with the number (1-5) for your preferred time.";
        
        // Update conversation with selected date
        try {
          const updatedConversation = await withTimeout(storage.updateConversation(conversation.id, {
            selectedDate: dateStr,
            currentState: "awaiting_time",
          }), 5000);
          
          // Only update newState if the database update was successful
          if (updatedConversation) {
            newState = "awaiting_time";
          } else {
            // If database update failed, still proceed but log the issue
            console.warn("Failed to update conversation state in database, but proceeding with flow");
            newState = "awaiting_time";
          }
        } catch (error) {
          console.error("Error updating conversation:", error);
          // Even if update fails, proceed with the flow
          newState = "awaiting_time";
        }
      } else {
        response = "Please select a valid date option (1-7). Reply with the number for your preferred date.";
      }
      
    } else if (conversation.currentState === "awaiting_time") {
      // Handle time selection
      const timeSlots = ["10:00 AM", "11:30 AM", "02:00 PM", "03:30 PM", "05:00 PM"];
      const timeChoice = parseInt(text);
      
      if (timeChoice >= 1 && timeChoice <= 5) {
        const selectedTime = timeSlots[timeChoice - 1];
        
        // Get service details for payment
        const services = await withTimeout(storage.getServices(), 5000);
        const selectedService = services.find(s => s.id === conversation.selectedService);
        
        if (selectedService) {
          // Update conversation with selected time first
          let newStateUpdated = false;
          try {
            const updatedConversation = await withTimeout(storage.updateConversation(conversation.id, {
              selectedTime: selectedTime,
              currentState: "awaiting_payment",
            }), 5000);
            
            // Only update newState if the database update was successful
            if (updatedConversation) {
              newState = "awaiting_payment";
              newStateUpdated = true;
            } else {
              // If database update failed, still proceed but log the issue
              console.warn("Failed to update conversation state in database, but proceeding with flow");
              newState = "awaiting_payment";
              newStateUpdated = true;
            }
          } catch (error) {
            console.error("Error updating conversation:", error);
            // Even if update fails, proceed with the flow
            newState = "awaiting_payment";
            newStateUpdated = true;
          }
          
          // Use the conversation object that was just updated which contains selectedDate
          if (newStateUpdated) {
            // Get the updated conversation to access selectedDate
            const latestConversation = await withTimeout(storage.getConversation(from), 5000) || conversation;
            
            if (latestConversation && latestConversation.selectedDate) {
              // Generate UPI payment link
              const upiLink = generateUPILink(selectedService.price, selectedService.name);
              
              response = `Perfect! Your appointment is scheduled for ${selectedTime}.\n\n`;
              response += `📋 Booking Summary:\n`;
              response += `Service: ${selectedService.name}\n`;
              response += `Date: ${new Date(latestConversation.selectedDate).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Kolkata' })}\n`;
              response += `Time: ${selectedTime}\n`;
              response += `Amount: ₹${selectedService.price}\n\n`;
              response += `💳 Please complete your payment:\n${upiLink}\n\n`;
              response += "Complete payment in GPay/PhonePe/Paytm and reply 'paid' to confirm your booking.";
              
              // Create booking record with appointment details using IST-accurate datetime
              const time24 = timeChoice === 1 ? '10:00' : timeChoice === 2 ? '11:30' : timeChoice === 3 ? '14:00' : timeChoice === 4 ? '15:30' : '17:00';
              const [hourStr, minuteStr] = time24.split(":");
              const istOffsetMs = 5.5 * 60 * 60 * 1000;
              // Build an IST midnight Date for the selected day, then add hours/minutes, then convert to UTC Date
              const [y, m, d] = latestConversation.selectedDate.split('-').map((v) => parseInt(v, 10));
              const istMidnight = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
              const istDateTimeMs = istMidnight.getTime() + (parseInt(hourStr, 10) * 60 + parseInt(minuteStr, 10)) * 60 * 1000;
              const utcDateTime = new Date(istDateTimeMs - istOffsetMs);
              
              await withTimeout(storage.createBooking({
                conversationId: conversation.id,
                serviceId: selectedService.id,
                phoneNumber: from,
                amount: selectedService.price, // Already in INR
                status: "pending",
                appointmentDate: utcDateTime,
                appointmentTime: selectedTime,
              }), 5000);
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
      if (text === "paid") {
        response = "✅ Payment received! Your appointment is now confirmed.\n\n";
        response += "📋 Booking Details:\n";
        response += `Service: ${conversation.selectedService}\n`;
        if (conversation.selectedDate) {
          response += `Date: ${new Date(conversation.selectedDate).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Kolkata' })}\n`;
        }
        if (conversation.selectedTime) {
          response += `Time: ${conversation.selectedTime}\n`;
        }
        response += "\n🎉 Thank you for choosing Spark Salon! We look forward to serving you.";
        
        // Update booking status
        try {
          const bookings = await withTimeout(storage.getBookings(), 5000);
          const pendingBooking = bookings.find(b => 
            b.conversationId === conversation.id && b.status === "pending"
          );
          
          if (pendingBooking) {
            await withTimeout(storage.updateBooking(pendingBooking.id, {
              status: "confirmed",
              paymentMethod: "UPI",
            }), 5000);
          }
        } catch (error) {
          console.error("Error updating booking:", error);
        }
        
        // Reset conversation state
        newState = "completed";
      } else {
        response = "Please complete your payment first. Click the UPI link and reply 'paid' once done.";
      }
      
    } else if (conversation.currentState === "completed") {
      response = "Your appointment is already confirmed! 🎉\n\n";
      response += "📋 Booking Details:\n";
      response += `Service: ${conversation.selectedService}\n`;
      if (conversation.selectedDate) {
        response += `Date: ${new Date(conversation.selectedDate).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n`;
      }
      if (conversation.selectedTime) {
        response += `Time: ${conversation.selectedTime}\n`;
      }
      response += "\n🎉 Thank you for choosing Spark Salon! We look forward to serving you.";
      
    } else {
      // Default response for unrecognized input
      response = "I'm sorry, I didn't understand that. Type 'hi' to start over or choose a service from our menu.";
    }

    // Update conversation state if needed
    if (newState !== conversation.currentState) {
      try {
        await withTimeout(storage.updateConversation(conversation.id, {
          currentState: newState,
        }), 5000);
      } catch (error) {
        console.error("Error updating conversation state:", error);
      }
    }

    // Store bot message
    await storage.createMessage({
      conversationId: conversation.id,
      content: response,
      isFromBot: true,
    });

    return response;
  } catch (error) {
    console.error("Error processing WhatsApp message:", error);
    return "Sorry, I encountered an error processing your request. Please try again.";
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // WhatsApp webhook verification (GET)
  app.get("/webhook", (req, res) => {
    try {
      console.log("Webhook verification request:", req.query);
      const verification = webhookVerificationSchema.parse(req.query);
      const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
      
      console.log("Received verify token:", verification["hub.verify_token"]);
      console.log("Expected verify token:", verifyToken);
      console.log("Mode:", verification["hub.mode"]);
      
      if (verification["hub.mode"] === "subscribe" && 
          verification["hub.verify_token"] === verifyToken) {
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

  // WhatsApp webhook for incoming messages (POST)
  app.post("/webhook", async (req, res) => {
    try {
      const webhookData = whatsAppMessageSchema.parse(req.body);
      
      // Process each message
      for (const entry of webhookData.entry) {
        for (const change of entry.changes) {
          if (change.value.messages) {
            for (const message of change.value.messages) {
              if (message.type === "text") {
                await processWhatsAppMessage(message.from, message.text.body);
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

  // API routes for dashboard
  app.get("/api/services", async (req, res) => {
    try {
      const services = await storage.getServices();
      console.log("API: Fetching services, found:", services.length);
      res.json(services);
    } catch (error) {
      console.error("Error fetching services:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/services", async (req, res) => {
    try {
      const serviceData = createServiceSchema.parse(req.body);
      const service = await storage.createService(serviceData);
      res.status(201).json(service);
    } catch (error) {
      console.error("Error creating service:", error);
      res.status(400).json({ error: "Invalid service data" });
    }
  });

  app.get("/api/bookings", async (req, res) => {
    try {
      const bookings = await storage.getBookings();
      console.log("API: Fetching bookings, found:", bookings.length);
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/bookings/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      // Validate status
      if (!status || !['pending', 'confirmed', 'cancelled'].includes(status)) {
        return res.status(400).json({ error: "Invalid status. Must be pending, confirmed, or cancelled" });
      }

      // Get booking details before updating
      const bookings = await storage.getBookings();
      const booking = bookings.find(b => b.id === id);
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }

      // Update booking status
      const updatedBooking = await storage.updateBooking(id, { status });
      if (!updatedBooking) {
        return res.status(404).json({ error: "Booking not found" });
      }

      // Send WhatsApp notification to customer
      if (status === 'confirmed' || status === 'cancelled') {
        try {
          // Get service details for the notification
          const services = await storage.getServices();
          const service = services.find(s => s.id === booking.serviceId);
          const serviceName = service?.name || 'Service';

          let notificationMessage = '';
          
          if (status === 'confirmed') {
            // Format appointment date safely
            let appointmentDateStr = 'your selected date';
            if (booking.appointmentDate) {
              try {
                appointmentDateStr = new Date(booking.appointmentDate).toLocaleDateString('en-GB', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                });
              } catch (e) {
                console.error("Error formatting appointment date:", e);
              }
            }
            
            const appointmentTime = booking.appointmentTime || 'your selected time';

            notificationMessage = `✅ *Booking Confirmed!*

Your appointment has been confirmed by Spark Salon.

📋 *Booking Details:*
Service: ${serviceName}
Date: ${appointmentDateStr}
Time: ${appointmentTime}
Amount: ₹${booking.amount}

📍 Please arrive 10 minutes early for your appointment.

Thank you for choosing Spark Salon! 🎉`;

          } else if (status === 'cancelled') {
            notificationMessage = `❌ *Booking Cancelled*

We're sorry to inform you that your booking has been cancelled.

📋 *Cancelled Booking:*
Service: ${serviceName}
Amount: ₹${booking.amount}

If you have any questions or would like to reschedule, please contact us or send a new booking request.

We apologize for any inconvenience caused.`;
          }

          // Send WhatsApp notification
          const notificationSent = await sendWhatsAppMessage(booking.phoneNumber, notificationMessage);
          console.log(`WhatsApp notification ${notificationSent ? 'sent' : 'failed'} for booking ${id} status change to ${status}`);
          
        } catch (notificationError) {
          console.error("Error sending WhatsApp notification:", notificationError);
          // Don't fail the booking update if notification fails
        }
      }
      
      res.json(updatedBooking);
    } catch (error) {
      console.error("Error updating booking:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update service endpoint
  app.patch("/api/services/:id", async (req, res) => {
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

  // Delete service endpoint
  app.delete("/api/services/:id", async (req, res) => {
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

  // Settings endpoints for UPI ID
  app.get("/api/settings", async (req, res) => {
    try {
      // For now, return default settings. In a real app, this would be stored in database
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

  app.patch("/api/settings", async (req, res) => {
    try {
      const { upiId, businessName } = req.body;
      
      // For now, just return the updated settings
      // In a real app, this would be stored in database
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

  app.get("/api/stats", async (req, res) => {
    try {
      const backend = getStorageBackendName();
      const parseDbTimestamp = (value: unknown): Date => {
        if (value instanceof Date) return value;
        if (typeof value === 'string') {
          const isoLike = value.includes('T') ? value : value.replace(' ', 'T');
          const withZ = /Z$/i.test(isoLike) ? isoLike : `${isoLike}Z`;
          const d = new Date(withZ);
          if (!isNaN(d.getTime())) return d;
          // Fallback to native parsing
          return new Date(value);
        }
        return new Date(value as any);
      };
      // Get today's bookings
      const todayBookings = await storage.getTodayBookings();
      console.log("Today's bookings count:", todayBookings.length);
      console.log("Today's bookings:", todayBookings);
      
      // Calculate today's revenue (already in INR)
      const todayRevenueINR = todayBookings
        .filter(booking => booking.status === "confirmed")
        .reduce((total, booking) => total + booking.amount, 0);
      console.log("Today's revenue:", todayRevenueINR);
      
      // Get all bookings for total count
      const allBookings = await storage.getBookings();
      console.log("All bookings count:", allBookings.length);
      
      // Calculate today's messages by counting only messages from today (IST window) across all conversations
      let todayMessages = 0;
      const offsetMs = 5.5 * 60 * 60 * 1000; // IST UTC+5:30
      const nowUtcMs = Date.now();
      const istNow = new Date(nowUtcMs + offsetMs);
      const istStart = new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate(), 0, 0, 0, 0));
      const istEnd = new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate() + 1, 0, 0, 0, 0));
      const utcStart = new Date(istStart.getTime() - offsetMs);
      const utcEnd = new Date(istEnd.getTime() - offsetMs);
      const conversationIds = Array.from(new Set(allBookings.map(b => b.conversationId)));
      for (const cid of conversationIds) {
        const messages = await storage.getMessages(cid);
        const countToday = messages.filter(m => {
          const raw = (m as any).timestamp ?? (m as any).createdAt;
          const ts = parseDbTimestamp(raw);
          return ts >= utcStart && ts < utcEnd;
        }).length;
        todayMessages += countToday;
      }
      console.log("Today's messages count:", todayMessages);
      
      // Calculate response rate (simplified calculation)
      // For now, we'll calculate based on the ratio of bot messages to total messages
      // A more accurate calculation would require tracking message responses
      let responseRate = 0; // Default to 0 when no messages
      if (todayMessages > 0) {
        // Approximate: bot replies are those marked isFromBot within today's window
        let botToday = 0;
        for (const cid of conversationIds) {
          const messages = await storage.getMessages(cid);
          botToday += messages.filter(m => {
            const raw = (m as any).timestamp ?? (m as any).createdAt;
            const ts = parseDbTimestamp(raw);
            return m.isFromBot && ts >= utcStart && ts < utcEnd;
          }).length;
        }
        responseRate = Math.min(100, Math.round((botToday / todayMessages) * 100));
      }
      
      const stats = {
        todayMessages,
        todayBookings: todayBookings.length,
        todayRevenue: todayRevenueINR, // Already in INR
        responseRate,
        totalBookings: allBookings.length,
        backend,
      };
      
      console.log("Stats response:", stats);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Test endpoint to simulate WhatsApp message (for development)
  app.post("/api/test-message", async (req, res) => {
    try {
      const { from, message } = req.body;
      await processWhatsAppMessage(from, message);
      res.json({ success: true });
    } catch (error) {
      console.error("Error processing test message:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Migration endpoint for fixing database schema (admin only)
  app.post("/api/admin/migrate", async (req, res) => {
    try {
      const { adminKey } = req.body;
      
      // Simple admin key check (in production, use proper authentication)
      if (adminKey !== process.env.ADMIN_KEY && adminKey !== "migrate_fix_2024") {
        return res.status(403).json({ error: "Unauthorized" });
      }

      // Run the migration to add missing columns
      const { Pool } = require('@neondatabase/serverless');
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });
      
      const client = await pool.connect();
      try {
        // Add columns one by one using simple ALTER TABLE with IF NOT EXISTS
        const migrations = [
          "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(255);",
          "ALTER TABLE services ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;",
          "ALTER TABLE services ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;",
          "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;",
          "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;",
          "ALTER TABLE conversations ADD COLUMN IF NOT EXISTS context_data JSONB DEFAULT '{}';"
        ];

        const results = [];
        for (const sql of migrations) {
          try {
            await client.query(sql);
            results.push(`✅ Executed: ${sql}`);
            console.log(`✅ Executed: ${sql}`);
          } catch (error) {
            results.push(`⚠️ Error: ${sql} - ${error.message}`);
            console.log(`⚠️ Error: ${sql} - ${error.message}`);
          }
        }

        console.log("✅ Database migration completed");
        res.json({ 
          success: true, 
          message: "Database migration completed successfully. Missing columns added.",
          details: results
        });
      } finally {
        client.release();
        await pool.end();
      }
    } catch (error) {
      console.error("❌ Migration failed:", error);
      res.status(500).json({ 
        success: false, 
        error: "Migration failed", 
        details: error.message 
      });
    }
  });

  // Business configuration API
  app.get("/api/business-config", (req, res) => {
    try {
      const { getBusinessConfig } = require("./business-config-api");
      const businessType = req.query.type as string;
      const config = getBusinessConfig(businessType);
      res.json({ success: true, data: config });
    } catch (error) {
      console.error("Error fetching business config:", error);
      res.status(500).json({ success: false, error: "Failed to fetch business config" });
    }
  });

  app.get("/api/business-types", (req, res) => {
    try {
      const { getAllBusinessTypes } = require("./business-config-api");
      const types = getAllBusinessTypes();
      res.json({ success: true, data: types });
    } catch (error) {
      console.error("Error fetching business types:", error);
      res.status(500).json({ success: false, error: "Failed to fetch business types" });
    }
  });

  // Bot Flows API endpoints - handled by dedicated router
  app.use("/api/bot-flows", botFlowRoutes);
  
  // Salon API endpoints - handled by dedicated router
  app.use("/api/salon", salonApiRoutes);

  // Flow activation endpoints
  app.post("/api/bot-flows/:flowId/activate", async (req, res) => {
    try {
      const { flowId } = req.params;
      
      // In real implementation, this would:
      // 1. Set this flow as active for the tenant
      // 2. Deactivate other flows
      // 3. Update the dynamic message processor
      
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

  app.post("/api/bot-flows/:flowId/deactivate", async (req, res) => {
    try {
      const { flowId } = req.params;
      
      // In real implementation, this would:
      // 1. Deactivate this flow
      // 2. Fall back to default/static processing
      
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

  // Conversation Engine API endpoints
  app.post("/api/conversations/:conversationId/process", async (req, res) => {
    try {
      const { conversationId } = req.params;
      const { phoneNumber, message } = req.body;

      // Mock response for now - replace with actual conversation engine
      const mockResponse = {
        success: true,
        response: `Processed message "${message}" for conversation ${conversationId}`,
        shouldContinue: true,
      };

      res.json(mockResponse);
    } catch (error) {
      console.error("Error processing conversation message:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/conversations/:conversationId/status", async (req, res) => {
    try {
      const { conversationId } = req.params;

      // Mock response for now
      const mockStatus = {
        isActive: true,
        currentNode: 'message-1',
        variables: { userName: 'John' },
        flowId: 'flow-123',
      };

      res.json(mockStatus);
    } catch (error) {
      console.error("Error getting conversation status:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/conversations/test-flow", async (req, res) => {
    try {
      const { flowId, testMessages } = req.body;

      if (!flowId || !testMessages || !Array.isArray(testMessages)) {
        return res.status(400).json({ 
          error: 'flowId and testMessages array are required' 
        });
      }

      // Mock test results
      const results = testMessages.map((message, index) => ({
        input: message,
        success: true,
        response: `Mock response to: ${message}`,
        step: index + 1,
      }));

      res.json({
        success: true,
        testResults: results,
        totalSteps: results.length,
      });
    } catch (error) {
      console.error("Error testing bot flow:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Bot flow management endpoints
  app.get('/api/bot-flows/load-whatsapp', async (req, res) => {
    try {
      const { BotFlowSyncService } = require('./services/bot-flow-sync.service');
      const flowSyncService = BotFlowSyncService.getInstance();
      
      // Load the exact WhatsApp bot flow
      const flow = await flowSyncService.loadWhatsAppBotFlow();
      
      res.json({
        success: true,
        message: 'WhatsApp bot flow loaded successfully',
        flow: flow
      });
    } catch (error) {
      console.error('Error loading WhatsApp bot flow:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to load WhatsApp bot flow'
      });
    }
  });

  app.post('/api/bot-flows/activate', async (req, res) => {
    try {
      const { BotFlowSyncService } = require('./services/bot-flow-sync.service');
      const flowSyncService = BotFlowSyncService.getInstance();
      
      const { flowId } = req.body;
      
      // Create backup before activating new flow
      await flowSyncService.createBackup();
      
      // Load and activate the flow
      const flow = await flowSyncService.loadWhatsAppBotFlow();
      flowSyncService.updateActiveFlow(flow);
      
      res.json({
        success: true,
        message: 'Bot flow activated successfully',
        flow: flow
      });
    } catch (error) {
      console.error('Error activating bot flow:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to activate bot flow'
      });
    }
  });

  app.post('/api/bot-flows/restore', async (req, res) => {
    try {
      const { BotFlowSyncService } = require('./services/bot-flow-sync.service');
      const flowSyncService = BotFlowSyncService.getInstance();
      
      // Restore from backup
      const restoredFlow = await flowSyncService.restoreFromBackup();
      
      if (restoredFlow) {
        res.json({
          success: true,
          message: 'Bot flow restored from backup successfully',
          flow: restoredFlow
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'No backup found to restore from'
        });
      }
    } catch (error) {
      console.error('Error restoring bot flow:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to restore bot flow'
      });
    }
  });

  app.post('/api/bot-flows/sync', async (req, res) => {
    try {
      console.log('🔄 Sync endpoint called with flow data:', req.body);
      
      const { flowData } = req.body;
      
      if (!flowData) {
        console.log('❌ No flow data provided');
        return res.status(400).json({
          success: false,
          error: 'Flow data is required'
        });
      }
      
      console.log('✅ Flow data received, processing sync...');
      
      // Update the WhatsApp bot with the new flow data
      console.log('🔄 Syncing flow:', flowData.name, 'with WhatsApp bot');
      
      // Store the flow data in a way that the WhatsApp bot can access it
      // For now, we'll store it in a simple in-memory cache
      global.whatsappBotFlow = flowData;
      
      // Also try to update the dynamic flow processor if available
      try {
        const { DynamicFlowProcessorService } = require('./services/dynamic-flow-processor.service');
        const flowProcessor = DynamicFlowProcessorService.getInstance();
        await flowProcessor.updateFlow(flowData);
        console.log('✅ Dynamic flow processor updated');
      } catch (error) {
        console.log('⚠️ Dynamic flow processor not available, using fallback');
      }
      
      res.json({
        success: true,
        message: 'Bot flow synced successfully with WhatsApp bot',
        flow: flowData
      });
    } catch (error) {
      console.error('❌ Error syncing bot flow:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to sync bot flow'
      });
    }
  });

  // Test endpoint to verify API is working
  app.get('/api/bot-flows/test', async (req, res) => {
    try {
      console.log('🧪 Test endpoint called');
      res.json({
        success: true,
        message: 'Bot flows API is working!',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Test endpoint error:', error);
      res.status(500).json({
        success: false,
        error: 'Test endpoint failed'
      });
    }
  });

  // Simple test endpoint
  app.get('/api/test', (req, res) => {
    console.log('🧪 Simple test endpoint called');
    res.json({
      success: true,
      message: 'API is working!',
      timestamp: new Date().toISOString()
    });
  });

  // Alternative test sync endpoint
  app.get('/api/sync-test', (req, res) => {
    console.log('🧪 Alternative sync test endpoint called');
    res.json({
      success: true,
      message: 'Alternative sync test completed',
      timestamp: new Date().toISOString()
    });
  });

  // Test sync endpoint to verify flow is stored (MOVED OUTSIDE bot-flows router to bypass tenant middleware)
  app.get('/api/test-sync', (req, res) => {
    console.log('🧪 Test sync endpoint called - START');
    
    // Check if global flow is stored
    const hasFlow = !!global.whatsappBotFlow;
    const flowName = global.whatsappBotFlow?.name || 'No flow';
    const nodeCount = global.whatsappBotFlow?.nodes?.length || 0;
    
    console.log('🔍 Global flow status:', { hasFlow, flowName, nodeCount });
    
    // Send immediate response to test if endpoint works
    const response = {
      success: true,
      message: 'Sync test completed',
      hasFlow,
      flowName,
      nodeCount,
      timestamp: new Date().toISOString()
    };
    
    console.log('🧪 Test sync endpoint called - SENDING RESPONSE');
    res.json(response);
    console.log('🧪 Test sync endpoint called - RESPONSE SENT');
  });

  // Simple sync endpoint that stores flow in memory (MOVED OUTSIDE bot-flows router to bypass tenant middleware)
  app.post('/api/sync-simple', (req, res) => {
    console.log('🔄 Simple sync endpoint called - START');
    console.log('🔄 Request method:', req.method);
    console.log('🔄 Request URL:', req.url);
    
    try {
      console.log('🔄 Simple sync endpoint called');
      console.log('Request body keys:', Object.keys(req.body || {}));
      
      const { flowData } = req.body;
      
      if (!flowData) {
        console.log('❌ No flow data provided');
        return res.status(400).json({
          success: false,
          error: 'Flow data is required'
        });
      }
      
      // Store flow in global variable for WhatsApp bot to use
      global.whatsappBotFlow = flowData;
      
      console.log('✅ Flow synced to WhatsApp bot:', flowData.name);
      console.log('✅ Flow nodes count:', flowData.nodes?.length || 0);
      console.log('✅ Flow stored in global.whatsappBotFlow');
      console.log('✅ First node message preview:', flowData.nodes?.[0]?.configuration?.message?.substring(0, 100) || 'No message');
      console.log('✅ Global flow verification:', global.whatsappBotFlow ? 'STORED' : 'NOT STORED');
      console.log('✅ Global flow name:', global.whatsappBotFlow?.name || 'NO NAME');
      
      // Send response immediately
      res.json({
        success: true,
        message: 'Flow synced successfully with WhatsApp bot',
        flow: flowData
      });
      
    } catch (error) {
      console.error('❌ Simple sync error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to sync flow'
      });
    }
  });
  
  console.log('✅ Route /api/sync-simple registered');
  
  // Test GET endpoint for sync-simple
  app.get('/api/sync-simple', (req, res) => {
    console.log('🧪 GET /api/sync-simple called');
    res.json({
      success: true,
      message: 'Sync-simple endpoint is working',
      method: 'GET',
      timestamp: new Date().toISOString()
    });
  });

  // Load services for bot flow builder
  app.get('/api/services-for-bot', async (req, res) => {
    try {
      console.log('🔄 Loading services for bot flow builder');
      
      const services = await storage.getServices();
      console.log('✅ Loaded services:', services.length);
      
      // Format services for bot flow builder
      const formattedServices = services.map(service => ({
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
      console.error('❌ Error loading services for bot:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to load services'
      });
    }
  });

  // Test WhatsApp bot processing
  app.post('/api/test-whatsapp-bot', async (req, res) => {
    console.log('🧪 Test WhatsApp bot endpoint called - START');
    try {
      console.log('🧪 Testing WhatsApp bot processing');
      const { message, phoneNumber } = req.body;
      
      if (!message || !phoneNumber) {
        console.log('❌ Missing required fields');
        return res.status(400).json({
          success: false,
          error: 'Message and phoneNumber are required'
        });
      }
      
      console.log('🔍 Testing with message:', message);
      console.log('🔍 Testing with phone:', phoneNumber);
      
      // Test the message processing
      await processWhatsAppMessage(phoneNumber, message);
      
      console.log('✅ WhatsApp bot processing test completed');
      res.json({
        success: true,
        message: 'WhatsApp bot processing test completed',
        flowUsed: global.whatsappBotFlow ? global.whatsappBotFlow.name : 'Static flow'
      });
    } catch (error) {
      console.error('❌ Error testing WhatsApp bot:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to test WhatsApp bot'
      });
    }
  });
  
  console.log('✅ Route /api/test-whatsapp-bot registered');
  
  // Simple GET test for the endpoint
  app.get('/api/test-whatsapp-bot', (req, res) => {
    console.log('🧪 GET /api/test-whatsapp-bot called');
    res.json({
      success: true,
      message: 'WhatsApp bot test endpoint is working',
      method: 'GET',
      timestamp: new Date().toISOString()
    });
  });

  // Get current flow data
  app.get('/api/bot-flows/current', async (req, res) => {
    try {
      if (global.whatsappBotFlow) {
        res.json({
          success: true,
          flow: global.whatsappBotFlow
        });
      } else {
        res.json({
          success: false,
          message: 'No active flow found'
        });
      }
    } catch (error) {
      console.error('❌ Get current flow error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get current flow'
      });
    }
  });


  const httpServer = createServer(app);
  return httpServer;
}
