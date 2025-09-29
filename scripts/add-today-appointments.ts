/**
 * Script to add appointments for today and update staff with Indian data
 */

import { Pool } from '@neondatabase/serverless';
import ws from "ws";

// Database connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function addTodayAppointments() {
  try {
    console.log('📅 Adding appointments for today and updating staff...');

    // Get tenant ID
    const tenantResult = await pool.query('SELECT id FROM tenants WHERE domain = $1', ['bella-salon']);
    const tenantId = tenantResult.rows[0]?.id;
    
    if (!tenantId) {
      throw new Error('Tenant not found');
    }

    // Get service IDs
    const servicesResult = await pool.query(`
      SELECT id, name, base_price FROM offerings 
      WHERE tenant_id = $1 AND offering_type = 'service'
    `, [tenantId]);
    
    const services = servicesResult.rows;
    console.log(`📋 Found ${services.length} services`);

    // Indian customer data for today's appointments
    const todayAppointments = [
      {
        customer_name: "Priya Sharma",
        customer_phone: "919876543210",
        customer_email: "priya.sharma@email.com",
        service_name: "Hai cut",
        amount: "3375",
        time: "10:00"
      },
      {
        customer_name: "Rajesh Kumar", 
        customer_phone: "918765432109",
        customer_email: "rajesh.kumar@email.com",
        service_name: "test 2",
        amount: "2250",
        time: "11:30"
      },
      {
        customer_name: "Sunita Patel",
        customer_phone: "917654321098", 
        customer_email: "sunita.patel@email.com",
        service_name: "test service 30",
        amount: "4500",
        time: "14:00"
      },
      {
        customer_name: "Amit Singh",
        customer_phone: "916543210987",
        customer_email: "amit.singh@email.com", 
        service_name: "Hai cut",
        amount: "3375",
        time: "15:30"
      },
      {
        customer_name: "Kavita Reddy",
        customer_phone: "915432109876",
        customer_email: "kavita.reddy@email.com",
        service_name: "test 2", 
        amount: "2250",
        time: "16:45"
      }
    ];

    // Get today's date
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    console.log(`📅 Adding appointments for: ${today}`);

    // Add appointments for today
    for (const appointment of todayAppointments) {
      // Find the service ID
      const service = services.find(s => s.name === appointment.service_name);
      if (!service) {
        console.log(`⚠️ Service not found: ${appointment.service_name}`);
        continue;
      }

      // Create scheduled_at datetime
      const scheduledAt = `${today}T${appointment.time}:00.000Z`;

      await pool.query(`
        INSERT INTO transactions (
          tenant_id, transaction_type, customer_name, customer_phone, customer_email,
          offering_id, scheduled_at, duration_minutes, amount, currency, 
          payment_status, notes
        ) VALUES ($1, 'booking', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
        tenantId,
        appointment.customer_name,
        appointment.customer_phone, 
        appointment.customer_email,
        service.id,
        scheduledAt,
        60, // duration_minutes
        appointment.amount,
        'INR',
        'confirmed',
        'Appointment for today'
      ]);

      console.log(`✅ Added appointment: ${appointment.customer_name} - ${appointment.service_name} at ${appointment.time}`);
    }

    // Update staff with Indian names and phone numbers
    console.log('👥 Updating staff with Indian data...');
    
    const indianStaff = [
      { name: "Priya Sharma", phone: "919876543210", role: "stylist" },
      { name: "Rajesh Kumar", phone: "918765432109", role: "stylist" },
      { name: "Sunita Patel", phone: "917654321098", role: "stylist" },
      { name: "Amit Singh", phone: "916543210987", role: "stylist" },
      { name: "Kavita Reddy", phone: "915432109876", role: "manager" }
    ];

    const staffResult = await pool.query('SELECT id, name, phone FROM staff ORDER BY created_at LIMIT 5');
    
    for (let i = 0; i < staffResult.rows.length && i < indianStaff.length; i++) {
      const staff = staffResult.rows[i];
      const indianStaffMember = indianStaff[i];
      
      await pool.query(`
        UPDATE staff 
        SET name = $1, phone = $2, role = $3
        WHERE id = $4
      `, [indianStaffMember.name, indianStaffMember.phone, indianStaffMember.role, staff.id]);
      
      console.log(`✅ Updated staff: ${staff.name} → ${indianStaffMember.name} - ${indianStaffMember.phone}`);
    }

    console.log('🎉 Today appointments and staff updates completed!');
    console.log('📊 Summary:');
    console.log(`   - Added ${todayAppointments.length} appointments for today (${today})`);
    console.log(`   - Updated ${staffResult.rows.length} staff members with Indian data`);

  } catch (error) {
    console.error('❌ Error adding today appointments:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the script
addTodayAppointments()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
