/**
 * Tests for Business Configuration API Routes
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import businessConfigRoutes from '../server/routes/business-config.routes';
import { testDb, setupTestDatabase, cleanupTestDatabase } from './helpers/test-database';

describe('Business Configuration Routes', () => {
  let app: express.Application;
  let authToken: string;
  let testTenantId: string;
  let testBusinessTypeId: string;

  beforeAll(async () => {
    await setupTestDatabase();
    
    // Setup Express app with routes
    app = express();
    app.use(express.json());
    
    // Mock middleware for testing
    app.use((req, res, next) => {
      req.tenantContext = { tenantId: testTenantId };
      next();
    });
    
    app.use('/api/business-config', businessConfigRoutes);
    
    // Create test data
    const businessTypeResult = await testDb.insert(testDb.schema.businessTypes).values({
      name: 'test-restaurant',
      displayName: 'Test Restaurant',
      category: 'hospitality',
      description: 'Test restaurant business type',
      terminology: {
        offering: 'Menu Item',
        transaction: 'Order',
        customer: 'Guest',
      },
      defaultConfig: {
        requiresScheduling: true,
        defaultDuration: 60,
      },
      isActive: true,
      isSystem: true,
    }).returning();
    
    testBusinessTypeId = businessTypeResult[0].id;
    
    const tenantResult = await testDb.insert(testDb.schema.tenants).values({
      name: 'Test Restaurant Inc',
      email: 'test@restaurant.com',
      phone: '+1234567890',
    }).returning();
    
    testTenantId = tenantResult[0].id;
    authToken = 'test-token';
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  beforeEach(async () => {
    // Clean up test data between tests
    await testDb.delete(testDb.schema.customFields);
    await testDb.delete(testDb.schema.workflowStates);
    
    // Reset tenant configuration
    await testDb.update(testDb.schema.tenants)
      .set({
        businessTypeId: null,
        businessConfig: {},
        terminology: {},
      })
      .where(testDb.eq(testDb.schema.tenants.id, testTenantId));
  });

  describe('GET /api/business-config', () => {
    it('should get tenant business configuration', async () => {
      const response = await request(app)
        .get('/api/business-config')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        tenantId: testTenantId,
        isConfigured: false,
      });
    });

    it('should return configured state when business type is assigned', async () => {
      // Setup tenant with business type
      await testDb.update(testDb.schema.tenants)
        .set({
          businessTypeId: testBusinessTypeId,
          terminology: { offering: 'Dish' },
        })
        .where(testDb.eq(testDb.schema.tenants.id, testTenantId));

      const response = await request(app)
        .get('/api/business-config')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isConfigured).toBe(true);
      expect(response.body.data.businessType.id).toBe(testBusinessTypeId);
      expect(response.body.data.terminology.offering).toBe('Dish');
    });
  });

  describe('POST /api/business-config/setup', () => {
    it('should setup business type for tenant', async () => {
      const setupData = {
        businessTypeId: testBusinessTypeId,
        customTerminology: {
          offering: 'Specialty Dish',
          transaction: 'Order',
        },
        customConfiguration: {
          defaultDuration: 90,
        },
      };

      const response = await request(app)
        .post('/api/business-config/setup')
        .send(setupData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isConfigured).toBe(true);
      expect(response.body.data.terminology.offering).toBe('Specialty Dish');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/business-config/setup')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should handle invalid business type ID', async () => {
      const setupData = {
        businessTypeId: 'nonexistent-id',
      };

      const response = await request(app)
        .post('/api/business-config/setup')
        .send(setupData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/business-config', () => {
    beforeEach(async () => {
      // Setup tenant with business type for configuration tests
      await testDb.update(testDb.schema.tenants)
        .set({
          businessTypeId: testBusinessTypeId,
        })
        .where(testDb.eq(testDb.schema.tenants.id, testTenantId));
    });

    it('should configure tenant business', async () => {
      const configData = {
        businessTypeId: testBusinessTypeId,
        terminologyOverrides: {
          offering: 'Menu Item',
          transaction: 'Order',
          customer: 'Diner',
        },
        customFields: [
          {
            entityType: 'offering',
            name: 'spice_level',
            label: 'Spice Level',
            fieldType: 'select',
            isRequired: false,
            fieldOptions: [
              { value: 'mild', label: 'Mild' },
              { value: 'hot', label: 'Hot' },
            ],
          },
        ],
      };

      const response = await request(app)
        .put('/api/business-config')
        .send(configData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.terminology.customer).toBe('Diner');
      expect(response.body.data.customFields).toHaveLength(1);
    });

    it('should validate configuration data', async () => {
      const invalidConfigData = {
        businessTypeId: '', // Invalid empty ID
      };

      const response = await request(app)
        .put('/api/business-config')
        .send(invalidConfigData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/business-config/from-template/:templateId', () => {
    it('should configure tenant from template', async () => {
      const customizations = {
        terminologyOverrides: {
          customer: 'Valued Guest',
        },
      };

      const response = await request(app)
        .post(`/api/business-config/from-template/${testBusinessTypeId}`)
        .send(customizations)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isConfigured).toBe(true);
    });

    it('should handle invalid template ID', async () => {
      const response = await request(app)
        .post('/api/business-config/from-template/nonexistent')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/business-config/terminology', () => {
    beforeEach(async () => {
      await testDb.update(testDb.schema.tenants)
        .set({
          businessTypeId: testBusinessTypeId,
        })
        .where(testDb.eq(testDb.schema.tenants.id, testTenantId));
    });

    it('should update tenant terminology', async () => {
      const terminologyData = {
        terminology: {
          offering: 'Signature Dish',
          transaction: 'Order',
          customer: 'Valued Customer',
        },
      };

      const response = await request(app)
        .put('/api/business-config/terminology')
        .send(terminologyData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.terminology.offering).toBe('Signature Dish');
    });

    it('should validate terminology data', async () => {
      const response = await request(app)
        .put('/api/business-config/terminology')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('DELETE /api/business-config', () => {
    beforeEach(async () => {
      await testDb.update(testDb.schema.tenants)
        .set({
          businessTypeId: testBusinessTypeId,
          terminology: { offering: 'Test' },
        })
        .where(testDb.eq(testDb.schema.tenants.id, testTenantId));
    });

    it('should reset tenant business configuration', async () => {
      const response = await request(app)
        .delete('/api/business-config')
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify configuration was reset
      const configResponse = await request(app)
        .get('/api/business-config')
        .expect(200);

      expect(configResponse.body.data.isConfigured).toBe(false);
    });
  });

  describe('POST /api/business-config/validate', () => {
    it('should validate configuration', async () => {
      const configData = {
        businessTypeId: testBusinessTypeId,
        customFields: [
          {
            entityType: 'offering',
            name: 'test_field',
            label: 'Test Field',
            fieldType: 'text',
            isRequired: false,
          },
        ],
        workflowCustomizations: [
          {
            workflowType: 'transaction',
            states: [
              {
                name: 'pending',
                displayName: 'Pending',
                stateType: 'initial',
                color: '#F59E0B',
              },
              {
                name: 'completed',
                displayName: 'Completed',
                stateType: 'final',
                color: '#10B981',
              },
            ],
          },
        ],
      };

      const response = await request(app)
        .post('/api/business-config/validate')
        .send(configData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isValid).toBe(true);
      expect(response.body.data.errors).toHaveLength(0);
    });

    it('should detect validation errors', async () => {
      const invalidConfigData = {
        businessTypeId: 'nonexistent',
        customFields: [
          {
            entityType: 'offering',
            name: '', // Invalid empty name
            label: 'Invalid Field',
            fieldType: 'select',
            isRequired: false,
            fieldOptions: [], // Missing options for select field
          },
        ],
      };

      const response = await request(app)
        .post('/api/business-config/validate')
        .send(invalidConfigData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isValid).toBe(false);
      expect(response.body.data.errors.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/business-config/recommendations/:businessTypeId', () => {
    it('should get configuration recommendations', async () => {
      const response = await request(app)
        .get(`/api/business-config/recommendations/${testBusinessTypeId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.recommendedFields).toBeDefined();
      expect(response.body.data.recommendedIntegrations).toBeDefined();
      expect(Array.isArray(response.body.data.recommendedFields)).toBe(true);
    });

    it('should handle invalid business type ID', async () => {
      const response = await request(app)
        .get('/api/business-config/recommendations/nonexistent')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/business-config/migration-status', () => {
    it('should get migration status', async () => {
      const response = await request(app)
        .get('/api/business-config/migration-status')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        needsMigration: expect.any(Boolean),
        legacyServicesCount: expect.any(Number),
        legacyBookingsCount: expect.any(Number),
        newOfferingsCount: expect.any(Number),
        newTransactionsCount: expect.any(Number),
      });
    });
  });

  describe('Custom Fields Management', () => {
    beforeEach(async () => {
      await testDb.update(testDb.schema.tenants)
        .set({
          businessTypeId: testBusinessTypeId,
        })
        .where(testDb.eq(testDb.schema.tenants.id, testTenantId));
    });

    describe('POST /api/business-config/custom-fields', () => {
      it('should create custom field', async () => {
        const fieldData = {
          entityType: 'offering',
          name: 'allergens',
          label: 'Allergens',
          fieldType: 'multiselect',
          isRequired: false,
          fieldOptions: [
            { value: 'nuts', label: 'Nuts' },
            { value: 'dairy', label: 'Dairy' },
          ],
        };

        const response = await request(app)
          .post('/api/business-config/custom-fields')
          .send(fieldData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe('allergens');
        expect(response.body.data.fieldType).toBe('multiselect');
      });

      it('should validate custom field data', async () => {
        const invalidFieldData = {
          entityType: 'invalid', // Invalid entity type
          name: '',
          label: 'Invalid Field',
          fieldType: 'text',
          isRequired: false,
        };

        const response = await request(app)
          .post('/api/business-config/custom-fields')
          .send(invalidFieldData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });
    });

    describe('GET /api/business-config/custom-fields/:entityType', () => {
      it('should get custom fields by entity type', async () => {
        // Create a test custom field first
        await testDb.insert(testDb.schema.customFields).values({
          tenantId: testTenantId,
          entityType: 'offering',
          name: 'test_field',
          label: 'Test Field',
          fieldType: 'text',
          isRequired: false,
          fieldOptions: [],
          displayOrder: 0,
          isActive: true,
        });

        const response = await request(app)
          .get('/api/business-config/custom-fields/offering')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0].name).toBe('test_field');
      });
    });
  });

  describe('Workflow States Management', () => {
    beforeEach(async () => {
      await testDb.update(testDb.schema.tenants)
        .set({
          businessTypeId: testBusinessTypeId,
        })
        .where(testDb.eq(testDb.schema.tenants.id, testTenantId));
    });

    describe('POST /api/business-config/workflow-states', () => {
      it('should create workflow state', async () => {
        const stateData = {
          workflowType: 'transaction',
          name: 'preparing',
          displayName: 'Preparing',
          stateType: 'intermediate',
          color: '#3B82F6',
          description: 'Order is being prepared',
        };

        const response = await request(app)
          .post('/api/business-config/workflow-states')
          .send(stateData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe('preparing');
        expect(response.body.data.stateType).toBe('intermediate');
      });

      it('should validate workflow state data', async () => {
        const invalidStateData = {
          workflowType: 'invalid', // Invalid workflow type
          name: '',
          displayName: 'Invalid State',
          stateType: 'initial',
        };

        const response = await request(app)
          .post('/api/business-config/workflow-states')
          .send(invalidStateData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });
    });

    describe('GET /api/business-config/workflow-states/:workflowType', () => {
      it('should get workflow states by type', async () => {
        // Create a test workflow state first
        await testDb.insert(testDb.schema.workflowStates).values({
          tenantId: testTenantId,
          workflowType: 'transaction',
          name: 'pending',
          displayName: 'Pending',
          stateType: 'initial',
          color: '#F59E0B',
          isSystem: false,
          displayOrder: 0,
        });

        const response = await request(app)
          .get('/api/business-config/workflow-states/transaction')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0].name).toBe('pending');
      });
    });
  });

  describe('Business Types Management', () => {
    describe('GET /api/business-config/business-types', () => {
      it('should list business types', async () => {
        const response = await request(app)
          .get('/api/business-config/business-types')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.data).toBeDefined();
        expect(Array.isArray(response.body.data.data)).toBe(true);
      });

      it('should support pagination and filtering', async () => {
        const response = await request(app)
          .get('/api/business-config/business-types?page=1&limit=10&category=hospitality')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.page).toBe(1);
        expect(response.body.data.limit).toBe(10);
      });
    });

    describe('GET /api/business-config/business-types/:id', () => {
      it('should get business type by ID', async () => {
        const response = await request(app)
          .get(`/api/business-config/business-types/${testBusinessTypeId}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.id).toBe(testBusinessTypeId);
        expect(response.body.data.name).toBe('test-restaurant');
      });

      it('should handle invalid business type ID', async () => {
        const response = await request(app)
          .get('/api/business-config/business-types/nonexistent')
          .expect(404);

        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle missing tenant context', async () => {
      // Create app without tenant context middleware
      const appWithoutContext = express();
      appWithoutContext.use(express.json());
      appWithoutContext.use('/api/business-config', businessConfigRoutes);

      const response = await request(appWithoutContext)
        .get('/api/business-config')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('TENANT_CONTEXT_MISSING');
    });
  });
});