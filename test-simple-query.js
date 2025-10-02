/**
 * Test Simple Query
 * Test the salon dashboard query with the correct casting
 */

import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testSimpleQuery() {
  console.log('🔍 Test Simple Query');
  console.log('===================\n');
  
  try {
    const tenantId = '85de5a0c-6aeb-479a-aa76-cbdd6b0845a7';
    
    // Test the exact query from the API
    console.log('📊 Testing salon dashboard query:');
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
        LEFT JOIN staff st ON t.staff_id::uuid = st.id
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
        LEFT JOIN staff st ON b.staff_id::uuid = st.id
        WHERE b.created_at >= CURRENT_DATE - INTERVAL '30 days'
          AND b.notes LIKE '%WhatsApp booking%'
        
        ORDER BY scheduled_at DESC
        LIMIT 10
      `, [tenantId]);
      
      console.log(`✅ Query successful: ${result.rows.length} rows`);
      
      // Show WhatsApp Bot bookings with staff names
      const whatsappBookings = result.rows.filter(row => row.source === 'whatsapp_bot');
      console.log(`\n📱 WhatsApp Bot bookings: ${whatsappBookings.length}`);
      
      whatsappBookings.slice(0, 5).forEach((booking, index) => {
        console.log(`   ${index + 1}. ${booking.customer_name} - ${booking.service_name} - Staff: ${booking.staff_name || 'Not assigned'} - ₹${booking.amount}`);
      });
      
      // Show regular appointments
      const regularAppointments = result.rows.filter(row => row.source === 'transaction');
      console.log(`\n📊 Regular appointments: ${regularAppointments.length}`);
      
      regularAppointments.slice(0, 3).forEach((apt, index) => {
        console.log(`   ${index + 1}. ${apt.customer_name} - ${apt.service_name} - Staff: ${apt.staff_name || 'Not assigned'} - ₹${apt.amount}`);
      });
      
    } catch (error) {
      console.error('❌ Query failed:', error.message);
      console.error('Error details:', error);
    }
    
  } catch (error) {
    console.error('❌ Error testing simple query:', error);
  } finally {
    await pool.end();
  }
}

async function main() {
  console.log('🚀 Test Simple Query');
  console.log('===================\n');
  
  await testSimpleQuery();
  
  console.log('\n🎯 Summary:');
  console.log('- If query works, the issue is with the API deployment');
  console.log('- If query fails, we need to fix the query');
}

main().catch(console.error);
