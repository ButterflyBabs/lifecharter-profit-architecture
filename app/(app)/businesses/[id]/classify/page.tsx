// app/(app)/businesses/[id]/classify/page.tsx
// Classification wizard page

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ClassificationWizard } from '@/components/business/classification-wizard';
import { ArrowLeft, Loader2 } from 'lucide-react';

interface PageProps {
  params: {
    id: string;
  };
}

export default function ClassifyBusinessPage({ params }: PageProps) {
  const router = useRouter();
  const [business, setBusiness] = useState<{ name: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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

  const handleComplete = () => {
    router.push(`/businesses/${params.id}`);
    router.refresh();
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
    <div className="container mx-auto py-8 px-4 max-w-4xl">
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
        <h1 className="text-3xl font-bold tracking-tight">Classify Business</h1>
        <p className="text-muted-foreground mt-1">
          Answer a few questions to determine the best Profit Architecture pathway for {business.name}
        </p>
      </div>

      <div className="bg-card border rounded-lg p-6">
        <ClassificationWizard 
          businessId={params.id} 
          onComplete={handleComplete}
        />
      </div>
    </div>
  );
}
