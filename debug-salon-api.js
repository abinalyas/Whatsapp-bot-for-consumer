/**
 * Debug Salon API
 * Debug the salon dashboard API to check appointment data
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const TEST_CONFIG = {
  baseUrl: 'https://whatsapp-bot-for-consumer.vercel.app'
};

async function debugSalonAPI() {
  console.log('🔍 Debug Salon API');
  console.log('=================\n');
  
  try {
    // Step 1: Check the salon dashboard appointments API
    console.log('📊 Step 1: Checking salon dashboard appointments API');
    const appointmentsResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/salon/appointments`, {
      method: 'GET',
      headers: {
        'x-tenant-id': '85de5a0c-6aeb-479a-aa76-cbdd6b0845a7'
      }
    });
    
    console.log(`Status: ${appointmentsResponse.status}`);
    const responseText = await appointmentsResponse.text();
    console.log(`Raw Response: ${responseText}`);
    
    if (appointmentsResponse.ok) {
      try {
        const appointments = JSON.parse(responseText);
        console.log(`Parsed Response Type: ${typeof appointments}`);
        console.log(`Parsed Response: ${JSON.stringify(appointments, null, 2)}`);
        
        if (Array.isArray(appointments)) {
          console.log(`Found ${appointments.length} appointments`);
          
          // Look for WhatsApp bookings
          const whatsappBookings = appointments.filter(apt => 
            apt.source === 'whatsapp_bot' || 
            apt.notes?.includes('WhatsApp') ||
            apt.customer_name?.includes('WhatsApp')
          );
          
          console.log(`\n📱 WhatsApp Bookings (${whatsappBookings.length}):`);
          whatsappBookings.forEach((booking, index) => {
            console.log(`\n${index + 1}. Booking ID: ${booking.id}`);
            console.log(`   Customer: ${booking.customer_name}`);
            console.log(`   Service: ${booking.service_name}`);
            console.log(`   Staff: ${booking.staff_name || 'Unassigned'}`);
            console.log(`   Scheduled At: ${booking.scheduled_at}`);
            console.log(`   Source: ${booking.source}`);
            console.log(`   Notes: ${booking.notes}`);
            
            // Parse the scheduled_at time
            if (booking.scheduled_at) {
              const scheduledDate = new Date(booking.scheduled_at);
              console.log(`   Parsed Date: ${scheduledDate.toString()}`);
              console.log(`   UTC Time: ${scheduledDate.toUTCString()}`);
              console.log(`   Local Time: ${scheduledDate.toLocaleString()}`);
              console.log(`   ISO String: ${scheduledDate.toISOString()}`);
            }
          });
        } else {
          console.log('❌ Response is not an array');
        }
      } catch (parseError) {
        console.log('❌ Failed to parse JSON response');
        console.log(`Parse Error: ${parseError.message}`);
      }
    } else {
      console.log('❌ Failed to fetch appointments');
      console.log(`Error: ${responseText}`);
    }
    
    // Step 2: Check with different date parameter
    console.log('\n📊 Step 2: Checking with date parameter');
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    console.log(`Today's date: ${today}`);
    
    const appointmentsWithDateResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/salon/appointments?date=${today}`, {
      method: 'GET',
      headers: {
        'x-tenant-id': '85de5a0c-6aeb-479a-aa76-cbdd6b0845a7'
      }
    });
    
    console.log(`Status: ${appointmentsWithDateResponse.status}`);
    const responseWithDateText = await appointmentsWithDateResponse.text();
    console.log(`Raw Response with Date: ${responseWithDateText}`);
    
    // Step 3: Check the bookings table directly
    console.log('\n📊 Step 3: Checking bookings table directly');
    const bookingsResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/salon/bookings`, {
      method: 'GET',
      headers: {
        'x-tenant-id': '85de5a0c-6aeb-479a-aa76-cbdd6b0845a7'
      }
    });
    
    console.log(`Bookings Status: ${bookingsResponse.status}`);
    const bookingsText = await bookingsResponse.text();
    console.log(`Bookings Response: ${bookingsText}`);
    
  } catch (error) {
    console.error('❌ Error debugging salon API:', error);
  }
}

async function main() {
  console.log('🚀 Debug Salon API');
  console.log('=================\n');
  
  await debugSalonAPI();
  
  console.log('\n🎯 Analysis:');
  console.log('- Check the salon dashboard API response format');
  console.log('- Verify if appointments are being returned correctly');
  console.log('- Look for time data in the response');
}

main().catch(console.error);