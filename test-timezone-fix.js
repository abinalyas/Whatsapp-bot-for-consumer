/**
 * Test Timezone Fix
 * Test if the timezone fix resolves the 9 AM vs 2:30 PM issue
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const TEST_CONFIG = {
  baseUrl: 'https://whatsapp-bot-for-consumer.vercel.app',
  testPhoneNumber: '98765432177'
};

async function testTimezoneFix() {
  console.log('🔍 Test Timezone Fix');
  console.log('==================\n');
  
  try {
    // Step 1: Reset conversation state
    console.log('📊 Step 1: Resetting conversation state');
    const resetResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/whatsapp/simple/reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phoneNumber: TEST_CONFIG.testPhoneNumber
      })
    });
    
    console.log(`Status: ${resetResponse.status}`);
    const resetResult = await resetResponse.json();
    console.log(`Response: ${resetResult.message}`);
    
    // Step 2: Start booking flow
    console.log('\n📊 Step 2: Starting booking flow');
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
    
    // Step 3: Select a service
    console.log('\n📊 Step 3: Selecting service');
    const serviceResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/whatsapp/simple/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phoneNumber: TEST_CONFIG.testPhoneNumber,
        message: 'Manicure'
      })
    });
    
    console.log(`Status: ${serviceResponse.status}`);
    const serviceResult = await serviceResponse.json();
    console.log(`Response: ${serviceResult.message?.substring(0, 100)}...`);
    
    // Step 4: Select a date
    console.log('\n📊 Step 4: Selecting date');
    const dateResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/whatsapp/simple/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phoneNumber: TEST_CONFIG.testPhoneNumber,
        message: '1'
      })
    });
    
    console.log(`Status: ${dateResponse.status}`);
    const dateResult = await dateResponse.json();
    console.log(`Response: ${dateResult.message?.substring(0, 100)}...`);
    
    // Step 5: Select a time (9 AM)
    console.log('\n📊 Step 5: Selecting time (9 AM)');
    const timeResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/whatsapp/simple/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phoneNumber: TEST_CONFIG.testPhoneNumber,
        message: '9 am'
      })
    });
    
    console.log(`Status: ${timeResponse.status}`);
    const timeResult = await timeResponse.json();
    console.log(`Response: ${timeResult.message?.substring(0, 100)}...`);
    
    // Step 6: Select staff
    console.log('\n📊 Step 6: Selecting staff');
    const staffResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/whatsapp/simple/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phoneNumber: TEST_CONFIG.testPhoneNumber,
        message: '1'
      })
    });
    
    console.log(`Status: ${staffResponse.status}`);
    const staffResult = await staffResponse.json();
    console.log(`Response: ${staffResult.message?.substring(0, 100)}...`);
    
    // Step 7: Confirm appointment
    console.log('\n📊 Step 7: Confirming appointment');
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
    
    console.log(`Status: ${confirmResponse.status}`);
    const confirmResult = await confirmResponse.json();
    console.log(`Response: ${confirmResult.message?.substring(0, 150)}...`);
    
    if (confirmResponse.ok && confirmResult.appointmentId) {
      console.log(`✅ Appointment created with ID: ${confirmResult.appointmentId}`);
      
      // Step 8: Check the appointment in salon dashboard
      console.log('\n📊 Step 8: Checking appointment in salon dashboard');
      const appointmentsResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/salon/appointments`, {
        method: 'GET',
        headers: {
          'x-tenant-id': '85de5a0c-6aeb-479a-aa76-cbdd6b0845a7'
        }
      });
      
      if (appointmentsResponse.ok) {
        const appointmentsData = await appointmentsResponse.json();
        const appointments = appointmentsData.data || [];
        
        // Find the latest WhatsApp booking
        const whatsappBookings = appointments.filter(apt => 
          apt.source === 'whatsapp_bot' && 
          apt.customer_phone === TEST_CONFIG.testPhoneNumber
        );
        
        if (whatsappBookings.length > 0) {
          const latestBooking = whatsappBookings[0];
          console.log(`\n📱 Latest WhatsApp Booking:`);
          console.log(`   ID: ${latestBooking.id}`);
          console.log(`   Customer: ${latestBooking.customer_name}`);
          console.log(`   Service: ${latestBooking.service_name}`);
          console.log(`   Staff: ${latestBooking.staff_name}`);
          console.log(`   Scheduled At: ${latestBooking.scheduled_at}`);
          
          // Parse the scheduled time
          const scheduledDate = new Date(latestBooking.scheduled_at);
          console.log(`   Parsed UTC: ${scheduledDate.toUTCString()}`);
          console.log(`   Local Time: ${scheduledDate.toLocaleString()}`);
          console.log(`   IST Time: ${scheduledDate.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
          
          // Check if the time is correct (should be 9 AM IST)
          const istHour = scheduledDate.toLocaleString('en-IN', { 
            timeZone: 'Asia/Kolkata',
            hour: 'numeric',
            hour12: true
          });
          console.log(`   IST Hour: ${istHour}`);
          
          if (istHour === '9 AM') {
            console.log(`✅ SUCCESS: Time is correctly stored as 9 AM IST!`);
          } else {
            console.log(`❌ ISSUE: Time is showing as ${istHour} instead of 9 AM`);
          }
        } else {
          console.log('❌ No WhatsApp bookings found');
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing timezone fix:', error);
  }
}

async function main() {
  console.log('🚀 Test Timezone Fix');
  console.log('==================\n');
  
  await testTimezoneFix();
  
  console.log('\n🎯 Analysis:');
  console.log('- Check if the timezone fix resolves the 9 AM vs 2:30 PM issue');
  console.log('- Verify that appointments are stored in correct UTC time');
  console.log('- Confirm that the salon dashboard displays the correct time');
}

main().catch(console.error);
