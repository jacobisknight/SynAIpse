import {
  type Organization,
  type InsertOrganization,
  type Agent,
  type InsertAgent,
  type Task,
  type InsertTask,
  type Integration,
  type InsertIntegration,
  type AgentMetrics,
  type InsertAgentMetrics,
  type Activity,
  type InsertActivity,
  type Workflow,
  type InsertWorkflow,
  type WorkflowVersion,
  type InsertWorkflowVersion,
  type Document,
  type InsertDocument,
  type Settings,
  type InsertSettings,
  organizations,
  agents,
  tasks,
  integrations,
  agentMetrics,
  activity,
  workflows,
  workflowVersions,
  documents,
  settings,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql } from "drizzle-orm";

export interface IStorage {
  // Organizations
  getOrganization(id: string): Promise<Organization | undefined>;
  createOrganization(org: InsertOrganization): Promise<Organization>;
  updateOrganization(id: string, updates: Partial<Organization>): Promise<Organization | undefined>;

  // Agents
  getAgent(id: string): Promise<Agent | undefined>;
  getAgents(organizationId?: string): Promise<Agent[]>;
  getAgentsByParentId(parentId: string): Promise<Agent[]>;
  createAgent(agent: InsertAgent): Promise<Agent>;
  updateAgent(id: string, updates: Partial<Agent>): Promise<Agent | undefined>;
  deleteAgent(id: string): Promise<void>;

  // Tasks
  getTask(id: string): Promise<Task | undefined>;
  getTasks(agentId?: string): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, updates: Partial<Task>): Promise<Task | undefined>;

  // Integrations
  getIntegration(id: string): Promise<Integration | undefined>;
  getIntegrations(organizationId?: string): Promise<Integration[]>;
  createIntegration(integration: InsertIntegration): Promise<Integration>;
  updateIntegration(id: string, updates: Partial<Integration>): Promise<Integration | undefined>;

  // Metrics
  getAgentMetrics(agentId: string): Promise<AgentMetrics | undefined>;
  updateAgentMetrics(metrics: InsertAgentMetrics): Promise<AgentMetrics>;

  // Stats
  getStats(organizationId: string): Promise<{
    activeAgents: number;
    tasksCompleted: number;
    successRate: number;
    avgResponseTime: number;
  }>;

  // Activity
  getRecentActivity(organizationId: string, limit?: number): Promise<any[]>;

  // Workflows
  getWorkflow(id: string): Promise<Workflow | undefined>;
  getWorkflows(organizationId?: string): Promise<Workflow[]>;
  createWorkflow(workflow: InsertWorkflow): Promise<Workflow>;
  updateWorkflow(id: string, updates: Partial<Workflow>): Promise<Workflow | undefined>;
  deleteWorkflow(id: string): Promise<void>;
  
  // Workflow Versions
  getWorkflowVersions(workflowId: string): Promise<WorkflowVersion[]>;
  createWorkflowVersion(version: InsertWorkflowVersion): Promise<WorkflowVersion>;
  getWorkflowVersion(id: string): Promise<WorkflowVersion | undefined>;
  restoreWorkflowVersion(workflowId: string, versionId: string): Promise<Workflow | undefined>;

  // Documents
  getDocument(id: string): Promise<Document | undefined>;
  getDocuments(organizationId?: string): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: string, updates: Partial<Document>): Promise<Document | undefined>;
  deleteDocument(id: string): Promise<void>;

  // Settings
  getSettings(organizationId: string): Promise<Settings | undefined>;
  updateSettings(organizationId: string, updates: Partial<Settings>): Promise<Settings>;
}

export class DatabaseStorage implements IStorage {
  constructor() {
    this.initDemoOrganization();
    this.initDemoIntegrations();
    this.initWorkflowTemplates();
  }

  private async initDemoOrganization() {
    try {
      const existing = await db.select().from(organizations).where(eq(organizations.id, "demo-org")).limit(1);
      if (existing.length === 0) {
        await db.insert(organizations).values({
          id: "demo-org",
          name: "Demo Enterprise",
        });
      }
    } catch (error) {
      console.error("Error initializing demo organization:", error);
    }
  }

  private async initDemoIntegrations() {
    try {
      const existing = await db.select().from(integrations).where(eq(integrations.organizationId, "demo-org")).limit(1);
      if (existing.length === 0) {
        const demoIntegrations = [
          {
            organizationId: "demo-org",
            name: "Salesforce",
            type: "salesforce",
            enabled: false,
          },
          {
            organizationId: "demo-org",
            name: "SAP",
            type: "sap",
            enabled: false,
          },
          {
            organizationId: "demo-org",
            name: "ServiceNow",
            type: "servicenow",
            enabled: false,
          },
          {
            organizationId: "demo-org",
            name: "Slack",
            type: "slack",
            enabled: false,
          },
          {
            organizationId: "demo-org",
            name: "Microsoft Teams",
            type: "teams",
            enabled: false,
          },
          {
            organizationId: "demo-org",
            name: "HubSpot",
            type: "hubspot",
            enabled: false,
          },
        ];

        await db.insert(integrations).values(demoIntegrations);
      }
    } catch (error) {
      console.error("Error initializing demo integrations:", error);
    }
  }

  private async initWorkflowTemplates() {
    try {
      const existing = await db.select().from(workflows).where(eq(workflows.organizationId, "demo-org")).limit(1);
      if (existing.length === 0) {
        const workflowTemplates = [
          {
            organizationId: "demo-org",
            name: "Customer Onboarding",
            description: "Multi-step automated customer onboarding process",
            status: "draft",
            nodes: [
              { id: "1", type: "start", position: { x: 100, y: 100 }, data: { label: "Start Onboarding" } },
              { id: "2", type: "action", position: { x: 100, y: 200 }, data: { label: "Collect Customer Info" } },
              { id: "3", type: "action", position: { x: 100, y: 300 }, data: { label: "Create Account" } },
              { id: "4", type: "action", position: { x: 100, y: 400 }, data: { label: "Send Welcome Email" } },
              { id: "5", type: "end", position: { x: 100, y: 500 }, data: { label: "Onboarding Complete" } },
            ],
            edges: [
              { id: "e1-2", source: "1", target: "2" },
              { id: "e2-3", source: "2", target: "3" },
              { id: "e3-4", source: "3", target: "4" },
              { id: "e4-5", source: "4", target: "5" },
            ],
          },
          {
            organizationId: "demo-org",
            name: "Lead Qualification",
            description: "Automated lead scoring and qualification workflow",
            status: "draft",
            nodes: [
              { id: "1", type: "start", position: { x: 100, y: 100 }, data: { label: "New Lead" } },
              { id: "2", type: "action", position: { x: 100, y: 200 }, data: { label: "Score Lead" } },
              { id: "3", type: "decision", position: { x: 100, y: 300 }, data: { label: "Score > 70?" } },
              { id: "4", type: "action", position: { x: 250, y: 400 }, data: { label: "Assign to Sales" } },
              { id: "5", type: "action", position: { x: -50, y: 400 }, data: { label: "Send to Nurture" } },
              { id: "6", type: "end", position: { x: 100, y: 500 }, data: { label: "Complete" } },
            ],
            edges: [
              { id: "e1-2", source: "1", target: "2" },
              { id: "e2-3", source: "2", target: "3" },
              { id: "e3-4", source: "3", target: "4", label: "Yes" },
              { id: "e3-5", source: "3", target: "5", label: "No" },
              { id: "e4-6", source: "4", target: "6" },
              { id: "e5-6", source: "5", target: "6" },
            ],
          },
          {
            organizationId: "demo-org",
            name: "Support Ticket Routing",
            description: "Intelligent support ticket assignment workflow",
            status: "draft",
            nodes: [
              { id: "1", type: "start", position: { x: 100, y: 100 }, data: { label: "New Ticket" } },
              { id: "2", type: "decision", position: { x: 100, y: 200 }, data: { label: "Priority Level" } },
              { id: "3", type: "action", position: { x: -50, y: 300 }, data: { label: "Route to Tier 1" } },
              { id: "4", type: "action", position: { x: 100, y: 300 }, data: { label: "Route to Tier 2" } },
              { id: "5", type: "action", position: { x: 250, y: 300 }, data: { label: "Escalate to Manager" } },
              { id: "6", type: "end", position: { x: 100, y: 400 }, data: { label: "Ticket Assigned" } },
            ],
            edges: [
              { id: "e1-2", source: "1", target: "2" },
              { id: "e2-3", source: "2", target: "3", label: "Low" },
              { id: "e2-4", source: "2", target: "4", label: "Medium" },
              { id: "e2-5", source: "2", target: "5", label: "High" },
              { id: "e3-6", source: "3", target: "6" },
              { id: "e4-6", source: "4", target: "6" },
              { id: "e5-6", source: "5", target: "6" },
            ],
          },
          {
            organizationId: "demo-org",
            name: "Data Sync",
            description: "Periodic data synchronization between systems",
            status: "draft",
            nodes: [
              { id: "1", type: "start", position: { x: 100, y: 100 }, data: { label: "Scheduled Trigger" } },
              { id: "2", type: "action", position: { x: 100, y: 200 }, data: { label: "Fetch Source Data" } },
              { id: "3", type: "action", position: { x: 100, y: 300 }, data: { label: "Transform Data" } },
              { id: "4", type: "action", position: { x: 100, y: 400 }, data: { label: "Update Target System" } },
              { id: "5", type: "end", position: { x: 100, y: 500 }, data: { label: "Sync Complete" } },
            ],
            edges: [
              { id: "e1-2", source: "1", target: "2" },
              { id: "e2-3", source: "2", target: "3" },
              { id: "e3-4", source: "3", target: "4" },
              { id: "e4-5", source: "4", target: "5" },
            ],
          },
          {
            organizationId: "demo-org",
            name: "Approval Process",
            description: "Multi-stage approval workflow for requests",
            status: "draft",
            nodes: [
              { id: "1", type: "start", position: { x: 100, y: 100 }, data: { label: "Request Submitted" } },
              { id: "2", type: "decision", position: { x: 100, y: 200 }, data: { label: "Manager Approval" } },
              { id: "3", type: "decision", position: { x: 100, y: 350 }, data: { label: "Director Approval" } },
              { id: "4", type: "action", position: { x: 250, y: 500 }, data: { label: "Execute Request" } },
              { id: "5", type: "action", position: { x: -50, y: 500 }, data: { label: "Reject Request" } },
              { id: "6", type: "end", position: { x: 100, y: 600 }, data: { label: "Process Complete" } },
            ],
            edges: [
              { id: "e1-2", source: "1", target: "2" },
              { id: "e2-3", source: "2", target: "3", label: "Approved" },
              { id: "e2-5", source: "2", target: "5", label: "Rejected" },
              { id: "e3-4", source: "3", target: "4", label: "Approved" },
              { id: "e3-5", source: "3", target: "5", label: "Rejected" },
              { id: "e4-6", source: "4", target: "6" },
              { id: "e5-6", source: "5", target: "6" },
            ],
          },
        ];

        await db.insert(workflows).values(workflowTemplates);
      }
    } catch (error) {
      console.error("Error initializing workflow templates:", error);
    }
  }

  private async logActivity(orgId: string, description: string): Promise<void> {
    try {
      await db.insert(activity).values({
        organizationId: orgId,
        description,
      });
    } catch (error) {
      console.error("Error logging activity:", error);
    }
  }

  async getOrganization(id: string): Promise<Organization | undefined> {
    try {
      const result = await db.select().from(organizations).where(eq(organizations.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error("Error getting organization:", error);
      return undefined;
    }
  }

  async createOrganization(insertOrg: InsertOrganization): Promise<Organization> {
    try {
      const result = await db.insert(organizations).values(insertOrg).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating organization:", error);
      throw error;
    }
  }

  async updateOrganization(id: string, updates: Partial<Organization>): Promise<Organization | undefined> {
    try {
      const org = await this.getOrganization(id);
      if (!org) return undefined;

      const result = await db.update(organizations).set(updates).where(eq(organizations.id, id)).returning();
      
      await this.logActivity(id, `Organization settings updated`);

      return result[0];
    } catch (error) {
      console.error("Error updating organization:", error);
      return undefined;
    }
  }

  async getAgent(id: string): Promise<Agent | undefined> {
    try {
      const result = await db.select().from(agents).where(eq(agents.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error("Error getting agent:", error);
      return undefined;
    }
  }

  async getAgents(organizationId?: string): Promise<Agent[]> {
    try {
      if (organizationId) {
        return await db.select().from(agents).where(eq(agents.organizationId, organizationId));
      }
      return await db.select().from(agents);
    } catch (error) {
      console.error("Error getting agents:", error);
      return [];
    }
  }

  async getAgentsByParentId(parentId: string): Promise<Agent[]> {
    try {
      return await db.select().from(agents).where(eq(agents.parentAgentId, parentId));
    } catch (error) {
      console.error("Error getting agents by parent ID:", error);
      return [];
    }
  }

  async createAgent(insertAgent: InsertAgent): Promise<Agent> {
    try {
      const result = await db.insert(agents).values(insertAgent).returning();
      const agent = result[0];

      await this.logActivity(agent.organizationId, `Agent "${agent.name}" created`);

      return agent;
    } catch (error) {
      console.error("Error creating agent:", error);
      throw error;
    }
  }

  async updateAgent(id: string, updates: Partial<Agent>): Promise<Agent | undefined> {
    try {
      const agent = await this.getAgent(id);
      if (!agent) return undefined;

      const updatedData = {
        ...updates,
        lastActiveAt: new Date(),
      };

      const result = await db.update(agents).set(updatedData).where(eq(agents.id, id)).returning();

      if (updates.status) {
        await this.logActivity(agent.organizationId, `Agent "${agent.name}" status changed to ${updates.status}`);
      }

      return result[0];
    } catch (error) {
      console.error("Error updating agent:", error);
      return undefined;
    }
  }

  async deleteAgent(id: string): Promise<void> {
    try {
      const agent = await this.getAgent(id);
      if (!agent) return;

      await db.delete(agents).where(eq(agents.id, id));

      await this.logActivity(agent.organizationId, `Agent "${agent.name}" deleted`);
    } catch (error) {
      console.error("Error deleting agent:", error);
      throw error;
    }
  }

  async getTask(id: string): Promise<Task | undefined> {
    try {
      const result = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error("Error getting task:", error);
      return undefined;
    }
  }

  async getTasks(agentId?: string): Promise<Task[]> {
    try {
      if (agentId) {
        return await db.select().from(tasks).where(eq(tasks.agentId, agentId));
      }
      return await db.select().from(tasks);
    } catch (error) {
      console.error("Error getting tasks:", error);
      return [];
    }
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    try {
      const result = await db.insert(tasks).values(insertTask).returning();
      const task = result[0];

      const agent = await this.getAgent(task.agentId);
      if (agent) {
        await this.logActivity(agent.organizationId, `Task "${task.title}" created`);
      }

      return task;
    } catch (error) {
      console.error("Error creating task:", error);
      throw error;
    }
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task | undefined> {
    try {
      const task = await this.getTask(id);
      if (!task) return undefined;

      const updatedData = {
        ...updates,
        completedAt: updates.status === "completed" ? new Date() : undefined,
      };

      const result = await db.update(tasks).set(updatedData).where(eq(tasks.id, id)).returning();
      
      if (updates.status && updates.status !== task.status) {
        const agent = await this.getAgent(task.agentId);
        if (agent) {
          await this.logActivity(agent.organizationId, `Task "${task.title}" status changed to ${updates.status}`);
        }
      }

      return result[0];
    } catch (error) {
      console.error("Error updating task:", error);
      return undefined;
    }
  }

  async getIntegration(id: string): Promise<Integration | undefined> {
    try {
      const result = await db.select().from(integrations).where(eq(integrations.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error("Error getting integration:", error);
      return undefined;
    }
  }

  async getIntegrations(organizationId?: string): Promise<Integration[]> {
    try {
      if (organizationId) {
        return await db.select().from(integrations).where(eq(integrations.organizationId, organizationId));
      }
      return await db.select().from(integrations);
    } catch (error) {
      console.error("Error getting integrations:", error);
      return [];
    }
  }

  async createIntegration(insertIntegration: InsertIntegration): Promise<Integration> {
    try {
      const result = await db.insert(integrations).values(insertIntegration).returning();
      const integration = result[0];

      await this.logActivity(integration.organizationId, `Integration "${integration.name}" enabled`);

      return integration;
    } catch (error) {
      console.error("Error creating integration:", error);
      throw error;
    }
  }

  async updateIntegration(id: string, updates: Partial<Integration>): Promise<Integration | undefined> {
    try {
      const integration = await db.select().from(integrations).where(eq(integrations.id, id)).limit(1);
      if (!integration[0]) return undefined;

      const result = await db.update(integrations).set(updates).where(eq(integrations.id, id)).returning();
      
      if (updates.enabled !== undefined && updates.enabled !== integration[0].enabled) {
        const status = updates.enabled ? 'enabled' : 'disabled';
        await this.logActivity(integration[0].organizationId, `Integration "${integration[0].name}" ${status}`);
      } else if (updates.name || updates.type || updates.configuration) {
        await this.logActivity(integration[0].organizationId, `Integration "${integration[0].name}" updated`);
      }

      return result[0];
    } catch (error) {
      console.error("Error updating integration:", error);
      return undefined;
    }
  }

  async getAgentMetrics(agentId: string): Promise<AgentMetrics | undefined> {
    try {
      const result = await db.select().from(agentMetrics).where(eq(agentMetrics.agentId, agentId)).limit(1);
      return result[0];
    } catch (error) {
      console.error("Error getting agent metrics:", error);
      return undefined;
    }
  }

  async updateAgentMetrics(insertMetrics: InsertAgentMetrics): Promise<AgentMetrics> {
    try {
      const existing = await this.getAgentMetrics(insertMetrics.agentId);

      if (existing) {
        const result = await db
          .update(agentMetrics)
          .set({ ...insertMetrics, lastUpdated: new Date() })
          .where(eq(agentMetrics.agentId, insertMetrics.agentId))
          .returning();
        return result[0];
      } else {
        const result = await db.insert(agentMetrics).values(insertMetrics).returning();
        return result[0];
      }
    } catch (error) {
      console.error("Error updating agent metrics:", error);
      throw error;
    }
  }

  async getStats(organizationId: string): Promise<{
    activeAgents: number;
    tasksCompleted: number;
    successRate: number;
    avgResponseTime: number;
  }> {
    try {
      const orgAgents = await this.getAgents(organizationId);
      const activeAgents = orgAgents.filter((a) => a.status === "active").length;

      const agentIds = orgAgents.map((a) => a.id);
      
      let tasksCompleted = 0;
      if (agentIds.length > 0) {
        const completedTasks = await db
          .select()
          .from(tasks)
          .where(eq(tasks.status, "completed"));
        tasksCompleted = completedTasks.filter((t) => agentIds.includes(t.agentId)).length;
      }

      const allMetrics = await db.select().from(agentMetrics);
      const orgMetrics = allMetrics.filter((m) => agentIds.includes(m.agentId));

      const avgSuccessRate = orgMetrics.length > 0
        ? Math.round(orgMetrics.reduce((sum, m) => sum + m.successRate, 0) / orgMetrics.length)
        : 100;

      const avgResponseTime = orgMetrics.length > 0
        ? Math.round(orgMetrics.reduce((sum, m) => sum + m.avgResponseTime, 0) / orgMetrics.length)
        : 450;

      return {
        activeAgents,
        tasksCompleted,
        successRate: avgSuccessRate,
        avgResponseTime,
      };
    } catch (error) {
      console.error("Error getting stats:", error);
      return {
        activeAgents: 0,
        tasksCompleted: 0,
        successRate: 100,
        avgResponseTime: 450,
      };
    }
  }

  async getRecentActivity(organizationId: string, limit: number = 10): Promise<Activity[]> {
    try {
      const result = await db
        .select()
        .from(activity)
        .where(eq(activity.organizationId, organizationId))
        .orderBy(sql`${activity.timestamp} DESC`)
        .limit(limit);
      return result;
    } catch (error) {
      console.error("Error getting recent activity:", error);
      return [];
    }
  }

  async getWorkflow(id: string): Promise<Workflow | undefined> {
    try {
      const result = await db.select().from(workflows).where(eq(workflows.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error("Error getting workflow:", error);
      return undefined;
    }
  }

  async getWorkflows(organizationId?: string): Promise<Workflow[]> {
    try {
      if (organizationId) {
        return await db.select().from(workflows).where(eq(workflows.organizationId, organizationId));
      }
      return await db.select().from(workflows);
    } catch (error) {
      console.error("Error getting workflows:", error);
      return [];
    }
  }

  async createWorkflow(insertWorkflow: InsertWorkflow): Promise<Workflow> {
    try {
      const result = await db.insert(workflows).values(insertWorkflow).returning();
      const workflow = result[0];

      await this.logActivity(workflow.organizationId, `Workflow "${workflow.name}" created`);

      return workflow;
    } catch (error) {
      console.error("Error creating workflow:", error);
      throw error;
    }
  }

  async updateWorkflow(id: string, updates: Partial<Workflow>): Promise<Workflow | undefined> {
    try {
      const workflow = await this.getWorkflow(id);
      if (!workflow) return undefined;

      // Auto-create version if nodes or edges changed
      if (updates.nodes || updates.edges) {
        const shouldCreateVersion = 
          JSON.stringify(updates.nodes || workflow.nodes) !== JSON.stringify(workflow.nodes) ||
          JSON.stringify(updates.edges || workflow.edges) !== JSON.stringify(workflow.edges);
        
        if (shouldCreateVersion && workflow.nodes && workflow.edges) {
          try {
            await this.createWorkflowVersion({
              workflowId: id,
              nodes: workflow.nodes as any[],
              edges: workflow.edges as any[],
              description: "Auto-saved version",
            });
          } catch (versionError) {
            // Don't fail the update if versioning fails
            console.error("Error creating workflow version:", versionError);
          }
        }
      }

      const updatedData = {
        ...updates,
        updatedAt: new Date(),
      };

      const result = await db.update(workflows).set(updatedData).where(eq(workflows.id, id)).returning();

      if (updates.status) {
        await this.logActivity(workflow.organizationId, `Workflow "${workflow.name}" status changed to ${updates.status}`);
      }

      return result[0];
    } catch (error) {
      console.error("Error updating workflow:", error);
      return undefined;
    }
  }

  async deleteWorkflow(id: string): Promise<void> {
    try {
      const workflow = await this.getWorkflow(id);
      if (!workflow) return;

      await db.delete(workflows).where(eq(workflows.id, id));

      await this.logActivity(workflow.organizationId, `Workflow "${workflow.name}" deleted`);
    } catch (error) {
      console.error("Error deleting workflow:", error);
      throw error;
    }
  }

  async getWorkflowVersions(workflowId: string): Promise<WorkflowVersion[]> {
    try {
      return await db
        .select()
        .from(workflowVersions)
        .where(eq(workflowVersions.workflowId, workflowId))
        .orderBy(sql`${workflowVersions.version} DESC`);
    } catch (error) {
      console.error("Error getting workflow versions:", error);
      return [];
    }
  }

  async createWorkflowVersion(version: InsertWorkflowVersion): Promise<WorkflowVersion> {
    try {
      // Get the next version number
      const existingVersions = await this.getWorkflowVersions(version.workflowId);
      const nextVersion = existingVersions.length > 0 
        ? Math.max(...existingVersions.map(v => v.version)) + 1
        : 1;

      const result = await db
        .insert(workflowVersions)
        .values({ ...version, version: nextVersion })
        .returning();
      
      return result[0];
    } catch (error) {
      console.error("Error creating workflow version:", error);
      throw error;
    }
  }

  async getWorkflowVersion(id: string): Promise<WorkflowVersion | undefined> {
    try {
      const result = await db
        .select()
        .from(workflowVersions)
        .where(eq(workflowVersions.id, id))
        .limit(1);
      return result[0];
    } catch (error) {
      console.error("Error getting workflow version:", error);
      return undefined;
    }
  }

  async restoreWorkflowVersion(workflowId: string, versionId: string): Promise<Workflow | undefined> {
    try {
      const version = await this.getWorkflowVersion(versionId);
      if (!version || version.workflowId !== workflowId) {
        return undefined;
      }

      // Create a new version of the current state before restoring
      const currentWorkflow = await this.getWorkflow(workflowId);
      if (currentWorkflow) {
        await this.createWorkflowVersion({
          workflowId,
          nodes: currentWorkflow.nodes as any[],
          edges: currentWorkflow.edges as any[],
          description: "Auto-saved before restore",
        });
      }

      // Restore the version
      const updated = await this.updateWorkflow(workflowId, {
        nodes: version.nodes as any,
        edges: version.edges as any,
      });

      return updated;
    } catch (error) {
      console.error("Error restoring workflow version:", error);
      return undefined;
    }
  }

  async getDocument(id: string): Promise<Document | undefined> {
    try {
      const result = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error("Error getting document:", error);
      return undefined;
    }
  }

  async getDocuments(organizationId?: string): Promise<Document[]> {
    try {
      if (organizationId) {
        return await db.select().from(documents).where(eq(documents.organizationId, organizationId));
      }
      return await db.select().from(documents);
    } catch (error) {
      console.error("Error getting documents:", error);
      return [];
    }
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    try {
      const result = await db.insert(documents).values(insertDocument).returning();
      const document = result[0];

      await this.logActivity(document.organizationId, `Document "${document.name}" uploaded`);

      return document;
    } catch (error) {
      console.error("Error creating document:", error);
      throw error;
    }
  }

  async updateDocument(id: string, updates: Partial<Document>): Promise<Document | undefined> {
    try {
      const document = await this.getDocument(id);
      if (!document) return undefined;

      const updatedData = {
        ...updates,
        updatedAt: new Date(),
      };

      const result = await db.update(documents).set(updatedData).where(eq(documents.id, id)).returning();

      return result[0];
    } catch (error) {
      console.error("Error updating document:", error);
      return undefined;
    }
  }

  async deleteDocument(id: string): Promise<void> {
    try {
      const document = await this.getDocument(id);
      if (!document) return;

      await db.delete(documents).where(eq(documents.id, id));

      await this.logActivity(document.organizationId, `Document "${document.name}" deleted`);
    } catch (error) {
      console.error("Error deleting document:", error);
      throw error;
    }
  }

  async getSettings(organizationId: string): Promise<Settings | undefined> {
    try {
      const result = await db.select().from(settings).where(eq(settings.organizationId, organizationId)).limit(1);
      return result[0];
    } catch (error) {
      console.error("Error getting settings:", error);
      return undefined;
    }
  }

  async updateSettings(organizationId: string, updates: Partial<Settings>): Promise<Settings> {
    try {
      const existing = await this.getSettings(organizationId);
      
      if (existing) {
        const updatedData = {
          ...updates,
          updatedAt: new Date(),
        };
        const result = await db.update(settings).set(updatedData).where(eq(settings.organizationId, organizationId)).returning();
        return result[0];
      } else {
        const result = await db.insert(settings).values({
          organizationId,
          ...updates,
        }).returning();
        return result[0];
      }
    } catch (error) {
      console.error("Error updating settings:", error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();
