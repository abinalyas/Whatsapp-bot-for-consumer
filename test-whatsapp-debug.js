/**
 * Debug WhatsApp Bot Integration
 * Test the webhook processing to identify the issue
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const TEST_CONFIG = {
  baseUrl: 'https://whatsapp-bot-for-consumer.vercel.app',
  tenantId: 'bella-salon',
  testPhoneNumber: '9876543210',
  webhookUrl: '/api/webhook/whatsapp/test/bella-salon'
};

async function testWebhookHealth() {
  console.log('🏥 Testing webhook health...');
  
  try {
    const response = await fetch(`${TEST_CONFIG.baseUrl}/api/webhook/whatsapp/status`);
    const result = await response.json();
    
    console.log('Webhook status:', result);
    return result.status === 'healthy';
  } catch (error) {
    console.log('❌ Webhook health check failed:', error.message);
    return false;
  }
}

async function testBookingMessage(message) {
  console.log(`\n📱 Testing message: "${message}"`);
  
  try {
    const response = await fetch(`${TEST_CONFIG.baseUrl}${TEST_CONFIG.webhookUrl}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phoneNumber: TEST_CONFIG.testPhoneNumber,
        message: message,
        phoneNumberId: 'test-phone-id'
      })
    });

    console.log(`Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Error response:', errorText);
      return null;
    }

    const result = await response.json();
    console.log('✅ Response:', JSON.stringify(result, null, 2));
    
    if (result.results && result.results.length > 0) {
      const lastResult = result.results[result.results.length - 1];
      return {
        message: lastResult.response?.content || 'No response content',
        success: lastResult.response ? true : false
      };
    }
    
    return null;

  } catch (error) {
    console.log('❌ Test failed:', error.message);
    return null;
  }
}

async function debugBookingFlow() {
  console.log('🐛 Debugging WhatsApp Booking Flow...\n');

  // Check webhook health first
  const isHealthy = await testWebhookHealth();
  if (!isHealthy) {
    console.log('❌ Webhook is not healthy. Cannot proceed with tests.');
    return;
  }

  // Test the booking flow step by step
  const testMessages = [
    'book',
    '1', // Should select first service
    '1', // Should select first date
    '1', // Should select first time
    '1', // Should select first staff
    'yes' // Should confirm
  ];

  for (const message of testMessages) {
    const result = await testBookingMessage(message);
    if (result) {
      console.log(`📝 Bot response: ${result.message}`);
    }
    // Add delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// Test individual message processing
async function testIndividualMessage(message) {
  console.log(`\n🔍 Testing individual message: "${message}"`);
  
  try {
    const response = await fetch(`${TEST_CONFIG.baseUrl}${TEST_CONFIG.webhookUrl}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phoneNumber: TEST_CONFIG.testPhoneNumber,
        message: message,
        phoneNumberId: 'test-phone-id'
      })
    });

    const result = await response.json();
    console.log('Full response:', JSON.stringify(result, null, 2));
    
    return result;

  } catch (error) {
    console.log('❌ Error:', error.message);
    return null;
  }
}

// Main debug function
async function main() {
  console.log('🚀 WhatsApp Bot Debug Tool');
  console.log('==========================\n');

  // Test webhook health
  await testWebhookHealth();
  
  // Test a simple booking message
  console.log('\n📋 Testing simple booking message...');
  const result = await testIndividualMessage('book');
  
  if (!result || !result.success) {
    console.log('\n❌ Booking message failed. Testing webhook directly...');
    
    // Test direct webhook
    try {
      const webhookResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/webhook/whatsapp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
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
                  from: TEST_CONFIG.testPhoneNumber,
                  to: '1234567890',
                  text: {
                    body: 'book',
                  },
                  type: 'text',
                  timestamp: new Date().toISOString(),
                }],
              },
              field: 'messages',
            }],
          }],
        })
      });
      
      console.log('Direct webhook status:', webhookResponse.status);
      const webhookResult = await webhookResponse.json();
      console.log('Direct webhook result:', JSON.stringify(webhookResult, null, 2));
      
    } catch (error) {
      console.log('❌ Direct webhook test failed:', error.message);
    }
  }
}

// Run if this script is executed directly
main().catch(console.error);

export { testWebhookHealth, testBookingMessage, debugBookingFlow };
