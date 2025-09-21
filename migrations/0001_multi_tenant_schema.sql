-- Multi-Tenant Database Schema Migration
-- This migration transforms the single-tenant POC into a multi-tenant SaaS platform

-- ===== CREATE TENANT MANAGEMENT TABLES =====

-- Tenants table (master tenant registry)
CREATE TABLE IF NOT EXISTS "tenants" (
    "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    "business_name" varchar(255) NOT NULL,
    "domain" varchar(100) NOT NULL UNIQUE,
    "email" varchar(255) NOT NULL,
    "phone" varchar(50),
    "status" varchar(20) NOT NULL DEFAULT 'trial',
    "subscription_plan" varchar(50) NOT NULL DEFAULT 'starter',
    "whatsapp_phone_id" varchar(100),
    "whatsapp_token" text,
    "whatsapp_verify_token" varchar(100),
    "bot_settings" jsonb DEFAULT '{}'::jsonb,
    "billing_settings" jsonb DEFAULT '{}'::jsonb,
    "created_at" timestamp NOT NULL DEFAULT NOW(),
    "updated_at" timestamp NOT NULL DEFAULT NOW()
);

-- Users table (tenant users and admins)
CREATE TABLE IF NOT EXISTS "users" (
    "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenant_id" varchar NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
    "email" varchar(255) NOT NULL,
    "password_hash" varchar(255) NOT NULL,
    "role" varchar(50) NOT NULL DEFAULT 'admin',
    "first_name" varchar(100),
    "last_name" varchar(100),
    "is_active" boolean NOT NULL DEFAULT true,
    "last_login" timestamp,
    "created_at" timestamp NOT NULL DEFAULT NOW(),
    "updated_at" timestamp NOT NULL DEFAULT NOW(),
    UNIQUE("tenant_id", "email")
);

-- API Keys table
CREATE TABLE IF NOT EXISTS "api_keys" (
    "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenant_id" varchar NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
    "key_hash" varchar(255) NOT NULL UNIQUE,
    "name" varchar(100) NOT NULL,
    "permissions" jsonb NOT NULL DEFAULT '[]'::jsonb,
    "last_used" timestamp,
    "expires_at" timestamp,
    "is_active" boolean NOT NULL DEFAULT true,
    "created_at" timestamp NOT NULL DEFAULT NOW()
);

-- Subscription Plans table
CREATE TABLE IF NOT EXISTS "subscription_plans" (
    "id" varchar PRIMARY KEY,
    "name" varchar(100) NOT NULL,
    "description" text,
    "price_monthly" integer NOT NULL,
    "price_yearly" integer,
    "features" jsonb NOT NULL DEFAULT '{}'::jsonb,
    "limits" jsonb NOT NULL DEFAULT '{}'::jsonb,
    "is_active" boolean NOT NULL DEFAULT true,
    "created_at" timestamp NOT NULL DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS "subscriptions" (
    "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenant_id" varchar NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
    "plan_id" varchar NOT NULL REFERENCES "subscription_plans"("id"),
    "status" varchar(20) NOT NULL DEFAULT 'active',
    "billing_cycle" varchar(20) NOT NULL DEFAULT 'monthly',
    "current_period_start" timestamp NOT NULL,
    "current_period_end" timestamp NOT NULL,
    "stripe_subscription_id" varchar(100),
    "created_at" timestamp NOT NULL DEFAULT NOW(),
    "updated_at" timestamp NOT NULL DEFAULT NOW()
);

-- Usage Metrics table
CREATE TABLE IF NOT EXISTS "usage_metrics" (
    "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenant_id" varchar NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
    "metric_name" varchar(100) NOT NULL,
    "metric_value" integer NOT NULL DEFAULT 0,
    "period_start" timestamp NOT NULL,
    "period_end" timestamp NOT NULL,
    "created_at" timestamp NOT NULL DEFAULT NOW(),
    UNIQUE("tenant_id", "metric_name", "period_start")
);

-- ===== BACKUP EXISTING TABLES =====

-- Create backup tables for existing data
CREATE TABLE IF NOT EXISTS "services_backup" AS SELECT * FROM "services";
CREATE TABLE IF NOT EXISTS "conversations_backup" AS SELECT * FROM "conversations";
CREATE TABLE IF NOT EXISTS "messages_backup" AS SELECT * FROM "messages";
CREATE TABLE IF NOT EXISTS "bookings_backup" AS SELECT * FROM "bookings";

-- ===== DROP EXISTING TABLES =====

DROP TABLE IF EXISTS "messages";
DROP TABLE IF EXISTS "bookings";
DROP TABLE IF EXISTS "conversations";
DROP TABLE IF EXISTS "services";

-- ===== RECREATE TABLES WITH TENANT ISOLATION =====

-- Enhanced services table with tenant isolation
CREATE TABLE "services" (
    "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenant_id" varchar NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
    "name" text NOT NULL,
    "description" text,
    "price" integer NOT NULL,
    "duration_minutes" integer DEFAULT 60,
    "is_active" boolean NOT NULL DEFAULT true,
    "icon" text,
    "category" varchar(100),
    "metadata" jsonb DEFAULT '{}'::jsonb,
    "created_at" timestamp NOT NULL DEFAULT NOW(),
    "updated_at" timestamp NOT NULL DEFAULT NOW()
);

-- Enhanced conversations table
CREATE TABLE "conversations" (
    "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenant_id" varchar NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
    "phone_number" text NOT NULL,
    "customer_name" text,
    "current_state" text NOT NULL DEFAULT 'greeting',
    "selected_service" varchar REFERENCES "services"("id"),
    "selected_date" text,
    "selected_time" text,
    "context_data" jsonb DEFAULT '{}'::jsonb,
    "created_at" timestamp NOT NULL DEFAULT NOW(),
    "updated_at" timestamp NOT NULL DEFAULT NOW(),
    UNIQUE("tenant_id", "phone_number")
);

-- Enhanced messages table
CREATE TABLE "messages" (
    "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenant_id" varchar NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
    "conversation_id" varchar NOT NULL REFERENCES "conversations"("id") ON DELETE CASCADE,
    "content" text NOT NULL,
    "message_type" varchar(50) NOT NULL DEFAULT 'text',
    "is_from_bot" boolean NOT NULL,
    "metadata" jsonb DEFAULT '{}'::jsonb,
    "timestamp" timestamp NOT NULL DEFAULT NOW()
);

-- Enhanced bookings table
CREATE TABLE "bookings" (
    "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenant_id" varchar NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
    "conversation_id" varchar NOT NULL REFERENCES "conversations"("id"),
    "service_id" varchar NOT NULL REFERENCES "services"("id"),
    "phone_number" text NOT NULL,
    "customer_name" text,
    "customer_email" text,
    "amount" integer NOT NULL,
    "status" varchar(20) NOT NULL DEFAULT 'pending',
    "payment_method" varchar(50),
    "payment_reference" text,
    "appointment_date" timestamp,
    "appointment_time" text,
    "notes" text,
    "metadata" jsonb DEFAULT '{}'::jsonb,
    "created_at" timestamp NOT NULL DEFAULT NOW(),
    "updated_at" timestamp NOT NULL DEFAULT NOW()
);

-- ===== CREATE INDEXES FOR PERFORMANCE =====

-- Tenant isolation indexes
CREATE INDEX IF NOT EXISTS "idx_services_tenant_id" ON "services"("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_conversations_tenant_id" ON "conversations"("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_messages_tenant_id" ON "messages"("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_bookings_tenant_id" ON "bookings"("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_users_tenant_id" ON "users"("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_api_keys_tenant_id" ON "api_keys"("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_subscriptions_tenant_id" ON "subscriptions"("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_usage_metrics_tenant_id" ON "usage_metrics"("tenant_id");

-- Performance indexes
CREATE INDEX IF NOT EXISTS "idx_conversations_phone_number" ON "conversations"("phone_number");
CREATE INDEX IF NOT EXISTS "idx_messages_conversation_id" ON "messages"("conversation_id");
CREATE INDEX IF NOT EXISTS "idx_bookings_status" ON "bookings"("status");
CREATE INDEX IF NOT EXISTS "idx_bookings_appointment_date" ON "bookings"("appointment_date");
CREATE INDEX IF NOT EXISTS "idx_api_keys_key_hash" ON "api_keys"("key_hash");
CREATE INDEX IF NOT EXISTS "idx_usage_metrics_period" ON "usage_metrics"("period_start", "period_end");

-- ===== INSERT DEFAULT SUBSCRIPTION PLANS =====

INSERT INTO "subscription_plans" ("id", "name", "description", "price_monthly", "price_yearly", "features", "limits") VALUES
('starter', 'Starter', 'Perfect for small businesses getting started', 2900, 29000, 
 '{"whatsapp_integration": true, "basic_analytics": true, "email_support": true}'::jsonb,
 '{"messages_per_month": 1000, "bookings_per_month": 100, "api_calls_per_day": 1000}'::jsonb),
('professional', 'Professional', 'For growing businesses with advanced needs', 9900, 99000,
 '{"whatsapp_integration": true, "advanced_analytics": true, "priority_support": true, "custom_branding": true, "webhooks": true}'::jsonb,
 '{"messages_per_month": 10000, "bookings_per_month": 1000, "api_calls_per_day": 10000}'::jsonb),
('enterprise', 'Enterprise', 'For large organizations with custom requirements', 29900, 299000,
 '{"whatsapp_integration": true, "advanced_analytics": true, "dedicated_support": true, "custom_branding": true, "webhooks": true, "sso": true, "custom_integrations": true}'::jsonb,
 '{"messages_per_month": -1, "bookings_per_month": -1, "api_calls_per_day": -1}'::jsonb);

-- ===== ENABLE ROW LEVEL SECURITY =====

-- Enable RLS on all tenant-scoped tables
ALTER TABLE "services" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "conversations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "messages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bookings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "api_keys" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "subscriptions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "usage_metrics" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tenant isolation
-- Note: These policies will be activated when the application sets the tenant context

-- Services policies
CREATE POLICY "tenant_isolation_services" ON "services"
    FOR ALL TO authenticated
    USING ("tenant_id" = current_setting('app.current_tenant_id', true));

-- Conversations policies
CREATE POLICY "tenant_isolation_conversations" ON "conversations"
    FOR ALL TO authenticated
    USING ("tenant_id" = current_setting('app.current_tenant_id', true));

-- Messages policies
CREATE POLICY "tenant_isolation_messages" ON "messages"
    FOR ALL TO authenticated
    USING ("tenant_id" = current_setting('app.current_tenant_id', true));

-- Bookings policies
CREATE POLICY "tenant_isolation_bookings" ON "bookings"
    FOR ALL TO authenticated
    USING ("tenant_id" = current_setting('app.current_tenant_id', true));

-- Users policies
CREATE POLICY "tenant_isolation_users" ON "users"
    FOR ALL TO authenticated
    USING ("tenant_id" = current_setting('app.current_tenant_id', true));

-- API Keys policies
CREATE POLICY "tenant_isolation_api_keys" ON "api_keys"
    FOR ALL TO authenticated
    USING ("tenant_id" = current_setting('app.current_tenant_id', true));

-- Subscriptions policies
CREATE POLICY "tenant_isolation_subscriptions" ON "subscriptions"
    FOR ALL TO authenticated
    USING ("tenant_id" = current_setting('app.current_tenant_id', true));

-- Usage Metrics policies
CREATE POLICY "tenant_isolation_usage_metrics" ON "usage_metrics"
    FOR ALL TO authenticated
    USING ("tenant_id" = current_setting('app.current_tenant_id', true));

-- ===== CREATE TENANT CONTEXT FUNCTIONS =====

-- Function to set tenant context for the current session
CREATE OR REPLACE FUNCTION set_tenant_context(tenant_uuid varchar)
RETURNS void AS $$
BEGIN
    PERFORM set_config('app.current_tenant_id', tenant_uuid, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current tenant context
CREATE OR REPLACE FUNCTION get_tenant_context()
RETURNS varchar AS $$
BEGIN
    RETURN current_setting('app.current_tenant_id', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clear tenant context
CREATE OR REPLACE FUNCTION clear_tenant_context()
RETURNS void AS $$
BEGIN
    PERFORM set_config('app.current_tenant_id', '', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;