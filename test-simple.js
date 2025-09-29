#!/usr/bin/env node

/**
 * Simple Test Script - No Dependencies Required
 * Tests the deployed salon dashboard using built-in Node.js fetch
 */

const BASE_URL = 'https://whatsapp-bot-for-consumer-num9fgy3b-abinalyas-projects.vercel.app';
const TENANT_ID = 'bella-salon';

console.log('🧪 Simple Test for Deployed Salon Dashboard');
console.log(`📍 URL: ${BASE_URL}`);
console.log('=' .repeat(60));

let passed = 0;
let failed = 0;
const results = [];

/**
 * Test an endpoint
 */
async function testEndpoint(name, endpoint, method = 'GET', body = null) {
  try {
    console.log(`\n🔍 Testing: ${name}`);
    
    const options = {
      method,
      headers: {
        'x-tenant-id': TENANT_ID,
        'Content-Type': 'application/json'
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ ${name} - SUCCESS (${response.status})`);
      if (data.data && Array.isArray(data.data)) {
        console.log(`   📊 Found ${data.data.length} records`);
      }
      passed++;
      results.push({ name, status: 'PASS', details: `Status: ${response.status}` });
    } else {
      console.log(`❌ ${name} - FAILED (${response.status})`);
      console.log(`   Error: ${data.error || response.statusText}`);
      failed++;
      results.push({ name, status: 'FAIL', details: `Status: ${response.status}, Error: ${data.error}` });
    }
    
  } catch (error) {
    console.log(`❌ ${name} - ERROR`);
    console.log(`   ${error.message}`);
    failed++;
    results.push({ name, status: 'ERROR', details: error.message });
  }
}

/**
 * Test all functionality
 */
async function runTests() {
  console.log('🚀 Starting comprehensive tests...\n');
  
  // Test 1: Basic API endpoints
  await testEndpoint('Services API', '/api/salon/services');
  await testEndpoint('Staff API', '/api/staff/staff');
  await testEndpoint('Appointments API', '/api/salon/appointments');
  
  // Test 2: Test appointment creation
  const testAppointment = {
    customer_name: 'Test Customer',
    customer_phone: '9876543210',
    customer_email: 'test@example.com',
    service_id: 'a933c8e9-1440-4b3b-8081-76f57a6a9014', // Real service ID
    staff_id: '41de6656-674d-4e30-85ab-c345fbb39a51', // Real staff ID
    scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    duration_minutes: 60,
    amount: 500,
    currency: 'INR',
    payment_status: 'pending',
    notes: 'Automated test appointment'
  };
  
  await testEndpoint('Create Appointment', '/api/salon/appointments', 'POST', testAppointment);
  
  // Test 3: Test main page load
  try {
    console.log(`\n🔍 Testing: Main Page Load`);
    const response = await fetch(BASE_URL);
    
    if (response.ok) {
      const html = await response.text();
      if (html.includes('<!DOCTYPE html>') || html.includes('<html')) {
        console.log(`✅ Main Page Load - SUCCESS`);
        passed++;
        results.push({ name: 'Main Page Load', status: 'PASS', details: 'HTML content loaded' });
      } else {
        console.log(`❌ Main Page Load - FAILED (Invalid HTML)`);
        failed++;
        results.push({ name: 'Main Page Load', status: 'FAIL', details: 'Invalid HTML content' });
      }
    } else {
      console.log(`❌ Main Page Load - FAILED (${response.status})`);
      failed++;
      results.push({ name: 'Main Page Load', status: 'FAIL', details: `Status: ${response.status}` });
    }
  } catch (error) {
    console.log(`❌ Main Page Load - ERROR`);
    console.log(`   ${error.message}`);
    failed++;
    results.push({ name: 'Main Page Load', status: 'ERROR', details: error.message });
  }
  
  // Test 4: Test static assets
  try {
    console.log(`\n🔍 Testing: Static Assets`);
    
    // First, check if we can get the debug info to see what assets are available
    const debugResponse = await fetch(`${BASE_URL}/debug/assets`);
    let assetsInfo = null;
    if (debugResponse.ok) {
      assetsInfo = await debugResponse.json();
      console.log(`   Debug info: ${assetsInfo.files?.length || 0} assets found`);
    }
    
    // Try to find a CSS file
    let cssResponse = null;
    if (assetsInfo && assetsInfo.files) {
      const cssFile = assetsInfo.files.find(f => f.endsWith('.css'));
      if (cssFile) {
        cssResponse = await fetch(`${BASE_URL}/assets/${cssFile}`);
        console.log(`   Testing CSS file: ${cssFile}`);
      }
    }
    
    // If no CSS file found via debug, try common patterns
    if (!cssResponse || !cssResponse.ok) {
      const commonCssPaths = [
        '/assets/index.css',
        '/assets/index-CvE--xwF.css',
        '/assets/index-Cd7vsNUC.css'
      ];
      
      for (const cssPath of commonCssPaths) {
        try {
          cssResponse = await fetch(`${BASE_URL}${cssPath}`);
          if (cssResponse.ok) {
            console.log(`   Found CSS at: ${cssPath}`);
            break;
          }
        } catch (e) {
          // Continue to next path
        }
      }
    }
    
    if (cssResponse && cssResponse.ok) {
      console.log(`✅ Static Assets - SUCCESS`);
      passed++;
      results.push({ name: 'Static Assets', status: 'PASS', details: 'CSS assets accessible' });
    } else {
      console.log(`❌ Static Assets - FAILED`);
      console.log(`   Could not find accessible CSS assets`);
      failed++;
      results.push({ name: 'Static Assets', status: 'FAIL', details: 'No accessible CSS assets found' });
    }
  } catch (error) {
    console.log(`❌ Static Assets - ERROR`);
    console.log(`   ${error.message}`);
    failed++;
    results.push({ name: 'Static Assets', status: 'ERROR', details: error.message });
  }
  
  // Generate report
  console.log('\n' + '=' .repeat(60));
  console.log('📋 TEST REPORT');
  console.log('=' .repeat(60));
  console.log(`Total Tests: ${passed + failed}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  console.log('\n📊 Detailed Results:');
  results.forEach(result => {
    const icon = result.status === 'PASS' ? '✅' : '❌';
    console.log(`   ${icon} ${result.name}: ${result.details}`);
  });
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! The deployed app is working correctly.');
    console.log('\n💡 Next steps:');
    console.log('   1. Open the app in your browser');
    console.log('   2. Test Quick Actions modals');
    console.log('   3. Test edit appointment functionality');
    console.log('   4. Verify data is loading correctly');
  } else {
    console.log('\n⚠️ Some tests failed. Check the errors above.');
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Check if the deployment is complete');
    console.log('   2. Verify environment variables are set');
    console.log('   3. Check database connectivity');
  }
  
  console.log('\n🌐 App URL: ' + BASE_URL);
  console.log('📱 Test the Quick Actions and Edit Appointment features manually');
}

// Run tests
runTests().catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});
