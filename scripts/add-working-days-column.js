import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function addWorkingDaysColumn() {
  console.log('🔧 Adding working_days column to staff table...');
  
  try {
    // Check if column exists
    const checkResult = await pool.query(`
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'staff' AND column_name = 'working_days'
    `);
    
    if (checkResult.rows.length > 0) {
      console.log('✅ working_days column already exists');
      return;
    }
    
    // Add the column
    await pool.query(`
      ALTER TABLE staff ADD COLUMN working_days JSONB DEFAULT '[]'
    `);
    
    console.log('✅ Successfully added working_days column to staff table');
    
    // Add comment
    await pool.query(`
      COMMENT ON COLUMN staff.working_days IS 'Array of working days for the staff member (e.g., ["Mon", "Tue", "Wed", "Thu", "Fri"])'
    `);
    
    console.log('✅ Added comment to working_days column');
    
  } catch (error) {
    console.error('❌ Error adding working_days column:', error);
  } finally {
    await pool.end();
  }
}

addWorkingDaysColumn();
