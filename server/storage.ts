import { type Service, type InsertService, type Conversation, type InsertConversation, type Message, type InsertMessage, type Booking, type InsertBooking, services, conversations, messages, bookings } from "@shared/schema";
import { randomUUID } from "crypto";
import { db as database } from "./db";
import { eq, and, gte, lt } from "drizzle-orm";

export interface IStorage {
  // Services
  getServices(): Promise<Service[]>;
  getService(id: string): Promise<Service | undefined>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: string, service: Partial<InsertService>): Promise<Service | undefined>;
  
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

// In-memory storage implementation for development
class InMemoryStorage implements IStorage {
  private services: (Service & { id: string })[] = [];
  private conversations: (Conversation & { id: string })[] = [];
  private messages: (Message & { id: string })[] = [];
  private bookings: (Booking & { id: string })[] = [];

  constructor() {
    this.initializeDefaultServices();
  }

  private async initializeDefaultServices() {
    // Check if services already exist
    if (this.services.length > 0) return;

    const defaultServices: (InsertService & { id: string })[] = [
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

  async getServices(): Promise<Service[]> {
    return this.services;
  }

  async getService(id: string): Promise<Service | undefined> {
    return this.services.find(service => service.id === id);
  }

  async createService(service: InsertService): Promise<Service> {
    const newService = {
      ...service,
      id: randomUUID()
    } as Service & { id: string };
    
    this.services.push(newService);
    return newService;
  }

  async updateService(id: string, updateData: Partial<InsertService>): Promise<Service | undefined> {
    const index = this.services.findIndex(service => service.id === id);
    if (index === -1) return undefined;
    
    this.services[index] = { ...this.services[index], ...updateData };
    return this.services[index];
  }

  async getConversation(phoneNumber: string): Promise<Conversation | undefined> {
    return this.conversations.find(conversation => conversation.phoneNumber === phoneNumber);
  }

  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const newConversation = {
      ...conversation,
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date()
    } as Conversation & { id: string };
    
    this.conversations.push(newConversation);
    return newConversation;
  }

  async updateConversation(id: string, updateData: Partial<InsertConversation>): Promise<Conversation | undefined> {
    const index = this.conversations.findIndex(conversation => conversation.id === id);
    if (index === -1) return undefined;
    
    this.conversations[index] = { 
      ...this.conversations[index], 
      ...updateData, 
      updatedAt: new Date() 
    };
    return this.conversations[index];
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    return this.messages
      .filter(message => message.conversationId === conversationId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const newMessage = {
      ...message,
      id: randomUUID(),
      timestamp: new Date()
    } as Message & { id: string };
    
    this.messages.push(newMessage);
    return newMessage;
  }

  async getBookings(): Promise<Booking[]> {
    return this.bookings.sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async createBooking(booking: InsertBooking): Promise<Booking> {
    const newBooking = {
      ...booking,
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date()
    } as Booking & { id: string };
    
    this.bookings.push(newBooking);
    return newBooking;
  }

  async updateBooking(id: string, updateData: Partial<InsertBooking>): Promise<Booking | undefined> {
    const index = this.bookings.findIndex(booking => booking.id === id);
    if (index === -1) return undefined;
    
    this.bookings[index] = { 
      ...this.bookings[index], 
      ...updateData, 
      updatedAt: new Date() 
    };
    return this.bookings[index];
  }

  async getTodayBookings(): Promise<Booking[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return this.bookings.filter(booking => 
      booking.createdAt >= today && booking.createdAt < tomorrow
    );
  }

  async getTodayRevenue(): Promise<number> {
    const todayBookings = await this.getTodayBookings();
    return todayBookings
      .filter(booking => booking.status === "confirmed")
      .reduce((total, booking) => total + booking.amount, 0);
  }
}

export class DatabaseStorageImpl implements IStorage {
  constructor() {
    // Initialize default services on startup
    this.initializeDefaultServices();
  }

  private async initializeDefaultServices() {
    // Check if services already exist
    const existingServices = await this.getServices();
    if (existingServices.length > 0) return;

    const defaultServices: InsertService[] = [
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

    // Insert default services
    for (const service of defaultServices) {
      await this.createService(service);
    }
  }

  async getServices(): Promise<Service[]> {
    return await database.select().from(services);
  }

  async getService(id: string): Promise<Service | undefined> {
    const [service] = await database.select().from(services).where(eq(services.id, id));
    return service || undefined;
  }

  async createService(insertService: InsertService): Promise<Service> {
    const [service] = await database
      .insert(services)
      .values(insertService)
      .returning();
    return service;
  }

  async updateService(id: string, updateData: Partial<InsertService>): Promise<Service | undefined> {
    const [service] = await database
      .update(services)
      .set(updateData)
      .where(eq(services.id, id))
      .returning();
    return service || undefined;
  }

  async getConversation(phoneNumber: string): Promise<Conversation | undefined> {
    const [conversation] = await database
      .select()
      .from(conversations)
      .where(eq(conversations.phoneNumber, phoneNumber));
    return conversation || undefined;
  }

  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const [conversation] = await database
      .insert(conversations)
      .values(insertConversation)
      .returning();
    return conversation;
  }

  async updateConversation(id: string, updateData: Partial<InsertConversation>): Promise<Conversation | undefined> {
    const [conversation] = await database
      .update(conversations)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(conversations.id, id))
      .returning();
    return conversation || undefined;
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    return await database
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.timestamp);
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await database
      .insert(messages)
      .values(insertMessage)
      .returning();
    return message;
  }

  async getBookings(): Promise<Booking[]> {
    return await database
      .select()
      .from(bookings)
      .orderBy(bookings.createdAt);
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const [booking] = await database
      .insert(bookings)
      .values(insertBooking)
      .returning();
    return booking;
  }

  async updateBooking(id: string, updateData: Partial<InsertBooking>): Promise<Booking | undefined> {
    const [booking] = await database
      .update(bookings)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(bookings.id, id))
      .returning();
    return booking || undefined;
  }

  async getTodayBookings(): Promise<Booking[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return await database
      .select()
      .from(bookings)
      .where(and(
        gte(bookings.createdAt, today),
        lt(bookings.createdAt, tomorrow)
      ));
  }

  async getTodayRevenue(): Promise<number> {
    const todayBookings = await this.getTodayBookings();
    return todayBookings
      .filter(booking => booking.status === "confirmed")
      .reduce((total, booking) => total + booking.amount, 0);
  }
}

// Export the appropriate storage implementation based on environment
export const storage: IStorage = process.env.NODE_ENV === 'production' && process.env.DATABASE_URL 
  ? new DatabaseStorageImpl() 
  : new InMemoryStorage();
