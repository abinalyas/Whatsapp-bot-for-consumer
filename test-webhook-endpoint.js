/**
 * Test Webhook Endpoint
 * Check if the webhook endpoint is working correctly
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const TEST_CONFIG = {
  baseUrl: 'https://whatsapp-bot-for-consumer.vercel.app',
  testPhoneNumber: '98765432190'
};

async function testWebhookEndpoint() {
  console.log('🔍 Test Webhook Endpoint');
  console.log('========================\n');
  
  try {
    // Test 1: Reset conversation
    console.log('📊 Test 1: Reset conversation');
    const resetResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/whatsapp/simple/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber: TEST_CONFIG.testPhoneNumber })
    });
    
    const resetResult = await resetResponse.json();
    console.log('Reset result:', resetResult);
    console.log('');
    
    // Test 2: Send a simple message
    console.log('📊 Test 2: Send simple message');
    const messageResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/whatsapp/simple/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber: TEST_CONFIG.testPhoneNumber,
        message: 'hello'
      })
    });
    
    const messageResult = await messageResponse.json();
    console.log('Message result:', messageResult);
    console.log('');
    
    // Test 3: Send book message
    console.log('📊 Test 3: Send book message');
    const bookResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/whatsapp/simple/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber: TEST_CONFIG.testPhoneNumber,
        message: 'book'
      })
    });
    
    const bookResult = await bookResponse.json();
    console.log('Book result:', bookResult);
    console.log('');
    
    // Test 4: Send service selection
    console.log('📊 Test 4: Send service selection');
    const serviceResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/whatsapp/simple/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber: TEST_CONFIG.testPhoneNumber,
        message: 'Hair Cut & Style'
      })
    });
    
    const serviceResult = await serviceResponse.json();
    console.log('Service result:', serviceResult);
    console.log('');
    
    // Test 5: Send date selection
    console.log('📊 Test 5: Send date selection');
    const dateResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/whatsapp/simple/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber: TEST_CONFIG.testPhoneNumber,
        message: 'tomorrow'
      })
    });
    
    const dateResult = await dateResponse.json();
    console.log('Date result:', dateResult);
    console.log('');
    
    // Test 6: Send time selection (this is where it fails)
    console.log('📊 Test 6: Send time selection (this is where it fails)');
    const timeResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/whatsapp/simple/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber: TEST_CONFIG.testPhoneNumber,
        message: '1'
      })
    });
    
    const timeResult = await timeResponse.json();
    console.log('Time result:', timeResult);
    console.log('');
    
  } catch (error) {
    console.error('❌ Error testing webhook endpoint:', error);
  }
}

testWebhookEndpoint();
