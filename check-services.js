/**
 * Check current services in the database
 */

import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function checkServices() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔍 Checking services in database...\n');

    // Get tenant ID for Bella Salon
    const tenantResult = await pool.query(`
      SELECT id, domain, business_name FROM tenants WHERE domain = $1 OR business_name = $2
    `, ['bella-salon', 'Bella Salon']);
    
    if (tenantResult.rows.length === 0) {
      console.log('❌ No tenant found for Bella Salon');
      return;
    }

    const tenant = tenantResult.rows[0];
    console.log(`📋 Tenant: ${tenant.business_name} (${tenant.domain})`);
    console.log(`🆔 Tenant ID: ${tenant.id}\n`);

    // Get services
    const servicesResult = await pool.query(`
      SELECT id, name, description, category, subcategory, 
             base_price, currency, duration_minutes, 
             is_active, display_order
      FROM offerings 
      WHERE tenant_id = $1 AND offering_type = 'service'
      ORDER BY display_order, name
    `, [tenant.id]);

    console.log(`📊 Found ${servicesResult.rows.length} services:\n`);

    if (servicesResult.rows.length === 0) {
      console.log('❌ No services found for this tenant');
      console.log('💡 You may need to add services through the salon dashboard');
    } else {
      servicesResult.rows.forEach((service, index) => {
        console.log(`${index + 1}. ${service.name}`);
        console.log(`   💰 Price: ₹${service.base_price}`);
        console.log(`   ⏰ Duration: ${service.duration_minutes} minutes`);
        console.log(`   📂 Category: ${service.category || 'N/A'}`);
        console.log(`   🆔 ID: ${service.id}`);
        console.log(`   ✅ Active: ${service.is_active ? 'Yes' : 'No'}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Error checking services:', error);
  } finally {
    await pool.end();
  }
}

// Run if this script is executed directly
checkServices().catch(console.error);

export { checkServices };
