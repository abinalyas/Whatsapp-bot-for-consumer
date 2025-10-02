/**
 * Debug Service Matching
 * Debug the service matching logic
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const TEST_CONFIG = {
  baseUrl: 'https://whatsapp-bot-for-consumer.vercel.app',
};

async function debugServiceMatching() {
  console.log('🔍 Debug Service Matching');
  console.log('=======================\n');
  
  const uniquePhoneNumber = `987654321${Math.floor(Math.random() * 1000)}`;
  console.log(`📱 Using unique phone number: ${uniquePhoneNumber}`);
  
  try {
    // Step 1: Start booking to see available services
    console.log('\n📱 Step 1: Start booking');
    const startResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/whatsapp/simple/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phoneNumber: uniquePhoneNumber,
        message: 'book'
      })
    });
    
    const startResult = await startResponse.json();
    console.log(`✅ Status: ${startResponse.status}`);
    console.log(`📱 Response: ${startResult.message}`);
    console.log(`📄 Current Step: ${startResult.currentStep}`);
    
    // Step 2: Try different service selection methods
    const serviceTests = [
      { message: 'hair cut', description: 'hair cut' },
      { message: 'haircut', description: 'haircut' },
      { message: 'hair', description: 'hair' },
      { message: '1', description: 'number 1' },
      { message: '2', description: 'number 2' },
      { message: '3', description: 'number 3' }
    ];
    
    for (const test of serviceTests) {
      console.log(`\n📱 Testing: ${test.description}`);
      console.log(`💬 Message: "${test.message}"`);
      
      const response = await fetch(`${TEST_CONFIG.baseUrl}/api/whatsapp/simple/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: uniquePhoneNumber,
          message: test.message
        })
      });
      
      const result = await response.json();
      console.log(`✅ Status: ${response.status}`);
      
      if (result.success) {
        console.log(`🎉 SUCCESS: Bot responded`);
        console.log(`📱 Response: ${result.message.substring(0, 150)}...`);
        console.log(`📄 Current Step: ${result.currentStep}`);
        
        if (result.currentStep === 'date_selection') {
          console.log(`✅ Service selection successful!`);
          break;
        }
      } else {
        console.log(`❌ FAILED: ${result.error}`);
        console.log(`📄 Current Step: ${result.currentStep}`);
      }
      
      // Add delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
  }
}

async function main() {
  console.log('🚀 Debug Service Matching');
  console.log('========================\n');
  
  await debugServiceMatching();
  
  console.log('\n🎯 Analysis:');
  console.log('- Check which service selection method works');
  console.log('- Identify the exact matching logic issue');
  console.log('- Fix the service matching in the WhatsApp Bot');
}

main().catch(console.error);
