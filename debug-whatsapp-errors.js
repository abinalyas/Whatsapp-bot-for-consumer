/**
 * Debug WhatsApp Errors
 * Debug why WhatsApp Bot is showing technical difficulties error
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const TEST_CONFIG = {
  baseUrl: 'https://whatsapp-bot-for-consumer.vercel.app',
  testPhoneNumber: '98765432177'
};

async function debugWhatsAppErrors() {
  console.log('🔍 Debug WhatsApp Errors');
  console.log('========================\n');
  
  try {
    // Test 1: Check if the simple webhook endpoint is working
    console.log('📊 Test 1: Checking simple webhook endpoint');
    const webhookResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/whatsapp/simple/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phoneNumber: TEST_CONFIG.testPhoneNumber,
        message: 'hi'
      })
    });
    
    if (webhookResponse.ok) {
      const result = await webhookResponse.json();
      console.log(`✅ Simple webhook working: ${result.success}`);
      console.log(`📱 Response: ${result.message?.substring(0, 100)}...`);
    } else {
      console.log(`❌ Simple webhook error: ${webhookResponse.status}`);
      const errorText = await webhookResponse.text();
      console.log(`   Error: ${errorText}`);
    }
    
    // Test 2: Check the main webhook endpoint
    console.log('\n📊 Test 2: Checking main webhook endpoint');
    const mainWebhookResponse = await fetch(`${TEST_CONFIG.baseUrl}/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        entry: [{
          changes: [{
            value: {
              messages: [{
                id: 'test123',
                from: TEST_CONFIG.testPhoneNumber,
                type: 'text',
                text: { body: 'hi' },
                timestamp: new Date().toISOString()
              }]
            }
          }]
        }]
      })
    });
    
    if (mainWebhookResponse.ok) {
      const mainResult = await mainWebhookResponse.text();
      console.log(`✅ Main webhook working: ${mainWebhookResponse.status}`);
      console.log(`📱 Response: ${mainResult}`);
    } else {
      console.log(`❌ Main webhook error: ${mainWebhookResponse.status}`);
      const errorText = await mainWebhookResponse.text();
      console.log(`   Error: ${errorText}`);
    }
    
    // Test 3: Check the API webhook endpoint
    console.log('\n📊 Test 3: Checking API webhook endpoint');
    const apiWebhookResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/webhook/whatsapp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        entry: [{
          changes: [{
            value: {
              messages: [{
                id: 'test456',
                from: TEST_CONFIG.testPhoneNumber,
                type: 'text',
                text: { body: 'hi' },
                timestamp: new Date().toISOString()
              }]
            }
          }]
        }]
      })
    });
    
    if (apiWebhookResponse.ok) {
      const apiResult = await apiWebhookResponse.text();
      console.log(`✅ API webhook working: ${apiWebhookResponse.status}`);
      console.log(`📱 Response: ${apiResult}`);
    } else {
      console.log(`❌ API webhook error: ${apiWebhookResponse.status}`);
      const errorText = await apiWebhookResponse.text();
      console.log(`   Error: ${errorText}`);
    }
    
    // Test 4: Test a complete booking flow to see where it fails
    console.log('\n📊 Test 4: Testing complete booking flow');
    const bookingSteps = ['hi', 'book', 'hair cut', 'tomorrow', '10 am', '1', 'yes'];
    
    for (const step of bookingSteps) {
      console.log(`\n   💬 Testing: "${step}"`);
      
      try {
        const stepResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/whatsapp/simple/test`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            phoneNumber: TEST_CONFIG.testPhoneNumber,
            message: step
          })
        });
        
        if (stepResponse.ok) {
          const stepResult = await stepResponse.json();
          console.log(`   ✅ Success: ${stepResult.success}`);
          
          if (stepResult.message && stepResult.message.includes('technical difficulties')) {
            console.log(`   ❌ Found technical difficulties error!`);
            console.log(`   📱 Full response: ${stepResult.message}`);
            break;
          } else {
            console.log(`   📱 Response preview: ${stepResult.message?.substring(0, 80)}...`);
          }
        } else {
          console.log(`   ❌ Error: ${stepResponse.status}`);
          const errorText = await stepResponse.text();
          console.log(`   📱 Error details: ${errorText}`);
        }
      } catch (error) {
        console.log(`   ❌ Exception: ${error.message}`);
      }
    }
    
    // Test 5: Check if there are any recent error logs
    console.log('\n📊 Test 5: Checking for error patterns');
    
    // Test with different phone numbers to see if it's phone-specific
    const testPhoneNumbers = ['98765432177', '919567882568', '98765432188'];
    
    for (const phone of testPhoneNumbers) {
      console.log(`\n   📱 Testing with phone: ${phone}`);
      
      try {
        const phoneResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/whatsapp/simple/test`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            phoneNumber: phone,
            message: 'hi'
          })
        });
        
        if (phoneResponse.ok) {
          const phoneResult = await phoneResponse.json();
          if (phoneResult.message && phoneResult.message.includes('technical difficulties')) {
            console.log(`   ❌ Technical difficulties with phone ${phone}`);
          } else {
            console.log(`   ✅ Working with phone ${phone}`);
          }
        } else {
          console.log(`   ❌ Error with phone ${phone}: ${phoneResponse.status}`);
        }
      } catch (error) {
        console.log(`   ❌ Exception with phone ${phone}: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error debugging WhatsApp errors:', error);
  }
}

async function main() {
  console.log('🚀 Debug WhatsApp Errors');
  console.log('========================\n');
  
  await debugWhatsAppErrors();
  
  console.log('\n🎯 Next Steps:');
  console.log('- Identify which endpoint is causing the technical difficulties error');
  console.log('- Check for specific error conditions');
  console.log('- Fix the underlying issue');
}

main().catch(console.error);
