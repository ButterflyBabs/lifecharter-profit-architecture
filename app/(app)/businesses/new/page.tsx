// app/(app)/businesses/new/page.tsx
// Create business page

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BusinessForm } from '@/components/business/business-form';
import { ArrowLeft } from 'lucide-react';

export default function NewBusinessPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: {
    name: string;
    alias?: string;
    organization_type: string;
    industry_category?: string;
    industry_subcategory?: string;
    industry_other?: string;
    location_city?: string;
    location_state?: string;
    years_operating?: number;
    goals: { id: string; text: string; priority?: string }[];
    concerns: { id: string; text: string; severity?: string }[];
  }) => {
    setIsSubmitting(true);

    try {
      // Get tenant_id from user's active tenant (simplified - in real app, this would come from context)
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
      router.push(`/businesses/${result.business.id}`);
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
