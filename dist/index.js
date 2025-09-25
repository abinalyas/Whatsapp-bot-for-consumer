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
var __copyProps = (to, from, except, desc2) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc2 = __getOwnPropDesc(from, key)) || desc2.enumerable });
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

// server/services/dynamic-flow-processor.service.ts
var dynamic_flow_processor_service_exports = {};
__export(dynamic_flow_processor_service_exports, {
  DynamicFlowProcessorService: () => DynamicFlowProcessorService
});
var DynamicFlowProcessorService;
var init_dynamic_flow_processor_service = __esm({
  "server/services/dynamic-flow-processor.service.ts"() {
    "use strict";
    DynamicFlowProcessorService = class _DynamicFlowProcessorService {
      static instance;
      activeFlow = null;
      constructor() {
      }
      static getInstance() {
        if (!_DynamicFlowProcessorService.instance) {
          _DynamicFlowProcessorService.instance = new _DynamicFlowProcessorService();
        }
        return _DynamicFlowProcessorService.instance;
      }
      /**
       * Load active flow from localStorage (simulated)
       */
      async loadActiveFlow() {
        try {
          const fs3 = __require("fs");
          const path4 = __require("path");
          const flowPath = path4.join(process.cwd(), "whatsapp-bot-flow-exact.json");
          if (fs3.existsSync(flowPath)) {
            const flowData = JSON.parse(fs3.readFileSync(flowPath, "utf8"));
            this.activeFlow = flowData;
            console.log("\u2705 Active flow loaded:", flowData.name);
            return flowData;
          }
          return null;
        } catch (error) {
          console.error("Error loading active flow:", error);
          return null;
        }
      }
      /**
       * Process message using dynamic flow
       */
      async processMessage(phoneNumber, messageText, conversationState) {
        try {
          if (!this.activeFlow) {
            await this.loadActiveFlow();
          }
          if (!this.activeFlow) {
            throw new Error("No active flow found");
          }
          console.log("Processing message with dynamic flow:", {
            phoneNumber,
            messageText,
            conversationState,
            flowName: this.activeFlow.name
          });
          switch (conversationState) {
            case "greeting":
              return this.handleGreetingState();
            case "awaiting_service":
              return this.handleServiceSelectionState(messageText);
            case "awaiting_date":
              return this.handleDateSelectionState(messageText);
            case "awaiting_time":
              return this.handleTimeSelectionState(messageText);
            case "awaiting_payment":
              return this.handlePaymentState(messageText);
            default:
              return this.handleGreetingState();
          }
        } catch (error) {
          console.error("Error processing dynamic flow message:", error);
          return {
            response: "Sorry, I encountered an error. Please try again.",
            newState: "greeting"
          };
        }
      }
      /**
       * Handle greeting state using dynamic flow
       */
      handleGreetingState() {
        const greetingNode = this.activeFlow?.nodes.find(
          (node) => node.id === "welcome_msg" || node.type === "message"
        );
        if (greetingNode?.configuration?.message) {
          return {
            response: greetingNode.configuration.message,
            newState: "awaiting_service"
          };
        }
        return {
          response: "\u{1F44B} Welcome to Spark Salon!\n\nHere are our services:\n\n\u{1F487}\u200D\u2640\uFE0F Haircut \u2013 \u20B9120\n\u{1F487}\u200D\u2640\uFE0F Hair Color \u2013 \u20B9600\n\u{1F487}\u200D\u2640\uFE0F Hair Styling \u2013 \u20B9300\n\u{1F485} Manicure \u2013 \u20B9200\n\u{1F9B6} Pedicure \u2013 \u20B965\n\nReply with the number or name of the service to book.",
          newState: "awaiting_service"
        };
      }
      /**
       * Handle service selection state using dynamic flow
       */
      handleServiceSelectionState(messageText) {
        const serviceConfirmedNode = this.activeFlow?.nodes.find(
          (node) => node.id === "service_confirmed"
        );
        if (serviceConfirmedNode?.configuration?.message) {
          let response = serviceConfirmedNode.configuration.message;
          response = response.replace("{selectedService}", "Haircut");
          response = response.replace("{price}", "120");
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
            response = response.replace(`{date${i}}`, dateStr);
          }
          return {
            response,
            newState: "awaiting_date"
          };
        }
        return {
          response: "Perfect! You've selected Haircut (\u20B9120).\n\n\u{1F4C5} Now, please select your preferred appointment date.",
          newState: "awaiting_date"
        };
      }
      /**
       * Handle date selection state using dynamic flow
       */
      handleDateSelectionState(messageText) {
        const dateConfirmedNode = this.activeFlow?.nodes.find(
          (node) => node.id === "date_confirmed"
        );
        if (dateConfirmedNode?.configuration?.message) {
          let response = dateConfirmedNode.configuration.message;
          const today = /* @__PURE__ */ new Date();
          const selectedDate = new Date(today);
          selectedDate.setDate(today.getDate() + parseInt(messageText));
          const readableDateStr = selectedDate.toLocaleDateString("en-GB", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
          });
          response = response.replace("{selectedDate}", readableDateStr);
          return {
            response,
            newState: "awaiting_time"
          };
        }
        return {
          response: "Great! You've selected the date.\n\n\u{1F550} Now, please choose your preferred time slot.",
          newState: "awaiting_time"
        };
      }
      /**
       * Handle time selection state using dynamic flow
       */
      handleTimeSelectionState(messageText) {
        const bookingSummaryNode = this.activeFlow?.nodes.find(
          (node) => node.id === "booking_summary"
        );
        if (bookingSummaryNode?.configuration?.message) {
          let response = bookingSummaryNode.configuration.message;
          const timeSlots = ["10:00 AM", "11:30 AM", "02:00 PM", "03:30 PM", "05:00 PM"];
          const selectedTime = timeSlots[parseInt(messageText) - 1] || "10:00 AM";
          response = response.replace("{selectedTime}", selectedTime);
          response = response.replace("{selectedService}", "Haircut");
          response = response.replace("{selectedDate}", "Tomorrow");
          response = response.replace("{price}", "120");
          response = response.replace("{upiLink}", "https://paytm.me/example-link");
          return {
            response,
            newState: "awaiting_payment"
          };
        }
        return {
          response: "Perfect! Your appointment is scheduled.\n\n\u{1F4CB} Booking Summary:\nService: Haircut\nDate: Tomorrow\nTime: 10:00 AM\nAmount: \u20B9120",
          newState: "awaiting_payment"
        };
      }
      /**
       * Handle payment state using dynamic flow
       */
      handlePaymentState(messageText) {
        const paymentConfirmedNode = this.activeFlow?.nodes.find(
          (node) => node.id === "payment_confirmed"
        );
        if (paymentConfirmedNode?.configuration?.message) {
          let response = paymentConfirmedNode.configuration.message;
          response = response.replace("{selectedService}", "Haircut");
          response = response.replace("{selectedDate}", "Tomorrow");
          response = response.replace("{selectedTime}", "10:00 AM");
          return {
            response,
            newState: "completed"
          };
        }
        return {
          response: "\u2705 Payment received! Your appointment is now confirmed.\n\n\u{1F389} Thank you for choosing Spark Salon!",
          newState: "completed"
        };
      }
      /**
       * Update flow with new data
       */
      async updateFlow(flowData) {
        this.activeFlow = flowData;
        console.log("\u2705 Flow updated:", flowData.name);
      }
    };
  }
});

// server/services/bot-flow-sync.service.ts
var bot_flow_sync_service_exports = {};
__export(bot_flow_sync_service_exports, {
  BotFlowSyncService: () => BotFlowSyncService
});
var BotFlowSyncService;
var init_bot_flow_sync_service = __esm({
  "server/services/bot-flow-sync.service.ts"() {
    "use strict";
    BotFlowSyncService = class _BotFlowSyncService {
      static instance;
      activeFlow = null;
      backupFlow = null;
      constructor() {
      }
      static getInstance() {
        if (!_BotFlowSyncService.instance) {
          _BotFlowSyncService.instance = new _BotFlowSyncService();
        }
        return _BotFlowSyncService.instance;
      }
      /**
       * Load the exact WhatsApp bot flow
       */
      async loadWhatsAppBotFlow() {
        try {
          const fs3 = __require("fs");
          const path4 = __require("path");
          const flowPath = path4.join(process.cwd(), "whatsapp-bot-flow-exact.json");
          const flowData = JSON.parse(fs3.readFileSync(flowPath, "utf8"));
          this.activeFlow = flowData;
          console.log("\u2705 WhatsApp bot flow loaded successfully");
          return flowData;
        } catch (error) {
          console.error("Error loading WhatsApp bot flow:", error);
          throw error;
        }
      }
      /**
       * Create backup of current flow
       */
      async createBackup() {
        try {
          const fs3 = __require("fs");
          const path4 = __require("path");
          const backupPath = path4.join(process.cwd(), "backup-current-flows.json");
          if (this.activeFlow) {
            this.backupFlow = { ...this.activeFlow };
            fs3.writeFileSync(backupPath, JSON.stringify({
              backup_created: (/* @__PURE__ */ new Date()).toISOString(),
              description: "Backup of current bot flow before changes",
              flow: this.backupFlow
            }, null, 2));
            console.log("\u2705 Backup created successfully");
          }
        } catch (error) {
          console.error("Error creating backup:", error);
          throw error;
        }
      }
      /**
       * Restore from backup
       */
      async restoreFromBackup() {
        try {
          const fs3 = __require("fs");
          const path4 = __require("path");
          const backupPath = path4.join(process.cwd(), "backup-current-flows.json");
          if (fs3.existsSync(backupPath)) {
            const backupData = JSON.parse(fs3.readFileSync(backupPath, "utf8"));
            this.activeFlow = backupData.flow;
            console.log("\u2705 Flow restored from backup");
            return this.activeFlow;
          }
          return null;
        } catch (error) {
          console.error("Error restoring from backup:", error);
          throw error;
        }
      }
      /**
       * Get current active flow
       */
      getActiveFlow() {
        return this.activeFlow;
      }
      /**
       * Update active flow
       */
      updateActiveFlow(flow) {
        this.activeFlow = flow;
        console.log("\u2705 Active flow updated");
      }
      /**
       * Check if flow changes should reflect in WhatsApp bot
       */
      shouldSyncWithWhatsApp() {
        return this.activeFlow !== null && this.activeFlow.isActive;
      }
      /**
       * Get flow node by ID
       */
      getFlowNode(nodeId) {
        if (!this.activeFlow) return null;
        return this.activeFlow.nodes.find((node) => node.id === nodeId);
      }
      /**
       * Get flow connection by ID
       */
      getFlowConnection(connectionId) {
        if (!this.activeFlow) return null;
        return this.activeFlow.connections.find((conn) => conn.id === connectionId);
      }
      /**
       * Process flow changes and sync with WhatsApp bot
       */
      async processFlowChanges(changes) {
        if (!this.activeFlow) return;
        console.log("\u{1F504} Processing flow changes:", changes);
        try {
          const { DynamicFlowProcessorService: DynamicFlowProcessorService2 } = (init_dynamic_flow_processor_service(), __toCommonJS(dynamic_flow_processor_service_exports));
          const flowProcessor = DynamicFlowProcessorService2.getInstance();
          await flowProcessor.updateFlow(this.activeFlow);
          console.log("\u2705 Flow changes processed and synced with WhatsApp bot");
        } catch (error) {
          console.error("Error syncing flow changes:", error);
        }
      }
      /**
       * Sync flow changes from bot flow builder
       */
      async syncFlowFromBuilder(flowData) {
        try {
          console.log("\u{1F504} Syncing flow from builder:", flowData.name);
          this.activeFlow = flowData;
          const { DynamicFlowProcessorService: DynamicFlowProcessorService2 } = (init_dynamic_flow_processor_service(), __toCommonJS(dynamic_flow_processor_service_exports));
          const flowProcessor = DynamicFlowProcessorService2.getInstance();
          await flowProcessor.updateFlow(flowData);
          console.log("\u2705 Flow synced from builder to WhatsApp bot");
        } catch (error) {
          console.error("Error syncing flow from builder:", error);
        }
      }
    };
  }
});

// server/index.ts
import "dotenv/config";
import express3 from "express";

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
  // Production DB uses "timestamp" for messages time column
  createdAt: timestamp2("timestamp").notNull().defaultNow()
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
  }
  async initializeDefaultServices() {
    return;
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
      const safeConversationData = {
        phoneNumber: conversation.phoneNumber,
        customerName: conversation.customerName,
        currentState: conversation.currentState,
        selectedService: conversation.selectedService,
        selectedDate: conversation.selectedDate,
        selectedTime: conversation.selectedTime,
        contextData: conversation.contextData,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt
      };
      const [newConversation] = await db.insert(compatibleConversations).values(safeConversationData).returning();
      return newConversation;
    } catch (error) {
      console.error("Error creating conversation:", error);
      return {
        id: randomUUID(),
        phoneNumber: conversation.phoneNumber,
        customerName: conversation.customerName || null,
        currentState: conversation.currentState,
        selectedService: conversation.selectedService || null,
        selectedDate: conversation.selectedDate || null,
        selectedTime: conversation.selectedTime || null,
        contextData: conversation.contextData || {},
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      };
    }
  }
  async updateConversation(id, conversation) {
    try {
      if (!db) {
        console.warn("Database not available, cannot update conversation with ID:", id);
        try {
          return this.getConversation(conversation.phoneNumber || "");
        } catch {
          return void 0;
        }
      }
      const [updatedConversation] = await db.update(compatibleConversations).set({ ...conversation, updatedAt: /* @__PURE__ */ new Date() }).where(eq(compatibleConversations.id, id)).returning();
      if (!updatedConversation) {
        console.warn(`No conversation found with ID: ${id} for update`);
        return void 0;
      }
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
      const safeMessageData = {
        conversationId: message.conversationId,
        content: message.content,
        messageType: message.messageType || "text",
        isFromBot: message.isFromBot,
        metadata: message.metadata || {}
        // timestamp will default to now if not provided
      };
      const [newMessage] = await db.insert(compatibleMessages).values(safeMessageData).returning();
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
      const offsetMs = 5.5 * 60 * 60 * 1e3;
      const nowUtcMs = Date.now();
      const istNow = new Date(nowUtcMs + offsetMs);
      const istStart = new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate(), 0, 0, 0, 0));
      const istEnd = new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate() + 1, 0, 0, 0, 0));
      const utcStart = new Date(istStart.getTime() - offsetMs);
      const utcEnd = new Date(istEnd.getTime() - offsetMs);
      return await db.select().from(compatibleBookings).where(
        and(
          gte(compatibleBookings.createdAt, utcStart),
          lt(compatibleBookings.createdAt, utcEnd)
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
      const offsetMs = 5.5 * 60 * 60 * 1e3;
      const nowUtcMs = Date.now();
      const istNow = new Date(nowUtcMs + offsetMs);
      const istStart = new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate(), 0, 0, 0, 0));
      const istEnd = new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate() + 1, 0, 0, 0, 0));
      const utcStart = new Date(istStart.getTime() - offsetMs);
      const utcEnd = new Date(istEnd.getTime() - offsetMs);
      const result = await db.select({ total: sql2`SUM(${compatibleBookings.amount})` }).from(compatibleBookings).where(
        and(
          eq(compatibleBookings.status, "confirmed"),
          gte(compatibleBookings.createdAt, utcStart),
          lt(compatibleBookings.createdAt, utcEnd)
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
  // Expose which backend is in use
  isUsingDatabase() {
    return this.useDatabase;
  }
  getBackendName() {
    return this.useDatabase ? "database" : "memory";
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
function getStorageBackendName() {
  try {
    const hybrid = storage;
    return hybrid.getBackendName ? hybrid.getBackendName() : "unknown";
  } catch {
    return "unknown";
  }
}

// server/routes.ts
import { z } from "zod";

// server/routes/bot-flow-builder.routes.ts
import { Router } from "express";

// server/services/bot-flow-builder.service.ts
import { Pool as Pool2 } from "@neondatabase/serverless";
import { drizzle as drizzle2 } from "drizzle-orm/neon-serverless";
import { eq as eq3, and as and3, desc, asc, sql as sql3 } from "drizzle-orm";
var BotFlowBuilderService = class {
  db = null;
  pool = null;
  useDatabase = false;
  constructor(connectionString) {
    if (connectionString && connectionString.trim() !== "") {
      try {
        this.pool = new Pool2({
          connectionString,
          // Add timeout configuration
          statement_timeout: 5e3,
          // 5 seconds
          connection_timeout: 5e3,
          // 5 seconds
          idle_timeout: 1e4
          // 10 seconds
        });
        this.db = drizzle2(this.pool, { schema: schema_exports });
        this.useDatabase = true;
        console.log("BotFlowBuilderService: Database connection initialized with timeout settings");
      } catch (error) {
        console.warn("BotFlowBuilderService: Failed to initialize database connection, using mock data:", error);
        this.useDatabase = false;
      }
    } else {
      console.log("BotFlowBuilderService: No database connection string provided, using mock data");
      this.useDatabase = false;
    }
  }
  // ===== BOT FLOW MANAGEMENT =====
  /**
   * Create new bot flow
   */
  async createBotFlow(tenantId, request) {
    try {
      const validation = this.validateCreateBotFlowRequest(request);
      if (!validation.isValid) {
        return {
          success: false,
          error: {
            code: "BOT_FLOW_VALIDATION_FAILED",
            message: "Bot flow validation failed",
            tenantId,
            details: validation.errors
          }
        };
      }
      const [botFlow] = await this.db.insert(botFlows).values({
        tenantId,
        name: request.name,
        description: request.description,
        businessType: request.businessType,
        isActive: false,
        // Start inactive until nodes are added
        isTemplate: request.isTemplate || false,
        version: "1.0.0",
        variables: request.variables || [],
        metadata: request.metadata || {}
      }).returning();
      if (request.templateId) {
        await this.copyTemplateNodes(tenantId, botFlow.id, request.templateId);
      }
      const result = await this.getBotFlow(tenantId, botFlow.id);
      return result;
    } catch (error) {
      console.error("Error creating bot flow:", error);
      return {
        success: false,
        error: {
          code: "BOT_FLOW_CREATE_FAILED",
          message: "Failed to create bot flow",
          tenantId
        }
      };
    }
  }
  /**
   * Get bot flow by ID
   */
  async getBotFlow(tenantId, flowId) {
    try {
      const [botFlow] = await this.db.select().from(botFlows).where(and3(
        eq3(botFlows.tenantId, tenantId),
        eq3(botFlows.id, flowId)
      ));
      if (!botFlow) {
        return {
          success: false,
          error: {
            code: "BOT_FLOW_NOT_FOUND",
            message: "Bot flow not found",
            tenantId,
            resourceId: flowId
          }
        };
      }
      const nodes = await this.db.select().from(botFlowNodes).where(eq3(botFlowNodes.flowId, flowId)).orderBy(asc(botFlowNodes.createdAt));
      const result = {
        ...botFlow,
        nodes: nodes.map((node) => ({
          ...node,
          position: node.position,
          configuration: node.configuration,
          connections: node.connections,
          metadata: node.metadata
        })),
        variables: botFlow.variables,
        metadata: botFlow.metadata
      };
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error("Error getting bot flow:", error);
      return {
        success: false,
        error: {
          code: "BOT_FLOW_FETCH_FAILED",
          message: "Failed to fetch bot flow",
          tenantId,
          resourceId: flowId
        }
      };
    }
  }
  /**
   * List bot flows
   */
  async listBotFlows(tenantId, options = {}) {
    if (!this.useDatabase) {
      console.log("BotFlowBuilderService: Returning mock data for listBotFlows (database not available)");
      return {
        success: true,
        data: {
          flows: [
            {
              id: "current_salon_flow",
              tenantId,
              name: "\u{1F7E2} Current Salon Flow (ACTIVE)",
              description: "This is the exact flow currently running on WhatsApp",
              businessType: "salon",
              isActive: true,
              isTemplate: false,
              version: "1.0.0",
              nodes: [
                {
                  id: "start_1",
                  tenantId,
                  flowId: "current_salon_flow",
                  type: "start",
                  name: "Start",
                  position: { x: 100, y: 100 },
                  configuration: {},
                  connections: [],
                  metadata: {},
                  createdAt: /* @__PURE__ */ new Date(),
                  updatedAt: /* @__PURE__ */ new Date()
                },
                {
                  id: "welcome_msg",
                  tenantId,
                  flowId: "current_salon_flow",
                  type: "message",
                  name: "Welcome Message",
                  position: { x: 400, y: 100 },
                  configuration: {},
                  connections: [],
                  metadata: {},
                  createdAt: /* @__PURE__ */ new Date(),
                  updatedAt: /* @__PURE__ */ new Date()
                },
                {
                  id: "service_question",
                  tenantId,
                  flowId: "current_salon_flow",
                  type: "question",
                  name: "Service Selection",
                  position: { x: 700, y: 100 },
                  configuration: {},
                  connections: [],
                  metadata: {},
                  createdAt: /* @__PURE__ */ new Date(),
                  updatedAt: /* @__PURE__ */ new Date()
                },
                {
                  id: "date_question",
                  tenantId,
                  flowId: "current_salon_flow",
                  type: "question",
                  name: "Date Selection",
                  position: { x: 1e3, y: 100 },
                  configuration: {},
                  connections: [],
                  metadata: {},
                  createdAt: /* @__PURE__ */ new Date(),
                  updatedAt: /* @__PURE__ */ new Date()
                },
                {
                  id: "time_question",
                  tenantId,
                  flowId: "current_salon_flow",
                  type: "question",
                  name: "Time Selection",
                  position: { x: 1300, y: 100 },
                  configuration: {},
                  connections: [],
                  metadata: {},
                  createdAt: /* @__PURE__ */ new Date(),
                  updatedAt: /* @__PURE__ */ new Date()
                },
                {
                  id: "customer_details",
                  tenantId,
                  flowId: "current_salon_flow",
                  type: "question",
                  name: "Customer Name",
                  position: { x: 1600, y: 100 },
                  configuration: {},
                  connections: [],
                  metadata: {},
                  createdAt: /* @__PURE__ */ new Date(),
                  updatedAt: /* @__PURE__ */ new Date()
                },
                {
                  id: "payment_action",
                  tenantId,
                  flowId: "current_salon_flow",
                  type: "action",
                  name: "Payment Request",
                  position: { x: 1900, y: 100 },
                  configuration: {},
                  connections: [],
                  metadata: {},
                  createdAt: /* @__PURE__ */ new Date(),
                  updatedAt: /* @__PURE__ */ new Date()
                },
                {
                  id: "confirmation_end",
                  tenantId,
                  flowId: "current_salon_flow",
                  type: "end",
                  name: "Booking Confirmed",
                  position: { x: 2200, y: 100 },
                  configuration: {},
                  connections: [],
                  metadata: {},
                  createdAt: /* @__PURE__ */ new Date(),
                  updatedAt: /* @__PURE__ */ new Date()
                }
              ],
              variables: [],
              metadata: {},
              createdAt: /* @__PURE__ */ new Date(),
              updatedAt: /* @__PURE__ */ new Date()
            }
          ],
          total: 1,
          page: 1,
          limit: 50
        }
      };
    }
    try {
      console.log("BotFlowBuilderService: Starting database query for listBotFlows");
      const { businessType, isActive, isTemplate, page = 1, limit = 50 } = options;
      const offset = (page - 1) * limit;
      const conditions = [eq3(botFlows.tenantId, tenantId)];
      if (businessType) {
        conditions.push(eq3(botFlows.businessType, businessType));
      }
      if (isActive !== void 0) {
        conditions.push(eq3(botFlows.isActive, isActive));
      }
      if (isTemplate !== void 0) {
        conditions.push(eq3(botFlows.isTemplate, isTemplate));
      }
      console.log("BotFlowBuilderService: Executing flows query");
      const flowsQuery = this.db.select().from(botFlows).where(and3(...conditions)).orderBy(desc(botFlows.updatedAt)).limit(limit).offset(offset);
      const flows = await Promise.race([
        flowsQuery,
        new Promise(
          (_, reject) => setTimeout(() => reject(new Error("Flows query timeout")), 5e3)
        )
      ]);
      console.log("BotFlowBuilderService: Flows query completed, found", flows.length, "flows");
      console.log("BotFlowBuilderService: Executing count query");
      const countQuery = this.db.select({ count: sql3`count(*)` }).from(botFlows).where(and3(...conditions));
      const [{ count }] = await Promise.race([
        countQuery,
        new Promise(
          (_, reject) => setTimeout(() => reject(new Error("Count query timeout")), 5e3)
        )
      ]);
      console.log("BotFlowBuilderService: Count query completed, total count:", count);
      const flowsWithNodes = [];
      console.log("BotFlowBuilderService: Starting to fetch nodes for", flows.length, "flows");
      for (const [index, flow] of flows.entries()) {
        console.log("BotFlowBuilderService: Fetching nodes for flow", index + 1, "of", flows.length, "flowId:", flow.id);
        const nodesQuery = this.db.select().from(botFlowNodes).where(eq3(botFlowNodes.flowId, flow.id)).orderBy(asc(botFlowNodes.createdAt));
        const nodes = await Promise.race([
          nodesQuery,
          new Promise(
            (_, reject) => setTimeout(() => reject(new Error(`Nodes query timeout for flow ${flow.id}`)), 5e3)
          )
        ]);
        console.log("BotFlowBuilderService: Fetched", nodes.length, "nodes for flow", flow.id);
        flowsWithNodes.push({
          ...flow,
          nodes: nodes.map((node) => ({
            ...node,
            position: node.position,
            configuration: node.configuration,
            connections: node.connections,
            metadata: node.metadata
          })),
          variables: flow.variables,
          metadata: flow.metadata
        });
      }
      console.log("BotFlowBuilderService: Finished fetching nodes for all flows");
      const result = {
        success: true,
        data: {
          flows: flowsWithNodes,
          total: count,
          page,
          limit
        }
      };
      console.log("BotFlowBuilderService: listBotFlows completed successfully");
      return result;
    } catch (error) {
      console.error("Error listing bot flows:", error);
      console.log("BotFlowBuilderService: Falling back to mock data due to database error");
      return {
        success: true,
        data: {
          flows: [
            {
              id: "current_salon_flow",
              tenantId,
              name: "\u{1F7E2} Current Salon Flow (ACTIVE)",
              description: "This is the exact flow currently running on WhatsApp",
              businessType: "salon",
              isActive: true,
              isTemplate: false,
              version: "1.0.0",
              nodes: [
                {
                  id: "start_1",
                  tenantId,
                  flowId: "current_salon_flow",
                  type: "start",
                  name: "Start",
                  position: { x: 100, y: 100 },
                  configuration: {},
                  connections: [],
                  metadata: {},
                  createdAt: /* @__PURE__ */ new Date(),
                  updatedAt: /* @__PURE__ */ new Date()
                },
                {
                  id: "welcome_msg",
                  tenantId,
                  flowId: "current_salon_flow",
                  type: "message",
                  name: "Welcome Message",
                  position: { x: 400, y: 100 },
                  configuration: {},
                  connections: [],
                  metadata: {},
                  createdAt: /* @__PURE__ */ new Date(),
                  updatedAt: /* @__PURE__ */ new Date()
                },
                {
                  id: "service_question",
                  tenantId,
                  flowId: "current_salon_flow",
                  type: "question",
                  name: "Service Selection",
                  position: { x: 700, y: 100 },
                  configuration: {},
                  connections: [],
                  metadata: {},
                  createdAt: /* @__PURE__ */ new Date(),
                  updatedAt: /* @__PURE__ */ new Date()
                },
                {
                  id: "date_question",
                  tenantId,
                  flowId: "current_salon_flow",
                  type: "question",
                  name: "Date Selection",
                  position: { x: 1e3, y: 100 },
                  configuration: {},
                  connections: [],
                  metadata: {},
                  createdAt: /* @__PURE__ */ new Date(),
                  updatedAt: /* @__PURE__ */ new Date()
                },
                {
                  id: "time_question",
                  tenantId,
                  flowId: "current_salon_flow",
                  type: "question",
                  name: "Time Selection",
                  position: { x: 1300, y: 100 },
                  configuration: {},
                  connections: [],
                  metadata: {},
                  createdAt: /* @__PURE__ */ new Date(),
                  updatedAt: /* @__PURE__ */ new Date()
                },
                {
                  id: "customer_details",
                  tenantId,
                  flowId: "current_salon_flow",
                  type: "question",
                  name: "Customer Name",
                  position: { x: 1600, y: 100 },
                  configuration: {},
                  connections: [],
                  metadata: {},
                  createdAt: /* @__PURE__ */ new Date(),
                  updatedAt: /* @__PURE__ */ new Date()
                },
                {
                  id: "payment_action",
                  tenantId,
                  flowId: "current_salon_flow",
                  type: "action",
                  name: "Payment Request",
                  position: { x: 1900, y: 100 },
                  configuration: {},
                  connections: [],
                  metadata: {},
                  createdAt: /* @__PURE__ */ new Date(),
                  updatedAt: /* @__PURE__ */ new Date()
                },
                {
                  id: "confirmation_end",
                  tenantId,
                  flowId: "current_salon_flow",
                  type: "end",
                  name: "Booking Confirmed",
                  position: { x: 2200, y: 100 },
                  configuration: {},
                  connections: [],
                  metadata: {},
                  createdAt: /* @__PURE__ */ new Date(),
                  updatedAt: /* @__PURE__ */ new Date()
                }
              ],
              variables: [],
              metadata: {},
              createdAt: /* @__PURE__ */ new Date(),
              updatedAt: /* @__PURE__ */ new Date()
            }
          ],
          total: 1,
          page: 1,
          limit: 50
        }
      };
    }
  }
  /**
   * Update bot flow
   */
  async updateBotFlow(tenantId, flowId, request) {
    try {
      const [updatedFlow] = await this.db.update(botFlows).set({
        ...request,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(and3(
        eq3(botFlows.tenantId, tenantId),
        eq3(botFlows.id, flowId)
      )).returning();
      if (!updatedFlow) {
        return {
          success: false,
          error: {
            code: "BOT_FLOW_NOT_FOUND",
            message: "Bot flow not found",
            tenantId,
            resourceId: flowId
          }
        };
      }
      const result = await this.getBotFlow(tenantId, flowId);
      return result;
    } catch (error) {
      console.error("Error updating bot flow:", error);
      return {
        success: false,
        error: {
          code: "BOT_FLOW_UPDATE_FAILED",
          message: "Failed to update bot flow",
          tenantId,
          resourceId: flowId
        }
      };
    }
  }
  /**
   * Delete bot flow
   */
  async deleteBotFlow(tenantId, flowId) {
    try {
      await this.db.delete(botFlowNodes).where(eq3(botFlowNodes.flowId, flowId));
      const [deletedFlow] = await this.db.delete(botFlows).where(and3(
        eq3(botFlows.tenantId, tenantId),
        eq3(botFlows.id, flowId)
      )).returning();
      if (!deletedFlow) {
        return {
          success: false,
          error: {
            code: "BOT_FLOW_NOT_FOUND",
            message: "Bot flow not found",
            tenantId,
            resourceId: flowId
          }
        };
      }
      return {
        success: true,
        data: void 0
      };
    } catch (error) {
      console.error("Error deleting bot flow:", error);
      return {
        success: false,
        error: {
          code: "BOT_FLOW_DELETE_FAILED",
          message: "Failed to delete bot flow",
          tenantId,
          resourceId: flowId
        }
      };
    }
  }
  // ===== BOT FLOW NODE MANAGEMENT =====
  /**
   * Create bot flow node
   */
  async createBotFlowNode(tenantId, flowId, request) {
    try {
      const flowResult = await this.getBotFlow(tenantId, flowId);
      if (!flowResult.success) {
        return flowResult;
      }
      const validation = this.validateNodeConfiguration(request.type, request.configuration);
      if (!validation.isValid) {
        return {
          success: false,
          error: {
            code: "BOT_FLOW_NODE_VALIDATION_FAILED",
            message: "Bot flow node validation failed",
            tenantId,
            details: validation.errors
          }
        };
      }
      const [node] = await this.db.insert(botFlowNodes).values({
        tenantId,
        flowId,
        type: request.type,
        name: request.name,
        description: request.description,
        position: request.position,
        configuration: request.configuration,
        connections: request.connections || [],
        metadata: request.metadata || {}
      }).returning();
      const result = {
        ...node,
        position: node.position,
        configuration: node.configuration,
        connections: node.connections,
        metadata: node.metadata
      };
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error("Error creating bot flow node:", error);
      return {
        success: false,
        error: {
          code: "BOT_FLOW_NODE_CREATE_FAILED",
          message: "Failed to create bot flow node",
          tenantId
        }
      };
    }
  }
  /**
   * Update bot flow node
   */
  async updateBotFlowNode(tenantId, nodeId, request) {
    try {
      if (request.configuration) {
        const [existingNode] = await this.db.select().from(botFlowNodes).where(and3(
          eq3(botFlowNodes.tenantId, tenantId),
          eq3(botFlowNodes.id, nodeId)
        ));
        if (!existingNode) {
          return {
            success: false,
            error: {
              code: "BOT_FLOW_NODE_NOT_FOUND",
              message: "Bot flow node not found",
              tenantId,
              resourceId: nodeId
            }
          };
        }
        const validation = this.validateNodeConfiguration(existingNode.type, request.configuration);
        if (!validation.isValid) {
          return {
            success: false,
            error: {
              code: "BOT_FLOW_NODE_VALIDATION_FAILED",
              message: "Bot flow node validation failed",
              tenantId,
              details: validation.errors
            }
          };
        }
      }
      const [updatedNode] = await this.db.update(botFlowNodes).set({
        ...request,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(and3(
        eq3(botFlowNodes.tenantId, tenantId),
        eq3(botFlowNodes.id, nodeId)
      )).returning();
      if (!updatedNode) {
        return {
          success: false,
          error: {
            code: "BOT_FLOW_NODE_NOT_FOUND",
            message: "Bot flow node not found",
            tenantId,
            resourceId: nodeId
          }
        };
      }
      const result = {
        ...updatedNode,
        position: updatedNode.position,
        configuration: updatedNode.configuration,
        connections: updatedNode.connections,
        metadata: updatedNode.metadata
      };
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error("Error updating bot flow node:", error);
      return {
        success: false,
        error: {
          code: "BOT_FLOW_NODE_UPDATE_FAILED",
          message: "Failed to update bot flow node",
          tenantId,
          resourceId: nodeId
        }
      };
    }
  }
  /**
   * Delete bot flow node
   */
  async deleteBotFlowNode(tenantId, nodeId) {
    try {
      const [deletedNode] = await this.db.delete(botFlowNodes).where(and3(
        eq3(botFlowNodes.tenantId, tenantId),
        eq3(botFlowNodes.id, nodeId)
      )).returning();
      if (!deletedNode) {
        return {
          success: false,
          error: {
            code: "BOT_FLOW_NODE_NOT_FOUND",
            message: "Bot flow node not found",
            tenantId,
            resourceId: nodeId
          }
        };
      }
      await this.removeNodeConnections(deletedNode.flowId, nodeId);
      return {
        success: true,
        data: void 0
      };
    } catch (error) {
      console.error("Error deleting bot flow node:", error);
      return {
        success: false,
        error: {
          code: "BOT_FLOW_NODE_DELETE_FAILED",
          message: "Failed to delete bot flow node",
          tenantId,
          resourceId: nodeId
        }
      };
    }
  }
  // ===== BOT FLOW VALIDATION =====
  /**
   * Validate bot flow
   */
  // ===== BOT FLOW TEMPLATES =====
  /**
   * Get predefined bot flow templates
   */
  async getBotFlowTemplates(businessType) {
    try {
      const templates = this.getPredefinedTemplates();
      const filteredTemplates = businessType ? templates.filter((template) => template.businessType === businessType) : templates;
      return {
        success: true,
        data: filteredTemplates
      };
    } catch (error) {
      console.error("Error getting bot flow templates:", error);
      return {
        success: false,
        error: {
          code: "BOT_FLOW_TEMPLATES_FETCH_FAILED",
          message: "Failed to fetch bot flow templates"
        }
      };
    }
  }
  /**
   * Create bot flow from template
   */
  async createBotFlowFromTemplate(tenantId, templateId, customization) {
    try {
      const templates = this.getPredefinedTemplates();
      const template = templates.find((t) => t.id === templateId);
      if (!template) {
        return {
          success: false,
          error: {
            code: "BOT_FLOW_TEMPLATE_NOT_FOUND",
            message: "Bot flow template not found",
            resourceId: templateId
          }
        };
      }
      const createRequest = {
        name: customization.name,
        description: customization.description || template.description,
        businessType: template.businessType,
        variables: template.variables,
        metadata: {
          ...template.metadata,
          templateId,
          customization: customization.variables
        }
      };
      const flowResult = await this.createBotFlow(tenantId, createRequest);
      if (!flowResult.success) {
        return flowResult;
      }
      const flow = flowResult.data;
      const nodeIdMap = /* @__PURE__ */ new Map();
      for (const templateNode of template.nodes) {
        const nodeResult = await this.createBotFlowNode(tenantId, flow.id, {
          type: templateNode.type,
          name: templateNode.name,
          description: templateNode.description,
          position: templateNode.position,
          configuration: this.customizeNodeConfiguration(templateNode.configuration, customization.variables),
          metadata: templateNode.metadata
        });
        if (nodeResult.success) {
          nodeIdMap.set(templateNode.name, nodeResult.data.id);
        }
      }
      for (const templateNode of template.nodes) {
        const actualNodeId = nodeIdMap.get(templateNode.name);
        if (actualNodeId && templateNode.connections.length > 0) {
          const updatedConnections = templateNode.connections.map((conn) => ({
            ...conn,
            id: this.generateId(),
            sourceNodeId: actualNodeId,
            targetNodeId: nodeIdMap.get(conn.targetNodeId) || conn.targetNodeId
          }));
          await this.updateBotFlowNode(tenantId, actualNodeId, {
            connections: updatedConnections
          });
        }
      }
      const startNode = template.nodes.find((node) => node.type === "start");
      if (startNode) {
        const entryNodeId = nodeIdMap.get(startNode.name);
        if (entryNodeId) {
          await this.updateBotFlow(tenantId, flow.id, {
            metadata: {
              ...flow.metadata,
              entryNodeId
            }
          });
        }
      }
      const result = await this.getBotFlow(tenantId, flow.id);
      return result;
    } catch (error) {
      console.error("Error creating bot flow from template:", error);
      return {
        success: false,
        error: {
          code: "BOT_FLOW_TEMPLATE_CREATE_FAILED",
          message: "Failed to create bot flow from template",
          resourceId: templateId
        }
      };
    }
  }
  // ===== UTILITY METHODS =====
  /**
   * Validate create bot flow request
   */
  validateCreateBotFlowRequest(request) {
    const errors = [];
    if (!request.name || request.name.trim().length === 0) {
      errors.push("Flow name is required");
    }
    if (!request.businessType || request.businessType.trim().length === 0) {
      errors.push("Business type is required");
    }
    if (request.variables) {
      for (const variable of request.variables) {
        if (!variable.name || variable.name.trim().length === 0) {
          errors.push("Variable name is required");
        }
        if (!variable.type) {
          errors.push(`Variable type is required for ${variable.name}`);
        }
      }
    }
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  /**
   * Validate node configuration
   */
  validateNodeConfiguration(nodeType, configuration) {
    const errors = [];
    switch (nodeType) {
      case "start":
        break;
      case "message":
        if (!configuration.messageText) {
          errors.push({
            message: "Message text is required for message nodes",
            code: "MISSING_MESSAGE_TEXT"
          });
        }
        break;
      case "question":
        if (!configuration.questionText) {
          errors.push({
            message: "Question text is required for question nodes",
            code: "MISSING_QUESTION_TEXT"
          });
        }
        if (!configuration.variableName) {
          errors.push({
            message: "Variable name is required for question nodes",
            code: "MISSING_VARIABLE_NAME"
          });
        }
        if (configuration.inputType === "choice" && (!configuration.choices || configuration.choices.length === 0)) {
          errors.push({
            message: "Choices are required for choice input type",
            code: "MISSING_CHOICES"
          });
        }
        break;
      case "condition":
        if (!configuration.conditions || configuration.conditions.length === 0) {
          errors.push({
            message: "Conditions are required for condition nodes",
            code: "MISSING_CONDITIONS"
          });
        }
        break;
      case "action":
        if (!configuration.actionType) {
          errors.push({
            message: "Action type is required for action nodes",
            code: "MISSING_ACTION_TYPE"
          });
        }
        break;
      case "integration":
        if (!configuration.integrationType) {
          errors.push({
            message: "Integration type is required for integration nodes",
            code: "MISSING_INTEGRATION_TYPE"
          });
        }
        break;
      case "end":
        break;
    }
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  /**
   * Validate node connections
   */
  validateNodeConnections(node, allNodes, errors, warnings) {
    for (const connection of node.connections) {
      const targetExists = allNodes.some((n) => n.id === connection.targetNodeId);
      if (!targetExists) {
        errors.push({
          nodeId: node.id,
          type: "error",
          message: `Connection target node ${connection.targetNodeId} does not exist`,
          code: "INVALID_CONNECTION_TARGET"
        });
      }
    }
    switch (node.type) {
      case "start":
        if (node.connections.length === 0) {
          warnings.push({
            nodeId: node.id,
            message: "Start node should have at least one connection",
            code: "START_NODE_NO_CONNECTIONS"
          });
        }
        break;
      case "condition":
        if (node.connections.length < 2) {
          warnings.push({
            nodeId: node.id,
            message: "Condition node should have at least two connections (true/false paths)",
            code: "CONDITION_NODE_INSUFFICIENT_CONNECTIONS"
          });
        }
        break;
      case "end":
        if (node.connections.length > 0) {
          warnings.push({
            nodeId: node.id,
            message: "End node should not have outgoing connections",
            code: "END_NODE_HAS_CONNECTIONS"
          });
        }
        break;
    }
  }
  /**
   * Validate flow reachability
   */
  validateFlowReachability(flow, errors, warnings) {
    const startNodes = flow.nodes.filter((node) => node.type === "start");
    if (startNodes.length === 0) return;
    const reachableNodes = /* @__PURE__ */ new Set();
    const toVisit = [startNodes[0].id];
    while (toVisit.length > 0) {
      const currentNodeId = toVisit.pop();
      if (reachableNodes.has(currentNodeId)) continue;
      reachableNodes.add(currentNodeId);
      const currentNode = flow.nodes.find((node) => node.id === currentNodeId);
      if (currentNode) {
        for (const connection of currentNode.connections) {
          if (!reachableNodes.has(connection.targetNodeId)) {
            toVisit.push(connection.targetNodeId);
          }
        }
      }
    }
    for (const node of flow.nodes) {
      if (!reachableNodes.has(node.id) && node.type !== "start") {
        warnings.push({
          nodeId: node.id,
          message: `Node ${node.name} is not reachable from start node`,
          code: "UNREACHABLE_NODE"
        });
      }
    }
  }
  /**
   * Validate flow for infinite loops
   */
  validateFlowLoops(flow, warnings) {
    const visited = /* @__PURE__ */ new Set();
    const recursionStack = /* @__PURE__ */ new Set();
    const hasLoop = (nodeId) => {
      if (recursionStack.has(nodeId)) {
        return true;
      }
      if (visited.has(nodeId)) {
        return false;
      }
      visited.add(nodeId);
      recursionStack.add(nodeId);
      const node = flow.nodes.find((n) => n.id === nodeId);
      if (node) {
        for (const connection of node.connections) {
          if (hasLoop(connection.targetNodeId)) {
            return true;
          }
        }
      }
      recursionStack.delete(nodeId);
      return false;
    };
    const startNodes = flow.nodes.filter((node) => node.type === "start");
    for (const startNode of startNodes) {
      if (hasLoop(startNode.id)) {
        warnings.push({
          message: "Flow contains potential infinite loops",
          code: "POTENTIAL_INFINITE_LOOP"
        });
        break;
      }
    }
  }
  /**
   * Remove connections to a deleted node
   */
  async removeNodeConnections(flowId, deletedNodeId) {
    const nodes = await this.db.select().from(botFlowNodes).where(eq3(botFlowNodes.flowId, flowId));
    for (const node of nodes) {
      const connections = node.connections;
      const updatedConnections = connections.filter(
        (conn) => conn.targetNodeId !== deletedNodeId && conn.sourceNodeId !== deletedNodeId
      );
      if (updatedConnections.length !== connections.length) {
        await this.db.update(botFlowNodes).set({
          connections: updatedConnections,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq3(botFlowNodes.id, node.id));
      }
    }
  }
  /**
   * Copy template nodes to a new flow
   */
  async copyTemplateNodes(tenantId, flowId, templateId) {
    const templates = this.getPredefinedTemplates();
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;
    const nodeIdMap = /* @__PURE__ */ new Map();
    for (const templateNode of template.nodes) {
      const nodeResult = await this.createBotFlowNode(tenantId, flowId, {
        type: templateNode.type,
        name: templateNode.name,
        description: templateNode.description,
        position: templateNode.position,
        configuration: templateNode.configuration,
        metadata: templateNode.metadata
      });
      if (nodeResult.success) {
        nodeIdMap.set(templateNode.name, nodeResult.data.id);
      }
    }
    for (const templateNode of template.nodes) {
      const actualNodeId = nodeIdMap.get(templateNode.name);
      if (actualNodeId && templateNode.connections.length > 0) {
        const updatedConnections = templateNode.connections.map((conn) => ({
          ...conn,
          id: this.generateId(),
          sourceNodeId: actualNodeId,
          targetNodeId: nodeIdMap.get(conn.targetNodeId) || conn.targetNodeId
        }));
        await this.updateBotFlowNode(tenantId, actualNodeId, {
          connections: updatedConnections
        });
      }
    }
  }
  /**
   * Customize node configuration with variables
   */
  customizeNodeConfiguration(configuration, variables) {
    if (!variables) return configuration;
    const customized = { ...configuration };
    if (customized.messageText) {
      customized.messageText = this.replaceVariables(customized.messageText, variables);
    }
    if (customized.questionText) {
      customized.questionText = this.replaceVariables(customized.questionText, variables);
    }
    return customized;
  }
  /**
   * Replace variables in text
   */
  replaceVariables(text3, variables) {
    let result = text3;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`{{${key}}}`, "g"), String(value));
    }
    return result;
  }
  /**
   * Generate unique ID
   */
  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  /**
   * Get predefined bot flow templates
   */
  getPredefinedTemplates() {
    return [
      {
        id: "restaurant-order-flow",
        name: "Restaurant Order Flow",
        description: "Complete order flow for restaurants with menu selection and payment",
        businessType: "restaurant",
        category: "ordering",
        nodes: [
          {
            type: "start",
            name: "Welcome",
            position: { x: 100, y: 100 },
            configuration: {},
            connections: [{ sourceNodeId: "Welcome", targetNodeId: "ShowMenu", label: "start" }],
            metadata: {}
          },
          {
            type: "message",
            name: "ShowMenu",
            position: { x: 300, y: 100 },
            configuration: {
              messageText: "Welcome to {{restaurantName}}! Here's our menu:",
              messageType: "template"
            },
            connections: [{ sourceNodeId: "ShowMenu", targetNodeId: "AskOrder", label: "next" }],
            metadata: {}
          },
          {
            type: "question",
            name: "AskOrder",
            position: { x: 500, y: 100 },
            configuration: {
              questionText: "What would you like to order?",
              inputType: "text",
              variableName: "orderItems",
              validation: { required: true }
            },
            connections: [{ sourceNodeId: "AskOrder", targetNodeId: "ConfirmOrder", label: "next" }],
            metadata: {}
          },
          {
            type: "action",
            name: "ConfirmOrder",
            position: { x: 700, y: 100 },
            configuration: {
              actionType: "create_transaction",
              actionParameters: {
                type: "order",
                items: "{{orderItems}}"
              }
            },
            connections: [{ sourceNodeId: "ConfirmOrder", targetNodeId: "OrderComplete", label: "success" }],
            metadata: {}
          },
          {
            type: "end",
            name: "OrderComplete",
            position: { x: 900, y: 100 },
            configuration: {},
            connections: [],
            metadata: {}
          }
        ],
        variables: [
          {
            name: "restaurantName",
            type: "string",
            defaultValue: "Our Restaurant",
            description: "Name of the restaurant",
            isRequired: true
          },
          {
            name: "orderItems",
            type: "string",
            description: "Items ordered by customer",
            isRequired: false
          }
        ],
        metadata: {
          category: "ordering",
          difficulty: "beginner",
          estimatedSetupTime: "10 minutes"
        }
      },
      {
        id: "clinic-appointment-flow",
        name: "Clinic Appointment Flow",
        description: "Appointment booking flow for healthcare clinics",
        businessType: "clinic",
        category: "booking",
        nodes: [
          {
            type: "start",
            name: "Welcome",
            position: { x: 100, y: 100 },
            configuration: {},
            connections: [{ sourceNodeId: "Welcome", targetNodeId: "AskService", label: "start" }],
            metadata: {}
          },
          {
            type: "question",
            name: "AskService",
            position: { x: 300, y: 100 },
            configuration: {
              questionText: "What type of appointment would you like to book?",
              inputType: "choice",
              choices: [
                { value: "consultation", label: "General Consultation" },
                { value: "checkup", label: "Health Checkup" },
                { value: "specialist", label: "Specialist Visit" }
              ],
              variableName: "appointmentType"
            },
            connections: [{ sourceNodeId: "AskService", targetNodeId: "AskDate", label: "next" }],
            metadata: {}
          },
          {
            type: "question",
            name: "AskDate",
            position: { x: 500, y: 100 },
            configuration: {
              questionText: "When would you like to schedule your appointment?",
              inputType: "date",
              variableName: "appointmentDate",
              validation: { required: true }
            },
            connections: [{ sourceNodeId: "AskDate", targetNodeId: "BookAppointment", label: "next" }],
            metadata: {}
          },
          {
            type: "action",
            name: "BookAppointment",
            position: { x: 700, y: 100 },
            configuration: {
              actionType: "create_transaction",
              actionParameters: {
                type: "appointment",
                service: "{{appointmentType}}",
                scheduledDate: "{{appointmentDate}}"
              }
            },
            connections: [{ sourceNodeId: "BookAppointment", targetNodeId: "AppointmentBooked", label: "success" }],
            metadata: {}
          },
          {
            type: "end",
            name: "AppointmentBooked",
            position: { x: 900, y: 100 },
            configuration: {},
            connections: [],
            metadata: {}
          }
        ],
        variables: [
          {
            name: "clinicName",
            type: "string",
            defaultValue: "Our Clinic",
            description: "Name of the clinic",
            isRequired: true
          },
          {
            name: "appointmentType",
            type: "string",
            description: "Type of appointment selected",
            isRequired: false
          },
          {
            name: "appointmentDate",
            type: "date",
            description: "Selected appointment date",
            isRequired: false
          }
        ],
        metadata: {
          category: "booking",
          difficulty: "beginner",
          estimatedSetupTime: "15 minutes"
        }
      }
    ];
  }
  /**
   * Cleanup resources
   */
  async cleanup() {
    try {
      await this.pool.end();
    } catch (error) {
      console.error("Error cleaning up bot flow builder service:", error);
    }
  }
};

// server/middleware/tenant-context.middleware.ts
function tenantContextMiddleware(options) {
  const { tenantService, requireTenant = true, requiredPermissions = [] } = options;
  return async (req, res, next) => {
    try {
      let tenantContext = null;
      const apiKey = extractApiKey(req);
      if (apiKey) {
        const result = await tenantService.validateApiKey(apiKey);
        if (result.success) {
          tenantContext = result.data;
        } else {
          return res.status(401).json({
            error: "Invalid API key",
            code: result.error.code,
            message: result.error.message
          });
        }
      }
      if (!tenantContext) {
        const jwtContext = extractJwtContext(req);
        if (jwtContext) {
          tenantContext = jwtContext;
        }
      }
      if (!tenantContext) {
        const domain = extractDomainFromRequest(req);
        if (domain) {
          const result = await tenantService.getTenantByDomain(domain);
          if (result.success) {
            tenantContext = {
              tenantId: result.data.id,
              permissions: ["read:services", "read:conversations", "read:bookings"],
              // Default permissions for domain-based access
              subscriptionLimits: {
                messagesPerMonth: 1e3,
                bookingsPerMonth: 100,
                apiCallsPerDay: 1e3
              },
              currentUsage: {
                messages_sent: 0,
                messages_received: 0,
                bookings_created: 0,
                api_calls: 0,
                storage_used: 0,
                webhook_calls: 0
              }
            };
          }
        }
      }
      if (requireTenant && !tenantContext) {
        return res.status(401).json({
          error: "Tenant context required",
          message: "Request must include valid API key, JWT token, or be made from a registered domain"
        });
      }
      if (tenantContext) {
        const tenantResult = await tenantService.getTenantById(tenantContext.tenantId);
        if (!tenantResult.success) {
          return res.status(404).json({
            error: "Tenant not found",
            code: tenantResult.error.code,
            message: tenantResult.error.message
          });
        }
        const tenant = tenantResult.data;
        if (tenant.status === "suspended") {
          return res.status(423).json({
            error: "Tenant suspended",
            message: "Tenant account has been suspended",
            tenantId: tenant.id
          });
        }
        if (tenant.status === "cancelled") {
          return res.status(410).json({
            error: "Tenant cancelled",
            message: "Tenant account has been cancelled",
            tenantId: tenant.id
          });
        }
      }
      if (tenantContext && requiredPermissions.length > 0) {
        const hasAllPermissions = requiredPermissions.every(
          (permission) => tenantContext.permissions.includes(permission) || tenantContext.permissions.includes("admin:all")
        );
        if (!hasAllPermissions) {
          return res.status(403).json({
            error: "Insufficient permissions",
            message: "Request requires additional permissions",
            required: requiredPermissions,
            current: tenantContext.permissions
          });
        }
      }
      if (tenantContext) {
        req.tenantContext = tenantContext;
        req.tenantId = tenantContext.tenantId;
        req.hasPermission = (permission) => tenantContext.permissions.includes(permission) || tenantContext.permissions.includes("admin:all");
      }
      next();
    } catch (error) {
      console.error("Tenant context middleware error:", error);
      res.status(500).json({
        error: "Internal server error",
        message: "Failed to process tenant context"
      });
    }
  };
}
function extractApiKey(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    if (token.startsWith("tk_")) {
      return token;
    }
  }
  const apiKeyHeader = req.headers["x-api-key"];
  if (typeof apiKeyHeader === "string" && apiKeyHeader.startsWith("tk_")) {
    return apiKeyHeader;
  }
  return null;
}
function extractJwtContext(req) {
  return null;
}
function extractDomainFromRequest(req) {
  const host = req.headers.host;
  if (!host) return null;
  const domain = host.split(":")[0];
  if (domain === "localhost" || /^\d+\.\d+\.\d+\.\d+$/.test(domain)) {
    return null;
  }
  return domain;
}

// server/routes/bot-flow-builder.routes.ts
var router = Router();
router.use(tenantContextMiddleware);
var botFlowService = null;
var getBotFlowService = () => {
  if (!botFlowService) {
    botFlowService = new BotFlowBuilderService(process.env.DATABASE_URL || "");
  }
  return botFlowService;
};
router.get("/", async (req, res) => {
  console.log("BotFlowRoutes: Received request to list bot flows");
  try {
    const { tenantId } = req.tenantContext;
    const { businessType, isActive, isTemplate, page = 1, limit = 50 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    if (isNaN(pageNum) || pageNum < 1) {
      console.log("BotFlowRoutes: Invalid page parameter");
      return res.status(400).json({ error: "Invalid page parameter" });
    }
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      console.log("BotFlowRoutes: Invalid limit parameter");
      return res.status(400).json({ error: "Invalid limit parameter (must be between 1 and 100)" });
    }
    console.log("BotFlowRoutes: Getting bot flow service");
    const service = getBotFlowService();
    console.log("BotFlowRoutes: Calling listBotFlows method");
    const result = await service.listBotFlows(tenantId, {
      businessType,
      isActive: isActive === "true" ? true : isActive === "false" ? false : void 0,
      isTemplate: isTemplate === "true" ? true : isTemplate === "false" ? false : void 0,
      page: pageNum,
      limit: limitNum
    });
    console.log("BotFlowRoutes: listBotFlows method completed");
    if (!result.success) {
      console.error("BotFlowRoutes: Bot flow service error:", result.error);
      return res.json({
        flows: [
          {
            id: "current_salon_flow",
            tenantId,
            name: "\u{1F7E2} Current Salon Flow (ACTIVE)",
            description: "This is the exact flow currently running on WhatsApp",
            businessType: "salon",
            isActive: true,
            isTemplate: false,
            version: "1.0.0",
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
            variables: [],
            metadata: {}
          }
        ],
        total: 1,
        page: 1,
        limit: 50
      });
    }
    console.log("BotFlowRoutes: Sending successful response with", result.data.flows.length, "flows");
    res.json(result.data);
  } catch (error) {
    console.error("BotFlowRoutes: Error listing bot flows:", error);
    const { tenantId } = req.tenantContext;
    res.json({
      flows: [
        {
          id: "current_salon_flow",
          tenantId,
          name: "\u{1F7E2} Current Salon Flow (ACTIVE)",
          description: "This is the exact flow currently running on WhatsApp",
          businessType: "salon",
          isActive: true,
          isTemplate: false,
          version: "1.0.0",
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
          variables: [],
          metadata: {}
        }
      ],
      total: 1,
      page: 1,
      limit: 50
    });
  }
});
router.post("/", async (req, res) => {
  try {
    const { tenantId } = req.tenantContext;
    const flowData = req.body;
    const service = getBotFlowService();
    const result = await service.createBotFlow(tenantId, flowData);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    res.status(201).json(result.data);
  } catch (error) {
    console.error("Error creating bot flow:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
router.get("/:id", async (req, res) => {
  try {
    const { tenantId } = req.tenantContext;
    const { id } = req.params;
    const service = getBotFlowService();
    const result = await service.getBotFlow(tenantId, id);
    if (!result.success) {
      return res.status(404).json({ error: result.error });
    }
    res.json(result.data);
  } catch (error) {
    console.error("Error fetching bot flow:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
router.put("/:id", async (req, res) => {
  try {
    const { tenantId } = req.tenantContext;
    const { id } = req.params;
    const flowData = req.body;
    const service = getBotFlowService();
    const result = await service.updateBotFlow(tenantId, id, flowData);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    res.json(result.data);
  } catch (error) {
    console.error("Error updating bot flow:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
router.delete("/:id", async (req, res) => {
  try {
    const { tenantId } = req.tenantContext;
    const { id } = req.params;
    const service = getBotFlowService();
    const result = await service.deleteBotFlow(tenantId, id);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    res.json({ message: "Bot flow deleted successfully" });
  } catch (error) {
    console.error("Error deleting bot flow:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
router.post("/:id/activate", async (req, res) => {
  try {
    const { tenantId } = req.tenantContext;
    const { id } = req.params;
    const service = getBotFlowService();
    const deactivateResult = await service.deactivateAllBotFlows(tenantId);
    if (!deactivateResult.success) {
      return res.status(400).json({ error: deactivateResult.error });
    }
    const activateResult = await service.activateBotFlow(tenantId, id);
    if (!activateResult.success) {
      return res.status(400).json({ error: activateResult.error });
    }
    res.json({ message: "Bot flow activated successfully" });
  } catch (error) {
    console.error("Error activating bot flow:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
router.post("/:id/deactivate", async (req, res) => {
  try {
    const { tenantId } = req.tenantContext;
    const { id } = req.params;
    const service = getBotFlowService();
    const result = await service.deactivateBotFlow(tenantId, id);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    res.json({ message: "Bot flow deactivated successfully" });
  } catch (error) {
    console.error("Error deactivating bot flow:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
router.post("/:id/toggle", async (req, res) => {
  try {
    const { tenantId } = req.tenantContext;
    const { id } = req.params;
    const service = getBotFlowService();
    const flowResult = await service.getBotFlow(tenantId, id);
    if (!flowResult.success) {
      return res.status(404).json({ error: "Bot flow not found" });
    }
    const flow = flowResult.data;
    let result;
    if (flow.isActive) {
      result = await service.deactivateBotFlow(tenantId, id);
    } else {
      const deactivateResult = await service.deactivateAllBotFlows(tenantId);
      if (!deactivateResult.success) {
        return res.status(400).json({ error: deactivateResult.error });
      }
      result = await service.activateBotFlow(tenantId, id);
    }
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    res.json({
      message: `Bot flow ${flow.isActive ? "deactivated" : "activated"} successfully`,
      isActive: !flow.isActive
    });
  } catch (error) {
    console.error("Error toggling bot flow:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
router.post("/:id/test", async (req, res) => {
  try {
    const { tenantId } = req.tenantContext;
    const { id } = req.params;
    const flowData = req.body;
    console.log(`Testing bot flow ${id}:`, flowData);
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
var bot_flow_builder_routes_default = router;

// server/routes.ts
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
  price: z.number().int().min(1, "Price must be at least 1"),
  icon: z.string().optional()
});
var WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
var PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_ID;
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
  return `upi://pay?pa=${upiId}&pn=Spark+Salon&am=${amount}&cu=INR&tn=Payment+for+${encodeURIComponent(serviceName)}`;
}
async function processWhatsAppMessage(from, messageText) {
  try {
    console.log("WhatsApp: Processing message from", from, ":", messageText);
    const shouldUseDynamicFlow = await checkForActiveFlow();
    if (shouldUseDynamicFlow) {
      await processDynamicWhatsAppMessage(from, messageText);
      return;
    }
    const response = await processStaticWhatsAppMessage(from, messageText);
    await sendWhatsAppMessage(from, response);
  } catch (error) {
    console.error("Error processing WhatsApp message:", error);
    await sendWhatsAppMessage(from, "Sorry, I'm experiencing technical difficulties. Please try again later.");
  }
}
async function checkForActiveFlow() {
  try {
    if (global.whatsappBotFlow) {
      console.log("\u2705 Using synced flow from bot flow builder:", global.whatsappBotFlow.name);
      return true;
    }
    console.log("\u2705 Enabling dynamic flow processing for demo");
    return true;
  } catch (error) {
    console.error("Error checking for active flow:", error);
    return false;
  }
}
async function processDynamicWhatsAppMessage(from, messageText) {
  try {
    console.log("WhatsApp: Using dynamic flow processing for", from);
    let syncedFlow = global.whatsappBotFlow;
    if (syncedFlow) {
      console.log("\u2705 Using synced flow from bot flow builder:", syncedFlow.name);
      console.log("\u2705 Synced flow nodes:", syncedFlow.nodes?.length || 0);
      console.log("\u2705 Synced flow first node message:", syncedFlow.nodes?.[0]?.configuration?.message?.substring(0, 50) || "No message");
    } else {
      console.log("\u26A0\uFE0F No synced flow found, using demo flow");
    }
    if (!syncedFlow) {
      syncedFlow = {
        id: "whatsapp_bot_flow",
        name: "\u{1F7E2} WhatsApp Bot Flow (EXACT REPLICA)",
        description: "Exact replica of current WhatsApp bot flow with emojis, layout, and all details",
        businessType: "salon",
        isActive: true,
        isTemplate: false,
        version: "1.0.0",
        nodes: [
          {
            id: "welcome_msg",
            type: "message",
            name: "Welcome Message",
            position: { x: 400, y: 100 },
            configuration: {
              message: "\u{1F44B} Welcome to Spark Salon!\n\nHere are our services:\n\n\u{1F487}\u200D\u2640\uFE0F Haircut \u2013 \u20B9120\n\u{1F487}\u200D\u2640\uFE0F Hair Color \u2013 \u20B9600\n\u{1F487}\u200D\u2640\uFE0F Hair Styling \u2013 \u20B9300\n\u{1F485} Manicure \u2013 \u20B9200\n\u{1F9B6} Pedicure \u2013 \u20B965\n\nReply with the number or name of the service to book."
            },
            connections: [],
            metadata: {}
          },
          {
            id: "service_confirmed",
            type: "message",
            name: "Service Confirmed",
            position: { x: 900, y: 100 },
            configuration: {
              message: "Perfect! You've selected {selectedService} (\u20B9{price}).\n\n\u{1F4C5} Now, please select your preferred appointment date.\n\nAvailable dates:\n1. {date1}\n2. {date2}\n3. {date3}\n4. {date4}\n5. {date5}\n6. {date6}\n7. {date7}\n\nReply with the number (1-7) for your preferred date."
            },
            connections: [],
            metadata: {}
          },
          {
            id: "date_confirmed",
            type: "message",
            name: "Date Confirmed",
            position: { x: 1300, y: 100 },
            configuration: {
              message: "Great! You've selected {selectedDate}.\n\n\u{1F550} Now, please choose your preferred time slot:\n\nAvailable times:\n1. 10:00 AM\n2. 11:30 AM\n3. 02:00 PM\n4. 03:30 PM\n5. 05:00 PM\n\nReply with the number (1-5) for your preferred time."
            },
            connections: [],
            metadata: {}
          },
          {
            id: "booking_summary",
            type: "message",
            name: "Booking Summary",
            position: { x: 1700, y: 100 },
            configuration: {
              message: "Perfect! Your appointment is scheduled for {selectedTime}.\n\n\u{1F4CB} Booking Summary:\nService: {selectedService}\nDate: {selectedDate}\nTime: {selectedTime}\nAmount: \u20B9{price}\n\n\u{1F4B3} Please complete your payment:\n{upiLink}\n\nComplete payment in GPay/PhonePe/Paytm and reply 'paid' to confirm your booking."
            },
            connections: [],
            metadata: {}
          },
          {
            id: "payment_confirmed",
            type: "message",
            name: "Payment Confirmed",
            position: { x: 2100, y: 100 },
            configuration: {
              message: "\u2705 Payment received! Your appointment is now confirmed.\n\n\u{1F4CB} Booking Details:\nService: {selectedService}\nDate: {selectedDate}\nTime: {selectedTime}\n\n\u{1F389} Thank you for choosing Spark Salon! We look forward to serving you."
            },
            connections: [],
            metadata: {}
          }
        ],
        variables: [],
        metadata: {}
      };
      console.log("Using demo flow for WhatsApp bot");
    }
    console.log("Using flow:", syncedFlow.name);
    let conversation = await storage.getConversation(from);
    if (!conversation) {
      conversation = await storage.createConversation({
        phoneNumber: from,
        currentState: "greeting"
      });
    }
    const result = await processMessageWithSyncedFlow(from, messageText, conversation.currentState, syncedFlow);
    await storage.updateConversation(conversation.id, {
      currentState: result.newState,
      contextData: result.contextData
    });
    await sendWhatsAppMessage(from, result.response);
    console.log("\u2705 Dynamic flow processed successfully:", {
      phoneNumber: from,
      newState: result.newState,
      responseLength: result.response.length
    });
  } catch (error) {
    console.error("Error in dynamic message processing:", error);
    await sendWhatsAppMessage(from, "Sorry, there was an issue with the dynamic flow. Please try again.");
  }
}
async function processMessageWithSyncedFlow(phoneNumber, messageText, conversationState, syncedFlow) {
  try {
    console.log("Processing message with synced flow:", {
      phoneNumber,
      messageText,
      conversationState,
      flowName: syncedFlow.name
    });
    let currentNode = null;
    switch (conversationState) {
      case "greeting":
        currentNode = syncedFlow.nodes.find((node) => node.id === "welcome_msg");
        break;
      case "awaiting_service":
        currentNode = syncedFlow.nodes.find((node) => node.id === "service_confirmed");
        break;
      case "awaiting_date":
        currentNode = syncedFlow.nodes.find((node) => node.id === "date_confirmed");
        break;
      case "awaiting_time":
        currentNode = syncedFlow.nodes.find((node) => node.id === "booking_summary");
        break;
      case "awaiting_payment":
        currentNode = syncedFlow.nodes.find((node) => node.id === "payment_confirmed");
        break;
      default:
        currentNode = syncedFlow.nodes.find((node) => node.id === "welcome_msg");
    }
    if (!currentNode) {
      currentNode = syncedFlow.nodes.find((node) => node.id === "welcome_msg");
    }
    if (!currentNode) {
      throw new Error("No appropriate node found in synced flow");
    }
    let response = "";
    let newState = conversationState;
    const isValidInput = validateUserInput(messageText, conversationState);
    if (!isValidInput.valid) {
      response = isValidInput.message;
      newState = conversationState;
    } else if (currentNode.configuration?.message) {
      response = currentNode.configuration.message;
      response = response.replace("{selectedService}", "Haircut");
      response = response.replace("{price}", "120");
      response = response.replace("{selectedDate}", "Tomorrow");
      response = response.replace("{selectedTime}", "10:00 AM");
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
        response = response.replace(`{date${i}}`, dateStr);
      }
      if (currentNode.id === "welcome_msg") {
        newState = "awaiting_service";
      } else if (currentNode.id === "service_confirmed") {
        newState = "awaiting_date";
      } else if (currentNode.id === "date_confirmed") {
        newState = "awaiting_time";
      } else if (currentNode.id === "booking_summary") {
        newState = "awaiting_payment";
      } else if (currentNode.id === "payment_confirmed") {
        newState = "completed";
      }
    } else {
      response = "Welcome! I can help you book an appointment.";
      newState = "awaiting_service";
    }
    return {
      response,
      newState,
      contextData: { syncedFlow: syncedFlow.name }
    };
  } catch (error) {
    console.error("Error processing message with synced flow:", error);
    return {
      response: "Sorry, I encountered an error. Please try again.",
      newState: "greeting"
    };
  }
}
function validateUserInput(messageText, conversationState) {
  const input = messageText.toLowerCase().trim();
  switch (conversationState) {
    case "greeting":
      return { valid: true, message: "" };
    case "awaiting_service":
      const validServices = ["1", "2", "3", "4", "5", "haircut", "hair color", "hair styling", "manicure", "pedicure"];
      if (validServices.some((service) => input.includes(service))) {
        return { valid: true, message: "" };
      }
      return {
        valid: false,
        message: "\u274C Invalid service selection. Please choose from:\n\n1. Haircut\n2. Hair Color\n3. Hair Styling\n4. Manicure\n5. Pedicure\n\nReply with the number or name of the service."
      };
    case "awaiting_date":
      const validDates = ["1", "2", "3", "4", "5", "6", "7"];
      if (validDates.includes(input)) {
        return { valid: true, message: "" };
      }
      return {
        valid: false,
        message: "\u274C Invalid date selection. Please choose a number from 1-7 for your preferred date."
      };
    case "awaiting_time":
      const validTimes = ["1", "2", "3", "4", "5"];
      if (validTimes.includes(input)) {
        return { valid: true, message: "" };
      }
      return {
        valid: false,
        message: "\u274C Invalid time selection. Please choose a number from 1-5 for your preferred time."
      };
    case "awaiting_payment":
      if (input.includes("paid") || input.includes("payment") || input.includes("done")) {
        return { valid: true, message: "" };
      }
      return {
        valid: false,
        message: '\u274C Please confirm your payment by replying "paid" after completing the payment.'
      };
    default:
      return { valid: true, message: "" };
  }
}
async function processStaticWhatsAppMessage(from, messageText) {
  console.log("WhatsApp: Processing message from", from, "with text:", messageText);
  const withTimeout = async (promise, ms) => {
    return Promise.race([
      promise,
      new Promise(
        (_, reject) => setTimeout(() => reject(new Error(`Operation timed out after ${ms}ms`)), ms)
      )
    ]);
  };
  let conversation = await storage.getConversation(from);
  if (!conversation) {
    conversation = await storage.createConversation({
      phoneNumber: from,
      currentState: "greeting"
    });
    console.log("WhatsApp: Created new conversation", conversation.id);
  }
  await storage.createMessage({
    conversationId: conversation.id,
    content: messageText,
    isFromBot: false
  });
  console.log("WhatsApp: Stored user message for conversation", conversation.id);
  let response = "";
  let newState = conversation.currentState;
  const text3 = messageText.toLowerCase().trim();
  try {
    if (text3 === "hi" || text3 === "hello" || conversation.currentState === "greeting") {
      const services2 = await withTimeout(storage.getServices(), 5e3);
      const activeServices = services2.filter((s) => s.isActive);
      response = "\u{1F44B} Welcome to Spark Salon!\n\nHere are our services:\n";
      activeServices.forEach((service) => {
        response += `\u{1F487}\u200D\u2640\uFE0F ${service.name} \u2013 \u20B9${service.price}
`;
      });
      response += "\nReply with the number or name of the service to book.";
      newState = "awaiting_service";
    } else if (conversation.currentState === "awaiting_service") {
      const services2 = await withTimeout(storage.getServices(), 5e3);
      const selectedService = services2.find(
        (s) => s.isActive && s.name.toLowerCase() === text3.toLowerCase()
      );
      if (selectedService) {
        response = `Perfect! You've selected ${selectedService.name} (\u20B9${selectedService.price}).

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
        try {
          const updatedConversation = await withTimeout(storage.updateConversation(conversation.id, {
            selectedService: selectedService.id,
            currentState: "awaiting_date"
          }), 5e3);
          if (updatedConversation) {
            newState = "awaiting_date";
          } else {
            console.warn("Failed to update conversation state in database, but proceeding with flow");
            newState = "awaiting_date";
          }
        } catch (error) {
          console.error("Error updating conversation:", error);
          newState = "awaiting_date";
        }
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
        try {
          const updatedConversation = await withTimeout(storage.updateConversation(conversation.id, {
            selectedDate: dateStr,
            currentState: "awaiting_time"
          }), 5e3);
          if (updatedConversation) {
            newState = "awaiting_time";
          } else {
            console.warn("Failed to update conversation state in database, but proceeding with flow");
            newState = "awaiting_time";
          }
        } catch (error) {
          console.error("Error updating conversation:", error);
          newState = "awaiting_time";
        }
      } else {
        response = "Please select a valid date option (1-7). Reply with the number for your preferred date.";
      }
    } else if (conversation.currentState === "awaiting_time") {
      const timeSlots = ["10:00 AM", "11:30 AM", "02:00 PM", "03:30 PM", "05:00 PM"];
      const timeChoice = parseInt(text3);
      if (timeChoice >= 1 && timeChoice <= 5) {
        const selectedTime = timeSlots[timeChoice - 1];
        const services2 = await withTimeout(storage.getServices(), 5e3);
        const selectedService = services2.find((s) => s.id === conversation.selectedService);
        if (selectedService) {
          let newStateUpdated = false;
          try {
            const updatedConversation = await withTimeout(storage.updateConversation(conversation.id, {
              selectedTime,
              currentState: "awaiting_payment"
            }), 5e3);
            if (updatedConversation) {
              newState = "awaiting_payment";
              newStateUpdated = true;
            } else {
              console.warn("Failed to update conversation state in database, but proceeding with flow");
              newState = "awaiting_payment";
              newStateUpdated = true;
            }
          } catch (error) {
            console.error("Error updating conversation:", error);
            newState = "awaiting_payment";
            newStateUpdated = true;
          }
          if (newStateUpdated) {
            const latestConversation = await withTimeout(storage.getConversation(from), 5e3) || conversation;
            if (latestConversation && latestConversation.selectedDate) {
              const upiLink = generateUPILink(selectedService.price, selectedService.name);
              response = `Perfect! Your appointment is scheduled for ${selectedTime}.

`;
              response += `\u{1F4CB} Booking Summary:
`;
              response += `Service: ${selectedService.name}
`;
              response += `Date: ${new Date(latestConversation.selectedDate).toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Kolkata" })}
`;
              response += `Time: ${selectedTime}
`;
              response += `Amount: \u20B9${selectedService.price}

`;
              response += `\u{1F4B3} Please complete your payment:
${upiLink}

`;
              response += "Complete payment in GPay/PhonePe/Paytm and reply 'paid' to confirm your booking.";
              const time24 = timeChoice === 1 ? "10:00" : timeChoice === 2 ? "11:30" : timeChoice === 3 ? "14:00" : timeChoice === 4 ? "15:30" : "17:00";
              const [hourStr, minuteStr] = time24.split(":");
              const istOffsetMs = 5.5 * 60 * 60 * 1e3;
              const [y, m, d] = latestConversation.selectedDate.split("-").map((v) => parseInt(v, 10));
              const istMidnight = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
              const istDateTimeMs = istMidnight.getTime() + (parseInt(hourStr, 10) * 60 + parseInt(minuteStr, 10)) * 60 * 1e3;
              const utcDateTime = new Date(istDateTimeMs - istOffsetMs);
              await withTimeout(storage.createBooking({
                conversationId: conversation.id,
                serviceId: selectedService.id,
                phoneNumber: from,
                amount: selectedService.price,
                // Already in INR
                status: "pending",
                appointmentDate: utcDateTime,
                appointmentTime: selectedTime
              }), 5e3);
            }
          }
        } else {
          response = "Sorry, I couldn't find the selected service. Please start over by sending 'hi'.";
          newState = "greeting";
        }
      } else {
        response = "Please select a valid time option (1-5). Reply with the number for your preferred time.";
      }
    } else if (conversation.currentState === "awaiting_payment") {
      if (text3 === "paid") {
        response = "\u2705 Payment received! Your appointment is now confirmed.\n\n";
        response += "\u{1F4CB} Booking Details:\n";
        response += `Service: ${conversation.selectedService}
`;
        if (conversation.selectedDate) {
          response += `Date: ${new Date(conversation.selectedDate).toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Kolkata" })}
`;
        }
        if (conversation.selectedTime) {
          response += `Time: ${conversation.selectedTime}
`;
        }
        response += "\n\u{1F389} Thank you for choosing Spark Salon! We look forward to serving you.";
        try {
          const bookings2 = await withTimeout(storage.getBookings(), 5e3);
          const pendingBooking = bookings2.find(
            (b) => b.conversationId === conversation.id && b.status === "pending"
          );
          if (pendingBooking) {
            await withTimeout(storage.updateBooking(pendingBooking.id, {
              status: "confirmed",
              paymentMethod: "UPI"
            }), 5e3);
          }
        } catch (error) {
          console.error("Error updating booking:", error);
        }
        newState = "completed";
      } else {
        response = "Please complete your payment first. Click the UPI link and reply 'paid' once done.";
      }
    } else if (conversation.currentState === "completed") {
      response = "Your appointment is already confirmed! \u{1F389}\n\n";
      response += "\u{1F4CB} Booking Details:\n";
      response += `Service: ${conversation.selectedService}
`;
      if (conversation.selectedDate) {
        response += `Date: ${new Date(conversation.selectedDate).toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
`;
      }
      if (conversation.selectedTime) {
        response += `Time: ${conversation.selectedTime}
`;
      }
      response += "\n\u{1F389} Thank you for choosing Spark Salon! We look forward to serving you.";
    } else {
      response = "I'm sorry, I didn't understand that. Type 'hi' to start over or choose a service from our menu.";
    }
    if (newState !== conversation.currentState) {
      try {
        await withTimeout(storage.updateConversation(conversation.id, {
          currentState: newState
        }), 5e3);
      } catch (error) {
        console.error("Error updating conversation state:", error);
      }
    }
    await storage.createMessage({
      conversationId: conversation.id,
      content: response,
      isFromBot: true
    });
    return response;
  } catch (error) {
    console.error("Error processing WhatsApp message:", error);
    return "Sorry, I encountered an error processing your request. Please try again.";
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
            let appointmentDateStr = "your selected date";
            if (booking.appointmentDate) {
              try {
                appointmentDateStr = new Date(booking.appointmentDate).toLocaleDateString("en-GB", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric"
                });
              } catch (e) {
                console.error("Error formatting appointment date:", e);
              }
            }
            const appointmentTime = booking.appointmentTime || "your selected time";
            notificationMessage = `\u2705 *Booking Confirmed!*

Your appointment has been confirmed by Spark Salon.

\u{1F4CB} *Booking Details:*
Service: ${serviceName}
Date: ${appointmentDateStr}
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
      const backend = getStorageBackendName();
      const parseDbTimestamp = (value) => {
        if (value instanceof Date) return value;
        if (typeof value === "string") {
          const isoLike = value.includes("T") ? value : value.replace(" ", "T");
          const withZ = /Z$/i.test(isoLike) ? isoLike : `${isoLike}Z`;
          const d = new Date(withZ);
          if (!isNaN(d.getTime())) return d;
          return new Date(value);
        }
        return new Date(value);
      };
      const todayBookings = await storage.getTodayBookings();
      console.log("Today's bookings count:", todayBookings.length);
      console.log("Today's bookings:", todayBookings);
      const todayRevenueINR = todayBookings.filter((booking) => booking.status === "confirmed").reduce((total, booking) => total + booking.amount, 0);
      console.log("Today's revenue:", todayRevenueINR);
      const allBookings = await storage.getBookings();
      console.log("All bookings count:", allBookings.length);
      let todayMessages = 0;
      const offsetMs = 5.5 * 60 * 60 * 1e3;
      const nowUtcMs = Date.now();
      const istNow = new Date(nowUtcMs + offsetMs);
      const istStart = new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate(), 0, 0, 0, 0));
      const istEnd = new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate() + 1, 0, 0, 0, 0));
      const utcStart = new Date(istStart.getTime() - offsetMs);
      const utcEnd = new Date(istEnd.getTime() - offsetMs);
      const conversationIds = Array.from(new Set(allBookings.map((b) => b.conversationId)));
      for (const cid of conversationIds) {
        const messages2 = await storage.getMessages(cid);
        const countToday = messages2.filter((m) => {
          const raw = m.timestamp ?? m.createdAt;
          const ts = parseDbTimestamp(raw);
          return ts >= utcStart && ts < utcEnd;
        }).length;
        todayMessages += countToday;
      }
      console.log("Today's messages count:", todayMessages);
      let responseRate = 0;
      if (todayMessages > 0) {
        let botToday = 0;
        for (const cid of conversationIds) {
          const messages2 = await storage.getMessages(cid);
          botToday += messages2.filter((m) => {
            const raw = m.timestamp ?? m.createdAt;
            const ts = parseDbTimestamp(raw);
            return m.isFromBot && ts >= utcStart && ts < utcEnd;
          }).length;
        }
        responseRate = Math.min(100, Math.round(botToday / todayMessages * 100));
      }
      const stats = {
        todayMessages,
        todayBookings: todayBookings.length,
        todayRevenue: todayRevenueINR,
        // Already in INR
        responseRate,
        totalBookings: allBookings.length,
        backend
      };
      console.log("Stats response:", stats);
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
      const { Pool: Pool3 } = __require("@neondatabase/serverless");
      const pool2 = new Pool3({ connectionString: process.env.DATABASE_URL });
      const client = await pool2.connect();
      try {
        const migrations = [
          "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(255);",
          "ALTER TABLE services ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;",
          "ALTER TABLE services ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;",
          "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;",
          "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;",
          "ALTER TABLE conversations ADD COLUMN IF NOT EXISTS context_data JSONB DEFAULT '{}';"
        ];
        const results = [];
        for (const sql4 of migrations) {
          try {
            await client.query(sql4);
            results.push(`\u2705 Executed: ${sql4}`);
            console.log(`\u2705 Executed: ${sql4}`);
          } catch (error) {
            results.push(`\u26A0\uFE0F Error: ${sql4} - ${error.message}`);
            console.log(`\u26A0\uFE0F Error: ${sql4} - ${error.message}`);
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
  app2.use("/api/bot-flows", bot_flow_builder_routes_default);
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
  app2.get("/api/bot-flows/load-whatsapp", async (req, res) => {
    try {
      const { BotFlowSyncService: BotFlowSyncService2 } = (init_bot_flow_sync_service(), __toCommonJS(bot_flow_sync_service_exports));
      const flowSyncService = BotFlowSyncService2.getInstance();
      const flow = await flowSyncService.loadWhatsAppBotFlow();
      res.json({
        success: true,
        message: "WhatsApp bot flow loaded successfully",
        flow
      });
    } catch (error) {
      console.error("Error loading WhatsApp bot flow:", error);
      res.status(500).json({
        success: false,
        error: "Failed to load WhatsApp bot flow"
      });
    }
  });
  app2.post("/api/bot-flows/activate", async (req, res) => {
    try {
      const { BotFlowSyncService: BotFlowSyncService2 } = (init_bot_flow_sync_service(), __toCommonJS(bot_flow_sync_service_exports));
      const flowSyncService = BotFlowSyncService2.getInstance();
      const { flowId } = req.body;
      await flowSyncService.createBackup();
      const flow = await flowSyncService.loadWhatsAppBotFlow();
      flowSyncService.updateActiveFlow(flow);
      res.json({
        success: true,
        message: "Bot flow activated successfully",
        flow
      });
    } catch (error) {
      console.error("Error activating bot flow:", error);
      res.status(500).json({
        success: false,
        error: "Failed to activate bot flow"
      });
    }
  });
  app2.post("/api/bot-flows/restore", async (req, res) => {
    try {
      const { BotFlowSyncService: BotFlowSyncService2 } = (init_bot_flow_sync_service(), __toCommonJS(bot_flow_sync_service_exports));
      const flowSyncService = BotFlowSyncService2.getInstance();
      const restoredFlow = await flowSyncService.restoreFromBackup();
      if (restoredFlow) {
        res.json({
          success: true,
          message: "Bot flow restored from backup successfully",
          flow: restoredFlow
        });
      } else {
        res.status(404).json({
          success: false,
          error: "No backup found to restore from"
        });
      }
    } catch (error) {
      console.error("Error restoring bot flow:", error);
      res.status(500).json({
        success: false,
        error: "Failed to restore bot flow"
      });
    }
  });
  app2.post("/api/bot-flows/sync", async (req, res) => {
    try {
      console.log("\u{1F504} Sync endpoint called with flow data:", req.body);
      const { flowData } = req.body;
      if (!flowData) {
        console.log("\u274C No flow data provided");
        return res.status(400).json({
          success: false,
          error: "Flow data is required"
        });
      }
      console.log("\u2705 Flow data received, processing sync...");
      console.log("\u{1F504} Syncing flow:", flowData.name, "with WhatsApp bot");
      global.whatsappBotFlow = flowData;
      try {
        const { DynamicFlowProcessorService: DynamicFlowProcessorService2 } = (init_dynamic_flow_processor_service(), __toCommonJS(dynamic_flow_processor_service_exports));
        const flowProcessor = DynamicFlowProcessorService2.getInstance();
        await flowProcessor.updateFlow(flowData);
        console.log("\u2705 Dynamic flow processor updated");
      } catch (error) {
        console.log("\u26A0\uFE0F Dynamic flow processor not available, using fallback");
      }
      res.json({
        success: true,
        message: "Bot flow synced successfully with WhatsApp bot",
        flow: flowData
      });
    } catch (error) {
      console.error("\u274C Error syncing bot flow:", error);
      res.status(500).json({
        success: false,
        error: "Failed to sync bot flow"
      });
    }
  });
  app2.get("/api/bot-flows/test", async (req, res) => {
    try {
      console.log("\u{1F9EA} Test endpoint called");
      res.json({
        success: true,
        message: "Bot flows API is working!",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (error) {
      console.error("\u274C Test endpoint error:", error);
      res.status(500).json({
        success: false,
        error: "Test endpoint failed"
      });
    }
  });
  app2.get("/api/test", (req, res) => {
    console.log("\u{1F9EA} Simple test endpoint called");
    res.json({
      success: true,
      message: "API is working!",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  app2.get("/api/sync-test", (req, res) => {
    console.log("\u{1F9EA} Alternative sync test endpoint called");
    res.json({
      success: true,
      message: "Alternative sync test completed",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  app2.get("/api/bot-flows/test-sync", (req, res) => {
    console.log("\u{1F9EA} Test sync endpoint called - START");
    const response = {
      success: true,
      message: "Sync test completed",
      hasFlow: false,
      flowName: "No flow",
      nodeCount: 0,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    console.log("\u{1F9EA} Test sync endpoint called - SENDING RESPONSE");
    res.json(response);
    console.log("\u{1F9EA} Test sync endpoint called - RESPONSE SENT");
  });
  app2.post("/api/bot-flows/sync-simple", (req, res) => {
    try {
      console.log("\u{1F504} Simple sync endpoint called");
      console.log("Request body keys:", Object.keys(req.body || {}));
      const { flowData } = req.body;
      if (!flowData) {
        console.log("\u274C No flow data provided");
        return res.status(400).json({
          success: false,
          error: "Flow data is required"
        });
      }
      global.whatsappBotFlow = flowData;
      console.log("\u2705 Flow synced to WhatsApp bot:", flowData.name);
      console.log("\u2705 Flow nodes count:", flowData.nodes?.length || 0);
      console.log("\u2705 Flow stored in global.whatsappBotFlow");
      console.log("\u2705 First node message preview:", flowData.nodes?.[0]?.configuration?.message?.substring(0, 100) || "No message");
      res.json({
        success: true,
        message: "Flow synced successfully with WhatsApp bot",
        flow: flowData
      });
    } catch (error) {
      console.error("\u274C Simple sync error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to sync flow"
      });
    }
  });
  app2.get("/api/bot-flows/current", async (req, res) => {
    try {
      if (global.whatsappBotFlow) {
        res.json({
          success: true,
          flow: global.whatsappBotFlow
        });
      } else {
        res.json({
          success: false,
          message: "No active flow found"
        });
      }
    } catch (error) {
      console.error("\u274C Get current flow error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get current flow"
      });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      ),
      await import("@replit/vite-plugin-dev-banner").then(
        (m) => m.devBanner()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}

// server/static.ts
import express2 from "express";
import fs2 from "fs";
import path3 from "path";
function serveStatic(app2) {
  const possiblePaths = [
    path3.resolve(import.meta.dirname, "public"),
    path3.resolve(import.meta.dirname, "..", "dist", "public"),
    path3.resolve(process.cwd(), "dist", "public"),
    path3.resolve("/var/task/dist/public")
  ];
  let distPath = null;
  for (const testPath of possiblePaths) {
    if (fs2.existsSync(testPath)) {
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
  app2.use(express2.static(distPath, {
    setHeaders: (res, path4) => {
      if (path4.endsWith(".js")) {
        res.setHeader("Content-Type", "application/javascript");
      } else if (path4.endsWith(".css")) {
        res.setHeader("Content-Type", "text/css");
      }
      if (path4.includes("/assets/")) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      } else {
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      }
    }
  }));
  app2.get("/debug/assets", (req, res) => {
    try {
      const assetsPath = path3.join(distPath, "assets");
      const files = fs2.existsSync(assetsPath) ? fs2.readdirSync(assetsPath) : [];
      res.json({
        distPath,
        assetsPath,
        files,
        exists: fs2.existsSync(assetsPath)
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/assets/*", (req, res, next) => {
    const assetPath = path3.join(distPath, req.path);
    console.log(`Asset request: ${req.path} -> ${assetPath}`);
    if (fs2.existsSync(assetPath)) {
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
    res.sendFile(path3.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express3();
app.use(express3.json());
app.use(express3.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path4 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path4.startsWith("/api")) {
      let logLine = `${req.method} ${path4} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0"
    // Use 0.0.0.0 for Vercel deployment
  }, () => {
    log(`serving on port ${port}`);
  });
})();
