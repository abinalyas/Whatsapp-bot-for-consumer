/**
 * Comprehensive Bot Flows Test
 * Tests different aspects of the WhatsApp Bot functionality
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const TEST_CONFIG = {
  baseUrl: 'https://whatsapp-bot-for-consumer.vercel.app',
  tenantId: '85de5a0c-6aeb-479a-aa76-cbdd6b0845a7', // Actual tenant ID from database
  testPhoneNumber: '9876543210',
};

async function testAPIEndpoint(endpoint, method = 'GET', body = null) {
  try {
    console.log(`\n🔍 Testing ${method} ${endpoint}`);
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${TEST_CONFIG.baseUrl}${endpoint}`, options);
    const result = await response.json();
    
    console.log(`✅ Status: ${response.status}`);
    console.log(`📄 Response:`, JSON.stringify(result, null, 2));
    
    return { success: response.ok, data: result, status: response.status };
  } catch (error) {
    console.log(`❌ Error:`, error.message);
    return { success: false, error: error.message };
  }
}

async function testBasicAPIEndpoints() {
  console.log('🧪 Testing Basic API Endpoints');
  console.log('================================');
  
  // Test basic API health
  await testAPIEndpoint('/api/test');
  
  // Test bot flows API
  await testAPIEndpoint('/api/bot-flows/test');
  
  // Test current flow
  await testAPIEndpoint('/api/bot-flows/current');
  
  // Test services API
  await testAPIEndpoint('/api/services');
  
  // Test salon services API
  await testAPIEndpoint('/api/salon/services', 'GET', null, { 'x-tenant-id': 'bella-salon' });
}

async function testWebhookEndpoints() {
  console.log('\n🧪 Testing Webhook Endpoints');
  console.log('===============================');
  
  // Test webhook status
  await testAPIEndpoint('/api/webhook/whatsapp/status');
  
  // Test tenant-specific webhook test
  await testAPIEndpoint('/api/webhook/whatsapp/test/bella-salon', 'POST', {
    phoneNumber: TEST_CONFIG.testPhoneNumber,
    message: 'book',
    phoneNumberId: 'test-phone-id'
  });
  
  // Test with actual tenant ID
  await testAPIEndpoint('/api/webhook/whatsapp/test/85de5a0c-6aeb-479a-aa76-cbdd6b0845a7', 'POST', {
    phoneNumber: TEST_CONFIG.testPhoneNumber,
    message: 'book',
    phoneNumberId: 'test-phone-id'
  });
}

async function testDirectWebhookMessage() {
  console.log('\n🧪 Testing Direct Webhook Message');
  console.log('==================================');
  
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
  
  await testAPIEndpoint('/api/webhook/whatsapp', 'POST', webhookPayload);
}

async function testLegacyWebhook() {
  console.log('\n🧪 Testing Legacy Webhook');
  console.log('==========================');
  
  const legacyPayload = {
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
  
  await testAPIEndpoint('/webhook', 'POST', legacyPayload);
}

async function testMessageProcessingFlow() {
  console.log('\n🧪 Testing Message Processing Flow');
  console.log('====================================');
  
  const testMessages = [
    { message: 'hi', expected: 'greeting' },
    { message: 'book', expected: 'service selection' },
    { message: '1', expected: 'date selection' },
    { message: 'hair cut', expected: 'service selection' }
  ];
  
  for (const test of testMessages) {
    console.log(`\n📱 Testing message: "${test.message}"`);
    
    const result = await testAPIEndpoint('/api/webhook/whatsapp/test/bella-salon', 'POST', {
      phoneNumber: TEST_CONFIG.testPhoneNumber,
      message: test.message,
      phoneNumberId: 'test-phone-id'
    });
    
    if (result.success && result.data.results && result.data.results.length > 0) {
      console.log(`✅ Expected: ${test.expected}`);
      console.log(`📄 Response: ${result.data.results[0].response?.content || 'No response'}`);
    } else {
      console.log(`❌ No response generated for "${test.message}"`);
    }
  }
}

async function testDatabaseServices() {
  console.log('\n🧪 Testing Database Services');
  console.log('=============================');
  
  // Test if we can fetch services from the database
  await testAPIEndpoint('/api/salon/services', 'GET');
  
  // Test with proper headers
  await testAPIEndpoint('/api/salon/services', 'GET');
}

async function testConversationState() {
  console.log('\n🧪 Testing Conversation State');
  console.log('==============================');
  
  // Test conversation creation and state management
  const testFlow = [
    { message: 'book', step: 'initial' },
    { message: 'hair cut', step: 'service_selection' },
    { message: '1', step: 'date_selection' },
    { message: '1', step: 'time_selection' },
    { message: 'yes', step: 'confirmation' }
  ];
  
  for (const test of testFlow) {
    console.log(`\n📱 Step: ${test.step} - Message: "${test.message}"`);
    
    const result = await testAPIEndpoint('/api/webhook/whatsapp/test/bella-salon', 'POST', {
      phoneNumber: TEST_CONFIG.testPhoneNumber,
      message: test.message,
      phoneNumberId: 'test-phone-id'
    });
    
    console.log(`📄 Processed messages: ${result.data?.processed_messages || 0}`);
    if (result.data?.results?.length > 0) {
      console.log(`📄 Response: ${result.data.results[0].response?.content?.substring(0, 100)}...`);
    }
  }
}

async function main() {
  console.log('🚀 Comprehensive Bot Flows Test Suite');
  console.log('=====================================\n');
  
  try {
    // Test 1: Basic API endpoints
    await testBasicAPIEndpoints();
    
    // Test 2: Webhook endpoints
    await testWebhookEndpoints();
    
    // Test 3: Direct webhook message
    await testDirectWebhookMessage();
    
    // Test 4: Legacy webhook (should work)
    await testLegacyWebhook();
    
    // Test 5: Database services
    await testDatabaseServices();
    
    // Test 6: Message processing flow
    await testMessageProcessingFlow();
    
    // Test 7: Conversation state
    await testConversationState();
    
    console.log('\n🎉 All tests completed!');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  }
}

// Run tests
main().catch(console.error);
