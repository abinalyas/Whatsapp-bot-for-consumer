/**
 * Script to fix appointments with proper Indian customer names and phone numbers
 */

import { Pool } from '@neondatabase/serverless';
import ws from "ws";

// Database connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function fixAppointments() {
  try {
    console.log('🔧 Fixing appointments with Indian data...');

    // Indian customer data
    const indianCustomers = [
      { name: "Priya Sharma", phone: "919876543210" },
      { name: "Rajesh Kumar", phone: "918765432109" },
      { name: "Sunita Patel", phone: "917654321098" },
      { name: "Amit Singh", phone: "916543210987" },
      { name: "Kavita Reddy", phone: "915432109876" },
      { name: "Deepika Sharma", phone: "914321098765" },
      { name: "Arjun Gupta", phone: "913210987654" },
      { name: "Sneha Joshi", phone: "912109876543" },
      { name: "Vikram Mehta", phone: "911098765432" },
      { name: "Anita Desai", phone: "910987654321" }
    ];

    // Get all bookings
    const bookingsResult = await pool.query('SELECT id, customer_name, phone_number, amount FROM bookings ORDER BY created_at DESC');
    console.log(`📋 Found ${bookingsResult.rows.length} bookings`);

    // Update each booking with Indian data
    for (let i = 0; i < bookingsResult.rows.length; i++) {
      const booking = bookingsResult.rows[i];
      const customer = indianCustomers[i % indianCustomers.length]; // Cycle through customers
      
      await pool.query(`
        UPDATE bookings 
        SET customer_name = $1, phone_number = $2, amount = $3
        WHERE id = $4
      `, [customer.name, customer.phone, Math.max(300, Math.floor(Math.random() * 1500) + 300), booking.id]);
      
      console.log(`✅ Updated booking ${booking.id}: ${customer.name} - ${customer.phone}`);
    }

    // Also update conversations with Indian names
    const conversationsResult = await pool.query('SELECT id, customer_name, phone_number FROM conversations ORDER BY created_at DESC');
    console.log(`💬 Found ${conversationsResult.rows.length} conversations`);

    for (let i = 0; i < conversationsResult.rows.length; i++) {
      const conversation = conversationsResult.rows[i];
      const customer = indianCustomers[i % indianCustomers.length];
      
      await pool.query(`
        UPDATE conversations 
        SET customer_name = $1, phone_number = $2
        WHERE id = $3
      `, [customer.name, customer.phone, conversation.id]);
      
      console.log(`✅ Updated conversation ${conversation.id}: ${customer.name} - ${customer.phone}`);
    }

    console.log('🎉 Appointments fixed successfully!');

  } catch (error) {
    console.error('❌ Error fixing appointments:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the fix
fixAppointments()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
