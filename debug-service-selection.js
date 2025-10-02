/**
 * Debug Service Selection Issue
 * Debug why selecting a service name causes technical difficulties error
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const TEST_CONFIG = {
  baseUrl: 'https://whatsapp-bot-for-consumer.vercel.app',
  testPhoneNumber: '98765432177'
};

async function debugServiceSelection() {
  console.log('🔍 Debug Service Selection Issue');
  console.log('================================\n');
  
  try {
    // Step 1: Start booking flow
    console.log('📊 Step 1: Starting booking flow');
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
    
    if (bookResponse.status !== 200) {
      console.log('❌ Failed to start booking flow');
      return;
    }
    
    // Step 2: Try different service selections
    const serviceTests = [
      'Hair Cut & Style',
      'hair cut',
      'Hair Cut',
      '1',
      'Facial Cleanup',
      'facial',
      'Bridal Makeup',
      'bridal'
    ];
    
    for (const service of serviceTests) {
      console.log(`\n📊 Testing service selection: "${service}"`);
      
      try {
        const serviceResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/whatsapp/simple/test`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            phoneNumber: TEST_CONFIG.testPhoneNumber,
            message: service
          })
        });
        
        console.log(`Status: ${serviceResponse.status}`);
        
        if (serviceResponse.ok) {
          const serviceResult = await serviceResponse.json();
          console.log(`✅ Success: ${serviceResult.success}`);
          console.log(`📱 Response: ${serviceResult.message?.substring(0, 100)}...`);
          
          if (serviceResult.message && serviceResult.message.includes('technical difficulties')) {
            console.log(`❌ Found technical difficulties error!`);
            console.log(`📱 Full response: ${serviceResult.message}`);
          }
        } else {
          const errorText = await serviceResponse.text();
          console.log(`❌ Error: ${serviceResponse.status}`);
          console.log(`📱 Error details: ${errorText}`);
        }
      } catch (error) {
        console.log(`❌ Exception: ${error.message}`);
      }
    }
    
    // Step 3: Test with a fresh phone number
    console.log('\n📊 Step 3: Testing with fresh phone number');
    const freshPhone = '98765432199';
    
    // Start fresh conversation
    const freshBookResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/whatsapp/simple/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phoneNumber: freshPhone,
        message: 'book'
      })
    });
    
    console.log(`Fresh book status: ${freshBookResponse.status}`);
    
    if (freshBookResponse.ok) {
      // Try service selection
      const freshServiceResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/whatsapp/simple/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phoneNumber: freshPhone,
          message: 'Hair Cut & Style'
        })
      });
      
      console.log(`Fresh service status: ${freshServiceResponse.status}`);
      const freshResult = await freshServiceResponse.json();
      console.log(`Fresh service response: ${freshResult.message?.substring(0, 100)}...`);
    }
    
  } catch (error) {
    console.error('❌ Error debugging service selection:', error);
  }
}

async function main() {
  console.log('🚀 Debug Service Selection Issue');
  console.log('================================\n');
  
  await debugServiceSelection();
  
  console.log('\n🎯 Next Steps:');
  console.log('- Identify which service selection is causing the error');
  console.log('- Check the handleServiceSelection method');
  console.log('- Fix the underlying issue');
}

main().catch(console.error);
