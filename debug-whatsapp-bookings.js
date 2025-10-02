/**
 * Debug WhatsApp Bookings
 * Debug why WhatsApp Bot bookings are not being found
 */

import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function debugWhatsAppBookings() {
  console.log('🔍 Debug WhatsApp Bookings');
  console.log('=========================\n');
  
  try {
    // Check all bookings
    console.log('📊 All bookings:');
    const allBookings = await pool.query(`
      SELECT id, customer_name, notes, created_at, appointment_date
      FROM bookings 
      ORDER BY created_at DESC
      LIMIT 10
    `);
    
    console.log(`Found ${allBookings.rows.length} total bookings:`);
    allBookings.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.customer_name} - ${row.notes || 'No notes'} - ${row.created_at}`);
    });
    
    // Check bookings with WhatsApp in notes
    console.log('\n📱 Bookings with WhatsApp in notes:');
    const whatsappBookings = await pool.query(`
      SELECT id, customer_name, notes, created_at, appointment_date
      FROM bookings 
      WHERE notes LIKE '%WhatsApp%'
      ORDER BY created_at DESC
      LIMIT 10
    `);
    
    console.log(`Found ${whatsappBookings.rows.length} WhatsApp bookings:`);
    whatsappBookings.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.customer_name} - ${row.notes} - ${row.created_at}`);
    });
    
    // Check bookings created in last 30 days
    console.log('\n📅 Bookings created in last 30 days:');
    const recentBookings = await pool.query(`
      SELECT id, customer_name, notes, created_at, appointment_date
      FROM bookings 
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      ORDER BY created_at DESC
      LIMIT 10
    `);
    
    console.log(`Found ${recentBookings.rows.length} recent bookings:`);
    recentBookings.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.customer_name} - ${row.notes || 'No notes'} - ${row.created_at}`);
    });
    
    // Check the exact condition
    console.log('\n🔍 Exact condition test:');
    const exactCondition = await pool.query(`
      SELECT id, customer_name, notes, created_at, appointment_date
      FROM bookings 
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        AND notes LIKE '%WhatsApp booking%'
      ORDER BY created_at DESC
      LIMIT 10
    `);
    
    console.log(`Found ${exactCondition.rows.length} bookings matching exact condition:`);
    exactCondition.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.customer_name} - ${row.notes} - ${row.created_at}`);
    });
    
    // Check if there are any bookings with different note patterns
    console.log('\n🔍 Different note patterns:');
    const notePatterns = await pool.query(`
      SELECT DISTINCT notes
      FROM bookings 
      WHERE notes IS NOT NULL
      ORDER BY notes
    `);
    
    console.log(`Found ${notePatterns.rows.length} unique note patterns:`);
    notePatterns.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. "${row.notes}"`);
    });
    
  } catch (error) {
    console.error('❌ Error debugging WhatsApp bookings:', error);
  } finally {
    await pool.end();
  }
}

async function main() {
  console.log('🚀 Debug WhatsApp Bookings');
  console.log('=========================\n');
  
  await debugWhatsAppBookings();
  
  console.log('\n🎯 Next Steps:');
  console.log('- Fix the WHERE clause to match the actual note patterns');
  console.log('- Update the salon appointments query');
}

main().catch(console.error);
