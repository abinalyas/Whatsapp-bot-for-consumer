-- Migration: Flexible Business Models Schema
-- Description: Adds support for configurable business types, custom fields, and dynamic workflows
-- Version: 0003
-- Date: 2024-12-21

BEGIN;

-- =====================================================
-- BUSINESS TYPES AND CONFIGURATION
-- =====================================================

-- Business types define the model and terminology for different industries
CREATE TABLE business_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'service', 'retail', 'hospitality', 'healthcare', 'custom'
    description TEXT,
    terminology JSONB NOT NULL DEFAULT '{}', -- Custom terminology for this business type
    default_config JSONB NOT NULL DEFAULT '{}', -- Default configuration settings
    is_system BOOLEAN NOT NULL DEFAULT false, -- System-defined vs custom business types
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add indexes for business types
CREATE INDEX idx_business_types_category ON business_types(category);
CREATE INDEX idx_business_types_active ON business_types(is_active);

-- =====================================================
-- CUSTOM FIELDS SYSTEM
-- =====================================================

-- Custom field definitions for flexible data collection
CREATE TABLE custom_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL, -- 'offering', 'transaction', 'customer'
    name VARCHAR(100) NOT NULL, -- Internal field name
    label VARCHAR(200) NOT NULL, -- Display label
    field_type VARCHAR(50) NOT NULL, -- 'text', 'number', 'date', 'boolean', 'select', 'multiselect', 'file'
    is_required BOOLEAN NOT NULL DEFAULT false,
    validation_rules JSONB DEFAULT '{}', -- Validation configuration
    field_options JSONB DEFAULT '[]', -- Options for select/multiselect fields
    default_value JSONB DEFAULT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    UNIQUE(tenant_id, entity_type, name)
);

-- Add indexes for custom fields
CREATE INDEX idx_custom_fields_tenant_entity ON custom_fields(tenant_id, entity_type);
CREATE INDEX idx_custom_fields_active ON custom_fields(is_active);

-- =====================================================
-- FLEXIBLE OFFERINGS SYSTEM (REPLACES SERVICES)
-- =====================================================

-- Generalized offerings table (services, products, menu items, etc.)
CREATE TABLE offerings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    offering_type VARCHAR(50) NOT NULL DEFAULT 'service', -- 'service', 'product', 'reservation', 'appointment'
    category VARCHAR(100),
    subcategory VARCHAR(100),
    
    -- Pricing configuration
    pricing_type VARCHAR(50) NOT NULL DEFAULT 'fixed', -- 'fixed', 'variable', 'time_based', 'tiered'
    base_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    pricing_config JSONB DEFAULT '{}', -- Additional pricing configuration
    
    -- Availability and scheduling
    is_schedulable BOOLEAN NOT NULL DEFAULT false,
    duration_minutes INTEGER, -- For time-based offerings
    availability_config JSONB DEFAULT '{}', -- Availability rules and constraints
    
    -- Variants and options
    has_variants BOOLEAN NOT NULL DEFAULT false,
    variants JSONB DEFAULT '[]', -- Product variants (size, color, etc.)
    
    -- Custom fields data
    custom_fields JSONB DEFAULT '{}',
    
    -- Status and metadata
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER NOT NULL DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    images JSONB DEFAULT '[]', -- Image URLs and metadata
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add indexes for offerings
CREATE INDEX idx_offerings_tenant ON offerings(tenant_id);
CREATE INDEX idx_offerings_type ON offerings(tenant_id, offering_type);
CREATE INDEX idx_offerings_category ON offerings(tenant_id, category);
CREATE INDEX idx_offerings_active ON offerings(tenant_id, is_active);
CREATE INDEX idx_offerings_schedulable ON offerings(tenant_id, is_schedulable);

-- =====================================================
-- WORKFLOW SYSTEM
-- =====================================================

-- Workflow states for business processes
CREATE TABLE workflow_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    workflow_type VARCHAR(50) NOT NULL, -- 'transaction', 'offering', 'customer'
    name VARCHAR(100) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    state_type VARCHAR(20) NOT NULL DEFAULT 'intermediate', -- 'initial', 'intermediate', 'final'
    color VARCHAR(7) DEFAULT '#6B7280', -- Hex color for UI
    description TEXT,
    is_system BOOLEAN NOT NULL DEFAULT false, -- System vs custom states
    display_order INTEGER NOT NULL DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    UNIQUE(tenant_id, workflow_type, name)
);

-- Workflow transitions define allowed state changes
CREATE TABLE workflow_transitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    workflow_type VARCHAR(50) NOT NULL,
    from_state_id UUID NOT NULL REFERENCES workflow_states(id) ON DELETE CASCADE,
    to_state_id UUID NOT NULL REFERENCES workflow_states(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    conditions JSONB DEFAULT '{}', -- Conditions for transition
    actions JSONB DEFAULT '[]', -- Actions to execute on transition
    is_automatic BOOLEAN NOT NULL DEFAULT false,
    requires_approval BOOLEAN NOT NULL DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add indexes for workflow system
CREATE INDEX idx_workflow_states_tenant_type ON workflow_states(tenant_id, workflow_type);
CREATE INDEX idx_workflow_transitions_tenant_type ON workflow_transitions(tenant_id, workflow_type);
CREATE INDEX idx_workflow_transitions_from_state ON workflow_transitions(from_state_id);
CREATE INDEX idx_workflow_transitions_to_state ON workflow_transitions(to_state_id);

-- =====================================================
-- FLEXIBLE TRANSACTIONS SYSTEM (REPLACES BOOKINGS)
-- =====================================================

-- Generalized transactions table (bookings, orders, reservations, appointments)
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL DEFAULT 'booking', -- 'booking', 'order', 'reservation', 'appointment'
    transaction_number VARCHAR(50), -- Human-readable transaction number
    
    -- Customer information
    customer_phone VARCHAR(20) NOT NULL,
    customer_name VARCHAR(200),
    customer_email VARCHAR(255),
    
    -- Offering reference (optional for custom transactions)
    offering_id UUID REFERENCES offerings(id) ON DELETE SET NULL,
    
    -- Scheduling (for time-based transactions)
    scheduled_at TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    timezone VARCHAR(50) DEFAULT 'UTC',
    
    -- Financial information
    amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    payment_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'paid', 'refunded', 'failed'
    payment_method VARCHAR(50),
    payment_reference VARCHAR(200),
    
    -- Workflow state
    current_state_id UUID REFERENCES workflow_states(id),
    workflow_history JSONB DEFAULT '[]', -- History of state changes
    
    -- Custom fields data
    custom_fields JSONB DEFAULT '{}',
    
    -- Additional information
    notes TEXT,
    internal_notes TEXT, -- Private notes for staff
    tags TEXT[] DEFAULT '{}',
    priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    
    -- Metadata and tracking
    source VARCHAR(50) DEFAULT 'whatsapp', -- 'whatsapp', 'web', 'api', 'manual'
    conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add indexes for transactions
CREATE INDEX idx_transactions_tenant ON transactions(tenant_id);
CREATE INDEX idx_transactions_type ON transactions(tenant_id, transaction_type);
CREATE INDEX idx_transactions_customer_phone ON transactions(tenant_id, customer_phone);
CREATE INDEX idx_transactions_offering ON transactions(offering_id);
CREATE INDEX idx_transactions_scheduled ON transactions(tenant_id, scheduled_at);
CREATE INDEX idx_transactions_state ON transactions(current_state_id);
CREATE INDEX idx_transactions_payment_status ON transactions(tenant_id, payment_status);
CREATE INDEX idx_transactions_created ON transactions(tenant_id, created_at);

-- =====================================================
-- BOT FLOW SYSTEM
-- =====================================================

-- Bot flows define conversation structures
CREATE TABLE bot_flows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    flow_type VARCHAR(50) NOT NULL DEFAULT 'conversation', -- 'conversation', 'automation', 'integration'
    start_node_id UUID, -- Will be set after nodes are created
    is_active BOOLEAN NOT NULL DEFAULT false,
    is_default BOOLEAN NOT NULL DEFAULT false, -- Default flow for new conversations
    version INTEGER NOT NULL DEFAULT 1,
    variables JSONB DEFAULT '{}', -- Flow-level variables and their types
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    UNIQUE(tenant_id, name, version)
);

-- Bot flow nodes define individual steps in conversations
CREATE TABLE bot_flow_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flow_id UUID NOT NULL REFERENCES bot_flows(id) ON DELETE CASCADE,
    node_type VARCHAR(50) NOT NULL, -- 'message', 'question', 'condition', 'action', 'integration'
    name VARCHAR(200) NOT NULL,
    position_x INTEGER NOT NULL DEFAULT 0, -- For visual editor
    position_y INTEGER NOT NULL DEFAULT 0,
    
    -- Node configuration based on type
    config JSONB NOT NULL DEFAULT '{}',
    
    -- Connections to other nodes
    connections JSONB DEFAULT '[]', -- Array of {target_node_id, condition?, label?}
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Bot flow executions track conversation state
CREATE TABLE bot_flow_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flow_id UUID NOT NULL REFERENCES bot_flows(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    current_node_id UUID REFERENCES bot_flow_nodes(id),
    variables JSONB DEFAULT '{}', -- Runtime variables and collected data
    execution_history JSONB DEFAULT '[]', -- History of nodes executed
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'completed', 'failed', 'paused'
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    
    UNIQUE(conversation_id) -- One execution per conversation
);

-- Add indexes for bot flow system
CREATE INDEX idx_bot_flows_tenant ON bot_flows(tenant_id);
CREATE INDEX idx_bot_flows_active ON bot_flows(tenant_id, is_active);
CREATE INDEX idx_bot_flow_nodes_flow ON bot_flow_nodes(flow_id);
CREATE INDEX idx_bot_flow_executions_flow ON bot_flow_executions(flow_id);
CREATE INDEX idx_bot_flow_executions_conversation ON bot_flow_executions(conversation_id);
CREATE INDEX idx_bot_flow_executions_status ON bot_flow_executions(status);

-- =====================================================
-- TENANT BUSINESS CONFIGURATION
-- =====================================================

-- Extend tenants table with business configuration
ALTER TABLE tenants 
ADD COLUMN business_type_id UUID REFERENCES business_types(id),
ADD COLUMN business_config JSONB DEFAULT '{}',
ADD COLUMN terminology JSONB DEFAULT '{}'; -- Tenant-specific terminology overrides

-- Add index for business type
CREATE INDEX idx_tenants_business_type ON tenants(business_type_id);

-- =====================================================
-- UPDATE EXISTING TABLES
-- =====================================================

-- Add custom fields support to conversations
ALTER TABLE conversations 
ADD COLUMN custom_fields JSONB DEFAULT '{}',
ADD COLUMN bot_flow_execution_id UUID REFERENCES bot_flow_executions(id);

-- Add index for bot flow execution
CREATE INDEX idx_conversations_bot_flow_execution ON conversations(bot_flow_execution_id);

-- =====================================================
-- SYSTEM DATA - PREDEFINED BUSINESS TYPES
-- =====================================================

-- Insert predefined business types
INSERT INTO business_types (name, display_name, category, description, terminology, default_config, is_system) VALUES
('restaurant', 'Restaurant', 'hospitality', 'Full-service restaurant with table reservations and menu ordering', 
 '{"offering": "Menu Item", "transaction": "Reservation", "customer": "Guest", "plural_offering": "Menu Items", "plural_transaction": "Reservations"}',
 '{"offering_types": ["food", "beverage"], "transaction_types": ["reservation", "order"], "requires_scheduling": true, "default_duration": 120}', 
 true),

('clinic', 'Medical Clinic', 'healthcare', 'Healthcare clinic with appointment scheduling and treatment management',
 '{"offering": "Treatment", "transaction": "Appointment", "customer": "Patient", "plural_offering": "Treatments", "plural_transaction": "Appointments"}',
 '{"offering_types": ["consultation", "treatment", "procedure"], "transaction_types": ["appointment"], "requires_scheduling": true, "default_duration": 30}',
 true),

('retail_store', 'Retail Store', 'retail', 'Retail business with product catalog and order management',
 '{"offering": "Product", "transaction": "Order", "customer": "Customer", "plural_offering": "Products", "plural_transaction": "Orders"}',
 '{"offering_types": ["product"], "transaction_types": ["order", "pickup"], "requires_scheduling": false, "supports_inventory": true}',
 true),

('salon', 'Beauty Salon', 'service', 'Beauty salon with service bookings and staff scheduling',
 '{"offering": "Service", "transaction": "Booking", "customer": "Client", "plural_offering": "Services", "plural_transaction": "Bookings"}',
 '{"offering_types": ["service"], "transaction_types": ["booking"], "requires_scheduling": true, "default_duration": 60, "supports_staff": true}',
 true),

('bakery', 'Bakery', 'retail', 'Bakery with product orders and pickup scheduling',
 '{"offering": "Product", "transaction": "Order", "customer": "Customer", "plural_offering": "Products", "plural_transaction": "Orders"}',
 '{"offering_types": ["baked_good", "cake", "pastry"], "transaction_types": ["order", "pickup"], "requires_scheduling": true, "default_duration": 15}',
 true),

('fitness_studio', 'Fitness Studio', 'service', 'Fitness studio with class bookings and membership management',
 '{"offering": "Class", "transaction": "Booking", "customer": "Member", "plural_offering": "Classes", "plural_transaction": "Bookings"}',
 '{"offering_types": ["class", "session"], "transaction_types": ["booking"], "requires_scheduling": true, "default_duration": 45, "supports_capacity": true}',
 true);

-- =====================================================
-- DEFAULT WORKFLOW STATES
-- =====================================================

-- Create a function to set up default workflow states for a tenant
CREATE OR REPLACE FUNCTION setup_default_workflow_states(p_tenant_id UUID, p_business_type_id UUID)
RETURNS VOID AS $$
DECLARE
    business_type_name VARCHAR(100);
BEGIN
    -- Get business type name
    SELECT name INTO business_type_name FROM business_types WHERE id = p_business_type_id;
    
    -- Create default transaction workflow states based on business type
    CASE business_type_name
        WHEN 'restaurant' THEN
            INSERT INTO workflow_states (tenant_id, workflow_type, name, display_name, state_type, color, is_system) VALUES
            (p_tenant_id, 'transaction', 'pending', 'Pending', 'initial', '#F59E0B', true),
            (p_tenant_id, 'transaction', 'confirmed', 'Confirmed', 'intermediate', '#10B981', true),
            (p_tenant_id, 'transaction', 'seated', 'Seated', 'intermediate', '#3B82F6', true),
            (p_tenant_id, 'transaction', 'completed', 'Completed', 'final', '#059669', true),
            (p_tenant_id, 'transaction', 'cancelled', 'Cancelled', 'final', '#EF4444', true),
            (p_tenant_id, 'transaction', 'no_show', 'No Show', 'final', '#6B7280', true);
            
        WHEN 'clinic' THEN
            INSERT INTO workflow_states (tenant_id, workflow_type, name, display_name, state_type, color, is_system) VALUES
            (p_tenant_id, 'transaction', 'scheduled', 'Scheduled', 'initial', '#F59E0B', true),
            (p_tenant_id, 'transaction', 'confirmed', 'Confirmed', 'intermediate', '#10B981', true),
            (p_tenant_id, 'transaction', 'checked_in', 'Checked In', 'intermediate', '#3B82F6', true),
            (p_tenant_id, 'transaction', 'in_progress', 'In Progress', 'intermediate', '#8B5CF6', true),
            (p_tenant_id, 'transaction', 'completed', 'Completed', 'final', '#059669', true),
            (p_tenant_id, 'transaction', 'cancelled', 'Cancelled', 'final', '#EF4444', true),
            (p_tenant_id, 'transaction', 'rescheduled', 'Rescheduled', 'intermediate', '#F97316', true);
            
        WHEN 'retail_store' THEN
            INSERT INTO workflow_states (tenant_id, workflow_type, name, display_name, state_type, color, is_system) VALUES
            (p_tenant_id, 'transaction', 'pending', 'Pending', 'initial', '#F59E0B', true),
            (p_tenant_id, 'transaction', 'confirmed', 'Confirmed', 'intermediate', '#10B981', true),
            (p_tenant_id, 'transaction', 'preparing', 'Preparing', 'intermediate', '#3B82F6', true),
            (p_tenant_id, 'transaction', 'ready', 'Ready for Pickup', 'intermediate', '#8B5CF6', true),
            (p_tenant_id, 'transaction', 'completed', 'Completed', 'final', '#059669', true),
            (p_tenant_id, 'transaction', 'cancelled', 'Cancelled', 'final', '#EF4444', true);
            
        ELSE
            -- Default workflow states for any business type
            INSERT INTO workflow_states (tenant_id, workflow_type, name, display_name, state_type, color, is_system) VALUES
            (p_tenant_id, 'transaction', 'pending', 'Pending', 'initial', '#F59E0B', true),
            (p_tenant_id, 'transaction', 'confirmed', 'Confirmed', 'intermediate', '#10B981', true),
            (p_tenant_id, 'transaction', 'in_progress', 'In Progress', 'intermediate', '#3B82F6', true),
            (p_tenant_id, 'transaction', 'completed', 'Completed', 'final', '#059669', true),
            (p_tenant_id, 'transaction', 'cancelled', 'Cancelled', 'final', '#EF4444', true);
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS AND FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to new tables
CREATE TRIGGER update_business_types_updated_at BEFORE UPDATE ON business_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_custom_fields_updated_at BEFORE UPDATE ON custom_fields FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_offerings_updated_at BEFORE UPDATE ON offerings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workflow_states_updated_at BEFORE UPDATE ON workflow_states FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workflow_transitions_updated_at BEFORE UPDATE ON workflow_transitions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bot_flows_updated_at BEFORE UPDATE ON bot_flows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bot_flow_nodes_updated_at BEFORE UPDATE ON bot_flow_nodes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate transaction numbers
CREATE OR REPLACE FUNCTION generate_transaction_number(p_tenant_id UUID, p_transaction_type VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
    prefix VARCHAR(10);
    sequence_num INTEGER;
    result VARCHAR(50);
BEGIN
    -- Get prefix based on transaction type
    prefix := CASE p_transaction_type
        WHEN 'booking' THEN 'BK'
        WHEN 'order' THEN 'OR'
        WHEN 'reservation' THEN 'RS'
        WHEN 'appointment' THEN 'AP'
        ELSE 'TX'
    END;
    
    -- Get next sequence number for this tenant and type
    SELECT COALESCE(MAX(CAST(SUBSTRING(transaction_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM transactions 
    WHERE tenant_id = p_tenant_id 
    AND transaction_type = p_transaction_type
    AND transaction_number ~ ('^' || prefix || '[0-9]+$');
    
    -- Format: PREFIX + 6-digit number (e.g., BK000001)
    result := prefix || LPAD(sequence_num::TEXT, 6, '0');
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate transaction numbers
CREATE OR REPLACE FUNCTION set_transaction_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.transaction_number IS NULL THEN
        NEW.transaction_number := generate_transaction_number(NEW.tenant_id, NEW.transaction_type);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_transaction_number_trigger 
    BEFORE INSERT ON transactions 
    FOR EACH ROW 
    EXECUTE FUNCTION set_transaction_number();

COMMIT;