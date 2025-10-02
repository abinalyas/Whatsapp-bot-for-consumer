/**
 * Debug Basic Webhook
 * Debug if the basic webhook functionality is working
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const TEST_CONFIG = {
  baseUrl: 'https://whatsapp-bot-for-consumer.vercel.app'
};

async function debugBasicWebhook() {
  console.log('🔍 Debug Basic Webhook');
  console.log('======================\n');
  
  try {
    // Test 1: Check if the simple webhook endpoint is accessible
    console.log('📊 Test 1: Checking simple webhook endpoint');
    const webhookResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/whatsapp/simple/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phoneNumber: '98765432177',
        message: 'test'
      })
    });
    
    console.log(`Status: ${webhookResponse.status}`);
    const webhookResult = await webhookResponse.text();
    console.log(`Response: ${webhookResult}`);
    
    // Test 2: Check if the main webhook endpoint is accessible
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
                from: '98765432177',
                type: 'text',
                text: { body: 'test' },
                timestamp: new Date().toISOString()
              }]
            }
          }]
        }]
      })
    });
    
    console.log(`Status: ${mainWebhookResponse.status}`);
    const mainWebhookResult = await mainWebhookResponse.text();
    console.log(`Response: ${mainWebhookResult}`);
    
    // Test 3: Check if the API webhook endpoint is accessible
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
                from: '98765432177',
                type: 'text',
                text: { body: 'test' },
                timestamp: new Date().toISOString()
              }]
            }
          }]
        }]
      })
    });
    
    console.log(`Status: ${apiWebhookResponse.status}`);
    const apiWebhookResult = await apiWebhookResponse.text();
    console.log(`Response: ${apiWebhookResult}`);
    
    // Test 4: Check if the app is running
    console.log('\n📊 Test 4: Checking if app is running');
    const appResponse = await fetch(`${TEST_CONFIG.baseUrl}/`);
    
    console.log(`Status: ${appResponse.status}`);
    if (appResponse.ok) {
      console.log('✅ App is running');
    } else {
      console.log('❌ App is not running');
    }
    
  } catch (error) {
    console.error('❌ Error debugging basic webhook:', error);
  }
}

async function main() {
  console.log('🚀 Debug Basic Webhook');
  console.log('======================\n');
  
  await debugBasicWebhook();
  
  console.log('\n🎯 Analysis:');
  console.log('- Check if the webhook endpoints are accessible');
  console.log('- Verify if the app is running properly');
  console.log('- Identify which endpoint is causing issues');
}

main().catch(console.error);
