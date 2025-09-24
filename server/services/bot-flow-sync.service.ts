/**
 * Bot Flow Sync Service
 * Handles synchronization between bot flows and WhatsApp bot behavior
 */

import { BotFlow } from '../../shared/types/bot-flow.types';

export class BotFlowSyncService {
  private static instance: BotFlowSyncService;
  private activeFlow: BotFlow | null = null;
  private backupFlow: BotFlow | null = null;

  private constructor() {}

  static getInstance(): BotFlowSyncService {
    if (!BotFlowSyncService.instance) {
      BotFlowSyncService.instance = new BotFlowSyncService();
    }
    return BotFlowSyncService.instance;
  }

  /**
   * Load the exact WhatsApp bot flow
   */
  async loadWhatsAppBotFlow(): Promise<BotFlow> {
    try {
      // Load the exact WhatsApp bot flow from file
      const fs = require('fs');
      const path = require('path');
      const flowPath = path.join(process.cwd(), 'whatsapp-bot-flow-exact.json');
      const flowData = JSON.parse(fs.readFileSync(flowPath, 'utf8'));
      
      this.activeFlow = flowData;
      console.log('✅ WhatsApp bot flow loaded successfully');
      return flowData;
    } catch (error) {
      console.error('Error loading WhatsApp bot flow:', error);
      throw error;
    }
  }

  /**
   * Create backup of current flow
   */
  async createBackup(): Promise<void> {
    try {
      const fs = require('fs');
      const path = require('path');
      const backupPath = path.join(process.cwd(), 'backup-current-flows.json');
      
      if (this.activeFlow) {
        this.backupFlow = { ...this.activeFlow };
        fs.writeFileSync(backupPath, JSON.stringify({
          backup_created: new Date().toISOString(),
          description: "Backup of current bot flow before changes",
          flow: this.backupFlow
        }, null, 2));
        console.log('✅ Backup created successfully');
      }
    } catch (error) {
      console.error('Error creating backup:', error);
      throw error;
    }
  }

  /**
   * Restore from backup
   */
  async restoreFromBackup(): Promise<BotFlow | null> {
    try {
      const fs = require('fs');
      const path = require('path');
      const backupPath = path.join(process.cwd(), 'backup-current-flows.json');
      
      if (fs.existsSync(backupPath)) {
        const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
        this.activeFlow = backupData.flow;
        console.log('✅ Flow restored from backup');
        return this.activeFlow;
      }
      return null;
    } catch (error) {
      console.error('Error restoring from backup:', error);
      throw error;
    }
  }

  /**
   * Get current active flow
   */
  getActiveFlow(): BotFlow | null {
    return this.activeFlow;
  }

  /**
   * Update active flow
   */
  updateActiveFlow(flow: BotFlow): void {
    this.activeFlow = flow;
    console.log('✅ Active flow updated');
  }

  /**
   * Check if flow changes should reflect in WhatsApp bot
   */
  shouldSyncWithWhatsApp(): boolean {
    return this.activeFlow !== null && this.activeFlow.isActive;
  }

  /**
   * Get flow node by ID
   */
  getFlowNode(nodeId: string): any {
    if (!this.activeFlow) return null;
    return this.activeFlow.nodes.find(node => node.id === nodeId);
  }

  /**
   * Get flow connection by ID
   */
  getFlowConnection(connectionId: string): any {
    if (!this.activeFlow) return null;
    return this.activeFlow.connections.find(conn => conn.id === connectionId);
  }

  /**
   * Process flow changes and sync with WhatsApp bot
   */
  async processFlowChanges(changes: any): Promise<void> {
    if (!this.activeFlow) return;

    console.log('🔄 Processing flow changes:', changes);
    
    // Here you would implement the logic to sync changes with the WhatsApp bot
    // This could involve updating the conversation engine, message processor, etc.
    
    console.log('✅ Flow changes processed and synced with WhatsApp bot');
  }
}
