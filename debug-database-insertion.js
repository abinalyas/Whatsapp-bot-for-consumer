/**
 * Debug Database Insertion
 * Test the exact database insertion that's failing
 */

import { Pool } from '@neondatabase/serverless';
import { randomUUID } from 'crypto';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testDatabaseInsertion() {
  console.log('🔍 Testing Database Insertion');
  console.log('============================\n');
  
  try {
    // Test data similar to what the bot would create
    const bookingId = randomUUID();
    const conversationId = randomUUID();
    
    const testData = {
      id: bookingId,
      conversation_id: conversationId,
      service_id: 'test-service-id',
      phone_number: '9876543210',
      customer_name: 'Test Customer',
      amount: 300,
      status: 'confirmed',
      appointment_date: new Date('2025-10-03T10:00:00Z'),
      appointment_time: '10:00',
      notes: 'WhatsApp booking: Hair Cut & Style with Anita Patel'
    };
    
    console.log('📝 Test data:', JSON.stringify(testData, null, 2));
    
    // Test the exact query from the createAppointment method
    const result = await pool.query(`
      INSERT INTO bookings (
        id, conversation_id, service_id, phone_number, customer_name,
        amount, status, appointment_date, appointment_time, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id
    `, [
      testData.id,
      testData.conversation_id,
      testData.service_id,
      testData.phone_number,
      testData.customer_name,
      testData.amount,
      testData.status,
      testData.appointment_date,
      testData.appointment_time,
      testData.notes
    ]);
    
    console.log('✅ Database insertion successful!');
    console.log('📊 Result:', result.rows);
    
    // Verify the booking was created
    const verifyQuery = await pool.query(`
      SELECT * FROM bookings WHERE id = $1
    `, [bookingId]);
    
    console.log('🔍 Verification query result:', verifyQuery.rows);
    
    if (verifyQuery.rows.length > 0) {
      console.log('✅ Booking successfully created and verified!');
    } else {
      console.log('❌ Booking not found after insertion');
    }
    
  } catch (error) {
    console.error('❌ Database insertion failed:', error);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error code:', error.code);
    console.error('❌ Error detail:', error.detail);
    console.error('❌ Error hint:', error.hint);
  } finally {
    await pool.end();
  }
}

async function checkBookingsTableStructure() {
  console.log('\n🔍 Checking Bookings Table Structure');
  console.log('====================================\n');
  
  try {
    const structureQuery = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'bookings'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Bookings table structure:');
    structureQuery.rows.forEach(column => {
      console.log(`   - ${column.column_name}: ${column.data_type} (${column.is_nullable === 'YES' ? 'nullable' : 'not null'}) ${column.column_default ? `default: ${column.column_default}` : ''}`);
    });
    
  } catch (error) {
    console.error('❌ Error checking table structure:', error);
  }
}

async function main() {
  console.log('🚀 Debug Database Insertion');
  console.log('===========================\n');
  
  await checkBookingsTableStructure();
  await testDatabaseInsertion();
  
  console.log('\n🎯 Analysis:');
  console.log('- If insertion succeeds, the issue is in the bot code');
  console.log('- If insertion fails, we need to fix the database query');
  console.log('- Check for any constraint violations or data type mismatches');
}

main().catch(console.error);
