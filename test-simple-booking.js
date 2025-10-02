/**
 * Test Simple Booking Flow
 * Test the booking flow step by step to identify the exact issue
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const TEST_CONFIG = {
  baseUrl: 'https://whatsapp-bot-for-consumer.vercel.app',
  testPhoneNumber: '9876543210',
};

async function testBookingFlow() {
  console.log('🧪 Testing Simple Booking Flow');
  console.log('===============================\n');
  
  const testSteps = [
    { message: 'hi', description: 'Initial greeting' },
    { message: 'book', description: 'Start booking' },
    { message: 'hair cut', description: 'Select service' },
    { message: '1', description: 'Select date' },
    { message: '1', description: 'Select time' },
    { message: 'yes', description: 'Confirm booking' }
  ];
  
  for (const step of testSteps) {
    console.log(`\n📱 Step: ${step.description}`);
    console.log(`💬 Message: "${step.message}"`);
    
    try {
      // Test with legacy webhook (should work)
      const legacyResponse = await fetch(`${TEST_CONFIG.baseUrl}/webhook`, {
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
                  phone_number_id: 'test-phone-id'
                },
                messages: [{
                  id: `test-${Date.now()}`,
                  from: TEST_CONFIG.testPhoneNumber,
                  to: '1234567890',
                  text: {
                    body: step.message
                  },
                  type: 'text',
                  timestamp: new Date().toISOString()
                }]
              },
              field: 'messages'
            }]
          }]
        })
      });
      
      console.log(`✅ Legacy webhook status: ${legacyResponse.status}`);
      const legacyResult = await legacyResponse.text();
      console.log(`📄 Legacy response: ${legacyResult}`);
      
      // Test with new webhook (might not work)
      const newResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/webhook/whatsapp/test/bella-salon`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: TEST_CONFIG.testPhoneNumber,
          message: step.message,
          phoneNumberId: 'test-phone-id'
        })
      });
      
      console.log(`✅ New webhook status: ${newResponse.status}`);
      const newResult = await newResponse.json();
      console.log(`📄 New webhook processed: ${newResult.processed_messages} messages`);
      
      if (newResult.results && newResult.results.length > 0) {
        console.log(`📄 New webhook response: ${newResult.results[0].response?.content?.substring(0, 100)}...`);
      }
      
    } catch (error) {
      console.error(`❌ Error in step: ${error.message}`);
    }
    
    // Add delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

async function main() {
  console.log('🚀 Simple Booking Flow Test');
  console.log('============================\n');
  
  await testBookingFlow();
  
  console.log('\n🎯 Summary:');
  console.log('- Legacy webhook: Should work and show static flow responses');
  console.log('- New webhook: Should work and show booking flow responses');
  console.log('- If new webhook shows 0 processed messages, the booking integration is not working');
}

main().catch(console.error);
