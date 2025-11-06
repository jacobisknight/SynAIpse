import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Brain, Heart, Zap, MessageSquare } from 'lucide-react';

interface PersonalityConfig {
  tone?: string;
  role?: string;
  goal?: string;
  style?: string;
  empathySetting?: number;
  adaptiveTuning?: boolean;
}

interface AgentPersonalityConfigProps {
  agentId?: string;
  personality?: PersonalityConfig;
  onSave?: (personality: PersonalityConfig) => void;
}

export function AgentPersonalityConfig({ 
  agentId, 
  personality, 
  onSave 
}: AgentPersonalityConfigProps) {
  const [config, setConfig] = useState<PersonalityConfig>(personality || {
    tone: 'Professional',
    role: 'Customer Support Specialist',
    goal: 'Provide helpful and empathetic customer support',
    style: 'Conversational and friendly',
    empathySetting: 7,
    adaptiveTuning: true,
  });

  const handleSave = () => {
    if (onSave) {
      onSave(config);
    }
  };

  const tonePresets = [
    'Professional', 
    'Friendly', 
    'Formal', 
    'Casual', 
    'Empathetic', 
    'Analytical'
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Agent Personality Configuration
        </CardTitle>
        <CardDescription>
          Define how your agent thinks, speaks, and behaves
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="tone">Tone</Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {tonePresets.map((preset) => (
              <Badge
                key={preset}
                variant={config.tone === preset ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setConfig({ ...config, tone: preset })}
              >
                {preset}
              </Badge>
            ))}
          </div>
          <Input
            id="tone"
            value={config.tone || ''}
            onChange={(e) => setConfig({ ...config, tone: e.target.value })}
            placeholder="e.g., Professional, Friendly, Formal"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="role" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Role
          </Label>
          <Input
            id="role"
            value={config.role || ''}
            onChange={(e) => setConfig({ ...config, role: e.target.value })}
            placeholder="e.g., Customer Support Specialist"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="goal" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Primary Goal
          </Label>
          <Textarea
            id="goal"
            value={config.goal || ''}
            onChange={(e) => setConfig({ ...config, goal: e.target.value })}
            placeholder="Describe the agent's primary objective..."
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="style">Communication Style</Label>
          <Textarea
            id="style"
            value={config.style || ''}
            onChange={(e) => setConfig({ ...config, style: e.target.value })}
            placeholder="Describe how the agent should communicate..."
            rows={2}
          />
        </div>

        <div className="space-y-3">
          <Label htmlFor="empathy" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Empathy Setting: {config.empathySetting}/10
          </Label>
          <Slider
            id="empathy"
            min={1}
            max={10}
            step={1}
            value={[config.empathySetting || 5]}
            onValueChange={([value]) => setConfig({ ...config, empathySetting: value })}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Higher values make the agent more empathetic and understanding
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="adaptive">Adaptive Tuning</Label>
            <p className="text-xs text-muted-foreground">
              Allow the agent to learn and adapt based on interactions
            </p>
          </div>
          <Switch
            id="adaptive"
            checked={config.adaptiveTuning}
            onCheckedChange={(checked) => setConfig({ ...config, adaptiveTuning: checked })}
          />
        </div>

        <div className="flex gap-2 pt-4">
          <Button onClick={handleSave} className="flex-1">
            Save Configuration
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setConfig(personality || {})}
          >
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
