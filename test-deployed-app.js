#!/usr/bin/env node

/**
 * Simple Test Script for Deployed Salon Dashboard
 * Tests key functionality without complex dependencies
 */

const BASE_URL = 'https://whatsapp-bot-for-consumer-num9fgy3b-abinalyas-projects.vercel.app';
const TENANT_ID = 'bella-salon';

console.log('🧪 Testing Deployed Salon Dashboard');
console.log(`📍 URL: ${BASE_URL}`);
console.log('=' .repeat(50));

let passed = 0;
let failed = 0;

/**
 * Simple fetch wrapper with error handling
 */
async function testEndpoint(name, endpoint, expectedFields = []) {
  try {
    console.log(`\n🔍 Testing: ${name}`);
    
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        'x-tenant-id': TENANT_ID,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Check if response has expected structure
    let success = true;
    let details = '';
    
    if (expectedFields.length > 0) {
      for (const field of expectedFields) {
        if (!data[field]) {
          success = false;
          details += `Missing field: ${field} `;
        }
      }
    }
    
    if (success) {
      console.log(`✅ ${name} - SUCCESS`);
      if (data.data && Array.isArray(data.data)) {
        console.log(`   📊 Found ${data.data.length} records`);
      }
      passed++;
    } else {
      console.log(`❌ ${name} - FAILED`);
      console.log(`   ${details}`);
      failed++;
    }
    
    return { success, data };
    
  } catch (error) {
    console.log(`❌ ${name} - ERROR`);
    console.log(`   ${error.message}`);
    failed++;
    return { success: false, error: error.message };
  }
}

/**
 * Test appointment creation
 */
async function testCreateAppointment() {
  console.log(`\n🔍 Testing: Create Appointment`);
  
  try {
    const appointmentData = {
      customer_name: 'Test Customer',
      customer_phone: '9876543210',
      customer_email: 'test@example.com',
      service_id: 'test-service-id',
      staff_id: 'test-staff-id',
      scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      duration_minutes: 60,
      amount: 500,
      currency: 'INR',
      payment_status: 'pending',
      notes: 'Automated test appointment'
    };
    
    const response = await fetch(`${BASE_URL}/api/salon/appointments`, {
      method: 'POST',
      headers: {
        'x-tenant-id': TENANT_ID,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(appointmentData)
    });
    
    if (response.ok) {
      console.log(`✅ Create Appointment - SUCCESS`);
      passed++;
      return true;
    } else {
      const errorData = await response.json();
      console.log(`❌ Create Appointment - FAILED`);
      console.log(`   ${errorData.error || response.statusText}`);
      failed++;
      return false;
    }
    
  } catch (error) {
    console.log(`❌ Create Appointment - ERROR`);
    console.log(`   ${error.message}`);
    failed++;
    return false;
  }
}

/**
 * Test all endpoints
 */
async function runTests() {
  console.log('🚀 Starting endpoint tests...\n');
  
  // Test basic API endpoints
  await testEndpoint('Services API', '/api/salon/services', ['success', 'data']);
  await testEndpoint('Staff API', '/api/staff/staff', ['success', 'data']);
  await testEndpoint('Appointments API', '/api/salon/appointments', ['success', 'data']);
  
  // Test appointment creation
  await testCreateAppointment();
  
  // Test static files
  await testEndpoint('Main App', '/', []);
  
  console.log('\n' + '=' .repeat(50));
  console.log('📋 TEST RESULTS');
  console.log('=' .repeat(50));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! The deployed app is working correctly.');
  } else {
    console.log('\n⚠️ Some tests failed. Check the errors above.');
  }
}

// Run tests
runTests().catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});
