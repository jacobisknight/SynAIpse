import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ArrowsRightLeft, Play } from "lucide-react";
import type { Agent } from "@shared/schema";

export default function Workflows() {
  const { data: agents } = useQuery<Agent[]>({
    queryKey: ["/api/agents"],
  });

  const workflowAgents = agents?.filter((a) => a.type === "workflow") || [];

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">Workflows</h1>
          <p className="text-sm text-muted-foreground">
            Design and manage automated business process workflows
          </p>
        </div>
        <Button data-testid="button-create-workflow">
          <Plus className="h-4 w-4 mr-2" />
          Create Workflow
        </Button>
      </div>

      {workflowAgents.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {workflowAgents.map((agent) => (
            <Card key={agent.id} className="hover-elevate" data-testid={`card-workflow-${agent.id}`}>
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                    <ArrowsRightLeft className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base">{agent.name}</CardTitle>
                    <CardDescription className="capitalize">{agent.status}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {agent.goals && agent.goals.length > 0 && (
                  <div className="text-xs text-muted-foreground mb-4">
                    <p className="font-medium mb-2">Workflow Steps:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {agent.goals.slice(0, 3).map((goal, idx) => (
                        <li key={idx} className="truncate">{goal}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <Button size="sm" variant="outline" className="w-full" data-testid={`button-view-${agent.id}`}>
                  <Play className="h-3 w-3 mr-2" />
                  View Workflow
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ArrowsRightLeft className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No workflows yet</h3>
            <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
              Create workflow agents to automate complex business processes with intelligent decision-making
            </p>
            <Button data-testid="button-create-first-workflow">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Workflow
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Workflow Canvas Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Workflow Builder</CardTitle>
          <CardDescription>
            Visual workflow canvas coming soon - drag-and-drop interface for building agent workflows
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed rounded-lg p-16 text-center">
            <ArrowsRightLeft className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              Interactive workflow builder with node-based editing
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
