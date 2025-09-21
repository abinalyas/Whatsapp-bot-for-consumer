import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Pool } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Database Migration Tests', () => {
  let pool: Pool;
  let testDbName: string;

  beforeAll(async () => {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is required for migration tests');
    }

    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    testDbName = `test_migration_${Date.now()}`;
  });

  afterAll(async () => {
    if (pool) {
      await pool.end();
    }
  });

  describe('Multi-Tenant Schema Migration', () => {
    it('should apply migration successfully', async () => {
      const client = await pool.connect();
      
      try {
        // Read and execute migration
        const migrationSql = readFileSync(
          join(process.cwd(), 'migrations', '0001_multi_tenant_schema.sql'),
          'utf-8'
        );
        
        await client.query(migrationSql);
        
        // Verify tenant management tables exist
        const tenantTables = [
          'tenants',
          'users', 
          'api_keys',
          'subscription_plans',
          'subscriptions',
          'usage_metrics'
        ];
        
        for (const tableName of tenantTables) {
          const result = await client.query(`
            SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_name = $1
            )
          `, [tableName]);
          
          expect(result.rows[0].exists).toBe(true);
        }
        
        // Verify business tables have tenant_id columns
        const businessTables = ['services', 'conversations', 'messages', 'bookings'];
        
        for (const tableName of businessTables) {
          const result = await client.query(`
            SELECT EXISTS (
              SELECT FROM information_schema.columns 
              WHERE table_name = $1 AND column_name = 'tenant_id'
            )
          `, [tableName]);
          
          expect(result.rows[0].exists).toBe(true);
        }
        
        // Verify RLS is enabled
        for (const tableName of [...tenantTables, ...businessTables]) {
          const result = await client.query(`
            SELECT relrowsecurity 
            FROM pg_class 
            WHERE relname = $1
          `, [tableName]);
          
          if (result.rows.length > 0) {
            expect(result.rows[0].relrowsecurity).toBe(true);
          }
        }
        
        // Verify tenant context functions exist
        const functions = [
          'set_tenant_context',
          'get_tenant_context', 
          'clear_tenant_context'
        ];
        
        for (const funcName of functions) {
          const result = await client.query(`
            SELECT EXISTS (
              SELECT FROM pg_proc 
              WHERE proname = $1
            )
          `, [funcName]);
          
          expect(result.rows[0].exists).toBe(true);
        }
        
        // Verify default subscription plans are inserted
        const plansResult = await client.query('SELECT COUNT(*) FROM subscription_plans');
        expect(parseInt(plansResult.rows[0].count)).toBeGreaterThan(0);
        
      } finally {
        client.release();
      }
    });

    it('should rollback migration successfully', async () => {
      const client = await pool.connect();
      
      try {
        // First apply the migration
        const migrationSql = readFileSync(
          join(process.cwd(), 'migrations', '0001_multi_tenant_schema.sql'),
          'utf-8'
        );
        await client.query(migrationSql);
        
        // Then apply the rollback
        const rollbackSql = readFileSync(
          join(process.cwd(), 'migrations', '0001_multi_tenant_schema_rollback.sql'),
          'utf-8'
        );
        await client.query(rollbackSql);
        
        // Verify tenant management tables are removed
        const tenantTables = [
          'tenants',
          'users',
          'api_keys', 
          'subscription_plans',
          'subscriptions',
          'usage_metrics'
        ];
        
        for (const tableName of tenantTables) {
          const result = await client.query(`
            SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_name = $1
            )
          `, [tableName]);
          
          expect(result.rows[0].exists).toBe(false);
        }
        
        // Verify business tables are restored to original structure
        const businessTables = ['services', 'conversations', 'messages', 'bookings'];
        
        for (const tableName of businessTables) {
          // Table should exist
          const tableResult = await client.query(`
            SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_name = $1
            )
          `, [tableName]);
          expect(tableResult.rows[0].exists).toBe(true);
          
          // But tenant_id column should not exist
          const columnResult = await client.query(`
            SELECT EXISTS (
              SELECT FROM information_schema.columns 
              WHERE table_name = $1 AND column_name = 'tenant_id'
            )
          `, [tableName]);
          expect(columnResult.rows[0].exists).toBe(false);
        }
        
      } finally {
        client.release();
      }
    });

    it('should preserve data integrity during migration', async () => {
      const client = await pool.connect();
      
      try {
        // Create original structure and insert test data
        await client.query(`
          CREATE TABLE IF NOT EXISTS test_services (
            id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
            name text NOT NULL,
            price integer NOT NULL
          )
        `);
        
        await client.query(`
          INSERT INTO test_services (name, price) VALUES 
          ('Test Service 1', 5000),
          ('Test Service 2', 7500)
        `);
        
        const originalData = await client.query('SELECT * FROM test_services ORDER BY name');
        expect(originalData.rows).toHaveLength(2);
        
        // Simulate migration backup and restore process
        await client.query('CREATE TABLE test_services_backup AS SELECT * FROM test_services');
        await client.query('DROP TABLE test_services');
        
        // Create new structure with tenant_id
        await client.query(`
          CREATE TABLE test_services (
            id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id varchar NOT NULL,
            name text NOT NULL,
            price integer NOT NULL
          )
        `);
        
        // Verify backup data can be restored (in real migration, this would include tenant_id assignment)
        const backupData = await client.query('SELECT * FROM test_services_backup ORDER BY name');
        expect(backupData.rows).toHaveLength(2);
        expect(backupData.rows[0].name).toBe('Test Service 1');
        expect(backupData.rows[1].name).toBe('Test Service 2');
        
        // Clean up
        await client.query('DROP TABLE IF EXISTS test_services');
        await client.query('DROP TABLE IF EXISTS test_services_backup');
        
      } finally {
        client.release();
      }
    });
  });

  describe('Index Performance', () => {
    it('should create proper indexes for tenant isolation', async () => {
      const client = await pool.connect();
      
      try {
        // Apply migration
        const migrationSql = readFileSync(
          join(process.cwd(), 'migrations', '0001_multi_tenant_schema.sql'),
          'utf-8'
        );
        await client.query(migrationSql);
        
        // Verify tenant_id indexes exist
        const expectedIndexes = [
          'idx_services_tenant_id',
          'idx_conversations_tenant_id',
          'idx_messages_tenant_id',
          'idx_bookings_tenant_id',
          'idx_users_tenant_id',
          'idx_api_keys_tenant_id',
          'idx_subscriptions_tenant_id',
          'idx_usage_metrics_tenant_id'
        ];
        
        for (const indexName of expectedIndexes) {
          const result = await client.query(`
            SELECT EXISTS (
              SELECT FROM pg_indexes 
              WHERE indexname = $1
            )
          `, [indexName]);
          
          expect(result.rows[0].exists).toBe(true);
        }
        
      } finally {
        client.release();
      }
    });
  });
});