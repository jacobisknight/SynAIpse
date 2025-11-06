import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cpu, CheckCircle2, TrendingUp, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { CreateAgentModal } from "@/components/create-agent-modal";
import type { Agent } from "@shared/schema";

interface DashboardStats {
  activeAgents: number;
  tasksCompleted: number;
  successRate: number;
  avgResponseTime: number;
}

export default function Dashboard() {
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/stats"],
  });

  const { data: agents, isLoading: agentsLoading } = useQuery<Agent[]>({
    queryKey: ["/api/agents"],
  });

  const { data: recentActivity, isLoading: activityLoading } = useQuery<any[]>({
    queryKey: ["/api/activity"],
  });

  const statCards = [
    {
      title: "Active Agents",
      value: stats?.activeAgents ?? 0,
      icon: Cpu,
      trend: "+12%",
      color: "text-chart-1",
    },
    {
      title: "Tasks Completed",
      value: stats?.tasksCompleted ?? 0,
      icon: CheckCircle2,
      trend: "+23%",
      color: "text-chart-2",
    },
    {
      title: "Success Rate",
      value: `${stats?.successRate ?? 0}%`,
      icon: TrendingUp,
      trend: "+5%",
      color: "text-chart-3",
    },
    {
      title: "Avg Response Time",
      value: `${stats?.avgResponseTime ?? 0}ms`,
      icon: Clock,
      trend: "-8%",
      color: "text-chart-4",
    },
  ];

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Monitor your AI agent orchestration platform
          </p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)} data-testid="button-create-agent">
          <Plus className="h-4 w-4 mr-2" />
          Create Agent
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title} data-testid={`card-stat-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" data-testid={`text-stat-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                {statsLoading ? "..." : stat.value}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-chart-3">{stat.trend}</span> vs last week
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Agents */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Agents</CardTitle>
          </CardHeader>
          <CardContent>
            {agentsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 rounded-md bg-muted animate-pulse" />
                ))}
              </div>
            ) : agents && agents.length > 0 ? (
              <div className="space-y-3">
                {agents.slice(0, 5).map((agent) => (
                  <div
                    key={agent.id}
                    className="flex items-center justify-between p-3 rounded-md border hover-elevate"
                    data-testid={`agent-item-${agent.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-2 w-2 rounded-full ${
                        agent.status === 'active' ? 'bg-chart-3' :
                        agent.status === 'processing' ? 'bg-chart-1' :
                        agent.status === 'error' ? 'bg-destructive' :
                        'bg-muted-foreground'
                      }`} data-testid={`status-${agent.id}`} />
                      <div>
                        <p className="text-sm font-medium">{agent.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{agent.type} Agent</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground capitalize">
                        {agent.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Cpu className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-4">No agents yet</p>
                <Button size="sm" onClick={() => setCreateModalOpen(true)} data-testid="button-create-first-agent">
                  Create your first agent
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <Card>
          <CardHeader>
            <CardTitle>Real-time Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {activityLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-12 rounded-md bg-muted animate-pulse" />
                ))}
              </div>
            ) : recentActivity && recentActivity.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {recentActivity.map((activity, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-2 text-sm"
                    data-testid={`activity-${idx}`}
                  >
                    <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2" />
                    <div className="flex-1">
                      <p className="text-foreground">{activity.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">{activity.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">No recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <CreateAgentModal open={createModalOpen} onOpenChange={setCreateModalOpen} />
    </div>
  );
}
