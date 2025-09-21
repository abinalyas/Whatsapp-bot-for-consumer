/**
 * WhatsApp Webhook Routes with Multi-Tenant Support
 * Handles incoming WhatsApp webhooks and routes them to appropriate tenants
 */

import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { MessageProcessorService, WhatsAppWebhookPayload } from '../services/message-processor.service';
import { WhatsAppSenderService } from '../services/whatsapp-sender.service';
import type { ServiceResponse } from '@shared/types/tenant';

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

  // ===== WEBHOOK VERIFICATION =====

  /**
   * Verify webhook endpoint (GET request from WhatsApp)
   */
  router.get('/whatsapp', (req: WebhookVerificationRequest, res: Response) => {
    try {
      const mode = req.query['hub.mode'];
      const token = req.query['hub.verify_token'];
      const challenge = req.query['hub.challenge'];

      console.log('Webhook verification request:', { mode, token, challenge });

      // Verify the mode and token
      if (mode === 'subscribe') {
        // In a real implementation, would verify token against tenant-specific tokens
        // For now, accept any verification request
        if (challenge) {
          console.log('Webhook verified successfully');
          res.status(200).send(challenge);
          return;
        }
      }

      console.log('Webhook verification failed');
      res.status(403).send('Forbidden');
    } catch (error) {
      console.error('Webhook verification error:', error);
      res.status(500).json({
        error: 'WEBHOOK_VERIFICATION_FAILED',
        message: 'Failed to verify webhook',
      });
    }
  });

  // ===== WEBHOOK MESSAGE PROCESSING =====

  /**
   * Process incoming WhatsApp messages (POST request from WhatsApp)
   */
  router.post('/whatsapp', async (req: WebhookMessageRequest, res: Response) => {
    try {
      const payload = req.body;
      const signature = req.headers['x-hub-signature-256'];

      console.log('Received webhook payload:', JSON.stringify(payload, null, 2));

      // Verify webhook signature (simplified - in production would verify against tenant-specific secrets)
      if (signature && !verifyWebhookSignature(JSON.stringify(payload), signature, process.env.WHATSAPP_WEBHOOK_SECRET || 'default-secret')) {
        console.log('Invalid webhook signature');
        return res.status(401).json({
          error: 'INVALID_SIGNATURE',
          message: 'Webhook signature verification failed',
        });
      }

      // Process the webhook payload
      const result = await messageProcessor.processWebhookPayload(payload);

      if (!result.success) {
        console.error('Failed to process webhook payload:', result.error);
        return res.status(500).json({
          error: result.error!.code,
          message: result.error!.message,
        });
      }

      const processedMessages = result.data!;
      console.log(`Successfully processed ${processedMessages.length} messages`);

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
      const successfulSends = sendResults.filter(r => r.success).length;
      const failedSends = sendResults.length - successfulSends;

      console.log(`Sent ${successfulSends} responses, ${failedSends} failed`);

      // Return success response to WhatsApp
      res.status(200).json({
        success: true,
        processed: processedMessages.length,
        responses_sent: successfulSends,
        responses_failed: failedSends,
      });

    } catch (error) {
      console.error('Webhook processing error:', error);
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
   * Test webhook for specific tenant
   */
  router.post('/whatsapp/test/:tenantId', async (req: Request, res: Response) => {
    try {
      const { tenantId } = req.params;
      const { phoneNumber, message } = req.body;

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
                phone_number_id: 'test-phone-id',
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