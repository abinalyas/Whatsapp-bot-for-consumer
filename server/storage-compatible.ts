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
  // Production DB uses created_at, not timestamp
  createdAt: timestamp("created_at").notNull().defaultNow(),
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
      // Check if database is available before trying to use it
      if (!database) {
        console.log("Database not configured, skipping default service initialization");
        return;
      }
      
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
          price: 120, // USD equivalent of ₹1000
          durationMinutes: 120,
          isActive: true,
          icon: "fas fa-palette",
          category: "Hair Services"
        }
      ];

      // Create default services
      for (const serviceData of defaultServices) {
        await this.createService(serviceData);
      }
      
      console.log("✅ Default services initialized");
    } catch (error) {
      console.error("❌ Error initializing default services:", error);
    }
  }

  async getServices(): Promise<Service[]> {
    try {
      // Check if database is available
      if (!database) {
        return [];
      }
      return await database.select().from(compatibleServices);
    } catch (error) {
      console.error("Error fetching services:", error);
      return [];
    }
  }

  async getService(id: string): Promise<Service | undefined> {
    try {
      // Check if database is available
      if (!database) {
        return undefined;
      }
      const [service] = await database.select().from(compatibleServices).where(eq(compatibleServices.id, id));
      return service || undefined;
    } catch (error) {
      console.error("Error fetching service:", error);
      return undefined;
    }
  }

  async createService(insertService: InsertService): Promise<Service> {
    try {
      // Check if database is available
      if (!database) {
        throw new Error("Database not available");
      }
      
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
      } as Service;
    } catch (error) {
      console.error("Error creating service:", error);
      // Return a mock service object in case of database errors
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
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Service;
    }
  }

  async updateService(id: string, updateData: Partial<InsertService>): Promise<Service | undefined> {
    try {
      // Check if database is available
      if (!database) {
        console.warn("Database not available, cannot update service");
        return undefined;
      }
      
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
      // Check if database is available
      if (!database) {
        console.warn("Database not available, cannot delete service");
        return false;
      }
      
      const result = await database
        .delete(compatibleServices)
        .where(eq(compatibleServices.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error deleting service:", error);
      return false;
    }
  }

  async getConversations(): Promise<Conversation[]> {
    try {
      // Check if database is available
      if (!database) {
        return [];
      }
      
      return await database.select().from(compatibleConversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      return [];
    }
  }

  async getConversation(phoneNumber: string): Promise<Conversation | undefined> {
    try {
      // Check if database is available
      if (!database) {
        return undefined;
      }
      
      const [conversation] = await database
        .select()
        .from(compatibleConversations)
        .where(eq(compatibleConversations.phoneNumber, phoneNumber));
      return conversation;
    } catch (error) {
      console.error("Error fetching conversation:", error);
      return undefined;
    }
  }

  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    try {
      // Check if database is available
      if (!database) {
        throw new Error("Database not available");
      }
      
      // Only use columns that definitely exist in production
      const safeConversationData = {
        phoneNumber: conversation.phoneNumber,
        customerName: conversation.customerName,
        currentState: conversation.currentState,
        selectedService: conversation.selectedService,
        selectedDate: conversation.selectedDate,
        selectedTime: conversation.selectedTime,
        contextData: conversation.contextData,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      };

      const [newConversation] = await database
        .insert(compatibleConversations)
        .values(safeConversationData)
        .returning();
      return newConversation;
    } catch (error) {
      console.error("Error creating conversation:", error);
      // Create a mock conversation object
      return {
        id: randomUUID(),
        phoneNumber: conversation.phoneNumber,
        customerName: conversation.customerName || null,
        currentState: conversation.currentState,
        selectedService: conversation.selectedService || null,
        selectedDate: conversation.selectedDate || null,
        selectedTime: conversation.selectedTime || null,
        contextData: conversation.contextData || {},
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Conversation;
    }
  }

  async updateConversation(id: string, conversation: Partial<InsertConversation>): Promise<Conversation | undefined> {
    try {
      // Check if database is available
      if (!database) {
        console.warn("Database not available, cannot update conversation with ID:", id);
        // Attempt to get existing conversation as fallback
        try {
          return this.getConversation(conversation.phoneNumber || '');
        } catch {
          return undefined;
        }
      }
      
      const [updatedConversation] = await database
        .update(compatibleConversations)
        .set({ ...conversation, updatedAt: new Date() })
        .where(eq(compatibleConversations.id, id))
        .returning();
      
      if (!updatedConversation) {
        console.warn(`No conversation found with ID: ${id} for update`);
        return undefined;
      }
      
      return updatedConversation;
    } catch (error) {
      console.error("Error updating conversation:", error);
      return undefined;
    }
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    try {
      // Check if database is available
      if (!database) {
        return [];
      }
      
      return await database
        .select()
        .from(compatibleMessages)
        .where(eq(compatibleMessages.conversationId, conversationId))
        .orderBy(compatibleMessages.createdAt);
    } catch (error) {
      console.error("Error fetching messages:", error);
      return [];
    }
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    try {
      // Check if database is available
      if (!database) {
        throw new Error("Database not available");
      }
      
      // Only insert columns that exist in the compatible schema
      const safeMessageData = {
        conversationId: message.conversationId,
        content: message.content,
        messageType: message.messageType || 'text',
        isFromBot: message.isFromBot,
        metadata: message.metadata || {},
        // timestamp will default to now if not provided
      };

      const [newMessage] = await database
        .insert(compatibleMessages)
        .values(safeMessageData)
        .returning();
      return newMessage;
    } catch (error) {
      console.error("Error creating message:", error);
      // Create a mock message object
      return {
        id: randomUUID(),
        conversationId: message.conversationId,
        content: message.content,
        isFromBot: message.isFromBot,
        messageType: message.messageType || 'text',
        metadata: message.metadata || {},
        createdAt: new Date(),
      } as Message;
    }
  }

  async getBookings(): Promise<Booking[]> {
    try {
      // Check if database is available
      if (!database) {
        return [];
      }
      
      return await database.select().from(compatibleBookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      return [];
    }
  }

  async createBooking(booking: InsertBooking): Promise<Booking> {
    try {
      // Check if database is available
      if (!database) {
        throw new Error("Database not available");
      }
      
      const [newBooking] = await database
        .insert(compatibleBookings)
        .values(booking)
        .returning();
      return newBooking;
    } catch (error) {
      console.error("Error creating booking:", error);
      // Create a mock booking object
      return {
        id: randomUUID(),
        conversationId: booking.conversationId,
        serviceId: booking.serviceId,
        phoneNumber: booking.phoneNumber,
        amount: booking.amount,
        status: booking.status || 'pending',
        customerName: booking.customerName || null,
        appointmentDate: booking.appointmentDate,
        appointmentTime: booking.appointmentTime,
        paymentReference: booking.paymentReference || null,
        metadata: booking.metadata || {},
        notes: booking.notes || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Booking;
    }
  }

  async updateBooking(id: string, booking: Partial<InsertBooking>): Promise<Booking | undefined> {
    try {
      // Check if database is available
      if (!database) {
        console.warn("Database not available, cannot update booking");
        return undefined;
      }
      
      const [updatedBooking] = await database
        .update(compatibleBookings)
        .set({ ...booking, updatedAt: new Date() })
        .where(eq(compatibleBookings.id, id))
        .returning();
      return updatedBooking;
    } catch (error) {
      console.error("Error updating booking:", error);
      return undefined;
    }
  }

  async getTodayBookings(): Promise<Booking[]> {
    try {
      // Check if database is available
      if (!database) {
        return [];
      }
      
      // Compute IST day window and convert to UTC for comparison
      const offsetMs = 5.5 * 60 * 60 * 1000; // IST UTC+5:30
      const nowUtcMs = Date.now();
      const istNow = new Date(nowUtcMs + offsetMs);
      const istStart = new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate(), 0, 0, 0, 0));
      const istEnd = new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate() + 1, 0, 0, 0, 0));
      const utcStart = new Date(istStart.getTime() - offsetMs);
      const utcEnd = new Date(istEnd.getTime() - offsetMs);
      
      return await database
        .select()
        .from(compatibleBookings)
        .where(
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

  async getTodayRevenue(): Promise<number> {
    try {
      // Check if database is available
      if (!database) {
        return 0;
      }
      
      // Compute IST day window and convert to UTC for comparison
      const offsetMs = 5.5 * 60 * 60 * 1000; // IST UTC+5:30
      const nowUtcMs = Date.now();
      const istNow = new Date(nowUtcMs + offsetMs);
      const istStart = new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate(), 0, 0, 0, 0));
      const istEnd = new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate() + 1, 0, 0, 0, 0));
      const utcStart = new Date(istStart.getTime() - offsetMs);
      const utcEnd = new Date(istEnd.getTime() - offsetMs);
      
      const result = await database
        .select({ total: sql<number>`SUM(${compatibleBookings.amount})` })
        .from(compatibleBookings)
        .where(
          and(
            eq(compatibleBookings.status, 'confirmed'),
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
}