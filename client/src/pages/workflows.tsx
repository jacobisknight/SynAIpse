import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
  Panel,
  useReactFlow,
  ReactFlowProvider,
} from "reactflow";
import "reactflow/dist/style.css";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Plus, 
  Play, 
  Save, 
  Trash2, 
  CircleDot, 
  Square, 
  Diamond, 
  Circle, 
  ArrowRight,
  FileText,
  List
} from "lucide-react";
import type { Workflow } from "@shared/schema";

const nodeColorMap: Record<string, string> = {
  start: "#22c55e",
  action: "#3b82f6",
  decision: "#eab308",
  end: "#ef4444",
};

const nodeTypes = [
  { type: "start", label: "Start", icon: CircleDot, color: "#22c55e" },
  { type: "action", label: "Action", icon: Square, color: "#3b82f6" },
  { type: "decision", label: "Decision", icon: Diamond, color: "#eab308" },
  { type: "end", label: "End", icon: Circle, color: "#ef4444" },
];

function WorkflowBuilder({ 
  workflow, 
  onBack, 
  onSave, 
  onExecute, 
  onDelete,
  isSaving,
  isExecuting,
  isDeleting,
}: { 
  workflow: Workflow;
  onBack: () => void;
  onSave: (nodes: Node[], edges: Edge[]) => void;
  onExecute: () => void;
  onDelete: () => void;
  isSaving: boolean;
  isExecuting: boolean;
  isDeleting: boolean;
}) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { project } = useReactFlow();
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData("application/reactflow");
      if (!type || !reactFlowWrapper.current) return;

      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = project({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });

      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type: "default",
        position,
        data: { label: type.charAt(0).toUpperCase() + type.slice(1), nodeType: type },
        style: {
          backgroundColor: nodeColorMap[type] || "#3b82f6",
          color: "white",
          border: "2px solid white",
          borderRadius: "8px",
          padding: "10px",
          minWidth: "120px",
          textAlign: "center",
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [project, setNodes]
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const handleUpdateNodeLabel = (newLabel: string) => {
    if (!selectedNode) return;
    setNodes((nds) =>
      nds.map((node) =>
        node.id === selectedNode.id
          ? { ...node, data: { ...node.data, label: newLabel } }
          : node
      )
    );
    setSelectedNode({ ...selectedNode, data: { ...selectedNode.data, label: newLabel } });
  };

  useEffect(() => {
    const loadedNodes = Array.isArray(workflow.nodes) ? workflow.nodes.map((node: any) => ({
      ...node,
      style: {
        backgroundColor: nodeColorMap[node.data?.nodeType] || nodeColorMap[node.type] || "#3b82f6",
        color: "white",
        border: "2px solid white",
        borderRadius: "8px",
        padding: "10px",
        minWidth: "120px",
        textAlign: "center",
      },
    })) : [];
    const loadedEdges = Array.isArray(workflow.edges) ? workflow.edges : [];
    setNodes(loadedNodes);
    setEdges(loadedEdges);
  }, [workflow.id]);

  return (
    <div className="flex-1 flex flex-col h-screen">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            data-testid="button-back-to-list"
          >
            <List className="h-4 w-4 mr-2" />
            Back to List
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div>
            <h2 className="text-lg font-semibold" data-testid="text-workflow-name">{workflow.name}</h2>
            <p className="text-xs text-muted-foreground">{workflow.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="capitalize">
            {workflow.status}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSave(nodes, edges)}
            disabled={isSaving}
            data-testid="button-save-workflow"
          >
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onExecute}
            disabled={isExecuting}
            data-testid="button-run-workflow"
          >
            <Play className="h-4 w-4 mr-2" />
            Run
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onDelete}
            disabled={isDeleting}
            data-testid="button-delete-workflow"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="flex-1 flex">
        <div className="w-64 border-r p-4 space-y-4" data-testid="panel-node-palette">
          <div>
            <h3 className="text-sm font-semibold mb-3">Node Palette</h3>
            <div className="space-y-2">
              {nodeTypes.map((nodeType) => (
                <div
                  key={nodeType.type}
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData("application/reactflow", nodeType.type);
                    event.dataTransfer.effectAllowed = "move";
                  }}
                  className="flex items-center gap-3 p-3 border rounded-md hover-elevate cursor-move"
                  data-testid={`node-palette-${nodeType.type}`}
                >
                  <div 
                    className="w-8 h-8 rounded flex items-center justify-center text-white"
                    style={{ backgroundColor: nodeType.color }}
                  >
                    <nodeType.icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium">{nodeType.label}</span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-sm font-semibold mb-3">Instructions</h3>
            <p className="text-xs text-muted-foreground">
              Drag nodes from the palette onto the canvas. Click and drag from the edge of a node to connect it to another node.
            </p>
          </div>
        </div>

        <div className="flex-1 relative" ref={reactFlowWrapper} data-testid="canvas-workflow">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            fitView
          >
            <Panel position="top-right" className="bg-background border rounded-md p-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{nodes.length} nodes</Badge>
                <Badge variant="secondary">{edges.length} connections</Badge>
              </div>
            </Panel>
            <Controls />
            <MiniMap />
            <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
          </ReactFlow>
        </div>

        {selectedNode && (
          <div className="w-80 border-l p-4 space-y-4" data-testid="panel-properties">
            <div>
              <h3 className="text-sm font-semibold mb-3">Node Properties</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="node-label">Label</Label>
                  <Input
                    id="node-label"
                    value={selectedNode.data.label || ""}
                    onChange={(e) => handleUpdateNodeLabel(e.target.value)}
                    placeholder="Enter node label"
                    data-testid="input-node-label"
                  />
                </div>
                <div>
                  <Label>Node Type</Label>
                  <p className="text-sm text-muted-foreground capitalize">
                    {selectedNode.data.nodeType || "default"}
                  </p>
                </div>
                <div>
                  <Label>Node ID</Label>
                  <p className="text-xs font-mono text-muted-foreground">{selectedNode.id}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
                    setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
                    setSelectedNode(null);
                  }}
                  data-testid="button-delete-node"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Node
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Workflows() {
  const { toast } = useToast();
  const [view, setView] = useState<"list" | "builder">("list");
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
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

  const executeWorkflowMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("POST", `/api/workflows/${id}/execute`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
      toast({
        title: "Workflow executed",
        description: "The workflow has been started successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to execute workflow",
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

  const handleExecuteWorkflow = () => {
    if (!selectedWorkflow) return;
    executeWorkflowMutation.mutate(selectedWorkflow.id);
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
      <ReactFlowProvider>
        <WorkflowBuilder 
          workflow={selectedWorkflow}
          onBack={() => setView("list")}
          onSave={handleSaveWorkflow}
          onExecute={handleExecuteWorkflow}
          onDelete={handleDeleteWorkflow}
          isSaving={updateWorkflowMutation.isPending}
          isExecuting={executeWorkflowMutation.isPending}
          isDeleting={deleteWorkflowMutation.isPending}
        />
      </ReactFlowProvider>
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
                    <Square className="h-3 w-3" />
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
