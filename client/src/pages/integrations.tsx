import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Plug, 
  Check, 
  Search, 
  Settings, 
  Database, 
  MessageSquare, 
  Mail, 
  ShoppingCart,
  Users,
  Server,
  AlertCircle,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Integration } from "@shared/schema";

const integrationConfigSchema = z.object({
  apiKey: z.string().min(1, "API key is required"),
  apiSecret: z.string().optional(),
  baseUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
});

type IntegrationConfig = z.infer<typeof integrationConfigSchema>;

const availableIntegrations = [
  {
    id: "salesforce",
    name: "Salesforce",
    description: "CRM and customer engagement platform",
    icon: Users,
    category: "CRM",
    color: "text-blue-600",
  },
  {
    id: "sap",
    name: "SAP",
    description: "Enterprise resource planning system",
    icon: Server,
    category: "ERP",
    color: "text-purple-600",
  },
  {
    id: "servicenow",
    name: "ServiceNow",
    description: "IT service management and workflow automation",
    icon: Settings,
    category: "IT Service Management",
    color: "text-green-600",
  },
  {
    id: "slack",
    name: "Slack",
    description: "Team communication and collaboration",
    icon: MessageSquare,
    category: "Communication",
    color: "text-pink-600",
  },
  {
    id: "teams",
    name: "Microsoft Teams",
    description: "Enterprise communication and collaboration",
    icon: MessageSquare,
    category: "Communication",
    color: "text-indigo-600",
  },
  {
    id: "hubspot",
    name: "HubSpot",
    description: "Marketing, sales, and service software",
    icon: ShoppingCart,
    category: "Marketing",
    color: "text-orange-600",
  },
];

export default function Integrations() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const { toast } = useToast();

  const { data: integrations, isLoading } = useQuery<Integration[]>({
    queryKey: ["/api/integrations"],
  });

  const form = useForm<IntegrationConfig>({
    resolver: zodResolver(integrationConfigSchema),
    defaultValues: {
      apiKey: "",
      apiSecret: "",
      baseUrl: "",
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      return await apiRequest("PATCH", `/api/integrations/${id}`, { enabled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/integrations"] });
      toast({
        title: "Integration updated",
        description: "Integration status has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update integration status.",
        variant: "destructive",
      });
    },
  });

  const updateConfigMutation = useMutation({
    mutationFn: async ({ id, configuration }: { id: string; configuration: any }) => {
      return await apiRequest("PATCH", `/api/integrations/${id}`, { configuration });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/integrations"] });
      setIsConfigModalOpen(false);
      form.reset();
      toast({
        title: "Configuration saved",
        description: "Integration configuration has been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save configuration.",
        variant: "destructive",
      });
    },
  });

  const testConnectionMutation = useMutation({
    mutationFn: async ({ id, credentials }: { id: string; credentials?: IntegrationConfig }) => {
      return await apiRequest("POST", `/api/integrations/${id}/test`, { credentials });
    },
    onSuccess: (data: any) => {
      toast({
        title: "Connection successful",
        description: data.message || "Successfully connected to the integration.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Connection failed",
        description: error.message || "Failed to connect to the integration.",
        variant: "destructive",
      });
    },
  });

  const getIntegrationConfig = (integrationId: string) => {
    return availableIntegrations.find((i) => i.id === integrationId);
  };

  const getIntegrationData = (integrationId: string) => {
    return integrations?.find((i) => i.type === integrationId);
  };

  const handleToggle = (integrationId: string, enabled: boolean) => {
    const integration = getIntegrationData(integrationId);
    if (integration) {
      toggleMutation.mutate({ id: integration.id, enabled });
    }
  };

  const handleConfigure = (integrationId: string) => {
    const integration = getIntegrationData(integrationId);
    if (integration) {
      setSelectedIntegration(integration);
      
      if (integration.configuration && typeof integration.configuration === 'object') {
        const config = integration.configuration as any;
        form.reset({
          apiKey: config.apiKey || "",
          apiSecret: config.apiSecret || "",
          baseUrl: config.baseUrl || "",
        });
      } else {
        form.reset({
          apiKey: "",
          apiSecret: "",
          baseUrl: "",
        });
      }
      
      setIsConfigModalOpen(true);
    }
  };

  const handleTestConnection = async () => {
    if (!selectedIntegration) return;
    
    const formValues = form.getValues();
    
    setIsTestingConnection(true);
    try {
      await testConnectionMutation.mutateAsync({
        id: selectedIntegration.id,
        credentials: formValues,
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const onSubmit = (data: IntegrationConfig) => {
    if (!selectedIntegration) return;
    
    updateConfigMutation.mutate({
      id: selectedIntegration.id,
      configuration: data,
    });
  };

  const filteredIntegrations = availableIntegrations.filter((integration) =>
    integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    integration.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    integration.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getConnectionStatus = (integrationId: string) => {
    const integration = getIntegrationData(integrationId);
    if (!integration) return { status: "not_configured", label: "Not configured", icon: AlertCircle, color: "text-muted-foreground" };
    
    if (!integration.enabled) return { status: "disabled", label: "Disabled", icon: AlertCircle, color: "text-muted-foreground" };
    
    const hasConfig = integration.configuration && 
      typeof integration.configuration === 'object' &&
      Object.keys(integration.configuration).length > 0;
    
    if (hasConfig) {
      return { status: "connected", label: "Connected", icon: CheckCircle2, color: "text-chart-3" };
    }
    
    return { status: "enabled_no_config", label: "Enabled (not configured)", icon: AlertCircle, color: "text-yellow-600" };
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">Integrations</h1>
          <p className="text-sm text-muted-foreground">
            Connect SynapseGrid with your existing enterprise systems
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search integrations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-integrations"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-md" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-9 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredIntegrations.map((integration) => {
            const integrationData = getIntegrationData(integration.id);
            const isEnabled = integrationData?.enabled || false;
            const connectionStatus = getConnectionStatus(integration.id);
            const Icon = integration.icon;
            const StatusIcon = connectionStatus.icon;

            return (
              <Card key={integration.id} data-testid={`card-integration-${integration.id}`} className="hover-elevate">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-md bg-muted ${integration.color}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{integration.name}</CardTitle>
                        <Badge variant="outline" className="mt-1 text-xs">
                          {integration.category}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CardDescription className="text-xs min-h-[2.5rem]">
                    {integration.description}
                  </CardDescription>

                  <div className="flex items-center gap-2 text-sm">
                    <StatusIcon className={`h-4 w-4 ${connectionStatus.color}`} />
                    <span className="text-muted-foreground">{connectionStatus.label}</span>
                  </div>
                  
                  <div className="flex items-center justify-between gap-2 pt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {isEnabled ? "Enabled" : "Disabled"}
                      </span>
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={(checked) => handleToggle(integration.id, checked)}
                        data-testid={`switch-enable-${integration.id}`}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleConfigure(integration.id)}
                      disabled={!integrationData}
                      data-testid={`button-configure-${integration.id}`}
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      Configure
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {!isLoading && filteredIntegrations.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No integrations found</p>
            <p className="text-sm text-muted-foreground">
              Try adjusting your search query
            </p>
          </CardContent>
        </Card>
      )}

      {integrations && integrations.filter((i) => i.enabled).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Integrations</CardTitle>
            <CardDescription>
              Currently enabled enterprise systems
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {integrations.filter((i) => i.enabled).map((integration) => {
                const config = getIntegrationConfig(integration.type);
                const connectionStatus = getConnectionStatus(integration.type);
                const StatusIcon = connectionStatus.icon;
                
                return (
                  <div
                    key={integration.id}
                    className="flex items-center justify-between p-3 rounded-md border"
                    data-testid={`active-integration-${integration.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <Plug className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-sm font-medium">{integration.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="capitalize">{integration.type}</span>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <StatusIcon className={`h-3 w-3 ${connectionStatus.color}`} />
                            <span>{connectionStatus.label}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleConfigure(integration.type)}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={isConfigModalOpen} onOpenChange={setIsConfigModalOpen}>
        <DialogContent className="sm:max-w-[500px]" data-testid="modal-configure-integration">
          <DialogHeader>
            <DialogTitle>Configure {selectedIntegration?.name}</DialogTitle>
            <DialogDescription>
              Enter your API credentials to connect to {selectedIntegration?.name}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="apiKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>API Key *</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter API key"
                        {...field}
                        data-testid="input-api-key"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="apiSecret"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>API Secret (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter API secret"
                        {...field}
                        data-testid="input-api-secret"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="baseUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Base URL (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder="https://api.example.com"
                        {...field}
                        data-testid="input-base-url"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={isTestingConnection || testConnectionMutation.isPending}
                  data-testid="button-test-connection"
                >
                  {isTestingConnection ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Test Connection
                    </>
                  )}
                </Button>
                <Button
                  type="submit"
                  disabled={updateConfigMutation.isPending}
                  data-testid="button-save-integration"
                >
                  {updateConfigMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Configuration"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
