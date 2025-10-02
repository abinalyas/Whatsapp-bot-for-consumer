/**
 * Check Bookings Data Format
 * Check the actual format of appointment_date and appointment_time in bookings table
 */

import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkBookingsDataFormat() {
  console.log('🔍 Check Bookings Data Format');
  console.log('============================\n');
  
  try {
    // Check recent bookings data format
    const result = await pool.query(`
      SELECT 
        id, customer_name, appointment_date, appointment_time, amount, notes
      FROM bookings 
      WHERE notes LIKE '%WhatsApp booking%'
      ORDER BY created_at DESC
      LIMIT 5
    `);
    
    console.log(`📊 Found ${result.rows.length} WhatsApp Bot bookings:`);
    result.rows.forEach((row, index) => {
      console.log(`\n📅 Booking ${index + 1}:`);
      console.log(`   ID: ${row.id}`);
      console.log(`   Customer: ${row.customer_name}`);
      console.log(`   Appointment Date: "${row.appointment_date}" (type: ${typeof row.appointment_date})`);
      console.log(`   Appointment Time: "${row.appointment_time}" (type: ${typeof row.appointment_time})`);
      console.log(`   Amount: ${row.amount}`);
      console.log(`   Notes: ${row.notes}`);
      
      // Test different concatenation methods
      console.log(`   Test concatenation methods:`);
      console.log(`   - CONCAT: ${row.appointment_date + ' ' + row.appointment_time}`);
      console.log(`   - String concat: "${row.appointment_date} ${row.appointment_time}"`);
      console.log(`   - Date only: ${row.appointment_date}`);
      console.log(`   - Time only: ${row.appointment_time}`);
    });
    
  } catch (error) {
    console.error('❌ Error checking bookings data format:', error);
  } finally {
    await pool.end();
  }
}

async function main() {
  console.log('🚀 Check Bookings Data Format');
  console.log('============================\n');
  
  await checkBookingsDataFormat();
  
  console.log('\n🎯 Next Steps:');
  console.log('- Use the correct format for date/time concatenation');
  console.log('- Fix the salon appointments query');
}

main().catch(console.error);
