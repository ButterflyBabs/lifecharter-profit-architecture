// lib/business/classification.ts
// Business classification logic for Profit Architecture

export type OrganizationType = 'for_profit' | 'nonprofit' | 'social_enterprise' | 'cooperative';

export type BusinessModel = 
  | 'product_sales'
  | 'service_delivery'
  | 'subscription'
  | 'membership'
  | 'licensing'
  | 'advertising'
  | 'transaction_fees'
  | 'freemium'
  | 'marketplace'
  | 'franchise'
  | 'donation_based'
  | 'grant_funded'
  | 'hybrid';

export type CustomerType = 'b2b' | 'b2c' | 'b2b2c' | 'b2g' | 'hybrid';

export type BusinessStage = 
  | 'concept_prelaunch'
  | 'startup_validation'
  | 'early_traction'
  | 'established'
  | 'turnaround'
  | 'growth'
  | 'scale'
  | 'exit_transition';

export type Pathway = 
  | 'nonprofit'
  | 'coaching_consulting'
  | 'subscription_membership'
  | 'ecommerce'
  | 'service'
  | 'hybrid';

export interface EvidenceItem {
  factor: string;
  weight: number;
  description: string;
}

export interface BusinessClassification {
  organizationType: OrganizationType;
  businessModels: BusinessModel[];
  customerTypes: CustomerType[];
  stages: BusinessStage[];
  primaryPathway: Pathway;
  secondaryPathways: Pathway[];
  confidence: number;
  evidence: EvidenceItem[];
}

export interface ClassificationInput {
  organizationType: OrganizationType;
  businessModels: BusinessModel[];
  customerTypes: CustomerType[];
  stages: BusinessStage[];
  hasInventory?: boolean;
  hasRecurringRevenue?: boolean;
  isCapacityConstrained?: boolean;
  hasDonors?: boolean;
  hasGrants?: boolean;
  hasBoard?: boolean;
}

// Business model to pathway mapping
const businessModelPathwayMap: Record<BusinessModel, Pathway[]> = {
  product_sales: ['ecommerce', 'hybrid'],
  service_delivery: ['service', 'coaching_consulting', 'hybrid'],
  subscription: ['subscription_membership', 'hybrid'],
  membership: ['subscription_membership', 'hybrid'],
  licensing: ['service', 'hybrid'],
  advertising: ['service', 'hybrid'],
  transaction_fees: ['service', 'hybrid'],
  freemium: ['subscription_membership', 'hybrid'],
  marketplace: ['ecommerce', 'hybrid'],
  franchise: ['service', 'hybrid'],
  donation_based: ['nonprofit'],
  grant_funded: ['nonprofit'],
  hybrid: ['hybrid'],
};

// Customer type pathway preferences
const customerTypePathwayWeights: Record<CustomerType, Partial<Record<Pathway, number>>> = {
  b2b: { service: 1.5, coaching_consulting: 1.3, subscription_membership: 1.2 },
  b2c: { ecommerce: 1.5, subscription_membership: 1.3 },
  b2b2c: { hybrid: 1.5, service: 1.2 },
  b2g: { service: 1.5, nonprofit: 1.3 },
  hybrid: { hybrid: 2.0 },
};

// Stage pathway preferences
const stagePathwayWeights: Record<BusinessStage, Partial<Record<Pathway, number>>> = {
  concept_prelaunch: { coaching_consulting: 1.3, service: 1.2 },
  startup_validation: { coaching_consulting: 1.3, service: 1.2 },
  early_traction: { service: 1.2, subscription_membership: 1.2 },
  established: { subscription_membership: 1.3, ecommerce: 1.2 },
  turnaround: { service: 1.3, coaching_consulting: 1.2 },
  growth: { subscription_membership: 1.4, ecommerce: 1.3 },
  scale: { ecommerce: 1.4, subscription_membership: 1.3 },
  exit_transition: { service: 1.2, coaching_consulting: 1.2 },
};

/**
 * Classify a business based on input data
 */
export function classifyBusiness(input: ClassificationInput): BusinessClassification {
  const evidence: EvidenceItem[] = [];
  const pathwayScores: Record<Pathway, number> = {
    nonprofit: 0,
    coaching_consulting: 0,
    subscription_membership: 0,
    ecommerce: 0,
    service: 0,
    hybrid: 0,
  };

  // Score based on organization type
  if (input.organizationType === 'nonprofit') {
    pathwayScores.nonprofit += 5;
    evidence.push({
      factor: 'Organization Type',
      weight: 5,
      description: 'Nonprofit organization type strongly indicates nonprofit pathway',
    });
  } else if (input.organizationType === 'social_enterprise') {
    pathwayScores.hybrid += 2;
    pathwayScores.nonprofit += 1;
    evidence.push({
      factor: 'Organization Type',
      weight: 3,
      description: 'Social enterprise often uses hybrid or nonprofit pathways',
    });
  }

  // Score based on business models
  input.businessModels.forEach((model) => {
    const pathways = businessModelPathwayMap[model];
    pathways.forEach((pathway) => {
      pathwayScores[pathway] += 1;
    });
    evidence.push({
      factor: 'Business Model',
      weight: 1,
      description: `${model} supports ${pathways.join(', ')}`,
    });
  });

  // Score based on customer types
  input.customerTypes.forEach((customerType) => {
    const weights = customerTypePathwayWeights[customerType];
    Object.entries(weights).forEach(([pathway, weight]) => {
      pathwayScores[pathway as Pathway] += weight;
    });
    evidence.push({
      factor: 'Customer Type',
      weight: 1.5,
      description: `${customerType} customer type influences pathway selection`,
    });
  });

  // Score based on stages
  input.stages.forEach((stage) => {
    const weights = stagePathwayWeights[stage];
    Object.entries(weights).forEach(([pathway, weight]) => {
      pathwayScores[pathway as Pathway] += weight;
    });
  });

  // Additional indicators
  if (input.hasInventory) {
    pathwayScores.ecommerce += 2;
    evidence.push({
      factor: 'Inventory',
      weight: 2,
      description: 'Inventory management indicates ecommerce pathway',
    });
  }

  if (input.hasRecurringRevenue) {
    pathwayScores.subscription_membership += 2;
    evidence.push({
      factor: 'Recurring Revenue',
      weight: 2,
      description: 'Recurring revenue model indicates subscription/membership pathway',
    });
  }

  if (input.isCapacityConstrained) {
    pathwayScores.coaching_consulting += 2;
    pathwayScores.service += 1;
    evidence.push({
      factor: 'Capacity Constraints',
      weight: 2,
      description: 'Capacity constraints indicate coaching/consulting or service pathway',
    });
  }

  if (input.hasDonors || input.hasGrants) {
    pathwayScores.nonprofit += 3;
    evidence.push({
      factor: 'Funding Source',
      weight: 3,
      description: 'Donor/grant funding strongly indicates nonprofit pathway',
    });
  }

  // Determine primary pathway (highest score)
  const sortedPathways = Object.entries(pathwayScores)
    .sort(([, a], [, b]) => b - a)
    .filter(([, score]) => score > 0);

  const primaryPathway = sortedPathways[0]?.[0] as Pathway || 'service';
  
  // Secondary pathways (within 50% of primary score)
  const primaryScore = sortedPathways[0]?.[1] || 0;
  const secondaryPathways = sortedPathways
    .slice(1)
    .filter(([, score]) => score >= primaryScore * 0.5)
    .map(([pathway]) => pathway as Pathway);

  // Calculate confidence
  const confidence = calculateConfidence(input, evidence);

  return {
    organizationType: input.organizationType,
    businessModels: input.businessModels,
    customerTypes: input.customerTypes,
    stages: input.stages,
    primaryPathway,
    secondaryPathways,
    confidence,
    evidence,
  };
}

/**
 * Calculate confidence score based on data completeness
 */
export function calculateConfidence(
  input: ClassificationInput,
  evidence: EvidenceItem[]
): number {
  let score = 0;
  let maxScore = 0;

  // Organization type (required, high weight)
  maxScore += 20;
  if (input.organizationType) {
    score += 20;
  }

  // Business models (required, medium weight)
  maxScore += 20;
  if (input.businessModels.length > 0) {
    score += Math.min(20, input.businessModels.length * 5);
  }

  // Customer types (required, medium weight)
  maxScore += 15;
  if (input.customerTypes.length > 0) {
    score += Math.min(15, input.customerTypes.length * 5);
  }

  // Stages (required, medium weight)
  maxScore += 15;
  if (input.stages.length > 0) {
    score += Math.min(15, input.stages.length * 5);
  }

  // Additional indicators (optional, lower weight)
  maxScore += 15;
  const indicators = [
    input.hasInventory,
    input.hasRecurringRevenue,
    input.isCapacityConstrained,
    input.hasDonors,
    input.hasGrants,
    input.hasBoard,
  ];
  const filledIndicators = indicators.filter((i) => i !== undefined).length;
  score += Math.min(15, filledIndicators * 3);

  // Evidence quality bonus
  maxScore += 15;
  if (evidence.length >= 5) {
    score += 15;
  } else if (evidence.length >= 3) {
    score += 10;
  } else if (evidence.length >= 1) {
    score += 5;
  }

  return Math.min(1, Math.max(0, score / maxScore));
}

/**
 * Get pathway-specific validation rules
 */
export function getPathwayRules(pathway: Pathway): {
  requiredFields: string[];
  recommendedMetrics: string[];
  warnings: string[];
} {
  const rules: Record<Pathway, {
    requiredFields: string[];
    recommendedMetrics: string[];
    warnings: string[];
  }> = {
    nonprofit: {
      requiredFields: ['board_members', 'funding_sources', 'restricted_funds'],
      recommendedMetrics: ['donor_retention', 'grant_success_rate', 'program_efficiency'],
      warnings: ['Ensure proper fund segregation', 'Track board meeting minutes'],
    },
    coaching_consulting: {
      requiredFields: ['capacity_hours', 'billable_rate', 'client_capacity'],
      recommendedMetrics: ['utilization_rate', 'revenue_per_hour', 'client_acquisition_cost'],
      warnings: ['Monitor capacity constraints', 'Track non-billable time'],
    },
    subscription_membership: {
      requiredFields: ['mrr', 'churn_rate', 'customer_lifetime_value'],
      recommendedMetrics: ['activation_rate', 'expansion_revenue', 'net_revenue_retention'],
      warnings: ['Watch churn carefully', 'Monitor cohort performance'],
    },
    ecommerce: {
      requiredFields: ['inventory_value', 'fulfillment_cost', 'return_rate'],
      recommendedMetrics: ['conversion_rate', 'average_order_value', 'customer_acquisition_cost'],
      warnings: ['Manage inventory carefully', 'Track shipping costs'],
    },
    service: {
      requiredFields: ['service_capacity', 'project_margins', 'delivery_timeline'],
      recommendedMetrics: ['on_time_delivery', 'client_satisfaction', 'repeat_business_rate'],
      warnings: ['Monitor project scope creep', 'Track resource allocation'],
    },
    hybrid: {
      requiredFields: ['revenue_breakdown', 'cost_allocation'],
      recommendedMetrics: ['segment_profitability', 'cross_segment_synergy', 'resource_sharing'],
      warnings: ['Track each segment separately', 'Watch for complexity overhead'],
    },
  };

  return rules[pathway];
}

/**
 * Get pathway display info
 */
export function getPathwayInfo(pathway: Pathway): {
  label: string;
  description: string;
  color: string;
  icon: string;
} {
  const info: Record<Pathway, {
    label: string;
    description: string;
    color: string;
    icon: string;
  }> = {
    nonprofit: {
      label: 'Nonprofit',
      description: 'Mission-driven with donor/grant funding',
      color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      icon: 'Heart',
    },
    coaching_consulting: {
      label: 'Coaching & Consulting',
      description: 'Capacity-based expertise delivery',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: 'Users',
    },
    subscription_membership: {
      label: 'Subscription & Membership',
      description: 'Recurring revenue with retention focus',
      color: 'bg-purple-100 text-purple-800 border-purple-200',
      icon: 'Repeat',
    },
    ecommerce: {
      label: 'E-commerce',
      description: 'Product sales with inventory management',
      color: 'bg-orange-100 text-orange-800 border-orange-200',
      icon: 'ShoppingCart',
    },
    service: {
      label: 'Service Business',
      description: 'Project-based service delivery',
      color: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      icon: 'Briefcase',
    },
    hybrid: {
      label: 'Hybrid',
      description: 'Multiple revenue models combined',
      color: 'bg-amber-100 text-amber-800 border-amber-200',
      icon: 'Layers',
    },
  };

  return info[pathway];
}
