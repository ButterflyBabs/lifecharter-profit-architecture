-- Migration: 021_tpa_assessment_runs.sql
-- Phase 4: Assessment Engine - Assessment instances with state machine

-- Assessment runs table: Assessment instances with state machine
CREATE TABLE IF NOT EXISTS public.tpa_assessment_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tpa_tenants(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.tpa_businesses(id) ON DELETE CASCADE,
  methodology_version_id UUID NOT NULL REFERENCES public.tpa_methodology_versions(id) ON DELETE CASCADE,
  
  -- Assessment identification
  assessment_number INTEGER NOT NULL, -- Sequential number per business
  title TEXT,
  description TEXT,
  
  -- Assessment mode
  mode TEXT NOT NULL DEFAULT 'comprehensive' CHECK (mode IN ('pulse', 'comprehensive', 'emergency')),
  
  -- State machine status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft',              -- Initial creation
    'in_progress',        -- Active assessment
    'awaiting_information', -- Missing data
    'submitted',          -- Ready for review
    'in_review',          -- Facilitator reviewing
    'approved',           -- Final approved
    'held',               -- Paused/blocked
    'superseded'          -- Replaced by newer
  )),
  
  -- Status tracking
  started_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  held_at TIMESTAMPTZ,
  held_reason TEXT,
  
  -- Assignment
  assigned_facilitator_id UUID REFERENCES auth.users(id),
  assigned_reviewer_id UUID REFERENCES auth.users(id),
  
  -- Scores (0-500 scale for precision, divide by 100 for display)
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 500),
  founder_capacity_score INTEGER CHECK (founder_capacity_score >= 0 AND founder_capacity_score <= 500),
  profitability_readiness_score INTEGER CHECK (profitability_readiness_score >= 0 AND profitability_readiness_score <= 500),
  growth_readiness_score INTEGER CHECK (growth_readiness_score >= 0 AND growth_readiness_score <= 500),
  
  -- Data confidence (0-100)
  data_confidence INTEGER DEFAULT 0 CHECK (data_confidence >= 0 AND data_confidence <= 100),
  
  -- Emergency mode flags
  is_emergency BOOLEAN DEFAULT false,
  emergency_triggered_at TIMESTAMPTZ,
  emergency_trigger_reason TEXT,
  emergency_stabilization_target TIMESTAMPTZ,
  emergency_resolved_at TIMESTAMPTZ,
  
  -- Pulse check specific
  is_preliminary BOOLEAN DEFAULT false,
  preliminary_for_assessment_id UUID REFERENCES public.tpa_assessment_runs(id),
  
  -- Superseded tracking
  superseded_by_assessment_id UUID REFERENCES public.tpa_assessment_runs(id),
  superseded_at TIMESTAMPTZ,
  superseded_reason TEXT,
  
  -- Classification results (cached)
  determined_pathway TEXT,
  determined_stage TEXT,
  
  -- Summary results (JSONB for flexibility)
  summary_strengths JSONB DEFAULT '[]'::jsonb,      -- Array of {component, description}
  summary_vulnerabilities JSONB DEFAULT '[]'::jsonb, -- Array of {component, description, severity}
  summary_next_actions JSONB DEFAULT '[]'::jsonb,    -- Array of {action, priority, timeframe}
  
  -- Report generation
  report_generated_at TIMESTAMPTZ,
  report_version INTEGER DEFAULT 1,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  
  -- Constraints
  CONSTRAINT unique_assessment_number_per_business UNIQUE (business_id, assessment_number)
);

-- Indexes
CREATE INDEX IF NOT EXISTS tpa_assessment_runs_tenant_id_idx ON public.tpa_assessment_runs(tenant_id);
CREATE INDEX IF NOT EXISTS tpa_assessment_runs_business_id_idx ON public.tpa_assessment_runs(business_id);
CREATE INDEX IF NOT EXISTS tpa_assessment_runs_methodology_version_id_idx ON public.tpa_assessment_runs(methodology_version_id);
CREATE INDEX IF NOT EXISTS tpa_assessment_runs_status_idx ON public.tpa_assessment_runs(status);
CREATE INDEX IF NOT EXISTS tpa_assessment_runs_mode_idx ON public.tpa_assessment_runs(mode);
CREATE INDEX IF NOT EXISTS tpa_assessment_runs_facilitator_idx ON public.tpa_assessment_runs(assigned_facilitator_id);
CREATE INDEX IF NOT EXISTS tpa_assessment_runs_reviewer_idx ON public.tpa_assessment_runs(assigned_reviewer_id);
CREATE INDEX IF NOT EXISTS tpa_assessment_runs_emergency_idx ON public.tpa_assessment_runs(is_emergency, emergency_triggered_at);
CREATE INDEX IF NOT EXISTS tpa_assessment_runs_active_idx ON public.tpa_assessment_runs(business_id, status) 
  WHERE status NOT IN ('approved', 'superseded');
CREATE INDEX IF NOT EXISTS tpa_assessment_runs_preliminary_idx ON public.tpa_assessment_runs(preliminary_for_assessment_id) 
  WHERE preliminary_for_assessment_id IS NOT NULL;

-- Trigger for updated_at
CREATE TRIGGER tpa_assessment_runs_updated_at
  BEFORE UPDATE ON public.tpa_assessment_runs
  FOR EACH ROW
  EXECUTE FUNCTION public.tpa_update_updated_at_column();

-- Function to auto-increment assessment number
CREATE OR REPLACE FUNCTION public.tpa_set_assessment_number()
RETURNS TRIGGER AS $$
DECLARE
  next_number INTEGER;
BEGIN
  SELECT COALESCE(MAX(assessment_number), 0) + 1
  INTO next_number
  FROM public.tpa_assessment_runs
  WHERE business_id = NEW.business_id;
  
  NEW.assessment_number := next_number;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-set assessment number on insert
CREATE TRIGGER tpa_assessment_runs_set_number
  BEFORE INSERT ON public.tpa_assessment_runs
  FOR EACH ROW
  EXECUTE FUNCTION public.tpa_set_assessment_number();

-- Function to validate state transitions
CREATE OR REPLACE FUNCTION public.tpa_validate_assessment_transition()
RETURNS TRIGGER AS $$
DECLARE
  allowed_transitions TEXT[];
BEGIN
  -- Define allowed transitions
  allowed_transitions := CASE OLD.status
    WHEN 'draft' THEN ARRAY['in_progress']
    WHEN 'in_progress' THEN ARRAY['awaiting_information', 'submitted']
    WHEN 'awaiting_information' THEN ARRAY['in_progress']
    WHEN 'submitted' THEN ARRAY['in_review', 'held']
    WHEN 'in_review' THEN ARRAY['approved', 'awaiting_information', 'held']
    WHEN 'approved' THEN ARRAY[]::TEXT[]  -- terminal
    WHEN 'held' THEN ARRAY['in_progress']
    WHEN 'superseded' THEN ARRAY[]::TEXT[]  -- terminal
    ELSE ARRAY[]::TEXT[]
  END;
  
  -- Allow same status (no-op updates)
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;
  
  -- Check if transition is allowed
  IF NOT (NEW.status = ANY(allowed_transitions)) THEN
    RAISE EXCEPTION 'Invalid status transition from % to %', OLD.status, NEW.status;
  END IF;
  
  -- Set timestamps based on new status
  NEW.started_at := CASE 
    WHEN NEW.status = 'in_progress' AND OLD.started_at IS NULL THEN now()
    ELSE NEW.started_at
  END;
  
  NEW.submitted_at := CASE 
    WHEN NEW.status = 'submitted' AND OLD.submitted_at IS NULL THEN now()
    ELSE NEW.submitted_at
  END;
  
  NEW.reviewed_at := CASE 
    WHEN NEW.status = 'in_review' AND OLD.reviewed_at IS NULL THEN now()
    ELSE NEW.reviewed_at
  END;
  
  NEW.approved_at := CASE 
    WHEN NEW.status = 'approved' AND OLD.approved_at IS NULL THEN now()
    ELSE NEW.approved_at
  END;
  
  NEW.held_at := CASE 
    WHEN NEW.status = 'held' AND OLD.held_at IS NULL THEN now()
    ELSE NEW.held_at
  END;
  
  NEW.completed_at := CASE 
    WHEN NEW.status IN ('approved', 'superseded') AND OLD.completed_at IS NULL THEN now()
    ELSE NEW.completed_at
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to validate state transitions
CREATE TRIGGER tpa_assessment_runs_validate_transition
  BEFORE UPDATE ON public.tpa_assessment_runs
  FOR EACH ROW
  EXECUTE FUNCTION public.tpa_validate_assessment_transition();

-- Enable RLS
ALTER TABLE public.tpa_assessment_runs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Business-scoped within tenant - facilitators can view assessments for their businesses
CREATE POLICY "facilitators_can_view_assessments"
  ON public.tpa_assessment_runs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tpa_tenant_memberships tm
      WHERE tm.user_id = auth.uid()
        AND tm.tenant_id = tpa_assessment_runs.tenant_id
        AND tm.role IN ('facilitator', 'senior_reviewer', 'organization_admin', 'white_label_admin', 'system_admin')
        AND tm.status = 'active'
    )
    OR
    -- Assigned facilitator can view
    assigned_facilitator_id = auth.uid()
    OR
    -- Assigned reviewer can view
    assigned_reviewer_id = auth.uid()
  );

-- Facilitators can create assessments
CREATE POLICY "facilitators_can_create_assessments"
  ON public.tpa_assessment_runs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tpa_tenant_memberships tm
      WHERE tm.user_id = auth.uid()
        AND tm.tenant_id = tpa_assessment_runs.tenant_id
        AND tm.role IN ('facilitator', 'senior_reviewer', 'organization_admin', 'white_label_admin', 'system_admin')
        AND tm.status = 'active'
    )
  );

-- Facilitators can update assessments they are assigned to or created
CREATE POLICY "facilitators_can_update_assessments"
  ON public.tpa_assessment_runs
  FOR UPDATE
  USING (
    (
      EXISTS (
        SELECT 1 FROM public.tpa_tenant_memberships tm
        WHERE tm.user_id = auth.uid()
          AND tm.tenant_id = tpa_assessment_runs.tenant_id
          AND tm.role IN ('facilitator', 'senior_reviewer', 'organization_admin', 'white_label_admin', 'system_admin')
          AND tm.status = 'active'
      )
      AND status NOT IN ('approved', 'superseded')
    )
    OR assigned_facilitator_id = auth.uid()
  );

-- Only admins can delete assessments
CREATE POLICY "admins_can_delete_assessments"
  ON public.tpa_assessment_runs
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.tpa_tenant_memberships tm
      WHERE tm.user_id = auth.uid()
        AND tm.tenant_id = tpa_assessment_runs.tenant_id
        AND tm.role IN ('organization_admin', 'white_label_admin', 'system_admin')
        AND tm.status = 'active'
    )
  );

-- Function to trigger emergency mode
CREATE OR REPLACE FUNCTION public.tpa_trigger_emergency_mode(
  p_assessment_id UUID,
  p_trigger_reason TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.tpa_assessment_runs
  SET is_emergency = true,
      mode = 'emergency',
      emergency_triggered_at = now(),
      emergency_trigger_reason = p_trigger_reason,
      emergency_stabilization_target = now() + interval '7 days',
      status = 'in_progress',
      updated_at = now()
  WHERE id = p_assessment_id
    AND NOT is_emergency;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to supersede an assessment
CREATE OR REPLACE FUNCTION public.tpa_supersede_assessment(
  p_old_assessment_id UUID,
  p_new_assessment_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.tpa_assessment_runs
  SET status = 'superseded',
      superseded_by_assessment_id = p_new_assessment_id,
      superseded_at = now(),
      superseded_reason = p_reason,
      updated_at = now()
  WHERE id = p_old_assessment_id
    AND status != 'superseded';
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE public.tpa_assessment_runs IS 'Assessment instances with state machine and scoring';
COMMENT ON COLUMN public.tpa_assessment_runs.mode IS 'pulse (quick), comprehensive (full), or emergency (crisis)';
COMMENT ON COLUMN public.tpa_assessment_runs.status IS 'State machine status with defined transitions';
COMMENT ON COLUMN public.tpa_assessment_runs.overall_score IS 'Overall assessment score (0-500, divide by 100 for 0.00-5.00 display)';
COMMENT ON COLUMN public.tpa_assessment_runs.data_confidence IS 'Confidence in data quality (0-100)';
COMMENT ON COLUMN public.tpa_assessment_runs.is_preliminary IS 'True for pulse checks that feed into comprehensive assessments';
