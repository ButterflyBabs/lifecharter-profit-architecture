// lib/classification/tpa-logic.ts
// TPA Pathway Classification Logic - 6 Pathway Methodology

import {
  type TPAPathway,
  type BusinessStage,
  type RevenueRange,
  type TeamSize,
  type PrimaryChallenge,
  type GrowthIntent,
  type TPAClassificationInput,
  type TPAClassificationResult,
  type PathwayInfo,
  type WizardStep,
  type SelectOption,
} from './tpa-types';

// Re-export types for convenience
export type { TPAPathway };

// Pathway information for display
export const pathwayInfo: Record<TPAPathway, PathwayInfo> = {
  foundation: {
    id: 'foundation',
    number: 1,
    name: 'Foundation',
    tagline: 'Building from scratch',
    description: 'You are laying the groundwork for your business. Focus is on validating ideas, finding initial customers, and establishing core operations.',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    icon: 'Foundation',
    typicalProfile: 'Pre-revenue, early stage, solo or small team',
    focusAreas: ['Market validation', 'First customers', 'Minimum viable product', 'Basic systems'],
  },
  traction: {
    id: 'traction',
    number: 2,
    name: 'Traction',
    tagline: 'Finding product-market fit',
    description: 'You have some momentum and are refining your offering to achieve consistent, repeatable results.',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    icon: 'TrendingUp',
    typicalProfile: 'Some revenue, seeking consistency, small team',
    focusAreas: ['Product-market fit', 'Customer retention', 'Sales consistency', 'Process refinement'],
  },
  optimization: {
    id: 'optimization',
    number: 3,
    name: 'Optimization',
    tagline: 'Improving what works',
    description: 'Your business is established. Now it is about improving margins, efficiency, and profitability.',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    icon: 'Settings2',
    typicalProfile: 'Established revenue, want better margins, growing team',
    focusAreas: ['Profit margins', 'Operational efficiency', 'Team productivity', 'Cost optimization'],
  },
  scale: {
    id: 'scale',
    number: 4,
    name: 'Scale',
    tagline: 'Growing significantly',
    description: 'You have a proven model and are ready to expand rapidly with systems that support growth.',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    icon: 'Rocket',
    typicalProfile: 'Proven model, ready to expand, larger team',
    focusAreas: ['Rapid expansion', 'Team scaling', 'Market expansion', 'Systematization'],
  },
  transformation: {
    id: 'transformation',
    number: 5,
    name: 'Transformation',
    tagline: 'Major change/pivot',
    description: 'You are navigating significant change - pivoting your model, entering new markets, or reinventing your business.',
    color: 'text-rose-700',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-200',
    icon: 'RefreshCw',
    typicalProfile: 'Turnaround, new direction, strategic shift',
    focusAreas: ['Strategic pivot', 'Change management', 'New market entry', 'Model reinvention'],
  },
  legacy: {
    id: 'legacy',
    number: 6,
    name: 'Legacy',
    tagline: 'Exit or passive transition',
    description: 'You are preparing for transition - whether that means selling, stepping back, or creating passive income streams.',
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    icon: 'Crown',
    typicalProfile: 'Established, preparing transition, exit planning',
    focusAreas: ['Exit preparation', 'Succession planning', 'Passive income', 'Wealth preservation'],
  },
};

// Wizard steps configuration
export const wizardSteps: WizardStep[] = [
  {
    id: 'stage',
    number: 1,
    title: 'Business Stage',
    question: 'Where is your business right now?',
    description: 'Select the stage that best describes your current situation',
  },
  {
    id: 'revenue',
    number: 2,
    title: 'Revenue Range',
    question: 'What is your current annual revenue?',
    description: 'This helps us understand your business scale',
  },
  {
    id: 'team',
    number: 3,
    title: 'Team Size',
    question: 'How many people are on your team?',
    description: 'Include full-time, part-time, and key contractors',
  },
  {
    id: 'challenge',
    number: 4,
    title: 'Primary Challenge',
    question: 'What is your biggest challenge right now?',
    description: 'Select the area that needs the most attention',
  },
  {
    id: 'intent',
    number: 5,
    title: 'Growth Intent',
    question: 'What best describes your growth intent?',
    description: 'Where do you want to take your business?',
  },
];

// Step 1: Business Stage options
export const stageOptions: SelectOption<BusinessStage>[] = [
  {
    value: 'idea_stage',
    label: 'Idea Stage',
    description: 'Concept only, no revenue yet',
    icon: 'Lightbulb',
  },
  {
    value: 'pre_revenue',
    label: 'Pre-Revenue',
    description: 'Building product/service, no sales yet',
    icon: 'Hammer',
  },
  {
    value: 'early_stage',
    label: 'Early Stage',
    description: 'Some revenue, finding product-market fit',
    icon: 'Sprout',
  },
  {
    value: 'growth_stage',
    label: 'Growth Stage',
    description: 'Consistent revenue, actively scaling',
    icon: 'TrendingUp',
  },
  {
    value: 'established',
    label: 'Established',
    description: 'Mature, stable operations',
    icon: 'Building2',
  },
  {
    value: 'pivot_turnaround',
    label: 'Pivot / Turnaround',
    description: 'Existing business changing direction',
    icon: 'RefreshCw',
  },
];

// Step 2: Revenue Range options
export const revenueOptions: SelectOption<RevenueRange>[] = [
  { value: 'zero', label: '$0', description: 'Pre-revenue', icon: 'CircleDollarSign' },
  { value: '1_to_50k', label: '$1 - $50K', description: 'Getting started', icon: 'Coins' },
  { value: '50k_to_100k', label: '$50K - $100K', description: 'Early traction', icon: 'Banknote' },
  { value: '100k_to_250k', label: '$100K - $250K', description: 'Building momentum', icon: 'Wallet' },
  { value: '250k_to_500k', label: '$250K - $500K', description: 'Growing steadily', icon: 'CreditCard' },
  { value: '500k_to_1m', label: '$500K - $1M', description: 'Approaching 7 figures', icon: 'Landmark' },
  { value: '1m_to_5m', label: '$1M - $5M', description: '7-figure business', icon: 'Gem' },
  { value: '5m_plus', label: '$5M+', description: 'Established enterprise', icon: 'Crown' },
];

// Step 3: Team Size options
export const teamOptions: SelectOption<TeamSize>[] = [
  { value: 'solo', label: 'Just me', description: 'Solo founder/operator', icon: 'User' },
  { value: 'two_to_five', label: '2-5 people', description: 'Small core team', icon: 'Users' },
  { value: 'six_to_ten', label: '6-10 people', description: 'Growing team', icon: 'UsersRound' },
  { value: 'eleven_to_25', label: '11-25 people', description: 'Small organization', icon: 'Building' },
  { value: 'twenty_six_to_50', label: '26-50 people', description: 'Mid-size company', icon: 'Building2' },
  { value: 'fifty_plus', label: '50+ people', description: 'Large organization', icon: 'Castle' },
];

// Step 4: Primary Challenge options
export const challengeOptions: SelectOption<PrimaryChallenge>[] = [
  { value: 'finding_customers', label: 'Finding Customers', description: 'Getting sales and acquiring customers', icon: 'Search' },
  { value: 'pricing_profitability', label: 'Pricing & Profitability', description: 'Setting right prices and improving margins', icon: 'Tag' },
  { value: 'time_overwhelm', label: 'Time & Overwhelm', description: 'Managing time and reducing overwhelm', icon: 'Clock' },
  { value: 'systems_processes', label: 'Systems & Processes', description: 'Building repeatable systems and SOPs', icon: 'Settings' },
  { value: 'team_leadership', label: 'Team & Leadership', description: 'Hiring, managing, and leading team', icon: 'Users' },
  { value: 'cash_flow', label: 'Cash Flow', description: 'Managing finances and cash flow', icon: 'Banknote' },
  { value: 'marketing', label: 'Marketing', description: 'Marketing that actually works', icon: 'Megaphone' },
  { value: 'scaling_strategy', label: 'Scaling Strategy', description: 'Growing without breaking', icon: 'TrendingUp' },
  { value: 'product_development', label: 'Product Development', description: 'Creating and improving offerings', icon: 'Package' },
  { value: 'work_life_balance', label: 'Work-Life Balance', description: 'Creating sustainable boundaries', icon: 'Heart' },
];

// Step 5: Growth Intent options
export const intentOptions: SelectOption<GrowthIntent>[] = [
  { value: 'lifestyle', label: 'Lifestyle Business', description: 'Maintain current size, optimize for freedom', icon: 'Coffee' },
  { value: 'steady_growth', label: 'Steady Growth', description: 'Gradual, sustainable expansion', icon: 'TrendingUp' },
  { value: 'aggressive_growth', label: 'Aggressive Growth', description: 'Scale fast and capture market', icon: 'Rocket' },
  { value: 'prepare_exit', label: 'Prepare for Exit', description: 'Build to sell or transition', icon: 'Handshake' },
  { value: 'passive_income', label: 'Passive Income', description: 'Reduce involvement, automate income', icon: 'Bed' },
  { value: 'pivot_model', label: 'Pivot Model', description: 'Shift to new model or market', icon: 'RefreshCw' },
];

// Scoring matrix for pathway determination
// Each factor contributes points to pathways
interface PathwayScores {
  foundation: number;
  traction: number;
  optimization: number;
  scale: number;
  transformation: number;
  legacy: number;
}

function createEmptyScores(): PathwayScores {
  return {
    foundation: 0,
    traction: 0,
    optimization: 0,
    scale: 0,
    transformation: 0,
    legacy: 0,
  };
}

// Stage scoring
function scoreStage(scores: PathwayScores, stage: BusinessStage): string[] {
  const reasoning: string[] = [];
  
  switch (stage) {
    case 'idea_stage':
      scores.foundation += 10;
      reasoning.push('Idea stage strongly indicates Foundation pathway');
      break;
    case 'pre_revenue':
      scores.foundation += 8;
      scores.traction += 2;
      reasoning.push('Pre-revenue stage points to Foundation pathway');
      break;
    case 'early_stage':
      scores.traction += 8;
      scores.foundation += 2;
      reasoning.push('Early stage with some revenue indicates Traction pathway');
      break;
    case 'growth_stage':
      scores.scale += 6;
      scores.optimization += 4;
      reasoning.push('Growth stage suggests Scale or Optimization pathway');
      break;
    case 'established':
      scores.optimization += 5;
      scores.scale += 3;
      scores.legacy += 2;
      reasoning.push('Established business fits Optimization, Scale, or Legacy');
      break;
    case 'pivot_turnaround':
      scores.transformation += 10;
      reasoning.push('Pivot/turnaround situation strongly indicates Transformation pathway');
      break;
  }
  
  return reasoning;
}

// Revenue scoring
function scoreRevenue(scores: PathwayScores, revenue: RevenueRange): string[] {
  const reasoning: string[] = [];
  
  switch (revenue) {
    case 'zero':
      scores.foundation += 5;
      reasoning.push('No revenue yet - typical for Foundation');
      break;
    case '1_to_50k':
      scores.foundation += 3;
      scores.traction += 3;
      reasoning.push('Early revenue indicates Foundation or Traction');
      break;
    case '50k_to_100k':
      scores.traction += 5;
      scores.foundation += 1;
      reasoning.push('$50K-$100K range typical for Traction pathway');
      break;
    case '100k_to_250k':
      scores.traction += 3;
      scores.optimization += 3;
      reasoning.push('$100K-$250K suggests moving from Traction to Optimization');
      break;
    case '250k_to_500k':
      scores.optimization += 5;
      scores.scale += 2;
      reasoning.push('$250K-$500K fits Optimization pathway');
      break;
    case '500k_to_1m':
      scores.optimization += 4;
      scores.scale += 4;
      reasoning.push('$500K-$1M can be Optimization or Scale depending on goals');
      break;
    case '1m_to_5m':
      scores.scale += 6;
      scores.optimization += 2;
      scores.legacy += 2;
      reasoning.push('$1M-$5M typically Scale, Optimization, or Legacy');
      break;
    case '5m_plus':
      scores.scale += 4;
      scores.legacy += 4;
      scores.optimization += 2;
      reasoning.push('$5M+ fits Scale, Legacy, or Optimization');
      break;
  }
  
  return reasoning;
}

// Team size scoring
function scoreTeam(scores: PathwayScores, team: TeamSize): string[] {
  const reasoning: string[] = [];
  
  switch (team) {
    case 'solo':
      scores.foundation += 3;
      scores.traction += 2;
      reasoning.push('Solo operation typical for Foundation or early Traction');
      break;
    case 'two_to_five':
      scores.traction += 3;
      scores.foundation += 1;
      scores.optimization += 1;
      reasoning.push('Small team of 2-5 suggests Traction or early Optimization');
      break;
    case 'six_to_ten':
      scores.optimization += 3;
      scores.traction += 2;
      scores.scale += 1;
      reasoning.push('Team of 6-10 indicates Optimization or Traction');
      break;
    case 'eleven_to_25':
      scores.optimization += 3;
      scores.scale += 3;
      reasoning.push('Team of 11-25 fits Optimization or Scale');
      break;
    case 'twenty_six_to_50':
      scores.scale += 5;
      scores.optimization += 2;
      scores.transformation += 1;
      reasoning.push('Team of 26-50 suggests Scale or Optimization');
      break;
    case 'fifty_plus':
      scores.scale += 4;
      scores.legacy += 3;
      scores.transformation += 2;
      reasoning.push('50+ person organization fits Scale, Legacy, or Transformation');
      break;
  }
  
  return reasoning;
}

// Challenge scoring
function scoreChallenge(scores: PathwayScores, challenge: PrimaryChallenge): string[] {
  const reasoning: string[] = [];
  
  switch (challenge) {
    case 'finding_customers':
      scores.foundation += 4;
      scores.traction += 3;
      reasoning.push('Customer acquisition challenges typical for Foundation/Traction');
      break;
    case 'pricing_profitability':
      scores.traction += 2;
      scores.optimization += 4;
      reasoning.push('Pricing/profitability focus indicates Optimization pathway');
      break;
    case 'time_overwhelm':
      scores.traction += 2;
      scores.optimization += 3;
      reasoning.push('Time/overwhelm issues suggest Optimization needs');
      break;
    case 'systems_processes':
      scores.optimization += 4;
      scores.scale += 2;
      reasoning.push('Systems focus indicates Optimization or preparing for Scale');
      break;
    case 'team_leadership':
      scores.scale += 3;
      scores.optimization += 2;
      scores.transformation += 1;
      reasoning.push('Team/leadership challenges typical for Scale or Optimization');
      break;
    case 'cash_flow':
      scores.foundation += 2;
      scores.traction += 2;
      scores.optimization += 2;
      reasoning.push('Cash flow issues can occur at any stage');
      break;
    case 'marketing':
      scores.foundation += 3;
      scores.traction += 3;
      reasoning.push('Marketing challenges common in Foundation and Traction');
      break;
    case 'scaling_strategy':
      scores.scale += 5;
      scores.optimization += 1;
      reasoning.push('Scaling strategy focus indicates Scale pathway');
      break;
    case 'product_development':
      scores.foundation += 3;
      scores.traction += 2;
      scores.transformation += 2;
      reasoning.push('Product development focus in Foundation, Traction, or Transformation');
      break;
    case 'work_life_balance':
      scores.optimization += 2;
      scores.legacy += 2;
      reasoning.push('Work-life balance focus suggests Optimization or Legacy planning');
      break;
  }
  
  return reasoning;
}

// Growth intent scoring
function scoreIntent(scores: PathwayScores, intent: GrowthIntent): string[] {
  const reasoning: string[] = [];
  
  switch (intent) {
    case 'lifestyle':
      scores.optimization += 5;
      reasoning.push('Lifestyle focus strongly indicates Optimization pathway');
      break;
    case 'steady_growth':
      scores.traction += 1;
      scores.optimization += 3;
      scores.scale += 2;
      reasoning.push('Steady growth fits across Traction, Optimization, and Scale');
      break;
    case 'aggressive_growth':
      scores.scale += 6;
      scores.traction += 1;
      reasoning.push('Aggressive growth strongly indicates Scale pathway');
      break;
    case 'prepare_exit':
      scores.legacy += 6;
      scores.optimization += 2;
      reasoning.push('Exit preparation indicates Legacy pathway');
      break;
    case 'passive_income':
      scores.legacy += 5;
      scores.optimization += 2;
      reasoning.push('Passive income goal indicates Legacy pathway');
      break;
    case 'pivot_model':
      scores.transformation += 6;
      scores.foundation += 1;
      reasoning.push('Pivot intent strongly indicates Transformation pathway');
      break;
  }
  
  return reasoning;
}

// Main classification function
export function classifyTPA(input: TPAClassificationInput): TPAClassificationResult {
  const scores = createEmptyScores();
  const allReasoning: string[] = [];
  
  // Score each factor
  allReasoning.push(...scoreStage(scores, input.stage));
  allReasoning.push(...scoreRevenue(scores, input.revenueRange));
  allReasoning.push(...scoreTeam(scores, input.teamSize));
  allReasoning.push(...scoreChallenge(scores, input.primaryChallenge));
  allReasoning.push(...scoreIntent(scores, input.growthIntent));
  
  // Find highest scoring pathway
  const entries = Object.entries(scores) as [TPAPathway, number][];
  entries.sort(([, a], [, b]) => b - a);
  
  const [topPathway, topScore] = entries[0];
  const secondScore = entries[1]?.[1] || 0;
  
  // Calculate confidence based on score differential
  const totalScore = entries.reduce((sum, [, score]) => sum + score, 0);
  const confidence = totalScore > 0 ? topScore / totalScore : 0;
  
  // Refine reasoning to most relevant
  const reasoning = allReasoning.slice(0, 4);
  
  return {
    pathway: topPathway,
    pathwayNumber: pathwayInfo[topPathway].number,
    confidence: Math.min(1, Math.max(0.3, confidence + 0.3)), // Minimum 30% confidence
    reasoning,
  };
}

// Get pathway by number
export function getPathwayByNumber(number: number): TPAPathway | null {
  const entry = Object.entries(pathwayInfo).find(([, info]) => info.number === number);
  return entry ? (entry[0] as TPAPathway) : null;
}

// Validate classification input
export function validateTPAInput(input: Partial<TPAClassificationInput>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!input.stage) errors.push('Business stage is required');
  if (!input.revenueRange) errors.push('Revenue range is required');
  if (!input.teamSize) errors.push('Team size is required');
  if (!input.primaryChallenge) errors.push('Primary challenge is required');
  if (!input.growthIntent) errors.push('Growth intent is required');
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
