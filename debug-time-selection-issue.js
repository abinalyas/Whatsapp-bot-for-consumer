/**
 * Debug Time Selection Issue
 * Check what's happening with time selection in the smart staff matching
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const TEST_CONFIG = {
  baseUrl: 'https://whatsapp-bot-for-consumer.vercel.app',
  testPhoneNumber: '98765432188'
};

async function debugTimeSelectionIssue() {
  console.log('🔍 Debug Time Selection Issue');
  console.log('==============================\n');
  
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
    
    // Step 3: Select service
    const serviceResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/whatsapp/simple/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber: TEST_CONFIG.testPhoneNumber,
        message: 'Hair Cut & Style'
      })
    });
    
    const serviceResult = await serviceResponse.json();
    console.log('✅ Service selected:', serviceResult.success);
    console.log('Current step:', serviceResult.currentStep);
    console.log('Next step:', serviceResult.nextStep);
    
    // Step 4: Select date
    const dateResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/whatsapp/simple/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber: TEST_CONFIG.testPhoneNumber,
        message: 'tomorrow'
      })
    });
    
    const dateResult = await dateResponse.json();
    console.log('✅ Date selected:', dateResult.success);
    console.log('Current step:', dateResult.currentStep);
    console.log('Next step:', dateResult.nextStep);
    console.log('Message preview:', dateResult.message?.substring(0, 200) + '...');
    
    // Step 5: Select time (this is where it's failing)
    console.log('\n📊 Step 5: Select time (debugging this step)');
    const timeResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/whatsapp/simple/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber: TEST_CONFIG.testPhoneNumber,
        message: '1'
      })
    });
    
    const timeResult = await timeResponse.json();
    console.log('❌ Time selection result:');
    console.log('Success:', timeResult.success);
    console.log('Current step:', timeResult.currentStep);
    console.log('Next step:', timeResult.nextStep);
    console.log('Message:', timeResult.message);
    console.log('Error:', timeResult.error);
    
  } catch (error) {
    console.error('❌ Error debugging time selection:', error);
  }
}

debugTimeSelectionIssue();
