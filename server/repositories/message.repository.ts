/**
 * Message Repository with Tenant Isolation
 * Handles CRUD operations for messages with automatic tenant filtering
 */

import { eq, and, desc, asc, gte, lte, sql } from 'drizzle-orm';
import { BaseRepository } from './base.repository';
import * as schema from '@shared/schema';
import type {
  ServiceResponse,
  PaginationParams,
  PaginatedResponse,
} from '@shared/types/tenant';
import type { Message, InsertMessage } from '@shared/schema';

export interface MessageFilter {
  conversationId?: string;
  isFromBot?: boolean;
  messageType?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface MessageStatistics {
  total: number;
  fromBot: number;
  fromUser: number;
  byType: Record<string, number>;
  byConversation: Record<string, number>;
  recentActivity: Array<{
    date: string;
    count: number;
  }>;
}

export class MessageRepository extends BaseRepository<
  typeof schema.messages,
  Message,
  InsertMessage
> {
  constructor(connectionString: string) {
    super(connectionString, schema.messages);
  }

  /**
   * Get messages for a specific conversation
   */
  async getConversationMessages(
    tenantId: string,
    conversationId: string,
    pagination: PaginationParams,
    orderBy: 'asc' | 'desc' = 'asc'
  ): Promise<ServiceResponse<PaginatedResponse<Message>>> {
    return this.executeWithTenantContext(tenantId, async (db) => {
      const whereConditions = [
        eq(schema.messages.tenantId, tenantId),
        eq(schema.messages.conversationId, conversationId),
      ];

      const whereClause = and(...whereConditions);

      // Get total count
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.messages)
        .where(whereClause);

      // Get paginated data
      const offset = (pagination.page - 1) * pagination.limit;
      const orderByClause = orderBy === 'desc' ? desc(schema.messages.timestamp) : asc(schema.messages.timestamp);
      
      const results = await db
        .select()
        .from(schema.messages)
        .where(whereClause)
        .orderBy(orderByClause)
        .limit(pagination.limit)
        .offset(offset);

      const totalPages = Math.ceil(count / pagination.limit);

      return {
        data: results as Message[],
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total: count,
          totalPages,
          hasNext: pagination.page < totalPages,
          hasPrev: pagination.page > 1,
        },
      };
    });
  }

  /**
   * Get messages with filters
   */
  async getMessagesWithFilter(
    tenantId: string,
    filter: MessageFilter,
    pagination: PaginationParams
  ): Promise<ServiceResponse<PaginatedResponse<Message>>> {
    return this.executeWithTenantContext(tenantId, async (db) => {
      const whereConditions = [eq(schema.messages.tenantId, tenantId)];

      if (filter.conversationId) {
        whereConditions.push(eq(schema.messages.conversationId, filter.conversationId));
      }

      if (filter.isFromBot !== undefined) {
        whereConditions.push(eq(schema.messages.isFromBot, filter.isFromBot));
      }

      if (filter.messageType) {
        whereConditions.push(eq(schema.messages.messageType, filter.messageType));
      }

      if (filter.dateFrom) {
        whereConditions.push(gte(schema.messages.timestamp, filter.dateFrom));
      }

      if (filter.dateTo) {
        whereConditions.push(lte(schema.messages.timestamp, filter.dateTo));
      }

      const whereClause = and(...whereConditions);

      // Get total count
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.messages)
        .where(whereClause);

      // Get paginated data
      const offset = (pagination.page - 1) * pagination.limit;
      const results = await db
        .select()
        .from(schema.messages)
        .where(whereClause)
        .orderBy(desc(schema.messages.timestamp))
        .limit(pagination.limit)
        .offset(offset);

      const totalPages = Math.ceil(count / pagination.limit);

      return {
        data: results as Message[],
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total: count,
          totalPages,
          hasNext: pagination.page < totalPages,
          hasPrev: pagination.page > 1,
        },
      };
    });
  }

  /**
   * Get recent messages across all conversations
   */
  async getRecentMessages(
    tenantId: string,
    limit: number = 50
  ): Promise<ServiceResponse<Message[]>> {
    return this.executeWithTenantContext(tenantId, async (db) => {
      const results = await db
        .select()
        .from(schema.messages)
        .where(eq(schema.messages.tenantId, tenantId))
        .orderBy(desc(schema.messages.timestamp))
        .limit(limit);

      return results as Message[];
    });
  }

  /**
   * Get message statistics for tenant
   */
  async getStatistics(
    tenantId: string,
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<ServiceResponse<MessageStatistics>> {
    return this.executeWithTenantContext(tenantId, async (db) => {
      const whereConditions = [eq(schema.messages.tenantId, tenantId)];

      if (dateFrom) {
        whereConditions.push(gte(schema.messages.timestamp, dateFrom));
      }

      if (dateTo) {
        whereConditions.push(lte(schema.messages.timestamp, dateTo));
      }

      const whereClause = and(...whereConditions);

      // Get total count
      const [{ total }] = await db
        .select({ total: sql<number>`count(*)` })
        .from(schema.messages)
        .where(whereClause);

      // Get bot vs user message counts
      const [{ fromBot }] = await db
        .select({ fromBot: sql<number>`count(*)` })
        .from(schema.messages)
        .where(and(...whereConditions, eq(schema.messages.isFromBot, true)));

      const fromUser = total - fromBot;

      // Get count by message type
      const typeResults = await db
        .select({
          messageType: schema.messages.messageType,
          count: sql<number>`count(*)`,
        })
        .from(schema.messages)
        .where(whereClause)
        .groupBy(schema.messages.messageType);

      const byType: Record<string, number> = {};
      typeResults.forEach(({ messageType, count }) => {
        byType[messageType] = count;
      });

      // Get count by conversation
      const conversationResults = await db
        .select({
          conversationId: schema.messages.conversationId,
          count: sql<number>`count(*)`,
        })
        .from(schema.messages)
        .where(whereClause)
        .groupBy(schema.messages.conversationId)
        .limit(10); // Top 10 conversations

      const byConversation: Record<string, number> = {};
      conversationResults.forEach(({ conversationId, count }) => {
        byConversation[conversationId] = count;
      });

      // Get recent activity (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const activityResults = await db
        .select({
          date: sql<string>`DATE(${schema.messages.timestamp})`,
          count: sql<number>`count(*)`,
        })
        .from(schema.messages)
        .where(
          and(
            eq(schema.messages.tenantId, tenantId),
            gte(schema.messages.timestamp, sevenDaysAgo)
          )
        )
        .groupBy(sql`DATE(${schema.messages.timestamp})`)
        .orderBy(sql`DATE(${schema.messages.timestamp})`);

      const recentActivity = activityResults.map(({ date, count }) => ({
        date,
        count,
      }));

      return {
        total,
        fromBot,
        fromUser,
        byType,
        byConversation,
        recentActivity,
      };
    });
  }

  /**
   * Search messages by content
   */
  async searchMessages(
    tenantId: string,
    query: string,
    pagination: PaginationParams,
    conversationId?: string
  ): Promise<ServiceResponse<PaginatedResponse<Message>>> {
    return this.executeWithTenantContext(tenantId, async (db) => {
      const whereConditions = [eq(schema.messages.tenantId, tenantId)];

      if (query) {
        whereConditions.push(sql`${schema.messages.content} ILIKE ${`%${query}%`}`);
      }

      if (conversationId) {
        whereConditions.push(eq(schema.messages.conversationId, conversationId));
      }

      const whereClause = and(...whereConditions);

      // Get total count
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.messages)
        .where(whereClause);

      // Get paginated data
      const offset = (pagination.page - 1) * pagination.limit;
      const results = await db
        .select()
        .from(schema.messages)
        .where(whereClause)
        .orderBy(desc(schema.messages.timestamp))
        .limit(pagination.limit)
        .offset(offset);

      const totalPages = Math.ceil(count / pagination.limit);

      return {
        data: results as Message[],
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total: count,
          totalPages,
          hasNext: pagination.page < totalPages,
          hasPrev: pagination.page > 1,
        },
      };
    });
  }

  /**
   * Get messages between two timestamps
   */
  async getMessagesBetween(
    tenantId: string,
    startTime: Date,
    endTime: Date,
    conversationId?: string
  ): Promise<ServiceResponse<Message[]>> {
    return this.executeWithTenantContext(tenantId, async (db) => {
      const whereConditions = [
        eq(schema.messages.tenantId, tenantId),
        gte(schema.messages.timestamp, startTime),
        lte(schema.messages.timestamp, endTime),
      ];

      if (conversationId) {
        whereConditions.push(eq(schema.messages.conversationId, conversationId));
      }

      const results = await db
        .select()
        .from(schema.messages)
        .where(and(...whereConditions))
        .orderBy(asc(schema.messages.timestamp));

      return results as Message[];
    });
  }

  /**
   * Delete messages older than specified date
   */
  async deleteOldMessages(
    tenantId: string,
    olderThan: Date
  ): Promise<ServiceResponse<{ deletedCount: number }>> {
    return this.executeWithTenantContext(tenantId, async (db) => {
      const result = await db
        .delete(schema.messages)
        .where(
          and(
            eq(schema.messages.tenantId, tenantId),
            lte(schema.messages.timestamp, olderThan)
          )
        );

      return {
        deletedCount: result.rowCount || 0,
      };
    });
  }

  /**
   * Get message count for conversation
   */
  async getConversationMessageCount(
    tenantId: string,
    conversationId: string
  ): Promise<ServiceResponse<number>> {
    return this.executeWithTenantContext(tenantId, async (db) => {
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.messages)
        .where(
          and(
            eq(schema.messages.tenantId, tenantId),
            eq(schema.messages.conversationId, conversationId)
          )
        );

      return count;
    });
  }

  /**
   * Get last message for conversation
   */
  async getLastMessage(
    tenantId: string,
    conversationId: string
  ): Promise<ServiceResponse<Message | null>> {
    return this.executeWithTenantContext(tenantId, async (db) => {
      const [result] = await db
        .select()
        .from(schema.messages)
        .where(
          and(
            eq(schema.messages.tenantId, tenantId),
            eq(schema.messages.conversationId, conversationId)
          )
        )
        .orderBy(desc(schema.messages.timestamp))
        .limit(1);

      return (result as Message) || null;
    });
  }

  /**
   * Bulk insert messages
   */
  async bulkInsert(
    tenantId: string,
    messages: InsertMessage[]
  ): Promise<ServiceResponse<Message[]>> {
    return this.executeWithTenantContext(tenantId, async (db) => {
      // Ensure all messages have the correct tenant ID
      const messagesWithTenant = messages.map(msg => ({
        ...msg,
        tenantId,
      }));

      const results = await db
        .insert(schema.messages)
        .values(messagesWithTenant)
        .returning();

      return results as Message[];
    });
  }
}