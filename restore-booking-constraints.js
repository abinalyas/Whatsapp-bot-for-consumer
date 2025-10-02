/**
 * Restore Booking Constraints
 * Restore the bookings table to reference services instead of offerings
 */

import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function restoreBookingConstraints() {
  console.log('🔧 Restoring Booking Constraints');
  console.log('================================\n');
  
  try {
    // Check if there's already a constraint
    const currentConstraint = await pool.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'bookings' 
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name LIKE '%service%'
    `);
    
    if (currentConstraint.rows.length === 0) {
      console.log('➕ Adding constraint back to services table...');
      await pool.query(`
        ALTER TABLE bookings 
        ADD CONSTRAINT bookings_service_id_services_id_fk 
        FOREIGN KEY (service_id) REFERENCES services(id)
      `);
      console.log('✅ Constraint restored successfully');
    } else {
      console.log(`✅ Constraint already exists: ${currentConstraint.rows[0].constraint_name}`);
    }
    
    // Verify the constraint
    const verifyQuery = await pool.query(`
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
    
    if (verifyQuery.rows.length > 0) {
      const constraint = verifyQuery.rows[0];
      console.log(`✅ Current constraint: ${constraint.column_name} → ${constraint.foreign_table_name}.${constraint.foreign_column_name}`);
    }
    
  } catch (error) {
    console.error('❌ Error restoring constraints:', error);
    console.error('Error details:', error.message);
  } finally {
    await pool.end();
  }
}

async function main() {
  console.log('🚀 Restore Booking Constraints');
  console.log('=============================\n');
  
  await restoreBookingConstraints();
  
  console.log('\n🎯 Expected Results:');
  console.log('- bookings.service_id should reference services.id');
  console.log('- WhatsApp Bot should work with the services table');
  console.log('- Booking creation should work properly');
}

main().catch(console.error);
