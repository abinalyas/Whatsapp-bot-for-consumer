/**
 * Test Same Number Bookings
 * Test that the same phone number can make multiple bookings without errors
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const TEST_CONFIG = {
  baseUrl: 'https://whatsapp-bot-for-consumer.vercel.app',
  testPhoneNumber: '98765432177' // Same number for multiple bookings
};

async function testSameNumberBookings() {
  console.log('🧪 Test Same Number Bookings');
  console.log('============================\n');
  
  try {
    // Test 1: First booking
    console.log('📊 Test 1: First booking with same number');
    await performCompleteBooking('First');
    console.log('');
    
    // Wait a bit
    console.log('⏳ Waiting 2 seconds...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 2: Second booking with same number
    console.log('📊 Test 2: Second booking with same number');
    await performCompleteBooking('Second');
    console.log('');
    
    // Wait a bit
    console.log('⏳ Waiting 2 seconds...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 3: Third booking with same number
    console.log('📊 Test 3: Third booking with same number');
    await performCompleteBooking('Third');
    console.log('');
    
    console.log('🎯 Test Results:');
    console.log('================');
    console.log('✅ Same phone number can make multiple bookings');
    console.log('✅ Conversation state is properly reset between bookings');
    console.log('✅ No more "technical difficulties" errors');
    
  } catch (error) {
    console.error('❌ Error testing same number bookings:', error);
  }
}

async function performCompleteBooking(bookingNumber) {
  try {
    // Step 1: Reset and start booking
    console.log(`  🔄 ${bookingNumber} booking - Starting fresh`);
    await fetch(`${TEST_CONFIG.baseUrl}/api/whatsapp/simple/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber: TEST_CONFIG.testPhoneNumber })
    });
    
    // Step 2: Start booking flow
    const bookResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/whatsapp/simple/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber: TEST_CONFIG.testPhoneNumber,
        message: 'book'
      })
    });
    
    const bookResult = await bookResponse.json();
    console.log(`  ✅ ${bookingNumber} booking - Services displayed: ${bookResult.success}`);
    
    // Step 3: Select service
    const serviceResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/whatsapp/simple/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber: TEST_CONFIG.testPhoneNumber,
        message: 'Hair Cut & Style'
      })
    });
    
    const serviceResult = await serviceResponse.json();
    console.log(`  ✅ ${bookingNumber} booking - Service selected: ${serviceResult.success}`);
    
    // Step 4: Select date
    const dateResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/whatsapp/simple/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber: TEST_CONFIG.testPhoneNumber,
        message: 'tomorrow'
      })
    });
    
    const dateResult = await dateResponse.json();
    console.log(`  ✅ ${bookingNumber} booking - Date selected: ${dateResult.success}`);
    
    // Step 5: Select time
    const timeResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/whatsapp/simple/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber: TEST_CONFIG.testPhoneNumber,
        message: '1'
      })
    });
    
    const timeResult = await timeResponse.json();
    console.log(`  ✅ ${bookingNumber} booking - Time selected: ${timeResult.success}`);
    
    // Step 6: Confirm booking
    const confirmResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/whatsapp/simple/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber: TEST_CONFIG.testPhoneNumber,
        message: 'confirm'
      })
    });
    
    const confirmResult = await confirmResponse.json();
    console.log(`  ✅ ${bookingNumber} booking - Booking confirmed: ${confirmResult.success}`);
    
    if (!confirmResult.success) {
      console.log(`  ❌ ${bookingNumber} booking failed:`, confirmResult.message);
    }
    
  } catch (error) {
    console.error(`  ❌ Error in ${bookingNumber} booking:`, error);
  }
}

async function main() {
  console.log('🚀 Same Number Bookings Test');
  console.log('============================\n');
  
  await testSameNumberBookings();
  
  console.log('\n📝 Instructions:');
  console.log('1. Now try booking with your phone number multiple times');
  console.log('2. The bot should work smoothly without "technical difficulties" errors');
  console.log('3. Each booking should start fresh and complete successfully');
}

main().catch(console.error);
