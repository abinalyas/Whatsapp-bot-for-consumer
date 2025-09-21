import { describe, it, expect } from 'vitest';
import type {
  Tenant,
  User,
  ApiKey,
  SubscriptionPlan,
  Subscription,
  UsageMetric,
  BotSettings,
  TenantContext,
  CreateTenantRequest,
  CreateUserRequest,
  CreateApiKeyRequest,
  WhatsAppCredentials,
  LoginCredentials,
  UserProfile,
  PaginatedResponse,
  ServiceResponse,
  BulkOperationResult,
  TenantError,
  ValidationError,
  AuditLog,
} from '@shared/types/tenant';

describe('Tenant Type Safety Tests', () => {
  describe('Core Tenant Types', () => {
    it('should enforce Tenant interface structure', () => {
      const tenant: Tenant = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        businessName: 'Test Business',
        domain: 'test.example.com',
        email: 'admin@test.example.com',
        phone: '+1234567890',
        status: 'active',
        subscriptionPlan: 'professional',
        whatsappPhoneId: '1234567890',
        whatsappToken: 'token123',
        whatsappVerifyToken: 'verify123',
        botSettings: {
          greetingMessage: 'Welcome!',
          businessHours: {
            enabled: true,
            timezone: 'America/New_York',
            schedule: {
              monday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
              tuesday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
              wednesday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
              thursday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
              friday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
              saturday: { isOpen: false, openTime: '09:00', closeTime: '17:00' },
              sunday: { isOpen: false, openTime: '09:00', closeTime: '17:00' },
            },
            closedMessage: 'We are closed',
          },
          autoResponses: {
            welcomeMessage: 'Hello!',
            serviceSelectionPrompt: 'Select service:',
            dateSelectionPrompt: 'Select date:',
            timeSelectionPrompt: 'Select time:',
            confirmationMessage: 'Confirm booking:',
            paymentInstructions: 'Payment info:',
            bookingConfirmedMessage: 'Booking confirmed!',
            errorMessage: 'Error occurred',
            invalidInputMessage: 'Invalid input',
          },
          conversationFlow: {
            steps: [{
              id: 'greeting',
              name: 'Greeting',
              type: 'greeting',
              prompt: 'Hello!',
            }],
            fallbackBehavior: 'restart',
            maxRetries: 3,
            sessionTimeout: 30,
          },
          paymentSettings: {
            enabled: true,
            methods: [{
              id: 'cash',
              name: 'Cash',
              type: 'cash',
              enabled: true,
              instructions: 'Pay in cash',
            }],
            currency: 'USD',
            requirePayment: false,
          },
          notificationSettings: {
            emailNotifications: {
              enabled: true,
              recipientEmails: ['admin@test.com'],
              events: ['booking_created'],
            },
            smsNotifications: {
              enabled: false,
              recipientPhones: [],
              events: [],
            },
            webhookNotifications: {
              enabled: false,
              endpoints: [],
              events: [],
            },
          },
          customization: {
            brandColors: {
              primary: '#007bff',
              secondary: '#6c757d',
              accent: '#28a745',
              background: '#ffffff',
              text: '#212529',
            },
            companyInfo: {
              name: 'Test Company',
            },
            customFields: [],
          },
        },
        billingSettings: {
          companyName: 'Test Company',
          billingEmail: 'billing@test.com',
          billingAddress: {
            street: '123 Main St',
            city: 'Anytown',
            state: 'CA',
            postalCode: '12345',
            country: 'US',
          },
          invoiceSettings: {
            autoSend: true,
            dueNetDays: 30,
            includeUsageDetails: true,
          },
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(tenant.id).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(tenant.status).toBe('active');
      expect(tenant.botSettings.greetingMessage).toBe('Welcome!');
    });

    it('should enforce TenantStatus union type', () => {
      const validStatuses: Array<Tenant['status']> = ['trial', 'active', 'suspended', 'cancelled'];
      
      validStatuses.forEach(status => {
        const tenant: Partial<Tenant> = { status };
        expect(['trial', 'active', 'suspended', 'cancelled']).toContain(tenant.status);
      });

      // TypeScript should prevent invalid statuses at compile time
      // const invalidTenant: Tenant = { status: 'invalid' }; // This would cause a TypeScript error
    });
  });

  describe('User Types', () => {
    it('should enforce User interface structure', () => {
      const user: User = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        tenantId: '123e4567-e89b-12d3-a456-426614174000',
        email: 'user@test.com',
        passwordHash: 'hashed_password',
        role: 'admin',
        firstName: 'John',
        lastName: 'Doe',
        isActive: true,
        lastLogin: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(user.role).toBe('admin');
      expect(user.isActive).toBe(true);
    });

    it('should enforce UserRole union type', () => {
      const validRoles: Array<User['role']> = ['admin', 'user', 'viewer'];
      
      validRoles.forEach(role => {
        const user: Partial<User> = { role };
        expect(['admin', 'user', 'viewer']).toContain(user.role);
      });
    });

    it('should enforce UserProfile interface structure', () => {
      const userProfile: UserProfile = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        email: 'user@test.com',
        role: 'admin',
        firstName: 'John',
        lastName: 'Doe',
        isActive: true,
        lastLogin: new Date(),
        tenant: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          businessName: 'Test Business',
          domain: 'test.example.com',
        },
      };

      expect(userProfile.tenant.businessName).toBe('Test Business');
      expect(userProfile.role).toBe('admin');
    });
  });

  describe('API Key Types', () => {
    it('should enforce ApiKey interface structure', () => {
      const apiKey: ApiKey = {
        id: '123e4567-e89b-12d3-a456-426614174002',
        tenantId: '123e4567-e89b-12d3-a456-426614174000',
        keyHash: 'hashed_key',
        name: 'Production API Key',
        permissions: ['read:services', 'write:bookings'],
        lastUsed: new Date(),
        expiresAt: new Date(),
        isActive: true,
        createdAt: new Date(),
      };

      expect(apiKey.permissions).toContain('read:services');
      expect(apiKey.isActive).toBe(true);
    });

    it('should enforce ApiPermission union type', () => {
      const validPermissions: Array<ApiKey['permissions'][0]> = [
        'read:services',
        'write:services',
        'read:conversations',
        'write:conversations',
        'read:bookings',
        'write:bookings',
        'read:analytics',
        'webhook:receive',
        'admin:all',
      ];

      validPermissions.forEach(permission => {
        const apiKey: Partial<ApiKey> = { permissions: [permission] };
        expect(validPermissions).toContain(apiKey.permissions![0]);
      });
    });
  });

  describe('Subscription Types', () => {
    it('should enforce SubscriptionPlan interface structure', () => {
      const plan: SubscriptionPlan = {
        id: 'professional',
        name: 'Professional Plan',
        description: 'For growing businesses',
        priceMonthly: 9900,
        priceYearly: 99000,
        features: {
          whatsappIntegration: true,
          basicAnalytics: true,
          advancedAnalytics: true,
          customBranding: true,
          webhooks: true,
          prioritySupport: true,
        },
        limits: {
          messagesPerMonth: 10000,
          bookingsPerMonth: 1000,
          apiCallsPerDay: 10000,
          storageGB: 10,
          customFields: 20,
          webhookEndpoints: 5,
        },
        isActive: true,
        createdAt: new Date(),
      };

      expect(plan.features.whatsappIntegration).toBe(true);
      expect(plan.limits.messagesPerMonth).toBe(10000);
    });

    it('should enforce Subscription interface structure', () => {
      const subscription: Subscription = {
        id: '123e4567-e89b-12d3-a456-426614174003',
        tenantId: '123e4567-e89b-12d3-a456-426614174000',
        planId: 'professional',
        status: 'active',
        billingCycle: 'monthly',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(),
        stripeSubscriptionId: 'sub_123456789',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(subscription.status).toBe('active');
      expect(subscription.billingCycle).toBe('monthly');
    });
  });

  describe('Usage Metrics Types', () => {
    it('should enforce UsageMetric interface structure', () => {
      const metric: UsageMetric = {
        id: '123e4567-e89b-12d3-a456-426614174004',
        tenantId: '123e4567-e89b-12d3-a456-426614174000',
        metricName: 'messages_sent',
        metricValue: 1500,
        periodStart: new Date(),
        periodEnd: new Date(),
        createdAt: new Date(),
      };

      expect(metric.metricName).toBe('messages_sent');
      expect(metric.metricValue).toBe(1500);
    });

    it('should enforce UsageMetricName union type', () => {
      const validMetricNames: Array<UsageMetric['metricName']> = [
        'messages_sent',
        'messages_received',
        'bookings_created',
        'api_calls',
        'storage_used',
        'webhook_calls',
      ];

      validMetricNames.forEach(metricName => {
        const metric: Partial<UsageMetric> = { metricName };
        expect(validMetricNames).toContain(metric.metricName);
      });
    });
  });

  describe('Bot Configuration Types', () => {
    it('should enforce BotSettings interface structure', () => {
      const botSettings: BotSettings = {
        greetingMessage: 'Welcome to our service!',
        businessHours: {
          enabled: true,
          timezone: 'America/New_York',
          schedule: {
            monday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
            tuesday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
            wednesday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
            thursday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
            friday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
            saturday: { isOpen: false, openTime: '09:00', closeTime: '17:00' },
            sunday: { isOpen: false, openTime: '09:00', closeTime: '17:00' },
          },
          closedMessage: 'We are currently closed',
        },
        autoResponses: {
          welcomeMessage: 'Hello! How can I help you?',
          serviceSelectionPrompt: 'Please select a service:',
          dateSelectionPrompt: 'Please select a date:',
          timeSelectionPrompt: 'Please select a time:',
          confirmationMessage: 'Please confirm your booking:',
          paymentInstructions: 'Payment instructions:',
          bookingConfirmedMessage: 'Your booking is confirmed!',
          errorMessage: 'Sorry, an error occurred',
          invalidInputMessage: 'Invalid input, please try again',
        },
        conversationFlow: {
          steps: [
            {
              id: 'greeting',
              name: 'Greeting',
              type: 'greeting',
              prompt: 'Welcome!',
              nextStep: 'service_selection',
            },
            {
              id: 'service_selection',
              name: 'Service Selection',
              type: 'service_selection',
              prompt: 'Select a service:',
              validation: [
                {
                  type: 'required',
                  message: 'Service selection is required',
                },
              ],
              conditions: [
                {
                  field: 'service_type',
                  operator: 'equals',
                  value: 'premium',
                  nextStep: 'premium_flow',
                },
              ],
            },
          ],
          fallbackBehavior: 'restart',
          maxRetries: 3,
          sessionTimeout: 30,
        },
        paymentSettings: {
          enabled: true,
          methods: [
            {
              id: 'cash',
              name: 'Cash Payment',
              type: 'cash',
              enabled: true,
              instructions: 'Payment due at appointment',
              metadata: { processingFee: 0 },
            },
            {
              id: 'card',
              name: 'Credit Card',
              type: 'card',
              enabled: true,
              instructions: 'We accept all major credit cards',
              metadata: { processingFee: 2.9 },
            },
          ],
          currency: 'USD',
          requirePayment: false,
          depositPercentage: 25,
        },
        notificationSettings: {
          emailNotifications: {
            enabled: true,
            recipientEmails: ['admin@test.com', 'manager@test.com'],
            events: ['booking_created', 'booking_confirmed', 'payment_received'],
          },
          smsNotifications: {
            enabled: true,
            recipientPhones: ['+1234567890'],
            events: ['booking_created', 'booking_confirmed'],
          },
          webhookNotifications: {
            enabled: true,
            endpoints: [
              {
                id: '123e4567-e89b-12d3-a456-426614174005',
                url: 'https://api.example.com/webhooks/bookings',
                secret: 'webhook_secret_123',
                isActive: true,
                retryPolicy: {
                  maxRetries: 3,
                  backoffMultiplier: 2,
                  maxBackoffSeconds: 300,
                },
              },
            ],
            events: ['booking_created', 'booking_confirmed', 'booking_cancelled'],
          },
        },
        customization: {
          brandColors: {
            primary: '#007bff',
            secondary: '#6c757d',
            accent: '#28a745',
            background: '#ffffff',
            text: '#212529',
          },
          logo: 'https://example.com/logo.png',
          companyInfo: {
            name: 'Test Company',
            address: '123 Main St, Anytown, CA 12345',
            phone: '+1234567890',
            email: 'info@test.com',
            website: 'https://test.com',
            description: 'We provide excellent services',
          },
          customCss: '.custom-style { color: red; }',
          customFields: [
            {
              id: 'customer_notes',
              name: 'Special Requests',
              type: 'text',
              required: false,
              validation: [
                {
                  type: 'custom',
                  message: 'Notes must be under 500 characters',
                  pattern: '^.{0,500}$',
                },
              ],
            },
            {
              id: 'preferred_contact',
              name: 'Preferred Contact Method',
              type: 'select',
              required: true,
              options: ['Email', 'Phone', 'SMS'],
            },
          ],
        },
      };

      expect(botSettings.greetingMessage).toBe('Welcome to our service!');
      expect(botSettings.businessHours.enabled).toBe(true);
      expect(botSettings.conversationFlow.steps).toHaveLength(2);
      expect(botSettings.paymentSettings.methods).toHaveLength(2);
      expect(botSettings.customization.customFields).toHaveLength(2);
    });
  });

  describe('WhatsApp Configuration Types', () => {
    it('should enforce WhatsAppCredentials interface structure', () => {
      const credentials: WhatsAppCredentials = {
        accessToken: 'EAABwzLixnjYBAOZBVZCxyz123',
        verifyToken: 'my_verify_token_123',
        phoneNumberId: '1234567890123456',
        businessAccountId: '1234567890123456',
        appId: '1234567890123456',
        appSecret: 'abcdef1234567890abcdef1234567890',
      };

      expect(credentials.accessToken).toBe('EAABwzLixnjYBAOZBVZCxyz123');
      expect(credentials.phoneNumberId).toBe('1234567890123456');
    });
  });

  describe('Authentication Types', () => {
    it('should enforce LoginCredentials interface structure', () => {
      const credentials: LoginCredentials = {
        email: 'user@test.com',
        password: 'password123',
        tenantDomain: 'test.example.com',
      };

      expect(credentials.email).toBe('user@test.com');
      expect(credentials.tenantDomain).toBe('test.example.com');
    });

    it('should enforce TenantContext interface structure', () => {
      const context: TenantContext = {
        tenantId: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        userRole: 'admin',
        permissions: ['read:services', 'write:bookings', 'admin:all'],
        subscriptionLimits: {
          messagesPerMonth: 10000,
          bookingsPerMonth: 1000,
          apiCallsPerDay: 10000,
        },
        currentUsage: {
          messages_sent: 1500,
          messages_received: 1200,
          bookings_created: 45,
          api_calls: 2300,
          storage_used: 512,
          webhook_calls: 120,
        },
      };

      expect(context.tenantId).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(context.permissions).toContain('admin:all');
      expect(context.currentUsage.messages_sent).toBe(1500);
    });
  });

  describe('Utility Types', () => {
    it('should enforce PaginatedResponse interface structure', () => {
      const response: PaginatedResponse<Tenant> = {
        data: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            businessName: 'Test Business',
            domain: 'test.example.com',
            email: 'admin@test.com',
            status: 'active',
            subscriptionPlan: 'starter',
            botSettings: {} as BotSettings,
            billingSettings: {
              companyName: 'Test',
              billingEmail: 'billing@test.com',
              billingAddress: {
                street: '123 Main St',
                city: 'Anytown',
                state: 'CA',
                postalCode: '12345',
                country: 'US',
              },
              invoiceSettings: {
                autoSend: true,
                dueNetDays: 30,
                includeUsageDetails: true,
              },
            },
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      };

      expect(response.data).toHaveLength(1);
      expect(response.pagination.total).toBe(1);
    });

    it('should enforce ServiceResponse interface structure', () => {
      const successResponse: ServiceResponse<Tenant> = {
        success: true,
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          businessName: 'Test Business',
          domain: 'test.example.com',
          email: 'admin@test.com',
          status: 'active',
          subscriptionPlan: 'starter',
          botSettings: {} as BotSettings,
          billingSettings: {
            companyName: 'Test',
            billingEmail: 'billing@test.com',
            billingAddress: {
              street: '123 Main St',
              city: 'Anytown',
              state: 'CA',
              postalCode: '12345',
              country: 'US',
            },
            invoiceSettings: {
              autoSend: true,
              dueNetDays: 30,
              includeUsageDetails: true,
            },
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        metadata: { requestId: 'req_123' },
      };

      const errorResponse: ServiceResponse<Tenant> = {
        success: false,
        error: {
          code: 'TENANT_NOT_FOUND',
          message: 'Tenant not found',
          tenantId: '123e4567-e89b-12d3-a456-426614174000',
        },
      };

      expect(successResponse.success).toBe(true);
      expect(successResponse.data?.businessName).toBe('Test Business');
      expect(errorResponse.success).toBe(false);
      expect(errorResponse.error?.code).toBe('TENANT_NOT_FOUND');
    });

    it('should enforce BulkOperationResult interface structure', () => {
      const bulkResult: BulkOperationResult<CreateUserRequest> = {
        successful: [
          {
            email: 'user1@test.com',
            password: 'password123',
            role: 'user',
          },
          {
            email: 'user2@test.com',
            password: 'password456',
            role: 'admin',
          },
        ],
        failed: [
          {
            item: {
              email: 'invalid-email',
              password: 'weak',
              role: 'user',
            },
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid email format',
            },
          },
        ],
        summary: {
          total: 3,
          successful: 2,
          failed: 1,
        },
      };

      expect(bulkResult.successful).toHaveLength(2);
      expect(bulkResult.failed).toHaveLength(1);
      expect(bulkResult.summary.total).toBe(3);
    });
  });

  describe('Error Types', () => {
    it('should enforce TenantError interface structure', () => {
      const error: TenantError = {
        code: 'TENANT_SUSPENDED',
        message: 'Tenant account has been suspended',
        details: {
          reason: 'Payment overdue',
          suspendedAt: new Date().toISOString(),
        },
        tenantId: '123e4567-e89b-12d3-a456-426614174000',
      };

      expect(error.code).toBe('TENANT_SUSPENDED');
      expect(error.tenantId).toBe('123e4567-e89b-12d3-a456-426614174000');
    });

    it('should enforce ValidationError interface structure', () => {
      const error: ValidationError = {
        field: 'email',
        message: 'Invalid email format',
        code: 'INVALID_EMAIL',
      };

      expect(error.field).toBe('email');
      expect(error.code).toBe('INVALID_EMAIL');
    });
  });

  describe('Audit Log Types', () => {
    it('should enforce AuditLog interface structure', () => {
      const auditLog: AuditLog = {
        id: '123e4567-e89b-12d3-a456-426614174006',
        tenantId: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        action: 'create',
        resource: 'booking',
        resourceId: '123e4567-e89b-12d3-a456-426614174007',
        details: {
          serviceName: 'Haircut',
          customerPhone: '+1234567890',
          amount: 5000,
        },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        timestamp: new Date(),
      };

      expect(auditLog.action).toBe('create');
      expect(auditLog.resource).toBe('booking');
      expect(auditLog.details.serviceName).toBe('Haircut');
    });
  });

  describe('Type Inference and Utility Types', () => {
    it('should properly infer types from union types', () => {
      type TenantStatusType = Tenant['status'];
      type UserRoleType = User['role'];
      type ApiPermissionType = ApiKey['permissions'][0];

      const status: TenantStatusType = 'active';
      const role: UserRoleType = 'admin';
      const permission: ApiPermissionType = 'read:services';

      expect(status).toBe('active');
      expect(role).toBe('admin');
      expect(permission).toBe('read:services');
    });

    it('should support optional properties correctly', () => {
      const minimalTenant: Pick<Tenant, 'id' | 'businessName' | 'domain' | 'email' | 'status' | 'subscriptionPlan' | 'botSettings' | 'billingSettings' | 'createdAt' | 'updatedAt'> = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        businessName: 'Test Business',
        domain: 'test.example.com',
        email: 'admin@test.com',
        status: 'active',
        subscriptionPlan: 'starter',
        botSettings: {} as BotSettings,
        billingSettings: {
          companyName: 'Test',
          billingEmail: 'billing@test.com',
          billingAddress: {
            street: '123 Main St',
            city: 'Anytown',
            state: 'CA',
            postalCode: '12345',
            country: 'US',
          },
          invoiceSettings: {
            autoSend: true,
            dueNetDays: 30,
            includeUsageDetails: true,
          },
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Optional properties should not be required
      expect(minimalTenant.phone).toBeUndefined();
      expect(minimalTenant.whatsappPhoneId).toBeUndefined();
    });

    it('should support partial types for updates', () => {
      const updateData: Partial<Tenant> = {
        businessName: 'Updated Business Name',
        email: 'newemail@test.com',
      };

      expect(updateData.businessName).toBe('Updated Business Name');
      expect(updateData.domain).toBeUndefined(); // Not included in partial update
    });

    it('should support nested partial types', () => {
      const botSettingsUpdate: Partial<BotSettings> = {
        greetingMessage: 'New greeting message',
        businessHours: {
          enabled: false,
          timezone: 'UTC',
          schedule: {
            monday: { isOpen: false, openTime: '09:00', closeTime: '17:00' },
            tuesday: { isOpen: false, openTime: '09:00', closeTime: '17:00' },
            wednesday: { isOpen: false, openTime: '09:00', closeTime: '17:00' },
            thursday: { isOpen: false, openTime: '09:00', closeTime: '17:00' },
            friday: { isOpen: false, openTime: '09:00', closeTime: '17:00' },
            saturday: { isOpen: false, openTime: '09:00', closeTime: '17:00' },
            sunday: { isOpen: false, openTime: '09:00', closeTime: '17:00' },
          },
          closedMessage: 'Closed',
        },
      };

      expect(botSettingsUpdate.greetingMessage).toBe('New greeting message');
      expect(botSettingsUpdate.businessHours?.enabled).toBe(false);
      expect(botSettingsUpdate.autoResponses).toBeUndefined(); // Not included in partial update
    });
  });
});