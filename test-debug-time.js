/**
 * Test Debug Time Selection
 * Test time selection with debug logging
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const TEST_CONFIG = {
  baseUrl: 'https://whatsapp-bot-for-consumer.vercel.app',
  testPhoneNumber: '98765432177'
};

async function testDebugTime() {
  console.log('🔍 Test Debug Time Selection');
  console.log('============================\n');
  
  try {
    // Step 1: Reset conversation state
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
    
    // Step 2: Start booking flow
    await fetch(`${TEST_CONFIG.baseUrl}/api/whatsapp/simple/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber: TEST_CONFIG.testPhoneNumber,
        message: 'book'
      })
    });
    
    // Step 3: Select a service
    await fetch(`${TEST_CONFIG.baseUrl}/api/whatsapp/simple/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber: TEST_CONFIG.testPhoneNumber,
        message: 'Manicure'
      })
    });
    
    // Step 4: Select a date
    await fetch(`${TEST_CONFIG.baseUrl}/api/whatsapp/simple/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber: TEST_CONFIG.testPhoneNumber,
        message: '1'
      })
    });
    
    // Step 5: Test time input "9 am"
    console.log('\n📊 Testing time input: "9 am"');
    const timeResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/whatsapp/simple/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phoneNumber: TEST_CONFIG.testPhoneNumber,
        message: '9 am'
      })
    });
    
    console.log(`Status: ${timeResponse.status}`);
    const timeResult = await timeResponse.json();
    console.log(`Response: ${timeResult.message?.substring(0, 100)}...`);
    
  } catch (error) {
    console.error('❌ Error testing debug time:', error);
  }
}

async function main() {
  console.log('🚀 Test Debug Time Selection');
  console.log('============================\n');
  
  await testDebugTime();
  
  console.log('\n🎯 Analysis:');
  console.log('- Check the debug logs to see what\'s happening with time parsing');
  console.log('- Look for pattern matching issues');
}

main().catch(console.error);
