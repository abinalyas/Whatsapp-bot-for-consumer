/**
 * Verify Appointment Creation
 * Check if the appointment was actually created in the database
 */

import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function verifyAppointmentCreation() {
  console.log('🔍 Verifying Appointment Creation in Database');
  console.log('============================================\n');
  
  try {
    // Check for recent appointments
    const query = `
      SELECT 
        id,
        customer_name,
        customer_phone,
        service_name,
        staff_name,
        scheduled_at,
        status,
        total_amount,
        created_at
      FROM appointments 
      WHERE created_at >= NOW() - INTERVAL '1 hour'
      ORDER BY created_at DESC
      LIMIT 10
    `;
    
    const result = await pool.query(query);
    
    console.log(`📊 Found ${result.rows.length} recent appointments:`);
    
    if (result.rows.length === 0) {
      console.log('❌ No recent appointments found');
      return;
    }
    
    result.rows.forEach((appointment, index) => {
      console.log(`\n📅 Appointment ${index + 1}:`);
      console.log(`   ID: ${appointment.id}`);
      console.log(`   Customer: ${appointment.customer_name || 'N/A'} (${appointment.customer_phone || 'N/A'})`);
      console.log(`   Service: ${appointment.service_name || 'N/A'}`);
      console.log(`   Staff: ${appointment.staff_name || 'N/A'}`);
      console.log(`   Date/Time: ${appointment.scheduled_at || 'N/A'}`);
      console.log(`   Status: ${appointment.status || 'N/A'}`);
      console.log(`   Amount: ₹${appointment.total_amount || 'N/A'}`);
      console.log(`   Created: ${appointment.created_at}`);
    });
    
    // Check for the specific appointment ID from our test
    const specificAppointmentId = '53f13a48-be46-4acd-8aa9-96bf4523a970';
    const specificQuery = `
      SELECT * FROM appointments WHERE id = $1
    `;
    
    const specificResult = await pool.query(specificQuery, [specificAppointmentId]);
    
    if (specificResult.rows.length > 0) {
      const appointment = specificResult.rows[0];
      console.log(`\n🎯 Found Our Test Appointment:`);
      console.log(`   ID: ${appointment.id}`);
      console.log(`   Customer: ${appointment.customer_name || 'N/A'} (${appointment.customer_phone || 'N/A'})`);
      console.log(`   Service: ${appointment.service_name || 'N/A'}`);
      console.log(`   Staff: ${appointment.staff_name || 'N/A'}`);
      console.log(`   Date/Time: ${appointment.scheduled_at || 'N/A'}`);
      console.log(`   Status: ${appointment.status || 'N/A'}`);
      console.log(`   Amount: ₹${appointment.total_amount || 'N/A'}`);
      console.log(`   ✅ APPOINTMENT SUCCESSFULLY CREATED IN DATABASE!`);
    } else {
      console.log(`\n❌ Test appointment ${specificAppointmentId} not found in database`);
    }
    
  } catch (error) {
    console.error('❌ Error verifying appointment creation:', error);
  } finally {
    await pool.end();
  }
}

async function checkAppointmentsInSalonDashboard() {
  console.log('\n🔍 Checking Appointments in Salon Dashboard API');
  console.log('===============================================\n');
  
  try {
    const response = await fetch('https://whatsapp-bot-for-consumer.vercel.app/api/salon/appointments', {
      headers: {
        'x-tenant-id': 'bella-salon'
      }
    });
    
    if (response.ok) {
      const appointments = await response.json();
      console.log(`📊 Found ${appointments.length} appointments in salon dashboard:`);
      
      // Show recent appointments
      const recentAppointments = appointments
        .filter(apt => new Date(apt.created_at || apt.scheduled_at) > new Date(Date.now() - 60 * 60 * 1000))
        .slice(0, 5);
      
      recentAppointments.forEach((appointment, index) => {
        console.log(`\n📅 Recent Appointment ${index + 1}:`);
        console.log(`   ID: ${appointment.id}`);
        console.log(`   Customer: ${appointment.customer_name || appointment.customer || 'N/A'}`);
        console.log(`   Service: ${appointment.service_name || appointment.service || 'N/A'}`);
        console.log(`   Staff: ${appointment.staff_name || appointment.staff || 'N/A'}`);
        console.log(`   Date/Time: ${appointment.scheduled_at || appointment.appointment_time || 'N/A'}`);
        console.log(`   Status: ${appointment.status || 'N/A'}`);
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
  console.log('🚀 Verify Appointment Creation');
  console.log('==============================\n');
  
  // Check database directly
  await verifyAppointmentCreation();
  
  // Check salon dashboard API
  await checkAppointmentsInSalonDashboard();
  
  console.log('\n🎯 Summary:');
  console.log('- If appointments are found, the WhatsApp Bot is successfully creating real appointments');
  console.log('- If appointments appear in salon dashboard, the integration is working perfectly');
  console.log('- This confirms that WhatsApp bookings are reflected in the salon UI');
}

main().catch(console.error);
