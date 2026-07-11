// lib/business/types.ts
// TypeScript types for business entities

// Database entity types
export interface Business {
  id: string;
  tenant_id: string;
  name: string;
  alias?: string;
  organization_type: 'for_profit' | 'nonprofit' | 'social_enterprise' | 'cooperative';
  industry?: string;
  industry_other?: string;
  location_city?: string;
  location_state?: string;
  location_country: string;
  years_operating?: number;
  founded_year?: number;
  status: 'active' | 'inactive' | 'archived';
  goals: BusinessGoal[];
  concerns: BusinessConcern[];
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface BusinessGoal {
  id: string;
  text: string;
  priority?: 'critical' | 'high' | 'medium' | 'low';
  timeframe?: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
}

export interface BusinessConcern {
  id: string;
  text: string;
  severity?: 'critical' | 'high' | 'medium' | 'low';
}

export interface BusinessAssignment {
  id: string;
  business_id: string;
  user_id: string;
  tenant_id: string;
  role: 'primary_facilitator' | 'secondary_facilitator' | 'reviewer' | 'observer';
  status: 'active' | 'inactive' | 'completed';
  assigned_at: string;
  assigned_by?: string;
  completed_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  user?: {
    id: string;
    email?: string;
    display_name?: string;
    avatar_url?: string;
  };
}

export interface BusinessClassificationRecord {
  id: string;
  business_id: string;
  tenant_id: string;
  organization_type: 'for_profit' | 'nonprofit' | 'social_enterprise' | 'cooperative';
  business_models: string[];
  customer_types: string[];
  stages: string[];
  primary_pathway: 'nonprofit' | 'coaching_consulting' | 'subscription_membership' | 'ecommerce' | 'service' | 'hybrid';
  secondary_pathways: string[];
  confidence: number;
  evidence: EvidenceItem[];
  status: 'draft' | 'confirmed' | 'superseded';
  classified_at: string;
  classified_by?: string;
  confirmed_at?: string;
  confirmed_by?: string;
  superseded_by?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface EvidenceItem {
  factor: string;
  weight: number;
  description: string;
}

export interface BusinessBaseline {
  id: string;
  business_id: string;
  tenant_id: string;
  version: number;
  data: Record<string, unknown>;
  categories: string[];
  completeness_score: number;
  status: 'draft' | 'confirmed' | 'archived';
  baseline_period_start?: string;
  baseline_period_end?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  confirmed_at?: string;
  confirmed_by?: string;
  notes?: string;
}

export interface BusinessTeamMember {
  id: string;
  business_id: string;
  tenant_id: string;
  name: string;
  role: string;
  role_category?: 'owner' | 'leadership' | 'operations' | 'sales' | 'marketing' | 'finance' | 'technical' | 'support' | 'other';
  capacity_hours?: number;
  capacity_type?: 'full_time' | 'part_time' | 'contract' | 'variable';
  cost_per_hour?: number;
  cost_per_month?: number;
  employment_type?: 'employee' | 'contractor' | 'owner' | 'volunteer' | 'intern';
  start_date?: string;
  email?: string;
  phone?: string;
  status: 'active' | 'inactive' | 'former';
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface BusinessGoalRecord {
  id: string;
  business_id: string;
  tenant_id: string;
  type: 'goal' | 'concern' | 'constraint' | 'opportunity';
  title: string;
  description?: string;
  category?: 'financial' | 'operational' | 'growth' | 'personal' | 'team' | 'market' | 'product' | 'other';
  priority?: 'critical' | 'high' | 'medium' | 'low';
  timeframe?: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
  status: 'active' | 'in_progress' | 'completed' | 'cancelled' | 'deferred';
  progress_percent: number;
  target_date?: string;
  completed_at?: string;
  impact_level?: 'transformative' | 'significant' | 'moderate' | 'minor';
  effort_level?: 'high' | 'medium' | 'low';
  related_pathway?: 'nonprofit' | 'coaching_consulting' | 'subscription_membership' | 'ecommerce' | 'service' | 'hybrid';
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

// Form input types
export interface CreateBusinessInput {
  name: string;
  alias?: string;
  organization_type: 'for_profit' | 'nonprofit' | 'social_enterprise' | 'cooperative';
  industry?: string;
  industry_other?: string;
  location_city?: string;
  location_state?: string;
  location_country?: string;
  years_operating?: number;
  founded_year?: number;
  goals?: BusinessGoal[];
  concerns?: BusinessConcern[];
}

export interface UpdateBusinessInput extends Partial<CreateBusinessInput> {
  status?: 'active' | 'inactive' | 'archived';
}

export interface CreateClassificationInput {
  organization_type: 'for_profit' | 'nonprofit' | 'social_enterprise' | 'cooperative';
  business_models: string[];
  customer_types: string[];
  stages: string[];
  notes?: string;
}

export interface CreateTeamMemberInput {
  name: string;
  role: string;
  role_category?: BusinessTeamMember['role_category'];
  capacity_hours?: number;
  capacity_type?: BusinessTeamMember['capacity_type'];
  cost_per_hour?: number;
  cost_per_month?: number;
  employment_type?: BusinessTeamMember['employment_type'];
  start_date?: string;
  email?: string;
  phone?: string;
  notes?: string;
}

export interface CreateGoalInput {
  type: BusinessGoalRecord['type'];
  title: string;
  description?: string;
  category?: BusinessGoalRecord['category'];
  priority?: BusinessGoalRecord['priority'];
  timeframe?: BusinessGoalRecord['timeframe'];
  target_date?: string;
  impact_level?: BusinessGoalRecord['impact_level'];
  effort_level?: BusinessGoalRecord['effort_level'];
  related_pathway?: 'nonprofit' | 'coaching_consulting' | 'subscription_membership' | 'ecommerce' | 'service' | 'hybrid';
  notes?: string;
}

// Classification wizard step types
export interface ClassificationWizardStep {
  id: string;
  title: string;
  description: string;
  component: string;
}

export const classificationWizardSteps: ClassificationWizardStep[] = [
  {
    id: 'organization-type',
    title: 'Organization Type',
    description: 'What type of organization is this?',
    component: 'OrganizationTypeStep',
  },
  {
    id: 'business-model',
    title: 'Business Model',
    description: 'How does the business make money?',
    component: 'BusinessModelStep',
  },
  {
    id: 'customer-type',
    title: 'Customer Type',
    description: 'Who are the customers?',
    component: 'CustomerTypeStep',
  },
  {
    id: 'stage',
    title: 'Business Stage',
    description: 'What stage is the business in?',
    component: 'StageStep',
  },
  {
    id: 'indicators',
    title: 'Additional Indicators',
    description: 'Any other important factors?',
    component: 'IndicatorsStep',
  },
  {
    id: 'review',
    title: 'Review & Confirm',
    description: 'Review the classification',
    component: 'ReviewStep',
  },
];

// Industry options
export const industries = [
  { value: 'technology', label: 'Technology' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'finance', label: 'Finance & Insurance' },
  { value: 'retail', label: 'Retail & E-commerce' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'professional_services', label: 'Professional Services' },
  { value: 'education', label: 'Education' },
  { value: 'nonprofit_social', label: 'Nonprofit & Social Services' },
  { value: 'hospitality', label: 'Hospitality & Food Service' },
  { value: 'construction', label: 'Construction & Real Estate' },
  { value: 'arts_entertainment', label: 'Arts & Entertainment' },
  { value: 'agriculture', label: 'Agriculture' },
  { value: 'transportation', label: 'Transportation & Logistics' },
  { value: 'energy', label: 'Energy & Utilities' },
  { value: 'other', label: 'Other (specify)' },
];

// US States
export const usStates = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
  { value: 'DC', label: 'District of Columbia' },
];
