/**
 * Flexible Business Models Schema Tests
 * Tests the new database schema for flexible business models
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import * as schema from '@shared/schema';

// Mock database connection
const mockConnectionString = 'postgresql://test:test@localhost:5432/test';

// Mock database pool
const mockPool = {
  query: vi.fn(),
  end: vi.fn(),
};

vi.mock('@neondatabase/serverless', () => ({
  Pool: vi.fn(() => mockPool),
}));

describe('Flexible Business Models Schema', () => {
  let db: ReturnType<typeof drizzle>;

  beforeEach(() => {
    const pool = new Pool({ connectionString: mockConnectionString });
    db = drizzle({ client: pool, schema });
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await mockPool.end();
  });

  describe('Business Types Schema', () => {
    it('should have correct business types table structure', () => {
      const businessType = schema.businessTypes;
      
      expect(businessType).toBeDefined();
      expect(businessType.id).toBeDefined();
      expect(businessType.name).toBeDefined();
      expect(businessType.displayName).toBeDefined();
      expect(businessType.category).toBeDefined();
      expect(businessType.terminology).toBeDefined();
      expect(businessType.defaultConfig).toBeDefined();
      expect(businessType.isSystem).toBeDefined();
      expect(businessType.isActive).toBeDefined();
    });

    it('should validate business type insert schema', () => {
      const validBusinessType = {
        name: 'restaurant',
        displayName: 'Restaurant',
        category: 'hospitality',
        description: 'Restaurant business type',
        terminology: {
          offering: 'Menu Item',
          transaction: 'Reservation',
          customer: 'Guest',
        },
        defaultConfig: {
          requiresScheduling: true,
          defaultDuration: 120,
        },
        isSystem: true,
        isActive: true,
      };

      const result = schema.insertBusinessTypeSchema.safeParse(validBusinessType);
      expect(result.success).toBe(true);
    });

    it('should reject invalid business type data', () => {
      const invalidBusinessType = {
        // Missing required fields
        category: 'invalid',
      };

      const result = schema.insertBusinessTypeSchema.safeParse(invalidBusinessType);
      expect(result.success).toBe(false);
    });
  });

  describe('Custom Fields Schema', () => {
    it('should have correct custom fields table structure', () => {
      const customField = schema.customFields;
      
      expect(customField).toBeDefined();
      expect(customField.tenantId).toBeDefined();
      expect(customField.entityType).toBeDefined();
      expect(customField.name).toBeDefined();
      expect(customField.label).toBeDefined();
      expect(customField.fieldType).toBeDefined();
      expect(customField.isRequired).toBeDefined();
      expect(customField.validationRules).toBeDefined();
      expect(customField.fieldOptions).toBeDefined();
    });

    it('should validate custom field insert schema', () => {
      const validCustomField = {
        tenantId: 'tenant-123',
        entityType: 'offering',
        name: 'dietary_restrictions',
        label: 'Dietary Restrictions',
        fieldType: 'multiselect',
        isRequired: false,
        validationRules: {},
        fieldOptions: [
          { value: 'vegetarian', label: 'Vegetarian' },
          { value: 'vegan', label: 'Vegan' },
          { value: 'gluten_free', label: 'Gluten Free' },
        ],
        displayOrder: 1,
        isActive: true,
      };

      const result = schema.insertCustomFieldSchema.safeParse(validCustomField);
      expect(result.success).toBe(true);
    });
  });

  describe('Offerings Schema', () => {
    it('should have correct offerings table structure', () => {
      const offering = schema.offerings;
      
      expect(offering).toBeDefined();
      expect(offering.tenantId).toBeDefined();
      expect(offering.name).toBeDefined();
      expect(offering.offeringType).toBeDefined();
      expect(offering.pricingType).toBeDefined();
      expect(offering.basePrice).toBeDefined();
      expect(offering.currency).toBeDefined();
      expect(offering.isSchedulable).toBeDefined();
      expect(offering.hasVariants).toBeDefined();
      expect(offering.customFields).toBeDefined();
    });

    it('should validate offering insert schema', () => {
      const validOffering = {
        tenantId: 'tenant-123',
        name: 'Margherita Pizza',
        description: 'Classic pizza with tomato sauce, mozzarella, and basil',
        offeringType: 'product',
        category: 'pizza',
        subcategory: 'classic',
        pricingType: 'fixed',
        basePrice: 1599, // $15.99 in cents
        currency: 'USD',
        isSchedulable: false,
        durationMinutes: 30,
        hasVariants: true,
        variants: [
          { id: 'small', name: 'Small', priceAdjustment: -200 },
          { id: 'medium', name: 'Medium', priceAdjustment: 0 },
          { id: 'large', name: 'Large', priceAdjustment: 300 },
        ],
        customFields: {
          dietary_restrictions: ['vegetarian'],
          spice_level: 'mild',
        },
        isActive: true,
        tags: ['popular', 'vegetarian'],
      };

      const result = schema.insertOfferingSchema.safeParse(validOffering);
      expect(result.success).toBe(true);
    });
  });

  describe('Workflow States Schema', () => {
    it('should have correct workflow states table structure', () => {
      const workflowState = schema.workflowStates;
      
      expect(workflowState).toBeDefined();
      expect(workflowState.tenantId).toBeDefined();
      expect(workflowState.workflowType).toBeDefined();
      expect(workflowState.name).toBeDefined();
      expect(workflowState.displayName).toBeDefined();
      expect(workflowState.stateType).toBeDefined();
      expect(workflowState.color).toBeDefined();
      expect(workflowState.isSystem).toBeDefined();
    });

    it('should validate workflow state insert schema', () => {
      const validWorkflowState = {
        tenantId: 'tenant-123',
        workflowType: 'transaction',
        name: 'preparing',
        displayName: 'Preparing Order',
        stateType: 'intermediate',
        color: '#3B82F6',
        description: 'Order is being prepared in the kitchen',
        isSystem: false,
        displayOrder: 2,
      };

      const result = schema.insertWorkflowStateSchema.safeParse(validWorkflowState);
      expect(result.success).toBe(true);
    });
  });

  describe('Transactions Schema', () => {
    it('should have correct transactions table structure', () => {
      const transaction = schema.transactions;
      
      expect(transaction).toBeDefined();
      expect(transaction.tenantId).toBeDefined();
      expect(transaction.transactionType).toBeDefined();
      expect(transaction.transactionNumber).toBeDefined();
      expect(transaction.customerPhone).toBeDefined();
      expect(transaction.offeringId).toBeDefined();
      expect(transaction.scheduledAt).toBeDefined();
      expect(transaction.amount).toBeDefined();
      expect(transaction.paymentStatus).toBeDefined();
      expect(transaction.currentStateId).toBeDefined();
      expect(transaction.customFields).toBeDefined();
    });

    it('should validate transaction insert schema', () => {
      const validTransaction = {
        tenantId: 'tenant-123',
        transactionType: 'order',
        customerPhone: '+1234567890',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        offeringId: 'offering-123',
        scheduledAt: new Date('2024-12-25T18:00:00Z'),
        durationMinutes: 30,
        timezone: 'America/New_York',
        amount: 1599,
        currency: 'USD',
        paymentStatus: 'pending',
        customFields: {
          delivery_address: '123 Main St, City, State 12345',
          special_instructions: 'Ring doorbell twice',
        },
        notes: 'Customer prefers contactless delivery',
        priority: 'normal',
        source: 'whatsapp',
      };

      const result = schema.insertTransactionSchema.safeParse(validTransaction);
      expect(result.success).toBe(true);
    });
  });

  describe('Bot Flows Schema', () => {
    it('should have correct bot flows table structure', () => {
      const botFlow = schema.botFlows;
      
      expect(botFlow).toBeDefined();
      expect(botFlow.tenantId).toBeDefined();
      expect(botFlow.name).toBeDefined();
      expect(botFlow.flowType).toBeDefined();
      expect(botFlow.startNodeId).toBeDefined();
      expect(botFlow.isActive).toBeDefined();
      expect(botFlow.isDefault).toBeDefined();
      expect(botFlow.version).toBeDefined();
      expect(botFlow.variables).toBeDefined();
    });

    it('should validate bot flow insert schema', () => {
      const validBotFlow = {
        tenantId: 'tenant-123',
        name: 'Restaurant Order Flow',
        description: 'Complete flow for taking restaurant orders',
        flowType: 'conversation',
        startNodeId: 'node-greeting',
        isActive: true,
        isDefault: true,
        version: 1,
        variables: {
          customer_name: { type: 'string', required: true },
          order_items: { type: 'array', required: true },
          delivery_address: { type: 'string', required: false },
        },
      };

      const result = schema.insertBotFlowSchema.safeParse(validBotFlow);
      expect(result.success).toBe(true);
    });
  });

  describe('Bot Flow Nodes Schema', () => {
    it('should have correct bot flow nodes table structure', () => {
      const botFlowNode = schema.botFlowNodes;
      
      expect(botFlowNode).toBeDefined();
      expect(botFlowNode.flowId).toBeDefined();
      expect(botFlowNode.nodeType).toBeDefined();
      expect(botFlowNode.name).toBeDefined();
      expect(botFlowNode.positionX).toBeDefined();
      expect(botFlowNode.positionY).toBeDefined();
      expect(botFlowNode.config).toBeDefined();
      expect(botFlowNode.connections).toBeDefined();
    });

    it('should validate bot flow node insert schema', () => {
      const validBotFlowNode = {
        flowId: 'flow-123',
        nodeType: 'question',
        name: 'Ask Customer Name',
        positionX: 100,
        positionY: 200,
        config: {
          question: {
            text: 'What is your name?',
            fieldName: 'customer_name',
            fieldType: 'text',
            required: true,
            validation: [
              { type: 'min', value: 2, message: 'Name must be at least 2 characters' },
            ],
          },
        },
        connections: [
          { targetNodeId: 'node-menu', condition: null, label: 'Next' },
        ],
      };

      const result = schema.insertBotFlowNodeSchema.safeParse(validBotFlowNode);
      expect(result.success).toBe(true);
    });
  });

  describe('Schema Relationships', () => {
    it('should have correct foreign key relationships', () => {
      // Test that schema definitions include proper references
      expect(schema.customFields.tenantId).toBeDefined();
      expect(schema.offerings.tenantId).toBeDefined();
      expect(schema.workflowStates.tenantId).toBeDefined();
      expect(schema.transactions.tenantId).toBeDefined();
      expect(schema.transactions.offeringId).toBeDefined();
      expect(schema.transactions.currentStateId).toBeDefined();
      expect(schema.botFlows.tenantId).toBeDefined();
      expect(schema.botFlowNodes.flowId).toBeDefined();
      expect(schema.botFlowExecutions.flowId).toBeDefined();
      expect(schema.botFlowExecutions.conversationId).toBeDefined();
    });

    it('should support tenant isolation through tenant_id fields', () => {
      const tenantSpecificTables = [
        schema.customFields,
        schema.offerings,
        schema.workflowStates,
        schema.workflowTransitions,
        schema.transactions,
        schema.botFlows,
      ];

      tenantSpecificTables.forEach(table => {
        expect(table.tenantId).toBeDefined();
      });
    });
  });

  describe('Type Safety', () => {
    it('should provide correct TypeScript types', () => {
      // Test that types are properly exported
      const businessType: schema.BusinessType = {
        id: 'bt-123',
        name: 'restaurant',
        displayName: 'Restaurant',
        category: 'hospitality',
        description: 'Restaurant business type',
        terminology: {},
        defaultConfig: {},
        isSystem: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const offering: schema.Offering = {
        id: 'off-123',
        tenantId: 'tenant-123',
        name: 'Pizza',
        description: 'Delicious pizza',
        offeringType: 'product',
        category: 'food',
        subcategory: 'pizza',
        pricingType: 'fixed',
        basePrice: 1599,
        currency: 'USD',
        pricingConfig: {},
        isSchedulable: false,
        durationMinutes: null,
        availabilityConfig: {},
        hasVariants: false,
        variants: [],
        customFields: {},
        isActive: true,
        displayOrder: 0,
        tags: [],
        images: [],
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const transaction: schema.Transaction = {
        id: 'tx-123',
        tenantId: 'tenant-123',
        transactionType: 'order',
        transactionNumber: 'OR000001',
        customerPhone: '+1234567890',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        offeringId: 'off-123',
        scheduledAt: new Date(),
        durationMinutes: 30,
        timezone: 'UTC',
        amount: 1599,
        currency: 'USD',
        paymentStatus: 'pending',
        paymentMethod: null,
        paymentReference: null,
        currentStateId: 'state-123',
        workflowHistory: [],
        customFields: {},
        notes: null,
        internalNotes: null,
        tags: [],
        priority: 'normal',
        source: 'whatsapp',
        conversationId: 'conv-123',
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // If these compile without errors, the types are correct
      expect(businessType.id).toBe('bt-123');
      expect(offering.name).toBe('Pizza');
      expect(transaction.amount).toBe(1599);
    });
  });
});