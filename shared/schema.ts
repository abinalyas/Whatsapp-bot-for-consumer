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
