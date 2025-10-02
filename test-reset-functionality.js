/**
 * Test Reset Functionality
 * Test the conversation state reset functionality
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const TEST_CONFIG = {
  baseUrl: 'https://whatsapp-bot-for-consumer.vercel.app',
  testPhoneNumber: '98765432177'
};

async function testResetFunctionality() {
  console.log('🔍 Test Reset Functionality');
  console.log('===========================\n');
  
  try {
    // Step 1: Reset the conversation state
    console.log('📊 Step 1: Resetting conversation state');
    const resetResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/whatsapp/simple/reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phoneNumber: TEST_CONFIG.testPhoneNumber
      })
    });
    
    console.log(`Status: ${resetResponse.status}`);
    const resetResult = await resetResponse.json();
    console.log(`Response: ${resetResult.message}`);
    
    if (resetResponse.status !== 200) {
      console.log('❌ Failed to reset conversation state');
      return;
    }
    
    // Step 2: Test with "hi" message
    console.log('\n📊 Step 2: Testing "hi" message after reset');
    const hiResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/whatsapp/simple/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phoneNumber: TEST_CONFIG.testPhoneNumber,
        message: 'hi'
      })
    });
    
    console.log(`Status: ${hiResponse.status}`);
    const hiResult = await hiResponse.json();
    console.log(`Response: ${hiResult.message}`);
    
    // Step 3: Test with "book" message
    console.log('\n📊 Step 3: Testing "book" message after reset');
    const bookResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/whatsapp/simple/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phoneNumber: TEST_CONFIG.testPhoneNumber,
        message: 'book'
      })
    });
    
    console.log(`Status: ${bookResponse.status}`);
    const bookResult = await bookResponse.json();
    console.log(`Response: ${bookResult.message?.substring(0, 100)}...`);
    
    // Step 4: Test service selection
    console.log('\n📊 Step 4: Testing service selection');
    const serviceResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/whatsapp/simple/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phoneNumber: TEST_CONFIG.testPhoneNumber,
        message: 'Hair Cut & Style'
      })
    });
    
    console.log(`Status: ${serviceResponse.status}`);
    const serviceResult = await serviceResponse.json();
    console.log(`Response: ${serviceResult.message?.substring(0, 100)}...`);
    
    // Step 5: Test "reset" message
    console.log('\n📊 Step 5: Testing "reset" message');
    const resetMessageResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/whatsapp/simple/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phoneNumber: TEST_CONFIG.testPhoneNumber,
        message: 'reset'
      })
    });
    
    console.log(`Status: ${resetMessageResponse.status}`);
    const resetMessageResult = await resetMessageResponse.json();
    console.log(`Response: ${resetMessageResult.message}`);
    
    // Step 6: Test "hi" after reset message
    console.log('\n📊 Step 6: Testing "hi" after reset message');
    const hiAfterResetResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/whatsapp/simple/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phoneNumber: TEST_CONFIG.testPhoneNumber,
        message: 'hi'
      })
    });
    
    console.log(`Status: ${hiAfterResetResponse.status}`);
    const hiAfterResetResult = await hiAfterResetResponse.json();
    console.log(`Response: ${hiAfterResetResult.message}`);
    
  } catch (error) {
    console.error('❌ Error testing reset functionality:', error);
  }
}

async function main() {
  console.log('🚀 Test Reset Functionality');
  console.log('===========================\n');
  
  await testResetFunctionality();
  
  console.log('\n🎯 Analysis:');
  console.log('- Check if conversation state reset is working');
  console.log('- Verify that "reset" message clears the state');
  console.log('- Ensure fresh conversations work properly');
}

main().catch(console.error);
