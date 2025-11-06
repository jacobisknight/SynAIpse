import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Database, Upload, FileText, File, Trash2, Search, X } from "lucide-react";
import type { Document } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface SearchMatch {
  lineNumber: number;
  text: string;
}

interface SearchResult {
  documentId: string;
  documentName: string;
  fileType: string;
  matchCount: number;
  matches: SearchMatch[];
}

interface SearchResponse {
  query: string;
  totalDocuments: number;
  documentsWithMatches: number;
  results: SearchResult[];
}

export default function DataSources() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { data: documents = [], isLoading } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });

  const searchMutation = useMutation<SearchResponse, Error, string>({
    mutationFn: async (query: string) => {
      const response = await apiRequest("POST", "/api/documents/search-all", { query });
      return response.json();
    },
    onSuccess: (data: SearchResponse) => {
      setSearchResults(data);
    },
    onError: (error: any) => {
      toast({
        title: "Search failed",
        description: error.message || "Failed to search documents",
        variant: "destructive",
      });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const content = await file.text();
      
      return apiRequest("POST", "/api/documents", {
        name: file.name,
        content,
        fileType: file.name.split('.').pop() || 'txt',
        fileSize: file.size,
        metadata: {
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({
        title: "Document uploaded",
        description: "Your document has been successfully uploaded.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload document",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/documents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({
        title: "Document deleted",
        description: "The document has been successfully deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete document",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    const allowedTypes = ['.txt', '.md'];
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!allowedTypes.includes(fileExt)) {
      toast({
        title: "Invalid file type",
        description: "Only .txt and .md files are currently supported.",
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      searchMutation.mutate(searchQuery);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchResults(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      handleSearch();
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (fileType: string) => {
    const type = fileType.toLowerCase();
    if (type === 'txt' || type === 'md') {
      return <FileText className="h-12 w-12 text-muted-foreground" />;
    }
    return <File className="h-12 w-12 text-muted-foreground" />;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive", label: string }> = {
      ready: { variant: "default", label: "Ready" },
      processing: { variant: "secondary", label: "Processing" },
      error: { variant: "destructive", label: "Error" },
    };
    const config = variants[status] || variants.ready;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <>
        {parts.map((part, index) => 
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={index} className="bg-yellow-200 dark:bg-yellow-900 font-semibold">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">Data Sources</h1>
          <p className="text-sm text-muted-foreground">
            Manage data sources for RAG-based knowledge retrieval
          </p>
        </div>
        <Button 
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadMutation.isPending}
          data-testid="button-upload-document"
        >
          <Upload className="h-4 w-4 mr-2" />
          {uploadMutation.isPending ? "Uploading..." : "Upload Document"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.md"
          onChange={(e) => handleFileUpload(e.target.files)}
          className="hidden"
          data-testid="input-file-upload"
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-12 w-12 mb-4" />
                <Skeleton className="h-4 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-3 w-1/2 mb-2" />
                <Skeleton className="h-3 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : documents.length === 0 ? (
        <>
          <Card
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={dragActive ? "border-primary bg-primary/5" : ""}
          >
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Database className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No data sources yet</h3>
              <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
                Upload documents to enable your data agents to provide insights and answer questions using RAG
              </p>
              <Button 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadMutation.isPending}
                data-testid="button-upload-first"
              >
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
                    <span>Text Files (.txt)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>Markdown (.md)</span>
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
        </>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search document content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-9"
                data-testid="input-search-documents"
              />
            </div>
            <Button 
              variant="outline" 
              onClick={handleSearch}
              disabled={searchMutation.isPending || !searchQuery.trim()}
              data-testid="button-search"
            >
              <Search className="h-4 w-4 mr-2" />
              {searchMutation.isPending ? "Searching..." : "Search"}
            </Button>
            {searchResults && (
              <Button 
                variant="ghost" 
                onClick={handleClearSearch}
                data-testid="button-clear-search"
              >
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
          </div>

          {searchMutation.isPending && (
            <div className="space-y-4">
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-sm text-muted-foreground">Searching through documents...</p>
                </div>
              </div>
            </div>
          )}

          {searchResults && !searchMutation.isPending && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold" data-testid="text-search-results-title">
                  Search Results for "{searchResults.query}"
                </h2>
                <p className="text-sm text-muted-foreground">
                  Found {searchResults.documentsWithMatches} document(s) with matches
                </p>
              </div>

              {searchResults.results.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Search className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground" data-testid="text-no-results">
                      No results found for "{searchResults.query}"
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {searchResults.results.map((result) => (
                    <Card key={result.documentId} data-testid={`card-search-result-${result.documentId}`}>
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3">
                            {getFileIcon(result.fileType)}
                            <div>
                              <CardTitle className="text-base">{result.documentName}</CardTitle>
                              <p className="text-xs text-muted-foreground mt-1">
                                {result.matchCount} match{result.matchCount !== 1 ? 'es' : ''} found
                              </p>
                            </div>
                          </div>
                          <Badge variant="secondary">{result.fileType.toUpperCase()}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {result.matches.map((match, idx) => (
                            <div 
                              key={idx} 
                              className="border-l-2 border-primary pl-4 py-2"
                              data-testid={`search-match-${result.documentId}-${idx}`}
                            >
                              <div className="flex items-baseline gap-2 mb-1">
                                <Badge variant="outline" className="text-xs">
                                  Line {match.lineNumber}
                                </Badge>
                              </div>
                              <p className="text-sm font-mono">
                                {highlightMatch(match.text, searchResults.query)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {!searchResults && !searchMutation.isPending && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {documents.map((doc) => (
                <Card 
                  key={doc.id} 
                  data-testid={`card-document-${doc.id}`}
                  className="hover-elevate"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        {getFileIcon(doc.fileType)}
                        <CardTitle className="text-base mt-4 truncate" title={doc.name}>
                          {doc.name}
                        </CardTitle>
                      </div>
                      {getStatusBadge(doc.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Type: {doc.fileType.toUpperCase()}</span>
                      <span>{formatFileSize(doc.fileSize)}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Uploaded {formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full"
                      onClick={() => deleteMutation.mutate(doc.id)}
                      disabled={deleteMutation.isPending}
                      data-testid={`button-delete-${doc.id}`}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
