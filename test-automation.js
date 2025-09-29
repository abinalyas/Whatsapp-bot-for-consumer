#!/usr/bin/env node

/**
 * Automated Testing Script for Salon Dashboard
 * Tests all Quick Actions modals and edit appointment functionality
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const BASE_URL = process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}` 
  : 'http://localhost:5000';

const TENANT_ID = 'bella-salon';

console.log('🧪 Starting Automated Testing for Salon Dashboard');
console.log(`📍 Testing URL: ${BASE_URL}`);
console.log(`🏢 Tenant ID: ${TENANT_ID}`);
console.log('=' .repeat(60));

// Test configuration
const TEST_CONFIG = {
  timeout: 30000, // 30 seconds timeout for each test
  retries: 3,
  delay: 1000 // 1 second delay between tests
};

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

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
    },
    timeout: TEST_CONFIG.timeout
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
  testResults.total++;
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${testName}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${testName}`);
    if (details) {
      console.log(`   ${details}`);
    }
  }
  testResults.details.push({ name: testName, passed, details });
}

/**
 * Test API endpoints availability
 */
async function testApiEndpoints() {
  console.log('\n🔍 Testing API Endpoints...');
  
  // Test services endpoint
  const servicesResult = await makeRequest('/api/salon/services');
  logTestResult(
    'Services API Endpoint',
    servicesResult.success && servicesResult.data?.success,
    servicesResult.error || `Found ${servicesResult.data?.data?.length || 0} services`
  );
  
  // Test staff endpoint
  const staffResult = await makeRequest('/api/staff/staff');
  logTestResult(
    'Staff API Endpoint',
    staffResult.success && staffResult.data?.success,
    staffResult.error || `Found ${staffResult.data?.data?.length || 0} staff members`
  );
  
  // Test appointments endpoint
  const appointmentsResult = await makeRequest('/api/salon/appointments');
  logTestResult(
    'Appointments API Endpoint',
    appointmentsResult.success && appointmentsResult.data?.success,
    appointmentsResult.error || `Found ${appointmentsResult.data?.data?.length || 0} appointments`
  );
  
  return {
    services: servicesResult,
    staff: staffResult,
    appointments: appointmentsResult
  };
}

/**
 * Test Quick Book functionality
 */
async function testQuickBook(servicesData, staffData) {
  console.log('\n📅 Testing Quick Book Modal...');
  
  // Test creating a new appointment
  const testAppointment = {
    customer_name: 'Test Customer',
    customer_phone: '9876543210',
    customer_email: 'test@example.com',
    service_id: servicesData.data?.data?.[0]?.id,
    staff_id: staffData.data?.data?.[0]?.id,
    scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    duration_minutes: 60,
    amount: 500,
    currency: 'INR',
    payment_status: 'pending',
    notes: 'Automated test appointment'
  };
  
  const createResult = await makeRequest('/api/salon/appointments', {
    method: 'POST',
    body: JSON.stringify(testAppointment)
  });
  
  logTestResult(
    'Quick Book - Create Appointment',
    createResult.success && createResult.data?.success,
    createResult.error || `Created appointment ID: ${createResult.data?.data?.id}`
  );
  
  return createResult;
}

/**
 * Test Check In functionality
 */
async function testCheckIn(appointmentsData) {
  console.log('\n✅ Testing Check In Modal...');
  
  const pendingAppointments = appointmentsData.data?.data?.filter(apt => 
    apt.payment_status === 'pending' || apt.payment_status === 'confirmed'
  );
  
  if (!pendingAppointments || pendingAppointments.length === 0) {
    logTestResult(
      'Check In - No Pending Appointments',
      false,
      'No pending appointments found for testing'
    );
    return null;
  }
  
  const appointmentId = pendingAppointments[0].id;
  
  // Test fetching single appointment
  const fetchResult = await makeRequest(`/api/salon/appointments/${appointmentId}`);
  logTestResult(
    'Check In - Fetch Single Appointment',
    fetchResult.success && fetchResult.data?.success,
    fetchResult.error || `Fetched appointment: ${fetchResult.data?.data?.customer_name}`
  );
  
  // Test check-in update
  const checkInData = {
    ...fetchResult.data?.data,
    payment_status: 'checked-in',
    notes: (fetchResult.data?.data?.notes || '') + '\nChecked in via automated test'
  };
  
  const updateResult = await makeRequest(`/api/salon/appointments/${appointmentId}`, {
    method: 'PUT',
    body: JSON.stringify(checkInData)
  });
  
  logTestResult(
    'Check In - Update Status',
    updateResult.success && updateResult.data?.success,
    updateResult.error || `Updated appointment status to: ${checkInData.payment_status}`
  );
  
  return updateResult;
}

/**
 * Test Process Payment functionality
 */
async function testProcessPayment(appointmentsData) {
  console.log('\n💳 Testing Process Payment Modal...');
  
  const checkInAppointments = appointmentsData.data?.data?.filter(apt => 
    apt.payment_status === 'checked-in'
  );
  
  if (!checkInAppointments || checkInAppointments.length === 0) {
    logTestResult(
      'Process Payment - No Checked-in Appointments',
      false,
      'No checked-in appointments found for testing'
    );
    return null;
  }
  
  const appointmentId = checkInAppointments[0].id;
  
  // Test payment processing
  const paymentData = {
    amount: 750, // Including tip
    payment_method: 'UPI',
    notes: 'Payment processed via automated test'
  };
  
  const paymentResult = await makeRequest(`/api/salon/appointments/${appointmentId}`, {
    method: 'PUT',
    body: JSON.stringify({
      ...checkInAppointments[0],
      payment_status: 'completed',
      amount: paymentData.amount,
      notes: (checkInAppointments[0].notes || '') + `\nPayment: ${paymentData.payment_method} - ${paymentData.notes}`
    })
  });
  
  logTestResult(
    'Process Payment - Complete Payment',
    paymentResult.success && paymentResult.data?.success,
    paymentResult.error || `Payment processed: ₹${paymentData.amount}`
  );
  
  return paymentResult;
}

/**
 * Test Daily Summary functionality
 */
async function testDailySummary() {
  console.log('\n📊 Testing Daily Summary Modal...');
  
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
  }
  
  return appointmentsResult;
}

/**
 * Test Edit Appointment functionality
 */
async function testEditAppointment(appointmentsData, servicesData, staffData) {
  console.log('\n✏️ Testing Edit Appointment Modal...');
  
  const appointments = appointmentsData.data?.data || [];
  if (appointments.length === 0) {
    logTestResult(
      'Edit Appointment - No Appointments',
      false,
      'No appointments found for testing'
    );
    return null;
  }
  
  const appointment = appointments[0];
  const appointmentId = appointment.id;
  
  // Test fetching single appointment for editing
  const fetchResult = await makeRequest(`/api/salon/appointments/${appointmentId}`);
  logTestResult(
    'Edit Appointment - Fetch for Editing',
    fetchResult.success && fetchResult.data?.success,
    fetchResult.error || `Fetched appointment: ${fetchResult.data?.data?.customer_name}`
  );
  
  if (fetchResult.success && fetchResult.data?.success) {
    const appointmentData = fetchResult.data.data;
    
    // Test updating appointment
    const updateData = {
      ...appointmentData,
      customer_name: `${appointmentData.customer_name} (Edited)`,
      notes: (appointmentData.notes || '') + '\nEdited via automated test'
    };
    
    const updateResult = await makeRequest(`/api/salon/appointments/${appointmentId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
    
    logTestResult(
      'Edit Appointment - Update Appointment',
      updateResult.success && updateResult.data?.success,
      updateResult.error || `Updated appointment: ${updateData.customer_name}`
    );
    
    return updateResult;
  }
  
  return fetchResult;
}

/**
 * Test Walk-in functionality
 */
async function testWalkIn(servicesData, staffData) {
  console.log('\n🚶 Testing Walk-in Modal...');
  
  // Test creating a walk-in appointment
  const walkInAppointment = {
    customer_name: 'Walk-in Customer',
    customer_phone: '9876543211',
    customer_email: 'walkin@example.com',
    service_id: servicesData.data?.data?.[0]?.id,
    staff_id: staffData.data?.data?.[0]?.id,
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
  
  return createResult;
}

/**
 * Main test runner
 */
async function runAllTests() {
  try {
    console.log('🚀 Starting comprehensive testing...\n');
    
    // Test API endpoints first
    const apiResults = await testApiEndpoints();
    
    if (!apiResults.services.success || !apiResults.staff.success || !apiResults.appointments.success) {
      console.log('\n❌ Critical API endpoints failed. Stopping tests.');
      return;
    }
    
    // Wait a moment between test suites
    await new Promise(resolve => setTimeout(resolve, TEST_CONFIG.delay));
    
    // Test Quick Book
    await testQuickBook(apiResults.services, apiResults.staff);
    
    await new Promise(resolve => setTimeout(resolve, TEST_CONFIG.delay));
    
    // Test Check In
    await testCheckIn(apiResults.appointments);
    
    await new Promise(resolve => setTimeout(resolve, TEST_CONFIG.delay));
    
    // Test Process Payment
    await testProcessPayment(apiResults.appointments);
    
    await new Promise(resolve => setTimeout(resolve, TEST_CONFIG.delay));
    
    // Test Daily Summary
    await testDailySummary();
    
    await new Promise(resolve => setTimeout(resolve, TEST_CONFIG.delay));
    
    // Test Edit Appointment
    await testEditAppointment(apiResults.appointments, apiResults.services, apiResults.staff);
    
    await new Promise(resolve => setTimeout(resolve, TEST_CONFIG.delay));
    
    // Test Walk-in
    await testWalkIn(apiResults.services, apiResults.staff);
    
    // Generate test report
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
  console.log('\n' + '=' .repeat(60));
  console.log('📋 TEST REPORT');
  console.log('=' .repeat(60));
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
  
  if (testResults.failed > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.details
      .filter(test => !test.passed)
      .forEach(test => {
        console.log(`   • ${test.name}: ${test.details}`);
      });
  }
  
  console.log('\n📊 Detailed Results:');
  testResults.details.forEach(test => {
    const status = test.passed ? '✅' : '❌';
    console.log(`   ${status} ${test.name}`);
  });
  
  console.log('\n🎯 Testing completed!');
  
  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests();
}

export { runAllTests, testApiEndpoints, testQuickBook, testCheckIn, testProcessPayment, testDailySummary, testEditAppointment, testWalkIn };
