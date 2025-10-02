/**
 * Debug Specific Error
 * Debug the exact error that's occurring during service selection
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const TEST_CONFIG = {
  baseUrl: 'https://whatsapp-bot-for-consumer.vercel.app',
  testPhoneNumber: '98765432177'
};

async function debugSpecificError() {
  console.log('🔍 Debug Specific Error');
  console.log('======================\n');
  
  try {
    // Step 1: Start fresh conversation
    console.log('📊 Step 1: Starting fresh conversation');
    const startResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/whatsapp/simple/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phoneNumber: TEST_CONFIG.testPhoneNumber,
        message: 'book'
      })
    });
    
    console.log(`Status: ${startResponse.status}`);
    const startResult = await startResponse.json();
    console.log(`Response: ${startResult.message?.substring(0, 100)}...`);
    
    if (startResponse.status !== 200) {
      console.log('❌ Failed to start conversation');
      return;
    }
    
    // Step 2: Select a service
    console.log('\n📊 Step 2: Selecting service');
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
    
    if (serviceResponse.status !== 200) {
      console.log('❌ Failed to select service');
      return;
    }
    
    // Step 3: Try to select another service (this should fail gracefully)
    console.log('\n📊 Step 3: Trying to select another service');
    const anotherServiceResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/whatsapp/simple/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phoneNumber: TEST_CONFIG.testPhoneNumber,
        message: 'Facial Cleanup'
      })
    });
    
    console.log(`Status: ${anotherServiceResponse.status}`);
    const anotherServiceResult = await anotherServiceResponse.json();
    console.log(`Response: ${anotherServiceResult.message}`);
    
    // Step 4: Try with a fresh phone number to see if it works
    console.log('\n📊 Step 4: Testing with fresh phone number');
    const freshPhone = '98765432188';
    
    const freshStartResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/whatsapp/simple/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phoneNumber: freshPhone,
        message: 'book'
      })
    });
    
    console.log(`Fresh start status: ${freshStartResponse.status}`);
    
    if (freshStartResponse.ok) {
      const freshServiceResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/whatsapp/simple/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phoneNumber: freshPhone,
          message: 'Facial Cleanup'
        })
      });
      
      console.log(`Fresh service status: ${freshServiceResponse.status}`);
      const freshServiceResult = await freshServiceResponse.json();
      console.log(`Fresh service response: ${freshServiceResult.message?.substring(0, 100)}...`);
    }
    
  } catch (error) {
    console.error('❌ Error debugging specific error:', error);
  }
}

async function main() {
  console.log('🚀 Debug Specific Error');
  console.log('======================\n');
  
  await debugSpecificError();
  
  console.log('\n🎯 Analysis:');
  console.log('- The issue occurs when trying to select a service during the wrong step');
  console.log('- Need to add better error handling for wrong step inputs');
  console.log('- Should provide clear guidance on what to do next');
}

main().catch(console.error);
