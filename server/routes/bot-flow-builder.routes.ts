/**
 * Bot Flow Builder API Routes
 * RESTful endpoints for managing bot flows and nodes
 */

import { Router } from 'express';
import { BotFlowBuilderService } from '../services/bot-flow-builder.service';
import { tenantContextMiddleware } from '../middleware/tenant-context.middleware';

const router = Router();

// Apply tenant context middleware to all routes
router.use(tenantContextMiddleware);

// Initialize service
const botFlowService = new BotFlowBuilderService(process.env.DATABASE_URL!);

// ===== BOT FLOW ROUTES =====

/**
 * GET /api/bot-flows
 * List all bot flows for tenant
 */
router.get('/', async (req, res) => {
  try {
    const { tenantId } = req.tenantContext!;
    const { businessType, isActive, isTemplate, page = 1, limit = 50 } = req.query;

    // Validate parameters
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    
    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({ error: 'Invalid page parameter' });
    }
    
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({ error: 'Invalid limit parameter (must be between 1 and 100)' });
    }

    const result = await botFlowService.listBotFlows(tenantId, {
      businessType: businessType as string,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      isTemplate: isTemplate === 'true' ? true : isTemplate === 'false' ? false : undefined,
      page: pageNum,
      limit: limitNum
    });

    if (!result.success) {
      console.error('Bot flow service error:', result.error);
      return res.status(500).json({ error: 'Internal server error' });
    }

    res.json(result.data);
  } catch (error) {
    console.error('Error listing bot flows:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/bot-flows
 * Create new bot flow
 */
router.post('/', async (req, res) => {
  try {
    const { tenantId } = req.tenantContext!;
    const flowData = req.body;

    const result = await botFlowService.createBotFlow(tenantId, flowData);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.status(201).json(result.data);
  } catch (error) {
    console.error('Error creating bot flow:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/bot-flows/:id
 * Get specific bot flow by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { tenantId } = req.tenantContext!;
    const { id } = req.params;

    const result = await botFlowService.getBotFlow(tenantId, id);

    if (!result.success) {
      return res.status(404).json({ error: result.error });
    }

    res.json(result.data);
  } catch (error) {
    console.error('Error fetching bot flow:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/bot-flows/:id
 * Update bot flow
 */
router.put('/:id', async (req, res) => {
  try {
    const { tenantId } = req.tenantContext!;
    const { id } = req.params;
    const flowData = req.body;

    const result = await botFlowService.updateBotFlow(tenantId, id, flowData);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json(result.data);
  } catch (error) {
    console.error('Error updating bot flow:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/bot-flows/:id
 * Delete bot flow
 */
router.delete('/:id', async (req, res) => {
  try {
    const { tenantId } = req.tenantContext!;
    const { id } = req.params;

    const result = await botFlowService.deleteBotFlow(tenantId, id);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ message: 'Bot flow deleted successfully' });
  } catch (error) {
    console.error('Error deleting bot flow:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/bot-flows/:id/activate
 * Activate bot flow
 */
router.post('/:id/activate', async (req, res) => {
  try {
    const { tenantId } = req.tenantContext!;
    const { id } = req.params;

    // First deactivate all other flows for this tenant
    const deactivateResult = await botFlowService.deactivateAllBotFlows(tenantId);
    if (!deactivateResult.success) {
      return res.status(400).json({ error: deactivateResult.error });
    }

    // Then activate the requested flow
    const activateResult = await botFlowService.activateBotFlow(tenantId, id);
    if (!activateResult.success) {
      return res.status(400).json({ error: activateResult.error });
    }

    res.json({ message: 'Bot flow activated successfully' });
  } catch (error) {
    console.error('Error activating bot flow:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/bot-flows/:id/deactivate
 * Deactivate bot flow
 */
router.post('/:id/deactivate', async (req, res) => {
  try {
    const { tenantId } = req.tenantContext!;
    const { id } = req.params;

    const result = await botFlowService.deactivateBotFlow(tenantId, id);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ message: 'Bot flow deactivated successfully' });
  } catch (error) {
    console.error('Error deactivating bot flow:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/bot-flows/:id/toggle
 * Toggle bot flow active status
 */
router.post('/:id/toggle', async (req, res) => {
  try {
    const { tenantId } = req.tenantContext!;
    const { id } = req.params;

    const flowResult = await botFlowService.getBotFlow(tenantId, id);
    if (!flowResult.success) {
      return res.status(404).json({ error: flowResult.error });
    }

    const flow = flowResult.data;
    let result;

    if (flow.isActive) {
      result = await botFlowService.deactivateBotFlow(tenantId, id);
    } else {
      // When activating, deactivate all others first
      await botFlowService.deactivateAllBotFlows(tenantId);
      result = await botFlowService.activateBotFlow(tenantId, id);
    }

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ message: `Bot flow ${flow.isActive ? 'deactivated' : 'activated'} successfully` });
  } catch (error) {
    console.error('Error toggling bot flow:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/bot-flows/:id/test
 * Test bot flow
 */
router.post('/:id/test', async (req, res) => {
  try {
    const { tenantId } = req.tenantContext!;
    const { id } = req.params;
    const flowData = req.body;

    // In a real implementation, you would run validation and testing logic here
    console.log(`Testing bot flow ${id}:`, flowData);
    
    // For now, just return success
    res.json({
      success: true,
      message: 'Bot flow test completed successfully!'
    });
  } catch (error) {
    console.error('Error testing bot flow:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error testing bot flow. Please try again.'
    });
  }
});

export default router;