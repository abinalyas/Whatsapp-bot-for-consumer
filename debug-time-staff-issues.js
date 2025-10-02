/**
 * Debug Time and Staff Issues
 * Debug why time and staff information is not displaying correctly
 */

import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function debugTimeStaffIssues() {
  console.log('🔍 Debug Time and Staff Issues');
  console.log('=============================\n');
  
  try {
    // Check recent WhatsApp Bot bookings
    console.log('📊 Recent WhatsApp Bot bookings:');
    const bookingsResult = await pool.query(`
      SELECT 
        b.id, b.customer_name, b.phone_number, b.amount, b.status, 
        b.appointment_date, b.appointment_time, b.notes, b.created_at,
        s.name as service_name, s.price as service_price,
        st.name as staff_name
      FROM bookings b
      LEFT JOIN services s ON b.service_id = s.id
      LEFT JOIN staff st ON b.notes LIKE '%' || st.name || '%'
      WHERE b.notes LIKE '%WhatsApp booking%'
      ORDER BY b.created_at DESC
      LIMIT 5
    `);
    
    console.log(`Found ${bookingsResult.rows.length} recent WhatsApp Bot bookings:`);
    bookingsResult.rows.forEach((booking, index) => {
      console.log(`\n📅 Booking ${index + 1}:`);
      console.log(`   ID: ${booking.id}`);
      console.log(`   Customer: ${booking.customer_name}`);
      console.log(`   Phone: ${booking.phone_number}`);
      console.log(`   Service: ${booking.service_name} (₹${booking.service_price})`);
      console.log(`   Amount: ₹${booking.amount}`);
      console.log(`   Appointment Date: ${booking.appointment_date}`);
      console.log(`   Appointment Time: ${booking.appointment_time}`);
      console.log(`   Staff (from notes): ${booking.staff_name || 'Not found'}`);
      console.log(`   Notes: ${booking.notes}`);
      console.log(`   Created: ${booking.created_at}`);
      
      // Check time conversion issues
      if (booking.appointment_date && booking.appointment_time) {
        const appointmentDateTime = new Date(booking.appointment_date);
        const timeString = booking.appointment_time;
        console.log(`   📊 Time Analysis:`);
        console.log(`   - Appointment Date: ${appointmentDateTime}`);
        console.log(`   - Appointment Time: "${timeString}"`);
        console.log(`   - Date + Time: ${appointmentDateTime} ${timeString}`);
        
        // Try to create a proper datetime
        const dateStr = appointmentDateTime.toISOString().split('T')[0];
        const fullDateTime = new Date(`${dateStr}T${timeString}:00`);
        console.log(`   - Combined DateTime: ${fullDateTime}`);
        console.log(`   - Local Time: ${fullDateTime.toLocaleString()}`);
      }
    });
    
    // Check services table for price issues
    console.log('\n📊 Services table check:');
    const servicesResult = await pool.query(`
      SELECT id, name, price, description
      FROM services 
      WHERE name IN ('Pedicure', 'Hair Cut & Style', 'Threading')
      ORDER BY name
    `);
    
    console.log(`Found ${servicesResult.rows.length} services:`);
    servicesResult.rows.forEach((service, index) => {
      console.log(`   ${index + 1}. ${service.name} - ₹${service.price} (ID: ${service.id})`);
    });
    
    // Check staff table
    console.log('\n📊 Staff table check:');
    const staffResult = await pool.query(`
      SELECT id, name, email
      FROM staff 
      WHERE tenant_id = '85de5a0c-6aeb-479a-aa76-cbdd6b0845a7'
      ORDER BY name
    `);
    
    console.log(`Found ${staffResult.rows.length} staff members:`);
    staffResult.rows.forEach((staff, index) => {
      console.log(`   ${index + 1}. ${staff.name} (ID: ${staff.id})`);
    });
    
    // Check if there are any bookings with staff_id field
    console.log('\n📊 Check bookings table structure:');
    const structureResult = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'bookings'
      ORDER BY ordinal_position
    `);
    
    console.log('Bookings table columns:');
    structureResult.rows.forEach((col, index) => {
      console.log(`   ${index + 1}. ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
    });
    
  } catch (error) {
    console.error('❌ Error debugging time and staff issues:', error);
  } finally {
    await pool.end();
  }
}

async function main() {
  console.log('🚀 Debug Time and Staff Issues');
  console.log('=============================\n');
  
  await debugTimeStaffIssues();
  
  console.log('\n🎯 Next Steps:');
  console.log('- Fix time conversion issues');
  console.log('- Fix staff assignment issues');
  console.log('- Fix price/duration display issues');
}

main().catch(console.error);
