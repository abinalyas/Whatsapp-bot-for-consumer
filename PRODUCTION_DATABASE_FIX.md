# Production Database Migration Fix

## Issue
The production database is missing the `tenant_id` column and other new schema changes from the flexible business models migration (0003_flexible_business_models.sql).

## Error Logs
```
Error processing WhatsApp message: error: column "tenant_id" does not exist
```

## Solution Steps

### 1. Get Production Database URL
The DATABASE_URL needs to be obtained from the production environment. This is typically stored in Vercel environment variables.

### 2. Apply Migration
Run the migration to update the production database:

```bash
# Set the production database URL
export DATABASE_URL="your_production_database_url_here"

# Apply the flexible business models migration
npm run migrate up 0003_flexible_business_models
```

### 3. Verify Migration
Check that the migration was applied:

```bash
npm run migrate status
```

## Migration Contents
The 0003_flexible_business_models.sql migration includes:

- ✅ `business_types` table with predefined business types
- ✅ `custom_fields` table for flexible field definitions  
- ✅ `offerings` table (replaces services) with tenant_id
- ✅ `workflow_states` and `workflow_transitions` tables
- ✅ `transactions` table (replaces bookings) with tenant_id
- ✅ `bot_flows`, `bot_flow_nodes`, `bot_flow_executions` tables
- ✅ Updates to existing tables to add tenant_id columns
- ✅ Default workflow states for different business types
- ✅ Triggers and functions for auto-generation

## Temporary Workaround
If migration cannot be applied immediately, the server code should be updated to handle missing columns gracefully by:

1. Checking if columns exist before querying
2. Using try-catch blocks around database operations
3. Providing fallback behavior for missing schema elements

## Post-Migration Verification
After migration, verify:

1. ✅ All tables have tenant_id columns
2. ✅ Business types are populated
3. ✅ Existing data is preserved
4. ✅ WhatsApp webhook works without errors
5. ✅ UI components can load business configuration

## Database URL Location
The production DATABASE_URL should be available in:
- Vercel project environment variables
- Or can be obtained from the database provider (Neon, Supabase, etc.)