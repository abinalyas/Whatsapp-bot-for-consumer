/**
 * Test Corrected Booking Creation
 * Test booking creation with corrected service data
 */

import { Pool } from '@neondatabase/serverless';
import { randomUUID } from 'crypto';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testCorrectedBookingCreation() {
  console.log('🧪 Testing Corrected Booking Creation');
  console.log('====================================\n');
  
  try {
    // First, get a real service ID from the database
    const servicesQuery = await pool.query(`
      SELECT id, name, price 
      FROM services 
      WHERE name ILIKE '%hair%' 
      LIMIT 1
    `);
    
    if (servicesQuery.rows.length === 0) {
      console.log('❌ No hair services found in database');
      return;
    }
    
    const service = servicesQuery.rows[0];
    console.log('📋 Using service:', service);
    
    // Create conversation record first
    const conversationId = randomUUID();
    console.log(`📝 Creating conversation with ID: ${conversationId}`);
    
    await pool.query(`
      INSERT INTO conversations (
        id, phone_number, customer_name, current_state, 
        selected_service, selected_date, selected_time, context_data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      conversationId,
      '9876543210',
      'Test Customer',
      'booking_completed',
      service.id,
      '2025-10-03',
      '10:00',
      JSON.stringify({
        service_name: service.name,
        staff_name: 'Anita Patel',
        amount: service.price
      })
    ]);
    
    console.log(`✅ Conversation created successfully: ${conversationId}`);
    
    // Now create the booking
    const bookingId = randomUUID();
    console.log(`📝 Creating booking with ID: ${bookingId}`);
    
    const result = await pool.query(`
      INSERT INTO bookings (
        id, conversation_id, service_id, phone_number, customer_name,
        amount, status, appointment_date, appointment_time, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id
    `, [
      bookingId,
      conversationId,
      service.id,
      '9876543210',
      'Test Customer',
      service.price,
      'confirmed',
      new Date('2025-10-03T10:00:00Z'),
      '10:00',
      `WhatsApp booking: ${service.name} with Anita Patel`
    ]);
    
    console.log('✅ Booking created successfully!');
    console.log('📊 Result:', result.rows[0]);
    
    // Verify the booking was created
    const verifyQuery = await pool.query(`
      SELECT * FROM bookings WHERE id = $1
    `, [bookingId]);
    
    if (verifyQuery.rows.length > 0) {
      const booking = verifyQuery.rows[0];
      console.log('\n🎉 Booking verification:');
      console.log(`   ID: ${booking.id}`);
      console.log(`   Customer: ${booking.customer_name} (${booking.phone_number})`);
      console.log(`   Service ID: ${booking.service_id}`);
      console.log(`   Amount: ₹${booking.amount}`);
      console.log(`   Status: ${booking.status}`);
      console.log(`   Date: ${booking.appointment_date}`);
      console.log(`   Time: ${booking.appointment_time}`);
      console.log(`   Notes: ${booking.notes}`);
      
      console.log('\n🎯 SUCCESS: Database insertion works with correct data!');
    }
    
  } catch (error) {
    console.error('❌ Error creating booking:', error);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error code:', error.code);
    console.error('❌ Error constraint:', error.constraint);
  } finally {
    await pool.end();
  }
}

async function main() {
  console.log('🚀 Test Corrected Booking Creation');
  console.log('==================================\n');
  
  await testCorrectedBookingCreation();
  
  console.log('\n🎯 Expected Results:');
  console.log('- If successful, the database insertion works with correct service data');
  console.log('- This confirms the WhatsApp Bot should work with the corrected queries');
  console.log('- The issue might be in the service selection logic');
}

main().catch(console.error);
