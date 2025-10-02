/**
 * Fix Booking Constraints
 * Update the bookings table to reference offerings instead of services
 */

import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function fixBookingConstraints() {
  console.log('🔧 Fixing Booking Constraints');
  console.log('=============================\n');
  
  try {
    // First, check current constraint
    console.log('📋 Current constraint:');
    const currentConstraint = await pool.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'bookings' 
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name LIKE '%service%'
    `);
    
    console.log(`Current service constraint: ${currentConstraint.rows[0]?.constraint_name || 'NOT FOUND'}`);
    
    // Drop the existing foreign key constraint
    if (currentConstraint.rows.length > 0) {
      const constraintName = currentConstraint.rows[0].constraint_name;
      console.log(`\n🗑️ Dropping constraint: ${constraintName}`);
      
      await pool.query(`ALTER TABLE bookings DROP CONSTRAINT ${constraintName}`);
      console.log('✅ Constraint dropped successfully');
    }
    
    // Add new foreign key constraint to offerings table
    console.log('\n➕ Adding new constraint to offerings table...');
    await pool.query(`
      ALTER TABLE bookings 
      ADD CONSTRAINT bookings_service_id_offerings_id_fk 
      FOREIGN KEY (service_id) REFERENCES offerings(id)
    `);
    console.log('✅ New constraint added successfully');
    
    // Verify the new constraint
    console.log('\n🔍 Verifying new constraint:');
    const newConstraint = await pool.query(`
      SELECT 
        tc.constraint_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name='bookings'
        AND kcu.column_name = 'service_id'
    `);
    
    if (newConstraint.rows.length > 0) {
      const constraint = newConstraint.rows[0];
      console.log(`✅ New constraint: ${constraint.column_name} → ${constraint.foreign_table_name}.${constraint.foreign_column_name}`);
    }
    
  } catch (error) {
    console.error('❌ Error fixing constraints:', error);
    console.error('Error details:', error.message);
  } finally {
    await pool.end();
  }
}

async function main() {
  console.log('🚀 Fix Booking Constraints');
  console.log('=========================\n');
  
  await fixBookingConstraints();
  
  console.log('\n🎯 Expected Results:');
  console.log('- bookings.service_id should now reference offerings.id');
  console.log('- WhatsApp Bot should be able to create bookings with offerings IDs');
  console.log('- Complete booking flow should work end-to-end');
}

main().catch(console.error);
