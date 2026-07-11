// app/(app)/businesses/page.tsx
// Business list page

import { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Plus, Search } from 'lucide-react';
import { BusinessCard } from '@/components/business/business-card';

export const metadata: Metadata = {
  title: 'Businesses | Profit Architecture',
  description: 'Manage your businesses',
};

interface Business {
  id: string;
  name: string;
  alias?: string;
  organization_type: string;
  industry?: string;
  status: string;
  created_at: string;
  tpa_business_assignments?: {
    id: string;
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

async function getBusinesses(): Promise<Business[]> {
  const supabase = createClient();
  
  const { data: businesses, error } = await supabase
    .from('tpa_businesses')
    .select(`
      *,
      tpa_business_assignments(
        id,
        role,
        user:tpa_profiles(display_name, email)
      ),
      tpa_business_classifications(
        primary_pathway,
        confidence
      )
    `)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching businesses:', error);
    return [];
  }

  return businesses || [];
}

export default async function BusinessesPage() {
  const businesses = await getBusinesses();

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Businesses</h1>
          <p className="text-muted-foreground mt-1">
            Manage your client businesses and their Profit Architecture profiles
          </p>
        </div>
        <Link href="/businesses/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Business
          </Button>
        </Link>
      </div>

      {/* Search and filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search businesses..."
            className="w-full pl-10 pr-4 py-2 rounded-md border border-input bg-background text-sm"
          />
        </div>
      </div>

      {/* Business grid */}
      {businesses.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-muted rounded-lg">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <Plus className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">No businesses yet</h3>
          <p className="text-muted-foreground mb-4">
            Get started by adding your first business
          </p>
          <Link href="/businesses/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Business
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {businesses.map((business) => (
            <BusinessCard key={business.id} business={business} />
          ))}
        </div>
      )}
    </div>
  );
}
