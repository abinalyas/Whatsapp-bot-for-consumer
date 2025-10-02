/**
 * Test Salon Appointments Query
 * Debug the salon appointments SQL query
 */

import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testSalonAppointmentsQuery() {
  console.log('🔍 Test Salon Appointments Query');
  console.log('================================\n');
  
  try {
    const tenantId = '85de5a0c-6aeb-479a-aa76-cbdd6b0845a7';
    
    // Test the original transactions query first
    console.log('📊 Testing original transactions query:');
    try {
      const transactionsResult = await pool.query(`
        SELECT 
          t.id, t.transaction_number, t.customer_name, t.customer_phone, t.customer_email,
          t.scheduled_at, t.duration_minutes, t.amount, t.currency, t.payment_status,
          t.payment_method, t.notes, t.created_at, t.updated_at, t.staff_id,
          o.name as service_name, o.category as service_category,
          'transaction' as source
        FROM transactions t
        LEFT JOIN offerings o ON t.offering_id = o.id
        WHERE t.tenant_id = $1 AND t.transaction_type = 'booking'
        ORDER BY t.scheduled_at DESC
        LIMIT 5
      `, [tenantId]);
      
      console.log(`✅ Transactions query successful: ${transactionsResult.rows.length} rows`);
      transactionsResult.rows.forEach((row, index) => {
        console.log(`   ${index + 1}. ${row.customer_name} - ${row.service_name} - ₹${row.amount}`);
      });
    } catch (error) {
      console.error('❌ Transactions query failed:', error.message);
    }
    
    // Test the bookings query
    console.log('\n📊 Testing bookings query:');
    try {
      const bookingsResult = await pool.query(`
        SELECT 
          b.id, NULL as transaction_number, b.customer_name, b.phone_number as customer_phone, 
          NULL as customer_email, 
          CONCAT(b.appointment_date, ' ', b.appointment_time)::timestamp as scheduled_at,
          60 as duration_minutes, b.amount, 'INR' as currency, 
          CASE WHEN b.status = 'confirmed' THEN 'paid' ELSE 'pending' END as payment_status,
          'UPI' as payment_method, b.notes, b.created_at, b.updated_at, NULL as staff_id,
          s.name as service_name, 'general' as service_category,
          'whatsapp_bot' as source
        FROM bookings b
        LEFT JOIN services s ON b.service_id = s.id
        WHERE b.created_at >= CURRENT_DATE - INTERVAL '30 days'
          AND b.notes LIKE '%WhatsApp booking%'
        ORDER BY b.created_at DESC
        LIMIT 5
      `);
      
      console.log(`✅ Bookings query successful: ${bookingsResult.rows.length} rows`);
      bookingsResult.rows.forEach((row, index) => {
        console.log(`   ${index + 1}. ${row.customer_name} - ${row.service_name} - ₹${row.amount} (${row.source})`);
      });
    } catch (error) {
      console.error('❌ Bookings query failed:', error.message);
    }
    
    // Test the UNION query
    console.log('\n📊 Testing UNION query:');
    try {
      const unionResult = await pool.query(`
        SELECT 
          t.id, t.transaction_number, t.customer_name, t.customer_phone, t.customer_email,
          t.scheduled_at, t.duration_minutes, t.amount, t.currency, t.payment_status,
          t.payment_method, t.notes, t.created_at, t.updated_at, t.staff_id,
          o.name as service_name, o.category as service_category,
          'transaction' as source
        FROM transactions t
        LEFT JOIN offerings o ON t.offering_id = o.id
        WHERE t.tenant_id = $1 AND t.transaction_type = 'booking'
        
        UNION ALL
        
        SELECT 
          b.id, NULL as transaction_number, b.customer_name, b.phone_number as customer_phone, 
          NULL as customer_email, 
          CONCAT(b.appointment_date, ' ', b.appointment_time)::timestamp as scheduled_at,
          60 as duration_minutes, b.amount, 'INR' as currency, 
          CASE WHEN b.status = 'confirmed' THEN 'paid' ELSE 'pending' END as payment_status,
          'UPI' as payment_method, b.notes, b.created_at, b.updated_at, NULL as staff_id,
          s.name as service_name, 'general' as service_category,
          'whatsapp_bot' as source
        FROM bookings b
        LEFT JOIN services s ON b.service_id = s.id
        WHERE b.created_at >= CURRENT_DATE - INTERVAL '30 days'
          AND b.notes LIKE '%WhatsApp booking%'
        
        ORDER BY scheduled_at DESC
        LIMIT 10
      `, [tenantId]);
      
      console.log(`✅ UNION query successful: ${unionResult.rows.length} rows`);
      unionResult.rows.forEach((row, index) => {
        console.log(`   ${index + 1}. ${row.customer_name} - ${row.service_name} - ₹${row.amount} (${row.source})`);
      });
    } catch (error) {
      console.error('❌ UNION query failed:', error.message);
      console.error('Error details:', error);
    }
    
  } catch (error) {
    console.error('❌ Error testing salon appointments query:', error);
  } finally {
    await pool.end();
  }
}

async function main() {
  console.log('🚀 Test Salon Appointments Query');
  console.log('================================\n');
  
  await testSalonAppointmentsQuery();
  
  console.log('\n🎯 Next Steps:');
  console.log('- Fix any SQL query issues');
  console.log('- Update the salon appointments endpoint');
  console.log('- Test the integration');
}

main().catch(console.error);
