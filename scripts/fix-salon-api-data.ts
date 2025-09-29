/**
 * Script to update salon API data (offerings and transactions tables) for Indian localization
 */

import { Pool } from '@neondatabase/serverless';
import ws from "ws";

// Database connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function fixSalonApiData() {
  try {
    console.log('🔧 Fixing salon API data for Indian localization...');

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

    // 1. Update offerings (services) table
    console.log('💇‍♀️ Updating offerings (services) with Indian pricing...');
    
    const offeringsResult = await pool.query(`
      SELECT id, name, base_price, currency FROM offerings 
      WHERE offering_type = 'service'
    `);
    
    console.log(`📋 Found ${offeringsResult.rows.length} offerings`);
    
    for (const offering of offeringsResult.rows) {
      // Convert USD prices to INR (multiply by ~75-80 for realistic conversion)
      const indianPrice = Math.round(parseFloat(offering.base_price) * 75);
      
      await pool.query(`
        UPDATE offerings 
        SET base_price = $1, currency = 'INR'
        WHERE id = $2
      `, [indianPrice.toString(), offering.id]);
      
      console.log(`✅ Updated ${offering.name}: $${offering.base_price} → ₹${indianPrice}`);
    }

    // 2. Update transactions (appointments) table
    console.log('📅 Updating transactions (appointments) with Indian data...');
    
    const transactionsResult = await pool.query(`
      SELECT id, customer_name, customer_phone, amount, currency FROM transactions 
      WHERE transaction_type = 'booking'
      ORDER BY created_at DESC
    `);
    
    console.log(`📋 Found ${transactionsResult.rows.length} transactions`);
    
    for (let i = 0; i < transactionsResult.rows.length; i++) {
      const transaction = transactionsResult.rows[i];
      const customer = indianCustomers[i % indianCustomers.length];
      
      // Convert USD amounts to INR
      const indianAmount = Math.round(parseFloat(transaction.amount) * 75);
      
      await pool.query(`
        UPDATE transactions 
        SET customer_name = $1, customer_phone = $2, amount = $3, currency = 'INR'
        WHERE id = $4
      `, [customer.name, customer.phone, indianAmount.toString(), transaction.id]);
      
      console.log(`✅ Updated transaction ${transaction.id}: ${customer.name} - ₹${indianAmount}`);
    }

    console.log('🎉 Salon API data updated successfully!');
    console.log('📊 Summary:');
    console.log(`   - Updated ${offeringsResult.rows.length} offerings with Indian pricing`);
    console.log(`   - Updated ${transactionsResult.rows.length} transactions with Indian data`);

  } catch (error) {
    console.error('❌ Error updating salon API data:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the fix
fixSalonApiData()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
