-- Migration: 012_tpa_business_baselines.sql
-- Phase 2: Business Profile - Baseline metrics snapshot

-- Business baselines table: Tracks baseline metrics over time
CREATE TABLE IF NOT EXISTS public.tpa_business_baselines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.tpa_businesses(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tpa_tenants(id) ON DELETE CASCADE,
  
  -- Baseline version
  version INTEGER NOT NULL DEFAULT 1,
  
  -- Baseline data (flexible JSONB structure)
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Baseline categories (for querying)
  categories TEXT[] NOT NULL DEFAULT '{}',
  
  -- Data completeness
  completeness_score NUMERIC DEFAULT 0 CHECK (completeness_score >= 0 AND completeness_score <= 1),
  
  -- Baseline status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'archived')),
  
  -- Baseline period
  baseline_period_start DATE,
  baseline_period_end DATE,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  confirmed_at TIMESTAMPTZ,
  confirmed_by UUID REFERENCES auth.users(id),
  
  -- Notes
  notes TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS tpa_business_baselines_business_id_idx ON public.tpa_business_baselines(business_id);
CREATE INDEX IF NOT EXISTS tpa_business_baselines_tenant_id_idx ON public.tpa_business_baselines(tenant_id);
CREATE INDEX IF NOT EXISTS tpa_business_baselines_status_idx ON public.tpa_business_baselines(status);
CREATE INDEX IF NOT EXISTS tpa_business_baselines_version_idx ON public.tpa_business_baselines(business_id, version DESC);
CREATE INDEX IF NOT EXISTS tpa_business_baselines_data_gin_idx ON public.tpa_business_baselines USING gin(data);

-- Unique constraint: One version per business
CREATE UNIQUE INDEX IF NOT EXISTS tpa_business_baselines_unique_version_idx 
  ON public.tpa_business_baselines(business_id, version);

-- Trigger for updated_at
CREATE TRIGGER tpa_business_baselines_updated_at
  BEFORE UPDATE ON public.tpa_business_baselines
  FOR EACH ROW
  EXECUTE FUNCTION public.tpa_update_updated_at_column();

-- Function to auto-increment version on insert
CREATE OR REPLACE FUNCTION public.tpa_baseline_auto_version()
RETURNS TRIGGER AS $$
BEGIN
  SELECT COALESCE(MAX(version), 0) + 1
  INTO NEW.version
  FROM public.tpa_business_baselines
  WHERE business_id = NEW.business_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tpa_business_baselines_auto_version
  BEFORE INSERT ON public.tpa_business_baselines
  FOR EACH ROW
  EXECUTE FUNCTION public.tpa_baseline_auto_version();

-- Enable RLS
ALTER TABLE public.tpa_business_baselines ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Facilitators can view baselines for businesses they have access to
CREATE POLICY "facilitators_can_view_baselines"
  ON public.tpa_business_baselines
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tpa_tenant_memberships tm
      WHERE tm.user_id = auth.uid()
        AND tm.tenant_id = tpa_business_baselines.tenant_id
        AND tm.role IN ('facilitator', 'senior_reviewer', 'organization_admin', 'white_label_admin', 'system_admin')
        AND tm.status = 'active'
    )
  );

-- Facilitators can create baselines for businesses in their tenant
CREATE POLICY "facilitators_can_create_baselines"
  ON public.tpa_business_baselines
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tpa_tenant_memberships tm
      WHERE tm.user_id = auth.uid()
        AND tm.tenant_id = tpa_business_baselines.tenant_id
        AND tm.role IN ('facilitator', 'senior_reviewer', 'organization_admin', 'white_label_admin', 'system_admin')
        AND tm.status = 'active'
    )
  );

-- Facilitators can update baselines for businesses in their tenant
CREATE POLICY "facilitators_can_update_baselines"
  ON public.tpa_business_baselines
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.tpa_tenant_memberships tm
      WHERE tm.user_id = auth.uid()
        AND tm.tenant_id = tpa_business_baselines.tenant_id
        AND tm.role IN ('facilitator', 'senior_reviewer', 'organization_admin', 'white_label_admin', 'system_admin')
        AND tm.status = 'active'
    )
  );

-- Facilitators can delete draft baselines for businesses in their tenant
CREATE POLICY "facilitators_can_delete_baselines"
  ON public.tpa_business_baselines
  FOR DELETE
  USING (
    status = 'draft' AND
    EXISTS (
      SELECT 1 FROM public.tpa_tenant_memberships tm
      WHERE tm.user_id = auth.uid()
        AND tm.tenant_id = tpa_business_baselines.tenant_id
        AND tm.role IN ('facilitator', 'senior_reviewer', 'organization_admin', 'white_label_admin', 'system_admin')
        AND tm.status = 'active'
    )
  );

COMMENT ON TABLE public.tpa_business_baselines IS 'Baseline metrics snapshots for businesses';
COMMENT ON COLUMN public.tpa_business_baselines.data IS 'JSONB flexible baseline data structure';
COMMENT ON COLUMN public.tpa_business_baselines.categories IS 'Array of baseline category identifiers';
COMMENT ON COLUMN public.tpa_business_baselines.completeness_score IS 'Data completeness score (0-1)';
