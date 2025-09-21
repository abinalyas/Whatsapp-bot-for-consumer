-- Settings Versioning Migration
-- Adds support for bot settings versioning and rollback capabilities

-- ===== CREATE SETTINGS VERSIONING TABLE =====

CREATE TABLE IF NOT EXISTS "settings_versions" (
    "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenant_id" varchar NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
    "version" integer NOT NULL,
    "settings" jsonb NOT NULL,
    "created_by" varchar NOT NULL,
    "created_at" timestamp NOT NULL DEFAULT NOW(),
    "is_active" boolean NOT NULL DEFAULT false,
    "change_summary" text,
    "rollback_reason" text,
    UNIQUE("tenant_id", "version")
);

-- ===== CREATE WHATSAPP CREDENTIALS TABLE =====

CREATE TABLE IF NOT EXISTS "whatsapp_credentials" (
    "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenant_id" varchar NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE UNIQUE,
    "phone_number_id" varchar NOT NULL,
    "access_token_encrypted" text NOT NULL,
    "verify_token" varchar(255) NOT NULL,
    "business_account_id" varchar(255),
    "app_id" varchar(255),
    "app_secret_encrypted" text,
    "webhook_url" text,
    "is_verified" boolean NOT NULL DEFAULT false,
    "last_verified" timestamp,
    "verification_errors" jsonb,
    "created_at" timestamp NOT NULL DEFAULT NOW(),
    "updated_at" timestamp NOT NULL DEFAULT NOW()
);

-- ===== CREATE SETTINGS CHANGE LOG TABLE =====

CREATE TABLE IF NOT EXISTS "settings_change_log" (
    "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenant_id" varchar NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
    "changed_by" varchar NOT NULL,
    "change_type" varchar(50) NOT NULL, -- 'update', 'reset', 'rollback'
    "field_path" varchar(255), -- JSON path of changed field
    "old_value" jsonb,
    "new_value" jsonb,
    "change_reason" text,
    "ip_address" inet,
    "user_agent" text,
    "created_at" timestamp NOT NULL DEFAULT NOW()
);

-- ===== CREATE INDEXES =====

-- Settings versions indexes
CREATE INDEX IF NOT EXISTS "idx_settings_versions_tenant_id" ON "settings_versions"("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_settings_versions_created_at" ON "settings_versions"("created_at");
CREATE INDEX IF NOT EXISTS "idx_settings_versions_active" ON "settings_versions"("tenant_id", "is_active") WHERE "is_active" = true;

-- WhatsApp credentials indexes
CREATE INDEX IF NOT EXISTS "idx_whatsapp_credentials_tenant_id" ON "whatsapp_credentials"("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_whatsapp_credentials_phone_id" ON "whatsapp_credentials"("phone_number_id");
CREATE INDEX IF NOT EXISTS "idx_whatsapp_credentials_verified" ON "whatsapp_credentials"("is_verified");

-- Settings change log indexes
CREATE INDEX IF NOT EXISTS "idx_settings_change_log_tenant_id" ON "settings_change_log"("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_settings_change_log_created_at" ON "settings_change_log"("created_at");
CREATE INDEX IF NOT EXISTS "idx_settings_change_log_changed_by" ON "settings_change_log"("changed_by");
CREATE INDEX IF NOT EXISTS "idx_settings_change_log_change_type" ON "settings_change_log"("change_type");

-- ===== ENABLE ROW LEVEL SECURITY =====

ALTER TABLE "settings_versions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "whatsapp_credentials" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "settings_change_log" ENABLE ROW LEVEL SECURITY;

-- ===== CREATE RLS POLICIES =====

-- Settings versions policies
CREATE POLICY "tenant_isolation_settings_versions" ON "settings_versions"
    FOR ALL TO authenticated
    USING ("tenant_id" = current_setting('app.current_tenant_id', true));

-- WhatsApp credentials policies
CREATE POLICY "tenant_isolation_whatsapp_credentials" ON "whatsapp_credentials"
    FOR ALL TO authenticated
    USING ("tenant_id" = current_setting('app.current_tenant_id', true));

-- Settings change log policies
CREATE POLICY "tenant_isolation_settings_change_log" ON "settings_change_log"
    FOR ALL TO authenticated
    USING ("tenant_id" = current_setting('app.current_tenant_id', true));

-- ===== CREATE SETTINGS VERSIONING FUNCTIONS =====

-- Function to create a new settings version
CREATE OR REPLACE FUNCTION create_settings_version(
    p_tenant_id varchar,
    p_settings jsonb,
    p_created_by varchar,
    p_change_summary text DEFAULT NULL
)
RETURNS varchar AS $$
DECLARE
    v_version integer;
    v_version_id varchar;
BEGIN
    -- Get next version number
    SELECT COALESCE(MAX(version), 0) + 1 
    INTO v_version
    FROM settings_versions 
    WHERE tenant_id = p_tenant_id;
    
    -- Deactivate current active version
    UPDATE settings_versions 
    SET is_active = false 
    WHERE tenant_id = p_tenant_id AND is_active = true;
    
    -- Create new version
    INSERT INTO settings_versions (
        tenant_id, 
        version, 
        settings, 
        created_by, 
        is_active,
        change_summary
    ) VALUES (
        p_tenant_id, 
        v_version, 
        p_settings, 
        p_created_by, 
        true,
        p_change_summary
    ) RETURNING id INTO v_version_id;
    
    RETURN v_version_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to rollback to a specific version
CREATE OR REPLACE FUNCTION rollback_settings_version(
    p_tenant_id varchar,
    p_version integer,
    p_rolled_back_by varchar,
    p_rollback_reason text DEFAULT NULL
)
RETURNS boolean AS $$
DECLARE
    v_settings jsonb;
    v_version_exists boolean;
BEGIN
    -- Check if version exists
    SELECT EXISTS(
        SELECT 1 FROM settings_versions 
        WHERE tenant_id = p_tenant_id AND version = p_version
    ) INTO v_version_exists;
    
    IF NOT v_version_exists THEN
        RETURN false;
    END IF;
    
    -- Get settings from specified version
    SELECT settings INTO v_settings
    FROM settings_versions 
    WHERE tenant_id = p_tenant_id AND version = p_version;
    
    -- Update tenant settings
    UPDATE tenants 
    SET 
        bot_settings = v_settings,
        updated_at = NOW()
    WHERE id = p_tenant_id;
    
    -- Create new version record for the rollback
    PERFORM create_settings_version(
        p_tenant_id,
        v_settings,
        p_rolled_back_by,
        'Rolled back to version ' || p_version || 
        CASE WHEN p_rollback_reason IS NOT NULL 
             THEN ': ' || p_rollback_reason 
             ELSE '' 
        END
    );
    
    -- Log the rollback
    INSERT INTO settings_change_log (
        tenant_id,
        changed_by,
        change_type,
        field_path,
        new_value,
        change_reason
    ) VALUES (
        p_tenant_id,
        p_rolled_back_by,
        'rollback',
        'bot_settings',
        v_settings,
        'Rolled back to version ' || p_version ||
        CASE WHEN p_rollback_reason IS NOT NULL 
             THEN ': ' || p_rollback_reason 
             ELSE '' 
        END
    );
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log settings changes
CREATE OR REPLACE FUNCTION log_settings_change(
    p_tenant_id varchar,
    p_changed_by varchar,
    p_change_type varchar,
    p_field_path varchar DEFAULT NULL,
    p_old_value jsonb DEFAULT NULL,
    p_new_value jsonb DEFAULT NULL,
    p_change_reason text DEFAULT NULL,
    p_ip_address inet DEFAULT NULL,
    p_user_agent text DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    INSERT INTO settings_change_log (
        tenant_id,
        changed_by,
        change_type,
        field_path,
        old_value,
        new_value,
        change_reason,
        ip_address,
        user_agent
    ) VALUES (
        p_tenant_id,
        p_changed_by,
        p_change_type,
        p_field_path,
        p_old_value,
        p_new_value,
        p_change_reason,
        p_ip_address,
        p_user_agent
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old settings versions (keep last N versions)
CREATE OR REPLACE FUNCTION cleanup_old_settings_versions(
    p_tenant_id varchar,
    p_keep_versions integer DEFAULT 10
)
RETURNS integer AS $$
DECLARE
    v_deleted_count integer;
BEGIN
    WITH versions_to_delete AS (
        SELECT id
        FROM settings_versions
        WHERE tenant_id = p_tenant_id
        AND is_active = false
        ORDER BY version DESC
        OFFSET p_keep_versions
    )
    DELETE FROM settings_versions
    WHERE id IN (SELECT id FROM versions_to_delete);
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== CREATE TRIGGERS FOR AUTOMATIC CHANGE LOGGING =====

-- Trigger function to automatically log tenant settings changes
CREATE OR REPLACE FUNCTION trigger_log_tenant_settings_change()
RETURNS trigger AS $$
BEGIN
    -- Only log if bot_settings actually changed
    IF OLD.bot_settings IS DISTINCT FROM NEW.bot_settings THEN
        PERFORM log_settings_change(
            NEW.id,
            'system', -- Would be replaced with actual user ID in application
            'update',
            'bot_settings',
            OLD.bot_settings,
            NEW.bot_settings,
            'Tenant settings updated'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on tenants table
DROP TRIGGER IF EXISTS trigger_tenant_settings_change ON tenants;
CREATE TRIGGER trigger_tenant_settings_change
    AFTER UPDATE ON tenants
    FOR EACH ROW
    EXECUTE FUNCTION trigger_log_tenant_settings_change();

-- ===== MIGRATE EXISTING WHATSAPP DATA =====

-- Move existing WhatsApp data to new credentials table
INSERT INTO whatsapp_credentials (
    tenant_id,
    phone_number_id,
    access_token_encrypted,
    verify_token,
    is_verified,
    created_at,
    updated_at
)
SELECT 
    id,
    COALESCE(whatsapp_phone_id, ''),
    COALESCE(whatsapp_token, ''),
    COALESCE(whatsapp_verify_token, ''),
    false,
    created_at,
    updated_at
FROM tenants 
WHERE whatsapp_phone_id IS NOT NULL 
   OR whatsapp_token IS NOT NULL 
   OR whatsapp_verify_token IS NOT NULL;

-- ===== CREATE INITIAL SETTINGS VERSIONS =====

-- Create initial settings version for all existing tenants
INSERT INTO settings_versions (
    tenant_id,
    version,
    settings,
    created_by,
    is_active,
    change_summary
)
SELECT 
    id,
    1,
    bot_settings,
    'system',
    true,
    'Initial settings version'
FROM tenants
WHERE bot_settings IS NOT NULL;