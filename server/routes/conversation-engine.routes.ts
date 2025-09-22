/**
 * Conversation Engine API Routes
 * RESTful endpoints for managing dynamic conversation execution
 */

import { Router } from 'express';
import { DynamicMessageProcessorService } from '../services/dynamic-message-processor.service';
import { tenantContextMiddleware } from '../middleware/tenant-context.middleware';

const router = Router();

// Apply tenant context middleware to all routes
router.use(tenantContextMiddleware);

// Initialize service
const dynamicProcessor = new DynamicMessageProcessorService(process.env.DATABASE_URL!);

// ===== CONVERSATION MANAGEMENT ROUTES =====

/**
 * POST /api/conversations/:conversationId/process
 * Process a message through the dynamic conversation engine
 */
router.post('/:conversationId/process', async (req, res) => {
  try {
    const { tenantId } = req.tenantContext!;
    const { conversationId } = req.params;
    const { phoneNumber, message } = req.body;

    if (!phoneNumber || !message) {
      return res.status(400).json({ 
        error: 'phoneNumber and message are required' 
      });
    }

    const result = await dynamicProcessor.processMessage(
      tenantId,
      conversationId,
      phoneNumber,
      message
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json(result.data);
  } catch (error) {
    console.error('Error processing conversation message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/conversations/:conversationId/status
 * Get conversation execution status
 */
router.get('/:conversationId/status', async (req, res) => {
  try {
    const { tenantId } = req.tenantContext!;
    const { conversationId } = req.params;

    const result = await dynamicProcessor.getConversationStatus(tenantId, conversationId);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json(result.data);
  } catch (error) {
    console.error('Error getting conversation status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/conversations/:conversationId/reset
 * Reset conversation flow execution
 */
router.post('/:conversationId/reset', async (req, res) => {
  try {
    const { tenantId } = req.tenantContext!;
    const { conversationId } = req.params;

    const result = await dynamicProcessor.resetConversation(tenantId, conversationId);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error resetting conversation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== DYNAMIC PROCESSING MANAGEMENT ROUTES =====

/**
 * POST /api/conversations/enable-dynamic
 * Enable dynamic processing for tenant with specified flow
 */
router.post('/enable-dynamic', async (req, res) => {
  try {
    const { tenantId } = req.tenantContext!;
    const { flowId } = req.body;

    if (!flowId) {
      return res.status(400).json({ 
        error: 'flowId is required' 
      });
    }

    const result = await dynamicProcessor.enableDynamicProcessing(tenantId, flowId);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ success: true, message: 'Dynamic processing enabled' });
  } catch (error) {
    console.error('Error enabling dynamic processing:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/conversations/disable-dynamic
 * Disable dynamic processing for tenant
 */
router.post('/disable-dynamic', async (req, res) => {
  try {
    const { tenantId } = req.tenantContext!;

    const result = await dynamicProcessor.disableDynamicProcessing(tenantId);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ success: true, message: 'Dynamic processing disabled' });
  } catch (error) {
    console.error('Error disabling dynamic processing:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== TESTING AND DEBUG ROUTES =====

/**
 * POST /api/conversations/test-flow
 * Test a bot flow with sample input
 */
router.post('/test-flow', async (req, res) => {
  try {
    const { tenantId } = req.tenantContext!;
    const { flowId, testMessages } = req.body;

    if (!flowId || !testMessages || !Array.isArray(testMessages)) {
      return res.status(400).json({ 
        error: 'flowId and testMessages array are required' 
      });
    }

    // Create a test conversation ID
    const testConversationId = `test_${Date.now()}`;
    const testPhoneNumber = '+1234567890';

    const results = [];

    // Enable dynamic processing for this test
    await dynamicProcessor.enableDynamicProcessing(tenantId, flowId);

    // Process each test message
    for (let i = 0; i < testMessages.length; i++) {
      const message = testMessages[i];
      
      const result = await dynamicProcessor.processMessage(
        tenantId,
        testConversationId,
        testPhoneNumber,
        message
      );

      results.push({
        input: message,
        success: result.success,
        response: result.success ? result.data?.response : result.error?.message,
        step: i + 1,
      });

      // If processing failed or conversation ended, stop
      if (!result.success || !result.data?.shouldContinue) {
        break;
      }
    }

    // Clean up test conversation
    await dynamicProcessor.resetConversation(tenantId, testConversationId);

    res.json({
      success: true,
      testResults: results,
      totalSteps: results.length,
    });
  } catch (error) {
    console.error('Error testing bot flow:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/conversations/debug/:conversationId
 * Get detailed debug information for a conversation
 */
router.get('/debug/:conversationId', async (req, res) => {
  try {
    const { tenantId } = req.tenantContext!;
    const { conversationId } = req.params;

    // This would return detailed execution history, variables, etc.
    // For now, return basic status
    const statusResult = await dynamicProcessor.getConversationStatus(tenantId, conversationId);

    if (!statusResult.success) {
      return res.status(400).json({ error: statusResult.error });
    }

    res.json({
      conversationId,
      tenantId,
      status: statusResult.data,
      debugInfo: {
        timestamp: new Date().toISOString(),
        message: 'Debug information would include execution history, variable states, node transitions, etc.',
      },
    });
  } catch (error) {
    console.error('Error getting debug information:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as conversationEngineRoutes };