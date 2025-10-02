/**
 * Check Data Types
 * Check the actual data types in the database
 */

import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkDataTypes() {
  console.log('🔍 Check Data Types');
  console.log('==================\n');
  
  try {
    // Check staff table structure
    console.log('📊 Staff table structure:');
    const staffStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'staff' AND column_name = 'id'
    `);
    
    staffStructure.rows.forEach((col, index) => {
      console.log(`   ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Check bookings table structure
    console.log('\n📊 Bookings table structure:');
    const bookingsStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'bookings' AND column_name = 'staff_id'
    `);
    
    bookingsStructure.rows.forEach((col, index) => {
      console.log(`   ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Check transactions table structure
    console.log('\n📊 Transactions table structure:');
    const transactionsStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'transactions' AND column_name = 'staff_id'
    `);
    
    transactionsStructure.rows.forEach((col, index) => {
      console.log(`   ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Check sample data
    console.log('\n📊 Sample staff data:');
    const staffData = await pool.query(`
      SELECT id, name
      FROM staff 
      WHERE tenant_id = '85de5a0c-6aeb-479a-aa76-cbdd6b0845a7'
      LIMIT 3
    `);
    
    staffData.rows.forEach((staff, index) => {
      console.log(`   ${index + 1}. ID: ${staff.id} (type: ${typeof staff.id}), Name: ${staff.name}`);
    });
    
    // Check sample bookings data
    console.log('\n📊 Sample bookings data:');
    const bookingsData = await pool.query(`
      SELECT id, staff_id, customer_name
      FROM bookings 
      WHERE staff_id IS NOT NULL
      LIMIT 3
    `);
    
    bookingsData.rows.forEach((booking, index) => {
      console.log(`   ${index + 1}. ID: ${booking.id}, Staff ID: ${booking.staff_id} (type: ${typeof booking.staff_id}), Customer: ${booking.customer_name}`);
    });
    
    // Try different casting approaches
    console.log('\n📊 Testing different casting approaches:');
    
    // Test 1: Direct comparison
    try {
      const test1 = await pool.query(`
        SELECT b.id, b.staff_id, s.name as staff_name
        FROM bookings b
        LEFT JOIN staff s ON b.staff_id = s.id
        WHERE b.staff_id IS NOT NULL
        LIMIT 1
      `);
      console.log(`   ✅ Direct comparison: ${test1.rows.length} rows`);
    } catch (error) {
      console.log(`   ❌ Direct comparison failed: ${error.message}`);
    }
    
    // Test 2: Cast staff_id to UUID
    try {
      const test2 = await pool.query(`
        SELECT b.id, b.staff_id, s.name as staff_name
        FROM bookings b
        LEFT JOIN staff s ON b.staff_id::uuid = s.id
        WHERE b.staff_id IS NOT NULL
        LIMIT 1
      `);
      console.log(`   ✅ Cast staff_id to UUID: ${test2.rows.length} rows`);
    } catch (error) {
      console.log(`   ❌ Cast staff_id to UUID failed: ${error.message}`);
    }
    
    // Test 3: Cast staff.id to VARCHAR
    try {
      const test3 = await pool.query(`
        SELECT b.id, b.staff_id, s.name as staff_name
        FROM bookings b
        LEFT JOIN staff s ON b.staff_id = s.id::varchar
        WHERE b.staff_id IS NOT NULL
        LIMIT 1
      `);
      console.log(`   ✅ Cast staff.id to VARCHAR: ${test3.rows.length} rows`);
    } catch (error) {
      console.log(`   ❌ Cast staff.id to VARCHAR failed: ${error.message}`);
    }
    
  } catch (error) {
    console.error('❌ Error checking data types:', error);
  } finally {
    await pool.end();
  }
}

async function main() {
  console.log('🚀 Check Data Types');
  console.log('==================\n');
  
  await checkDataTypes();
  
  console.log('\n🎯 Next Steps:');
  console.log('- Use the correct casting approach');
  console.log('- Fix the salon dashboard query');
}

main().catch(console.error);
