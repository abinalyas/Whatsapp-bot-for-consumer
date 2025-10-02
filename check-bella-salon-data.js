/**
 * Check Bella Salon Data
 * Check what services and staff are actually in the Bella Salon offerings
 */

import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkBellaSalonData() {
  console.log('🔍 Checking Bella Salon Data');
  console.log('============================\n');
  
  try {
    // Check Bella Salon tenant ID
    const tenantQuery = await pool.query(`
      SELECT id, business_name, domain
      FROM tenants 
      WHERE domain = 'bella-salon' OR business_name ILIKE '%bella%'
    `);
    
    console.log('📋 Bella Salon Tenant:');
    if (tenantQuery.rows.length > 0) {
      const tenant = tenantQuery.rows[0];
      console.log(`   ID: ${tenant.id}`);
      console.log(`   Business Name: ${tenant.business_name}`);
      console.log(`   Domain: ${tenant.domain}`);
      
      const tenantId = tenant.id;
      
      // Check Bella Salon services (offerings)
      console.log('\n📋 Bella Salon Services (Offerings):');
      const offeringsQuery = await pool.query(`
        SELECT id, name, base_price, category, is_active
        FROM offerings 
        WHERE tenant_id = $1 AND offering_type = 'service' AND is_active = true
        ORDER BY display_order, name
      `, [tenantId]);
      
      console.log(`Found ${offeringsQuery.rows.length} services:`);
      offeringsQuery.rows.forEach((service, index) => {
        console.log(`   ${index + 1}. ${service.name} - ₹${service.base_price} (Category: ${service.category})`);
      });
      
      // Check Bella Salon staff
      console.log('\n📋 Bella Salon Staff:');
      const staffQuery = await pool.query(`
        SELECT id, name, email, phone, is_active
        FROM staff 
        WHERE tenant_id = $1 AND is_active = true
        ORDER BY name
      `, [tenantId]);
      
      console.log(`Found ${staffQuery.rows.length} staff members:`);
      staffQuery.rows.forEach((staff, index) => {
        console.log(`   ${index + 1}. ${staff.name} (${staff.email}) - ${staff.phone}`);
      });
      
      // Check Bella Salon bookings
      console.log('\n📋 Bella Salon Bookings:');
      const bookingsQuery = await pool.query(`
        SELECT id, customer_name, amount, status, appointment_date, appointment_time, notes
        FROM bookings 
        WHERE conversation_id IN (
          SELECT id FROM conversations WHERE phone_number LIKE '%987654321%'
        )
        ORDER BY created_at DESC
        LIMIT 5
      `);
      
      console.log(`Found ${bookingsQuery.rows.length} recent bookings:`);
      bookingsQuery.rows.forEach((booking, index) => {
        console.log(`   ${index + 1}. ${booking.customer_name} - ₹${booking.amount} - ${booking.appointment_date} ${booking.appointment_time}`);
      });
      
      return {
        tenantId,
        services: offeringsQuery.rows,
        staff: staffQuery.rows,
        bookings: bookingsQuery.rows
      };
      
    } else {
      console.log('❌ No Bella Salon tenant found');
      return null;
    }
    
  } catch (error) {
    console.error('❌ Error checking Bella Salon data:', error);
    return null;
  } finally {
    await pool.end();
  }
}

async function main() {
  console.log('🚀 Check Bella Salon Data');
  console.log('=========================\n');
  
  const bellaData = await checkBellaSalonData();
  
  if (bellaData) {
    console.log('\n🎯 Next Steps:');
    console.log('- Update WhatsApp Bot to use Bella Salon services');
    console.log('- Update salon dashboard to show Bella Salon bookings');
    console.log('- Ensure staff and booking data is consistent');
  } else {
    console.log('\n❌ Need to create or fix Bella Salon data');
  }
}

main().catch(console.error);
