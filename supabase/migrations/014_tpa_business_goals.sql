-- Migration: 014_tpa_business_goals.sql
-- Phase 2: Business Profile - Owner goals and concerns

-- Business goals table: Tracks owner goals and concerns in detail
CREATE TABLE IF NOT EXISTS public.tpa_business_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.tpa_businesses(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tpa_tenants(id) ON DELETE CASCADE,
  
  -- Goal/concern type
  type TEXT NOT NULL CHECK (type IN ('goal', 'concern', 'constraint', 'opportunity')),
  
  -- Content
  title TEXT NOT NULL,
  description TEXT,
  
  -- Categorization
  category TEXT CHECK (category IN ('financial', 'operational', 'growth', 'personal', 'team', 'market', 'product', 'other')),
  
  -- Priority and timeframe
  priority TEXT CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  timeframe TEXT CHECK (timeframe IN ('immediate', 'short_term', 'medium_term', 'long_term')),
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'in_progress', 'completed', 'cancelled', 'deferred')),
  
  -- Progress
  progress_percent INTEGER DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  
  -- Target dates
  target_date DATE,
  completed_at TIMESTAMPTZ,
  
  -- Impact assessment
  impact_level TEXT CHECK (impact_level IN ('transformative', 'significant', 'moderate', 'minor')),
  effort_level TEXT CHECK (effort_level IN ('high', 'medium', 'low')),
  
  -- Related classification (if goal drove pathway selection)
  related_pathway TEXT CHECK (related_pathway IN ('nonprofit', 'coaching_consulting', 'subscription_membership', 'ecommerce', 'service', 'hybrid')),
  
  -- Notes
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS tpa_business_goals_business_id_idx ON public.tpa_business_goals(business_id);
CREATE INDEX IF NOT EXISTS tpa_business_goals_tenant_id_idx ON public.tpa_business_goals(tenant_id);
CREATE INDEX IF NOT EXISTS tpa_business_goals_type_idx ON public.tpa_business_goals(type);
CREATE INDEX IF NOT EXISTS tpa_business_goals_status_idx ON public.tpa_business_goals(status);
CREATE INDEX IF NOT EXISTS tpa_business_goals_priority_idx ON public.tpa_business_goals(priority);
CREATE INDEX IF NOT EXISTS tpa_business_goals_category_idx ON public.tpa_business_goals(category);
CREATE INDEX IF NOT EXISTS tpa_business_goals_timeframe_idx ON public.tpa_business_goals(timeframe);

-- Trigger for updated_at
CREATE TRIGGER tpa_business_goals_updated_at
  BEFORE UPDATE ON public.tpa_business_goals
  FOR EACH ROW
  EXECUTE FUNCTION public.tpa_update_updated_at_column();

-- Enable RLS
ALTER TABLE public.tpa_business_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Facilitators can view goals for businesses they have access to
CREATE POLICY "facilitators_can_view_goals"
  ON public.tpa_business_goals
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tpa_tenant_memberships tm
      WHERE tm.user_id = auth.uid()
        AND tm.tenant_id = tpa_business_goals.tenant_id
        AND tm.role IN ('facilitator', 'senior_reviewer', 'organization_admin', 'white_label_admin', 'system_admin')
        AND tm.status = 'active'
    )
  );

-- Facilitators can create goals for businesses in their tenant
CREATE POLICY "facilitators_can_create_goals"
  ON public.tpa_business_goals
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tpa_tenant_memberships tm
      WHERE tm.user_id = auth.uid()
        AND tm.tenant_id = tpa_business_goals.tenant_id
        AND tm.role IN ('facilitator', 'senior_reviewer', 'organization_admin', 'white_label_admin', 'system_admin')
        AND tm.status = 'active'
    )
  );

-- Facilitators can update goals for businesses in their tenant
CREATE POLICY "facilitators_can_update_goals"
  ON public.tpa_business_goals
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.tpa_tenant_memberships tm
      WHERE tm.user_id = auth.uid()
        AND tm.tenant_id = tpa_business_goals.tenant_id
        AND tm.role IN ('facilitator', 'senior_reviewer', 'organization_admin', 'white_label_admin', 'system_admin')
        AND tm.status = 'active'
    )
  );

-- Facilitators can delete goals for businesses in their tenant
CREATE POLICY "facilitators_can_delete_goals"
  ON public.tpa_business_goals
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.tpa_tenant_memberships tm
      WHERE tm.user_id = auth.uid()
        AND tm.tenant_id = tpa_business_goals.tenant_id
        AND tm.role IN ('facilitator', 'senior_reviewer', 'organization_admin', 'white_label_admin', 'system_admin')
        AND tm.status = 'active'
    )
  );

COMMENT ON TABLE public.tpa_business_goals IS 'Owner goals, concerns, constraints, and opportunities';
COMMENT ON COLUMN public.tpa_business_goals.type IS 'goal, concern, constraint, or opportunity';
COMMENT ON COLUMN public.tpa_business_goals.category IS 'financial, operational, growth, personal, team, market, product, or other';
COMMENT ON COLUMN public.tpa_business_goals.priority IS 'critical, high, medium, or low';
COMMENT ON COLUMN public.tpa_business_goals.timeframe IS 'immediate, short_term, medium_term, or long_term';
COMMENT ON COLUMN public.tpa_business_goals.impact_level IS 'transformative, significant, moderate, or minor';
COMMENT ON COLUMN public.tpa_business_goals.effort_level IS 'high, medium, or low';
COMMENT ON COLUMN public.tpa_business_goals.related_pathway IS 'Profit Architecture pathway related to this goal';
