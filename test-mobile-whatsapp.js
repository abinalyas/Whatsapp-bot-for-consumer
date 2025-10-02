/**
 * Test Mobile WhatsApp Integration
 * Test the legacy webhook that mobile WhatsApp actually hits
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const TEST_CONFIG = {
  baseUrl: 'https://whatsapp-bot-for-consumer.vercel.app',
};

async function testMobileWhatsApp() {
  console.log('🧪 Testing Mobile WhatsApp Integration');
  console.log('====================================\n');
  
  // Simulate what mobile WhatsApp sends to the legacy webhook
  const mobilePhoneNumber = '987654321999';
  
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
      // Simulate the exact payload that mobile WhatsApp sends
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
      const response = await fetch(`${TEST_CONFIG.baseUrl}/api/webhook/whatsapp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Hub-Signature-256': 'sha256=test' // Simplified for testing
        },
        body: JSON.stringify(payload)
      });
      
      console.log(`✅ Status: ${response.status}`);
      
      if (response.status === 200) {
        console.log(`🎉 SUCCESS: Legacy webhook processed message`);
        const result = await response.json();
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
  console.log('🚀 Test Mobile WhatsApp Integration');
  console.log('==================================\n');
  
  await testMobileWhatsApp();
  
  console.log('\n🎯 Analysis:');
  console.log('- If successful, mobile WhatsApp should now work properly');
  console.log('- The legacy webhook should delegate to our working simple webhook');
  console.log('- No more "Sorry, I couldn\'t find the right response" errors');
}

main().catch(console.error);
