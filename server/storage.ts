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
} from "@shared/schema";
import { randomUUID } from "crypto";

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

export class MemStorage implements IStorage {
  private organizations: Map<string, Organization>;
  private agents: Map<string, Agent>;
  private tasks: Map<string, Task>;
  private integrations: Map<string, Integration>;
  private metrics: Map<string, AgentMetrics>;
  private activity: any[];

  constructor() {
    this.organizations = new Map();
    this.agents = new Map();
    this.tasks = new Map();
    this.integrations = new Map();
    this.metrics = new Map();
    this.activity = [];

    // Initialize demo organization
    const demoOrg: Organization = {
      id: "demo-org",
      name: "Demo Enterprise",
      createdAt: new Date(),
    };
    this.organizations.set(demoOrg.id, demoOrg);
  }

  // Organizations
  async getOrganization(id: string): Promise<Organization | undefined> {
    return this.organizations.get(id);
  }

  async createOrganization(insertOrg: InsertOrganization): Promise<Organization> {
    const org: Organization = {
      id: randomUUID(),
      ...insertOrg,
      createdAt: new Date(),
    };
    this.organizations.set(org.id, org);
    return org;
  }

  // Agents
  async getAgent(id: string): Promise<Agent | undefined> {
    return this.agents.get(id);
  }

  async getAgents(organizationId?: string): Promise<Agent[]> {
    const agents = Array.from(this.agents.values());
    if (organizationId) {
      return agents.filter((a) => a.organizationId === organizationId);
    }
    return agents;
  }

  async getAgentsByParentId(parentId: string): Promise<Agent[]> {
    return Array.from(this.agents.values()).filter((a) => a.parentAgentId === parentId);
  }

  async createAgent(insertAgent: InsertAgent): Promise<Agent> {
    const agent: Agent = {
      id: randomUUID(),
      ...insertAgent,
      createdAt: new Date(),
      lastActiveAt: null,
    };
    this.agents.set(agent.id, agent);

    // Log activity
    this.activity.unshift({
      description: `Agent "${agent.name}" created`,
      timestamp: new Date().toISOString(),
    });

    return agent;
  }

  async updateAgent(id: string, updates: Partial<Agent>): Promise<Agent | undefined> {
    const agent = this.agents.get(id);
    if (!agent) return undefined;

    const updated = { ...agent, ...updates, lastActiveAt: new Date() };
    this.agents.set(id, updated);

    // Log activity
    if (updates.status) {
      this.activity.unshift({
        description: `Agent "${agent.name}" status changed to ${updates.status}`,
        timestamp: new Date().toISOString(),
      });
    }

    return updated;
  }

  async deleteAgent(id: string): Promise<void> {
    const agent = this.agents.get(id);
    if (agent) {
      // Delete sub-agents first
      const subAgents = await this.getAgentsByParentId(id);
      for (const subAgent of subAgents) {
        await this.deleteAgent(subAgent.id);
      }

      this.agents.delete(id);
      this.activity.unshift({
        description: `Agent "${agent.name}" deleted`,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Tasks
  async getTask(id: string): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async getTasks(agentId?: string): Promise<Task[]> {
    const tasks = Array.from(this.tasks.values());
    if (agentId) {
      return tasks.filter((t) => t.agentId === agentId);
    }
    return tasks;
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const task: Task = {
      id: randomUUID(),
      ...insertTask,
      createdAt: new Date(),
      completedAt: null,
    };
    this.tasks.set(task.id, task);

    // Log activity
    this.activity.unshift({
      description: `Task "${task.title}" created`,
      timestamp: new Date().toISOString(),
    });

    return task;
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;

    const updated = {
      ...task,
      ...updates,
      completedAt: updates.status === "completed" ? new Date() : task.completedAt,
    };
    this.tasks.set(id, updated);

    return updated;
  }

  // Integrations
  async getIntegrations(organizationId?: string): Promise<Integration[]> {
    const integrations = Array.from(this.integrations.values());
    if (organizationId) {
      return integrations.filter((i) => i.organizationId === organizationId);
    }
    return integrations;
  }

  async createIntegration(insertIntegration: InsertIntegration): Promise<Integration> {
    const integration: Integration = {
      id: randomUUID(),
      ...insertIntegration,
      createdAt: new Date(),
    };
    this.integrations.set(integration.id, integration);

    // Log activity
    this.activity.unshift({
      description: `Integration "${integration.name}" enabled`,
      timestamp: new Date().toISOString(),
    });

    return integration;
  }

  async updateIntegration(id: string, updates: Partial<Integration>): Promise<Integration | undefined> {
    const integration = this.integrations.get(id);
    if (!integration) return undefined;

    const updated = { ...integration, ...updates };
    this.integrations.set(id, updated);

    return updated;
  }

  // Metrics
  async getAgentMetrics(agentId: string): Promise<AgentMetrics | undefined> {
    return this.metrics.get(agentId);
  }

  async updateAgentMetrics(insertMetrics: InsertAgentMetrics): Promise<AgentMetrics> {
    const existing = this.metrics.get(insertMetrics.agentId);
    const metrics: AgentMetrics = {
      id: existing?.id || randomUUID(),
      ...insertMetrics,
      lastUpdated: new Date(),
    };
    this.metrics.set(insertMetrics.agentId, metrics);
    return metrics;
  }

  // Stats
  async getStats(organizationId: string): Promise<{
    activeAgents: number;
    tasksCompleted: number;
    successRate: number;
    avgResponseTime: number;
  }> {
    const agents = await this.getAgents(organizationId);
    const activeAgents = agents.filter((a) => a.status === "active").length;

    const tasks = Array.from(this.tasks.values());
    const tasksCompleted = tasks.filter((t) => t.status === "completed").length;

    const allMetrics = Array.from(this.metrics.values());
    const avgSuccessRate = allMetrics.length > 0
      ? Math.round(allMetrics.reduce((sum, m) => sum + m.successRate, 0) / allMetrics.length)
      : 100;

    const avgResponseTime = allMetrics.length > 0
      ? Math.round(allMetrics.reduce((sum, m) => sum + m.avgResponseTime, 0) / allMetrics.length)
      : 450;

    return {
      activeAgents,
      tasksCompleted,
      successRate: avgSuccessRate,
      avgResponseTime,
    };
  }

  // Activity
  async getRecentActivity(organizationId: string, limit: number = 10): Promise<any[]> {
    return this.activity.slice(0, limit);
  }
}

export const storage = new MemStorage();
