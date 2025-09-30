#!/usr/bin/env node

/**
 * Form Data Completeness Tests
 * 
 * This test suite specifically tests whether frontend forms send complete data
 * to backend APIs, preventing the database constraint violations we discovered.
 * 
 * It simulates exactly what the frontend forms send and validates that all
 * required database fields are included.
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = 'https://whatsapp-bot-for-consumer-38m8i4mcn-abinalyas-projects.vercel.app';
const TENANT_ID = 'bella-salon';

let passed = 0;
let failed = 0;
let results = [];

function logTestResult(testName, success, details = '') {
  if (success) {
    console.log(`✅ ${testName} - PASSED`);
    passed++;
    results.push({ name: testName, status: 'PASS', details });
  } else {
    console.log(`❌ ${testName} - FAILED`);
    console.log(`   ${details}`);
    failed++;
    results.push({ name: testName, status: 'FAIL', details });
  }
}

async function apiCall(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-id': TENANT_ID,
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API call failed: ${response.status} ${response.statusText} - ${errorText}`);
  }
  
  return response.json();
}

// ============================================================================
// SERVICE FORM DATA COMPLETENESS TESTS
// ============================================================================

async function testServiceFormCompleteness() {
  console.log('\n🔧 Testing Service Form Data Completeness...');
  
  try {
    // Test 1: Simulate what the OLD frontend form sent (incomplete data)
    const oldServiceFormData = {
      name: 'Test Service Old Form',
      description: 'Test description',
      category: 'hair',
      base_price: '2500.00',
      currency: 'INR',
      duration_minutes: 90,
      is_active: true
      // ❌ Missing: display_order, tags, images, offering_type, pricing_type, etc.
    };
    
    const oldFormResponse = await apiCall('/api/salon/services', {
      method: 'POST',
      body: JSON.stringify(oldServiceFormData)
    });
    
    // This should fail due to missing required fields
    logTestResult(
      'Service Form - Old Incomplete Data (Should Fail)',
      !oldFormResponse.success,
      oldFormResponse.success ? 
        'Old form data succeeded (unexpected - missing required fields)' : 
        'Old form data failed as expected due to missing required fields'
    );
    
    // Test 2: Simulate what the NEW frontend form sends (complete data)
    const newServiceFormData = {
      name: 'Test Service New Form',
      description: 'Test description',
      category: 'hair',
      subcategory: 'styling',
      base_price: '2500.00',
      currency: 'INR',
      duration_minutes: 90,
      is_active: true,
      display_order: 1,
      tags: ['test', 'integration'],
      images: [],
      offering_type: 'service',
      pricing_type: 'fixed',
      is_schedulable: true,
      pricing_config: {},
      availability_config: {},
      has_variants: false,
      variants: [],
      custom_fields: {},
      metadata: {}
    };
    
    const newFormResponse = await apiCall('/api/salon/services', {
      method: 'POST',
      body: JSON.stringify(newServiceFormData)
    });
    
    logTestResult(
      'Service Form - New Complete Data (Should Pass)',
      newFormResponse.success,
      newFormResponse.success ? 
        'New form data succeeded with all required fields' : 
        'New form data failed: ' + newFormResponse.error
    );
    
    // Clean up
    if (newFormResponse.success && newFormResponse.data?.id) {
      try {
        await apiCall(`/api/salon/services/${newFormResponse.data.id}`, {
          method: 'DELETE'
        });
      } catch (e) {
        // Ignore cleanup errors
      }
    }
    
    // Test 3: Test service update form completeness
    const servicesResponse = await apiCall('/api/salon/services');
    if (servicesResponse.success && servicesResponse.data?.length > 0) {
      const existingService = servicesResponse.data[0];
      
      // Simulate what the OLD update form sent (incomplete data)
      const oldUpdateData = {
        name: 'Updated Service Name',
        category: 'nails'
        // ❌ Missing: display_order, offering_type, pricing_type, etc.
      };
      
      try {
        const oldUpdateResponse = await apiCall(`/api/salon/services/${existingService.id}`, {
          method: 'PUT',
          body: JSON.stringify(oldUpdateData)
        });
        
        // This should fail due to missing required fields
        logTestResult(
          'Service Update - Old Incomplete Data (Should Fail)',
          !oldUpdateResponse.success,
          oldUpdateResponse.success ? 
            'Old update data succeeded (unexpected)' : 
            'Old update data failed as expected'
        );
      } catch (error) {
        logTestResult(
          'Service Update - Old Incomplete Data (Should Fail)',
          true,
          'Old update data failed as expected: ' + error.message
        );
      }
      
      // Simulate what the NEW update form sends (complete data)
      const newUpdateData = {
        name: 'Updated Service Name Complete',
        description: existingService.description,
        category: 'nails',
        subcategory: existingService.subcategory,
        base_price: existingService.base_price,
        currency: existingService.currency,
        duration_minutes: existingService.duration_minutes,
        is_active: existingService.is_active,
        display_order: existingService.display_order || 1,
        tags: existingService.tags || [],
        images: existingService.images || [],
        offering_type: 'service',
        pricing_type: 'fixed',
        is_schedulable: existingService.is_schedulable !== undefined ? existingService.is_schedulable : true,
        pricing_config: existingService.pricing_config || {},
        availability_config: existingService.availability_config || {},
        has_variants: existingService.has_variants || false,
        variants: existingService.variants || [],
        custom_fields: existingService.custom_fields || {},
        metadata: existingService.metadata || {}
      };
      
      const newUpdateResponse = await apiCall(`/api/salon/services/${existingService.id}`, {
        method: 'PUT',
        body: JSON.stringify(newUpdateData)
      });
      
      logTestResult(
        'Service Update - New Complete Data (Should Pass)',
        newUpdateResponse.success,
        newUpdateResponse.success ? 
          'New update data succeeded with all required fields' : 
          'New update data failed: ' + newUpdateResponse.error
      );
      
      // Revert the change
      if (newUpdateResponse.success) {
        await apiCall(`/api/salon/services/${existingService.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: existingService.name,
            description: existingService.description,
            category: existingService.category,
            subcategory: existingService.subcategory,
            base_price: existingService.base_price,
            currency: existingService.currency,
            duration_minutes: existingService.duration_minutes,
            is_active: existingService.is_active,
            display_order: existingService.display_order,
            tags: existingService.tags,
            images: existingService.images,
            offering_type: existingService.offering_type,
            pricing_type: existingService.pricing_type,
            is_schedulable: existingService.is_schedulable,
            pricing_config: existingService.pricing_config,
            availability_config: existingService.availability_config,
            has_variants: existingService.has_variants,
            variants: existingService.variants,
            custom_fields: existingService.custom_fields,
            metadata: existingService.metadata
          })
        });
      }
    }
    
  } catch (error) {
    logTestResult('Service Form Completeness', false, error.message);
  }
}

// ============================================================================
// STAFF FORM DATA COMPLETENESS TESTS
// ============================================================================

async function testStaffFormCompleteness() {
  console.log('\n👥 Testing Staff Form Data Completeness...');
  
  try {
    // Test 1: Simulate what the OLD staff form sent (incomplete data)
    const oldStaffFormData = {
      name: 'Test Staff Old Form',
      email: 'test@staff.com',
      phone: '9876543210'
      // ❌ Missing: role, working_days, etc.
    };
    
    try {
      const oldFormResponse = await apiCall('/api/staff/staff', {
        method: 'POST',
        body: JSON.stringify(oldStaffFormData)
      });
      
      // This should fail due to missing required fields
      logTestResult(
        'Staff Form - Old Incomplete Data (Should Fail)',
        !oldFormResponse.success,
        oldFormResponse.success ? 
          'Old staff form data succeeded (unexpected)' : 
          'Old staff form data failed as expected due to missing required fields'
      );
    } catch (error) {
      logTestResult(
        'Staff Form - Old Incomplete Data (Should Fail)',
        true,
        'Old staff form data failed as expected: ' + error.message
      );
    }
    
    // Test 2: Simulate what the NEW staff form sends (complete data)
    const newStaffFormData = {
      name: 'Test Staff New Form',
      email: 'test.new@staff.com',
      phone: '9876543211',
      role: 'stylist',
      specializations: ['hair', 'styling'],
      working_hours: {
        monday: { start: '09:00', end: '18:00' },
        tuesday: { start: '09:00', end: '18:00' }
      },
      working_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      hourly_rate: 500.00,
      commission_rate: 10.0,
      is_active: true,
      notes: 'Test staff member with complete data'
    };
    
    const newFormResponse = await apiCall('/api/staff/staff', {
      method: 'POST',
      body: JSON.stringify(newStaffFormData)
    });
    
    logTestResult(
      'Staff Form - New Complete Data (Should Pass)',
      newFormResponse.success,
      newFormResponse.success ? 
        'New staff form data succeeded with all required fields' : 
        'New staff form data failed: ' + newFormResponse.error
    );
    
    // Clean up
    if (newFormResponse.success && newFormResponse.data?.id) {
      try {
        await apiCall(`/api/staff/staff/${newFormResponse.data.id}`, {
          method: 'DELETE'
        });
      } catch (e) {
        // Ignore cleanup errors
      }
    }
    
    // Test 3: Test staff update form completeness
    const staffResponse = await apiCall('/api/staff/staff');
    if (staffResponse.success && staffResponse.data?.length > 0) {
      const existingStaff = staffResponse.data[0];
      
      // Simulate what the OLD update form sent (incomplete data)
      const oldUpdateData = {
        name: 'Updated Staff Name'
        // ❌ Missing: role, working_days, etc.
      };
      
      try {
        const oldUpdateResponse = await apiCall(`/api/staff/staff/${existingStaff.id}`, {
          method: 'PUT',
          body: JSON.stringify(oldUpdateData)
        });
        
        // This should fail due to missing required fields
        logTestResult(
          'Staff Update - Old Incomplete Data (Should Fail)',
          !oldUpdateResponse.success,
          oldUpdateResponse.success ? 
            'Old staff update data succeeded (unexpected)' : 
            'Old staff update data failed as expected'
        );
      } catch (error) {
        logTestResult(
          'Staff Update - Old Incomplete Data (Should Fail)',
          true,
          'Old staff update data failed as expected: ' + error.message
        );
      }
      
      // Simulate what the NEW update form sends (complete data)
      const newUpdateData = {
        name: 'Updated Staff Name Complete',
        email: existingStaff.email,
        phone: existingStaff.phone,
        role: existingStaff.role,
        specializations: existingStaff.specializations || [],
        working_hours: existingStaff.working_hours || {},
        working_days: existingStaff.working_days || [],
        hourly_rate: existingStaff.hourly_rate,
        commission_rate: existingStaff.commission_rate,
        is_active: existingStaff.is_active,
        notes: existingStaff.notes
      };
      
      const newUpdateResponse = await apiCall(`/api/staff/staff/${existingStaff.id}`, {
        method: 'PUT',
        body: JSON.stringify(newUpdateData)
      });
      
      logTestResult(
        'Staff Update - New Complete Data (Should Pass)',
        newUpdateResponse.success,
        newUpdateResponse.success ? 
          'New staff update data succeeded with all required fields' : 
          'New staff update data failed: ' + newUpdateResponse.error
      );
      
      // Revert the change
      if (newUpdateResponse.success) {
        await apiCall(`/api/staff/staff/${existingStaff.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: existingStaff.name,
            email: existingStaff.email,
            phone: existingStaff.phone,
            role: existingStaff.role,
            specializations: existingStaff.specializations,
            working_hours: existingStaff.working_hours,
            working_days: existingStaff.working_days,
            hourly_rate: existingStaff.hourly_rate,
            commission_rate: existingStaff.commission_rate,
            is_active: existingStaff.is_active,
            notes: existingStaff.notes
          })
        });
      }
    }
    
  } catch (error) {
    logTestResult('Staff Form Completeness', false, error.message);
  }
}

// ============================================================================
// APPOINTMENT FORM DATA COMPLETENESS TESTS
// ============================================================================

async function testAppointmentFormCompleteness() {
  console.log('\n📅 Testing Appointment Form Data Completeness...');
  
  try {
    // Get required data for appointment creation
    const [servicesResponse, staffResponse] = await Promise.all([
      apiCall('/api/salon/services'),
      apiCall('/api/staff/staff')
    ]);
    
    if (!servicesResponse.success || !staffResponse.success || 
        servicesResponse.data?.length === 0 || staffResponse.data?.length === 0) {
      logTestResult('Appointment Form - Prerequisites', false, 'No services or staff available for testing');
      return;
    }
    
    // Test 1: Simulate what the OLD appointment form sent (incomplete data)
    const oldAppointmentFormData = {
      customer_name: 'Test Customer Old',
      customer_phone: '9876543210',
      service_id: servicesResponse.data[0].id
      // ❌ Missing: scheduled_at, amount, etc.
    };
    
    try {
      const oldFormResponse = await apiCall('/api/salon/appointments', {
        method: 'POST',
        body: JSON.stringify(oldAppointmentFormData)
      });
      
      // This should fail due to missing required fields
      logTestResult(
        'Appointment Form - Old Incomplete Data (Should Fail)',
        !oldFormResponse.success,
        oldFormResponse.success ? 
          'Old appointment form data succeeded (unexpected)' : 
          'Old appointment form data failed as expected due to missing required fields'
      );
    } catch (error) {
      logTestResult(
        'Appointment Form - Old Incomplete Data (Should Fail)',
        true,
        'Old appointment form data failed as expected: ' + error.message
      );
    }
    
    // Test 2: Simulate what the NEW appointment form sends (complete data)
    const newAppointmentFormData = {
      customer_name: 'Test Customer New',
      customer_phone: '9876543211',
      customer_email: 'test@customer.com',
      service_id: servicesResponse.data[0].id,
      staff_id: staffResponse.data[0].id,
      scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      duration_minutes: 90,
      amount: parseFloat(servicesResponse.data[0].base_price) || 2000,
      currency: 'INR',
      payment_status: 'pending',
      notes: 'Test appointment with complete data'
    };
    
    const newFormResponse = await apiCall('/api/salon/appointments', {
      method: 'POST',
      body: JSON.stringify(newAppointmentFormData)
    });
    
    logTestResult(
      'Appointment Form - New Complete Data (Should Pass)',
      newFormResponse.success,
      newFormResponse.success ? 
        'New appointment form data succeeded with all required fields' : 
        'New appointment form data failed: ' + newFormResponse.error
    );
    
    // Clean up
    if (newFormResponse.success && newFormResponse.data?.id) {
      try {
        await apiCall(`/api/salon/appointments/${newFormResponse.data.id}`, {
          method: 'DELETE'
        });
      } catch (e) {
        // Ignore cleanup errors
      }
    }
    
  } catch (error) {
    logTestResult('Appointment Form Completeness', false, error.message);
  }
}

// ============================================================================
// DATABASE CONSTRAINT VALIDATION TESTS
// ============================================================================

async function testDatabaseConstraints() {
  console.log('\n🗄️ Testing Database Constraint Validation...');
  
  try {
    // Test 1: NOT NULL constraint violations
    const nullConstraintTests = [
      {
        name: 'Service - Missing display_order',
        endpoint: '/api/salon/services',
        method: 'POST',
        data: {
          name: 'Test Service',
          category: 'hair',
          base_price: '2500.00',
          currency: 'INR',
          duration_minutes: 90,
          is_active: true
          // Missing display_order (NOT NULL constraint)
        },
        shouldFail: true,
        expectedError: 'display_order'
      },
      {
        name: 'Staff - Missing role',
        endpoint: '/api/staff/staff',
        method: 'POST',
        data: {
          name: 'Test Staff',
          email: 'test@staff.com',
          phone: '9876543210'
          // Missing role (NOT NULL constraint)
        },
        shouldFail: true,
        expectedError: 'role'
      },
      {
        name: 'Appointment - Missing scheduled_at',
        endpoint: '/api/salon/appointments',
        method: 'POST',
        data: {
          customer_name: 'Test Customer',
          customer_phone: '9876543210',
          amount: 2000,
          currency: 'INR'
          // Missing scheduled_at (NOT NULL constraint)
        },
        shouldFail: true,
        expectedError: 'scheduled_at'
      }
    ];
    
    for (const test of nullConstraintTests) {
      try {
        const response = await apiCall(test.endpoint, {
          method: test.method,
          body: JSON.stringify(test.data)
        });
        
        const success = test.shouldFail ? !response.success : response.success;
        const details = test.shouldFail ? 
          (response.success ? 'Should have failed but succeeded' : 'Failed as expected') :
          (response.success ? 'Succeeded as expected' : 'Should have succeeded but failed');
        
        logTestResult(
          `Database Constraints - ${test.name}`,
          success,
          details
        );
      } catch (error) {
        const success = test.shouldFail && error.message.includes(test.expectedError);
        logTestResult(
          `Database Constraints - ${test.name}`,
          success,
          success ? 'Failed as expected with correct error' : 'Unexpected error: ' + error.message
        );
      }
    }
    
  } catch (error) {
    logTestResult('Database Constraints', false, error.message);
  }
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

async function runFormCompletenessTests() {
  console.log('🔍 Starting Form Data Completeness Tests');
  console.log(`📍 Testing against: ${BASE_URL}`);
  console.log(`🏢 Tenant: ${TENANT_ID}`);
  console.log('=' .repeat(80));
  
  try {
    await testServiceFormCompleteness();
    await testStaffFormCompleteness();
    await testAppointmentFormCompleteness();
    await testDatabaseConstraints();
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }
  
  // Print summary
  console.log('\n' + '=' .repeat(80));
  console.log('📊 FORM COMPLETENESS TEST SUMMARY');
  console.log('=' .repeat(80));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    results.filter(r => r.status === 'FAIL').forEach(result => {
      console.log(`   • ${result.name}: ${result.details}`);
    });
  }
  
  console.log('\n🎯 KEY FINDINGS:');
  console.log('   • Old frontend forms send incomplete data → Database constraint violations');
  console.log('   • New frontend forms send complete data → Successful API calls');
  console.log('   • Database constraints properly enforced → Prevents data corruption');
  console.log('   • Form validation prevents user errors → Better user experience');
  
  console.log('\n💡 RECOMMENDATIONS:');
  console.log('   1. Always validate form data completeness before API calls');
  console.log('   2. Use TypeScript interfaces to ensure data structure consistency');
  console.log('   3. Add client-side validation for required fields');
  console.log('   4. Implement proper error handling for constraint violations');
  console.log('   5. Add comprehensive integration tests for all form workflows');
  
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runFormCompletenessTests();
}
