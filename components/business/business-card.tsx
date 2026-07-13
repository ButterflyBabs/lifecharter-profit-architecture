// components/business/business-card.tsx
// Business summary card component - LifeCharter Brand Styling

import Link from 'next/link';
import { TPAPathwayBadgeCompact } from './tpa-pathway-badge';
import { Building2, MapPin, Users, ArrowRight, Compass } from 'lucide-react';
import type { TPAPathway } from '@/lib/classification/tpa-types';

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
    // New pathway classification
    tpa_pathway_classification?: {
      pathway: string;
      pathway_number: number;
      confidence: number;
    } | null;
    // Legacy classification (for backwards compatibility)
    tpa_business_classifications?: {
      primary_pathway: string;
      confidence: number;
    }[];
  };
}

export function BusinessCard({ business }: BusinessCardProps) {
  // Use new pathway classification if available, fall back to legacy
  const pathwayClassification = business.tpa_pathway_classification;
  const legacyClassification = business.tpa_business_classifications?.[0];
  const primaryFacilitator = business.tpa_business_assignments?.find(
    (a) => a.role === 'primary_facilitator'
  );

  return (
    <Link href={`/businesses/${business.id}`}>
      <div className="group bg-[#FDFBF7] rounded-2xl border border-[#D4AF63]/20 p-6 hover:shadow-sacred-lg hover:border-[#D4AF63]/40 transition-all duration-300 cursor-pointer h-full flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-semibold text-lg text-[#1F315B] truncate group-hover:text-[#5E3B6C] transition-colors">
              {business.name}
            </h3>
            {business.alias && (
              <p className="font-body text-sm text-[#1F315B]/60 truncate">{business.alias}</p>
            )}
          </div>
          <div className="w-8 h-8 rounded-full bg-[#D4AF63]/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-3 border border-[#D4AF63]/20">
            <ArrowRight className="h-4 w-4 text-[#D4AF63]" />
          </div>
        </div>

        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-2 text-sm text-[#1F315B]/60 mb-4 font-body">
          <span className="flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-[#2E7C83]" />
            <span className="capitalize">{business.organization_type.replace('_', ' ')}</span>
          </span>
          {business.industry && (
            <span className="text-[#D4AF63]">•</span>
          )}
          {business.industry && (
            <span className="capitalize">{business.industry.replace('_', ' ')}</span>
          )}
          {(business.location_city || business.location_state) && (
            <>
              <span className="text-[#D4AF63]">•</span>
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-[#5E3B6C]" />
                {[business.location_city, business.location_state].filter(Boolean).join(', ')}
              </span>
            </>
          )}
        </div>

        {/* Pathway badge */}
        <div className="mt-auto pt-4 border-t border-[#D4AF63]/10">
          {pathwayClassification ? (
            <div className="flex items-center justify-between">
              <TPAPathwayBadgeCompact 
                pathway={pathwayClassification.pathway} 
                pathwayNumber={pathwayClassification.pathway_number}
              />
              <span className="font-body text-xs text-[#1F315B]/50">
                {Math.round(pathwayClassification.confidence * 100)}% confidence
              </span>
            </div>
          ) : legacyClassification ? (
            <div className="flex items-center justify-between">
              <span className="font-body text-xs text-[#1F315B]/60 capitalize">
                {legacyClassification.primary_pathway.replace(/_/g, ' ')}
              </span>
              <span className="font-body text-xs text-[#1F315B]/50">
                {Math.round(legacyClassification.confidence * 100)}%
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-body text-sm text-[#1F315B]/50 italic">
                <Compass className="h-3.5 w-3.5" />
                Not classified
              </span>
              <span className="font-body text-xs text-[#5E3B6C]">Classify →</span>
            </div>
          )}
        </div>

        {/* Facilitator */}
        {primaryFacilitator && (
          <div className="mt-3 pt-3 border-t border-[#D4AF63]/10 flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#5E3B6C]/10 flex items-center justify-center">
              <Users className="h-3 w-3 text-[#5E3B6C]" />
            </div>
            <span className="font-body text-xs text-[#1F315B]/60 truncate">
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
