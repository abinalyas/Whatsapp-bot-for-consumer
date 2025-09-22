/**
 * Unit tests for ConversationEngineService
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ConversationEngineService } from '../server/services/conversation-engine.service';

// Mock the database and dependencies
vi.mock('@neondatabase/serverless');
vi.mock('../server/services/bot-flow-builder.service');

describe('ConversationEngineService', () => {
  let service: ConversationEngineService;
  let mockDb: any;
  let mockBotFlowService: any;

  beforeEach(() => {
    // Mock database
    mockDb = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
    };

    // Mock bot flow service
    mockBotFlowService = {
      getBotFlow: vi.fn(),
    };

    service = new ConversationEngineService('mock-connection-string');
    (service as any).db = mockDb;
    (service as any).botFlowService = mockBotFlowService;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('startConversationFlow', () => {
    it('should start a new conversation flow successfully', async () => {
      const tenantId = 'tenant-123';
      const conversationId = 'conv-123';
      const phoneNumber = '+1234567890';
      const flowId = 'flow-123';

      const mockFlow = {
        id: flowId,
        name: 'Test Flow',
        nodes: [
          {
            id: 'start-1',
            type: 'start',
            name: 'Start Node',
            configuration: {},
            connections: [{ targetNodeId: 'message-1' }],
          },
        ],
        variables: [
          {
            name: 'userName',
            type: 'string',
            defaultValue: '',
          },
        ],
      };

      const mockExecution = {
        id: 'exec-123',
        tenantId,
        flowId,
        conversationId,
        currentNodeId: 'start-1',
        variables: { userName: '' },
        sessionData: {},
        executionHistory: [],
      };

      mockBotFlowService.getBotFlow.mockResolvedValue({
        success: true,
        data: mockFlow,
      });

      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockExecution]),
        }),
      });

      const result = await service.startConversationFlow(
        tenantId,
        conversationId,
        phoneNumber,
        flowId
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        tenantId,
        conversationId,
        phoneNumber,
        currentNodeId: 'start-1',
        variables: { userName: '' },
        sessionData: {},
        flowId,
        executionId: 'exec-123',
      });

      expect(mockBotFlowService.getBotFlow).toHaveBeenCalledWith(tenantId, flowId);
      expect(mockDb.insert).toHaveBeenCalled();
    });

    it('should fail if bot flow has no start node', async () => {
      const tenantId = 'tenant-123';
      const conversationId = 'conv-123';
      const phoneNumber = '+1234567890';
      const flowId = 'flow-123';

      const mockFlow = {
        id: flowId,
        name: 'Test Flow',
        nodes: [
          {
            id: 'message-1',
            type: 'message',
            name: 'Message Node',
            configuration: {},
            connections: [],
          },
        ],
        variables: [],
      };

      mockBotFlowService.getBotFlow.mockResolvedValue({
        success: true,
        data: mockFlow,
      });

      const result = await service.startConversationFlow(
        tenantId,
        conversationId,
        phoneNumber,
        flowId
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NO_START_NODE');
    });

    it('should fail if bot flow retrieval fails', async () => {
      const tenantId = 'tenant-123';
      const conversationId = 'conv-123';
      const phoneNumber = '+1234567890';
      const flowId = 'flow-123';

      mockBotFlowService.getBotFlow.mockResolvedValue({
        success: false,
        error: {
          code: 'FLOW_NOT_FOUND',
          message: 'Flow not found',
        },
      });

      const result = await service.startConversationFlow(
        tenantId,
        conversationId,
        phoneNumber,
        flowId
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('FLOW_NOT_FOUND');
    });
  });

  describe('processUserInput', () => {
    it('should process user input and execute current node', async () => {
      const tenantId = 'tenant-123';
      const conversationId = 'conv-123';
      const userInput = 'Hello';

      const mockContext = {
        tenantId,
        conversationId,
        phoneNumber: '+1234567890',
        currentNodeId: 'message-1',
        variables: {},
        sessionData: {},
        flowId: 'flow-123',
        executionId: 'exec-123',
      };

      const mockFlow = {
        id: 'flow-123',
        nodes: [
          {
            id: 'message-1',
            type: 'message',
            name: 'Welcome Message',
            configuration: {
              messageText: 'Welcome to our service!',
            },
            connections: [{ targetNodeId: 'question-1' }],
          },
        ],
      };

      // Mock getConversationContext
      vi.spyOn(service as any, 'getConversationContext').mockResolvedValue({
        success: true,
        data: mockContext,
      });

      mockBotFlowService.getBotFlow.mockResolvedValue({
        success: true,
        data: mockFlow,
      });

      // Mock updateExecutionContext
      vi.spyOn(service as any, 'updateExecutionContext').mockResolvedValue(undefined);

      const result = await service.processUserInput(tenantId, conversationId, userInput);

      expect(result.success).toBe(true);
      expect(result.data?.response?.content).toBe('Welcome to our service!');
      expect(result.data?.nextNodeId).toBe('question-1');
    });

    it('should fail if conversation context not found', async () => {
      const tenantId = 'tenant-123';
      const conversationId = 'conv-123';
      const userInput = 'Hello';

      // Mock getConversationContext to fail
      vi.spyOn(service as any, 'getConversationContext').mockResolvedValue({
        success: false,
        error: {
          code: 'EXECUTION_NOT_FOUND',
          message: 'No active execution found',
        },
      });

      const result = await service.processUserInput(tenantId, conversationId, userInput);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('EXECUTION_NOT_FOUND');
    });
  });

  describe('node execution', () => {
    describe('executeMessageNode', () => {
      it('should execute message node and return response', async () => {
        const context = {
          node: {
            id: 'message-1',
            type: 'message',
            configuration: {
              messageText: 'Hello {{userName}}!',
              messageType: 'text',
            },
            connections: [{ targetNodeId: 'question-1' }],
          },
          userInput: 'test',
          variables: { userName: 'John' },
          sessionData: {},
          tenantId: 'tenant-123',
          conversationId: 'conv-123',
        };

        const result = await (service as any).executeMessageNode(context);

        expect(result.success).toBe(true);
        expect(result.response?.content).toBe('Hello John!');
        expect(result.response?.messageType).toBe('text');
        expect(result.nextNodeId).toBe('question-1');
      });

      it('should handle interactive message with buttons', async () => {
        const context = {
          node: {
            id: 'message-1',
            type: 'message',
            configuration: {
              messageText: 'Choose an option:',
              buttons: [
                { id: 'option1', title: 'Option 1' },
                { id: 'option2', title: 'Option 2' },
              ],
            },
            connections: [{ targetNodeId: 'question-1' }],
          },
          userInput: 'test',
          variables: {},
          sessionData: {},
          tenantId: 'tenant-123',
          conversationId: 'conv-123',
        };

        const result = await (service as any).executeMessageNode(context);

        expect(result.success).toBe(true);
        expect(result.response?.messageType).toBe('interactive');
        expect(result.response?.metadata?.buttons).toHaveLength(2);
      });
    });

    describe('executeQuestionNode', () => {
      it('should ask question on first execution', async () => {
        const context = {
          node: {
            id: 'question-1',
            type: 'question',
            configuration: {
              questionText: 'What is your name?',
              inputType: 'text',
              variableName: 'userName',
            },
            connections: [{ targetNodeId: 'message-2' }],
          },
          userInput: 'test',
          variables: {},
          sessionData: {},
          tenantId: 'tenant-123',
          conversationId: 'conv-123',
        };

        const result = await (service as any).executeQuestionNode(context);

        expect(result.success).toBe(true);
        expect(result.response?.content).toBe('What is your name?');
        expect(result.updatedSessionData).toHaveProperty('question_question-1_asked', true);
        expect(result.nextNodeId).toBeUndefined(); // Should not advance until answered
      });

      it('should process answer on second execution', async () => {
        const context = {
          node: {
            id: 'question-1',
            type: 'question',
            configuration: {
              questionText: 'What is your name?',
              inputType: 'text',
              variableName: 'userName',
            },
            connections: [{ targetNodeId: 'message-2' }],
          },
          userInput: 'John Doe',
          variables: {},
          sessionData: { 'question_question-1_asked': true },
          tenantId: 'tenant-123',
          conversationId: 'conv-123',
        };

        const result = await (service as any).executeQuestionNode(context);

        expect(result.success).toBe(true);
        expect(result.nextNodeId).toBe('message-2');
        expect(result.updatedVariables?.userName).toBe('John Doe');
        expect(result.updatedSessionData).toHaveProperty('question_question-1_answered', true);
      });

      it('should validate email input', async () => {
        const context = {
          node: {
            id: 'question-1',
            type: 'question',
            configuration: {
              questionText: 'What is your email?',
              inputType: 'email',
              variableName: 'userEmail',
            },
            connections: [{ targetNodeId: 'message-2' }],
          },
          userInput: 'invalid-email',
          variables: {},
          sessionData: { 'question_question-1_asked': true },
          tenantId: 'tenant-123',
          conversationId: 'conv-123',
        };

        const result = await (service as any).executeQuestionNode(context);

        expect(result.success).toBe(true);
        expect(result.response?.content).toContain('valid email address');
        expect(result.nextNodeId).toBeUndefined(); // Should not advance with invalid input
      });
    });

    describe('executeConditionNode', () => {
      it('should evaluate condition and choose correct path', async () => {
        const context = {
          node: {
            id: 'condition-1',
            type: 'condition',
            configuration: {
              conditions: [
                {
                  variable: 'userAge',
                  operator: 'greater_than',
                  value: 18,
                },
              ],
            },
            connections: [
              { targetNodeId: 'adult-path', label: 'true' },
              { targetNodeId: 'minor-path', label: 'false' },
            ],
          },
          userInput: 'test',
          variables: { userAge: 25 },
          sessionData: {},
          tenantId: 'tenant-123',
          conversationId: 'conv-123',
        };

        const result = await (service as any).executeConditionNode(context);

        expect(result.success).toBe(true);
        expect(result.nextNodeId).toBe('adult-path');
      });

      it('should use default path when condition fails', async () => {
        const context = {
          node: {
            id: 'condition-1',
            type: 'condition',
            configuration: {
              conditions: [
                {
                  variable: 'userAge',
                  operator: 'greater_than',
                  value: 18,
                },
              ],
            },
            connections: [
              { targetNodeId: 'adult-path', label: 'true' },
              { targetNodeId: 'minor-path', label: 'false' },
            ],
          },
          userInput: 'test',
          variables: { userAge: 16 },
          sessionData: {},
          tenantId: 'tenant-123',
          conversationId: 'conv-123',
        };

        const result = await (service as any).executeConditionNode(context);

        expect(result.success).toBe(true);
        expect(result.nextNodeId).toBe('minor-path');
      });
    });

    describe('executeEndNode', () => {
      it('should end conversation with message', async () => {
        const context = {
          node: {
            id: 'end-1',
            type: 'end',
            configuration: {
              endMessage: 'Thank you, {{userName}}!',
            },
            connections: [],
          },
          userInput: 'test',
          variables: { userName: 'John' },
          sessionData: {},
          tenantId: 'tenant-123',
          conversationId: 'conv-123',
        };

        const result = await (service as any).executeEndNode(context);

        expect(result.success).toBe(true);
        expect(result.response?.content).toBe('Thank you, John!');
        expect(result.shouldEndConversation).toBe(true);
      });
    });
  });

  describe('utility methods', () => {
    describe('replaceVariables', () => {
      it('should replace variables in text', () => {
        const text = 'Hello {{userName}}, your age is {{userAge}}!';
        const variables = { userName: 'John', userAge: 25 };

        const result = (service as any).replaceVariables(text, variables);

        expect(result).toBe('Hello John, your age is 25!');
      });

      it('should leave unreplaced variables as-is', () => {
        const text = 'Hello {{userName}}, your {{unknownVar}} is here!';
        const variables = { userName: 'John' };

        const result = (service as any).replaceVariables(text, variables);

        expect(result).toBe('Hello John, your {{unknownVar}} is here!');
      });
    });

    describe('validateInput', () => {
      it('should validate required fields', () => {
        const config = {
          inputType: 'text',
          validation: { required: true },
        };

        const result1 = (service as any).validateInput('', config);
        expect(result1.isValid).toBe(false);
        expect(result1.errorMessage).toContain('required');

        const result2 = (service as any).validateInput('test', config);
        expect(result2.isValid).toBe(true);
      });

      it('should validate email format', () => {
        const config = { inputType: 'email' };

        const result1 = (service as any).validateInput('invalid-email', config);
        expect(result1.isValid).toBe(false);

        const result2 = (service as any).validateInput('test@example.com', config);
        expect(result2.isValid).toBe(true);
      });

      it('should validate and convert numbers', () => {
        const config = { inputType: 'number' };

        const result1 = (service as any).validateInput('not-a-number', config);
        expect(result1.isValid).toBe(false);

        const result2 = (service as any).validateInput('42.5', config);
        expect(result2.isValid).toBe(true);
        expect(result2.processedValue).toBe(42.5);
      });
    });

    describe('evaluateCondition', () => {
      it('should evaluate equals condition', () => {
        const condition = { variable: 'status', operator: 'equals', value: 'active' };
        const variables = { status: 'active' };

        const result = (service as any).evaluateCondition(condition, variables);
        expect(result).toBe(true);
      });

      it('should evaluate greater_than condition', () => {
        const condition = { variable: 'age', operator: 'greater_than', value: 18 };
        const variables = { age: 25 };

        const result = (service as any).evaluateCondition(condition, variables);
        expect(result).toBe(true);
      });

      it('should evaluate contains condition', () => {
        const condition = { variable: 'message', operator: 'contains', value: 'hello' };
        const variables = { message: 'Hello World' };

        const result = (service as any).evaluateCondition(condition, variables);
        expect(result).toBe(true);
      });
    });
  });
});