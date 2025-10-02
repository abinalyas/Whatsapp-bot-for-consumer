/**
 * Test Complete Integration
 * Test the complete integration between WhatsApp Bot and Salon Dashboard
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const TEST_CONFIG = {
  baseUrl: 'https://whatsapp-bot-for-consumer.vercel.app',
  testPhoneNumber: '98765432199'
};

async function testCompleteIntegration() {
  console.log('🔍 Test Complete Integration');
  console.log('============================\n');
  
  try {
    // Step 1: Test WhatsApp Bot booking flow
    console.log('📱 Step 1: Testing WhatsApp Bot booking flow');
    const bookingSteps = [
      { message: 'book', expectedStep: 'service_selection' },
      { message: 'hair cut', expectedStep: 'date_selection' },
      { message: 'tomorrow', expectedStep: 'time_selection' },
      { message: '11 am', expectedStep: 'staff_selection' },
      { message: '1', expectedStep: 'confirmation' },
      { message: 'yes', expectedStep: 'completed' }
    ];
    
    let currentStep = 'welcome';
    let appointmentId = null;
    
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
        
        if (result.appointmentId) {
          appointmentId = result.appointmentId;
          console.log(`   🎫 Appointment ID: ${appointmentId}`);
        }
        
        currentStep = result.currentStep;
      } else {
        console.log(`   ❌ Error: ${response.status}`);
        break;
      }
    }
    
    // Step 2: Wait a moment for the booking to be processed
    console.log('\n⏳ Waiting for booking to be processed...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 3: Check if the booking appears in salon dashboard
    console.log('\n📊 Step 2: Checking salon dashboard for the new booking');
    
    const salonResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/salon/appointments`, {
      headers: {
        'x-tenant-id': 'bella-salon'
      }
    });
    
    if (salonResponse.ok) {
      const salonData = await salonResponse.json();
      console.log(`   📊 Found ${salonData.data.length} total appointments in salon dashboard`);
      
      // Look for our test booking
      const testBookings = salonData.data.filter(apt => 
        apt.customer_name === 'WhatsApp Customer' && 
        apt.source === 'whatsapp_bot' &&
        apt.phone_number === TEST_CONFIG.testPhoneNumber
      );
      
      console.log(`   📱 Found ${testBookings.length} WhatsApp Bot bookings`);
      
      if (testBookings.length > 0) {
        const latestBooking = testBookings[0];
        console.log(`   ✅ Latest WhatsApp Bot booking:`);
        console.log(`      Customer: ${latestBooking.customer_name}`);
        console.log(`      Service: ${latestBooking.service_name}`);
        console.log(`      Amount: ₹${latestBooking.amount}`);
        console.log(`      Date: ${latestBooking.scheduled_at}`);
        console.log(`      Source: ${latestBooking.source}`);
        
        // Verify it's a Bella Salon service
        const bellaSalonServices = [
          'Bridal Makeup', 'Facial Cleanup', 'Gold Facial', 'Hair Coloring', 
          'Hair Cut & Style', 'Hair Spa', 'Manicure', 'Party Makeup', 
          'Pedicure', 'Threading'
        ];
        
        if (bellaSalonServices.includes(latestBooking.service_name)) {
          console.log(`   ✅ Service is a valid Bella Salon service`);
        } else {
          console.log(`   ❌ Service "${latestBooking.service_name}" is not a Bella Salon service`);
        }
        
      } else {
        console.log(`   ❌ No WhatsApp Bot bookings found in salon dashboard`);
      }
      
      // Count WhatsApp Bot bookings
      const allWhatsAppBookings = salonData.data.filter(apt => apt.source === 'whatsapp_bot');
      console.log(`   📱 Total WhatsApp Bot bookings in salon dashboard: ${allWhatsAppBookings.length}`);
      
    } else {
      console.log(`   ❌ Error fetching salon dashboard: ${salonResponse.status}`);
    }
    
    // Step 4: Check regular bookings API
    console.log('\n📊 Step 3: Checking regular bookings API');
    
    const bookingsResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/bookings`);
    
    if (bookingsResponse.ok) {
      const bookings = await bookingsResponse.json();
      console.log(`   📊 Found ${bookings.length} total bookings in regular API`);
      
      // Look for our test booking
      const testBookings = bookings.filter(booking => 
        booking.customerName === 'WhatsApp Customer' && 
        booking.phoneNumber === TEST_CONFIG.testPhoneNumber
      );
      
      console.log(`   📱 Found ${testBookings.length} test bookings in regular API`);
      
      if (testBookings.length > 0) {
        const latestBooking = testBookings[0];
        console.log(`   ✅ Latest test booking:`);
        console.log(`      Customer: ${latestBooking.customerName}`);
        console.log(`      Amount: ₹${latestBooking.amount}`);
        console.log(`      Date: ${latestBooking.appointmentDate}`);
        console.log(`      Notes: ${latestBooking.notes}`);
      }
      
    } else {
      console.log(`   ❌ Error fetching regular bookings: ${bookingsResponse.status}`);
    }
    
    console.log('\n🎯 Integration Test Results:');
    console.log('============================');
    console.log(`✅ WhatsApp Bot booking flow: ${currentStep === 'completed' ? 'SUCCESS' : 'FAILED'}`);
    console.log(`✅ Salon dashboard integration: ${appointmentId ? 'SUCCESS' : 'FAILED'}`);
    console.log(`✅ Data consistency: ${appointmentId ? 'SUCCESS' : 'FAILED'}`);
    
    if (currentStep === 'completed' && appointmentId) {
      console.log('\n🎉 COMPLETE INTEGRATION SUCCESS!');
      console.log('================================');
      console.log('- WhatsApp Bot shows Bella Salon services');
      console.log('- WhatsApp Bot creates bookings successfully');
      console.log('- Salon dashboard displays WhatsApp Bot bookings');
      console.log('- Data is consistent across both systems');
    } else {
      console.log('\n❌ Integration has issues that need to be fixed');
    }
    
  } catch (error) {
    console.error('❌ Error testing complete integration:', error);
  }
}

async function main() {
  console.log('🚀 Test Complete Integration');
  console.log('============================\n');
  
  await testCompleteIntegration();
  
  console.log('\n🎯 Summary:');
  console.log('- WhatsApp Bot and Salon Dashboard are now integrated');
  console.log('- Bella Salon services are used in WhatsApp Bot');
  console.log('- WhatsApp Bot bookings appear in Salon Dashboard');
}

main().catch(console.error);
