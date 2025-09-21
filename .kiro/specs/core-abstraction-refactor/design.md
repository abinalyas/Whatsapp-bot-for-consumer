# Core Abstraction Refactor Design

## Overview

This design document outlines the architecture for refactoring the multi-tenant SaaS platform to support flexible business models through core abstractions. The system will transform from a service-booking platform to a generalized business automation platform.

## Architecture

### Business Type Configuration System

```typescript
interface BusinessType {
  id: string;
  name: string;
  category: 'service' | 'retail' | 'hospitality' | 'healthcare' | 'custom';
  terminology: {
    offering: string; // "Service", "Product", "Menu Item", "Treatment"
    transaction: string; // "Booking", "Order", "Reservation", "Appointment"
    customer: string; // "Client", "Patient", "Guest", "Customer"
  };
  defaultFields: CustomField[];
  defaultWorkflows: WorkflowTemplate[];
  botFlowTemplate: BotFlowTemplate;
}
```

### Flexible Offerings System

```typescript
interface Offering {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  type: 'service' | 'product' | 'reservation' | 'appointment';
  category?: string;
  pricing: PricingConfig;
  availability?: AvailabilityConfig;
  customFields: Record<string, any>;
  variants?: OfferingVariant[];
  metadata: Record<string, any>;
}

interface PricingConfig {
  type: 'fixed' | 'variable' | 'time_based' | 'tiered';
  basePrice: number;
  currency: string;
  modifiers?: PriceModifier[];
}

interface OfferingVariant {
  id: string;
  name: string;
  priceAdjustment: number;
  attributes: Record<string, string>;
}
```

### Generalized Transaction System

```typescript
interface Transaction {
  id: string;
  tenantId: string;
  type: string; // Configurable: "booking", "order", "reservation"
  status: string; // Configurable workflow states
  customerId: string;
  offeringId?: string;
  scheduledAt?: Date;
  amount: number;
  currency: string;
  customFields: Record<string, any>;
  workflow: TransactionWorkflow;
  metadata: Record<string, any>;
}

interface TransactionWorkflow {
  currentState: string;
  states: WorkflowState[];
  transitions: WorkflowTransition[];
  automations: WorkflowAutomation[];
}
```

### Dynamic Bot Flow System

```typescript
interface BotFlow {
  id: string;
  tenantId: string;
  name: string;
  isActive: boolean;
  startNode: string;
  nodes: BotFlowNode[];
  variables: BotFlowVariable[];
}

interface BotFlowNode {
  id: string;
  type: 'message' | 'question' | 'condition' | 'action' | 'integration';
  config: NodeConfig;
  connections: NodeConnection[];
}

interface NodeConfig {
  message?: {
    text: string;
    type: 'text' | 'interactive' | 'template';
    buttons?: Button[];
    list?: ListConfig;
  };
  question?: {
    text: string;
    fieldName: string;
    fieldType: 'text' | 'number' | 'date' | 'choice' | 'phone';
    validation?: ValidationRule[];
    required: boolean;
  };
  condition?: {
    variable: string;
    operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
    value: any;
  };
  action?: {
    type: 'create_transaction' | 'send_notification' | 'update_data';
    config: Record<string, any>;
  };
}
```

## Components and Interfaces

### Business Configuration Service

```typescript
class BusinessConfigurationService {
  async getBusinessTypes(): Promise<BusinessType[]>
  async getBusinessType(id: string): Promise<BusinessType>
  async createCustomBusinessType(config: BusinessTypeConfig): Promise<BusinessType>
  async updateTenantBusinessType(tenantId: string, businessTypeId: string): Promise<void>
  async getTenantConfiguration(tenantId: string): Promise<TenantBusinessConfig>
}
```

### Flexible Offerings Service

```typescript
class OfferingsService {
  async createOffering(tenantId: string, offering: CreateOfferingRequest): Promise<Offering>
  async updateOffering(tenantId: string, offeringId: string, updates: UpdateOfferingRequest): Promise<Offering>
  async listOfferings(tenantId: string, filters?: OfferingFilters): Promise<PaginatedResponse<Offering>>
  async getOfferingsByCategory(tenantId: string, category: string): Promise<Offering[]>
  async addCustomField(tenantId: string, field: CustomFieldDefinition): Promise<void>
  async updatePricing(tenantId: string, offeringId: string, pricing: PricingConfig): Promise<void>
}
```

### Transaction Management Service

```typescript
class TransactionService {
  async createTransaction(tenantId: string, transaction: CreateTransactionRequest): Promise<Transaction>
  async updateTransactionStatus(tenantId: string, transactionId: string, status: string): Promise<Transaction>
  async processWorkflowTransition(tenantId: string, transactionId: string, transition: string): Promise<Transaction>
  async listTransactions(tenantId: string, filters?: TransactionFilters): Promise<PaginatedResponse<Transaction>>
  async getTransactionsByStatus(tenantId: string, status: string): Promise<Transaction[]>
  async executeAutomation(tenantId: string, transactionId: string, automation: WorkflowAutomation): Promise<void>
}
```

### Bot Flow Builder Service

```typescript
class BotFlowBuilderService {
  async createBotFlow(tenantId: string, flow: CreateBotFlowRequest): Promise<BotFlow>
  async updateBotFlow(tenantId: string, flowId: string, updates: UpdateBotFlowRequest): Promise<BotFlow>
  async validateBotFlow(tenantId: string, flow: BotFlow): Promise<ValidationResult>
  async deployBotFlow(tenantId: string, flowId: string): Promise<void>
  async testBotFlow(tenantId: string, flowId: string, testData: TestFlowData): Promise<TestResult>
  async getBotFlowTemplates(businessType: string): Promise<BotFlowTemplate[]>
}
```

## Data Models

### Custom Fields System

```typescript
interface CustomField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'multiselect' | 'file';
  required: boolean;
  validation?: ValidationRule[];
  options?: FieldOption[]; // For select/multiselect
  defaultValue?: any;
  metadata: Record<string, any>;
}

interface ValidationRule {
  type: 'min' | 'max' | 'pattern' | 'custom';
  value: any;
  message: string;
}
```

### Workflow System

```typescript
interface WorkflowState {
  id: string;
  name: string;
  type: 'initial' | 'intermediate' | 'final';
  color: string;
  description?: string;
}

interface WorkflowTransition {
  id: string;
  fromState: string;
  toState: string;
  name: string;
  conditions?: TransitionCondition[];
  actions?: TransitionAction[];
}

interface WorkflowAutomation {
  id: string;
  trigger: AutomationTrigger;
  conditions?: AutomationCondition[];
  actions: AutomationAction[];
}
```

## Error Handling

### Business Configuration Errors
- `BUSINESS_TYPE_NOT_FOUND`: When requested business type doesn't exist
- `INVALID_BUSINESS_CONFIG`: When business configuration is invalid
- `MIGRATION_FAILED`: When business type migration fails

### Offering Management Errors
- `OFFERING_NOT_FOUND`: When requested offering doesn't exist
- `INVALID_PRICING_CONFIG`: When pricing configuration is invalid
- `CUSTOM_FIELD_CONFLICT`: When custom field conflicts with existing fields

### Transaction Processing Errors
- `INVALID_WORKFLOW_STATE`: When workflow state is invalid
- `TRANSITION_NOT_ALLOWED`: When workflow transition is not permitted
- `AUTOMATION_FAILED`: When workflow automation fails

### Bot Flow Errors
- `INVALID_FLOW_STRUCTURE`: When bot flow structure is invalid
- `NODE_CONFIGURATION_ERROR`: When node configuration is incorrect
- `FLOW_EXECUTION_ERROR`: When bot flow execution fails

## Testing Strategy

### Unit Testing
- Business configuration service methods
- Offering management operations
- Transaction workflow processing
- Bot flow validation and execution
- Custom field management

### Integration Testing
- End-to-end business type setup
- Complete transaction workflows
- Bot flow execution with real conversations
- Cross-service data consistency

### Performance Testing
- Large-scale offering management
- High-volume transaction processing
- Complex bot flow execution
- Multi-tenant isolation under load

## Migration Strategy

### Phase 1: Schema Evolution
1. Add business type configuration tables
2. Extend existing tables with custom fields support
3. Create workflow and bot flow tables
4. Maintain backward compatibility

### Phase 2: Service Refactoring
1. Implement new abstraction services
2. Create migration utilities
3. Update existing services to use abstractions
4. Maintain API compatibility

### Phase 3: UI/UX Updates
1. Create business configuration interfaces
2. Build bot flow visual editor
3. Update offering and transaction management UIs
4. Implement business-specific dashboards

### Phase 4: Data Migration
1. Migrate existing tenants to new system
2. Provide migration tools for custom configurations
3. Validate data integrity
4. Remove deprecated components