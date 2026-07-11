-- Migration: 011_tpa_business_classifications.sql
-- Phase 2: Business Profile - Business classification history

-- Business classifications table: Tracks classification history
CREATE TABLE IF NOT EXISTS public.tpa_business_classifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.tpa_businesses(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tpa_tenants(id) ON DELETE CASCADE,
  
  -- Classification data
  organization_type TEXT NOT NULL CHECK (organization_type IN ('for_profit', 'nonprofit', 'social_enterprise', 'cooperative')),
  business_models TEXT[] NOT NULL DEFAULT '{}',
  customer_types TEXT[] NOT NULL DEFAULT '{}',
  stages TEXT[] NOT NULL DEFAULT '{}',
  
  -- Pathway selection
  primary_pathway TEXT NOT NULL CHECK (primary_pathway IN ('nonprofit', 'coaching_consulting', 'subscription_membership', 'ecommerce', 'service', 'hybrid')),
  secondary_pathways TEXT[] NOT NULL DEFAULT '{}',
  
  -- Confidence and evidence
  confidence NUMERIC NOT NULL DEFAULT 0 CHECK (confidence >= 0 AND confidence <= 1),
  evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Classification status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'superseded')),
  
  -- Classification metadata
  classified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  classified_by UUID REFERENCES auth.users(id),
  confirmed_at TIMESTAMPTZ,
  confirmed_by UUID REFERENCES auth.users(id),
  superseded_by UUID REFERENCES public.tpa_business_classifications(id),
  
  -- Notes
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS tpa_business_classifications_business_id_idx ON public.tpa_business_classifications(business_id);
CREATE INDEX IF NOT EXISTS tpa_business_classifications_tenant_id_idx ON public.tpa_business_classifications(tenant_id);
CREATE INDEX IF NOT EXISTS tpa_business_classifications_status_idx ON public.tpa_business_classifications(status);
CREATE INDEX IF NOT EXISTS tpa_business_classifications_primary_pathway_idx ON public.tpa_business_classifications(primary_pathway);
CREATE INDEX IF NOT EXISTS tpa_business_classifications_classified_at_idx ON public.tpa_business_classifications(classified_at);

-- Index for finding current (non-superseded) classifications
CREATE INDEX IF NOT EXISTS tpa_business_classifications_current_idx 
  ON public.tpa_business_classifications(business_id, classified_at DESC) 
  WHERE status != 'superseded';

-- Trigger for updated_at
CREATE TRIGGER tpa_business_classifications_updated_at
  BEFORE UPDATE ON public.tpa_business_classifications
  FOR EACH ROW
  EXECUTE FUNCTION public.tpa_update_updated_at_column();

-- Enable RLS
ALTER TABLE public.tpa_business_classifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Facilitators can view classifications for businesses they have access to
CREATE POLICY "facilitators_can_view_classifications"
  ON public.tpa_business_classifications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tpa_tenant_memberships tm
      WHERE tm.user_id = auth.uid()
        AND tm.tenant_id = tpa_business_classifications.tenant_id
        AND tm.role IN ('facilitator', 'senior_reviewer', 'organization_admin', 'white_label_admin', 'system_admin')
        AND tm.status = 'active'
    )
  );

-- Facilitators can create classifications for businesses in their tenant
CREATE POLICY "facilitators_can_create_classifications"
  ON public.tpa_business_classifications
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tpa_tenant_memberships tm
      WHERE tm.user_id = auth.uid()
        AND tm.tenant_id = tpa_business_classifications.tenant_id
        AND tm.role IN ('facilitator', 'senior_reviewer', 'organization_admin', 'white_label_admin', 'system_admin')
        AND tm.status = 'active'
    )
  );

-- Facilitators can update classifications for businesses in their tenant
CREATE POLICY "facilitators_can_update_classifications"
  ON public.tpa_business_classifications
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.tpa_tenant_memberships tm
      WHERE tm.user_id = auth.uid()
        AND tm.tenant_id = tpa_business_classifications.tenant_id
        AND tm.role IN ('facilitator', 'senior_reviewer', 'organization_admin', 'white_label_admin', 'system_admin')
        AND tm.status = 'active'
    )
  );

-- Facilitators can delete draft classifications for businesses in their tenant
CREATE POLICY "facilitators_can_delete_classifications"
  ON public.tpa_business_classifications
  FOR DELETE
  USING (
    status = 'draft' AND
    EXISTS (
      SELECT 1 FROM public.tpa_tenant_memberships tm
      WHERE tm.user_id = auth.uid()
        AND tm.tenant_id = tpa_business_classifications.tenant_id
        AND tm.role IN ('facilitator', 'senior_reviewer', 'organization_admin', 'white_label_admin', 'system_admin')
        AND tm.status = 'active'
    )
  );

COMMENT ON TABLE public.tpa_business_classifications IS 'Business classification history with pathway selection';
COMMENT ON COLUMN public.tpa_business_classifications.business_models IS 'Array of business model identifiers';
COMMENT ON COLUMN public.tpa_business_classifications.customer_types IS 'Array of customer type identifiers (b2b, b2c, etc.)';
COMMENT ON COLUMN public.tpa_business_classifications.stages IS 'Array of business stage identifiers';
COMMENT ON COLUMN public.tpa_business_classifications.primary_pathway IS 'Main Profit Architecture pathway';
COMMENT ON COLUMN public.tpa_business_classifications.secondary_pathways IS 'Additional applicable pathways';
COMMENT ON COLUMN public.tpa_business_classifications.confidence IS 'Classification confidence score (0-1)';
COMMENT ON COLUMN public.tpa_business_classifications.evidence IS 'JSONB array of evidence items supporting classification';
