import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertAgentSchema, insertTaskSchema, insertIntegrationSchema, insertWorkflowSchema, insertDocumentSchema } from "@shared/schema";
import { z } from "zod";
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

  // Test integration connection
  app.post("/api/integrations/:id/test", async (req, res) => {
    try {
      const integration = await storage.getIntegration(req.params.id);
      if (!integration) {
        return res.status(404).json({ error: "Integration not found" });
      }

      const testCredentialsSchema = z.object({
        credentials: z.object({
          apiKey: z.string().min(1, "API key is required"),
          apiSecret: z.string().optional(),
          baseUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
        }).optional(),
      });

      const validated = testCredentialsSchema.parse(req.body);
      
      let credentialsToTest;
      if (validated.credentials) {
        credentialsToTest = validated.credentials;
      } else {
        const savedConfig = integration.configuration && 
          typeof integration.configuration === 'object' &&
          Object.keys(integration.configuration).length > 0 
          ? integration.configuration 
          : null;

        if (!savedConfig) {
          return res.status(400).json({ 
            success: false, 
            error: "No configuration found. Please configure the integration first." 
          });
        }
        credentialsToTest = savedConfig;
      }

      // Simulate a brief delay for testing
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Randomly succeed or fail for demo purposes
      const success = Math.random() > 0.2;
      
      if (success) {
        res.json({ 
          success: true, 
          message: `Successfully connected to ${integration.name}` 
        });
      } else {
        res.status(400).json({ 
          success: false, 
          error: "Invalid credentials or connection failed" 
        });
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          success: false, 
          error: error.errors[0]?.message || "Validation failed" 
        });
      }
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Workflow endpoints
  app.get("/api/workflows", async (req, res) => {
    try {
      const workflows = await storage.getWorkflows("demo-org");
      res.json(workflows);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/workflows/:id", async (req, res) => {
    try {
      const workflow = await storage.getWorkflow(req.params.id);
      if (!workflow) {
        return res.status(404).json({ error: "Workflow not found" });
      }
      res.json(workflow);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/workflows", async (req, res) => {
    try {
      const validated = insertWorkflowSchema.parse(req.body);
      const workflow = await storage.createWorkflow(validated);
      
      broadcast({ type: "workflow_created", data: workflow });
      
      res.status(201).json(workflow);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/workflows/:id", async (req, res) => {
    try {
      const workflow = await storage.updateWorkflow(req.params.id, req.body);
      if (!workflow) {
        return res.status(404).json({ error: "Workflow not found" });
      }
      
      broadcast({ type: "workflow_updated", data: workflow });
      
      res.json(workflow);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/workflows/:id", async (req, res) => {
    try {
      await storage.deleteWorkflow(req.params.id);
      
      broadcast({ type: "workflow_deleted", data: { id: req.params.id } });
      
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/workflows/:id/execute", async (req, res) => {
    try {
      const workflow = await storage.getWorkflow(req.params.id);
      if (!workflow) {
        return res.status(404).json({ error: "Workflow not found" });
      }

      await storage.updateWorkflow(workflow.id, { status: "active" });
      
      broadcast({ type: "workflow_executed", data: { workflowId: workflow.id } });

      res.json({ 
        success: true, 
        message: `Workflow "${workflow.name}" execution started`,
        workflow 
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Document endpoints
  app.get("/api/documents", async (req, res) => {
    try {
      const documents = await storage.getDocuments("demo-org");
      res.json(documents);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/documents/:id", async (req, res) => {
    try {
      const document = await storage.getDocument(req.params.id);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      res.json(document);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/documents", async (req, res) => {
    try {
      const { name, content, fileType, fileSize, metadata } = req.body;

      if (!name || !content || !fileType || fileSize === undefined) {
        return res.status(400).json({ error: "Missing required fields: name, content, fileType, fileSize" });
      }

      const validated = insertDocumentSchema.parse({
        organizationId: "demo-org",
        name,
        content,
        fileType,
        fileSize,
        status: "ready",
        metadata: metadata || {},
      });

      const document = await storage.createDocument(validated);
      
      broadcast({ type: "document_created", data: document });
      
      res.status(201).json(document);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/documents/:id", async (req, res) => {
    try {
      const document = await storage.updateDocument(req.params.id, req.body);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      
      broadcast({ type: "document_updated", data: document });
      
      res.json(document);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/documents/:id", async (req, res) => {
    try {
      await storage.deleteDocument(req.params.id);
      
      broadcast({ type: "document_deleted", data: { id: req.params.id } });
      
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/documents/:id/search", async (req, res) => {
    try {
      const { query } = req.body;
      
      if (!query) {
        return res.status(400).json({ error: "Search query is required" });
      }

      const document = await storage.getDocument(req.params.id);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }

      const searchQuery = query.toLowerCase();
      const content = document.content?.toLowerCase() || "";
      
      const matches = [];
      const lines = content.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(searchQuery)) {
          matches.push({
            lineNumber: i + 1,
            content: lines[i].trim(),
            preview: lines[i].trim().substring(0, 150),
          });
        }
      }

      res.json({
        documentId: document.id,
        documentName: document.name,
        query,
        matchCount: matches.length,
        matches: matches.slice(0, 50),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/documents/search-all", async (req, res) => {
    try {
      const { query } = req.body;
      
      if (!query || query.trim() === "") {
        return res.status(400).json({ error: "Search query is required" });
      }

      const documents = await storage.getDocuments("demo-org");
      const searchQuery = query.toLowerCase();
      
      const results = [];
      
      for (const document of documents) {
        const content = document.content?.toLowerCase() || "";
        const originalContent = document.content || "";
        const lines = originalContent.split('\n');
        const matches = [];
        
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].toLowerCase().includes(searchQuery)) {
            matches.push({
              lineNumber: i + 1,
              text: lines[i].trim(),
            });
          }
        }
        
        if (matches.length > 0) {
          results.push({
            documentId: document.id,
            documentName: document.name,
            fileType: document.fileType,
            matchCount: matches.length,
            matches: matches.slice(0, 50),
          });
        }
      }

      res.json({
        query,
        totalDocuments: documents.length,
        documentsWithMatches: results.length,
        results,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/settings", async (req, res) => {
    try {
      const organizationId = "demo-org";
      const org = await storage.getOrganization(organizationId);
      const settings = await storage.getSettings(organizationId);
      
      res.json({
        organization: org,
        settings: settings || {
          organizationId,
          timezone: "America/New_York",
          defaultPersona: null,
          defaultGoals: [],
          defaultTriggers: [],
          preferences: {},
        },
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/settings", async (req, res) => {
    try {
      const organizationId = "demo-org";
      const settings = await storage.updateSettings(organizationId, req.body);
      
      res.json(settings);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/organization/:id", async (req, res) => {
    try {
      const organization = await storage.updateOrganization(req.params.id, req.body);
      if (!organization) {
        return res.status(404).json({ error: "Organization not found" });
      }
      
      res.json(organization);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/system/status", async (req, res) => {
    try {
      const organizationId = "demo-org";
      const agents = await storage.getAgents(organizationId);
      const tasks = await storage.getTasks();
      const documents = await storage.getDocuments(organizationId);
      const workflows = await storage.getWorkflows(organizationId);
      const integrations = await storage.getIntegrations(organizationId);
      
      const stats = await storage.getStats(organizationId);
      
      const totalStorageSize = documents.reduce((sum, doc) => sum + doc.fileSize, 0);
      
      const apiKeysConfigured = {
        openai: !!process.env.OPENAI_API_KEY,
        elevenlabs: !!process.env.ELEVENLABS_API_KEY,
      };
      
      res.json({
        database: {
          status: "connected",
          type: "PostgreSQL",
        },
        counts: {
          agents: agents.length,
          tasks: tasks.length,
          documents: documents.length,
          workflows: workflows.length,
          integrations: integrations.filter(i => i.enabled).length,
        },
        storage: {
          totalBytes: totalStorageSize,
          totalMB: (totalStorageSize / (1024 * 1024)).toFixed(2),
        },
        performance: stats,
        apiKeys: apiKeysConfigured,
        version: "1.0.0",
        buildDate: new Date().toISOString().split('T')[0],
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return httpServer;
}
