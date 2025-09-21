/**
 * Conversation Repository with Tenant Isolation
 * Handles CRUD operations for conversations with automatic tenant filtering
 */

import { eq, and, like, inArray, desc, asc, or, sql } from 'drizzle-orm';
import { BaseRepository } from './base.repository';
import * as schema from '@shared/schema';
import type {
  ServiceResponse,
  PaginationParams,
  PaginatedResponse,
} from '@shared/types/tenant';
import type { Conversation, InsertConversation, Message, InsertMessage } from '@shared/schema';

export class ConversationRepository extends BaseRepository<
  typeof schema.conversations,
  Conversation,
  InsertConversation
> {
  constructor(connectionString: string) {
    super(connectionString, schema.conversations);
  }

  /**
   * Find conversation by phone number
   */
  async findByPhoneNumber(
    tenantId: string,
    phoneNumber: string
  ): Promise<ServiceResponse<Conversation>> {
    return this.executeWithTenantContext(tenantId, async (db) => {
      const [result] = await db
        .select()
        .from(schema.conversations)
        .where(
          and(
            eq(schema.conversations.tenantId, tenantId),
            eq(schema.conversations.phoneNumber, phoneNumber)
          )
        )
        .limit(1);

      if (!result) {
        return {
          success: false,
          error: {
            code: 'CONVERSATION_NOT_FOUND',
            message: 'Conversation not found for phone number',
            tenantId,
            details: { phoneNumber },
          },
        };
      }

      return result as Conversation;
    });
  }

  /**
   * Find conversations by state
   */
  async findByState(
    tenantId: string,
    state: string,
    pagination: PaginationParams
  ): Promise<ServiceResponse<PaginatedResponse<Conversation>>> {
    return this.list(
      tenantId,
      pagination,
      undefined,
      eq(schema.conversations.currentState, state)
    );
  }

  /**
   * Update conversation state
   */
  async updateState(
    tenantId: string,
    conversationId: string,
    newState: string,
    contextData?: any
  ): Promise<ServiceResponse<Conversation>> {
    const updateData: any = { currentState: newState };
    if (contextData) {
      updateData.contextData = contextData;
    }

    return this.update(tenantId, conversationId, updateData);
  }

  /**
   * Get conversation with messages
   */
  async getWithMessages(
    tenantId: string,
    conversationId: string,
    messageLimit: number = 50
  ): Promise<ServiceResponse<Conversation & { messages: Message[] }>> {
    return this.executeWithTenantContext(tenantId, async (db) => {
      // Get conversation
      const [conversation] = await db
        .select()
        .from(schema.conversations)
        .where(
          and(
            eq(schema.conversations.tenantId, tenantId),
            eq(schema.conversations.id, conversationId)
          )
        )
        .limit(1);

      if (!conversation) {
        return {
          success: false,
          error: {
            code: 'CONVERSATION_NOT_FOUND',
            message: 'Conversation not found',
            tenantId,
            details: { conversationId },
          },
        };
      }

      // Get messages
      const messages = await db
        .select()
        .from(schema.messages)
        .where(
          and(
            eq(schema.messages.tenantId, tenantId),
            eq(schema.messages.conversationId, conversationId)
          )
        )
        .orderBy(desc(schema.messages.timestamp))
        .limit(messageLimit);

      return {
        ...conversation,
        messages: messages.reverse() as Message[], // Reverse to show oldest first
      } as Conversation & { messages: Message[] };
    });
  }

  /**
   * Get active conversations (not completed or cancelled)
   */
  async getActiveConversations(
    tenantId: string,
    pagination: PaginationParams
  ): Promise<ServiceResponse<PaginatedResponse<Conversation>>> {
    return this.executeWithTenantContext(tenantId, async (db) => {
      const activeStates = ['greeting', 'awaiting_service', 'awaiting_date', 'awaiting_time', 'awaiting_payment'];
      
      const whereConditions = [
        eq(schema.conversations.tenantId, tenantId),
        inArray(schema.conversations.currentState, activeStates),
      ];

      const whereClause = and(...whereConditions);

      // Get total count
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.conversations)
        .where(whereClause);

      // Get paginated data
      const offset = (pagination.page - 1) * pagination.limit;
      const results = await db
        .select()
        .from(schema.conversations)
        .where(whereClause)
        .orderBy(desc(schema.conversations.updatedAt))
        .limit(pagination.limit)
        .offset(offset);

      const totalPages = Math.ceil(count / pagination.limit);

      return {
        data: results as Conversation[],
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
   * Search conversations by customer name or phone
   */
  async searchConversations(
    tenantId: string,
    query: string,
    pagination: PaginationParams
  ): Promise<ServiceResponse<PaginatedResponse<Conversation>>> {
    return this.executeWithTenantContext(tenantId, async (db) => {
      const whereConditions = [eq(schema.conversations.tenantId, tenantId)];

      if (query) {
        whereConditions.push(
          or(
            like(schema.conversations.customerName, `%${query}%`),
            like(schema.conversations.phoneNumber, `%${query}%`)
          )
        );
      }

      const whereClause = and(...whereConditions);

      // Get total count
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.conversations)
        .where(whereClause);

      // Get paginated data
      const offset = (pagination.page - 1) * pagination.limit;
      const results = await db
        .select()
        .from(schema.conversations)
        .where(whereClause)
        .orderBy(desc(schema.conversations.updatedAt))
        .limit(pagination.limit)
        .offset(offset);

      const totalPages = Math.ceil(count / pagination.limit);

      return {
        data: results as Conversation[],
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
   * Get conversation statistics
   */
  async getStatistics(tenantId: string): Promise<ServiceResponse<{
    total: number;
    active: number;
    completed: number;
    byState: Record<string, number>;
  }>> {
    return this.executeWithTenantContext(tenantId, async (db) => {
      // Get total count
      const [{ total }] = await db
        .select({ total: sql<number>`count(*)` })
        .from(schema.conversations)
        .where(eq(schema.conversations.tenantId, tenantId));

      // Get active count
      const activeStates = ['greeting', 'awaiting_service', 'awaiting_date', 'awaiting_time', 'awaiting_payment'];
      const [{ active }] = await db
        .select({ active: sql<number>`count(*)` })
        .from(schema.conversations)
        .where(
          and(
            eq(schema.conversations.tenantId, tenantId),
            inArray(schema.conversations.currentState, activeStates)
          )
        );

      // Get completed count
      const [{ completed }] = await db
        .select({ completed: sql<number>`count(*)` })
        .from(schema.conversations)
        .where(
          and(
            eq(schema.conversations.tenantId, tenantId),
            eq(schema.conversations.currentState, 'completed')
          )
        );

      // Get count by state
      const stateResults = await db
        .select({
          state: schema.conversations.currentState,
          count: sql<number>`count(*)`,
        })
        .from(schema.conversations)
        .where(eq(schema.conversations.tenantId, tenantId))
        .groupBy(schema.conversations.currentState);

      const byState: Record<string, number> = {};
      stateResults.forEach(({ state, count }) => {
        byState[state] = count;
      });

      return {
        total,
        active,
        completed,
        byState,
      };
    });
  }
}