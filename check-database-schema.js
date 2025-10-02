/**
 * Check Database Schema
 * Find the correct table names for appointments
 */

import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkDatabaseSchema() {
  console.log('🔍 Checking Database Schema');
  console.log('==========================\n');
  
  try {
    // List all tables
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    const tablesResult = await pool.query(tablesQuery);
    
    console.log('📊 Available tables:');
    tablesResult.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.table_name}`);
    });
    
    // Check for appointment-related tables
    const appointmentTables = tablesResult.rows.filter(row => 
      row.table_name.toLowerCase().includes('appointment') || 
      row.table_name.toLowerCase().includes('booking') ||
      row.table_name.toLowerCase().includes('transaction')
    );
    
    if (appointmentTables.length > 0) {
      console.log('\n📅 Appointment-related tables:');
      appointmentTables.forEach(table => {
        console.log(`   - ${table.table_name}`);
      });
      
      // Check the structure of the first appointment table
      const firstTable = appointmentTables[0];
      const structureQuery = `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position
      `;
      
      const structureResult = await pool.query(structureQuery, [firstTable.table_name]);
      
      console.log(`\n📋 Structure of ${firstTable.table_name}:`);
      structureResult.rows.forEach(column => {
        console.log(`   - ${column.column_name}: ${column.data_type} (${column.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });
      
      // Check for recent records
      const recentQuery = `
        SELECT * FROM ${firstTable.table_name}
        ORDER BY created_at DESC
        LIMIT 5
      `;
      
      try {
        const recentResult = await pool.query(recentQuery);
        console.log(`\n📊 Recent records in ${firstTable.table_name}:`);
        recentResult.rows.forEach((record, index) => {
          console.log(`   ${index + 1}. ID: ${record.id || 'N/A'}, Created: ${record.created_at || 'N/A'}`);
        });
      } catch (error) {
        console.log(`\n❌ Could not fetch recent records from ${firstTable.table_name}: ${error.message}`);
      }
    } else {
      console.log('\n❌ No appointment-related tables found');
    }
    
  } catch (error) {
    console.error('❌ Error checking database schema:', error);
  } finally {
    await pool.end();
  }
}

async function main() {
  console.log('🚀 Check Database Schema');
  console.log('========================\n');
  
  await checkDatabaseSchema();
  
  console.log('\n🎯 Next Steps:');
  console.log('- Find the correct table name for appointments');
  console.log('- Verify that WhatsApp Bot is creating records in the correct table');
  console.log('- Confirm integration with salon dashboard');
}

main().catch(console.error);
