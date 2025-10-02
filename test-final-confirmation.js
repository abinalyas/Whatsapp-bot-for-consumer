/**
 * Test Final Confirmation Step
 * Test just the final confirmation step to see debug logs
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const TEST_CONFIG = {
  baseUrl: 'https://whatsapp-bot-for-consumer.vercel.app',
  testPhoneNumber: '9876543210',
};

async function testFinalConfirmation() {
  console.log('🧪 Testing Final Confirmation Step');
  console.log('==================================\n');
  
  const bookingFlow = [
    { message: 'book', description: 'Start booking' },
    { message: 'hair cut', description: 'Select service' },
    { message: 'tomorrow', description: 'Select date' },
    { message: '10 am', description: 'Select time' },
    { message: '1', description: 'Select staff' },
    { message: 'yes', description: 'Confirm booking' }
  ];
  
  for (const step of bookingFlow) {
    console.log(`\n📱 Step: ${step.description}`);
    console.log(`💬 Message: "${step.message}"`);
    
    try {
      const response = await fetch(`${TEST_CONFIG.baseUrl}/api/whatsapp/simple/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: TEST_CONFIG.testPhoneNumber,
          message: step.message
        })
      });
      
      console.log(`✅ Status: ${response.status}`);
      const result = await response.json();
      
      if (result.success) {
        console.log(`🎉 SUCCESS: Bot responded`);
        console.log(`📱 Response: ${result.message.substring(0, 100)}...`);
        console.log(`📄 Current Step: ${result.currentStep}`);
        
        if (result.appointmentId) {
          console.log(`🎫 Appointment ID: ${result.appointmentId}`);
        }
      } else {
        console.log(`❌ FAILED: ${result.error}`);
        console.log(`📄 Current Step: ${result.currentStep}`);
      }
      
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
    }
    
    // Add delay between requests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

async function main() {
  console.log('🚀 Test Final Confirmation Step');
  console.log('==============================\n');
  
  await testFinalConfirmation();
  
  console.log('\n🎯 Expected Results:');
  console.log('- Debug logs should show the appointment creation process');
  console.log('- If successful, a booking should be created in the database');
  console.log('- If failed, debug logs should show the exact error');
}

main().catch(console.error);
