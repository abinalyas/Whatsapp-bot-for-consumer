/**
 * Debug Current Flow
 * Check what's actually happening in the current deployment
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const TEST_CONFIG = {
  baseUrl: 'https://whatsapp-bot-for-consumer.vercel.app',
  testPhoneNumber: '98765432188' // Use a different phone number to avoid cache
};

async function debugCurrentFlow() {
  console.log('🔍 Debug Current Flow');
  console.log('====================\n');
  
  try {
    // Step 1: Reset conversation state
    console.log('📊 Step 1: Reset conversation state');
    await fetch(`${TEST_CONFIG.baseUrl}/api/whatsapp/simple/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber: TEST_CONFIG.testPhoneNumber })
    });
    console.log('✅ Conversation state reset\n');
    
    // Step 2: Start booking flow
    console.log('📊 Step 2: Start booking flow');
    const bookResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/whatsapp/simple/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber: TEST_CONFIG.testPhoneNumber,
        message: 'book'
      })
    });
    
    const bookResult = await bookResponse.json();
    console.log('✅ Current step:', bookResult.currentStep);
    console.log('✅ Next step:', bookResult.nextStep);
    console.log('');
    
    // Step 3: Select a service
    console.log('📊 Step 3: Select Hair Cut & Style service');
    const serviceResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/whatsapp/simple/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber: TEST_CONFIG.testPhoneNumber,
        message: 'Hair Cut & Style'
      })
    });
    
    const serviceResult = await serviceResponse.json();
    console.log('✅ Current step:', serviceResult.currentStep);
    console.log('✅ Next step:', serviceResult.nextStep);
    console.log('');
    
    // Step 4: Select a date
    console.log('📊 Step 4: Select tomorrow as date');
    const dateResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/whatsapp/simple/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber: TEST_CONFIG.testPhoneNumber,
        message: 'tomorrow'
      })
    });
    
    const dateResult = await dateResponse.json();
    console.log('✅ Current step:', dateResult.currentStep);
    console.log('✅ Next step:', dateResult.nextStep);
    console.log('');
    
    // Step 5: Select a time slot
    console.log('📊 Step 5: Select time slot 1');
    const timeResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/whatsapp/simple/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber: TEST_CONFIG.testPhoneNumber,
        message: '1'
      })
    });
    
    const timeResult = await timeResponse.json();
    console.log('✅ Current step:', timeResult.currentStep);
    console.log('✅ Next step:', timeResult.nextStep);
    console.log('✅ Message preview:', timeResult.message.substring(0, 200) + '...');
    console.log('');
    
  } catch (error) {
    console.error('❌ Error debugging current flow:', error);
  }
}

debugCurrentFlow();
