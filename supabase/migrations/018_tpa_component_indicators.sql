-- Migration: 018_tpa_component_indicators.sql
-- Phase 3: Methodology Framework - Many-to-many mapping of components to indicators

-- Component indicators table: Many-to-many mapping with component-specific weights
CREATE TABLE IF NOT EXISTS public.tpa_component_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component_id UUID NOT NULL REFERENCES public.tpa_components(id) ON DELETE CASCADE,
  indicator_id UUID NOT NULL REFERENCES public.tpa_indicators(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tpa_tenants(id) ON DELETE CASCADE,
  
  -- Component-specific configuration
  weight DECIMAL(5,2) NOT NULL CHECK (weight > 0),
  sort_order INTEGER NOT NULL DEFAULT 0,
  
  -- Optional override for this component
  component_specific_guidance TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  
  -- Constraints
  CONSTRAINT unique_component_indicator UNIQUE (component_id, indicator_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS tpa_component_indicators_component_id_idx ON public.tpa_component_indicators(component_id);
CREATE INDEX IF NOT EXISTS tpa_component_indicators_indicator_id_idx ON public.tpa_component_indicators(indicator_id);
CREATE INDEX IF NOT EXISTS tpa_component_indicators_tenant_id_idx ON public.tpa_component_indicators(tenant_id);
CREATE INDEX IF NOT EXISTS tpa_component_indicators_status_idx ON public.tpa_component_indicators(status);
CREATE INDEX IF NOT EXISTS tpa_component_indicators_sort_order_idx ON public.tpa_component_indicators(sort_order);

-- Trigger for updated_at
CREATE TRIGGER tpa_component_indicators_updated_at
  BEFORE UPDATE ON public.tpa_component_indicators
  FOR EACH ROW
  EXECUTE FUNCTION public.tpa_update_updated_at_column();

-- Enable RLS
ALTER TABLE public.tpa_component_indicators ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- All authenticated users can view active component-indicator mappings
CREATE POLICY "users_can_view_component_indicators"
  ON public.tpa_component_indicators
  FOR SELECT
  USING (
    status = 'active'
    OR EXISTS (
      SELECT 1 FROM public.tpa_tenant_memberships tm
      WHERE tm.user_id = auth.uid()
        AND tm.tenant_id = tpa_component_indicators.tenant_id
        AND tm.role IN ('facilitator', 'senior_reviewer', 'organization_admin', 'white_label_admin', 'system_admin')
        AND tm.status = 'active'
    )
  );

-- Only admins can manage component-indicator mappings
CREATE POLICY "admins_can_manage_component_indicators"
  ON public.tpa_component_indicators
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.tpa_tenant_memberships tm
      WHERE tm.user_id = auth.uid()
        AND tm.tenant_id = tpa_component_indicators.tenant_id
        AND tm.role IN ('organization_admin', 'white_label_admin', 'system_admin')
        AND tm.status = 'active'
    )
  );

-- Function to calculate component score from indicator scores
CREATE OR REPLACE FUNCTION public.tpa_calculate_component_score(
  p_component_id UUID,
  p_indicator_scores JSONB -- Format: [{"indicator_id": "uuid", "score": 0-5 or null}, ...]
)
RETURNS DECIMAL(5,2) AS $$
DECLARE
  total_weighted_score DECIMAL(10,4) := 0;
  total_weight DECIMAL(10,4) := 0;
  indicator_record RECORD;
  score_value DECIMAL(5,2);
BEGIN
  FOR indicator_record IN 
    SELECT 
      ci.indicator_id,
      ci.weight,
      (p_indicator_scores ->> ci.indicator_id)::DECIMAL as provided_score
    FROM public.tpa_component_indicators ci
    WHERE ci.component_id = p_component_id
      AND ci.status = 'active'
  LOOP
    IF indicator_record.provided_score IS NOT NULL THEN
      score_value := indicator_record.provided_score;
      -- Clamp score to 0-5 range
      IF score_value < 0 THEN score_value := 0; END IF;
      IF score_value > 5 THEN score_value := 5; END IF;
      
      total_weighted_score := total_weighted_score + (score_value * indicator_record.weight);
      total_weight := total_weight + indicator_record.weight;
    END IF;
  END LOOP;
  
  IF total_weight = 0 THEN
    RETURN NULL;
  END IF;
  
  RETURN ROUND((total_weighted_score / total_weight), 2);
END;
$$ LANGUAGE plpgsql;

-- Function to get indicators for a component with full details
CREATE OR REPLACE FUNCTION public.tpa_get_component_indicators(
  p_component_id UUID
)
RETURNS TABLE (
  indicator_id UUID,
  indicator_code TEXT,
  indicator_name TEXT,
  indicator_description TEXT,
  weight DECIMAL(5,2),
  sort_order INTEGER,
  guidance_score_0 TEXT,
  guidance_score_1 TEXT,
  guidance_score_2 TEXT,
  guidance_score_3 TEXT,
  guidance_score_4 TEXT,
  guidance_score_5 TEXT,
  guidance_unknown TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id as indicator_id,
    i.code as indicator_code,
    i.name as indicator_name,
    i.description as indicator_description,
    ci.weight,
    ci.sort_order,
    i.guidance_score_0,
    i.guidance_score_1,
    i.guidance_score_2,
    i.guidance_score_3,
    i.guidance_score_4,
    i.guidance_score_5,
    i.guidance_unknown
  FROM public.tpa_component_indicators ci
  JOIN public.tpa_indicators i ON ci.indicator_id = i.id
  WHERE ci.component_id = p_component_id
    AND ci.status = 'active'
    AND i.status = 'active'
  ORDER BY ci.sort_order, i.name;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE public.tpa_component_indicators IS 'Many-to-many mapping of components to indicators with component-specific weights';
COMMENT ON COLUMN public.tpa_component_indicators.weight IS 'Weight of this indicator within the component (not the overall methodology)';
COMMENT ON COLUMN public.tpa_component_indicators.component_specific_guidance IS 'Optional guidance override for this specific component context';
