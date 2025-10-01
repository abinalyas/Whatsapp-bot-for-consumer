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
    const requestedTenant = req.headers['x-tenant-id'];
    const tenantResult = await pool.query(`
      SELECT id FROM tenants WHERE domain = $1 OR business_name = $2
    `, [requestedTenant || 'bella-salon', requestedTenant || 'Bella Salon']);
    
    const tenantId = tenantResult.rows[0]?.id;
    if (!tenantId) {
      console.log('Tenant not found for services:', requestedTenant || 'bella-salon');
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
    
    // Debug logging
    console.log('🔍 Service creation request body:', req.body);
    console.log('🔍 Extracted fields:', { name, base_price });
    
    // Validate required fields
    if (!name || name.trim() === '') {
      console.log('❌ Service creation validation failed: name is empty or missing');
      return res.status(400).json({
        success: false,
        error: 'Service name is required'
      });
    }
    
    if (!base_price || isNaN(parseFloat(base_price))) {
      console.log('❌ Service creation validation failed: base_price is invalid');
      return res.status(400).json({
        success: false,
        error: 'Valid base price is required'
      });
    }
    
    console.log('✅ Service creation validation passed:', { name, base_price });
    
    // Ensure display_order is not null
    const finalDisplayOrder = display_order !== null && display_order !== undefined ? display_order : 0;
    
    // Convert base_price to proper decimal format for database
    const formattedBasePrice = parseFloat(base_price).toFixed(2);
    
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
      formattedBasePrice, currency, duration_minutes, is_active,
      finalDisplayOrder, tags, images
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
    console.log('🔧 Service Update API v2.1.0 - Dynamic Field Update');
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
    
    // Debug logging
    console.log('🔍 Service update request body:', req.body);
    console.log('🔍 Extracted fields:', { name, base_price, currency, is_active, display_order });
    
    // Validate required fields for updates
    if (name !== undefined && (!name || name.trim() === '')) {
      return res.status(400).json({
        success: false,
        error: 'Service name cannot be empty'
      });
    }
    
    if (base_price !== undefined && (!base_price || isNaN(parseFloat(base_price)))) {
      return res.status(400).json({
        success: false,
        error: 'Valid base price is required'
      });
    }
    
    // Handle images field - ensure it's properly formatted JSON
    const formattedImages = Array.isArray(images) ? images : (images ? [images] : []);
    
    // Ensure display_order is not null
    const finalDisplayOrder = display_order !== null && display_order !== undefined ? display_order : 0;
    
    // Ensure currency is not null - default to USD if not provided
    const finalCurrency = currency || 'USD';
    
    // Ensure is_active is not null - default to true if not provided
    const finalIsActive = is_active !== undefined ? is_active : true;
    
    // Convert base_price to proper decimal format for database
    const formattedBasePrice = base_price ? parseFloat(base_price).toFixed(2) : null;
    
    // Build dynamic UPDATE query based on provided fields
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;
    
    // Add id and tenant_id at the end
    updateValues.push(id);
    updateValues.push(tenantId);
    const idParamIndex = paramIndex++;
    const tenantParamIndex = paramIndex++;
    
    // Only update fields that are provided
    if (name !== undefined) {
      updateFields.push(`name = $${paramIndex}`);
      updateValues.splice(paramIndex - 1, 0, name);
      paramIndex++;
    }
    
    if (description !== undefined) {
      updateFields.push(`description = $${paramIndex}`);
      updateValues.splice(paramIndex - 1, 0, description);
      paramIndex++;
    }
    
    if (category !== undefined) {
      updateFields.push(`category = $${paramIndex}`);
      updateValues.splice(paramIndex - 1, 0, category);
      paramIndex++;
    }
    
    if (subcategory !== undefined) {
      updateFields.push(`subcategory = $${paramIndex}`);
      updateValues.splice(paramIndex - 1, 0, subcategory);
      paramIndex++;
    }
    
    if (base_price !== undefined) {
      updateFields.push(`base_price = $${paramIndex}`);
      updateValues.splice(paramIndex - 1, 0, formattedBasePrice);
      paramIndex++;
    }
    
    if (currency !== undefined) {
      updateFields.push(`currency = $${paramIndex}`);
      updateValues.splice(paramIndex - 1, 0, finalCurrency);
      paramIndex++;
    }
    
    if (duration_minutes !== undefined) {
      updateFields.push(`duration_minutes = $${paramIndex}`);
      updateValues.splice(paramIndex - 1, 0, duration_minutes);
      paramIndex++;
    }
    
    if (is_active !== undefined) {
      updateFields.push(`is_active = $${paramIndex}`);
      updateValues.splice(paramIndex - 1, 0, finalIsActive);
      paramIndex++;
    }
    
    if (display_order !== undefined) {
      updateFields.push(`display_order = $${paramIndex}`);
      updateValues.splice(paramIndex - 1, 0, finalDisplayOrder);
      paramIndex++;
    }
    
    if (tags !== undefined) {
      updateFields.push(`tags = $${paramIndex}`);
      updateValues.splice(paramIndex - 1, 0, tags);
      paramIndex++;
    }
    
    if (images !== undefined) {
      updateFields.push(`images = $${paramIndex}`);
      updateValues.splice(paramIndex - 1, 0, JSON.stringify(formattedImages));
      paramIndex++;
    }
    
    // Always update the updated_at timestamp
    updateFields.push(`updated_at = NOW()`);
    
    if (updateFields.length === 1) { // Only updated_at
      return res.status(400).json({
        success: false,
        error: 'No valid fields provided for update'
      });
    }
    
    const result = await pool.query(`
      UPDATE offerings SET
        ${updateFields.join(', ')}
      WHERE id = $${idParamIndex} AND tenant_id = $${tenantParamIndex}
      RETURNING *
    `, updateValues);
    
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
    console.error('Error details:', error.message);
    console.error('Request body:', req.body);
    console.error('Service ID:', req.params.id);
    res.status(500).json({
      success: false,
      error: 'Failed to update service',
      details: error.message
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

// Get specific service by ID
router.get('/services/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
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
      SELECT * FROM offerings 
      WHERE id = $1 AND tenant_id = $2 AND offering_type = 'service'
    `, [id, tenantId]);
    
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
    console.error('Error fetching service:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch service'
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
        t.payment_method, t.notes, t.created_at, t.updated_at, t.staff_id,
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
      service_id, staff_id, scheduled_at, duration_minutes,
      amount, currency = 'INR', notes, payment_status = 'pending'
    } = req.body;
    
    // Validate required fields
    if (!customer_name || !customer_phone || !service_id || !scheduled_at || amount === undefined || amount === null) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: customer_name, customer_phone, service_id, scheduled_at, amount'
      });
    }
    
    // Validate data types
    if (typeof customer_name !== 'string' || typeof customer_phone !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid data types: customer_name and customer_phone must be strings'
      });
    }
    
    // Validate amount is a number
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount < 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid amount: must be a positive number'
      });
    }
    
    // Validate scheduled_at is a valid date
    const scheduledDate = new Date(scheduled_at);
    if (isNaN(scheduledDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid scheduled_at: must be a valid date'
      });
    }
    
    // Validate field lengths
    if (customer_name.length > 200) {
      return res.status(400).json({
        success: false,
        error: 'Customer name too long: maximum 200 characters'
      });
    }
    
    if (customer_phone.length > 20) {
      return res.status(400).json({
        success: false,
        error: 'Customer phone too long: maximum 20 characters'
      });
    }
    
    // Fetch service details to get actual amount and duration if not provided
    let finalAmount = amount;
    let finalDuration = duration_minutes;
    if (service_id) {
      const serviceResult = await pool.query(`
        SELECT base_price, duration_minutes FROM offerings WHERE id = $1 AND tenant_id = $2
      `, [service_id, tenantId]);
      if (serviceResult.rows.length > 0) {
        finalAmount = serviceResult.rows[0].base_price;
        finalDuration = serviceResult.rows[0].duration_minutes;
      }
    }
    
    const result = await pool.query(`
      INSERT INTO transactions (
        tenant_id, transaction_type, customer_name, customer_phone, customer_email,
        offering_id, staff_id, scheduled_at, duration_minutes,
        amount, currency, notes, payment_status
      ) VALUES ($1, 'booking', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      tenantId,
      customer_name, customer_phone, customer_email,
      service_id, staff_id, scheduled_at, finalDuration,
      finalAmount, currency, notes, payment_status
    ]);
    
    res.status(201).json({
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

// Get single appointment
router.get('/appointments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
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
        t.id, t.transaction_number, t.customer_name, t.customer_phone, t.customer_email,
        t.offering_id, t.staff_id, t.scheduled_at, t.duration_minutes,
        t.amount, t.currency, t.notes, t.payment_status, t.transaction_type,
        t.created_at, t.updated_at,
        o.name as service_name, o.category as service_category,
        s.name as staff_name
      FROM transactions t
      LEFT JOIN offerings o ON t.offering_id = o.id
      LEFT JOIN staff s ON t.staff_id = s.id
      WHERE t.id = $1 AND t.tenant_id = $2 AND t.transaction_type = 'booking'
    `, [id, tenantId]);

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
    console.error('Error fetching appointment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch appointment'
    });
  }
});

// Update appointment
router.put('/appointments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      customer_name, customer_phone, customer_email,
      service_id, staff_id, scheduled_at, duration_minutes,
      amount, currency, notes, payment_status
    } = req.body;
    
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
      UPDATE transactions SET
        customer_name = $2, customer_phone = $3, customer_email = $4,
        offering_id = $5, staff_id = $6, scheduled_at = $7, duration_minutes = $8,
        amount = $9, currency = $10, notes = $11, payment_status = $12,
        updated_at = NOW()
      WHERE id = $1 AND tenant_id = $13
      RETURNING *
    `, [
      id, customer_name, customer_phone, customer_email,
      service_id, staff_id, scheduled_at, duration_minutes,
      amount, currency, notes, payment_status, tenantId
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
