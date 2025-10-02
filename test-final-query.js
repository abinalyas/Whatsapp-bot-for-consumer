/**
 * Test Final Query
 * Test the final fixed salon appointments query
 */

import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testFinalQuery() {
  console.log('🔍 Test Final Query');
  console.log('==================\n');
  
  try {
    const tenantId = '85de5a0c-6aeb-479a-aa76-cbdd6b0845a7';
    
    // Test the final UNION query
    console.log('📊 Testing final UNION query:');
    try {
      const unionResult = await pool.query(`
        SELECT 
          t.id::text, t.transaction_number, t.customer_name, t.customer_phone, t.customer_email,
          t.scheduled_at, t.duration_minutes, t.amount, t.currency, t.payment_status,
          t.payment_method, t.notes, t.created_at, t.updated_at, t.staff_id,
          o.name as service_name, o.category as service_category,
          'transaction' as source
        FROM transactions t
        LEFT JOIN offerings o ON t.offering_id = o.id
        WHERE t.tenant_id = $1 AND t.transaction_type = 'booking'
        
        UNION ALL
        
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
        
        ORDER BY scheduled_at DESC
        LIMIT 10
      `, [tenantId]);
      
      console.log(`✅ Final UNION query successful: ${unionResult.rows.length} rows`);
      
      // Group by source
      const transactions = unionResult.rows.filter(row => row.source === 'transaction');
      const whatsappBookings = unionResult.rows.filter(row => row.source === 'whatsapp_bot');
      
      console.log(`\n📊 Regular appointments: ${transactions.length}`);
      transactions.slice(0, 3).forEach((row, index) => {
        console.log(`   ${index + 1}. ${row.customer_name} - ${row.service_name} - ₹${row.amount} - ${row.scheduled_at}`);
      });
      
      console.log(`\n📱 WhatsApp Bot bookings: ${whatsappBookings.length}`);
      whatsappBookings.slice(0, 3).forEach((row, index) => {
        console.log(`   ${index + 1}. ${row.customer_name} - ${row.service_name} - ₹${row.amount} - ${row.scheduled_at} (${row.source})`);
      });
      
      console.log(`\n🎯 Total appointments in salon dashboard: ${unionResult.rows.length}`);
      
    } catch (error) {
      console.error('❌ Final UNION query failed:', error.message);
      console.error('Error details:', error);
    }
    
  } catch (error) {
    console.error('❌ Error testing final query:', error);
  } finally {
    await pool.end();
  }
}

async function main() {
  console.log('🚀 Test Final Query');
  console.log('==================\n');
  
  await testFinalQuery();
  
  console.log('\n🎯 Next Steps:');
  console.log('- If query works, deploy the fix');
  console.log('- Test the salon dashboard shows WhatsApp Bot bookings');
}

main().catch(console.error);
