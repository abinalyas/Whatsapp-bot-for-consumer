/**
 * Fix Staff Assignment
 * Add staff_id column to bookings table and populate it
 */

import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function fixStaffAssignment() {
  console.log('🔧 Fix Staff Assignment');
  console.log('======================\n');
  
  try {
    // Step 1: Add staff_id column to bookings table
    console.log('📊 Step 1: Adding staff_id column to bookings table');
    try {
      await pool.query(`
        ALTER TABLE bookings 
        ADD COLUMN IF NOT EXISTS staff_id VARCHAR(255)
      `);
      console.log('✅ staff_id column added successfully');
    } catch (error) {
      console.log('ℹ️ staff_id column might already exist:', error.message);
    }
    
    // Step 2: Get staff mapping
    console.log('\n📊 Step 2: Getting staff mapping');
    const staffResult = await pool.query(`
      SELECT id, name
      FROM staff 
      WHERE tenant_id = '85de5a0c-6aeb-479a-aa76-cbdd6b0845a7'
      ORDER BY name
    `);
    
    const staffMap = {};
    staffResult.rows.forEach(staff => {
      staffMap[staff.name] = staff.id;
    });
    
    console.log('Staff mapping:');
    Object.entries(staffMap).forEach(([name, id]) => {
      console.log(`   ${name} → ${id}`);
    });
    
    // Step 3: Update existing bookings with staff_id
    console.log('\n📊 Step 3: Updating existing bookings with staff_id');
    const bookingsResult = await pool.query(`
      SELECT id, notes
      FROM bookings 
      WHERE notes LIKE '%WhatsApp booking%'
        AND staff_id IS NULL
    `);
    
    console.log(`Found ${bookingsResult.rows.length} bookings to update`);
    
    for (const booking of bookingsResult.rows) {
      // Extract staff name from notes
      const notesMatch = booking.notes.match(/with (\w+ \w+)/);
      if (notesMatch) {
        const staffName = notesMatch[1];
        const staffId = staffMap[staffName];
        
        if (staffId) {
          await pool.query(`
            UPDATE bookings 
            SET staff_id = $1
            WHERE id = $2
          `, [staffId, booking.id]);
          
          console.log(`✅ Updated booking ${booking.id} with staff ${staffName} (${staffId})`);
        } else {
          console.log(`❌ Staff not found: ${staffName}`);
        }
      } else {
        console.log(`❌ Could not extract staff name from notes: ${booking.notes}`);
      }
    }
    
    // Step 4: Verify the updates
    console.log('\n📊 Step 4: Verifying updates');
    const verifyResult = await pool.query(`
      SELECT 
        b.id, b.customer_name, b.notes, b.staff_id,
        s.name as staff_name
      FROM bookings b
      LEFT JOIN staff s ON b.staff_id = s.id
      WHERE b.notes LIKE '%WhatsApp booking%'
      ORDER BY b.created_at DESC
      LIMIT 5
    `);
    
    console.log('Updated bookings:');
    verifyResult.rows.forEach((booking, index) => {
      console.log(`   ${index + 1}. ${booking.customer_name} - Staff: ${booking.staff_name || 'Not assigned'} (${booking.staff_id || 'No ID'})`);
    });
    
  } catch (error) {
    console.error('❌ Error fixing staff assignment:', error);
  } finally {
    await pool.end();
  }
}

async function main() {
  console.log('🚀 Fix Staff Assignment');
  console.log('======================\n');
  
  await fixStaffAssignment();
  
  console.log('\n🎯 Next Steps:');
  console.log('- Update WhatsApp Bot to set staff_id when creating bookings');
  console.log('- Fix salon dashboard query to use staff_id');
  console.log('- Fix time display issues');
}

main().catch(console.error);
