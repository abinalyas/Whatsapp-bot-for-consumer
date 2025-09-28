import { Pool } from '@neondatabase/serverless';

async function checkTenants() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Checking tenants...');
    const result = await pool.query('SELECT id, business_name, domain FROM tenants');
    console.log('Tenants found:', result.rows);
    
    if (result.rows.length === 0) {
      console.log('No tenants found. Creating default tenant...');
      await pool.query(`
        INSERT INTO tenants (id, business_name, domain, business_type, created_at, updated_at)
        VALUES ('bella-salon', 'Bella Salon', 'bella-salon', 'salon', NOW(), NOW())
        ON CONFLICT (id) DO NOTHING
      `);
      console.log('Default tenant created.');
    }
  } catch (error) {
    console.error('Error checking tenants:', error);
  } finally {
    await pool.end();
  }
}

checkTenants();
