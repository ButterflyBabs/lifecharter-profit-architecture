-- Migration: 015_tpa_methodology_versions.sql
-- Phase 3: Methodology Framework - Versioned methodology releases

-- Methodology versions table: Tracks versioned methodology releases
CREATE TABLE IF NOT EXISTS public.tpa_methodology_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tpa_tenants(id) ON DELETE CASCADE,
  
  -- Version info
  version TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Status: draft, active, retired
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'retired')),
  
  -- Effective dates
  effective_from DATE NOT NULL,
  effective_until DATE,
  
  -- Change notes
  release_notes TEXT,
  changes_summary TEXT,
  breaking_changes BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  
  -- Constraints
  CONSTRAINT unique_version_per_tenant UNIQUE (tenant_id, version),
  CONSTRAINT effective_dates_check CHECK (effective_until IS NULL OR effective_until > effective_from)
);

-- Indexes
CREATE INDEX IF NOT EXISTS tpa_methodology_versions_tenant_id_idx ON public.tpa_methodology_versions(tenant_id);
CREATE INDEX IF NOT EXISTS tpa_methodology_versions_status_idx ON public.tpa_methodology_versions(status);
CREATE INDEX IF NOT EXISTS tpa_methodology_versions_effective_from_idx ON public.tpa_methodology_versions(effective_from);
CREATE INDEX IF NOT EXISTS tpa_methodology_versions_active_idx ON public.tpa_methodology_versions(status, effective_from) WHERE status = 'active';

-- Trigger for updated_at
CREATE TRIGGER tpa_methodology_versions_updated_at
  BEFORE UPDATE ON public.tpa_methodology_versions
  FOR EACH ROW
  EXECUTE FUNCTION public.tpa_update_updated_at_column();

-- Enable RLS
ALTER TABLE public.tpa_methodology_versions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- All authenticated users can view active methodology versions
CREATE POLICY "users_can_view_active_methodologies"
  ON public.tpa_methodology_versions
  FOR SELECT
  USING (
    status = 'active'
    OR EXISTS (
      SELECT 1 FROM public.tpa_tenant_memberships tm
      WHERE tm.user_id = auth.uid()
        AND tm.tenant_id = tpa_methodology_versions.tenant_id
        AND tm.role IN ('facilitator', 'senior_reviewer', 'organization_admin', 'white_label_admin', 'system_admin')
        AND tm.status = 'active'
    )
  );

-- Only admins can manage methodology versions
CREATE POLICY "admins_can_manage_methodologies"
  ON public.tpa_methodology_versions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.tpa_tenant_memberships tm
      WHERE tm.user_id = auth.uid()
        AND tm.tenant_id = tpa_methodology_versions.tenant_id
        AND tm.role IN ('organization_admin', 'white_label_admin', 'system_admin')
        AND tm.status = 'active'
    )
  );

-- Function to ensure only one active methodology version per tenant
CREATE OR REPLACE FUNCTION public.tpa_ensure_single_active_methodology()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'active' THEN
    UPDATE public.tpa_methodology_versions
    SET status = 'retired',
        effective_until = NEW.effective_from - INTERVAL '1 day'
    WHERE tenant_id = NEW.tenant_id
      AND status = 'active'
      AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce single active methodology
CREATE TRIGGER tpa_single_active_methodology
  BEFORE INSERT OR UPDATE ON public.tpa_methodology_versions
  FOR EACH ROW
  EXECUTE FUNCTION public.tpa_ensure_single_active_methodology();

COMMENT ON TABLE public.tpa_methodology_versions IS 'Versioned methodology releases for The Profit Architecture';
COMMENT ON COLUMN public.tpa_methodology_versions.status IS 'draft, active, or retired';
COMMENT ON COLUMN public.tpa_methodology_versions.breaking_changes IS 'Whether this version introduces breaking changes from previous';
