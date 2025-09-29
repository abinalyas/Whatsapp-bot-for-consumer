import { Router } from 'express';
import { Pool } from '@neondatabase/serverless';

const router = Router();

// Initialize database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Get all staff members
router.get('/staff', async (req, res) => {
  try {
    // Get the correct tenant ID from the database
    const tenantResult = await pool.query(`
      SELECT id FROM tenants WHERE domain = $1 OR business_name = $2
    `, [req.headers['x-tenant-id'] || 'bella-salon', 'Bella Salon']);
    
    const tenantId = tenantResult.rows[0]?.id;
    if (!tenantId) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found'
      });
    }

    const result = await pool.query(`
      SELECT 
        s.id, s.name, s.email, s.phone, s.role, s.specializations,
        s.working_hours, s.working_days, s.hourly_rate, s.commission_rate, s.is_active,
        s.hire_date, s.notes, s.avatar_url, s.created_at, s.updated_at,
        COUNT(t.id) as total_appointments,
        COUNT(CASE WHEN t.scheduled_at >= CURRENT_DATE THEN t.id END) as upcoming_appointments
      FROM staff s
      LEFT JOIN transactions t ON s.id = t.staff_id AND t.transaction_type = 'booking'
      WHERE s.tenant_id = $1
      GROUP BY s.id, s.name, s.email, s.phone, s.role, s.specializations,
               s.working_hours, s.working_days, s.hourly_rate, s.commission_rate, s.is_active,
               s.hire_date, s.notes, s.avatar_url, s.created_at, s.updated_at
      ORDER BY s.name
    `, [tenantId]);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch staff'
    });
  }
});

// Create new staff member
router.post('/staff', async (req, res) => {
  try {
    // Get the correct tenant ID from the database
    const tenantResult = await pool.query(`
      SELECT id FROM tenants WHERE domain = $1 OR business_name = $2
    `, [req.headers['x-tenant-id'] || 'bella-salon', 'Bella Salon']);
    
    const tenantId = tenantResult.rows[0]?.id;
    if (!tenantId) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found'
      });
    }

    const {
      name, email, phone, role, specializations, working_hours,
      hourly_rate, commission_rate, hire_date, notes, avatar_url
    } = req.body;
    
    // Ensure specializations and working_hours are properly formatted JSON
    const formattedSpecializations = Array.isArray(specializations) ? specializations : [];
    const formattedWorkingHours = typeof working_hours === 'object' ? working_hours : {};
    
    const result = await pool.query(`
      INSERT INTO staff (
        tenant_id, name, email, phone, role, specializations,
        working_hours, hourly_rate, commission_rate, hire_date, notes, avatar_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      tenantId,
      name, email, phone, role, JSON.stringify(formattedSpecializations), JSON.stringify(formattedWorkingHours),
      hourly_rate, commission_rate, hire_date, notes, avatar_url
    ]);
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating staff:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create staff member'
    });
  }
});

// Update staff member
router.put('/staff/:id', async (req, res) => {
  try {
    // Get the correct tenant ID from the database
    const tenantResult = await pool.query(`
      SELECT id FROM tenants WHERE domain = $1 OR business_name = $2
    `, [req.headers['x-tenant-id'] || 'bella-salon', 'Bella Salon']);
    
    const tenantId = tenantResult.rows[0]?.id;
    if (!tenantId) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found'
      });
    }

    const { id } = req.params;
    const {
      name, email, phone, role, specializations, working_hours, working_days,
      hourly_rate, commission_rate, is_active, notes, avatar_url
    } = req.body;
    
    // Ensure specializations and working_hours are properly formatted JSON
    const formattedSpecializations = Array.isArray(specializations) ? specializations : [];
    const formattedWorkingHours = typeof working_hours === 'object' ? working_hours : {};
    
    // Handle working_days - store as JSON array in a separate column or merge with working_hours
    // For now, we'll store it as a separate JSONB field
    const formattedWorkingDays = Array.isArray(working_days) ? working_days : [];
    
    const result = await pool.query(`
      UPDATE staff SET
        name = $2, email = $3, phone = $4, role = $5, specializations = $6,
        working_hours = $7, working_days = $8, hourly_rate = $9, commission_rate = $10,
        is_active = $11, notes = $12, avatar_url = $13, updated_at = NOW()
      WHERE id = $1 AND tenant_id = $14
      RETURNING *
    `, [
      id, name, email, phone, role, JSON.stringify(formattedSpecializations), 
      JSON.stringify(formattedWorkingHours), JSON.stringify(formattedWorkingDays),
      hourly_rate, commission_rate, is_active, notes, avatar_url, tenantId
    ]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Staff member not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating staff:', error);
    console.error('Error details:', error.message);
    console.error('Request body:', req.body);
    console.error('Staff ID:', req.params.id);
    res.status(500).json({
      success: false,
      error: 'Failed to update staff member',
      details: error.message
    });
  }
});

// Delete staff member
router.delete('/staff/:id', async (req, res) => {
  try {
    // Get the correct tenant ID from the database
    const tenantResult = await pool.query(`
      SELECT id FROM tenants WHERE domain = $1 OR business_name = $2
    `, [req.headers['x-tenant-id'] || 'bella-salon', 'Bella Salon']);
    
    const tenantId = tenantResult.rows[0]?.id;
    if (!tenantId) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found'
      });
    }

    const { id } = req.params;
    
    const result = await pool.query(`
      DELETE FROM staff 
      WHERE id = $1 AND tenant_id = $2
      RETURNING id
    `, [id, tenantId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Staff member not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Staff member deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting staff:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete staff member'
    });
  }
});

// Get staff availability
router.get('/staff/:id/availability', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT day_of_week, start_time, end_time, is_available, 
             break_start_time, break_end_time, max_appointments
      FROM staff_availability 
      WHERE staff_id = $1
      ORDER BY day_of_week, start_time
    `, [id]);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching staff availability:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch staff availability'
    });
  }
});

// Update staff availability
router.put('/staff/:id/availability', async (req, res) => {
  try {
    const { id } = req.params;
    const { availability } = req.body; // Array of availability objects
    
    // Delete existing availability
    await pool.query('DELETE FROM staff_availability WHERE staff_id = $1', [id]);
    
    // Insert new availability
    for (const avail of availability) {
      await pool.query(`
        INSERT INTO staff_availability (
          staff_id, day_of_week, start_time, end_time, is_available,
          break_start_time, break_end_time, max_appointments
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        id, avail.day_of_week, avail.start_time, avail.end_time, avail.is_available,
        avail.break_start_time, avail.break_end_time, avail.max_appointments
      ]);
    }
    
    res.json({
      success: true,
      message: 'Staff availability updated successfully'
    });
  } catch (error) {
    console.error('Error updating staff availability:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update staff availability'
    });
  }
});

// Get staff appointments
router.get('/staff/:id/appointments', async (req, res) => {
  try {
    const { id } = req.params;
    const { date, status } = req.query;
    
    let query = `
      SELECT 
        t.id, t.transaction_number, t.customer_name, t.customer_phone, t.customer_email,
        t.scheduled_at, t.duration_minutes, t.amount, t.currency, t.payment_status,
        t.notes, t.created_at, t.updated_at,
        o.name as service_name, o.category as service_category
      FROM transactions t
      LEFT JOIN offerings o ON t.offering_id = o.id
      WHERE t.staff_id = $1 AND t.transaction_type = 'booking'
    `;
    
    const params = [id];
    let paramIndex = 2;
    
    if (date) {
      query += ` AND DATE(t.scheduled_at) = $${paramIndex}`;
      params.push(date as string);
      paramIndex++;
    }
    
    if (status) {
      query += ` AND t.payment_status = $${paramIndex}`;
      params.push(status as string);
      paramIndex++;
    }
    
    query += ` ORDER BY t.scheduled_at ASC`;
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching staff appointments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch staff appointments'
    });
  }
});

// Get available time slots for a staff member on a specific date
router.get('/staff/:id/available-slots', async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        error: 'Date parameter is required'
      });
    }
    
    const appointmentDate = new Date(date as string);
    const dayOfWeek = appointmentDate.getDay();
    
    // Get staff availability for this day
    const availabilityResult = await pool.query(`
      SELECT start_time, end_time, break_start_time, break_end_time, max_appointments
      FROM staff_availability 
      WHERE staff_id = $1 AND day_of_week = $2 AND is_available = true
    `, [id, dayOfWeek]);
    
    if (availabilityResult.rows.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }
    
    const availability = availabilityResult.rows[0];
    
    // Get existing appointments for this date
    const appointmentsResult = await pool.query(`
      SELECT scheduled_at, duration_minutes
      FROM transactions 
      WHERE staff_id = $1 AND DATE(scheduled_at) = $2 AND transaction_type = 'booking'
      ORDER BY scheduled_at
    `, [id, date]);
    
    // Generate available time slots
    const slots = [];
    const startTime = new Date(`${date}T${availability.start_time}`);
    const endTime = new Date(`${date}T${availability.end_time}`);
    const breakStart = availability.break_start_time ? new Date(`${date}T${availability.break_start_time}`) : null;
    const breakEnd = availability.break_end_time ? new Date(`${date}T${availability.break_end_time}`) : null;
    
    // 30-minute intervals
    const interval = 30 * 60 * 1000; // 30 minutes in milliseconds
    let currentTime = new Date(startTime);
    
    while (currentTime < endTime) {
      const slotEnd = new Date(currentTime.getTime() + interval);
      
      // Check if slot is during break
      const isDuringBreak = breakStart && breakEnd && 
        currentTime >= breakStart && currentTime < breakEnd;
      
      if (!isDuringBreak) {
        // Check if slot conflicts with existing appointments
        const hasConflict = appointmentsResult.rows.some(appointment => {
          const appointmentStart = new Date(appointment.scheduled_at);
          const appointmentEnd = new Date(appointmentStart.getTime() + (appointment.duration_minutes * 60 * 1000));
          return (currentTime < appointmentEnd && slotEnd > appointmentStart);
        });
        
        if (!hasConflict) {
          slots.push({
            start_time: currentTime.toISOString(),
            end_time: slotEnd.toISOString(),
            formatted_time: currentTime.toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit',
              hour12: true 
            })
          });
        }
      }
      
      currentTime = new Date(currentTime.getTime() + interval);
    }
    
    res.json({
      success: true,
      data: slots
    });
  } catch (error) {
    console.error('Error fetching available slots:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch available slots'
    });
  }
});

// Get staff dashboard stats
router.get('/staff/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    const { period = '30' } = req.query; // days
    
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_appointments,
        COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as completed_appointments,
        COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN amount ELSE 0 END), 0) as total_revenue,
        COALESCE(AVG(CASE WHEN payment_status = 'paid' THEN amount ELSE NULL END), 0) as average_appointment_value,
        COUNT(CASE WHEN scheduled_at >= CURRENT_DATE THEN 1 END) as upcoming_appointments
      FROM transactions 
      WHERE staff_id = $1 
        AND transaction_type = 'booking'
        AND scheduled_at >= CURRENT_DATE - INTERVAL '${period} days'
    `, [id]);
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching staff stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch staff stats'
    });
  }
});

export default router;
