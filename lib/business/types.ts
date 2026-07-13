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

// Industry category type
export interface IndustryCategory {
  value: string;
  label: string;
  subcategories: IndustrySubcategory[];
}

export interface IndustrySubcategory {
  value: string;
  label: string;
}

// Industry options with categories and subcategories
export const industryCategories: IndustryCategory[] = [
  {
    value: 'coaching',
    label: 'Coaching',
    subcategories: [
      { value: 'life_coaching', label: 'Life Coaching' },
      { value: 'spiritual_coaching', label: 'Spiritual Coaching' },
      { value: 'executive_coaching', label: 'Executive Coaching' },
      { value: 'leadership_coaching', label: 'Leadership Coaching' },
      { value: 'business_coaching', label: 'Business Coaching' },
      { value: 'career_coaching', label: 'Career Coaching' },
      { value: 'health_wellness_coaching', label: 'Health & Wellness Coaching' },
      { value: 'fitness_coaching', label: 'Fitness Coaching' },
      { value: 'nutrition_coaching', label: 'Nutrition Coaching' },
      { value: 'relationship_coaching', label: 'Relationship Coaching' },
      { value: 'parenting_coaching', label: 'Parenting Coaching' },
      { value: 'performance_coaching', label: 'Performance Coaching' },
      { value: 'mindset_coaching', label: 'Mindset Coaching' },
      { value: 'transformational_coaching', label: 'Transformational Coaching' },
      { value: 'success_coaching', label: 'Success Coaching' },
      { value: 'financial_coaching', label: 'Financial Coaching' },
      { value: 'sales_coaching', label: 'Sales Coaching' },
      { value: 'marketing_coaching', label: 'Marketing Coaching' },
      { value: 'team_coaching', label: 'Team Coaching' },
      { value: 'group_coaching', label: 'Group Coaching' },
      { value: 'online_coaching', label: 'Online Coaching' },
      { value: 'hybrid_coaching', label: 'Hybrid Coaching (Online + In-Person)' },
    ],
  },
  {
    value: 'professional_services',
    label: 'Professional Services',
    subcategories: [
      { value: 'consulting', label: 'Consulting' },
      { value: 'agency', label: 'Agency' },
      { value: 'accounting', label: 'Accounting & Bookkeeping' },
      { value: 'legal', label: 'Legal Services' },
      { value: 'marketing_services', label: 'Marketing Services' },
      { value: 'hr_services', label: 'HR & Recruitment' },
      { value: 'it_services', label: 'IT Services' },
    ],
  },
  {
    value: 'technology',
    label: 'Technology / SaaS',
    subcategories: [
      { value: 'software', label: 'Software Development' },
      { value: 'saas', label: 'SaaS' },
      { value: 'ai_ml', label: 'AI & Machine Learning' },
      { value: 'cybersecurity', label: 'Cybersecurity' },
      { value: 'data_analytics', label: 'Data & Analytics' },
      { value: 'web_mobile', label: 'Web & Mobile Apps' },
      { value: 'cloud_services', label: 'Cloud Services' },
      { value: 'hardware', label: 'Hardware & Devices' },
    ],
  },
  {
    value: 'ecommerce_retail',
    label: 'E-commerce / Retail',
    subcategories: [
      { value: 'online_store', label: 'Online Store' },
      { value: 'physical_retail', label: 'Physical Retail' },
      { value: 'omnichannel', label: 'Omnichannel Retail' },
      { value: 'dropshipping', label: 'Dropshipping' },
      { value: 'wholesale', label: 'Wholesale' },
      { value: 'marketplace', label: 'Marketplace' },
    ],
  },
  {
    value: 'healthcare_wellness',
    label: 'Healthcare / Wellness',
    subcategories: [
      { value: 'medical_practice', label: 'Medical Practice' },
      { value: 'mental_health', label: 'Mental Health Services' },
      { value: 'wellness_services', label: 'Wellness Services' },
      { value: 'alternative_medicine', label: 'Alternative Medicine' },
      { value: 'medical_devices', label: 'Medical Devices' },
      { value: 'health_tech', label: 'Health Tech' },
    ],
  },
  {
    value: 'education_training',
    label: 'Education / Training',
    subcategories: [
      { value: 'k12', label: 'K-12 Education' },
      { value: 'higher_ed', label: 'Higher Education' },
      { value: 'corporate_training', label: 'Corporate Training' },
      { value: 'online_courses', label: 'Online Courses' },
      { value: 'tutoring', label: 'Tutoring' },
      { value: 'professional_development', label: 'Professional Development' },
    ],
  },
  {
    value: 'creative_services',
    label: 'Creative Services',
    subcategories: [
      { value: 'design', label: 'Design Services' },
      { value: 'photography', label: 'Photography' },
      { value: 'video_production', label: 'Video Production' },
      { value: 'writing_editing', label: 'Writing & Editing' },
      { value: 'music_audio', label: 'Music & Audio' },
      { value: 'art_crafts', label: 'Art & Crafts' },
    ],
  },
  {
    value: 'finance_insurance',
    label: 'Financial Services',
    subcategories: [
      { value: 'financial_planning', label: 'Financial Planning' },
      { value: 'investment', label: 'Investment Services' },
      { value: 'insurance', label: 'Insurance' },
      { value: 'banking', label: 'Banking' },
      { value: 'fintech', label: 'Fintech' },
      { value: 'accounting_services', label: 'Accounting Services' },
    ],
  },
  {
    value: 'real_estate',
    label: 'Real Estate',
    subcategories: [
      { value: 'residential_sales', label: 'Residential Sales' },
      { value: 'commercial_sales', label: 'Commercial Sales' },
      { value: 'property_management', label: 'Property Management' },
      { value: 'real_estate_investing', label: 'Real Estate Investing' },
      { value: 'development', label: 'Development' },
    ],
  },
  {
    value: 'hospitality_events',
    label: 'Hospitality',
    subcategories: [
      { value: 'restaurant', label: 'Restaurant' },
      { value: 'catering', label: 'Catering' },
      { value: 'hotel_lodging', label: 'Hotel & Lodging' },
      { value: 'events_planning', label: 'Event Planning' },
      { value: 'travel_tourism', label: 'Travel & Tourism' },
    ],
  },
  {
    value: 'manufacturing',
    label: 'Manufacturing',
    subcategories: [
      { value: 'consumer_goods', label: 'Consumer Goods' },
      { value: 'industrial', label: 'Industrial Manufacturing' },
      { value: 'food_beverage', label: 'Food & Beverage' },
      { value: 'textiles', label: 'Textiles & Apparel' },
      { value: 'electronics', label: 'Electronics' },
    ],
  },
  {
    value: 'nonprofit_social',
    label: 'Non-profit / Social Impact',
    subcategories: [
      { value: 'charity', label: 'Charity' },
      { value: 'foundation', label: 'Foundation' },
      { value: 'advocacy', label: 'Advocacy' },
      { value: 'social_enterprise', label: 'Social Enterprise' },
      { value: 'community_org', label: 'Community Organization' },
    ],
  },
  {
    value: 'construction',
    label: 'Construction / Trades',
    subcategories: [
      { value: 'residential_construction', label: 'Residential Construction' },
      { value: 'commercial_construction', label: 'Commercial Construction' },
      { value: 'renovation', label: 'Renovation & Remodeling' },
      { value: 'specialty_trades', label: 'Specialty Trades' },
    ],
  },
  {
    value: 'arts_entertainment',
    label: 'Arts & Entertainment',
    subcategories: [
      { value: 'performing_arts', label: 'Performing Arts' },
      { value: 'visual_arts', label: 'Visual Arts' },
      { value: 'media_publishing', label: 'Media & Publishing' },
      { value: 'entertainment', label: 'Entertainment' },
    ],
  },
  {
    value: 'other',
    label: 'Other',
    subcategories: [
      { value: 'other_specific', label: 'Other (specify below)' },
    ],
  },
];

// Flat list for backwards compatibility (derived from categories)
export const industries = industryCategories.flatMap(cat =>
  cat.subcategories.map(sub => ({
    value: `${cat.value}_${sub.value}`,
    label: `${cat.label} - ${sub.label}`,
  }))
);

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
