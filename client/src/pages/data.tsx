import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database, Upload, FileText } from "lucide-react";

export default function DataSources() {
  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">Data Sources</h1>
          <p className="text-sm text-muted-foreground">
            Manage data sources for RAG-based knowledge retrieval
          </p>
        </div>
        <Button data-testid="button-upload-data">
          <Upload className="h-4 w-4 mr-2" />
          Upload Documents
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Database className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No data sources yet</h3>
          <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
            Upload documents to enable your data agents to provide insights and answer questions using RAG
          </p>
          <Button data-testid="button-upload-first">
            <Upload className="h-4 w-4 mr-2" />
            Upload Your First Document
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Supported Formats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span>PDF Documents</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span>Microsoft Word (.docx)</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span>Text Files (.txt, .md)</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span>CSV & Spreadsheets</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Vector Database</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Your documents are automatically vectorized and stored for semantic search and retrieval across all data agents.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
