'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Indicator } from '@/lib/methodology';

interface IndicatorTableProps {
  indicators: Indicator[];
  showPathwayFilters?: boolean;
}

export function IndicatorTable({ 
  indicators,
  showPathwayFilters = false 
}: IndicatorTableProps) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px]">Indicator</TableHead>
            <TableHead>Score 0 (Critical)</TableHead>
            <TableHead>Score 3 (Good)</TableHead>
            <TableHead>Score 5 (Excellent)</TableHead>
            {showPathwayFilters && <TableHead>Applies To</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {indicators.map((indicator) => (
            <TableRow key={indicator.id}>
              <TableCell>
                <div className="font-medium">{indicator.name}</div>
                <div className="text-sm text-muted-foreground">
                  {indicator.description}
                </div>
                <code className="text-xs bg-muted px-1 py-0.5 rounded mt-1 inline-block">
                  {indicator.code}
                </code>
              </TableCell>
              <TableCell className="text-sm text-red-600">
                {indicator.guidance_score_0}
              </TableCell>
              <TableCell className="text-sm text-blue-600">
                {indicator.guidance_score_3}
              </TableCell>
              <TableCell className="text-sm text-green-600">
                {indicator.guidance_score_5}
              </TableCell>
              {showPathwayFilters && (
                <TableCell>
                  {indicator.applies_to_pathways.length === 0 ? (
                    <Badge variant="outline">All Pathways</Badge>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {indicator.applies_to_pathways.map((pathway) => (
                        <Badge key={pathway} variant="secondary" className="text-xs">
                          {pathway.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                    </div>
                  )}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
