import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { Pool } from '@neondatabase/serverless';

// Database connection for testing
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

describe('Database Constraint Testing', () => {
  let tenantId: string;

  beforeAll(async () => {
    // Get test tenant ID
    const tenantResult = await pool.query(`
      SELECT id FROM tenants WHERE domain = 'bella-salon' OR business_name = 'Bella Salon'
    `);
    tenantId = tenantResult.rows[0]?.id;
    
    if (!tenantId) {
      throw new Error('Test tenant not found');
    }
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('Service (Offerings) Table Constraints', () => {
    test('Service creation fails with null name', async () => {
      try {
        await pool.query(`
          INSERT INTO offerings (
            tenant_id, name, description, category, subcategory,
            base_price, currency, duration_minutes, is_active, 
            display_order, tags, images, offering_type
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'service')
        `, [
          tenantId, null, 'Test description', 'hair', null,
          100, 'USD', 60, true, 0, '[]', '[]'
        ]);
        expect.fail('Should have thrown constraint violation');
      } catch (error: any) {
        expect(error.code).toBe('23502'); // NOT NULL constraint violation
        expect(error.column).toBe('name');
      }
    });

    test('Service creation fails with null base_price', async () => {
      try {
        await pool.query(`
          INSERT INTO offerings (
            tenant_id, name, description, category, subcategory,
            base_price, currency, duration_minutes, is_active, 
            display_order, tags, images, offering_type
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'service')
        `, [
          tenantId, 'Test Service', 'Test description', 'hair', null,
          null, 'USD', 60, true, 0, '[]', '[]'
        ]);
        expect.fail('Should have thrown constraint violation');
      } catch (error: any) {
        expect(error.code).toBe('23502'); // NOT NULL constraint violation
        expect(error.column).toBe('base_price');
      }
    });

    test('Service creation fails with null display_order', async () => {
      try {
        await pool.query(`
          INSERT INTO offerings (
            tenant_id, name, description, category, subcategory,
            base_price, currency, duration_minutes, is_active, 
            display_order, tags, images, offering_type
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'service')
        `, [
          tenantId, 'Test Service', 'Test description', 'hair', null,
          100, 'USD', 60, true, null, '[]', '[]'
        ]);
        expect.fail('Should have thrown constraint violation');
      } catch (error: any) {
        expect(error.code).toBe('23502'); // NOT NULL constraint violation
        expect(error.column).toBe('display_order');
      }
    });

    test('Service creation succeeds with valid data', async () => {
      const result = await pool.query(`
        INSERT INTO offerings (
          tenant_id, name, description, category, subcategory,
          base_price, currency, duration_minutes, is_active, 
          display_order, tags, images, offering_type
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'service')
        RETURNING id
      `, [
        tenantId, 'Valid Test Service', 'Valid description', 'hair', null,
        100, 'USD', 60, true, 0, '[]', '[]'
      ]);
      
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].id).toBeDefined();
      
      // Clean up
      await pool.query('DELETE FROM offerings WHERE id = $1', [result.rows[0].id]);
    });
  });

  describe('Staff Table Constraints', () => {
    test('Staff creation fails with null name', async () => {
      try {
        await pool.query(`
          INSERT INTO staff (
            tenant_id, name, role, email, phone, working_days, 
            working_hours, specializations, is_active
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          tenantId, null, 'stylist', 'test@example.com', '1234567890',
          '[]', '{}', '[]', true
        ]);
        expect.fail('Should have thrown constraint violation');
      } catch (error: any) {
        expect(error.code).toBe('23502'); // NOT NULL constraint violation
        expect(error.column).toBe('name');
      }
    });

    test('Staff creation fails with null role', async () => {
      try {
        await pool.query(`
          INSERT INTO staff (
            tenant_id, name, role, email, phone, working_days, 
            working_hours, specializations, is_active
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          tenantId, 'Test Staff', null, 'test@example.com', '1234567890',
          '[]', '{}', '[]', true
        ]);
        expect.fail('Should have thrown constraint violation');
      } catch (error: any) {
        expect(error.code).toBe('23502'); // NOT NULL constraint violation
        expect(error.column).toBe('role');
      }
    });

    test('Staff creation succeeds with valid data', async () => {
      const result = await pool.query(`
        INSERT INTO staff (
          tenant_id, name, role, email, phone, working_days, 
          working_hours, specializations, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
      `, [
        tenantId, 'Valid Test Staff', 'stylist', 'test@example.com', '1234567890',
        '[]', '{}', '[]', true
      ]);
      
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].id).toBeDefined();
      
      // Clean up
      await pool.query('DELETE FROM staff WHERE id = $1', [result.rows[0].id]);
    });
  });

  describe('Appointments Table Constraints', () => {
    test('Appointment creation fails with null customer_name', async () => {
      try {
        await pool.query(`
          INSERT INTO appointments (
            tenant_id, customer_name, customer_phone, customer_email,
            service_id, staff_id, scheduled_at, duration_minutes,
            amount, currency, payment_status, notes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `, [
          tenantId, null, '1234567890', 'test@example.com',
          'test-service-id', 'test-staff-id', new Date(), 60,
          100, 'USD', 'pending', 'Test notes'
        ]);
        expect.fail('Should have thrown constraint violation');
      } catch (error: any) {
        expect(error.code).toBe('23502'); // NOT NULL constraint violation
        expect(error.column).toBe('customer_name');
      }
    });

    test('Appointment creation fails with null scheduled_at', async () => {
      try {
        await pool.query(`
          INSERT INTO appointments (
            tenant_id, customer_name, customer_phone, customer_email,
            service_id, staff_id, scheduled_at, duration_minutes,
            amount, currency, payment_status, notes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `, [
          tenantId, 'Test Customer', '1234567890', 'test@example.com',
          'test-service-id', 'test-staff-id', null, 60,
          100, 'USD', 'pending', 'Test notes'
        ]);
        expect.fail('Should have thrown constraint violation');
      } catch (error: any) {
        expect(error.code).toBe('23502'); // NOT NULL constraint violation
        expect(error.column).toBe('scheduled_at');
      }
    });
  });

  describe('Data Type Validation', () => {
    test('Service base_price must be numeric', async () => {
      try {
        await pool.query(`
          INSERT INTO offerings (
            tenant_id, name, description, category, subcategory,
            base_price, currency, duration_minutes, is_active, 
            display_order, tags, images, offering_type
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'service')
        `, [
          tenantId, 'Test Service', 'Test description', 'hair', null,
          'invalid-price', 'USD', 60, true, 0, '[]', '[]'
        ]);
        expect.fail('Should have thrown data type error');
      } catch (error: any) {
        expect(error.code).toBe('22P02'); // Invalid input syntax
      }
    });

    test('Service duration_minutes must be integer', async () => {
      try {
        await pool.query(`
          INSERT INTO offerings (
            tenant_id, name, description, category, subcategory,
            base_price, currency, duration_minutes, is_active, 
            display_order, tags, images, offering_type
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'service')
        `, [
          tenantId, 'Test Service', 'Test description', 'hair', null,
          100, 'USD', 'invalid-duration', true, 0, '[]', '[]'
        ]);
        expect.fail('Should have thrown data type error');
      } catch (error: any) {
        expect(error.code).toBe('22P02'); // Invalid input syntax
      }
    });
  });

  describe('Foreign Key Constraints', () => {
    test('Service creation fails with invalid tenant_id', async () => {
      try {
        await pool.query(`
          INSERT INTO offerings (
            tenant_id, name, description, category, subcategory,
            base_price, currency, duration_minutes, is_active, 
            display_order, tags, images, offering_type
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'service')
        `, [
          'invalid-tenant-id', 'Test Service', 'Test description', 'hair', null,
          100, 'USD', 60, true, 0, '[]', '[]'
        ]);
        expect.fail('Should have thrown foreign key constraint violation');
      } catch (error: any) {
        expect(error.code).toBe('23503'); // Foreign key constraint violation
      }
    });
  });
});
