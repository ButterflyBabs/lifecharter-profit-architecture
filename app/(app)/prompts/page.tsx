import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { 
  Bot, 
  Code, 
  FileText, 
  GitBranch, 
  MessageSquare, 
  Sparkles,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Prompt Registry | The Profit Architecture',
  description: 'AI prompt management and version control',
};

// Category icons
const categoryIcons: Record<string, React.ReactNode> = {
  classification: <GitBranch className="h-4 w-4" />,
  analysis: <Code className="h-4 w-4" />,
  synthesis: <Sparkles className="h-4 w-4" />,
  generation: <FileText className="h-4 w-4" />,
  advisory: <MessageSquare className="h-4 w-4" />,
};

const categoryLabels: Record<string, string> = {
  classification: 'Classification',
  analysis: 'Analysis',
  synthesis: 'Synthesis',
  generation: 'Generation',
  advisory: 'Advisory',
};

export default async function PromptsPage() {
  const supabase = createClient();
  
  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }
  
  // Check if user is admin
  const { data: membership } = await supabase
    .from('tpa_tenant_memberships')
    .select('role')
    .eq('user_id', user.id)
    .in('role', ['organization_admin', 'white_label_admin', 'system_admin'])
    .single();
  
  const isAdmin = !!membership;
  
  // Fetch all prompts with their active versions
  const { data: prompts } = await supabase
    .from('tpa_prompts')
    .select(`
      *,
      versions:tpa_prompt_versions(
        id,
        version,
        status,
        created_at,
        submitted_for_review_at,
        reviewed_at,
        reviewed_by,
        review_notes,
        usage_count,
        last_used_at
      )
    `)
    .order('category', { ascending: true })
    .order('name', { ascending: true });
  
  const promptsList = prompts || [];
  
  // Group by category
  const promptsByCategory = promptsList.reduce((acc: Record<string, any[]>, prompt) => {
    const category = prompt.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(prompt);
    return acc;
  }, {});
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" /> Active</Badge>;
      case 'draft':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" /> Draft</Badge>;
      case 'pending_review':
        return <Badge variant="warning"><Eye className="h-3 w-3 mr-1" /> Pending Review</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" /> Rejected</Badge>;
      case 'archived':
        return <Badge variant="outline">Archived</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };
  
  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Prompt Registry</h1>
          <p className="text-muted-foreground mt-2">
            AI prompt management and version control for assessment engine
          </p>
        </div>
        {isAdmin && (
          <Button>
            <Bot className="mr-2 h-4 w-4" />
            New Prompt
          </Button>
        )}
      </div>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{promptsList.length}</div>
            <div className="text-sm text-muted-foreground">Total Prompts</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {promptsList.filter(p => p.status === 'active').length}
            </div>
            <div className="text-sm text-muted-foreground">Active</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">
              {promptsList.filter(p => p.versions?.some((v: any) => v.status === 'pending_review')).length}
            </div>
            <div className="text-sm text-muted-foreground">Pending Review</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {promptsList.filter(p => p.versions?.some((v: any) => v.status === 'draft')).length}
            </div>
            <div className="text-sm text-muted-foreground">Drafts</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {promptsList.reduce((sum, p) => sum + (p.versions?.reduce((vsum: number, v: any) => vsum + (v.usage_count || 0), 0) || 0), 0)}
            </div>
            <div className="text-sm text-muted-foreground">Total Uses</div>
          </CardContent>
        </Card>
      </div>
      
      {/* Prompts by Category */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All Prompts</TabsTrigger>
          {Object.keys(promptsByCategory).map((category) => (
            <TabsTrigger key={category} value={category}>
              {categoryIcons[category]}
              <span className="ml-2">{categoryLabels[category] || category}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
          {promptsList.map((prompt) => (
            <PromptCard key={prompt.id} prompt={prompt} isAdmin={isAdmin} />
          ))}
          {promptsList.length === 0 && (
            <div className="text-center py-12">
              <Bot className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No Prompts Yet</h3>
              <p className="text-muted-foreground">
                Prompts will appear here once they are created.
              </p>
            </div>
          )}
        </TabsContent>
        
        {Object.entries(promptsByCategory).map(([category, categoryPrompts]) => (
          <TabsContent key={category} value={category} className="space-y-4">
            {categoryPrompts.map((prompt) => (
              <PromptCard key={prompt.id} prompt={prompt} isAdmin={isAdmin} />
            ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function PromptCard({ prompt, isAdmin }: { prompt: any; isAdmin: boolean }) {
  const activeVersion = prompt.versions?.find((v: any) => v.status === 'active');
  const latestVersion = prompt.versions?.[0];
  const pendingVersions = prompt.versions?.filter((v: any) => v.status === 'pending_review') || [];
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              {categoryIcons[prompt.category] || <Bot className="h-4 w-4" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">{prompt.name}</CardTitle>
                <code className="text-xs bg-muted px-2 py-0.5 rounded">{prompt.key}</code>
              </div>
              <CardDescription className="mt-1 max-w-2xl">
                {prompt.description}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(prompt.status)}
            {isAdmin && (
              <Button variant="outline" size="sm">
                Edit
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">Category</div>
            <div className="font-medium">{categoryLabels[prompt.category] || prompt.category}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Active Version</div>
            <div className="font-medium">
              {activeVersion ? `v${activeVersion.version}` : 'None'}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Total Versions</div>
            <div className="font-medium">{prompt.versions?.length || 0}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Usage</div>
            <div className="font-medium">
              {activeVersion?.usage_count || 0} calls
            </div>
          </div>
        </div>
        
        {pendingVersions.length > 0 && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-800">
              <Eye className="h-4 w-4" />
              <span className="font-medium">
                {pendingVersions.length} version(s) pending review
              </span>
            </div>
          </div>
        )}
        
        {activeVersion?.last_used_at && (
          <div className="mt-4 text-sm text-muted-foreground">
            Last used: {new Date(activeVersion.last_used_at).toLocaleString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
