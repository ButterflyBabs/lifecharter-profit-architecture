-- Migration: 009_tpa_businesses.sql
-- Phase 2: Business Profile - Core business entity

-- Businesses table: Core business entity
CREATE TABLE IF NOT EXISTS public.tpa_businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tpa_tenants(id) ON DELETE CASCADE,
  
  -- Core business info
  name TEXT NOT NULL,
  alias TEXT,
  organization_type TEXT NOT NULL CHECK (organization_type IN ('for_profit', 'nonprofit', 'social_enterprise', 'cooperative')),
  
  -- Industry and location
  industry TEXT,
  industry_other TEXT,
  location_city TEXT,
  location_state TEXT,
  location_country TEXT DEFAULT 'US',
  
  -- Operating history
  years_operating NUMERIC,
  founded_year INTEGER,
  
  -- Status and lifecycle
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  
  -- Goals and concerns (JSONB for flexibility)
  goals JSONB NOT NULL DEFAULT '[]'::jsonb,
  concerns JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS tpa_businesses_tenant_id_idx ON public.tpa_businesses(tenant_id);
CREATE INDEX IF NOT EXISTS tpa_businesses_status_idx ON public.tpa_businesses(status);
CREATE INDEX IF NOT EXISTS tpa_businesses_organization_type_idx ON public.tpa_businesses(organization_type);
CREATE INDEX IF NOT EXISTS tpa_businesses_name_idx ON public.tpa_businesses USING gin(name gin_trgm_ops);

-- Trigger for updated_at
CREATE TRIGGER tpa_businesses_updated_at
  BEFORE UPDATE ON public.tpa_businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.tpa_update_updated_at_column();

-- Enable RLS
ALTER TABLE public.tpa_businesses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Facilitators can view businesses in their tenant
CREATE POLICY "facilitators_can_view_businesses"
  ON public.tpa_businesses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tpa_tenant_memberships tm
      WHERE tm.user_id = auth.uid()
        AND tm.tenant_id = tpa_businesses.tenant_id
        AND tm.role IN ('facilitator', 'senior_reviewer', 'organization_admin', 'white_label_admin', 'system_admin')
        AND tm.status = 'active'
    )
  );

-- Facilitators can create businesses in their tenant
CREATE POLICY "facilitators_can_create_businesses"
  ON public.tpa_businesses
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tpa_tenant_memberships tm
      WHERE tm.user_id = auth.uid()
        AND tm.tenant_id = tpa_businesses.tenant_id
        AND tm.role IN ('facilitator', 'senior_reviewer', 'organization_admin', 'white_label_admin', 'system_admin')
        AND tm.status = 'active'
    )
  );

-- Facilitators can update businesses in their tenant
CREATE POLICY "facilitators_can_update_businesses"
  ON public.tpa_businesses
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.tpa_tenant_memberships tm
      WHERE tm.user_id = auth.uid()
        AND tm.tenant_id = tpa_businesses.tenant_id
        AND tm.role IN ('facilitator', 'senior_reviewer', 'organization_admin', 'white_label_admin', 'system_admin')
        AND tm.status = 'active'
    )
  );

-- Facilitators can delete businesses in their tenant
CREATE POLICY "facilitators_can_delete_businesses"
  ON public.tpa_businesses
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.tpa_tenant_memberships tm
      WHERE tm.user_id = auth.uid()
        AND tm.tenant_id = tpa_businesses.tenant_id
        AND tm.role IN ('facilitator', 'senior_reviewer', 'organization_admin', 'white_label_admin', 'system_admin')
        AND tm.status = 'active'
    )
  );

COMMENT ON TABLE public.tpa_businesses IS 'Core business entity for Profit Architecture';
COMMENT ON COLUMN public.tpa_businesses.organization_type IS 'for_profit, nonprofit, social_enterprise, or cooperative';
COMMENT ON COLUMN public.tpa_businesses.goals IS 'JSONB array of owner goals';
COMMENT ON COLUMN public.tpa_businesses.concerns IS 'JSONB array of owner concerns';
