import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  Activity,
  BarChart3,
  Users,
  Zap
} from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ElementType;
  description?: string;
}

function MetricCard({ title, value, change, icon: Icon, description }: MetricCardProps) {
  const isPositive = change && change > 0;
  const TrendIcon = change && change > 0 ? TrendingUp : TrendingDown;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <TrendIcon className={`h-3 w-3 ${isPositive ? 'text-green-500' : 'text-red-500'}`} />
            <span className={isPositive ? 'text-green-500' : 'text-red-500'}>
              {Math.abs(change)}%
            </span>
            <span>from last month</span>
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

// Mock data for demonstration
const mockMetrics = {
  totalCost: 2847.32,
  costChange: -12,
  activeAgents: 24,
  agentsChange: 15,
  totalRequests: 48392,
  requestsChange: 23,
  avgLatency: 342,
  latencyChange: -8,
  successRate: 98.4,
  successChange: 2.1,
};

const mockCostBreakdown = [
  { service: 'LLM (GPT-4)', provider: 'OpenAI', cost: 1847.20, units: 1240000, percentage: 65 },
  { service: 'Text-to-Speech', provider: 'ElevenLabs', cost: 421.50, units: 850000, percentage: 15 },
  { service: 'Embeddings', provider: 'OpenAI', cost: 287.12, units: 2100000, percentage: 10 },
  { service: 'Speech-to-Text', provider: 'Whisper', cost: 198.50, units: 450000, percentage: 7 },
  { service: 'Other', provider: 'Various', cost: 93.00, units: 0, percentage: 3 },
];

const mockAgentPerformance = [
  { agentId: 'agent-001', name: 'Customer Support Bot', requests: 12450, successRate: 99.2, avgLatency: 285, cost: 842.30 },
  { agentId: 'agent-002', name: 'Sales Assistant', requests: 8930, successRate: 98.8, avgLatency: 312, cost: 634.20 },
  { agentId: 'agent-003', name: 'Technical Support', requests: 7823, successRate: 97.1, avgLatency: 421, cost: 518.45 },
  { agentId: 'agent-004', name: 'Lead Qualifier', requests: 6241, successRate: 99.5, avgLatency: 198, cost: 398.50 },
  { agentId: 'agent-005', name: 'Data Analyst', requests: 5102, successRate: 96.8, avgLatency: 487, cost: 328.67 },
];

export default function Analytics() {
  const { toast } = useToast();

  return (
    <div className="flex-1 space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          Analytics & Insights
        </h1>
        <p className="text-sm text-muted-foreground">
          Real-time metrics, cost tracking, and performance analytics
        </p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">
            <Activity className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="costs">
            <DollarSign className="h-4 w-4 mr-2" />
            Cost Tracking
          </TabsTrigger>
          <TabsTrigger value="performance">
            <Zap className="h-4 w-4 mr-2" />
            Performance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Total Cost"
              value={`$${mockMetrics.totalCost.toFixed(2)}`}
              change={mockMetrics.costChange}
              icon={DollarSign}
              description="This month"
            />
            <MetricCard
              title="Active Agents"
              value={mockMetrics.activeAgents}
              change={mockMetrics.agentsChange}
              icon={Users}
            />
            <MetricCard
              title="Total Requests"
              value={mockMetrics.totalRequests.toLocaleString()}
              change={mockMetrics.requestsChange}
              icon={Activity}
            />
            <MetricCard
              title="Avg Latency"
              value={`${mockMetrics.avgLatency}ms`}
              change={mockMetrics.latencyChange}
              icon={Clock}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Success Rate</CardTitle>
                <CardDescription>
                  Overall system reliability
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold mb-2">{mockMetrics.successRate}%</div>
                <Progress value={mockMetrics.successRate} className="h-2" />
                <div className="flex items-center gap-4 mt-4 text-sm">
                  <div className="flex items-center gap-1 text-green-500">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{Math.round(mockMetrics.totalRequests * mockMetrics.successRate / 100).toLocaleString()} successful</span>
                  </div>
                  <div className="flex items-center gap-1 text-red-500">
                    <XCircle className="h-4 w-4" />
                    <span>{Math.round(mockMetrics.totalRequests * (100 - mockMetrics.successRate) / 100).toLocaleString()} failed</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Request Distribution</CardTitle>
                <CardDescription>
                  By agent type
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">Customer Support</span>
                      <span className="text-sm font-medium">45%</span>
                    </div>
                    <Progress value={45} className="h-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">Sales</span>
                      <span className="text-sm font-medium">28%</span>
                    </div>
                    <Progress value={28} className="h-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">Technical</span>
                      <span className="text-sm font-medium">18%</span>
                    </div>
                    <Progress value={18} className="h-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">Other</span>
                      <span className="text-sm font-medium">9%</span>
                    </div>
                    <Progress value={9} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="costs" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Cost Breakdown by Service</CardTitle>
              <CardDescription>
                Current month expenditure by service type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockCostBreakdown.map((item) => (
                  <div key={item.service}>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-medium">{item.service}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.provider} • {item.units.toLocaleString()} units
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">${item.cost.toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">{item.percentage}%</div>
                      </div>
                    </div>
                    <Progress value={item.percentage} className="h-2" />
                  </div>
                ))}
              </div>
              <Separator className="my-4" />
              <div className="flex items-center justify-between">
                <span className="font-semibold">Total</span>
                <span className="text-xl font-bold">
                  ${mockCostBreakdown.reduce((sum, item) => sum + item.cost, 0).toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Agent Performance</CardTitle>
              <CardDescription>
                Performance metrics by individual agent
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-4">
                  {mockAgentPerformance.map((agent) => (
                    <Card key={agent.agentId} className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">{agent.name}</h4>
                          <p className="text-xs text-muted-foreground">{agent.agentId}</p>
                        </div>
                        <Badge variant={agent.successRate > 98 ? 'default' : 'secondary'}>
                          {agent.successRate}% success
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground mb-1">Requests</div>
                          <div className="font-semibold">{agent.requests.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground mb-1">Latency</div>
                          <div className="font-semibold">{agent.avgLatency}ms</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground mb-1">Cost</div>
                          <div className="font-semibold">${agent.cost.toFixed(2)}</div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
