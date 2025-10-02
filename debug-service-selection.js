/**
 * Debug Service Selection
 * Check if the service selection is working properly
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const TEST_CONFIG = {
  baseUrl: 'https://whatsapp-bot-for-consumer.vercel.app',
  testPhoneNumber: '98765432189'
};

async function debugServiceSelection() {
  console.log('🔍 Debug Service Selection');
  console.log('==========================\n');
  
  try {
    // Step 1: Reset and start booking
    console.log('📊 Step 1: Reset and start booking');
    await fetch(`${TEST_CONFIG.baseUrl}/api/whatsapp/simple/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber: TEST_CONFIG.testPhoneNumber })
    });
    
    // Step 2: Start booking flow
    const bookResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/whatsapp/simple/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber: TEST_CONFIG.testPhoneNumber,
        message: 'book'
      })
    });
    
    const bookResult = await bookResponse.json();
    console.log('✅ Services displayed:', bookResult.success);
    
    // Step 3: Select service and check the response
    console.log('\n📊 Step 3: Select service and check response');
    const serviceResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/whatsapp/simple/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber: TEST_CONFIG.testPhoneNumber,
        message: 'Hair Cut & Style'
      })
    });
    
    const serviceResult = await serviceResponse.json();
    console.log('✅ Service selection result:');
    console.log('Success:', serviceResult.success);
    console.log('Current step:', serviceResult.currentStep);
    console.log('Next step:', serviceResult.nextStep);
    console.log('Message preview:', serviceResult.message?.substring(0, 200) + '...');
    
    // Step 4: Try to select date
    console.log('\n📊 Step 4: Try to select date');
    const dateResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/whatsapp/simple/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber: TEST_CONFIG.testPhoneNumber,
        message: 'tomorrow'
      })
    });
    
    const dateResult = await dateResponse.json();
    console.log('✅ Date selection result:');
    console.log('Success:', dateResult.success);
    console.log('Current step:', dateResult.currentStep);
    console.log('Next step:', dateResult.nextStep);
    console.log('Message preview:', dateResult.message?.substring(0, 200) + '...');
    
  } catch (error) {
    console.error('❌ Error debugging service selection:', error);
  }
}

debugServiceSelection();