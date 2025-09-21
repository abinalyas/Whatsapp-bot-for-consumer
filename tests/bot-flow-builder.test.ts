/**
 * Unit tests for BotFlowBuilderService
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BotFlowBuilderService } from '../server/services/bot-flow-builder.service';

// Mock the database and dependencies
vi.mock('drizzle-orm/neon-serverless');
vi.mock('@neondatabase/serverless');

describe('BotFlowBuilderService', () => {
  let service: BotFlowBuilderService;
  let mockDb: any;

  const mockTenantId = 'tenant-1';
  const mockFlowId = 'flow-1';
  const mockNodeId = 'node-1';

  const mockBotFlow = {
    id: mockFlowId,
    tenantId: mockTenantId,
    name: 'Test Flow',
    description: 'Test bot flow',
    businessType: 'restaurant',
    isActive: true,
    isTemplate: false,
    version: '1.0.0',
    entryNodeId: 'start-node-1',
    variables: [
      {
        name: 'customerName',
        type: 'string',
        defaultValue: '',
        description: 'Customer name',
        isRequired: true,
      },
    ],
    metadata: { category: 'ordering' },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockBotFlowNode = {
    id: mockNodeId,
    tenantId: mockTenantId,
    flowId: mockFlowId,
    type: 'message',
    name: 'Welcome Message',
    description: 'Welcome the customer',
    position: { x: 100, y: 100 },
    configuration: {
      messageText: 'Welcome to our restaurant!',
      messageType: 'text',
    },
    connections: [
      {
        id: 'conn-1',
        sourceNodeId: mockNodeId,
        targetNodeId: 'node-2',
        label: 'next',
      },
    ],
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    // Setup mock database
    mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      offset: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
    };

    service = new BotFlowBuilderService('mock-connection-string');
    (service as any).db = mockDb;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createBotFlow', () => {
    const createRequest = {
      name: 'Test Flow',
      description: 'Test bot flow',
      businessType: 'restaurant',
      variables: [
        {
          name: 'customerName',
          type: 'string' as const,
          defaultValue: '',
          description: 'Customer name',
          isRequired: true,
        },
      ],
    };

    it('should create bot flow successfully', async () => {
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockBotFlow]),
        }),
      });

      // Mock getBotFlow call
      vi.spyOn(service, 'getBotFlow').mockResolvedValue({
        success: true,
        data: { ...mockBotFlow, nodes: [] },
      });

      const result = await service.createBotFlow(mockTenantId, createRequest);

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('Test Flow');
      expect(result.data?.businessType).toBe('restaurant');
    });

    it('should validate bot flow request', async () => {
      const invalidRequest = {
        name: '', // Empty name
        businessType: '', // Empty business type
      };

      const result = await service.createBotFlow(mockTenantId, invalidRequest);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('BOT_FLOW_VALIDATION_FAILED');
      expect(result.error?.details).toContain('Flow name is required');
      expect(result.error?.details).toContain('Business type is required');
    });

    it('should validate variables in request', async () => {
      const invalidRequest = {
        name: 'Test Flow',
        businessType: 'restaurant',
        variables: [
          {
            name: '', // Empty variable name
            type: 'string' as const,
            isRequired: true,
          },
          {
            name: 'validVar',
            type: '' as any, // Empty type
            isRequired: false,
          },
        ],
      };

      const result = await service.createBotFlow(mockTenantId, invalidRequest);

      expect(result.success).toBe(false);
      expect(result.error?.details).toContain('Variable name is required');
      expect(result.error?.details).toContain('Variable type is required for validVar');
    });
  });

  describe('getBotFlow', () => {
    it('should get bot flow with nodes successfully', async () => {
      mockDb.select
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([mockBotFlow]),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue([mockBotFlowNode]),
            }),
          }),
        });

      const result = await service.getBotFlow(mockTenantId, mockFlowId);

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe(mockFlowId);
      expect(result.data?.nodes).toHaveLength(1);
      expect(result.data?.nodes[0].name).toBe('Welcome Message');
    });

    it('should return error when flow not found', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]), // No flow found
        }),
      });

      const result = await service.getBotFlow(mockTenantId, 'non-existent-flow');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('BOT_FLOW_NOT_FOUND');
    });
  });

  describe('listBotFlows', () => {
    it('should list bot flows with pagination', async () => {
      mockDb.select
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  offset: vi.fn().mockResolvedValue([mockBotFlow]),
                }),
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{ count: 1 }]),
          }),
        })
        .mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue([mockBotFlowNode]),
            }),
          }),
        });

      const result = await service.listBotFlows(mockTenantId, {
        page: 1,
        limit: 10,
        businessType: 'restaurant',
        isActive: true,
      });

      expect(result.success).toBe(true);
      expect(result.data?.flows).toHaveLength(1);
      expect(result.data?.total).toBe(1);
      expect(result.data?.page).toBe(1);
      expect(result.data?.limit).toBe(10);
    });
  });

  describe('createBotFlowNode', () => {
    const createNodeRequest = {
      type: 'message' as const,
      name: 'Welcome Message',
      description: 'Welcome the customer',
      position: { x: 100, y: 100 },
      configuration: {
        messageText: 'Welcome to our restaurant!',
        messageType: 'text' as const,
      },
    };

    it('should create bot flow node successfully', async () => {
      // Mock getBotFlow to validate flow exists
      vi.spyOn(service, 'getBotFlow').mockResolvedValue({
        success: true,
        data: { ...mockBotFlow, nodes: [] },
      });

      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockBotFlowNode]),
        }),
      });

      const result = await service.createBotFlowNode(mockTenantId, mockFlowId, createNodeRequest);

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('Welcome Message');
      expect(result.data?.type).toBe('message');
    });

    it('should validate node configuration', async () => {
      vi.spyOn(service, 'getBotFlow').mockResolvedValue({
        success: true,
        data: { ...mockBotFlow, nodes: [] },
      });

      const invalidRequest = {
        type: 'message' as const,
        name: 'Invalid Message',
        position: { x: 100, y: 100 },
        configuration: {
          // Missing messageText for message node
        },
      };

      const result = await service.createBotFlowNode(mockTenantId, mockFlowId, invalidRequest);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('BOT_FLOW_NODE_VALIDATION_FAILED');
      expect(result.error?.details?.[0]?.code).toBe('MISSING_MESSAGE_TEXT');
    });

    it('should validate question node configuration', async () => {
      vi.spyOn(service, 'getBotFlow').mockResolvedValue({
        success: true,
        data: { ...mockBotFlow, nodes: [] },
      });

      const invalidQuestionRequest = {
        type: 'question' as const,
        name: 'Invalid Question',
        position: { x: 100, y: 100 },
        configuration: {
          // Missing questionText and variableName
          inputType: 'choice' as const,
          // Missing choices for choice input type
        },
      };

      const result = await service.createBotFlowNode(mockTenantId, mockFlowId, invalidQuestionRequest);

      expect(result.success).toBe(false);
      expect(result.error?.details?.some(e => e.code === 'MISSING_QUESTION_TEXT')).toBe(true);
      expect(result.error?.details?.some(e => e.code === 'MISSING_VARIABLE_NAME')).toBe(true);
      expect(result.error?.details?.some(e => e.code === 'MISSING_CHOICES')).toBe(true);
    });

    it('should validate condition node configuration', async () => {
      vi.spyOn(service, 'getBotFlow').mockResolvedValue({
        success: true,
        data: { ...mockBotFlow, nodes: [] },
      });

      const invalidConditionRequest = {
        type: 'condition' as const,
        name: 'Invalid Condition',
        position: { x: 100, y: 100 },
        configuration: {
          // Missing conditions
        },
      };

      const result = await service.createBotFlowNode(mockTenantId, mockFlowId, invalidConditionRequest);

      expect(result.success).toBe(false);
      expect(result.error?.details?.[0]?.code).toBe('MISSING_CONDITIONS');
    });

    it('should validate action node configuration', async () => {
      vi.spyOn(service, 'getBotFlow').mockResolvedValue({
        success: true,
        data: { ...mockBotFlow, nodes: [] },
      });

      const invalidActionRequest = {
        type: 'action' as const,
        name: 'Invalid Action',
        position: { x: 100, y: 100 },
        configuration: {
          // Missing actionType
        },
      };

      const result = await service.createBotFlowNode(mockTenantId, mockFlowId, invalidActionRequest);

      expect(result.success).toBe(false);
      expect(result.error?.details?.[0]?.code).toBe('MISSING_ACTION_TYPE');
    });

    it('should validate integration node configuration', async () => {
      vi.spyOn(service, 'getBotFlow').mockResolvedValue({
        success: true,
        data: { ...mockBotFlow, nodes: [] },
      });

      const invalidIntegrationRequest = {
        type: 'integration' as const,
        name: 'Invalid Integration',
        position: { x: 100, y: 100 },
        configuration: {
          // Missing integrationType
        },
      };

      const result = await service.createBotFlowNode(mockTenantId, mockFlowId, invalidIntegrationRequest);

      expect(result.success).toBe(false);
      expect(result.error?.details?.[0]?.code).toBe('MISSING_INTEGRATION_TYPE');
    });
  });

  describe('validateBotFlow', () => {
    it('should validate complete bot flow successfully', async () => {
      const validFlow = {
        ...mockBotFlow,
        nodes: [
          {
            ...mockBotFlowNode,
            id: 'start-1',
            type: 'start' as const,
            name: 'Start',
            configuration: {},
            connections: [{ id: 'conn-1', sourceNodeId: 'start-1', targetNodeId: 'message-1', label: 'next' }],
          },
          {
            ...mockBotFlowNode,
            id: 'message-1',
            type: 'message' as const,
            name: 'Welcome',
            configuration: { messageText: 'Welcome!' },
            connections: [{ id: 'conn-2', sourceNodeId: 'message-1', targetNodeId: 'end-1', label: 'next' }],
          },
          {
            ...mockBotFlowNode,
            id: 'end-1',
            type: 'end' as const,
            name: 'End',
            configuration: {},
            connections: [],
          },
        ],
      };

      vi.spyOn(service, 'getBotFlow').mockResolvedValue({
        success: true,
        data: validFlow,
      });

      const result = await service.validateBotFlow(mockTenantId, mockFlowId);

      expect(result.success).toBe(true);
      expect(result.data?.isValid).toBe(true);
      expect(result.data?.errors).toHaveLength(0);
    });

    it('should detect missing start node', async () => {
      const flowWithoutStart = {
        ...mockBotFlow,
        nodes: [
          {
            ...mockBotFlowNode,
            id: 'message-1',
            type: 'message' as const,
            configuration: { messageText: 'Welcome!' },
          },
        ],
      };

      vi.spyOn(service, 'getBotFlow').mockResolvedValue({
        success: true,
        data: flowWithoutStart,
      });

      const result = await service.validateBotFlow(mockTenantId, mockFlowId);

      expect(result.success).toBe(true);
      expect(result.data?.isValid).toBe(false);
      expect(result.data?.errors.some(e => e.code === 'MISSING_START_NODE')).toBe(true);
    });

    it('should detect multiple start nodes', async () => {
      const flowWithMultipleStarts = {
        ...mockBotFlow,
        nodes: [
          {
            ...mockBotFlowNode,
            id: 'start-1',
            type: 'start' as const,
            configuration: {},
          },
          {
            ...mockBotFlowNode,
            id: 'start-2',
            type: 'start' as const,
            configuration: {},
          },
        ],
      };

      vi.spyOn(service, 'getBotFlow').mockResolvedValue({
        success: true,
        data: flowWithMultipleStarts,
      });

      const result = await service.validateBotFlow(mockTenantId, mockFlowId);

      expect(result.success).toBe(true);
      expect(result.data?.isValid).toBe(false);
      expect(result.data?.errors.some(e => e.code === 'MULTIPLE_START_NODES')).toBe(true);
    });

    it('should warn about missing end node', async () => {
      const flowWithoutEnd = {
        ...mockBotFlow,
        nodes: [
          {
            ...mockBotFlowNode,
            id: 'start-1',
            type: 'start' as const,
            configuration: {},
          },
          {
            ...mockBotFlowNode,
            id: 'message-1',
            type: 'message' as const,
            configuration: { messageText: 'Welcome!' },
          },
        ],
      };

      vi.spyOn(service, 'getBotFlow').mockResolvedValue({
        success: true,
        data: flowWithoutEnd,
      });

      const result = await service.validateBotFlow(mockTenantId, mockFlowId);

      expect(result.success).toBe(true);
      expect(result.data?.warnings.some(w => w.code === 'MISSING_END_NODE')).toBe(true);
    });

    it('should detect invalid connection targets', async () => {
      const flowWithInvalidConnections = {
        ...mockBotFlow,
        nodes: [
          {
            ...mockBotFlowNode,
            id: 'start-1',
            type: 'start' as const,
            configuration: {},
            connections: [{ id: 'conn-1', sourceNodeId: 'start-1', targetNodeId: 'non-existent', label: 'next' }],
          },
        ],
      };

      vi.spyOn(service, 'getBotFlow').mockResolvedValue({
        success: true,
        data: flowWithInvalidConnections,
      });

      const result = await service.validateBotFlow(mockTenantId, mockFlowId);

      expect(result.success).toBe(true);
      expect(result.data?.errors.some(e => e.code === 'INVALID_CONNECTION_TARGET')).toBe(true);
    });

    it('should detect unreachable nodes', async () => {
      const flowWithUnreachableNode = {
        ...mockBotFlow,
        nodes: [
          {
            ...mockBotFlowNode,
            id: 'start-1',
            type: 'start' as const,
            configuration: {},
            connections: [{ id: 'conn-1', sourceNodeId: 'start-1', targetNodeId: 'message-1', label: 'next' }],
          },
          {
            ...mockBotFlowNode,
            id: 'message-1',
            type: 'message' as const,
            configuration: { messageText: 'Welcome!' },
            connections: [],
          },
          {
            ...mockBotFlowNode,
            id: 'unreachable-1',
            type: 'message' as const,
            configuration: { messageText: 'Unreachable!' },
            connections: [],
          },
        ],
      };

      vi.spyOn(service, 'getBotFlow').mockResolvedValue({
        success: true,
        data: flowWithUnreachableNode,
      });

      const result = await service.validateBotFlow(mockTenantId, mockFlowId);

      expect(result.success).toBe(true);
      expect(result.data?.warnings.some(w => w.code === 'UNREACHABLE_NODE')).toBe(true);
    });
  });

  describe('getBotFlowTemplates', () => {
    it('should get all predefined templates', async () => {
      const result = await service.getBotFlowTemplates();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2); // restaurant and clinic templates
      expect(result.data?.[0].businessType).toBe('restaurant');
      expect(result.data?.[1].businessType).toBe('clinic');
    });

    it('should filter templates by business type', async () => {
      const result = await service.getBotFlowTemplates('restaurant');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].businessType).toBe('restaurant');
      expect(result.data?.[0].name).toBe('Restaurant Order Flow');
    });
  });

  describe('createBotFlowFromTemplate', () => {
    it('should create bot flow from template successfully', async () => {
      // Mock createBotFlow
      vi.spyOn(service, 'createBotFlow').mockResolvedValue({
        success: true,
        data: { ...mockBotFlow, nodes: [] },
      });

      // Mock createBotFlowNode
      vi.spyOn(service, 'createBotFlowNode').mockResolvedValue({
        success: true,
        data: mockBotFlowNode,
      });

      // Mock updateBotFlowNode
      vi.spyOn(service, 'updateBotFlowNode').mockResolvedValue({
        success: true,
        data: mockBotFlowNode,
      });

      // Mock updateBotFlow
      vi.spyOn(service, 'updateBotFlow').mockResolvedValue({
        success: true,
        data: mockBotFlow,
      });

      // Mock getBotFlow for final result
      vi.spyOn(service, 'getBotFlow').mockResolvedValue({
        success: true,
        data: { ...mockBotFlow, nodes: [mockBotFlowNode] },
      });

      const result = await service.createBotFlowFromTemplate(
        mockTenantId,
        'restaurant-order-flow',
        {
          name: 'My Restaurant Flow',
          description: 'Custom restaurant flow',
          variables: { restaurantName: 'Pizza Palace' },
        }
      );

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('My Restaurant Flow');
    });

    it('should return error for non-existent template', async () => {
      const result = await service.createBotFlowFromTemplate(
        mockTenantId,
        'non-existent-template',
        {
          name: 'Test Flow',
        }
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('BOT_FLOW_TEMPLATE_NOT_FOUND');
    });
  });

  describe('updateBotFlowNode', () => {
    it('should update bot flow node successfully', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockBotFlowNode]),
        }),
      });

      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{
              ...mockBotFlowNode,
              name: 'Updated Welcome Message',
            }]),
          }),
        }),
      });

      const result = await service.updateBotFlowNode(mockTenantId, mockNodeId, {
        name: 'Updated Welcome Message',
      });

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('Updated Welcome Message');
    });

    it('should validate configuration when updating', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockBotFlowNode]),
        }),
      });

      const result = await service.updateBotFlowNode(mockTenantId, mockNodeId, {
        configuration: {
          // Invalid configuration for message node (missing messageText)
        },
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('BOT_FLOW_NODE_VALIDATION_FAILED');
    });
  });

  describe('deleteBotFlowNode', () => {
    it('should delete bot flow node successfully', async () => {
      mockDb.delete.mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockBotFlowNode]),
        }),
      });

      // Mock removeNodeConnections
      vi.spyOn(service as any, 'removeNodeConnections').mockResolvedValue(undefined);

      const result = await service.deleteBotFlowNode(mockTenantId, mockNodeId);

      expect(result.success).toBe(true);
    });

    it('should return error when node not found', async () => {
      mockDb.delete.mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([]), // No node deleted
        }),
      });

      const result = await service.deleteBotFlowNode(mockTenantId, 'non-existent-node');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('BOT_FLOW_NODE_NOT_FOUND');
    });
  });

  describe('deleteBotFlow', () => {
    it('should delete bot flow and its nodes successfully', async () => {
      // Mock delete nodes
      mockDb.delete
        .mockReturnValueOnce({
          where: vi.fn().mockResolvedValue(undefined), // Delete nodes
        })
        .mockReturnValueOnce({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([mockBotFlow]), // Delete flow
          }),
        });

      const result = await service.deleteBotFlow(mockTenantId, mockFlowId);

      expect(result.success).toBe(true);
    });

    it('should return error when flow not found', async () => {
      mockDb.delete
        .mockReturnValueOnce({
          where: vi.fn().mockResolvedValue(undefined), // Delete nodes
        })
        .mockReturnValueOnce({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([]), // No flow deleted
          }),
        });

      const result = await service.deleteBotFlow(mockTenantId, 'non-existent-flow');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('BOT_FLOW_NOT_FOUND');
    });
  });
});