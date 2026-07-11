-- Migration: 013_tpa_business_team_members.sql
-- Phase 2: Business Profile - Team composition

-- Business team members table: Tracks team composition
CREATE TABLE IF NOT EXISTS public.tpa_business_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.tpa_businesses(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tpa_tenants(id) ON DELETE CASCADE,
  
  -- Team member info
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  role_category TEXT CHECK (role_category IN ('owner', 'leadership', 'operations', 'sales', 'marketing', 'finance', 'technical', 'support', 'other')),
  
  -- Capacity and cost
  capacity_hours NUMERIC,
  capacity_type TEXT CHECK (capacity_type IN ('full_time', 'part_time', 'contract', 'variable')),
  cost_per_hour NUMERIC,
  cost_per_month NUMERIC,
  
  -- Employment details
  employment_type TEXT CHECK (employment_type IN ('employee', 'contractor', 'owner', 'volunteer', 'intern')),
  start_date DATE,
  
  -- Contact info
  email TEXT,
  phone TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'former')),
  
  -- Notes
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS tpa_business_team_members_business_id_idx ON public.tpa_business_team_members(business_id);
CREATE INDEX IF NOT EXISTS tpa_business_team_members_tenant_id_idx ON public.tpa_business_team_members(tenant_id);
CREATE INDEX IF NOT EXISTS tpa_business_team_members_status_idx ON public.tpa_business_team_members(status);
CREATE INDEX IF NOT EXISTS tpa_business_team_members_role_category_idx ON public.tpa_business_team_members(role_category);

-- Trigger for updated_at
CREATE TRIGGER tpa_business_team_members_updated_at
  BEFORE UPDATE ON public.tpa_business_team_members
  FOR EACH ROW
  EXECUTE FUNCTION public.tpa_update_updated_at_column();

-- Enable RLS
ALTER TABLE public.tpa_business_team_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Facilitators can view team members for businesses they have access to
CREATE POLICY "facilitators_can_view_team_members"
  ON public.tpa_business_team_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tpa_tenant_memberships tm
      WHERE tm.user_id = auth.uid()
        AND tm.tenant_id = tpa_business_team_members.tenant_id
        AND tm.role IN ('facilitator', 'senior_reviewer', 'organization_admin', 'white_label_admin', 'system_admin')
        AND tm.status = 'active'
    )
  );

-- Facilitators can create team members for businesses in their tenant
CREATE POLICY "facilitators_can_create_team_members"
  ON public.tpa_business_team_members
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tpa_tenant_memberships tm
      WHERE tm.user_id = auth.uid()
        AND tm.tenant_id = tpa_business_team_members.tenant_id
        AND tm.role IN ('facilitator', 'senior_reviewer', 'organization_admin', 'white_label_admin', 'system_admin')
        AND tm.status = 'active'
    )
  );

-- Facilitators can update team members for businesses in their tenant
CREATE POLICY "facilitators_can_update_team_members"
  ON public.tpa_business_team_members
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.tpa_tenant_memberships tm
      WHERE tm.user_id = auth.uid()
        AND tm.tenant_id = tpa_business_team_members.tenant_id
        AND tm.role IN ('facilitator', 'senior_reviewer', 'organization_admin', 'white_label_admin', 'system_admin')
        AND tm.status = 'active'
    )
  );

-- Facilitators can delete team members for businesses in their tenant
CREATE POLICY "facilitators_can_delete_team_members"
  ON public.tpa_business_team_members
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.tpa_tenant_memberships tm
      WHERE tm.user_id = auth.uid()
        AND tm.tenant_id = tpa_business_team_members.tenant_id
        AND tm.role IN ('facilitator', 'senior_reviewer', 'organization_admin', 'white_label_admin', 'system_admin')
        AND tm.status = 'active'
    )
  );

COMMENT ON TABLE public.tpa_business_team_members IS 'Team composition for businesses';
COMMENT ON COLUMN public.tpa_business_team_members.role_category IS 'Categorized role: owner, leadership, operations, sales, marketing, finance, technical, support, other';
COMMENT ON COLUMN public.tpa_business_team_members.capacity_hours IS 'Weekly capacity in hours';
COMMENT ON COLUMN public.tpa_business_team_members.capacity_type IS 'full_time, part_time, contract, or variable';
COMMENT ON COLUMN public.tpa_business_team_members.employment_type IS 'employee, contractor, owner, volunteer, or intern';
