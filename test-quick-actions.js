#!/usr/bin/env node

/**
 * Quick Actions API Testing Script
 * Tests all the API endpoints used by Quick Actions modals
 */

const baseUrl = 'http://localhost:5000';

async function testAPI(endpoint, description) {
  try {
    console.log(`\n🔍 Testing: ${description}`);
    console.log(`📍 Endpoint: ${endpoint}`);
    
    const response = await fetch(`${baseUrl}${endpoint}`);
    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log(`✅ SUCCESS: ${data.data?.length || 0} records returned`);
      if (data.data && data.data.length > 0) {
        console.log(`📊 Sample data:`, JSON.stringify(data.data[0], null, 2).substring(0, 200) + '...');
      }
    } else {
      console.log(`❌ FAILED: ${response.status} - ${data.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
  }
}

async function runTests() {
  console.log('🚀 Starting Quick Actions API Tests...');
  console.log(`🌐 Base URL: ${baseUrl}`);
  
  // Test all Quick Actions API endpoints
  await testAPI('/api/salon/services', 'Services for Quick Book & Walk-in');
  await testAPI('/api/staff/staff', 'Staff for Quick Book, Walk-in & View Schedule');
  await testAPI('/api/salon/appointments', 'Appointments for Check In, Process Payment, Send Reminders');
  
  // Test with date parameter
  const today = new Date().toISOString().split('T')[0];
  await testAPI(`/api/salon/appointments?date=${today}`, 'Today\'s Appointments for Daily Summary');
  
  console.log('\n🎉 Quick Actions API Testing Complete!');
  console.log('\n📋 Next Steps:');
  console.log('1. Open http://localhost:5000 in your browser');
  console.log('2. Navigate to the Salon Dashboard');
  console.log('3. Test each Quick Action modal');
  console.log('4. Verify real data loads in all dropdowns');
  console.log('5. Test form submissions and data updates');
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}

export { testAPI, runTests };
