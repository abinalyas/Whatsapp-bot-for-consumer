import { Pool } from '@neondatabase/serverless';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function updateAppointmentsWithStaff() {
  try {
    console.log('🔄 Starting to update appointments with staff IDs...');
    
    // Get all staff members
    const staffResult = await pool.query(`
      SELECT id, name FROM staff WHERE tenant_id = (
        SELECT id FROM tenants WHERE domain = 'bella-salon' OR business_name = 'Bella Salon'
      )
    `);
    
    const staff = staffResult.rows;
    console.log('👥 Available staff:', staff.map(s => `${s.name} (${s.id})`));
    
    // Get all appointments with null staff_id
    const appointmentsResult = await pool.query(`
      SELECT id, customer_name, staff_id 
      FROM transactions 
      WHERE tenant_id = (
        SELECT id FROM tenants WHERE domain = 'bella-salon' OR business_name = 'Bella Salon'
      ) 
      AND transaction_type = 'booking' 
      AND staff_id IS NULL
    `);
    
    const appointments = appointmentsResult.rows;
    console.log(`📅 Found ${appointments.length} appointments without staff assignment`);
    
    // Assign staff members to appointments
    const updates = [];
    
    for (let i = 0; i < appointments.length; i++) {
      const appointment = appointments[i];
      // Assign staff in a round-robin fashion
      const staffIndex = i % staff.length;
      const assignedStaff = staff[staffIndex];
      
      updates.push({
        appointmentId: appointment.id,
        customerName: appointment.customer_name,
        staffId: assignedStaff.id,
        staffName: assignedStaff.name
      });
    }
    
    // Update appointments with staff IDs
    for (const update of updates) {
      await pool.query(`
        UPDATE transactions 
        SET staff_id = $1, updated_at = NOW()
        WHERE id = $2
      `, [update.staffId, update.appointmentId]);
      
      console.log(`✅ Assigned ${update.staffName} to ${update.customerName}'s appointment`);
    }
    
    console.log(`🎉 Successfully updated ${updates.length} appointments with staff assignments!`);
    
    // Verify the updates
    const verifyResult = await pool.query(`
      SELECT t.id, t.customer_name, t.staff_id, s.name as staff_name
      FROM transactions t
      LEFT JOIN staff s ON t.staff_id = s.id
      WHERE t.tenant_id = (
        SELECT id FROM tenants WHERE domain = 'bella-salon' OR business_name = 'Bella Salon'
      ) 
      AND t.transaction_type = 'booking'
      ORDER BY t.scheduled_at DESC
      LIMIT 10
    `);
    
    console.log('🔍 Verification - Recent appointments:');
    verifyResult.rows.forEach(apt => {
      console.log(`  ${apt.customer_name} → ${apt.staff_name || 'Unassigned'} (${apt.staff_id})`);
    });
    
  } catch (error) {
    console.error('❌ Error updating appointments:', error);
  } finally {
    await pool.end();
  }
}

updateAppointmentsWithStaff();
