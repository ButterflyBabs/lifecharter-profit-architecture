-- Migration: 027_tpa_critical_gates.sql
-- Phase 4: Assessment Engine - Critical gates that block growth

-- Critical gates table: Issues that must be resolved before growth
CREATE TABLE IF NOT EXISTS public.tpa_critical_gates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES public.tpa_assessment_runs(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tpa_tenants(id) ON DELETE CASCADE,
  
  -- Gate identification
  gate_number INTEGER NOT NULL, -- Sequential per assessment
  gate_key TEXT NOT NULL, -- e.g., 'cash_runway', 'founder_capacity'
  title TEXT NOT NULL,
  description TEXT,
  
  -- Gate classification
  gate_category TEXT NOT NULL CHECK (gate_category IN (
    'financial',           -- Financial issues
    'operational',         -- Operations issues
    'legal',              -- Legal/compliance issues
    'founder',            -- Founder capacity issues
    'market',             -- Market/product issues
    'team',               -- Team/HR issues
    'strategic',          -- Strategic issues
    'other'
  )),
  
  -- Severity
  severity TEXT NOT NULL CHECK (severity IN (
    'critical',           -- Blocks all growth - immediate action required
    'high',               -- Significant constraint - action required soon
    'medium',             -- Moderate concern - monitor and address
    'low'                 -- Minor concern - address when convenient
  )),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN (
    'open',               -- Issue identified, not addressed
    'contained',          -- Temporary measures in place
    'resolved',           -- Fully resolved
    'accepted',           -- Risk accepted by leadership
    'not_applicable'      -- No longer applicable
  )),
  
  -- Detection
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  detected_by UUID REFERENCES auth.users(id),
  detection_method TEXT CHECK (detection_method IN (
    'automatic',          -- System detected
    'assessment_response', -- From assessment answers
    'facilitator_review', -- Facilitator identified
    'client_reported',    -- Client reported
    'calculation',        -- Derived from calculations
    'external_source'     -- External notification
  )),
  detection_trigger TEXT, -- What triggered the detection
  
  -- Details
  impact_description TEXT, -- How this impacts the business
  business_impact TEXT, -- Financial/operational impact
  resolution_criteria TEXT, -- What needs to happen to resolve
  
  -- Assignment
  assigned_to UUID REFERENCES auth.users(id),
  owner_id UUID REFERENCES auth.users(id), -- Business owner responsible
  
  -- Timeline
  target_resolution_date TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  resolution_notes TEXT,
  
  -- Containment (if temporarily contained)
  containment_measures TEXT,
  containment_expires_at TIMESTAMPTZ,
  
  -- Evidence
  evidence_ids UUID[], -- References to evidence items
  related_response_ids UUID[], -- Related assessment responses
  
  -- Blocking behavior
  blocks_growth BOOLEAN DEFAULT true,
  blocks_assessment_submission BOOLEAN DEFAULT false,
  emergency_escalation BOOLEAN DEFAULT false,
  
  -- Linked gates
  parent_gate_id UUID REFERENCES public.tpa_critical_gates(id),
  related_gate_ids UUID[],
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  
  -- Constraints
  CONSTRAINT unique_gate_key_per_assessment UNIQUE (assessment_id, gate_key)
);

-- Indexes
CREATE INDEX IF NOT EXISTS tpa_critical_gates_assessment_id_idx ON public.tpa_critical_gates(assessment_id);
CREATE INDEX IF NOT EXISTS tpa_critical_gates_tenant_id_idx ON public.tpa_critical_gates(tenant_id);
CREATE INDEX IF NOT EXISTS tpa_critical_gates_severity_idx ON public.tpa_critical_gates(severity);
CREATE INDEX IF NOT EXISTS tpa_critical_gates_status_idx ON public.tpa_critical_gates(status);
CREATE INDEX IF NOT EXISTS tpa_critical_gates_category_idx ON public.tpa_critical_gates(gate_category);
CREATE INDEX IF NOT EXISTS tpa_critical_gates_assigned_idx ON public.tpa_critical_gates(assigned_to);
CREATE INDEX IF NOT EXISTS tpa_critical_gates_target_date_idx ON public.tpa_critical_gates(target_resolution_date);
CREATE INDEX IF NOT EXISTS tpa_critical_gates_open_idx ON public.tpa_critical_gates(assessment_id, status) 
  WHERE status IN ('open', 'contained');
CREATE INDEX IF NOT EXISTS tpa_critical_gates_blocking_idx ON public.tpa_critical_gates(blocks_growth, severity) 
  WHERE blocks_growth = true AND status IN ('open', 'contained');
CREATE INDEX IF NOT EXISTS tpa_critical_gates_emergency_idx ON public.tpa_critical_gates(emergency_escalation) 
  WHERE emergency_escalation = true;

-- Trigger for updated_at
CREATE TRIGGER tpa_critical_gates_updated_at
  BEFORE UPDATE ON public.tpa_critical_gates
  FOR EACH ROW
  EXECUTE FUNCTION public.tpa_update_updated_at_column();

-- Function to auto-increment gate number
CREATE OR REPLACE FUNCTION public.tpa_set_gate_number()
RETURNS TRIGGER AS $$
DECLARE
  next_number INTEGER;
BEGIN
  SELECT COALESCE(MAX(gate_number), 0) + 1
  INTO next_number
  FROM public.tpa_critical_gates
  WHERE assessment_id = NEW.assessment_id;
  
  NEW.gate_number := next_number;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-set gate number on insert
CREATE TRIGGER tpa_critical_gates_set_number
  BEFORE INSERT ON public.tpa_critical_gates
  FOR EACH ROW
  EXECUTE FUNCTION public.tpa_set_gate_number();

-- Function to validate status transitions
CREATE OR REPLACE FUNCTION public.tpa_validate_gate_transition()
RETURNS TRIGGER AS $$
BEGIN
  -- Set resolved timestamp when status changes to resolved
  IF NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
    NEW.resolved_at := now();
  END IF;
  
  -- Clear resolved timestamp if reopened
  IF NEW.status IN ('open', 'contained') AND OLD.status = 'resolved' THEN
    NEW.resolved_at := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to validate gate transitions
CREATE TRIGGER tpa_critical_gates_validate_transition
  BEFORE UPDATE ON public.tpa_critical_gates
  FOR EACH ROW
  EXECUTE FUNCTION public.tpa_validate_gate_transition();

-- Enable RLS
ALTER TABLE public.tpa_critical_gates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- All assigned users can view gates
CREATE POLICY "users_can_view_gates"
  ON public.tpa_critical_gates
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tpa_assessment_runs ar
      WHERE ar.id = tpa_critical_gates.assessment_id
        AND (
          EXISTS (
            SELECT 1 FROM public.tpa_tenant_memberships tm
            WHERE tm.user_id = auth.uid()
              AND tm.tenant_id = ar.tenant_id
              AND tm.status = 'active'
          )
          OR ar.assigned_facilitator_id = auth.uid()
          OR ar.assigned_reviewer_id = auth.uid()
          OR tpa_critical_gates.assigned_to = auth.uid()
          OR tpa_critical_gates.owner_id = auth.uid()
        )
    )
  );

-- Facilitators can create gates
CREATE POLICY "facilitators_can_create_gates"
  ON public.tpa_critical_gates
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tpa_assessment_runs ar
      JOIN public.tpa_tenant_memberships tm ON ar.tenant_id = tm.tenant_id
      WHERE ar.id = tpa_critical_gates.assessment_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('facilitator', 'senior_reviewer', 'organization_admin', 'white_label_admin', 'system_admin')
        AND tm.status = 'active'
    )
  );

-- Facilitators can update gates
CREATE POLICY "facilitators_can_update_gates"
  ON public.tpa_critical_gates
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.tpa_assessment_runs ar
      JOIN public.tpa_tenant_memberships tm ON ar.tenant_id = tm.tenant_id
      WHERE ar.id = tpa_critical_gates.assessment_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('facilitator', 'senior_reviewer', 'organization_admin', 'white_label_admin', 'system_admin')
        AND tm.status = 'active'
    )
    OR assigned_to = auth.uid()
  );

-- Only admins can delete gates
CREATE POLICY "admins_can_delete_gates"
  ON public.tpa_critical_gates
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.tpa_assessment_runs ar
      JOIN public.tpa_tenant_memberships tm ON ar.tenant_id = tm.tenant_id
      WHERE ar.id = tpa_critical_gates.assessment_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('organization_admin', 'white_label_admin', 'system_admin')
        AND tm.status = 'active'
    )
  );

-- Function to create a critical gate
CREATE OR REPLACE FUNCTION public.tpa_create_critical_gate(
  p_assessment_id UUID,
  p_gate_key TEXT,
  p_title TEXT,
  p_description TEXT,
  p_category TEXT,
  p_severity TEXT,
  p_impact_description TEXT,
  p_resolution_criteria TEXT,
  p_detection_method TEXT,
  p_detection_trigger TEXT DEFAULT NULL,
  p_created_by UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_gate_id UUID;
BEGIN
  INSERT INTO public.tpa_critical_gates (
    assessment_id,
    gate_key,
    title,
    description,
    gate_category,
    severity,
    impact_description,
    resolution_criteria,
    detection_method,
    detection_trigger,
    created_by,
    detected_by,
    blocks_growth,
    blocks_assessment_submission
  )
  VALUES (
    p_assessment_id,
    p_gate_key,
    p_title,
    p_description,
    p_category,
    p_severity,
    p_impact_description,
    p_resolution_criteria,
    p_detection_method,
    p_detection_trigger,
    p_created_by,
    p_created_by,
    p_severity = 'critical',
    p_severity IN ('critical', 'high')
  )
  RETURNING id INTO v_gate_id;
  
  RETURN v_gate_id;
END;
$$ LANGUAGE plpgsql;

-- Function to resolve a critical gate
CREATE OR REPLACE FUNCTION public.tpa_resolve_critical_gate(
  p_gate_id UUID,
  p_resolved_by UUID,
  p_resolution_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.tpa_critical_gates
  SET status = 'resolved',
      resolved_at = now(),
      resolved_by = p_resolved_by,
      resolution_notes = p_resolution_notes,
      blocks_growth = false,
      blocks_assessment_submission = false,
      updated_at = now()
  WHERE id = p_gate_id
    AND status IN ('open', 'contained');
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to check if assessment has blocking gates
CREATE OR REPLACE FUNCTION public.tpa_has_blocking_gates(
  p_assessment_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_has_blocking BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM public.tpa_critical_gates
    WHERE assessment_id = p_assessment_id
      AND blocks_growth = true
      AND status IN ('open', 'contained')
  ) INTO v_has_blocking;
  
  RETURN v_has_blocking;
END;
$$ LANGUAGE plpgsql;

-- Function to get gate summary for assessment
CREATE OR REPLACE FUNCTION public.tpa_get_gate_summary(
  p_assessment_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_summary JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_gates', COUNT(*),
    'by_severity', jsonb_object_agg(severity, cnt),
    'by_status', jsonb_object_agg(status, cnt_status),
    'blocking_gates', COUNT(*) FILTER (WHERE blocks_growth = true AND status IN ('open', 'contained')),
    'critical_open', COUNT(*) FILTER (WHERE severity = 'critical' AND status = 'open'),
    'overdue', COUNT(*) FILTER (WHERE target_resolution_date < now() AND status IN ('open', 'contained'))
  )
  INTO v_summary
  FROM (
    SELECT 
      severity,
      COUNT(*) as cnt,
      status,
      COUNT(*) as cnt_status
    FROM public.tpa_critical_gates
    WHERE assessment_id = p_assessment_id
    GROUP BY severity, status
  ) sub;
  
  RETURN COALESCE(v_summary, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql;

-- View for gate dashboard
CREATE OR REPLACE VIEW public.tpa_critical_gates_dashboard AS
SELECT 
  cg.id,
  cg.assessment_id,
  ar.assessment_number,
  b.name as business_name,
  b.id as business_id,
  cg.gate_number,
  cg.gate_key,
  cg.title,
  cg.gate_category,
  cg.severity,
  cg.status,
  cg.blocks_growth,
  cg.blocks_assessment_submission,
  cg.emergency_escalation,
  cg.target_resolution_date,
  cg.detected_at,
  assignee.email as assigned_to_email,
  owner.email as owner_email,
  CASE 
    WHEN cg.target_resolution_date < now() AND cg.status IN ('open', 'contained') THEN true
    ELSE false
  END as is_overdue
FROM public.tpa_critical_gates cg
JOIN public.tpa_assessment_runs ar ON cg.assessment_id = ar.id
JOIN public.tpa_businesses b ON ar.business_id = b.id
LEFT JOIN auth.users assignee ON cg.assigned_to = assignee.id
LEFT JOIN auth.users owner ON cg.owner_id = owner.id
WHERE cg.status IN ('open', 'contained')
ORDER BY 
  CASE cg.severity 
    WHEN 'critical' THEN 1 
    WHEN 'high' THEN 2 
    WHEN 'medium' THEN 3 
    ELSE 4 
  END,
  cg.target_resolution_date NULLS LAST;

COMMENT ON TABLE public.tpa_critical_gates IS 'Critical gates that block growth until resolved';
COMMENT ON COLUMN public.tpa_critical_gates.severity IS 'critical, high, medium, or low';
COMMENT ON COLUMN public.tpa_critical_gates.status IS 'open, contained, resolved, accepted, or not_applicable';
COMMENT ON COLUMN public.tpa_critical_gates.blocks_growth IS 'Whether this gate blocks growth initiatives';
COMMENT ON COLUMN public.tpa_critical_gates.blocks_assessment_submission IS 'Whether this gate blocks assessment submission';
COMMENT ON COLUMN public.tpa_critical_gates.emergency_escalation IS 'Whether this gate triggered emergency mode';
