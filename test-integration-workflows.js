/**
 * Integration Workflow Test Suite
 * Tests complete user workflows and data persistence across operations
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

// Test data storage
let testData = {
  createdService: null,
  createdStaff: null,
  createdAppointment: null
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
 * Workflow 1: Complete Service Management Workflow
 */
async function testServiceManagementWorkflow() {
  console.log('\n🔧 Testing Complete Service Management Workflow');
  
  try {
    // Step 1: Create a new service
    console.log('  📝 Step 1: Creating new service...');
    const serviceData = {
      name: 'Test Integration Service',
      description: 'Service created for integration testing',
      category: 'hair',
      subcategory: 'styling',
      base_price: '2500.00',
      currency: 'INR',
      duration_minutes: 90,
      is_active: true,
      display_order: 10,
      tags: ['test', 'integration'],
      images: ['test-image.jpg']
    };
    
    const createResponse = await apiRequest('POST', '/api/salon/services', serviceData);
    if (!createResponse.success) {
      logTestResult('Service Management - Create Service', false, `Failed to create service: ${createResponse.data?.error || createResponse.error}`);
      return;
    }
    
    testData.createdService = createResponse.data.data;
    logTestResult('Service Management - Create Service', true, `Service created with ID: ${testData.createdService.id}`);
    
    // Step 2: Update the service
    console.log('  ✏️ Step 2: Updating service...');
    const updateData = {
      name: 'Updated Integration Service',
      description: 'Updated service description',
      base_price: '3000.00',
      tags: ['test', 'integration', 'updated']
    };
    
    const updateResponse = await apiRequest('PUT', `/api/salon/services/${testData.createdService.id}`, updateData);
    if (!updateResponse.success) {
      logTestResult('Service Management - Update Service', false, `Failed to update service: ${updateResponse.data?.error || updateResponse.error}`);
      return;
    }
    
    logTestResult('Service Management - Update Service', true, 'Service updated successfully');
    
    // Step 3: Verify the update persisted
    console.log('  🔍 Step 3: Verifying update persisted...');
    const verifyResponse = await apiRequest('GET', '/api/salon/services');
    const updatedService = verifyResponse.data.data.find(s => s.id === testData.createdService.id);
    
    const updatePersisted = updatedService && 
                           updatedService.name === 'Updated Integration Service' &&
                           updatedService.base_price === '3000.00' &&
                           updatedService.tags.includes('updated');
    
    logTestResult('Service Management - Verify Update Persistence', updatePersisted, 
      updatePersisted ? 'Update persisted correctly' : 'Update did not persist');
    
    // Step 4: Test partial update
    console.log('  🔧 Step 4: Testing partial update...');
    const partialUpdateData = {
      description: 'Partially updated description only'
    };
    
    const partialUpdateResponse = await apiRequest('PUT', `/api/salon/services/${testData.createdService.id}`, partialUpdateData);
    logTestResult('Service Management - Partial Update', partialUpdateResponse.success, 
      partialUpdateResponse.success ? 'Partial update successful' : `Failed: ${partialUpdateResponse.data?.error || partialUpdateResponse.error}`);
    
    // Step 5: Delete the service
    console.log('  🗑️ Step 5: Deleting service...');
    const deleteResponse = await apiRequest('DELETE', `/api/salon/services/${testData.createdService.id}`);
    logTestResult('Service Management - Delete Service', deleteResponse.success, 
      deleteResponse.success ? 'Service deleted successfully' : `Failed: ${deleteResponse.data?.error || deleteResponse.error}`);
    
  } catch (error) {
    logTestResult('Service Management Workflow', false, `Workflow error: ${error.message}`);
  }
}

/**
 * Workflow 2: Complete Staff Management Workflow
 */
async function testStaffManagementWorkflow() {
  console.log('\n👥 Testing Complete Staff Management Workflow');
  
  try {
    // Step 1: Create a new staff member
    console.log('  📝 Step 1: Creating new staff member...');
    const staffData = {
      name: 'Test Integration Staff',
      email: 'teststaff@example.com',
      phone: '9876543210',
      role: 'stylist',
      specializations: ['Hair', 'Color'],
      working_hours: {
        from: '09:00',
        to: '17:00'
      },
      working_days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      hourly_rate: '500.00',
      commission_rate: '10.00',
      is_active: true,
      notes: 'Staff member created for integration testing'
    };
    
    const createResponse = await apiRequest('POST', '/api/staff/staff', staffData);
    if (!createResponse.success) {
      logTestResult('Staff Management - Create Staff', false, `Failed to create staff: ${createResponse.data?.error || createResponse.error}`);
      return;
    }
    
    testData.createdStaff = createResponse.data.data;
    logTestResult('Staff Management - Create Staff', true, `Staff created with ID: ${testData.createdStaff.id}`);
    
    // Step 2: Update staff member
    console.log('  ✏️ Step 2: Updating staff member...');
    const updateData = {
      name: 'Updated Integration Staff',
      working_days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      hourly_rate: '600.00',
      specializations: ['Hair', 'Color', 'Styling']
    };
    
    const updateResponse = await apiRequest('PUT', `/api/staff/staff/${testData.createdStaff.id}`, updateData);
    if (!updateResponse.success) {
      logTestResult('Staff Management - Update Staff', false, `Failed to update staff: ${updateResponse.data?.error || updateResponse.error}`);
      return;
    }
    
    logTestResult('Staff Management - Update Staff', true, 'Staff updated successfully');
    
    // Step 3: Verify working days persistence
    console.log('  🔍 Step 3: Verifying working days persistence...');
    const verifyResponse = await apiRequest('GET', '/api/staff/staff');
    const updatedStaff = verifyResponse.data.data.find(s => s.id === testData.createdStaff.id);
    
    const workingDaysPersisted = Array.isArray(updatedStaff.working_days) && 
                                updatedStaff.working_days.includes('Sat') &&
                                updatedStaff.working_days.length === 6;
    
    logTestResult('Staff Management - Working Days Persistence', workingDaysPersisted, 
      workingDaysPersisted ? `Working days persisted: ${JSON.stringify(updatedStaff.working_days)}` : 
      `Working days not persisted correctly. Got: ${JSON.stringify(updatedStaff.working_days)}`);
    
    // Step 4: Test partial update
    console.log('  🔧 Step 4: Testing partial update...');
    const partialUpdateData = {
      notes: 'Partially updated notes only'
    };
    
    const partialUpdateResponse = await apiRequest('PUT', `/api/staff/staff/${testData.createdStaff.id}`, partialUpdateData);
    logTestResult('Staff Management - Partial Update', partialUpdateResponse.success, 
      partialUpdateResponse.success ? 'Partial update successful' : `Failed: ${partialUpdateResponse.data?.error || partialUpdateResponse.error}`);
    
    // Step 5: Delete the staff member
    console.log('  🗑️ Step 5: Deleting staff member...');
    const deleteResponse = await apiRequest('DELETE', `/api/staff/staff/${testData.createdStaff.id}`);
    logTestResult('Staff Management - Delete Staff', deleteResponse.success, 
      deleteResponse.success ? 'Staff deleted successfully' : `Failed: ${deleteResponse.data?.error || deleteResponse.error}`);
    
  } catch (error) {
    logTestResult('Staff Management Workflow', false, `Workflow error: ${error.message}`);
  }
}

/**
 * Workflow 3: Complete Appointment Management Workflow
 */
async function testAppointmentManagementWorkflow() {
  console.log('\n📅 Testing Complete Appointment Management Workflow');
  
  try {
    // First, get existing service and staff for the appointment
    console.log('  🔍 Step 0: Getting existing service and staff...');
    const [servicesResponse, staffResponse] = await Promise.all([
      apiRequest('GET', '/api/salon/services'),
      apiRequest('GET', '/api/staff/staff')
    ]);
    
    if (!servicesResponse.success || !servicesResponse.data.data?.length) {
      logTestResult('Appointment Management - Get Services', false, 'No services available for appointment');
      return;
    }
    
    if (!staffResponse.success || !staffResponse.data.data?.length) {
      logTestResult('Appointment Management - Get Staff', false, 'No staff available for appointment');
      return;
    }
    
    const service = servicesResponse.data.data[0];
    const staff = staffResponse.data.data[0];
    
    // Step 1: Create a new appointment
    console.log('  📝 Step 1: Creating new appointment...');
    const appointmentData = {
      customer_name: 'Test Integration Customer',
      customer_phone: '9876543210',
      customer_email: 'testcustomer@example.com',
      service_id: service.id,
      staff_id: staff.id,
      scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      duration_minutes: 90,
      amount: '2500.00',
      currency: 'INR',
      notes: 'Appointment created for integration testing',
      payment_status: 'pending'
    };
    
    const createResponse = await apiRequest('POST', '/api/salon/appointments', appointmentData);
    if (!createResponse.success) {
      logTestResult('Appointment Management - Create Appointment', false, `Failed to create appointment: ${createResponse.data?.error || createResponse.error}`);
      return;
    }
    
    testData.createdAppointment = createResponse.data.data;
    logTestResult('Appointment Management - Create Appointment', true, `Appointment created with ID: ${testData.createdAppointment.id}`);
    
    // Step 2: Update the appointment
    console.log('  ✏️ Step 2: Updating appointment...');
    const updateData = {
      customer_name: 'Updated Integration Customer',
      notes: 'Updated appointment notes',
      payment_status: 'confirmed',
      amount: '3000.00'
    };
    
    const updateResponse = await apiRequest('PUT', `/api/salon/appointments/${testData.createdAppointment.id}`, updateData);
    if (!updateResponse.success) {
      logTestResult('Appointment Management - Update Appointment', false, `Failed to update appointment: ${updateResponse.data?.error || updateResponse.error}`);
      return;
    }
    
    logTestResult('Appointment Management - Update Appointment', true, 'Appointment updated successfully');
    
    // Step 3: Verify the update persisted
    console.log('  🔍 Step 3: Verifying update persisted...');
    const verifyResponse = await apiRequest('GET', '/api/salon/appointments');
    const updatedAppointment = verifyResponse.data.data.find(a => a.id === testData.createdAppointment.id);
    
    const updatePersisted = updatedAppointment && 
                           updatedAppointment.customer_name === 'Updated Integration Customer' &&
                           updatedAppointment.payment_status === 'confirmed' &&
                           updatedAppointment.amount === '3000.00';
    
    logTestResult('Appointment Management - Verify Update Persistence', updatePersisted, 
      updatePersisted ? 'Update persisted correctly' : 'Update did not persist');
    
    // Step 4: Test partial update
    console.log('  🔧 Step 4: Testing partial update...');
    const partialUpdateData = {
      notes: 'Partially updated notes only'
    };
    
    const partialUpdateResponse = await apiRequest('PUT', `/api/salon/appointments/${testData.createdAppointment.id}`, partialUpdateData);
    logTestResult('Appointment Management - Partial Update', partialUpdateResponse.success, 
      partialUpdateResponse.success ? 'Partial update successful' : `Failed: ${partialUpdateResponse.data?.error || partialUpdateResponse.error}`);
    
    // Step 5: Delete the appointment
    console.log('  🗑️ Step 5: Deleting appointment...');
    const deleteResponse = await apiRequest('DELETE', `/api/salon/appointments/${testData.createdAppointment.id}`);
    logTestResult('Appointment Management - Delete Appointment', deleteResponse.success, 
      deleteResponse.success ? 'Appointment deleted successfully' : `Failed: ${deleteResponse.data?.error || deleteResponse.error}`);
    
  } catch (error) {
    logTestResult('Appointment Management Workflow', false, `Workflow error: ${error.message}`);
  }
}

/**
 * Workflow 4: Cross-Resource Integration Test
 */
async function testCrossResourceIntegration() {
  console.log('\n🔗 Testing Cross-Resource Integration');
  
  try {
    // Step 1: Create service, staff, and appointment in sequence
    console.log('  📝 Step 1: Creating service, staff, and appointment...');
    
    // Create service
    const serviceData = {
      name: 'Cross Integration Service',
      description: 'Service for cross-resource testing',
      category: 'hair',
      base_price: '2000.00',
      currency: 'INR',
      duration_minutes: 60,
      is_active: true,
      display_order: 5,
      tags: ['cross', 'integration'],
      images: []
    };
    
    const serviceResponse = await apiRequest('POST', '/api/salon/services', serviceData);
    if (!serviceResponse.success) {
      logTestResult('Cross-Resource Integration - Create Service', false, `Failed to create service: ${serviceResponse.data?.error || serviceResponse.error}`);
      return;
    }
    
    const service = serviceResponse.data.data;
    
    // Create staff
    const staffData = {
      name: 'Cross Integration Staff',
      email: 'crossstaff@example.com',
      phone: '9876543210',
      role: 'stylist',
      specializations: ['Hair'],
      working_hours: { from: '09:00', to: '17:00' },
      working_days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      is_active: true
    };
    
    const staffResponse = await apiRequest('POST', '/api/staff/staff', staffData);
    if (!staffResponse.success) {
      logTestResult('Cross-Resource Integration - Create Staff', false, `Failed to create staff: ${staffResponse.data?.error || staffResponse.error}`);
      return;
    }
    
    const staff = staffResponse.data.data;
    
    // Create appointment using the created service and staff
    const appointmentData = {
      customer_name: 'Cross Integration Customer',
      customer_phone: '9876543210',
      customer_email: 'crosscustomer@example.com',
      service_id: service.id,
      staff_id: staff.id,
      scheduled_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      duration_minutes: 60,
      amount: '2000.00',
      currency: 'INR',
      notes: 'Cross-resource integration test appointment',
      payment_status: 'pending'
    };
    
    const appointmentResponse = await apiRequest('POST', '/api/salon/appointments', appointmentData);
    if (!appointmentResponse.success) {
      logTestResult('Cross-Resource Integration - Create Appointment', false, `Failed to create appointment: ${appointmentResponse.data?.error || appointmentResponse.error}`);
      return;
    }
    
    const appointment = appointmentResponse.data.data;
    logTestResult('Cross-Resource Integration - Create All Resources', true, 'Service, staff, and appointment created successfully');
    
    // Step 2: Verify relationships
    console.log('  🔍 Step 2: Verifying relationships...');
    const verifyResponse = await apiRequest('GET', '/api/salon/appointments');
    const createdAppointment = verifyResponse.data.data.find(a => a.id === appointment.id);
    
    const relationshipsValid = createdAppointment &&
                              createdAppointment.offering_id === service.id &&
                              createdAppointment.staff_id === staff.id;
    
    logTestResult('Cross-Resource Integration - Verify Relationships', relationshipsValid, 
      relationshipsValid ? 'All relationships valid' : 'Relationships not properly established');
    
    // Step 3: Test cascade operations
    console.log('  🔄 Step 3: Testing cascade operations...');
    
    // Update service and verify appointment reflects changes
    const serviceUpdateResponse = await apiRequest('PUT', `/api/salon/services/${service.id}`, {
      name: 'Updated Cross Integration Service'
    });
    
    // Update staff and verify appointment reflects changes
    const staffUpdateResponse = await apiRequest('PUT', `/api/staff/staff/${staff.id}`, {
      name: 'Updated Cross Integration Staff'
    });
    
    const cascadeUpdatesWork = serviceUpdateResponse.success && staffUpdateResponse.success;
    logTestResult('Cross-Resource Integration - Cascade Updates', cascadeUpdatesWork, 
      cascadeUpdatesWork ? 'Cascade updates successful' : 'Cascade updates failed');
    
    // Step 4: Clean up
    console.log('  🧹 Step 4: Cleaning up resources...');
    const [deleteAppointmentResponse, deleteStaffResponse, deleteServiceResponse] = await Promise.all([
      apiRequest('DELETE', `/api/salon/appointments/${appointment.id}`),
      apiRequest('DELETE', `/api/staff/staff/${staff.id}`),
      apiRequest('DELETE', `/api/salon/services/${service.id}`)
    ]);
    
    const cleanupSuccessful = deleteAppointmentResponse.success && 
                             deleteStaffResponse.success && 
                             deleteServiceResponse.success;
    
    logTestResult('Cross-Resource Integration - Cleanup', cleanupSuccessful, 
      cleanupSuccessful ? 'All resources cleaned up successfully' : 'Cleanup failed');
    
  } catch (error) {
    logTestResult('Cross-Resource Integration', false, `Integration error: ${error.message}`);
  }
}

/**
 * Workflow 5: Data Persistence Across Operations
 */
async function testDataPersistenceAcrossOperations() {
  console.log('\n💾 Testing Data Persistence Across Operations');
  
  try {
    // Step 1: Create and update staff member
    console.log('  📝 Step 1: Creating and updating staff member...');
    const staffData = {
      name: 'Persistence Test Staff',
      email: 'persistencetest@example.com',
      phone: '9876543210',
      role: 'stylist',
      specializations: ['Hair', 'Color'],
      working_hours: { from: '09:00', to: '17:00' },
      working_days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      is_active: true,
      notes: 'Initial notes'
    };
    
    const createResponse = await apiRequest('POST', '/api/staff/staff', staffData);
    if (!createResponse.success) {
      logTestResult('Data Persistence - Create Staff', false, `Failed to create staff: ${createResponse.data?.error || createResponse.error}`);
      return;
    }
    
    const staff = createResponse.data.data;
    
    // Step 2: Perform multiple operations
    console.log('  🔄 Step 2: Performing multiple operations...');
    
    // Update 1
    await apiRequest('PUT', `/api/staff/staff/${staff.id}`, {
      working_days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      notes: 'Updated notes - first update'
    });
    
    // Update 2
    await apiRequest('PUT', `/api/staff/staff/${staff.id}`, {
      hourly_rate: '600.00',
      notes: 'Updated notes - second update'
    });
    
    // Update 3
    await apiRequest('PUT', `/api/staff/staff/${staff.id}`, {
      specializations: ['Hair', 'Color', 'Styling'],
      notes: 'Updated notes - third update'
    });
    
    // Step 3: Verify final state
    console.log('  🔍 Step 3: Verifying final state...');
    const verifyResponse = await apiRequest('GET', '/api/staff/staff');
    const finalStaff = verifyResponse.data.data.find(s => s.id === staff.id);
    
    const finalStateCorrect = finalStaff &&
                             finalStaff.working_days.includes('Sat') &&
                             finalStaff.hourly_rate === '600.00' &&
                             finalStaff.specializations.includes('Styling') &&
                             finalStaff.notes === 'Updated notes - third update';
    
    logTestResult('Data Persistence - Final State', finalStateCorrect, 
      finalStateCorrect ? 'Final state preserved correctly' : 'Final state not preserved correctly');
    
    // Step 4: Test navigation simulation (multiple GET requests)
    console.log('  🧭 Step 4: Testing navigation simulation...');
    const navigationTests = [];
    
    for (let i = 0; i < 5; i++) {
      const navResponse = await apiRequest('GET', '/api/staff/staff');
      const navStaff = navResponse.data.data.find(s => s.id === staff.id);
      navigationTests.push(navStaff && navStaff.working_days.includes('Sat'));
    }
    
    const navigationConsistent = navigationTests.every(test => test === true);
    logTestResult('Data Persistence - Navigation Consistency', navigationConsistent, 
      navigationConsistent ? 'Data consistent across navigation' : 'Data inconsistent across navigation');
    
    // Step 5: Clean up
    console.log('  🧹 Step 5: Cleaning up...');
    const deleteResponse = await apiRequest('DELETE', `/api/staff/staff/${staff.id}`);
    logTestResult('Data Persistence - Cleanup', deleteResponse.success, 
      deleteResponse.success ? 'Cleanup successful' : 'Cleanup failed');
    
  } catch (error) {
    logTestResult('Data Persistence Across Operations', false, `Persistence error: ${error.message}`);
  }
}

/**
 * Run all integration workflow tests
 */
async function runAllIntegrationTests() {
  console.log('🚀 Starting Integration Workflow Test Suite');
  console.log('==========================================');
  
  try {
    await testServiceManagementWorkflow();
    await testStaffManagementWorkflow();
    await testAppointmentManagementWorkflow();
    await testCrossResourceIntegration();
    await testDataPersistenceAcrossOperations();
    
  } catch (error) {
    console.error('❌ Integration test suite error:', error);
    testResults.errors.push(error.message);
  }
  
  // Print summary
  console.log('\n📊 Integration Test Results Summary');
  console.log('===================================');
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
  runAllIntegrationTests().then(() => {
    process.exit(testResults.failed > 0 ? 1 : 0);
  });
}

export { runAllIntegrationTests };
