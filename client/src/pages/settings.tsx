import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/components/theme-provider";
import { useToast } from "@/hooks/use-toast";
import { Settings as SettingsIcon, Globe, User, Key, Server, CheckCircle2, XCircle, Database, FileText, Workflow, Users } from "lucide-react";

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Dubai",
  "Australia/Sydney",
  "Pacific/Auckland",
];

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  
  const [organizationName, setOrganizationName] = useState("");
  const [timezone, setTimezone] = useState("America/New_York");
  const [defaultPersona, setDefaultPersona] = useState("");
  const [defaultGoals, setDefaultGoals] = useState("");
  const [defaultTriggers, setDefaultTriggers] = useState("");
  const [language, setLanguage] = useState("en");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [inAppNotifications, setInAppNotifications] = useState(true);

  const { data: settingsData, isLoading: settingsLoading } = useQuery<{
    organization: { id: string; name: string } | null;
    settings: {
      organizationId: string;
      timezone: string;
      defaultPersona: string | null;
      defaultGoals: string[];
      defaultTriggers: string[];
      preferences: Record<string, any>;
    } | null;
  }>({
    queryKey: ["/api/settings"],
  });

  const { data: systemStatus, isLoading: statusLoading } = useQuery<{
    database: { status: string; type: string };
    counts: {
      agents: number;
      tasks: number;
      documents: number;
      workflows: number;
      integrations: number;
    };
    storage: {
      totalBytes: number;
      totalMB: string;
    };
    performance: {
      activeAgents: number;
      tasksCompleted: number;
      successRate: number;
      avgResponseTime: number;
    };
    apiKeys: {
      openai: boolean;
      elevenlabs: boolean;
    };
    version: string;
    buildDate: string;
  }>({
    queryKey: ["/api/system/status"],
  });

  useEffect(() => {
    if (settingsData?.organization) {
      setOrganizationName(settingsData.organization.name || "");
    }
    if (settingsData?.settings) {
      setTimezone(settingsData.settings.timezone || "America/New_York");
      setDefaultPersona(settingsData.settings.defaultPersona || "");
      setDefaultGoals((settingsData.settings.defaultGoals || []).join('\n'));
      setDefaultTriggers((settingsData.settings.defaultTriggers || []).join('\n'));
      
      const prefs = settingsData.settings.preferences || {};
      setLanguage(prefs.language || "en");
      setEmailNotifications(prefs.emailNotifications !== false);
      setInAppNotifications(prefs.inAppNotifications !== false);
    }
  }, [settingsData]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("PATCH", "/api/settings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Settings Updated",
        description: "Your settings have been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateOrganizationMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("PATCH", `/api/organization/${settingsData?.organization?.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Organization Updated",
        description: "Organization settings have been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update organization. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSaveOrganization = async () => {
    if (organizationName && organizationName !== settingsData?.organization?.name) {
      await updateOrganizationMutation.mutateAsync({ name: organizationName });
    }
    
    updateSettingsMutation.mutate({
      timezone,
    });
  };

  const handleSaveAgentDefaults = () => {
    const goalsArray = defaultGoals.split('\n').filter(g => g.trim());
    const triggersArray = defaultTriggers.split('\n').filter(t => t.trim());
    
    updateSettingsMutation.mutate({
      defaultPersona: defaultPersona.trim() || null,
      defaultGoals: goalsArray,
      defaultTriggers: triggersArray,
    });
  };

  const handleSavePreferences = () => {
    updateSettingsMutation.mutate({
      preferences: {
        theme,
        language,
        emailNotifications,
        inAppNotifications,
      },
    });
  };

  if (settingsLoading || statusLoading) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your organization settings and preferences
          </p>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  const organization = settingsData?.organization;
  const settings = settingsData?.settings;

  return (
    <div className="flex-1 space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold" data-testid="text-page-title">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your organization settings and preferences
        </p>
      </div>

      <Tabs defaultValue="organization" className="space-y-6">
        <TabsList>
          <TabsTrigger value="organization" data-testid="tab-organization">
            <Globe className="w-4 h-4 mr-2" />
            Organization
          </TabsTrigger>
          <TabsTrigger value="preferences" data-testid="tab-preferences">
            <User className="w-4 h-4 mr-2" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="api-keys" data-testid="tab-api-keys">
            <Key className="w-4 h-4 mr-2" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="agent-defaults" data-testid="tab-agent-defaults">
            <SettingsIcon className="w-4 h-4 mr-2" />
            Agent Defaults
          </TabsTrigger>
          <TabsTrigger value="system" data-testid="tab-system">
            <Server className="w-4 h-4 mr-2" />
            System Info
          </TabsTrigger>
        </TabsList>

        <TabsContent value="organization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Organization Settings</CardTitle>
              <CardDescription>
                Manage your organization's core configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="org-name">Organization Name</Label>
                <Input
                  id="org-name"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  data-testid="input-organization-name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="org-id">Organization ID</Label>
                <Input
                  id="org-id"
                  value={organization?.id || "demo-org"}
                  disabled
                  className="bg-muted"
                  data-testid="text-organization-id"
                />
                <p className="text-xs text-muted-foreground">
                  This ID is used for API access and cannot be changed
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Time Zone</Label>
                <Select
                  value={timezone}
                  onValueChange={setTimezone}
                >
                  <SelectTrigger id="timezone" data-testid="select-timezone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz} value={tz}>
                        {tz.replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Used for scheduling and time-based triggers
                </p>
              </div>

              <Separator />

              <Button 
                onClick={handleSaveOrganization}
                disabled={updateSettingsMutation.isPending || updateOrganizationMutation.isPending}
                data-testid="button-save-organization"
              >
                {(updateSettingsMutation.isPending || updateOrganizationMutation.isPending) ? "Saving..." : "Save Organization Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Preferences</CardTitle>
              <CardDescription>
                Customize your personal experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger id="theme" data-testid="select-theme">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Choose your preferred color scheme
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger id="language" data-testid="select-language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Interface language preference
                </p>
              </div>

              <Separator />

              <div>
                <Label className="text-base">Notification Preferences</Label>
                <p className="text-xs text-muted-foreground mb-4">
                  Control how you receive updates
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="email-notifications">Email Notifications</Label>
                      <p className="text-xs text-muted-foreground">
                        Receive updates via email
                      </p>
                    </div>
                    <Switch
                      id="email-notifications"
                      checked={emailNotifications}
                      onCheckedChange={setEmailNotifications}
                      data-testid="checkbox-email-notifications"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="inapp-notifications">In-App Notifications</Label>
                      <p className="text-xs text-muted-foreground">
                        Show notifications in the application
                      </p>
                    </div>
                    <Switch
                      id="inapp-notifications"
                      checked={inAppNotifications}
                      onCheckedChange={setInAppNotifications}
                      data-testid="checkbox-inapp-notifications"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <Button 
                onClick={handleSavePreferences}
                disabled={updateSettingsMutation.isPending}
                data-testid="button-save-preferences"
              >
                {updateSettingsMutation.isPending ? "Saving..." : "Save Preferences"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api-keys" className="space-y-6">
          <Card data-testid="section-api-keys">
            <CardHeader>
              <CardTitle>API Keys & Secrets</CardTitle>
              <CardDescription>
                Manage API keys and service integrations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-md bg-muted/50">
                <p className="text-sm font-medium mb-2">Security Notice</p>
                <p className="text-xs text-muted-foreground">
                  API keys are stored securely as environment variables and are not visible in the UI for security reasons.
                  To update API keys, please modify your environment configuration.
                </p>
              </div>

              <Separator />

              <div>
                <Label className="text-base mb-4 block">Configured Services</Label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-md">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${systemStatus?.apiKeys?.openai ? 'bg-green-500' : 'bg-red-500'}`} />
                      <div>
                        <p className="text-sm font-medium">OpenAI</p>
                        <p className="text-xs text-muted-foreground">AI model provider</p>
                      </div>
                    </div>
                    {systemStatus?.apiKeys?.openai ? (
                      <Badge variant="outline" className="gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Configured
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1">
                        <XCircle className="w-3 h-3" />
                        Not Configured
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-md">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${systemStatus?.apiKeys?.elevenlabs ? 'bg-green-500' : 'bg-red-500'}`} />
                      <div>
                        <p className="text-sm font-medium">ElevenLabs</p>
                        <p className="text-xs text-muted-foreground">Voice synthesis service</p>
                      </div>
                    </div>
                    {systemStatus?.apiKeys?.elevenlabs ? (
                      <Badge variant="outline" className="gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Configured
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1">
                        <XCircle className="w-3 h-3" />
                        Not Configured
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex gap-2">
                <Button variant="outline" data-testid="button-test-connections">
                  Test Connections
                </Button>
                <Button variant="outline" data-testid="button-refresh-keys">
                  Refresh Status
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agent-defaults" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Agent Defaults</CardTitle>
              <CardDescription>
                Set default templates for new agents
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="default-persona">Default Persona Template</Label>
                <Textarea
                  id="default-persona"
                  placeholder="Enter a default persona description for new agents..."
                  value={defaultPersona}
                  onChange={(e) => setDefaultPersona(e.target.value)}
                  rows={4}
                  data-testid="textarea-default-persona"
                />
                <p className="text-xs text-muted-foreground">
                  This persona will be pre-filled when creating new agents
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="default-goals">Default Goals Template</Label>
                <Textarea
                  id="default-goals"
                  placeholder="Enter default goals (one per line)..."
                  value={defaultGoals}
                  onChange={(e) => setDefaultGoals(e.target.value)}
                  rows={4}
                  data-testid="textarea-default-goals"
                />
                <p className="text-xs text-muted-foreground">
                  One goal per line. These will be suggested when creating agents.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="default-triggers">Default Triggers Template</Label>
                <Textarea
                  id="default-triggers"
                  placeholder="Enter default triggers (one per line)..."
                  value={defaultTriggers}
                  onChange={(e) => setDefaultTriggers(e.target.value)}
                  rows={4}
                  data-testid="textarea-default-triggers"
                />
                <p className="text-xs text-muted-foreground">
                  One trigger per line. Common event patterns for agent activation.
                </p>
              </div>

              <Separator />

              <Button 
                onClick={handleSaveAgentDefaults}
                disabled={updateSettingsMutation.isPending}
                data-testid="button-save-agent-defaults"
              >
                {updateSettingsMutation.isPending ? "Saving..." : "Save Agent Defaults"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <Card data-testid="section-system-info">
            <CardHeader>
              <CardTitle>System Information</CardTitle>
              <CardDescription>
                Overview of system status and resources
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border rounded-md">
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="w-4 h-4 text-muted-foreground" />
                    <p className="text-sm font-medium">Database</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <p className="text-xs text-muted-foreground">{systemStatus?.database?.status || "Connected"}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {systemStatus?.database?.type || "PostgreSQL"}
                  </p>
                </div>

                <div className="p-4 border rounded-md">
                  <div className="flex items-center gap-2 mb-2">
                    <Server className="w-4 h-4 text-muted-foreground" />
                    <p className="text-sm font-medium">Version</p>
                  </div>
                  <p className="text-2xl font-bold">{systemStatus?.version || "1.0.0"}</p>
                  <p className="text-xs text-muted-foreground">
                    Build: {systemStatus?.buildDate || "2024-01-01"}
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-base mb-4 block">Resource Counts</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 border rounded-md">
                    <div className="flex items-center gap-3">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">Agents</span>
                    </div>
                    <span className="text-lg font-semibold">{systemStatus?.counts?.agents || 0}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-md">
                    <div className="flex items-center gap-3">
                      <SettingsIcon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">Tasks</span>
                    </div>
                    <span className="text-lg font-semibold">{systemStatus?.counts?.tasks || 0}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-md">
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">Documents</span>
                    </div>
                    <span className="text-lg font-semibold">{systemStatus?.counts?.documents || 0}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-md">
                    <div className="flex items-center gap-3">
                      <Workflow className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">Workflows</span>
                    </div>
                    <span className="text-lg font-semibold">{systemStatus?.counts?.workflows || 0}</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-base mb-4 block">Storage Usage</Label>
                <div className="p-4 border rounded-md">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Total Storage</span>
                    <span className="text-lg font-semibold">{systemStatus?.storage?.totalMB || "0.00"} MB</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary" 
                      style={{ width: `${Math.min(100, (parseFloat(systemStatus?.storage?.totalMB || "0") / 100) * 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {systemStatus?.storage?.totalBytes || 0} bytes used
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-base mb-4 block">Performance Metrics</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 border rounded-md">
                    <p className="text-xs text-muted-foreground mb-1">Success Rate</p>
                    <p className="text-2xl font-bold">{systemStatus?.performance?.successRate || 100}%</p>
                  </div>

                  <div className="p-3 border rounded-md">
                    <p className="text-xs text-muted-foreground mb-1">Avg Response Time</p>
                    <p className="text-2xl font-bold">{systemStatus?.performance?.avgResponseTime || 0}ms</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
