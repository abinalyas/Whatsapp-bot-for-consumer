/**
 * Comprehensive Zod validation schemas for tenant-related entities
 * This file provides runtime validation for all tenant data models
 */

import { z } from 'zod';

// ===== UTILITY SCHEMAS =====

const uuidSchema = z.string().uuid();
const emailSchema = z.string().email();
const phoneSchema = z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format');
const domainSchema = z.string().regex(/^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/, 'Invalid domain format');
const urlSchema = z.string().url();
const colorSchema = z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid color format');
const timeSchema = z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)');
const currencySchema = z.string().length(3, 'Currency must be 3 characters (ISO 4217)');

// ===== CORE TENANT SCHEMAS =====

export const tenantStatusSchema = z.enum(['trial', 'active', 'suspended', 'cancelled']);

export const createTenantRequestSchema = z.object({
  businessName: z.string().min(1, 'Business name is required').max(255, 'Business name too long'),
  domain: domainSchema,
  email: emailSchema,
  phone: phoneSchema.optional(),
  subscriptionPlan: z.string().optional().default('starter'),
  adminUser: z.object({
    email: emailSchema,
    password: z.string().min(8, 'Password must be at least 8 characters')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
        'Password must contain uppercase, lowercase, number, and special character'),
    firstName: z.string().min(1).max(100).optional(),
    lastName: z.string().min(1).max(100).optional(),
    role: z.enum(['admin', 'user', 'viewer']).optional().default('admin'),
  }),
});

export const updateTenantRequestSchema = z.object({
  businessName: z.string().min(1).max(255).optional(),
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  botSettings: z.record(z.any()).optional(), // Will be validated by botSettingsSchema
  billingSettings: z.record(z.any()).optional(), // Will be validated by billingSettingsSchema
});

// ===== USER SCHEMAS =====

export const userRoleSchema = z.enum(['admin', 'user', 'viewer']);

export const createUserRequestSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'Password must contain uppercase, lowercase, number, and special character'),
  role: userRoleSchema.optional().default('user'),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
});

export const updateUserRequestSchema = z.object({
  email: emailSchema.optional(),
  role: userRoleSchema.optional(),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  isActive: z.boolean().optional(),
});

// ===== API KEY SCHEMAS =====

export const apiPermissionSchema = z.enum([
  'read:services',
  'write:services',
  'read:conversations',
  'write:conversations',
  'read:bookings',
  'write:bookings',
  'read:analytics',
  'webhook:receive',
  'admin:all',
]);

export const createApiKeyRequestSchema = z.object({
  name: z.string().min(1, 'API key name is required').max(100, 'Name too long'),
  permissions: z.array(apiPermissionSchema).min(1, 'At least one permission is required'),
  expiresAt: z.date().min(new Date(), 'Expiry date must be in the future').optional(),
});

// ===== SUBSCRIPTION SCHEMAS =====

export const planFeaturesSchema = z.object({
  whatsappIntegration: z.boolean(),
  basicAnalytics: z.boolean(),
  advancedAnalytics: z.boolean().optional(),
  customBranding: z.boolean().optional(),
  webhooks: z.boolean().optional(),
  prioritySupport: z.boolean().optional(),
  sso: z.boolean().optional(),
  customIntegrations: z.boolean().optional(),
  dedicatedSupport: z.boolean().optional(),
});

export const planLimitsSchema = z.object({
  messagesPerMonth: z.number().int().min(-1, 'Invalid message limit'),
  bookingsPerMonth: z.number().int().min(-1, 'Invalid booking limit'),
  apiCallsPerDay: z.number().int().min(-1, 'Invalid API call limit'),
  storageGB: z.number().int().min(0).optional(),
  customFields: z.number().int().min(0).optional(),
  webhookEndpoints: z.number().int().min(0).optional(),
});

export const subscriptionPlanSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  priceMonthly: z.number().int().min(0, 'Price must be non-negative'),
  priceYearly: z.number().int().min(0, 'Price must be non-negative').optional(),
  features: planFeaturesSchema,
  limits: planLimitsSchema,
  isActive: z.boolean(),
  createdAt: z.date(),
});

export const subscriptionStatusSchema = z.enum(['active', 'cancelled', 'past_due', 'unpaid', 'trialing']);
export const billingCycleSchema = z.enum(['monthly', 'yearly']);

export const createSubscriptionRequestSchema = z.object({
  planId: z.string().min(1, 'Plan ID is required'),
  billingCycle: billingCycleSchema,
  paymentMethodId: z.string().optional(),
});

// ===== USAGE METRICS SCHEMAS =====

export const usageMetricNameSchema = z.enum([
  'messages_sent',
  'messages_received',
  'bookings_created',
  'api_calls',
  'storage_used',
  'webhook_calls',
]);

export const usageMetricSchema = z.object({
  id: uuidSchema,
  tenantId: uuidSchema,
  metricName: usageMetricNameSchema,
  metricValue: z.number().int().min(0),
  periodStart: z.date(),
  periodEnd: z.date(),
  createdAt: z.date(),
});

// ===== BOT CONFIGURATION SCHEMAS =====

export const dayScheduleSchema = z.object({
  isOpen: z.boolean(),
  openTime: timeSchema,
  closeTime: timeSchema,
}).refine(data => {
  if (!data.isOpen) return true;
  const [openHour, openMin] = data.openTime.split(':').map(Number);
  const [closeHour, closeMin] = data.closeTime.split(':').map(Number);
  const openMinutes = openHour * 60 + openMin;
  const closeMinutes = closeHour * 60 + closeMin;
  return openMinutes < closeMinutes;
}, {
  message: 'Open time must be before close time',
});

export const weeklyScheduleSchema = z.object({
  monday: dayScheduleSchema,
  tuesday: dayScheduleSchema,
  wednesday: dayScheduleSchema,
  thursday: dayScheduleSchema,
  friday: dayScheduleSchema,
  saturday: dayScheduleSchema,
  sunday: dayScheduleSchema,
});

export const businessHoursSchema = z.object({
  enabled: z.boolean(),
  timezone: z.string().min(1, 'Timezone is required'),
  schedule: weeklyScheduleSchema,
  closedMessage: z.string().min(1, 'Closed message is required').max(500),
});

export const autoResponsesSchema = z.object({
  welcomeMessage: z.string().min(1, 'Welcome message is required').max(1000),
  serviceSelectionPrompt: z.string().min(1).max(500),
  dateSelectionPrompt: z.string().min(1).max(500),
  timeSelectionPrompt: z.string().min(1).max(500),
  confirmationMessage: z.string().min(1).max(500),
  paymentInstructions: z.string().min(1).max(1000),
  bookingConfirmedMessage: z.string().min(1).max(500),
  errorMessage: z.string().min(1).max(500),
  invalidInputMessage: z.string().min(1).max(500),
});

export const validationRuleSchema = z.object({
  type: z.enum(['required', 'email', 'phone', 'date', 'time', 'custom']),
  message: z.string().min(1).max(200),
  pattern: z.string().optional(),
});

export const stepConditionSchema = z.object({
  field: z.string().min(1),
  operator: z.enum(['equals', 'contains', 'greater_than', 'less_than']),
  value: z.union([z.string(), z.number()]),
  nextStep: z.string().min(1),
});

export const stepTypeSchema = z.enum([
  'greeting',
  'service_selection',
  'date_selection',
  'time_selection',
  'customer_info',
  'payment',
  'confirmation',
  'custom',
]);

export const conversationStepSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100),
  type: stepTypeSchema,
  prompt: z.string().min(1).max(1000),
  validation: z.array(validationRuleSchema).optional(),
  nextStep: z.string().optional(),
  conditions: z.array(stepConditionSchema).optional(),
});

export const fallbackBehaviorSchema = z.enum(['restart', 'human_handoff', 'end_conversation']);

export const conversationFlowSchema = z.object({
  steps: z.array(conversationStepSchema).min(1, 'At least one step is required'),
  fallbackBehavior: fallbackBehaviorSchema,
  maxRetries: z.number().int().min(1).max(10),
  sessionTimeout: z.number().int().min(5).max(1440), // 5 minutes to 24 hours
});

export const paymentTypeSchema = z.enum(['cash', 'card', 'bank_transfer', 'mobile_money', 'crypto']);

export const paymentMethodSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100),
  type: paymentTypeSchema,
  enabled: z.boolean(),
  instructions: z.string().min(1).max(1000),
  metadata: z.record(z.any()).optional(),
});

export const paymentSettingsSchema = z.object({
  enabled: z.boolean(),
  methods: z.array(paymentMethodSchema),
  currency: currencySchema,
  requirePayment: z.boolean(),
  depositPercentage: z.number().min(0).max(100).optional(),
});

export const retryPolicySchema = z.object({
  maxRetries: z.number().int().min(0).max(10),
  backoffMultiplier: z.number().min(1).max(10),
  maxBackoffSeconds: z.number().int().min(1).max(3600),
});

export const webhookEndpointSchema = z.object({
  id: uuidSchema,
  url: urlSchema,
  secret: z.string().min(8, 'Webhook secret must be at least 8 characters'),
  isActive: z.boolean(),
  retryPolicy: retryPolicySchema,
});

export const notificationEventSchema = z.enum([
  'booking_created',
  'booking_confirmed',
  'booking_cancelled',
  'payment_received',
  'conversation_started',
  'conversation_ended',
  'error_occurred',
]);

export const emailNotificationSettingsSchema = z.object({
  enabled: z.boolean(),
  recipientEmails: z.array(emailSchema).max(10, 'Maximum 10 email recipients'),
  events: z.array(notificationEventSchema),
});

export const smsNotificationSettingsSchema = z.object({
  enabled: z.boolean(),
  recipientPhones: z.array(phoneSchema).max(5, 'Maximum 5 phone recipients'),
  events: z.array(notificationEventSchema),
});

export const webhookNotificationSettingsSchema = z.object({
  enabled: z.boolean(),
  endpoints: z.array(webhookEndpointSchema).max(5, 'Maximum 5 webhook endpoints'),
  events: z.array(notificationEventSchema),
});

export const notificationSettingsSchema = z.object({
  emailNotifications: emailNotificationSettingsSchema,
  smsNotifications: smsNotificationSettingsSchema,
  webhookNotifications: webhookNotificationSettingsSchema,
});

export const brandColorsSchema = z.object({
  primary: colorSchema,
  secondary: colorSchema,
  accent: colorSchema,
  background: colorSchema,
  text: colorSchema,
});

export const companyInfoSchema = z.object({
  name: z.string().min(1).max(255),
  address: z.string().max(500).optional(),
  phone: phoneSchema.optional(),
  email: emailSchema.optional(),
  website: urlSchema.optional(),
  description: z.string().max(1000).optional(),
});

export const customFieldTypeSchema = z.enum(['text', 'email', 'phone', 'number', 'date', 'select', 'radio', 'checkbox']);

export const customFieldSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100),
  type: customFieldTypeSchema,
  required: z.boolean(),
  options: z.array(z.string()).optional(),
  validation: z.array(validationRuleSchema).optional(),
});

export const botCustomizationSchema = z.object({
  brandColors: brandColorsSchema,
  logo: urlSchema.optional(),
  companyInfo: companyInfoSchema,
  customCss: z.string().max(10000).optional(),
  customFields: z.array(customFieldSchema).max(20, 'Maximum 20 custom fields'),
});

export const botSettingsSchema = z.object({
  greetingMessage: z.string().min(1, 'Greeting message is required').max(1000),
  businessHours: businessHoursSchema,
  autoResponses: autoResponsesSchema,
  conversationFlow: conversationFlowSchema,
  paymentSettings: paymentSettingsSchema,
  notificationSettings: notificationSettingsSchema,
  customization: botCustomizationSchema,
});

// ===== BILLING SETTINGS SCHEMAS =====

export const billingAddressSchema = z.object({
  street: z.string().min(1, 'Street address is required').max(255),
  city: z.string().min(1, 'City is required').max(100),
  state: z.string().min(1, 'State is required').max(100),
  postalCode: z.string().min(1, 'Postal code is required').max(20),
  country: z.string().length(2, 'Country must be 2-letter ISO code'),
});

export const paymentMethodInfoSchema = z.object({
  type: z.enum(['card', 'bank_account']),
  last4: z.string().length(4, 'Last 4 digits required'),
  brand: z.string().optional(),
  expiryMonth: z.number().int().min(1).max(12).optional(),
  expiryYear: z.number().int().min(new Date().getFullYear()).optional(),
  stripePaymentMethodId: z.string().min(1),
});

export const invoiceSettingsSchema = z.object({
  autoSend: z.boolean(),
  dueNetDays: z.number().int().min(0).max(90),
  footer: z.string().max(500).optional(),
  logo: urlSchema.optional(),
  includeUsageDetails: z.boolean(),
});

export const billingSettingsSchema = z.object({
  companyName: z.string().min(1, 'Company name is required').max(255),
  billingEmail: emailSchema,
  billingAddress: billingAddressSchema,
  taxId: z.string().max(50).optional(),
  paymentMethod: paymentMethodInfoSchema.optional(),
  invoiceSettings: invoiceSettingsSchema,
});

// ===== WHATSAPP CONFIGURATION SCHEMAS =====

export const whatsappCredentialsSchema = z.object({
  accessToken: z.string().min(1, 'Access token is required'),
  verifyToken: z.string().min(8, 'Verify token must be at least 8 characters'),
  phoneNumberId: z.string().min(1, 'Phone number ID is required'),
  businessAccountId: z.string().min(1, 'Business account ID is required'),
  appId: z.string().min(1, 'App ID is required'),
  appSecret: z.string().min(1, 'App secret is required'),
});

export const whatsappConfigSchema = whatsappCredentialsSchema.extend({
  webhookUrl: urlSchema,
  isVerified: z.boolean(),
  lastVerified: z.date().optional(),
});

// ===== AUTHENTICATION SCHEMAS =====

export const loginCredentialsSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  tenantDomain: domainSchema.optional(),
});

export const mfaMethodSchema = z.enum(['totp', 'sms', 'email']);

export const mfaSetupRequestSchema = z.object({
  method: mfaMethodSchema,
  phoneNumber: phoneSchema.optional(),
});

export const mfaVerificationRequestSchema = z.object({
  token: z.string().min(1, 'MFA token is required'),
  code: z.string().length(6, 'MFA code must be 6 digits'),
});

// ===== UTILITY SCHEMAS =====

export const paginationParamsSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const filterParamsSchema = z.object({
  status: z.array(z.string()).optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  search: z.string().max(255).optional(),
});

export const tenantContextRequestSchema = z.object({
  tenantId: uuidSchema,
  source: z.enum(['user_session', 'api_key', 'webhook']),
  sourceId: z.string().min(1),
});

// ===== AUDIT LOG SCHEMAS =====

export const auditActionSchema = z.enum([
  'create',
  'read',
  'update',
  'delete',
  'login',
  'logout',
  'api_call',
  'webhook_received',
  'payment_processed',
  'subscription_changed',
]);

export const auditLogSchema = z.object({
  id: uuidSchema,
  tenantId: uuidSchema,
  userId: uuidSchema.optional(),
  action: auditActionSchema,
  resource: z.string().min(1).max(100),
  resourceId: z.string().optional(),
  details: z.record(z.any()),
  ipAddress: z.string().ip().optional(),
  userAgent: z.string().max(500).optional(),
  timestamp: z.date(),
});

// ===== VALIDATION HELPERS =====

/**
 * Validates tenant domain uniqueness (to be used with database check)
 */
export const validateDomainUniqueness = (domain: string) => {
  return domainSchema.parse(domain);
};

/**
 * Validates email uniqueness within tenant (to be used with database check)
 */
export const validateEmailUniqueness = (email: string, tenantId: string) => {
  return {
    email: emailSchema.parse(email),
    tenantId: uuidSchema.parse(tenantId),
  };
};

/**
 * Validates password strength
 */
export const validatePasswordStrength = (password: string) => {
  const schema = z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(/^(?=.*[a-z])/, 'Password must contain at least one lowercase letter')
    .regex(/^(?=.*[A-Z])/, 'Password must contain at least one uppercase letter')
    .regex(/^(?=.*\d)/, 'Password must contain at least one number')
    .regex(/^(?=.*[@$!%*?&])/, 'Password must contain at least one special character');
  
  return schema.parse(password);
};

/**
 * Validates API key format
 */
export const validateApiKeyFormat = (key: string) => {
  const schema = z.string()
    .regex(/^tk_[a-zA-Z0-9]{32}$/, 'Invalid API key format');
  
  return schema.parse(key);
};

/**
 * Validates webhook URL accessibility
 */
export const validateWebhookUrl = (url: string) => {
  const schema = z.string()
    .url('Invalid URL format')
    .refine(url => url.startsWith('https://'), 'Webhook URL must use HTTPS');
  
  return schema.parse(url);
};

/**
 * Validates business hours consistency
 */
export const validateBusinessHours = (schedule: any) => {
  return weeklyScheduleSchema.parse(schedule);
};

/**
 * Validates conversation flow integrity
 */
export const validateConversationFlow = (flow: any) => {
  const parsed = conversationFlowSchema.parse(flow);
  
  // Additional validation: ensure all referenced steps exist
  const stepIds = new Set(parsed.steps.map(step => step.id));
  
  for (const step of parsed.steps) {
    if (step.nextStep && !stepIds.has(step.nextStep)) {
      throw new Error(`Step "${step.id}" references non-existent step "${step.nextStep}"`);
    }
    
    if (step.conditions) {
      for (const condition of step.conditions) {
        if (!stepIds.has(condition.nextStep)) {
          throw new Error(`Step "${step.id}" condition references non-existent step "${condition.nextStep}"`);
        }
      }
    }
  }
  
  return parsed;
};

// ===== EXPORT ALL SCHEMAS =====

export const tenantValidationSchemas = {
  // Core tenant schemas
  createTenantRequest: createTenantRequestSchema,
  updateTenantRequest: updateTenantRequestSchema,
  tenantStatus: tenantStatusSchema,
  
  // User schemas
  createUserRequest: createUserRequestSchema,
  updateUserRequest: updateUserRequestSchema,
  userRole: userRoleSchema,
  
  // API key schemas
  createApiKeyRequest: createApiKeyRequestSchema,
  apiPermission: apiPermissionSchema,
  
  // Subscription schemas
  subscriptionPlan: subscriptionPlanSchema,
  createSubscriptionRequest: createSubscriptionRequestSchema,
  planFeatures: planFeaturesSchema,
  planLimits: planLimitsSchema,
  
  // Usage metrics schemas
  usageMetric: usageMetricSchema,
  usageMetricName: usageMetricNameSchema,
  
  // Bot configuration schemas
  botSettings: botSettingsSchema,
  businessHours: businessHoursSchema,
  conversationFlow: conversationFlowSchema,
  paymentSettings: paymentSettingsSchema,
  
  // Billing schemas
  billingSettings: billingSettingsSchema,
  billingAddress: billingAddressSchema,
  
  // WhatsApp schemas
  whatsappCredentials: whatsappCredentialsSchema,
  whatsappConfig: whatsappConfigSchema,
  
  // Authentication schemas
  loginCredentials: loginCredentialsSchema,
  mfaSetupRequest: mfaSetupRequestSchema,
  mfaVerificationRequest: mfaVerificationRequestSchema,
  
  // Utility schemas
  paginationParams: paginationParamsSchema,
  filterParams: filterParamsSchema,
  tenantContextRequest: tenantContextRequestSchema,
  
  // Audit schemas
  auditLog: auditLogSchema,
  auditAction: auditActionSchema,
};