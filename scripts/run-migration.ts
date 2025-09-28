#!/usr/bin/env tsx

/**
 * Migration runner script
 * Runs database migrations to fix schema issues
 */

import { Pool } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('DATABASE_URL environment variable is required');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });

  try {
    console.log('🔄 Running database migration...');
    
    // Read the migration file
    const migrationPath = join(__dirname, '../migrations/0001_multi_tenant_schema.sql');
    const migrationSql = readFileSync(migrationPath, 'utf-8');
    
    // Execute the migration
    await pool.query(migrationSql);
    
    console.log('✅ Migration completed successfully!');
    console.log('📋 Applied changes:');
    console.log('   - Created tenants table for multi-tenant support');
    console.log('   - Created users table for tenant users and admins');
    console.log('   - Created api_keys table for API authentication');
    console.log('   - Created subscription_plans and subscriptions tables');
    console.log('   - Created basic schema for multi-tenant SaaS platform');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the migration
runMigration().catch(console.error);