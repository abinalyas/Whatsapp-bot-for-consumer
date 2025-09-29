/**
 * Comprehensive API Test Suite
 * Tests all CRUD operations, edge cases, and data validation scenarios
 * that were missed in previous test suites
 */

import fetch from 'node-fetch';

const BASE_URL = 'https://whatsapp-bot-for-consumer-aj007h6k8-abinalyas-projects.vercel.app';

// Test configuration
const TEST_CONFIG = {
  headers: {
    'Content-Type': 'application/json',
    'x-tenant-id': 'bella-salon'
  }
};

// Test results tracking
let testResults = {
  passed: 0,
  failed: 0,
  errors: [],
  details: []
};

/**
 * Helper function to make API requests
 */
async function apiRequest(method, endpoint, data = null) {
  const options = {
    method,
    headers: TEST_CONFIG.headers
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const responseData = await response.json();
    
    return {
      status: response.status,
      data: responseData,
      success: response.ok
    };
  } catch (error) {
    return {
      status: 0,
      data: null,
      success: false,
      error: error.message
    };
  }
}

/**
 * Log test result
 */
function logTestResult(testName, passed, details = '') {
  testResults.details.push({
    test: testName,
    status: passed ? 'PASS' : 'FAIL',
    details
  });
  
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${testName} - PASSED`);
  } else {
    testResults.failed++;
    console.log(`❌ ${testName} - FAILED: ${details}`);
  }
}

/**
 * Test 1: Services PUT Endpoint - Complete Data
 */
async function testServicesPutComplete() {
  console.log('\n🔧 Testing Services PUT - Complete Data');
  
  // First, get a service to update
  const servicesResponse = await apiRequest('GET', '/api/salon/services');
  if (!servicesResponse.success || !servicesResponse.data.data?.length) {
    logTestResult('Services PUT - Get Services', false, 'No services found to test');
    return;
  }
  
  const service = servicesResponse.data.data[0];
  const updateData = {
    name: 'Updated Service Name',
    description: 'Updated service description',
    category: 'hair',
    subcategory: 'styling',
    base_price: '2500.00',
    currency: 'INR',
    duration_minutes: 90,
    is_active: true,
    display_order: 1,
    tags: ['popular', 'trending'],
    images: ['image1.jpg', 'image2.jpg']
  };
  
  const response = await apiRequest('PUT', `/api/salon/services/${service.id}`, updateData);
  logTestResult(
    'Services PUT - Complete Data',
    response.success && response.data.success,
    response.success ? 'Service updated successfully' : `Error: ${response.data?.error || response.error}`
  );
}

/**
 * Test 2: Services PUT Endpoint - Partial Data
 */
async function testServicesPutPartial() {
  console.log('\n🔧 Testing Services PUT - Partial Data');
  
  const servicesResponse = await apiRequest('GET', '/api/salon/services');
  if (!servicesResponse.success || !servicesResponse.data.data?.length) {
    logTestResult('Services PUT - Get Services', false, 'No services found to test');
    return;
  }
  
  const service = servicesResponse.data.data[0];
  const partialData = {
    name: 'Partially Updated Service'
  };
  
  const response = await apiRequest('PUT', `/api/salon/services/${service.id}`, partialData);
  logTestResult(
    'Services PUT - Partial Data',
    response.success && response.data.success,
    response.success ? 'Service updated with partial data' : `Error: ${response.data?.error || response.error}`
  );
}

/**
 * Test 3: Services PUT Endpoint - Missing Required Fields
 */
async function testServicesPutMissingFields() {
  console.log('\n🔧 Testing Services PUT - Missing Required Fields');
  
  const servicesResponse = await apiRequest('GET', '/api/salon/services');
  if (!servicesResponse.success || !servicesResponse.data.data?.length) {
    logTestResult('Services PUT - Get Services', false, 'No services found to test');
    return;
  }
  
  const service = servicesResponse.data.data[0];
  const invalidData = {
    // Missing required fields like name, base_price, etc.
    description: 'Only description provided'
  };
  
  const response = await apiRequest('PUT', `/api/salon/services/${service.id}`, invalidData);
  // Should fail with validation error
  logTestResult(
    'Services PUT - Missing Required Fields',
    !response.success && (response.status === 400 || response.status === 500),
    response.success ? 'Should have failed but succeeded' : `Correctly failed: ${response.data?.error || response.error}`
  );
}

/**
 * Test 4: Staff PUT Endpoint - Complete Data
 */
async function testStaffPutComplete() {
  console.log('\n👥 Testing Staff PUT - Complete Data');
  
  const staffResponse = await apiRequest('GET', '/api/staff/staff');
  if (!staffResponse.success || !staffResponse.data.data?.length) {
    logTestResult('Staff PUT - Get Staff', false, 'No staff found to test');
    return;
  }
  
  const staff = staffResponse.data.data[0];
  const updateData = {
    name: 'Updated Staff Member',
    email: 'updated@example.com',
    phone: '9876543210',
    role: 'senior_stylist',
    specializations: ['Hair', 'Color', 'Styling'],
    working_hours: {
      from: '09:00',
      to: '18:00'
    },
    working_days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    hourly_rate: '500.00',
    commission_rate: '10.00',
    is_active: true,
    notes: 'Updated staff notes',
    avatar_url: 'https://example.com/avatar.jpg'
  };
  
  const response = await apiRequest('PUT', `/api/staff/staff/${staff.id}`, updateData);
  logTestResult(
    'Staff PUT - Complete Data',
    response.success && response.data.success,
    response.success ? 'Staff updated successfully' : `Error: ${response.data?.error || response.error}`
  );
}

/**
 * Test 5: Staff PUT Endpoint - Working Days Persistence
 */
async function testStaffWorkingDaysPersistence() {
  console.log('\n👥 Testing Staff PUT - Working Days Persistence');
  
  const staffResponse = await apiRequest('GET', '/api/staff/staff');
  if (!staffResponse.success || !staffResponse.data.data?.length) {
    logTestResult('Staff PUT - Get Staff', false, 'No staff found to test');
    return;
  }
  
  const staff = staffResponse.data.data[0];
  const workingDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Update with working days
  const updateResponse = await apiRequest('PUT', `/api/staff/staff/${staff.id}`, {
    working_days: workingDays
  });
  
  if (!updateResponse.success) {
    logTestResult('Staff PUT - Working Days Update', false, `Update failed: ${updateResponse.data?.error || updateResponse.error}`);
    return;
  }
  
  // Verify working days are persisted
  const verifyResponse = await apiRequest('GET', '/api/staff/staff');
  const updatedStaff = verifyResponse.data.data.find(s => s.id === staff.id);
  
  const workingDaysPersisted = Array.isArray(updatedStaff.working_days) && 
    updatedStaff.working_days.length === workingDays.length &&
    workingDays.every(day => updatedStaff.working_days.includes(day));
  
  logTestResult(
    'Staff PUT - Working Days Persistence',
    workingDaysPersisted,
    workingDaysPersisted ? 
      `Working days persisted correctly: ${JSON.stringify(updatedStaff.working_days)}` : 
      `Working days not persisted. Expected: ${JSON.stringify(workingDays)}, Got: ${JSON.stringify(updatedStaff.working_days)}`
  );
}

/**
 * Test 6: Staff PUT Endpoint - Partial Data
 */
async function testStaffPutPartial() {
  console.log('\n👥 Testing Staff PUT - Partial Data');
  
  const staffResponse = await apiRequest('GET', '/api/staff/staff');
  if (!staffResponse.success || !staffResponse.data.data?.length) {
    logTestResult('Staff PUT - Get Staff', false, 'No staff found to test');
    return;
  }
  
  const staff = staffResponse.data.data[0];
  const partialData = {
    name: 'Partially Updated Staff'
  };
  
  const response = await apiRequest('PUT', `/api/staff/staff/${staff.id}`, partialData);
  logTestResult(
    'Staff PUT - Partial Data',
    response.success && response.data.success,
    response.success ? 'Staff updated with partial data' : `Error: ${response.data?.error || response.error}`
  );
}

/**
 * Test 7: Staff PUT Endpoint - Missing Required Fields
 */
async function testStaffPutMissingFields() {
  console.log('\n👥 Testing Staff PUT - Missing Required Fields');
  
  const staffResponse = await apiRequest('GET', '/api/staff/staff');
  if (!staffResponse.success || !staffResponse.data.data?.length) {
    logTestResult('Staff PUT - Get Staff', false, 'No staff found to test');
    return;
  }
  
  const staff = staffResponse.data.data[0];
  const invalidData = {
    // Missing required fields like name, role, etc.
    email: 'only@email.com'
  };
  
  const response = await apiRequest('PUT', `/api/staff/staff/${staff.id}`, invalidData);
  // Should fail with validation error
  logTestResult(
    'Staff PUT - Missing Required Fields',
    !response.success && (response.status === 400 || response.status === 500),
    response.success ? 'Should have failed but succeeded' : `Correctly failed: ${response.data?.error || response.error}`
  );
}

/**
 * Test 8: Appointments PUT Endpoint - Complete Data
 */
async function testAppointmentsPutComplete() {
  console.log('\n📅 Testing Appointments PUT - Complete Data');
  
  const appointmentsResponse = await apiRequest('GET', '/api/salon/appointments');
  if (!appointmentsResponse.success || !appointmentsResponse.data.data?.length) {
    logTestResult('Appointments PUT - Get Appointments', false, 'No appointments found to test');
    return;
  }
  
  const appointment = appointmentsResponse.data.data[0];
  const updateData = {
    customer_name: 'Updated Customer Name',
    customer_phone: '9876543210',
    customer_email: 'updated@example.com',
    service_id: appointment.offering_id,
    staff_id: appointment.staff_id,
    scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    duration_minutes: 90,
    amount: '3000.00',
    currency: 'INR',
    notes: 'Updated appointment notes',
    payment_status: 'confirmed'
  };
  
  const response = await apiRequest('PUT', `/api/salon/appointments/${appointment.id}`, updateData);
  logTestResult(
    'Appointments PUT - Complete Data',
    response.success && response.data.success,
    response.success ? 'Appointment updated successfully' : `Error: ${response.data?.error || response.error}`
  );
}

/**
 * Test 9: Appointments PUT Endpoint - Partial Data
 */
async function testAppointmentsPutPartial() {
  console.log('\n📅 Testing Appointments PUT - Partial Data');
  
  const appointmentsResponse = await apiRequest('GET', '/api/salon/appointments');
  if (!appointmentsResponse.success || !appointmentsResponse.data.data?.length) {
    logTestResult('Appointments PUT - Get Appointments', false, 'No appointments found to test');
    return;
  }
  
  const appointment = appointmentsResponse.data.data[0];
  const partialData = {
    customer_name: 'Partially Updated Customer',
    notes: 'Updated notes only'
  };
  
  const response = await apiRequest('PUT', `/api/salon/appointments/${appointment.id}`, partialData);
  logTestResult(
    'Appointments PUT - Partial Data',
    response.success && response.data.success,
    response.success ? 'Appointment updated with partial data' : `Error: ${response.data?.error || response.error}`
  );
}

/**
 * Test 10: Database Schema Validation - Services Table
 */
async function testServicesSchemaValidation() {
  console.log('\n🗄️ Testing Services Schema Validation');
  
  const servicesResponse = await apiRequest('GET', '/api/salon/services');
  if (!servicesResponse.success || !servicesResponse.data.data?.length) {
    logTestResult('Services Schema - Get Services', false, 'No services found to test');
    return;
  }
  
  const service = servicesResponse.data.data[0];
  const requiredFields = ['id', 'name', 'base_price', 'currency', 'duration_minutes', 'is_active', 'display_order', 'tags', 'images'];
  const missingFields = requiredFields.filter(field => service[field] === undefined);
  
  logTestResult(
    'Services Schema Validation',
    missingFields.length === 0,
    missingFields.length === 0 ? 
      'All required fields present' : 
      `Missing fields: ${missingFields.join(', ')}`
  );
}

/**
 * Test 11: Database Schema Validation - Staff Table
 */
async function testStaffSchemaValidation() {
  console.log('\n🗄️ Testing Staff Schema Validation');
  
  const staffResponse = await apiRequest('GET', '/api/staff/staff');
  if (!staffResponse.success || !staffResponse.data.data?.length) {
    logTestResult('Staff Schema - Get Staff', false, 'No staff found to test');
    return;
  }
  
  const staff = staffResponse.data.data[0];
  const requiredFields = ['id', 'name', 'email', 'phone', 'role', 'specializations', 'working_hours', 'working_days', 'is_active'];
  const missingFields = requiredFields.filter(field => staff[field] === undefined);
  
  logTestResult(
    'Staff Schema Validation',
    missingFields.length === 0,
    missingFields.length === 0 ? 
      'All required fields present' : 
      `Missing fields: ${missingFields.join(', ')}`
  );
}

/**
 * Test 12: Database Schema Validation - Appointments Table
 */
async function testAppointmentsSchemaValidation() {
  console.log('\n🗄️ Testing Appointments Schema Validation');
  
  const appointmentsResponse = await apiRequest('GET', '/api/salon/appointments');
  if (!appointmentsResponse.success || !appointmentsResponse.data.data?.length) {
    logTestResult('Appointments Schema - Get Appointments', false, 'No appointments found to test');
    return;
  }
  
  const appointment = appointmentsResponse.data.data[0];
  const requiredFields = ['id', 'customer_name', 'customer_phone', 'scheduled_at', 'amount', 'currency', 'payment_status'];
  const missingFields = requiredFields.filter(field => appointment[field] === undefined);
  
  logTestResult(
    'Appointments Schema Validation',
    missingFields.length === 0,
    missingFields.length === 0 ? 
      'All required fields present' : 
      `Missing fields: ${missingFields.join(', ')}`
  );
}

/**
 * Test 13: JSON Field Handling - Services Images
 */
async function testServicesJsonFieldHandling() {
  console.log('\n🔧 Testing Services JSON Field Handling');
  
  const servicesResponse = await apiRequest('GET', '/api/salon/services');
  if (!servicesResponse.success || !servicesResponse.data.data?.length) {
    logTestResult('Services JSON - Get Services', false, 'No services found to test');
    return;
  }
  
  const service = servicesResponse.data.data[0];
  const jsonData = {
    images: ['image1.jpg', 'image2.jpg', 'image3.jpg'],
    tags: ['tag1', 'tag2', 'tag3']
  };
  
  const response = await apiRequest('PUT', `/api/salon/services/${service.id}`, jsonData);
  
  if (!response.success) {
    logTestResult('Services JSON Field Handling', false, `Update failed: ${response.data?.error || response.error}`);
    return;
  }
  
  // Verify JSON fields are handled correctly
  const verifyResponse = await apiRequest('GET', '/api/salon/services');
  const updatedService = verifyResponse.data.data.find(s => s.id === service.id);
  
  const imagesHandled = Array.isArray(updatedService.images);
  const tagsHandled = Array.isArray(updatedService.tags);
  
  logTestResult(
    'Services JSON Field Handling',
    imagesHandled && tagsHandled,
    `Images array: ${imagesHandled}, Tags array: ${tagsHandled}`
  );
}

/**
 * Test 14: JSON Field Handling - Staff Working Days
 */
async function testStaffJsonFieldHandling() {
  console.log('\n👥 Testing Staff JSON Field Handling');
  
  const staffResponse = await apiRequest('GET', '/api/staff/staff');
  if (!staffResponse.success || !staffResponse.data.data?.length) {
    logTestResult('Staff JSON - Get Staff', false, 'No staff found to test');
    return;
  }
  
  const staff = staffResponse.data.data[0];
  const jsonData = {
    working_days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    specializations: ['Hair', 'Color', 'Styling']
  };
  
  const response = await apiRequest('PUT', `/api/staff/staff/${staff.id}`, jsonData);
  
  if (!response.success) {
    logTestResult('Staff JSON Field Handling', false, `Update failed: ${response.data?.error || response.error}`);
    return;
  }
  
  // Verify JSON fields are handled correctly
  const verifyResponse = await apiRequest('GET', '/api/staff/staff');
  const updatedStaff = verifyResponse.data.data.find(s => s.id === staff.id);
  
  const workingDaysHandled = Array.isArray(updatedStaff.working_days);
  const specializationsHandled = Array.isArray(updatedStaff.specializations);
  
  logTestResult(
    'Staff JSON Field Handling',
    workingDaysHandled && specializationsHandled,
    `Working days array: ${workingDaysHandled}, Specializations array: ${specializationsHandled}`
  );
}

/**
 * Test 15: Error Handling - Invalid UUID
 */
async function testInvalidUuidHandling() {
  console.log('\n❌ Testing Invalid UUID Handling');
  
  const invalidUuid = 'invalid-uuid-format';
  const response = await apiRequest('PUT', `/api/salon/services/${invalidUuid}`, { name: 'Test' });
  
  logTestResult(
    'Invalid UUID Handling',
    !response.success && (response.status === 400 || response.status === 404 || response.status === 500),
    response.success ? 'Should have failed but succeeded' : `Correctly failed with status ${response.status}`
  );
}

/**
 * Test 16: Error Handling - Non-existent Resource
 */
async function testNonExistentResourceHandling() {
  console.log('\n❌ Testing Non-existent Resource Handling');
  
  const fakeUuid = '00000000-0000-0000-0000-000000000000';
  const response = await apiRequest('PUT', `/api/salon/services/${fakeUuid}`, { name: 'Test' });
  
  logTestResult(
    'Non-existent Resource Handling',
    !response.success && (response.status === 404 || response.status === 500),
    response.success ? 'Should have failed but succeeded' : `Correctly failed with status ${response.status}`
  );
}

/**
 * Test 17: Data Type Validation - Numeric Fields
 */
async function testNumericFieldValidation() {
  console.log('\n🔢 Testing Numeric Field Validation');
  
  const servicesResponse = await apiRequest('GET', '/api/salon/services');
  if (!servicesResponse.success || !servicesResponse.data.data?.length) {
    logTestResult('Numeric Validation - Get Services', false, 'No services found to test');
    return;
  }
  
  const service = servicesResponse.data.data[0];
  const invalidData = {
    base_price: 'invalid-price',
    duration_minutes: 'not-a-number'
  };
  
  const response = await apiRequest('PUT', `/api/salon/services/${service.id}`, invalidData);
  
  logTestResult(
    'Numeric Field Validation',
    !response.success,
    response.success ? 'Should have failed but succeeded' : `Correctly failed: ${response.data?.error || response.error}`
  );
}

/**
 * Test 18: Data Type Validation - Date Fields
 */
async function testDateFieldValidation() {
  console.log('\n📅 Testing Date Field Validation');
  
  const appointmentsResponse = await apiRequest('GET', '/api/salon/appointments');
  if (!appointmentsResponse.success || !appointmentsResponse.data.data?.length) {
    logTestResult('Date Validation - Get Appointments', false, 'No appointments found to test');
    return;
  }
  
  const appointment = appointmentsResponse.data.data[0];
  const invalidData = {
    scheduled_at: 'invalid-date-format'
  };
  
  const response = await apiRequest('PUT', `/api/salon/appointments/${appointment.id}`, invalidData);
  
  logTestResult(
    'Date Field Validation',
    !response.success,
    response.success ? 'Should have failed but succeeded' : `Correctly failed: ${response.data?.error || response.error}`
  );
}

/**
 * Test 19: Edge Case - Empty Arrays
 */
async function testEmptyArraysHandling() {
  console.log('\n📝 Testing Empty Arrays Handling');
  
  const servicesResponse = await apiRequest('GET', '/api/salon/services');
  if (!servicesResponse.success || !servicesResponse.data.data?.length) {
    logTestResult('Empty Arrays - Get Services', false, 'No services found to test');
    return;
  }
  
  const service = servicesResponse.data.data[0];
  const emptyArrayData = {
    tags: [],
    images: []
  };
  
  const response = await apiRequest('PUT', `/api/salon/services/${service.id}`, emptyArrayData);
  
  if (!response.success) {
    logTestResult('Empty Arrays Handling', false, `Update failed: ${response.data?.error || response.error}`);
    return;
  }
  
  // Verify empty arrays are handled correctly
  const verifyResponse = await apiRequest('GET', '/api/salon/services');
  const updatedService = verifyResponse.data.data.find(s => s.id === service.id);
  
  const emptyArraysHandled = Array.isArray(updatedService.tags) && 
                            Array.isArray(updatedService.images) &&
                            updatedService.tags.length === 0 &&
                            updatedService.images.length === 0;
  
  logTestResult(
    'Empty Arrays Handling',
    emptyArraysHandled,
    `Empty arrays handled correctly: tags=${updatedService.tags.length}, images=${updatedService.images.length}`
  );
}

/**
 * Test 20: Edge Case - Null Values
 */
async function testNullValuesHandling() {
  console.log('\n🔍 Testing Null Values Handling');
  
  const staffResponse = await apiRequest('GET', '/api/staff/staff');
  if (!staffResponse.success || !staffResponse.data.data?.length) {
    logTestResult('Null Values - Get Staff', false, 'No staff found to test');
    return;
  }
  
  const staff = staffResponse.data.data[0];
  const nullData = {
    notes: null,
    avatar_url: null,
    hourly_rate: null
  };
  
  const response = await apiRequest('PUT', `/api/staff/staff/${staff.id}`, nullData);
  
  logTestResult(
    'Null Values Handling',
    response.success,
    response.success ? 'Null values handled correctly' : `Failed: ${response.data?.error || response.error}`
  );
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('🚀 Starting Comprehensive API Test Suite');
  console.log('=====================================');
  
  try {
    await testServicesPutComplete();
    await testServicesPutPartial();
    await testServicesPutMissingFields();
    await testStaffPutComplete();
    await testStaffWorkingDaysPersistence();
    await testStaffPutPartial();
    await testStaffPutMissingFields();
    await testAppointmentsPutComplete();
    await testAppointmentsPutPartial();
    await testServicesSchemaValidation();
    await testStaffSchemaValidation();
    await testAppointmentsSchemaValidation();
    await testServicesJsonFieldHandling();
    await testStaffJsonFieldHandling();
    await testInvalidUuidHandling();
    await testNonExistentResourceHandling();
    await testNumericFieldValidation();
    await testDateFieldValidation();
    await testEmptyArraysHandling();
    await testNullValuesHandling();
    
  } catch (error) {
    console.error('❌ Test suite error:', error);
    testResults.errors.push(error.message);
  }
  
  // Print summary
  console.log('\n📊 Test Results Summary');
  console.log('=======================');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`🔍 Total: ${testResults.passed + testResults.failed}`);
  console.log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
  
  if (testResults.errors.length > 0) {
    console.log('\n🚨 Errors:');
    testResults.errors.forEach(error => console.log(`  - ${error}`));
  }
  
  console.log('\n📋 Detailed Results:');
  testResults.details.forEach(result => {
    const icon = result.status === 'PASS' ? '✅' : '❌';
    console.log(`  ${icon} ${result.test}: ${result.details}`);
  });
  
  return testResults;
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().then(() => {
    process.exit(testResults.failed > 0 ? 1 : 0);
  });
}

export { runAllTests };
