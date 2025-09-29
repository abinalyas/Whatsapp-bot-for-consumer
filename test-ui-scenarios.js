#!/usr/bin/env node

/**
 * UI Scenarios Testing Script for Salon Dashboard
 * Tests specific UI scenarios and user workflows
 */

const BASE_URL = 'https://whatsapp-bot-for-consumer-aj007h6k8-abinalyas-projects.vercel.app';
const TENANT_ID = 'bella-salon';

console.log('🎭 UI Scenarios Testing for Salon Dashboard');
console.log(`📍 URL: ${BASE_URL}`);
console.log('=' .repeat(60));

let passed = 0;
let failed = 0;
const results = [];

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
  if (passed) passed++;
  else failed++;
}

/**
 * Test Scenario 1: Complete Booking Workflow
 */
async function testCompleteBookingWorkflow() {
  console.log('\n🎭 Scenario 1: Complete Booking Workflow...');
  
  // Step 1: Get available services
  const servicesResult = await makeRequest('/api/salon/services');
  if (!servicesResult.success || !servicesResult.data?.data?.length) {
    logTestResult('Booking Workflow - Services Available', false, 'No services found');
    return;
  }
  
  const service = servicesResult.data.data[0];
  logTestResult('Booking Workflow - Services Available', true, `Found ${servicesResult.data.data.length} services`);
  
  // Step 2: Get available staff
  const staffResult = await makeRequest('/api/staff/staff');
  if (!staffResult.success || !staffResult.data?.data?.length) {
    logTestResult('Booking Workflow - Staff Available', false, 'No staff found');
    return;
  }
  
  const staff = staffResult.data.data[0];
  logTestResult('Booking Workflow - Staff Available', true, `Found ${staffResult.data.data.length} staff members`);
  
  // Step 3: Create appointment
  const appointment = {
    customer_name: 'Complete Workflow Customer',
    customer_phone: '9876543210',
    customer_email: 'workflow@example.com',
    service_id: service.id,
    staff_id: staff.id,
    scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    duration_minutes: service.duration_minutes || 60,
    amount: service.base_price || 500,
    currency: 'INR',
    payment_status: 'pending',
    notes: 'Complete workflow test appointment'
  };
  
  const createResult = await makeRequest('/api/salon/appointments', {
    method: 'POST',
    body: JSON.stringify(appointment)
  });
  
  logTestResult(
    'Booking Workflow - Create Appointment',
    createResult.success,
    createResult.error || `Created appointment: ${createResult.data?.data?.customer_name}`
  );
  
  if (!createResult.success) return;
  
  const createdAppointment = createResult.data.data;
  
  // Step 4: Check in customer
  const checkInData = {
    ...createdAppointment,
    payment_status: 'checked-in',
    notes: (createdAppointment.notes || '') + '\nChecked in'
  };
  
  const checkInResult = await makeRequest(`/api/salon/appointments/${createdAppointment.id}`, {
    method: 'PUT',
    body: JSON.stringify(checkInData)
  });
  
  logTestResult(
    'Booking Workflow - Check In Customer',
    checkInResult.success,
    checkInResult.error || 'Customer checked in successfully'
  );
  
  // Step 5: Process payment
  const paymentData = {
    ...checkInData,
    payment_status: 'completed',
    amount: (parseFloat(createdAppointment.amount) || 0) + 100, // Add tip
    notes: (checkInData.notes || '') + '\nPayment processed'
  };
  
  const paymentResult = await makeRequest(`/api/salon/appointments/${createdAppointment.id}`, {
    method: 'PUT',
    body: JSON.stringify(paymentData)
  });
  
  logTestResult(
    'Booking Workflow - Process Payment',
    paymentResult.success,
    paymentResult.error || 'Payment processed successfully'
  );
  
  logTestResult(
    'Booking Workflow - Complete Flow',
    checkInResult.success && paymentResult.success,
    'Complete booking workflow tested successfully'
  );
}

/**
 * Test Scenario 2: Edit Appointment Workflow
 */
async function testEditAppointmentWorkflow() {
  console.log('\n🎭 Scenario 2: Edit Appointment Workflow...');
  
  // Get existing appointments
  const appointmentsResult = await makeRequest('/api/salon/appointments');
  if (!appointmentsResult.success || !appointmentsResult.data?.data?.length) {
    logTestResult('Edit Workflow - Appointments Available', false, 'No appointments found');
    return;
  }
  
  const appointment = appointmentsResult.data.data[0];
  logTestResult('Edit Workflow - Appointments Available', true, `Found ${appointmentsResult.data.data.length} appointments`);
  
  // Fetch appointment for editing
  const fetchResult = await makeRequest(`/api/salon/appointments/${appointment.id}`);
  logTestResult(
    'Edit Workflow - Fetch Appointment',
    fetchResult.success,
    fetchResult.error || `Fetched appointment: ${fetchResult.data?.data?.customer_name}`
  );
  
  if (!fetchResult.success) return;
  
  const originalData = fetchResult.data.data;
  
  // Edit customer details
  const editedData = {
    ...originalData,
    customer_name: `${originalData.customer_name} (Edited)`,
    customer_phone: '9876543211',
    customer_email: 'edited@example.com',
    notes: (originalData.notes || '') + '\nAppointment edited'
  };
  
  const updateResult = await makeRequest(`/api/salon/appointments/${appointment.id}`, {
    method: 'PUT',
    body: JSON.stringify(editedData)
  });
  
  logTestResult(
    'Edit Workflow - Update Customer Details',
    updateResult.success,
    updateResult.error || 'Customer details updated successfully'
  );
  
  // Verify changes
  const verifyResult = await makeRequest(`/api/salon/appointments/${appointment.id}`);
  if (verifyResult.success && verifyResult.data?.success) {
    const updatedData = verifyResult.data.data;
    const nameChanged = updatedData.customer_name.includes('(Edited)');
    const phoneChanged = updatedData.customer_phone === '9876543211';
    
    logTestResult(
      'Edit Workflow - Verify Changes',
      nameChanged && phoneChanged,
      `Name changed: ${nameChanged}, Phone changed: ${phoneChanged}`
    );
  }
}

/**
 * Test Scenario 3: Daily Operations Workflow
 */
async function testDailyOperationsWorkflow() {
  console.log('\n🎭 Scenario 3: Daily Operations Workflow...');
  
  const today = new Date().toISOString().split('T')[0];
  
  // Get today's appointments
  const todayAppointmentsResult = await makeRequest(`/api/salon/appointments?date=${today}`);
  logTestResult(
    'Daily Operations - Fetch Today\'s Appointments',
    todayAppointmentsResult.success,
    todayAppointmentsResult.error || `Found ${todayAppointmentsResult.data?.data?.length || 0} appointments for today`
  );
  
  if (!todayAppointmentsResult.success) return;
  
  const appointments = todayAppointmentsResult.data.data || [];
  
  // Calculate daily metrics
  const totalAppointments = appointments.length;
  const completedAppointments = appointments.filter(apt => apt.payment_status === 'completed').length;
  const pendingAppointments = appointments.filter(apt => apt.payment_status === 'pending').length;
  const totalRevenue = appointments.reduce((sum, apt) => sum + (parseFloat(apt.amount) || 0), 0);
  
  logTestResult(
    'Daily Operations - Calculate Metrics',
    true,
    `Total: ${totalAppointments}, Completed: ${completedAppointments}, Pending: ${pendingAppointments}, Revenue: ₹${totalRevenue}`
  );
  
  // Test service performance analysis
  const serviceCounts = {};
  appointments.forEach(apt => {
    if (apt.service_name) {
      serviceCounts[apt.service_name] = (serviceCounts[apt.service_name] || 0) + 1;
    }
  });
  
  const topServices = Object.entries(serviceCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3);
  
  logTestResult(
    'Daily Operations - Service Analysis',
    topServices.length > 0,
    `Top services: ${topServices.map(([name, count]) => `${name} (${count})`).join(', ')}`
  );
  
  // Test staff performance analysis
  const staffCounts = {};
  appointments.forEach(apt => {
    if (apt.staff_name) {
      staffCounts[apt.staff_name] = (staffCounts[apt.staff_name] || 0) + 1;
    }
  });
  
  const topStaff = Object.entries(staffCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3);
  
  logTestResult(
    'Daily Operations - Staff Analysis',
    topStaff.length > 0,
    `Top staff: ${topStaff.map(([name, count]) => `${name} (${count})`).join(', ')}`
  );
}

/**
 * Test Scenario 4: Error Handling and Recovery
 */
async function testErrorHandlingRecovery() {
  console.log('\n🎭 Scenario 4: Error Handling and Recovery...');
  
  // Test with invalid data types
  const invalidDataAppointment = {
    customer_name: 123, // Should be string
    customer_phone: '9876543210',
    customer_email: 'test@example.com',
    service_id: 'invalid-id',
    scheduled_at: 'invalid-date',
    amount: 'not-a-number',
    currency: 'INR',
    payment_status: 'pending'
  };
  
  const invalidResult = await makeRequest('/api/salon/appointments', {
    method: 'POST',
    body: JSON.stringify(invalidDataAppointment)
  });
  
  logTestResult(
    'Error Handling - Invalid Data Types',
    !invalidResult.success,
    invalidResult.error || 'Should reject invalid data types'
  );
  
  // Test with missing required fields
  const missingFieldsAppointment = {
    customer_name: 'Test Customer'
    // Missing required fields: customer_phone, service_id, scheduled_at, amount
  };
  
  const missingResult = await makeRequest('/api/salon/appointments', {
    method: 'POST',
    body: JSON.stringify(missingFieldsAppointment)
  });
  
  logTestResult(
    'Error Handling - Missing Required Fields',
    !missingResult.success && missingResult.status === 400,
    missingResult.error || `Expected 400, got ${missingResult.status}`
  );
  
  // Test with very large data
  const largeDataAppointment = {
    customer_name: 'Test Customer',
    customer_phone: '9876543210',
    customer_email: 'test@example.com',
    service_id: 'a933c8e9-1440-4b3b-8081-76f57a6a9014',
    staff_id: '41de6656-674d-4e30-85ab-c345fbb39a51',
    scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    duration_minutes: 60,
    amount: 500,
    currency: 'INR',
    payment_status: 'pending',
    notes: 'A'.repeat(10000) // Very large notes field
  };
  
  const largeResult = await makeRequest('/api/salon/appointments', {
    method: 'POST',
    body: JSON.stringify(largeDataAppointment)
  });
  
  logTestResult(
    'Error Handling - Large Data Field',
    largeResult.success,
    largeResult.error || 'Handled large data field correctly'
  );
}

/**
 * Test Scenario 5: Concurrent Operations
 */
async function testConcurrentOperations() {
  console.log('\n🎭 Scenario 5: Concurrent Operations...');
  
  const startTime = Date.now();
  
  // Simulate multiple users booking appointments simultaneously
  const concurrentBookings = Array.from({ length: 5 }, (_, i) => {
    const appointment = {
      customer_name: `Concurrent Customer ${i + 1}`,
      customer_phone: `987654321${i}`,
      customer_email: `concurrent${i}@example.com`,
      service_id: 'a933c8e9-1440-4b3b-8081-76f57a6a9014',
      staff_id: '41de6656-674d-4e30-85ab-c345fbb39a51',
      scheduled_at: new Date(Date.now() + (i + 1) * 60 * 60 * 1000).toISOString(), // Different times
      duration_minutes: 60,
      amount: 500,
      currency: 'INR',
      payment_status: 'pending',
      notes: `Concurrent booking ${i + 1}`
    };
    
    return makeRequest('/api/salon/appointments', {
      method: 'POST',
      body: JSON.stringify(appointment)
    });
  });
  
  const results = await Promise.all(concurrentBookings);
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  const successfulBookings = results.filter(result => result.success).length;
  
  logTestResult(
    'Concurrent Operations - Multiple Bookings',
    successfulBookings === 5,
    `${successfulBookings}/5 bookings successful in ${duration}ms`
  );
  
  // Test concurrent data fetching
  const concurrentFetches = [
    makeRequest('/api/salon/services'),
    makeRequest('/api/staff/staff'),
    makeRequest('/api/salon/appointments'),
    makeRequest('/api/salon/services'),
    makeRequest('/api/staff/staff')
  ];
  
  const fetchResults = await Promise.all(concurrentFetches);
  const successfulFetches = fetchResults.filter(result => result.success).length;
  
  logTestResult(
    'Concurrent Operations - Multiple Fetches',
    successfulFetches === 5,
    `${successfulFetches}/5 fetches successful`
  );
}

/**
 * Test Scenario 6: Data Consistency
 */
async function testDataConsistency() {
  console.log('\n🎭 Scenario 6: Data Consistency...');
  
  // Test that service data is consistent across endpoints
  const servicesResult1 = await makeRequest('/api/salon/services');
  const servicesResult2 = await makeRequest('/api/salon/services');
  
  const services1 = servicesResult1.data?.data || [];
  const services2 = servicesResult2.data?.data || [];
  
  const servicesConsistent = services1.length === services2.length &&
    services1.every((service, index) => 
      service.id === services2[index]?.id && 
      service.name === services2[index]?.name
    );
  
  logTestResult(
    'Data Consistency - Services Data',
    servicesConsistent,
    `Services consistent: ${services1.length} services in both calls`
  );
  
  // Test that appointment data includes all required fields
  const appointmentsResult = await makeRequest('/api/salon/appointments');
  if (appointmentsResult.success && appointmentsResult.data?.data?.length > 0) {
    const appointment = appointmentsResult.data.data[0];
    const hasRequiredFields = appointment.id && 
      appointment.customer_name && 
      appointment.customer_phone && 
      appointment.scheduled_at;
    
    logTestResult(
      'Data Consistency - Appointment Fields',
      hasRequiredFields,
      `Required fields present: ${hasRequiredFields}`
    );
  }
  
  // Test that staff data includes all required fields
  const staffResult = await makeRequest('/api/staff/staff');
  if (staffResult.success && staffResult.data?.data?.length > 0) {
    const staff = staffResult.data.data[0];
    const hasRequiredFields = staff.id && staff.name;
    
    logTestResult(
      'Data Consistency - Staff Fields',
      hasRequiredFields,
      `Required fields present: ${hasRequiredFields}`
    );
  }
}

/**
 * Main test runner
 */
async function runAllScenarios() {
  try {
    console.log('🚀 Starting UI scenarios testing...\n');
    
    await testCompleteBookingWorkflow();
    await testEditAppointmentWorkflow();
    await testDailyOperationsWorkflow();
    await testErrorHandlingRecovery();
    await testConcurrentOperations();
    await testDataConsistency();
    
    // Generate report
    generateScenariosReport();
    
  } catch (error) {
    console.error('❌ Scenarios test execution failed:', error);
    logTestResult('Scenarios Execution', false, error.message);
    generateScenariosReport();
  }
}

/**
 * Generate scenarios test report
 */
function generateScenariosReport() {
  console.log('\n' + '=' .repeat(60));
  console.log('📋 UI SCENARIOS TEST REPORT');
  console.log('=' .repeat(60));
  console.log(`Total Tests: ${results.length}`);
  console.log(`✅ Passed: ${results.filter(r => r.passed).length}`);
  console.log(`❌ Failed: ${results.filter(r => !r.passed).length}`);
  console.log(`Success Rate: ${((results.filter(r => r.passed).length / results.length) * 100).toFixed(1)}%`);
  
  console.log('\n🎭 Scenario Results:');
  const scenarios = {
    'Complete Booking Workflow': results.filter(r => r.name.includes('Booking Workflow')),
    'Edit Appointment Workflow': results.filter(r => r.name.includes('Edit Workflow')),
    'Daily Operations Workflow': results.filter(r => r.name.includes('Daily Operations')),
    'Error Handling and Recovery': results.filter(r => r.name.includes('Error Handling')),
    'Concurrent Operations': results.filter(r => r.name.includes('Concurrent Operations')),
    'Data Consistency': results.filter(r => r.name.includes('Data Consistency'))
  };
  
  Object.entries(scenarios).forEach(([scenario, tests]) => {
    if (tests.length > 0) {
      const scenarioPassed = tests.filter(t => t.passed).length;
      const scenarioRate = ((scenarioPassed / tests.length) * 100).toFixed(1);
      console.log(`   ${scenario}: ${scenarioPassed}/${tests.length} (${scenarioRate}%)`);
    }
  });
  
  if (results.filter(r => !r.passed).length === 0) {
    console.log('\n🎉 All UI scenarios passed! The dashboard workflows are working correctly.');
  } else {
    console.log('\n⚠️ Some UI scenarios failed. Review the failed tests above.');
  }
  
  console.log('\n🌐 App URL: ' + BASE_URL);
}

// Run scenarios
runAllScenarios();
