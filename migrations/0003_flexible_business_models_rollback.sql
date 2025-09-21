-- Rollback Migration: Flexible Business Models Schema
-- Description: Removes flexible business models schema and reverts to original structure
-- Version: 0003_rollback
-- Date: 2024-12-21

BEGIN;

-- =====================================================
-- DROP TRIGGERS AND FUNCTIONS
-- =====================================================

-- Drop triggers
DROP TRIGGER IF EXISTS set_transaction_number_trigger ON transactions;
DROP TRIGGER IF EXISTS update_bot_flow_nodes_updated_at ON bot_flow_nodes;
DROP TRIGGER IF EXISTS update_bot_flows_updated_at ON bot_flows;
DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
DROP TRIGGER IF EXISTS update_workflow_transitions_updated_at ON workflow_transitions;
DROP TRIGGER IF EXISTS update_workflow_states_updated_at ON workflow_states;
DROP TRIGGER IF EXISTS update_offerings_updated_at ON offerings;
DROP TRIGGER IF EXISTS update_custom_fields_updated_at ON custom_fields;
DROP TRIGGER IF EXISTS update_business_types_updated_at ON business_types;

-- Drop functions
DROP FUNCTION IF EXISTS set_transaction_number();
DROP FUNCTION IF EXISTS generate_transaction_number(UUID, VARCHAR);
DROP FUNCTION IF EXISTS setup_default_workflow_states(UUID, UUID);

-- =====================================================
-- REVERT EXISTING TABLES
-- =====================================================

-- Remove columns added to conversations
ALTER TABLE conversations 
DROP COLUMN IF EXISTS bot_flow_execution_id,
DROP COLUMN IF EXISTS custom_fields;

-- Remove columns added to tenants
ALTER TABLE tenants 
DROP COLUMN IF EXISTS terminology,
DROP COLUMN IF EXISTS business_config,
DROP COLUMN IF EXISTS business_type_id;

-- =====================================================
-- DROP NEW TABLES (in reverse dependency order)
-- =====================================================

-- Drop bot flow system tables
DROP TABLE IF EXISTS bot_flow_executions;
DROP TABLE IF EXISTS bot_flow_nodes;
DROP TABLE IF EXISTS bot_flows;

-- Drop transaction system tables
DROP TABLE IF EXISTS transactions;

-- Drop workflow system tables
DROP TABLE IF EXISTS workflow_transitions;
DROP TABLE IF EXISTS workflow_states;

-- Drop offerings table
DROP TABLE IF EXISTS offerings;

-- Drop custom fields table
DROP TABLE IF EXISTS custom_fields;

-- Drop business types table
DROP TABLE IF EXISTS business_types;

COMMIT;