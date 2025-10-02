/**
 * Test Fresh Booking Flow
 * Test the complete booking flow with a fresh conversation state
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const TEST_CONFIG = {
  baseUrl: 'https://whatsapp-bot-for-consumer.vercel.app',
};

async function testFreshBookingFlow() {
  console.log('🧪 Testing Fresh Booking Flow');
  console.log('============================\n');
  
  // Use a unique phone number for this test
  const uniquePhoneNumber = `987654321${Math.floor(Math.random() * 1000)}`;
  console.log(`📱 Using unique phone number: ${uniquePhoneNumber}`);
  
  const bookingFlow = [
    { message: 'book', description: 'Start booking', expectedStep: 'service_selection' },
    { message: 'hair cut', description: 'Select service by name', expectedStep: 'date_selection' },
    { message: 'tomorrow', description: 'Select date', expectedStep: 'time_selection' },
    { message: '10 am', description: 'Select time', expectedStep: 'staff_selection' },
    { message: '1', description: 'Select staff', expectedStep: 'confirmation' },
    { message: 'yes', description: 'Confirm booking', expectedStep: 'completed' }
  ];
  
  let currentStep = 'welcome';
  
  for (const step of bookingFlow) {
    console.log(`\n📱 Step: ${step.description}`);
    console.log(`💬 Message: "${step.message}"`);
    console.log(`🎯 Expected Step: ${step.expectedStep}`);
    
    try {
      const response = await fetch(`${TEST_CONFIG.baseUrl}/api/whatsapp/simple/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: uniquePhoneNumber,
          message: step.message
        })
      });
      
      console.log(`✅ Status: ${response.status}`);
      const result = await response.json();
      
      if (result.success) {
        console.log(`🎉 SUCCESS: Bot responded`);
        console.log(`📱 Response: ${result.message.substring(0, 150)}...`);
        console.log(`📄 Current Step: ${result.currentStep}`);
        
        // Check if step matches expectation
        if (result.currentStep === step.expectedStep) {
          console.log(`✅ Step progression correct: ${currentStep} → ${result.currentStep}`);
        } else {
          console.log(`⚠️  Step progression unexpected: ${currentStep} → ${result.currentStep} (expected: ${step.expectedStep})`);
        }
        
        currentStep = result.currentStep;
        
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
  
  console.log('\n🎯 Final Results:');
  console.log(`📱 Final Step: ${currentStep}`);
  console.log(`✅ Booking Flow: ${currentStep === 'completed' ? 'COMPLETED' : 'INCOMPLETE'}`);
  
  if (currentStep === 'completed') {
    console.log('\n🎉 SUCCESS: Complete booking flow worked!');
    console.log('📊 The WhatsApp Bot is now fully functional!');
  } else {
    console.log('\n❌ ISSUE: Booking flow incomplete');
    console.log('🔍 Need to investigate the remaining issues');
  }
}

async function main() {
  console.log('🚀 Test Fresh Booking Flow');
  console.log('=========================\n');
  
  await testFreshBookingFlow();
  
  console.log('\n🎯 Summary:');
  console.log('- Fresh conversation state should work properly');
  console.log('- Complete booking flow should work end-to-end');
  console.log('- If successful, the WhatsApp Bot is fully functional');
}

main().catch(console.error);
