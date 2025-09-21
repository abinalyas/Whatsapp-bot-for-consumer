#!/usr/bin/env tsx

import { Pool } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface Migration {
  id: string;
  name: string;
  applied_at: Date;
}

class MigrationRunner {
  private pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString });
  }

  async ensureMigrationsTable(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS migrations (
          id varchar PRIMARY KEY,
          name varchar NOT NULL,
          applied_at timestamp NOT NULL DEFAULT NOW()
        );
      `);
    } finally {
      client.release();
    }
  }

  async getAppliedMigrations(): Promise<Migration[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM migrations ORDER BY applied_at');
      return result.rows;
    } finally {
      client.release();
    }
  }

  async applyMigration(migrationId: string, migrationName: string, sqlPath: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      
      // Read and execute migration SQL
      const sql = readFileSync(sqlPath, 'utf-8');
      await client.query(sql);
      
      // Record migration as applied
      await client.query(
        'INSERT INTO migrations (id, name) VALUES ($1, $2)',
        [migrationId, migrationName]
      );
      
      await client.query('COMMIT');
      console.log(`✅ Applied migration: ${migrationId} - ${migrationName}`);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`❌ Failed to apply migration ${migrationId}:`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  async rollbackMigration(migrationId: string, rollbackSqlPath: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      
      // Read and execute rollback SQL
      const sql = readFileSync(rollbackSqlPath, 'utf-8');
      await client.query(sql);
      
      // Remove migration record
      await client.query('DELETE FROM migrations WHERE id = $1', [migrationId]);
      
      await client.query('COMMIT');
      console.log(`✅ Rolled back migration: ${migrationId}`);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`❌ Failed to rollback migration ${migrationId}:`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

async function main() {
  const command = process.argv[2];
  const migrationId = process.argv[3];

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is required');
    process.exit(1);
  }

  const runner = new MigrationRunner(process.env.DATABASE_URL);

  try {
    await runner.ensureMigrationsTable();

    switch (command) {
      case 'up':
        if (!migrationId) {
          console.error('❌ Migration ID is required for "up" command');
          console.log('Usage: npm run migrate up <migration_id>');
          process.exit(1);
        }
        
        const appliedMigrations = await runner.getAppliedMigrations();
        const isAlreadyApplied = appliedMigrations.some(m => m.id === migrationId);
        
        if (isAlreadyApplied) {
          console.log(`⚠️  Migration ${migrationId} is already applied`);
          break;
        }

        const migrationPath = join(__dirname, '..', 'migrations', `${migrationId}.sql`);
        const migrationName = migrationId.replace(/^\d+_/, '').replace(/_/g, ' ');
        
        await runner.applyMigration(migrationId, migrationName, migrationPath);
        break;

      case 'down':
        if (!migrationId) {
          console.error('❌ Migration ID is required for "down" command');
          console.log('Usage: npm run migrate down <migration_id>');
          process.exit(1);
        }

        const rollbackPath = join(__dirname, '..', 'migrations', `${migrationId}_rollback.sql`);
        await runner.rollbackMigration(migrationId, rollbackPath);
        break;

      case 'status':
        const migrations = await runner.getAppliedMigrations();
        console.log('\n📋 Applied Migrations:');
        if (migrations.length === 0) {
          console.log('   No migrations applied yet');
        } else {
          migrations.forEach(m => {
            console.log(`   ✅ ${m.id} - ${m.name} (${m.applied_at.toISOString()})`);
          });
        }
        break;

      default:
        console.log('Usage:');
        console.log('  npm run migrate up <migration_id>    - Apply a migration');
        console.log('  npm run migrate down <migration_id>  - Rollback a migration');
        console.log('  npm run migrate status               - Show migration status');
        console.log('');
        console.log('Available migrations:');
        console.log('  0001_multi_tenant_schema - Multi-tenant database schema');
        break;
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await runner.close();
  }
}

main().catch(console.error);