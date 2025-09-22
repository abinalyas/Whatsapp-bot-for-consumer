import { type Service, type InsertService, type Conversation, type InsertConversation, type Message, type InsertMessage, type Booking, type InsertBooking } from "@shared/schema";
import { randomUUID } from "crypto";
import { db as database } from "./db";
import { eq, and, gte, lt, sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";

// Compatible schema without tenant_id for current production database
const compatibleServices = pgTable("services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price").notNull(),
  // durationMinutes: integer("duration_minutes").default(60), // Commented out - doesn't exist in production
  isActive: boolean("is_active").notNull().default(true),
  icon: text("icon"),
  // category: varchar("category", { length: 100 }), // Commented out - might not exist
  // metadata: jsonb("metadata").default(sql`'{}'::jsonb`), // Commented out - might not exist
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

const compatibleConversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  phoneNumber: text("phone_number").notNull(),
  customerName: text("customer_name"),
  currentState: text("current_state").notNull().default("greeting"),
  selectedService: varchar("selected_service"),
  selectedDate: text("selected_date"),
  selectedTime: text("selected_time"),
  contextData: jsonb("context_data").default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

const compatibleMessages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull(),
  content: text("content").notNull(),
  messageType: varchar("message_type", { length: 50 }).notNull().default("text"),
  isFromBot: boolean("is_from_bot").notNull(),
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

const compatibleBookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull(),
  serviceId: varchar("service_id").notNull(),
  phoneNumber: text("phone_number").notNull(),
  customerName: text("customer_name"),
  // customerEmail: text("customer_email"), // Commented out - doesn't exist in production
  amount: integer("amount").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  paymentMethod: varchar("payment_method", { length: 50 }),
  paymentReference: text("payment_reference"),
  appointmentDate: timestamp("appointment_date"),
  appointmentTime: text("appointment_time"),
  notes: text("notes"),
  // metadata: jsonb("metadata").default(sql`'{}'::jsonb`), // Commented out - might not exist
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export interface IStorage {
  // Services
  getServices(): Promise<Service[]>;
  getService(id: string): Promise<Service | undefined>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: string, service: Partial<InsertService>): Promise<Service | undefined>;
  deleteService(id: string): Promise<boolean>;
  
  // Conversations
  getConversation(phoneNumber: string): Promise<Conversation | undefined>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversation(id: string, conversation: Partial<InsertConversation>): Promise<Conversation | undefined>;
  
  // Messages
  getMessages(conversationId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  
  // Bookings
  getBookings(): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBooking(id: string, booking: Partial<InsertBooking>): Promise<Booking | undefined>;
  getTodayBookings(): Promise<Booking[]>;
  getTodayRevenue(): Promise<number>;
}

export class CompatibleDatabaseStorage implements IStorage {
  constructor() {
    // Initialize default services on startup
    this.initializeDefaultServices();
  }

  private async initializeDefaultServices() {
    try {
      // Check if services already exist
      const existingServices = await this.getServices();
      if (existingServices.length > 0) return;

      const defaultServices = [
        {
          name: "Haircut & Style",
          description: "Professional haircut with styling",
          price: 45, // USD equivalent of ₹200
          durationMinutes: 60,
          isActive: true,
          icon: "fas fa-cut",
          category: "Hair Services"
        },
        {
          name: "Facial Treatment",
          description: "Deep cleansing facial treatment",
          price: 65, // USD equivalent of ₹500
          durationMinutes: 75,
          isActive: true,
          icon: "fas fa-sparkles",
          category: "Skin Care"
        },
        {
          name: "Hair Color",
          description: "Full hair coloring service",
          price: 120, // USD equivalent of ₹800
          durationMinutes: 180,
          isActive: true,
          icon: "fas fa-palette",
          category: "Hair Services"
        }
      ];

      // Insert default services
      for (const service of defaultServices) {
        await this.createService(service);
      }
      console.log("✅ Initialized default services");
    } catch (error) {
      console.error("❌ Error initializing default services:", error);
    }
  }

  async getServices(): Promise<Service[]> {
    try {
      return await database.select().from(compatibleServices);
    } catch (error) {
      console.error("Error fetching services:", error);
      return [];
    }
  }

  async getService(id: string): Promise<Service | undefined> {
    try {
      const [service] = await database.select().from(compatibleServices).where(eq(compatibleServices.id, id));
      return service || undefined;
    } catch (error) {
      console.error("Error fetching service:", error);
      return undefined;
    }
  }

  async createService(insertService: InsertService): Promise<Service> {
    try {
      // Only use columns that definitely exist in production
      const safeServiceData = {
        name: insertService.name,
        description: insertService.description,
        price: insertService.price,
        isActive: insertService.isActive ?? true,
        icon: insertService.icon,
      };

      const [service] = await database
        .insert(compatibleServices)
        .values(safeServiceData)
        .returning();
      
      // Return with default values for missing fields to match the expected interface
      return {
        ...service,
        durationMinutes: insertService.durationMinutes || 60,
        category: insertService.category || null,
        metadata: insertService.metadata || {},
      };
    } catch (error) {
      console.error("Error creating service:", error);
      throw error;
    }
  }

  async updateService(id: string, updateData: Partial<InsertService>): Promise<Service | undefined> {
    try {
      const [service] = await database
        .update(compatibleServices)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(compatibleServices.id, id))
        .returning();
      return service || undefined;
    } catch (error) {
      console.error("Error updating service:", error);
      return undefined;
    }
  }

  async deleteService(id: string): Promise<boolean> {
    try {
      const result = await database
        .delete(compatibleServices)
        .where(eq(compatibleServices.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error deleting service:", error);
      return false;
    }
  }

  async getConversation(phoneNumber: string): Promise<Conversation | undefined> {
    try {
      const [conversation] = await database
        .select()
        .from(compatibleConversations)
        .where(eq(compatibleConversations.phoneNumber, phoneNumber));
      return conversation || undefined;
    } catch (error) {
      console.error("Error fetching conversation:", error);
      return undefined;
    }
  }

  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    try {
      const [conversation] = await database
        .insert(compatibleConversations)
        .values(insertConversation)
        .returning();
      return conversation;
    } catch (error) {
      console.error("Error creating conversation:", error);
      throw error;
    }
  }

  async updateConversation(id: string, updateData: Partial<InsertConversation>): Promise<Conversation | undefined> {
    try {
      const [conversation] = await database
        .update(compatibleConversations)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(compatibleConversations.id, id))
        .returning();
      return conversation || undefined;
    } catch (error) {
      console.error("Error updating conversation:", error);
      return undefined;
    }
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    try {
      return await database
        .select()
        .from(compatibleMessages)
        .where(eq(compatibleMessages.conversationId, conversationId))
        .orderBy(compatibleMessages.timestamp);
    } catch (error) {
      console.error("Error fetching messages:", error);
      return [];
    }
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    try {
      const [message] = await database
        .insert(compatibleMessages)
        .values(insertMessage)
        .returning();
      return message;
    } catch (error) {
      console.error("Error creating message:", error);
      throw error;
    }
  }

  async getBookings(): Promise<Booking[]> {
    try {
      return await database
        .select()
        .from(compatibleBookings)
        .orderBy(sql`${compatibleBookings.createdAt} DESC`);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      return [];
    }
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    try {
      // Only use columns that definitely exist in production
      const safeBookingData = {
        conversationId: insertBooking.conversationId,
        serviceId: insertBooking.serviceId,
        phoneNumber: insertBooking.phoneNumber,
        customerName: insertBooking.customerName,
        amount: insertBooking.amount,
        status: insertBooking.status ?? "pending",
        appointmentDate: insertBooking.appointmentDate,
        appointmentTime: insertBooking.appointmentTime,
        paymentMethod: insertBooking.paymentMethod,
        paymentReference: insertBooking.paymentReference,
        notes: insertBooking.notes,
      };

      const [booking] = await database
        .insert(compatibleBookings)
        .values(safeBookingData)
        .returning();
      
      // Return with default values for missing fields to match the expected interface
      return {
        ...booking,
        customerEmail: insertBooking.customerEmail || null,
        customFields: insertBooking.customFields || {},
        transactionType: insertBooking.transactionType || "booking",
        metadata: insertBooking.metadata || {},
      };
    } catch (error) {
      console.error("Error creating booking:", error);
      throw error;
    }
  }

  async updateBooking(id: string, updateData: Partial<InsertBooking>): Promise<Booking | undefined> {
    try {
      const [booking] = await database
        .update(compatibleBookings)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(compatibleBookings.id, id))
        .returning();
      return booking || undefined;
    } catch (error) {
      console.error("Error updating booking:", error);
      return undefined;
    }
  }

  async getTodayBookings(): Promise<Booking[]> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      return await database
        .select()
        .from(compatibleBookings)
        .where(and(
          gte(compatibleBookings.createdAt, today),
          lt(compatibleBookings.createdAt, tomorrow)
        ));
    } catch (error) {
      console.error("Error fetching today's bookings:", error);
      return [];
    }
  }

  async getTodayRevenue(): Promise<number> {
    try {
      const todayBookings = await this.getTodayBookings();
      return todayBookings
        .filter(booking => booking.status === "confirmed")
        .reduce((total, booking) => total + booking.amount, 0);
    } catch (error) {
      console.error("Error calculating today's revenue:", error);
      return 0;
    }
  }
}