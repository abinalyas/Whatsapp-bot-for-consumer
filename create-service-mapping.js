/**
 * Create Service Mapping
 * Create a mapping between offerings and services tables
 */

import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createServiceMapping() {
  console.log('🔗 Creating Service Mapping');
  console.log('===========================\n');
  
  try {
    // Get all offerings
    const offeringsQuery = await pool.query(`
      SELECT id, name, base_price, category
      FROM offerings 
      WHERE offering_type = 'service' AND is_active = true
      ORDER BY name
    `);
    
    console.log('📋 Offerings (salon dashboard):');
    offeringsQuery.rows.forEach((offering, index) => {
      console.log(`   ${index + 1}. ${offering.name} - ₹${offering.base_price} (ID: ${offering.id})`);
    });
    
    // Get all services
    const servicesQuery = await pool.query(`
      SELECT id, name, price
      FROM services 
      WHERE is_active = true
      ORDER BY name
    `);
    
    console.log('\n📋 Services (database):');
    servicesQuery.rows.forEach((service, index) => {
      console.log(`   ${index + 1}. ${service.name} - ₹${service.price} (ID: ${service.id})`);
    });
    
    // Create mapping by name and price
    const mapping = [];
    for (const offering of offeringsQuery.rows) {
      const matchingService = servicesQuery.rows.find(service => 
        service.name.toLowerCase().trim() === offering.name.toLowerCase().trim() &&
        parseFloat(service.price) === parseFloat(offering.base_price)
      );
      
      if (matchingService) {
        mapping.push({
          offering_id: offering.id,
          offering_name: offering.name,
          service_id: matchingService.id,
          service_name: matchingService.name,
          price: offering.base_price
        });
      } else {
        console.log(`⚠️ No matching service found for offering: ${offering.name} - ₹${offering.base_price}`);
      }
    }
    
    console.log('\n🔗 Service Mapping:');
    mapping.forEach((map, index) => {
      console.log(`   ${index + 1}. ${map.offering_name} (${map.offering_id}) → ${map.service_name} (${map.service_id})`);
    });
    
    return mapping;
    
  } catch (error) {
    console.error('❌ Error creating service mapping:', error);
    return [];
  } finally {
    await pool.end();
  }
}

async function main() {
  console.log('🚀 Create Service Mapping');
  console.log('========================\n');
  
  const mapping = await createServiceMapping();
  
  console.log('\n🎯 Solution:');
  console.log('- Use this mapping in WhatsApp Bot to convert offerings IDs to services IDs');
  console.log('- WhatsApp Bot can show offerings data but create bookings with services IDs');
  console.log('- No database schema changes needed');
}

main().catch(console.error);
