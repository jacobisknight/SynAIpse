import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

export default function Settings() {
  return (
    <div className="flex-1 space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold" data-testid="text-page-title">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your organization settings and preferences
        </p>
      </div>

      <div className="space-y-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Organization</CardTitle>
            <CardDescription>
              General organization information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="org-name">Organization Name</Label>
              <Input
                id="org-name"
                defaultValue="Demo Enterprise"
                data-testid="input-org-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-email">Contact Email</Label>
              <Input
                id="org-email"
                type="email"
                defaultValue="demo@synapsegrid.ai"
                data-testid="input-org-email"
              />
            </div>
            <Button data-testid="button-save-org">Save Changes</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Agent Settings</CardTitle>
            <CardDescription>
              Configure default agent behavior
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Autonomous Sub-Agent Creation</Label>
                <p className="text-xs text-muted-foreground">
                  Allow agents to spawn sub-agents for task decomposition
                </p>
              </div>
              <Switch defaultChecked data-testid="switch-auto-subagent" />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-Cleanup Completed Sub-Agents</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically remove sub-agents after task completion
                </p>
              </div>
              <Switch defaultChecked data-testid="switch-auto-cleanup" />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="max-subagents">Max Sub-Agents per Parent</Label>
              <Input
                id="max-subagents"
                type="number"
                defaultValue="10"
                data-testid="input-max-subagents"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security & Compliance</CardTitle>
            <CardDescription>
              Enterprise security settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Audit Logging</Label>
                <p className="text-xs text-muted-foreground">
                  Track all agent actions and data access
                </p>
              </div>
              <Switch defaultChecked data-testid="switch-audit-logging" />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>HIPAA Compliance Mode</Label>
                <p className="text-xs text-muted-foreground">
                  Enable additional safeguards for healthcare data
                </p>
              </div>
              <Switch data-testid="switch-hipaa" />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Data Encryption at Rest</Label>
                <p className="text-xs text-muted-foreground">
                  AES-256 encryption for stored data
                </p>
              </div>
              <Switch defaultChecked disabled />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
