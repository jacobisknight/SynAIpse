import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Cpu, Mic, Workflow, Database, Play, Square, Trash2, GitBranch } from "lucide-react";
import { CreateAgentModal } from "@/components/create-agent-modal";
import { DecomposeTaskModal } from "@/components/decompose-task-modal";
import { AgentHierarchy } from "@/components/agent-hierarchy";
import type { Agent } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const agentTypeIcons = {
  voice: Mic,
  workflow: Workflow,
  data: Database,
};

const statusColors = {
  active: "bg-chart-3",
  idle: "bg-muted-foreground",
  processing: "bg-chart-1",
  error: "bg-destructive",
  stopped: "bg-muted-foreground",
};

export default function Agents() {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [decomposeModalOpen, setDecomposeModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [deleteAgentId, setDeleteAgentId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleDecompose = (agent: Agent) => {
    setSelectedAgent(agent);
    setDecomposeModalOpen(true);
  };

  const { data: agents, isLoading } = useQuery<Agent[]>({
    queryKey: ["/api/agents"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return await apiRequest("PATCH", `/api/agents/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/agents/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Agent deleted",
        description: "The agent has been removed.",
      });
      setDeleteAgentId(null);
    },
  });

  const parentAgents = agents?.filter((a) => !a.isSubAgent) || [];

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">Agents</h1>
          <p className="text-sm text-muted-foreground">
            Manage your autonomous AI agents and sub-agent hierarchies
          </p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)} data-testid="button-create-agent">
          <Plus className="h-4 w-4 mr-2" />
          Create Agent
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : parentAgents.length > 0 ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {parentAgents.map((agent) => {
              const Icon = agentTypeIcons[agent.type as keyof typeof agentTypeIcons] || Cpu;
              const subAgents = agents?.filter((a) => a.parentAgentId === agent.id) || [];

              return (
                <Card key={agent.id} data-testid={`card-agent-${agent.id}`}>
                  <CardHeader className="flex flex-row items-start justify-between gap-1 space-y-0">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-base">{agent.name}</CardTitle>
                        <CardDescription className="capitalize">{agent.type} Agent</CardDescription>
                      </div>
                    </div>
                    <div className={`h-2 w-2 rounded-full ${statusColors[agent.status as keyof typeof statusColors]}`} data-testid={`status-${agent.id}`} />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="capitalize" data-testid={`badge-status-${agent.id}`}>
                        {agent.status}
                      </Badge>
                      {subAgents.length > 0 && (
                        <Badge variant="outline" data-testid={`badge-subagents-${agent.id}`}>
                          {subAgents.length} sub-agent{subAgents.length !== 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>

                    {agent.goals && agent.goals.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        <p className="font-medium mb-1">Goals:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {agent.goals.slice(0, 2).map((goal, idx) => (
                            <li key={idx} className="truncate">{goal}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex flex-col gap-2 pt-2">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant={agent.status === 'active' ? "destructive" : "default"}
                          onClick={() =>
                            updateStatusMutation.mutate({
                              id: agent.id,
                              status: agent.status === 'active' ? 'stopped' : 'active',
                            })
                          }
                          data-testid={`button-toggle-${agent.id}`}
                          className="flex-1"
                        >
                          {agent.status === 'active' ? (
                            <>
                              <Square className="h-3 w-3 mr-2" />
                              Stop
                            </>
                          ) : (
                            <>
                              <Play className="h-3 w-3 mr-2" />
                              Start
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDeleteAgentId(agent.id)}
                          data-testid={`button-delete-${agent.id}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDecompose(agent)}
                        data-testid={`button-decompose-${agent.id}`}
                        className="w-full"
                      >
                        <GitBranch className="h-3 w-3 mr-2" />
                        Decompose Task
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Agent Hierarchy Visualization */}
          <Card>
            <CardHeader>
              <CardTitle>Agent Hierarchy</CardTitle>
              <CardDescription>
                Visualize parent-child agent relationships and task delegation chains
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AgentHierarchy agents={agents || []} />
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Cpu className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No agents yet</h3>
            <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
              Create your first autonomous agent to start orchestrating AI workflows across your enterprise
            </p>
            <Button onClick={() => setCreateModalOpen(true)} data-testid="button-create-first-agent">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Agent
            </Button>
          </CardContent>
        </Card>
      )}

      <CreateAgentModal open={createModalOpen} onOpenChange={setCreateModalOpen} />
      <DecomposeTaskModal 
        open={decomposeModalOpen} 
        onOpenChange={setDecomposeModalOpen}
        agent={selectedAgent}
      />

      <AlertDialog open={!!deleteAgentId} onOpenChange={() => setDeleteAgentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Agent</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this agent? This action cannot be undone and will also remove all sub-agents.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteAgentId && deleteMutation.mutate(deleteAgentId)}
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
