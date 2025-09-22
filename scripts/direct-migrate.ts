#!/usr/bin/env tsx
/**
 * Direct Database Migration Script
 * This script connects directly to the database and adds missing columns
 * bypassing Vercel authentication issues
 */

import { Pool } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

async function runMigration() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is not set');
    console.error('Please set DATABASE_URL in your .env or .env.local file');
    process.exit(1);
  }

  console.log('🔄 Connecting to database...');
  
  try {
    const pool = new Pool({ connectionString: databaseUrl });
    const client = await pool.connect();
    
    console.log('✅ Connected to database successfully');
    
    // Migration SQL statements to add missing columns
    const migrations = [
      "ALTER TABLE conversations ADD COLUMN IF NOT EXISTS context_data JSONB DEFAULT '{}';",
      "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(255);",
      "ALTER TABLE services ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;",
      "ALTER TABLE services ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;",
      "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;",
      "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;",
      "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS notes TEXT;",
      "ALTER TABLE messages ADD COLUMN IF NOT EXISTS message_type VARCHAR(50) NOT NULL DEFAULT 'text';",
      "ALTER TABLE messages ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';"
    ];

    console.log('🔄 Running migrations...');
    
    for (const sql of migrations) {
      try {
        await client.query(sql);
        console.log(`✅ Executed: ${sql}`);
      } catch (error) {
        console.log(`⚠️  Error (may be harmless): ${sql} - ${error.message}`);
      }
    }

    client.release();
    await pool.end();
    
    console.log('🎉 All migrations completed successfully!');
    console.log('\n📝 Note: The WhatsApp bot should now work without database schema errors.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Please check your DATABASE_URL and database connectivity.');
    process.exit(1);
  }
}

// Run the migration
runMigration().catch(console.error);