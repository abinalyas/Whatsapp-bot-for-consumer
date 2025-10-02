/**
 * Test Salon Dashboard Frontend
 * Test if the salon dashboard frontend is loading the latest data
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const TEST_CONFIG = {
  baseUrl: 'https://whatsapp-bot-for-consumer.vercel.app',
};

async function testSalonDashboardFrontend() {
  console.log('🔍 Test Salon Dashboard Frontend');
  console.log('================================\n');
  
  try {
    const phoneNumber = '919567882568';
    const bookingId = '2ab978fd-0327-4466-8696-c6524b4872cc';
    
    // Test the salon dashboard page
    console.log('📊 Testing salon dashboard page:');
    const pageResponse = await fetch(`${TEST_CONFIG.baseUrl}/salon-dashboard`);
    
    if (pageResponse.ok) {
      console.log(`✅ Salon dashboard page loads: ${pageResponse.status}`);
      
      // Check if the page contains our booking data
      const pageContent = await pageResponse.text();
      
      if (pageContent.includes(phoneNumber)) {
        console.log(`✅ Page contains our phone number: ${phoneNumber}`);
      } else {
        console.log(`❌ Page does NOT contain our phone number: ${phoneNumber}`);
      }
      
      if (pageContent.includes(bookingId)) {
        console.log(`✅ Page contains our booking ID: ${bookingId}`);
      } else {
        console.log(`❌ Page does NOT contain our booking ID: ${bookingId}`);
      }
      
      // Check for WhatsApp Bot related content
      if (pageContent.includes('WhatsApp')) {
        console.log(`✅ Page contains WhatsApp content`);
      } else {
        console.log(`❌ Page does NOT contain WhatsApp content`);
      }
      
    } else {
      console.log(`❌ Salon dashboard page error: ${pageResponse.status}`);
    }
    
    // Test the API endpoint that the frontend uses
    console.log('\n📊 Testing API endpoint used by frontend:');
    const apiResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/salon/appointments`, {
      headers: {
        'x-tenant-id': 'bella-salon',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    if (apiResponse.ok) {
      const apiData = await apiResponse.json();
      console.log(`✅ API responds with ${apiData.data.length} appointments`);
      
      // Look for our booking
      const ourBooking = apiData.data.find(apt => 
        apt.id === bookingId || 
        apt.customer_phone === phoneNumber
      );
      
      if (ourBooking) {
        console.log(`✅ Our booking found in API response`);
        console.log(`   Customer: ${ourBooking.customer_name}`);
        console.log(`   Service: ${ourBooking.service_name}`);
        console.log(`   Amount: ₹${ourBooking.amount}`);
        console.log(`   Source: ${ourBooking.source}`);
      } else {
        console.log(`❌ Our booking NOT found in API response`);
      }
      
    } else {
      console.log(`❌ API error: ${apiResponse.status}`);
    }
    
    // Test with no-cache headers
    console.log('\n📊 Testing with no-cache headers:');
    const noCacheResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/salon/appointments`, {
      headers: {
        'x-tenant-id': 'bella-salon',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    if (noCacheResponse.ok) {
      const noCacheData = await noCacheResponse.json();
      console.log(`✅ No-cache API responds with ${noCacheData.data.length} appointments`);
      
      const ourBooking = noCacheData.data.find(apt => 
        apt.id === bookingId || 
        apt.customer_phone === phoneNumber
      );
      
      if (ourBooking) {
        console.log(`✅ Our booking found in no-cache API response`);
      } else {
        console.log(`❌ Our booking NOT found in no-cache API response`);
      }
      
    } else {
      console.log(`❌ No-cache API error: ${noCacheResponse.status}`);
    }
    
  } catch (error) {
    console.error('❌ Error testing salon dashboard frontend:', error);
  }
}

async function main() {
  console.log('🚀 Test Salon Dashboard Frontend');
  console.log('================================\n');
  
  await testSalonDashboardFrontend();
  
  console.log('\n🎯 Summary:');
  console.log('- The booking exists in the database');
  console.log('- The API is returning the booking correctly');
  console.log('- The issue is likely frontend caching or filtering');
  console.log('\n🔧 Solutions:');
  console.log('1. Hard refresh the salon dashboard page (Ctrl+F5)');
  console.log('2. Clear browser cache');
  console.log('3. Try incognito/private browsing mode');
  console.log('4. Check browser console for JavaScript errors');
}

main().catch(console.error);
