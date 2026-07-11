-- Migration: 025_tpa_component_scores.sql
-- Phase 4: Assessment Engine - Calculated component scores

-- Component scores table: Calculated component scores with confidence levels
CREATE TABLE IF NOT EXISTS public.tpa_component_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES public.tpa_assessment_runs(id) ON DELETE CASCADE,
  component_id UUID NOT NULL REFERENCES public.tpa_components(id),
  tenant_id UUID REFERENCES public.tpa_tenants(id) ON DELETE CASCADE,
  
  -- Score identification
  score_version INTEGER NOT NULL DEFAULT 1,
  
  -- Calculated scores (0-500 scale for precision)
  raw_score INTEGER CHECK (raw_score >= 0 AND raw_score <= 500),
  weighted_score INTEGER CHECK (weighted_score >= 0 AND weighted_score <= 500),
  
  -- Component weight used in calculation
  weight_applied DECIMAL(5,2) NOT NULL CHECK (weight_applied >= 0 AND weight_applied <= 100),
  
  -- Score breakdown
  indicator_scores JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Format: [
  --   {
  --     "indicator_id": "uuid",
  --     "indicator_code": "code",
  --     "score": 3,
  --     "weight": 1.0,
  --     "weighted_contribution": 3.0,
  --     "confidence": "high",
  --     "evidence_count": 2
  --   }
  -- ]
  
  -- Confidence and quality
  confidence_level TEXT CHECK (confidence_level IN ('high', 'medium', 'low', 'insufficient_data')),
  confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
  data_completeness DECIMAL(5,2) CHECK (data_completeness >= 0 AND data_completeness <= 100),
  
  -- Calculation metadata
  calculation_method TEXT NOT NULL DEFAULT 'weighted_average' CHECK (calculation_method IN (
    'weighted_average',
    'simple_average',
    'median',
    'minimum',
    'manual_override'
  )),
  calculation_formula TEXT, -- Description of formula used
  calculation_inputs JSONB, -- Inputs used in calculation
  
  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft',        -- Initial calculation
    'reviewed',     -- Reviewed by facilitator
    'approved',     -- Approved for final report
    'superseded'    -- Replaced by newer version
  )),
  
  -- Review tracking
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  review_notes TEXT,
  
  -- Approval tracking
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  
  -- Superseded tracking
  superseded_by_score_id UUID REFERENCES public.tpa_component_scores(id),
  superseded_at TIMESTAMPTZ,
  superseded_reason TEXT,
  
  -- Previous version
  previous_version_id UUID REFERENCES public.tpa_component_scores(id),
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  calculated_by UUID REFERENCES auth.users(id),
  
  -- Constraints
  CONSTRAINT unique_component_version UNIQUE (assessment_id, component_id, score_version)
);

-- Indexes
CREATE INDEX IF NOT EXISTS tpa_component_scores_assessment_id_idx ON public.tpa_component_scores(assessment_id);
CREATE INDEX IF NOT EXISTS tpa_component_scores_component_id_idx ON public.tpa_component_scores(component_id);
CREATE INDEX IF NOT EXISTS tpa_component_scores_tenant_id_idx ON public.tpa_component_scores(tenant_id);
CREATE INDEX IF NOT EXISTS tpa_component_scores_status_idx ON public.tpa_component_scores(status);
CREATE INDEX IF NOT EXISTS tpa_component_scores_current_idx ON public.tpa_component_scores(assessment_id, component_id, score_version);
CREATE INDEX IF NOT EXISTS tpa_component_scores_weighted_score_idx ON public.tpa_component_scores(weighted_score);
CREATE INDEX IF NOT EXISTS tpa_component_scores_confidence_idx ON public.tpa_component_scores(confidence_level);

-- Trigger for updated_at
CREATE TRIGGER tpa_component_scores_updated_at
  BEFORE UPDATE ON public.tpa_component_scores
  FOR EACH ROW
  EXECUTE FUNCTION public.tpa_update_updated_at_column();

-- Function to auto-increment score version
CREATE OR REPLACE FUNCTION public.tpa_set_score_version()
RETURNS TRIGGER AS $$
DECLARE
  next_version INTEGER;
BEGIN
  SELECT COALESCE(MAX(score_version), 0) + 1
  INTO next_version
  FROM public.tpa_component_scores
  WHERE assessment_id = NEW.assessment_id
    AND component_id = NEW.component_id;
  
  NEW.score_version := next_version;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-set score version on insert
CREATE TRIGGER tpa_component_scores_set_version
  BEFORE INSERT ON public.tpa_component_scores
  FOR EACH ROW
  EXECUTE FUNCTION public.tpa_set_score_version();

-- Function to update assessment section when score is calculated
CREATE OR REPLACE FUNCTION public.tpa_update_section_on_score()
RETURNS TRIGGER AS $$
DECLARE
  v_section_id UUID;
  v_component_code TEXT;
BEGIN
  -- Get component code
  SELECT code INTO v_component_code
  FROM public.tpa_components
  WHERE id = NEW.component_id;
  
  -- Find matching section
  SELECT id INTO v_section_id
  FROM public.tpa_assessment_sections
  WHERE assessment_id = NEW.assessment_id
    AND section_key = v_component_code;
  
  -- Update section if found
  IF v_section_id IS NOT NULL THEN
    UPDATE public.tpa_assessment_sections
    SET component_score = NEW.weighted_score,
        updated_at = now()
    WHERE id = v_section_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update section on score calculation
CREATE TRIGGER tpa_component_scores_update_section
  AFTER INSERT OR UPDATE ON public.tpa_component_scores
  FOR EACH ROW
  EXECUTE FUNCTION public.tpa_update_section_on_score();

-- Enable RLS
ALTER TABLE public.tpa_component_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Facilitators and above can view scores
CREATE POLICY "facilitators_can_view_scores"
  ON public.tpa_component_scores
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tpa_assessment_runs ar
      WHERE ar.id = tpa_component_scores.assessment_id
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

-- Facilitators can create scores
CREATE POLICY "facilitators_can_create_scores"
  ON public.tpa_component_scores
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tpa_assessment_runs ar
      JOIN public.tpa_tenant_memberships tm ON ar.tenant_id = tm.tenant_id
      WHERE ar.id = tpa_component_scores.assessment_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('facilitator', 'senior_reviewer', 'organization_admin', 'white_label_admin', 'system_admin')
        AND tm.status = 'active'
    )
  );

-- Facilitators can update draft scores
CREATE POLICY "facilitators_can_update_draft_scores"
  ON public.tpa_component_scores
  FOR UPDATE
  USING (
    status = 'draft'
    AND EXISTS (
      SELECT 1 FROM public.tpa_assessment_runs ar
      JOIN public.tpa_tenant_memberships tm ON ar.tenant_id = tm.tenant_id
      WHERE ar.id = tpa_component_scores.assessment_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('facilitator', 'senior_reviewer', 'organization_admin', 'white_label_admin', 'system_admin')
        AND tm.status = 'active'
        AND ar.status NOT IN ('approved', 'superseded')
    )
  );

-- Senior reviewers can approve scores
CREATE POLICY "reviewers_can_approve_scores"
  ON public.tpa_component_scores
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.tpa_assessment_runs ar
      JOIN public.tpa_tenant_memberships tm ON ar.tenant_id = tm.tenant_id
      WHERE ar.id = tpa_component_scores.assessment_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('senior_reviewer', 'organization_admin', 'white_label_admin', 'system_admin')
        AND tm.status = 'active'
    )
  );

-- Only admins can delete scores
CREATE POLICY "admins_can_delete_scores"
  ON public.tpa_component_scores
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.tpa_assessment_runs ar
      JOIN public.tpa_tenant_memberships tm ON ar.tenant_id = tm.tenant_id
      WHERE ar.id = tpa_component_scores.assessment_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('organization_admin', 'white_label_admin', 'system_admin')
        AND tm.status = 'active'
    )
  );

-- Function to calculate component score from responses
CREATE OR REPLACE FUNCTION public.tpa_calculate_component_score_deterministic(
  p_assessment_id UUID,
  p_component_id UUID,
  p_calculated_by UUID
)
RETURNS UUID AS $$
DECLARE
  v_score_id UUID;
  v_component_code TEXT;
  v_indicator_scores JSONB := '[]'::jsonb;
  v_total_weight DECIMAL(10,4) := 0;
  v_weighted_sum DECIMAL(10,4) := 0;
  v_raw_score INTEGER;
  v_weighted_score INTEGER;
  v_data_completeness DECIMAL(5,2);
  v_confidence_score INTEGER;
  v_confidence_level TEXT;
  v_answered_count INTEGER;
  v_total_count INTEGER;
BEGIN
  -- Get component code
  SELECT code INTO v_component_code
  FROM public.tpa_components
  WHERE id = p_component_id;
  
  -- Get indicator scores from responses
  SELECT 
    jsonb_agg(
      jsonb_build_object(
        'indicator_id', sr.indicator_id,
        'indicator_code', i.code,
        'score', sr.score,
        'weight', ci.weight,
        'weighted_contribution', COALESCE(sr.score, 0) * ci.weight,
        'confidence', sr.confidence_level,
        'evidence_count', COALESCE(array_length(sr.evidence_ids, 1), 0)
      )
    ),
    SUM(CASE WHEN sr.is_answered AND sr.score IS NOT NULL THEN ci.weight ELSE 0 END),
    SUM(CASE WHEN sr.is_answered AND sr.score IS NOT NULL THEN COALESCE(sr.score, 0) * ci.weight ELSE 0 END),
    COUNT(*) FILTER (WHERE sr.is_answered AND sr.score IS NOT NULL),
    COUNT(*)
  INTO v_indicator_scores, v_total_weight, v_weighted_sum, v_answered_count, v_total_count
  FROM public.tpa_component_indicators ci
  JOIN public.tpa_indicators i ON ci.indicator_id = i.id
  LEFT JOIN public.tpa_assessment_sections sec ON sec.section_key = v_component_code AND sec.assessment_id = p_assessment_id
  LEFT JOIN public.tpa_section_responses sr ON sr.section_id = sec.id AND sr.indicator_id = i.id
  WHERE ci.component_id = p_component_id
    AND ci.status = 'active';
  
  -- Calculate scores
  IF v_total_weight > 0 THEN
    v_raw_score := ROUND((v_weighted_sum / v_total_weight) * 100);
    v_weighted_score := v_raw_score; -- Will be weighted by component weight later
  ELSE
    v_raw_score := NULL;
    v_weighted_score := NULL;
  END IF;
  
  -- Calculate data completeness
  IF v_total_count > 0 THEN
    v_data_completeness := ROUND((v_answered_count::DECIMAL / v_total_count) * 100, 2);
  ELSE
    v_data_completeness := 0;
  END IF;
  
  -- Calculate confidence
  v_confidence_score := CASE 
    WHEN v_data_completeness >= 90 THEN 90 + ROUND((v_data_completeness - 90) / 10 * 10)
    WHEN v_data_completeness >= 70 THEN 70 + ROUND((v_data_completeness - 70) / 20 * 20)
    WHEN v_data_completeness >= 50 THEN 50 + ROUND((v_data_completeness - 50) / 20 * 20)
    ELSE v_data_completeness
  END;
  
  v_confidence_level := CASE 
    WHEN v_confidence_score >= 80 THEN 'high'
    WHEN v_confidence_score >= 60 THEN 'medium'
    WHEN v_confidence_score >= 40 THEN 'low'
    ELSE 'insufficient_data'
  END;
  
  -- Insert score record
  INSERT INTO public.tpa_component_scores (
    assessment_id,
    component_id,
    raw_score,
    weighted_score,
    weight_applied,
    indicator_scores,
    confidence_level,
    confidence_score,
    data_completeness,
    calculation_method,
    calculation_formula,
    calculation_inputs,
    calculated_by
  )
  VALUES (
    p_assessment_id,
    p_component_id,
    v_raw_score,
    v_weighted_score,
    (SELECT default_weight FROM public.tpa_components WHERE id = p_component_id),
    COALESCE(v_indicator_scores, '[]'::jsonb),
    v_confidence_level,
    v_confidence_score,
    v_data_completeness,
    'weighted_average',
    'SUM(indicator_score * indicator_weight) / SUM(indicator_weight)',
    jsonb_build_object(
      'answered_indicators', v_answered_count,
      'total_indicators', v_total_count,
      'total_weight', v_total_weight
    ),
    p_calculated_by
  )
  RETURNING id INTO v_score_id;
  
  RETURN v_score_id;
END;
$$ LANGUAGE plpgsql;

-- Function to approve a component score
CREATE OR REPLACE FUNCTION public.tpa_approve_component_score(
  p_score_id UUID,
  p_approver_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.tpa_component_scores
  SET status = 'approved',
      approved_at = now(),
      approved_by = p_approver_id,
      updated_at = now()
  WHERE id = p_score_id
    AND status IN ('draft', 'reviewed');
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE public.tpa_component_scores IS 'Calculated component scores with confidence levels';
COMMENT ON COLUMN public.tpa_component_scores.raw_score IS 'Unweighted component score (0-500, divide by 100 for 0.00-5.00)';
COMMENT ON COLUMN public.tpa_component_scores.weighted_score IS 'Score weighted by component importance (0-500)';
COMMENT ON COLUMN public.tpa_component_scores.indicator_scores IS 'JSONB array of individual indicator scores and contributions';
COMMENT ON COLUMN public.tpa_component_scores.data_completeness IS 'Percentage of indicators with valid scores';
COMMENT ON COLUMN public.tpa_component_scores.calculation_method IS 'Method used: weighted_average, simple_average, median, minimum, manual_override';
