/**
 * Check Booking Constraints
 * Check the foreign key constraints for the bookings table
 */

import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkBookingConstraints() {
  console.log('🔍 Checking Booking Constraints');
  console.log('===============================\n');
  
  try {
    // Check foreign key constraints for bookings table
    const constraintsQuery = await pool.query(`
      SELECT 
        tc.constraint_name, 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name='bookings';
    `);
    
    console.log('📋 Foreign key constraints for bookings table:');
    constraintsQuery.rows.forEach(constraint => {
      console.log(`   - ${constraint.column_name} → ${constraint.foreign_table_name}.${constraint.foreign_column_name}`);
    });
    
    // Check if bookings table references services or offerings
    const serviceConstraint = constraintsQuery.rows.find(c => c.column_name === 'service_id');
    if (serviceConstraint) {
      console.log(`\n🎯 Service ID constraint: ${serviceConstraint.foreign_table_name}`);
      
      if (serviceConstraint.foreign_table_name === 'services') {
        console.log('❌ PROBLEM: bookings.service_id references services table');
        console.log('❌ But WhatsApp Bot is now using offerings table');
        console.log('🔧 SOLUTION: Update bookings table to reference offerings table');
      } else if (serviceConstraint.foreign_table_name === 'offerings') {
        console.log('✅ OK: bookings.service_id already references offerings table');
      }
    }
    
    // Check what tables exist
    const tablesQuery = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('\n📋 Available tables:');
    tablesQuery.rows.forEach(table => {
      console.log(`   - ${table.table_name}`);
    });
    
  } catch (error) {
    console.error('❌ Error checking constraints:', error);
  } finally {
    await pool.end();
  }
}

async function main() {
  console.log('🚀 Check Booking Constraints');
  console.log('===========================\n');
  
  await checkBookingConstraints();
  
  console.log('\n🎯 Next Steps:');
  console.log('- If bookings references services table, we need to update it');
  console.log('- Or create a mapping between offerings and services');
  console.log('- Or update the database schema to use offerings consistently');
}

main().catch(console.error);
