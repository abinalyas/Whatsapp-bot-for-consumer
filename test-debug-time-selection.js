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

async function testDebugTimeSelection() {
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
    console.log('\n📊 Step 5: Testing time input "9 am"');
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
    
    if (timeResult.message && timeResult.message.includes('selected:')) {
      const timeMatch = timeResult.message.match(/selected:\s*(\d{1,2}:\d{2})/);
      if (timeMatch) {
        console.log(`✅ Selected time: ${timeMatch[1]}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing debug time selection:', error);
  }
}

async function main() {
  console.log('🚀 Test Debug Time Selection');
  console.log('============================\n');
  
  await testDebugTimeSelection();
  
  console.log('\n🎯 Analysis:');
  console.log('- Check the debug logs to see what\'s happening with time parsing');
  console.log('- Look for where the correct time is being overridden');
}

main().catch(console.error);
