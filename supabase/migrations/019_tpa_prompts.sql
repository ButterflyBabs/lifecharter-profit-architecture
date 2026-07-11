-- Migration: 019_tpa_prompts.sql
-- Phase 3: Methodology Framework - AI prompt registry

-- Prompts table: AI prompt registry
CREATE TABLE IF NOT EXISTS public.tpa_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tpa_tenants(id) ON DELETE CASCADE,
  
  -- Prompt identification
  key TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Prompt category
  category TEXT NOT NULL CHECK (category IN (
    'classification',
    'analysis',
    'synthesis',
    'generation',
    'advisory'
  )),
  
  -- Purpose and usage
  purpose TEXT,
  expected_inputs TEXT[],
  expected_outputs TEXT[],
  
  -- Input/output schema references (JSON Schema)
  input_schema JSONB,
  output_schema JSONB,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'deprecated')),
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  
  -- Constraints
  CONSTRAINT unique_prompt_key UNIQUE (key)
);

-- Indexes
CREATE INDEX IF NOT EXISTS tpa_prompts_tenant_id_idx ON public.tpa_prompts(tenant_id);
CREATE INDEX IF NOT EXISTS tpa_prompts_key_idx ON public.tpa_prompts(key);
CREATE INDEX IF NOT EXISTS tpa_prompts_category_idx ON public.tpa_prompts(category);
CREATE INDEX IF NOT EXISTS tpa_prompts_status_idx ON public.tpa_prompts(status);

-- Trigger for updated_at
CREATE TRIGGER tpa_prompts_updated_at
  BEFORE UPDATE ON public.tpa_prompts
  FOR EACH ROW
  EXECUTE FUNCTION public.tpa_update_updated_at_column();

-- Enable RLS
ALTER TABLE public.tpa_prompts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- All authenticated users can view active prompts
CREATE POLICY "users_can_view_prompts"
  ON public.tpa_prompts
  FOR SELECT
  USING (
    status = 'active'
    OR EXISTS (
      SELECT 1 FROM public.tpa_tenant_memberships tm
      WHERE tm.user_id = auth.uid()
        AND tm.tenant_id = tpa_prompts.tenant_id
        AND tm.role IN ('facilitator', 'senior_reviewer', 'organization_admin', 'white_label_admin', 'system_admin')
        AND tm.status = 'active'
    )
  );

-- Only admins can manage prompts
CREATE POLICY "admins_can_manage_prompts"
  ON public.tpa_prompts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.tpa_tenant_memberships tm
      WHERE tm.user_id = auth.uid()
        AND tm.tenant_id = tpa_prompts.tenant_id
        AND tm.role IN ('organization_admin', 'white_label_admin', 'system_admin')
        AND tm.status = 'active'
    )
  );

-- Function to get prompt by key with active version
CREATE OR REPLACE FUNCTION public.tpa_get_active_prompt(
  p_prompt_key TEXT
)
RETURNS TABLE (
  prompt_id UUID,
  prompt_key TEXT,
  prompt_name TEXT,
  template TEXT,
  version TEXT,
  version_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as prompt_id,
    p.key as prompt_key,
    p.name as prompt_name,
    pv.template,
    pv.version,
    pv.id as version_id
  FROM public.tpa_prompts p
  JOIN public.tpa_prompt_versions pv ON p.id = pv.prompt_id
  WHERE p.key = p_prompt_key
    AND p.status = 'active'
    AND pv.status = 'active'
  ORDER BY pv.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE public.tpa_prompts IS 'AI prompt registry for The Profit Architecture';
COMMENT ON COLUMN public.tpa_prompts.key IS 'Unique key for the prompt (e.g., classification_router)';
COMMENT ON COLUMN public.tpa_prompts.category IS 'classification, analysis, synthesis, generation, or advisory';
COMMENT ON COLUMN public.tpa_prompts.input_schema IS 'JSON Schema for expected inputs';
COMMENT ON COLUMN public.tpa_prompts.output_schema IS 'JSON Schema for expected outputs';
