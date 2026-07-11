'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import type { Component, ComponentIndicator } from '@/lib/methodology';

interface ComponentCardProps {
  component: Component & { indicators?: ComponentIndicator[] };
  showIndicators?: boolean;
  score?: number | null;
}

export function ComponentCard({ 
  component, 
  showIndicators = false,
  score 
}: ComponentCardProps) {
  const [isOpen, setIsOpen] = useState(showIndicators);
  
  const getScoreColor = (score: number | null | undefined) => {
    if (score === null || score === undefined) return 'bg-gray-500';
    if (score < 1) return 'bg-red-500';
    if (score < 2) return 'bg-orange-500';
    if (score < 3) return 'bg-yellow-500';
    if (score < 4) return 'bg-blue-500';
    if (score < 5) return 'bg-green-500';
    return 'bg-emerald-500';
  };
  
  const getScoreLabel = (score: number | null | undefined) => {
    if (score === null || score === undefined) return 'Unknown';
    if (score < 1) return 'Critical';
    if (score < 2) return 'Poor';
    if (score < 3) return 'Fair';
    if (score < 4) return 'Good';
    if (score < 5) return 'Strong';
    return 'Excellent';
  };
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-3">
          <CollapsibleTrigger className="flex items-start justify-between w-full text-left">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                  {component.sort_order}
                </span>
                <CardTitle className="text-lg">{component.name}</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {component.description}
              </p>
            </div>
            <div className="flex items-center gap-3 ml-4">
              {score !== undefined && (
                <div className="text-right">
                  <div className={`inline-flex items-center px-2 py-1 rounded text-white text-sm font-medium ${getScoreColor(score)}`}>
                    {score !== null ? score.toFixed(1) : '-'}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {getScoreLabel(score)}
                  </div>
                </div>
              )}
              <Badge variant="secondary">{component.default_weight}%</Badge>
              {component.indicators && component.indicators.length > 0 && (
                <div className="text-muted-foreground">
                  {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </div>
              )}
            </div>
          </CollapsibleTrigger>
        </CardHeader>
        
        {component.indicators && component.indicators.length > 0 && (
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-3">Indicators</h4>
                <div className="space-y-3">
                  {component.indicators.map((ci) => (
                    <div key={ci.id} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-sm font-medium">
                          {ci.indicator?.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Weight: {ci.weight}x
                        </div>
                      </div>
                      {ci.indicator && (
                        <div className="text-xs text-muted-foreground max-w-xs truncate">
                          0: {ci.indicator.guidance_score_0.substring(0, 30)}...
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        )}
      </Collapsible>
    </Card>
  );
}
