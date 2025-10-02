/**
 * Debug Salon API
 * Check what the salon dashboard API is actually returning
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const TEST_CONFIG = {
  baseUrl: 'https://whatsapp-bot-for-consumer.vercel.app',
};

async function debugSalonAPI() {
  console.log('🔍 Debug Salon API');
  console.log('=================\n');
  
  try {
    // Check salon dashboard API
    console.log('📊 Testing Salon Dashboard API:');
    const response = await fetch(`${TEST_CONFIG.baseUrl}/api/salon/services`, {
      headers: {
        'x-tenant-id': 'bella-salon'
      }
    });
    
    console.log(`Status: ${response.status}`);
    console.log(`Headers:`, Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log(`Raw response:`, responseText);
    
    try {
      const salonServices = JSON.parse(responseText);
      console.log(`Parsed response:`, JSON.stringify(salonServices, null, 2));
      
      if (Array.isArray(salonServices)) {
        console.log(`✅ Response is an array with ${salonServices.length} services`);
        salonServices.forEach((service, index) => {
          console.log(`   ${index + 1}. ${service.name || 'NO NAME'} - ₹${service.base_price || service.price || 'NO PRICE'}`);
        });
      } else {
        console.log(`❌ Response is not an array:`, typeof salonServices);
        console.log(`❌ Response structure:`, Object.keys(salonServices || {}));
      }
    } catch (parseError) {
      console.log(`❌ Failed to parse JSON:`, parseError.message);
    }
    
    // Also check the regular services API
    console.log('\n📊 Testing Regular Services API:');
    const regularResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/services`);
    
    console.log(`Status: ${regularResponse.status}`);
    const regularText = await regularResponse.text();
    console.log(`Raw response:`, regularText);
    
    try {
      const regularServices = JSON.parse(regularText);
      console.log(`Parsed response:`, JSON.stringify(regularServices, null, 2));
      
      if (Array.isArray(regularServices)) {
        console.log(`✅ Regular API response is an array with ${regularServices.length} services`);
        regularServices.forEach((service, index) => {
          console.log(`   ${index + 1}. ${service.name || 'NO NAME'} - ₹${service.price || 'NO PRICE'}`);
        });
      } else {
        console.log(`❌ Regular API response is not an array:`, typeof regularServices);
      }
    } catch (parseError) {
      console.log(`❌ Failed to parse regular API JSON:`, parseError.message);
    }
    
  } catch (error) {
    console.error('❌ Error debugging salon API:', error);
  }
}

async function main() {
  console.log('🚀 Debug Salon API');
  console.log('=================\n');
  
  await debugSalonAPI();
  
  console.log('\n🎯 Next Steps:');
  console.log('- Identify which API the salon dashboard is using');
  console.log('- Check if there are multiple service tables');
  console.log('- Align WhatsApp Bot with the correct data source');
}

main().catch(console.error);
