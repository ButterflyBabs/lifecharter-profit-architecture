/**
 * Assessment Engine
 * 
 * Main exports for The Profit Architecture Assessment Engine
 */

// Types
export * from './types';

// Scoring engine
export * from './scoring';

// State machine utilities
export {
  isValidStatusTransition,
  getAvailableTransitions,
  AssessmentStatusTransitions
} from './types';

// Assessment mode configurations
export const AssessmentModes = {
  pulse: {
    name: 'Pulse Check',
    description: 'Quick preliminary assessment to identify urgent issues and classify the business',
    estimatedDuration: '15-30 minutes',
    sections: ['classification', 'financial_snapshot', 'founder_capacity', 'urgent_issues'],
    producesPreliminaryResults: true,
    feedsInto: 'comprehensive',
    scoring: 'simplified',
    gates: 'critical_only'
  },
  comprehensive: {
    name: 'Comprehensive Assessment',
    description: 'Full assessment with all components, financial review, and complete scoring',
    estimatedDuration: '2-4 hours',
    sections: 'all', // All applicable sections based on pathway
    producesPreliminaryResults: false,
    feedsInto: null,
    scoring: 'full',
    gates: 'all'
  },
  emergency: {
    name: 'Emergency Mode',
    description: 'Crisis assessment focused on immediate stabilization',
    estimatedDuration: '1-2 hours',
    sections: ['cash_position', 'immediate_obligations', 'stabilization_plan', 'founder_status'],
    producesPreliminaryResults: false,
    feedsInto: 'comprehensive',
    scoring: 'simplified',
    gates: 'blocking_only',
    blocksGrowth: true
  }
} as const;

// Emergency triggers
export const EmergencyTriggers = {
  cash_crisis: {
    name: 'Cash Crisis',
    conditions: [
      'cash_days < 14',
      'negative_cash_balance',
      'payroll_at_risk'
    ],
    autoTrigger: true,
    severity: '24_hour'
  },
  default_risk: {
    name: 'Default Risk',
    conditions: [
      'loan_default_imminent',
      'covenant_breach',
      'payment_default'
    ],
    autoTrigger: true,
    severity: '72_hour'
  },
  operational_crisis: {
    name: 'Operational Crisis',
    conditions: [
      'delivery_failure_imminent',
      'supplier_cutoff',
      'key_system_failure'
    ],
    autoTrigger: true,
    severity: '7_day'
  },
  legal_threat: {
    name: 'Legal/Regulatory Threat',
    conditions: [
      'lawsuit_filed',
      'regulatory_action',
      'license_at_risk'
    ],
    autoTrigger: true,
    severity: '7_day'
  },
  founder_crisis: {
    name: 'Founder Incapacity',
    conditions: [
      'owner_health_crisis',
      'founder_departure',
      'key_person_unavailable'
    ],
    autoTrigger: true,
    severity: '24_hour'
  },
  data_breach: {
    name: 'Data Breach',
    conditions: [
      'security_incident',
      'data_exposure',
      'privacy_violation'
    ],
    autoTrigger: true,
    severity: '24_hour'
  }
} as const;

// Assessment workflow helpers
export function getAssessmentWorkflow(mode: 'pulse' | 'comprehensive' | 'emergency') {
  return AssessmentModes[mode];
}

export function shouldTriggerEmergency(financialData: {
  cashDays?: number;
  cashBalance?: number;
  payrollAtRisk?: boolean;
  defaultImminent?: boolean;
}): { trigger: boolean; reason: string; severity: string } | null {
  if (financialData.cashBalance !== undefined && financialData.cashBalance < 0) {
    return { trigger: true, reason: 'Negative cash balance', severity: '24_hour' };
  }
  
  if (financialData.cashDays !== undefined && financialData.cashDays < 14) {
    return { 
      trigger: true, 
      reason: `Cash runway critical: ${financialData.cashDays} days`, 
      severity: financialData.cashDays < 7 ? '24_hour' : '72_hour'
    };
  }
  
  if (financialData.payrollAtRisk) {
    return { trigger: true, reason: 'Payroll at risk', severity: '24_hour' };
  }
  
  if (financialData.defaultImminent) {
    return { trigger: true, reason: 'Default on obligations imminent', severity: '72_hour' };
  }
  
  return null;
}

// Progress calculation
export function calculateAssessmentProgress(
  sections: Array<{ status: string; progressPercentage: number }>
): {
  totalSections: number;
  completedSections: number;
  inProgressSections: number;
  notStartedSections: number;
  overallProgress: number;
} {
  const totalSections = sections.length;
  const completedSections = sections.filter(s => s.status === 'complete' || s.status === 'provisional').length;
  const inProgressSections = sections.filter(s => s.status === 'in_progress').length;
  const notStartedSections = sections.filter(s => s.status === 'not_started').length;
  
  const overallProgress = totalSections > 0
    ? Math.round(sections.reduce((sum, s) => sum + s.progressPercentage, 0) / totalSections)
    : 0;
  
  return {
    totalSections,
    completedSections,
    inProgressSections,
    notStartedSections,
    overallProgress
  };
}

// Submission validation
export function validateAssessmentForSubmission(
  sections: Array<{ status: string; requiredQuestions: number; requiredAnswered: number }>,
  gates: Array<{ blocksSubmission: boolean; status: string }>
): {
  canSubmit: boolean;
  missingRequired: string[];
  blockingGates: number;
} {
  const missingRequired: string[] = [];
  
  // Check each section for required questions
  sections.forEach((section, index) => {
    if (section.requiredQuestions > 0 && section.requiredAnswered < section.requiredQuestions) {
      missingRequired.push(`Section ${index + 1}: ${section.requiredQuestions - section.requiredAnswered} required questions unanswered`);
    }
  });
  
  // Check for blocking gates
  const blockingGates = gates.filter(g => g.blocksSubmission && g.status === 'open').length;
  
  return {
    canSubmit: missingRequired.length === 0 && blockingGates === 0,
    missingRequired,
    blockingGates
  };
}

// Score interpretation
export function interpretOverallScore(score: number | null): {
  label: string;
  description: string;
  recommendation: string;
} {
  if (score === null) {
    return {
      label: 'Unknown',
      description: 'Insufficient data to calculate score',
      recommendation: 'Complete the assessment to receive a score'
    };
  }
  
  if (score >= 4.5) {
    return {
      label: 'Excellent',
      description: 'Business is performing exceptionally well across all dimensions',
      recommendation: 'Focus on strategic growth and scaling opportunities'
    };
  }
  
  if (score >= 3.5) {
    return {
      label: 'Good',
      description: 'Business is performing well with minor areas for improvement',
      recommendation: 'Address identified gaps to reach excellence'
    };
  }
  
  if (score >= 2.5) {
    return {
      label: 'Fair',
      description: 'Business has significant room for improvement',
      recommendation: 'Prioritize critical areas for immediate attention'
    };
  }
  
  if (score >= 1.5) {
    return {
      label: 'Needs Improvement',
      description: 'Business faces substantial challenges',
      recommendation: 'Urgent action required on multiple fronts'
    };
  }
  
  return {
    label: 'Critical',
    description: 'Business is in crisis and requires immediate intervention',
    recommendation: 'Emergency stabilization plan required before any growth initiatives'
  };
}

// Export default
export default {
  AssessmentModes,
  EmergencyTriggers,
  getAssessmentWorkflow,
  shouldTriggerEmergency,
  calculateAssessmentProgress,
  validateAssessmentForSubmission,
  interpretOverallScore
};
