/**
 * Test Legacy Webhook
 * Test the /webhook endpoint that mobile WhatsApp actually hits
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const TEST_CONFIG = {
  baseUrl: 'https://whatsapp-bot-for-consumer.vercel.app',
};

async function testLegacyWebhook() {
  console.log('🧪 Testing Legacy Webhook (/webhook)');
  console.log('====================================\n');
  
  const mobilePhoneNumber = '987654321777';
  
  const testMessages = [
    { message: 'hi', description: 'Initial greeting' },
    { message: 'book', description: 'Start booking' },
    { message: 'hair cut', description: 'Select service' },
    { message: 'tomorrow', description: 'Select date' },
    { message: '10 am', description: 'Select time' },
    { message: '1', description: 'Select staff' },
    { message: 'yes', description: 'Confirm booking' }
  ];
  
  for (const test of testMessages) {
    console.log(`\n📱 Testing: ${test.description}`);
    console.log(`💬 Message: "${test.message}"`);
    
    try {
      // Simulate the exact payload that mobile WhatsApp sends to /webhook
      const payload = {
        object: 'whatsapp_business_account',
        entry: [{
          id: '123456789',
          changes: [{
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '1234567890',
                phone_number_id: '123456789'
              },
              messages: [{
                from: mobilePhoneNumber,
                id: `wamid.${Date.now()}`,
                timestamp: Math.floor(Date.now() / 1000).toString(),
                text: {
                  body: test.message
                },
                type: 'text'
              }]
            },
            field: 'messages'
          }]
        }]
      };
      
      // Send to the legacy webhook endpoint that mobile WhatsApp actually hits
      const response = await fetch(`${TEST_CONFIG.baseUrl}/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      console.log(`✅ Status: ${response.status}`);
      
      if (response.status === 200) {
        console.log(`🎉 SUCCESS: Legacy webhook processed message`);
        const result = await response.text();
        console.log(`📊 Response:`, result);
      } else {
        console.log(`❌ FAILED: Status ${response.status}`);
        const error = await response.text();
        console.log(`📄 Error:`, error);
      }
      
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
    }
    
    // Add delay between requests
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
}

async function main() {
  console.log('🚀 Test Legacy Webhook');
  console.log('====================\n');
  
  await testLegacyWebhook();
  
  console.log('\n🎯 Expected Results:');
  console.log('- Legacy webhook should now delegate to our working simple webhook');
  console.log('- Mobile WhatsApp should work properly without errors');
  console.log('- No more "Sorry, I couldn\'t find the right response" messages');
  console.log('- Complete booking flow should work from mobile WhatsApp');
}

main().catch(console.error);
