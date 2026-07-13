// app/(app)/businesses/[id]/page.tsx
// Business detail page - supports both real and demo mode

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
  Loader2,
  Compass,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { getDemoMode } from '@/lib/auth';
import { pathwayInfo } from '@/lib/classification/tpa-logic';
import type { TPAPathway } from '@/lib/classification/tpa-types';
import { cn } from '@/lib/utils';

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

interface PathwayClassification {
  id: string;
  pathway: TPAPathway;
  pathway_number: number;
  confidence: number;
  stage: string;
  revenue_range: string;
  team_size: string;
  primary_challenge: string;
  growth_intent: string;
  classified_at: string;
}

interface PageProps {
  params: {
    id: string;
  };
}

export default function BusinessDetailPage({ params }: PageProps) {
  const router = useRouter();
  const [business, setBusiness] = useState<Business | null>(null);
  const [classification, setClassification] = useState<PathwayClassification | null>(null);
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
        const [businessRes, classificationRes] = await Promise.all([
          fetch(`/api/businesses/${params.id}`),
          fetch(`/api/businesses/${params.id}/classification`),
        ]);

        if (!businessRes.ok) {
          if (businessRes.status === 404) {
            setError('Business not found');
          } else {
            setError('Failed to load business');
          }
          setLoading(false);
          return;
        }
        
        const businessData = await businessRes.json();
        setBusiness(businessData.business);

        if (classificationRes.ok) {
          const classificationData = await classificationRes.json();
          if (classificationData.classification) {
            setClassification(classificationData.classification);
          }
        }
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
        <div className="flex items-center gap-2 text-[#5E3B6C]">
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
            className="inline-flex items-center text-sm text-[#5E3B6C] hover:text-[#1F315B] transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Businesses
          </Link>
        </div>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-[#1F315B] mb-2">Business Not Found</h1>
          <p className="text-[#5E3B6C] mb-4">
            The business you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
          </p>
          <Link href="/businesses">
            <Button className="bg-[#1F315B]">View All Businesses</Button>
          </Link>
        </div>
      </div>
    );
  }

  const pathwayData = classification ? pathwayInfo[classification.pathway] : null;

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link
          href="/businesses"
          className="inline-flex items-center text-sm text-[#5E3B6C] hover:text-[#1F315B] transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Businesses
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-[#1F315B] font-display">{business.name}</h1>
            {business.alias && (
              <span className="text-[#5E3B6C] text-lg">({business.alias})</span>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm text-[#5E3B6C] flex-wrap">
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
          <Link href={`/businesses/${business.id}/classification`}>
            <Button 
              variant="outline"
              className="border-[#D4AF63] text-[#1F315B] hover:bg-[#D4AF63]/10"
            >
              <Compass className="mr-2 h-4 w-4" />
              {classification ? 'Update Pathway' : 'Classify'}
            </Button>
          </Link>
          <Link href={`/businesses/${business.id}/edit`}>
            <Button 
              variant="outline"
              className="border-[#1F315B] text-[#1F315B] hover:bg-[#1F315B]/5"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pathway Classification */}
          <Card className={cn(
            "p-6 border-2",
            pathwayData ? pathwayData.bgColor : "bg-white/60",
            pathwayData ? pathwayData.borderColor : "border-[#CDBFD6]/30"
          )}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#1F315B] flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[#D4AF63]" />
                Profit Architecture Pathway
              </h2>
              {classification && (
                <span className="text-sm text-[#5E3B6C]">
                  Confidence: {Math.round(classification.confidence * 100)}%
                </span>
              )}
            </div>

            {classification && pathwayData ? (
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-full bg-[#1F315B] text-white flex items-center justify-center text-xl font-bold">
                    {pathwayData.number}
                  </div>
                  <div>
                    <h3 className={cn("text-2xl font-bold font-display", pathwayData.color)}>
                      {pathwayData.name}
                    </h3>
                    <p className="text-[#5E3B6C]">{pathwayData.tagline}</p>
                  </div>
                </div>
                <p className="text-[#1F315B] mb-4">{pathwayData.description}</p>
                
                {/* Focus Areas */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {pathwayData.focusAreas.map((area, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-white/70 rounded-full text-sm text-[#5E3B6C] border border-[#D4AF63]/30"
                    >
                      {area}
                    </span>
                  ))}
                </div>

                <div className="text-xs text-[#5E3B6C]">
                  Classified on {new Date(classification.classified_at).toLocaleDateString()}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto rounded-full bg-[#F6F1E8] flex items-center justify-center mb-4">
                  <Compass className="h-8 w-8 text-[#CDBFD6]" />
                </div>
                <p className="text-[#5E3B6C] mb-4">
                  This business hasn&apos;t been classified yet
                </p>
                <Link href={`/businesses/${business.id}/classification`}>
                  <Button className="bg-gradient-to-r from-[#1F315B] to-[#5E3B6C] text-white">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Classify Business
                  </Button>
                </Link>
              </div>
            )}
          </Card>

          {/* Goals */}
          {business.goals && business.goals.length > 0 && (
            <Card className="p-6 bg-white/60 border-[#CDBFD6]/30">
              <h2 className="text-lg font-semibold text-[#1F315B] mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-[#2E7C83]" />
                Goals
              </h2>
              <div className="space-y-3">
                {business.goals.map((goal) => (
                  <div key={goal.id} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#D4AF63] mt-2" />
                    <div className="flex-1">
                      <p className="font-medium text-[#1F315B]">{goal.text}</p>
                      {goal.priority && (
                        <span className="text-xs text-[#5E3B6C] capitalize">
                          {goal.priority} priority
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Concerns */}
          {business.concerns && business.concerns.length > 0 && (
            <Card className="p-6 bg-white/60 border-[#CDBFD6]/30">
              <h2 className="text-lg font-semibold text-[#1F315B] mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                Concerns
              </h2>
              <div className="space-y-3">
                {business.concerns.map((concern) => (
                  <div key={concern.id} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-amber-500 mt-2" />
                    <div className="flex-1">
                      <p className="font-medium text-[#1F315B]">{concern.text}</p>
                      {concern.severity && (
                        <span className="text-xs text-[#5E3B6C] capitalize">
                          {concern.severity} severity
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Classification Summary */}
          {classification && (
            <Card className="p-6 bg-white/60 border-[#CDBFD6]/30">
              <h3 className="font-semibold text-[#1F315B] mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#2E7C83]" />
                Classification Summary
              </h3>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-[#5E3B6C]">Stage</dt>
                  <dd className="font-medium text-[#1F315B] capitalize">
                    {classification.stage.replace(/_/g, ' ')}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#5E3B6C]">Revenue</dt>
                  <dd className="font-medium text-[#1F315B]">
                    {classification.revenue_range === 'zero' ? '$0' :
                     classification.revenue_range === '1_to_50k' ? '$1 - $50K' :
                     classification.revenue_range === '50k_to_100k' ? '$50K - $100K' :
                     classification.revenue_range === '100k_to_250k' ? '$100K - $250K' :
                     classification.revenue_range === '250k_to_500k' ? '$250K - $500K' :
                     classification.revenue_range === '500k_to_1m' ? '$500K - $1M' :
                     classification.revenue_range === '1m_to_5m' ? '$1M - $5M' :
                     classification.revenue_range === '5m_plus' ? '$5M+' : classification.revenue_range}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#5E3B6C]">Team Size</dt>
                  <dd className="font-medium text-[#1F315B] capitalize">
                    {classification.team_size.replace(/_/g, ' ')}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#5E3B6C]">Primary Challenge</dt>
                  <dd className="font-medium text-[#1F315B] capitalize">
                    {classification.primary_challenge.replace(/_/g, ' ')}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#5E3B6C]">Growth Intent</dt>
                  <dd className="font-medium text-[#1F315B] capitalize">
                    {classification.growth_intent.replace(/_/g, ' ')}
                  </dd>
                </div>
              </dl>
            </Card>
          )}

          {/* Address */}
          {(business.street_address_line_1 || business.address_city) && (
            <Card className="p-6 bg-white/60 border-[#CDBFD6]/30">
              <h3 className="font-semibold text-[#1F315B] mb-3">Address</h3>
              <div className="text-sm text-[#5E3B6C]">
                {business.street_address_line_1 && <p>{business.street_address_line_1}</p>}
                {business.street_address_line_2 && <p>{business.street_address_line_2}</p>}
                <p>
                  {[business.address_city, business.address_state, business.address_zip_code]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              </div>
            </Card>
          )}

          {/* Quick Actions */}
          <Card className="p-6 bg-white/60 border-[#CDBFD6]/30">
            <h3 className="font-semibold text-[#1F315B] mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <Link href={`/businesses/${business.id}/team`}>
                <Button 
                  variant="outline" 
                  className="w-full justify-start border-[#1F315B]/20 text-[#1F315B] hover:bg-[#1F315B]/5"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Manage Team
                </Button>
              </Link>
              <Link href={`/businesses/${business.id}/classification`}>
                <Button 
                  variant="outline" 
                  className="w-full justify-start border-[#1F315B]/20 text-[#1F315B] hover:bg-[#1F315B]/5"
                >
                  <Compass className="mr-2 h-4 w-4" />
                  {classification ? 'Update Classification' : 'Classify Business'}
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
