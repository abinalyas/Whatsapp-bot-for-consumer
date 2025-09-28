#!/usr/bin/env tsx

/**
 * Staff management migration script
 * Adds staff and availability tables for salon management
 */

import { Pool } from '@neondatabase/serverless';

async function runStaffMigration() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('DATABASE_URL environment variable is required');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });

  try {
    console.log('🔄 Running staff management migration...');
    
    // Create staff management tables
    const migrationSql = `
-- Create staff table
CREATE TABLE IF NOT EXISTS staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    role VARCHAR(50) NOT NULL DEFAULT 'stylist', -- 'stylist', 'manager', 'receptionist', 'assistant'
    specializations JSONB DEFAULT '[]'::jsonb, -- Array of service categories they can perform
    working_hours JSONB DEFAULT '{}'::jsonb, -- Default working hours per day
    hourly_rate DECIMAL(10,2),
    commission_rate DECIMAL(5,2), -- Commission percentage
    is_active BOOLEAN NOT NULL DEFAULT true,
    hire_date DATE,
    notes TEXT,
    avatar_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create staff availability table
CREATE TABLE IF NOT EXISTS staff_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL, -- 0=Sunday, 1=Monday, etc.
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN NOT NULL DEFAULT true,
    break_start_time TIME,
    break_end_time TIME,
    max_appointments INTEGER DEFAULT 1, -- Max concurrent appointments
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create staff time off table
CREATE TABLE IF NOT EXISTS staff_time_off (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason VARCHAR(100), -- 'vacation', 'sick', 'personal', 'training'
    notes TEXT,
    is_approved BOOLEAN DEFAULT false,
    approved_by UUID REFERENCES staff(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create staff skills table
CREATE TABLE IF NOT EXISTS staff_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    skill_name VARCHAR(100) NOT NULL,
    skill_level VARCHAR(20) NOT NULL DEFAULT 'intermediate', -- 'beginner', 'intermediate', 'advanced', 'expert'
    years_experience INTEGER DEFAULT 0,
    certification_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add staff reference to transactions table
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS staff_id UUID REFERENCES staff(id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_staff_tenant ON staff(tenant_id);
CREATE INDEX IF NOT EXISTS idx_staff_active ON staff(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_staff_role ON staff(tenant_id, role);
CREATE INDEX IF NOT EXISTS idx_staff_availability_staff ON staff_availability(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_availability_day ON staff_availability(staff_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_staff_time_off_staff ON staff_time_off(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_time_off_dates ON staff_time_off(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_staff_skills_staff ON staff_skills(staff_id);
CREATE INDEX IF NOT EXISTS idx_transactions_staff ON transactions(staff_id);

-- Insert default staff for Bella Salon
INSERT INTO staff (tenant_id, name, email, phone, role, specializations, working_hours, hourly_rate, is_active, hire_date) VALUES
((SELECT id FROM tenants WHERE domain = 'bella-salon'), 'Emma Wilson', 'emma@bellasalon.com', '+1-555-0101', 'stylist', 
 '["Hair", "Color", "Styling"]'::jsonb, 
 '{"monday": {"start": "09:00", "end": "17:00"}, "tuesday": {"start": "09:00", "end": "17:00"}, "wednesday": {"start": "09:00", "end": "17:00"}, "thursday": {"start": "09:00", "end": "17:00"}, "friday": {"start": "09:00", "end": "17:00"}}'::jsonb,
 25.00, true, '2023-01-15'),

((SELECT id FROM tenants WHERE domain = 'bella-salon'), 'David Chen', 'david@bellasalon.com', '+1-555-0102', 'stylist',
 '["Hair", "Beard", "Styling"]'::jsonb,
 '{"monday": {"start": "10:00", "end": "18:00"}, "tuesday": {"start": "10:00", "end": "18:00"}, "wednesday": {"start": "10:00", "end": "18:00"}, "thursday": {"start": "10:00", "end": "18:00"}, "friday": {"start": "10:00", "end": "18:00"}}'::jsonb,
 22.00, true, '2023-03-01'),

((SELECT id FROM tenants WHERE domain = 'bella-salon'), 'Anna Rodriguez', 'anna@bellasalon.com', '+1-555-0103', 'stylist',
 '["Nails", "Manicure", "Pedicure"]'::jsonb,
 '{"monday": {"start": "08:00", "end": "16:00"}, "tuesday": {"start": "08:00", "end": "16:00"}, "wednesday": {"start": "08:00", "end": "16:00"}, "thursday": {"start": "08:00", "end": "16:00"}, "friday": {"start": "08:00", "end": "16:00"}}'::jsonb,
 20.00, true, '2023-02-10'),

((SELECT id FROM tenants WHERE domain = 'bella-salon'), 'Sofia Martinez', 'sofia@bellasalon.com', '+1-555-0104', 'stylist',
 '["Skincare", "Facial", "Massage"]'::jsonb,
 '{"monday": {"start": "09:00", "end": "17:00"}, "tuesday": {"start": "09:00", "end": "17:00"}, "wednesday": {"start": "09:00", "end": "17:00"}, "thursday": {"start": "09:00", "end": "17:00"}, "friday": {"start": "09:00", "end": "17:00"}}'::jsonb,
 28.00, true, '2023-01-20'),

((SELECT id FROM tenants WHERE domain = 'bella-salon'), 'Alex Manager', 'alex@bellasalon.com', '+1-555-0105', 'manager',
 '["Management", "Customer Service"]'::jsonb,
 '{"monday": {"start": "08:00", "end": "18:00"}, "tuesday": {"start": "08:00", "end": "18:00"}, "wednesday": {"start": "08:00", "end": "18:00"}, "thursday": {"start": "08:00", "end": "18:00"}, "friday": {"start": "08:00", "end": "18:00"}}'::jsonb,
 35.00, true, '2022-11-01')
ON CONFLICT DO NOTHING;

-- Create default availability for staff
INSERT INTO staff_availability (staff_id, day_of_week, start_time, end_time, is_available, max_appointments)
SELECT 
    s.id,
    d.day_of_week,
    CASE d.day_of_week
        WHEN 1 THEN '09:00'::time  -- Monday
        WHEN 2 THEN '09:00'::time  -- Tuesday
        WHEN 3 THEN '09:00'::time  -- Wednesday
        WHEN 4 THEN '09:00'::time  -- Thursday
        WHEN 5 THEN '09:00'::time  -- Friday
        ELSE '10:00'::time
    END,
    CASE d.day_of_week
        WHEN 1 THEN '17:00'::time  -- Monday
        WHEN 2 THEN '17:00'::time  -- Tuesday
        WHEN 3 THEN '17:00'::time  -- Wednesday
        WHEN 4 THEN '17:00'::time  -- Thursday
        WHEN 5 THEN '17:00'::time  -- Friday
        ELSE '16:00'::time
    END,
    true,
    1
FROM staff s
CROSS JOIN (SELECT unnest(ARRAY[1,2,3,4,5]) as day_of_week) d
WHERE s.tenant_id = (SELECT id FROM tenants WHERE domain = 'bella-salon')
ON CONFLICT DO NOTHING;
`;

    // Execute the migration
    await pool.query(migrationSql);
    
    console.log('✅ Staff management migration completed successfully!');
    console.log('📋 Applied changes:');
    console.log('   - Created staff table with roles and specializations');
    console.log('   - Created staff_availability table for scheduling');
    console.log('   - Created staff_time_off table for vacation management');
    console.log('   - Created staff_skills table for skill tracking');
    console.log('   - Added staff_id to transactions table');
    console.log('   - Created performance indexes');
    console.log('   - Inserted default staff members for Bella Salon');
    console.log('   - Created default availability schedules');
    
  } catch (error) {
    console.error('❌ Staff migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the migration
runStaffMigration().catch(console.error);
