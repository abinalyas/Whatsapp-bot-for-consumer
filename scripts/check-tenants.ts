import { Pool } from '@neondatabase/serverless';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function checkTenants() {
  try {
    const result = await pool.query('SELECT id, domain, business_name FROM tenants');
    console.log('Tenants:', JSON.stringify(result.rows, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkTenants();