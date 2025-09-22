/**
 * Bot Flow Builder Service
 * Provides drag-and-drop bot flow creation with visual interface support
 */

import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { eq, and, desc, asc, sql, inArray } from 'drizzle-orm';
import * as schema from '../../shared/schema';
import type { ServiceResponse } from '@shared/types/tenant';
import { string } from 'zod';
import { text } from 'express';
import { string } from 'zod';
import { string } from 'zod';
import { text } from 'express';
import { string } from 'zod';
import { string } from 'zod';
import { string } from 'zod';
import { string } from 'zod';
import { boolean } from 'zod';
import { request } from 'http';
import { request } from 'http';
import { request } from 'http';
import { request } from 'http';
import { request } from 'http';
import { request } from 'http';
import { string } from 'zod';
import { boolean } from 'zod';
import { request } from 'http';
import { string } from 'zod';
import { string } from 'zod';
import { string } from 'zod';
import { string } from 'zod';
import { string } from 'zod';
import { string } from 'zod';
import { string } from 'zod';
import { text } from 'express';
import { request } from 'http';
import { string } from 'zod';
import { string } from 'zod';

// ===== TYPES AND INTERFACES =====

export interface BotFlowNode {
  id: string;
  tenantId: string;
  flowId: string;
  type: BotFlowNodeType;
  name: string;
  description?: string;
  position: {
    x: number;
    y: number;
  };
  configuration: BotFlowNodeConfiguration;
  connections: BotFlowConnection[];
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface BotFlow {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  businessType: string;
  isActive: boolean;
  isTemplate: boolean;
  version: string;
  entryNodeId?: string;
  nodes: BotFlowNode[];
  variables: BotFlowVariable[];
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export type BotFlowNodeType = 
  | 'start'
  | 'message'
  | 'question'
  | 'condition'
  | 'action'
  | 'integration'
  | 'end';

export interface BotFlowConnection {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  condition?: string;
  label?: string;
}

export interface BotFlowVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'object';
  defaultValue?: any;
  description?: string;
  isRequired: boolean;
}

export interface BotFlowNodeConfiguration {
  // Message node configuration
  messageText?: string;
  messageType?: 'text' | 'image' | 'document' | 'template';
  templateData?: Record<string, any>;
  
  // Question node configuration
  questionText?: string;
  inputType?: 'text' | 'number' | 'choice' | 'date' | 'phone' | 'email';
  choices?: Array<{ value: string; label: string }>;
  validation?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    min?: number;
    max?: number;
  };
  variableName?: string;
  
  // Condition node configuration
  conditions?: Array<{
    variable: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'exists';
    value: any;
    logicalOperator?: 'and' | 'or';
  }>;
  
  // Action node configuration
  actionType?: 'create_transaction' | 'update_transaction' | 'send_notification' | 'call_webhook' | 'set_variable';
  actionParameters?: Record<string, any>;
  
  // Integration node configuration
  integrationType?: 'webhook' | 'api_call' | 'database_query' | 'external_service';
  integrationConfig?: Record<string, any>;
}

export interface CreateBotFlowRequest {
  name: string;
  description?: string;
  businessType: string;
  isTemplate?: boolean;
  templateId?: string;
  variables?: BotFlowVariable[];
  metadata?: Record<string, any>;
}

export interface UpdateBotFlowRequest {
  name?: string;
  description?: string;
  isActive?: boolean;
  variables?: BotFlowVariable[];
  metadata?: Record<string, any>;
}

export interface CreateBotFlowNodeRequest {
  type: BotFlowNodeType;
  name: string;
  description?: string;
  position: { x: number; y: number };
  configuration: BotFlowNodeConfiguration;
  connections?: Omit<BotFlowConnection, 'id'>[];
  metadata?: Record<string, any>;
}

export interface UpdateBotFlowNodeRequest {
  name?: string;
  description?: string;
  position?: { x: number; y: number };
  configuration?: BotFlowNodeConfiguration;
  connections?: BotFlowConnection[];
  metadata?: Record<string, any>;
}

export interface BotFlowTemplate {
  id: string;
  name: string;
  description: string;
  businessType: string;
  category: string;
  nodes: Omit<BotFlowNode, 'id' | 'tenantId' | 'flowId' | 'createdAt' | 'updatedAt'>[];
  variables: BotFlowVariable[];
  metadata: Record<string, any>;
}

export interface BotFlowValidationResult {
  isValid: boolean;
  errors: Array<{
    nodeId?: string;
    type: 'error' | 'warning';
    message: string;
    code: string;
  }>;
  warnings: Array<{
    nodeId?: string;
    message: string;
    code: string;
  }>;
}

export interface BotFlowExecutionContext {
  flowId: string;
  currentNodeId: string;
  variables: Record<string, any>;
  conversationId: string;
  userId: string;
  sessionData: Record<string, any>;
}

// ===== SERVICE IMPLEMENTATION =====

export class BotFlowBuilderService {
  private db: ReturnType<typeof drizzle>;
  private pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString });
    this.db = drizzle(this.pool, { schema });
  }

  // ===== BOT FLOW MANAGEMENT =====

  /**
   * Create new bot flow
   */
  async createBotFlow(tenantId: string, request: CreateBotFlowRequest): Promise<ServiceResponse<BotFlow>> {
    try {
      // Validate request
      const validation = this.validateCreateBotFlowRequest(request);
      if (!validation.isValid) {
        return {
          success: false,
          error: {
            code: 'BOT_FLOW_VALIDATION_FAILED',
            message: 'Bot flow validation failed',
            tenantId,
            details: validation.errors,
          },
        };
      }

      // Create bot flow
      const [botFlow] = await this.db
        .insert(schema.botFlows)
        .values({
          tenantId,
          name: request.name,
          description: request.description,
          businessType: request.businessType,
          isActive: false, // Start inactive until nodes are added
          isTemplate: request.isTemplate || false,
          version: '1.0.0',
          variables: request.variables || [],
          metadata: request.metadata || {},
        })
        .returning();

      // If creating from template, copy template nodes
      if (request.templateId) {
        await this.copyTemplateNodes(tenantId, botFlow.id, request.templateId);
      }

      // Get complete bot flow with nodes
      const result = await this.getBotFlow(tenantId, botFlow.id);
      return result;
    } catch (error) {
      console.error('Error creating bot flow:', error);
      return {
        success: false,
        error: {
          code: 'BOT_FLOW_CREATE_FAILED',
          message: 'Failed to create bot flow',
          tenantId,
        },
      };
    }
  }

  /**
   * Get bot flow by ID
   */
  async getBotFlow(tenantId: string, flowId: string): Promise<ServiceResponse<BotFlow>> {
    try {
      const [botFlow] = await this.db
        .select()
        .from(schema.botFlows)
        .where(and(
          eq(schema.botFlows.tenantId, tenantId),
          eq(schema.botFlows.id, flowId)
        ));

      if (!botFlow) {
        return {
          success: false,
          error: {
            code: 'BOT_FLOW_NOT_FOUND',
            message: 'Bot flow not found',
            tenantId,
            resourceId: flowId,
          },
        };
      }

      // Get flow nodes
      const nodes = await this.db
        .select()
        .from(schema.botFlowNodes)
        .where(eq(schema.botFlowNodes.flowId, flowId))
        .orderBy(asc(schema.botFlowNodes.createdAt));

      const result: BotFlow = {
        ...botFlow,
        nodes: nodes.map(node => ({
          ...node,
          position: node.position as { x: number; y: number },
          configuration: node.configuration as BotFlowNodeConfiguration,
          connections: node.connections as BotFlowConnection[],
          metadata: node.metadata as Record<string, any>,
        })),
        variables: botFlow.variables as BotFlowVariable[],
        metadata: botFlow.metadata as Record<string, any>,
      };

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error('Error getting bot flow:', error);
      return {
        success: false,
        error: {
          code: 'BOT_FLOW_FETCH_FAILED',
          message: 'Failed to fetch bot flow',
          tenantId,
          resourceId: flowId,
        },
      };
    }
  }

  /**
   * List bot flows
   */
  async listBotFlows(
    tenantId: string,
    options: {
      businessType?: string;
      isActive?: boolean;
      isTemplate?: boolean;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<ServiceResponse<{ flows: BotFlow[]; total: number; page: number; limit: number }>> {
    try {
      const { businessType, isActive, isTemplate, page = 1, limit = 50 } = options;
      const offset = (page - 1) * limit;

      // Build where conditions
      const conditions = [eq(schema.botFlows.tenantId, tenantId)];
      
      if (businessType) {
        conditions.push(eq(schema.botFlows.businessType, businessType));
      }
      
      if (isActive !== undefined) {
        conditions.push(eq(schema.botFlows.isActive, isActive));
      }
      
      if (isTemplate !== undefined) {
        conditions.push(eq(schema.botFlows.isTemplate, isTemplate));
      }

      // Get flows
      const flows = await this.db
        .select()
        .from(schema.botFlows)
        .where(and(...conditions))
        .orderBy(desc(schema.botFlows.updatedAt))
        .limit(limit)
        .offset(offset);

      // Get total count
      const [{ count }] = await this.db
        .select({ count: sql<number>`count(*)` })
        .from(schema.botFlows)
        .where(and(...conditions));

      // Get nodes for each flow
      const flowsWithNodes: BotFlow[] = [];
      for (const flow of flows) {
        const nodes = await this.db
          .select()
          .from(schema.botFlowNodes)
          .where(eq(schema.botFlowNodes.flowId, flow.id))
          .orderBy(asc(schema.botFlowNodes.createdAt));

        flowsWithNodes.push({
          ...flow,
          nodes: nodes.map(node => ({
            ...node,
            position: node.position as { x: number; y: number },
            configuration: node.configuration as BotFlowNodeConfiguration,
            connections: node.connections as BotFlowConnection[],
            metadata: node.metadata as Record<string, any>,
          })),
          variables: flow.variables as BotFlowVariable[],
          metadata: flow.metadata as Record<string, any>,
        });
      }

      return {
        success: true,
        data: {
          flows: flowsWithNodes,
          total: count,
          page,
          limit,
        },
      };
    } catch (error) {
      console.error('Error listing bot flows:', error);
      return {
        success: false,
        error: {
          code: 'BOT_FLOW_LIST_FAILED',
          message: 'Failed to list bot flows',
          tenantId,
        },
      };
    }
  }

  /**
   * Update bot flow
   */
  async updateBotFlow(
    tenantId: string,
    flowId: string,
    request: UpdateBotFlowRequest
  ): Promise<ServiceResponse<BotFlow>> {
    try {
      const [updatedFlow] = await this.db
        .update(schema.botFlows)
        .set({
          ...request,
          updatedAt: new Date(),
        })
        .where(and(
          eq(schema.botFlows.tenantId, tenantId),
          eq(schema.botFlows.id, flowId)
        ))
        .returning();

      if (!updatedFlow) {
        return {
          success: false,
          error: {
            code: 'BOT_FLOW_NOT_FOUND',
            message: 'Bot flow not found',
            tenantId,
            resourceId: flowId,
          },
        };
      }

      // Get complete updated flow
      const result = await this.getBotFlow(tenantId, flowId);
      return result;
    } catch (error) {
      console.error('Error updating bot flow:', error);
      return {
        success: false,
        error: {
          code: 'BOT_FLOW_UPDATE_FAILED',
          message: 'Failed to update bot flow',
          tenantId,
          resourceId: flowId,
        },
      };
    }
  }

  /**
   * Delete bot flow
   */
  async deleteBotFlow(tenantId: string, flowId: string): Promise<ServiceResponse<void>> {
    try {
      // Delete nodes first
      await this.db
        .delete(schema.botFlowNodes)
        .where(eq(schema.botFlowNodes.flowId, flowId));

      // Delete flow
      const [deletedFlow] = await this.db
        .delete(schema.botFlows)
        .where(and(
          eq(schema.botFlows.tenantId, tenantId),
          eq(schema.botFlows.id, flowId)
        ))
        .returning();

      if (!deletedFlow) {
        return {
          success: false,
          error: {
            code: 'BOT_FLOW_NOT_FOUND',
            message: 'Bot flow not found',
            tenantId,
            resourceId: flowId,
          },
        };
      }

      return {
        success: true,
        data: undefined,
      };
    } catch (error) {
      console.error('Error deleting bot flow:', error);
      return {
        success: false,
        error: {
          code: 'BOT_FLOW_DELETE_FAILED',
          message: 'Failed to delete bot flow',
          tenantId,
          resourceId: flowId,
        },
      };
    }
  }

  // ===== BOT FLOW NODE MANAGEMENT =====

  /**
   * Create bot flow node
   */
  async createBotFlowNode(
    tenantId: string,
    flowId: string,
    request: CreateBotFlowNodeRequest
  ): Promise<ServiceResponse<BotFlowNode>> {
    try {
      // Validate flow exists
      const flowResult = await this.getBotFlow(tenantId, flowId);
      if (!flowResult.success) {
        return flowResult as any;
      }

      // Validate node configuration
      const validation = this.validateNodeConfiguration(request.type, request.configuration);
      if (!validation.isValid) {
        return {
          success: false,
          error: {
            code: 'BOT_FLOW_NODE_VALIDATION_FAILED',
            message: 'Bot flow node validation failed',
            tenantId,
            details: validation.errors,
          },
        };
      }

      // Create node
      const [node] = await this.db
        .insert(schema.botFlowNodes)
        .values({
          tenantId,
          flowId,
          type: request.type,
          name: request.name,
          description: request.description,
          position: request.position,
          configuration: request.configuration,
          connections: request.connections || [],
          metadata: request.metadata || {},
        })
        .returning();

      const result: BotFlowNode = {
        ...node,
        position: node.position as { x: number; y: number },
        configuration: node.configuration as BotFlowNodeConfiguration,
        connections: node.connections as BotFlowConnection[],
        metadata: node.metadata as Record<string, any>,
      };

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error('Error creating bot flow node:', error);
      return {
        success: false,
        error: {
          code: 'BOT_FLOW_NODE_CREATE_FAILED',
          message: 'Failed to create bot flow node',
          tenantId,
        },
      };
    }
  }

  /**
   * Update bot flow node
   */
  async updateBotFlowNode(
    tenantId: string,
    nodeId: string,
    request: UpdateBotFlowNodeRequest
  ): Promise<ServiceResponse<BotFlowNode>> {
    try {
      // Validate node configuration if provided
      if (request.configuration) {
        const [existingNode] = await this.db
          .select()
          .from(schema.botFlowNodes)
          .where(and(
            eq(schema.botFlowNodes.tenantId, tenantId),
            eq(schema.botFlowNodes.id, nodeId)
          ));

        if (!existingNode) {
          return {
            success: false,
            error: {
              code: 'BOT_FLOW_NODE_NOT_FOUND',
              message: 'Bot flow node not found',
              tenantId,
              resourceId: nodeId,
            },
          };
        }

        const validation = this.validateNodeConfiguration(existingNode.type as BotFlowNodeType, request.configuration);
        if (!validation.isValid) {
          return {
            success: false,
            error: {
              code: 'BOT_FLOW_NODE_VALIDATION_FAILED',
              message: 'Bot flow node validation failed',
              tenantId,
              details: validation.errors,
            },
          };
        }
      }

      // Update node
      const [updatedNode] = await this.db
        .update(schema.botFlowNodes)
        .set({
          ...request,
          updatedAt: new Date(),
        })
        .where(and(
          eq(schema.botFlowNodes.tenantId, tenantId),
          eq(schema.botFlowNodes.id, nodeId)
        ))
        .returning();

      if (!updatedNode) {
        return {
          success: false,
          error: {
            code: 'BOT_FLOW_NODE_NOT_FOUND',
            message: 'Bot flow node not found',
            tenantId,
            resourceId: nodeId,
          },
        };
      }

      const result: BotFlowNode = {
        ...updatedNode,
        position: updatedNode.position as { x: number; y: number },
        configuration: updatedNode.configuration as BotFlowNodeConfiguration,
        connections: updatedNode.connections as BotFlowConnection[],
        metadata: updatedNode.metadata as Record<string, any>,
      };

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error('Error updating bot flow node:', error);
      return {
        success: false,
        error: {
          code: 'BOT_FLOW_NODE_UPDATE_FAILED',
          message: 'Failed to update bot flow node',
          tenantId,
          resourceId: nodeId,
        },
      };
    }
  }

  /**
   * Delete bot flow node
   */
  async deleteBotFlowNode(tenantId: string, nodeId: string): Promise<ServiceResponse<void>> {
    try {
      const [deletedNode] = await this.db
        .delete(schema.botFlowNodes)
        .where(and(
          eq(schema.botFlowNodes.tenantId, tenantId),
          eq(schema.botFlowNodes.id, nodeId)
        ))
        .returning();

      if (!deletedNode) {
        return {
          success: false,
          error: {
            code: 'BOT_FLOW_NODE_NOT_FOUND',
            message: 'Bot flow node not found',
            tenantId,
            resourceId: nodeId,
          },
        };
      }

      // Remove connections to this node from other nodes
      await this.removeNodeConnections(deletedNode.flowId, nodeId);

      return {
        success: true,
        data: undefined,
      };
    } catch (error) {
      console.error('Error deleting bot flow node:', error);
      return {
        success: false,
        error: {
          code: 'BOT_FLOW_NODE_DELETE_FAILED',
          message: 'Failed to delete bot flow node',
          tenantId,
          resourceId: nodeId,
        },
      };
    }
  }

  // ===== BOT FLOW VALIDATION =====

  /**
   * Validate bot flow
   */

  // ===== BOT FLOW TEMPLATES =====

  /**
   * Get predefined bot flow templates
   */
  async getBotFlowTemplates(businessType?: string): Promise<ServiceResponse<BotFlowTemplate[]>> {
    try {
      const templates = this.getPredefinedTemplates();
      
      const filteredTemplates = businessType 
        ? templates.filter(template => template.businessType === businessType)
        : templates;

      return {
        success: true,
        data: filteredTemplates,
      };
    } catch (error) {
      console.error('Error getting bot flow templates:', error);
      return {
        success: false,
        error: {
          code: 'BOT_FLOW_TEMPLATES_FETCH_FAILED',
          message: 'Failed to fetch bot flow templates',
        },
      };
    }
  }

  /**
   * Create bot flow from template
   */
  async createBotFlowFromTemplate(
    tenantId: string,
    templateId: string,
    customization: {
      name: string;
      description?: string;
      variables?: Record<string, any>;
    }
  ): Promise<ServiceResponse<BotFlow>> {
    try {
      const templates = this.getPredefinedTemplates();
      const template = templates.find(t => t.id === templateId);

      if (!template) {
        return {
          success: false,
          error: {
            code: 'BOT_FLOW_TEMPLATE_NOT_FOUND',
            message: 'Bot flow template not found',
            resourceId: templateId,
          },
        };
      }

      // Create flow from template
      const createRequest: CreateBotFlowRequest = {
        name: customization.name,
        description: customization.description || template.description,
        businessType: template.businessType,
        variables: template.variables,
        metadata: {
          ...template.metadata,
          templateId,
          customization: customization.variables,
        },
      };

      const flowResult = await this.createBotFlow(tenantId, createRequest);
      if (!flowResult.success) {
        return flowResult;
      }

      const flow = flowResult.data!;

      // Create nodes from template
      const nodeIdMap = new Map<string, string>();
      
      for (const templateNode of template.nodes) {
        const nodeResult = await this.createBotFlowNode(tenantId, flow.id, {
          type: templateNode.type,
          name: templateNode.name,
          description: templateNode.description,
          position: templateNode.position,
          configuration: this.customizeNodeConfiguration(templateNode.configuration, customization.variables),
          metadata: templateNode.metadata,
        });

        if (nodeResult.success) {
          nodeIdMap.set(templateNode.name, nodeResult.data!.id);
        }
      }

      // Update connections with actual node IDs
      for (const templateNode of template.nodes) {
        const actualNodeId = nodeIdMap.get(templateNode.name);
        if (actualNodeId && templateNode.connections.length > 0) {
          const updatedConnections = templateNode.connections.map(conn => ({
            ...conn,
            id: this.generateId(),
            sourceNodeId: actualNodeId,
            targetNodeId: nodeIdMap.get(conn.targetNodeId) || conn.targetNodeId,
          }));

          await this.updateBotFlowNode(tenantId, actualNodeId, {
            connections: updatedConnections,
          });
        }
      }

      // Set entry node
      const startNode = template.nodes.find(node => node.type === 'start');
      if (startNode) {
        const entryNodeId = nodeIdMap.get(startNode.name);
        if (entryNodeId) {
          await this.updateBotFlow(tenantId, flow.id, {
            metadata: {
              ...flow.metadata,
              entryNodeId,
            },
          });
        }
      }

      // Get complete flow with nodes
      const result = await this.getBotFlow(tenantId, flow.id);
      return result;
    } catch (error) {
      console.error('Error creating bot flow from template:', error);
      return {
        success: false,
        error: {
          code: 'BOT_FLOW_TEMPLATE_CREATE_FAILED',
          message: 'Failed to create bot flow from template',
          resourceId: templateId,
        },
      };
    }
  }

  // ===== UTILITY METHODS =====

  /**
   * Validate create bot flow request
   */
  private validateCreateBotFlowRequest(request: CreateBotFlowRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!request.name || request.name.trim().length === 0) {
      errors.push('Flow name is required');
    }

    if (!request.businessType || request.businessType.trim().length === 0) {
      errors.push('Business type is required');
    }

    if (request.variables) {
      for (const variable of request.variables) {
        if (!variable.name || variable.name.trim().length === 0) {
          errors.push('Variable name is required');
        }
        if (!variable.type) {
          errors.push(`Variable type is required for ${variable.name}`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate node configuration
   */
  private validateNodeConfiguration(
    nodeType: BotFlowNodeType,
    configuration: BotFlowNodeConfiguration
  ): { isValid: boolean; errors: Array<{ message: string; code: string }> } {
    const errors: Array<{ message: string; code: string }> = [];

    switch (nodeType) {
      case 'start':
        // Start nodes don't need specific configuration
        break;

      case 'message':
        if (!configuration.messageText) {
          errors.push({
            message: 'Message text is required for message nodes',
            code: 'MISSING_MESSAGE_TEXT',
          });
        }
        break;

      case 'question':
        if (!configuration.questionText) {
          errors.push({
            message: 'Question text is required for question nodes',
            code: 'MISSING_QUESTION_TEXT',
          });
        }
        if (!configuration.variableName) {
          errors.push({
            message: 'Variable name is required for question nodes',
            code: 'MISSING_VARIABLE_NAME',
          });
        }
        if (configuration.inputType === 'choice' && (!configuration.choices || configuration.choices.length === 0)) {
          errors.push({
            message: 'Choices are required for choice input type',
            code: 'MISSING_CHOICES',
          });
        }
        break;

      case 'condition':
        if (!configuration.conditions || configuration.conditions.length === 0) {
          errors.push({
            message: 'Conditions are required for condition nodes',
            code: 'MISSING_CONDITIONS',
          });
        }
        break;

      case 'action':
        if (!configuration.actionType) {
          errors.push({
            message: 'Action type is required for action nodes',
            code: 'MISSING_ACTION_TYPE',
          });
        }
        break;

      case 'integration':
        if (!configuration.integrationType) {
          errors.push({
            message: 'Integration type is required for integration nodes',
            code: 'MISSING_INTEGRATION_TYPE',
          });
        }
        break;

      case 'end':
        // End nodes don't need specific configuration
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate node connections
   */
  private validateNodeConnections(
    node: BotFlowNode,
    allNodes: BotFlowNode[],
    errors: BotFlowValidationResult['errors'],
    warnings: BotFlowValidationResult['warnings']
  ): void {
    // Check if target nodes exist
    for (const connection of node.connections) {
      const targetExists = allNodes.some(n => n.id === connection.targetNodeId);
      if (!targetExists) {
        errors.push({
          nodeId: node.id,
          type: 'error',
          message: `Connection target node ${connection.targetNodeId} does not exist`,
          code: 'INVALID_CONNECTION_TARGET',
        });
      }
    }

    // Check node-specific connection requirements
    switch (node.type) {
      case 'start':
        if (node.connections.length === 0) {
          warnings.push({
            nodeId: node.id,
            message: 'Start node should have at least one connection',
            code: 'START_NODE_NO_CONNECTIONS',
          });
        }
        break;

      case 'condition':
        if (node.connections.length < 2) {
          warnings.push({
            nodeId: node.id,
            message: 'Condition node should have at least two connections (true/false paths)',
            code: 'CONDITION_NODE_INSUFFICIENT_CONNECTIONS',
          });
        }
        break;

      case 'end':
        if (node.connections.length > 0) {
          warnings.push({
            nodeId: node.id,
            message: 'End node should not have outgoing connections',
            code: 'END_NODE_HAS_CONNECTIONS',
          });
        }
        break;
    }
  }

  /**
   * Validate flow reachability
   */
  private validateFlowReachability(
    flow: BotFlow,
    errors: BotFlowValidationResult['errors'],
    warnings: BotFlowValidationResult['warnings']
  ): void {
    const startNodes = flow.nodes.filter(node => node.type === 'start');
    if (startNodes.length === 0) return;

    const reachableNodes = new Set<string>();
    const toVisit = [startNodes[0].id];

    while (toVisit.length > 0) {
      const currentNodeId = toVisit.pop()!;
      if (reachableNodes.has(currentNodeId)) continue;

      reachableNodes.add(currentNodeId);
      const currentNode = flow.nodes.find(node => node.id === currentNodeId);
      
      if (currentNode) {
        for (const connection of currentNode.connections) {
          if (!reachableNodes.has(connection.targetNodeId)) {
            toVisit.push(connection.targetNodeId);
          }
        }
      }
    }

    // Check for unreachable nodes
    for (const node of flow.nodes) {
      if (!reachableNodes.has(node.id) && node.type !== 'start') {
        warnings.push({
          nodeId: node.id,
          message: `Node ${node.name} is not reachable from start node`,
          code: 'UNREACHABLE_NODE',
        });
      }
    }
  }

  /**
   * Validate flow for infinite loops
   */
  private validateFlowLoops(
    flow: BotFlow,
    warnings: BotFlowValidationResult['warnings']
  ): void {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasLoop = (nodeId: string): boolean => {
      if (recursionStack.has(nodeId)) {
        return true;
      }
      if (visited.has(nodeId)) {
        return false;
      }

      visited.add(nodeId);
      recursionStack.add(nodeId);

      const node = flow.nodes.find(n => n.id === nodeId);
      if (node) {
        for (const connection of node.connections) {
          if (hasLoop(connection.targetNodeId)) {
            return true;
          }
        }
      }

      recursionStack.delete(nodeId);
      return false;
    };

    const startNodes = flow.nodes.filter(node => node.type === 'start');
    for (const startNode of startNodes) {
      if (hasLoop(startNode.id)) {
        warnings.push({
          message: 'Flow contains potential infinite loops',
          code: 'POTENTIAL_INFINITE_LOOP',
        });
        break;
      }
    }
  }

  /**
   * Remove connections to a deleted node
   */
  private async removeNodeConnections(flowId: string, deletedNodeId: string): Promise<void> {
    const nodes = await this.db
      .select()
      .from(schema.botFlowNodes)
      .where(eq(schema.botFlowNodes.flowId, flowId));

    for (const node of nodes) {
      const connections = node.connections as BotFlowConnection[];
      const updatedConnections = connections.filter(
        conn => conn.targetNodeId !== deletedNodeId && conn.sourceNodeId !== deletedNodeId
      );

      if (updatedConnections.length !== connections.length) {
        await this.db
          .update(schema.botFlowNodes)
          .set({
            connections: updatedConnections,
            updatedAt: new Date(),
          })
          .where(eq(schema.botFlowNodes.id, node.id));
      }
    }
  }

  /**
   * Copy template nodes to a new flow
   */
  private async copyTemplateNodes(tenantId: string, flowId: string, templateId: string): Promise<void> {
    const templates = this.getPredefinedTemplates();
    const template = templates.find(t => t.id === templateId);
    
    if (!template) return;

    const nodeIdMap = new Map<string, string>();
    
    // Create nodes
    for (const templateNode of template.nodes) {
      const nodeResult = await this.createBotFlowNode(tenantId, flowId, {
        type: templateNode.type,
        name: templateNode.name,
        description: templateNode.description,
        position: templateNode.position,
        configuration: templateNode.configuration,
        metadata: templateNode.metadata,
      });

      if (nodeResult.success) {
        nodeIdMap.set(templateNode.name, nodeResult.data!.id);
      }
    }

    // Update connections
    for (const templateNode of template.nodes) {
      const actualNodeId = nodeIdMap.get(templateNode.name);
      if (actualNodeId && templateNode.connections.length > 0) {
        const updatedConnections = templateNode.connections.map(conn => ({
          ...conn,
          id: this.generateId(),
          sourceNodeId: actualNodeId,
          targetNodeId: nodeIdMap.get(conn.targetNodeId) || conn.targetNodeId,
        }));

        await this.updateBotFlowNode(tenantId, actualNodeId, {
          connections: updatedConnections,
        });
      }
    }
  }

  /**
   * Customize node configuration with variables
   */
  private customizeNodeConfiguration(
    configuration: BotFlowNodeConfiguration,
    variables?: Record<string, any>
  ): BotFlowNodeConfiguration {
    if (!variables) return configuration;

    const customized = { ...configuration };

    // Replace template variables in text fields
    if (customized.messageText) {
      customized.messageText = this.replaceVariables(customized.messageText, variables);
    }
    if (customized.questionText) {
      customized.questionText = this.replaceVariables(customized.questionText, variables);
    }

    return customized;
  }

  /**
   * Replace variables in text
   */
  private replaceVariables(text: string, variables: Record<string, any>): string {
    let result = text;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    }
    return result;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get predefined bot flow templates
   */
  private getPredefinedTemplates(): BotFlowTemplate[] {
    return [
      {
        id: 'restaurant-order-flow',
        name: 'Restaurant Order Flow',
        description: 'Complete order flow for restaurants with menu selection and payment',
        businessType: 'restaurant',
        category: 'ordering',
        nodes: [
          {
            type: 'start',
            name: 'Welcome',
            position: { x: 100, y: 100 },
            configuration: {},
            connections: [{ sourceNodeId: 'Welcome', targetNodeId: 'ShowMenu', label: 'start' }],
            metadata: {},
          },
          {
            type: 'message',
            name: 'ShowMenu',
            position: { x: 300, y: 100 },
            configuration: {
              messageText: 'Welcome to {{restaurantName}}! Here\'s our menu:',
              messageType: 'template',
            },
            connections: [{ sourceNodeId: 'ShowMenu', targetNodeId: 'AskOrder', label: 'next' }],
            metadata: {},
          },
          {
            type: 'question',
            name: 'AskOrder',
            position: { x: 500, y: 100 },
            configuration: {
              questionText: 'What would you like to order?',
              inputType: 'text',
              variableName: 'orderItems',
              validation: { required: true },
            },
            connections: [{ sourceNodeId: 'AskOrder', targetNodeId: 'ConfirmOrder', label: 'next' }],
            metadata: {},
          },
          {
            type: 'action',
            name: 'ConfirmOrder',
            position: { x: 700, y: 100 },
            configuration: {
              actionType: 'create_transaction',
              actionParameters: {
                type: 'order',
                items: '{{orderItems}}',
              },
            },
            connections: [{ sourceNodeId: 'ConfirmOrder', targetNodeId: 'OrderComplete', label: 'success' }],
            metadata: {},
          },
          {
            type: 'end',
            name: 'OrderComplete',
            position: { x: 900, y: 100 },
            configuration: {},
            connections: [],
            metadata: {},
          },
        ],
        variables: [
          {
            name: 'restaurantName',
            type: 'string',
            defaultValue: 'Our Restaurant',
            description: 'Name of the restaurant',
            isRequired: true,
          },
          {
            name: 'orderItems',
            type: 'string',
            description: 'Items ordered by customer',
            isRequired: false,
          },
        ],
        metadata: {
          category: 'ordering',
          difficulty: 'beginner',
          estimatedSetupTime: '10 minutes',
        },
      },
      {
        id: 'clinic-appointment-flow',
        name: 'Clinic Appointment Flow',
        description: 'Appointment booking flow for healthcare clinics',
        businessType: 'clinic',
        category: 'booking',
        nodes: [
          {
            type: 'start',
            name: 'Welcome',
            position: { x: 100, y: 100 },
            configuration: {},
            connections: [{ sourceNodeId: 'Welcome', targetNodeId: 'AskService', label: 'start' }],
            metadata: {},
          },
          {
            type: 'question',
            name: 'AskService',
            position: { x: 300, y: 100 },
            configuration: {
              questionText: 'What type of appointment would you like to book?',
              inputType: 'choice',
              choices: [
                { value: 'consultation', label: 'General Consultation' },
                { value: 'checkup', label: 'Health Checkup' },
                { value: 'specialist', label: 'Specialist Visit' },
              ],
              variableName: 'appointmentType',
            },
            connections: [{ sourceNodeId: 'AskService', targetNodeId: 'AskDate', label: 'next' }],
            metadata: {},
          },
          {
            type: 'question',
            name: 'AskDate',
            position: { x: 500, y: 100 },
            configuration: {
              questionText: 'When would you like to schedule your appointment?',
              inputType: 'date',
              variableName: 'appointmentDate',
              validation: { required: true },
            },
            connections: [{ sourceNodeId: 'AskDate', targetNodeId: 'BookAppointment', label: 'next' }],
            metadata: {},
          },
          {
            type: 'action',
            name: 'BookAppointment',
            position: { x: 700, y: 100 },
            configuration: {
              actionType: 'create_transaction',
              actionParameters: {
                type: 'appointment',
                service: '{{appointmentType}}',
                scheduledDate: '{{appointmentDate}}',
              },
            },
            connections: [{ sourceNodeId: 'BookAppointment', targetNodeId: 'AppointmentBooked', label: 'success' }],
            metadata: {},
          },
          {
            type: 'end',
            name: 'AppointmentBooked',
            position: { x: 900, y: 100 },
            configuration: {},
            connections: [],
            metadata: {},
          },
        ],
        variables: [
          {
            name: 'clinicName',
            type: 'string',
            defaultValue: 'Our Clinic',
            description: 'Name of the clinic',
            isRequired: true,
          },
          {
            name: 'appointmentType',
            type: 'string',
            description: 'Type of appointment selected',
            isRequired: false,
          },
          {
            name: 'appointmentDate',
            type: 'date',
            description: 'Selected appointment date',
            isRequired: false,
          },
        ],
        metadata: {
          category: 'booking',
          difficulty: 'beginner',
          estimatedSetupTime: '15 minutes',
        },
      },
    ];
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    try {
      await this.pool.end();
    } catch (error) {
      console.error('Error cleaning up bot flow builder service:', error);
    }
  }
}