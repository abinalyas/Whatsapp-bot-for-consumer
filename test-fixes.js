/**
 * Test Fixes
 * Test if the fixes for staff assignment, time display, and price/duration are working
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const TEST_CONFIG = {
  baseUrl: 'https://whatsapp-bot-for-consumer.vercel.app',
  testPhoneNumber: '98765432188'
};

async function testFixes() {
  console.log('🔧 Test Fixes');
  console.log('============\n');
  
  try {
    // Step 1: Test WhatsApp Bot booking with new fixes
    console.log('📱 Step 1: Testing WhatsApp Bot booking with fixes');
    const bookingSteps = [
      { message: 'book', expectedStep: 'service_selection' },
      { message: 'pedicure', expectedStep: 'date_selection' },
      { message: 'tomorrow', expectedStep: 'time_selection' },
      { message: '2 pm', expectedStep: 'staff_selection' },
      { message: '1', expectedStep: 'confirmation' }
    ];
    
    let currentStep = 'welcome';
    let confirmationMessage = '';
    
    for (const step of bookingSteps) {
      console.log(`\n   💬 Sending: "${step.message}"`);
      
      const response = await fetch(`${TEST_CONFIG.baseUrl}/api/whatsapp/simple/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phoneNumber: TEST_CONFIG.testPhoneNumber,
          message: step.message
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`   ✅ Response: ${result.success ? 'Success' : 'Failed'}`);
        console.log(`   📱 Current Step: ${result.currentStep}`);
        
        if (step.expectedStep === 'confirmation') {
          confirmationMessage = result.message;
          console.log(`   📋 Confirmation Message Preview:`);
          console.log(`   ${confirmationMessage.split('\n').slice(0, 10).join('\n   ')}...`);
        }
        
        currentStep = result.currentStep;
      } else {
        console.log(`   ❌ Error: ${response.status}`);
        break;
      }
    }
    
    // Step 2: Check if price and duration are now showing correctly
    console.log('\n📊 Step 2: Checking price and duration display');
    if (confirmationMessage.includes('₹undefined') || confirmationMessage.includes('undefined minutes')) {
      console.log('❌ Price/Duration still showing as undefined');
    } else if (confirmationMessage.includes('₹') && confirmationMessage.includes('minutes')) {
      console.log('✅ Price and duration are now displaying correctly');
    } else {
      console.log('⚠️ Price/Duration display unclear');
    }
    
    // Step 3: Complete the booking
    console.log('\n📱 Step 3: Completing the booking');
    const confirmResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/whatsapp/simple/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phoneNumber: TEST_CONFIG.testPhoneNumber,
        message: 'yes'
      })
    });
    
    if (confirmResponse.ok) {
      const confirmResult = await confirmResponse.json();
      console.log(`✅ Booking completed: ${confirmResult.success}`);
      if (confirmResult.appointmentId) {
        console.log(`🎫 Appointment ID: ${confirmResult.appointmentId}`);
        
        // Step 4: Check if the booking appears in salon dashboard with correct staff
        console.log('\n📊 Step 4: Checking salon dashboard for correct staff assignment');
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for processing
        
        const salonResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/salon/appointments`, {
          headers: {
            'x-tenant-id': 'bella-salon'
          }
        });
        
        if (salonResponse.ok) {
          const salonData = await salonResponse.json();
          
          // Look for our test booking
          const testBooking = salonData.data.find(apt => 
            apt.customer_phone === TEST_CONFIG.testPhoneNumber &&
            apt.source === 'whatsapp_bot'
          );
          
          if (testBooking) {
            console.log(`✅ Booking found in salon dashboard:`);
            console.log(`   Customer: ${testBooking.customer_name}`);
            console.log(`   Service: ${testBooking.service_name}`);
            console.log(`   Staff: ${testBooking.staff_name || 'Not assigned'}`);
            console.log(`   Amount: ₹${testBooking.amount}`);
            console.log(`   Scheduled: ${testBooking.scheduled_at}`);
            console.log(`   Source: ${testBooking.source}`);
            
            // Check if staff is properly assigned
            if (testBooking.staff_name && testBooking.staff_name !== 'Not assigned') {
              console.log('✅ Staff assignment is working correctly');
            } else {
              console.log('❌ Staff assignment still not working');
            }
            
          } else {
            console.log('❌ Booking not found in salon dashboard');
          }
        } else {
          console.log(`❌ Error fetching salon dashboard: ${salonResponse.status}`);
        }
      }
    } else {
      console.log(`❌ Error completing booking: ${confirmResponse.status}`);
    }
    
  } catch (error) {
    console.error('❌ Error testing fixes:', error);
  }
}

async function main() {
  console.log('🚀 Test Fixes');
  console.log('============\n');
  
  await testFixes();
  
  console.log('\n🎯 Summary:');
  console.log('- Staff assignment should now work correctly');
  console.log('- Price and duration should display properly in WhatsApp Bot');
  console.log('- Time display issues should be resolved');
  console.log('- Salon dashboard should show correct staff assignments');
}

main().catch(console.error);
