-- Migration: 024_tpa_assessment_evidence.sql
-- Phase 4: Assessment Engine - Evidence items linked to assessments

-- Assessment evidence table: Evidence items linked to assessments
CREATE TABLE IF NOT EXISTS public.tpa_assessment_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES public.tpa_assessment_runs(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tpa_tenants(id) ON DELETE CASCADE,
  
  -- Evidence identification
  evidence_key TEXT NOT NULL, -- e.g., 'financial_statements_2024', 'tax_return_2023'
  title TEXT NOT NULL,
  description TEXT,
  
  -- Evidence type classification
  evidence_type TEXT NOT NULL CHECK (evidence_type IN (
    'financial_statement',  -- P&L, Balance Sheet, Cash Flow
    'tax_return',          -- Tax filings
    'bank_statement',      -- Bank records
    'contract',            -- Contracts and agreements
    'invoice',             -- Invoices and receipts
    'payroll_record',      -- Payroll documentation
    'legal_document',      -- Legal filings, registrations
    'insurance_document',  -- Insurance policies
    'audit_report',        -- Third-party audit reports
    'benchmark_data',      -- Industry/market data
    'email_correspondence', -- Email records
    'meeting_notes',       -- Meeting records
    'calculation_sheet',   -- Spreadsheets, workpapers
    'screenshot',          -- System screenshots
    'external_report',     -- Third-party reports
    'other'                -- Other documentation
  )),
  
  -- Evidence quality classification
  quality_type TEXT NOT NULL DEFAULT 'user_reported' CHECK (quality_type IN (
    'verified_fact',       -- Independently verified
    'user_reported',       -- Provided by user (unverified)
    'calculated_finding',  -- System calculated
    'external_benchmark',  -- External data source
    'assumption',          -- Reasonable assumption
    'professional_judgment', -- Expert judgment
    'unknown'              -- Unknown/unverified
  )),
  
  -- Confidence scoring (0-100)
  confidence_score INTEGER DEFAULT 50 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  confidence_reasoning TEXT,
  
  -- Source tracking
  source_type TEXT CHECK (source_type IN (
    'upload',              -- User uploaded file
    'integration',         -- System integration (QuickBooks, etc.)
    'manual_entry',        -- Manually entered data
    'calculation',         -- System calculation
    'external_api',        -- External API
    'interview',           -- From interview/assessment
    'observation'          -- Direct observation
  )),
  source_reference TEXT,   -- Reference to source (URL, integration ID, etc.)
  source_date TIMESTAMPTZ, -- When the source data was created
  
  -- File storage
  file_path TEXT,          -- Storage path
  file_url TEXT,           -- Access URL
  file_name TEXT,
  file_size_bytes INTEGER,
  file_mime_type TEXT,
  file_hash TEXT,          -- For integrity verification
  
  -- Document processing
  ocr_text TEXT,           -- Extracted text from OCR
  ocr_confidence DECIMAL(5,2), -- OCR confidence score
  extracted_data JSONB,    -- Structured data extracted from document
  
  -- Verification
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users(id),
  verification_method TEXT,
  
  -- Usage tracking
  referenced_by_responses UUID[] DEFAULT '{}', -- Response IDs using this evidence
  reference_count INTEGER DEFAULT 0,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'superseded', 'rejected', 'archived')),
  superseded_by_evidence_id UUID REFERENCES public.tpa_assessment_evidence(id),
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  
  -- Constraints
  CONSTRAINT unique_evidence_key_per_assessment UNIQUE (assessment_id, evidence_key)
);

-- Indexes
CREATE INDEX IF NOT EXISTS tpa_assessment_evidence_assessment_id_idx ON public.tpa_assessment_evidence(assessment_id);
CREATE INDEX IF NOT EXISTS tpa_assessment_evidence_tenant_id_idx ON public.tpa_assessment_evidence(tenant_id);
CREATE INDEX IF NOT EXISTS tpa_assessment_evidence_type_idx ON public.tpa_assessment_evidence(evidence_type);
CREATE INDEX IF NOT EXISTS tpa_assessment_evidence_quality_idx ON public.tpa_assessment_evidence(quality_type);
CREATE INDEX IF NOT EXISTS tpa_assessment_evidence_confidence_idx ON public.tpa_assessment_evidence(confidence_score);
CREATE INDEX IF NOT EXISTS tpa_assessment_evidence_status_idx ON public.tpa_assessment_evidence(status);
CREATE INDEX IF NOT EXISTS tpa_assessment_evidence_verified_idx ON public.tpa_assessment_evidence(is_verified, verified_at);
CREATE INDEX IF NOT EXISTS tpa_assessment_evidence_source_date_idx ON public.tpa_assessment_evidence(source_date);

-- Trigger for updated_at
CREATE TRIGGER tpa_assessment_evidence_updated_at
  BEFORE UPDATE ON public.tpa_assessment_evidence
  FOR EACH ROW
  EXECUTE FUNCTION public.tpa_update_updated_at_column();

-- Function to update reference count
CREATE OR REPLACE FUNCTION public.tpa_update_evidence_reference_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.tpa_assessment_evidence
  SET reference_count = array_length(referenced_by_responses, 1),
      updated_at = now()
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE public.tpa_assessment_evidence ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view evidence for assessments they can access
CREATE POLICY "users_can_view_evidence"
  ON public.tpa_assessment_evidence
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tpa_assessment_runs ar
      WHERE ar.id = tpa_assessment_evidence.assessment_id
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

-- Facilitators can create evidence for their assessments
CREATE POLICY "facilitators_can_create_evidence"
  ON public.tpa_assessment_evidence
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tpa_assessment_runs ar
      JOIN public.tpa_tenant_memberships tm ON ar.tenant_id = tm.tenant_id
      WHERE ar.id = tpa_assessment_evidence.assessment_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('facilitator', 'senior_reviewer', 'organization_admin', 'white_label_admin', 'system_admin')
        AND tm.status = 'active'
        AND ar.status NOT IN ('approved', 'superseded')
    )
  );

-- Facilitators can update evidence for their assessments
CREATE POLICY "facilitators_can_update_evidence"
  ON public.tpa_assessment_evidence
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.tpa_assessment_runs ar
      JOIN public.tpa_tenant_memberships tm ON ar.tenant_id = tm.tenant_id
      WHERE ar.id = tpa_assessment_evidence.assessment_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('facilitator', 'senior_reviewer', 'organization_admin', 'white_label_admin', 'system_admin')
        AND tm.status = 'active'
        AND ar.status NOT IN ('approved', 'superseded')
    )
  );

-- Only admins can delete evidence
CREATE POLICY "admins_can_delete_evidence"
  ON public.tpa_assessment_evidence
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.tpa_assessment_runs ar
      JOIN public.tpa_tenant_memberships tm ON ar.tenant_id = tm.tenant_id
      WHERE ar.id = tpa_assessment_evidence.assessment_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('organization_admin', 'white_label_admin', 'system_admin')
        AND tm.status = 'active'
    )
  );

-- Function to verify evidence
CREATE OR REPLACE FUNCTION public.tpa_verify_evidence(
  p_evidence_id UUID,
  p_verifier_id UUID,
  p_method TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.tpa_assessment_evidence
  SET is_verified = true,
      verified_at = now(),
      verified_by = p_verifier_id,
      verification_method = p_method,
      quality_type = 'verified_fact',
      confidence_score = GREATEST(confidence_score, 80),
      updated_at = now()
  WHERE id = p_evidence_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to supersede evidence
CREATE OR REPLACE FUNCTION public.tpa_supersede_evidence(
  p_old_evidence_id UUID,
  p_new_evidence_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.tpa_assessment_evidence
  SET status = 'superseded',
      superseded_by_evidence_id = p_new_evidence_id,
      updated_at = now()
  WHERE id = p_old_evidence_id
    AND status = 'active';
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to link evidence to response
CREATE OR REPLACE FUNCTION public.tpa_link_evidence_to_response(
  p_evidence_id UUID,
  p_response_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.tpa_assessment_evidence
  SET referenced_by_responses = array_append(
    COALESCE(referenced_by_responses, ARRAY[]::UUID[]),
    p_response_id
  ),
  updated_at = now()
  WHERE id = p_evidence_id
    AND NOT (p_response_id = ANY(COALESCE(referenced_by_responses, ARRAY[]::UUID[])));
  
  -- Also update the response to reference this evidence
  UPDATE public.tpa_section_responses
  SET evidence_ids = array_append(
    COALESCE(evidence_ids, ARRAY[]::UUID[]),
    p_evidence_id
  ),
  updated_at = now()
  WHERE id = p_response_id
    AND NOT (p_evidence_id = ANY(COALESCE(evidence_ids, ARRAY[]::UUID[])));
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE public.tpa_assessment_evidence IS 'Evidence items linked to assessments';
COMMENT ON COLUMN public.tpa_assessment_evidence.quality_type IS 'Classification: verified_fact, user_reported, calculated_finding, external_benchmark, assumption, professional_judgment, unknown';
COMMENT ON COLUMN public.tpa_assessment_evidence.confidence_score IS 'Confidence in evidence quality (0-100)';
COMMENT ON COLUMN public.tpa_assessment_evidence.extracted_data IS 'Structured data extracted from document processing';
COMMENT ON COLUMN public.tpa_assessment_evidence.referenced_by_responses IS 'Response IDs that reference this evidence';
