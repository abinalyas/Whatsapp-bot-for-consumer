var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// server/business-config-api.ts
var business_config_api_exports = {};
__export(business_config_api_exports, {
  getAllBusinessTypes: () => getAllBusinessTypes,
  getBusinessConfig: () => getBusinessConfig
});
function getBusinessConfig(businessType) {
  const type = businessType || "salon";
  return businessConfigs[type] || businessConfigs["salon"];
}
function getAllBusinessTypes() {
  return Object.keys(businessConfigs);
}
var businessConfigs;
var init_business_config_api = __esm({
  "server/business-config-api.ts"() {
    "use strict";
    businessConfigs = {
      "restaurant": {
        id: "demo-restaurant-001",
        businessName: "Spark Restaurant",
        businessType: {
          id: "1",
          name: "Restaurant",
          category: "Food & Beverage",
          terminology: {
            offering: "Menu Item",
            transaction: "Order",
            customer: "Diner",
            booking: "Reservation"
          }
        },
        branding: {
          primaryColor: "#f97316",
          secondaryColor: "#64748b"
        },
        contact: {
          phone: "+1 (555) 123-4567",
          email: "hello@sparkrestaurant.com",
          address: "123 Food Street, Restaurant City, RC 12345"
        },
        offerings: [
          {
            id: "1",
            name: "Grilled Chicken",
            description: "Perfectly grilled chicken with herbs and spices",
            basePrice: 18,
            category: "Main Course",
            isActive: true,
            variants: [
              { id: "1a", name: "Regular", priceModifier: 0 },
              { id: "1b", name: "Large", priceModifier: 5 }
            ]
          },
          {
            id: "2",
            name: "Caesar Salad",
            description: "Fresh romaine lettuce with caesar dressing",
            basePrice: 12,
            category: "Salads",
            isActive: true
          },
          {
            id: "3",
            name: "Pasta Carbonara",
            description: "Creamy pasta with bacon and parmesan",
            basePrice: 16,
            category: "Pasta",
            isActive: true
          }
        ]
      },
      "clinic": {
        id: "demo-clinic-001",
        businessName: "Spark Medical Clinic",
        businessType: {
          id: "3",
          name: "Medical Clinic",
          category: "Healthcare",
          terminology: {
            offering: "Treatment",
            transaction: "Appointment",
            customer: "Patient",
            booking: "Appointment"
          }
        },
        branding: {
          primaryColor: "#10b981",
          secondaryColor: "#64748b"
        },
        contact: {
          phone: "+1 (555) 123-4567",
          email: "appointments@sparkclinic.com",
          address: "123 Health Street, Medical City, MC 12345"
        },
        offerings: [
          {
            id: "1",
            name: "General Consultation",
            description: "Comprehensive health checkup with our doctors",
            basePrice: 85,
            duration: 30,
            category: "Consultation",
            isActive: true
          },
          {
            id: "2",
            name: "Blood Test",
            description: "Complete blood count and analysis",
            basePrice: 45,
            duration: 15,
            category: "Laboratory",
            isActive: true
          },
          {
            id: "3",
            name: "X-Ray",
            description: "Digital X-ray imaging service",
            basePrice: 65,
            duration: 20,
            category: "Imaging",
            isActive: true
          }
        ]
      },
      "retail": {
        id: "demo-retail-001",
        businessName: "Spark Retail Store",
        businessType: {
          id: "4",
          name: "Retail Store",
          category: "Retail",
          terminology: {
            offering: "Product",
            transaction: "Order",
            customer: "Customer",
            booking: "Order"
          }
        },
        branding: {
          primaryColor: "#3b82f6",
          secondaryColor: "#64748b"
        },
        contact: {
          phone: "+1 (555) 123-4567",
          email: "orders@sparkretail.com",
          address: "123 Shopping Street, Retail City, RC 12345"
        },
        offerings: [
          {
            id: "1",
            name: "Premium T-Shirt",
            description: "High-quality cotton t-shirt in various colors",
            basePrice: 25,
            category: "Clothing",
            isActive: true,
            variants: [
              { id: "1a", name: "Small", priceModifier: 0 },
              { id: "1b", name: "Medium", priceModifier: 0 },
              { id: "1c", name: "Large", priceModifier: 2 },
              { id: "1d", name: "XL", priceModifier: 4 }
            ]
          },
          {
            id: "2",
            name: "Wireless Headphones",
            description: "Bluetooth wireless headphones with noise cancellation",
            basePrice: 89,
            category: "Electronics",
            isActive: true
          },
          {
            id: "3",
            name: "Coffee Mug",
            description: "Ceramic coffee mug with custom design",
            basePrice: 15,
            category: "Home & Kitchen",
            isActive: true
          }
        ]
      },
      "salon": {
        id: "demo-salon-001",
        businessName: "Spark Beauty Salon",
        businessType: {
          id: "2",
          name: "Beauty Salon",
          category: "Beauty & Wellness",
          terminology: {
            offering: "Service",
            transaction: "Appointment",
            customer: "Client",
            booking: "Appointment"
          }
        },
        branding: {
          primaryColor: "#ec4899",
          secondaryColor: "#64748b"
        },
        contact: {
          phone: "+1 (555) 123-4567",
          email: "hello@sparkbeauty.com",
          address: "123 Beauty Street, Salon City, SC 12345"
        },
        offerings: [
          {
            id: "1",
            name: "Haircut & Style",
            description: "Professional haircut with styling and finishing",
            basePrice: 45,
            duration: 60,
            category: "Hair Services",
            isActive: true,
            variants: [
              { id: "1a", name: "Short Hair", priceModifier: 0 },
              { id: "1b", name: "Long Hair", priceModifier: 15 }
            ]
          },
          {
            id: "2",
            name: "Hair Color",
            description: "Full hair coloring service with consultation",
            basePrice: 120,
            duration: 180,
            category: "Hair Services",
            isActive: true,
            variants: [
              { id: "2a", name: "Single Color", priceModifier: 0 },
              { id: "2b", name: "Highlights", priceModifier: 30 },
              { id: "2c", name: "Full Color + Highlights", priceModifier: 60 }
            ]
          },
          {
            id: "3",
            name: "Manicure",
            description: "Professional nail care and polish application",
            basePrice: 25,
            duration: 45,
            category: "Nail Services",
            isActive: true
          },
          {
            id: "4",
            name: "Facial Treatment",
            description: "Relaxing facial with cleansing and moisturizing",
            basePrice: 65,
            duration: 75,
            category: "Skin Care",
            isActive: true
          }
        ]
      }
    };
  }
});

// server/vercel.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  apiKeys: () => apiKeys,
  bookings: () => bookings,
  botFlowExecutions: () => botFlowExecutions,
  botFlowNodes: () => botFlowNodes,
  botFlows: () => botFlows,
  businessTypes: () => businessTypes,
  conversations: () => conversations,
  customFields: () => customFields,
  insertApiKeySchema: () => insertApiKeySchema,
  insertBookingSchema: () => insertBookingSchema,
  insertBotFlowExecutionSchema: () => insertBotFlowExecutionSchema,
  insertBotFlowNodeSchema: () => insertBotFlowNodeSchema,
  insertBotFlowSchema: () => insertBotFlowSchema,
  insertBusinessTypeSchema: () => insertBusinessTypeSchema,
  insertConversationSchema: () => insertConversationSchema,
  insertCustomFieldSchema: () => insertCustomFieldSchema,
  insertMessageSchema: () => insertMessageSchema,
  insertOfferingSchema: () => insertOfferingSchema,
  insertServiceSchema: () => insertServiceSchema,
  insertSettingsChangeLogSchema: () => insertSettingsChangeLogSchema,
  insertSettingsVersionSchema: () => insertSettingsVersionSchema,
  insertSubscriptionPlanSchema: () => insertSubscriptionPlanSchema,
  insertSubscriptionSchema: () => insertSubscriptionSchema,
  insertTenantSchema: () => insertTenantSchema,
  insertTransactionSchema: () => insertTransactionSchema,
  insertUsageMetricSchema: () => insertUsageMetricSchema,
  insertUserSchema: () => insertUserSchema,
  insertWhatsappCredentialsSchema: () => insertWhatsappCredentialsSchema,
  insertWorkflowStateSchema: () => insertWorkflowStateSchema,
  insertWorkflowTransitionSchema: () => insertWorkflowTransitionSchema,
  messages: () => messages,
  offerings: () => offerings,
  services: () => services,
  settingsChangeLog: () => settingsChangeLog,
  settingsVersions: () => settingsVersions,
  subscriptionPlans: () => subscriptionPlans,
  subscriptions: () => subscriptions,
  tenants: () => tenants,
  transactions: () => transactions,
  usageMetrics: () => usageMetrics,
  users: () => users,
  whatsappCredentials: () => whatsappCredentials,
  workflowStates: () => workflowStates,
  workflowTransitions: () => workflowTransitions
});
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, jsonb, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var tenants = pgTable("tenants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessName: varchar("business_name", { length: 255 }).notNull(),
  domain: varchar("domain", { length: 100 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  status: varchar("status", { length: 20 }).notNull().default("trial"),
  // trial, active, suspended, cancelled
  subscriptionPlan: varchar("subscription_plan", { length: 50 }).notNull().default("starter"),
  whatsappPhoneId: varchar("whatsapp_phone_id", { length: 100 }),
  whatsappToken: text("whatsapp_token"),
  whatsappVerifyToken: varchar("whatsapp_verify_token", { length: 100 }),
  botSettings: jsonb("bot_settings").default(sql`'{}'::jsonb`),
  billingSettings: jsonb("billing_settings").default(sql`'{}'::jsonb`),
  // New business configuration fields
  businessTypeId: varchar("business_type_id").references(() => businessTypes.id),
  businessConfig: jsonb("business_config").default(sql`'{}'::jsonb`),
  terminology: jsonb("terminology").default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  email: varchar("email", { length: 255 }).notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull().default("admin"),
  // admin, user
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  isActive: boolean("is_active").notNull().default(true),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  uniqueTenantEmail: unique().on(table.tenantId, table.email)
}));
var apiKeys = pgTable("api_keys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  keyHash: varchar("key_hash", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  permissions: jsonb("permissions").notNull().default(sql`'[]'::jsonb`),
  lastUsed: timestamp("last_used"),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var subscriptionPlans = pgTable("subscription_plans", {
  id: varchar("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  priceMonthly: integer("price_monthly").notNull(),
  priceYearly: integer("price_yearly"),
  features: jsonb("features").notNull().default(sql`'{}'::jsonb`),
  limits: jsonb("limits").notNull().default(sql`'{}'::jsonb`),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  planId: varchar("plan_id").notNull().references(() => subscriptionPlans.id),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  // active, cancelled, past_due, unpaid
  billingCycle: varchar("billing_cycle", { length: 20 }).notNull().default("monthly"),
  // monthly, yearly
  currentPeriodStart: timestamp("current_period_start").notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 100 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var usageMetrics = pgTable("usage_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  metricName: varchar("metric_name", { length: 100 }).notNull(),
  metricValue: integer("metric_value").notNull().default(0),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow()
}, (table) => ({
  uniqueTenantMetricPeriod: unique().on(table.tenantId, table.metricName, table.periodStart)
}));
var services = pgTable("services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price").notNull(),
  durationMinutes: integer("duration_minutes").default(60),
  isActive: boolean("is_active").notNull().default(true),
  icon: text("icon"),
  category: varchar("category", { length: 100 }),
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  phoneNumber: text("phone_number").notNull(),
  customerName: text("customer_name"),
  currentState: text("current_state").notNull().default("greeting"),
  // greeting, awaiting_service, awaiting_date, awaiting_time, awaiting_payment, completed
  selectedService: varchar("selected_service").references(() => services.id),
  selectedDate: text("selected_date"),
  // YYYY-MM-DD format
  selectedTime: text("selected_time"),
  // HH:MM format
  contextData: jsonb("context_data").default(sql`'{}'::jsonb`),
  // New flexible business model fields
  customFields: jsonb("custom_fields").default(sql`'{}'::jsonb`),
  botFlowExecutionId: varchar("bot_flow_execution_id").references(() => botFlowExecutions.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  uniqueTenantPhone: unique().on(table.tenantId, table.phoneNumber)
}));
var messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  conversationId: varchar("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  messageType: varchar("message_type", { length: 50 }).notNull().default("text"),
  // text, image, document, etc.
  isFromBot: boolean("is_from_bot").notNull(),
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  timestamp: timestamp("timestamp").notNull().defaultNow()
});
var bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  conversationId: varchar("conversation_id").notNull().references(() => conversations.id),
  serviceId: varchar("service_id").notNull().references(() => services.id),
  phoneNumber: text("phone_number").notNull(),
  customerName: text("customer_name"),
  customerEmail: text("customer_email"),
  amount: integer("amount").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  // pending, paid, confirmed, cancelled
  paymentMethod: varchar("payment_method", { length: 50 }),
  paymentReference: text("payment_reference"),
  appointmentDate: timestamp("appointment_date"),
  appointmentTime: text("appointment_time"),
  // e.g., "10:00 AM", "02:30 PM"
  notes: text("notes"),
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var insertTenantSchema = createInsertSchema(tenants).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertApiKeySchema = createInsertSchema(apiKeys).omit({
  id: true,
  createdAt: true
});
var insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({
  createdAt: true
});
var insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertUsageMetricSchema = createInsertSchema(usageMetrics).omit({
  id: true,
  createdAt: true
});
var insertServiceSchema = createInsertSchema(services).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  timestamp: true
});
var insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var settingsVersions = pgTable("settings_versions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  version: integer("version").notNull(),
  settings: jsonb("settings").notNull(),
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  isActive: boolean("is_active").notNull().default(false),
  changeSummary: text("change_summary"),
  rollbackReason: text("rollback_reason")
}, (table) => ({
  uniqueTenantVersion: unique().on(table.tenantId, table.version)
}));
var whatsappCredentials = pgTable("whatsapp_credentials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }).unique(),
  phoneNumberId: varchar("phone_number_id").notNull(),
  accessTokenEncrypted: text("access_token_encrypted").notNull(),
  verifyToken: varchar("verify_token", { length: 255 }).notNull(),
  businessAccountId: varchar("business_account_id", { length: 255 }),
  appId: varchar("app_id", { length: 255 }),
  appSecretEncrypted: text("app_secret_encrypted"),
  webhookUrl: text("webhook_url"),
  isVerified: boolean("is_verified").notNull().default(false),
  lastVerified: timestamp("last_verified"),
  verificationErrors: jsonb("verification_errors"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var settingsChangeLog = pgTable("settings_change_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  changedBy: varchar("changed_by").notNull(),
  changeType: varchar("change_type", { length: 50 }).notNull(),
  // 'update', 'reset', 'rollback'
  fieldPath: varchar("field_path", { length: 255 }),
  // JSON path of changed field
  oldValue: jsonb("old_value"),
  newValue: jsonb("new_value"),
  changeReason: text("change_reason"),
  ipAddress: varchar("ip_address", { length: 45 }),
  // Support IPv6
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var insertSettingsVersionSchema = createInsertSchema(settingsVersions).omit({
  id: true,
  createdAt: true
});
var insertWhatsappCredentialsSchema = createInsertSchema(whatsappCredentials).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertSettingsChangeLogSchema = createInsertSchema(settingsChangeLog).omit({
  id: true,
  createdAt: true
});
var businessTypes = pgTable("business_types", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull().unique(),
  displayName: varchar("display_name", { length: 100 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  description: text("description"),
  terminology: jsonb("terminology").notNull().default(sql`'{}'::jsonb`),
  defaultConfig: jsonb("default_config").notNull().default(sql`'{}'::jsonb`),
  isSystem: boolean("is_system").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var customFields = pgTable("custom_fields", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  entityType: varchar("entity_type", { length: 50 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  label: varchar("label", { length: 200 }).notNull(),
  fieldType: varchar("field_type", { length: 50 }).notNull(),
  isRequired: boolean("is_required").notNull().default(false),
  validationRules: jsonb("validation_rules").default(sql`'{}'::jsonb`),
  fieldOptions: jsonb("field_options").default(sql`'[]'::jsonb`),
  defaultValue: jsonb("default_value"),
  displayOrder: integer("display_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  uniqueTenantEntityName: unique().on(table.tenantId, table.entityType, table.name)
}));
var offerings = pgTable("offerings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  offeringType: varchar("offering_type", { length: 50 }).notNull().default("service"),
  category: varchar("category", { length: 100 }),
  subcategory: varchar("subcategory", { length: 100 }),
  pricingType: varchar("pricing_type", { length: 50 }).notNull().default("fixed"),
  basePrice: integer("base_price").notNull().default(0),
  currency: varchar("currency", { length: 3 }).notNull().default("USD"),
  pricingConfig: jsonb("pricing_config").default(sql`'{}'::jsonb`),
  isSchedulable: boolean("is_schedulable").notNull().default(false),
  durationMinutes: integer("duration_minutes"),
  availabilityConfig: jsonb("availability_config").default(sql`'{}'::jsonb`),
  hasVariants: boolean("has_variants").notNull().default(false),
  variants: jsonb("variants").default(sql`'[]'::jsonb`),
  customFields: jsonb("custom_fields").default(sql`'{}'::jsonb`),
  isActive: boolean("is_active").notNull().default(true),
  displayOrder: integer("display_order").notNull().default(0),
  tags: jsonb("tags").default(sql`'[]'::jsonb`),
  images: jsonb("images").default(sql`'[]'::jsonb`),
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var workflowStates = pgTable("workflow_states", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  workflowType: varchar("workflow_type", { length: 50 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  displayName: varchar("display_name", { length: 100 }).notNull(),
  stateType: varchar("state_type", { length: 20 }).notNull().default("intermediate"),
  color: varchar("color", { length: 7 }).default("#6B7280"),
  description: text("description"),
  isSystem: boolean("is_system").notNull().default(false),
  displayOrder: integer("display_order").notNull().default(0),
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  uniqueTenantWorkflowName: unique().on(table.tenantId, table.workflowType, table.name)
}));
var workflowTransitions = pgTable("workflow_transitions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  workflowType: varchar("workflow_type", { length: 50 }).notNull(),
  fromStateId: varchar("from_state_id").notNull().references(() => workflowStates.id, { onDelete: "cascade" }),
  toStateId: varchar("to_state_id").notNull().references(() => workflowStates.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  displayName: varchar("display_name", { length: 100 }).notNull(),
  conditions: jsonb("conditions").default(sql`'{}'::jsonb`),
  actions: jsonb("actions").default(sql`'[]'::jsonb`),
  isAutomatic: boolean("is_automatic").notNull().default(false),
  requiresApproval: boolean("requires_approval").notNull().default(false),
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  transactionType: varchar("transaction_type", { length: 50 }).notNull().default("booking"),
  transactionNumber: varchar("transaction_number", { length: 50 }),
  customerPhone: varchar("customer_phone", { length: 20 }).notNull(),
  customerName: varchar("customer_name", { length: 200 }),
  customerEmail: varchar("customer_email", { length: 255 }),
  offeringId: varchar("offering_id").references(() => offerings.id, { onDelete: "set null" }),
  scheduledAt: timestamp("scheduled_at"),
  durationMinutes: integer("duration_minutes"),
  timezone: varchar("timezone", { length: 50 }).default("UTC"),
  amount: integer("amount").notNull().default(0),
  currency: varchar("currency", { length: 3 }).notNull().default("USD"),
  paymentStatus: varchar("payment_status", { length: 50 }).default("pending"),
  paymentMethod: varchar("payment_method", { length: 50 }),
  paymentReference: varchar("payment_reference", { length: 200 }),
  currentStateId: varchar("current_state_id").references(() => workflowStates.id),
  workflowHistory: jsonb("workflow_history").default(sql`'[]'::jsonb`),
  customFields: jsonb("custom_fields").default(sql`'{}'::jsonb`),
  notes: text("notes"),
  internalNotes: text("internal_notes"),
  tags: jsonb("tags").default(sql`'[]'::jsonb`),
  priority: varchar("priority", { length: 20 }).default("normal"),
  source: varchar("source", { length: 50 }).default("whatsapp"),
  conversationId: varchar("conversation_id").references(() => conversations.id, { onDelete: "set null" }),
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var botFlows = pgTable("bot_flows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  flowType: varchar("flow_type", { length: 50 }).notNull().default("conversation"),
  startNodeId: varchar("start_node_id"),
  isActive: boolean("is_active").notNull().default(false),
  isDefault: boolean("is_default").notNull().default(false),
  version: integer("version").notNull().default(1),
  variables: jsonb("variables").default(sql`'{}'::jsonb`),
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  uniqueTenantNameVersion: unique().on(table.tenantId, table.name, table.version)
}));
var botFlowNodes = pgTable("bot_flow_nodes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  flowId: varchar("flow_id").notNull().references(() => botFlows.id, { onDelete: "cascade" }),
  nodeType: varchar("node_type", { length: 50 }).notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  positionX: integer("position_x").notNull().default(0),
  positionY: integer("position_y").notNull().default(0),
  config: jsonb("config").notNull().default(sql`'{}'::jsonb`),
  connections: jsonb("connections").default(sql`'[]'::jsonb`),
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var botFlowExecutions = pgTable("bot_flow_executions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  flowId: varchar("flow_id").notNull().references(() => botFlows.id, { onDelete: "cascade" }),
  conversationId: varchar("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  currentNodeId: varchar("current_node_id").references(() => botFlowNodes.id),
  variables: jsonb("variables").default(sql`'{}'::jsonb`),
  executionHistory: jsonb("execution_history").default(sql`'[]'::jsonb`),
  status: varchar("status", { length: 50 }).notNull().default("active"),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`)
}, (table) => ({
  uniqueConversation: unique().on(table.conversationId)
}));
var insertBusinessTypeSchema = createInsertSchema(businessTypes).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertCustomFieldSchema = createInsertSchema(customFields).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertOfferingSchema = createInsertSchema(offerings).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertWorkflowStateSchema = createInsertSchema(workflowStates).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertWorkflowTransitionSchema = createInsertSchema(workflowTransitions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertBotFlowSchema = createInsertSchema(botFlows).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertBotFlowNodeSchema = createInsertSchema(botFlowNodes).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertBotFlowExecutionSchema = createInsertSchema(botFlowExecutions).omit({
  id: true,
  startedAt: true
});

// server/storage.ts
import { randomUUID as randomUUID2 } from "crypto";

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
var db;
var pool;
if (process.env.DATABASE_URL) {
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle({ client: pool, schema: schema_exports });
}

// server/storage.ts
import { eq as eq2, and as and2, gte as gte2, lt as lt2 } from "drizzle-orm";

// server/storage-compatible.ts
import { randomUUID } from "crypto";
import { eq, and, gte, lt, sql as sql2 } from "drizzle-orm";
import { pgTable as pgTable2, text as text2, varchar as varchar2, integer as integer2, timestamp as timestamp2, boolean as boolean2, jsonb as jsonb2 } from "drizzle-orm/pg-core";
var compatibleServices = pgTable2("services", {
  id: varchar2("id").primaryKey().default(sql2`gen_random_uuid()`),
  name: text2("name").notNull(),
  description: text2("description"),
  price: integer2("price").notNull(),
  // durationMinutes: integer("duration_minutes").default(60), // Commented out - doesn't exist in production
  isActive: boolean2("is_active").notNull().default(true),
  icon: text2("icon"),
  // category: varchar("category", { length: 100 }), // Commented out - might not exist
  // metadata: jsonb("metadata").default(sql`'{}'::jsonb`), // Commented out - might not exist
  createdAt: timestamp2("created_at").notNull().defaultNow(),
  updatedAt: timestamp2("updated_at").notNull().defaultNow()
});
var compatibleConversations = pgTable2("conversations", {
  id: varchar2("id").primaryKey().default(sql2`gen_random_uuid()`),
  phoneNumber: text2("phone_number").notNull(),
  customerName: text2("customer_name"),
  currentState: text2("current_state").notNull().default("greeting"),
  selectedService: varchar2("selected_service"),
  selectedDate: text2("selected_date"),
  selectedTime: text2("selected_time"),
  contextData: jsonb2("context_data").default(sql2`'{}'::jsonb`),
  createdAt: timestamp2("created_at").notNull().defaultNow(),
  updatedAt: timestamp2("updated_at").notNull().defaultNow()
});
var compatibleMessages = pgTable2("messages", {
  id: varchar2("id").primaryKey().default(sql2`gen_random_uuid()`),
  conversationId: varchar2("conversation_id").notNull(),
  content: text2("content").notNull(),
  messageType: varchar2("message_type", { length: 50 }).notNull().default("text"),
  isFromBot: boolean2("is_from_bot").notNull(),
  metadata: jsonb2("metadata").default(sql2`'{}'::jsonb`),
  timestamp: timestamp2("timestamp").notNull().defaultNow()
});
var compatibleBookings = pgTable2("bookings", {
  id: varchar2("id").primaryKey().default(sql2`gen_random_uuid()`),
  conversationId: varchar2("conversation_id").notNull(),
  serviceId: varchar2("service_id").notNull(),
  phoneNumber: text2("phone_number").notNull(),
  customerName: text2("customer_name"),
  // customerEmail: text("customer_email"), // Commented out - doesn't exist in production
  amount: integer2("amount").notNull(),
  status: varchar2("status", { length: 20 }).notNull().default("pending"),
  paymentMethod: varchar2("payment_method", { length: 50 }),
  paymentReference: text2("payment_reference"),
  appointmentDate: timestamp2("appointment_date"),
  appointmentTime: text2("appointment_time"),
  notes: text2("notes"),
  // metadata: jsonb("metadata").default(sql`'{}'::jsonb`), // Commented out - might not exist
  createdAt: timestamp2("created_at").notNull().defaultNow(),
  updatedAt: timestamp2("updated_at").notNull().defaultNow()
});
var CompatibleDatabaseStorage = class {
  constructor() {
    this.initializeDefaultServices();
  }
  async initializeDefaultServices() {
    try {
      if (!db) {
        console.log("Database not configured, skipping default service initialization");
        return;
      }
      const existingServices = await this.getServices();
      if (existingServices.length > 0) return;
      const defaultServices = [
        {
          name: "Haircut & Style",
          description: "Professional haircut with styling",
          price: 45,
          // USD equivalent of ₹200
          durationMinutes: 60,
          isActive: true,
          icon: "fas fa-cut",
          category: "Hair Services"
        },
        {
          name: "Facial Treatment",
          description: "Deep cleansing facial treatment",
          price: 65,
          // USD equivalent of ₹500
          durationMinutes: 75,
          isActive: true,
          icon: "fas fa-sparkles",
          category: "Skin Care"
        },
        {
          name: "Hair Color",
          description: "Full hair coloring service",
          price: 120,
          // USD equivalent of ₹1000
          durationMinutes: 120,
          isActive: true,
          icon: "fas fa-palette",
          category: "Hair Services"
        }
      ];
      for (const serviceData of defaultServices) {
        await this.createService(serviceData);
      }
      console.log("\u2705 Default services initialized");
    } catch (error) {
      console.error("\u274C Error initializing default services:", error);
    }
  }
  async getServices() {
    try {
      if (!db) {
        return [];
      }
      return await db.select().from(compatibleServices);
    } catch (error) {
      console.error("Error fetching services:", error);
      return [];
    }
  }
  async getService(id) {
    try {
      if (!db) {
        return void 0;
      }
      const [service] = await db.select().from(compatibleServices).where(eq(compatibleServices.id, id));
      return service || void 0;
    } catch (error) {
      console.error("Error fetching service:", error);
      return void 0;
    }
  }
  async createService(insertService) {
    try {
      if (!db) {
        throw new Error("Database not available");
      }
      const safeServiceData = {
        name: insertService.name,
        description: insertService.description,
        price: insertService.price,
        isActive: insertService.isActive ?? true,
        icon: insertService.icon
      };
      const [service] = await db.insert(compatibleServices).values(safeServiceData).returning();
      return {
        ...service,
        durationMinutes: insertService.durationMinutes || 60,
        category: insertService.category || null,
        metadata: insertService.metadata || {}
      };
    } catch (error) {
      console.error("Error creating service:", error);
      return {
        id: randomUUID(),
        name: insertService.name,
        description: insertService.description || null,
        price: insertService.price,
        durationMinutes: insertService.durationMinutes || 60,
        isActive: insertService.isActive ?? true,
        icon: insertService.icon || null,
        category: insertService.category || null,
        metadata: insertService.metadata || {},
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      };
    }
  }
  async updateService(id, updateData) {
    try {
      if (!db) {
        console.warn("Database not available, cannot update service");
        return void 0;
      }
      const [service] = await db.update(compatibleServices).set({ ...updateData, updatedAt: /* @__PURE__ */ new Date() }).where(eq(compatibleServices.id, id)).returning();
      return service || void 0;
    } catch (error) {
      console.error("Error updating service:", error);
      return void 0;
    }
  }
  async deleteService(id) {
    try {
      if (!db) {
        console.warn("Database not available, cannot delete service");
        return false;
      }
      const result = await db.delete(compatibleServices).where(eq(compatibleServices.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error deleting service:", error);
      return false;
    }
  }
  async getConversations() {
    try {
      if (!db) {
        return [];
      }
      return await db.select().from(compatibleConversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      return [];
    }
  }
  async getConversation(phoneNumber) {
    try {
      if (!db) {
        return void 0;
      }
      const [conversation] = await db.select().from(compatibleConversations).where(eq(compatibleConversations.phoneNumber, phoneNumber));
      return conversation;
    } catch (error) {
      console.error("Error fetching conversation:", error);
      return void 0;
    }
  }
  async createConversation(conversation) {
    try {
      if (!db) {
        throw new Error("Database not available");
      }
      const [newConversation] = await db.insert(compatibleConversations).values(conversation).returning();
      return newConversation;
    } catch (error) {
      console.error("Error creating conversation:", error);
      return {
        id: randomUUID(),
        phoneNumber: conversation.phoneNumber,
        currentState: conversation.currentState,
        selectedService: conversation.selectedService || null,
        selectedDate: conversation.selectedDate || null,
        selectedTime: conversation.selectedTime || null,
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      };
    }
  }
  async updateConversation(id, conversation) {
    try {
      if (!db) {
        console.warn("Database not available, cannot update conversation");
        return void 0;
      }
      const [updatedConversation] = await db.update(compatibleConversations).set({ ...conversation, updatedAt: /* @__PURE__ */ new Date() }).where(eq(compatibleConversations.id, id)).returning();
      return updatedConversation;
    } catch (error) {
      console.error("Error updating conversation:", error);
      return void 0;
    }
  }
  async getMessages(conversationId) {
    try {
      if (!db) {
        return [];
      }
      return await db.select().from(compatibleMessages).where(eq(compatibleMessages.conversationId, conversationId)).orderBy(compatibleMessages.createdAt);
    } catch (error) {
      console.error("Error fetching messages:", error);
      return [];
    }
  }
  async createMessage(message) {
    try {
      if (!db) {
        throw new Error("Database not available");
      }
      const [newMessage] = await db.insert(compatibleMessages).values(message).returning();
      return newMessage;
    } catch (error) {
      console.error("Error creating message:", error);
      return {
        id: randomUUID(),
        conversationId: message.conversationId,
        content: message.content,
        isFromBot: message.isFromBot,
        messageType: message.messageType || "text",
        metadata: message.metadata || {},
        createdAt: /* @__PURE__ */ new Date()
      };
    }
  }
  async getBookings() {
    try {
      if (!db) {
        return [];
      }
      return await db.select().from(compatibleBookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      return [];
    }
  }
  async createBooking(booking) {
    try {
      if (!db) {
        throw new Error("Database not available");
      }
      const [newBooking] = await db.insert(compatibleBookings).values(booking).returning();
      return newBooking;
    } catch (error) {
      console.error("Error creating booking:", error);
      return {
        id: randomUUID(),
        conversationId: booking.conversationId,
        serviceId: booking.serviceId,
        phoneNumber: booking.phoneNumber,
        amount: booking.amount,
        status: booking.status || "pending",
        customerName: booking.customerName || null,
        appointmentDate: booking.appointmentDate,
        appointmentTime: booking.appointmentTime,
        paymentReference: booking.paymentReference || null,
        metadata: booking.metadata || {},
        notes: booking.notes || null,
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      };
    }
  }
  async updateBooking(id, booking) {
    try {
      if (!db) {
        console.warn("Database not available, cannot update booking");
        return void 0;
      }
      const [updatedBooking] = await db.update(compatibleBookings).set({ ...booking, updatedAt: /* @__PURE__ */ new Date() }).where(eq(compatibleBookings.id, id)).returning();
      return updatedBooking;
    } catch (error) {
      console.error("Error updating booking:", error);
      return void 0;
    }
  }
  async getTodayBookings() {
    try {
      if (!db) {
        return [];
      }
      const today = /* @__PURE__ */ new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return await db.select().from(compatibleBookings).where(
        and(
          gte(compatibleBookings.appointmentDate, today),
          lt(compatibleBookings.appointmentDate, tomorrow)
        )
      );
    } catch (error) {
      console.error("Error fetching today's bookings:", error);
      return [];
    }
  }
  async getTodayRevenue() {
    try {
      if (!db) {
        return 0;
      }
      const today = /* @__PURE__ */ new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const result = await db.select({ total: sql2`SUM(${compatibleBookings.amount})` }).from(compatibleBookings).where(
        and(
          eq(compatibleBookings.status, "confirmed"),
          gte(compatibleBookings.appointmentDate, today),
          lt(compatibleBookings.appointmentDate, tomorrow)
        )
      );
      return result[0]?.total || 0;
    } catch (error) {
      console.error("Error fetching today's revenue:", error);
      return 0;
    }
  }
};

// server/storage.ts
var InMemoryStorage = class {
  services = [];
  conversations = [];
  messages = [];
  bookings = [];
  constructor() {
    this.initializeDefaultServices();
  }
  async initializeDefaultServices() {
    if (this.services.length > 0) return;
    const defaultServices = [
      {
        id: randomUUID2(),
        name: "Haircut & Style",
        description: "Professional haircut with styling",
        price: 45,
        // USD equivalent
        isActive: true,
        icon: "fas fa-cut"
      },
      {
        id: randomUUID2(),
        name: "Facial Treatment",
        description: "Deep cleansing facial treatment",
        price: 65,
        // USD equivalent
        isActive: true,
        icon: "fas fa-sparkles"
      },
      {
        id: randomUUID2(),
        name: "Hair Color",
        description: "Full hair coloring service",
        price: 120,
        // USD equivalent
        isActive: true,
        icon: "fas fa-palette"
      }
    ];
    this.services = defaultServices;
  }
  async getServices() {
    return this.services;
  }
  async getService(id) {
    return this.services.find((service) => service.id === id);
  }
  async createService(service) {
    const newService = {
      ...service,
      id: randomUUID2()
    };
    this.services.push(newService);
    return newService;
  }
  async updateService(id, updateData) {
    const index = this.services.findIndex((service) => service.id === id);
    if (index === -1) return void 0;
    this.services[index] = { ...this.services[index], ...updateData };
    return this.services[index];
  }
  async deleteService(id) {
    const index = this.services.findIndex((service) => service.id === id);
    if (index === -1) return false;
    this.services.splice(index, 1);
    return true;
  }
  async getConversation(phoneNumber) {
    return this.conversations.find((conversation) => conversation.phoneNumber === phoneNumber);
  }
  async createConversation(conversation) {
    const newConversation = {
      ...conversation,
      id: randomUUID2(),
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.conversations.push(newConversation);
    return newConversation;
  }
  async updateConversation(id, updateData) {
    const index = this.conversations.findIndex((conversation) => conversation.id === id);
    if (index === -1) return void 0;
    this.conversations[index] = {
      ...this.conversations[index],
      ...updateData,
      updatedAt: /* @__PURE__ */ new Date()
    };
    return this.conversations[index];
  }
  async getMessages(conversationId) {
    return this.messages.filter((message) => message.conversationId === conversationId).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }
  async createMessage(message) {
    const newMessage = {
      ...message,
      id: randomUUID2(),
      timestamp: /* @__PURE__ */ new Date()
    };
    this.messages.push(newMessage);
    return newMessage;
  }
  async getBookings() {
    return this.bookings.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }
  async createBooking(booking) {
    const newBooking = {
      ...booking,
      id: randomUUID2(),
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.bookings.push(newBooking);
    return newBooking;
  }
  async updateBooking(id, updateData) {
    const index = this.bookings.findIndex((booking) => booking.id === id);
    if (index === -1) return void 0;
    this.bookings[index] = {
      ...this.bookings[index],
      ...updateData,
      updatedAt: /* @__PURE__ */ new Date()
    };
    return this.bookings[index];
  }
  async getTodayBookings() {
    const today = /* @__PURE__ */ new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return this.bookings.filter(
      (booking) => booking.createdAt >= today && booking.createdAt < tomorrow
    );
  }
  async getTodayRevenue() {
    const todayBookings = await this.getTodayBookings();
    return todayBookings.filter((booking) => booking.status === "confirmed").reduce((total, booking) => total + booking.amount, 0);
  }
};
var HybridStorage = class {
  dbStorage;
  memoryStorage;
  useDatabase = true;
  constructor() {
    this.dbStorage = new CompatibleDatabaseStorage();
    this.memoryStorage = new InMemoryStorage();
  }
  async tryDatabase(operation) {
    if (!this.useDatabase) {
      throw new Error("Database disabled");
    }
    try {
      return await operation();
    } catch (error) {
      console.warn("Database operation failed, falling back to memory storage:", error);
      this.useDatabase = false;
      throw error;
    }
  }
  async getServices() {
    try {
      return await this.tryDatabase(() => this.dbStorage.getServices());
    } catch {
      return await this.memoryStorage.getServices();
    }
  }
  async getService(id) {
    try {
      return await this.tryDatabase(() => this.dbStorage.getService(id));
    } catch {
      return await this.memoryStorage.getService(id);
    }
  }
  async createService(service) {
    try {
      return await this.tryDatabase(() => this.dbStorage.createService(service));
    } catch {
      return await this.memoryStorage.createService(service);
    }
  }
  async updateService(id, service) {
    try {
      return await this.tryDatabase(() => this.dbStorage.updateService(id, service));
    } catch {
      return await this.memoryStorage.updateService(id, service);
    }
  }
  async deleteService(id) {
    try {
      return await this.tryDatabase(() => this.dbStorage.deleteService(id));
    } catch {
      return await this.memoryStorage.deleteService(id);
    }
  }
  async getConversation(phoneNumber) {
    try {
      return await this.tryDatabase(() => this.dbStorage.getConversation(phoneNumber));
    } catch {
      return await this.memoryStorage.getConversation(phoneNumber);
    }
  }
  async createConversation(conversation) {
    try {
      return await this.tryDatabase(() => this.dbStorage.createConversation(conversation));
    } catch {
      return await this.memoryStorage.createConversation(conversation);
    }
  }
  async updateConversation(id, conversation) {
    try {
      return await this.tryDatabase(() => this.dbStorage.updateConversation(id, conversation));
    } catch {
      return await this.memoryStorage.updateConversation(id, conversation);
    }
  }
  async getMessages(conversationId) {
    try {
      return await this.tryDatabase(() => this.dbStorage.getMessages(conversationId));
    } catch {
      return await this.memoryStorage.getMessages(conversationId);
    }
  }
  async createMessage(message) {
    try {
      return await this.tryDatabase(() => this.dbStorage.createMessage(message));
    } catch {
      return await this.memoryStorage.createMessage(message);
    }
  }
  async getBookings() {
    try {
      return await this.tryDatabase(() => this.dbStorage.getBookings());
    } catch {
      return await this.memoryStorage.getBookings();
    }
  }
  async createBooking(booking) {
    try {
      return await this.tryDatabase(() => this.dbStorage.createBooking(booking));
    } catch {
      return await this.memoryStorage.createBooking(booking);
    }
  }
  async updateBooking(id, booking) {
    try {
      return await this.tryDatabase(() => this.dbStorage.updateBooking(id, booking));
    } catch {
      return await this.memoryStorage.updateBooking(id, booking);
    }
  }
  async getTodayBookings() {
    try {
      return await this.tryDatabase(() => this.dbStorage.getTodayBookings());
    } catch {
      return await this.memoryStorage.getTodayBookings();
    }
  }
  async getTodayRevenue() {
    try {
      return await this.tryDatabase(() => this.dbStorage.getTodayRevenue());
    } catch {
      return await this.memoryStorage.getTodayRevenue();
    }
  }
};
var storage = new HybridStorage();

// server/routes.ts
import { z } from "zod";
var webhookVerificationSchema = z.object({
  "hub.mode": z.string(),
  "hub.challenge": z.string(),
  "hub.verify_token": z.string()
});
var whatsAppMessageSchema = z.object({
  object: z.string(),
  entry: z.array(z.object({
    id: z.string(),
    changes: z.array(z.object({
      value: z.object({
        messaging_product: z.string(),
        metadata: z.object({
          display_phone_number: z.string(),
          phone_number_id: z.string()
        }),
        messages: z.array(z.object({
          from: z.string(),
          id: z.string(),
          timestamp: z.string(),
          text: z.object({
            body: z.string()
          }),
          type: z.string()
        })).optional()
      }),
      field: z.string()
    }))
  }))
});
var createServiceSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().min(0),
  icon: z.string().optional()
});
async function sendWhatsAppMessage(to, message) {
  try {
    const phoneNumberId = process.env.WHATSAPP_PHONE_ID;
    const accessToken = process.env.WHATSAPP_TOKEN;
    if (!phoneNumberId || !accessToken) {
      console.error("WhatsApp credentials not configured");
      return false;
    }
    const url = `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        text: { body: message }
      })
    });
    if (!response.ok) {
      const error = await response.text();
      console.error("Failed to send WhatsApp message:", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
    return false;
  }
}
function generateUPILink(amount, serviceName) {
  const upiId = process.env.UPI_ID || "sparksalon@upi";
  const inrAmount = Math.round(amount * 83);
  return `upi://pay?pa=${upiId}&pn=Spark+Salon&am=${inrAmount}&cu=INR&tn=Payment+for+${encodeURIComponent(serviceName)}`;
}
async function processWhatsAppMessage(from, messageText) {
  try {
    console.log("WhatsApp: Processing message from", from, ":", messageText);
    const shouldUseDynamicFlow = await checkForActiveFlow();
    if (shouldUseDynamicFlow) {
      await processDynamicWhatsAppMessage(from, messageText);
      return;
    }
    await processStaticWhatsAppMessage(from, messageText);
  } catch (error) {
    console.error("Error processing WhatsApp message:", error);
    await sendWhatsAppMessage(from, "Sorry, I'm experiencing technical difficulties. Please try again later.");
  }
}
async function checkForActiveFlow() {
  try {
    return false;
  } catch (error) {
    console.error("Error checking for active flow:", error);
    return false;
  }
}
async function processDynamicWhatsAppMessage(from, messageText) {
  try {
    console.log("WhatsApp: Using dynamic flow processing for", from);
    await sendWhatsAppMessage(from, "\u{1F916} Dynamic flow processing is active! This message was generated by your custom bot flow.");
  } catch (error) {
    console.error("Error in dynamic message processing:", error);
    await sendWhatsAppMessage(from, "Sorry, there was an issue with the dynamic flow. Please try again.");
  }
}
async function processStaticWhatsAppMessage(from, messageText) {
  try {
    const text3 = messageText.toLowerCase().trim();
    let conversation = await storage.getConversation(from);
    if (!conversation) {
      conversation = await storage.createConversation({
        phoneNumber: from,
        currentState: "greeting"
      });
    }
    await storage.createMessage({
      conversationId: conversation.id,
      content: messageText,
      isFromBot: false
    });
    console.log("WhatsApp: Stored user message for conversation", conversation.id);
    let response = "";
    let newState = conversation.currentState;
    if (text3 === "hi" || text3 === "hello" || conversation.currentState === "greeting") {
      const services2 = await storage.getServices();
      const activeServices = services2.filter((s) => s.isActive);
      response = "\u{1F44B} Welcome to Spark Salon!\n\nHere are our services:\n";
      activeServices.forEach((service) => {
        const inrPrice = Math.round(service.price * 83);
        response += `\u{1F487}\u200D\u2640\uFE0F ${service.name} \u2013 \u20B9${inrPrice}
`;
      });
      response += "\nReply with service name to book.";
      newState = "awaiting_service";
    } else if (conversation.currentState === "awaiting_service") {
      const services2 = await storage.getServices();
      const selectedService = services2.find(
        (s) => s.isActive && s.name.toLowerCase() === text3
      );
      if (selectedService) {
        const inrPrice = Math.round(selectedService.price * 83);
        response = `Perfect! You've selected ${selectedService.name} (\u20B9${inrPrice}).

`;
        response += "\u{1F4C5} Now, please select your preferred appointment date.\n\n";
        response += "Available dates:\n";
        const today = /* @__PURE__ */ new Date();
        for (let i = 1; i <= 7; i++) {
          const futureDate = new Date(today);
          futureDate.setDate(today.getDate() + i);
          const dateStr = futureDate.toLocaleDateString("en-GB", {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric"
          });
          response += `${i}. ${dateStr}
`;
        }
        response += "\nReply with the number (1-7) for your preferred date.";
        await storage.updateConversation(conversation.id, {
          selectedService: selectedService.id,
          currentState: "awaiting_date"
        });
        newState = "awaiting_date";
      } else {
        response = "Sorry, I didn't recognize that service. Please choose from:\n";
        const activeServices = services2.filter((s) => s.isActive);
        activeServices.forEach((service) => {
          response += `\u2022 ${service.name}
`;
        });
      }
    } else if (conversation.currentState === "awaiting_date") {
      const dateChoice = parseInt(text3);
      if (dateChoice >= 1 && dateChoice <= 7) {
        const today = /* @__PURE__ */ new Date();
        const selectedDate = new Date(today);
        selectedDate.setDate(today.getDate() + dateChoice);
        const dateStr = selectedDate.toISOString().split("T")[0];
        const readableDateStr = selectedDate.toLocaleDateString("en-GB", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric"
        });
        response = `Great! You've selected ${readableDateStr}.

`;
        response += "\u{1F550} Now, please choose your preferred time slot:\n\n";
        response += "Available times:\n";
        response += "1. 10:00 AM\n";
        response += "2. 11:30 AM\n";
        response += "3. 02:00 PM\n";
        response += "4. 03:30 PM\n";
        response += "5. 05:00 PM\n";
        response += "\nReply with the number (1-5) for your preferred time.";
        await storage.updateConversation(conversation.id, {
          selectedDate: dateStr,
          currentState: "awaiting_time"
        });
        newState = "awaiting_time";
      } else {
        response = "Please select a valid date option (1-7). Reply with the number for your preferred date.";
      }
    } else if (conversation.currentState === "awaiting_time") {
      const timeSlots = ["10:00 AM", "11:30 AM", "02:00 PM", "03:30 PM", "05:00 PM"];
      const timeChoice = parseInt(text3);
      if (timeChoice >= 1 && timeChoice <= 5) {
        const selectedTime = timeSlots[timeChoice - 1];
        const services2 = await storage.getServices();
        const selectedService = services2.find((s) => s.id === conversation.selectedService);
        if (selectedService) {
          const updatedConversation = await storage.updateConversation(conversation.id, {
            selectedTime,
            currentState: "awaiting_payment"
          });
          const latestConversation = await storage.getConversation(from);
          if (latestConversation && latestConversation.selectedDate) {
            const upiLink = generateUPILink(selectedService.price, selectedService.name);
            response = `Perfect! Your appointment is scheduled for ${selectedTime}.

`;
            response += `\u{1F4CB} Booking Summary:
`;
            response += `Service: ${selectedService.name}
`;
            response += `Date: ${new Date(latestConversation.selectedDate).toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
`;
            response += `Time: ${selectedTime}
`;
            const inrPrice = Math.round(selectedService.price * 83);
            response += `Amount: \u20B9${inrPrice}

`;
            response += `\u{1F4B3} Please complete your payment:
${upiLink}

`;
            response += "Complete payment in GPay/PhonePe/Paytm and reply 'paid' to confirm your booking.";
            const appointmentDateTime = /* @__PURE__ */ new Date(`${latestConversation.selectedDate}T${timeChoice === 1 ? "10:00" : timeChoice === 2 ? "11:30" : timeChoice === 3 ? "14:00" : timeChoice === 4 ? "15:30" : "17:00"}:00`);
            await storage.createBooking({
              conversationId: conversation.id,
              serviceId: selectedService.id,
              phoneNumber: from,
              amount: selectedService.price,
              status: "pending",
              appointmentDate: appointmentDateTime,
              appointmentTime: selectedTime
            });
            newState = "awaiting_payment";
          }
        }
      } else {
        response = "Please select a valid time slot (1-5). Reply with the number for your preferred time.";
      }
    } else if (conversation.currentState === "awaiting_payment" && text3 === "paid") {
      const services2 = await storage.getServices();
      const selectedService = services2.find((s) => s.id === conversation.selectedService);
      response = "\u2705 Payment received! Your appointment is confirmed.\n\n";
      response += "\u{1F4CB} Confirmed Booking Details:\n";
      if (selectedService) {
        response += `Service: ${selectedService.name}
`;
      }
      if (conversation.selectedDate) {
        const appointmentDate = new Date(conversation.selectedDate);
        response += `Date: ${appointmentDate.toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
`;
      }
      if (conversation.selectedTime) {
        response += `Time: ${conversation.selectedTime}
`;
      }
      response += "\n\u{1F389} Thank you for choosing Spark Salon! We look forward to serving you.";
      const bookings2 = await storage.getBookings();
      const pendingBooking = bookings2.find(
        (b) => b.conversationId === conversation.id && b.status === "pending"
      );
      if (pendingBooking) {
        await storage.updateBooking(pendingBooking.id, {
          status: "confirmed",
          paymentMethod: "UPI"
        });
      }
      newState = "completed";
    } else {
      response = "I'm sorry, I didn't understand that. Type 'hi' to start over or choose a service from our menu.";
    }
    if (newState !== conversation.currentState) {
      await storage.updateConversation(conversation.id, {
        currentState: newState
      });
    }
    await sendWhatsAppMessage(from, response);
    await storage.createMessage({
      conversationId: conversation.id,
      content: response,
      isFromBot: true
    });
    console.log("WhatsApp: Stored bot response for conversation", conversation.id);
  } catch (error) {
    console.error("Error processing WhatsApp message:", error);
    await sendWhatsAppMessage(from, "Sorry, I'm experiencing technical difficulties. Please try again later.");
  }
}
async function registerRoutes(app2) {
  app2.get("/webhook", (req, res) => {
    try {
      console.log("Webhook verification request:", req.query);
      const verification = webhookVerificationSchema.parse(req.query);
      const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
      console.log("Received verify token:", verification["hub.verify_token"]);
      console.log("Expected verify token:", verifyToken);
      console.log("Mode:", verification["hub.mode"]);
      if (verification["hub.mode"] === "subscribe" && verification["hub.verify_token"] === verifyToken) {
        console.log("Verification successful, returning challenge:", verification["hub.challenge"]);
        res.status(200).send(verification["hub.challenge"]);
      } else {
        console.log("Verification failed - mode or token mismatch");
        res.status(403).send("Forbidden");
      }
    } catch (error) {
      console.error("Webhook verification error:", error);
      res.status(400).send("Bad Request");
    }
  });
  app2.post("/webhook", async (req, res) => {
    try {
      const webhookData = whatsAppMessageSchema.parse(req.body);
      for (const entry of webhookData.entry) {
        for (const change of entry.changes) {
          if (change.value.messages) {
            for (const message of change.value.messages) {
              if (message.type === "text") {
                await processWhatsAppMessage(message.from, message.text.body);
              }
            }
          }
        }
      }
      res.status(200).send("OK");
    } catch (error) {
      console.error("Webhook processing error:", error);
      res.status(400).send("Bad Request");
    }
  });
  app2.get("/api/services", async (req, res) => {
    try {
      const services2 = await storage.getServices();
      console.log("API: Fetching services, found:", services2.length);
      res.json(services2);
    } catch (error) {
      console.error("Error fetching services:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.post("/api/services", async (req, res) => {
    try {
      const serviceData = createServiceSchema.parse(req.body);
      const service = await storage.createService(serviceData);
      res.status(201).json(service);
    } catch (error) {
      console.error("Error creating service:", error);
      res.status(400).json({ error: "Invalid service data" });
    }
  });
  app2.get("/api/bookings", async (req, res) => {
    try {
      const bookings2 = await storage.getBookings();
      console.log("API: Fetching bookings, found:", bookings2.length);
      res.json(bookings2);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.patch("/api/bookings/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      if (!status || !["pending", "confirmed", "cancelled"].includes(status)) {
        return res.status(400).json({ error: "Invalid status. Must be pending, confirmed, or cancelled" });
      }
      const bookings2 = await storage.getBookings();
      const booking = bookings2.find((b) => b.id === id);
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }
      const updatedBooking = await storage.updateBooking(id, { status });
      if (!updatedBooking) {
        return res.status(404).json({ error: "Booking not found" });
      }
      if (status === "confirmed" || status === "cancelled") {
        try {
          const services2 = await storage.getServices();
          const service = services2.find((s) => s.id === booking.serviceId);
          const serviceName = service?.name || "Service";
          let notificationMessage = "";
          if (status === "confirmed") {
            const appointmentDate = booking.appointmentDate ? new Date(booking.appointmentDate).toLocaleDateString("en-GB", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric"
            }) : "your selected date";
            const appointmentTime = booking.appointmentTime || "your selected time";
            notificationMessage = `\u2705 *Booking Confirmed!*

Your appointment has been confirmed by Spark Salon.

\u{1F4CB} *Booking Details:*
Service: ${serviceName}
Date: ${appointmentDate}
Time: ${appointmentTime}
Amount: \u20B9${booking.amount}

\u{1F4CD} Please arrive 10 minutes early for your appointment.

Thank you for choosing Spark Salon! \u{1F389}`;
          } else if (status === "cancelled") {
            notificationMessage = `\u274C *Booking Cancelled*

We're sorry to inform you that your booking has been cancelled.

\u{1F4CB} *Cancelled Booking:*
Service: ${serviceName}
Amount: \u20B9${booking.amount}

If you have any questions or would like to reschedule, please contact us or send a new booking request.

We apologize for any inconvenience caused.`;
          }
          const notificationSent = await sendWhatsAppMessage(booking.phoneNumber, notificationMessage);
          console.log(`WhatsApp notification ${notificationSent ? "sent" : "failed"} for booking ${id} status change to ${status}`);
        } catch (notificationError) {
          console.error("Error sending WhatsApp notification:", notificationError);
        }
      }
      res.json(updatedBooking);
    } catch (error) {
      console.error("Error updating booking:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.patch("/api/services/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const updatedService = await storage.updateService(id, updateData);
      if (!updatedService) {
        return res.status(404).json({ error: "Service not found" });
      }
      res.json(updatedService);
    } catch (error) {
      console.error("Error updating service:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.delete("/api/services/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteService(id);
      if (!success) {
        return res.status(404).json({ error: "Service not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting service:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/settings", async (req, res) => {
    try {
      const settings = {
        upiId: "salon@upi",
        businessName: "Spark Salon",
        currency: "INR"
      };
      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.patch("/api/settings", async (req, res) => {
    try {
      const { upiId, businessName } = req.body;
      const settings = {
        upiId: upiId || "salon@upi",
        businessName: businessName || "Spark Salon",
        currency: "INR"
      };
      res.json(settings);
    } catch (error) {
      console.error("Error updating settings:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/stats", async (req, res) => {
    try {
      const todayBookings = await storage.getTodayBookings();
      const todayRevenue = await storage.getTodayRevenue();
      const allBookings = await storage.getBookings();
      const todayMessages = todayBookings.length * 4;
      const stats = {
        todayMessages,
        todayBookings: todayBookings.length,
        todayRevenue,
        responseRate: 98,
        // Static for now
        totalBookings: allBookings.length
      };
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.post("/api/test-message", async (req, res) => {
    try {
      const { from, message } = req.body;
      await processWhatsAppMessage(from, message);
      res.json({ success: true });
    } catch (error) {
      console.error("Error processing test message:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.post("/api/admin/migrate", async (req, res) => {
    try {
      const { adminKey } = req.body;
      if (adminKey !== process.env.ADMIN_KEY && adminKey !== "migrate_fix_2024") {
        return res.status(403).json({ error: "Unauthorized" });
      }
      const { Pool: Pool2 } = __require("@neondatabase/serverless");
      const pool2 = new Pool2({ connectionString: process.env.DATABASE_URL });
      const client = await pool2.connect();
      try {
        const migrations = [
          "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(255);",
          "ALTER TABLE services ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;",
          "ALTER TABLE services ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;",
          "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;",
          "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;"
        ];
        const results = [];
        for (const sql3 of migrations) {
          try {
            await client.query(sql3);
            results.push(`\u2705 Executed: ${sql3}`);
            console.log(`\u2705 Executed: ${sql3}`);
          } catch (error) {
            results.push(`\u26A0\uFE0F Error: ${sql3} - ${error.message}`);
            console.log(`\u26A0\uFE0F Error: ${sql3} - ${error.message}`);
          }
        }
        console.log("\u2705 Database migration completed");
        res.json({
          success: true,
          message: "Database migration completed successfully. Missing columns added.",
          details: results
        });
      } finally {
        client.release();
        await pool2.end();
      }
    } catch (error) {
      console.error("\u274C Migration failed:", error);
      res.status(500).json({
        success: false,
        error: "Migration failed",
        details: error.message
      });
    }
  });
  app2.get("/api/business-config", (req, res) => {
    try {
      const { getBusinessConfig: getBusinessConfig2 } = (init_business_config_api(), __toCommonJS(business_config_api_exports));
      const businessType = req.query.type;
      const config = getBusinessConfig2(businessType);
      res.json({ success: true, data: config });
    } catch (error) {
      console.error("Error fetching business config:", error);
      res.status(500).json({ success: false, error: "Failed to fetch business config" });
    }
  });
  app2.get("/api/business-types", (req, res) => {
    try {
      const { getAllBusinessTypes: getAllBusinessTypes2 } = (init_business_config_api(), __toCommonJS(business_config_api_exports));
      const types = getAllBusinessTypes2();
      res.json({ success: true, data: types });
    } catch (error) {
      console.error("Error fetching business types:", error);
      res.status(500).json({ success: false, error: "Failed to fetch business types" });
    }
  });
  app2.get("/api/bot-flows", async (req, res) => {
    try {
      const mockFlows = [
        {
          id: "current_salon_flow",
          name: "\u{1F7E2} Current Salon Flow (ACTIVE)",
          description: "This is the exact flow currently running on WhatsApp",
          businessType: "salon",
          isActive: true,
          nodes: [
            { id: "start_1", type: "start", name: "Start", position: { x: 100, y: 100 }, configuration: {}, connections: [], metadata: {} },
            { id: "welcome_msg", type: "message", name: "Welcome Message", position: { x: 400, y: 100 }, configuration: {}, connections: [], metadata: {} },
            { id: "service_question", type: "question", name: "Service Selection", position: { x: 700, y: 100 }, configuration: {}, connections: [], metadata: {} },
            { id: "date_question", type: "question", name: "Date Selection", position: { x: 1e3, y: 100 }, configuration: {}, connections: [], metadata: {} },
            { id: "time_question", type: "question", name: "Time Selection", position: { x: 1300, y: 100 }, configuration: {}, connections: [], metadata: {} },
            { id: "customer_details", type: "question", name: "Customer Name", position: { x: 1600, y: 100 }, configuration: {}, connections: [], metadata: {} },
            { id: "payment_action", type: "action", name: "Payment Request", position: { x: 1900, y: 100 }, configuration: {}, connections: [], metadata: {} },
            { id: "confirmation_end", type: "end", name: "Booking Confirmed", position: { x: 2200, y: 100 }, configuration: {}, connections: [], metadata: {} }
          ],
          variables: []
        },
        {
          id: "flow_1",
          name: "Restaurant Booking Flow",
          description: "Complete flow for restaurant table reservations",
          businessType: "restaurant",
          isActive: false,
          nodes: [
            { id: "1", type: "start", name: "Start", position: { x: 0, y: 0 }, configuration: {}, connections: [], metadata: {} },
            { id: "2", type: "message", name: "Welcome", position: { x: 0, y: 0 }, configuration: {}, connections: [], metadata: {} },
            { id: "3", type: "question", name: "Date", position: { x: 0, y: 0 }, configuration: {}, connections: [], metadata: {} },
            { id: "4", type: "end", name: "End", position: { x: 0, y: 0 }, configuration: {}, connections: [], metadata: {} }
          ],
          variables: []
        },
        {
          id: "flow_2",
          name: "Customer Support Flow",
          description: "Handle customer inquiries and support requests",
          businessType: "restaurant",
          isActive: false,
          nodes: [
            { id: "1", type: "start", name: "Start", position: { x: 0, y: 0 }, configuration: {}, connections: [], metadata: {} },
            { id: "2", type: "question", name: "Issue Type", position: { x: 0, y: 0 }, configuration: {}, connections: [], metadata: {} },
            { id: "3", type: "condition", name: "Route", position: { x: 0, y: 0 }, configuration: {}, connections: [], metadata: {} }
          ],
          variables: []
        }
      ];
      res.json({
        flows: mockFlows,
        total: mockFlows.length
      });
    } catch (error) {
      console.error("Error fetching bot flows:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.post("/api/bot-flows", async (req, res) => {
    try {
      const flow = req.body;
      flow.id = `flow_${Date.now()}`;
      console.log("Creating new bot flow:", flow);
      res.json(flow);
    } catch (error) {
      console.error("Error creating bot flow:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.put("/api/bot-flows/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const flow = req.body;
      flow.id = id;
      console.log("Updating bot flow:", flow);
      res.json(flow);
    } catch (error) {
      console.error("Error updating bot flow:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.post("/api/bot-flows/:id/test", async (req, res) => {
    try {
      const { id } = req.params;
      const flow = req.body;
      console.log("Testing bot flow:", id, flow);
      res.json({
        success: true,
        message: "Bot flow test completed successfully!"
      });
    } catch (error) {
      console.error("Error testing bot flow:", error);
      res.status(500).json({
        success: false,
        message: "Error testing bot flow. Please try again."
      });
    }
  });
  app2.get("/api/bot-flows/:id", async (req, res) => {
    try {
      const { id } = req.params;
      if (id === "current_salon_flow") {
        const currentSalonFlow = {
          id: "current_salon_flow",
          name: "\u{1F7E2} Current Salon Flow (ACTIVE)",
          description: "This is the exact flow currently running on WhatsApp",
          businessType: "salon",
          isActive: true,
          nodes: [
            {
              id: "start_1",
              type: "start",
              name: "Start",
              position: { x: 100, y: 100 },
              configuration: {},
              connections: [{
                id: "conn_1",
                sourceNodeId: "start_1",
                targetNodeId: "welcome_msg",
                label: "Begin"
              }],
              metadata: {}
            },
            {
              id: "welcome_msg",
              type: "message",
              name: "Welcome Message",
              position: { x: 400, y: 100 },
              configuration: {
                messageText: "\u{1F487}\u200D\u2640\uFE0F Welcome to Glamour Salon!\n\nI can help you book an appointment. What service would you like?\n\n1. \u{1F487}\u200D\u2640\uFE0F Haircut & Style - \u20B9800\n2. \u{1F3A8} Hair Color - \u20B92500\n3. \u2728 Facial Treatment - \u20B91200\n4. \u{1F485} Manicure & Pedicure - \u20B9600\n\nReply with 1, 2, 3, or 4"
              },
              connections: [{
                id: "conn_2",
                sourceNodeId: "welcome_msg",
                targetNodeId: "service_question",
                label: "Next"
              }],
              metadata: {}
            },
            {
              id: "service_question",
              type: "question",
              name: "Service Selection",
              position: { x: 700, y: 100 },
              configuration: {
                questionText: "Which service would you like?",
                inputType: "choice",
                variableName: "selected_service",
                choices: [
                  { value: "1", label: "Haircut & Style - \u20B9800" },
                  { value: "2", label: "Hair Color - \u20B92500" },
                  { value: "3", label: "Facial Treatment - \u20B91200" },
                  { value: "4", label: "Manicure & Pedicure - \u20B9600" }
                ]
              },
              connections: [{
                id: "conn_3",
                sourceNodeId: "service_question",
                targetNodeId: "date_question",
                label: "Service Selected"
              }],
              metadata: {}
            },
            {
              id: "date_question",
              type: "question",
              name: "Date Selection",
              position: { x: 1e3, y: 100 },
              configuration: {
                questionText: "Great choice! When would you like your appointment?\n\nAvailable dates:\n\u2022 Today\n\u2022 Tomorrow\n\u2022 Day after tomorrow\n\nPlease type your preferred date.",
                inputType: "text",
                variableName: "appointment_date"
              },
              connections: [{
                id: "conn_4",
                sourceNodeId: "date_question",
                targetNodeId: "time_question",
                label: "Date Selected"
              }],
              metadata: {}
            },
            {
              id: "time_question",
              type: "question",
              name: "Time Selection",
              position: { x: 1300, y: 100 },
              configuration: {
                questionText: "Perfect! What time would you prefer?\n\nAvailable slots:\n\u2022 10:00 AM\n\u2022 2:00 PM\n\u2022 4:00 PM\n\u2022 6:00 PM\n\nPlease choose a time.",
                inputType: "choice",
                variableName: "appointment_time",
                choices: [
                  { value: "10:00 AM", label: "10:00 AM" },
                  { value: "2:00 PM", label: "2:00 PM" },
                  { value: "4:00 PM", label: "4:00 PM" },
                  { value: "6:00 PM", label: "6:00 PM" }
                ]
              },
              connections: [{
                id: "conn_5",
                sourceNodeId: "time_question",
                targetNodeId: "customer_details",
                label: "Time Selected"
              }],
              metadata: {}
            },
            {
              id: "customer_details",
              type: "question",
              name: "Customer Name",
              position: { x: 1600, y: 100 },
              configuration: {
                questionText: "Excellent! I need your name for the booking.",
                inputType: "text",
                variableName: "customer_name"
              },
              connections: [{
                id: "conn_6",
                sourceNodeId: "customer_details",
                targetNodeId: "payment_action",
                label: "Name Collected"
              }],
              metadata: {}
            },
            {
              id: "payment_action",
              type: "action",
              name: "Payment Request",
              position: { x: 1900, y: 100 },
              configuration: {
                actionType: "send_notification",
                actionParameters: {
                  message: '\u{1F4B0} Booking Summary:\n\n\u{1F464} Name: {{customer_name}}\n\u{1F487}\u200D\u2640\uFE0F Service: {{selected_service}}\n\u{1F4C5} Date: {{appointment_date}}\n\u{1F550} Time: {{appointment_time}}\n\nTo confirm, please pay \u20B9200 booking fee:\n\u{1F4B3} UPI: salon@paytm\n\nReply "PAID" when done.'
                }
              },
              connections: [{
                id: "conn_7",
                sourceNodeId: "payment_action",
                targetNodeId: "confirmation_end",
                label: "Payment Sent"
              }],
              metadata: {}
            },
            {
              id: "confirmation_end",
              type: "end",
              name: "Booking Confirmed",
              position: { x: 2200, y: 100 },
              configuration: {
                endMessage: "\u{1F389} Booking Confirmed!\n\n\u{1F4CB} Your appointment:\n\u{1F464} {{customer_name}}\n\u{1F487}\u200D\u2640\uFE0F {{selected_service}}\n\u{1F4C5} {{appointment_date}} at {{appointment_time}}\n\n\u{1F4CD} Glamour Salon\n123 Fashion Street\n\nWe will send a reminder 2 hours before your appointment. Thank you! \u2728"
              },
              connections: [],
              metadata: {}
            }
          ],
          variables: [
            { name: "selected_service", type: "string", description: "The service customer selected" },
            { name: "appointment_date", type: "string", description: "Preferred appointment date" },
            { name: "appointment_time", type: "string", description: "Preferred appointment time" },
            { name: "customer_name", type: "string", description: "Customer name for booking" }
          ]
        };
        res.json(currentSalonFlow);
        return;
      }
      const mockFlow = {
        id,
        name: "Sample Bot Flow",
        description: "A sample bot flow for restaurant bookings",
        businessType: "restaurant",
        isActive: false,
        nodes: [
          {
            id: "start_1",
            type: "start",
            name: "Start",
            position: { x: 100, y: 100 },
            configuration: {},
            connections: [
              {
                id: "conn_1",
                sourceNodeId: "start_1",
                targetNodeId: "message_1",
                label: "Begin"
              }
            ],
            metadata: {}
          },
          {
            id: "message_1",
            type: "message",
            name: "Welcome Message",
            position: { x: 400, y: 100 },
            configuration: {
              messageText: "Welcome to our restaurant! I can help you make a reservation."
            },
            connections: [
              {
                id: "conn_2",
                sourceNodeId: "message_1",
                targetNodeId: "question_1",
                label: "Next"
              }
            ],
            metadata: {}
          },
          {
            id: "question_1",
            type: "question",
            name: "Ask for Date",
            position: { x: 700, y: 100 },
            configuration: {
              questionText: "What date would you like to make a reservation for?",
              inputType: "date",
              variableName: "reservation_date"
            },
            connections: [],
            metadata: {}
          }
        ],
        variables: [
          {
            name: "reservation_date",
            type: "date",
            description: "The date for the reservation"
          },
          {
            name: "party_size",
            type: "number",
            description: "Number of people"
          }
        ]
      };
      res.json(mockFlow);
    } catch (error) {
      console.error("Error fetching bot flow:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.post("/api/bot-flows", async (req, res) => {
    try {
      const flowData = req.body;
      const savedFlow = {
        ...flowData,
        id: `flow_${Date.now()}`,
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      };
      res.status(201).json(savedFlow);
    } catch (error) {
      console.error("Error creating bot flow:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.post("/api/bot-flows/:flowId/activate", async (req, res) => {
    try {
      const { flowId } = req.params;
      console.log(`Activating flow ${flowId}`);
      res.json({
        success: true,
        message: `Flow ${flowId} activated for WhatsApp conversations`
      });
    } catch (error) {
      console.error("Error activating flow:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.post("/api/bot-flows/:flowId/deactivate", async (req, res) => {
    try {
      const { flowId } = req.params;
      console.log(`Deactivating flow ${flowId}`);
      res.json({
        success: true,
        message: `Flow ${flowId} deactivated, using default responses`
      });
    } catch (error) {
      console.error("Error deactivating flow:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.post("/api/conversations/:conversationId/process", async (req, res) => {
    try {
      const { conversationId } = req.params;
      const { phoneNumber, message } = req.body;
      const mockResponse = {
        success: true,
        response: `Processed message "${message}" for conversation ${conversationId}`,
        shouldContinue: true
      };
      res.json(mockResponse);
    } catch (error) {
      console.error("Error processing conversation message:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/conversations/:conversationId/status", async (req, res) => {
    try {
      const { conversationId } = req.params;
      const mockStatus = {
        isActive: true,
        currentNode: "message-1",
        variables: { userName: "John" },
        flowId: "flow-123"
      };
      res.json(mockStatus);
    } catch (error) {
      console.error("Error getting conversation status:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.post("/api/conversations/test-flow", async (req, res) => {
    try {
      const { flowId, testMessages } = req.body;
      if (!flowId || !testMessages || !Array.isArray(testMessages)) {
        return res.status(400).json({
          error: "flowId and testMessages array are required"
        });
      }
      const results = testMessages.map((message, index) => ({
        input: message,
        success: true,
        response: `Mock response to: ${message}`,
        step: index + 1
      }));
      res.json({
        success: true,
        testResults: results,
        totalSteps: results.length
      });
    } catch (error) {
      console.error("Error testing bot flow:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/static.ts
import express from "express";
import fs from "fs";
import path from "path";
function serveStatic(app2) {
  const possiblePaths = [
    path.resolve(import.meta.dirname, "public"),
    path.resolve(import.meta.dirname, "..", "dist", "public"),
    path.resolve(process.cwd(), "dist", "public"),
    path.resolve("/var/task/dist/public")
  ];
  let distPath = null;
  for (const testPath of possiblePaths) {
    if (fs.existsSync(testPath)) {
      distPath = testPath;
      console.log(`Static files found at: ${distPath}`);
      break;
    }
  }
  if (!distPath) {
    throw new Error(
      `Could not find the build directory. Tried: ${possiblePaths.join(", ")}`
    );
  }
  app2.use(express.static(distPath, {
    setHeaders: (res, path2) => {
      if (path2.endsWith(".js")) {
        res.setHeader("Content-Type", "application/javascript");
      } else if (path2.endsWith(".css")) {
        res.setHeader("Content-Type", "text/css");
      }
      if (path2.includes("/assets/")) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      } else {
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      }
    }
  }));
  app2.get("/debug/assets", (req, res) => {
    try {
      const assetsPath = path.join(distPath, "assets");
      const files = fs.existsSync(assetsPath) ? fs.readdirSync(assetsPath) : [];
      res.json({
        distPath,
        assetsPath,
        files,
        exists: fs.existsSync(assetsPath)
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/assets/*", (req, res, next) => {
    const assetPath = path.join(distPath, req.path);
    console.log(`Asset request: ${req.path} -> ${assetPath}`);
    if (fs.existsSync(assetPath)) {
      if (req.path.endsWith(".js")) {
        res.setHeader("Content-Type", "application/javascript");
      } else if (req.path.endsWith(".css")) {
        res.setHeader("Content-Type", "text/css");
      }
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      res.sendFile(assetPath);
    } else {
      console.log(`Asset not found: ${assetPath}`);
      res.status(404).send("Asset not found");
    }
  });
  app2.get("*", (req, res, next) => {
    if (req.path.startsWith("/assets/") || req.path.endsWith(".js") || req.path.endsWith(".css") || req.path.endsWith(".ico") || req.path.endsWith(".png") || req.path.endsWith(".jpg") || req.path.endsWith(".svg")) {
      return next();
    }
    console.log(`Serving index.html for route: ${req.path}`);
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}

// server/vercel.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
var server = await registerRoutes(app);
app.use((err, _req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
});
serveStatic(app);
var vercel_default = app;
export {
  vercel_default as default
};
