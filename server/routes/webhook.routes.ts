/**
 * Multi-Tenant WhatsApp Webhook Routes
 * Handles incoming WhatsApp webhooks with tenant routing and identification
 */

import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { WebhookRouterService } from '../services/webhook-router.service';
import { MessageProcessorService, WhatsAppWebhookPayload } from '../services/message-processor.service';
import { WhatsAppSenderService } from '../services/whatsapp-sender.service';

export interface WebhookVerificationRequest extends Request {
  query: {
    'hub.mode'?: string;
    'hub.verify_token'?: string;
    'hub.challenge'?: string;
  };
}

export interface WebhookMessageRequest extends Request {
  body: WhatsAppWebhookPayload;
  headers: {
    'x-hub-signature-256'?: string;
  };
}

export function createWebhookRoutes(
  messageProcessor: MessageProcessorService,
  whatsappSender: WhatsAppSenderService
): Router {
  const router = Router();

  // Initialize webhook router service
  const webhookRouter = new WebhookRouterService(
    process.env.DATABASE_URL || 'postgresql://localhost:5432/whatsapp_bot'
  );

  // ===== TENANT-SPECIFIC WEBHOOK VERIFICATION =====

  /**
   * Verify webhook endpoint for specific tenant (GET request from WhatsApp)
   */
  router.get('/whatsapp/:phoneNumberId', async (req: WebhookVerificationRequest, res: Response) => {
    try {
      const { phoneNumberId } = req.params;
      const verificationRequest = {
        'hub.mode': req.query['hub.mode'] as string,
        'hub.verify_token': req.query['hub.verify_token'] as string,
        'hub.challenge': req.query['hub.challenge'] as string,
      };

      console.log('Tenant-specific webhook verification request:', { phoneNumberId, ...verificationRequest });

      // Verify webhook for specific tenant
      const verificationResult = await webhookRouter.verifyWebhook(phoneNumberId, verificationRequest);

      if (verificationResult.success) {
        console.log(`Webhook verified successfully for phone number ID: ${phoneNumberId}`);
        res.status(200).send(verificationResult.challenge);
      } else {
        console.log(`Webhook verification failed for phone number ID: ${phoneNumberId}`, verificationResult.error);
        res.status(403).json({
          error: 'Webhook verification failed',
          details: verificationResult.error,
        });
      }
    } catch (error) {
      console.error('Webhook verification error:', error);
      res.status(500).json({
        error: 'WEBHOOK_VERIFICATION_FAILED',
        message: 'Failed to verify webhook',
      });
    }
  });

  /**
   * Legacy webhook verification (for backward compatibility)
   */
  router.get('/whatsapp', (req: WebhookVerificationRequest, res: Response) => {
    try {
      const mode = req.query['hub.mode'];
      const token = req.query['hub.verify_token'];
      const challenge = req.query['hub.challenge'];

      console.log('Legacy webhook verification request:', { mode, token, challenge });
      console.warn('Legacy webhook endpoint accessed - please migrate to /whatsapp/:phoneNumberId');

      // Verify the mode and token
      if (mode === 'subscribe') {
        // Use fallback verification token for legacy support
        if (token === process.env.WHATSAPP_VERIFY_TOKEN && challenge) {
          console.log('Legacy webhook verified successfully');
          res.status(200).send(challenge);
          return;
        }
      }

      console.log('Legacy webhook verification failed');
      res.status(403).send('Forbidden');
    } catch (error) {
      console.error('Legacy webhook verification error:', error);
      res.status(500).json({
        error: 'WEBHOOK_VERIFICATION_FAILED',
        message: 'Failed to verify webhook',
      });
    }
  });

  // ===== TENANT-SPECIFIC WEBHOOK MESSAGE PROCESSING =====

  /**
   * Process incoming WhatsApp messages for specific tenant (POST request from WhatsApp)
   */
  router.post('/whatsapp/:phoneNumberId', async (req: WebhookMessageRequest, res: Response) => {
    try {
      const { phoneNumberId } = req.params;
      const webhookPayload = req.body;
      const signature = req.headers['x-hub-signature-256'];

      console.log(`Received tenant-specific webhook payload for ${phoneNumberId}:`, JSON.stringify(webhookPayload, null, 2));

      // Route webhook to appropriate tenant
      const routingResult = await webhookRouter.routeWebhook(webhookPayload);

      if (!routingResult.success) {
        console.error('Webhook routing failed:', routingResult.error);
        return res.status(400).json({
          error: 'Webhook routing failed',
          details: routingResult.error,
        });
      }

      // Verify the phone number ID matches the route parameter
      if (routingResult.phoneNumberId !== phoneNumberId) {
        console.error(`Phone number ID mismatch: route=${phoneNumberId}, payload=${routingResult.phoneNumberId}`);
        return res.status(400).json({
          error: 'Phone number ID mismatch',
        });
      }

      const tenant = routingResult.tenant!;

      // Verify webhook signature with tenant-specific secret (if available)
      if (signature) {
        // TODO: Get tenant-specific webhook secret from settings
        const webhookSecret = process.env.WHATSAPP_WEBHOOK_SECRET || 'default-secret';
        if (!verifyWebhookSignature(JSON.stringify(webhookPayload), signature, webhookSecret)) {
          console.log('Invalid webhook signature for tenant:', tenant.id);
          return res.status(401).json({
            error: 'INVALID_SIGNATURE',
            message: 'Webhook signature verification failed',
          });
        }
      }

      // Add tenant context to the webhook payload
      const enhancedPayload = {
        ...webhookPayload,
        tenantContext: {
          tenantId: tenant.id,
          domain: tenant.domain,
          phoneNumberId: routingResult.phoneNumberId,
        },
      };

      // Process the webhook payload with tenant context
      const result = await messageProcessor.processWebhookPayload(enhancedPayload);

      if (!result.success) {
        console.error('Failed to process webhook payload:', result.error);
        return res.status(500).json({
          error: result.error!.code,
          message: result.error!.message,
        });
      }

      const processedMessages = result.data!;
      console.log(`Successfully processed ${processedMessages.length} messages for tenant ${tenant.id}`);

      // Send responses for messages that generated bot responses
      const sendPromises = processedMessages
        .filter(msg => msg.response)
        .map(async (msg) => {
          try {
            const sendResult = await whatsappSender.sendMessage(
              msg.tenantId || tenant.id,
              msg.phoneNumber,
              msg.response!
            );

            if (!sendResult.success) {
              console.error(`Failed to send response for message ${msg.messageId}:`, sendResult.error);
            }

            return sendResult;
          } catch (error) {
            console.error(`Error sending response for message ${msg.messageId}:`, error);
            return {
              success: false,
              error: {
                code: 'SEND_FAILED',
                message: 'Failed to send response',
              },
            };
          }
        });

      // Wait for all responses to be sent
      const sendResults = await Promise.all(sendPromises);
      const successfulSends = sendResults.filter((r: any) => r.success).length;
      const failedSends = sendResults.length - successfulSends;

      console.log(`Sent ${successfulSends} responses, ${failedSends} failed for tenant ${tenant.id}`);

      // Return success response to WhatsApp
      res.status(200).json({
        success: true,
        tenantId: tenant.id,
        processed: processedMessages.length,
        responses_sent: successfulSends,
        responses_failed: failedSends,
      });

    } catch (error) {
      console.error('Tenant-specific webhook processing error:', error);
      res.status(500).json({
        error: 'WEBHOOK_PROCESSING_ERROR',
        message: 'Internal server error processing webhook',
      });
    }
  });

  /**
   * Legacy webhook processing (for backward compatibility)
   */
  router.post('/whatsapp', async (req: WebhookMessageRequest, res: Response) => {
    try {
      const payload = req.body;
      const signature = req.headers['x-hub-signature-256'];

      console.log('Legacy webhook payload received:', JSON.stringify(payload, null, 2));
      console.warn('Legacy webhook endpoint accessed - please migrate to /whatsapp/:phoneNumberId');

      // Verify webhook signature (simplified - in production would verify against tenant-specific secrets)
      if (signature && !verifyWebhookSignature(JSON.stringify(payload), signature, process.env.WHATSAPP_WEBHOOK_SECRET || 'default-secret')) {
        console.log('Invalid webhook signature');
        return res.status(401).json({
          error: 'INVALID_SIGNATURE',
          message: 'Webhook signature verification failed',
        });
      }

      // Process the webhook payload without tenant context (legacy mode)
      const result = await messageProcessor.processWebhookPayload(payload);

      if (!result.success) {
        console.error('Failed to process legacy webhook payload:', result.error);
        return res.status(500).json({
          error: result.error!.code,
          message: result.error!.message,
        });
      }

      const processedMessages = result.data!;
      console.log(`Successfully processed ${processedMessages.length} legacy messages`);

      // Send responses for messages that generated bot responses
      const sendPromises = processedMessages
        .filter(msg => msg.response)
        .map(async (msg) => {
          try {
            const sendResult = await whatsappSender.sendMessage(
              msg.tenantId,
              msg.phoneNumber,
              msg.response!
            );

            if (!sendResult.success) {
              console.error(`Failed to send response for message ${msg.messageId}:`, sendResult.error);
            }

            return sendResult;
          } catch (error) {
            console.error(`Error sending response for message ${msg.messageId}:`, error);
            return {
              success: false,
              error: {
                code: 'SEND_FAILED',
                message: 'Failed to send response',
              },
            };
          }
        });

      // Wait for all responses to be sent
      const sendResults = await Promise.all(sendPromises);
      const successfulSends = sendResults.filter((r: any) => r.success).length;
      const failedSends = sendResults.length - successfulSends;

      console.log(`Sent ${successfulSends} responses, ${failedSends} failed (legacy)`);

      // Return success response to WhatsApp
      res.status(200).json({
        success: true,
        legacy: true,
        processed: processedMessages.length,
        responses_sent: successfulSends,
        responses_failed: failedSends,
      });

    } catch (error) {
      console.error('Legacy webhook processing error:', error);
      res.status(500).json({
        error: 'WEBHOOK_PROCESSING_ERROR',
        message: 'Internal server error processing webhook',
      });
    }
  });

  // ===== WEBHOOK STATUS AND HEALTH =====

  /**
   * Get webhook status and health
   */
  router.get('/whatsapp/status', async (req: Request, res: Response) => {
    try {
      // In a real implementation, would check webhook health across all tenants
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        webhook_url: `${req.protocol}://${req.get('host')}/api/webhook/whatsapp`,
        verification_url: `${req.protocol}://${req.get('host')}/api/webhook/whatsapp`,
      });
    } catch (error) {
      console.error('Status check error:', error);
      res.status(500).json({
        error: 'STATUS_CHECK_FAILED',
        message: 'Failed to check webhook status',
      });
    }
  });

  // ===== TENANT-SPECIFIC WEBHOOK MANAGEMENT =====

  /**
   * Register phone number ID for tenant
   */
  router.post('/whatsapp/:phoneNumberId/register', async (req: Request, res: Response) => {
    try {
      const { phoneNumberId } = req.params;
      const { tenantId } = req.body;

      if (!tenantId) {
        return res.status(400).json({
          error: 'MISSING_TENANT_ID',
          message: 'Tenant ID is required',
        });
      }

      const registrationResult = await webhookRouter.registerPhoneNumberId(tenantId, phoneNumberId);

      if (registrationResult.success) {
        res.status(200).json({
          success: true,
          message: 'Phone number ID registered successfully',
          phoneNumberId,
          tenantId,
        });
      } else {
        res.status(400).json({
          success: false,
          error: registrationResult.error,
        });
      }
    } catch (error) {
      console.error('Phone number registration error:', error);
      res.status(500).json({
        error: 'PHONE_NUMBER_REGISTRATION_ERROR',
        message: 'Failed to register phone number ID',
      });
    }
  });

  /**
   * Get webhook routing statistics for phone number
   */
  router.get('/whatsapp/:phoneNumberId/stats', async (req: Request, res: Response) => {
    try {
      const { phoneNumberId } = req.params;

      // First find the tenant for this phone number
      const routingResult = await webhookRouter.routeWebhook({
        object: 'whatsapp_business_account',
        entry: [{
          id: 'test',
          changes: [{
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '',
                phone_number_id: phoneNumberId,
              },
            },
            field: 'messages',
          }],
        }],
      });

      if (!routingResult.success) {
        return res.status(404).json({
          error: 'PHONE_NUMBER_NOT_FOUND',
          message: 'Phone number not found or not registered',
          details: routingResult.error,
        });
      }

      const statsResult = await webhookRouter.getRoutingStats(routingResult.tenant!.id);

      if (statsResult.success) {
        res.status(200).json({
          success: true,
          data: {
            phoneNumberId,
            tenantId: routingResult.tenant!.id,
            tenantDomain: routingResult.tenant!.domain,
            stats: statsResult.data,
          },
        });
      } else {
        res.status(500).json({
          success: false,
          error: statsResult.error,
        });
      }
    } catch (error) {
      console.error('Stats retrieval error:', error);
      res.status(500).json({
        error: 'STATS_RETRIEVAL_ERROR',
        message: 'Failed to get routing statistics',
      });
    }
  });

  /**
   * Test webhook for specific tenant
   */
  router.post('/whatsapp/test/:tenantId', async (req: Request, res: Response) => {
    try {
      const { tenantId } = req.params;
      const { phoneNumber, message, phoneNumberId } = req.body;

      if (!phoneNumber || !message) {
        return res.status(400).json({
          error: 'MISSING_PARAMETERS',
          message: 'phoneNumber and message are required',
        });
      }

      // Create test message payload
      const testPayload: WhatsAppWebhookPayload = {
        object: 'whatsapp_business_account',
        entry: [{
          id: 'test-entry',
          changes: [{
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '1234567890',
                phone_number_id: phoneNumberId || 'test-phone-id',
              },
              messages: [{
                id: `test-${Date.now()}`,
                from: phoneNumber,
                to: '1234567890',
                text: {
                  body: message,
                },
                type: 'text',
                timestamp: new Date().toISOString(),
              }],
            },
            field: 'messages',
          }],
        }],
        tenantContext: {
          tenantId,
          domain: '',
          phoneNumberId: phoneNumberId || 'test-phone-id',
        },
      };

      // Process test message
      const result = await messageProcessor.processWebhookPayload(testPayload);

      if (!result.success) {
        return res.status(500).json({
          error: result.error!.code,
          message: result.error!.message,
        });
      }

      res.json({
        success: true,
        message: 'Test message processed successfully',
        tenantId,
        processed_messages: result.data!.length,
        results: result.data,
      });

    } catch (error) {
      console.error('Webhook test error:', error);
      res.status(500).json({
        error: 'WEBHOOK_TEST_FAILED',
        message: 'Failed to test webhook',
      });
    }
  });

  return router;
}

// ===== UTILITY FUNCTIONS =====

/**
 * Verify webhook signature from WhatsApp
 */
function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('hex');

    const receivedSignature = signature.replace('sha256=', '');
    
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(receivedSignature, 'hex')
    );
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

/**
 * Extract phone number ID from webhook payload
 */
function extractPhoneNumberId(payload: WhatsAppWebhookPayload): string | null {
  try {
    return payload.entry[0]?.changes[0]?.value?.metadata?.phone_number_id || null;
  } catch (error) {
    return null;
  }
}

/**
 * Extract messages from webhook payload
 */
function extractMessages(payload: WhatsAppWebhookPayload) {
  try {
    const messages = [];
    for (const entry of payload.entry) {
      for (const change of entry.changes) {
        if (change.field === 'messages' && change.value.messages) {
          messages.push(...change.value.messages);
        }
      }
    }
    return messages;
  } catch (error) {
    return [];
  }
}