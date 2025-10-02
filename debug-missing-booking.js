/**
 * Debug Missing Booking
 * Debug why the specific WhatsApp Bot booking isn't showing in salon dashboard
 */

import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function debugMissingBooking() {
  console.log('🔍 Debug Missing Booking');
  console.log('=======================\n');
  
  try {
    const bookingId = '2ab978fd-0327-4466-8696-c6524b4872cc';
    const phoneNumber = '919567882568';
    
    // Check if the booking exists in the database
    console.log('📊 Checking if booking exists in database:');
    const bookingResult = await pool.query(`
      SELECT 
        b.id, b.customer_name, b.phone_number, b.amount, b.status, 
        b.appointment_date, b.appointment_time, b.notes, b.created_at,
        s.name as service_name
      FROM bookings b
      LEFT JOIN services s ON b.service_id = s.id
      WHERE b.id = $1
    `, [bookingId]);
    
    if (bookingResult.rows.length > 0) {
      const booking = bookingResult.rows[0];
      console.log(`✅ Booking found in database:`);
      console.log(`   ID: ${booking.id}`);
      console.log(`   Customer: ${booking.customer_name}`);
      console.log(`   Phone: ${booking.phone_number}`);
      console.log(`   Service: ${booking.service_name}`);
      console.log(`   Amount: ₹${booking.amount}`);
      console.log(`   Status: ${booking.status}`);
      console.log(`   Date: ${booking.appointment_date}`);
      console.log(`   Time: ${booking.appointment_time}`);
      console.log(`   Notes: ${booking.notes}`);
      console.log(`   Created: ${booking.created_at}`);
    } else {
      console.log(`❌ Booking not found in database`);
    }
    
    // Check bookings by phone number
    console.log('\n📱 Checking bookings by phone number:');
    const phoneResult = await pool.query(`
      SELECT 
        b.id, b.customer_name, b.phone_number, b.amount, b.status, 
        b.appointment_date, b.appointment_time, b.notes, b.created_at,
        s.name as service_name
      FROM bookings b
      LEFT JOIN services s ON b.service_id = s.id
      WHERE b.phone_number = $1
      ORDER BY b.created_at DESC
    `, [phoneNumber]);
    
    console.log(`📊 Found ${phoneResult.rows.length} bookings for phone ${phoneNumber}:`);
    phoneResult.rows.forEach((booking, index) => {
      console.log(`   ${index + 1}. ID: ${booking.id}, Service: ${booking.service_name}, Amount: ₹${booking.amount}, Created: ${booking.created_at}`);
    });
    
    // Test the salon dashboard query for this specific booking
    console.log('\n📊 Testing salon dashboard query for this booking:');
    const tenantId = '85de5a0c-6aeb-479a-aa76-cbdd6b0845a7';
    
    const salonQuery = await pool.query(`
      SELECT 
        b.id::text, NULL as transaction_number, b.customer_name, b.phone_number as customer_phone, 
        NULL as customer_email, 
        b.appointment_date as scheduled_at,
        60 as duration_minutes, b.amount, 'INR' as currency, 
        CASE WHEN b.status = 'confirmed' THEN 'paid' ELSE 'pending' END as payment_status,
        'UPI' as payment_method, b.notes, b.created_at, b.updated_at, NULL as staff_id,
        s.name as service_name, 'general' as service_category,
        'whatsapp_bot' as source
      FROM bookings b
      LEFT JOIN services s ON b.service_id = s.id
      WHERE b.created_at >= CURRENT_DATE - INTERVAL '30 days'
        AND b.notes LIKE '%WhatsApp booking%'
        AND b.id = $1
    `, [bookingId]);
    
    console.log(`📊 Salon dashboard query result: ${salonQuery.rows.length} rows`);
    if (salonQuery.rows.length > 0) {
      const result = salonQuery.rows[0];
      console.log(`✅ Booking found in salon dashboard query:`);
      console.log(`   ID: ${result.id}`);
      console.log(`   Customer: ${result.customer_name}`);
      console.log(`   Service: ${result.service_name}`);
      console.log(`   Amount: ₹${result.amount}`);
      console.log(`   Source: ${result.source}`);
      console.log(`   Scheduled: ${result.scheduled_at}`);
    } else {
      console.log(`❌ Booking not found in salon dashboard query`);
      
      // Check why it's not matching the WHERE conditions
      console.log('\n🔍 Debugging WHERE conditions:');
      
      // Check created_at condition
      const createdCheck = await pool.query(`
        SELECT created_at, CURRENT_DATE - INTERVAL '30 days' as cutoff_date
        FROM bookings 
        WHERE id = $1
      `, [bookingId]);
      
      if (createdCheck.rows.length > 0) {
        const created = createdCheck.rows[0];
        console.log(`   Created at: ${created.created_at}`);
        console.log(`   Cutoff date: ${created.cutoff_date}`);
        console.log(`   Is recent: ${created.created_at >= created.cutoff_date}`);
      }
      
      // Check notes condition
      const notesCheck = await pool.query(`
        SELECT notes, notes LIKE '%WhatsApp booking%' as matches_notes
        FROM bookings 
        WHERE id = $1
      `, [bookingId]);
      
      if (notesCheck.rows.length > 0) {
        const notes = notesCheck.rows[0];
        console.log(`   Notes: "${notes.notes}"`);
        console.log(`   Matches WhatsApp booking: ${notes.matches_notes}`);
      }
    }
    
    // Check all WhatsApp Bot bookings in the salon dashboard query
    console.log('\n📊 All WhatsApp Bot bookings in salon dashboard query:');
    const allWhatsAppQuery = await pool.query(`
      SELECT 
        b.id::text, b.customer_name, b.phone_number, b.amount, 
        b.appointment_date as scheduled_at, b.created_at, b.notes,
        s.name as service_name, 'whatsapp_bot' as source
      FROM bookings b
      LEFT JOIN services s ON b.service_id = s.id
      WHERE b.created_at >= CURRENT_DATE - INTERVAL '30 days'
        AND b.notes LIKE '%WhatsApp booking%'
      ORDER BY b.created_at DESC
      LIMIT 10
    `);
    
    console.log(`📊 Found ${allWhatsAppQuery.rows.length} WhatsApp Bot bookings in salon dashboard query:`);
    allWhatsAppQuery.rows.forEach((booking, index) => {
      console.log(`   ${index + 1}. ID: ${booking.id}, Customer: ${booking.customer_name}, Phone: ${booking.phone_number}, Service: ${booking.service_name}, Amount: ₹${booking.amount}, Created: ${booking.created_at}`);
    });
    
  } catch (error) {
    console.error('❌ Error debugging missing booking:', error);
  } finally {
    await pool.end();
  }
}

async function main() {
  console.log('🚀 Debug Missing Booking');
  console.log('=======================\n');
  
  await debugMissingBooking();
  
  console.log('\n🎯 Next Steps:');
  console.log('- Identify why the booking is not appearing in salon dashboard');
  console.log('- Fix the query or data issue');
  console.log('- Test the fix');
}

main().catch(console.error);
