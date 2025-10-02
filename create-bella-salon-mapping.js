/**
 * Create Bella Salon Mapping
 * Create or update services in the services table to match Bella Salon offerings
 */

import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createBellaSalonMapping() {
  console.log('🔗 Creating Bella Salon Mapping');
  console.log('===============================\n');
  
  try {
    const tenantId = '85de5a0c-6aeb-479a-aa76-cbdd6b0845a7';
    
    // Get Bella Salon offerings
    const offeringsQuery = await pool.query(`
      SELECT id, name, base_price, category, description
      FROM offerings 
      WHERE tenant_id = $1 AND offering_type = 'service' AND is_active = true
      ORDER BY name
    `, [tenantId]);
    
    console.log(`📋 Found ${offeringsQuery.rows.length} Bella Salon offerings`);
    
    // Get existing services
    const servicesQuery = await pool.query(`
      SELECT id, name, price
      FROM services 
      WHERE is_active = true
      ORDER BY name
    `);
    
    console.log(`📋 Found ${servicesQuery.rows.length} existing services`);
    
    // Create mapping: update existing services or create new ones
    const mapping = [];
    
    for (const offering of offeringsQuery.rows) {
      // Try to find existing service with same name and price
      let existingService = servicesQuery.rows.find(service => 
        service.name.toLowerCase().trim() === offering.name.toLowerCase().trim() &&
        parseFloat(service.price) === parseFloat(offering.base_price)
      );
      
      if (existingService) {
        console.log(`✅ Found existing service: ${offering.name} → ${existingService.id}`);
        mapping.push({
          offering_id: offering.id,
          offering_name: offering.name,
          service_id: existingService.id,
          service_name: existingService.name,
          price: offering.base_price
        });
      } else {
        // Create new service
        console.log(`➕ Creating new service: ${offering.name}`);
        
        const newServiceResult = await pool.query(`
          INSERT INTO services (name, description, price, is_active, icon)
          VALUES ($1, $2, $3, true, $4)
          RETURNING id
        `, [
          offering.name,
          offering.description || `Bella Salon ${offering.name}`,
          parseFloat(offering.base_price),
          getServiceIcon(offering.category)
        ]);
        
        const newServiceId = newServiceResult.rows[0].id;
        console.log(`✅ Created new service: ${offering.name} → ${newServiceId}`);
        
        mapping.push({
          offering_id: offering.id,
          offering_name: offering.name,
          service_id: newServiceId,
          service_name: offering.name,
          price: offering.base_price
        });
      }
    }
    
    console.log('\n🔗 Final Mapping:');
    mapping.forEach((map, index) => {
      console.log(`   ${index + 1}. ${map.offering_name} (${map.offering_id}) → ${map.service_name} (${map.service_id})`);
    });
    
    return mapping;
    
  } catch (error) {
    console.error('❌ Error creating Bella Salon mapping:', error);
    return [];
  } finally {
    await pool.end();
  }
}

function getServiceIcon(category) {
  switch (category) {
    case 'skincare': return 'fas fa-sparkles';
    case 'hair': return 'fas fa-cut';
    case 'nails': return 'fas fa-hand-paper';
    case 'makeup': return 'fas fa-palette';
    default: return 'fas fa-star';
  }
}

async function main() {
  console.log('🚀 Create Bella Salon Mapping');
  console.log('=============================\n');
  
  const mapping = await createBellaSalonMapping();
  
  console.log('\n🎯 Next Steps:');
  console.log('- Update WhatsApp Bot to use this mapping');
  console.log('- Show Bella Salon services but create bookings with mapped service IDs');
  console.log('- Ensure salon dashboard shows the correct bookings');
}

main().catch(console.error);
