/**
 * Fix Message Processor Service
 * Create a simple test to verify the message processor is working
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const TEST_CONFIG = {
  baseUrl: 'https://whatsapp-bot-for-consumer.vercel.app',
  testPhoneNumber: '9876543210',
};

async function testMessageProcessorWithDebug() {
  console.log('🔧 Testing Message Processor with Debug');
  console.log('=======================================\n');
  
  try {
    // Test the message processor with a simple message
    const response = await fetch(`${TEST_CONFIG.baseUrl}/api/webhook/whatsapp/test/bella-salon`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phoneNumber: TEST_CONFIG.testPhoneNumber,
        message: 'book',
        phoneNumberId: 'test-phone-id'
      })
    });
    
    console.log(`Status: ${response.status}`);
    const result = await response.json();
    console.log('Full Response:', JSON.stringify(result, null, 2));
    
    // Check if there are any error details
    if (result.error) {
      console.log('\n❌ Error found:', result.error);
    }
    
    // Check if there are any debug information
    if (result.debug) {
      console.log('\n🔍 Debug info:', result.debug);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
}

async function testWithActualTenantId() {
  console.log('\n🔧 Testing with Actual Tenant ID');
  console.log('==================================\n');
  
  try {
    // Test with the actual tenant ID from the database
    const response = await fetch(`${TEST_CONFIG.baseUrl}/api/webhook/whatsapp/test/85de5a0c-6aeb-479a-aa76-cbdd6b0845a7`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phoneNumber: TEST_CONFIG.testPhoneNumber,
        message: 'book',
        phoneNumberId: 'test-phone-id'
      })
    });
    
    console.log(`Status: ${response.status}`);
    const result = await response.json();
    console.log('Full Response:', JSON.stringify(result, null, 2));
    
    return result;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
}

async function testDirectWebhookWithTenantContext() {
  console.log('\n🔧 Testing Direct Webhook with Tenant Context');
  console.log('===============================================\n');
  
  try {
    // Test the direct webhook with proper tenant context
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
      }],
      tenantContext: {
        tenantId: '85de5a0c-6aeb-479a-aa76-cbdd6b0845a7',
        domain: 'bella-salon',
        phoneNumberId: 'test-phone-id'
      }
    };
    
    const response = await fetch(`${TEST_CONFIG.baseUrl}/api/webhook/whatsapp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookPayload)
    });
    
    console.log(`Status: ${response.status}`);
    const result = await response.json();
    console.log('Full Response:', JSON.stringify(result, null, 2));
    
    return result;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
}

async function main() {
  console.log('🚀 Fix Message Processor Service');
  console.log('=================================\n');
  
  // Test 1: Basic message processor
  await testMessageProcessorWithDebug();
  
  // Test 2: With actual tenant ID
  await testWithActualTenantId();
  
  // Test 3: Direct webhook with tenant context
  await testDirectWebhookWithTenantContext();
  
  console.log('\n🎯 Next Steps:');
  console.log('1. If all tests show 0 processed messages, the issue is in the MessageProcessorService');
  console.log('2. If some tests work, the issue is in the tenant routing');
  console.log('3. If direct webhook works, the issue is in the test endpoint');
}

main().catch(console.error);
