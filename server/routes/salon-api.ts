import { Router } from 'express';
import { Pool } from '@neondatabase/serverless';

const router = Router();

// Initialize database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Get salon services (offerings)
router.get('/services', async (req, res) => {
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
        id, name, description, category, subcategory, 
        base_price, currency, duration_minutes, 
        is_active, display_order, tags, images
      FROM offerings 
      WHERE tenant_id = $1 AND offering_type = 'service'
      ORDER BY display_order, name
    `, [tenantId]);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch services'
    });
  }
});

// Create new service
router.post('/services', async (req, res) => {
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
      name, description, category, subcategory, 
      base_price, currency = 'USD', duration_minutes, 
      is_active = true, display_order = 0, tags = [], images = []
    } = req.body;
    
    const result = await pool.query(`
      INSERT INTO offerings (
        tenant_id, name, description, category, subcategory,
        base_price, currency, duration_minutes, is_active, 
        display_order, tags, images, offering_type
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'service')
      RETURNING *
    `, [
      tenantId,
      name, description, category, subcategory,
      base_price, currency, duration_minutes, is_active,
      display_order, tags, images
    ]);
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create service'
    });
  }
});

// Update service
router.put('/services/:id', async (req, res) => {
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
      name, description, category, subcategory, 
      base_price, currency, duration_minutes, 
      is_active, display_order, tags, images
    } = req.body;
    
    const result = await pool.query(`
      UPDATE offerings SET
        name = $2, description = $3, category = $4, subcategory = $5,
        base_price = $6, currency = $7, duration_minutes = $8,
        is_active = $9, display_order = $10, tags = $11, images = $12,
        updated_at = NOW()
      WHERE id = $1 AND tenant_id = $13
      RETURNING *
    `, [
      id, name, description, category, subcategory,
      base_price, currency, duration_minutes, is_active,
      display_order, tags, images, tenantId
    ]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Service not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update service'
    });
  }
});

// Delete service
router.delete('/services/:id', async (req, res) => {
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
      DELETE FROM offerings 
      WHERE id = $1 AND tenant_id = $2
      RETURNING id
    `, [id, tenantId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Service not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete service'
    });
  }
});

// Get salon appointments (transactions)
router.get('/appointments', async (req, res) => {
  try {
    const { date, status } = req.query;
    
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
    
    let query = `
      SELECT 
        t.id, t.transaction_number, t.customer_name, t.customer_phone, t.customer_email,
        t.scheduled_at, t.duration_minutes, t.amount, t.currency, t.payment_status,
        t.payment_method, t.notes, t.created_at, t.updated_at,
        o.name as service_name, o.category as service_category
      FROM transactions t
      LEFT JOIN offerings o ON t.offering_id = o.id
      WHERE t.tenant_id = $1 AND t.transaction_type = 'booking'
    `;
    
    const params = [tenantId];
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
    
    query += ` ORDER BY t.scheduled_at DESC`;
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch appointments'
    });
  }
});

// Create new appointment
router.post('/appointments', async (req, res) => {
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
      customer_name, customer_phone, customer_email,
      service_id, scheduled_at, duration_minutes,
      amount, currency, notes
    } = req.body;
    
    const result = await pool.query(`
      INSERT INTO transactions (
        tenant_id, transaction_type, customer_name, customer_phone, customer_email,
        offering_id, scheduled_at, duration_minutes, amount, currency, notes
      ) VALUES ($1, 'booking', $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      tenantId,
      customer_name, customer_phone, customer_email,
      service_id, scheduled_at, duration_minutes,
      amount, currency, notes
    ]);
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create appointment'
    });
  }
});

// Update appointment
router.put('/appointments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      customer_name, customer_phone, customer_email,
      service_id, scheduled_at, duration_minutes,
      amount, currency, notes, payment_status
    } = req.body;
    
    const result = await pool.query(`
      UPDATE transactions SET
        customer_name = $2, customer_phone = $3, customer_email = $4,
        offering_id = $5, scheduled_at = $6, duration_minutes = $7,
        amount = $8, currency = $9, notes = $10, payment_status = $11,
        updated_at = NOW()
      WHERE id = $1 AND tenant_id = $12
      RETURNING *
    `, [
      id, customer_name, customer_phone, customer_email,
      service_id, scheduled_at, duration_minutes,
      amount, currency, notes, payment_status,
      req.headers['x-tenant-id'] || 'default-tenant-id'
    ]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Appointment not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update appointment'
    });
  }
});

// Delete appointment
router.delete('/appointments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      DELETE FROM transactions 
      WHERE id = $1 AND tenant_id = $2
      RETURNING id
    `, [id, req.headers['x-tenant-id'] || 'default-tenant-id']);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Appointment not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Appointment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete appointment'
    });
  }
});

// Get salon dashboard stats
router.get('/stats', async (req, res) => {
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
    
    // Get today's stats
    const today = new Date().toISOString().split('T')[0];
    
    const [todayAppointments, todayRevenue, totalServices] = await Promise.all([
      pool.query(`
        SELECT COUNT(*) as count 
        FROM transactions 
        WHERE tenant_id = $1 AND transaction_type = 'booking' 
        AND DATE(scheduled_at) = $2
      `, [tenantId, today]),
      
      pool.query(`
        SELECT COALESCE(SUM(amount), 0) as total 
        FROM transactions 
        WHERE tenant_id = $1 AND transaction_type = 'booking' 
        AND DATE(scheduled_at) = $2 AND payment_status = 'paid'
      `, [tenantId, today]),
      
      pool.query(`
        SELECT COUNT(*) as count 
        FROM offerings 
        WHERE tenant_id = $1 AND offering_type = 'service' AND is_active = true
      `, [tenantId])
    ]);
    
    res.json({
      success: true,
      data: {
        todayAppointments: parseInt(todayAppointments.rows[0].count),
        todayRevenue: parseFloat(todayRevenue.rows[0].total),
        totalServices: parseInt(totalServices.rows[0].count)
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stats'
    });
  }
});

export default router;
