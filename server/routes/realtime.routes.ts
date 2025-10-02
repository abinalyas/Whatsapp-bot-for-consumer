/**
 * Real-time Routes
 * Handles Server-Sent Events for real-time notifications
 */

import { Router, Request, Response } from 'express';
import { EventEmitter } from 'events';

export function createRealtimeRoutes(): Router {
  const router = Router();
  
  // Event emitter for real-time updates
  const eventEmitter = new EventEmitter();
  
  // Store active connections
  const activeConnections = new Map<string, Response>();
  
  /**
   * SSE endpoint for real-time updates
   */
  router.get('/events/:tenantId', (req: Request, res: Response) => {
    const { tenantId } = req.params;
    const connectionId = `${tenantId}-${Date.now()}`;
    
    console.log(`🔗 New SSE connection: ${connectionId} for tenant: ${tenantId}`);
    
    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });
    
    // Store connection
    activeConnections.set(connectionId, res);
    
    // Send initial connection message
    res.write(`data: ${JSON.stringify({
      type: 'connected',
      message: 'Real-time updates connected',
      timestamp: new Date().toISOString()
    })}\n\n`);
    
    // Handle client disconnect
    req.on('close', () => {
      console.log(`🔌 SSE connection closed: ${connectionId}`);
      activeConnections.delete(connectionId);
    });
    
    // Handle client abort
    req.on('aborted', () => {
      console.log(`❌ SSE connection aborted: ${connectionId}`);
      activeConnections.delete(connectionId);
    });
  });
  
  /**
   * Broadcast new appointment to all connected clients for a tenant
   */
  router.post('/broadcast/:tenantId', (req: Request, res: Response) => {
    const { tenantId } = req.params;
    const { type, data } = req.body;
    
    console.log(`📡 Broadcasting ${type} to tenant ${tenantId}`);
    
    // Find all connections for this tenant
    const tenantConnections = Array.from(activeConnections.entries())
      .filter(([id, _]) => id.startsWith(tenantId));
    
    if (tenantConnections.length === 0) {
      console.log(`⚠️ No active connections for tenant ${tenantId}`);
      return res.json({ success: true, message: 'No active connections' });
    }
    
    // Send to all tenant connections
    const message = {
      type,
      data,
      timestamp: new Date().toISOString()
    };
    
    let sentCount = 0;
    tenantConnections.forEach(([connectionId, response]) => {
      try {
        response.write(`data: ${JSON.stringify(message)}\n\n`);
        sentCount++;
      } catch (error) {
        console.error(`❌ Error sending to connection ${connectionId}:`, error);
        activeConnections.delete(connectionId);
      }
    });
    
    console.log(`✅ Sent ${type} to ${sentCount} connections for tenant ${tenantId}`);
    res.json({ 
      success: true, 
      message: `Sent to ${sentCount} connections`,
      sentCount 
    });
  });
  
  /**
   * Get connection status
   */
  router.get('/status/:tenantId', (req: Request, res: Response) => {
    const { tenantId } = req.params;
    
    const tenantConnections = Array.from(activeConnections.entries())
      .filter(([id, _]) => id.startsWith(tenantId));
    
    res.json({
      tenantId,
      activeConnections: tenantConnections.length,
      connections: tenantConnections.map(([id, _]) => id)
    });
  });
  
  return router;
}
