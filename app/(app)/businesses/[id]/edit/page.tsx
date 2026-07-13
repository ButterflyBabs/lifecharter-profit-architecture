// app/(app)/businesses/[id]/edit/page.tsx
// Edit business page

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BusinessForm } from '@/components/business/business-form';
import { ArrowLeft, Loader2 } from 'lucide-react';

interface PageProps {
  params: {
    id: string;
  };
}

export default function EditBusinessPage({ params }: PageProps) {
  const router = useRouter();
  const [business, setBusiness] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBusiness() {
      try {
        const response = await fetch(`/api/businesses/${params.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch business');
        }
        const data = await response.json();
        setBusiness(data.business);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load business');
      } finally {
        setIsLoading(false);
      }
    }

    fetchBusiness();
  }, [params.id]);

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
      const response = await fetch(`/api/businesses/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update business');
      }

      router.push(`/businesses/${params.id}`);
      router.refresh();
    } catch (error) {
      console.error('Error updating business:', error);
      alert(error instanceof Error ? error.message : 'Failed to update business');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center py-16">
          <p className="text-destructive mb-4">{error || 'Business not found'}</p>
          <Link href="/businesses">
            <Button>Back to Businesses</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <div className="mb-6">
        <Link
          href={`/businesses/${params.id}`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to {business.name}
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Edit Business</h1>
        <p className="text-muted-foreground mt-1">
          Update the business profile for {business.name}
        </p>
      </div>

      <div className="bg-card border rounded-lg p-6">
        <BusinessForm
          initialData={{
            name: business.name,
            alias: business.alias,
            organization_type: business.organization_type,
            industry_category: business.industry?.includes(':')
              ? business.industry.split(':')[0]
              : business.industry,
            industry_subcategory: business.industry?.includes(':')
              ? business.industry.split(':')[1]
              : undefined,
            industry_other: business.industry_other,
            location_city: business.location_city,
            location_state: business.location_state,
            years_operating: business.years_operating,
            goals: business.goals || [],
            concerns: business.concerns || [],
          }}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}
