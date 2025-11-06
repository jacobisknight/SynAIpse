import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Plus, 
  ArrowRight,
  FileText,
} from "lucide-react";
import type { Workflow } from "@shared/schema";
import { EnhancedWorkflowBuilderWrapper } from "@/components/flow-builder/enhanced-workflow-builder";
import { Node, Edge } from "reactflow";
import { VersionHistoryDialog } from "@/components/flow-builder/version-history-dialog";

export default function Workflows() {
  const { toast } = useToast();
  const [view, setView] = useState<"list" | "builder">("list");
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const [newWorkflowName, setNewWorkflowName] = useState("");
  const [newWorkflowDescription, setNewWorkflowDescription] = useState("");

  const { data: workflows, isLoading } = useQuery<Workflow[]>({
    queryKey: ["/api/workflows"],
  });

  const createWorkflowMutation = useMutation<Workflow, Error, { name: string; description: string }>({
    mutationFn: async (data: { name: string; description: string }) => {
      const res = await apiRequest("POST", "/api/workflows", {
        organizationId: "demo-org",
        name: data.name,
        description: data.description,
        status: "draft",
        nodes: [],
        edges: [],
      });
      return await res.json();
    },
    onSuccess: (newWorkflow) => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
      toast({
        title: "Workflow created",
        description: `"${newWorkflow.name}" has been created successfully.`,
      });
      setIsCreateDialogOpen(false);
      setNewWorkflowName("");
      setNewWorkflowDescription("");
      setSelectedWorkflow(newWorkflow);
      setView("builder");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create workflow",
        variant: "destructive",
      });
    },
  });

  const updateWorkflowMutation = useMutation({
    mutationFn: async (data: { id: string; nodes: any[]; edges: any[] }) => {
      return apiRequest("PATCH", `/api/workflows/${data.id}`, {
        nodes: data.nodes,
        edges: data.edges,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
      toast({
        title: "Workflow saved",
        description: "Your changes have been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save workflow",
        variant: "destructive",
      });
    },
  });

  const deleteWorkflowMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/workflows/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
      toast({
        title: "Workflow deleted",
        description: "The workflow has been deleted successfully.",
      });
      setSelectedWorkflow(null);
      setView("list");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete workflow",
        variant: "destructive",
      });
    },
  });

  const handleSaveWorkflow = (nodes: Node[], edges: Edge[]) => {
    if (!selectedWorkflow) return;
    updateWorkflowMutation.mutate({
      id: selectedWorkflow.id,
      nodes,
      edges,
    });
  };

  const handleDeleteWorkflow = () => {
    if (!selectedWorkflow) return;
    if (confirm(`Are you sure you want to delete "${selectedWorkflow.name}"?`)) {
      deleteWorkflowMutation.mutate(selectedWorkflow.id);
    }
  };

  const handleLoadWorkflow = (workflow: Workflow) => {
    setSelectedWorkflow(workflow);
    setView("builder");
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <p className="text-muted-foreground">Loading workflows...</p>
      </div>
    );
  }

  if (view === "builder" && selectedWorkflow) {
    return (
      <>
        <EnhancedWorkflowBuilderWrapper 
          workflow={selectedWorkflow}
          onBack={() => setView("list")}
          onSave={handleSaveWorkflow}
          onDelete={handleDeleteWorkflow}
          onVersionHistory={() => setIsVersionHistoryOpen(true)}
          isSaving={updateWorkflowMutation.isPending}
          isDeleting={deleteWorkflowMutation.isPending}
        />
        {isVersionHistoryOpen && (
          <VersionHistoryDialog
            workflowId={selectedWorkflow.id}
            open={isVersionHistoryOpen}
            onOpenChange={setIsVersionHistoryOpen}
            onRestore={() => {
              queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
              queryClient.invalidateQueries({ queryKey: [`/api/workflows/${selectedWorkflow.id}`] });
              setIsVersionHistoryOpen(false);
            }}
          />
        )}
      </>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">Workflows</h1>
          <p className="text-sm text-muted-foreground">
            Design and manage automated business process workflows
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-create-workflow">
          <Plus className="h-4 w-4 mr-2" />
          Create Workflow
        </Button>
      </div>

      {workflows && workflows.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {workflows.map((workflow) => (
            <Card
              key={workflow.id}
              className="hover-elevate cursor-pointer"
              onClick={() => handleLoadWorkflow(workflow)}
              data-testid={`card-workflow-${workflow.id}`}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1">
                    <CardTitle className="text-base">{workflow.name}</CardTitle>
                    <CardDescription className="mt-1">{workflow.description}</CardDescription>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {workflow.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {Array.isArray(workflow.nodes) ? workflow.nodes.length : 0} nodes
                  </div>
                  <div className="flex items-center gap-1">
                    <ArrowRight className="h-3 w-3" />
                    {Array.isArray(workflow.edges) ? workflow.edges.length : 0} connections
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No workflows yet</h3>
            <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
              Create workflow templates to automate complex business processes with visual workflow builder
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-create-first-workflow">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Workflow
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent data-testid="dialog-create-workflow">
          <DialogHeader>
            <DialogTitle>Create New Workflow</DialogTitle>
            <DialogDescription>
              Define a new automated workflow for your business processes
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="workflow-name">Workflow Name</Label>
              <Input
                id="workflow-name"
                value={newWorkflowName}
                onChange={(e) => setNewWorkflowName(e.target.value)}
                placeholder="e.g., Customer Onboarding"
                data-testid="input-workflow-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="workflow-description">Description</Label>
              <Textarea
                id="workflow-description"
                value={newWorkflowDescription}
                onChange={(e) => setNewWorkflowDescription(e.target.value)}
                placeholder="Describe what this workflow does..."
                rows={3}
                data-testid="input-workflow-description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createWorkflowMutation.mutate({ name: newWorkflowName, description: newWorkflowDescription })}
              disabled={!newWorkflowName || createWorkflowMutation.isPending}
              data-testid="button-confirm-create-workflow"
            >
              Create Workflow
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
