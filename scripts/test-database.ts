#!/usr/bin/env tsx

/**
 * Test database connectivity and schema validation
 */

import { Pool } from '@neondatabase/serverless';

async function testDatabase() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('DATABASE_URL environment variable is required');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });

  try {
    console.log('🔄 Testing database connectivity...');
    
    // Test basic connection
    const result = await pool.query('SELECT NOW() as current_time');
    console.log('✅ Database connection successful');
    console.log(`📅 Current time: ${result.rows[0].current_time}`);
    
    // Test table existence
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📋 Available tables:');
    tables.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
    // Test tenant data
    const tenants = await pool.query('SELECT id, business_name, domain FROM tenants LIMIT 5');
    console.log('🏢 Tenants in database:');
    tenants.rows.forEach(tenant => {
      console.log(`   - ${tenant.business_name} (${tenant.domain})`);
    });
    
    // Test business types
    const businessTypes = await pool.query('SELECT name, display_name, category FROM business_types');
    console.log('🏭 Business types:');
    businessTypes.rows.forEach(type => {
      console.log(`   - ${type.display_name} (${type.category})`);
    });
    
    console.log('✅ Database test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the test
testDatabase().catch(console.error);
