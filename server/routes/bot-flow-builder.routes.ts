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

    const result = await botFlowService.listBotFlows(tenantId, {
      businessType: businessType as string,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      isTemplate: isTemplate === 'true' ? true : isTemplate === 'false' ? false : undefined,
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
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
    const createRequest = req.body;

    const result = await botFlowService.createBotFlow(tenantId, createRequest);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.status(201).json(result.data);
  } catch (error) {
    console.error('Error creating bot flow:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as botFlowBuilderRoutes };