import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  tenantValidationSchemas,
  validatePasswordStrength,
  validateApiKeyFormat,
  validateWebhookUrl,
  validateConversationFlow,
  validateDomainUniqueness,
  validateEmailUniqueness,
} from '@shared/validation/tenant';
import type {
  CreateTenantRequest,
  CreateUserRequest,
  CreateApiKeyRequest,
  BotSettings,
  WhatsAppCredentials,
  LoginCredentials,
} from '@shared/types/tenant';

describe('Tenant Validation Schemas', () => {
  describe('Core Tenant Validation', () => {
    it('should validate valid tenant creation request', () => {
      const validTenant: CreateTenantRequest = {
        businessName: 'Test Business',
        domain: 'test.example.com',
        email: 'admin@test.example.com',
        phone: '+1234567890',
        subscriptionPlan: 'starter',
        adminUser: {
          email: 'admin@test.example.com',
          password: 'SecurePass123!',
          firstName: 'John',
          lastName: 'Doe',
          role: 'admin',
        },
      };

      const result = tenantValidationSchemas.createTenantRequest.parse(validTenant);
      expect(result).toEqual(validTenant);
    });

    it('should reject invalid tenant creation request', () => {
      const invalidTenant = {
        businessName: '', // Empty business name
        domain: 'invalid-domain', // Invalid domain format
        email: 'invalid-email', // Invalid email format
        adminUser: {
          email: 'admin@test.com',
          password: '123', // Weak password
        },
      };

      expect(() => {
        tenantValidationSchemas.createTenantRequest.parse(invalidTenant);
      }).toThrow();
    });

    it('should validate domain format correctly', () => {
      const validDomains = [
        'example.com',
        'test.example.com',
        'my-business.co.uk',
        'business123.org',
      ];

      const invalidDomains = [
        'invalid-domain',
        'example',
        '.example.com',
        'example..com',
        'example.c',
      ];

      validDomains.forEach(domain => {
        expect(() => validateDomainUniqueness(domain)).not.toThrow();
      });

      invalidDomains.forEach(domain => {
        expect(() => validateDomainUniqueness(domain)).toThrow();
      });
    });

    it('should validate email format correctly', () => {
      const validEmails = [
        'user@example.com',
        'test.user+tag@example.co.uk',
        'user123@test-domain.org',
      ];

      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user@.com',
        'user@example.',
      ];

      validEmails.forEach(email => {
        expect(() => {
          tenantValidationSchemas.createTenantRequest.parse({
            businessName: 'Test',
            domain: 'test.com',
            email,
            adminUser: {
              email,
              password: 'SecurePass123!',
            },
          });
        }).not.toThrow();
      });

      invalidEmails.forEach(email => {
        expect(() => {
          tenantValidationSchemas.createTenantRequest.parse({
            businessName: 'Test',
            domain: 'test.com',
            email,
            adminUser: {
              email: 'admin@test.com',
              password: 'SecurePass123!',
            },
          });
        }).toThrow();
      });
    });
  });

  describe('User Validation', () => {
    it('should validate valid user creation request', () => {
      const validUser: CreateUserRequest = {
        email: 'user@example.com',
        password: 'SecurePass123!',
        role: 'user',
        firstName: 'Jane',
        lastName: 'Smith',
      };

      const result = tenantValidationSchemas.createUserRequest.parse(validUser);
      expect(result).toEqual(validUser);
    });

    it('should validate password strength', () => {
      const validPasswords = [
        'SecurePass123!',
        'MyP@ssw0rd',
        'Complex123$',
      ];

      const invalidPasswords = [
        '123456', // Too short
        'password', // No uppercase, numbers, or special chars
        'PASSWORD123', // No lowercase or special chars
        'Password!', // No numbers
        'Password123', // No special chars
      ];

      validPasswords.forEach(password => {
        expect(() => validatePasswordStrength(password)).not.toThrow();
      });

      invalidPasswords.forEach(password => {
        expect(() => validatePasswordStrength(password)).toThrow();
      });
    });

    it('should validate user roles', () => {
      const validRoles = ['admin', 'user', 'viewer'];
      const invalidRoles = ['superuser', 'guest', 'moderator'];

      validRoles.forEach(role => {
        expect(() => {
          tenantValidationSchemas.createUserRequest.parse({
            email: 'user@example.com',
            password: 'SecurePass123!',
            role: role as any,
          });
        }).not.toThrow();
      });

      invalidRoles.forEach(role => {
        expect(() => {
          tenantValidationSchemas.createUserRequest.parse({
            email: 'user@example.com',
            password: 'SecurePass123!',
            role: role as any,
          });
        }).toThrow();
      });
    });
  });

  describe('API Key Validation', () => {
    it('should validate valid API key creation request', () => {
      const validApiKey: CreateApiKeyRequest = {
        name: 'Production API Key',
        permissions: ['read:services', 'write:bookings'],
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      };

      const result = tenantValidationSchemas.createApiKeyRequest.parse(validApiKey);
      expect(result).toEqual(validApiKey);
    });

    it('should validate API key format', () => {
      const validApiKeys = [
        'tk_abcdefghijklmnopqrstuvwxyz123456',
        'tk_ABCDEFGHIJKLMNOPQRSTUVWXYZ123456',
        'tk_1234567890abcdefghijklmnopqrstuv',
      ];

      const invalidApiKeys = [
        'invalid-key',
        'tk_short',
        'tk_toolongabcdefghijklmnopqrstuvwxyz123456',
        'ak_abcdefghijklmnopqrstuvwxyz123456', // Wrong prefix
      ];

      validApiKeys.forEach(key => {
        expect(() => validateApiKeyFormat(key)).not.toThrow();
      });

      invalidApiKeys.forEach(key => {
        expect(() => validateApiKeyFormat(key)).toThrow();
      });
    });

    it('should validate API permissions', () => {
      const validPermissions = [
        ['read:services'],
        ['write:services', 'read:bookings'],
        ['admin:all'],
        ['webhook:receive', 'read:analytics'],
      ];

      const invalidPermissions = [
        [], // Empty permissions
        ['invalid:permission'],
        ['read:invalid'],
        ['write:unknown'],
      ];

      validPermissions.forEach(permissions => {
        expect(() => {
          tenantValidationSchemas.createApiKeyRequest.parse({
            name: 'Test Key',
            permissions: permissions as any,
          });
        }).not.toThrow();
      });

      invalidPermissions.forEach(permissions => {
        expect(() => {
          tenantValidationSchemas.createApiKeyRequest.parse({
            name: 'Test Key',
            permissions: permissions as any,
          });
        }).toThrow();
      });
    });
  });

  describe('Bot Settings Validation', () => {
    it('should validate complete bot settings', () => {
      const validBotSettings: BotSettings = {
        greetingMessage: 'Welcome to our booking system!',
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
          closedMessage: 'We are currently closed. Please try again during business hours.',
        },
        autoResponses: {
          welcomeMessage: 'Hello! How can I help you today?',
          serviceSelectionPrompt: 'Please select a service:',
          dateSelectionPrompt: 'Please select a date:',
          timeSelectionPrompt: 'Please select a time:',
          confirmationMessage: 'Please confirm your booking:',
          paymentInstructions: 'Payment instructions will be sent shortly.',
          bookingConfirmedMessage: 'Your booking has been confirmed!',
          errorMessage: 'Sorry, something went wrong. Please try again.',
          invalidInputMessage: 'Invalid input. Please try again.',
        },
        conversationFlow: {
          steps: [
            {
              id: 'greeting',
              name: 'Greeting',
              type: 'greeting',
              prompt: 'Welcome! How can I help you?',
              nextStep: 'service_selection',
            },
            {
              id: 'service_selection',
              name: 'Service Selection',
              type: 'service_selection',
              prompt: 'Please select a service:',
              nextStep: 'date_selection',
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
              name: 'Cash',
              type: 'cash',
              enabled: true,
              instructions: 'Payment due at appointment.',
            },
          ],
          currency: 'USD',
          requirePayment: false,
        },
        notificationSettings: {
          emailNotifications: {
            enabled: true,
            recipientEmails: ['admin@example.com'],
            events: ['booking_created', 'booking_confirmed'],
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
            email: 'info@example.com',
            phone: '+1234567890',
          },
          customFields: [],
        },
      };

      const result = tenantValidationSchemas.botSettings.parse(validBotSettings);
      expect(result).toEqual(validBotSettings);
    });

    it('should validate business hours correctly', () => {
      const validSchedule = {
        monday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
        tuesday: { isOpen: true, openTime: '08:30', closeTime: '18:30' },
        wednesday: { isOpen: false, openTime: '09:00', closeTime: '17:00' },
        thursday: { isOpen: true, openTime: '10:00', closeTime: '16:00' },
        friday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
        saturday: { isOpen: true, openTime: '10:00', closeTime: '14:00' },
        sunday: { isOpen: false, openTime: '09:00', closeTime: '17:00' },
      };

      expect(() => {
        tenantValidationSchemas.businessHours.parse({
          enabled: true,
          timezone: 'America/New_York',
          schedule: validSchedule,
          closedMessage: 'We are closed.',
        });
      }).not.toThrow();

      // Test invalid time format
      const invalidSchedule = {
        ...validSchedule,
        monday: { isOpen: true, openTime: '25:00', closeTime: '17:00' }, // Invalid hour
      };

      expect(() => {
        tenantValidationSchemas.businessHours.parse({
          enabled: true,
          timezone: 'America/New_York',
          schedule: invalidSchedule,
          closedMessage: 'We are closed.',
        });
      }).toThrow();
    });

    it('should validate conversation flow integrity', () => {
      const validFlow = {
        steps: [
          {
            id: 'start',
            name: 'Start',
            type: 'greeting' as const,
            prompt: 'Hello!',
            nextStep: 'service',
          },
          {
            id: 'service',
            name: 'Service Selection',
            type: 'service_selection' as const,
            prompt: 'Select service:',
            nextStep: 'end',
          },
          {
            id: 'end',
            name: 'End',
            type: 'confirmation' as const,
            prompt: 'Thank you!',
          },
        ],
        fallbackBehavior: 'restart' as const,
        maxRetries: 3,
        sessionTimeout: 30,
      };

      expect(() => validateConversationFlow(validFlow)).not.toThrow();

      // Test invalid flow with missing step reference
      const invalidFlow = {
        ...validFlow,
        steps: [
          {
            id: 'start',
            name: 'Start',
            type: 'greeting' as const,
            prompt: 'Hello!',
            nextStep: 'nonexistent', // References non-existent step
          },
        ],
      };

      expect(() => validateConversationFlow(invalidFlow)).toThrow();
    });
  });

  describe('WhatsApp Configuration Validation', () => {
    it('should validate WhatsApp credentials', () => {
      const validCredentials: WhatsAppCredentials = {
        accessToken: 'EAABwzLixnjYBAOZBVZCxyz123',
        verifyToken: 'my_verify_token_123',
        phoneNumberId: '1234567890123456',
        businessAccountId: '1234567890123456',
        appId: '1234567890123456',
        appSecret: 'abcdef1234567890abcdef1234567890',
      };

      const result = tenantValidationSchemas.whatsappCredentials.parse(validCredentials);
      expect(result).toEqual(validCredentials);
    });

    it('should reject invalid WhatsApp credentials', () => {
      const invalidCredentials = {
        accessToken: '', // Empty token
        verifyToken: '123', // Too short
        phoneNumberId: '',
        businessAccountId: '',
        appId: '',
        appSecret: '',
      };

      expect(() => {
        tenantValidationSchemas.whatsappCredentials.parse(invalidCredentials);
      }).toThrow();
    });

    it('should validate webhook URLs', () => {
      const validUrls = [
        'https://example.com/webhook',
        'https://api.example.com/webhooks/whatsapp',
        'https://secure-domain.co.uk/webhook/endpoint',
      ];

      const invalidUrls = [
        'http://example.com/webhook', // Not HTTPS
        'ftp://example.com/webhook', // Wrong protocol
        'not-a-url',
        'https://', // Incomplete URL
      ];

      validUrls.forEach(url => {
        expect(() => validateWebhookUrl(url)).not.toThrow();
      });

      invalidUrls.forEach(url => {
        expect(() => validateWebhookUrl(url)).toThrow();
      });
    });
  });

  describe('Authentication Validation', () => {
    it('should validate login credentials', () => {
      const validCredentials: LoginCredentials = {
        email: 'user@example.com',
        password: 'password123',
        tenantDomain: 'example.com',
      };

      const result = tenantValidationSchemas.loginCredentials.parse(validCredentials);
      expect(result).toEqual(validCredentials);
    });

    it('should validate MFA setup request', () => {
      const validMfaSetup = {
        method: 'sms' as const,
        phoneNumber: '+1234567890',
      };

      const result = tenantValidationSchemas.mfaSetupRequest.parse(validMfaSetup);
      expect(result).toEqual(validMfaSetup);
    });

    it('should validate MFA verification request', () => {
      const validMfaVerification = {
        token: 'mfa_token_123',
        code: '123456',
      };

      const result = tenantValidationSchemas.mfaVerificationRequest.parse(validMfaVerification);
      expect(result).toEqual(validMfaVerification);

      // Test invalid code length
      expect(() => {
        tenantValidationSchemas.mfaVerificationRequest.parse({
          token: 'mfa_token_123',
          code: '12345', // Too short
        });
      }).toThrow();
    });
  });

  describe('Utility Validation', () => {
    it('should validate pagination parameters', () => {
      const validPagination = {
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc' as const,
      };

      const result = tenantValidationSchemas.paginationParams.parse(validPagination);
      expect(result).toEqual(validPagination);

      // Test defaults
      const minimalPagination = {};
      const resultWithDefaults = tenantValidationSchemas.paginationParams.parse(minimalPagination);
      expect(resultWithDefaults.page).toBe(1);
      expect(resultWithDefaults.limit).toBe(20);
      expect(resultWithDefaults.sortOrder).toBe('desc');
    });

    it('should validate filter parameters', () => {
      const validFilters = {
        status: ['active', 'suspended'],
        dateFrom: new Date('2023-01-01'),
        dateTo: new Date('2023-12-31'),
        search: 'test query',
      };

      const result = tenantValidationSchemas.filterParams.parse(validFilters);
      expect(result).toEqual(validFilters);
    });

    it('should validate tenant context request', () => {
      const validContext = {
        tenantId: '123e4567-e89b-12d3-a456-426614174000',
        source: 'user_session' as const,
        sourceId: 'session_123',
      };

      const result = tenantValidationSchemas.tenantContextRequest.parse(validContext);
      expect(result).toEqual(validContext);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle null and undefined values appropriately', () => {
      expect(() => {
        tenantValidationSchemas.createTenantRequest.parse(null);
      }).toThrow();

      expect(() => {
        tenantValidationSchemas.createTenantRequest.parse(undefined);
      }).toThrow();
    });

    it('should provide meaningful error messages', () => {
      try {
        tenantValidationSchemas.createTenantRequest.parse({
          businessName: '',
          domain: 'invalid',
          email: 'not-an-email',
          adminUser: {
            email: 'admin@test.com',
            password: '123',
          },
        });
      } catch (error) {
        expect(error).toBeInstanceOf(z.ZodError);
        const zodError = error as z.ZodError;
        expect(zodError.errors.length).toBeGreaterThan(0);
        expect(zodError.errors.some(e => e.message.includes('Business name is required'))).toBe(true);
      }
    });

    it('should validate nested object structures', () => {
      const invalidNestedStructure = {
        businessName: 'Test Business',
        domain: 'test.com',
        email: 'admin@test.com',
        adminUser: {
          email: 'admin@test.com',
          password: 'SecurePass123!',
          role: 'invalid_role', // Invalid nested value
        },
      };

      expect(() => {
        tenantValidationSchemas.createTenantRequest.parse(invalidNestedStructure);
      }).toThrow();
    });

    it('should validate array constraints', () => {
      // Test maximum array length constraints
      const tooManyEmails = Array(15).fill('test@example.com'); // Max is 10

      expect(() => {
        tenantValidationSchemas.botSettings.parse({
          greetingMessage: 'Hello',
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
          autoResponses: {
            welcomeMessage: 'Hello',
            serviceSelectionPrompt: 'Select',
            dateSelectionPrompt: 'Date',
            timeSelectionPrompt: 'Time',
            confirmationMessage: 'Confirm',
            paymentInstructions: 'Pay',
            bookingConfirmedMessage: 'Confirmed',
            errorMessage: 'Error',
            invalidInputMessage: 'Invalid',
          },
          conversationFlow: {
            steps: [{
              id: 'test',
              name: 'Test',
              type: 'greeting',
              prompt: 'Hello',
            }],
            fallbackBehavior: 'restart',
            maxRetries: 3,
            sessionTimeout: 30,
          },
          paymentSettings: {
            enabled: false,
            methods: [],
            currency: 'USD',
            requirePayment: false,
          },
          notificationSettings: {
            emailNotifications: {
              enabled: true,
              recipientEmails: tooManyEmails,
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
              primary: '#000000',
              secondary: '#ffffff',
              accent: '#ff0000',
              background: '#ffffff',
              text: '#000000',
            },
            companyInfo: {
              name: 'Test',
            },
            customFields: [],
          },
        });
      }).toThrow();
    });
  });
});