/**
 * Verify Booking Creation
 * Check if the booking was actually created in the bookings table
 */

import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function verifyBookingCreation() {
  console.log('🔍 Verifying Booking Creation in Database');
  console.log('========================================\n');
  
  try {
    // Check for recent bookings
    const query = `
      SELECT 
        id,
        customer_name,
        phone_number,
        amount,
        status,
        appointment_date,
        appointment_time,
        created_at,
        notes
      FROM bookings 
      WHERE created_at >= NOW() - INTERVAL '1 hour'
      ORDER BY created_at DESC
      LIMIT 10
    `;
    
    const result = await pool.query(query);
    
    console.log(`📊 Found ${result.rows.length} recent bookings:`);
    
    if (result.rows.length === 0) {
      console.log('❌ No recent bookings found');
      return;
    }
    
    result.rows.forEach((booking, index) => {
      console.log(`\n📅 Booking ${index + 1}:`);
      console.log(`   ID: ${booking.id}`);
      console.log(`   Customer: ${booking.customer_name || 'N/A'} (${booking.phone_number || 'N/A'})`);
      console.log(`   Amount: ₹${booking.amount || 'N/A'}`);
      console.log(`   Status: ${booking.status || 'N/A'}`);
      console.log(`   Date: ${booking.appointment_date || 'N/A'}`);
      console.log(`   Time: ${booking.appointment_time || 'N/A'}`);
      console.log(`   Notes: ${booking.notes || 'N/A'}`);
      console.log(`   Created: ${booking.created_at}`);
    });
    
    // Check for the specific booking ID from our test
    const specificBookingId = '53f13a48-be46-4acd-8aa9-96bf4523a970';
    const specificQuery = `
      SELECT * FROM bookings WHERE id = $1
    `;
    
    const specificResult = await pool.query(specificQuery, [specificBookingId]);
    
    if (specificResult.rows.length > 0) {
      const booking = specificResult.rows[0];
      console.log(`\n🎯 Found Our Test Booking:`);
      console.log(`   ID: ${booking.id}`);
      console.log(`   Customer: ${booking.customer_name || 'N/A'} (${booking.phone_number || 'N/A'})`);
      console.log(`   Amount: ₹${booking.amount || 'N/A'}`);
      console.log(`   Status: ${booking.status || 'N/A'}`);
      console.log(`   Date: ${booking.appointment_date || 'N/A'}`);
      console.log(`   Time: ${booking.appointment_time || 'N/A'}`);
      console.log(`   ✅ BOOKING SUCCESSFULLY CREATED IN DATABASE!`);
    } else {
      console.log(`\n❌ Test booking ${specificBookingId} not found in database`);
      
      // Check if there are any bookings with similar details
      const similarQuery = `
        SELECT * FROM bookings 
        WHERE phone_number = '9876543210' 
        AND created_at >= NOW() - INTERVAL '1 hour'
        ORDER BY created_at DESC
        LIMIT 5
      `;
      
      const similarResult = await pool.query(similarQuery);
      
      if (similarResult.rows.length > 0) {
        console.log(`\n🔍 Found ${similarResult.rows.length} bookings with phone number 9876543210:`);
        similarResult.rows.forEach((booking, index) => {
          console.log(`   ${index + 1}. ID: ${booking.id}, Amount: ₹${booking.amount}, Status: ${booking.status}, Created: ${booking.created_at}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error verifying booking creation:', error);
  } finally {
    await pool.end();
  }
}

async function checkBookingsInSalonDashboard() {
  console.log('\n🔍 Checking Bookings in Salon Dashboard API');
  console.log('===========================================\n');
  
  try {
    const response = await fetch('https://whatsapp-bot-for-consumer.vercel.app/api/salon/appointments', {
      headers: {
        'x-tenant-id': 'bella-salon'
      }
    });
    
    if (response.ok) {
      const appointments = await response.json();
      console.log(`📊 Found ${appointments.length} appointments in salon dashboard`);
      
      // Show recent appointments
      const recentAppointments = appointments
        .filter(apt => {
          const createdDate = new Date(apt.created_at || apt.scheduled_at || apt.appointment_date);
          return createdDate > new Date(Date.now() - 60 * 60 * 1000);
        })
        .slice(0, 5);
      
      console.log(`📅 Recent appointments (last hour): ${recentAppointments.length}`);
      
      recentAppointments.forEach((appointment, index) => {
        console.log(`\n📅 Recent Appointment ${index + 1}:`);
        console.log(`   ID: ${appointment.id}`);
        console.log(`   Customer: ${appointment.customer_name || appointment.customer || 'N/A'}`);
        console.log(`   Phone: ${appointment.customer_phone || 'N/A'}`);
        console.log(`   Service: ${appointment.service_name || appointment.service || 'N/A'}`);
        console.log(`   Staff: ${appointment.staff_name || appointment.staff || 'N/A'}`);
        console.log(`   Date/Time: ${appointment.scheduled_at || appointment.appointment_time || 'N/A'}`);
        console.log(`   Status: ${appointment.status || 'N/A'}`);
        console.log(`   Amount: ₹${appointment.total_amount || appointment.amount || 'N/A'}`);
      });
      
      if (recentAppointments.length === 0) {
        console.log('❌ No recent appointments found in salon dashboard');
      } else {
        console.log(`\n✅ Found ${recentAppointments.length} recent appointments in salon dashboard!`);
      }
    } else {
      console.log(`❌ Failed to fetch appointments: ${response.status}`);
    }
  } catch (error) {
    console.error('❌ Error checking salon dashboard:', error);
  }
}

async function main() {
  console.log('🚀 Verify Booking Creation');
  console.log('==========================\n');
  
  // Check database directly
  await verifyBookingCreation();
  
  // Check salon dashboard API
  await checkBookingsInSalonDashboard();
  
  console.log('\n🎯 Summary:');
  console.log('- If bookings are found, the WhatsApp Bot is successfully creating real bookings');
  console.log('- If bookings appear in salon dashboard, the integration is working perfectly');
  console.log('- This confirms that WhatsApp bookings are reflected in the salon UI');
}

main().catch(console.error);
