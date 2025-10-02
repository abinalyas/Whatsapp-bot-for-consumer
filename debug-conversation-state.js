/**
 * Debug Conversation State
 * Debug the conversation state management issue
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const TEST_CONFIG = {
  baseUrl: 'https://whatsapp-bot-for-consumer.vercel.app',
  testPhoneNumber: '98765432177'
};

async function debugConversationState() {
  console.log('🔍 Debug Conversation State');
  console.log('============================\n');
  
  try {
    // Test with a completely new phone number
    const newPhone = '98765432199';
    
    console.log(`📱 Testing with phone: ${newPhone}`);
    
    // Step 1: Send "hi"
    console.log('\n📊 Step 1: Sending "hi"');
    const hiResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/whatsapp/simple/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phoneNumber: newPhone,
        message: 'hi'
      })
    });
    
    console.log(`Status: ${hiResponse.status}`);
    const hiResult = await hiResponse.json();
    console.log(`Response: ${hiResult.message}`);
    
    // Step 2: Send "book"
    console.log('\n📊 Step 2: Sending "book"');
    const bookResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/whatsapp/simple/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phoneNumber: newPhone,
        message: 'book'
      })
    });
    
    console.log(`Status: ${bookResponse.status}`);
    const bookResult = await bookResponse.json();
    console.log(`Response: ${bookResult.message?.substring(0, 100)}...`);
    
    if (bookResponse.status !== 200) {
      console.log('❌ Failed to start booking flow');
      return;
    }
    
    // Step 3: Select a service
    console.log('\n📊 Step 3: Selecting service');
    const serviceResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/whatsapp/simple/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phoneNumber: newPhone,
        message: 'Hair Cut & Style'
      })
    });
    
    console.log(`Status: ${serviceResponse.status}`);
    const serviceResult = await serviceResponse.json();
    console.log(`Response: ${serviceResult.message?.substring(0, 100)}...`);
    
    if (serviceResponse.status !== 200) {
      console.log('❌ Failed to select service');
      console.log(`Error: ${serviceResult.error}`);
      console.log(`Current Step: ${serviceResult.currentStep}`);
      return;
    }
    
    // Step 4: Try to select another service (should show helpful message)
    console.log('\n📊 Step 4: Trying to select another service');
    const anotherServiceResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/whatsapp/simple/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phoneNumber: newPhone,
        message: 'Facial Cleanup'
      })
    });
    
    console.log(`Status: ${anotherServiceResponse.status}`);
    const anotherServiceResult = await anotherServiceResponse.json();
    console.log(`Response: ${anotherServiceResult.message}`);
    
  } catch (error) {
    console.error('❌ Error debugging conversation state:', error);
  }
}

async function main() {
  console.log('🚀 Debug Conversation State');
  console.log('============================\n');
  
  await debugConversationState();
  
  console.log('\n🎯 Analysis:');
  console.log('- Check if conversation state is being properly managed');
  console.log('- Verify error handling in each step');
  console.log('- Ensure proper guidance is provided to users');
}

main().catch(console.error);
