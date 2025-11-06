import { ChevronRight, ChevronDown, Cpu } from "lucide-react";
import { useState } from "react";
import type { Agent } from "@shared/schema";
import { Badge } from "@/components/ui/badge";

interface AgentHierarchyProps {
  agents: Agent[];
}

export function AgentHierarchy({ agents }: AgentHierarchyProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const renderAgent = (agent: Agent, depth: number = 0) => {
    const children = agents.filter((a) => a.parentAgentId === agent.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedIds.has(agent.id);

    return (
      <div key={agent.id} className="space-y-1">
        <div
          className={`flex items-center gap-2 py-2 px-3 rounded-md hover-elevate ${
            depth > 0 ? 'ml-6' : ''
          }`}
          style={{ paddingLeft: `${depth * 24 + 12}px` }}
          data-testid={`hierarchy-agent-${agent.id}`}
        >
          {hasChildren ? (
            <button
              onClick={() => toggleExpand(agent.id)}
              className="p-0.5 hover-elevate rounded"
              data-testid={`button-expand-${agent.id}`}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          ) : (
            <div className="w-5" />
          )}
          
          <Cpu className="h-4 w-4 text-muted-foreground" />
          
          <span className="text-sm font-medium flex-1">{agent.name}</span>
          
          <Badge variant="outline" className="text-xs capitalize">
            {agent.type}
          </Badge>
          
          <div className={`h-2 w-2 rounded-full ${
            agent.status === 'active' ? 'bg-chart-3' :
            agent.status === 'processing' ? 'bg-chart-1' :
            agent.status === 'error' ? 'bg-destructive' :
            'bg-muted-foreground'
          }`} />
        </div>
        
        {hasChildren && isExpanded && (
          <div>
            {children.map((child) => renderAgent(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const rootAgents = agents.filter((a) => !a.parentAgentId);

  if (rootAgents.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        No agents to display
      </div>
    );
  }

  return (
    <div className="space-y-2" data-testid="agent-hierarchy">
      {rootAgents.map((agent) => renderAgent(agent))}
    </div>
  );
}
