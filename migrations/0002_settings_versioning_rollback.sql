-- Rollback Settings Versioning Migration
-- Removes settings versioning tables and functions

-- ===== DROP TRIGGERS =====

DROP TRIGGER IF EXISTS trigger_tenant_settings_change ON tenants;
DROP FUNCTION IF EXISTS trigger_log_tenant_settings_change();

-- ===== DROP FUNCTIONS =====

DROP FUNCTION IF EXISTS create_settings_version(varchar, jsonb, varchar, text);
DROP FUNCTION IF EXISTS rollback_settings_version(varchar, integer, varchar, text);
DROP FUNCTION IF EXISTS log_settings_change(varchar, varchar, varchar, varchar, jsonb, jsonb, text, inet, text);
DROP FUNCTION IF EXISTS cleanup_old_settings_versions(varchar, integer);

-- ===== DROP RLS POLICIES =====

DROP POLICY IF EXISTS "tenant_isolation_settings_versions" ON "settings_versions";
DROP POLICY IF EXISTS "tenant_isolation_whatsapp_credentials" ON "whatsapp_credentials";
DROP POLICY IF EXISTS "tenant_isolation_settings_change_log" ON "settings_change_log";

-- ===== DISABLE ROW LEVEL SECURITY =====

ALTER TABLE IF EXISTS "settings_versions" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "whatsapp_credentials" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "settings_change_log" DISABLE ROW LEVEL SECURITY;

-- ===== DROP INDEXES =====

DROP INDEX IF EXISTS "idx_settings_versions_tenant_id";
DROP INDEX IF EXISTS "idx_settings_versions_created_at";
DROP INDEX IF EXISTS "idx_settings_versions_active";
DROP INDEX IF EXISTS "idx_whatsapp_credentials_tenant_id";
DROP INDEX IF EXISTS "idx_whatsapp_credentials_phone_id";
DROP INDEX IF EXISTS "idx_whatsapp_credentials_verified";
DROP INDEX IF EXISTS "idx_settings_change_log_tenant_id";
DROP INDEX IF EXISTS "idx_settings_change_log_created_at";
DROP INDEX IF EXISTS "idx_settings_change_log_changed_by";
DROP INDEX IF EXISTS "idx_settings_change_log_change_type";

-- ===== DROP TABLES =====

DROP TABLE IF EXISTS "settings_change_log";
DROP TABLE IF EXISTS "settings_versions";
DROP TABLE IF EXISTS "whatsapp_credentials";