import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Package, 
  Download, 
  Star, 
  Search, 
  TrendingUp,
  Puzzle,
  Workflow,
  Bot,
  Plug
} from 'lucide-react';

// Mock marketplace items for now
const mockMarketplaceItems = [
  {
    id: '1',
    name: 'Customer Sentiment Analyzer',
    description: 'Advanced sentiment analysis node for customer interactions',
    type: 'node',
    category: 'Analytics',
    version: '1.2.0',
    author: 'SynapseGrid Team',
    price: 0,
    downloads: 1243,
    rating: 470, // 4.70 * 100
    published: true,
  },
  {
    id: '2',
    name: 'Salesforce Advanced Connector',
    description: 'Enhanced Salesforce integration with real-time sync',
    type: 'connector',
    category: 'Integrations',
    version: '2.0.1',
    author: 'Enterprise Solutions Inc',
    price: 4999, // $49.99
    downloads: 856,
    rating: 485,
    published: true,
  },
  {
    id: '3',
    name: 'Multi-Language Support Agent',
    description: 'Pre-configured agent for multi-language customer support',
    type: 'agent',
    category: 'Customer Service',
    version: '1.5.0',
    author: 'GlobalTech',
    price: 0,
    downloads: 2031,
    rating: 462,
    published: true,
  },
  {
    id: '4',
    name: 'Invoice Processing Workflow',
    description: 'Automated invoice validation and processing workflow',
    type: 'workflow',
    category: 'Finance',
    version: '1.0.3',
    author: 'FinanceFlow',
    price: 2999,
    downloads: 421,
    rating: 445,
    published: true,
  },
  {
    id: '5',
    name: 'Email Classifier Node',
    description: 'Intelligent email classification and routing',
    type: 'node',
    category: 'Communication',
    version: '1.1.0',
    author: 'SynapseGrid Team',
    price: 0,
    downloads: 1876,
    rating: 478,
    published: true,
  },
  {
    id: '6',
    name: 'Slack Integration Plus',
    description: 'Enhanced Slack connector with advanced features',
    type: 'connector',
    category: 'Integrations',
    version: '3.2.0',
    author: 'CollabTech',
    price: 1999,
    downloads: 1122,
    rating: 490,
    published: true,
  },
];

const typeIcons = {
  node: Puzzle,
  connector: Plug,
  agent: Bot,
  workflow: Workflow,
};

export default function Marketplace() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');

  // For now, use mock data. In production, this would be a real API call
  const items = mockMarketplaceItems;

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesType = selectedType === 'all' || item.type === selectedType;
    
    return matchesSearch && matchesCategory && matchesType;
  });

  const categories = ['all', ...Array.from(new Set(items.map(i => i.category)))];
  const types = ['all', 'node', 'connector', 'agent', 'workflow'];

  return (
    <div className="flex-1 space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Marketplace</h1>
        <p className="text-sm text-muted-foreground">
          Discover and install extensions, connectors, and agents
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search marketplace..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map(cat => (
              <SelectItem key={cat} value={cat}>
                {cat === 'all' ? 'All Categories' : cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            {types.map(type => (
              <SelectItem key={type} value={type}>
                {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Items</TabsTrigger>
          <TabsTrigger value="featured">
            <TrendingUp className="h-4 w-4 mr-2" />
            Featured
          </TabsTrigger>
          <TabsTrigger value="free">Free</TabsTrigger>
          <TabsTrigger value="installed">Installed</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item) => {
              const Icon = typeIcons[item.type as keyof typeof typeIcons] || Package;
              const rating = (item.rating / 100).toFixed(1);
              
              return (
                <Card key={item.id} className="hover-elevate">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className="h-5 w-5 text-primary" />
                          <Badge variant="outline">{item.type}</Badge>
                        </div>
                        <CardTitle className="text-base">{item.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {item.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span>{rating}</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Download className="h-4 w-4" />
                          <span>{item.downloads.toLocaleString()}</span>
                        </div>
                      </div>
                      
                      <div className="text-xs text-muted-foreground">
                        by {item.author} • v{item.version}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button className="flex-1" size="sm">
                          {item.price === 0 ? 'Install Free' : `$${(item.price / 100).toFixed(2)}`}
                        </Button>
                        <Button variant="outline" size="sm">
                          Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredItems.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Package className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No items found</h3>
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  Try adjusting your search or filters to find what you're looking for
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="featured" className="mt-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <TrendingUp className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Featured items coming soon</h3>
              <p className="text-sm text-muted-foreground">
                Check back later for curated marketplace items
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="free" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredItems.filter(i => i.price === 0).map((item) => {
              const Icon = typeIcons[item.type as keyof typeof typeIcons] || Package;
              const rating = (item.rating / 100).toFixed(1);
              
              return (
                <Card key={item.id} className="hover-elevate">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className="h-5 w-5 text-primary" />
                          <Badge variant="outline">{item.type}</Badge>
                        </div>
                        <CardTitle className="text-base">{item.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {item.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span>{rating}</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Download className="h-4 w-4" />
                          <span>{item.downloads.toLocaleString()}</span>
                        </div>
                      </div>
                      
                      <div className="text-xs text-muted-foreground">
                        by {item.author} • v{item.version}
                      </div>

                      <Button className="w-full" size="sm">
                        Install Free
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="installed" className="mt-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Package className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No installed items yet</h3>
              <p className="text-sm text-muted-foreground">
                Install items from the marketplace to see them here
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
