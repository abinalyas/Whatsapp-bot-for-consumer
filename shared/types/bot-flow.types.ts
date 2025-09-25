/**
 * Bot Flow Types
 * Type definitions for bot flow structures
 */

export interface BotFlow {
  id: string;
  name: string;
  description: string;
  businessType: string;
  isActive: boolean;
  isTemplate: boolean;
  version: string;
  nodes: BotFlowNode[];
  connections: BotFlowConnection[];
  variables: BotFlowVariable[];
  metadata: BotFlowMetadata;
}

export interface BotFlowNode {
  id: string;
  type: 'start' | 'message' | 'question' | 'action' | 'condition' | 'end' | 'service_message' | 'service_list' | 'date_picker' | 'time_slots' | 'booking_summary';
  name: string;
  position: { x: number; y: number };
  configuration: BotFlowNodeConfiguration;
  connections: BotFlowConnection[];
  metadata: any;
}

export interface BotFlowNodeConfiguration {
  // Common properties
  message?: string;
  question?: string;
  
  // Service message properties
  welcomeText?: string;
  serviceIntro?: string;
  instruction?: string;
  showEmojis?: boolean;
  
  // Question properties
  inputType?: 'text' | 'number' | 'email' | 'phone' | 'date' | 'time' | 'service';
  required?: boolean;
  validation?: string;
  
  // Date/Time properties
  minDate?: string;
  maxDate?: string;
  availableDays?: string[]; // ['monday', 'tuesday', etc.]
  timeSlots?: string[];
  
  // Service properties
  loadFromDatabase?: boolean;
  customServices?: Array<{
    name: string;
    price: number;
    description?: string;
  }>;
  
  // Dynamic content properties
  template?: string;
  fallbackMessage?: string;
  dataSource?: 'services' | 'appointments' | 'custom';
}

export interface BotFlowConnection {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  label: string;
}

export interface BotFlowVariable {
  name: string;
  type: string;
  description: string;
}

export interface BotFlowMetadata {
  version?: string;
  whatsappReplica?: boolean;
  createdAt?: string;
  backupAvailable?: boolean;
  restorePoint?: string;
  [key: string]: any;
}

export interface BotFlowSyncResult {
  success: boolean;
  message: string;
  flow?: BotFlow;
  error?: string;
}
