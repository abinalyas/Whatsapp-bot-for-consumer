/**
 * Test Simple Webhook
 * Test the new simple webhook that should actually process messages
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const TEST_CONFIG = {
  baseUrl: 'https://whatsapp-bot-for-consumer.vercel.app',
  testPhoneNumber: '9876543210',
};

async function testSimpleWebhook() {
  console.log('🧪 Testing Simple Webhook');
  console.log('=========================\n');
  
  const testMessages = [
    { message: 'hi', description: 'Initial greeting' },
    { message: 'book', description: 'Start booking' },
    { message: 'hair cut', description: 'Select service' },
    { message: '1', description: 'Select service by number' }
  ];
  
  for (const test of testMessages) {
    console.log(`\n📱 Testing: ${test.description}`);
    console.log(`💬 Message: "${test.message}"`);
    
    try {
      const response = await fetch(`${TEST_CONFIG.baseUrl}/api/whatsapp/simple/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: TEST_CONFIG.testPhoneNumber,
          message: test.message
        })
      });
      
      console.log(`✅ Status: ${response.status}`);
      const result = await response.json();
      console.log('📄 Response:', JSON.stringify(result, null, 2));
      
      if (result.success && result.message) {
        console.log(`🎉 SUCCESS: Bot responded with "${result.message.substring(0, 100)}..."`);
      } else {
        console.log(`⚠️  No response generated`);
      }
      
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
    }
    
    // Add delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

async function testWebhookPayload() {
  console.log('\n🧪 Testing Webhook Payload');
  console.log('===========================\n');
  
  try {
    const webhookPayload = {
      object: 'whatsapp_business_account',
      entry: [{
        id: 'test-entry',
        changes: [{
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '1234567890',
              phone_number_id: 'test-phone-id'
            },
            messages: [{
              id: `test-${Date.now()}`,
              from: TEST_CONFIG.testPhoneNumber,
              to: '1234567890',
              text: {
                body: 'book'
              },
              type: 'text',
              timestamp: new Date().toISOString()
            }]
          },
          field: 'messages'
        }]
      }]
    };
    
    const response = await fetch(`${TEST_CONFIG.baseUrl}/api/whatsapp/simple`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookPayload)
    });
    
    console.log(`✅ Status: ${response.status}`);
    const result = await response.json();
    console.log('📄 Response:', JSON.stringify(result, null, 2));
    
    if (result.success && result.processed > 0) {
      console.log(`🎉 SUCCESS: Processed ${result.processed} messages`);
      if (result.messages && result.messages.length > 0) {
        console.log(`📱 Bot responses:`, result.messages.map(m => m.response?.substring(0, 50) + '...'));
      }
    } else {
      console.log(`⚠️  No messages processed`);
    }
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
  }
}

async function main() {
  console.log('🚀 Test Simple Webhook');
  console.log('======================\n');
  
  // Test 1: Simple test endpoint
  await testSimpleWebhook();
  
  // Test 2: Full webhook payload
  await testWebhookPayload();
  
  console.log('\n🎯 Expected Results:');
  console.log('- Simple webhook should process messages and show real salon services');
  console.log('- Bot should respond with actual service information from database');
  console.log('- Booking flow should work step by step');
}

main().catch(console.error);
