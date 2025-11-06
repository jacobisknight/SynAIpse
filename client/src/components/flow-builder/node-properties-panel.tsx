import React from "react";
import { Node } from "reactflow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Trash2 } from "lucide-react";
import type { NodeData, NodeType } from "./custom-nodes";

interface NodePropertiesPanelProps {
  node: Node<NodeData> | null;
  onUpdate: (nodeId: string, updates: Partial<NodeData>) => void;
  onDelete: (nodeId: string) => void;
}

export function NodePropertiesPanel({ node, onUpdate, onDelete }: NodePropertiesPanelProps) {
  if (!node) {
    return (
      <div className="w-80 border-l p-4">
        <p className="text-sm text-muted-foreground">Select a node to edit its properties</p>
      </div>
    );
  }

  const handleUpdate = (updates: Partial<NodeData>) => {
    onUpdate(node.id, updates);
  };

  const renderNodeSpecificConfig = () => {
    const nodeType = node.data.nodeType;
    const config = node.data.config || {};

    switch (nodeType) {
      case "input-voice":
        return (
          <>
            <div className="space-y-2">
              <Label>Language</Label>
              <Select
                value={config.language || "en"}
                onValueChange={(value) => handleUpdate({ config: { ...config, language: value } })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Voice Provider</Label>
              <Select
                value={config.provider || "whisper"}
                onValueChange={(value) => handleUpdate({ config: { ...config, provider: value } })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="whisper">Whisper</SelectItem>
                  <SelectItem value="deepgram">Deepgram</SelectItem>
                  <SelectItem value="openai">OpenAI</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );

      case "input-text":
        return (
          <div className="space-y-2">
            <Label>Default Value</Label>
            <Textarea
              value={config.defaultValue || ""}
              onChange={(e) => handleUpdate({ config: { ...config, defaultValue: e.target.value } })}
              placeholder="Enter default text..."
              rows={3}
            />
          </div>
        );

      case "input-api":
        return (
          <>
            <div className="space-y-2">
              <Label>API Endpoint</Label>
              <Input
                value={config.endpoint || ""}
                onChange={(e) => handleUpdate({ config: { ...config, endpoint: e.target.value } })}
                placeholder="https://api.example.com/endpoint"
              />
            </div>
            <div className="space-y-2">
              <Label>Method</Label>
              <Select
                value={config.method || "GET"}
                onValueChange={(value) => handleUpdate({ config: { ...config, method: value } })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );

      case "process-llm":
        return (
          <>
            <div className="space-y-2">
              <Label>Model</Label>
              <Select
                value={config.model || "gpt-4"}
                onValueChange={(value) => handleUpdate({ config: { ...config, model: value } })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4">GPT-4</SelectItem>
                  <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                  <SelectItem value="claude-3">Claude 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Temperature</Label>
              <Input
                type="number"
                min="0"
                max="2"
                step="0.1"
                value={config.temperature || "0.7"}
                onChange={(e) => handleUpdate({ config: { ...config, temperature: parseFloat(e.target.value) } })}
              />
            </div>
            <div className="space-y-2">
              <Label>System Prompt</Label>
              <Textarea
                value={config.systemPrompt || ""}
                onChange={(e) => handleUpdate({ config: { ...config, systemPrompt: e.target.value } })}
                placeholder="Enter system prompt..."
                rows={4}
              />
            </div>
          </>
        );

      case "process-rag":
        return (
          <>
            <div className="space-y-2">
              <Label>Knowledge Base</Label>
              <Select
                value={config.knowledgeBase || ""}
                onValueChange={(value) => handleUpdate({ config: { ...config, knowledgeBase: value } })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select knowledge base" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default Knowledge Base</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Top K Results</Label>
              <Input
                type="number"
                min="1"
                max="20"
                value={config.topK || "5"}
                onChange={(e) => handleUpdate({ config: { ...config, topK: parseInt(e.target.value) } })}
              />
            </div>
          </>
        );

      case "process-code":
        return (
          <div className="space-y-2">
            <Label>Code</Label>
            <Textarea
              value={config.code || ""}
              onChange={(e) => handleUpdate({ config: { ...config, code: e.target.value } })}
              placeholder="Enter code..."
              rows={8}
              className="font-mono text-sm"
            />
          </div>
        );

      case "output-speech":
        return (
          <>
            <div className="space-y-2">
              <Label>Voice Provider</Label>
              <Select
                value={config.provider || "elevenlabs"}
                onValueChange={(value) => handleUpdate({ config: { ...config, provider: value } })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="elevenlabs">ElevenLabs</SelectItem>
                  <SelectItem value="openai">OpenAI TTS</SelectItem>
                  <SelectItem value="azure">Azure TTS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Voice ID</Label>
              <Input
                value={config.voiceId || ""}
                onChange={(e) => handleUpdate({ config: { ...config, voiceId: e.target.value } })}
                placeholder="Enter voice ID"
              />
            </div>
          </>
        );

      case "output-action":
        return (
          <>
            <div className="space-y-2">
              <Label>Action Type</Label>
              <Select
                value={config.actionType || "webhook"}
                onValueChange={(value) => handleUpdate({ config: { ...config, actionType: value } })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="webhook">Webhook</SelectItem>
                  <SelectItem value="integration">Integration</SelectItem>
                  <SelectItem value="api">API Call</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Target</Label>
              <Input
                value={config.target || ""}
                onChange={(e) => handleUpdate({ config: { ...config, target: e.target.value } })}
                placeholder="Enter target URL or integration name"
              />
            </div>
          </>
        );

      case "condition-if-else":
        return (
          <div className="space-y-2">
            <Label>Condition</Label>
            <Textarea
              value={config.condition || ""}
              onChange={(e) => handleUpdate({ config: { ...config, condition: e.target.value } })}
              placeholder="Enter condition (e.g., value > 10)"
              rows={3}
            />
          </div>
        );

      case "condition-confidence":
        return (
          <div className="space-y-2">
            <Label>Confidence Threshold</Label>
            <Input
              type="number"
              min="0"
              max="1"
              step="0.1"
              value={config.threshold || "0.8"}
              onChange={(e) => handleUpdate({ config: { ...config, threshold: parseFloat(e.target.value) } })}
            />
            <p className="text-xs text-muted-foreground">
              If confidence is above threshold, take "true" path, otherwise "false"
            </p>
          </div>
        );

      case "condition-time":
        return (
          <>
            <div className="space-y-2">
              <Label>Trigger Type</Label>
              <Select
                value={config.triggerType || "schedule"}
                onValueChange={(value) => handleUpdate({ config: { ...config, triggerType: value } })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="schedule">Scheduled</SelectItem>
                  <SelectItem value="delay">Delay</SelectItem>
                  <SelectItem value="timeout">Timeout</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cron Expression / Duration (seconds)</Label>
              <Input
                value={config.schedule || ""}
                onChange={(e) => handleUpdate({ config: { ...config, schedule: e.target.value } })}
                placeholder="0 0 * * * or 3600"
              />
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-80 border-l p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Node Properties</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Label</Label>
            <Input
              value={node.data.label || ""}
              onChange={(e) => handleUpdate({ label: e.target.value })}
              placeholder="Enter node label"
            />
          </div>

          <div className="space-y-2">
            <Label>Node Type</Label>
            <p className="text-sm text-muted-foreground capitalize">
              {node.data.nodeType.replace(/-/g, " ")}
            </p>
          </div>

          <Separator />

          {renderNodeSpecificConfig()}

          <Separator />

          <Button
            variant="destructive"
            size="sm"
            className="w-full"
            onClick={() => onDelete(node.id)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Node
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
