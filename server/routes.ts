import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertAgentSchema, insertTaskSchema, insertIntegrationSchema } from "@shared/schema";
import { decomposeTask, generateAgentPersona, executeAgentTask } from "./ai-service";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket server for real-time updates (on distinct path to avoid Vite HMR conflicts)
  // Referenced from javascript_websocket blueprint
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  const clients = new Set<WebSocket>();

  wss.on('connection', (ws) => {
    clients.add(ws);
    
    ws.on('close', () => {
      clients.delete(ws);
    });
  });

  // Broadcast to all connected clients
  function broadcast(message: any) {
    const data = JSON.stringify(message);
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }

  // Stats endpoint
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getStats("demo-org");
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Activity feed endpoint
  app.get("/api/activity", async (req, res) => {
    try {
      const activity = await storage.getRecentActivity("demo-org");
      res.json(activity);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get all agents
  app.get("/api/agents", async (req, res) => {
    try {
      const agents = await storage.getAgents("demo-org");
      res.json(agents);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get single agent
  app.get("/api/agents/:id", async (req, res) => {
    try {
      const agent = await storage.getAgent(req.params.id);
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }
      res.json(agent);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create agent
  app.post("/api/agents", async (req, res) => {
    try {
      const validated = insertAgentSchema.parse(req.body);
      const agent = await storage.createAgent(validated);
      
      // Broadcast agent creation
      broadcast({ type: "agent_created", data: agent });
      
      res.status(201).json(agent);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Update agent
  app.patch("/api/agents/:id", async (req, res) => {
    try {
      const agent = await storage.updateAgent(req.params.id, req.body);
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }
      
      // Broadcast agent update
      broadcast({ type: "agent_updated", data: agent });
      
      res.json(agent);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Delete agent
  app.delete("/api/agents/:id", async (req, res) => {
    try {
      await storage.deleteAgent(req.params.id);
      
      // Broadcast agent deletion
      broadcast({ type: "agent_deleted", data: { id: req.params.id } });
      
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Decompose task and create sub-agents
  app.post("/api/agents/:id/decompose", async (req, res) => {
    try {
      const { taskDescription } = req.body;
      
      if (!taskDescription) {
        return res.status(400).json({ error: "taskDescription is required" });
      }

      const parentAgent = await storage.getAgent(req.params.id);
      if (!parentAgent) {
        return res.status(404).json({ error: "Parent agent not found" });
      }

      // Use AI to decompose the task
      const decomposition = await decomposeTask(
        taskDescription,
        parentAgent.type,
        parentAgent.goals || []
      );

      // Create sub-agents for each sub-task
      const subAgents = [];
      for (const subTask of decomposition.subTasks) {
        // Generate persona for sub-agent
        const persona = await generateAgentPersona(
          subTask.agentType,
          [subTask.description]
        );

        const subAgent = await storage.createAgent({
          organizationId: parentAgent.organizationId,
          parentAgentId: parentAgent.id,
          name: subTask.title,
          type: subTask.agentType,
          status: "idle",
          persona,
          goals: [subTask.description],
          triggers: [],
          isSubAgent: true,
        });

        // Create task for sub-agent
        await storage.createTask({
          agentId: subAgent.id,
          title: subTask.title,
          description: subTask.description,
          status: "pending",
        });

        subAgents.push(subAgent);
      }

      // Broadcast sub-agent creation
      broadcast({ type: "subagents_created", data: { parentId: parentAgent.id, subAgents } });

      res.json({
        decomposition,
        subAgents,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Execute agent task
  app.post("/api/agents/:id/execute", async (req, res) => {
    try {
      const { taskId } = req.body;
      
      const agent = await storage.getAgent(req.params.id);
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }

      const task = await storage.getTask(taskId);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }

      // Update agent status
      await storage.updateAgent(agent.id, { status: "processing" });
      await storage.updateTask(task.id, { status: "in_progress" });

      // Execute task using AI
      const result = await executeAgentTask(
        task.description || task.title,
        agent.persona || "",
        agent.type
      );

      // Update task with result
      await storage.updateTask(task.id, {
        status: "completed",
        result,
      });

      // Update agent status back to idle
      await storage.updateAgent(agent.id, { status: "idle" });

      // Broadcast task completion
      broadcast({ type: "task_completed", data: { agentId: agent.id, taskId: task.id } });

      res.json({ result, task });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get all tasks
  app.get("/api/tasks", async (req, res) => {
    try {
      const { agentId } = req.query;
      const tasks = await storage.getTasks(agentId as string | undefined);
      res.json(tasks);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create task
  app.post("/api/tasks", async (req, res) => {
    try {
      const validated = insertTaskSchema.parse(req.body);
      const task = await storage.createTask(validated);
      
      broadcast({ type: "task_created", data: task });
      
      res.status(201).json(task);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Update task
  app.patch("/api/tasks/:id", async (req, res) => {
    try {
      const task = await storage.updateTask(req.params.id, req.body);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      
      broadcast({ type: "task_updated", data: task });
      
      res.json(task);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get all integrations
  app.get("/api/integrations", async (req, res) => {
    try {
      const integrations = await storage.getIntegrations("demo-org");
      res.json(integrations);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create integration
  app.post("/api/integrations", async (req, res) => {
    try {
      const validated = insertIntegrationSchema.parse(req.body);
      const integration = await storage.createIntegration(validated);
      
      broadcast({ type: "integration_created", data: integration });
      
      res.status(201).json(integration);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Update integration
  app.patch("/api/integrations/:id", async (req, res) => {
    try {
      const integration = await storage.updateIntegration(req.params.id, req.body);
      if (!integration) {
        return res.status(404).json({ error: "Integration not found" });
      }
      
      broadcast({ type: "integration_updated", data: integration });
      
      res.json(integration);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  return httpServer;
}
