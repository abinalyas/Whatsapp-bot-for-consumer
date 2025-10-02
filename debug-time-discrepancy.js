/**
 * Debug Time Discrepancy
 * Debug why WhatsApp Bot booking time (9:00 AM) shows as 2:30 PM in salon dashboard
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const TEST_CONFIG = {
  baseUrl: 'https://whatsapp-bot-for-consumer.vercel.app'
};

async function debugTimeDiscrepancy() {
  console.log('🔍 Debug Time Discrepancy');
  console.log('========================\n');
  
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
    
    if (appointmentsResponse.ok) {
      const appointments = await appointmentsResponse.json();
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
      console.log('❌ Failed to fetch appointments');
      const errorText = await appointmentsResponse.text();
      console.log(`Error: ${errorText}`);
    }
    
    // Step 2: Check the bookings table directly
    console.log('\n📊 Step 2: Checking bookings table directly');
    const bookingsResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/salon/bookings`, {
      method: 'GET',
      headers: {
        'x-tenant-id': '85de5a0c-6aeb-479a-aa76-cbdd6b0845a7'
      }
    });
    
    if (bookingsResponse.ok) {
      const bookings = await bookingsResponse.json();
      console.log(`Found ${bookings.length} direct bookings`);
      
      // Look for recent WhatsApp bookings
      const recentBookings = bookings.filter(booking => 
        booking.notes?.includes('WhatsApp') ||
        booking.customer_name?.includes('WhatsApp')
      );
      
      console.log(`\n📱 Recent WhatsApp Bookings (${recentBookings.length}):`);
      recentBookings.forEach((booking, index) => {
        console.log(`\n${index + 1}. Booking ID: ${booking.id}`);
        console.log(`   Customer: ${booking.customer_name}`);
        console.log(`   Appointment Date: ${booking.appointment_date}`);
        console.log(`   Appointment Time: ${booking.appointment_time}`);
        console.log(`   Staff ID: ${booking.staff_id}`);
        console.log(`   Notes: ${booking.notes}`);
        
        // Parse the appointment_date and appointment_time
        if (booking.appointment_date && booking.appointment_time) {
          const dateTimeString = `${booking.appointment_date} ${booking.appointment_time}`;
          const appointmentDateTime = new Date(dateTimeString);
          console.log(`   Combined DateTime: ${dateTimeString}`);
          console.log(`   Parsed Date: ${appointmentDateTime.toString()}`);
          console.log(`   UTC Time: ${appointmentDateTime.toUTCString()}`);
          console.log(`   Local Time: ${appointmentDateTime.toLocaleString()}`);
          console.log(`   ISO String: ${appointmentDateTime.toISOString()}`);
        }
      });
    }
    
    // Step 3: Test time conversion
    console.log('\n📊 Step 3: Testing time conversion');
    const testTimes = [
      '2025-10-05 09:00:00',
      '2025-10-05 09:00',
      '09:00',
      '9:00 AM',
      '09:00 AM'
    ];
    
    testTimes.forEach(timeStr => {
      console.log(`\nTesting: "${timeStr}"`);
      const testDate = new Date(timeStr);
      console.log(`  Parsed: ${testDate.toString()}`);
      console.log(`  UTC: ${testDate.toUTCString()}`);
      console.log(`  Local: ${testDate.toLocaleString()}`);
      console.log(`  ISO: ${testDate.toISOString()}`);
    });
    
  } catch (error) {
    console.error('❌ Error debugging time discrepancy:', error);
  }
}

async function main() {
  console.log('🚀 Debug Time Discrepancy');
  console.log('========================\n');
  
  await debugTimeDiscrepancy();
  
  console.log('\n🎯 Analysis:');
  console.log('- Check if the time is being stored correctly in the database');
  console.log('- Verify if there\'s a timezone conversion issue');
  console.log('- Look for time format inconsistencies');
}

main().catch(console.error);
