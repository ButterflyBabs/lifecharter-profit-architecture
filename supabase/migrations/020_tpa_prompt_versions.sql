-- Migration: 020_tpa_prompt_versions.sql
-- Phase 3: Methodology Framework - Versioned prompts with approval workflow

-- Prompt versions table: Versioned prompts with status and approval workflow
CREATE TABLE IF NOT EXISTS public.tpa_prompt_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES public.tpa_prompts(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tpa_tenants(id) ON DELETE CASCADE,
  
  -- Version info
  version TEXT NOT NULL,
  
  -- Template storage
  template TEXT NOT NULL,
  template_format TEXT NOT NULL DEFAULT 'handlebars' CHECK (template_format IN ('handlebars', 'jinja2', 'plain', 'markdown')),
  
  -- System prompt (if different from template)
  system_prompt TEXT,
  
  -- Model configuration
  model_config JSONB DEFAULT '{}',
  
  -- Status: draft, pending_review, active, rejected, archived
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'active', 'rejected', 'archived')),
  
  -- Approval workflow
  submitted_for_review_at TIMESTAMPTZ,
  submitted_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  review_notes TEXT,
  
  -- Change tracking
  change_summary TEXT,
  previous_version_id UUID REFERENCES public.tpa_prompt_versions(id),
  
  -- Usage tracking
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  
  -- Constraints
  CONSTRAINT unique_version_per_prompt UNIQUE (prompt_id, version)
);

-- Indexes
CREATE INDEX IF NOT EXISTS tpa_prompt_versions_prompt_id_idx ON public.tpa_prompt_versions(prompt_id);
CREATE INDEX IF NOT EXISTS tpa_prompt_versions_tenant_id_idx ON public.tpa_prompt_versions(tenant_id);
CREATE INDEX IF NOT EXISTS tpa_prompt_versions_status_idx ON public.tpa_prompt_versions(status);
CREATE INDEX IF NOT EXISTS tpa_prompt_versions_active_idx ON public.tpa_prompt_versions(prompt_id, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS tpa_prompt_versions_pending_idx ON public.tpa_prompt_versions(status, submitted_for_review_at) WHERE status = 'pending_review';

-- Trigger for updated_at
CREATE TRIGGER tpa_prompt_versions_updated_at
  BEFORE UPDATE ON public.tpa_prompt_versions
  FOR EACH ROW
  EXECUTE FUNCTION public.tpa_update_updated_at_column();

-- Enable RLS
ALTER TABLE public.tpa_prompt_versions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- All authenticated users can view active prompt versions
CREATE POLICY "users_can_view_prompt_versions"
  ON public.tpa_prompt_versions
  FOR SELECT
  USING (
    status = 'active'
    OR EXISTS (
      SELECT 1 FROM public.tpa_tenant_memberships tm
      WHERE tm.user_id = auth.uid()
        AND tm.tenant_id = tpa_prompt_versions.tenant_id
        AND tm.role IN ('facilitator', 'senior_reviewer', 'organization_admin', 'white_label_admin', 'system_admin')
        AND tm.status = 'active'
    )
  );

-- Facilitators can create draft versions
CREATE POLICY "facilitators_can_create_drafts"
  ON public.tpa_prompt_versions
  FOR INSERT
  WITH CHECK (
    status = 'draft'
    AND EXISTS (
      SELECT 1 FROM public.tpa_tenant_memberships tm
      WHERE tm.user_id = auth.uid()
        AND tm.tenant_id = tpa_prompt_versions.tenant_id
        AND tm.role IN ('facilitator', 'senior_reviewer', 'organization_admin', 'white_label_admin', 'system_admin')
        AND tm.status = 'active'
    )
  );

-- Facilitators can update their own drafts
CREATE POLICY "facilitators_can_update_own_drafts"
  ON public.tpa_prompt_versions
  FOR UPDATE
  USING (
    status = 'draft'
    AND created_by = auth.uid()
  );

-- Senior reviewers and admins can approve/reject
CREATE POLICY "reviewers_can_approve"
  ON public.tpa_prompt_versions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.tpa_tenant_memberships tm
      WHERE tm.user_id = auth.uid()
        AND tm.tenant_id = tpa_prompt_versions.tenant_id
        AND tm.role IN ('senior_reviewer', 'organization_admin', 'white_label_admin', 'system_admin')
        AND tm.status = 'active'
    )
  );

-- Only admins can delete
CREATE POLICY "admins_can_delete_versions"
  ON public.tpa_prompt_versions
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.tpa_tenant_memberships tm
      WHERE tm.user_id = auth.uid()
        AND tm.tenant_id = tpa_prompt_versions.tenant_id
        AND tm.role IN ('organization_admin', 'white_label_admin', 'system_admin')
        AND tm.status = 'active'
    )
  );

-- Function to ensure only one active version per prompt
CREATE OR REPLACE FUNCTION public.tpa_ensure_single_active_prompt_version()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'active' THEN
    UPDATE public.tpa_prompt_versions
    SET status = 'archived'
    WHERE prompt_id = NEW.prompt_id
      AND status = 'active'
      AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce single active version per prompt
CREATE TRIGGER tpa_single_active_prompt_version
  BEFORE INSERT OR UPDATE ON public.tpa_prompt_versions
  FOR EACH ROW
  EXECUTE FUNCTION public.tpa_ensure_single_active_prompt_version();

-- Function to submit prompt for review
CREATE OR REPLACE FUNCTION public.tpa_submit_prompt_for_review(
  p_version_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.tpa_prompt_versions
  SET status = 'pending_review',
      submitted_for_review_at = now(),
      submitted_by = p_user_id
  WHERE id = p_version_id
    AND status = 'draft';
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to approve/reject prompt version
CREATE OR REPLACE FUNCTION public.tpa_review_prompt_version(
  p_version_id UUID,
  p_reviewer_id UUID,
  p_approved BOOLEAN,
  p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.tpa_prompt_versions
  SET status = CASE WHEN p_approved THEN 'active' ELSE 'rejected' END,
      reviewed_at = now(),
      reviewed_by = p_reviewer_id,
      review_notes = p_notes
  WHERE id = p_version_id
    AND status = 'pending_review';
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE public.tpa_prompt_versions IS 'Versioned prompts with approval workflow';
COMMENT ON COLUMN public.tpa_prompt_versions.template IS 'The prompt template with variable placeholders';
COMMENT ON COLUMN public.tpa_prompt_versions.template_format IS 'Template format: handlebars, jinja2, plain, or markdown';
COMMENT ON COLUMN public.tpa_prompt_versions.model_config IS 'JSON configuration for AI model (temperature, max_tokens, etc.)';
COMMENT ON COLUMN public.tpa_prompt_versions.status IS 'draft, pending_review, active, rejected, or archived';
