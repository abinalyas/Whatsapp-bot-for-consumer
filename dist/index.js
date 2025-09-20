var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express3 from "express";

// server/routes.ts
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  bookings: () => bookings,
  conversations: () => conversations,
  insertBookingSchema: () => insertBookingSchema,
  insertConversationSchema: () => insertConversationSchema,
  insertMessageSchema: () => insertMessageSchema,
  insertServiceSchema: () => insertServiceSchema,
  messages: () => messages,
  services: () => services
});
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var services = pgTable("services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  icon: text("icon")
});
var conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  phoneNumber: text("phone_number").notNull(),
  customerName: text("customer_name"),
  currentState: text("current_state").notNull().default("greeting"),
  // greeting, awaiting_service, awaiting_date, awaiting_time, awaiting_payment, completed
  selectedService: varchar("selected_service").references(() => services.id),
  selectedDate: text("selected_date"),
  // YYYY-MM-DD format
  selectedTime: text("selected_time"),
  // HH:MM format
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull().references(() => conversations.id),
  content: text("content").notNull(),
  isFromBot: boolean("is_from_bot").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow()
});
var bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull().references(() => conversations.id),
  serviceId: varchar("service_id").notNull().references(() => services.id),
  phoneNumber: text("phone_number").notNull(),
  customerName: text("customer_name"),
  amount: integer("amount").notNull(),
  status: text("status").notNull().default("pending"),
  // pending, paid, confirmed
  paymentMethod: text("payment_method"),
  appointmentDate: timestamp("appointment_date"),
  appointmentTime: text("appointment_time"),
  // e.g., "10:00 AM", "02:30 PM"
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var insertServiceSchema = createInsertSchema(services).omit({
  id: true
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

// server/storage.ts
import { randomUUID } from "crypto";

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
import { eq, and, gte, lt } from "drizzle-orm";
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
        id: randomUUID(),
        name: "Haircut",
        description: "Basic haircut and styling",
        price: 200,
        isActive: true,
        icon: "fas fa-cut"
      },
      {
        id: randomUUID(),
        name: "Facial",
        description: "Deep cleansing facial treatment",
        price: 500,
        isActive: true,
        icon: "fas fa-sparkles"
      },
      {
        id: randomUUID(),
        name: "Massage",
        description: "Relaxing full body massage",
        price: 800,
        isActive: true,
        icon: "fas fa-hands"
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
      id: randomUUID()
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
  async getConversation(phoneNumber) {
    return this.conversations.find((conversation) => conversation.phoneNumber === phoneNumber);
  }
  async createConversation(conversation) {
    const newConversation = {
      ...conversation,
      id: randomUUID(),
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
      id: randomUUID(),
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
      id: randomUUID(),
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
var DatabaseStorageImpl = class {
  constructor() {
    this.initializeDefaultServices();
  }
  async initializeDefaultServices() {
    const existingServices = await this.getServices();
    if (existingServices.length > 0) return;
    const defaultServices = [
      {
        name: "Haircut",
        description: "Basic haircut and styling",
        price: 200,
        isActive: true,
        icon: "fas fa-cut"
      },
      {
        name: "Facial",
        description: "Deep cleansing facial treatment",
        price: 500,
        isActive: true,
        icon: "fas fa-sparkles"
      },
      {
        name: "Massage",
        description: "Relaxing full body massage",
        price: 800,
        isActive: true,
        icon: "fas fa-hands"
      }
    ];
    for (const service of defaultServices) {
      await this.createService(service);
    }
  }
  async getServices() {
    return await db.select().from(services);
  }
  async getService(id) {
    const [service] = await db.select().from(services).where(eq(services.id, id));
    return service || void 0;
  }
  async createService(insertService) {
    const [service] = await db.insert(services).values(insertService).returning();
    return service;
  }
  async updateService(id, updateData) {
    const [service] = await db.update(services).set(updateData).where(eq(services.id, id)).returning();
    return service || void 0;
  }
  async getConversation(phoneNumber) {
    const [conversation] = await db.select().from(conversations).where(eq(conversations.phoneNumber, phoneNumber));
    return conversation || void 0;
  }
  async createConversation(insertConversation) {
    const [conversation] = await db.insert(conversations).values(insertConversation).returning();
    return conversation;
  }
  async updateConversation(id, updateData) {
    const [conversation] = await db.update(conversations).set({ ...updateData, updatedAt: /* @__PURE__ */ new Date() }).where(eq(conversations.id, id)).returning();
    return conversation || void 0;
  }
  async getMessages(conversationId) {
    return await db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(messages.timestamp);
  }
  async createMessage(insertMessage) {
    const [message] = await db.insert(messages).values(insertMessage).returning();
    return message;
  }
  async getBookings() {
    return await db.select().from(bookings).orderBy(bookings.createdAt);
  }
  async createBooking(insertBooking) {
    const [booking] = await db.insert(bookings).values(insertBooking).returning();
    return booking;
  }
  async updateBooking(id, updateData) {
    const [booking] = await db.update(bookings).set({ ...updateData, updatedAt: /* @__PURE__ */ new Date() }).where(eq(bookings.id, id)).returning();
    return booking || void 0;
  }
  async getTodayBookings() {
    const today = /* @__PURE__ */ new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return await db.select().from(bookings).where(and(
      gte(bookings.createdAt, today),
      lt(bookings.createdAt, tomorrow)
    ));
  }
  async getTodayRevenue() {
    const todayBookings = await this.getTodayBookings();
    return todayBookings.filter((booking) => booking.status === "confirmed").reduce((total, booking) => total + booking.amount, 0);
  }
};
var storage = process.env.NODE_ENV === "production" && process.env.DATABASE_URL ? new DatabaseStorageImpl() : new InMemoryStorage();

// server/routes.ts
import { z } from "zod";
var webhookVerificationSchema = z.object({
  "hub.mode": z.string(),
  "hub.challenge": z.string(),
  "hub.verify_token": z.string()
});
var whatsAppMessageSchema = z.object({
  object: z.string(),
  entry: z.array(z.object({
    id: z.string(),
    changes: z.array(z.object({
      value: z.object({
        messaging_product: z.string(),
        metadata: z.object({
          display_phone_number: z.string(),
          phone_number_id: z.string()
        }),
        messages: z.array(z.object({
          from: z.string(),
          id: z.string(),
          timestamp: z.string(),
          text: z.object({
            body: z.string()
          }),
          type: z.string()
        })).optional()
      }),
      field: z.string()
    }))
  }))
});
var createServiceSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().min(0),
  icon: z.string().optional()
});
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
    const text2 = messageText.toLowerCase().trim();
    let conversation = await storage.getConversation(from);
    if (!conversation) {
      conversation = await storage.createConversation({
        phoneNumber: from,
        currentState: "greeting"
      });
    }
    await storage.createMessage({
      conversationId: conversation.id,
      content: messageText,
      isFromBot: false
    });
    let response = "";
    let newState = conversation.currentState;
    if (text2 === "hi" || text2 === "hello" || conversation.currentState === "greeting") {
      const services2 = await storage.getServices();
      const activeServices = services2.filter((s) => s.isActive);
      response = "\u{1F44B} Welcome to Spark Salon!\n\nHere are our services:\n";
      activeServices.forEach((service) => {
        response += `\u{1F487}\u200D\u2640\uFE0F ${service.name} \u2013 \u20B9${service.price}
`;
      });
      response += "\nReply with service name to book.";
      newState = "awaiting_service";
    } else if (conversation.currentState === "awaiting_service") {
      const services2 = await storage.getServices();
      const selectedService = services2.find(
        (s) => s.isActive && s.name.toLowerCase() === text2
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
        await storage.updateConversation(conversation.id, {
          selectedService: selectedService.id,
          currentState: "awaiting_date"
        });
        newState = "awaiting_date";
      } else {
        response = "Sorry, I didn't recognize that service. Please choose from:\n";
        const activeServices = services2.filter((s) => s.isActive);
        activeServices.forEach((service) => {
          response += `\u2022 ${service.name}
`;
        });
      }
    } else if (conversation.currentState === "awaiting_date") {
      const dateChoice = parseInt(text2);
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
        await storage.updateConversation(conversation.id, {
          selectedDate: dateStr,
          currentState: "awaiting_time"
        });
        newState = "awaiting_time";
      } else {
        response = "Please select a valid date option (1-7). Reply with the number for your preferred date.";
      }
    } else if (conversation.currentState === "awaiting_time") {
      const timeSlots = ["10:00 AM", "11:30 AM", "02:00 PM", "03:30 PM", "05:00 PM"];
      const timeChoice = parseInt(text2);
      if (timeChoice >= 1 && timeChoice <= 5) {
        const selectedTime = timeSlots[timeChoice - 1];
        const services2 = await storage.getServices();
        const selectedService = services2.find((s) => s.id === conversation.selectedService);
        if (selectedService) {
          const updatedConversation = await storage.updateConversation(conversation.id, {
            selectedTime,
            currentState: "awaiting_payment"
          });
          const latestConversation = await storage.getConversation(from);
          if (latestConversation && latestConversation.selectedDate) {
            const upiLink = generateUPILink(selectedService.price, selectedService.name);
            response = `Perfect! Your appointment is scheduled for ${selectedTime}.

`;
            response += `\u{1F4CB} Booking Summary:
`;
            response += `Service: ${selectedService.name}
`;
            response += `Date: ${new Date(latestConversation.selectedDate).toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
`;
            response += `Time: ${selectedTime}
`;
            response += `Amount: \u20B9${selectedService.price}

`;
            response += `\u{1F4B3} Please complete your payment:
${upiLink}

`;
            response += "Complete payment in GPay/PhonePe/Paytm and reply 'paid' to confirm your booking.";
            const appointmentDateTime = /* @__PURE__ */ new Date(`${latestConversation.selectedDate}T${timeChoice === 1 ? "10:00" : timeChoice === 2 ? "11:30" : timeChoice === 3 ? "14:00" : timeChoice === 4 ? "15:30" : "17:00"}:00`);
            await storage.createBooking({
              conversationId: conversation.id,
              serviceId: selectedService.id,
              phoneNumber: from,
              amount: selectedService.price,
              status: "pending",
              appointmentDate: appointmentDateTime,
              appointmentTime: selectedTime
            });
            newState = "awaiting_payment";
          }
        }
      } else {
        response = "Please select a valid time slot (1-5). Reply with the number for your preferred time.";
      }
    } else if (conversation.currentState === "awaiting_payment" && text2 === "paid") {
      const services2 = await storage.getServices();
      const selectedService = services2.find((s) => s.id === conversation.selectedService);
      response = "\u2705 Payment received! Your appointment is confirmed.\n\n";
      response += "\u{1F4CB} Confirmed Booking Details:\n";
      if (selectedService) {
        response += `Service: ${selectedService.name}
`;
      }
      if (conversation.selectedDate) {
        const appointmentDate = new Date(conversation.selectedDate);
        response += `Date: ${appointmentDate.toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
`;
      }
      if (conversation.selectedTime) {
        response += `Time: ${conversation.selectedTime}
`;
      }
      response += "\n\u{1F389} Thank you for choosing Spark Salon! We look forward to serving you.";
      const bookings2 = await storage.getBookings();
      const pendingBooking = bookings2.find(
        (b) => b.conversationId === conversation.id && b.status === "pending"
      );
      if (pendingBooking) {
        await storage.updateBooking(pendingBooking.id, {
          status: "confirmed",
          paymentMethod: "UPI"
        });
      }
      newState = "completed";
    } else {
      response = "I'm sorry, I didn't understand that. Type 'hi' to start over or choose a service from our menu.";
    }
    if (newState !== conversation.currentState) {
      await storage.updateConversation(conversation.id, {
        currentState: newState
      });
    }
    await sendWhatsAppMessage(from, response);
    await storage.createMessage({
      conversationId: conversation.id,
      content: response,
      isFromBot: true
    });
  } catch (error) {
    console.error("Error processing WhatsApp message:", error);
    await sendWhatsAppMessage(from, "Sorry, I'm experiencing technical difficulties. Please try again later.");
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
  app2.post("/webhook", async (req, res) => {
    try {
      const webhookData = whatsAppMessageSchema.parse(req.body);
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
  app2.get("/api/services", async (req, res) => {
    try {
      const services2 = await storage.getServices();
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
  app2.get("/api/stats", async (req, res) => {
    try {
      const todayBookings = await storage.getTodayBookings();
      const todayRevenue = await storage.getTodayRevenue();
      const allBookings = await storage.getBookings();
      const todayMessages = todayBookings.length * 4;
      const stats = {
        todayMessages,
        todayBookings: todayBookings.length,
        todayRevenue,
        responseRate: 98,
        // Static for now
        totalBookings: allBookings.length
      };
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
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      ),
      await import("@replit/vite-plugin-dev-banner").then(
        (m) => m.devBanner()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}

// server/static.ts
import express2 from "express";
import fs2 from "fs";
import path3 from "path";
function serveStatic(app2) {
  let distPath = path3.resolve(import.meta.dirname, "public");
  if (!fs2.existsSync(distPath)) {
    distPath = path3.resolve(import.meta.dirname, "..", "dist", "public");
  }
  if (!fs2.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express2.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path3.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express3();
app.use(express3.json());
app.use(express3.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path4 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path4.startsWith("/api")) {
      let logLine = `${req.method} ${path4} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0"
    // Use 0.0.0.0 for Vercel deployment
  }, () => {
    log(`serving on port ${port}`);
  });
})();
