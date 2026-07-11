// components/business/pathway-badge.tsx
// Pathway badge component with color coding

import { cn } from '@/lib/utils';
import { 
  Heart, 
  Users, 
  Repeat, 
  ShoppingCart, 
  Briefcase, 
  Layers,
  type LucideIcon
} from 'lucide-react';

export type Pathway = 
  | 'nonprofit'
  | 'coaching_consulting'
  | 'subscription_membership'
  | 'ecommerce'
  | 'service'
  | 'hybrid';

interface PathwayBadgeProps {
  pathway: Pathway | string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showIcon?: boolean;
}

const pathwayConfig: Record<Pathway, {
  label: string;
  color: string;
  icon: LucideIcon;
}> = {
  nonprofit: {
    label: 'Nonprofit',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
    icon: Heart,
  },
  coaching_consulting: {
    label: 'Coaching & Consulting',
    color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
    icon: Users,
  },
  subscription_membership: {
    label: 'Subscription & Membership',
    color: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
    icon: Repeat,
  },
  ecommerce: {
    label: 'E-commerce',
    color: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
    icon: ShoppingCart,
  },
  service: {
    label: 'Service Business',
    color: 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800',
    icon: Briefcase,
  },
  hybrid: {
    label: 'Hybrid',
    color: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
    icon: Layers,
  },
};

const sizeConfig = {
  sm: {
    container: 'px-2 py-0.5 text-xs',
    icon: 'h-3 w-3 mr-1',
  },
  md: {
    container: 'px-2.5 py-1 text-sm',
    icon: 'h-3.5 w-3.5 mr-1.5',
  },
  lg: {
    container: 'px-3 py-1.5 text-base',
    icon: 'h-4 w-4 mr-2',
  },
};

export function PathwayBadge({ 
  pathway, 
  size = 'md', 
  className,
  showIcon = true,
}: PathwayBadgeProps) {
  const config = pathwayConfig[pathway as Pathway] || {
    label: pathway,
    color: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
    icon: Briefcase,
  };

  const Icon = config.icon;
  const sizes = sizeConfig[size];

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium border rounded-full',
        config.color,
        sizes.container,
        className
      )}
    >
      {showIcon && <Icon className={sizes.icon} />}
      {config.label}
    </span>
  );
}

// Helper to get pathway info without rendering
export function getPathwayInfo(pathway: Pathway | string) {
  return pathwayConfig[pathway as Pathway] || {
    label: pathway,
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: Briefcase,
  };
}
