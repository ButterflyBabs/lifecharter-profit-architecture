-- Migration: 026_tpa_score_overrides.sql
-- Phase 4: Assessment Engine - Override ledger for score changes

-- Score overrides table: Audit trail for score modifications
CREATE TABLE IF NOT EXISTS public.tpa_score_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  score_id UUID NOT NULL REFERENCES public.tpa_component_scores(id) ON DELETE CASCADE,
  assessment_id UUID NOT NULL REFERENCES public.tpa_assessment_runs(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tpa_tenants(id) ON DELETE CASCADE,
  
  -- Override identification
  override_number INTEGER NOT NULL, -- Sequential per score
  
  -- What was changed
  field_name TEXT NOT NULL CHECK (field_name IN (
    'raw_score',
    'weighted_score',
    'indicator_scores',
    'confidence_level',
    'confidence_score',
    'status'
  )),
  
  -- Old and new values
  old_value JSONB NOT NULL,
  new_value JSONB NOT NULL,
  
  -- Override reason
  override_reason TEXT NOT NULL,
  override_category TEXT CHECK (override_category IN (
    'data_correction',      -- Corrected incorrect data
    'methodology_change',   -- Methodology update
    'professional_judgment', -- Expert judgment override
    'client_request',       -- At client request
    'error_correction',     -- Fixed calculation error
    'review_feedback',      -- Based on review feedback
    'other'
  )),
  
  -- Supporting evidence
  supporting_evidence TEXT, -- Description of evidence
  evidence_ids UUID[],      -- References to evidence items
  
  -- Approval workflow
  requires_approval BOOLEAN DEFAULT false,
  approved BOOLEAN DEFAULT NULL, -- NULL = pending, true = approved, false = rejected
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  approver_notes TEXT,
  
  -- Who made the override
  overridden_by UUID NOT NULL REFERENCES auth.users(id),
  overridden_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Rollback tracking
  is_rolled_back BOOLEAN DEFAULT false,
  rolled_back_at TIMESTAMPTZ,
  rolled_back_by UUID REFERENCES auth.users(id),
  rollback_reason TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT unique_override_number_per_score UNIQUE (score_id, override_number)
);

-- Indexes
CREATE INDEX IF NOT EXISTS tpa_score_overrides_score_id_idx ON public.tpa_score_overrides(score_id);
CREATE INDEX IF NOT EXISTS tpa_score_overrides_assessment_id_idx ON public.tpa_score_overrides(assessment_id);
CREATE INDEX IF NOT EXISTS tpa_score_overrides_tenant_id_idx ON public.tpa_score_overrides(tenant_id);
CREATE INDEX IF NOT EXISTS tpa_score_overrides_field_name_idx ON public.tpa_score_overrides(field_name);
CREATE INDEX IF NOT EXISTS tpa_score_overrides_approved_idx ON public.tpa_score_overrides(approved);
CREATE INDEX IF NOT EXISTS tpa_score_overrides_pending_idx ON public.tpa_score_overrides(requires_approval, approved) 
  WHERE requires_approval = true AND approved IS NULL;
CREATE INDEX IF NOT EXISTS tpa_score_overrides_overridden_at_idx ON public.tpa_score_overrides(overridden_at);

-- Function to auto-increment override number
CREATE OR REPLACE FUNCTION public.tpa_set_override_number()
RETURNS TRIGGER AS $$
DECLARE
  next_number INTEGER;
BEGIN
  SELECT COALESCE(MAX(override_number), 0) + 1
  INTO next_number
  FROM public.tpa_score_overrides
  WHERE score_id = NEW.score_id;
  
  NEW.override_number := next_number;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-set override number on insert
CREATE TRIGGER tpa_score_overrides_set_number
  BEFORE INSERT ON public.tpa_score_overrides
  FOR EACH ROW
  EXECUTE FUNCTION public.tpa_set_override_number();

-- Function to apply score override
CREATE OR REPLACE FUNCTION public.tpa_apply_score_override(
  p_score_id UUID,
  p_field_name TEXT,
  p_new_value JSONB,
  p_override_reason TEXT,
  p_override_category TEXT,
  p_overridden_by UUID,
  p_requires_approval BOOLEAN DEFAULT false
)
RETURNS UUID AS $$
DECLARE
  v_override_id UUID;
  v_old_value JSONB;
  v_assessment_id UUID;
BEGIN
  -- Get current value
  EXECUTE format('SELECT to_jsonb(%I) FROM public.tpa_component_scores WHERE id = $1', p_field_name)
  INTO v_old_value
  USING p_score_id;
  
  -- Get assessment ID
  SELECT assessment_id INTO v_assessment_id
  FROM public.tpa_component_scores
  WHERE id = p_score_id;
  
  -- Create override record
  INSERT INTO public.tpa_score_overrides (
    score_id,
    assessment_id,
    field_name,
    old_value,
    new_value,
    override_reason,
    override_category,
    overridden_by,
    requires_approval
  )
  VALUES (
    p_score_id,
    v_assessment_id,
    p_field_name,
    v_old_value,
    p_new_value,
    p_override_reason,
    p_override_category,
    p_overridden_by,
    p_requires_approval
  )
  RETURNING id INTO v_override_id;
  
  -- If no approval required, apply immediately
  IF NOT p_requires_approval THEN
    EXECUTE format(
      'UPDATE public.tpa_component_scores SET %I = $1, updated_at = now() WHERE id = $2',
      p_field_name
    )
    USING p_new_value, p_score_id;
  END IF;
  
  RETURN v_override_id;
END;
$$ LANGUAGE plpgsql;

-- Function to approve/reject override
CREATE OR REPLACE FUNCTION public.tpa_review_override(
  p_override_id UUID,
  p_approver_id UUID,
  p_approved BOOLEAN,
  p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_override RECORD;
BEGIN
  -- Get override details
  SELECT * INTO v_override
  FROM public.tpa_score_overrides
  WHERE id = p_override_id
    AND requires_approval = true
    AND approved IS NULL;
  
  IF v_override IS NULL THEN
    RETURN false;
  END IF;
  
  -- Update override record
  UPDATE public.tpa_score_overrides
  SET approved = p_approved,
      approved_at = now(),
      approved_by = p_approver_id,
      approver_notes = p_notes
  WHERE id = p_override_id;
  
  -- If approved, apply the change
  IF p_approved THEN
    EXECUTE format(
      'UPDATE public.tpa_component_scores SET %I = $1, updated_at = now() WHERE id = $2',
      v_override.field_name
    )
    USING v_override.new_value, v_override.score_id;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function to rollback an override
CREATE OR REPLACE FUNCTION public.tpa_rollback_override(
  p_override_id UUID,
  p_rolled_back_by UUID,
  p_reason TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_override RECORD;
BEGIN
  -- Get override details
  SELECT * INTO v_override
  FROM public.tpa_score_overrides
  WHERE id = p_override_id
    AND is_rolled_back = false;
  
  IF v_override IS NULL THEN
    RETURN false;
  END IF;
  
  -- Revert the change if it was applied
  IF v_override.approved = true OR v_override.requires_approval = false THEN
    EXECUTE format(
      'UPDATE public.tpa_component_scores SET %I = $1, updated_at = now() WHERE id = $2',
      v_override.field_name
    )
    USING v_override.old_value, v_override.score_id;
  END IF;
  
  -- Mark override as rolled back
  UPDATE public.tpa_score_overrides
  SET is_rolled_back = true,
      rolled_back_at = now(),
      rolled_back_by = p_rolled_back_by,
      rollback_reason = p_reason
  WHERE id = p_override_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE public.tpa_score_overrides ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Facilitators can view overrides for their assessments
CREATE POLICY "facilitators_can_view_overrides"
  ON public.tpa_score_overrides
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tpa_assessment_runs ar
      WHERE ar.id = tpa_score_overrides.assessment_id
        AND (
          EXISTS (
            SELECT 1 FROM public.tpa_tenant_memberships tm
            WHERE tm.user_id = auth.uid()
              AND tm.tenant_id = ar.tenant_id
              AND tm.role IN ('facilitator', 'senior_reviewer', 'organization_admin', 'white_label_admin', 'system_admin')
              AND tm.status = 'active'
          )
          OR ar.assigned_facilitator_id = auth.uid()
          OR ar.assigned_reviewer_id = auth.uid()
        )
    )
  );

-- Facilitators can create overrides
CREATE POLICY "facilitators_can_create_overrides"
  ON public.tpa_score_overrides
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tpa_assessment_runs ar
      JOIN public.tpa_tenant_memberships tm ON ar.tenant_id = tm.tenant_id
      WHERE ar.id = tpa_score_overrides.assessment_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('facilitator', 'senior_reviewer', 'organization_admin', 'white_label_admin', 'system_admin')
        AND tm.status = 'active'
        AND ar.status NOT IN ('approved', 'superseded')
    )
  );

-- Only admins can update/delete overrides
CREATE POLICY "admins_can_manage_overrides"
  ON public.tpa_score_overrides
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.tpa_assessment_runs ar
      JOIN public.tpa_tenant_memberships tm ON ar.tenant_id = tm.tenant_id
      WHERE ar.id = tpa_score_overrides.assessment_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('organization_admin', 'white_label_admin', 'system_admin')
        AND tm.status = 'active'
    )
  );

-- View for override audit trail
CREATE OR REPLACE VIEW public.tpa_score_override_audit AS
SELECT 
  so.id as override_id,
  so.score_id,
  so.assessment_id,
  ar.assessment_number,
  b.name as business_name,
  so.field_name,
  so.old_value,
  so.new_value,
  so.override_reason,
  so.override_category,
  so.requires_approval,
  so.approved,
  so.approved_at,
  approver.email as approved_by_email,
  so.overridden_at,
  overrider.email as overridden_by_email,
  so.is_rolled_back,
  so.rolled_back_at
FROM public.tpa_score_overrides so
JOIN public.tpa_component_scores cs ON so.score_id = cs.id
JOIN public.tpa_assessment_runs ar ON so.assessment_id = ar.id
JOIN public.tpa_businesses b ON ar.business_id = b.id
LEFT JOIN auth.users overrider ON so.overridden_by = overrider.id
LEFT JOIN auth.users approver ON so.approved_by = approver.id
ORDER BY so.overridden_at DESC;

COMMENT ON TABLE public.tpa_score_overrides IS 'Audit trail for score modifications with approval workflow';
COMMENT ON COLUMN public.tpa_score_overrides.field_name IS 'Which field was overridden: raw_score, weighted_score, indicator_scores, confidence_level, confidence_score, status';
COMMENT ON COLUMN public.tpa_score_overrides.override_category IS 'Reason category: data_correction, methodology_change, professional_judgment, client_request, error_correction, review_feedback, other';
COMMENT ON COLUMN public.tpa_score_overrides.requires_approval IS 'Whether this override requires senior reviewer approval';
COMMENT ON COLUMN public.tpa_score_overrides.approved IS 'NULL = pending, true = approved, false = rejected';
