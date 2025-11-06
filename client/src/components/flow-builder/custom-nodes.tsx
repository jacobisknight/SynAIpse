import React from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Mic, 
  FileText, 
  Globe, 
  Brain, 
  Database, 
  Code, 
  Volume2, 
  Zap,
  GitBranch,
  Timer,
  TrendingUp
} from "lucide-react";

// Node type definitions
export type NodeType = 
  | "input-voice" 
  | "input-text" 
  | "input-api"
  | "process-llm" 
  | "process-rag" 
  | "process-code"
  | "output-speech" 
  | "output-action"
  | "condition-if-else"
  | "condition-confidence"
  | "condition-time";

export interface NodeData {
  label: string;
  nodeType: NodeType;
  config?: Record<string, any>;
  executionState?: "idle" | "running" | "completed" | "error";
  executionResult?: any;
}

const nodeIcons: Record<NodeType, React.ComponentType<{ className?: string }>> = {
  "input-voice": Mic,
  "input-text": FileText,
  "input-api": Globe,
  "process-llm": Brain,
  "process-rag": Database,
  "process-code": Code,
  "output-speech": Volume2,
  "output-action": Zap,
  "condition-if-else": GitBranch,
  "condition-confidence": TrendingUp,
  "condition-time": Timer,
};

const nodeColors: Record<NodeType, string> = {
  "input-voice": "#8b5cf6",
  "input-text": "#6366f1",
  "input-api": "#3b82f6",
  "process-llm": "#10b981",
  "process-rag": "#06b6d4",
  "process-code": "#f59e0b",
  "output-speech": "#ec4899",
  "output-action": "#ef4444",
  "condition-if-else": "#eab308",
  "condition-confidence": "#f97316",
  "condition-time": "#14b8a6",
};

const nodeLabels: Record<NodeType, string> = {
  "input-voice": "Voice Input",
  "input-text": "Text Input",
  "input-api": "API Input",
  "process-llm": "LLM Process",
  "process-rag": "RAG Process",
  "process-code": "Code Process",
  "output-speech": "Speech Output",
  "output-action": "Action Output",
  "condition-if-else": "If/Else",
  "condition-confidence": "Confidence",
  "condition-time": "Time Trigger",
};

// Base Custom Node Component
export function CustomNode({ data, selected }: NodeProps<NodeData>) {
  const Icon = nodeIcons[data.nodeType] || FileText;
  const color = nodeColors[data.nodeType] || "#3b82f6";
  const label = nodeLabels[data.nodeType] || data.label;
  
  const getExecutionBadge = () => {
    if (!data.executionState || data.executionState === "idle") return null;
    
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      running: "default",
      completed: "secondary",
      error: "destructive",
    };
    
    return (
      <Badge variant={variants[data.executionState]} className="absolute -top-2 -right-2 text-xs">
        {data.executionState}
      </Badge>
    );
  };

  return (
    <Card 
      className={`px-4 py-3 min-w-[140px] relative ${selected ? "ring-2 ring-primary" : ""}`}
      style={{ borderColor: color, borderWidth: 2 }}
    >
      {getExecutionBadge()}
      <div className="flex items-center gap-2">
        <div 
          className="p-2 rounded-md"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{data.label || label}</p>
          <p className="text-xs text-muted-foreground truncate">{label}</p>
        </div>
      </div>
      
      {/* Input handles */}
      {!data.nodeType.startsWith("input") && (
        <Handle
          type="target"
          position={Position.Top}
          className="w-3 h-3 !bg-blue-500"
        />
      )}
      
      {/* Output handles */}
      {!data.nodeType.startsWith("output") && data.nodeType !== "condition-if-else" && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="w-3 h-3 !bg-green-500"
        />
      )}
      
      {/* Conditional nodes have multiple outputs */}
      {data.nodeType === "condition-if-else" && (
        <>
          <Handle
            type="source"
            position={Position.Bottom}
            id="true"
            className="w-3 h-3 !bg-green-500"
            style={{ left: "30%" }}
          />
          <Handle
            type="source"
            position={Position.Bottom}
            id="false"
            className="w-3 h-3 !bg-red-500"
            style={{ left: "70%" }}
          />
        </>
      )}
    </Card>
  );
}

// Export node types configuration for the palette
export const nodeTypeConfigs = [
  {
    category: "Input",
    types: [
      { type: "input-voice" as NodeType, label: "Voice Input", icon: Mic, color: "#8b5cf6" },
      { type: "input-text" as NodeType, label: "Text Input", icon: FileText, color: "#6366f1" },
      { type: "input-api" as NodeType, label: "API Input", icon: Globe, color: "#3b82f6" },
    ],
  },
  {
    category: "Process",
    types: [
      { type: "process-llm" as NodeType, label: "LLM", icon: Brain, color: "#10b981" },
      { type: "process-rag" as NodeType, label: "RAG", icon: Database, color: "#06b6d4" },
      { type: "process-code" as NodeType, label: "Code", icon: Code, color: "#f59e0b" },
    ],
  },
  {
    category: "Output",
    types: [
      { type: "output-speech" as NodeType, label: "Speech Output", icon: Volume2, color: "#ec4899" },
      { type: "output-action" as NodeType, label: "Action Output", icon: Zap, color: "#ef4444" },
    ],
  },
  {
    category: "Conditional",
    types: [
      { type: "condition-if-else" as NodeType, label: "If/Else", icon: GitBranch, color: "#eab308" },
      { type: "condition-confidence" as NodeType, label: "Confidence", icon: TrendingUp, color: "#f97316" },
      { type: "condition-time" as NodeType, label: "Time Trigger", icon: Timer, color: "#14b8a6" },
    ],
  },
];

export const nodeTypes = {
  custom: CustomNode,
};
