/**
 * Dynamic Message Processor Service
 * Integrates the conversation engine with WhatsApp message processing
 */

import { ConversationEngineService } from './conversation-engine.service';
import { MessageProcessorService } from './message-processor.service';
import type { ServiceResponse } from '@shared/types/tenant';

export interface DynamicProcessingResult {
  success: boolean;
  response?: string;
  shouldContinue?: boolean;
  error?: string;
}

export class DynamicMessageProcessorService {
  private conversationEngine: ConversationEngineService;
  private fallbackProcessor: MessageProcessorService;

  constructor(connectionString: string) {
    this.conversationEngine = new ConversationEngineService(connectionString);
    this.fallbackProcessor = new MessageProcessorService(connectionString);
  }

  /**
   * Process WhatsApp message using dynamic bot flows or fallback to static processing
   */
  async processMessage(
    tenantId: string,
    conversationId: string,
    phoneNumber: string,
    messageContent: string
  ): Promise<ServiceResponse<DynamicProcessingResult>> {
    try {
      // First, try to get an active bot flow for this tenant
      const activeFlowId = await this.getActiveBotFlow(tenantId);
      
      if (activeFlowId) {
        // Use dynamic conversation engine
        return await this.processDynamicMessage(
          tenantId,
          conversationId,
          phoneNumber,
          messageContent,
          activeFlowId
        );
      } else {
        // Fallback to static message processing
        return await this.processStaticMessage(
          tenantId,
          conversationId,
          phoneNumber,
          messageContent
        );
      }
    } catch (error) {
      console.error('Error in dynamic message processing:', error);
      return {
        success: false,
        error: {
          code: 'DYNAMIC_PROCESSING_FAILED',
          message: 'Failed to process message dynamically',
          tenantId,
        },
      };
    }
  }

  /**
   * Process message using dynamic bot flows
   */
  private async processDynamicMessage(
    tenantId: string,
    conversationId: string,
    phoneNumber: string,
    messageContent: string,
    flowId: string
  ): Promise<ServiceResponse<DynamicProcessingResult>> {
    try {
      // Check if conversation flow is already started
      let contextResult = await this.conversationEngine.getConversationContext(tenantId, conversationId);
      
      if (!contextResult.success) {
        // Start new conversation flow
        const startResult = await this.conversationEngine.startConversationFlow(
          tenantId,
          conversationId,
          phoneNumber,
          flowId
        );
        
        if (!startResult.success) {
          return {
            success: false,
            error: startResult.error!,
          };
        }
        
        contextResult = { success: true, data: startResult.data! };
      }

      // Process user input
      const executionResult = await this.conversationEngine.processUserInput(
        tenantId,
        conversationId,
        messageContent
      );

      if (!executionResult.success) {
        return {
          success: false,
          error: executionResult.error!,
        };
      }

      const result = executionResult.data!;

      return {
        success: true,
        data: {
          success: true,
          response: result.response?.content,
          shouldContinue: !result.shouldEndConversation,
        },
      };
    } catch (error) {
      console.error('Error processing dynamic message:', error);
      return {
        success: false,
        error: {
          code: 'DYNAMIC_MESSAGE_FAILED',
          message: 'Failed to process message with dynamic flow',
          tenantId,
        },
      };
    }
  }

  /**
   * Process message using static/fallback processing
   */
  private async processStaticMessage(
    tenantId: string,
    conversationId: string,
    phoneNumber: string,
    messageContent: string
  ): Promise<ServiceResponse<DynamicProcessingResult>> {
    try {
      // Use the existing static message processor
      // This would integrate with the existing message processing logic
      
      // For now, return a simple response indicating static processing
      return {
        success: true,
        data: {
          success: true,
          response: 'Message processed with static flow. Dynamic bot flows not configured.',
          shouldContinue: true,
        },
      };
    } catch (error) {
      console.error('Error processing static message:', error);
      return {
        success: false,
        error: {
          code: 'STATIC_MESSAGE_FAILED',
          message: 'Failed to process message with static flow',
          tenantId,
        },
      };
    }
  }

  /**
   * Get active bot flow for tenant
   */
  private async getActiveBotFlow(tenantId: string): Promise<string | null> {
    try {
      // This would query the database for active bot flows
      // For now, return null to use static processing
      
      // In a real implementation, this would:
      // 1. Query bot_flows table for active flows for this tenant
      // 2. Return the flow ID of the primary/default active flow
      // 3. Handle multiple active flows (priority, routing rules, etc.)
      
      return null;
    } catch (error) {
      console.error('Error getting active bot flow:', error);
      return null;
    }
  }

  /**
   * Enable dynamic processing for a tenant by activating a bot flow
   */
  async enableDynamicProcessing(
    tenantId: string,
    flowId: string
  ): Promise<ServiceResponse<boolean>> {
    try {
      // This would activate the specified bot flow for the tenant
      // Implementation would update the bot_flows table to set isActive = true
      
      console.log(`Enabling dynamic processing for tenant ${tenantId} with flow ${flowId}`);
      
      return {
        success: true,
        data: true,
      };
    } catch (error) {
      console.error('Error enabling dynamic processing:', error);
      return {
        success: false,
        error: {
          code: 'ENABLE_DYNAMIC_FAILED',
          message: 'Failed to enable dynamic processing',
          tenantId,
        },
      };
    }
  }

  /**
   * Disable dynamic processing for a tenant
   */
  async disableDynamicProcessing(tenantId: string): Promise<ServiceResponse<boolean>> {
    try {
      // This would deactivate all bot flows for the tenant
      // Implementation would update the bot_flows table to set isActive = false
      
      console.log(`Disabling dynamic processing for tenant ${tenantId}`);
      
      return {
        success: true,
        data: true,
      };
    } catch (error) {
      console.error('Error disabling dynamic processing:', error);
      return {
        success: false,
        error: {
          code: 'DISABLE_DYNAMIC_FAILED',
          message: 'Failed to disable dynamic processing',
          tenantId,
        },
      };
    }
  }

  /**
   * Get conversation execution status
   */
  async getConversationStatus(
    tenantId: string,
    conversationId: string
  ): Promise<ServiceResponse<{
    isActive: boolean;
    currentNode?: string;
    variables?: Record<string, any>;
    flowId?: string;
  }>> {
    try {
      const contextResult = await this.conversationEngine.getConversationContext(tenantId, conversationId);
      
      if (!contextResult.success) {
        return {
          success: true,
          data: {
            isActive: false,
          },
        };
      }

      const context = contextResult.data!;

      return {
        success: true,
        data: {
          isActive: true,
          currentNode: context.currentNodeId,
          variables: context.variables,
          flowId: context.flowId,
        },
      };
    } catch (error) {
      console.error('Error getting conversation status:', error);
      return {
        success: false,
        error: {
          code: 'STATUS_RETRIEVAL_FAILED',
          message: 'Failed to get conversation status',
          tenantId,
        },
      };
    }
  }

  /**
   * Reset conversation flow
   */
  async resetConversation(
    tenantId: string,
    conversationId: string
  ): Promise<ServiceResponse<boolean>> {
    try {
      // This would reset the conversation execution state
      // Implementation would delete or reset the bot_flow_executions record
      
      console.log(`Resetting conversation ${conversationId} for tenant ${tenantId}`);
      
      return {
        success: true,
        data: true,
      };
    } catch (error) {
      console.error('Error resetting conversation:', error);
      return {
        success: false,
        error: {
          code: 'RESET_CONVERSATION_FAILED',
          message: 'Failed to reset conversation',
          tenantId,
        },
      };
    }
  }

  /**
   * Close services
   */
  async close(): Promise<void> {
    try {
      await this.conversationEngine.close();
      await this.fallbackProcessor.close();
    } catch (error) {
      console.error('Error closing dynamic message processor:', error);
    }
  }
}