import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Shield, 
  FileText, 
  Eye, 
  CheckCircle2,
  AlertCircle,
  Lock,
  Scale,
  Building,
  Globe
} from 'lucide-react';

const mockAuditLogs = [
  {
    id: '1',
    timestamp: new Date('2025-11-06T10:30:00'),
    action: 'agent_created',
    entityType: 'agent',
    entityId: 'agent-123',
    userId: 'admin@example.com',
    details: 'Created agent "Customer Support Bot"',
  },
  {
    id: '2',
    timestamp: new Date('2025-11-06T10:28:00'),
    action: 'workflow_executed',
    entityType: 'workflow',
    entityId: 'workflow-456',
    userId: 'system',
    details: 'Executed workflow "Lead Qualification"',
  },
  {
    id: '3',
    timestamp: new Date('2025-11-06T10:25:00'),
    action: 'document_uploaded',
    entityType: 'document',
    entityId: 'doc-789',
    userId: 'user@example.com',
    details: 'Uploaded document "Product Manual.pdf"',
  },
];

const complianceTemplates = [
  {
    id: 'hipaa',
    name: 'HIPAA',
    description: 'Health Insurance Portability and Accountability Act',
    enabled: true,
    rules: [
      'Encrypt all PHI data at rest and in transit',
      'Implement access controls for sensitive data',
      'Maintain audit logs for all data access',
      'Regular security assessments',
    ],
  },
  {
    id: 'gdpr',
    name: 'GDPR',
    description: 'General Data Protection Regulation',
    enabled: true,
    rules: [
      'Right to data erasure',
      'Data portability',
      'Consent management',
      'Data breach notifications within 72 hours',
    ],
  },
  {
    id: 'soc2',
    name: 'SOC 2',
    description: 'Service Organization Control 2',
    enabled: false,
    rules: [
      'Security controls and monitoring',
      'Availability and disaster recovery',
      'Processing integrity',
      'Confidentiality measures',
    ],
  },
  {
    id: 'pci',
    name: 'PCI DSS',
    description: 'Payment Card Industry Data Security Standard',
    enabled: false,
    rules: [
      'Secure cardholder data',
      'Encrypted transmission',
      'Regular vulnerability scans',
      'Access control measures',
    ],
  },
];

export default function Compliance() {
  const [selectedTemplate, setSelectedTemplate] = useState(complianceTemplates[0]);

  return (
    <div className="flex-1 space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Shield className="h-6 w-6" />
          Compliance & Explainability
        </h1>
        <p className="text-sm text-muted-foreground">
          Audit logs, compliance templates, and AI decision transparency
        </p>
      </div>

      <Tabs defaultValue="audit" className="w-full">
        <TabsList>
          <TabsTrigger value="audit">
            <FileText className="h-4 w-4 mr-2" />
            Audit Logs
          </TabsTrigger>
          <TabsTrigger value="compliance">
            <Scale className="h-4 w-4 mr-2" />
            Compliance
          </TabsTrigger>
          <TabsTrigger value="explainability">
            <Eye className="h-4 w-4 mr-2" />
            Explainability
          </TabsTrigger>
        </TabsList>

        <TabsContent value="audit" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Audit Trail</CardTitle>
              <CardDescription>
                Immutable log of all system actions and user activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {mockAuditLogs.map((log) => (
                    <div 
                      key={log.id} 
                      className="flex items-start gap-4 p-4 border rounded-lg hover-elevate"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{log.action.replace('_', ' ')}</span>
                          <Badge variant="outline">{log.entityType}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {log.details}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{log.timestamp.toLocaleString()}</span>
                          <span>User: {log.userId}</span>
                          <span>ID: {log.entityId}</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        View Details
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4 mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {complianceTemplates.map((template) => (
              <Card 
                key={template.id} 
                className={`hover-elevate cursor-pointer ${selectedTemplate.id === template.id ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setSelectedTemplate(template)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      <CardDescription className="text-xs mt-1">
                        {template.description}
                      </CardDescription>
                    </div>
                    {template.enabled ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>

          {selectedTemplate && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{selectedTemplate.name} Configuration</CardTitle>
                    <CardDescription>{selectedTemplate.description}</CardDescription>
                  </div>
                  <Badge variant={selectedTemplate.enabled ? 'default' : 'secondary'}>
                    {selectedTemplate.enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Compliance Rules
                  </h4>
                  <div className="space-y-2">
                    {selectedTemplate.rules.map((rule, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 border rounded-md">
                        <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{rule}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button className="flex-1">
                    {selectedTemplate.enabled ? 'Update Configuration' : 'Enable Template'}
                  </Button>
                  {selectedTemplate.enabled && (
                    <Button variant="outline">
                      Disable
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="explainability" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Decision Transparency</CardTitle>
              <CardDescription>
                View reasoning chains and confidence scores for AI-driven decisions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-start gap-3 mb-3">
                    <Badge>Customer Support Query</Badge>
                    <Badge variant="outline">Confidence: 87%</Badge>
                  </div>
                  <h4 className="font-medium mb-2">Decision: Route to Technical Support</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p><strong>Reasoning Chain:</strong></p>
                    <ol className="list-decimal list-inside space-y-1 ml-4">
                      <li>Detected technical keywords: "error", "API", "integration"</li>
                      <li>Customer tier: Premium (requires specialized support)</li>
                      <li>Issue complexity score: 8/10</li>
                      <li>Available technical agents: 3</li>
                      <li>Recommendation: Assign to senior technical support</li>
                    </ol>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-start gap-3 mb-3">
                    <Badge>Lead Scoring</Badge>
                    <Badge variant="outline">Confidence: 92%</Badge>
                  </div>
                  <h4 className="font-medium mb-2">Decision: High-Priority Lead</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p><strong>Reasoning Chain:</strong></p>
                    <ol className="list-decimal list-inside space-y-1 ml-4">
                      <li>Company size: 500+ employees (high value)</li>
                      <li>Industry: SaaS (target market match)</li>
                      <li>Budget indicated: Enterprise tier</li>
                      <li>Engagement score: 85/100</li>
                      <li>Recommendation: Immediate sales follow-up</li>
                    </ol>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-start gap-3 mb-3">
                    <Badge>Document Classification</Badge>
                    <Badge variant="outline">Confidence: 95%</Badge>
                  </div>
                  <h4 className="font-medium mb-2">Decision: Invoice Document</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p><strong>Reasoning Chain:</strong></p>
                    <ol className="list-decimal list-inside space-y-1 ml-4">
                      <li>Detected invoice number format</li>
                      <li>Contains pricing table</li>
                      <li>Payment terms section identified</li>
                      <li>Vendor information present</li>
                      <li>Recommendation: Process through invoice workflow</li>
                    </ol>
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
