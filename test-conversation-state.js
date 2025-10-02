/**
 * Test Conversation State
 * Test if the conversation state is being managed correctly
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const TEST_CONFIG = {
  baseUrl: 'https://whatsapp-bot-for-consumer.vercel.app',
  testPhoneNumber: '98765432177'
};

async function testConversationState() {
  console.log('🔍 Test Conversation State');
  console.log('==========================\n');
  
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
    
    console.log(`Status: ${resetResponse.status}`);
    
    // Step 2: Start booking flow
    console.log('\n📊 Step 2: Starting booking flow');
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
    
    // Step 3: Select a service
    console.log('\n📊 Step 3: Selecting service');
    const serviceResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/whatsapp/simple/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phoneNumber: TEST_CONFIG.testPhoneNumber,
        message: 'Manicure'
      })
    });
    
    console.log(`Status: ${serviceResponse.status}`);
    
    // Step 4: Select a date
    console.log('\n📊 Step 4: Selecting date');
    const dateResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/whatsapp/simple/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phoneNumber: TEST_CONFIG.testPhoneNumber,
        message: '1'
      })
    });
    
    console.log(`Status: ${dateResponse.status}`);
    const dateResult = await dateResponse.json();
    console.log(`Available time slots:`);
    console.log(dateResult.message);
    
    // Step 5: Test different time inputs
    const timeInputs = ['9 am', '1', '09:00'];
    
    for (const timeInput of timeInputs) {
      console.log(`\n📊 Testing time input: "${timeInput}"`);
      
      // Reset to time selection step
      const resetTimeResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/whatsapp/simple/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phoneNumber: TEST_CONFIG.testPhoneNumber
        })
      });
      
      // Go through the flow quickly
      await fetch(`${TEST_CONFIG.baseUrl}/api/whatsapp/simple/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: TEST_CONFIG.testPhoneNumber,
          message: 'book'
        })
      });
      
      await fetch(`${TEST_CONFIG.baseUrl}/api/whatsapp/simple/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: TEST_CONFIG.testPhoneNumber,
          message: 'Manicure'
        })
      });
      
      await fetch(`${TEST_CONFIG.baseUrl}/api/whatsapp/simple/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: TEST_CONFIG.testPhoneNumber,
          message: '1'
        })
      });
      
      // Now test the time input
      const timeTestResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/whatsapp/simple/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phoneNumber: TEST_CONFIG.testPhoneNumber,
          message: timeInput
        })
      });
      
      console.log(`Status: ${timeTestResponse.status}`);
      const timeTestResult = await timeTestResponse.json();
      console.log(`Response: ${timeTestResult.message?.substring(0, 100)}...`);
      
      if (timeTestResult.message && timeTestResult.message.includes('selected:')) {
        const timeMatch = timeTestResult.message.match(/selected:\s*(\d{1,2}:\d{2})/);
        if (timeMatch) {
          console.log(`✅ Selected time: ${timeMatch[1]}`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing conversation state:', error);
  }
}

async function main() {
  console.log('🚀 Test Conversation State');
  console.log('==========================\n');
  
  await testConversationState();
  
  console.log('\n🎯 Analysis:');
  console.log('- Check if conversation state is being managed correctly');
  console.log('- Test different time input formats');
  console.log('- Look for patterns in the responses');
}

main().catch(console.error);
