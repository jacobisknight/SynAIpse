import { useState, useCallback, useRef, useEffect } from "react";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Save, 
  Trash2, 
  List,
  History,
  RotateCcw
} from "lucide-react";
import type { Workflow } from "@shared/schema";
import { nodeTypes, nodeTypeConfigs, type NodeData, type NodeType } from "./custom-nodes";
import { NodePropertiesPanel } from "./node-properties-panel";
import { TestRunPanel } from "./test-run-panel";

interface EnhancedWorkflowBuilderProps {
  workflow: Workflow;
  onBack: () => void;
  onSave: (nodes: Node[], edges: Edge[]) => void;
  onDelete: () => void;
  onVersionHistory?: () => void;
  isSaving: boolean;
  isDeleting: boolean;
}

function EnhancedWorkflowBuilder({
  workflow,
  onBack,
  onSave,
  onDelete,
  onVersionHistory,
  isSaving,
  isDeleting,
}: EnhancedWorkflowBuilderProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { project } = useReactFlow();
  const [selectedNode, setSelectedNode] = useState<Node<NodeData> | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<NodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [showTestPanel, setShowTestPanel] = useState(false);
  const [nodeExecutionStates, setNodeExecutionStates] = useState<Map<string, any>>(new Map());

  const onConnect = useCallback(
    (params: Connection) => {
      // For conditional nodes, ensure proper handle IDs
      const sourceNode = nodes.find(n => n.id === params.source);
      if (sourceNode?.data.nodeType === "condition-if-else") {
        // Ensure the edge has the correct sourceHandle
        params.sourceHandle = params.sourceHandle || "true";
      }
      setEdges((eds) => addEdge(params, eds));
    },
    [setEdges, nodes]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const nodeType = event.dataTransfer.getData("application/reactflow") as NodeType;
      if (!nodeType || !reactFlowWrapper.current) return;

      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = project({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });

      const newNode: Node<NodeData> = {
        id: `${nodeType}-${Date.now()}`,
        type: "custom",
        position,
        data: {
          label: nodeType.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
          nodeType,
          config: {},
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [project, setNodes]
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node<NodeData>) => {
    setSelectedNode(node);
  }, []);

  const handleUpdateNode = useCallback((nodeId: string, updates: Partial<NodeData>) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...updates } }
          : node
      )
    );
    if (selectedNode?.id === nodeId) {
      setSelectedNode({ ...selectedNode, data: { ...selectedNode.data, ...updates } });
    }
  }, [setNodes, selectedNode]);

  const handleDeleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
    }
  }, [setNodes, setEdges, selectedNode]);

  const handleNodeStateUpdate = useCallback((nodeId: string, state: any) => {
    setNodeExecutionStates((prev) => {
      const next = new Map(prev);
      next.set(nodeId, state);
      return next;
    });

    // Update node visual state
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, executionState: state.status, executionResult: state.result } }
          : node
      )
    );
  }, [setNodes]);

  const handleResetExecution = useCallback(() => {
    setNodeExecutionStates(new Map());
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: { ...node.data, executionState: "idle", executionResult: undefined },
      }))
    );
  }, [setNodes]);

  // Load workflow data
  useEffect(() => {
    if (workflow.nodes && Array.isArray(workflow.nodes)) {
      const loadedNodes = workflow.nodes.map((node: any) => ({
        ...node,
        type: "custom",
        data: {
          ...node.data,
          executionState: "idle",
        },
      }));
      setNodes(loadedNodes);
    }
    if (workflow.edges && Array.isArray(workflow.edges)) {
      setEdges(workflow.edges);
    }
  }, [workflow.id, setNodes, setEdges]);

  return (
    <div className="flex-1 flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <List className="h-4 w-4 mr-2" />
            Back to List
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div>
            <h2 className="text-lg font-semibold">{workflow.name}</h2>
            <p className="text-xs text-muted-foreground">{workflow.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="capitalize">
            {workflow.status}
          </Badge>
          {onVersionHistory && (
            <Button variant="outline" size="sm" onClick={onVersionHistory}>
              <History className="h-4 w-4 mr-2" />
              Versions
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTestPanel(!showTestPanel)}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            {showTestPanel ? "Hide" : "Show"} Test Panel
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSave(nodes, edges)}
            disabled={isSaving}
          >
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onDelete}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Node Palette */}
        <div className="w-64 border-r p-4 space-y-4 overflow-y-auto">
          <div>
            <h3 className="text-sm font-semibold mb-3">Node Palette</h3>
            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="space-y-4">
                {nodeTypeConfigs.map((category) => (
                  <div key={category.category}>
                    <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase">
                      {category.category}
                    </h4>
                    <div className="space-y-2">
                      {category.types.map((nodeType) => {
                        const Icon = nodeType.icon;
                        return (
                          <div
                            key={nodeType.type}
                            draggable
                            onDragStart={(event) => {
                              event.dataTransfer.setData("application/reactflow", nodeType.type);
                              event.dataTransfer.effectAllowed = "move";
                            }}
                            className="flex items-center gap-3 p-3 border rounded-md hover:bg-accent cursor-move transition-colors"
                          >
                            <div
                              className="w-8 h-8 rounded flex items-center justify-center text-white"
                              style={{ backgroundColor: nodeType.color }}
                            >
                              <Icon className="h-4 w-4" />
                            </div>
                            <span className="text-sm font-medium">{nodeType.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            connectionLineStyle={{ stroke: "#3b82f6", strokeWidth: 2 }}
            defaultEdgeOptions={{ style: { strokeWidth: 2 } }}
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

        {/* Right Sidebar */}
        <div className="flex">
          {showTestPanel ? (
            <div className="w-96 border-l">
              <TestRunPanel
                nodes={nodes}
                edges={edges}
                onNodeStateUpdate={handleNodeStateUpdate}
                onReset={handleResetExecution}
              />
            </div>
          ) : (
            <NodePropertiesPanel
              node={selectedNode}
              onUpdate={handleUpdateNode}
              onDelete={handleDeleteNode}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export function EnhancedWorkflowBuilderWrapper(props: EnhancedWorkflowBuilderProps) {
  return (
    <ReactFlowProvider>
      <EnhancedWorkflowBuilder {...props} />
    </ReactFlowProvider>
  );
}
