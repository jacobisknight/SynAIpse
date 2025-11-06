import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Play, Square, RotateCcw, CheckCircle2, XCircle, Clock } from "lucide-react";
import { WorkflowExecutionEngine, ExecutionTrace } from "./execution-engine";
import { Node, Edge } from "reactflow";
import type { NodeData } from "./custom-nodes";

interface TestRunPanelProps {
  nodes: Node<NodeData>[];
  edges: Edge[];
  onNodeStateUpdate: (nodeId: string, state: any) => void;
  onReset: () => void;
}

export function TestRunPanel({ nodes, edges, onNodeStateUpdate, onReset }: TestRunPanelProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [trace, setTrace] = useState<ExecutionTrace[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Recreate execution engine when nodes or edges change
  const executionEngine = useMemo(
    () => new WorkflowExecutionEngine(nodes, edges),
    [nodes, edges]
  );

  const handleRun = async () => {
    setIsRunning(true);
    setError(null);
    setTrace([]);
    onReset();

    try {
      const result = await executionEngine.execute((nodeId, state) => {
        onNodeStateUpdate(nodeId, state);
      });

      setTrace(result.trace);
      
      if (!result.success) {
        setError(result.error || "Execution failed");
      }
    } catch (err: any) {
      setError(err.message || "Execution error");
    } finally {
      setIsRunning(false);
    }
  };

  const handleStop = () => {
    setIsRunning(false);
    executionEngine.reset();
    onReset();
  };

  const getStatusIcon = (status: "success" | "error") => {
    if (status === "success") {
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    }
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const totalDuration = trace.reduce((sum, t) => sum + t.duration, 0);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Test Run</CardTitle>
          <div className="flex items-center gap-2">
            {isRunning ? (
              <Button variant="destructive" size="sm" onClick={handleStop}>
                <Square className="h-4 w-4 mr-2" />
                Stop
              </Button>
            ) : (
              <Button size="sm" onClick={handleRun} disabled={nodes.length === 0}>
                <Play className="h-4 w-4 mr-2" />
                Run Test
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col space-y-4">
        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {trace.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Execution Summary</span>
              <Badge variant="secondary">
                {trace.length} steps • {totalDuration}ms
              </Badge>
            </div>
            <Separator />
          </div>
        )}

        <ScrollArea className="flex-1">
          <div className="space-y-2">
            {trace.length === 0 && !isRunning && (
              <p className="text-sm text-muted-foreground text-center py-8">
                Click "Run Test" to execute the workflow
              </p>
            )}

            {isRunning && trace.length === 0 && (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Executing workflow...</span>
                </div>
              </div>
            )}

            {trace.map((step, index) => (
              <Card key={index} className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 flex-1">
                    {getStatusIcon(step.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-muted-foreground">
                          Step {step.step}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {step.nodeType.replace(/-/g, " ")}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium">{step.nodeId}</p>
                      {step.output && (
                        <div className="mt-2 p-2 bg-muted rounded text-xs font-mono">
                          <div className="text-muted-foreground mb-1">Output:</div>
                          <pre className="whitespace-pre-wrap break-words">
                            {JSON.stringify(step.output, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {step.duration}ms
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
