// app/(app)/businesses/[id]/page.tsx
// Business detail page - supports both real and demo mode

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { getDemoMode } from '@/lib/auth';

interface Business {
  id: string;
  name: string;
  alias?: string;
  organization_type: string;
  organization_type_category?: string;
  organization_type_other?: string;
  industry?: string;
  industry_category?: string;
  industry_subcategory?: string;
  industry_other?: string;
  location_city?: string;
  location_state?: string;
  street_address_line_1?: string;
  street_address_line_2?: string;
  address_city?: string;
  address_state?: string;
  address_zip_code?: string;
  years_operating?: number;
  goals?: { id: string; text: string; priority?: string; type?: string }[];
  concerns?: { id: string; text: string; severity?: string; type?: string }[];
  created_at?: string;
}

interface PageProps {
  params: {
    id: string;
  };
}

export default function BusinessDetailPage({ params }: PageProps) {
  const router = useRouter();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBusiness = async () => {
      try {
        const isDemo = getDemoMode();
        
        if (isDemo) {
          // Demo mode: get business from localStorage
          const demoBusinessJson = localStorage.getItem('tpa_demo_business');
          if (demoBusinessJson) {
            const demoBusiness = JSON.parse(demoBusinessJson);
            // Check if this is the demo business we're looking for
            if (demoBusiness.id === params.id || params.id.startsWith('demo-business-')) {
              setBusiness(demoBusiness);
            } else {
              setError('Business not found');
            }
          } else {
            setError('Business not found');
          }
          setLoading(false);
          return;
        }

        // Real mode: fetch from API
        const response = await fetch(`/api/businesses/${params.id}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError('Business not found');
          } else {
            setError('Failed to load business');
          }
          setLoading(false);
          return;
        }
        
        const data = await response.json();
        setBusiness(data.business);
      } catch (err) {
        console.error('Error fetching business:', err);
        setError('Failed to load business');
      } finally {
        setLoading(false);
      }
    };

    fetchBusiness();
  }, [params.id]);

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 flex items-center justify-center min-h-[50vh]">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading...
        </div>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <Link
            href="/businesses"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Businesses
          </Link>
        </div>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-2">Business Not Found</h1>
          <p className="text-muted-foreground mb-4">
            The business you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
          </p>
          <Link href="/businesses">
            <Button>View All Businesses</Button>
          </Link>
        </div>
      </div>
    );
  }

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
          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <Building2 className="h-4 w-4" />
              {business.organization_type?.replace(/_/g, ' ')}
            </span>
            {business.industry && (
              <span className="flex items-center gap-1">
                <Tag className="h-4 w-4" />
                {business.industry}
              </span>
            )}
            {(business.address_city || business.address_state) && (
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {[business.address_city, business.address_state].filter(Boolean).join(', ')}
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
              Classify
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
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                This business hasn&apos;t been classified yet
              </p>
              <Link href={`/businesses/${business.id}/classify`}>
                <Button>Classify Business</Button>
              </Link>
            </div>
          </div>

          {/* Goals */}
          {business.goals && business.goals.length > 0 && (
            <div className="bg-card border rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Target className="h-5 w-5" />
                Goals
              </h2>
              <div className="space-y-3">
                {business.goals.map((goal) => (
                  <div key={goal.id} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                    <div className="flex-1">
                      <p className="font-medium">{goal.text}</p>
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
          {business.concerns && business.concerns.length > 0 && (
            <div className="bg-card border rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Concerns
              </h2>
              <div className="space-y-3">
                {business.concerns.map((concern) => (
                  <div key={concern.id} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-destructive mt-2" />
                    <div className="flex-1">
                      <p className="font-medium">{concern.text}</p>
                      {concern.severity && (
                        <span className="text-xs text-muted-foreground capitalize">
                          {concern.severity} severity
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
          {/* Address */}
          {(business.street_address_line_1 || business.address_city) && (
            <div className="bg-card border rounded-lg p-6">
              <h3 className="font-semibold mb-3">Address</h3>
              <div className="text-sm text-muted-foreground">
                {business.street_address_line_1 && <p>{business.street_address_line_1}</p>}
                {business.street_address_line_2 && <p>{business.street_address_line_2}</p>}
                <p>
                  {[business.address_city, business.address_state, business.address_zip_code]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              </div>
            </div>
          )}

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
