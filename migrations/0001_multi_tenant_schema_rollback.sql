-- Rollback Multi-Tenant Database Schema Migration
-- This script reverts the database back to the single-tenant POC structure

-- ===== DISABLE ROW LEVEL SECURITY =====

ALTER TABLE IF EXISTS "services" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "conversations" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "messages" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "bookings" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "users" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "api_keys" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "subscriptions" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "usage_metrics" DISABLE ROW LEVEL SECURITY;

-- ===== DROP RLS POLICIES =====

DROP POLICY IF EXISTS "tenant_isolation_services" ON "services";
DROP POLICY IF EXISTS "tenant_isolation_conversations" ON "conversations";
DROP POLICY IF EXISTS "tenant_isolation_messages" ON "messages";
DROP POLICY IF EXISTS "tenant_isolation_bookings" ON "bookings";
DROP POLICY IF EXISTS "tenant_isolation_users" ON "users";
DROP POLICY IF EXISTS "tenant_isolation_api_keys" ON "api_keys";
DROP POLICY IF EXISTS "tenant_isolation_subscriptions" ON "subscriptions";
DROP POLICY IF EXISTS "tenant_isolation_usage_metrics" ON "usage_metrics";

-- ===== DROP TENANT CONTEXT FUNCTIONS =====

DROP FUNCTION IF EXISTS set_tenant_context(varchar);
DROP FUNCTION IF EXISTS get_tenant_context();
DROP FUNCTION IF EXISTS clear_tenant_context();

-- ===== DROP MULTI-TENANT TABLES =====

DROP TABLE IF EXISTS "messages";
DROP TABLE IF EXISTS "bookings";
DROP TABLE IF EXISTS "conversations";
DROP TABLE IF EXISTS "services";

-- ===== DROP TENANT MANAGEMENT TABLES =====

DROP TABLE IF EXISTS "usage_metrics";
DROP TABLE IF EXISTS "subscriptions";
DROP TABLE IF EXISTS "subscription_plans";
DROP TABLE IF EXISTS "api_keys";
DROP TABLE IF EXISTS "users";
DROP TABLE IF EXISTS "tenants";

-- ===== RESTORE ORIGINAL TABLES FROM BACKUP =====

-- Restore services table
CREATE TABLE "services" (
    "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" text NOT NULL,
    "description" text,
    "price" integer NOT NULL,
    "is_active" boolean NOT NULL DEFAULT true,
    "icon" text
);

-- Restore conversations table
CREATE TABLE "conversations" (
    "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    "phone_number" text NOT NULL,
    "customer_name" text,
    "current_state" text NOT NULL DEFAULT 'greeting',
    "selected_service" varchar REFERENCES "services"("id"),
    "selected_date" text,
    "selected_time" text,
    "created_at" timestamp NOT NULL DEFAULT NOW(),
    "updated_at" timestamp NOT NULL DEFAULT NOW()
);

-- Restore messages table
CREATE TABLE "messages" (
    "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    "conversation_id" varchar NOT NULL REFERENCES "conversations"("id"),
    "content" text NOT NULL,
    "is_from_bot" boolean NOT NULL,
    "timestamp" timestamp NOT NULL DEFAULT NOW()
);

-- Restore bookings table
CREATE TABLE "bookings" (
    "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    "conversation_id" varchar NOT NULL REFERENCES "conversations"("id"),
    "service_id" varchar NOT NULL REFERENCES "services"("id"),
    "phone_number" text NOT NULL,
    "customer_name" text,
    "amount" integer NOT NULL,
    "status" text NOT NULL DEFAULT 'pending',
    "payment_method" text,
    "appointment_date" timestamp,
    "appointment_time" text,
    "created_at" timestamp NOT NULL DEFAULT NOW(),
    "updated_at" timestamp NOT NULL DEFAULT NOW()
);

-- ===== RESTORE DATA FROM BACKUP TABLES =====

-- Restore data if backup tables exist
INSERT INTO "services" SELECT "id", "name", "description", "price", "is_active", "icon" 
FROM "services_backup" WHERE EXISTS (SELECT 1 FROM "services_backup");

INSERT INTO "conversations" SELECT "id", "phone_number", "customer_name", "current_state", 
"selected_service", "selected_date", "selected_time", "created_at", "updated_at"
FROM "conversations_backup" WHERE EXISTS (SELECT 1 FROM "conversations_backup");

INSERT INTO "messages" SELECT "id", "conversation_id", "content", "is_from_bot", "timestamp"
FROM "messages_backup" WHERE EXISTS (SELECT 1 FROM "messages_backup");

INSERT INTO "bookings" SELECT "id", "conversation_id", "service_id", "phone_number", 
"customer_name", "amount", "status", "payment_method", "appointment_date", 
"appointment_time", "created_at", "updated_at"
FROM "bookings_backup" WHERE EXISTS (SELECT 1 FROM "bookings_backup");

-- ===== CLEAN UP BACKUP TABLES =====

DROP TABLE IF EXISTS "services_backup";
DROP TABLE IF EXISTS "conversations_backup";
DROP TABLE IF EXISTS "messages_backup";
DROP TABLE IF EXISTS "bookings_backup";

-- ===== DROP INDEXES =====

DROP INDEX IF EXISTS "idx_services_tenant_id";
DROP INDEX IF EXISTS "idx_conversations_tenant_id";
DROP INDEX IF EXISTS "idx_messages_tenant_id";
DROP INDEX IF EXISTS "idx_bookings_tenant_id";
DROP INDEX IF EXISTS "idx_users_tenant_id";
DROP INDEX IF EXISTS "idx_api_keys_tenant_id";
DROP INDEX IF EXISTS "idx_subscriptions_tenant_id";
DROP INDEX IF EXISTS "idx_usage_metrics_tenant_id";
DROP INDEX IF EXISTS "idx_conversations_phone_number";
DROP INDEX IF EXISTS "idx_messages_conversation_id";
DROP INDEX IF EXISTS "idx_bookings_status";
DROP INDEX IF EXISTS "idx_bookings_appointment_date";
DROP INDEX IF EXISTS "idx_api_keys_key_hash";
DROP INDEX IF EXISTS "idx_usage_metrics_period";