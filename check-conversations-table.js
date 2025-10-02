/**
 * Check Conversations Table
 * Check the conversations table structure and data
 */

import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkConversationsTable() {
  console.log('🔍 Checking Conversations Table');
  console.log('==============================\n');
  
  try {
    // Check table structure
    const structureQuery = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'conversations'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Conversations table structure:');
    structureQuery.rows.forEach(column => {
      console.log(`   - ${column.column_name}: ${column.data_type} (${column.is_nullable === 'YES' ? 'nullable' : 'not null'}) ${column.column_default ? `default: ${column.column_default}` : ''}`);
    });
    
    // Check existing conversations
    const dataQuery = await pool.query(`
      SELECT id, created_at, updated_at
      FROM conversations
      ORDER BY created_at DESC
      LIMIT 5
    `);
    
    console.log(`\n📊 Found ${dataQuery.rows.length} existing conversations:`);
    dataQuery.rows.forEach((conv, index) => {
      console.log(`   ${index + 1}. ID: ${conv.id}, Created: ${conv.created_at}`);
    });
    
    // Check if we can create a conversation
    if (dataQuery.rows.length === 0) {
      console.log('\n🔧 No existing conversations found. Let\'s create one...');
      
      const { randomUUID } = await import('crypto');
      const conversationId = randomUUID();
      
      const insertResult = await pool.query(`
        INSERT INTO conversations (id, created_at, updated_at)
        VALUES ($1, NOW(), NOW())
        RETURNING id
      `, [conversationId]);
      
      console.log('✅ Created conversation:', insertResult.rows[0]);
      
      // Now try to create a booking with this conversation_id
      const bookingId = randomUUID();
      const bookingResult = await pool.query(`
        INSERT INTO bookings (
          id, conversation_id, service_id, phone_number, customer_name,
          amount, status, appointment_date, appointment_time, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
      `, [
        bookingId,
        conversationId,
        'test-service-id',
        '9876543210',
        'Test Customer',
        300,
        'confirmed',
        new Date('2025-10-03T10:00:00Z'),
        '10:00',
        'WhatsApp booking: Hair Cut & Style with Anita Patel'
      ]);
      
      console.log('✅ Booking created successfully with conversation_id!');
      console.log('📊 Booking result:', bookingResult.rows[0]);
      
    } else {
      console.log('\n🔧 Using existing conversation...');
      const existingConversationId = dataQuery.rows[0].id;
      
      const { randomUUID } = await import('crypto');
      const bookingId = randomUUID();
      
      const bookingResult = await pool.query(`
        INSERT INTO bookings (
          id, conversation_id, service_id, phone_number, customer_name,
          amount, status, appointment_date, appointment_time, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
      `, [
        bookingId,
        existingConversationId,
        'test-service-id',
        '9876543210',
        'Test Customer',
        300,
        'confirmed',
        new Date('2025-10-03T10:00:00Z'),
        '10:00',
        'WhatsApp booking: Hair Cut & Style with Anita Patel'
      ]);
      
      console.log('✅ Booking created successfully with existing conversation_id!');
      console.log('📊 Booking result:', bookingResult.rows[0]);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

async function main() {
  console.log('🚀 Check Conversations Table');
  console.log('============================\n');
  
  await checkConversationsTable();
  
  console.log('\n🎯 Solution:');
  console.log('- We need to create a conversation record first');
  console.log('- Or use an existing conversation_id');
  console.log('- Or modify the createAppointment method to handle this');
}

main().catch(console.error);
