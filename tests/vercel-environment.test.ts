import { describe, test, expect, beforeAll, afterAll } from 'vitest';

// Vercel environment configuration
const VERCEL_URL = 'https://whatsapp-bot-for-consumer-38m8i4mcn-abinalyas-projects.vercel.app';
const TENANT_ID = 'bella-salon';

describe('Vercel Environment Testing', () => {
  let testResults: { [key: string]: any } = {};

  beforeAll(async () => {
    console.log('🧪 Testing Vercel Environment');
    console.log(`🌐 Testing URL: ${VERCEL_URL}`);
    console.log(`🏢 Tenant ID: ${TENANT_ID}`);
  });

  describe('API Endpoint Availability', () => {
    test('Salon Services API is accessible', async () => {
      try {
        const response = await fetch(`${VERCEL_URL}/api/salon/services`, {
          headers: { 'x-tenant-id': TENANT_ID }
        });
        
        console.log(`📊 Salon Services API Status: ${response.status}`);
        testResults.salonServicesStatus = response.status;
        
        if (response.ok) {
          const data = await response.json();
          console.log(`📊 Salon Services Data: ${data.data?.length || 0} services found`);
          testResults.salonServicesCount = data.data?.length || 0;
        }
        
        expect(response.status).toBe(200);
      } catch (error) {
        console.error('❌ Salon Services API Error:', error);
        testResults.salonServicesError = error;
        throw error;
      }
    });

    test('Staff API is accessible', async () => {
      try {
        const response = await fetch(`${VERCEL_URL}/api/staff/staff`, {
          headers: { 'x-tenant-id': TENANT_ID }
        });
        
        console.log(`📊 Staff API Status: ${response.status}`);
        testResults.staffStatus = response.status;
        
        if (response.ok) {
          const data = await response.json();
          console.log(`📊 Staff Data: ${data.data?.length || 0} staff members found`);
          testResults.staffCount = data.data?.length || 0;
        }
        
        expect(response.status).toBe(200);
      } catch (error) {
        console.error('❌ Staff API Error:', error);
        testResults.staffError = error;
        throw error;
      }
    });

    test('Appointments API is accessible', async () => {
      try {
        const response = await fetch(`${VERCEL_URL}/api/salon/appointments`, {
          headers: { 'x-tenant-id': TENANT_ID }
        });
        
        console.log(`📊 Appointments API Status: ${response.status}`);
        testResults.appointmentsStatus = response.status;
        
        if (response.ok) {
          const data = await response.json();
          console.log(`📊 Appointments Data: ${data.data?.length || 0} appointments found`);
          testResults.appointmentsCount = data.data?.length || 0;
        }
        
        expect(response.status).toBe(200);
      } catch (error) {
        console.error('❌ Appointments API Error:', error);
        testResults.appointmentsError = error;
        throw error;
      }
    });
  });

  describe('Service Creation Validation', () => {
    test('Service creation with valid data works', async () => {
      const serviceData = {
        name: 'Vercel Test Service',
        description: 'Test service created via Vercel API',
        category: 'hair',
        base_price: 100,
        currency: 'USD',
        duration_minutes: 60,
        is_active: true,
        display_order: 0,
        tags: [],
        images: []
      };

      try {
        const response = await fetch(`${VERCEL_URL}/api/salon/services`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-tenant-id': TENANT_ID
          },
          body: JSON.stringify(serviceData)
        });

        console.log(`📊 Service Creation Status: ${response.status}`);
        testResults.serviceCreationStatus = response.status;

        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Service Created: ${data.data?.id}`);
          testResults.createdServiceId = data.data?.id;
        } else {
          const errorData = await response.json();
          console.error(`❌ Service Creation Error: ${errorData.error}`);
          testResults.serviceCreationError = errorData.error;
        }

        expect(response.status).toBe(200);
      } catch (error) {
        console.error('❌ Service Creation Exception:', error);
        testResults.serviceCreationException = error;
        throw error;
      }
    });

    test('Service creation with invalid data fails properly', async () => {
      const invalidServiceData = {
        name: '', // Invalid empty name
        base_price: 100,
        category: 'hair'
      };

      try {
        const response = await fetch(`${VERCEL_URL}/api/salon/services`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-tenant-id': TENANT_ID
          },
          body: JSON.stringify(invalidServiceData)
        });

        console.log(`📊 Invalid Service Creation Status: ${response.status}`);
        testResults.invalidServiceCreationStatus = response.status;

        if (!response.ok) {
          const errorData = await response.json();
          console.log(`✅ Validation Error Caught: ${errorData.error}`);
          testResults.validationError = errorData.error;
        }

        expect(response.status).toBe(400);
      } catch (error) {
        console.error('❌ Invalid Service Creation Exception:', error);
        testResults.invalidServiceCreationException = error;
        throw error;
      }
    });
  });

  describe('Service Update Validation', () => {
    test('Service update with valid data works', async () => {
      if (!testResults.createdServiceId) {
        console.log('⏭️ Skipping service update test - no service created');
        return;
      }

      const updateData = {
        name: 'Updated Vercel Test Service',
        base_price: 150,
        description: 'Updated description'
      };

      try {
        const response = await fetch(`${VERCEL_URL}/api/salon/services/${testResults.createdServiceId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-tenant-id': TENANT_ID
          },
          body: JSON.stringify(updateData)
        });

        console.log(`📊 Service Update Status: ${response.status}`);
        testResults.serviceUpdateStatus = response.status;

        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Service Updated: ${data.data?.name}`);
        } else {
          const errorData = await response.json();
          console.error(`❌ Service Update Error: ${errorData.error}`);
          testResults.serviceUpdateError = errorData.error;
        }

        expect(response.status).toBe(200);
      } catch (error) {
        console.error('❌ Service Update Exception:', error);
        testResults.serviceUpdateException = error;
        throw error;
      }
    });
  });

  describe('Staff Management Validation', () => {
    test('Staff creation with valid data works', async () => {
      const staffData = {
        name: 'Vercel Test Staff',
        role: 'stylist',
        email: 'vercel-test@example.com',
        phone: '1234567890',
        working_days: [],
        working_hours: {},
        specializations: [],
        is_active: true
      };

      try {
        const response = await fetch(`${VERCEL_URL}/api/staff/staff`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-tenant-id': TENANT_ID
          },
          body: JSON.stringify(staffData)
        });

        console.log(`📊 Staff Creation Status: ${response.status}`);
        testResults.staffCreationStatus = response.status;

        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Staff Created: ${data.data?.id}`);
          testResults.createdStaffId = data.data?.id;
        } else {
          const errorData = await response.json();
          console.error(`❌ Staff Creation Error: ${errorData.error}`);
          testResults.staffCreationError = errorData.error;
        }

        expect(response.status).toBe(200);
      } catch (error) {
        console.error('❌ Staff Creation Exception:', error);
        testResults.staffCreationException = error;
        throw error;
      }
    });
  });

  describe('Error Handling Validation', () => {
    test('API returns proper error for non-existent service', async () => {
      try {
        const response = await fetch(`${VERCEL_URL}/api/salon/services/non-existent-id`, {
          headers: { 'x-tenant-id': TENANT_ID }
        });

        console.log(`📊 Non-existent Service Status: ${response.status}`);
        testResults.nonExistentServiceStatus = response.status;

        expect(response.status).toBe(404);
      } catch (error) {
        console.error('❌ Non-existent Service Exception:', error);
        testResults.nonExistentServiceException = error;
        throw error;
      }
    });

    test('API returns proper error for invalid tenant', async () => {
      try {
        const response = await fetch(`${VERCEL_URL}/api/salon/services`, {
          headers: { 'x-tenant-id': 'invalid-tenant' }
        });

        console.log(`📊 Invalid Tenant Status: ${response.status}`);
        testResults.invalidTenantStatus = response.status;

        expect(response.status).toBe(404);
      } catch (error) {
        console.error('❌ Invalid Tenant Exception:', error);
        testResults.invalidTenantException = error;
        throw error;
      }
    });
  });

  afterAll(async () => {
    // Clean up created test data
    if (testResults.createdServiceId) {
      try {
        await fetch(`${VERCEL_URL}/api/salon/services/${testResults.createdServiceId}`, {
          method: 'DELETE',
          headers: { 'x-tenant-id': TENANT_ID }
        });
        console.log('🧹 Cleaned up test service');
      } catch (error) {
        console.log('⚠️ Could not clean up test service:', error);
      }
    }

    if (testResults.createdStaffId) {
      try {
        await fetch(`${VERCEL_URL}/api/staff/staff/${testResults.createdStaffId}`, {
          method: 'DELETE',
          headers: { 'x-tenant-id': TENANT_ID }
        });
        console.log('🧹 Cleaned up test staff');
      } catch (error) {
        console.log('⚠️ Could not clean up test staff:', error);
      }
    }

    // Print test summary
    console.log('\n📊 Test Results Summary:');
    console.log('========================');
    console.log(`Salon Services API: ${testResults.salonServicesStatus} (${testResults.salonServicesCount} services)`);
    console.log(`Staff API: ${testResults.staffStatus} (${testResults.staffCount} staff)`);
    console.log(`Appointments API: ${testResults.appointmentsStatus} (${testResults.appointmentsCount} appointments)`);
    console.log(`Service Creation: ${testResults.serviceCreationStatus}`);
    console.log(`Service Update: ${testResults.serviceUpdateStatus}`);
    console.log(`Staff Creation: ${testResults.staffCreationStatus}`);
    console.log(`Invalid Service Creation: ${testResults.invalidServiceCreationStatus}`);
    console.log(`Non-existent Service: ${testResults.nonExistentServiceStatus}`);
    console.log(`Invalid Tenant: ${testResults.invalidTenantStatus}`);
  });
});
