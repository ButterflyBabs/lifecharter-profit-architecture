-- Migration: 023_tpa_section_responses.sql
-- Phase 4: Assessment Engine - User responses to questions

-- Section responses table: User responses to assessment questions
CREATE TABLE IF NOT EXISTS public.tpa_section_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES public.tpa_assessment_sections(id) ON DELETE CASCADE,
  assessment_id UUID NOT NULL REFERENCES public.tpa_assessment_runs(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tpa_tenants(id) ON DELETE CASCADE,
  
  -- Question identification
  indicator_id UUID REFERENCES public.tpa_indicators(id),
  question_key TEXT NOT NULL, -- e.g., 'revenue_trend', 'cash_position'
  question_text TEXT NOT NULL,
  
  -- Response data (flexible JSONB)
  response_type TEXT NOT NULL CHECK (response_type IN (
    'text',           -- Free text
    'number',         -- Numeric value
    'currency',       -- Money amount
    'percentage',     -- Percentage value
    'boolean',        -- Yes/No
    'select',         -- Single choice
    'multiselect',    -- Multiple choices
    'scale',          -- 0-5 or 1-10 scale
    'date',           -- Date value
    'file',           -- File upload reference
    'calculated',     -- System-calculated value
    'unknown'         -- Explicitly unknown
  )),
  response_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Example structures:
  -- text: {"value": "string"}
  -- number: {"value": 123.45, "unit": "months"}
  -- currency: {"value": 50000, "currency": "USD"}
  -- percentage: {"value": 25.5}
  -- boolean: {"value": true}
  -- select: {"value": "option_key", "label": "Option Label"}
  -- multiselect: {"values": ["opt1", "opt2"], "labels": ["Label 1", "Label 2"]}
  -- scale: {"value": 3, "max": 5}
  -- date: {"value": "2024-01-15"}
  -- file: {"file_id": "uuid", "filename": "doc.pdf", "url": "..."}
  -- calculated: {"value": 123.45, "formula": "revenue - expenses", "inputs": {...}}
  -- unknown: {"reason": "not_applicable"}
  
  -- Response value summary (for quick querying)
  response_summary TEXT, -- String representation for display/search
  numeric_value DECIMAL(15,4), -- For numeric responses
  
  -- Evidence linking
  evidence_ids UUID[] DEFAULT '{}', -- References to tpa_assessment_evidence
  
  -- Validation
  is_valid BOOLEAN DEFAULT true,
  validation_errors TEXT[],
  
  -- Scoring (if applicable)
  score INTEGER CHECK (score >= 0 AND score <= 5),
  score_reasoning TEXT,
  confidence_level TEXT CHECK (confidence_level IN ('high', 'medium', 'low', 'unknown')),
  
  -- Answered tracking
  is_answered BOOLEAN DEFAULT false,
  answered_at TIMESTAMPTZ,
  answered_by UUID REFERENCES auth.users(id),
  
  -- Modified tracking
  modified_at TIMESTAMPTZ,
  modified_by UUID REFERENCES auth.users(id),
  modification_count INTEGER DEFAULT 0,
  
  -- Previous values (for audit)
  previous_response_data JSONB,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  
  -- Constraints
  CONSTRAINT unique_question_per_section UNIQUE (section_id, question_key)
);

-- Indexes
CREATE INDEX IF NOT EXISTS tpa_section_responses_section_id_idx ON public.tpa_section_responses(section_id);
CREATE INDEX IF NOT EXISTS tpa_section_responses_assessment_id_idx ON public.tpa_section_responses(assessment_id);
CREATE INDEX IF NOT EXISTS tpa_section_responses_tenant_id_idx ON public.tpa_section_responses(tenant_id);
CREATE INDEX IF NOT EXISTS tpa_section_responses_indicator_id_idx ON public.tpa_section_responses(indicator_id);
CREATE INDEX IF NOT EXISTS tpa_section_responses_question_key_idx ON public.tpa_section_responses(question_key);
CREATE INDEX IF NOT EXISTS tpa_section_responses_answered_idx ON public.tpa_section_responses(is_answered, answered_at);
CREATE INDEX IF NOT EXISTS tpa_section_responses_score_idx ON public.tpa_section_responses(score);
CREATE INDEX IF NOT EXISTS tpa_section_responses_response_type_idx ON public.tpa_section_responses(response_type);
CREATE INDEX IF NOT EXISTS tpa_section_responses_numeric_idx ON public.tpa_section_responses(numeric_value) 
  WHERE numeric_value IS NOT NULL;

-- Trigger for updated_at
CREATE TRIGGER tpa_section_responses_updated_at
  BEFORE UPDATE ON public.tpa_section_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.tpa_update_updated_at_column();

-- Function to track response modifications
CREATE OR REPLACE FUNCTION public.tpa_track_response_modification()
RETURNS TRIGGER AS $$
BEGIN
  -- If response is changing
  IF OLD.response_data IS DISTINCT FROM NEW.response_data THEN
    -- Store previous value
    NEW.previous_response_data := OLD.response_data;
    
    -- Update modification tracking
    NEW.modified_at := now();
    NEW.modified_by := auth.uid();
    NEW.modification_count := COALESCE(OLD.modification_count, 0) + 1;
    
    -- Update answered tracking if first answer
    IF NOT OLD.is_answered AND NEW.is_answered THEN
      NEW.answered_at := now();
      NEW.answered_by := auth.uid();
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to track modifications
CREATE TRIGGER tpa_section_responses_track_modification
  BEFORE UPDATE ON public.tpa_section_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.tpa_track_response_modification();

-- Function to update section progress when response changes
CREATE OR REPLACE FUNCTION public.tpa_update_section_on_response()
RETURNS TRIGGER AS $$
DECLARE
  v_answered_count INTEGER;
  v_total_count INTEGER;
BEGIN
  -- Count answered questions for this section
  SELECT 
    COUNT(*) FILTER (WHERE is_answered = true),
    COUNT(*)
  INTO v_answered_count, v_total_count
  FROM public.tpa_section_responses
  WHERE section_id = NEW.section_id;
  
  -- Update section progress
  UPDATE public.tpa_assessment_sections
  SET answered_questions = v_answered_count,
      total_questions = v_total_count,
      status = CASE 
        WHEN v_answered_count = 0 THEN 'not_started'
        WHEN v_answered_count = v_total_count THEN 'complete'
        ELSE 'in_progress'
      END,
      updated_at = now()
  WHERE id = NEW.section_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update section progress
CREATE TRIGGER tpa_section_responses_update_section
  AFTER INSERT OR UPDATE ON public.tpa_section_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.tpa_update_section_on_response();

-- Enable RLS
ALTER TABLE public.tpa_section_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view responses for assessments they can access
CREATE POLICY "users_can_view_responses"
  ON public.tpa_section_responses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tpa_assessment_runs ar
      WHERE ar.id = tpa_section_responses.assessment_id
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

-- Users can modify their own responses
CREATE POLICY "users_can_modify_own_responses"
  ON public.tpa_section_responses
  FOR UPDATE
  USING (
    answered_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.tpa_assessment_runs ar
      WHERE ar.id = tpa_section_responses.assessment_id
        AND ar.status NOT IN ('approved', 'superseded', 'in_review')
    )
  );

-- Facilitators can modify responses for their assessments
CREATE POLICY "facilitators_can_modify_responses"
  ON public.tpa_section_responses
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.tpa_assessment_runs ar
      JOIN public.tpa_tenant_memberships tm ON ar.tenant_id = tm.tenant_id
      WHERE ar.id = tpa_section_responses.assessment_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('facilitator', 'senior_reviewer', 'organization_admin', 'white_label_admin', 'system_admin')
        AND tm.status = 'active'
        AND ar.status NOT IN ('approved', 'superseded')
    )
  );

-- Facilitators can create responses for their assessments
CREATE POLICY "facilitators_can_create_responses"
  ON public.tpa_section_responses
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tpa_assessment_runs ar
      JOIN public.tpa_tenant_memberships tm ON ar.tenant_id = tm.tenant_id
      WHERE ar.id = tpa_section_responses.assessment_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('facilitator', 'senior_reviewer', 'organization_admin', 'white_label_admin', 'system_admin')
        AND tm.status = 'active'
        AND ar.status NOT IN ('approved', 'superseded')
    )
  );

-- Only admins can delete responses
CREATE POLICY "admins_can_delete_responses"
  ON public.tpa_section_responses
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.tpa_assessment_runs ar
      JOIN public.tpa_tenant_memberships tm ON ar.tenant_id = tm.tenant_id
      WHERE ar.id = tpa_section_responses.assessment_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('organization_admin', 'white_label_admin', 'system_admin')
        AND tm.status = 'active'
    )
  );

-- Function to set response with validation
CREATE OR REPLACE FUNCTION public.tpa_set_response(
  p_response_id UUID,
  p_response_data JSONB,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_response_type TEXT;
  v_numeric_value DECIMAL(15,4);
  v_summary TEXT;
BEGIN
  -- Get response type
  SELECT response_type INTO v_response_type
  FROM public.tpa_section_responses
  WHERE id = p_response_id;
  
  -- Extract numeric value if applicable
  v_numeric_value := CASE v_response_type
    WHEN 'number' THEN (p_response_data->>'value')::DECIMAL
    WHEN 'currency' THEN (p_response_data->>'value')::DECIMAL
    WHEN 'percentage' THEN (p_response_data->>'value')::DECIMAL
    WHEN 'scale' THEN (p_response_data->>'value')::DECIMAL
    ELSE NULL
  END;
  
  -- Create summary
  v_summary := CASE v_response_type
    WHEN 'text' THEN p_response_data->>'value'
    WHEN 'boolean' THEN CASE WHEN (p_response_data->>'value')::BOOLEAN THEN 'Yes' ELSE 'No' END
    WHEN 'select' THEN p_response_data->>'label'
    WHEN 'unknown' THEN 'Unknown'
    ELSE p_response_data->>'value'
  END;
  
  -- Update response
  UPDATE public.tpa_section_responses
  SET response_data = p_response_data,
      numeric_value = v_numeric_value,
      response_summary = v_summary,
      is_answered = true,
      is_valid = true,
      validation_errors = NULL,
      updated_at = now(),
      updated_by = p_user_id
  WHERE id = p_response_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to mark response as unknown
CREATE OR REPLACE FUNCTION public.tpa_mark_response_unknown(
  p_response_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.tpa_section_responses
  SET response_data = jsonb_build_object('reason', COALESCE(p_reason, 'not_provided')),
      response_type = 'unknown',
      response_summary = 'Unknown',
      numeric_value = NULL,
      is_answered = true,
      updated_at = now()
  WHERE id = p_response_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE public.tpa_section_responses IS 'User responses to assessment questions';
COMMENT ON COLUMN public.tpa_section_responses.response_data IS 'Flexible JSONB storage for different response types';
COMMENT ON COLUMN public.tpa_section_responses.response_type IS 'Type of response: text, number, currency, percentage, boolean, select, multiselect, scale, date, file, calculated, unknown';
COMMENT ON COLUMN public.tpa_section_responses.evidence_ids IS 'Array of evidence item IDs supporting this response';
COMMENT ON COLUMN public.tpa_section_responses.previous_response_data IS 'Previous value for audit trail';
