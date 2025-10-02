/**
 * Debug Greeting Issue
 * Debug why the greeting/welcome message is causing a 500 error
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const TEST_CONFIG = {
  baseUrl: 'https://whatsapp-bot-for-consumer.vercel.app',
  testPhoneNumber: '98765432177'
};

async function debugGreetingIssue() {
  console.log('🔍 Debug Greeting Issue');
  console.log('======================\n');
  
  try {
    // Test 1: Send "hi" message
    console.log('📊 Test 1: Sending "hi" message');
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
    const hiResult = await hiResponse.text();
    console.log(`Response: ${hiResult}`);
    
    // Test 2: Send "hello" message
    console.log('\n📊 Test 2: Sending "hello" message');
    const helloResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/whatsapp/simple/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phoneNumber: TEST_CONFIG.testPhoneNumber,
        message: 'hello'
      })
    });
    
    console.log(`Status: ${helloResponse.status}`);
    const helloResult = await helloResponse.text();
    console.log(`Response: ${helloResult}`);
    
    // Test 3: Send "book" message (should work)
    console.log('\n📊 Test 3: Sending "book" message');
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
    const bookResult = await bookResponse.text();
    console.log(`Response: ${bookResult}`);
    
    // Test 4: Send "start" message
    console.log('\n📊 Test 4: Sending "start" message');
    const startResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/whatsapp/simple/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phoneNumber: TEST_CONFIG.testPhoneNumber,
        message: 'start'
      })
    });
    
    console.log(`Status: ${startResponse.status}`);
    const startResult = await startResponse.text();
    console.log(`Response: ${startResult}`);
    
    // Test 5: Send empty message
    console.log('\n📊 Test 5: Sending empty message');
    const emptyResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/whatsapp/simple/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phoneNumber: TEST_CONFIG.testPhoneNumber,
        message: ''
      })
    });
    
    console.log(`Status: ${emptyResponse.status}`);
    const emptyResult = await emptyResponse.text();
    console.log(`Response: ${emptyResult}`);
    
  } catch (error) {
    console.error('❌ Error debugging greeting issue:', error);
  }
}

async function main() {
  console.log('🚀 Debug Greeting Issue');
  console.log('======================\n');
  
  await debugGreetingIssue();
  
  console.log('\n🎯 Analysis:');
  console.log('- If "hi" returns 500 but "book" works, there might be an issue with greeting handling');
  console.log('- If both return 500, there might be a broader issue');
  console.log('- Check the response messages to understand the error');
}

main().catch(console.error);
