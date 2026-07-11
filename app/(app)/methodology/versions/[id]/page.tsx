import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Calendar, FileText, AlertTriangle } from 'lucide-react';

interface VersionPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: VersionPageProps): Promise<Metadata> {
  const supabase = createClient();
  const { data: version } = await supabase
    .from('tpa_methodology_versions')
    .select('name, version')
    .eq('id', params.id)
    .single();
  
  return {
    title: version ? `${version.name} (v${version.version})` : 'Methodology Version',
  };
}

export default async function VersionDetailPage({ params }: VersionPageProps) {
  const supabase = createClient();
  
  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return null; // Middleware will handle redirect
  }
  
  // Fetch methodology version
  const { data: version } = await supabase
    .from('tpa_methodology_versions')
    .select(`
      *,
      components:tpa_components(
        *,
        indicator_count:tpa_component_indicators(count)
      )
    `)
    .eq('id', params.id)
    .single();
  
  if (!version) {
    notFound();
  }
  
  const components = version.components || [];
  const totalIndicators = components.reduce(
    (sum: number, c: any) => sum + (c.indicator_count?.[0]?.count || 0), 
    0
  );
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'retired':
        return <Badge variant="outline">Retired</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };
  
  return (
    <div className="container mx-auto py-8">
      {/* Back Navigation */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/methodology">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Methodology
          </Link>
        </Button>
      </div>
      
      {/* Version Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold">{version.name}</h1>
          {getStatusBadge(version.status)}
        </div>
        <p className="text-muted-foreground">
          Version {version.version} • {components.length} Components • {totalIndicators} Indicators
        </p>
      </div>
      
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {version.description || 'No description available.'}
              </p>
            </CardContent>
          </Card>
          
          {/* Release Notes */}
          {version.release_notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Release Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap">{version.release_notes}</p>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Changes Summary */}
          {version.changes_summary && (
            <Card>
              <CardHeader>
                <CardTitle>Changes Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{version.changes_summary}</p>
              </CardContent>
            </Card>
          )}
          
          {/* Components List */}
          <Card>
            <CardHeader>
              <CardTitle>Components</CardTitle>
              <CardDescription>
                Assessment components in this methodology version
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {components
                  .sort((a: any, b: any) => a.sort_order - b.sort_order)
                  .map((component: any) => (
                    <div 
                      key={component.id}
                      className="flex items-start justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-muted-foreground">
                            #{component.sort_order}
                          </span>
                          <h4 className="font-medium">{component.name}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {component.description}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span>{component.indicator_count?.[0]?.count || 0} indicators</span>
                          {component.pathway_specific && (
                            <Badge variant="outline" className="text-xs">
                              Pathway-specific
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Badge className="ml-4">{component.default_weight}%</Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Version Info */}
          <Card>
            <CardHeader>
              <CardTitle>Version Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Effective from:</span>
                <span>{new Date(version.effective_from).toLocaleDateString()}</span>
              </div>
              {version.effective_until && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Effective until:</span>
                  <span>{new Date(version.effective_until).toLocaleDateString()}</span>
                </div>
              )}
              {version.breaking_changes && (
                <div className="flex items-start gap-2 text-sm text-amber-600">
                  <AlertTriangle className="h-4 w-4 mt-0.5" />
                  <span>This version contains breaking changes from previous versions.</span>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Weight Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Weight Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {components
                  .sort((a: any, b: any) => b.default_weight - a.default_weight)
                  .slice(0, 5)
                  .map((component: any) => (
                    <div key={component.id} className="flex items-center justify-between text-sm">
                      <span className="truncate">{component.name}</span>
                      <span className="font-medium">{component.default_weight}%</span>
                    </div>
                  ))}
                {components.length > 5 && (
                  <p className="text-sm text-muted-foreground text-center pt-2">
                    +{components.length - 5} more components
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
