/**
 * Check Services Table Structure
 * Check the services table structure and data
 */

import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkServicesTable() {
  console.log('🔍 Checking Services Table Structure');
  console.log('====================================\n');
  
  try {
    // Check table structure
    const structureQuery = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'services'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Services table structure:');
    structureQuery.rows.forEach(column => {
      console.log(`   - ${column.column_name}: ${column.data_type} (${column.is_nullable === 'YES' ? 'nullable' : 'not null'}) ${column.column_default ? `default: ${column.column_default}` : ''}`);
    });
    
    // Check existing services
    const dataQuery = await pool.query(`
      SELECT * FROM services
      LIMIT 5
    `);
    
    console.log(`\n📊 Found ${dataQuery.rows.length} services:`);
    dataQuery.rows.forEach((service, index) => {
      console.log(`   ${index + 1}. ID: ${service.id}, Name: ${service.name || 'N/A'}`);
      console.log(`      Columns: ${Object.keys(service).join(', ')}`);
    });
    
  } catch (error) {
    console.error('❌ Error checking services table:', error);
  } finally {
    await pool.end();
  }
}

async function main() {
  console.log('🚀 Check Services Table Structure');
  console.log('================================\n');
  
  await checkServicesTable();
  
  console.log('\n🎯 Next Steps:');
  console.log('- Find the correct column name for service price');
  console.log('- Update the WhatsApp Bot to use the correct column names');
  console.log('- Test booking creation with correct data');
}

main().catch(console.error);
