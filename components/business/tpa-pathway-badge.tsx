// components/business/tpa-pathway-badge.tsx
// TPA Pathway badge component - 6 Pathway Methodology with LifeCharter Brand Colors

import { cn } from '@/lib/utils';
import { 
  Compass,
  TrendingUp,
  Settings2,
  Rocket,
  RefreshCw,
  Crown,
  type LucideIcon
} from 'lucide-react';
import { pathwayInfo, type TPAPathway } from '@/lib/classification/tpa-logic';

interface TPAPAthwayBadgeProps {
  pathway: TPAPathway | string;
  pathwayNumber?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showIcon?: boolean;
  showNumber?: boolean;
}

const iconMap: Record<string, LucideIcon> = {
  Compass,
  TrendingUp,
  Settings2,
  Rocket,
  RefreshCw,
  Crown,
};

const sizeConfig = {
  sm: {
    container: 'px-2.5 py-1 text-xs',
    icon: 'h-3 w-3 mr-1.5',
    number: 'w-5 h-5 text-xs mr-1.5',
  },
  md: {
    container: 'px-3 py-1 text-sm',
    icon: 'h-3.5 w-3.5 mr-1.5',
    number: 'w-6 h-6 text-sm mr-2',
  },
  lg: {
    container: 'px-4 py-1.5 text-base',
    icon: 'h-4 w-4 mr-2',
    number: 'w-8 h-8 text-base mr-2',
  },
};

const pathwayStyles: Record<TPAPathway, string> = {
  foundation: 'bg-amber-50 text-amber-800 border-amber-200',
  traction: 'bg-blue-50 text-blue-800 border-blue-200',
  optimization: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  scale: 'bg-purple-50 text-purple-800 border-purple-200',
  transformation: 'bg-rose-50 text-rose-800 border-rose-200',
  legacy: 'bg-indigo-50 text-indigo-800 border-indigo-200',
};

export function TPAPathwayBadge({ 
  pathway, 
  pathwayNumber,
  size = 'md', 
  className,
  showIcon = true,
  showNumber = false,
}: TPAPAthwayBadgeProps) {
  const info = pathwayInfo[pathway as TPAPathway];
  const sizes = sizeConfig[size];
  
  const Icon = iconMap[info?.icon || ''] || Compass;
  const number = pathwayNumber || info?.number || 0;
  const style = pathwayStyles[pathway as TPAPathway] || 'bg-[#F6F1E8] text-[#1F315B] border-[#D4AF63]/20';
  const label = info?.name || pathway;

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium border rounded-full font-body',
        style,
        sizes.container,
        className
      )}
    >
      {showNumber && number > 0 && (
        <span className={cn(
          'inline-flex items-center justify-center rounded-full bg-[#1F315B] text-white font-bold flex-shrink-0',
          sizes.number
        )}>
          {number}
        </span>
      )}
      {showIcon && !showNumber && <Icon className={sizes.icon} />}
      {label}
    </span>
  );
}

// Compact badge for cards
export function TPAPathwayBadgeCompact({ 
  pathway, 
  pathwayNumber,
  className,
}: { 
  pathway: TPAPathway | string; 
  pathwayNumber?: number;
  className?: string;
}) {
  const info = pathwayInfo[pathway as TPAPathway];
  const number = pathwayNumber || info?.number || 0;
  const style = pathwayStyles[pathway as TPAPathway] || 'bg-[#F6F1E8] text-[#1F315B]';
  const label = info?.name || pathway;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border',
        style,
        className
      )}
    >
      <span className="w-5 h-5 inline-flex items-center justify-center rounded-full bg-[#1F315B] text-white text-xs font-bold">
        {number}
      </span>
      <span className="truncate">{label}</span>
    </span>
  );
}

// Helper to get pathway display info
export function getTPAPathwayDisplayInfo(pathway: TPAPathway | string) {
  return pathwayInfo[pathway as TPAPathway] || null;
}
