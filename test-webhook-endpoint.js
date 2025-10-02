/**
 * Test Webhook Endpoint
 * Test the actual webhook endpoint to see what's happening
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const TEST_CONFIG = {
  baseUrl: 'https://whatsapp-bot-for-consumer.vercel.app'
};

async function testWebhookEndpoint() {
  console.log('🔍 Test Webhook Endpoint');
  console.log('========================\n');
  
  try {
    // Test 1: Webhook verification (GET)
    console.log('📊 Test 1: Webhook verification (GET)');
    const verificationResponse = await fetch(`${TEST_CONFIG.baseUrl}/webhook?hub.mode=subscribe&hub.challenge=test123&hub.verify_token=test`, {
      method: 'GET'
    });
    
    console.log(`Status: ${verificationResponse.status}`);
    const verificationText = await verificationResponse.text();
    console.log(`Response: ${verificationText}`);
    
    // Test 2: Test webhook with a sample message (POST)
    console.log('\n📊 Test 2: Test webhook with sample message (POST)');
    const sampleMessage = {
      object: "whatsapp_business_account",
      entry: [{
        id: "123456789",
        changes: [{
          value: {
            messaging_product: "whatsapp",
            metadata: {
              display_phone_number: "1234567890",
              phone_number_id: "123456789"
            },
            messages: [{
              from: "98765432177",
              id: "wamid.test123",
              timestamp: "1234567890",
              text: {
                body: "hi"
              },
              type: "text"
            }]
          },
          field: "messages"
        }]
      }]
    };
    
    const messageResponse = await fetch(`${TEST_CONFIG.baseUrl}/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(sampleMessage)
    });
    
    console.log(`Status: ${messageResponse.status}`);
    const messageText = await messageResponse.text();
    console.log(`Response: ${messageText}`);
    
    // Test 3: Check if there are any server logs or errors
    console.log('\n📊 Test 3: Check server status');
    const statusResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/health`, {
      method: 'GET'
    });
    
    console.log(`Status: ${statusResponse.status}`);
    if (statusResponse.ok) {
      const statusResult = await statusResponse.json();
      console.log(`Health check: ${JSON.stringify(statusResult, null, 2)}`);
    } else {
      console.log(`Health check failed: ${statusResponse.status}`);
    }
    
  } catch (error) {
    console.error('❌ Error testing webhook endpoint:', error);
  }
}

async function main() {
  console.log('🚀 Test Webhook Endpoint');
  console.log('========================\n');
  
  await testWebhookEndpoint();
  
  console.log('\n🎯 Analysis:');
  console.log('- Check if the webhook endpoint is responding correctly');
  console.log('- Look for any server-side errors');
  console.log('- Verify the webhook is processing messages properly');
}

main().catch(console.error);
