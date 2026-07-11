/**
 * Assessment Scoring Engine
 * 
 * Deterministic calculations for The Profit Architecture assessments.
 * No AI scoring - all calculations are formula-based.
 */

// ============================================================================
// Types
// ============================================================================

export interface IndicatorScore {
  indicatorId: string;
  indicatorCode: string;
  score: number | null; // 0-5 or null if unknown
  weight: number;
  confidence: 'high' | 'medium' | 'low' | 'unknown';
  evidenceCount: number;
}

export interface ComponentScore {
  componentId: string;
  componentCode: string;
  rawScore: number | null; // 0-5
  weightedScore: number | null; // 0-5 weighted by component weight
  weight: number; // Component weight (0-100)
  confidence: number; // 0-100
  dataCompleteness: number; // 0-100
  indicatorScores: IndicatorScore[];
}

export interface OverallScore {
  overall: number | null; // 0-5
  founderCapacity: number | null; // 0-5
  profitabilityReadiness: number | null; // 0-5
  growthReadiness: number | null; // 0-5
  confidence: number; // 0-100
  dataCompleteness: number; // 0-100
}

export interface EvidenceQuality {
  type: 'verified_fact' | 'user_reported' | 'calculated_finding' | 'external_benchmark' | 'assumption' | 'professional_judgment' | 'unknown';
  confidence: number; // 0-100
}

export interface FinancialData {
  revenue?: number | null;
  costOfGoodsSold?: number | null;
  operatingExpenses?: number | null;
  netIncome?: number | null;
  cashBalance?: number | null;
  monthlyBurnRate?: number | null;
  accountsReceivable?: number | null;
  accountsPayable?: number | null;
  inventoryValue?: number | null;
  totalAssets?: number | null;
  totalLiabilities?: number | null;
  equity?: number | null;
  // Customer metrics
  totalCustomers?: number | null;
  newCustomers?: number | null;
  churnedCustomers?: number | null;
  // Marketing metrics
  marketingSpend?: number | null;
  // Employee metrics
  employeeCount?: number | null;
  ownerHoursPerWeek?: number | null;
}

// ============================================================================
// Component Score Calculation
// ============================================================================

/**
 * Calculate weighted component score from indicator scores
 * Returns score on 0-5 scale
 */
export function calculateComponentScore(
  indicatorScores: IndicatorScore[],
  weights?: Record<string, number>
): { score: number | null; confidence: number; dataCompleteness: number } {
  if (!indicatorScores || indicatorScores.length === 0) {
    return { score: null, confidence: 0, dataCompleteness: 0 };
  }

  let totalWeight = 0;
  let weightedSum = 0;
  let answeredCount = 0;
  let totalConfidence = 0;

  for (const indicator of indicatorScores) {
    // Skip if score is unknown/null
    if (indicator.score === null || indicator.score === undefined) {
      continue;
    }

    const weight = weights?.[indicator.indicatorId] ?? indicator.weight ?? 1;
    
    // Clamp score to 0-5 range
    const clampedScore = Math.max(0, Math.min(5, indicator.score));
    
    weightedSum += clampedScore * weight;
    totalWeight += weight;
    answeredCount++;
    
    // Convert confidence to numeric
    const confidenceValue = {
      'high': 90,
      'medium': 60,
      'low': 30,
      'unknown': 0
    }[indicator.confidence] ?? 50;
    
    totalConfidence += confidenceValue;
  }

  // Calculate data completeness
  const dataCompleteness = (answeredCount / indicatorScores.length) * 100;

  // If no valid scores, return null
  if (totalWeight === 0) {
    return { score: null, confidence: 0, dataCompleteness };
  }

  // Calculate weighted average score
  const rawScore = weightedSum / totalWeight;
  
  // Calculate average confidence
  const confidence = answeredCount > 0 ? totalConfidence / answeredCount : 0;

  return {
    score: Math.round(rawScore * 100) / 100, // Round to 2 decimal places
    confidence: Math.round(confidence),
    dataCompleteness: Math.round(dataCompleteness * 100) / 100
  };
}

// ============================================================================
// Overall Score Calculation
// ============================================================================

/**
 * Calculate overall assessment score from component scores
 */
export function calculateOverallScore(
  componentScores: ComponentScore[],
  componentWeights?: Record<string, number>
): OverallScore {
  if (!componentScores || componentScores.length === 0) {
    return {
      overall: null,
      founderCapacity: null,
      profitabilityReadiness: null,
      growthReadiness: null,
      confidence: 0,
      dataCompleteness: 0
    };
  }

  let totalWeight = 0;
  let weightedSum = 0;
  let totalConfidence = 0;
  let totalCompleteness = 0;
  let validComponents = 0;

  // Component groupings for sub-scores
  const founderComponents: number[] = [];
  const profitabilityComponents: number[] = [];
  const growthComponents: number[] = [];

  for (const component of componentScores) {
    if (component.rawScore === null || component.rawScore === undefined) {
      continue;
    }

    const weight = componentWeights?.[component.componentId] ?? component.weight ?? 1;
    
    weightedSum += component.rawScore * weight;
    totalWeight += weight;
    totalConfidence += component.confidence;
    totalCompleteness += component.dataCompleteness;
    validComponents++;

    // Categorize by component code for sub-scores
    const code = component.componentCode.toLowerCase();
    if (code.includes('founder') || code.includes('owner') || code.includes('capacity')) {
      founderComponents.push(component.rawScore);
    } else if (code.includes('profit') || code.includes('financial') || code.includes('cash')) {
      profitabilityComponents.push(component.rawScore);
    } else if (code.includes('growth') || code.includes('market') || code.includes('scale')) {
      growthComponents.push(component.rawScore);
    }
  }

  if (totalWeight === 0 || validComponents === 0) {
    return {
      overall: null,
      founderCapacity: null,
      profitabilityReadiness: null,
      growthReadiness: null,
      confidence: 0,
      dataCompleteness: 0
    };
  }

  // Calculate averages
  const overall = Math.round((weightedSum / totalWeight) * 100) / 100;
  const avgConfidence = totalConfidence / validComponents;
  const avgCompleteness = totalCompleteness / validComponents;

  // Calculate sub-scores
  const founderCapacity = founderComponents.length > 0
    ? Math.round((founderComponents.reduce((a, b) => a + b, 0) / founderComponents.length) * 100) / 100
    : null;
  
  const profitabilityReadiness = profitabilityComponents.length > 0
    ? Math.round((profitabilityComponents.reduce((a, b) => a + b, 0) / profitabilityComponents.length) * 100) / 100
    : null;
  
  const growthReadiness = growthComponents.length > 0
    ? Math.round((growthComponents.reduce((a, b) => a + b, 0) / growthComponents.length) * 100) / 100
    : null;

  return {
    overall,
    founderCapacity,
    profitabilityReadiness,
    growthReadiness,
    confidence: Math.round(avgConfidence),
    dataCompleteness: Math.round(avgCompleteness * 100) / 100
  };
}

// ============================================================================
// Data Confidence Calculation
// ============================================================================

/**
 * Calculate data confidence based on answered questions and evidence quality
 */
export function calculateDataConfidence(
  answeredQuestions: number,
  totalQuestions: number,
  evidenceQuality: EvidenceQuality[]
): number {
  if (totalQuestions === 0) {
    return 0;
  }

  // Base confidence from completion rate
  const completionRate = (answeredQuestions / totalQuestions) * 100;

  // Adjust for evidence quality if available
  if (evidenceQuality && evidenceQuality.length > 0) {
    const avgEvidenceConfidence = evidenceQuality.reduce((sum, eq) => sum + eq.confidence, 0) / evidenceQuality.length;
    
    // Weight: 60% completion, 40% evidence quality
    return Math.round((completionRate * 0.6) + (avgEvidenceConfidence * 0.4));
  }

  // Scale completion rate to confidence
  // 100% completion = 90% confidence max (reserve 10% for evidence)
  return Math.round(Math.min(90, completionRate * 0.9));
}

// ============================================================================
// Financial Calculations
// ============================================================================

/**
 * Calculate Gross Profit: Revenue - Cost of Goods Sold
 */
export function calculateGrossProfit(revenue: number | null, costOfGoodsSold: number | null): number | null {
  if (revenue === null || costOfGoodsSold === null) return null;
  return revenue - costOfGoodsSold;
}

/**
 * Calculate Gross Margin: (Gross Profit / Revenue) * 100
 */
export function calculateGrossMargin(revenue: number | null, grossProfit: number | null): number | null {
  if (revenue === null || grossProfit === null || revenue === 0) return null;
  return Math.round((grossProfit / revenue) * 10000) / 100; // 2 decimal places
}

/**
 * Calculate Net Margin: (Net Income / Revenue) * 100
 */
export function calculateNetMargin(revenue: number | null, netIncome: number | null): number | null {
  if (revenue === null || netIncome === null || revenue === 0) return null;
  return Math.round((netIncome / revenue) * 10000) / 100;
}

/**
 * Calculate Contribution Margin: Revenue - Variable Costs
 * Simplified: Uses COGS as proxy for variable costs
 */
export function calculateContributionMargin(revenue: number | null, costOfGoodsSold: number | null): number | null {
  // Same as gross profit
  return calculateGrossProfit(revenue, costOfGoodsSold);
}

/**
 * Calculate Contribution Margin Percentage
 */
export function calculateContributionMarginPercent(revenue: number | null, contributionMargin: number | null): number | null {
  if (revenue === null || contributionMargin === null || revenue === 0) return null;
  return Math.round((contributionMargin / revenue) * 10000) / 100;
}

/**
 * Calculate Break-Even Revenue: Fixed Costs / Contribution Margin %
 * Simplified: Uses Operating Expenses as fixed costs
 */
export function calculateBreakEvenRevenue(
  operatingExpenses: number | null,
  contributionMarginPercent: number | null
): number | null {
  if (operatingExpenses === null || contributionMarginPercent === null || contributionMarginPercent <= 0) return null;
  return Math.round(operatingExpenses / (contributionMarginPercent / 100));
}

/**
 * Calculate Customer Acquisition Cost (CAC)
 * Marketing Spend / New Customers
 */
export function calculateCAC(marketingSpend: number | null, newCustomers: number | null): number | null {
  if (marketingSpend === null || newCustomers === null || newCustomers === 0) return null;
  return Math.round((marketingSpend / newCustomers) * 100) / 100;
}

/**
 * Calculate Lifetime Value (LTV) - Simplified
 * Assumes average customer value = monthly revenue per customer * 12 months * 2 years
 */
export function calculateLTV(
  revenue: number | null,
  totalCustomers: number | null,
  grossMargin: number | null
): number | null {
  if (revenue === null || totalCustomers === null || totalCustomers === 0 || grossMargin === null) return null;
  
  const annualRevenuePerCustomer = (revenue / totalCustomers);
  const grossProfitPerCustomer = annualRevenuePerCustomer * (grossMargin / 100);
  
  // Assume 2-year lifetime for simplicity
  return Math.round(grossProfitPerCustomer * 2 * 100) / 100;
}

/**
 * Calculate LTV:CAC Ratio
 */
export function calculateLTVCACRatio(ltv: number | null, cac: number | null): number | null {
  if (ltv === null || cac === null || cac === 0) return null;
  return Math.round((ltv / cac) * 100) / 100;
}

/**
 * Calculate Churn Rate
 * Churned Customers / Total Customers at start of period
 */
export function calculateChurnRate(churnedCustomers: number | null, totalCustomers: number | null): number | null {
  if (churnedCustomers === null || totalCustomers === null || totalCustomers === 0) return null;
  return Math.round((churnedCustomers / totalCustomers) * 10000) / 100;
}

/**
 * Calculate Retention Rate: 1 - Churn Rate
 */
export function calculateRetentionRate(churnRate: number | null): number | null {
  if (churnRate === null) return null;
  return Math.round((100 - churnRate) * 100) / 100;
}

/**
 * Calculate Monthly Recurring Revenue (MRR)
 * For subscription businesses - simplified as Revenue / 12
 */
export function calculateMRR(annualRevenue: number | null): number | null {
  if (annualRevenue === null) return null;
  return Math.round((annualRevenue / 12) * 100) / 100;
}

/**
 * Calculate Annual Recurring Revenue (ARR)
 * MRR * 12
 */
export function calculateARR(mrr: number | null): number | null {
  if (mrr === null) return null;
  return Math.round(mrr * 12 * 100) / 100;
}

/**
 * Calculate Cash Runway (in months)
 * Cash Balance / Monthly Burn Rate
 */
export function calculateCashRunway(cashBalance: number | null, monthlyBurnRate: number | null): number | null {
  if (cashBalance === null || monthlyBurnRate === null || monthlyBurnRate === 0) return null;
  
  // If burn rate is negative (profitable), return null or large number
  if (monthlyBurnRate < 0) return 999; // Profitable
  
  return Math.round((cashBalance / monthlyBurnRate) * 10) / 10;
}

/**
 * Calculate Revenue per Employee
 */
export function calculateRevenuePerEmployee(revenue: number | null, employeeCount: number | null): number | null {
  if (revenue === null || employeeCount === null || employeeCount === 0) return null;
  return Math.round(revenue / employeeCount);
}

/**
 * Calculate Revenue per Owner Hour
 * Annual Revenue / (Owner Hours per Week * 52)
 */
export function calculateRevenuePerOwnerHour(
  revenue: number | null,
  ownerHoursPerWeek: number | null
): number | null {
  if (revenue === null || ownerHoursPerWeek === null || ownerHoursPerWeek === 0) return null;
  
  const annualOwnerHours = ownerHoursPerWeek * 52;
  return Math.round((revenue / annualOwnerHours) * 100) / 100;
}

/**
 * Calculate Return on Ad Spend (ROAS)
 * Revenue from Ads / Ad Spend
 * Simplified: Total Revenue / Marketing Spend
 */
export function calculateROAS(revenue: number | null, marketingSpend: number | null): number | null {
  if (revenue === null || marketingSpend === null || marketingSpend === 0) return null;
  return Math.round((revenue / marketingSpend) * 100) / 100;
}

/**
 * Calculate Marketing ROI
 * (Revenue - Marketing Spend) / Marketing Spend * 100
 */
export function calculateMarketingROI(revenue: number | null, marketingSpend: number | null): number | null {
  if (revenue === null || marketingSpend === null || marketingSpend === 0) return null;
  return Math.round(((revenue - marketingSpend) / marketingSpend) * 10000) / 100;
}

/**
 * Calculate Inventory Turnover
 * Cost of Goods Sold / Average Inventory
 */
export function calculateInventoryTurnover(
  costOfGoodsSold: number | null,
  inventoryValue: number | null
): number | null {
  if (costOfGoodsSold === null || inventoryValue === null || inventoryValue === 0) return null;
  return Math.round((costOfGoodsSold / inventoryValue) * 100) / 100;
}

/**
 * Calculate Current Ratio
 * Current Assets / Current Liabilities
 * Simplified: Total Assets / Total Liabilities
 */
export function calculateCurrentRatio(totalAssets: number | null, totalLiabilities: number | null): number | null {
  if (totalAssets === null || totalLiabilities === null || totalLiabilities === 0) return null;
  return Math.round((totalAssets / totalLiabilities) * 100) / 100;
}

/**
 * Calculate Debt-to-Equity Ratio
 */
export function calculateDebtToEquity(totalLiabilities: number | null, equity: number | null): number | null {
  if (totalLiabilities === null || equity === null || equity === 0) return null;
  return Math.round((totalLiabilities / equity) * 100) / 100;
}

// ============================================================================
// Critical Gates Detection
// ============================================================================

export interface CriticalGate {
  gateKey: string;
  title: string;
  category: 'financial' | 'operational' | 'legal' | 'founder' | 'market' | 'team' | 'strategic' | 'other';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  impact: string;
  resolutionCriteria: string;
  blocksGrowth: boolean;
  blocksSubmission: boolean;
}

/**
 * Check for critical gates based on assessment data
 */
export function checkCriticalGates(data: FinancialData & Record<string, unknown>): CriticalGate[] {
  const gates: CriticalGate[] = [];

  // Calculate derived metrics
  const grossProfit = calculateGrossProfit(data.revenue ?? null, data.costOfGoodsSold ?? null);
  const cashRunway = calculateCashRunway(data.cashBalance ?? null, data.monthlyBurnRate ?? null);
  const netMargin = calculateNetMargin(data.revenue ?? null, data.netIncome ?? null);

  // === FINANCIAL GATES ===

  // Cash runway < 3 months
  if (cashRunway !== null && cashRunway < 3 && cashRunway > 0) {
    gates.push({
      gateKey: 'cash_runway_critical',
      title: 'Critical Cash Runway',
      category: 'financial',
      severity: 'critical',
      description: `Cash runway is ${cashRunway} months, which is below the critical threshold of 3 months.`,
      impact: 'Business may not be able to meet payroll or obligations in the near term.',
      resolutionCriteria: 'Secure additional funding, reduce burn rate, or accelerate revenue collection to achieve at least 6 months runway.',
      blocksGrowth: true,
      blocksSubmission: true
    });
  }

  // Negative cash balance
  if (data.cashBalance !== null && data.cashBalance < 0) {
    gates.push({
      gateKey: 'negative_cash',
      title: 'Negative Cash Balance',
      category: 'financial',
      severity: 'critical',
      description: 'Business has a negative cash balance, indicating insolvency.',
      impact: 'Immediate risk of business failure, inability to pay obligations.',
      resolutionCriteria: 'Immediate cash infusion or emergency financing required.',
      blocksGrowth: true,
      blocksSubmission: true
    });
  }

  // Severe negative margin
  if (netMargin !== null && netMargin < -20) {
    gates.push({
      gateKey: 'severe_losses',
      title: 'Severe Operating Losses',
      category: 'financial',
      severity: 'critical',
      description: `Net margin of ${netMargin}% indicates severe unprofitability.`,
      impact: 'Business is burning significant capital and may not be viable without structural changes.',
      resolutionCriteria: 'Implement immediate cost reduction or revenue improvement plan.',
      blocksGrowth: true,
      blocksSubmission: false
    });
  }

  // === OPERATIONAL GATES ===

  // High accounts payable vs cash
  if (data.accountsPayable !== null && data.cashBalance !== null && data.accountsPayable > data.cashBalance * 2) {
    gates.push({
      gateKey: 'payables_crisis',
      title: 'Accounts Payable Crisis',
      category: 'operational',
      severity: 'high',
      description: 'Accounts payable significantly exceeds available cash.',
      impact: 'Risk of supplier cutoff, damaged relationships, operational disruption.',
      resolutionCriteria: 'Negotiate payment terms, secure short-term financing, or reduce payables.',
      blocksGrowth: true,
      blocksSubmission: false
    });
  }

  // === FOUNDER GATES ===

  // Excessive owner hours
  if (data.ownerHoursPerWeek !== null && data.ownerHoursPerWeek > 70) {
    gates.push({
      gateKey: 'founder_overwork',
      title: 'Founder Capacity Overload',
      category: 'founder',
      severity: 'high',
      description: `Owner working ${data.ownerHoursPerWeek} hours per week, which is unsustainable.`,
      impact: 'Risk of founder burnout, poor decision-making, health issues.',
      resolutionCriteria: 'Delegate responsibilities, hire support, or reduce scope.',
      blocksGrowth: true,
      blocksSubmission: false
    });
  }

  // === TEAM GATES ===

  // Very small team with high revenue (capacity risk)
  if (data.employeeCount !== null && data.revenue !== null) {
    const revenuePerEmployee = data.revenue / data.employeeCount;
    if (revenuePerEmployee > 1000000) {
      gates.push({
        gateKey: 'team_capacity_risk',
        title: 'Team Capacity Risk',
        category: 'team',
        severity: 'medium',
        description: `Revenue per employee ($${Math.round(revenuePerEmployee).toLocaleString()}) suggests potential understaffing.`,
        impact: 'Team may be overworked, quality may suffer, growth constrained.',
        resolutionCriteria: 'Assess staffing needs and develop hiring plan.',
        blocksGrowth: false,
        blocksSubmission: false
      });
    }
  }

  return gates;
}

// ============================================================================
// Emergency Mode Detection
// ============================================================================

export interface EmergencyTrigger {
  triggered: boolean;
  reason: string;
  severity: '24_hour' | '72_hour' | '7_day' | '30_day';
  actions: string[];
}

/**
 * Check if emergency mode should be triggered
 */
export function checkEmergencyMode(data: FinancialData & Record<string, unknown>): EmergencyTrigger {
  const cashRunway = calculateCashRunway(data.cashBalance ?? null, data.monthlyBurnRate ?? null);
  const netMargin = calculateNetMargin(data.revenue ?? null, data.netIncome ?? null);

  // 24-hour emergency: Negative cash or payroll crisis
  if (data.cashBalance !== null && data.cashBalance < 0) {
    return {
      triggered: true,
      reason: 'Negative cash balance - immediate insolvency risk',
      severity: '24_hour',
      actions: [
        'Contact bank for emergency credit line',
        'Delay non-essential payments',
        'Accelerate receivables collection',
        'Consider emergency capital injection'
      ]
    };
  }

  // 72-hour emergency: < 1 month runway
  if (cashRunway !== null && cashRunway < 1) {
    return {
      triggered: true,
      reason: `Cash runway critical: ${cashRunway} months`,
      severity: '72_hour',
      actions: [
        'Implement immediate expense reduction',
        'Negotiate extended payment terms',
        'Explore emergency financing options',
        'Prepare contingency plans'
      ]
    };
  }

  // 7-day emergency: < 1 month runway
  if (cashRunway !== null && cashRunway < 1) {
    return {
      triggered: true,
      reason: `Cash runway severely limited: ${cashRunway} months`,
      severity: '7_day',
      actions: [
        'Finalize expense reduction plan',
        'Schedule emergency board/investor meeting',
        'Prepare cash flow forecast',
        'Identify quick-win revenue opportunities'
      ]
    };
  }

  // 30-day emergency: < 2 months runway or severe losses
  if ((cashRunway !== null && cashRunway < 2) || (netMargin !== null && netMargin < -30)) {
    return {
      triggered: true,
      reason: cashRunway !== null && cashRunway < 2
        ? `Cash runway limited: ${cashRunway} months`
        : `Severe operating losses: ${netMargin}% net margin`,
      severity: '30_day',
      actions: [
        'Develop comprehensive stabilization plan',
        'Review all discretionary spending',
        'Assess pricing and cost structure',
        'Plan for multiple scenarios'
      ]
    };
  }

  return {
    triggered: false,
    reason: '',
    severity: '30_day',
    actions: []
  };
}

// ============================================================================
// Score Conversion Utilities
// ============================================================================

/**
 * Convert 0-500 integer score to 0.00-5.00 display score
 */
export function toDisplayScore(score500: number | null): number | null {
  if (score500 === null) return null;
  return Math.round(score500) / 100;
}

/**
 * Convert 0.00-5.00 display score to 0-500 integer score
 */
export function toStorageScore(score5: number | null): number | null {
  if (score5 === null) return null;
  return Math.round(score5 * 100);
}

/**
 * Get score label based on 0-5 scale
 */
export function getScoreLabel(score: number | null): string {
  if (score === null) return 'Unknown';
  if (score >= 4.5) return 'Excellent';
  if (score >= 3.5) return 'Good';
  if (score >= 2.5) return 'Fair';
  if (score >= 1.5) return 'Needs Improvement';
  if (score >= 0.5) return 'Critical';
  return 'Not Started';
}

/**
 * Get color code for score
 */
export function getScoreColor(score: number | null): string {
  if (score === null) return 'gray';
  if (score >= 4) return 'green';
  if (score >= 3) return 'blue';
  if (score >= 2) return 'yellow';
  if (score >= 1) return 'orange';
  return 'red';
}
