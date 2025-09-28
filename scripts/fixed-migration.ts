#!/usr/bin/env tsx

/**
 * Fixed migration runner script
 * Creates basic tables for salon management without problematic indexes
 */

import { Pool } from '@neondatabase/serverless';

async function runMigration() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('DATABASE_URL environment variable is required');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });

  try {
    console.log('🔄 Running database migration...');
    
    // Create basic tables for salon management
    const migrationSql = `
-- Create tenants table
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_name VARCHAR(255) NOT NULL,
    domain VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'trial',
    subscription_plan VARCHAR(50) NOT NULL DEFAULT 'starter',
    whatsapp_phone_id VARCHAR(100),
    whatsapp_token TEXT,
    whatsapp_verify_token VARCHAR(100),
    bot_settings JSONB DEFAULT '{}'::jsonb,
    billing_settings JSONB DEFAULT '{}'::jsonb,
    business_type_id UUID,
    business_config JSONB DEFAULT '{}'::jsonb,
    terminology JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'admin',
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, email)
);

-- Create business types table
CREATE TABLE IF NOT EXISTS business_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    terminology JSONB NOT NULL DEFAULT '{}'::jsonb,
    default_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_system BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create offerings table (services)
CREATE TABLE IF NOT EXISTS offerings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    offering_type VARCHAR(50) NOT NULL DEFAULT 'service',
    category VARCHAR(100),
    subcategory VARCHAR(100),
    pricing_type VARCHAR(50) NOT NULL DEFAULT 'fixed',
    base_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    pricing_config JSONB DEFAULT '{}'::jsonb,
    is_schedulable BOOLEAN NOT NULL DEFAULT false,
    duration_minutes INTEGER,
    availability_config JSONB DEFAULT '{}'::jsonb,
    has_variants BOOLEAN NOT NULL DEFAULT false,
    variants JSONB DEFAULT '[]'::jsonb,
    custom_fields JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER NOT NULL DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    images JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create transactions table (bookings/appointments)
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL DEFAULT 'booking',
    transaction_number VARCHAR(50),
    customer_phone VARCHAR(20) NOT NULL,
    customer_name VARCHAR(200),
    customer_email VARCHAR(255),
    offering_id UUID REFERENCES offerings(id) ON DELETE SET NULL,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    timezone VARCHAR(50) DEFAULT 'UTC',
    amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    payment_status VARCHAR(50) DEFAULT 'pending',
    payment_method VARCHAR(50),
    payment_reference VARCHAR(200),
    current_state_id UUID,
    workflow_history JSONB DEFAULT '[]'::jsonb,
    custom_fields JSONB DEFAULT '{}'::jsonb,
    notes TEXT,
    internal_notes TEXT,
    tags TEXT[] DEFAULT '{}',
    priority VARCHAR(20) DEFAULT 'normal',
    source VARCHAR(50) DEFAULT 'whatsapp',
    conversation_id UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    phone_number VARCHAR(20) NOT NULL,
    customer_name VARCHAR(200),
    customer_email VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    last_message_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb,
    custom_fields JSONB DEFAULT '{}'::jsonb,
    bot_flow_execution_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    message_type VARCHAR(20) NOT NULL DEFAULT 'text',
    content TEXT NOT NULL,
    direction VARCHAR(10) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Insert default business types
INSERT INTO business_types (name, display_name, category, description, terminology, default_config, is_system) VALUES
('salon', 'Beauty Salon', 'service', 'Beauty salon with service bookings and staff scheduling',
 '{"offering": "Service", "transaction": "Booking", "customer": "Client", "plural_offering": "Services", "plural_transaction": "Bookings"}',
 '{"offering_types": ["service"], "transaction_types": ["booking"], "requires_scheduling": true, "default_duration": 60, "supports_staff": true}',
 true)
ON CONFLICT (name) DO NOTHING;

-- Create a default tenant for testing
INSERT INTO tenants (business_name, domain, email, business_type_id) VALUES
('Bella Salon', 'bella-salon', 'admin@bellasalon.com', (SELECT id FROM business_types WHERE name = 'salon'))
ON CONFLICT (domain) DO NOTHING;
`;

    // Execute the migration
    await pool.query(migrationSql);
    
    console.log('✅ Migration completed successfully!');
    console.log('📋 Applied changes:');
    console.log('   - Created tenants table for multi-tenant support');
    console.log('   - Created users table for tenant users and admins');
    console.log('   - Created business_types table with salon type');
    console.log('   - Created offerings table (services)');
    console.log('   - Created transactions table (bookings/appointments)');
    console.log('   - Created conversations and messages tables');
    console.log('   - Inserted default salon business type');
    console.log('   - Created default Bella Salon tenant');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the migration
runMigration().catch(console.error);
