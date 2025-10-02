/**
 * Test Service Selection
 * Test the service selection logic directly
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const TEST_CONFIG = {
  baseUrl: 'https://whatsapp-bot-for-consumer.vercel.app',
  testPhoneNumber: '9876543210',
};

async function testServiceSelection() {
  console.log('🧪 Testing Service Selection');
  console.log('===========================\n');
  
  const testCases = [
    { message: 'book', description: 'Start booking' },
    { message: 'hair cut', description: 'Select service by name' },
    { message: 'haircut & style', description: 'Select service by full name' },
    { message: '1', description: 'Select service by number' },
    { message: 'facial', description: 'Select service by partial name' }
  ];
  
  for (const test of testCases) {
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
      
      if (result.success) {
        console.log(`🎉 SUCCESS: Bot responded`);
        console.log(`📱 Response: ${result.message.substring(0, 150)}...`);
        console.log(`📄 Current Step: ${result.currentStep}`);
        
        if (result.appointmentId) {
          console.log(`🎫 Appointment ID: ${result.appointmentId}`);
        }
      } else {
        console.log(`❌ FAILED: ${result.error}`);
        console.log(`📄 Current Step: ${result.currentStep}`);
      }
      
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
    }
    
    // Add delay between requests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

async function main() {
  console.log('🚀 Test Service Selection');
  console.log('=========================\n');
  
  await testServiceSelection();
  
  console.log('\n🎯 Analysis:');
  console.log('- If service selection works, the issue is elsewhere');
  console.log('- If service selection fails, we need to fix the matching logic');
  console.log('- Check if the bot is correctly identifying service names');
}

main().catch(console.error);
