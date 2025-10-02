/**
 * Test Salon Dashboard Query
 * Test the salon dashboard query to find the 500 error
 */

import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testSalonDashboardQuery() {
  console.log('🔍 Test Salon Dashboard Query');
  console.log('============================\n');
  
  try {
    const tenantId = '85de5a0c-6aeb-479a-aa76-cbdd6b0845a7';
    
    // Test the updated salon dashboard query
    console.log('📊 Testing updated salon dashboard query:');
    try {
      const result = await pool.query(`
        SELECT 
          t.id::text, t.transaction_number, t.customer_name, t.customer_phone, t.customer_email,
          t.scheduled_at, t.duration_minutes, t.amount, t.currency, t.payment_status,
          t.payment_method, t.notes, t.created_at, t.updated_at, t.staff_id,
          o.name as service_name, o.category as service_category,
          st.name as staff_name, 'transaction' as source
        FROM transactions t
        LEFT JOIN offerings o ON t.offering_id = o.id
        LEFT JOIN staff st ON t.staff_id = st.id
        WHERE t.tenant_id = $1 AND t.transaction_type = 'booking'
        
        UNION ALL
        
        SELECT 
          b.id::text, NULL as transaction_number, b.customer_name, b.phone_number as customer_phone, 
          NULL as customer_email, 
          b.appointment_date as scheduled_at,
          60 as duration_minutes, b.amount, 'INR' as currency, 
          CASE WHEN b.status = 'confirmed' THEN 'paid' ELSE 'pending' END as payment_status,
          'UPI' as payment_method, b.notes, b.created_at, b.updated_at, b.staff_id,
          s.name as service_name, 'general' as service_category,
          st.name as staff_name, 'whatsapp_bot' as source
        FROM bookings b
        LEFT JOIN services s ON b.service_id = s.id
        LEFT JOIN staff st ON b.staff_id = st.id
        WHERE b.created_at >= CURRENT_DATE - INTERVAL '30 days'
          AND b.notes LIKE '%WhatsApp booking%'
        
        ORDER BY scheduled_at DESC
        LIMIT 10
      `, [tenantId]);
      
      console.log(`✅ Updated query successful: ${result.rows.length} rows`);
      
      // Check WhatsApp Bot bookings specifically
      const whatsappBookings = result.rows.filter(row => row.source === 'whatsapp_bot');
      console.log(`📱 WhatsApp Bot bookings: ${whatsappBookings.length}`);
      
      whatsappBookings.slice(0, 3).forEach((booking, index) => {
        console.log(`   ${index + 1}. ${booking.customer_name} - ${booking.service_name} - Staff: ${booking.staff_name || 'Not assigned'} - ₹${booking.amount}`);
      });
      
    } catch (error) {
      console.error('❌ Updated query failed:', error.message);
      console.error('Error details:', error);
    }
    
    // Test individual parts of the query
    console.log('\n📊 Testing individual query parts:');
    
    // Test transactions part
    try {
      const transactionsResult = await pool.query(`
        SELECT 
          t.id::text, t.transaction_number, t.customer_name, t.customer_phone, t.customer_email,
          t.scheduled_at, t.duration_minutes, t.amount, t.currency, t.payment_status,
          t.payment_method, t.notes, t.created_at, t.updated_at, t.staff_id,
          o.name as service_name, o.category as service_category,
          st.name as staff_name, 'transaction' as source
        FROM transactions t
        LEFT JOIN offerings o ON t.offering_id = o.id
        LEFT JOIN staff st ON t.staff_id = st.id
        WHERE t.tenant_id = $1 AND t.transaction_type = 'booking'
        LIMIT 5
      `, [tenantId]);
      
      console.log(`✅ Transactions query: ${transactionsResult.rows.length} rows`);
    } catch (error) {
      console.error('❌ Transactions query failed:', error.message);
    }
    
    // Test bookings part
    try {
      const bookingsResult = await pool.query(`
        SELECT 
          b.id::text, NULL as transaction_number, b.customer_name, b.phone_number as customer_phone, 
          NULL as customer_email, 
          b.appointment_date as scheduled_at,
          60 as duration_minutes, b.amount, 'INR' as currency, 
          CASE WHEN b.status = 'confirmed' THEN 'paid' ELSE 'pending' END as payment_status,
          'UPI' as payment_method, b.notes, b.created_at, b.updated_at, b.staff_id,
          s.name as service_name, 'general' as service_category,
          st.name as staff_name, 'whatsapp_bot' as source
        FROM bookings b
        LEFT JOIN services s ON b.service_id = s.id
        LEFT JOIN staff st ON b.staff_id = st.id
        WHERE b.created_at >= CURRENT_DATE - INTERVAL '30 days'
          AND b.notes LIKE '%WhatsApp booking%'
        LIMIT 5
      `);
      
      console.log(`✅ Bookings query: ${bookingsResult.rows.length} rows`);
      
      if (bookingsResult.rows.length > 0) {
        const latestBooking = bookingsResult.rows[0];
        console.log(`   Latest booking: ${latestBooking.customer_name} - ${latestBooking.service_name} - Staff: ${latestBooking.staff_name || 'Not assigned'}`);
      }
      
    } catch (error) {
      console.error('❌ Bookings query failed:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error testing salon dashboard query:', error);
  } finally {
    await pool.end();
  }
}

async function main() {
  console.log('🚀 Test Salon Dashboard Query');
  console.log('============================\n');
  
  await testSalonDashboardQuery();
  
  console.log('\n🎯 Next Steps:');
  console.log('- Fix any query issues found');
  console.log('- Deploy the fix');
  console.log('- Test the complete integration');
}

main().catch(console.error);
