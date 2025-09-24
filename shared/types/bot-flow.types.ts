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
  type: 'start' | 'message' | 'question' | 'action' | 'condition' | 'end';
  name: string;
  position: { x: number; y: number };
  configuration: any;
  connections: BotFlowConnection[];
  metadata: any;
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
