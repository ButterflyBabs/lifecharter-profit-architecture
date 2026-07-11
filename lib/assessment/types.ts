/**
 * Assessment Engine Types
 * 
 * Type definitions for The Profit Architecture Assessment Engine
 */

// ============================================================================
// Assessment Status State Machine
// ============================================================================

export type AssessmentStatus = 
  | 'draft'              // Initial creation
  | 'in_progress'        // Active assessment
  | 'awaiting_information' // Missing data
  | 'submitted'          // Ready for review
  | 'in_review'          // Facilitator reviewing
  | 'approved'           // Final approved
  | 'held'               // Paused/blocked
  | 'superseded';        // Replaced by newer

export type AssessmentMode = 
  | 'pulse'              // Quick preliminary assessment
  | 'comprehensive'      // Full assessment
  | 'emergency';         // Crisis mode

export const AssessmentStatusTransitions: Record<AssessmentStatus, AssessmentStatus[]> = {
  draft: ['in_progress'],
  in_progress: ['awaiting_information', 'submitted'],
  awaiting_information: ['in_progress'],
  submitted: ['in_review', 'held'],
  in_review: ['approved', 'awaiting_information', 'held'],
  approved: [], // terminal
  held: ['in_progress'],
  superseded: [] // terminal
};

/**
 * Check if a status transition is valid
 */
export function isValidStatusTransition(
  fromStatus: AssessmentStatus,
  toStatus: AssessmentStatus
): boolean {
  if (fromStatus === toStatus) return true; // No-op is always valid
  const allowedTransitions = AssessmentStatusTransitions[fromStatus];
  return allowedTransitions.includes(toStatus);
}

/**
 * Get available transitions from a status
 */
export function getAvailableTransitions(status: AssessmentStatus): AssessmentStatus[] {
  return AssessmentStatusTransitions[status] ?? [];
}

// ============================================================================
// Section Status
// ============================================================================

export type SectionStatus =
  | 'not_started'
  | 'in_progress'
  | 'complete'
  | 'provisional'
  | 'not_applicable';

// ============================================================================
// Response Types
// ============================================================================

export type ResponseType =
  | 'text'           // Free text
  | 'number'         // Numeric value
  | 'currency'       // Money amount
  | 'percentage'     // Percentage value
  | 'boolean'        // Yes/No
  | 'select'         // Single choice
  | 'multiselect'    // Multiple choices
  | 'scale'          // 0-5 or 1-10 scale
  | 'date'           // Date value
  | 'file'           // File upload reference
  | 'calculated'     // System-calculated value
  | 'unknown';       // Explicitly unknown

// ============================================================================
// Evidence Types
// ============================================================================

export type EvidenceType =
  | 'financial_statement'
  | 'tax_return'
  | 'bank_statement'
  | 'contract'
  | 'invoice'
  | 'payroll_record'
  | 'legal_document'
  | 'insurance_document'
  | 'audit_report'
  | 'benchmark_data'
  | 'email_correspondence'
  | 'meeting_notes'
  | 'calculation_sheet'
  | 'screenshot'
  | 'external_report'
  | 'other';

export type EvidenceQualityType =
  | 'verified_fact'
  | 'user_reported'
  | 'calculated_finding'
  | 'external_benchmark'
  | 'assumption'
  | 'professional_judgment'
  | 'unknown';

// ============================================================================
// Score Status
// ============================================================================

export type ScoreStatus =
  | 'draft'
  | 'reviewed'
  | 'approved'
  | 'superseded';

// ============================================================================
// Critical Gates
// ============================================================================

export type GateCategory =
  | 'financial'
  | 'operational'
  | 'legal'
  | 'founder'
  | 'market'
  | 'team'
  | 'strategic'
  | 'other';

export type GateSeverity = 'critical' | 'high' | 'medium' | 'low';

export type GateStatus = 'open' | 'contained' | 'resolved' | 'accepted' | 'not_applicable';

// ============================================================================
// Database Models
// ============================================================================

export interface AssessmentRun {
  id: string;
  tenantId: string;
  businessId: string;
  methodologyVersionId: string;
  assessmentNumber: number;
  title: string | null;
  description: string | null;
  mode: AssessmentMode;
  status: AssessmentStatus;
  startedAt: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  approvedAt: string | null;
  completedAt: string | null;
  heldAt: string | null;
  heldReason: string | null;
  assignedFacilitatorId: string | null;
  assignedReviewerId: string | null;
  overallScore: number | null; // 0-500
  founderCapacityScore: number | null; // 0-500
  profitabilityReadinessScore: number | null; // 0-500
  growthReadinessScore: number | null; // 0-500
  dataConfidence: number; // 0-100
  isEmergency: boolean;
  emergencyTriggeredAt: string | null;
  emergencyTriggerReason: string | null;
  emergencyStabilizationTarget: string | null;
  emergencyResolvedAt: string | null;
  isPreliminary: boolean;
  preliminaryForAssessmentId: string | null;
  supersededByAssessmentId: string | null;
  supersededAt: string | null;
  supersededReason: string | null;
  determinedPathway: string | null;
  determinedStage: string | null;
  summaryStrengths: Array<{ component: string; description: string }>;
  summaryVulnerabilities: Array<{ component: string; description: string; severity: string }>;
  summaryNextActions: Array<{ action: string; priority: string; timeframe: string }>;
  reportGeneratedAt: string | null;
  reportVersion: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
}

export interface AssessmentSection {
  id: string;
  assessmentId: string;
  tenantId: string | null;
  sectionKey: string;
  sectionName: string;
  sectionDescription: string | null;
  sortOrder: number;
  status: SectionStatus;
  totalQuestions: number;
  answeredQuestions: number;
  requiredQuestions: number;
  requiredAnswered: number;
  progressPercentage: number;
  componentScore: number | null; // 0-500
  componentWeight: number;
  isApplicable: boolean;
  notApplicableReason: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
}

export interface SectionResponse {
  id: string;
  sectionId: string;
  assessmentId: string;
  tenantId: string | null;
  indicatorId: string | null;
  questionKey: string;
  questionText: string;
  responseType: ResponseType;
  responseData: Record<string, unknown>;
  responseSummary: string | null;
  numericValue: number | null;
  evidenceIds: string[];
  isValid: boolean;
  validationErrors: string[] | null;
  score: number | null; // 0-5
  scoreReasoning: string | null;
  confidenceLevel: 'high' | 'medium' | 'low' | 'unknown' | null;
  isAnswered: boolean;
  answeredAt: string | null;
  answeredBy: string | null;
  modifiedAt: string | null;
  modifiedBy: string | null;
  modificationCount: number;
  previousResponseData: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
}

export interface AssessmentEvidence {
  id: string;
  assessmentId: string;
  tenantId: string | null;
  evidenceKey: string;
  title: string;
  description: string | null;
  evidenceType: EvidenceType;
  qualityType: EvidenceQualityType;
  confidenceScore: number;
  confidenceReasoning: string | null;
  sourceType: string | null;
  sourceReference: string | null;
  sourceDate: string | null;
  filePath: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileSizeBytes: number | null;
  fileMimeType: string | null;
  fileHash: string | null;
  ocrText: string | null;
  ocrConfidence: number | null;
  extractedData: Record<string, unknown> | null;
  isVerified: boolean;
  verifiedAt: string | null;
  verifiedBy: string | null;
  verificationMethod: string | null;
  referencedByResponses: string[];
  referenceCount: number;
  status: 'active' | 'superseded' | 'rejected' | 'archived';
  supersededByEvidenceId: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
}

export interface ComponentScore {
  id: string;
  assessmentId: string;
  componentId: string;
  tenantId: string | null;
  scoreVersion: number;
  rawScore: number | null; // 0-500
  weightedScore: number | null; // 0-500
  weightApplied: number;
  indicatorScores: Array<{
    indicatorId: string;
    indicatorCode: string;
    score: number;
    weight: number;
    weightedContribution: number;
    confidence: string;
    evidenceCount: number;
  }>;
  confidenceLevel: 'high' | 'medium' | 'low' | 'insufficient_data' | null;
  confidenceScore: number | null;
  dataCompleteness: number | null;
  calculationMethod: string;
  calculationFormula: string | null;
  calculationInputs: Record<string, unknown> | null;
  status: ScoreStatus;
  reviewedAt: string | null;
  reviewedBy: string | null;
  reviewNotes: string | null;
  approvedAt: string | null;
  approvedBy: string | null;
  supersededByScoreId: string | null;
  supersededAt: string | null;
  supersededReason: string | null;
  previousVersionId: string | null;
  createdAt: string;
  updatedAt: string;
  calculatedAt: string;
  calculatedBy: string | null;
}

export interface ScoreOverride {
  id: string;
  scoreId: string;
  assessmentId: string;
  tenantId: string | null;
  overrideNumber: number;
  fieldName: string;
  oldValue: unknown;
  newValue: unknown;
  overrideReason: string;
  overrideCategory: string | null;
  supportingEvidence: string | null;
  evidenceIds: string[] | null;
  requiresApproval: boolean;
  approved: boolean | null;
  approvedAt: string | null;
  approvedBy: string | null;
  approverNotes: string | null;
  overriddenBy: string;
  overriddenAt: string;
  isRolledBack: boolean;
  rolledBackAt: string | null;
  rolledBackBy: string | null;
  rollbackReason: string | null;
  createdAt: string;
}

export interface CriticalGate {
  id: string;
  assessmentId: string;
  tenantId: string | null;
  gateNumber: number;
  gateKey: string;
  title: string;
  description: string | null;
  gateCategory: GateCategory;
  severity: GateSeverity;
  status: GateStatus;
  detectedAt: string;
  detectedBy: string | null;
  detectionMethod: string | null;
  detectionTrigger: string | null;
  impactDescription: string | null;
  businessImpact: string | null;
  resolutionCriteria: string | null;
  assignedTo: string | null;
  ownerId: string | null;
  targetResolutionDate: string | null;
  resolvedAt: string | null;
  resolvedBy: string | null;
  resolutionNotes: string | null;
  containmentMeasures: string | null;
  containmentExpiresAt: string | null;
  evidenceIds: string[];
  relatedResponseIds: string[];
  blocksGrowth: boolean;
  blocksAssessmentSubmission: boolean;
  emergencyEscalation: boolean;
  parentGateId: string | null;
  relatedGateIds: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
}

// ============================================================================
// Assessment Summary
// ============================================================================

export interface AssessmentSummary {
  assessment: AssessmentRun;
  sections: AssessmentSection[];
  progress: {
    totalSections: number;
    completedSections: number;
    inProgressSections: number;
    notStartedSections: number;
    overallProgress: number; // 0-100
  };
  scores: {
    overall: number | null;
    founderCapacity: number | null;
    profitabilityReadiness: number | null;
    growthReadiness: number | null;
    componentScores: Array<{
      componentId: string;
      componentName: string;
      score: number | null;
      weight: number;
    }>;
  };
  gates: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    open: number;
    contained: number;
    resolved: number;
    blockingGrowth: boolean;
  };
  canSubmit: boolean;
  canApprove: boolean;
  missingRequired: string[];
}

// ============================================================================
// Pulse Check Results
// ============================================================================

export interface PulseCheckResult {
  assessmentId: string;
  isPreliminary: true;
  classification: {
    pathway: string | null;
    stage: string | null;
    confidence: number;
  };
  urgentIssues: Array<{
    category: string;
    description: string;
    severity: 'critical' | 'high' | 'medium';
  }>;
  strengths: Array<{
    area: string;
    description: string;
  }>;
  vulnerabilities: Array<{
    area: string;
    description: string;
    severity: 'critical' | 'high' | 'medium';
  }>;
  nextActions: Array<{
    action: string;
    priority: 'immediate' | 'short_term' | 'medium_term';
    timeframe: string;
  }>;
  recommendedMode: 'comprehensive' | 'emergency' | 'pulse_follow_up';
  dataConfidence: number;
}

// ============================================================================
// Emergency Mode
// ============================================================================

export interface EmergencyModeStatus {
  isEmergency: boolean;
  triggeredAt: string | null;
  triggerReason: string | null;
  stabilizationTarget: string | null;
  severity: '24_hour' | '72_hour' | '7_day' | '30_day' | null;
  stabilizationPlan: {
    immediateActions: string[];
    shortTermActions: string[];
    mediumTermActions: string[];
  };
  gates: CriticalGate[];
  canExitEmergency: boolean;
  exitCriteria: string[];
}
