-- Migration: Add working_days column to staff table
-- This migration adds the working_days column that is referenced in the code but missing from the schema

-- Add working_days column to staff table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'staff' AND column_name = 'working_days') THEN
        ALTER TABLE staff ADD COLUMN working_days JSONB DEFAULT '[]';
    END IF;
END $$;

-- Add comment to the column
COMMENT ON COLUMN staff.working_days IS 'Array of working days for the staff member (e.g., ["Mon", "Tue", "Wed", "Thu", "Fri"])';
