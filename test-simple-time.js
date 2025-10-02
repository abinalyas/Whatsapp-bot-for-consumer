/**
 * Test Simple Time Selection
 * Test with a minimal flow to isolate the issue
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const TEST_CONFIG = {
  baseUrl: 'https://whatsapp-bot-for-consumer.vercel.app',
  testPhoneNumber: '98765432177'
};

async function testSimpleTime() {
  console.log('🔍 Test Simple Time Selection');
  console.log('=============================\n');
  
  try {
    // Reset and go through the flow step by step
    console.log('📊 Resetting conversation state');
    await fetch(`${TEST_CONFIG.baseUrl}/api/whatsapp/simple/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber: TEST_CONFIG.testPhoneNumber })
    });
    
    console.log('📊 Starting booking flow');
    await fetch(`${TEST_CONFIG.baseUrl}/api/whatsapp/simple/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber: TEST_CONFIG.testPhoneNumber,
        message: 'book'
      })
    });
    
    console.log('📊 Selecting service');
    await fetch(`${TEST_CONFIG.baseUrl}/api/whatsapp/simple/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber: TEST_CONFIG.testPhoneNumber,
        message: 'Manicure'
      })
    });
    
    console.log('📊 Selecting date');
    const dateResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/whatsapp/simple/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber: TEST_CONFIG.testPhoneNumber,
        message: '1'
      })
    });
    
    const dateResult = await dateResponse.json();
    console.log('Available time slots:');
    console.log(dateResult.message);
    
    // Test with the exact time format from the list
    console.log('\n📊 Testing with exact time format "09:00"');
    const timeResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/whatsapp/simple/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber: TEST_CONFIG.testPhoneNumber,
        message: '09:00'
      })
    });
    
    const timeResult = await timeResponse.json();
    console.log(`Response: ${timeResult.message?.substring(0, 100)}...`);
    
    if (timeResult.message && timeResult.message.includes('selected:')) {
      const timeMatch = timeResult.message.match(/selected:\s*(\d{1,2}:\d{2})/);
      if (timeMatch) {
        console.log(`✅ Selected time: ${timeMatch[1]}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing simple time:', error);
  }
}

async function main() {
  console.log('🚀 Test Simple Time Selection');
  console.log('=============================\n');
  
  await testSimpleTime();
  
  console.log('\n🎯 Analysis:');
  console.log('- Test with exact time format to see if the issue persists');
  console.log('- Check if the fallback logic is overriding correct selection');
}

main().catch(console.error);
