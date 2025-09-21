import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";

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
  price: z.number().min(0),
  icon: z.string().optional(),
});

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

// Generate UPI payment link
function generateUPILink(amount: number, serviceName: string): string {
  const upiId = process.env.UPI_ID || "sparksalon@upi";
  return `upi://pay?pa=${upiId}&pn=Spark+Salon&am=${amount}&cu=INR&tn=Payment+for+${encodeURIComponent(serviceName)}`;
}

// Process incoming WhatsApp message
async function processWhatsAppMessage(from: string, messageText: string): Promise<void> {
  try {
    console.log("WhatsApp: Processing message from", from, ":", messageText);
    const text = messageText.toLowerCase().trim();
    
    // Get or create conversation
    let conversation = await storage.getConversation(from);
    if (!conversation) {
      conversation = await storage.createConversation({
        phoneNumber: from,
        currentState: "greeting",
      });
    }

    // Store incoming message
    await storage.createMessage({
      conversationId: conversation.id,
      content: messageText,
      isFromBot: false,
    });
    console.log("WhatsApp: Stored user message for conversation", conversation.id);

    let response = "";
    let newState = conversation.currentState;

    // Handle conversation flow
    if (text === "hi" || text === "hello" || conversation.currentState === "greeting") {
      // Send welcome message with services
      const services = await storage.getServices();
      const activeServices = services.filter(s => s.isActive);
      
      response = "👋 Welcome to Spark Salon!\n\nHere are our services:\n";
      activeServices.forEach(service => {
        response += `💇‍♀️ ${service.name} – ₹${service.price}\n`;
      });
      response += "\nReply with service name to book.";
      newState = "awaiting_service";
      
    } else if (conversation.currentState === "awaiting_service") {
      // Check if message matches a service
      const services = await storage.getServices();
      const selectedService = services.find(s => 
        s.isActive && s.name.toLowerCase() === text
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
        await storage.updateConversation(conversation.id, {
          selectedService: selectedService.id,
          currentState: "awaiting_date",
        });
        
        newState = "awaiting_date";
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
        await storage.updateConversation(conversation.id, {
          selectedDate: dateStr,
          currentState: "awaiting_time",
        });
        
        newState = "awaiting_time";
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
        const services = await storage.getServices();
        const selectedService = services.find(s => s.id === conversation.selectedService);
        
        if (selectedService) {
          // Update conversation with selected time first
          const updatedConversation = await storage.updateConversation(conversation.id, {
            selectedTime: selectedTime,
            currentState: "awaiting_payment",
          });
          
          // Get the latest conversation data to ensure we have selectedDate
          const latestConversation = await storage.getConversation(from);
          
          if (latestConversation && latestConversation.selectedDate) {
            // Generate UPI payment link
            const upiLink = generateUPILink(selectedService.price, selectedService.name);
            
            response = `Perfect! Your appointment is scheduled for ${selectedTime}.\n\n`;
            response += `📋 Booking Summary:\n`;
            response += `Service: ${selectedService.name}\n`;
            response += `Date: ${new Date(latestConversation.selectedDate).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n`;
            response += `Time: ${selectedTime}\n`;
            response += `Amount: ₹${selectedService.price}\n\n`;
            response += `💳 Please complete your payment:\n${upiLink}\n\n`;
            response += "Complete payment in GPay/PhonePe/Paytm and reply 'paid' to confirm your booking.";
            
            // Create booking record with appointment details
            const appointmentDateTime = new Date(`${latestConversation.selectedDate}T${timeChoice === 1 ? '10:00' : timeChoice === 2 ? '11:30' : timeChoice === 3 ? '14:00' : timeChoice === 4 ? '15:30' : '17:00'}:00`);
            
            await storage.createBooking({
              conversationId: conversation.id,
              serviceId: selectedService.id,
              phoneNumber: from,
              amount: selectedService.price,
              status: "pending",
              appointmentDate: appointmentDateTime,
              appointmentTime: selectedTime,
            });
            
            newState = "awaiting_payment";
          }
        }
      } else {
        response = "Please select a valid time slot (1-5). Reply with the number for your preferred time.";
      }
      
    } else if (conversation.currentState === "awaiting_payment" && text === "paid") {
      // Confirm payment and booking
      const services = await storage.getServices();
      const selectedService = services.find(s => s.id === conversation.selectedService);
      
      response = "✅ Payment received! Your appointment is confirmed.\n\n";
      response += "📋 Confirmed Booking Details:\n";
      if (selectedService) {
        response += `Service: ${selectedService.name}\n`;
      }
      if (conversation.selectedDate) {
        const appointmentDate = new Date(conversation.selectedDate);
        response += `Date: ${appointmentDate.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n`;
      }
      if (conversation.selectedTime) {
        response += `Time: ${conversation.selectedTime}\n`;
      }
      response += "\n🎉 Thank you for choosing Spark Salon! We look forward to serving you.";
      
      // Update booking status
      const bookings = await storage.getBookings();
      const pendingBooking = bookings.find(b => 
        b.conversationId === conversation.id && b.status === "pending"
      );
      
      if (pendingBooking) {
        await storage.updateBooking(pendingBooking.id, {
          status: "confirmed",
          paymentMethod: "UPI",
        });
      }
      
      // Reset conversation state
      newState = "completed";
      
    } else {
      // Default response for unrecognized input
      response = "I'm sorry, I didn't understand that. Type 'hi' to start over or choose a service from our menu.";
    }

    // Update conversation state if needed
    if (newState !== conversation.currentState) {
      await storage.updateConversation(conversation.id, {
        currentState: newState,
      });
    }

    // Send response
    await sendWhatsAppMessage(from, response);
    
    // Store bot response
    await storage.createMessage({
      conversationId: conversation.id,
      content: response,
      isFromBot: true,
    });
    console.log("WhatsApp: Stored bot response for conversation", conversation.id);

  } catch (error) {
    console.error("Error processing WhatsApp message:", error);
    // Send error message to user
    await sendWhatsAppMessage(from, "Sorry, I'm experiencing technical difficulties. Please try again later.");
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
      
      const updatedBooking = await storage.updateBooking(id, { status });
      if (!updatedBooking) {
        return res.status(404).json({ error: "Booking not found" });
      }
      
      res.json(updatedBooking);
    } catch (error) {
      console.error("Error updating booking:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/stats", async (req, res) => {
    try {
      const todayBookings = await storage.getTodayBookings();
      const todayRevenue = await storage.getTodayRevenue();
      const allBookings = await storage.getBookings();
      
      // Calculate today's messages (approximate based on bookings)
      const todayMessages = todayBookings.length * 4; // Estimate 4 messages per booking flow
      
      const stats = {
        todayMessages,
        todayBookings: todayBookings.length,
        todayRevenue,
        responseRate: 98, // Static for now
        totalBookings: allBookings.length,
      };
      
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

  const httpServer = createServer(app);
  return httpServer;
}
