/**
 * Test Salon Dashboard API
 * Test the actual salon dashboard API endpoint to see what it returns
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const TEST_CONFIG = {
  baseUrl: 'https://whatsapp-bot-for-consumer.vercel.app',
};

async function testSalonDashboardAPI() {
  console.log('🔍 Test Salon Dashboard API');
  console.log('===========================\n');
  
  try {
    const phoneNumber = '919567882568';
    const bookingId = '2ab978fd-0327-4466-8696-c6524b4872cc';
    
    // Test the salon dashboard appointments API
    console.log('📊 Testing salon dashboard appointments API:');
    const response = await fetch(`${TEST_CONFIG.baseUrl}/api/salon/appointments`, {
      headers: {
        'x-tenant-id': 'bella-salon'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ API Response Status: ${response.status}`);
      console.log(`📊 Total appointments returned: ${data.data.length}`);
      
      // Look for our specific booking
      const ourBooking = data.data.find(apt => 
        apt.id === bookingId || 
        apt.customer_phone === phoneNumber
      );
      
      if (ourBooking) {
        console.log(`\n✅ Found our booking in API response:`);
        console.log(`   ID: ${ourBooking.id}`);
        console.log(`   Customer: ${ourBooking.customer_name}`);
        console.log(`   Phone: ${ourBooking.customer_phone}`);
        console.log(`   Service: ${ourBooking.service_name}`);
        console.log(`   Amount: ₹${ourBooking.amount}`);
        console.log(`   Source: ${ourBooking.source}`);
        console.log(`   Scheduled: ${ourBooking.scheduled_at}`);
        console.log(`   Status: ${ourBooking.payment_status}`);
      } else {
        console.log(`\n❌ Our booking NOT found in API response`);
        
        // Show all WhatsApp Bot bookings from API
        const whatsappBookings = data.data.filter(apt => apt.source === 'whatsapp_bot');
        console.log(`\n📱 WhatsApp Bot bookings in API response: ${whatsappBookings.length}`);
        whatsappBookings.forEach((booking, index) => {
          console.log(`   ${index + 1}. ID: ${booking.id}, Customer: ${booking.customer_name}, Phone: ${booking.customer_phone}, Service: ${booking.service_name}, Amount: ₹${booking.amount}`);
        });
        
        // Show recent bookings
        console.log(`\n📅 Recent bookings in API response:`);
        const recentBookings = data.data.slice(0, 5);
        recentBookings.forEach((booking, index) => {
          console.log(`   ${index + 1}. ID: ${booking.id}, Customer: ${booking.customer_name}, Phone: ${booking.customer_phone}, Service: ${booking.service_name}, Amount: ₹${booking.amount}, Source: ${booking.source || 'transaction'}`);
        });
      }
      
      // Check if there are any bookings with our phone number
      const phoneBookings = data.data.filter(apt => apt.customer_phone === phoneNumber);
      console.log(`\n📱 Bookings with phone ${phoneNumber}: ${phoneBookings.length}`);
      phoneBookings.forEach((booking, index) => {
        console.log(`   ${index + 1}. ID: ${booking.id}, Customer: ${booking.customer_name}, Service: ${booking.service_name}, Amount: ₹${booking.amount}, Source: ${booking.source || 'transaction'}`);
      });
      
    } else {
      console.log(`❌ API Error: ${response.status}`);
      const errorText = await response.text();
      console.log(`   Error: ${errorText}`);
    }
    
    // Also test with different tenant headers
    console.log('\n📊 Testing with different tenant headers:');
    const tenantHeaders = ['bella-salon', '85de5a0c-6aeb-479a-aa76-cbdd6b0845a7'];
    
    for (const tenantHeader of tenantHeaders) {
      console.log(`\n   Testing with x-tenant-id: ${tenantHeader}`);
      try {
        const testResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/salon/appointments`, {
          headers: {
            'x-tenant-id': tenantHeader
          }
        });
        
        if (testResponse.ok) {
          const testData = await testResponse.json();
          console.log(`     ✅ Status: ${testResponse.status}, Appointments: ${testData.data.length}`);
          
          const ourBooking = testData.data.find(apt => 
            apt.id === bookingId || 
            apt.customer_phone === phoneNumber
          );
          
          if (ourBooking) {
            console.log(`     ✅ Found our booking!`);
          } else {
            console.log(`     ❌ Our booking not found`);
          }
        } else {
          console.log(`     ❌ Error: ${testResponse.status}`);
        }
      } catch (error) {
        console.log(`     ❌ Exception: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing salon dashboard API:', error);
  }
}

async function main() {
  console.log('🚀 Test Salon Dashboard API');
  console.log('===========================\n');
  
  await testSalonDashboardAPI();
  
  console.log('\n🎯 Next Steps:');
  console.log('- If booking is in API response, check frontend filtering');
  console.log('- If booking is not in API response, check API logic');
  console.log('- Fix the issue preventing the booking from showing');
}

main().catch(console.error);
