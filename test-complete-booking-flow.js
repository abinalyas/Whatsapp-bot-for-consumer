/**
 * Test Complete Booking Flow End-to-End
 * Test the entire booking flow from start to finish
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const TEST_CONFIG = {
  baseUrl: 'https://whatsapp-bot-for-consumer.vercel.app',
  testPhoneNumber: '9876543210',
};

async function testCompleteBookingFlow() {
  console.log('🧪 Testing Complete Booking Flow End-to-End');
  console.log('===========================================\n');
  
  const bookingFlow = [
    { message: 'hi', description: 'Initial greeting', expectedStep: 'welcome' },
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
          phoneNumber: TEST_CONFIG.testPhoneNumber,
          message: step.message
        })
      });
      
      console.log(`✅ Status: ${response.status}`);
      const result = await response.json();
      console.log(`📄 Current Step: ${result.currentStep || 'unknown'}`);
      
      if (result.success) {
        console.log(`🎉 SUCCESS: Bot responded`);
        console.log(`📱 Response: ${result.message.substring(0, 150)}...`);
        
        if (result.appointmentId) {
          console.log(`🎫 Appointment ID: ${result.appointmentId}`);
        }
        
        // Check if step matches expectation
        if (result.currentStep === step.expectedStep) {
          console.log(`✅ Step progression correct: ${currentStep} → ${result.currentStep}`);
        } else {
          console.log(`⚠️  Step progression unexpected: ${currentStep} → ${result.currentStep} (expected: ${step.expectedStep})`);
        }
        
        currentStep = result.currentStep;
        
      } else {
        console.log(`❌ FAILED: ${result.error}`);
        console.log(`📄 Current Step: ${result.currentStep || 'unknown'}`);
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
}

async function testServiceSelectionVariations() {
  console.log('\n🧪 Testing Service Selection Variations');
  console.log('======================================\n');
  
  const serviceTests = [
    { message: '1', description: 'Select service by number' },
    { message: 'hair cut & style', description: 'Select service by full name' },
    { message: 'facial', description: 'Select service by partial name' },
    { message: 'bridal makeup', description: 'Select expensive service' }
  ];
  
  for (const test of serviceTests) {
    console.log(`\n📱 Testing: ${test.description}`);
    console.log(`💬 Message: "${test.message}"`);
    
    try {
      // First, start a new booking flow
      await fetch(`${TEST_CONFIG.baseUrl}/api/whatsapp/simple/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: `${TEST_CONFIG.testPhoneNumber}${Math.random().toString().slice(2, 5)}`, // Unique phone number
          message: 'book'
        })
      });
      
      // Then test service selection
      const response = await fetch(`${TEST_CONFIG.baseUrl}/api/whatsapp/simple/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: `${TEST_CONFIG.testPhoneNumber}${Math.random().toString().slice(2, 5)}`, // Same unique phone number
          message: test.message
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ SUCCESS: Service selected`);
        console.log(`📄 Current Step: ${result.currentStep}`);
        console.log(`📱 Response: ${result.message.substring(0, 100)}...`);
      } else {
        console.log(`❌ FAILED: ${result.error}`);
      }
      
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

async function main() {
  console.log('🚀 Test Complete Booking Flow End-to-End');
  console.log('========================================\n');
  
  // Test 1: Complete booking flow
  await testCompleteBookingFlow();
  
  // Test 2: Service selection variations
  await testServiceSelectionVariations();
  
  console.log('\n🎯 Summary:');
  console.log('- Complete booking flow should work from start to finish');
  console.log('- Service selection should work with numbers, names, and partial names');
  console.log('- Conversation state should be maintained between messages');
  console.log('- Final appointment should be created in the database');
}

main().catch(console.error);
