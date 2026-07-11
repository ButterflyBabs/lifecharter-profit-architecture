import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getMethodologySummary } from '@/lib/methodology';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';
import { ArrowRight, BookOpen, Layers, Scale } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Methodology | The Profit Architecture',
  description: 'Assessment methodology framework and components',
};

export default async function MethodologyPage() {
  const supabase = createClient();
  
  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }
  
  // Get methodology summary
  const summary = await getMethodologySummary();
  
  if (!summary) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center py-12">
          <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-semibold">No Active Methodology</h2>
          <p className="text-muted-foreground">
            The methodology framework has not been configured yet.
          </p>
        </div>
      </div>
    );
  }
  
  const { methodology, components, totalIndicators } = summary;
  
  if (!methodology) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center py-12">
          <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-semibold">Methodology Not Found</h2>
          <p className="text-muted-foreground">
            Unable to load methodology data.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Methodology Framework</h1>
        <p className="text-muted-foreground mt-2">
          The Profit Architecture assessment methodology and scoring system
        </p>
      </div>
      
      {/* Current Version Card */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{methodology.name}</CardTitle>
              <CardDescription className="mt-2">
                Version {methodology.version} • Active since {new Date(methodology.effective_from).toLocaleDateString()}
              </CardDescription>
            </div>
            <Badge variant="default" className="text-sm">
              Active
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            {methodology.description}
          </p>
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-3xl font-bold">{components.length}</div>
              <div className="text-sm text-muted-foreground">Components</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-3xl font-bold">{totalIndicators}</div>
              <div className="text-sm text-muted-foreground">Indicators</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-3xl font-bold">0-5</div>
              <div className="text-sm text-muted-foreground">Score Range</div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Components Grid */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Assessment Components</h2>
          <Link 
            href="/components"
            className="text-sm text-primary hover:underline flex items-center"
          >
            View All Components <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {components.map((component) => (
            <Card key={component.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                      {component.sort_order}
                    </span>
                    <CardTitle className="text-base">{component.name}</CardTitle>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {component.default_weight}%
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {component.description}
                </p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {component.indicator_count} indicators
                  </span>
                  <Link 
                    href={`/components#${component.code}`}
                    className="text-primary hover:underline"
                  >
                    Details
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      
      {/* Scoring Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Scoring Guide
          </CardTitle>
          <CardDescription>
            Understanding the 0-5 assessment scale
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 text-center font-bold text-red-600">0</div>
              <div className="flex-1">
                <div className="font-medium">Critical</div>
                <div className="text-sm text-muted-foreground">
                  Severe issues requiring immediate attention
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 text-center font-bold text-orange-600">1-2</div>
              <div className="flex-1">
                <div className="font-medium">Poor to Fair</div>
                <div className="text-sm text-muted-foreground">
                  Significant weaknesses, below average performance
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 text-center font-bold text-blue-600">3</div>
              <div className="flex-1">
                <div className="font-medium">Good</div>
                <div className="text-sm text-muted-foreground">
                  Meeting expectations, solid foundation
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 text-center font-bold text-green-600">4-5</div>
              <div className="flex-1">
                <div className="font-medium">Strong to Excellent</div>
                <div className="text-sm text-muted-foreground">
                  Above average to best-in-class performance
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
