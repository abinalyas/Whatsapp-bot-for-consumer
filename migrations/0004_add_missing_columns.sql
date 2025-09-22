-- Migration to add missing columns to production database
-- This addresses the "column does not exist" errors

-- Add missing columns to services table
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 60;

-- Add missing columns to bookings table  
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS customer_email TEXT;

-- Add missing columns to conversations table (if they don't exist)
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::jsonb;

-- Add missing columns to messages table (if they don't exist)
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS tenant_id VARCHAR REFERENCES tenants(id) ON DELETE CASCADE;

-- Update existing messages to have tenant_id from their conversation
UPDATE messages 
SET tenant_id = c.tenant_id 
FROM conversations c 
WHERE messages.conversation_id = c.id 
AND messages.tenant_id IS NULL;

-- Add missing columns to services table for enhanced business model
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS category VARCHAR(100),
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add missing columns to bookings table for enhanced business model
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS transaction_type VARCHAR(50) DEFAULT 'booking';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_services_tenant_id ON services(tenant_id);
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_bookings_tenant_id ON bookings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_conversations_tenant_id ON conversations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_messages_tenant_id ON messages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);

-- Add constraints to ensure data integrity
ALTER TABLE messages 
ADD CONSTRAINT IF NOT EXISTS messages_tenant_id_not_null 
CHECK (tenant_id IS NOT NULL);