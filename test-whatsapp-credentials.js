/**
 * Test WhatsApp Credentials
 * Check if WhatsApp credentials are properly configured
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

function testWhatsAppCredentials() {
  console.log('🔍 Test WhatsApp Credentials');
  console.log('============================\n');
  
  const credentials = {
    WHATSAPP_TOKEN: process.env.WHATSAPP_TOKEN,
    WHATSAPP_PHONE_ID: process.env.WHATSAPP_PHONE_ID,
    WHATSAPP_VERIFY_TOKEN: process.env.WHATSAPP_VERIFY_TOKEN
  };
  
  console.log('📊 WhatsApp Credentials:');
  console.log(`WHATSAPP_TOKEN: ${credentials.WHATSAPP_TOKEN ? '✅ SET' : '❌ MISSING'}`);
  console.log(`WHATSAPP_PHONE_ID: ${credentials.WHATSAPP_PHONE_ID ? '✅ SET' : '❌ MISSING'}`);
  console.log(`WHATSAPP_VERIFY_TOKEN: ${credentials.WHATSAPP_VERIFY_TOKEN ? '✅ SET' : '❌ MISSING'}`);
  
  if (credentials.WHATSAPP_TOKEN) {
    console.log(`Token length: ${credentials.WHATSAPP_TOKEN.length} characters`);
    console.log(`Token starts with: ${credentials.WHATSAPP_TOKEN.substring(0, 10)}...`);
  }
  
  if (credentials.WHATSAPP_PHONE_ID) {
    console.log(`Phone ID: ${credentials.WHATSAPP_PHONE_ID}`);
  }
  
  if (credentials.WHATSAPP_VERIFY_TOKEN) {
    console.log(`Verify Token: ${credentials.WHATSAPP_VERIFY_TOKEN}`);
  }
  
  console.log('\n🎯 Analysis:');
  if (!credentials.WHATSAPP_TOKEN || !credentials.WHATSAPP_PHONE_ID) {
    console.log('❌ WhatsApp credentials are missing or incomplete');
    console.log('This would cause the "technical difficulties" error when trying to send messages');
  } else {
    console.log('✅ WhatsApp credentials appear to be configured');
    console.log('The issue might be elsewhere in the webhook processing');
  }
}

testWhatsAppCredentials();
