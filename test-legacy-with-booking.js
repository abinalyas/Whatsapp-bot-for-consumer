/**
 * Test Legacy Webhook with Booking Enhancement
 * Test if we can use the working legacy webhook for booking
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const TEST_CONFIG = {
  baseUrl: 'https://whatsapp-bot-for-consumer.vercel.app',
  testPhoneNumber: '9876543210',
};

async function testLegacyWebhookWithBooking() {
  console.log('🧪 Testing Legacy Webhook with Booking');
  console.log('======================================\n');
  
  const testMessages = [
    { message: 'hi', description: 'Initial greeting' },
    { message: 'book', description: 'Start booking' },
    { message: 'book appointment', description: 'Start booking (alternative)' },
    { message: 'hair cut', description: 'Select service' },
    { message: '1', description: 'Select service by number' }
  ];
  
  for (const test of testMessages) {
    console.log(`\n📱 Testing: ${test.description}`);
    console.log(`💬 Message: "${test.message}"`);
    
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
                  body: test.message
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
      
      console.log(`✅ Status: ${response.status}`);
      const result = await response.text();
      console.log(`📄 Response: ${result}`);
      
      // Check if the response contains service information
      if (result.includes('service') || result.includes('₹') || result.includes('book')) {
        console.log(`🎉 SUCCESS: Response contains booking-related content!`);
      } else {
        console.log(`⚠️  Response doesn't contain booking information`);
      }
      
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
    }
    
    // Add delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

async function main() {
  console.log('🚀 Test Legacy Webhook with Booking');
  console.log('===================================\n');
  
  await testLegacyWebhookWithBooking();
  
  console.log('\n🎯 Analysis:');
  console.log('- If legacy webhook shows booking responses, we can use it as a working solution');
  console.log('- If legacy webhook shows generic responses, we need to enhance it');
  console.log('- The legacy webhook is working, so we can build on it');
}

main().catch(console.error);
