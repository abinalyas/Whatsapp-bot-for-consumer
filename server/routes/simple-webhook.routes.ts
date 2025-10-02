/**
 * Simple Webhook Routes
 * Simplified webhook routes that actually process messages and show real services
 */

import { Router, Request, Response } from 'express';
import { WhatsAppBookingService } from '../services/whatsapp-booking.service';

export function createSimpleWebhookRoutes(): Router {
  const router = Router();
  const bookingService = new WhatsAppBookingService();
  
  // Simple in-memory conversation state storage
  const conversationState = new Map<string, any>();
  
  // Add a function to clear conversation state
  const clearConversationState = (phoneNumber: string) => {
    conversationState.delete(phoneNumber);
    console.log(`Cleared conversation state for ${phoneNumber}`);
  };

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
          
          // Get or create conversation state for this phone number
          let bookingContext = conversationState.get(message.from);
          
          if (!bookingContext) {
            // Initialize new conversation
            bookingContext = {
              tenantId: '85de5a0c-6aeb-479a-aa76-cbdd6b0845a7', // Bella Salon tenant ID
              customerPhone: message.from,
              currentStep: 'welcome'
            };
          }

          console.log(`Current conversation state for ${message.from}:`, bookingContext);

          // Process the message
          const result = await bookingService.processBookingMessage(
            message,
            bookingContext.tenantId,
            bookingContext
          );

          // Update conversation state if successful
          if (result.success && result.nextStep) {
            bookingContext.currentStep = result.nextStep;
            conversationState.set(message.from, bookingContext);
            console.log(`Updated conversation state for ${message.from}:`, bookingContext);
          }

          if (result.success) {
            processedMessages.push({
              messageId: message.id,
              phoneNumber: message.from,
              response: result.message,
              nextStep: result.nextStep,
              appointmentId: result.appointmentId,
              currentStep: bookingContext.currentStep
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
   * Reset conversation state endpoint
   */
  router.post('/whatsapp/simple/reset', async (req: Request, res: Response) => {
    try {
      const { phoneNumber } = req.body;
      
      if (!phoneNumber) {
        return res.status(400).json({
          error: 'MISSING_PARAMETERS',
          message: 'phoneNumber is required',
        });
      }
      
      clearConversationState(phoneNumber);
      
      res.json({
        success: true,
        message: `Conversation state cleared for ${phoneNumber}`,
        phoneNumber
      });
    } catch (error) {
      console.error('Error resetting conversation state:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to reset conversation state'
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

      // Get or create conversation state for this phone number
      let bookingContext = conversationState.get(phoneNumber);
      
      if (!bookingContext) {
        // Initialize new conversation
        bookingContext = {
          tenantId: '85de5a0c-6aeb-479a-aa76-cbdd6b0845a7', // Bella Salon tenant ID
          customerPhone: phoneNumber,
          currentStep: 'welcome'
        };
      } else {
        // Create a deep copy to avoid modifying the stored state directly
        bookingContext = JSON.parse(JSON.stringify(bookingContext));
        
        // If the conversation is completed, start a new one
        if (bookingContext.currentStep === 'completed') {
          bookingContext = {
            tenantId: '85de5a0c-6aeb-479a-aa76-cbdd6b0845a7', // Bella Salon tenant ID
            customerPhone: phoneNumber,
            currentStep: 'welcome'
          };
        }
      }
      
      // If user sends "reset" or "start over", clear the conversation state
      if (message.toLowerCase().includes('reset') || message.toLowerCase().includes('start over')) {
        clearConversationState(phoneNumber);
        bookingContext = {
          tenantId: '85de5a0c-6aeb-479a-aa76-cbdd6b0845a7', // Bella Salon tenant ID
          customerPhone: phoneNumber,
          currentStep: 'welcome'
        };
      }

      console.log(`Current conversation state for ${phoneNumber}:`, bookingContext);

      // Process the message
      const result = await bookingService.processBookingMessage(
        { text: { body: message }, from: phoneNumber, id: 'test', type: 'text', timestamp: new Date().toISOString() },
        bookingContext.tenantId,
        bookingContext
      );

      // Update conversation state if successful
      if (result.success && result.nextStep) {
        bookingContext.currentStep = result.nextStep;
        // Store a deep copy of the context to preserve all changes
        conversationState.set(phoneNumber, JSON.parse(JSON.stringify(bookingContext)));
        console.log(`Updated conversation state for ${phoneNumber}:`, bookingContext);
      }

      if (result.success) {
        res.json({
          success: true,
          message: result.message,
          nextStep: result.nextStep,
          appointmentId: result.appointmentId,
          currentStep: bookingContext.currentStep
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error || 'Unknown error',
          currentStep: bookingContext.currentStep
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
