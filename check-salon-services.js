/**
 * Check Salon Services
 * Check what services are actually in the salon dashboard vs WhatsApp Bot
 */

import { Pool } from '@neondatabase/serverless';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const TEST_CONFIG = {
  baseUrl: 'https://whatsapp-bot-for-consumer.vercel.app',
};

async function checkSalonServices() {
  console.log('🔍 Checking Salon Services');
  console.log('=========================\n');
  
  try {
    // Check services in database
    console.log('📊 Services in Database:');
    const dbServices = await pool.query(`
      SELECT id, name, price, is_active
      FROM services 
      WHERE is_active = true
      ORDER BY name
    `);
    
    console.log(`Found ${dbServices.rows.length} services in database:`);
    dbServices.rows.forEach((service, index) => {
      console.log(`   ${index + 1}. ${service.name} - ₹${service.price} (ID: ${service.id})`);
    });
    
    // Check salon dashboard API
    console.log('\n📊 Services from Salon Dashboard API:');
    try {
      const response = await fetch(`${TEST_CONFIG.baseUrl}/api/salon/services`, {
        headers: {
          'x-tenant-id': 'bella-salon'
        }
      });
      
      if (response.ok) {
        const salonServices = await response.json();
        console.log(`Found ${salonServices.length} services from salon dashboard API:`);
        salonServices.forEach((service, index) => {
          console.log(`   ${index + 1}. ${service.name} - ₹${service.base_price} (ID: ${service.id})`);
        });
      } else {
        console.log(`❌ Salon dashboard API failed: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ Error fetching salon services: ${error.message}`);
    }
    
    // Check what WhatsApp Bot is showing
    console.log('\n📊 Services from WhatsApp Bot:');
    try {
      const response = await fetch(`${TEST_CONFIG.baseUrl}/api/whatsapp/simple/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: '987654321999',
          message: 'book'
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('WhatsApp Bot response:');
        console.log(result.message);
      } else {
        console.log(`❌ WhatsApp Bot test failed: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ Error testing WhatsApp Bot: ${error.message}`);
    }
    
  } catch (error) {
    console.error('❌ Error checking services:', error);
  } finally {
    await pool.end();
  }
}

async function main() {
  console.log('🚀 Check Salon Services');
  console.log('======================\n');
  
  await checkSalonServices();
  
  console.log('\n🎯 Analysis:');
  console.log('- Compare services between database, salon dashboard, and WhatsApp Bot');
  console.log('- Identify which data source the WhatsApp Bot should use');
  console.log('- Fix the mismatch to show consistent services');
}

main().catch(console.error);
