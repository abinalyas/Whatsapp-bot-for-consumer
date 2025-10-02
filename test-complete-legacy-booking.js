/**
 * Test Complete Legacy Booking Flow
 * Test the complete booking flow through the legacy /webhook endpoint
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const TEST_CONFIG = {
  baseUrl: 'https://whatsapp-bot-for-consumer.vercel.app',
};

async function testCompleteLegacyBooking() {
  console.log('🧪 Testing Complete Legacy Booking Flow');
  console.log('=====================================\n');
  
  const mobilePhoneNumber = '987654321888';
  
  const bookingFlow = [
    { message: 'book', description: 'Start booking' },
    { message: 'hair cut', description: 'Select service' },
    { message: 'tomorrow', description: 'Select date' },
    { message: '10 am', description: 'Select time' },
    { message: '1', description: 'Select staff' },
    { message: 'yes', description: 'Confirm booking' }
  ];
  
  for (const step of bookingFlow) {
    console.log(`\n📱 Step: ${step.description}`);
    console.log(`💬 Message: "${step.message}"`);
    
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
                  body: step.message
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
    
    // Add delay between requests to simulate real conversation
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  console.log('\n🎯 Final Results:');
  console.log('📱 Complete booking flow sent through legacy webhook');
  console.log('🔍 Check if a booking was created in the database');
  console.log('📊 If successful, mobile WhatsApp should now work perfectly!');
}

async function main() {
  console.log('🚀 Test Complete Legacy Booking Flow');
  console.log('===================================\n');
  
  await testCompleteLegacyBooking();
  
  console.log('\n🎯 Summary:');
  console.log('- Legacy webhook should maintain conversation state between messages');
  console.log('- Complete booking flow should work from mobile WhatsApp');
  console.log('- Real bookings should be created in the database');
  console.log('- Mobile WhatsApp users should no longer see error messages');
}

main().catch(console.error);
