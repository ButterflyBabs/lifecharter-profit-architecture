-- Migration: 017_tpa_indicators.sql
-- Phase 3: Methodology Framework - Scoring indicators within components

-- Indicators table: Scoring indicators with 0-5 scale guidance
CREATE TABLE IF NOT EXISTS public.tpa_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tpa_tenants(id) ON DELETE CASCADE,
  
  -- Indicator identification
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Scoring guidance (0-5 scale)
  guidance_score_0 TEXT NOT NULL, -- What 0 means
  guidance_score_1 TEXT NOT NULL, -- What 1 means
  guidance_score_2 TEXT NOT NULL,
  guidance_score_3 TEXT NOT NULL,
  guidance_score_4 TEXT NOT NULL,
  guidance_score_5 TEXT NOT NULL,
  guidance_unknown TEXT, -- When to mark unknown
  
  -- Applicability rules for pathway filtering
  applies_to_pathways TEXT[] DEFAULT '{}',
  applies_to_organization_types TEXT[] DEFAULT '{}',
  applies_to_stages TEXT[] DEFAULT '{}',
  
  -- Default weight within component (can be overridden)
  default_weight DECIMAL(5,2) NOT NULL DEFAULT 1.0 CHECK (default_weight > 0),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deprecated')),
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  
  -- Constraints
  CONSTRAINT unique_indicator_code UNIQUE (code)
);

-- Indexes
CREATE INDEX IF NOT EXISTS tpa_indicators_tenant_id_idx ON public.tpa_indicators(tenant_id);
CREATE INDEX IF NOT EXISTS tpa_indicators_code_idx ON public.tpa_indicators(code);
CREATE INDEX IF NOT EXISTS tpa_indicators_status_idx ON public.tpa_indicators(status);
CREATE INDEX IF NOT EXISTS tpa_indicators_pathways_idx ON public.tpa_indicators(applies_to_pathways) USING GIN;
CREATE INDEX IF NOT EXISTS tpa_indicators_org_types_idx ON public.tpa_indicators(applies_to_organization_types) USING GIN;
CREATE INDEX IF NOT EXISTS tpa_indicators_stages_idx ON public.tpa_indicators(applies_to_stages) USING GIN;

-- Trigger for updated_at
CREATE TRIGGER tpa_indicators_updated_at
  BEFORE UPDATE ON public.tpa_indicators
  FOR EACH ROW
  EXECUTE FUNCTION public.tpa_update_updated_at_column();

-- Enable RLS
ALTER TABLE public.tpa_indicators ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- All authenticated users can view active indicators
CREATE POLICY "users_can_view_indicators"
  ON public.tpa_indicators
  FOR SELECT
  USING (
    status = 'active'
    OR EXISTS (
      SELECT 1 FROM public.tpa_tenant_memberships tm
      WHERE tm.user_id = auth.uid()
        AND tm.tenant_id = tpa_indicators.tenant_id
        AND tm.role IN ('facilitator', 'senior_reviewer', 'organization_admin', 'white_label_admin', 'system_admin')
        AND tm.status = 'active'
    )
  );

-- Only admins can manage indicators
CREATE POLICY "admins_can_manage_indicators"
  ON public.tpa_indicators
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.tpa_tenant_memberships tm
      WHERE tm.user_id = auth.uid()
        AND tm.tenant_id = tpa_indicators.tenant_id
        AND tm.role IN ('organization_admin', 'white_label_admin', 'system_admin')
        AND tm.status = 'active'
    )
  );

-- Function to get applicable indicators for a business
CREATE OR REPLACE FUNCTION public.tpa_get_applicable_indicators(
  p_pathway TEXT,
  p_org_type TEXT DEFAULT NULL,
  p_stage TEXT DEFAULT NULL
)
RETURNS TABLE (
  indicator_id UUID,
  indicator_code TEXT,
  indicator_name TEXT,
  is_applicable BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id as indicator_id,
    i.code as indicator_code,
    i.name as indicator_name,
    (
      -- Indicator applies if:
      -- 1. No pathway restrictions OR pathway is in the list
      (array_length(i.applies_to_pathways, 1) IS NULL OR array_length(i.applies_to_pathways, 1) = 0 OR p_pathway = ANY(i.applies_to_pathways))
      AND
      -- 2. No org type restrictions OR org type is in the list
      (array_length(i.applies_to_organization_types, 1) IS NULL OR array_length(i.applies_to_organization_types, 1) = 0 OR p_org_type = ANY(i.applies_to_organization_types) OR p_org_type IS NULL)
      AND
      -- 3. No stage restrictions OR stage is in the list
      (array_length(i.applies_to_stages, 1) IS NULL OR array_length(i.applies_to_stages, 1) = 0 OR p_stage = ANY(i.applies_to_stages) OR p_stage IS NULL)
    ) as is_applicable
  FROM public.tpa_indicators i
  WHERE i.status = 'active';
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE public.tpa_indicators IS 'Scoring indicators with 0-5 scale guidance for assessment';
COMMENT ON COLUMN public.tpa_indicators.guidance_score_0 IS 'Description of what a score of 0 means';
COMMENT ON COLUMN public.tpa_indicators.applies_to_pathways IS 'Array of pathway codes this indicator applies to (empty = all)';
COMMENT ON COLUMN public.tpa_indicators.applies_to_organization_types IS 'Array of organization types this applies to (empty = all)';
COMMENT ON COLUMN public.tpa_indicators.applies_to_stages IS 'Array of business stages this applies to (empty = all)';
