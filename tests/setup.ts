import { beforeAll, afterAll } from 'vitest';
import { Pool } from '@neondatabase/serverless';
import { config } from 'dotenv';

// Load environment variables
config();

let testPool: Pool;

beforeAll(async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required for tests');
  }
  
  testPool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  // Ensure we have a clean test environment
  console.log('Setting up test database...');
});

afterAll(async () => {
  if (testPool) {
    await testPool.end();
  }
});

export { testPool };