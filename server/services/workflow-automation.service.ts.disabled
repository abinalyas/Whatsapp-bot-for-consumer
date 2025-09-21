/**
 * Workflow Automation Service
 * Handles configurable business processes, automation triggers, and actions
 */

import { eq, and, desc, asc, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import * as schema from '@shared/schema';
import { TransactionManagementService } from './transaction-management.service';
import { TenantBusinessConfigService } from './tenant-business-config.service';
import type { ServiceResponse } from '@shared/types/tenant';
import type { WorkflowState, Transaction } from '@shared/schema';

export interface WorkflowRule {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  isActive: boolean;
  priority: number;
  trigger: {
    type: 'state_change' | 'time_based' | 'field_change' | 'external_event';
    conditions: {
      fromStateId?: string;
      toStateId?: string;
      fieldName?: string;
      fieldValue?: any;
      timeDelay?: number;
      timeUnit?: 'minutes' | 'hours' | 'days';
      eventType?: string;
    };
  };
  actions: Array<{
    type: 'send_notification' | 'update_field' | 'change_state' | 'create_task' | 'webhook';
    parameters: {
      message?: string;
      recipient?: string;
      fieldName?: string;
      fieldValue?: any;
      targetStateId?: string;
      webhookUrl?: string;
      taskTitle?: string;
      taskDescription?: string;
    };
  }>;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowExecution {
  id: string;
  tenantId: string;
  ruleId: string;
  transactionId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt: Date;
  completedAt?: Date;
  error?: string;
  executionLog: Array<{
    timestamp: Date;
    action: string;
    status: 'success' | 'error';
    message: string;
    data?: any;
  }>;
  metadata: Record<string, any>;
}

export interface CreateWorkflowRuleRequest {
  name: string;
  description?: string;
  priority?: number;
  trigger: WorkflowRule['trigger'];
  actions: WorkflowRule['actions'];
}

export interface WorkflowAutomationStats {
  totalRules: number;
  activeRules: number;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  rulesByTriggerType: Array<{
    triggerType: string;
    count: number;
  }>;
  recentExecutions: WorkflowExecution[];
}

export class WorkflowAutomationService {
  private db: ReturnType<typeof drizzle>;
  private pool: Pool;
  private transactionService: TransactionManagementService;
  private configService: TenantBusinessConfigService;

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString });
    this.db = drizzle({ client: this.pool, schema });
    this.transactionService = new TransactionManagementService(connectionString);
    this.configService = new TenantBusinessConfigService(connectionString);
  }
}

  // ===== WORKFLOW RULE MANAGEMENT =====

  /**
   * Create workflow rule
   */
  async createWorkflowRule(
    tenantId: string,
    request: CreateWorkflowRuleRequest
  ): Promise<ServiceResponse<WorkflowRule>> {
    try {
      // Validate rule configuration
      const validationResult = this.validateWorkflowRule(request);
      if (!validationResult.isValid) {
        return {
          success: false,
          error: {
            code: 'WORKFLOW_RULE_VALIDATION_FAILED',
            message: 'Workflow rule validation failed',
            details: validationResult.errors,
            tenantId,
          },
        };
      }

      // Create workflow rule
      const [workflowRule] = await this.db
        .insert(schema.workflowRules)
        .values({
          tenantId,
          name: request.name,
          description: request.description,
          isActive: true,
          priority: request.priority || 0,
          trigger: request.trigger,
          actions: request.actions,
          metadata: {},
        })
        .returning();

      return {
        success: true,
        data: workflowRule,
      };
    } catch (error) {
      console.error('Error creating workflow rule:', error);
      return {
        success: false,
        error: {
          code: 'WORKFLOW_RULE_CREATE_FAILED',
          message: 'Failed to create workflow rule',
          tenantId,
        },
      };
    }
  }

  /**
   * Get workflow rules for tenant
   */
  async getWorkflowRules(tenantId: string): Promise<ServiceResponse<WorkflowRule[]>> {
    try {
      const workflowRules = await this.db
        .select()
        .from(schema.workflowRules)
        .where(and(
          eq(schema.workflowRules.tenantId, tenantId),
          eq(schema.workflowRules.isActive, true)
        ))
        .orderBy(asc(schema.workflowRules.priority), desc(schema.workflowRules.createdAt));

      return {
        success: true,
        data: workflowRules,
      };
    } catch (error) {
      console.error('Error getting workflow rules:', error);
      return {
        success: false,
        error: {
          code: 'WORKFLOW_RULES_FETCH_FAILED',
          message: 'Failed to fetch workflow rules',
          tenantId,
        },
      };
    }
  } 
 /**
   * Process workflow triggers for transaction
   */
  async processWorkflowTriggers(
    tenantId: string,
    transactionId: string,
    triggerType: 'state_change' | 'field_change',
    triggerData: {
      fromStateId?: string;
      toStateId?: string;
      fieldName?: string;
      oldValue?: any;
      newValue?: any;
    }
  ): Promise<ServiceResponse<{ executionsStarted: number }>> {
    try {
      // Get applicable workflow rules
      const rulesResult = await this.getWorkflowRules(tenantId);
      if (!rulesResult.success) {
        return rulesResult;
      }

      const applicableRules = rulesResult.data!.filter(rule => 
        this.isRuleApplicable(rule, triggerType, triggerData)
      );

      let executionsStarted = 0;

      // Execute applicable rules
      for (const rule of applicableRules) {
        const executionResult = await this.executeWorkflowRule(
          tenantId,
          rule,
          transactionId,
          triggerData
        );

        if (executionResult.success) {
          executionsStarted++;
        }
      }

      return {
        success: true,
        data: { executionsStarted },
      };
    } catch (error) {
      console.error('Error processing workflow triggers:', error);
      return {
        success: false,
        error: {
          code: 'WORKFLOW_TRIGGER_PROCESSING_FAILED',
          message: 'Failed to process workflow triggers',
          tenantId,
        },
      };
    }
  }

  /**
   * Execute workflow rule
   */
  private async executeWorkflowRule(
    tenantId: string,
    rule: WorkflowRule,
    transactionId: string,
    triggerData: any
  ): Promise<ServiceResponse<WorkflowExecution>> {
    try {
      // Create execution record
      const [execution] = await this.db
        .insert(schema.workflowExecutions)
        .values({
          tenantId,
          ruleId: rule.id,
          transactionId,
          status: 'running',
          startedAt: new Date(),
          executionLog: [],
          metadata: { triggerData },
        })
        .returning();

      const executionLog: WorkflowExecution['executionLog'] = [];

      try {
        // Execute each action in the rule
        for (const action of rule.actions) {
          const actionResult = await this.executeAction(
            tenantId,
            transactionId,
            action,
            triggerData
          );

          executionLog.push({
            timestamp: new Date(),
            action: action.type,
            status: actionResult.success ? 'success' : 'error',
            message: actionResult.success 
              ? `Action ${action.type} executed successfully`
              : actionResult.error?.message || 'Action failed',
            data: actionResult.data,
          });

          if (!actionResult.success) {
            // Continue with other actions even if one fails
            console.warn(`Action ${action.type} failed:`, actionResult.error);
          }
        }

        // Update execution as completed
        await this.db
          .update(schema.workflowExecutions)
          .set({
            status: 'completed',
            completedAt: new Date(),
            executionLog,
          })
          .where(eq(schema.workflowExecutions.id, execution.id));

        return {
          success: true,
          data: { ...execution, status: 'completed', executionLog },
        };
      } catch (actionError) {
        // Update execution as failed
        await this.db
          .update(schema.workflowExecutions)
          .set({
            status: 'failed',
            completedAt: new Date(),
            error: String(actionError),
            executionLog,
          })
          .where(eq(schema.workflowExecutions.id, execution.id));

        return {
          success: false,
          error: {
            code: 'WORKFLOW_EXECUTION_FAILED',
            message: 'Workflow execution failed',
            details: String(actionError),
            tenantId,
          },
        };
      }
    } catch (error) {
      console.error('Error executing workflow rule:', error);
      return {
        success: false,
        error: {
          code: 'WORKFLOW_EXECUTION_FAILED',
          message: 'Failed to execute workflow rule',
          tenantId,
        },
      };
    }
  }

  /**
   * Execute individual action
   */
  private async executeAction(
    tenantId: string,
    transactionId: string,
    action: WorkflowRule['actions'][0],
    triggerData: any
  ): Promise<ServiceResponse<any>> {
    try {
      switch (action.type) {
        case 'send_notification':
          return await this.executeNotificationAction(tenantId, transactionId, action);

        case 'update_field':
          return await this.executeUpdateFieldAction(tenantId, transactionId, action);

        case 'change_state':
          return await this.executeChangeStateAction(tenantId, transactionId, action);

        case 'webhook':
          return await this.executeWebhookAction(tenantId, transactionId, action, triggerData);

        default:
          return {
            success: false,
            error: {
              code: 'UNKNOWN_ACTION_TYPE',
              message: `Unknown action type: ${action.type}`,
              tenantId,
            },
          };
      }
    } catch (error) {
      console.error(`Error executing action ${action.type}:`, error);
      return {
        success: false,
        error: {
          code: 'ACTION_EXECUTION_FAILED',
          message: `Failed to execute action ${action.type}`,
          tenantId,
        },
      };
    }
  }

  /**
   * Execute notification action
   */
  private async executeNotificationAction(
    tenantId: string,
    transactionId: string,
    action: WorkflowRule['actions'][0]
  ): Promise<ServiceResponse<any>> {
    try {
      // Get transaction details for notification context
      const transactionResult = await this.transactionService.getTransaction(tenantId, transactionId);
      if (!transactionResult.success) {
        return transactionResult;
      }

      const transaction = transactionResult.data!;
      const message = this.interpolateMessage(action.parameters.message || '', transaction);

      // TODO: Integrate with notification service (WhatsApp, email, SMS)
      console.log(`Notification to ${action.parameters.recipient}: ${message}`);

      return {
        success: true,
        data: { message, recipient: action.parameters.recipient },
      };
    } catch (error) {
      console.error('Error executing notification action:', error);
      return {
        success: false,
        error: {
          code: 'NOTIFICATION_ACTION_FAILED',
          message: 'Failed to execute notification action',
        },
      };
    }
  }

  /**
   * Execute update field action
   */
  private async executeUpdateFieldAction(
    tenantId: string,
    transactionId: string,
    action: WorkflowRule['actions'][0]
  ): Promise<ServiceResponse<any>> {
    try {
      const updateData: any = {};
      
      if (action.parameters.fieldName && action.parameters.fieldValue !== undefined) {
        if (action.parameters.fieldName.startsWith('custom.')) {
          // Update custom field
          const fieldName = action.parameters.fieldName.replace('custom.', '');
          const transactionResult = await this.transactionService.getTransaction(tenantId, transactionId);
          if (transactionResult.success) {
            const currentCustomFields = transactionResult.data!.customFieldValues;
            updateData.customFieldValues = {
              ...currentCustomFields,
              [fieldName]: action.parameters.fieldValue,
            };
          }
        } else {
          // Update regular field
          updateData[action.parameters.fieldName] = action.parameters.fieldValue;
        }
      }

      const updateResult = await this.transactionService.updateTransaction(
        tenantId,
        transactionId,
        updateData
      );

      return updateResult;
    } catch (error) {
      console.error('Error executing update field action:', error);
      return {
        success: false,
        error: {
          code: 'UPDATE_FIELD_ACTION_FAILED',
          message: 'Failed to execute update field action',
        },
      };
    }
  }

  /**
   * Execute change state action
   */
  private async executeChangeStateAction(
    tenantId: string,
    transactionId: string,
    action: WorkflowRule['actions'][0]
  ): Promise<ServiceResponse<any>> {
    try {
      if (!action.parameters.targetStateId) {
        return {
          success: false,
          error: {
            code: 'MISSING_TARGET_STATE',
            message: 'Target state ID is required for change state action',
          },
        };
      }

      const transitionResult = await this.transactionService.transitionTransactionState(
        tenantId,
        transactionId,
        action.parameters.targetStateId,
        'Automated state transition'
      );

      return transitionResult;
    } catch (error) {
      console.error('Error executing change state action:', error);
      return {
        success: false,
        error: {
          code: 'CHANGE_STATE_ACTION_FAILED',
          message: 'Failed to execute change state action',
        },
      };
    }
  }

  /**
   * Execute webhook action
   */
  private async executeWebhookAction(
    tenantId: string,
    transactionId: string,
    action: WorkflowRule['actions'][0],
    triggerData: any
  ): Promise<ServiceResponse<any>> {
    try {
      if (!action.parameters.webhookUrl) {
        return {
          success: false,
          error: {
            code: 'MISSING_WEBHOOK_URL',
            message: 'Webhook URL is required for webhook action',
          },
        };
      }

      // Get transaction details for webhook payload
      const transactionResult = await this.transactionService.getTransaction(tenantId, transactionId);
      if (!transactionResult.success) {
        return transactionResult;
      }

      const payload = {
        tenantId,
        transactionId,
        transaction: transactionResult.data,
        triggerData,
        timestamp: new Date().toISOString(),
      };

      // Execute webhook
      const response = await fetch(action.parameters.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Webhook failed with status ${response.status}`);
      }

      const responseData = await response.json().catch(() => ({}));

      return {
        success: true,
        data: { status: response.status, response: responseData },
      };
    } catch (error) {
      console.error('Error executing webhook action:', error);
      return {
        success: false,
        error: {
          code: 'WEBHOOK_ACTION_FAILED',
          message: 'Failed to execute webhook action',
          details: String(error),
        },
      };
    }
  }