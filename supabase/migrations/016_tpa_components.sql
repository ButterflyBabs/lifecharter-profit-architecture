-- Migration: 016_tpa_components.sql
-- Phase 3: Methodology Framework - Assessment components

-- Components table: The 12 assessment components
CREATE TABLE IF NOT EXISTS public.tpa_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  methodology_version_id UUID NOT NULL REFERENCES public.tpa_methodology_versions(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tpa_tenants(id) ON DELETE CASCADE,
  
  -- Component identification
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Weight and ordering
  default_weight DECIMAL(5,2) NOT NULL CHECK (default_weight >= 0 AND default_weight <= 100),
  sort_order INTEGER NOT NULL DEFAULT 0,
  
  -- Scope flags
  is_universal BOOLEAN DEFAULT true,
  pathway_specific BOOLEAN DEFAULT false,
  
  -- Applicable pathways (if not universal)
  applicable_pathways TEXT[] DEFAULT '{}',
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deprecated')),
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  
  -- Constraints
  CONSTRAINT unique_code_per_version UNIQUE (methodology_version_id, code)
);

-- Indexes
CREATE INDEX IF NOT EXISTS tpa_components_methodology_version_id_idx ON public.tpa_components(methodology_version_id);
CREATE INDEX IF NOT EXISTS tpa_components_tenant_id_idx ON public.tpa_components(tenant_id);
CREATE INDEX IF NOT EXISTS tpa_components_code_idx ON public.tpa_components(code);
CREATE INDEX IF NOT EXISTS tpa_components_status_idx ON public.tpa_components(status);
CREATE INDEX IF NOT EXISTS tpa_components_sort_order_idx ON public.tpa_components(sort_order);
CREATE INDEX IF NOT EXISTS tpa_components_pathway_idx ON public.tpa_components(applicable_pathways) USING GIN;

-- Trigger for updated_at
CREATE TRIGGER tpa_components_updated_at
  BEFORE UPDATE ON public.tpa_components
  FOR EACH ROW
  EXECUTE FUNCTION public.tpa_update_updated_at_column();

-- Enable RLS
ALTER TABLE public.tpa_components ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- All authenticated users can view active components
CREATE POLICY "users_can_view_components"
  ON public.tpa_components
  FOR SELECT
  USING (
    status = 'active'
    OR EXISTS (
      SELECT 1 FROM public.tpa_tenant_memberships tm
      WHERE tm.user_id = auth.uid()
        AND tm.tenant_id = tpa_components.tenant_id
        AND tm.role IN ('facilitator', 'senior_reviewer', 'organization_admin', 'white_label_admin', 'system_admin')
        AND tm.status = 'active'
    )
  );

-- Only admins can manage components
CREATE POLICY "admins_can_manage_components"
  ON public.tpa_components
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.tpa_tenant_memberships tm
      WHERE tm.user_id = auth.uid()
        AND tm.tenant_id = tpa_components.tenant_id
        AND tm.role IN ('organization_admin', 'white_label_admin', 'system_admin')
        AND tm.status = 'active'
    )
  );

-- Function to validate component weights sum to 100 for a methodology version
CREATE OR REPLACE FUNCTION public.tpa_validate_component_weights()
RETURNS TRIGGER AS $$
DECLARE
  total_weight DECIMAL(5,2);
BEGIN
  SELECT COALESCE(SUM(default_weight), 0)
  INTO total_weight
  FROM public.tpa_components
  WHERE methodology_version_id = NEW.methodology_version_id
    AND status = 'active';
  
  -- Allow some tolerance for floating point
  IF total_weight > 100.01 THEN
    RAISE EXCEPTION 'Component weights for methodology version % exceed 100%% (total: %)', 
      NEW.methodology_version_id, total_weight;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to validate weights (commented out - can be enabled for strict enforcement)
-- CREATE TRIGGER tpa_validate_component_weights_trigger
--   AFTER INSERT OR UPDATE ON public.tpa_components
--   FOR EACH ROW
--   EXECUTE FUNCTION public.tpa_validate_component_weights();

COMMENT ON TABLE public.tpa_components IS 'The 12 assessment components of The Profit Architecture';
COMMENT ON COLUMN public.tpa_components.code IS 'Unique code for the component (e.g., financial_health)';
COMMENT ON COLUMN public.tpa_components.default_weight IS 'Default weight percentage for scoring (0-100)';
COMMENT ON COLUMN public.tpa_components.is_universal IS 'Whether this component applies to all pathways';
COMMENT ON COLUMN public.tpa_components.applicable_pathways IS 'Array of pathway codes if not universal';
