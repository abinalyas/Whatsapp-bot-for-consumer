# Database Migrations

This directory contains database migration scripts for transforming the single-tenant WhatsApp booking bot POC into a multi-tenant SaaS platform.

## Migration Overview

### 0001_multi_tenant_schema.sql

This migration transforms the database from single-tenant to multi-tenant architecture:

**New Tables Created:**
- `tenants` - Master tenant registry with business information and settings
- `users` - Tenant users and administrators with role-based access
- `api_keys` - Tenant-scoped API keys for external integrations
- `subscription_plans` - Available subscription plans with features and limits
- `subscriptions` - Tenant subscription management and billing
- `usage_metrics` - Usage tracking for billing and analytics

**Existing Tables Enhanced:**
- `services` - Added `tenant_id`, enhanced with categories and metadata
- `conversations` - Added `tenant_id`, context data, and tenant-scoped uniqueness
- `messages` - Added `tenant_id`, message types, and metadata
- `bookings` - Added `tenant_id`, enhanced with customer email and notes

**Security Features:**
- Row-Level Security (RLS) policies for complete tenant isolation
- Tenant context functions for session-based tenant filtering
- Comprehensive indexing for performance with tenant-scoped queries

## Usage

### Prerequisites

1. Ensure you have a PostgreSQL database with the required extensions:
   ```sql
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   ```

2. Set the `DATABASE_URL` environment variable:
   ```bash
   export DATABASE_URL="postgresql://user:password@host:port/database"
   ```

### Running Migrations

#### Apply Migration
```bash
# Apply the multi-tenant schema migration
npm run db:migrate:up 0001_multi_tenant_schema

# Check migration status
npm run db:migrate:status
```

#### Rollback Migration
```bash
# Rollback the multi-tenant schema migration
npm run db:migrate:down 0001_multi_tenant_schema
```

### Migration Scripts

The migration system provides several npm scripts:

- `npm run migrate` - Run migration CLI directly
- `npm run db:migrate:up <migration_id>` - Apply a specific migration
- `npm run db:migrate:down <migration_id>` - Rollback a specific migration  
- `npm run db:migrate:status` - Show applied migrations

### Data Safety

**Backup Strategy:**
- The migration creates backup tables (`*_backup`) before modifying existing tables
- Original data is preserved and can be restored if needed
- Rollback script restores original table structure and data

**Testing:**
- Run tests to verify tenant isolation: `npm run test:tenant-isolation`
- Migration tests verify schema changes: `npm test tests/migration.test.ts`

## Tenant Isolation Architecture

### Row-Level Security (RLS)

All tenant-scoped tables have RLS policies that automatically filter data based on the current tenant context:

```sql
-- Example policy for services table
CREATE POLICY "tenant_isolation_services" ON "services"
    FOR ALL TO authenticated
    USING ("tenant_id" = current_setting('app.current_tenant_id', true));
```

### Tenant Context Functions

Three functions manage tenant context for database sessions:

```sql
-- Set tenant context for current session
SELECT set_tenant_context('tenant-uuid-here');

-- Get current tenant context
SELECT get_tenant_context();

-- Clear tenant context
SELECT clear_tenant_context();
```

### Application Integration

Use the `TenantContext` class for tenant-aware database operations:

```typescript
import { TenantContext } from '@server/tenant-context';

const tenantContext = new TenantContext(process.env.DATABASE_URL);

// Execute operation with tenant context
const result = await tenantContext.withTenantContext(tenantId, async (db) => {
  return await db.select().from(services);
});
```

## Default Subscription Plans

The migration creates three default subscription plans:

1. **Starter** ($29/month) - Basic features for small businesses
2. **Professional** ($99/month) - Advanced features for growing businesses  
3. **Enterprise** ($299/month) - Full features for large organizations

## Performance Considerations

### Indexing Strategy

The migration creates optimized indexes for tenant-scoped queries:

- `tenant_id` indexes on all tenant-scoped tables
- Composite indexes for common query patterns
- Performance indexes for frequently accessed columns

### Query Optimization

- All queries automatically include `tenant_id` filtering
- Database connection pooling for scalability
- Prepared statements for security and performance

## Security Features

### Data Isolation

- Complete tenant data isolation at the database level
- Row-Level Security policies prevent cross-tenant access
- Foreign key constraints maintain referential integrity within tenants

### Access Control

- Role-based access control (RBAC) for tenant users
- API key management with tenant-scoped permissions
- Audit logging for compliance and security monitoring

## Troubleshooting

### Common Issues

1. **Migration Fails**: Check database permissions and connection
2. **RLS Not Working**: Ensure tenant context is set before queries
3. **Performance Issues**: Verify indexes are created and used

### Rollback Scenarios

The rollback migration handles several scenarios:
- Complete rollback to single-tenant structure
- Data restoration from backup tables
- Index and constraint cleanup

### Testing Tenant Isolation

Run the comprehensive test suite to verify tenant isolation:

```bash
# Run all tenant isolation tests
npm run test:tenant-isolation

# Run specific test categories
npm test tests/tenant-isolation.test.ts -- --reporter=verbose
```

## Next Steps

After applying this migration:

1. Update application code to use tenant context
2. Implement tenant registration and onboarding
3. Configure authentication with tenant scoping
4. Set up subscription and billing integration
5. Deploy with proper monitoring and alerting

For detailed implementation guidance, see the task list in `.kiro/specs/multi-tenant-saas-platform/tasks.md`.