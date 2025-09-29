import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, jsonb, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ===== TENANT MANAGEMENT TABLES =====

export const tenants = pgTable("tenants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessName: varchar("business_name", { length: 255 }).notNull(),
  domain: varchar("domain", { length: 100 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  status: varchar("status", { length: 20 }).notNull().default("trial"), // trial, active, suspended, cancelled
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
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  email: varchar("email", { length: 255 }).notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull().default("admin"), // admin, user
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  isActive: boolean("is_active").notNull().default(true),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  uniqueTenantEmail: unique().on(table.tenantId, table.email),
}));

export const apiKeys = pgTable("api_keys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  keyHash: varchar("key_hash", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  permissions: jsonb("permissions").notNull().default(sql`'[]'::jsonb`),
  lastUsed: timestamp("last_used"),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const subscriptionPlans = pgTable("subscription_plans", {
  id: varchar("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  priceMonthly: integer("price_monthly").notNull(),
  priceYearly: integer("price_yearly"),
  features: jsonb("features").notNull().default(sql`'{}'::jsonb`),
  limits: jsonb("limits").notNull().default(sql`'{}'::jsonb`),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  planId: varchar("plan_id").notNull().references(() => subscriptionPlans.id),
  status: varchar("status", { length: 20 }).notNull().default("active"), // active, cancelled, past_due, unpaid
  billingCycle: varchar("billing_cycle", { length: 20 }).notNull().default("monthly"), // monthly, yearly
  currentPeriodStart: timestamp("current_period_start").notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 100 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const usageMetrics = pgTable("usage_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  metricName: varchar("metric_name", { length: 100 }).notNull(),
  metricValue: integer("metric_value").notNull().default(0),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  uniqueTenantMetricPeriod: unique().on(table.tenantId, table.metricName, table.periodStart),
}));

// ===== ENHANCED BUSINESS TABLES WITH TENANT ISOLATION =====

export const services = pgTable("services", {
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
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  phoneNumber: text("phone_number").notNull(),
  customerName: text("customer_name"),
  currentState: text("current_state").notNull().default("greeting"), // greeting, awaiting_service, awaiting_date, awaiting_time, awaiting_payment, completed
  selectedService: varchar("selected_service").references(() => services.id),
  selectedDate: text("selected_date"), // YYYY-MM-DD format
  selectedTime: text("selected_time"), // HH:MM format
  contextData: jsonb("context_data").default(sql`'{}'::jsonb`),
  // New flexible business model fields
  customFields: jsonb("custom_fields").default(sql`'{}'::jsonb`),
  botFlowExecutionId: varchar("bot_flow_execution_id").references(() => botFlowExecutions.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  uniqueTenantPhone: unique().on(table.tenantId, table.phoneNumber),
}));

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  conversationId: varchar("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  messageType: varchar("message_type", { length: 50 }).notNull().default("text"), // text, image, document, etc.
  isFromBot: boolean("is_from_bot").notNull(),
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  conversationId: varchar("conversation_id").notNull().references(() => conversations.id),
  serviceId: varchar("service_id").notNull().references(() => services.id),
  phoneNumber: text("phone_number").notNull(),
  customerName: text("customer_name"),
  customerEmail: text("customer_email"),
  amount: integer("amount").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, paid, confirmed, cancelled
  paymentMethod: varchar("payment_method", { length: 50 }),
  paymentReference: text("payment_reference"),
  appointmentDate: timestamp("appointment_date"),
  appointmentTime: text("appointment_time"), // e.g., "10:00 AM", "02:30 PM"
  notes: text("notes"),
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ===== ZOD SCHEMAS =====

// Tenant Management Schemas
export const insertTenantSchema = createInsertSchema(tenants).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertApiKeySchema = createInsertSchema(apiKeys).omit({
  id: true,
  createdAt: true,
});

export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({
  createdAt: true,
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUsageMetricSchema = createInsertSchema(usageMetrics).omit({
  id: true,
  createdAt: true,
});

// Business Tables Schemas (updated for multi-tenancy)
export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  timestamp: true,
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// ===== TYPESCRIPT TYPES =====

// Tenant Management Types
export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = z.infer<typeof insertTenantSchema>;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type UsageMetric = typeof usageMetrics.$inferSelect;
export type InsertUsageMetric = z.infer<typeof insertUsageMetricSchema>;

// Business Tables Types (updated for multi-tenancy)
export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;

// ===== SETTINGS VERSIONING TABLES =====

export const settingsVersions = pgTable("settings_versions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  version: integer("version").notNull(),
  settings: jsonb("settings").notNull(),
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  isActive: boolean("is_active").notNull().default(false),
  changeSummary: text("change_summary"),
  rollbackReason: text("rollback_reason"),
}, (table) => ({
  uniqueTenantVersion: unique().on(table.tenantId, table.version),
}));

export const whatsappCredentials = pgTable("whatsapp_credentials", {
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
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const settingsChangeLog = pgTable("settings_change_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  changedBy: varchar("changed_by").notNull(),
  changeType: varchar("change_type", { length: 50 }).notNull(), // 'update', 'reset', 'rollback'
  fieldPath: varchar("field_path", { length: 255 }), // JSON path of changed field
  oldValue: jsonb("old_value"),
  newValue: jsonb("new_value"),
  changeReason: text("change_reason"),
  ipAddress: varchar("ip_address", { length: 45 }), // Support IPv6
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ===== SETTINGS VERSIONING SCHEMAS =====

export const insertSettingsVersionSchema = createInsertSchema(settingsVersions).omit({
  id: true,
  createdAt: true,
});

export const insertWhatsappCredentialsSchema = createInsertSchema(whatsappCredentials).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSettingsChangeLogSchema = createInsertSchema(settingsChangeLog).omit({
  id: true,
  createdAt: true,
});

// ===== SETTINGS VERSIONING TYPES =====

export type SettingsVersion = typeof settingsVersions.$inferSelect;
export type InsertSettingsVersion = z.infer<typeof insertSettingsVersionSchema>;
export type WhatsappCredentials = typeof whatsappCredentials.$inferSelect;
export type InsertWhatsappCredentials = z.infer<typeof insertWhatsappCredentialsSchema>;
export type SettingsChangeLog = typeof settingsChangeLog.$inferSelect;
export type InsertSettingsChangeLog = z.infer<typeof insertSettingsChangeLogSchema>;

// ===== FLEXIBLE BUSINESS MODELS TABLES =====

// Business Types schema
export const businessTypes = pgTable("business_types", {
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
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Custom Fields schema
export const customFields = pgTable("custom_fields", {
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
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  uniqueTenantEntityName: unique().on(table.tenantId, table.entityType, table.name),
}));

// Offerings schema (replaces services)
export const offerings = pgTable("offerings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  offeringType: varchar("offering_type", { length: 50 }).notNull().default("service"),
  category: varchar("category", { length: 100 }),
  subcategory: varchar("subcategory", { length: 100 }),
  pricingType: varchar("pricing_type", { length: 50 }).notNull().default("fixed"),
  basePrice: integer("base_price").notNull().default(0),
  currency: varchar("currency", { length: 3 }).notNull().default("INR"),
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
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Workflow States schema
export const workflowStates = pgTable("workflow_states", {
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
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  uniqueTenantWorkflowName: unique().on(table.tenantId, table.workflowType, table.name),
}));

// Workflow Transitions schema
export const workflowTransitions = pgTable("workflow_transitions", {
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
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Transactions schema (replaces bookings)
export const transactions = pgTable("transactions", {
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
  timezone: varchar("timezone", { length: 50 }).default("Asia/Kolkata"),
  amount: integer("amount").notNull().default(0),
  currency: varchar("currency", { length: 3 }).notNull().default("INR"),
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
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Bot Flows schema
export const botFlows = pgTable("bot_flows", {
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
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  uniqueTenantNameVersion: unique().on(table.tenantId, table.name, table.version),
}));

// Bot Flow Nodes schema
export const botFlowNodes = pgTable("bot_flow_nodes", {
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
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Bot Flow Executions schema
export const botFlowExecutions = pgTable("bot_flow_executions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  flowId: varchar("flow_id").notNull().references(() => botFlows.id, { onDelete: "cascade" }),
  conversationId: varchar("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  currentNodeId: varchar("current_node_id").references(() => botFlowNodes.id),
  variables: jsonb("variables").default(sql`'{}'::jsonb`),
  executionHistory: jsonb("execution_history").default(sql`'[]'::jsonb`),
  status: varchar("status", { length: 50 }).notNull().default("active"),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
}, (table) => ({
  uniqueConversation: unique().on(table.conversationId),
}));

// ===== FLEXIBLE BUSINESS MODELS SCHEMAS =====

export const insertBusinessTypeSchema = createInsertSchema(businessTypes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCustomFieldSchema = createInsertSchema(customFields).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOfferingSchema = createInsertSchema(offerings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWorkflowStateSchema = createInsertSchema(workflowStates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWorkflowTransitionSchema = createInsertSchema(workflowTransitions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBotFlowSchema = createInsertSchema(botFlows).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBotFlowNodeSchema = createInsertSchema(botFlowNodes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBotFlowExecutionSchema = createInsertSchema(botFlowExecutions).omit({
  id: true,
  startedAt: true,
});

// ===== FLEXIBLE BUSINESS MODELS TYPES =====

export type BusinessType = typeof businessTypes.$inferSelect;
export type InsertBusinessType = z.infer<typeof insertBusinessTypeSchema>;
export type CustomField = typeof customFields.$inferSelect;
export type InsertCustomField = z.infer<typeof insertCustomFieldSchema>;
export type Offering = typeof offerings.$inferSelect;
export type InsertOffering = z.infer<typeof insertOfferingSchema>;
export type WorkflowState = typeof workflowStates.$inferSelect;
export type InsertWorkflowState = z.infer<typeof insertWorkflowStateSchema>;
export type WorkflowTransition = typeof workflowTransitions.$inferSelect;
export type InsertWorkflowTransition = z.infer<typeof insertWorkflowTransitionSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type BotFlow = typeof botFlows.$inferSelect;
export type InsertBotFlow = z.infer<typeof insertBotFlowSchema>;
export type BotFlowNode = typeof botFlowNodes.$inferSelect;
export type InsertBotFlowNode = z.infer<typeof insertBotFlowNodeSchema>;
export type BotFlowExecution = typeof botFlowExecutions.$inferSelect;
export type InsertBotFlowExecution = z.infer<typeof insertBotFlowExecutionSchema>;
