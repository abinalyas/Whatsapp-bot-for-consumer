/**
 * Debug Message Processor Service
 * Test the message processor directly to identify the issue
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const TEST_CONFIG = {
  baseUrl: 'https://whatsapp-bot-for-consumer.vercel.app',
  tenantId: '85de5a0c-6aeb-479a-aa76-cbdd6b0845a7',
  testPhoneNumber: '9876543210',
};

async function testMessageProcessorDirectly() {
  console.log('🔍 Testing Message Processor Directly');
  console.log('=====================================\n');
  
  try {
    // Test the test-whatsapp-bot endpoint which should trigger message processing
    const response = await fetch(`${TEST_CONFIG.baseUrl}/api/test-whatsapp-bot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phoneNumber: TEST_CONFIG.testPhoneNumber,
        message: 'book'
      })
    });
    
    console.log(`Status: ${response.status}`);
    const result = await response.json();
    console.log('Response:', JSON.stringify(result, null, 2));
    
    return result;
  } catch (error) {
    console.error('Error:', error.message);
    return null;
  }
}

async function testLegacyWebhookDirectly() {
  console.log('\n🔍 Testing Legacy Webhook Directly');
  console.log('===================================\n');
  
  try {
    // Test the legacy webhook which should work
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
                body: 'hi'
              },
              type: 'text',
              timestamp: new Date().toISOString()
            }]
          },
          field: 'messages'
        }]
      }]
    };
    
    const response = await fetch(`${TEST_CONFIG.baseUrl}/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookPayload)
    });
    
    console.log(`Status: ${response.status}`);
    const result = await response.text();
    console.log('Response:', result);
    
    return result;
  } catch (error) {
    console.error('Error:', error.message);
    return null;
  }
}

async function testStaticFlow() {
  console.log('\n🔍 Testing Static Flow');
  console.log('=======================\n');
  
  try {
    // Test if the static flow is working
    const response = await fetch(`${TEST_CONFIG.baseUrl}/api/test-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: TEST_CONFIG.testPhoneNumber,
        message: 'hi'
      })
    });
    
    console.log(`Status: ${response.status}`);
    const result = await response.json();
    console.log('Response:', JSON.stringify(result, null, 2));
    
    return result;
  } catch (error) {
    console.error('Error:', error.message);
    return null;
  }
}

async function main() {
  console.log('🚀 Debug Message Processor');
  console.log('==========================\n');
  
  // Test 1: Direct message processor
  await testMessageProcessorDirectly();
  
  // Test 2: Legacy webhook
  await testLegacyWebhookDirectly();
  
  // Test 3: Static flow
  await testStaticFlow();
  
  console.log('\n🎯 Analysis:');
  console.log('- If legacy webhook works but new webhook doesn\'t, the issue is in the new message processor');
  console.log('- If static flow works, the issue is in the booking service integration');
  console.log('- If nothing works, there\'s a fundamental issue with the message processing');
}

main().catch(console.error);
