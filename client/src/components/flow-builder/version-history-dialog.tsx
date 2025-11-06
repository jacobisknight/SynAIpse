import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { RotateCcw, Calendar } from "lucide-react";
import type { WorkflowVersion } from "@shared/schema";
import { format } from "date-fns";

interface VersionHistoryDialogProps {
  workflowId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRestore: () => void;
}

export function VersionHistoryDialog({
  workflowId,
  open,
  onOpenChange,
  onRestore,
}: VersionHistoryDialogProps) {
  const { toast } = useToast();

  const { data: versions, isLoading } = useQuery<WorkflowVersion[]>({
    queryKey: [`/api/workflows/${workflowId}/versions`],
    enabled: open,
  });

  const restoreMutation = useMutation({
    mutationFn: async (versionId: string) => {
      return apiRequest("POST", `/api/workflows/${workflowId}/versions/${versionId}/restore`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/workflows/${workflowId}/versions`] });
      queryClient.invalidateQueries({ queryKey: [`/api/workflows/${workflowId}`] });
      toast({
        title: "Version restored",
        description: "The workflow has been restored to this version.",
      });
      onRestore();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to restore version",
        variant: "destructive",
      });
    },
  });

  const handleRestore = (versionId: string) => {
    if (confirm("Are you sure you want to restore this version? The current version will be saved as a backup.")) {
      restoreMutation.mutate(versionId);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Version History</DialogTitle>
          <DialogDescription>
            View and restore previous versions of this workflow
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-sm text-muted-foreground">Loading versions...</p>
            </div>
          ) : versions && versions.length > 0 ? (
            <div className="space-y-3">
              {versions.map((version) => (
                <Card key={version.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">Version {version.version}</Badge>
                          {version.description && (
                            <span className="text-sm text-muted-foreground">
                              {version.description}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(version.createdAt), "PPp")}
                          </div>
                          {version.createdBy && (
                            <span>by {version.createdBy}</span>
                          )}
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">
                          {Array.isArray(version.nodes) ? version.nodes.length : 0} nodes,{" "}
                          {Array.isArray(version.edges) ? version.edges.length : 0} edges
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestore(version.id)}
                        disabled={restoreMutation.isPending}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Restore
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <p className="text-sm text-muted-foreground">No versions found</p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
