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
  organizations,
  agents,
  tasks,
  integrations,
  agentMetrics,
  activity,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql } from "drizzle-orm";

export interface IStorage {
  // Organizations
  getOrganization(id: string): Promise<Organization | undefined>;
  createOrganization(org: InsertOrganization): Promise<Organization>;

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
}

export class DatabaseStorage implements IStorage {
  constructor() {
    this.initDemoOrganization();
    this.initDemoIntegrations();
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
}

export const storage = new DatabaseStorage();
