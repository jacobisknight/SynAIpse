import { sql, relations } from "drizzle-orm";
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

// Settings table for organization-level configuration
export const settings = pgTable("settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id).unique(),
  timezone: text("timezone").default("America/New_York"),
  defaultPersona: text("default_persona"),
  defaultGoals: text("default_goals").array(),
  defaultTriggers: text("default_triggers").array(),
  preferences: jsonb("preferences"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSettingsSchema = createInsertSchema(settings).omit({
  id: true,
  updatedAt: true,
}).extend({
  defaultGoals: z.array(z.string()).optional(),
  defaultTriggers: z.array(z.string()).optional(),
  preferences: z.record(z.any()).optional(),
});

export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settings.$inferSelect;

// Agent types
export const agentTypeEnum = z.enum(["voice", "workflow", "data"]);
export const agentStatusEnum = z.enum(["active", "idle", "processing", "error", "stopped"]);

// Agents
export const agents = pgTable("agents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id),
  parentAgentId: varchar("parent_agent_id").references((): any => agents.id, { onDelete: 'cascade' }), // For sub-agents
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
  agentId: varchar("agent_id").notNull().references(() => agents.id, { onDelete: 'cascade' }),
  parentTaskId: varchar("parent_task_id").references((): any => tasks.id, { onDelete: 'cascade' }), // For sub-tasks
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
  organizationId: varchar("organization_id").notNull().references(() => organizations.id),
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
  agentId: varchar("agent_id").notNull().references(() => agents.id, { onDelete: 'cascade' }),
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

// Activity table for audit logs
export const activity = pgTable("activity", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id),
  description: text("description").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertActivitySchema = createInsertSchema(activity).omit({
  id: true,
  timestamp: true,
});

export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activity.$inferSelect;

// Workflows table
export const workflowStatusEnum = z.enum(["draft", "active", "paused", "archived"]);

export const workflows = pgTable("workflows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id),
  agentId: varchar("agent_id").references(() => agents.id, { onDelete: 'set null' }),
  name: text("name").notNull(),
  description: text("description"),
  nodes: jsonb("nodes"),
  edges: jsonb("edges"),
  status: text("status").notNull().default("draft"),
  version: integer("version").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Workflow versions for version control and rollback
export const workflowVersions = pgTable("workflow_versions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workflowId: varchar("workflow_id").notNull().references(() => workflows.id, { onDelete: 'cascade' }),
  version: integer("version").notNull(),
  nodes: jsonb("nodes"),
  edges: jsonb("edges"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: text("created_by"),
});

export const insertWorkflowSchema = createInsertSchema(workflows).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  nodes: z.array(z.any()).optional(),
  edges: z.array(z.any()).optional(),
});

export const insertWorkflowVersionSchema = createInsertSchema(workflowVersions).omit({
  id: true,
  createdAt: true,
}).extend({
  nodes: z.array(z.any()).optional(),
  edges: z.array(z.any()).optional(),
});

export type InsertWorkflow = z.infer<typeof insertWorkflowSchema>;
export type Workflow = typeof workflows.$inferSelect;
export type InsertWorkflowVersion = z.infer<typeof insertWorkflowVersionSchema>;
export type WorkflowVersion = typeof workflowVersions.$inferSelect;

// Agent personality and memory
export const agentPersonality = pgTable("agent_personality", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id").notNull().references(() => agents.id, { onDelete: 'cascade' }).unique(),
  tone: text("tone"),
  role: text("role"),
  goal: text("goal"),
  style: text("style"),
  empathySetting: integer("empathy_setting").default(5), // 1-10 scale
  adaptiveTuning: boolean("adaptive_tuning").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAgentPersonalitySchema = createInsertSchema(agentPersonality).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertAgentPersonality = z.infer<typeof insertAgentPersonalitySchema>;
export type AgentPersonality = typeof agentPersonality.$inferSelect;

// Agent memory (vector + conversation history)
export const agentMemory = pgTable("agent_memory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id").notNull().references(() => agents.id, { onDelete: 'cascade' }),
  sessionId: varchar("session_id"),
  memoryType: text("memory_type").notNull(), // "conversation", "long_term", "context"
  content: text("content").notNull(),
  embedding: text("embedding"), // Store vector embedding as text for now
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAgentMemorySchema = createInsertSchema(agentMemory).omit({
  id: true,
  createdAt: true,
}).extend({
  metadata: z.record(z.any()).optional(),
});

export type InsertAgentMemory = z.infer<typeof insertAgentMemorySchema>;
export type AgentMemory = typeof agentMemory.$inferSelect;

// Documents for RAG
export const documentStatusEnum = z.enum(["processing", "ready", "error"]);

export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id),
  name: text("name").notNull(),
  content: text("content"),
  fileType: text("file_type").notNull(),
  fileSize: integer("file_size").notNull(),
  status: text("status").notNull().default("ready"),
  embedding: text("embedding"), // Store vector embedding
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Document chunks for RAG (better retrieval)
export const documentChunks = pgTable("document_chunks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  documentId: varchar("document_id").notNull().references(() => documents.id, { onDelete: 'cascade' }),
  chunkIndex: integer("chunk_index").notNull(),
  content: text("content").notNull(),
  embedding: text("embedding"), // Vector embedding for similarity search
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  metadata: z.record(z.any()).optional(),
});

export const insertDocumentChunkSchema = createInsertSchema(documentChunks).omit({
  id: true,
  createdAt: true,
}).extend({
  metadata: z.record(z.any()).optional(),
});

export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertDocumentChunk = z.infer<typeof insertDocumentChunkSchema>;
export type DocumentChunk = typeof documentChunks.$inferSelect;

// Agent collaboration and messaging
export const agentMessages = pgTable("agent_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fromAgentId: varchar("from_agent_id").notNull().references(() => agents.id, { onDelete: 'cascade' }),
  toAgentId: varchar("to_agent_id").notNull().references(() => agents.id, { onDelete: 'cascade' }),
  messageType: text("message_type").notNull(), // "handoff", "query", "sync", "response"
  content: text("content").notNull(),
  metadata: jsonb("metadata"),
  status: text("status").notNull().default("sent"), // "sent", "delivered", "processed"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAgentMessageSchema = createInsertSchema(agentMessages).omit({
  id: true,
  createdAt: true,
}).extend({
  metadata: z.record(z.any()).optional(),
});

export type InsertAgentMessage = z.infer<typeof insertAgentMessageSchema>;
export type AgentMessage = typeof agentMessages.$inferSelect;

// Audit logs for compliance
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id),
  agentId: varchar("agent_id").references(() => agents.id, { onDelete: 'set null' }),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(), // "agent", "workflow", "document", etc.
  entityId: varchar("entity_id"),
  details: jsonb("details"),
  userId: varchar("user_id"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  timestamp: true,
}).extend({
  details: z.record(z.any()).optional(),
});

export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;

// Cost tracking
export const costTracking = pgTable("cost_tracking", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id),
  agentId: varchar("agent_id").references(() => agents.id, { onDelete: 'set null' }),
  serviceType: text("service_type").notNull(), // "llm", "tts", "stt", "embedding", etc.
  provider: text("provider").notNull(), // "openai", "elevenlabs", etc.
  units: integer("units").notNull(), // tokens, characters, etc.
  cost: integer("cost").notNull(), // Cost in cents
  metadata: jsonb("metadata"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertCostTrackingSchema = createInsertSchema(costTracking).omit({
  id: true,
  timestamp: true,
}).extend({
  metadata: z.record(z.any()).optional(),
});

export type InsertCostTracking = z.infer<typeof insertCostTrackingSchema>;
export type CostTracking = typeof costTracking.$inferSelect;

// Marketplace items (for Developer SDK & Marketplace feature)
export const marketplaceItems = pgTable("marketplace_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(), // "node", "connector", "agent", "workflow"
  category: text("category"),
  version: text("version").notNull(),
  author: text("author").notNull(),
  authorEmail: text("author_email"),
  price: integer("price").default(0).notNull(), // Price in cents, 0 for free
  downloads: integer("downloads").default(0).notNull(),
  rating: integer("rating").default(0).notNull(), // Average rating * 100 (for decimal precision)
  published: boolean("published").default(false).notNull(),
  code: jsonb("code"), // Stored code/configuration
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertMarketplaceItemSchema = createInsertSchema(marketplaceItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  code: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
});

export type InsertMarketplaceItem = z.infer<typeof insertMarketplaceItemSchema>;
export type MarketplaceItem = typeof marketplaceItems.$inferSelect;

// Relations
export const organizationsRelations = relations(organizations, ({ one, many }) => ({
  agents: many(agents),
  integrations: many(integrations),
  activities: many(activity),
  workflows: many(workflows),
  documents: many(documents),
  settings: one(settings),
}));

export const settingsRelations = relations(settings, ({ one }) => ({
  organization: one(organizations, {
    fields: [settings.organizationId],
    references: [organizations.id],
  }),
}));

export const agentsRelations = relations(agents, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [agents.organizationId],
    references: [organizations.id],
  }),
  parentAgent: one(agents, {
    fields: [agents.parentAgentId],
    references: [agents.id],
    relationName: "agent_hierarchy",
  }),
  subAgents: many(agents, {
    relationName: "agent_hierarchy",
  }),
  tasks: many(tasks),
  metrics: one(agentMetrics),
  personality: one(agentPersonality),
  memories: many(agentMemory),
  sentMessages: many(agentMessages, { relationName: "sent_messages" }),
  receivedMessages: many(agentMessages, { relationName: "received_messages" }),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  agent: one(agents, {
    fields: [tasks.agentId],
    references: [agents.id],
  }),
  parentTask: one(tasks, {
    fields: [tasks.parentTaskId],
    references: [tasks.id],
    relationName: "task_hierarchy",
  }),
  subTasks: many(tasks, {
    relationName: "task_hierarchy",
  }),
}));

export const integrationsRelations = relations(integrations, ({ one }) => ({
  organization: one(organizations, {
    fields: [integrations.organizationId],
    references: [organizations.id],
  }),
}));

export const agentMetricsRelations = relations(agentMetrics, ({ one }) => ({
  agent: one(agents, {
    fields: [agentMetrics.agentId],
    references: [agents.id],
  }),
}));

export const activityRelations = relations(activity, ({ one }) => ({
  organization: one(organizations, {
    fields: [activity.organizationId],
    references: [organizations.id],
  }),
}));

export const workflowsRelations = relations(workflows, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [workflows.organizationId],
    references: [organizations.id],
  }),
  agent: one(agents, {
    fields: [workflows.agentId],
    references: [agents.id],
  }),
  versions: many(workflowVersions),
}));

export const workflowVersionsRelations = relations(workflowVersions, ({ one }) => ({
  workflow: one(workflows, {
    fields: [workflowVersions.workflowId],
    references: [workflows.id],
  }),
}));

export const agentPersonalityRelations = relations(agentPersonality, ({ one }) => ({
  agent: one(agents, {
    fields: [agentPersonality.agentId],
    references: [agents.id],
  }),
}));

export const agentMemoryRelations = relations(agentMemory, ({ one }) => ({
  agent: one(agents, {
    fields: [agentMemory.agentId],
    references: [agents.id],
  }),
}));

export const agentMessagesRelations = relations(agentMessages, ({ one }) => ({
  fromAgent: one(agents, {
    fields: [agentMessages.fromAgentId],
    references: [agents.id],
    relationName: "sent_messages",
  }),
  toAgent: one(agents, {
    fields: [agentMessages.toAgentId],
    references: [agents.id],
    relationName: "received_messages",
  }),
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [documents.organizationId],
    references: [organizations.id],
  }),
  chunks: many(documentChunks),
}));

export const documentChunksRelations = relations(documentChunks, ({ one }) => ({
  document: one(documents, {
    fields: [documentChunks.documentId],
    references: [documents.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  organization: one(organizations, {
    fields: [auditLogs.organizationId],
    references: [organizations.id],
  }),
  agent: one(agents, {
    fields: [auditLogs.agentId],
    references: [agents.id],
  }),
}));

export const costTrackingRelations = relations(costTracking, ({ one }) => ({
  organization: one(organizations, {
    fields: [costTracking.organizationId],
    references: [organizations.id],
  }),
  agent: one(agents, {
    fields: [costTracking.agentId],
    references: [agents.id],
  }),
}));
