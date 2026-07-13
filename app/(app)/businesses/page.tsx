// app/(app)/businesses/page.tsx
// Business list page - supports both real and demo mode

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Building2, Loader2 } from 'lucide-react';
import { BusinessCard } from '@/components/business/business-card';
import { getDemoMode } from '@/lib/auth';

interface Business {
  id: string;
  name: string;
  alias?: string;
  organization_type: string;
  industry?: string;
  status: string;
  created_at: string;
  tpa_pathway_classification?: {
    pathway: string;
    pathway_number: number;
    confidence: number;
  } | null;
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
}

export default function BusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        const isDemo = getDemoMode();
        
        if (isDemo) {
          // Demo mode: get business from localStorage
          const demoBusinessJson = localStorage.getItem('tpa_demo_business');
          if (demoBusinessJson) {
            const demoBusiness = JSON.parse(demoBusinessJson);
            setBusinesses([{
              id: demoBusiness.id,
              name: demoBusiness.name,
              alias: demoBusiness.alias,
              organization_type: demoBusiness.organization_type,
              industry: demoBusiness.industry_category,
              status: 'active',
              created_at: demoBusiness.created_at || new Date().toISOString(),
            }]);
          } else {
            setBusinesses([]);
          }
          setLoading(false);
          return;
        }

        // Real mode: fetch from API
        const response = await fetch('/api/businesses');
        if (response.ok) {
          const data = await response.json();
          setBusinesses(data.businesses || []);
        } else {
          console.error('Failed to fetch businesses');
          setBusinesses([]);
        }
      } catch (err) {
        console.error('Error fetching businesses:', err);
        setBusinesses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBusinesses();
  }, []);

  const filteredBusinesses = businesses.filter(b => 
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (b.alias && b.alias.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F6F1E8] via-[#FDFBF7] to-[#F6F1E8]">
        <div className="container mx-auto py-8 px-4">
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="flex items-center gap-2 text-[#1F315B]/60">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F6F1E8] via-[#FDFBF7] to-[#F6F1E8]">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <p className="font-editorial italic text-[#5E3B6C] text-sm mb-1">Profit Architecture</p>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-[#1F315B]">Businesses</h1>
            <p className="font-body text-[#1F315B]/60 mt-1">
              Manage your client businesses and their Profit Architecture profiles
            </p>
          </div>
          <Link 
            href="/businesses/new"
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#1F315B] to-[#2a3f6e] text-[#F6F1E8] rounded-xl font-medium hover:shadow-lg hover:shadow-[#1F315B]/25 transition-all duration-300 font-body border border-[#D4AF63]/30 self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            Add Business
          </Link>
        </div>

        {/* Search and filters */}
        <div className="flex items-center gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#1F315B]/40" />
            <input
              type="text"
              placeholder="Search businesses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-[#D4AF63]/30 bg-[#FDFBF7] text-[#1F315B] placeholder-[#1F315B]/40 focus:outline-none focus:ring-2 focus:ring-[#D4AF63]/50 focus:border-[#D4AF63] transition-all font-body"
            />
          </div>
        </div>

        {/* Business grid */}
        {filteredBusinesses.length === 0 ? (
          <div className="text-center py-16 bg-[#FDFBF7] rounded-2xl border-2 border-dashed border-[#D4AF63]/30">
            <div className="mx-auto w-16 h-16 rounded-full bg-[#D4AF63]/10 flex items-center justify-center mb-4 border border-[#D4AF63]/20">
              <Building2 className="h-8 w-8 text-[#D4AF63]" />
            </div>
            <h3 className="font-display text-xl font-medium text-[#1F315B] mb-2">
              {searchQuery ? 'No businesses found' : 'No businesses yet'}
            </h3>
            <p className="font-body text-[#1F315B]/60 mb-6">
              {searchQuery 
                ? 'Try adjusting your search' 
                : 'Get started by adding your first business'}
            </p>
            {!searchQuery && (
              <Link 
                href="/businesses/new"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#D4AF63] to-[#E8D5A3] text-[#1F315B] rounded-xl font-medium hover:shadow-xl hover:shadow-[#D4AF63]/30 transition-all duration-300 font-body border border-[#D4AF63]/50"
              >
                <Plus className="w-4 h-4" />
                Add Business
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredBusinesses.map((business) => (
              <BusinessCard key={business.id} business={business} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
