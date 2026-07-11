// app/(app)/businesses/[id]/page.tsx
// Business detail page

import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { PathwayBadge } from '@/components/business/pathway-badge';
import { 
  Edit, 
  Users, 
  Tag, 
  Building2, 
  MapPin, 
  Calendar,
  ArrowLeft,
  Target,
  AlertTriangle
} from 'lucide-react';

interface PageProps {
  params: {
    id: string;
  };
}

async function getBusiness(id: string) {
  const supabase = createClient();
  
  const { data: business, error } = await supabase
    .from('tpa_businesses')
    .select(`
      *,
      tpa_business_assignments(
        id,
        user_id,
        role,
        status,
        assigned_at,
        user:tpa_profiles(id, display_name, email, avatar_url)
      ),
      tpa_business_classifications(
        *,
        classified_by_user:tpa_profiles!classified_by(id, display_name, email)
      ),
      tpa_business_team_members(*),
      tpa_business_goals(*)
    `)
    .eq('id', id)
    .single();

  if (error || !business) {
    return null;
  }

  return business;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const business = await getBusiness(params.id);
  
  if (!business) {
    return {
      title: 'Business Not Found | Profit Architecture',
    };
  }

  return {
    title: `${business.name} | Profit Architecture`,
    description: `Business profile for ${business.name}`,
  };
}

export default async function BusinessDetailPage({ params }: PageProps) {
  const business = await getBusiness(params.id);

  if (!business) {
    notFound();
  }

  const currentClassification = business.tpa_business_classifications?.find(
    (c: { status: string }) => c.status === 'confirmed'
  ) || business.tpa_business_classifications?.[0];

  const primaryFacilitator = business.tpa_business_assignments?.find(
    (a: { role: string }) => a.role === 'primary_facilitator'
  );

  const activeGoals = business.tpa_business_goals?.filter(
    (g: { type: string; status: string }) => g.type === 'goal' && g.status === 'active'
  ) || [];

  const activeConcerns = business.tpa_business_goals?.filter(
    (g: { type: string; status: string }) => g.type === 'concern' && g.status === 'active'
  ) || [];

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link
          href="/businesses"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Businesses
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight">{business.name}</h1>
            {business.alias && (
              <span className="text-muted-foreground text-lg">({business.alias})</span>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Building2 className="h-4 w-4" />
              {business.organization_type.replace('_', ' ')}
            </span>
            {business.industry && (
              <span className="flex items-center gap-1">
                <Tag className="h-4 w-4" />
                {business.industry}
              </span>
            )}
            {(business.location_city || business.location_state) && (
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {[business.location_city, business.location_state].filter(Boolean).join(', ')}
              </span>
            )}
            {business.years_operating && (
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {business.years_operating} years operating
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/businesses/${business.id}/classify`}>
            <Button variant="outline">
              <Tag className="mr-2 h-4 w-4" />
              {currentClassification ? 'Reclassify' : 'Classify'}
            </Button>
          </Link>
          <Link href={`/businesses/${business.id}/edit`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Classification */}
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Classification</h2>
            {currentClassification ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <PathwayBadge pathway={currentClassification.primary_pathway} size="lg" />
                  <span className="text-sm text-muted-foreground">
                    Confidence: {Math.round(currentClassification.confidence * 100)}%
                  </span>
                </div>
                {currentClassification.secondary_pathways?.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-muted-foreground">Secondary:</span>
                    {currentClassification.secondary_pathways.map((pathway: string) => (
                      <PathwayBadge key={pathway} pathway={pathway} size="sm" />
                    ))}
                  </div>
                )}
                <div className="text-sm text-muted-foreground">
                  Classified on {new Date(currentClassification.classified_at).toLocaleDateString()}
                  {currentClassification.classified_by_user?.display_name && (
                    <span> by {currentClassification.classified_by_user.display_name}</span>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  This business hasn&apos;t been classified yet
                </p>
                <Link href={`/businesses/${business.id}/classify`}>
                  <Button>Classify Business</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Goals */}
          {activeGoals.length > 0 && (
            <div className="bg-card border rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Target className="h-5 w-5" />
                Goals
              </h2>
              <div className="space-y-3">
                {activeGoals.slice(0, 5).map((goal: { id: string; title: string; priority?: string; description?: string }) => (
                  <div key={goal.id} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                    <div>
                      <p className="font-medium">{goal.title}</p>
                      {goal.description && (
                        <p className="text-sm text-muted-foreground">{goal.description}</p>
                      )}
                      {goal.priority && (
                        <span className="text-xs text-muted-foreground capitalize">
                          {goal.priority} priority
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Concerns */}
          {activeConcerns.length > 0 && (
            <div className="bg-card border rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Concerns
              </h2>
              <div className="space-y-3">
                {activeConcerns.slice(0, 5).map((concern: { id: string; title: string; priority?: string; description?: string }) => (
                  <div key={concern.id} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-destructive mt-2" />
                    <div>
                      <p className="font-medium">{concern.title}</p>
                      {concern.description && (
                        <p className="text-sm text-muted-foreground">{concern.description}</p>
                      )}
                      {concern.priority && (
                        <span className="text-xs text-muted-foreground capitalize">
                          {concern.priority} priority
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Facilitator */}
          <div className="bg-card border rounded-lg p-6">
            <h3 className="font-semibold mb-3">Primary Facilitator</h3>
            {primaryFacilitator ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-medium">
                    {primaryFacilitator.user?.display_name?.[0] || 
                     primaryFacilitator.user?.email?.[0] || '?'}
                  </span>
                </div>
                <div>
                  <p className="font-medium">
                    {primaryFacilitator.user?.display_name || 
                     primaryFacilitator.user?.email || 'Unknown'}
                  </p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {primaryFacilitator.role.replace('_', ' ')}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No facilitator assigned</p>
            )}
          </div>

          {/* Team */}
          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Team</h3>
              <Link href={`/businesses/${business.id}/team`}>
                <Button variant="ghost" size="sm">
                  <Users className="mr-2 h-4 w-4" />
                  Manage
                </Button>
              </Link>
            </div>
            <p className="text-2xl font-bold">
              {business.tpa_business_team_members?.length || 0}
            </p>
            <p className="text-sm text-muted-foreground">team members</p>
          </div>

          {/* Quick Actions */}
          <div className="bg-card border rounded-lg p-6">
            <h3 className="font-semibold mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <Link href={`/businesses/${business.id}/team`}>
                <Button variant="outline" className="w-full justify-start">
                  <Users className="mr-2 h-4 w-4" />
                  Manage Team
                </Button>
              </Link>
              <Link href={`/businesses/${business.id}/classify`}>
                <Button variant="outline" className="w-full justify-start">
                  <Tag className="mr-2 h-4 w-4" />
                  Update Classification
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
