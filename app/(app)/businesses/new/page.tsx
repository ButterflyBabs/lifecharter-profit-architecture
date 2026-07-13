// app/(app)/businesses/new/page.tsx
// Create business page

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BusinessForm } from '@/components/business/business-form';
import { ArrowLeft } from 'lucide-react';
import { getDemoMode } from '@/lib/auth';

export default function NewBusinessPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: {
    name: string;
    alias?: string;
    organization_type: string;
    organization_type_category?: 'for_profit' | 'non_profit' | 'other';
    organization_type_other?: string;
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
    goals: { id: string; text: string; priority?: string; type?: string }[];
    concerns: { id: string; text: string; severity?: string; type?: string }[];
  }) => {
    setIsSubmitting(true);

    try {
      // Check if we're in demo mode
      const isDemo = getDemoMode();
      
      if (isDemo) {
        // Demo mode: store business in localStorage
        const demoBusiness = {
          id: 'demo-business-' + Date.now(),
          name: data.name,
          alias: data.alias,
          organization_type: data.organization_type,
          organization_type_category: data.organization_type_category,
          organization_type_other: data.organization_type_other,
          industry_category: data.industry_category,
          industry_subcategory: data.industry_subcategory,
          industry_other: data.industry_other,
          street_address_line_1: data.street_address_line_1,
          street_address_line_2: data.street_address_line_2,
          address_city: data.address_city,
          address_state: data.address_state,
          address_zip_code: data.address_zip_code,
          years_operating: data.years_operating,
          goals: data.goals,
          concerns: data.concerns,
          created_at: new Date().toISOString(),
        };
        
        // Store in localStorage for demo mode
        localStorage.setItem('tpa_demo_business', JSON.stringify(demoBusiness));
        
        // Redirect to classification wizard
        router.push(`/businesses/${demoBusiness.id}/classification`);
        return;
      }

      // Regular mode: call the API
      const response = await fetch('/api/businesses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          tenant_id: '00000000-0000-0000-0000-000000000000', // Placeholder - should come from context
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create business');
      }

      const result = await response.json();
      // Redirect to classification wizard after creating business
      router.push(`/businesses/${result.business.id}/classification`);
    } catch (error) {
      console.error('Error creating business:', error);
      alert(error instanceof Error ? error.message : 'Failed to create business');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <div className="mb-6">
        <Link
          href="/businesses"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Businesses
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Add New Business</h1>
        <p className="text-muted-foreground mt-1">
          Create a new business profile to begin Profit Architecture
        </p>
      </div>

      <div className="bg-card border rounded-lg p-6">
        <BusinessForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </div>
    </div>
  );
}
