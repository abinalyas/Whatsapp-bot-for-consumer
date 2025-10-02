/**
 * Simple Webhook Routes
 * Simplified webhook routes that actually process messages and show real services
 */

import { Router, Request, Response } from 'express';
import { WhatsAppBookingService } from '../services/whatsapp-booking.service';

export function createSimpleWebhookRoutes(): Router {
  const router = Router();
  const bookingService = new WhatsAppBookingService();

  /**
   * Simple webhook verification (GET request from WhatsApp)
   */
  router.get('/whatsapp/simple', (req: Request, res: Response) => {
    try {
      const mode = req.query['hub.mode'];
      const token = req.query['hub.verify_token'];
      const challenge = req.query['hub.challenge'];

      console.log('Simple webhook verification request:', { mode, token, challenge });

      // Verify the mode and token
      if (mode === 'subscribe') {
        if (token === process.env.WHATSAPP_VERIFY_TOKEN && challenge) {
          console.log('Simple webhook verified successfully');
          res.status(200).send(challenge);
          return;
        }
      }

      console.log('Simple webhook verification failed');
      res.status(403).send('Forbidden');
    } catch (error) {
      console.error('Simple webhook verification error:', error);
      res.status(400).send('Bad Request');
    }
  });

  /**
   * Simple webhook message processing (POST request from WhatsApp)
   */
  router.post('/whatsapp/simple', async (req: Request, res: Response) => {
    try {
      const payload = req.body;
      console.log('Simple webhook payload received:', JSON.stringify(payload, null, 2));

      // Extract messages from payload
      const messages = extractMessages(payload);
      
      if (messages.length === 0) {
        console.log('No messages found in webhook payload');
        return res.status(200).json({ success: true, processed: 0 });
      }

      // Process each message
      const processedMessages = [];
      for (const message of messages) {
        try {
          console.log(`Processing message from ${message.from}: ${message.text?.body}`);
          
          // Initialize booking context
          const bookingContext = {
            tenantId: '85de5a0c-6aeb-479a-aa76-cbdd6b0845a7', // Bella Salon tenant ID
            customerPhone: message.from,
            currentStep: 'welcome'
          };

          // Process the message
          const result = await bookingService.processBookingMessage(
            message,
            bookingContext.tenantId,
            bookingContext
          );

          if (result.success) {
            processedMessages.push({
              messageId: message.id,
              phoneNumber: message.from,
              response: result.message,
              nextStep: result.nextStep,
              appointmentId: result.appointmentId
            });

            console.log(`Generated response: ${result.message.substring(0, 100)}...`);
          } else {
            console.error(`Failed to process message: ${result.error}`);
          }

        } catch (error) {
          console.error(`Error processing message ${message.id}:`, error);
        }
      }

      console.log(`Successfully processed ${processedMessages.length} messages`);

      // Return success response
      res.status(200).json({
        success: true,
        processed: processedMessages.length,
        messages: processedMessages
      });

    } catch (error) {
      console.error('Simple webhook processing error:', error);
      res.status(500).json({
        error: 'WEBHOOK_PROCESSING_ERROR',
        message: 'Internal server error processing webhook',
      });
    }
  });

  /**
   * Test endpoint for simple webhook
   */
  router.post('/whatsapp/simple/test', async (req: Request, res: Response) => {
    try {
      const { phoneNumber, message } = req.body;

      if (!phoneNumber || !message) {
        return res.status(400).json({
          error: 'MISSING_PARAMETERS',
          message: 'phoneNumber and message are required',
        });
      }

      console.log(`Test message from ${phoneNumber}: ${message}`);

      // Initialize booking context
      const bookingContext = {
        tenantId: '85de5a0c-6aeb-479a-aa76-cbdd6b0845a7', // Bella Salon tenant ID
        customerPhone: phoneNumber,
        currentStep: 'welcome'
      };

      // Process the message
      const result = await bookingService.processBookingMessage(
        { text: { body: message }, from: phoneNumber, id: 'test', type: 'text', timestamp: new Date().toISOString() },
        bookingContext.tenantId,
        bookingContext
      );

      if (result.success) {
        res.json({
          success: true,
          message: result.message,
          nextStep: result.nextStep,
          appointmentId: result.appointmentId
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error || 'Unknown error'
        });
      }

    } catch (error) {
      console.error('Simple webhook test error:', error);
      res.status(500).json({
        error: 'WEBHOOK_TEST_FAILED',
        message: 'Failed to test webhook',
      });
    }
  });

  return router;
}

/**
 * Extract messages from webhook payload
 */
function extractMessages(payload: any): Array<{
  id: string;
  from: string;
  text?: { body: string };
  type: string;
  timestamp: string;
}> {
  try {
    const messages = [];
    for (const entry of payload.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field === 'messages' && change.value.messages) {
          messages.push(...change.value.messages);
        }
      }
    }
    return messages;
  } catch (error) {
    console.error('Error extracting messages:', error);
    return [];
  }
}
