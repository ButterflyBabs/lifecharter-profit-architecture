-- Migration: 022_tpa_assessment_sections.sql
-- Phase 4: Assessment Engine - Section progress tracking

-- Assessment sections table: Section progress tracking within assessments
CREATE TABLE IF NOT EXISTS public.tpa_assessment_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES public.tpa_assessment_runs(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tpa_tenants(id) ON DELETE CASCADE,
  
  -- Section identification
  section_key TEXT NOT NULL, -- e.g., 'financial_health', 'founder_capacity'
  section_name TEXT NOT NULL,
  section_description TEXT,
  
  -- Ordering
  sort_order INTEGER NOT NULL DEFAULT 0,
  
  -- Section status
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN (
    'not_started',
    'in_progress',
    'complete',
    'provisional',
    'not_applicable'
  )),
  
  -- Progress tracking
  total_questions INTEGER NOT NULL DEFAULT 0,
  answered_questions INTEGER NOT NULL DEFAULT 0,
  required_questions INTEGER NOT NULL DEFAULT 0,
  required_answered INTEGER NOT NULL DEFAULT 0,
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  
  -- Section scoring (cached from component_scores)
  component_score INTEGER CHECK (component_score >= 0 AND component_score <= 500),
  component_weight DECIMAL(5,2) DEFAULT 0,
  
  -- Applicability
  is_applicable BOOLEAN DEFAULT true,
  not_applicable_reason TEXT,
  
  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  
  -- Constraints
  CONSTRAINT unique_section_per_assessment UNIQUE (assessment_id, section_key)
);

-- Indexes
CREATE INDEX IF NOT EXISTS tpa_assessment_sections_assessment_id_idx ON public.tpa_assessment_sections(assessment_id);
CREATE INDEX IF NOT EXISTS tpa_assessment_sections_tenant_id_idx ON public.tpa_assessment_sections(tenant_id);
CREATE INDEX IF NOT EXISTS tpa_assessment_sections_status_idx ON public.tpa_assessment_sections(status);
CREATE INDEX IF NOT EXISTS tpa_assessment_sections_sort_order_idx ON public.tpa_assessment_sections(sort_order);
CREATE INDEX IF NOT EXISTS tpa_assessment_sections_incomplete_idx ON public.tpa_assessment_sections(assessment_id, status) 
  WHERE status NOT IN ('complete', 'not_applicable');

-- Trigger for updated_at
CREATE TRIGGER tpa_assessment_sections_updated_at
  BEFORE UPDATE ON public.tpa_assessment_sections
  FOR EACH ROW
  EXECUTE FUNCTION public.tpa_update_updated_at_column();

-- Function to auto-update progress percentage
CREATE OR REPLACE FUNCTION public.tpa_update_section_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate progress percentage
  IF NEW.total_questions > 0 THEN
    NEW.progress_percentage := LEAST(100, ROUND((NEW.answered_questions::DECIMAL / NEW.total_questions) * 100));
  ELSE
    NEW.progress_percentage := 0;
  END IF;
  
  -- Set timestamps
  IF NEW.status = 'in_progress' AND OLD.started_at IS NULL THEN
    NEW.started_at := now();
  END IF;
  
  IF NEW.status IN ('complete', 'provisional') AND OLD.completed_at IS NULL THEN
    NEW.completed_at := now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update progress
CREATE TRIGGER tpa_assessment_sections_update_progress
  BEFORE INSERT OR UPDATE ON public.tpa_assessment_sections
  FOR EACH ROW
  EXECUTE FUNCTION public.tpa_update_section_progress();

-- Function to recalculate assessment progress when section changes
CREATE OR REPLACE FUNCTION public.tpa_recalculate_assessment_progress()
RETURNS TRIGGER AS $$
DECLARE
  v_total_sections INTEGER;
  v_complete_sections INTEGER;
  v_total_questions INTEGER;
  v_answered_questions INTEGER;
BEGIN
  -- Count sections
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status IN ('complete', 'provisional', 'not_applicable'))
  INTO v_total_sections, v_complete_sections
  FROM public.tpa_assessment_sections
  WHERE assessment_id = NEW.assessment_id
    AND is_applicable = true;
  
  -- Count questions
  SELECT 
    COALESCE(SUM(total_questions), 0),
    COALESCE(SUM(answered_questions), 0)
  INTO v_total_questions, v_answered_questions
  FROM public.tpa_assessment_sections
  WHERE assessment_id = NEW.assessment_id;
  
  -- Update data confidence on assessment
  UPDATE public.tpa_assessment_runs
  SET data_confidence = CASE 
    WHEN v_total_questions > 0 THEN 
      LEAST(100, ROUND((v_answered_questions::DECIMAL / v_total_questions) * 100))
    ELSE 0
  END,
  updated_at = now()
  WHERE id = NEW.assessment_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to recalculate assessment progress
CREATE TRIGGER tpa_assessment_sections_recalc_progress
  AFTER INSERT OR UPDATE ON public.tpa_assessment_sections
  FOR EACH ROW
  EXECUTE FUNCTION public.tpa_recalculate_assessment_progress();

-- Enable RLS
ALTER TABLE public.tpa_assessment_sections ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Assessment-scoped - users can view sections for assessments they can access
CREATE POLICY "users_can_view_sections"
  ON public.tpa_assessment_sections
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tpa_assessment_runs ar
      WHERE ar.id = tpa_assessment_sections.assessment_id
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

-- Facilitators can create sections for their assessments
CREATE POLICY "facilitators_can_create_sections"
  ON public.tpa_assessment_sections
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tpa_assessment_runs ar
      JOIN public.tpa_tenant_memberships tm ON ar.tenant_id = tm.tenant_id
      WHERE ar.id = tpa_assessment_sections.assessment_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('facilitator', 'senior_reviewer', 'organization_admin', 'white_label_admin', 'system_admin')
        AND tm.status = 'active'
        AND ar.status NOT IN ('approved', 'superseded')
    )
  );

-- Facilitators can update sections for their assessments
CREATE POLICY "facilitators_can_update_sections"
  ON public.tpa_assessment_sections
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.tpa_assessment_runs ar
      JOIN public.tpa_tenant_memberships tm ON ar.tenant_id = tm.tenant_id
      WHERE ar.id = tpa_assessment_sections.assessment_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('facilitator', 'senior_reviewer', 'organization_admin', 'white_label_admin', 'system_admin')
        AND tm.status = 'active'
        AND ar.status NOT IN ('approved', 'superseded')
    )
  );

-- Only admins can delete sections
CREATE POLICY "admins_can_delete_sections"
  ON public.tpa_assessment_sections
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.tpa_assessment_runs ar
      JOIN public.tpa_tenant_memberships tm ON ar.tenant_id = tm.tenant_id
      WHERE ar.id = tpa_assessment_sections.assessment_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('organization_admin', 'white_label_admin', 'system_admin')
        AND tm.status = 'active'
    )
  );

-- Function to initialize sections for a new assessment
CREATE OR REPLACE FUNCTION public.tpa_initialize_assessment_sections(
  p_assessment_id UUID,
  p_methodology_version_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  v_component RECORD;
BEGIN
  FOR v_component IN 
    SELECT 
      c.id as component_id,
      c.code as section_key,
      c.name as section_name,
      c.description as section_description,
      c.default_weight as component_weight,
      c.sort_order
    FROM public.tpa_components c
    WHERE c.methodology_version_id = p_methodology_version_id
      AND c.status = 'active'
    ORDER BY c.sort_order
  LOOP
    INSERT INTO public.tpa_assessment_sections (
      assessment_id,
      section_key,
      section_name,
      section_description,
      sort_order,
      component_weight,
      total_questions,
      required_questions
    )
    SELECT 
      p_assessment_id,
      v_component.section_key,
      v_component.section_name,
      v_component.section_description,
      v_component.sort_order,
      v_component.component_weight,
      COUNT(ci.id),
      COUNT(ci.id)  -- All questions required by default
    FROM public.tpa_component_indicators ci
    WHERE ci.component_id = v_component.component_id
      AND ci.status = 'active'
    ON CONFLICT (assessment_id, section_key) DO NOTHING;
    
    v_count := v_count + 1;
  END LOOP;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE public.tpa_assessment_sections IS 'Section progress tracking within assessments';
COMMENT ON COLUMN public.tpa_assessment_sections.section_key IS 'Unique identifier for the section (matches component code)';
COMMENT ON COLUMN public.tpa_assessment_sections.status IS 'not_started, in_progress, complete, provisional, or not_applicable';
COMMENT ON COLUMN public.tpa_assessment_sections.progress_percentage IS 'Calculated from answered/total questions';
COMMENT ON COLUMN public.tpa_assessment_sections.is_applicable IS 'Whether this section applies to this assessment';
