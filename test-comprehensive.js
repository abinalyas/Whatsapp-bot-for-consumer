#!/usr/bin/env node

/**
 * Comprehensive Testing Script for Salon Dashboard
 * Tests all functionality with various scenarios and edge cases
 */

const BASE_URL = 'https://whatsapp-bot-for-consumer-aj007h6k8-abinalyas-projects.vercel.app';
const TENANT_ID = 'bella-salon';

console.log('🧪 Comprehensive Testing for Salon Dashboard');
console.log(`📍 URL: ${BASE_URL}`);
console.log('=' .repeat(70));

let passed = 0;
let failed = 0;
const results = [];
const testData = {};

/**
 * Helper function to make API requests
 */
async function makeRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-id': TENANT_ID,
      ...options.headers
    }
  };
  
  const requestOptions = { ...defaultOptions, ...options };
  
  try {
    const response = await fetch(url, requestOptions);
    const data = await response.json();
    
    return {
      success: response.ok,
      status: response.status,
      data: data,
      error: response.ok ? null : `HTTP ${response.status}: ${data.error || response.statusText}`
    };
  } catch (error) {
    return {
      success: false,
      status: 0,
      data: null,
      error: error.message
    };
  }
}

/**
 * Helper function to log test results
 */
function logTestResult(testName, passed, details = '') {
  if (passed) {
    console.log(`✅ ${testName}`);
  } else {
    console.log(`❌ ${testName}`);
    if (details) {
      console.log(`   ${details}`);
    }
  }
  results.push({ name: testName, passed, details });
}

/**
 * Test 1: API Endpoints Basic Functionality
 */
async function testApiEndpoints() {
  console.log('\n🔍 Testing API Endpoints Basic Functionality...');
  
  // Test services endpoint
  const servicesResult = await makeRequest('/api/salon/services');
  logTestResult(
    'Services API - Basic Fetch',
    servicesResult.success && servicesResult.data?.success,
    servicesResult.error || `Found ${servicesResult.data?.data?.length || 0} services`
  );
  
  if (servicesResult.success && servicesResult.data?.data?.length > 0) {
    testData.services = servicesResult.data.data;
    testData.firstService = servicesResult.data.data[0];
  }
  
  // Test staff endpoint
  const staffResult = await makeRequest('/api/staff/staff');
  logTestResult(
    'Staff API - Basic Fetch',
    staffResult.success && staffResult.data?.success,
    staffResult.error || `Found ${staffResult.data?.data?.length || 0} staff members`
  );
  
  if (staffResult.success && staffResult.data?.data?.length > 0) {
    testData.staff = staffResult.data.data;
    testData.firstStaff = staffResult.data.data[0];
  }
  
  // Test appointments endpoint
  const appointmentsResult = await makeRequest('/api/salon/appointments');
  logTestResult(
    'Appointments API - Basic Fetch',
    appointmentsResult.success && appointmentsResult.data?.success,
    appointmentsResult.error || `Found ${appointmentsResult.data?.data?.length || 0} appointments`
  );
  
  if (appointmentsResult.success && appointmentsResult.data?.data?.length > 0) {
    testData.appointments = appointmentsResult.data.data;
    testData.firstAppointment = appointmentsResult.data.data[0];
  }
}

/**
 * Test 2: Quick Book Modal Functionality
 */
async function testQuickBookModal() {
  console.log('\n🔍 Testing Quick Book Modal Functionality...');
  
  if (!testData.firstService || !testData.firstStaff) {
    logTestResult(
      'Quick Book - Service/Staff Data Available',
      false,
      'Missing service or staff data for testing'
    );
    return;
  }
  
  // Test valid appointment creation
  const validAppointment = {
    customer_name: 'Test Customer ' + Date.now(),
    customer_phone: '9876543210',
    customer_email: 'test@example.com',
    service_id: testData.firstService.id,
    staff_id: testData.firstStaff.id,
    scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    duration_minutes: 60,
    amount: 500,
    currency: 'INR',
    payment_status: 'pending',
    notes: 'Automated test appointment'
  };
  
  const createResult = await makeRequest('/api/salon/appointments', {
    method: 'POST',
    body: JSON.stringify(validAppointment)
  });
  
  logTestResult(
    'Quick Book - Valid Appointment Creation',
    createResult.success && createResult.data?.success,
    createResult.error || `Created appointment ID: ${createResult.data?.data?.id}`
  );
  
  if (createResult.success) {
    testData.createdAppointment = createResult.data.data;
  }
  
  // Test invalid appointment creation (missing required fields)
  const invalidAppointment = {
    customer_name: 'Test Customer',
    // Missing customer_phone, service_id, scheduled_at, amount
    customer_email: 'test@example.com'
  };
  
  const invalidResult = await makeRequest('/api/salon/appointments', {
    method: 'POST',
    body: JSON.stringify(invalidAppointment)
  });
  
  logTestResult(
    'Quick Book - Invalid Data Validation',
    !invalidResult.success && invalidResult.status === 400,
    invalidResult.error || `Expected 400, got ${invalidResult.status}`
  );
  
  // Test appointment with invalid service ID
  const invalidServiceAppointment = {
    ...validAppointment,
    service_id: 'invalid-service-id'
  };
  
  const invalidServiceResult = await makeRequest('/api/salon/appointments', {
    method: 'POST',
    body: JSON.stringify(invalidServiceAppointment)
  });
  
  logTestResult(
    'Quick Book - Invalid Service ID Handling',
    !invalidServiceResult.success,
    invalidServiceResult.error || 'Should fail with invalid service ID'
  );
}

/**
 * Test 3: Check In Modal Functionality
 */
async function testCheckInModal() {
  console.log('\n🔍 Testing Check In Modal Functionality...');
  
  if (!testData.appointments || testData.appointments.length === 0) {
    logTestResult(
      'Check In - Appointments Available',
      false,
      'No appointments available for testing'
    );
    return;
  }
  
  // Find a pending appointment
  const pendingAppointment = testData.appointments.find(apt => 
    apt.payment_status === 'pending' || apt.payment_status === 'confirmed'
  );
  
  if (!pendingAppointment) {
    logTestResult(
      'Check In - Pending Appointments Available',
      false,
      'No pending appointments found for testing'
    );
    return;
  }
  
  // Test fetching single appointment
  const fetchResult = await makeRequest(`/api/salon/appointments/${pendingAppointment.id}`);
  logTestResult(
    'Check In - Fetch Single Appointment',
    fetchResult.success && fetchResult.data?.success,
    fetchResult.error || `Fetched appointment: ${fetchResult.data?.data?.customer_name}`
  );
  
  if (!fetchResult.success) return;
  
  // Test check-in update
  const checkInData = {
    ...fetchResult.data.data,
    payment_status: 'checked-in',
    notes: (fetchResult.data.data.notes || '') + '\nChecked in via automated test'
  };
  
  const updateResult = await makeRequest(`/api/salon/appointments/${pendingAppointment.id}`, {
    method: 'PUT',
    body: JSON.stringify(checkInData)
  });
  
  logTestResult(
    'Check In - Update Status to Checked-in',
    updateResult.success && updateResult.data?.success,
    updateResult.error || `Updated appointment status to: ${checkInData.payment_status}`
  );
}

/**
 * Test 4: Process Payment Modal Functionality
 */
async function testProcessPaymentModal() {
  console.log('\n🔍 Testing Process Payment Modal Functionality...');
  
  if (!testData.appointments || testData.appointments.length === 0) {
    logTestResult(
      'Process Payment - Appointments Available',
      false,
      'No appointments available for testing'
    );
    return;
  }
  
  // Find a checked-in appointment
  const checkedInAppointment = testData.appointments.find(apt => 
    apt.payment_status === 'checked-in'
  );
  
  if (!checkedInAppointment) {
    logTestResult(
      'Process Payment - Checked-in Appointments Available',
      false,
      'No checked-in appointments found for testing'
    );
    return;
  }
  
  // Test payment processing
  const paymentData = {
    ...checkedInAppointment,
    payment_status: 'completed',
    amount: 750, // Including tip
    notes: (checkedInAppointment.notes || '') + '\nPayment processed via automated test'
  };
  
  const paymentResult = await makeRequest(`/api/salon/appointments/${checkedInAppointment.id}`, {
    method: 'PUT',
    body: JSON.stringify(paymentData)
  });
  
  logTestResult(
    'Process Payment - Complete Payment',
    paymentResult.success && paymentResult.data?.success,
    paymentResult.error || `Payment processed: ₹${paymentData.amount}`
  );
}

/**
 * Test 5: Daily Summary Modal Functionality
 */
async function testDailySummaryModal() {
  console.log('\n🔍 Testing Daily Summary Modal Functionality...');
  
  const today = new Date().toISOString().split('T')[0];
  const appointmentsResult = await makeRequest(`/api/salon/appointments?date=${today}`);
  
  logTestResult(
    'Daily Summary - Fetch Today\'s Appointments',
    appointmentsResult.success && appointmentsResult.data?.success,
    appointmentsResult.error || `Found ${appointmentsResult.data?.data?.length || 0} appointments for today`
  );
  
  if (appointmentsResult.success && appointmentsResult.data?.success) {
    const appointments = appointmentsResult.data.data;
    
    // Calculate metrics
    const totalAppointments = appointments.length;
    const completedAppointments = appointments.filter(apt => apt.payment_status === 'completed').length;
    const pendingAppointments = appointments.filter(apt => apt.payment_status === 'pending').length;
    const totalRevenue = appointments.reduce((sum, apt) => sum + (parseFloat(apt.amount) || 0), 0);
    
    logTestResult(
      'Daily Summary - Calculate Metrics',
      true,
      `Appointments: ${totalAppointments}, Completed: ${completedAppointments}, Revenue: ₹${totalRevenue}`
    );
    
    // Test service aggregation
    const serviceCounts = {};
    appointments.forEach(apt => {
      if (apt.service_name) {
        serviceCounts[apt.service_name] = (serviceCounts[apt.service_name] || 0) + 1;
      }
    });
    
    logTestResult(
      'Daily Summary - Service Aggregation',
      Object.keys(serviceCounts).length > 0,
      `Top services: ${Object.keys(serviceCounts).slice(0, 3).join(', ')}`
    );
  }
}

/**
 * Test 6: Edit Appointment Functionality
 */
async function testEditAppointment() {
  console.log('\n🔍 Testing Edit Appointment Functionality...');
  
  if (!testData.appointments || testData.appointments.length === 0) {
    logTestResult(
      'Edit Appointment - Appointments Available',
      false,
      'No appointments available for testing'
    );
    return;
  }
  
  const appointment = testData.appointments[0];
  
  // Test fetching single appointment for editing
  const fetchResult = await makeRequest(`/api/salon/appointments/${appointment.id}`);
  logTestResult(
    'Edit Appointment - Fetch for Editing',
    fetchResult.success && fetchResult.data?.success,
    fetchResult.error || `Fetched appointment: ${fetchResult.data?.data?.customer_name}`
  );
  
  if (!fetchResult.success) return;
  
  // Test updating appointment
  const updateData = {
    ...fetchResult.data.data,
    customer_name: `${fetchResult.data.data.customer_name} (Edited)`,
    notes: (fetchResult.data.data.notes || '') + '\nEdited via automated test'
  };
  
  const updateResult = await makeRequest(`/api/salon/appointments/${appointment.id}`, {
    method: 'PUT',
    body: JSON.stringify(updateData)
  });
  
  logTestResult(
    'Edit Appointment - Update Appointment',
    updateResult.success && updateResult.data?.success,
    updateResult.error || `Updated appointment: ${updateData.customer_name}`
  );
}

/**
 * Test 7: Walk-in Modal Functionality
 */
async function testWalkInModal() {
  console.log('\n🔍 Testing Walk-in Modal Functionality...');
  
  if (!testData.firstService || !testData.firstStaff) {
    logTestResult(
      'Walk-in - Service/Staff Data Available',
      false,
      'Missing service or staff data for testing'
    );
    return;
  }
  
  // Test creating a walk-in appointment
  const walkInAppointment = {
    customer_name: 'Walk-in Customer ' + Date.now(),
    customer_phone: '9876543211',
    customer_email: 'walkin@example.com',
    service_id: testData.firstService.id,
    staff_id: testData.firstStaff.id,
    scheduled_at: new Date().toISOString(), // Right now
    duration_minutes: 30,
    amount: 300,
    currency: 'INR',
    payment_status: 'pending',
    notes: 'Walk-in customer via automated test'
  };
  
  const createResult = await makeRequest('/api/salon/appointments', {
    method: 'POST',
    body: JSON.stringify(walkInAppointment)
  });
  
  logTestResult(
    'Walk-in - Create Walk-in Appointment',
    createResult.success && createResult.data?.success,
    createResult.error || `Created walk-in appointment ID: ${createResult.data?.data?.id}`
  );
}

/**
 * Test 8: Data Validation and Error Handling
 */
async function testDataValidation() {
  console.log('\n🔍 Testing Data Validation and Error Handling...');
  
  // Test invalid tenant ID
  const invalidTenantResult = await makeRequest('/api/salon/services', {
    headers: { 'x-tenant-id': 'invalid-tenant' }
  });
  
  logTestResult(
    'Data Validation - Invalid Tenant ID',
    !invalidTenantResult.success && invalidTenantResult.status === 404,
    invalidTenantResult.error || `Expected 404, got ${invalidTenantResult.status}`
  );
  
  // Test invalid appointment ID
  const invalidAppointmentResult = await makeRequest('/api/salon/appointments/invalid-id');
  
  logTestResult(
    'Data Validation - Invalid Appointment ID',
    !invalidAppointmentResult.success,
    invalidAppointmentResult.error || 'Should fail with invalid appointment ID'
  );
  
  // Test malformed JSON
  const malformedJsonResult = await makeRequest('/api/salon/appointments', {
    method: 'POST',
    body: 'invalid json'
  });
  
  logTestResult(
    'Data Validation - Malformed JSON',
    !malformedJsonResult.success,
    malformedJsonResult.error || 'Should fail with malformed JSON'
  );
}

/**
 * Test 9: Performance and Load Testing
 */
async function testPerformance() {
  console.log('\n🔍 Testing Performance and Load...');
  
  const startTime = Date.now();
  
  // Test concurrent API calls
  const promises = [
    makeRequest('/api/salon/services'),
    makeRequest('/api/staff/staff'),
    makeRequest('/api/salon/appointments'),
    makeRequest('/api/salon/services'),
    makeRequest('/api/staff/staff')
  ];
  
  const results = await Promise.all(promises);
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  const allSuccessful = results.every(result => result.success);
  
  logTestResult(
    'Performance - Concurrent API Calls',
    allSuccessful,
    `5 concurrent calls completed in ${duration}ms`
  );
  
  // Test response times
  const servicesStart = Date.now();
  await makeRequest('/api/salon/services');
  const servicesDuration = Date.now() - servicesStart;
  
  logTestResult(
    'Performance - Services API Response Time',
    servicesDuration < 5000, // Less than 5 seconds
    `Services API responded in ${servicesDuration}ms`
  );
}

/**
 * Test 10: Edge Cases and Boundary Conditions
 */
async function testEdgeCases() {
  console.log('\n🔍 Testing Edge Cases and Boundary Conditions...');
  
  // Test with very long customer name
  if (testData.firstService && testData.firstStaff) {
    const longNameAppointment = {
      customer_name: 'A'.repeat(500), // Very long name
      customer_phone: '9876543210',
      customer_email: 'test@example.com',
      service_id: testData.firstService.id,
      staff_id: testData.firstStaff.id,
      scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      duration_minutes: 60,
      amount: 500,
      currency: 'INR',
      payment_status: 'pending',
      notes: 'Test with very long name'
    };
    
    const longNameResult = await makeRequest('/api/salon/appointments', {
      method: 'POST',
      body: JSON.stringify(longNameAppointment)
    });
    
  logTestResult(
    'Edge Cases - Very Long Customer Name',
    !longNameResult.success && longNameResult.status === 400,
    longNameResult.error || 'Should reject very long customer name'
  );
  }
  
  // Test with future date (1 year from now)
  if (testData.firstService && testData.firstStaff) {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    
    const futureAppointment = {
      customer_name: 'Future Customer',
      customer_phone: '9876543210',
      customer_email: 'future@example.com',
      service_id: testData.firstService.id,
      staff_id: testData.firstStaff.id,
      scheduled_at: futureDate.toISOString(),
      duration_minutes: 60,
      amount: 500,
      currency: 'INR',
      payment_status: 'pending',
      notes: 'Test with future date'
    };
    
    const futureResult = await makeRequest('/api/salon/appointments', {
      method: 'POST',
      body: JSON.stringify(futureAppointment)
    });
    
    logTestResult(
      'Edge Cases - Future Date Appointment',
      futureResult.success,
      futureResult.error || 'Handled future date correctly'
    );
  }
  
  // Test with special characters in data
  if (testData.firstService && testData.firstStaff) {
    const specialCharAppointment = {
      customer_name: 'Test Customer "Special" <>&\'',
      customer_phone: '9876543210',
      customer_email: 'test+special@example.com',
      service_id: testData.firstService.id,
      staff_id: testData.firstStaff.id,
      scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      duration_minutes: 60,
      amount: 500,
      currency: 'INR',
      payment_status: 'pending',
      notes: 'Test with special characters: <>&"\''
    };
    
    const specialCharResult = await makeRequest('/api/salon/appointments', {
      method: 'POST',
      body: JSON.stringify(specialCharAppointment)
    });
    
    logTestResult(
      'Edge Cases - Special Characters in Data',
      specialCharResult.success,
      specialCharResult.error || 'Handled special characters correctly'
    );
  }
}

/**
 * Main test runner
 */
async function runAllTests() {
  try {
    console.log('🚀 Starting comprehensive testing...\n');
    
    // Run all test suites
    await testApiEndpoints();
    await testQuickBookModal();
    await testCheckInModal();
    await testProcessPaymentModal();
    await testDailySummaryModal();
    await testEditAppointment();
    await testWalkInModal();
    await testDataValidation();
    await testPerformance();
    await testEdgeCases();
    
    // Calculate final results
    passed = results.filter(r => r.passed).length;
    failed = results.filter(r => !r.passed).length;
    
    // Generate comprehensive report
    generateTestReport();
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    logTestResult('Test Execution', false, error.message);
    generateTestReport();
  }
}

/**
 * Generate comprehensive test report
 */
function generateTestReport() {
  console.log('\n' + '=' .repeat(70));
  console.log('📋 COMPREHENSIVE TEST REPORT');
  console.log('=' .repeat(70));
  console.log(`Total Tests: ${results.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / results.length) * 100).toFixed(1)}%`);
  
  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results
      .filter(test => !test.passed)
      .forEach(test => {
        console.log(`   • ${test.name}: ${test.details}`);
      });
  }
  
  console.log('\n📊 Test Categories:');
  const categories = {
    'API Endpoints': results.filter(r => r.name.includes('API')),
    'Quick Book': results.filter(r => r.name.includes('Quick Book')),
    'Check In': results.filter(r => r.name.includes('Check In')),
    'Process Payment': results.filter(r => r.name.includes('Process Payment')),
    'Daily Summary': results.filter(r => r.name.includes('Daily Summary')),
    'Edit Appointment': results.filter(r => r.name.includes('Edit Appointment')),
    'Walk-in': results.filter(r => r.name.includes('Walk-in')),
    'Data Validation': results.filter(r => r.name.includes('Data Validation')),
    'Performance': results.filter(r => r.name.includes('Performance')),
    'Edge Cases': results.filter(r => r.name.includes('Edge Cases'))
  };
  
  Object.entries(categories).forEach(([category, tests]) => {
    if (tests.length > 0) {
      const categoryPassed = tests.filter(t => t.passed).length;
      const categoryRate = ((categoryPassed / tests.length) * 100).toFixed(1);
      console.log(`   ${category}: ${categoryPassed}/${tests.length} (${categoryRate}%)`);
    }
  });
  
  console.log('\n🎯 Overall Assessment:');
  if (failed === 0) {
    console.log('🎉 All tests passed! The salon dashboard is fully functional.');
  } else if (failed <= 3) {
    console.log('✅ Most tests passed. Minor issues detected.');
  } else if (failed <= 6) {
    console.log('⚠️ Some tests failed. Review failed tests above.');
  } else {
    console.log('❌ Multiple test failures. Significant issues detected.');
  }
  
  console.log('\n📱 Next Steps:');
  console.log('   1. Review failed tests and fix critical issues');
  console.log('   2. Test Quick Actions modals manually');
  console.log('   3. Verify edit appointment functionality');
  console.log('   4. Check data loading and display');
  
  console.log('\n🌐 App URL: ' + BASE_URL);
  
  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runAllTests();
