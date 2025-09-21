/**
 * Comprehensive TypeScript interfaces for tenant-related entities
 * This file defines all the data models for the multi-tenant SaaS platform
 */

// ===== CORE TENANT TYPES =====

export interface Tenant {
  id: string;
  businessName: string;
  domain: string;
  email: string;
  phone?: string;
  status: TenantStatus;
  subscriptionPlan: string;
  whatsappPhoneId?: string;
  whatsappToken?: string;
  whatsappVerifyToken?: string;
  botSettings: BotSettings;
  billingSettings: BillingSettings;
  createdAt: Date;
  updatedAt: Date;
}

export type TenantStatus = 'trial' | 'active' | 'suspended' | 'cancelled';

export interface CreateTenantRequest {
  businessName: string;
  domain: string;
  email: string;
  phone?: string;
  subscriptionPlan?: string;
  adminUser: CreateUserRequest;
}

export interface UpdateTenantRequest {
  businessName?: string;
  email?: string;
  phone?: string;
  botSettings?: Partial<BotSettings>;
  billingSettings?: Partial<BillingSettings>;
}

// ===== USER TYPES =====

export interface User {
  id: string;
  tenantId: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = 'admin' | 'user' | 'viewer';

export interface CreateUserRequest {
  email: string;
  password: string;
  role?: UserRole;
  firstName?: string;
  lastName?: string;
}

export interface UpdateUserRequest {
  email?: string;
  role?: UserRole;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
  lastLogin?: Date;
  tenant: {
    id: string;
    businessName: string;
    domain: string;
  };
}

// ===== API KEY TYPES =====

export interface ApiKey {
  id: string;
  tenantId: string;
  keyHash: string;
  name: string;
  permissions: ApiPermission[];
  lastUsed?: Date;
  expiresAt?: Date;
  isActive: boolean;
  createdAt: Date;
}

export interface CreateApiKeyRequest {
  name: string;
  permissions: ApiPermission[];
  expiresAt?: Date;
}

export interface ApiKeyResponse {
  id: string;
  name: string;
  key: string; // Only returned on creation
  permissions: ApiPermission[];
  expiresAt?: Date;
  createdAt: Date;
}

export type ApiPermission = 
  | 'read:services'
  | 'write:services'
  | 'read:conversations'
  | 'write:conversations'
  | 'read:bookings'
  | 'write:bookings'
  | 'read:analytics'
  | 'webhook:receive'
  | 'admin:all';

// ===== SUBSCRIPTION TYPES =====

export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  priceMonthly: number;
  priceYearly?: number;
  features: PlanFeatures;
  limits: PlanLimits;
  isActive: boolean;
  createdAt: Date;
}

export interface PlanFeatures {
  whatsappIntegration: boolean;
  basicAnalytics: boolean;
  advancedAnalytics?: boolean;
  customBranding?: boolean;
  webhooks?: boolean;
  prioritySupport?: boolean;
  sso?: boolean;
  customIntegrations?: boolean;
  dedicatedSupport?: boolean;
}

export interface PlanLimits {
  messagesPerMonth: number; // -1 for unlimited
  bookingsPerMonth: number; // -1 for unlimited
  apiCallsPerDay: number; // -1 for unlimited
  storageGB?: number;
  customFields?: number;
  webhookEndpoints?: number;
}

export interface Subscription {
  id: string;
  tenantId: string;
  planId: string;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  stripeSubscriptionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type SubscriptionStatus = 'active' | 'cancelled' | 'past_due' | 'unpaid' | 'trialing';
export type BillingCycle = 'monthly' | 'yearly';

export interface CreateSubscriptionRequest {
  planId: string;
  billingCycle: BillingCycle;
  paymentMethodId?: string;
}

// ===== USAGE METRICS TYPES =====

export interface UsageMetric {
  id: string;
  tenantId: string;
  metricName: UsageMetricName;
  metricValue: number;
  periodStart: Date;
  periodEnd: Date;
  createdAt: Date;
}

export type UsageMetricName = 
  | 'messages_sent'
  | 'messages_received'
  | 'bookings_created'
  | 'api_calls'
  | 'storage_used'
  | 'webhook_calls';

export interface UsageReport {
  tenantId: string;
  period: {
    start: Date;
    end: Date;
  };
  metrics: Record<UsageMetricName, number>;
  limits: PlanLimits;
  percentageUsed: Record<UsageMetricName, number>;
}

// ===== BOT CONFIGURATION TYPES =====

export interface BotSettings {
  greetingMessage: string;
  businessHours: BusinessHours;
  autoResponses: AutoResponses;
  conversationFlow: ConversationFlow;
  paymentSettings: PaymentSettings;
  notificationSettings: NotificationSettings;
  customization: BotCustomization;
}

export interface BusinessHours {
  enabled: boolean;
  timezone: string;
  schedule: WeeklySchedule;
  closedMessage: string;
}

export interface WeeklySchedule {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface DaySchedule {
  isOpen: boolean;
  openTime: string; // HH:MM format
  closeTime: string; // HH:MM format
}

export interface AutoResponses {
  welcomeMessage: string;
  serviceSelectionPrompt: string;
  dateSelectionPrompt: string;
  timeSelectionPrompt: string;
  confirmationMessage: string;
  paymentInstructions: string;
  bookingConfirmedMessage: string;
  errorMessage: string;
  invalidInputMessage: string;
}

export interface ConversationFlow {
  steps: ConversationStep[];
  fallbackBehavior: FallbackBehavior;
  maxRetries: number;
  sessionTimeout: number; // minutes
}

export interface ConversationStep {
  id: string;
  name: string;
  type: StepType;
  prompt: string;
  validation?: ValidationRule[];
  nextStep?: string;
  conditions?: StepCondition[];
}

export type StepType = 
  | 'greeting'
  | 'service_selection'
  | 'date_selection'
  | 'time_selection'
  | 'customer_info'
  | 'payment'
  | 'confirmation'
  | 'custom';

export interface ValidationRule {
  type: 'required' | 'email' | 'phone' | 'date' | 'time' | 'custom';
  message: string;
  pattern?: string; // for custom validation
}

export interface StepCondition {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
  value: string | number;
  nextStep: string;
}

export type FallbackBehavior = 'restart' | 'human_handoff' | 'end_conversation';

export interface PaymentSettings {
  enabled: boolean;
  methods: PaymentMethod[];
  currency: string;
  requirePayment: boolean;
  depositPercentage?: number;
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: PaymentType;
  enabled: boolean;
  instructions: string;
  metadata?: Record<string, any>;
}

export type PaymentType = 'cash' | 'card' | 'bank_transfer' | 'mobile_money' | 'crypto';

export interface NotificationSettings {
  emailNotifications: EmailNotificationSettings;
  smsNotifications: SmsNotificationSettings;
  webhookNotifications: WebhookNotificationSettings;
}

export interface EmailNotificationSettings {
  enabled: boolean;
  recipientEmails: string[];
  events: NotificationEvent[];
}

export interface SmsNotificationSettings {
  enabled: boolean;
  recipientPhones: string[];
  events: NotificationEvent[];
}

export interface WebhookNotificationSettings {
  enabled: boolean;
  endpoints: WebhookEndpoint[];
  events: NotificationEvent[];
}

export interface WebhookEndpoint {
  id: string;
  url: string;
  secret: string;
  isActive: boolean;
  retryPolicy: RetryPolicy;
}

export interface RetryPolicy {
  maxRetries: number;
  backoffMultiplier: number;
  maxBackoffSeconds: number;
}

export type NotificationEvent = 
  | 'booking_created'
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'payment_received'
  | 'conversation_started'
  | 'conversation_ended'
  | 'error_occurred';

export interface BotCustomization {
  brandColors: BrandColors;
  logo?: string;
  companyInfo: CompanyInfo;
  customCss?: string;
  customFields: CustomField[];
}

export interface BrandColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

export interface CompanyInfo {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  description?: string;
}

export interface CustomField {
  id: string;
  name: string;
  type: CustomFieldType;
  required: boolean;
  options?: string[]; // for select/radio types
  validation?: ValidationRule[];
}

export type CustomFieldType = 'text' | 'email' | 'phone' | 'number' | 'date' | 'select' | 'radio' | 'checkbox';

// ===== BILLING SETTINGS TYPES =====

export interface BillingSettings {
  companyName: string;
  billingEmail: string;
  billingAddress: BillingAddress;
  taxId?: string;
  paymentMethod?: PaymentMethodInfo;
  invoiceSettings: InvoiceSettings;
}

export interface BillingAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface PaymentMethodInfo {
  type: 'card' | 'bank_account';
  last4: string;
  brand?: string; // for cards
  expiryMonth?: number; // for cards
  expiryYear?: number; // for cards
  stripePaymentMethodId: string;
}

export interface InvoiceSettings {
  autoSend: boolean;
  dueNetDays: number;
  footer?: string;
  logo?: string;
  includeUsageDetails: boolean;
}

// ===== WHATSAPP CONFIGURATION TYPES =====

export interface WhatsAppConfig {
  phoneNumberId: string;
  accessToken: string;
  verifyToken: string;
  businessAccountId: string;
  appId: string;
  appSecret: string;
  webhookUrl: string;
  isVerified: boolean;
  lastVerified?: Date;
}

export interface WhatsAppCredentials {
  accessToken: string;
  verifyToken: string;
  phoneNumberId: string;
  businessAccountId: string;
  appId: string;
  appSecret: string;
}

export interface WhatsAppValidationResult {
  isValid: boolean;
  phoneNumber?: string;
  businessName?: string;
  errors?: string[];
}

// ===== TENANT CONTEXT TYPES =====

export interface TenantContext {
  tenantId: string;
  userId?: string;
  userRole?: UserRole;
  permissions: ApiPermission[];
  subscriptionLimits: PlanLimits;
  currentUsage: Record<UsageMetricName, number>;
}

export interface TenantContextRequest {
  tenantId: string;
  source: 'user_session' | 'api_key' | 'webhook';
  sourceId: string;
}

// ===== AUTHENTICATION TYPES =====

export interface LoginCredentials {
  email: string;
  password: string;
  tenantDomain?: string;
}

export interface AuthResult {
  success: boolean;
  user?: UserProfile;
  tokens?: AuthTokens;
  error?: string;
  requiresMfa?: boolean;
  mfaToken?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export interface MfaSetupRequest {
  method: MfaMethod;
  phoneNumber?: string; // for SMS
}

export interface MfaVerificationRequest {
  token: string;
  code: string;
}

export type MfaMethod = 'totp' | 'sms' | 'email';

// ===== ERROR TYPES =====

export interface TenantError {
  code: string;
  message: string;
  details?: Record<string, any>;
  tenantId?: string;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// ===== AUDIT LOG TYPES =====

export interface AuditLog {
  id: string;
  tenantId: string;
  userId?: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

export type AuditAction = 
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'login'
  | 'logout'
  | 'api_call'
  | 'webhook_received'
  | 'payment_processed'
  | 'subscription_changed';

// ===== UTILITY TYPES =====

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface FilterParams {
  status?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

// ===== SERVICE RESPONSE TYPES =====

export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: TenantError;
  metadata?: Record<string, any>;
}

export interface BulkOperationResult<T> {
  successful: T[];
  failed: Array<{
    item: T;
    error: TenantError;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}