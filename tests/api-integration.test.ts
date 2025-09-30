import { describe, test, expect, beforeAll, afterAll } from 'vitest';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';
const TENANT_ID = 'bella-salon';

describe('API Integration Testing', () => {
  let createdServiceId: string;
  let createdStaffId: string;

  beforeAll(async () => {
    // Ensure test environment is ready
    console.log('🧪 Starting API Integration Tests');
  });

  afterAll(async () => {
    // Clean up test data
    if (createdServiceId) {
      try {
        await fetch(`${API_BASE_URL}/api/salon/services/${createdServiceId}`, {
          method: 'DELETE',
          headers: { 'x-tenant-id': TENANT_ID }
        });
      } catch (error) {
        console.log('Cleanup error (expected):', error);
      }
    }
    
    if (createdStaffId) {
      try {
        await fetch(`${API_BASE_URL}/api/staff/staff/${createdStaffId}`, {
          method: 'DELETE',
          headers: { 'x-tenant-id': TENANT_ID }
        });
      } catch (error) {
        console.log('Cleanup error (expected):', error);
      }
    }
  });

  describe('Service API Endpoints', () => {
    test('GET /api/salon/services returns valid response', async () => {
      const response = await fetch(`${API_BASE_URL}/api/salon/services`, {
        headers: { 'x-tenant-id': TENANT_ID }
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });

    test('POST /api/salon/services validates required fields', async () => {
      const testCases = [
        {
          name: 'Missing name',
          body: { base_price: 100, category: 'hair' },
          expectedStatus: 400
        },
        {
          name: 'Missing base_price',
          body: { name: 'Test Service', category: 'hair' },
          expectedStatus: 400
        },
        {
          name: 'Invalid base_price',
          body: { name: 'Test Service', base_price: 'invalid', category: 'hair' },
          expectedStatus: 400
        },
        {
          name: 'Empty name',
          body: { name: '', base_price: 100, category: 'hair' },
          expectedStatus: 400
        },
        {
          name: 'Valid data',
          body: { 
            name: 'Test Service', 
            base_price: 100, 
            category: 'hair',
            description: 'Test description',
            currency: 'USD',
            duration_minutes: 60,
            is_active: true,
            display_order: 0,
            tags: [],
            images: []
          },
          expectedStatus: 200
        }
      ];

      for (const testCase of testCases) {
        const response = await fetch(`${API_BASE_URL}/api/salon/services`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-tenant-id': TENANT_ID
          },
          body: JSON.stringify(testCase.body)
        });

        expect(response.status).toBe(testCase.expectedStatus);
        
        if (testCase.expectedStatus === 200) {
          const data = await response.json();
          expect(data.success).toBe(true);
          expect(data.data.id).toBeDefined();
          createdServiceId = data.data.id;
        } else {
          const errorData = await response.json();
          expect(errorData.success).toBe(false);
          expect(errorData.error).toBeDefined();
        }
      }
    });

    test('PUT /api/salon/services/:id validates required fields', async () => {
      if (!createdServiceId) {
        // Create a service first
        const response = await fetch(`${API_BASE_URL}/api/salon/services`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-tenant-id': TENANT_ID
          },
          body: JSON.stringify({
            name: 'Test Service',
            base_price: 100,
            category: 'hair',
            description: 'Test description',
            currency: 'USD',
            duration_minutes: 60,
            is_active: true,
            display_order: 0,
            tags: [],
            images: []
          })
        });
        const data = await response.json();
        createdServiceId = data.data.id;
      }

      const testCases = [
        {
          name: 'Update with empty name',
          body: { name: '', base_price: 150 },
          expectedStatus: 400
        },
        {
          name: 'Update with invalid base_price',
          body: { name: 'Updated Service', base_price: 'invalid' },
          expectedStatus: 400
        },
        {
          name: 'Valid update',
          body: { 
            name: 'Updated Service', 
            base_price: 150,
            description: 'Updated description'
          },
          expectedStatus: 200
        }
      ];

      for (const testCase of testCases) {
        const response = await fetch(`${API_BASE_URL}/api/salon/services/${createdServiceId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-tenant-id': TENANT_ID
          },
          body: JSON.stringify(testCase.body)
        });

        expect(response.status).toBe(testCase.expectedStatus);
        
        if (testCase.expectedStatus === 200) {
          const data = await response.json();
          expect(data.success).toBe(true);
        } else {
          const errorData = await response.json();
          expect(errorData.success).toBe(false);
        }
      }
    });

    test('DELETE /api/salon/services/:id works correctly', async () => {
      if (!createdServiceId) {
        // Create a service first
        const response = await fetch(`${API_BASE_URL}/api/salon/services`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-tenant-id': TENANT_ID
          },
          body: JSON.stringify({
            name: 'Test Service',
            base_price: 100,
            category: 'hair',
            description: 'Test description',
            currency: 'USD',
            duration_minutes: 60,
            is_active: true,
            display_order: 0,
            tags: [],
            images: []
          })
        });
        const data = await response.json();
        createdServiceId = data.data.id;
      }

      const response = await fetch(`${API_BASE_URL}/api/salon/services/${createdServiceId}`, {
        method: 'DELETE',
        headers: { 'x-tenant-id': TENANT_ID }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      
      // Verify service is deleted
      const getResponse = await fetch(`${API_BASE_URL}/api/salon/services/${createdServiceId}`, {
        headers: { 'x-tenant-id': TENANT_ID }
      });
      expect(getResponse.status).toBe(404);
      
      createdServiceId = ''; // Mark as cleaned up
    });
  });

  describe('Staff API Endpoints', () => {
    test('GET /api/staff/staff returns valid response', async () => {
      const response = await fetch(`${API_BASE_URL}/api/staff/staff`, {
        headers: { 'x-tenant-id': TENANT_ID }
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });

    test('POST /api/staff/staff validates required fields', async () => {
      const testCases = [
        {
          name: 'Missing name',
          body: { role: 'stylist', email: 'test@example.com' },
          expectedStatus: 400
        },
        {
          name: 'Missing role',
          body: { name: 'Test Staff', email: 'test@example.com' },
          expectedStatus: 400
        },
        {
          name: 'Empty name',
          body: { name: '', role: 'stylist', email: 'test@example.com' },
          expectedStatus: 400
        },
        {
          name: 'Valid data',
          body: {
            name: 'Test Staff',
            role: 'stylist',
            email: 'test@example.com',
            phone: '1234567890',
            working_days: [],
            working_hours: {},
            specializations: [],
            is_active: true
          },
          expectedStatus: 200
        }
      ];

      for (const testCase of testCases) {
        const response = await fetch(`${API_BASE_URL}/api/staff/staff`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-tenant-id': TENANT_ID
          },
          body: JSON.stringify(testCase.body)
        });

        expect(response.status).toBe(testCase.expectedStatus);
        
        if (testCase.expectedStatus === 200) {
          const data = await response.json();
          expect(data.success).toBe(true);
          expect(data.data.id).toBeDefined();
          createdStaffId = data.data.id;
        } else {
          const errorData = await response.json();
          expect(errorData.success).toBe(false);
        }
      }
    });
  });

  describe('Appointments API Endpoints', () => {
    test('GET /api/salon/appointments returns valid response', async () => {
      const response = await fetch(`${API_BASE_URL}/api/salon/appointments`, {
        headers: { 'x-tenant-id': TENANT_ID }
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });

    test('POST /api/salon/appointments validates required fields', async () => {
      const testCases = [
        {
          name: 'Missing customer_name',
          body: {
            customer_phone: '1234567890',
            customer_email: 'test@example.com',
            service_id: 'test-service-id',
            staff_id: 'test-staff-id',
            scheduled_at: new Date().toISOString(),
            duration_minutes: 60,
            amount: 100,
            currency: 'USD',
            payment_status: 'pending'
          },
          expectedStatus: 400
        },
        {
          name: 'Missing scheduled_at',
          body: {
            customer_name: 'Test Customer',
            customer_phone: '1234567890',
            customer_email: 'test@example.com',
            service_id: 'test-service-id',
            staff_id: 'test-staff-id',
            duration_minutes: 60,
            amount: 100,
            currency: 'USD',
            payment_status: 'pending'
          },
          expectedStatus: 400
        },
        {
          name: 'Invalid scheduled_at format',
          body: {
            customer_name: 'Test Customer',
            customer_phone: '1234567890',
            customer_email: 'test@example.com',
            service_id: 'test-service-id',
            staff_id: 'test-staff-id',
            scheduled_at: 'invalid-date',
            duration_minutes: 60,
            amount: 100,
            currency: 'USD',
            payment_status: 'pending'
          },
          expectedStatus: 400
        }
      ];

      for (const testCase of testCases) {
        const response = await fetch(`${API_BASE_URL}/api/salon/appointments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-tenant-id': TENANT_ID
          },
          body: JSON.stringify(testCase.body)
        });

        expect(response.status).toBe(testCase.expectedStatus);
        
        if (testCase.expectedStatus === 400) {
          const errorData = await response.json();
          expect(errorData.success).toBe(false);
        }
      }
    });
  });

  describe('Error Handling', () => {
    test('API returns proper error format for validation failures', async () => {
      const response = await fetch(`${API_BASE_URL}/api/salon/services`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': TENANT_ID
        },
        body: JSON.stringify({
          name: '', // Invalid empty name
          base_price: 100
        })
      });

      expect(response.status).toBe(400);
      const errorData = await response.json();
      expect(errorData.success).toBe(false);
      expect(errorData.error).toBeDefined();
      expect(typeof errorData.error).toBe('string');
    });

    test('API returns 404 for non-existent resources', async () => {
      const response = await fetch(`${API_BASE_URL}/api/salon/services/non-existent-id`, {
        headers: { 'x-tenant-id': TENANT_ID }
      });

      expect(response.status).toBe(404);
    });

    test('API returns 400 for invalid tenant ID', async () => {
      const response = await fetch(`${API_BASE_URL}/api/salon/services`, {
        headers: { 'x-tenant-id': 'invalid-tenant' }
      });

      expect(response.status).toBe(404);
      const errorData = await response.json();
      expect(errorData.success).toBe(false);
      expect(errorData.error).toContain('Tenant not found');
    });
  });

  describe('Response Format Consistency', () => {
    test('All successful responses follow consistent format', async () => {
      const response = await fetch(`${API_BASE_URL}/api/salon/services`, {
        headers: { 'x-tenant-id': TENANT_ID }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      // Check response structure
      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('data');
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });

    test('All error responses follow consistent format', async () => {
      const response = await fetch(`${API_BASE_URL}/api/salon/services`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': TENANT_ID
        },
        body: JSON.stringify({}) // Invalid data
      });

      expect(response.status).toBe(400);
      const errorData = await response.json();
      
      // Check error response structure
      expect(errorData).toHaveProperty('success');
      expect(errorData).toHaveProperty('error');
      expect(errorData.success).toBe(false);
      expect(typeof errorData.error).toBe('string');
    });
  });
});
