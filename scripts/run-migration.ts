#!/usr/bin/env tsx

/**
 * Migration runner script
 * Runs database migrations to fix schema issues
 */

import { Pool } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { join } from 'path';

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
    const migrationPath = join(__dirname, '../migrations/0004_add_missing_columns.sql');
    const migrationSql = readFileSync(migrationPath, 'utf-8');
    
    // Execute the migration
    await pool.query(migrationSql);
    
    console.log('✅ Migration completed successfully!');
    console.log('📋 Applied changes:');
    console.log('   - Added duration_minutes column to services table');
    console.log('   - Added customer_email column to bookings table');
    console.log('   - Added custom_fields column to conversations table');
    console.log('   - Added tenant_id column to messages table');
    console.log('   - Added category and metadata columns to services table');
    console.log('   - Added custom_fields and transaction_type columns to bookings table');
    console.log('   - Created performance indexes');
    console.log('   - Added data integrity constraints');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the migration
runMigration().catch(console.error);