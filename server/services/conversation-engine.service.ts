/**
 * Dynamic Conversation Execution Engine
 * Executes bot flows created with the visual builder in real-time conversations
 */

import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { eq, and } from 'drizzle-orm';
import * as schema from '@shared/schema';
import { BotFlowBuilderService } from './bot-flow-builder.service';
import type { ServiceResponse } from '@shared/types/tenant';

// ===== TYPES =====

export interface ConversationContext {
  tenantId: string;
  conversationId: string;
  phoneNumber: string;
  currentNodeId: string;
  variables: Record<string, any>;
  sessionData: Record<string, any>;
  flowId: string;
  executionId: string;
}

export interface ExecutionResult {
  success: boolean;
  response?: BotResponse;
  nextNodeId?: string;
  updatedVariables?: Record<string, any>;
  updatedSessionData?: Record<string, any>;
  shouldEndConversation?: boolean;
  error?: string;
}

export interface BotResponse {
  content: string;
  messageType: 'text' | 'interactive' | 'template';
  metadata?: {
    buttons?: Array<{
      id: string;
      title: string;
    }>;
    list?: {
      header?: string;
      body: string;
      footer?: string;
      sections: Array<{
        title: string;
        rows: Array<{
          id: string;
          title: string;
          description?: string;
        }>;
      }>;
    };
  };
}

export interface NodeExecutionContext {
  node: any; // BotFlowNode from the builder
  userInput: string;
  variables: Record<string, any>;
  sessionData: Record<string, any>;
  tenantId: string;
  conversationId: string;
}

// ===== SERVICE IMPLEMENTATION =====

export class ConversationEngineService {
  private db: ReturnType<typeof drizzle>;
  private pool: Pool;
  private botFlowService: BotFlowBuilderService;

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString });
    this.db = drizzle({ client: this.pool, schema });
    this.botFlowService = new BotFlowBuilderService(connectionString);
  }

  // ===== MAIN EXECUTION METHODS =====

  /**
   * Start a new conversation flow execution
   */
  async startConversationFlow(
    tenantId: string,
    conversationId: string,
    phoneNumber: string,
    flowId: string
  ): Promise<ServiceResponse<ConversationContext>> {
    try {
      // Get the bot flow
      const flowResult = await this.botFlowService.getBotFlow(tenantId, flowId);
      if (!flowResult.success) {
        return {
          success: false,
          error: flowResult.error!,
        };
      }

      const flow = flowResult.data!;
      
      // Find the start node
      const startNode = flow.nodes.find(node => node.type === 'start');
      if (!startNode) {
        return {
          success: false,
          error: {
            code: 'NO_START_NODE',
            message: 'Bot flow has no start node',
            tenantId,
          },
        };
      }

      // Create execution record
      const [execution] = await this.db
        .insert(schema.botFlowExecutions)
        .values({
          tenantId,
          flowId,
          conversationId,
          currentNodeId: startNode.id,
          variables: flow.variables.reduce((acc, variable) => {
            acc[variable.name] = variable.defaultValue || null;
            return acc;
          }, {} as Record<string, any>),
          sessionData: {},
          executionHistory: [],
        })
        .returning();

      const context: ConversationContext = {
        tenantId,
        conversationId,
        phoneNumber,
        currentNodeId: startNode.id,
        variables: execution.variables as Record<string, any>,
        sessionData: execution.sessionData as Record<string, any>,
        flowId,
        executionId: execution.id,
      };

      return {
        success: true,
        data: context,
      };
    } catch (error) {
      console.error('Error starting conversation flow:', error);
      return {
        success: false,
        error: {
          code: 'FLOW_START_FAILED',
          message: 'Failed to start conversation flow',
          tenantId,
        },
      };
    }
  }

  /**
   * Process user input and execute the current node
   */
  async processUserInput(
    tenantId: string,
    conversationId: string,
    userInput: string
  ): Promise<ServiceResponse<ExecutionResult>> {
    try {
      // Get current execution context
      const contextResult = await this.getConversationContext(tenantId, conversationId);
      if (!contextResult.success) {
        return {
          success: false,
          error: contextResult.error!,
        };
      }

      const context = contextResult.data!;

      // Get the bot flow
      const flowResult = await this.botFlowService.getBotFlow(tenantId, context.flowId);
      if (!flowResult.success) {
        return {
          success: false,
          error: flowResult.error!,
        };
      }

      const flow = flowResult.data!;
      const currentNode = flow.nodes.find(node => node.id === context.currentNodeId);
      
      if (!currentNode) {
        return {
          success: false,
          error: {
            code: 'NODE_NOT_FOUND',
            message: 'Current node not found in flow',
            tenantId,
          },
        };
      }

      // Execute the current node
      const executionResult = await this.executeNode({
        node: currentNode,
        userInput,
        variables: context.variables,
        sessionData: context.sessionData,
        tenantId,
        conversationId,
      });

      if (!executionResult.success) {
        return {
          success: false,
          error: {
            code: 'NODE_EXECUTION_FAILED',
            message: executionResult.error || 'Node execution failed',
            tenantId,
          },
        };
      }

      // Update execution context
      await this.updateExecutionContext(
        context.executionId,
        executionResult.nextNodeId || context.currentNodeId,
        executionResult.updatedVariables || context.variables,
        executionResult.updatedSessionData || context.sessionData,
        {
          nodeId: currentNode.id,
          userInput,
          response: executionResult.response,
          timestamp: new Date(),
        }
      );

      return {
        success: true,
        data: executionResult,
      };
    } catch (error) {
      console.error('Error processing user input:', error);
      return {
        success: false,
        error: {
          code: 'INPUT_PROCESSING_FAILED',
          message: 'Failed to process user input',
          tenantId,
        },
      };
    }
  }

  // ===== NODE EXECUTION METHODS =====

  /**
   * Execute a specific node based on its type
   */
  private async executeNode(context: NodeExecutionContext): Promise<ExecutionResult> {
    const { node } = context;

    switch (node.type) {
      case 'start':
        return this.executeStartNode(context);
      case 'message':
        return this.executeMessageNode(context);
      case 'question':
        return this.executeQuestionNode(context);
      case 'condition':
        return this.executeConditionNode(context);
      case 'action':
        return this.executeActionNode(context);
      case 'integration':
        return this.executeIntegrationNode(context);
      case 'end':
        return this.executeEndNode(context);
      default:
        return {
          success: false,
          error: `Unknown node type: ${node.type}`,
        };
    }
  }

  /**
   * Execute start node
   */
  private async executeStartNode(context: NodeExecutionContext): Promise<ExecutionResult> {
    const { node } = context;
    
    // Start nodes typically just move to the next node
    const nextNodeId = this.getNextNodeId(node);
    
    return {
      success: true,
      nextNodeId,
      response: {
        content: 'Starting conversation...',
        messageType: 'text',
      },
    };
  }

  /**
   * Execute message node
   */
  private async executeMessageNode(context: NodeExecutionContext): Promise<ExecutionResult> {
    const { node, variables } = context;
    const config = node.configuration;

    // Replace variables in message text
    let messageText = config.messageText || 'Hello!';
    messageText = this.replaceVariables(messageText, variables);

    const response: BotResponse = {
      content: messageText,
      messageType: config.messageType || 'text',
    };

    // Add interactive elements if configured
    if (config.buttons) {
      response.metadata = {
        buttons: config.buttons.map((button: any) => ({
          id: button.id,
          title: this.replaceVariables(button.title, variables),
        })),
      };
      response.messageType = 'interactive';
    }

    const nextNodeId = this.getNextNodeId(node);

    return {
      success: true,
      response,
      nextNodeId,
    };
  }

  /**
   * Execute question node
   */
  private async executeQuestionNode(context: NodeExecutionContext): Promise<ExecutionResult> {
    const { node, userInput, variables, sessionData } = context;
    const config = node.configuration;

    // If this is the first time hitting this node, send the question
    if (!sessionData[`question_${node.id}_asked`]) {
      let questionText = config.questionText || 'Please provide your answer:';
      questionText = this.replaceVariables(questionText, variables);

      const response: BotResponse = {
        content: questionText,
        messageType: 'text',
      };

      // Add choices for choice input type
      if (config.inputType === 'choice' && config.choices) {
        response.metadata = {
          buttons: config.choices.slice(0, 3).map((choice: any) => ({
            id: choice.value,
            title: choice.label,
          })),
        };
        response.messageType = 'interactive';
      }

      return {
        success: true,
        response,
        updatedSessionData: {
          ...sessionData,
          [`question_${node.id}_asked`]: true,
        },
      };
    }

    // Validate the user input
    const validationResult = this.validateInput(userInput, config);
    if (!validationResult.isValid) {
      return {
        success: true,
        response: {
          content: validationResult.errorMessage || 'Invalid input. Please try again.',
          messageType: 'text',
        },
      };
    }

    // Store the answer in variables
    const updatedVariables = { ...variables };
    if (config.variableName) {
      updatedVariables[config.variableName] = validationResult.processedValue || userInput;
    }

    const nextNodeId = this.getNextNodeId(node);

    return {
      success: true,
      nextNodeId,
      updatedVariables,
      updatedSessionData: {
        ...sessionData,
        [`question_${node.id}_answered`]: true,
      },
    };
  }

  /**
   * Execute condition node
   */
  private async executeConditionNode(context: NodeExecutionContext): Promise<ExecutionResult> {
    const { node, variables } = context;
    const config = node.configuration;

    if (!config.conditions || config.conditions.length === 0) {
      return {
        success: false,
        error: 'Condition node has no conditions configured',
      };
    }

    // Evaluate conditions
    for (const condition of config.conditions) {
      if (this.evaluateCondition(condition, variables)) {
        // Find the connection for this condition
        const connection = node.connections.find((conn: any) => 
          conn.condition === condition.variable || conn.label === 'true'
        );
        
        if (connection) {
          return {
            success: true,
            nextNodeId: connection.targetNodeId,
          };
        }
      }
    }

    // If no conditions matched, use the default/false path
    const defaultConnection = node.connections.find((conn: any) => 
      conn.label === 'false' || conn.label === 'default'
    );

    return {
      success: true,
      nextNodeId: defaultConnection?.targetNodeId || this.getNextNodeId(node),
    };
  }

  /**
   * Execute action node
   */
  private async executeActionNode(context: NodeExecutionContext): Promise<ExecutionResult> {
    const { node, variables, tenantId, conversationId } = context;
    const config = node.configuration;

    try {
      switch (config.actionType) {
        case 'create_transaction':
          await this.createTransaction(tenantId, conversationId, variables, config.actionParameters);
          break;
        case 'update_transaction':
          await this.updateTransaction(tenantId, conversationId, variables, config.actionParameters);
          break;
        case 'send_notification':
          await this.sendNotification(tenantId, variables, config.actionParameters);
          break;
        case 'call_webhook':
          await this.callWebhook(variables, config.actionParameters);
          break;
        default:
          console.warn(`Unknown action type: ${config.actionType}`);
      }

      const nextNodeId = this.getNextNodeId(node);

      return {
        success: true,
        nextNodeId,
        response: {
          content: 'Action completed successfully.',
          messageType: 'text',
        },
      };
    } catch (error) {
      console.error('Error executing action node:', error);
      return {
        success: false,
        error: `Action execution failed: ${error}`,
      };
    }
  }

  /**
   * Execute integration node
   */
  private async executeIntegrationNode(context: NodeExecutionContext): Promise<ExecutionResult> {
    const { node, variables } = context;
    const config = node.configuration;

    // Placeholder for integration logic
    console.log('Integration node executed:', config.integrationType);

    const nextNodeId = this.getNextNodeId(node);

    return {
      success: true,
      nextNodeId,
      response: {
        content: 'Integration completed.',
        messageType: 'text',
      },
    };
  }

  /**
   * Execute end node
   */
  private async executeEndNode(context: NodeExecutionContext): Promise<ExecutionResult> {
    const { node, variables } = context;
    const config = node.configuration;

    let endMessage = config.endMessage || 'Thank you! This conversation has ended.';
    endMessage = this.replaceVariables(endMessage, variables);

    return {
      success: true,
      shouldEndConversation: true,
      response: {
        content: endMessage,
        messageType: 'text',
      },
    };
  }

  // ===== UTILITY METHODS =====

  /**
   * Get the next node ID from connections
   */
  private getNextNodeId(node: any): string | undefined {
    if (node.connections && node.connections.length > 0) {
      return node.connections[0].targetNodeId;
    }
    return undefined;
  }

  /**
   * Replace variables in text with actual values
   */
  private replaceVariables(text: string, variables: Record<string, any>): string {
    return text.replace(/\{\{(\w+)\}\}/g, (match, variableName) => {
      return variables[variableName] || match;
    });
  }

  /**
   * Validate user input based on configuration
   */
  private validateInput(input: string, config: any): { isValid: boolean; errorMessage?: string; processedValue?: any } {
    const trimmedInput = input.trim();

    if (config.validation?.required && !trimmedInput) {
      return {
        isValid: false,
        errorMessage: 'This field is required.',
      };
    }

    switch (config.inputType) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedInput)) {
          return {
            isValid: false,
            errorMessage: 'Please enter a valid email address.',
          };
        }
        break;

      case 'phone':
        const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
        if (!phoneRegex.test(trimmedInput)) {
          return {
            isValid: false,
            errorMessage: 'Please enter a valid phone number.',
          };
        }
        break;

      case 'number':
        const number = parseFloat(trimmedInput);
        if (isNaN(number)) {
          return {
            isValid: false,
            errorMessage: 'Please enter a valid number.',
          };
        }
        return {
          isValid: true,
          processedValue: number,
        };

      case 'date':
        const date = new Date(trimmedInput);
        if (isNaN(date.getTime())) {
          return {
            isValid: false,
            errorMessage: 'Please enter a valid date (YYYY-MM-DD).',
          };
        }
        return {
          isValid: true,
          processedValue: date.toISOString().split('T')[0],
        };

      case 'choice':
        if (config.choices) {
          const validChoice = config.choices.find((choice: any) => 
            choice.value === trimmedInput || choice.label === trimmedInput
          );
          if (!validChoice) {
            return {
              isValid: false,
              errorMessage: 'Please select a valid option.',
            };
          }
          return {
            isValid: true,
            processedValue: validChoice.value,
          };
        }
        break;
    }

    return { isValid: true };
  }

  /**
   * Evaluate a condition against variables
   */
  private evaluateCondition(condition: any, variables: Record<string, any>): boolean {
    const variableValue = variables[condition.variable];
    const conditionValue = condition.value;

    switch (condition.operator) {
      case 'equals':
        return variableValue == conditionValue;
      case 'not_equals':
        return variableValue != conditionValue;
      case 'contains':
        return String(variableValue).toLowerCase().includes(String(conditionValue).toLowerCase());
      case 'greater_than':
        return Number(variableValue) > Number(conditionValue);
      case 'less_than':
        return Number(variableValue) < Number(conditionValue);
      case 'exists':
        return variableValue !== undefined && variableValue !== null;
      default:
        return false;
    }
  }

  // ===== CONTEXT MANAGEMENT =====

  /**
   * Get current conversation context
   */
  private async getConversationContext(
    tenantId: string,
    conversationId: string
  ): Promise<ServiceResponse<ConversationContext>> {
    try {
      const [execution] = await this.db
        .select()
        .from(schema.botFlowExecutions)
        .where(and(
          eq(schema.botFlowExecutions.tenantId, tenantId),
          eq(schema.botFlowExecutions.conversationId, conversationId)
        ))
        .orderBy(schema.botFlowExecutions.createdAt)
        .limit(1);

      if (!execution) {
        return {
          success: false,
          error: {
            code: 'EXECUTION_NOT_FOUND',
            message: 'No active execution found for conversation',
            tenantId,
          },
        };
      }

      // Get conversation details
      const [conversation] = await this.db
        .select()
        .from(schema.conversations)
        .where(and(
          eq(schema.conversations.tenantId, tenantId),
          eq(schema.conversations.id, conversationId)
        ));

      if (!conversation) {
        return {
          success: false,
          error: {
            code: 'CONVERSATION_NOT_FOUND',
            message: 'Conversation not found',
            tenantId,
          },
        };
      }

      const context: ConversationContext = {
        tenantId,
        conversationId,
        phoneNumber: conversation.phoneNumber,
        currentNodeId: execution.currentNodeId || '',
        variables: execution.variables as Record<string, any>,
        sessionData: execution.sessionData as Record<string, any>,
        flowId: execution.flowId,
        executionId: execution.id,
      };

      return {
        success: true,
        data: context,
      };
    } catch (error) {
      console.error('Error getting conversation context:', error);
      return {
        success: false,
        error: {
          code: 'CONTEXT_RETRIEVAL_FAILED',
          message: 'Failed to retrieve conversation context',
          tenantId,
        },
      };
    }
  }

  /**
   * Update execution context
   */
  private async updateExecutionContext(
    executionId: string,
    currentNodeId: string,
    variables: Record<string, any>,
    sessionData: Record<string, any>,
    historyEntry: any
  ): Promise<void> {
    try {
      // Get current execution history
      const [currentExecution] = await this.db
        .select()
        .from(schema.botFlowExecutions)
        .where(eq(schema.botFlowExecutions.id, executionId));

      const currentHistory = (currentExecution?.executionHistory as any[]) || [];
      const updatedHistory = [...currentHistory, historyEntry];

      await this.db
        .update(schema.botFlowExecutions)
        .set({
          currentNodeId,
          variables,
          sessionData,
          executionHistory: updatedHistory,
          updatedAt: new Date(),
        })
        .where(eq(schema.botFlowExecutions.id, executionId));
    } catch (error) {
      console.error('Error updating execution context:', error);
    }
  }

  // ===== ACTION IMPLEMENTATIONS =====

  private async createTransaction(
    tenantId: string,
    conversationId: string,
    variables: Record<string, any>,
    parameters: any
  ): Promise<void> {
    // Implementation for creating transactions
    console.log('Creating transaction:', { tenantId, conversationId, variables, parameters });
  }

  private async updateTransaction(
    tenantId: string,
    conversationId: string,
    variables: Record<string, any>,
    parameters: any
  ): Promise<void> {
    // Implementation for updating transactions
    console.log('Updating transaction:', { tenantId, conversationId, variables, parameters });
  }

  private async sendNotification(
    tenantId: string,
    variables: Record<string, any>,
    parameters: any
  ): Promise<void> {
    // Implementation for sending notifications
    console.log('Sending notification:', { tenantId, variables, parameters });
  }

  private async callWebhook(
    variables: Record<string, any>,
    parameters: any
  ): Promise<void> {
    // Implementation for calling webhooks
    console.log('Calling webhook:', { variables, parameters });
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    try {
      await this.pool.end();
    } catch (error) {
      console.error('Error closing conversation engine service:', error);
    }
  }
}