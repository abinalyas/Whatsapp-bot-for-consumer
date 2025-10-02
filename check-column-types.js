/**
 * Check Column Types
 * Check the data types of service_id columns in both tables
 */

import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkColumnTypes() {
  console.log('🔍 Checking Column Types');
  console.log('========================\n');
  
  try {
    // Check bookings.service_id type
    const bookingsQuery = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'bookings' AND column_name = 'service_id'
    `);
    
    console.log('📋 bookings.service_id:');
    if (bookingsQuery.rows.length > 0) {
      const col = bookingsQuery.rows[0];
      console.log(`   Type: ${col.data_type}`);
      console.log(`   Nullable: ${col.is_nullable}`);
    }
    
    // Check services.id type
    const servicesQuery = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'services' AND column_name = 'id'
    `);
    
    console.log('\n📋 services.id:');
    if (servicesQuery.rows.length > 0) {
      const col = servicesQuery.rows[0];
      console.log(`   Type: ${col.data_type}`);
      console.log(`   Nullable: ${col.is_nullable}`);
    }
    
    // Check offerings.id type
    const offeringsQuery = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'offerings' AND column_name = 'id'
    `);
    
    console.log('\n📋 offerings.id:');
    if (offeringsQuery.rows.length > 0) {
      const col = offeringsQuery.rows[0];
      console.log(`   Type: ${col.data_type}`);
      console.log(`   Nullable: ${col.is_nullable}`);
    }
    
    // Check what data is currently in bookings.service_id
    const sampleQuery = await pool.query(`
      SELECT service_id, customer_name 
      FROM bookings 
      LIMIT 3
    `);
    
    console.log('\n📋 Sample bookings.service_id values:');
    sampleQuery.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.service_id} (${typeof row.service_id}) - ${row.customer_name}`);
    });
    
    // Check what data is in offerings.id
    const offeringsSampleQuery = await pool.query(`
      SELECT id, name 
      FROM offerings 
      WHERE offering_type = 'service'
      LIMIT 3
    `);
    
    console.log('\n📋 Sample offerings.id values:');
    offeringsSampleQuery.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.id} (${typeof row.id}) - ${row.name}`);
    });
    
  } catch (error) {
    console.error('❌ Error checking column types:', error);
  } finally {
    await pool.end();
  }
}

async function main() {
  console.log('🚀 Check Column Types');
  console.log('====================\n');
  
  await checkColumnTypes();
  
  console.log('\n🎯 Analysis:');
  console.log('- Check if we need to convert data types');
  console.log('- See if we can create a mapping instead');
  console.log('- Determine the best approach to fix the foreign key constraint');
}

main().catch(console.error);
