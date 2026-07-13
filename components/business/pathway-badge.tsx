// components/business/pathway-badge.tsx
// Pathway badge component with LifeCharter Brand Colors

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
    color: 'bg-[#2E7C83]/10 text-[#2E7C83] border-[#2E7C83]/30',
    icon: Heart,
  },
  coaching_consulting: {
    label: 'Coaching & Consulting',
    color: 'bg-[#5E3B6C]/10 text-[#5E3B6C] border-[#5E3B6C]/30',
    icon: Users,
  },
  subscription_membership: {
    label: 'Subscription & Membership',
    color: 'bg-[#CDBFD6]/30 text-[#5E3B6C] border-[#CDBFD6]/50',
    icon: Repeat,
  },
  ecommerce: {
    label: 'E-commerce',
    color: 'bg-[#D4AF63]/15 text-[#1F315B] border-[#D4AF63]/30',
    icon: ShoppingCart,
  },
  service: {
    label: 'Service Business',
    color: 'bg-[#1F315B]/10 text-[#1F315B] border-[#1F315B]/20',
    icon: Briefcase,
  },
  hybrid: {
    label: 'Hybrid',
    color: 'bg-[#B9A9A9]/20 text-[#1F315B] border-[#B9A9A9]/40',
    icon: Layers,
  },
};

const sizeConfig = {
  sm: {
    container: 'px-2.5 py-1 text-xs',
    icon: 'h-3 w-3 mr-1.5',
  },
  md: {
    container: 'px-3 py-1 text-sm',
    icon: 'h-3.5 w-3.5 mr-1.5',
  },
  lg: {
    container: 'px-4 py-1.5 text-base',
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
    color: 'bg-[#F6F1E8] text-[#1F315B] border-[#D4AF63]/20',
    icon: Briefcase,
  };

  const Icon = config.icon;
  const sizes = sizeConfig[size];

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium border rounded-full font-body',
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
    color: 'bg-[#F6F1E8] text-[#1F315B] border-[#D4AF63]/20',
    icon: Briefcase,
  };
}