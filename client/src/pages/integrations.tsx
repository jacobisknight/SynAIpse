import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plug, Check } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Integration } from "@shared/schema";

const availableIntegrations = [
  {
    id: "salesforce",
    name: "Salesforce",
    description: "CRM and customer engagement platform",
    logo: "S",
    category: "CRM",
  },
  {
    id: "sap",
    name: "SAP",
    description: "Enterprise resource planning system",
    logo: "SAP",
    category: "ERP",
  },
  {
    id: "servicenow",
    name: "ServiceNow",
    description: "IT service management and workflow automation",
    logo: "SN",
    category: "ITSM",
  },
  {
    id: "slack",
    name: "Slack",
    description: "Team communication and collaboration",
    logo: "Sl",
    category: "Communication",
  },
  {
    id: "hubspot",
    name: "HubSpot",
    description: "Marketing, sales, and service software",
    logo: "H",
    category: "CRM",
  },
  {
    id: "zendesk",
    name: "Zendesk",
    description: "Customer service and support platform",
    logo: "Z",
    category: "Support",
  },
];

export default function Integrations() {
  const { data: integrations, isLoading } = useQuery<Integration[]>({
    queryKey: ["/api/integrations"],
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      return await apiRequest("PATCH", `/api/integrations/${id}`, { enabled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/integrations"] });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (integration: any) => {
      return await apiRequest("POST", "/api/integrations", integration);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/integrations"] });
    },
  });

  const isIntegrationEnabled = (integrationId: string) => {
    return integrations?.some((i) => i.type === integrationId && i.enabled) || false;
  };

  const getIntegration = (integrationId: string) => {
    return integrations?.find((i) => i.type === integrationId);
  };

  const handleToggle = (integrationId: string, enabled: boolean) => {
    const integration = getIntegration(integrationId);
    if (integration) {
      toggleMutation.mutate({ id: integration.id, enabled });
    } else {
      const config = availableIntegrations.find((i) => i.id === integrationId);
      if (config) {
        createMutation.mutate({
          organizationId: "demo-org",
          name: config.name,
          type: integrationId,
          enabled: true,
        });
      }
    }
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">Integrations</h1>
          <p className="text-sm text-muted-foreground">
            Connect SynapseGrid with your existing enterprise systems
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {availableIntegrations.map((integration) => {
          const isEnabled = isIntegrationEnabled(integration.id);
          const integrationData = getIntegration(integration.id);

          return (
            <Card key={integration.id} data-testid={`card-integration-${integration.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground font-semibold text-sm">
                      {integration.logo}
                    </div>
                    <div>
                      <CardTitle className="text-base">{integration.name}</CardTitle>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {integration.category}
                      </Badge>
                    </div>
                  </div>
                  {isEnabled && (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-chart-3">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <CardDescription className="text-xs">
                  {integration.description}
                </CardDescription>
                
                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm font-medium">
                    {isEnabled ? "Connected" : "Not connected"}
                  </span>
                  <Switch
                    checked={isEnabled}
                    onCheckedChange={(checked) => handleToggle(integration.id, checked)}
                    data-testid={`switch-${integration.id}`}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {integrations && integrations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Integrations</CardTitle>
            <CardDescription>
              Currently connected enterprise systems
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {integrations.filter((i) => i.enabled).map((integration) => (
                <div
                  key={integration.id}
                  className="flex items-center justify-between p-3 rounded-md border"
                  data-testid={`active-integration-${integration.id}`}
                >
                  <div className="flex items-center gap-3">
                    <Plug className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-sm font-medium">{integration.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{integration.type}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">Active</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
