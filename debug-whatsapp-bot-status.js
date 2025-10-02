/**
 * Debug WhatsApp Bot Status
 * Check if the WhatsApp Bot is responding to basic commands
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const TEST_CONFIG = {
  baseUrl: 'https://whatsapp-bot-for-consumer.vercel.app',
  testPhoneNumber: '98765432177'
};

async function debugWhatsAppBotStatus() {
  console.log('🔍 Debug WhatsApp Bot Status');
  console.log('===========================\n');
  
  try {
    // Test 1: Reset conversation state
    console.log('📊 Test 1: Reset conversation state');
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
    console.log(`Response: ${JSON.stringify(resetResult, null, 2)}`);
    
    // Test 2: Basic greeting
    console.log('\n📊 Test 2: Basic greeting');
    const greetingResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/whatsapp/simple/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phoneNumber: TEST_CONFIG.testPhoneNumber,
        message: 'hi'
      })
    });
    
    console.log(`Status: ${greetingResponse.status}`);
    const greetingResult = await greetingResponse.json();
    console.log(`Response: ${JSON.stringify(greetingResult, null, 2)}`);
    
    // Test 3: Book command
    console.log('\n📊 Test 3: Book command');
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
    console.log(`Response: ${JSON.stringify(bookResult, null, 2)}`);
    
    // Test 4: Check webhook status
    console.log('\n📊 Test 4: Check webhook status');
    const webhookResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/whatsapp/simple`, {
      method: 'GET'
    });
    
    console.log(`Status: ${webhookResponse.status}`);
    const webhookResult = await webhookResponse.text();
    console.log(`Response: ${webhookResult}`);
    
  } catch (error) {
    console.error('❌ Error debugging WhatsApp Bot status:', error);
  }
}

async function main() {
  console.log('🚀 Debug WhatsApp Bot Status');
  console.log('===========================\n');
  
  await debugWhatsAppBotStatus();
  
  console.log('\n🎯 Analysis:');
  console.log('- Check if the WhatsApp Bot is responding to basic commands');
  console.log('- Look for any server errors or configuration issues');
  console.log('- Verify the webhook endpoints are working');
}

main().catch(console.error);
