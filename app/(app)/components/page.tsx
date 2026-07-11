import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getActiveMethodology, getComponents, getComponentIndicators } from '@/lib/methodology';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  DollarSign, 
  Users, 
  Package, 
  TrendingUp, 
  Megaphone, 
  UserCog,
  Settings,
  Crown,
  HeartHandshake,
  Cpu,
  Rocket,
  Scale
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Components | The Profit Architecture',
  description: 'The 12 assessment components and their indicators',
};

// Icon mapping for components
const componentIcons: Record<string, React.ReactNode> = {
  financial_health: <DollarSign className="h-5 w-5" />,
  pricing_profitability: <Scale className="h-5 w-5" />,
  customer_market: <Users className="h-5 w-5" />,
  product_offer: <Package className="h-5 w-5" />,
  sales: <TrendingUp className="h-5 w-5" />,
  marketing: <Megaphone className="h-5 w-5" />,
  people_team: <UserCog className="h-5 w-5" />,
  process_operations: <Settings className="h-5 w-5" />,
  owner_leadership: <Crown className="h-5 w-5" />,
  customer_experience: <HeartHandshake className="h-5 w-5" />,
  technology_data: <Cpu className="h-5 w-5" />,
  growth_readiness: <Rocket className="h-5 w-5" />,
};

export default async function ComponentsPage() {
  const supabase = createClient();
  
  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }
  
  // Get active methodology and components
  const methodology = await getActiveMethodology();
  
  if (!methodology) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center py-12">
          <h2 className="text-lg font-semibold">No Active Methodology</h2>
          <p className="text-muted-foreground">
            The methodology framework has not been configured yet.
          </p>
        </div>
      </div>
    );
  }
  
  const components = await getComponents(methodology.id);
  
  // Fetch indicators for each component
  const componentsWithIndicators = await Promise.all(
    components.map(async (component) => {
      const indicators = await getComponentIndicators(component.id);
      return { ...component, indicators };
    })
  );
  
  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Assessment Components</h1>
        <p className="text-muted-foreground mt-2">
          The 12 components of The Profit Architecture methodology
        </p>
      </div>
      
      {/* Component Cards */}
      <div className="space-y-6">
        {componentsWithIndicators.map((component) => (
          <Card key={component.id} id={component.code} className="scroll-mt-20">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    {componentIcons[component.code] || <Scale className="h-5 w-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        Component {component.sort_order}
                      </span>
                      <Badge variant="secondary">{component.default_weight}%</Badge>
                    </div>
                    <CardTitle className="text-xl mt-1">{component.name}</CardTitle>
                    <CardDescription className="mt-2 max-w-2xl">
                      {component.description}
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Indicators Table */}
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left px-4 py-3 text-sm font-medium">Indicator</th>
                      <th className="text-left px-4 py-3 text-sm font-medium">Weight</th>
                      <th className="text-left px-4 py-3 text-sm font-medium">Scoring Guidance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {component.indicators.map((ci) => (
                      <tr key={ci.id} className="hover:bg-muted/50">
                        <td className="px-4 py-4">
                          <div className="font-medium">{ci.indicator?.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {ci.indicator?.description}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <Badge variant="outline">{ci.weight}x</Badge>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-red-600 font-medium w-4">0</span>
                              <span className="text-muted-foreground truncate max-w-xs">
                                {ci.indicator?.guidance_score_0}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-yellow-600 font-medium w-4">3</span>
                              <span className="text-muted-foreground truncate max-w-xs">
                                {ci.indicator?.guidance_score_3}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-green-600 font-medium w-4">5</span>
                              <span className="text-muted-foreground truncate max-w-xs">
                                {ci.indicator?.guidance_score_5}
                              </span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {component.indicators.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No indicators assigned to this component.
                </div>
              )}
              
              {/* Pathway Info */}
              {component.pathway_specific && component.applicable_pathways.length > 0 && (
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Applies to:</span>
                  {component.applicable_pathways.map((pathway) => (
                    <Badge key={pathway} variant="outline" className="text-xs">
                      {pathway.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Summary Stats */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Component Weight Distribution</CardTitle>
          <CardDescription>
            How the assessment is weighted across components
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {componentsWithIndicators.map((component) => (
              <div key={component.id} className="flex items-center gap-4">
                <div className="w-48 text-sm truncate">{component.name}</div>
                <div className="flex-1">
                  <Progress value={component.default_weight} className="h-2" />
                </div>
                <div className="w-12 text-sm font-medium text-right">
                  {component.default_weight}%
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t flex justify-between text-sm text-muted-foreground">
            <span>Total Weight</span>
            <span className="font-medium">
              {components.reduce((sum, c) => sum + c.default_weight, 0)}%
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
