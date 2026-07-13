// lib/classification/tpa-types.ts
// TPA Pathway Classification types - 6 Pathway Methodology

// The 6 TPA Pathways
export type TPAPathway =
  | 'foundation'      // Pathway 1: Building from scratch
  | 'traction'        // Pathway 2: Finding product-market fit
  | 'optimization'    // Pathway 3: Improving what works
  | 'scale'           // Pathway 4: Growing significantly
  | 'transformation'  // Pathway 5: Major change/pivot
  | 'legacy';         // Pathway 6: Exit or passive transition

// Business Stage options
export type BusinessStage =
  | 'idea_stage'           // Concept only, no revenue
  | 'pre_revenue'          // Building, no sales yet
  | 'early_stage'          // Some revenue, finding product-market fit
  | 'growth_stage'         // Consistent revenue, scaling
  | 'established'          // Mature, stable operations
  | 'pivot_turnaround';    // Existing business changing direction

// Revenue Range options
export type RevenueRange =
  | 'zero'                 // $0 (Pre-revenue)
  | '1_to_50k'             // $1 - $50K
  | '50k_to_100k'          // $50K - $100K
  | '100k_to_250k'         // $100K - $250K
  | '250k_to_500k'         // $250K - $500K
  | '500k_to_1m'           // $500K - $1M
  | '1m_to_5m'             // $1M - $5M
  | '5m_plus';             // $5M+

// Team Size options
export type TeamSize =
  | 'solo'                 // Just me
  | 'two_to_five'          // 2-5 people
  | 'six_to_ten'           // 6-10 people
  | 'eleven_to_25'         // 11-25 people
  | 'twenty_six_to_50'     // 26-50 people
  | 'fifty_plus';          // 50+ people

// Primary Challenge options
export type PrimaryChallenge =
  | 'finding_customers'    // Finding customers/getting sales
  | 'pricing_profitability'// Pricing and profitability
  | 'time_overwhelm'       // Time management/overwhelm
  | 'systems_processes'    // Building systems and processes
  | 'team_leadership'      // Team/leadership
  | 'cash_flow'            // Cash flow/financial management
  | 'marketing'            // Marketing that works
  | 'scaling_strategy'     // Scaling/growth strategy
  | 'product_development'  // Product/service development
  | 'work_life_balance';   // Work-life balance

// Growth Intent options
export type GrowthIntent =
  | 'lifestyle'            // Lifestyle business (maintain current size)
  | 'steady_growth'        // Steady growth (gradual, sustainable)
  | 'aggressive_growth'    // Aggressive growth (scale fast)
  | 'prepare_exit'         // Prepare for exit/sale
  | 'passive_income'       // Transition to passive income
  | 'pivot_model';         // Pivot to new model/market

// Classification input from wizard
export interface TPAClassificationInput {
  stage: BusinessStage;
  revenueRange: RevenueRange;
  teamSize: TeamSize;
  primaryChallenge: PrimaryChallenge;
  growthIntent: GrowthIntent;
}

// Classification result
export interface TPAClassificationResult {
  pathway: TPAPathway;
  pathwayNumber: number;
  confidence: number;  // 0-1
  reasoning: string[];
}

// Database record type
export interface TPABusinessClassification {
  id: string;
  business_id: string;
  tenant_id: string;
  stage: BusinessStage;
  revenue_range: RevenueRange;
  team_size: TeamSize;
  primary_challenge: PrimaryChallenge;
  growth_intent: GrowthIntent;
  pathway: TPAPathway;
  pathway_number: number;
  confidence: number;
  classified_at: string;
  classified_by?: string;
  updated_at: string;
}

// Pathway display information
export interface PathwayInfo {
  id: TPAPathway;
  number: number;
  name: string;
  tagline: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
  typicalProfile: string;
  focusAreas: string[];
}

// Step configuration for wizard
export interface WizardStep {
  id: string;
  number: number;
  title: string;
  question: string;
  description?: string;
}

// Option for select cards
export interface SelectOption<T> {
  value: T;
  label: string;
  description: string;
  icon?: string;
}
