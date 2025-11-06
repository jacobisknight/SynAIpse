import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Organizations for multi-tenancy
export const organizations = pgTable("organizations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true,
  createdAt: true,
});

export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type Organization = typeof organizations.$inferSelect;

// Agent types
export const agentTypeEnum = z.enum(["voice", "workflow", "data"]);
export const agentStatusEnum = z.enum(["active", "idle", "processing", "error", "stopped"]);

// Agents
export const agents = pgTable("agents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull(),
  parentAgentId: varchar("parent_agent_id"), // For sub-agents
  name: text("name").notNull(),
  type: text("type").notNull(), // voice, workflow, data
  status: text("status").notNull().default("idle"), // active, idle, processing, error, stopped
  persona: text("persona"), // Agent personality/voice
  goals: text("goals").array(), // Agent objectives
  triggers: text("triggers").array(), // Event triggers
  configuration: jsonb("configuration"), // Additional config
  isSubAgent: boolean("is_sub_agent").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastActiveAt: timestamp("last_active_at"),
});

export const insertAgentSchema = createInsertSchema(agents).omit({
  id: true,
  createdAt: true,
  lastActiveAt: true,
}).extend({
  goals: z.array(z.string()).optional(),
  triggers: z.array(z.string()).optional(),
  configuration: z.record(z.any()).optional(),
});

export type InsertAgent = z.infer<typeof insertAgentSchema>;
export type Agent = typeof agents.$inferSelect;

// Tasks
export const taskStatusEnum = z.enum(["pending", "in_progress", "completed", "failed", "cancelled"]);

export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id").notNull(),
  parentTaskId: varchar("parent_task_id"), // For sub-tasks
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("pending"),
  result: text("result"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

// Integrations
export const integrations = pgTable("integrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull(),
  name: text("name").notNull(), // Salesforce, SAP, ServiceNow, etc.
  type: text("type").notNull(),
  enabled: boolean("enabled").default(true).notNull(),
  configuration: jsonb("configuration"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertIntegrationSchema = createInsertSchema(integrations).omit({
  id: true,
  createdAt: true,
}).extend({
  configuration: z.record(z.any()).optional(),
});

export type InsertIntegration = z.infer<typeof insertIntegrationSchema>;
export type Integration = typeof integrations.$inferSelect;

// Agent metrics for monitoring
export const agentMetrics = pgTable("agent_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id").notNull(),
  tasksCompleted: integer("tasks_completed").default(0).notNull(),
  tasksActive: integer("tasks_active").default(0).notNull(),
  successRate: integer("success_rate").default(100).notNull(), // Percentage
  avgResponseTime: integer("avg_response_time").default(0).notNull(), // Milliseconds
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

export const insertAgentMetricsSchema = createInsertSchema(agentMetrics).omit({
  id: true,
  lastUpdated: true,
});

export type InsertAgentMetrics = z.infer<typeof insertAgentMetricsSchema>;
export type AgentMetrics = typeof agentMetrics.$inferSelect;
