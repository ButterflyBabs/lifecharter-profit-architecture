-- Migration: 029_tpa_pathway_classifications.sql
-- TPA Pathway Classification - 6 Pathway Methodology

-- TPA Business Pathway Classifications table
CREATE TABLE IF NOT EXISTS public.tpa_pathway_classifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.tpa_businesses(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tpa_tenants(id) ON DELETE CASCADE,
  
  -- Classification answers
  stage TEXT NOT NULL CHECK (stage IN (
    'idea_stage',
    'pre_revenue',
    'early_stage',
    'growth_stage',
    'established',
    'pivot_turnaround'
  )),
  revenue_range TEXT NOT NULL CHECK (revenue_range IN (
    'zero',
    '1_to_50k',
    '50k_to_100k',
    '100k_to_250k',
    '250k_to_500k',
    '500k_to_1m',
    '1m_to_5m',
    '5m_plus'
  )),
  team_size TEXT NOT NULL CHECK (team_size IN (
    'solo',
    'two_to_five',
    'six_to_ten',
    'eleven_to_25',
    'twenty_six_to_50',
    'fifty_plus'
  )),
  primary_challenge TEXT NOT NULL CHECK (primary_challenge IN (
    'finding_customers',
    'pricing_profitability',
    'time_overwhelm',
    'systems_processes',
    'team_leadership',
    'cash_flow',
    'marketing',
    'scaling_strategy',
    'product_development',
    'work_life_balance'
  )),
  growth_intent TEXT NOT NULL CHECK (growth_intent IN (
    'lifestyle',
    'steady_growth',
    'aggressive_growth',
    'prepare_exit',
    'passive_income',
    'pivot_model'
  )),
  
  -- Calculated pathway result
  pathway TEXT NOT NULL CHECK (pathway IN (
    'foundation',
    'traction',
    'optimization',
    'scale',
    'transformation',
    'legacy'
  )),
  pathway_number INTEGER NOT NULL CHECK (pathway_number BETWEEN 1 AND 6),
  confidence NUMERIC NOT NULL DEFAULT 0 CHECK (confidence >= 0 AND confidence <= 1),
  
  -- Classification metadata
  classified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  classified_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Notes
  notes TEXT,
  
  -- Unique constraint - one classification per business
  UNIQUE(business_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS tpa_pathway_classifications_business_id_idx ON public.tpa_pathway_classifications(business_id);
CREATE INDEX IF NOT EXISTS tpa_pathway_classifications_tenant_id_idx ON public.tpa_pathway_classifications(tenant_id);
CREATE INDEX IF NOT EXISTS tpa_pathway_classifications_pathway_idx ON public.tpa_pathway_classifications(pathway);
CREATE INDEX IF NOT EXISTS tpa_pathway_classifications_pathway_number_idx ON public.tpa_pathway_classifications(pathway_number);
CREATE INDEX IF NOT EXISTS tpa_pathway_classifications_classified_at_idx ON public.tpa_pathway_classifications(classified_at);

-- Trigger for updated_at
CREATE TRIGGER tpa_pathway_classifications_updated_at
  BEFORE UPDATE ON public.tpa_pathway_classifications
  FOR EACH ROW
  EXECUTE FUNCTION public.tpa_update_updated_at_column();

-- Enable RLS
ALTER TABLE public.tpa_pathway_classifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Facilitators can view classifications for businesses they have access to
CREATE POLICY "facilitators_can_view_pathway_classifications"
  ON public.tpa_pathway_classifications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tpa_tenant_memberships tm
      WHERE tm.user_id = auth.uid()
        AND tm.tenant_id = tpa_pathway_classifications.tenant_id
        AND tm.role IN ('facilitator', 'senior_reviewer', 'organization_admin', 'white_label_admin', 'system_admin')
        AND tm.status = 'active'
    )
  );

-- Facilitators can create classifications for businesses in their tenant
CREATE POLICY "facilitators_can_create_pathway_classifications"
  ON public.tpa_pathway_classifications
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tpa_tenant_memberships tm
      WHERE tm.user_id = auth.uid()
        AND tm.tenant_id = tpa_pathway_classifications.tenant_id
        AND tm.role IN ('facilitator', 'senior_reviewer', 'organization_admin', 'white_label_admin', 'system_admin')
        AND tm.status = 'active'
    )
  );

-- Facilitators can update classifications for businesses in their tenant
CREATE POLICY "facilitators_can_update_pathway_classifications"
  ON public.tpa_pathway_classifications
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.tpa_tenant_memberships tm
      WHERE tm.user_id = auth.uid()
        AND tm.tenant_id = tpa_pathway_classifications.tenant_id
        AND tm.role IN ('facilitator', 'senior_reviewer', 'organization_admin', 'white_label_admin', 'system_admin')
        AND tm.status = 'active'
    )
  );

-- Facilitators can delete classifications for businesses in their tenant
CREATE POLICY "facilitators_can_delete_pathway_classifications"
  ON public.tpa_pathway_classifications
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.tpa_tenant_memberships tm
      WHERE tm.user_id = auth.uid()
        AND tm.tenant_id = tpa_pathway_classifications.tenant_id
        AND tm.role IN ('facilitator', 'senior_reviewer', 'organization_admin', 'white_label_admin', 'system_admin')
        AND tm.status = 'active'
    )
  );

COMMENT ON TABLE public.tpa_pathway_classifications IS 'TPA Pathway Classification - 6 Pathway Methodology for business classification';
COMMENT ON COLUMN public.tpa_pathway_classifications.stage IS 'Current business stage (idea, pre-revenue, early, growth, established, pivot)';
COMMENT ON COLUMN public.tpa_pathway_classifications.revenue_range IS 'Annual revenue range';
COMMENT ON COLUMN public.tpa_pathway_classifications.team_size IS 'Current team size';
COMMENT ON COLUMN public.tpa_pathway_classifications.primary_challenge IS 'Biggest current challenge';
COMMENT ON COLUMN public.tpa_pathway_classifications.growth_intent IS 'Desired growth direction';
COMMENT ON COLUMN public.tpa_pathway_classifications.pathway IS 'Assigned pathway (foundation, traction, optimization, scale, transformation, legacy)';
COMMENT ON COLUMN public.tpa_pathway_classifications.pathway_number IS 'Pathway number (1-6)';
COMMENT ON COLUMN public.tpa_pathway_classifications.confidence IS 'Classification confidence score (0-1)';
