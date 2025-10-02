/**
 * Debug Salon Dashboard API
 * Check what the salon dashboard API is returning for bookings/appointments
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const TEST_CONFIG = {
  baseUrl: 'https://whatsapp-bot-for-consumer.vercel.app',
};

async function debugSalonDashboardAPI() {
  console.log('🔍 Debug Salon Dashboard API');
  console.log('===========================\n');
  
  try {
    // Check various salon dashboard endpoints
    const endpoints = [
      '/api/salon/appointments',
      '/api/salon/bookings', 
      '/api/appointments',
      '/api/bookings',
      '/api/salon/services'
    ];
    
    for (const endpoint of endpoints) {
      console.log(`\n📊 Testing: ${endpoint}`);
      try {
        const response = await fetch(`${TEST_CONFIG.baseUrl}${endpoint}`, {
          headers: {
            'x-tenant-id': 'bella-salon'
          }
        });
        
        console.log(`   Status: ${response.status}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`   Response type: ${typeof data}`);
          
          if (Array.isArray(data)) {
            console.log(`   Array length: ${data.length}`);
            if (data.length > 0) {
              console.log(`   Sample item:`, JSON.stringify(data[0], null, 2));
            }
          } else if (data && typeof data === 'object') {
            console.log(`   Object keys:`, Object.keys(data));
            if (data.data && Array.isArray(data.data)) {
              console.log(`   Data array length: ${data.data.length}`);
            }
          } else {
            console.log(`   Raw response:`, data);
          }
        } else {
          const error = await response.text();
          console.log(`   Error: ${error}`);
        }
        
      } catch (error) {
        console.log(`   Exception: ${error.message}`);
      }
    }
    
    // Also check the regular API endpoints
    console.log('\n📊 Testing Regular API Endpoints:');
    const regularEndpoints = [
      '/api/services',
      '/api/bookings'
    ];
    
    for (const endpoint of regularEndpoints) {
      console.log(`\n📊 Testing: ${endpoint}`);
      try {
        const response = await fetch(`${TEST_CONFIG.baseUrl}${endpoint}`);
        
        console.log(`   Status: ${response.status}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`   Response type: ${typeof data}`);
          
          if (Array.isArray(data)) {
            console.log(`   Array length: ${data.length}`);
          } else {
            console.log(`   Object keys:`, Object.keys(data || {}));
          }
        } else {
          const error = await response.text();
          console.log(`   Error: ${error}`);
        }
        
      } catch (error) {
        console.log(`   Exception: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error debugging salon dashboard API:', error);
  }
}

async function main() {
  console.log('🚀 Debug Salon Dashboard API');
  console.log('===========================\n');
  
  await debugSalonDashboardAPI();
  
  console.log('\n🎯 Next Steps:');
  console.log('- Identify which endpoint the salon dashboard uses for appointments');
  console.log('- Check if the endpoint exists and returns the correct data');
  console.log('- Fix the salon dashboard to show WhatsApp Bot bookings');
}

main().catch(console.error);
