#!/usr/bin/env node

/**
 * Script to create test data for comprehensive testing
 */

import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function createTestData() {
  try {
    console.log('🔧 Creating test data for comprehensive testing...');
    
    // Get tenant ID
    const tenantResult = await pool.query(`
      SELECT id FROM tenants WHERE domain = $1 OR business_name = $2
    `, ['bella-salon', 'Bella Salon']);
    
    const tenantId = tenantResult.rows[0]?.id;
    if (!tenantId) {
      console.error('❌ Tenant not found');
      return;
    }
    
    console.log('✅ Found tenant:', tenantId);
    
    // Get first service and staff
    const serviceResult = await pool.query(`
      SELECT id, name FROM offerings WHERE tenant_id = $1 AND offering_type = 'service' LIMIT 1
    `, [tenantId]);
    
    const staffResult = await pool.query(`
      SELECT id, name FROM staff WHERE tenant_id = $1 LIMIT 1
    `, [tenantId]);
    
    if (serviceResult.rows.length === 0 || staffResult.rows.length === 0) {
      console.error('❌ No service or staff found');
      return;
    }
    
    const service = serviceResult.rows[0];
    const staff = staffResult.rows[0];
    
    console.log('✅ Found service:', service.name);
    console.log('✅ Found staff:', staff.name);
    
    // Create test appointments with different statuses
    const testAppointments = [
      {
        customer_name: 'Test Customer Checked-in',
        customer_phone: '9876543210',
        customer_email: 'checkedin@example.com',
        service_id: service.id,
        staff_id: staff.id,
        scheduled_at: new Date().toISOString(),
        duration_minutes: 60,
        amount: 500,
        currency: 'INR',
        payment_status: 'checked-in',
        notes: 'Test checked-in appointment'
      },
      {
        customer_name: 'Test Customer Pending',
        customer_phone: '9876543211',
        customer_email: 'pending@example.com',
        service_id: service.id,
        staff_id: staff.id,
        scheduled_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
        duration_minutes: 60,
        amount: 500,
        currency: 'INR',
        payment_status: 'pending',
        notes: 'Test pending appointment'
      },
      {
        customer_name: 'Test Customer Completed',
        customer_phone: '9876543212',
        customer_email: 'completed@example.com',
        service_id: service.id,
        staff_id: staff.id,
        scheduled_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
        duration_minutes: 60,
        amount: 750,
        currency: 'INR',
        payment_status: 'completed',
        notes: 'Test completed appointment'
      }
    ];
    
    for (const appointment of testAppointments) {
      try {
        const result = await pool.query(`
          INSERT INTO transactions (
            tenant_id, transaction_type, customer_name, customer_phone, customer_email,
            offering_id, staff_id, scheduled_at, duration_minutes,
            amount, currency, notes, payment_status
          ) VALUES ($1, 'booking', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          RETURNING id, customer_name, payment_status
        `, [
          tenantId,
          appointment.customer_name,
          appointment.customer_phone,
          appointment.customer_email,
          appointment.service_id,
          appointment.staff_id,
          appointment.scheduled_at,
          appointment.duration_minutes,
          appointment.amount,
          appointment.currency,
          appointment.notes,
          appointment.payment_status
        ]);
        
        console.log(`✅ Created ${appointment.payment_status} appointment: ${result.rows[0].customer_name}`);
      } catch (error) {
        console.error(`❌ Failed to create ${appointment.payment_status} appointment:`, error.message);
      }
    }
    
    console.log('🎉 Test data creation completed!');
    
  } catch (error) {
    console.error('❌ Error creating test data:', error);
  } finally {
    await pool.end();
  }
}

createTestData();
