/**
 * Unit tests for WorkflowAutomationService
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WorkflowAutomationService } from '../server/services/workflow-automation.service';
import { TransactionManagementService } from '../server/services/transaction-management.service';
import { TenantBusinessConfigService } from '../server/services/tenant-business-config.service';

// Mock the database and services
vi.mock('drizzle-orm/neon-serverless');
vi.mock('@neondatabase/serverless');
vi.mock('../server/services/transaction-management.service');
vi.mock('../server/services/tenant-business-config.service');

describe('WorkflowAutomationService', () => {
  let service: WorkflowAutomationService;
  let mockTransactionService: vi.Mocked<TransactionManagementService>;
  let mockConfigService: vi.Mocked<TenantBusinessConfigService>;
  let mockDb: any;

  const mockTenantId = 'tenant-1';
  const mockTransactionId = 'transaction-1';
  const mockRuleId = 'rule-1';

  const mockWorkflowRule = {
    id: mockRuleId,
    tenantId: mockTenantId,
    name: 'Auto Confirm Orders',
    description: 'Automatically confirm paid orders',
    isActive: true,
    priority: 1,
    trigger: {
      type: 'field_change',
      conditions: {
        fieldName: 'paymentStatus',
        fieldValue: 'paid',
      },
    },
    actions: [
      {
        type: 'change_state',
        parameters: {
          targetStateId: 'confirmed-state-id',
        },
      },
      {
        type: 'send_notification',
        parameters: {
          message: 'Your order has been confirmed!',
          recipient: 'customer',
        },
      },
    ],
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    // Setup mocks
    mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
    };

    mockTransactionService = {
      getTransaction: vi.fn(),
      updateTransaction: vi.fn(),
      transitionTransactionState: vi.fn(),
      cleanup: vi.fn(),
    } as any;

    mockConfigService = {
      cleanup: vi.fn(),
    } as any;

    // Mock the constructor dependencies
    vi.mocked(TransactionManagementService).mockImplementation(() => mockTransactionService);
    vi.mocked(TenantBusinessConfigService).mockImplementation(() => mockConfigService);

    service = new WorkflowAutomationService('mock-connection-string');
    (service as any).db = mockDb;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createWorkflowRule', () => {
    const createRequest = {
      name: 'Auto Confirm Orders',
      description: 'Automatically confirm paid orders',
      priority: 1,
      trigger: {
        type: 'field_change' as const,
        conditions: {
          fieldName: 'paymentStatus',
          fieldValue: 'paid',
        },
      },
      actions: [
        {
          type: 'change_state' as const,
          parameters: {
            targetStateId: 'confirmed-state-id',
          },
        },
      ],
    };

    it('should create workflow rule successfully', async () => {
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockWorkflowRule]),
        }),
      });

      const result = await service.createWorkflowRule(mockTenantId, createRequest);

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        name: 'Auto Confirm Orders',
        trigger: createRequest.trigger,
        actions: expect.arrayContaining([
          expect.objectContaining({
            type: 'change_state',
            parameters: { targetStateId: 'confirmed-state-id' },
          }),
        ]),
      });
    });

    it('should validate workflow rule requirements', async () => {
      const invalidRequest = {
        name: 'Invalid Rule',
        trigger: {
          type: 'field_change' as const,
          conditions: {}, // Missing fieldName
        },
        actions: [], // No actions
      };

      const result = await service.createWorkflowRule(mockTenantId, invalidRequest);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('WORKFLOW_RULE_VALIDATION_FAILED');
    });
  });

  describe('getWorkflowRules', () => {
    it('should get workflow rules for tenant', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue([mockWorkflowRule]),
          }),
        }),
      });

      const result = await service.getWorkflowRules(mockTenantId);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].name).toBe('Auto Confirm Orders');
    });
  });

  describe('processWorkflowTriggers', () => {
    it('should process applicable workflow triggers', async () => {
      vi.spyOn(service, 'getWorkflowRules').mockResolvedValue({
        success: true,
        data: [mockWorkflowRule],
      });

      // Mock private method
      vi.spyOn(service as any, 'isRuleApplicable').mockReturnValue(true);
      vi.spyOn(service as any, 'executeWorkflowRule').mockResolvedValue({
        success: true,
        data: { id: 'execution-1', status: 'completed' },
      });

      const result = await service.processWorkflowTriggers(
        mockTenantId,
        mockTransactionId,
        'field_change',
        {
          fieldName: 'paymentStatus',
          oldValue: 'pending',
          newValue: 'paid',
        }
      );

      expect(result.success).toBe(true);
      expect(result.data?.executionsStarted).toBe(1);
    });
  });

  describe('getWorkflowStats', () => {
    it('should get workflow automation statistics', async () => {
      // Mock various stats queries
      mockDb.select
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{ count: 5 }]),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{ count: 4 }]),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{ count: 20 }]),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{ count: 18 }]),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{ count: 2 }]),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([
                  { id: 'exec-1', status: 'completed', startedAt: new Date() },
                ]),
              }),
            }),
          }),
        });

      const result = await service.getWorkflowStats(mockTenantId);

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        totalRules: 5,
        activeRules: 4,
        totalExecutions: 20,
        successfulExecutions: 18,
        failedExecutions: 2,
        recentExecutions: [
          expect.objectContaining({ id: 'exec-1', status: 'completed' }),
        ],
      });
    });
  });
});