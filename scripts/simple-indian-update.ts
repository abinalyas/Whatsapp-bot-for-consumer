/**
 * Simple script to update existing database data for Indian localization
 * - Updates service prices to Indian market rates
 * - Updates existing bookings with Indian phone numbers
 */

import { Pool } from '@neondatabase/serverless';
import ws from "ws";

// Database connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function simpleIndianUpdate() {
  try {
    console.log('🇮🇳 Starting simple Indian data update...');

    // 1. Check what tables exist
    console.log('📋 Checking database structure...');
    
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('📊 Available tables:', tablesResult.rows.map(r => r.table_name));

    // 2. Check services table structure
    const servicesColumns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'services'
    `);
    
    console.log('📝 Services table columns:', servicesColumns.rows);

    // 3. Update existing services with Indian prices
    if (servicesColumns.rows.length > 0) {
      console.log('💰 Updating service prices to Indian market rates...');
      
      // Get current services
      const currentServices = await pool.query('SELECT id, name, price FROM services LIMIT 10');
      console.log('📋 Current services:', currentServices.rows);

      // Update prices to Indian rates (multiply by ~10 for USD to INR conversion)
      await pool.query(`
        UPDATE services 
        SET price = price * 10
        WHERE price < 1000
      `);
      
      console.log('✅ Updated service prices to Indian rates');
    }

    // 4. Check bookings table
    const bookingsColumns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'bookings'
    `);
    
    if (bookingsColumns.rows.length > 0) {
      console.log('📱 Updating bookings with Indian phone numbers...');
      
      // Get current bookings
      const currentBookings = await pool.query('SELECT id, phone_number, customer_name FROM bookings LIMIT 5');
      console.log('📋 Current bookings:', currentBookings.rows);

      // Update with Indian phone numbers
      const indianPhones = [
        '919876543210', '918765432109', '917654321098', 
        '916543210987', '915432109876'
      ];
      
      const indianNames = [
        'Priya Sharma', 'Rajesh Kumar', 'Sunita Patel', 
        'Amit Singh', 'Kavita Reddy'
      ];

      for (let i = 0; i < Math.min(currentBookings.rows.length, indianPhones.length); i++) {
        const booking = currentBookings.rows[i];
        await pool.query(`
          UPDATE bookings 
          SET phone_number = $1, customer_name = $2, amount = amount * 10
          WHERE id = $3
        `, [indianPhones[i], indianNames[i], booking.id]);
        
        console.log(`✅ Updated booking ${booking.id} with ${indianNames[i]} - ${indianPhones[i]}`);
      }
    }

    console.log('🎉 Simple Indian data update completed!');

  } catch (error) {
    console.error('❌ Error updating Indian data:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the update
simpleIndianUpdate()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
