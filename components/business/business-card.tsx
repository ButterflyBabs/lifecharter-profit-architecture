// components/business/business-card.tsx
// Business summary card component

import Link from 'next/link';
import { PathwayBadge } from './pathway-badge';
import { Building2, MapPin, Users, ArrowRight } from 'lucide-react';

interface BusinessCardProps {
  business: {
    id: string;
    name: string;
    alias?: string;
    organization_type: string;
    industry?: string;
    location_city?: string;
    location_state?: string;
    status: string;
    tpa_business_assignments?: {
      role: string;
      user?: {
        display_name?: string;
        email?: string;
      };
    }[];
    tpa_business_classifications?: {
      primary_pathway: string;
      confidence: number;
    }[];
  };
}

export function BusinessCard({ business }: BusinessCardProps) {
  const classification = business.tpa_business_classifications?.[0];
  const primaryFacilitator = business.tpa_business_assignments?.find(
    (a) => a.role === 'primary_facilitator'
  );

  return (
    <Link href={`/businesses/${business.id}`}>
      <div className="group bg-card border rounded-lg p-5 hover:shadow-md transition-shadow cursor-pointer h-full flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
              {business.name}
            </h3>
            {business.alias && (
              <p className="text-sm text-muted-foreground truncate">{business.alias}</p>
            )}
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2" />
        </div>

        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-4">
          <span className="flex items-center gap-1">
            <Building2 className="h-3.5 w-3.5" />
            <span className="capitalize">{business.organization_type.replace('_', ' ')}</span>
          </span>
          {business.industry && (
            <span className="text-muted-foreground/60">•</span>
          )}
          {business.industry && (
            <span className="capitalize">{business.industry.replace('_', ' ')}</span>
          )}
          {(business.location_city || business.location_state) && (
            <>
              <span className="text-muted-foreground/60">•</span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {[business.location_city, business.location_state].filter(Boolean).join(', ')}
              </span>
            </>
          )}
        </div>

        {/* Pathway badge */}
        <div className="mt-auto pt-3 border-t">
          {classification ? (
            <div className="flex items-center justify-between">
              <PathwayBadge pathway={classification.primary_pathway} size="sm" />
              <span className="text-xs text-muted-foreground">
                {Math.round(classification.confidence * 100)}% confidence
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground italic">Not classified</span>
              <span className="text-xs text-primary">Classify →</span>
            </div>
          )}
        </div>

        {/* Facilitator */}
        {primaryFacilitator && (
          <div className="mt-3 pt-3 border-t flex items-center gap-2">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground truncate">
              {primaryFacilitator.user?.display_name || 
               primaryFacilitator.user?.email || 
               'Unassigned'}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
