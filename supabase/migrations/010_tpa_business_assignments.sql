-- Migration: 010_tpa_business_assignments.sql
-- Phase 2: Business Profile - Facilitator/business relationships

-- Business assignments table: Links facilitators to businesses
CREATE TABLE IF NOT EXISTS public.tpa_business_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.tpa_businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tpa_tenants(id) ON DELETE CASCADE,
  
  -- Assignment role
  role TEXT NOT NULL CHECK (role IN ('primary_facilitator', 'secondary_facilitator', 'reviewer', 'observer')),
  
  -- Assignment status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
  
  -- Assignment dates
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  assigned_by UUID REFERENCES auth.users(id),
  completed_at TIMESTAMPTZ,
  
  -- Notes
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS tpa_business_assignments_business_id_idx ON public.tpa_business_assignments(business_id);
CREATE INDEX IF NOT EXISTS tpa_business_assignments_user_id_idx ON public.tpa_business_assignments(user_id);
CREATE INDEX IF NOT EXISTS tpa_business_assignments_tenant_id_idx ON public.tpa_business_assignments(tenant_id);
CREATE INDEX IF NOT EXISTS tpa_business_assignments_status_idx ON public.tpa_business_assignments(status);
CREATE INDEX IF NOT EXISTS tpa_business_assignments_role_idx ON public.tpa_business_assignments(role);

-- Unique constraint: One primary facilitator per business
CREATE UNIQUE INDEX IF NOT EXISTS tpa_business_assignments_primary_facilitator_idx 
  ON public.tpa_business_assignments(business_id) 
  WHERE role = 'primary_facilitator' AND status = 'active';

-- Trigger for updated_at
CREATE TRIGGER tpa_business_assignments_updated_at
  BEFORE UPDATE ON public.tpa_business_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.tpa_update_updated_at_column();

-- Enable RLS
ALTER TABLE public.tpa_business_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Facilitators can view assignments for businesses they have access to
CREATE POLICY "facilitators_can_view_assignments"
  ON public.tpa_business_assignments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tpa_tenant_memberships tm
      WHERE tm.user_id = auth.uid()
        AND tm.tenant_id = tpa_business_assignments.tenant_id
        AND tm.role IN ('facilitator', 'senior_reviewer', 'organization_admin', 'white_label_admin', 'system_admin')
        AND tm.status = 'active'
    )
  );

-- Facilitators can create assignments for businesses in their tenant
CREATE POLICY "facilitators_can_create_assignments"
  ON public.tpa_business_assignments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tpa_tenant_memberships tm
      WHERE tm.user_id = auth.uid()
        AND tm.tenant_id = tpa_business_assignments.tenant_id
        AND tm.role IN ('facilitator', 'senior_reviewer', 'organization_admin', 'white_label_admin', 'system_admin')
        AND tm.status = 'active'
    )
  );

-- Facilitators can update assignments for businesses in their tenant
CREATE POLICY "facilitators_can_update_assignments"
  ON public.tpa_business_assignments
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.tpa_tenant_memberships tm
      WHERE tm.user_id = auth.uid()
        AND tm.tenant_id = tpa_business_assignments.tenant_id
        AND tm.role IN ('facilitator', 'senior_reviewer', 'organization_admin', 'white_label_admin', 'system_admin')
        AND tm.status = 'active'
    )
  );

-- Facilitators can delete assignments for businesses in their tenant
CREATE POLICY "facilitators_can_delete_assignments"
  ON public.tpa_business_assignments
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.tpa_tenant_memberships tm
      WHERE tm.user_id = auth.uid()
        AND tm.tenant_id = tpa_business_assignments.tenant_id
        AND tm.role IN ('facilitator', 'senior_reviewer', 'organization_admin', 'white_label_admin', 'system_admin')
        AND tm.status = 'active'
    )
  );

COMMENT ON TABLE public.tpa_business_assignments IS 'Links facilitators to businesses with role-based assignments';
COMMENT ON COLUMN public.tpa_business_assignments.role IS 'primary_facilitator, secondary_facilitator, reviewer, or observer';
