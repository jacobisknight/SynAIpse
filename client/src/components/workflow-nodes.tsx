import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { 
  Mic, 
  MessageSquare, 
  Webhook, 
  Brain, 
  Database, 
  Code, 
  Volume2, 
  Zap, 
  GitBranch, 
  Clock, 
  Shield,
  PlayCircle,
  StopCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface NodeData {
  label: string;
  nodeType: string;
  config?: any;
  description?: string;
  status?: 'idle' | 'running' | 'success' | 'error';
}

const nodeConfig: Record<string, { icon: any; color: string; category: string }> = {
  // Input nodes
  'input-voice': { icon: Mic, color: '#10b981', category: 'input' },
  'input-text': { icon: MessageSquare, color: '#10b981', category: 'input' },
  'input-api': { icon: Webhook, color: '#10b981', category: 'input' },
  
  // Process nodes
  'process-llm': { icon: Brain, color: '#3b82f6', category: 'process' },
  'process-rag': { icon: Database, color: '#3b82f6', category: 'process' },
  'process-code': { icon: Code, color: '#3b82f6', category: 'process' },
  
  // Output nodes
  'output-speech': { icon: Volume2, color: '#8b5cf6', category: 'output' },
  'output-action': { icon: Zap, color: '#8b5cf6', category: 'output' },
  
  // Logic nodes
  'logic-condition': { icon: GitBranch, color: '#eab308', category: 'logic' },
  'logic-timer': { icon: Clock, color: '#eab308', category: 'logic' },
  'logic-threshold': { icon: Shield, color: '#eab308', category: 'logic' },
  
  // Control nodes
  'control-start': { icon: PlayCircle, color: '#22c55e', category: 'control' },
  'control-end': { icon: StopCircle, color: '#ef4444', category: 'control' },
};

export const CustomNode = memo(({ data, selected }: NodeProps<NodeData>) => {
  const config = nodeConfig[data.nodeType] || nodeConfig['process-llm'];
  const Icon = config.icon;
  
  const statusColors = {
    idle: 'bg-gray-500',
    running: 'bg-blue-500 animate-pulse',
    success: 'bg-green-500',
    error: 'bg-red-500',
  };

  const statusColor = data.status ? statusColors[data.status] : statusColors.idle;

  return (
    <Card 
      className={`min-w-[180px] ${selected ? 'ring-2 ring-primary' : ''}`}
      style={{ borderColor: config.color, borderWidth: '2px' }}
    >
      <div className="p-3 space-y-2">
        <div className="flex items-center gap-2">
          <div 
            className="w-8 h-8 rounded-md flex items-center justify-center text-white"
            style={{ backgroundColor: config.color }}
          >
            <Icon className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm truncate">{data.label}</div>
            {data.description && (
              <div className="text-xs text-muted-foreground truncate">
                {data.description}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs">
            {config.category}
          </Badge>
          {data.status && (
            <div className={`w-2 h-2 rounded-full ${statusColor}`} />
          )}
        </div>
      </div>
      
      {/* Handles for connections */}
      {config.category !== 'control-start' && (
        <Handle
          type="target"
          position={Position.Top}
          className="w-3 h-3"
          style={{ backgroundColor: config.color }}
        />
      )}
      {config.category !== 'control-end' && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="w-3 h-3"
          style={{ backgroundColor: config.color }}
        />
      )}
      
      {/* Additional handles for logic nodes */}
      {config.category === 'logic' && (
        <>
          <Handle
            type="source"
            position={Position.Left}
            id="false"
            className="w-3 h-3"
            style={{ backgroundColor: '#ef4444', top: '50%' }}
          />
          <Handle
            type="source"
            position={Position.Right}
            id="true"
            className="w-3 h-3"
            style={{ backgroundColor: '#22c55e', top: '50%' }}
          />
        </>
      )}
    </Card>
  );
});

CustomNode.displayName = 'CustomNode';

export const nodeTypes = {
  custom: CustomNode,
};

export const nodePalette = [
  // Input nodes
  { type: 'input-voice', label: 'Voice Input', description: 'Capture voice input via microphone' },
  { type: 'input-text', label: 'Text Input', description: 'Accept text input from user' },
  { type: 'input-api', label: 'API Input', description: 'Receive data from external API' },
  
  // Process nodes
  { type: 'process-llm', label: 'LLM Processing', description: 'Process with language model' },
  { type: 'process-rag', label: 'RAG Query', description: 'Retrieve knowledge from documents' },
  { type: 'process-code', label: 'Code Execution', description: 'Execute custom code' },
  
  // Output nodes
  { type: 'output-speech', label: 'Speech Output', description: 'Convert text to speech' },
  { type: 'output-action', label: 'Action Output', description: 'Execute an action' },
  
  // Logic nodes
  { type: 'logic-condition', label: 'If/Else Condition', description: 'Branch based on condition' },
  { type: 'logic-timer', label: 'Time Trigger', description: 'Trigger based on time' },
  { type: 'logic-threshold', label: 'Confidence Threshold', description: 'Branch based on confidence' },
  
  // Control nodes
  { type: 'control-start', label: 'Start', description: 'Workflow start point' },
  { type: 'control-end', label: 'End', description: 'Workflow end point' },
];
