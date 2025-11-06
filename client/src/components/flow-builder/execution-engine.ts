import { Node, Edge } from "reactflow";
import type { NodeData, NodeType } from "./custom-nodes";

export interface ExecutionState {
  nodeId: string;
  status: "idle" | "running" | "completed" | "error";
  result?: any;
  error?: string;
  timestamp?: number;
}

export interface ExecutionTrace {
  step: number;
  nodeId: string;
  nodeType: NodeType;
  input?: any;
  output?: any;
  duration: number;
  status: "success" | "error";
}

export class WorkflowExecutionEngine {
  private nodes: Node<NodeData>[];
  private edges: Edge[];
  private executionStates: Map<string, ExecutionState> = new Map();
  private trace: ExecutionTrace[] = [];
  private startTime: number = 0;

  constructor(nodes: Node<NodeData>[], edges: Edge[]) {
    this.nodes = nodes;
    this.edges = edges;
  }

  // Find the starting node (input nodes with no incoming edges)
  private findStartNodes(): Node<NodeData>[] {
    const nodeIds = new Set(this.nodes.map(n => n.id));
    const hasIncoming = new Set(
      this.edges
        .filter(e => nodeIds.has(e.target))
        .map(e => e.target)
    );
    
    return this.nodes.filter(
      node => node.data.nodeType.startsWith("input") && !hasIncoming.has(node.id)
    );
  }

  // Get next nodes from a given node
  private getNextNodes(nodeId: string): { node: Node<NodeData>; edge: Edge }[] {
    return this.edges
      .filter(e => e.source === nodeId)
      .map(edge => {
        const node = this.nodes.find(n => n.id === edge.target);
        return node ? { node, edge } : null;
      })
      .filter((item): item is { node: Node<NodeData>; edge: Edge } => item !== null);
  }

  // Simulate node execution
  private async executeNode(node: Node<NodeData>, input: any): Promise<any> {
    const nodeType = node.data.nodeType;
    const config = node.data.config || {};
    const startTime = Date.now();

    // Simulate execution delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

    try {
      let output: any;

      switch (nodeType) {
        case "input-voice":
          output = { text: "Simulated voice transcription: Hello, how can I help you?" };
          break;

        case "input-text":
          output = { text: config.defaultValue || input?.text || "Default text input" };
          break;

        case "input-api":
          output = { data: { message: "Simulated API response", timestamp: Date.now() } };
          break;

        case "process-llm":
          output = {
            text: `LLM processed: "${input?.text || 'input'}"`,
            confidence: 0.85,
            tokens: 150,
          };
          break;

        case "process-rag":
          output = {
            text: `RAG retrieved context for: "${input?.text || 'query'}"`,
            sources: ["doc1.pdf", "doc2.pdf"],
            confidence: 0.92,
          };
          break;

        case "process-code":
          output = {
            result: `Code execution result for: ${input?.text || 'input'}`,
            success: true,
          };
          break;

        case "output-speech":
          output = {
            audio: "Generated audio",
            text: input?.text || "Output text",
          };
          break;

        case "output-action":
          output = {
            action: config.actionType || "webhook",
            target: config.target || "unknown",
            success: true,
          };
          break;

        case "condition-if-else":
          // Evaluate condition (simplified)
          const condition = config.condition || "true";
          const conditionResult = this.evaluateCondition(condition, input);
          output = { conditionResult, path: conditionResult ? "true" : "false" };
          break;

        case "condition-confidence":
          const threshold = config.threshold || 0.8;
          const confidence = input?.confidence || 0.5;
          const meetsThreshold = confidence >= threshold;
          output = { meetsThreshold, path: meetsThreshold ? "true" : "false" };
          break;

        case "condition-time":
          output = { triggered: true, timestamp: Date.now() };
          break;

        default:
          output = { data: input };
      }

      const duration = Date.now() - startTime;
      this.trace.push({
        step: this.trace.length + 1,
        nodeId: node.id,
        nodeType,
        input,
        output,
        duration,
        status: "success",
      });

      return output;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.trace.push({
        step: this.trace.length + 1,
        nodeId: node.id,
        nodeType,
        input,
        output: null,
        duration,
        status: "error",
      });

      throw error;
    }
  }

  // Simple condition evaluator (for demo purposes)
  private evaluateCondition(condition: string, input: any): boolean {
    try {
      // Very basic condition evaluation - in production, use a proper expression evaluator
      if (condition.includes(">")) {
        const [left, right] = condition.split(">").map(s => s.trim());
        const leftVal = this.getNestedValue(input, left) || parseFloat(left) || 0;
        const rightVal = parseFloat(right) || 0;
        return leftVal > rightVal;
      }
      if (condition.includes("<")) {
        const [left, right] = condition.split("<").map(s => s.trim());
        const leftVal = this.getNestedValue(input, left) || parseFloat(left) || 0;
        const rightVal = parseFloat(right) || 0;
        return leftVal < rightVal;
      }
      if (condition.includes("==")) {
        const [left, right] = condition.split("==").map(s => s.trim());
        const leftVal = this.getNestedValue(input, left) || left;
        const rightVal = right;
        return String(leftVal) === String(rightVal);
      }
      // Default to true for demo
      return true;
    } catch {
      return true;
    }
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split(".").reduce((o, p) => o?.[p], obj);
  }

  // Execute workflow from start nodes
  async execute(
    onNodeUpdate?: (nodeId: string, state: ExecutionState) => void
  ): Promise<{ success: boolean; trace: ExecutionTrace[]; error?: string }> {
    this.startTime = Date.now();
    this.executionStates.clear();
    this.trace = [];

    // Initialize all nodes as idle
    this.nodes.forEach(node => {
      this.executionStates.set(node.id, {
        nodeId: node.id,
        status: "idle",
      });
    });

    const startNodes = this.findStartNodes();
    
    if (startNodes.length === 0) {
      return {
        success: false,
        trace: [],
        error: "No start nodes found. Add at least one input node.",
      };
    }

    try {
      // Execute from each start node
      for (const startNode of startNodes) {
        await this.executeNodePath(startNode, null, onNodeUpdate);
      }

      return {
        success: true,
        trace: this.trace,
      };
    } catch (error: any) {
      return {
        success: false,
        trace: this.trace,
        error: error.message || "Execution failed",
      };
    }
  }

  // Recursively execute a path through the workflow
  private async executeNodePath(
    node: Node<NodeData>,
    input: any,
    onNodeUpdate?: (nodeId: string, state: ExecutionState) => void
  ): Promise<void> {
    // Update state to running
    const runningState: ExecutionState = {
      nodeId: node.id,
      status: "running",
      timestamp: Date.now(),
    };
    this.executionStates.set(node.id, runningState);
    onNodeUpdate?.(node.id, runningState);

    try {
      // Execute the node
      const output = await this.executeNode(node, input);

      // Update state to completed
      const completedState: ExecutionState = {
        nodeId: node.id,
        status: "completed",
        result: output,
        timestamp: Date.now(),
      };
      this.executionStates.set(node.id, completedState);
      onNodeUpdate?.(node.id, completedState);

      // Get next nodes
      const nextNodes = this.getNextNodes(node.id);

      // Handle conditional nodes
      if (node.data.nodeType.startsWith("condition")) {
        const path = output.path || "true";
        const filteredNext = nextNodes.filter(n => {
          if (n.edge.id === "true" || n.edge.id === "false") {
            return n.edge.id === path;
          }
          return true;
        });

        // Execute each path
        for (const { node: nextNode } of filteredNext) {
          await this.executeNodePath(nextNode, output, onNodeUpdate);
        }
      } else {
        // Execute all next nodes
        for (const { node: nextNode } of nextNodes) {
          await this.executeNodePath(nextNode, output, onNodeUpdate);
        }
      }
    } catch (error: any) {
      // Update state to error
      const errorState: ExecutionState = {
        nodeId: node.id,
        status: "error",
        error: error.message,
        timestamp: Date.now(),
      };
      this.executionStates.set(node.id, errorState);
      onNodeUpdate?.(node.id, errorState);
      throw error;
    }
  }

  // Reset execution states
  reset(): void {
    this.executionStates.clear();
    this.trace = [];
    this.nodes.forEach(node => {
      this.executionStates.set(node.id, {
        nodeId: node.id,
        status: "idle",
      });
    });
  }

  // Get execution state for a node
  getNodeState(nodeId: string): ExecutionState | undefined {
    return this.executionStates.get(nodeId);
  }

  // Get all execution states
  getAllStates(): Map<string, ExecutionState> {
    return this.executionStates;
  }
}
