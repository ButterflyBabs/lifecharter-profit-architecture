/**
 * Pace Configuration for The Profit Architecture Build
 * 
 * Users can select their preferred pace:
 * - Aggressive: 16 weeks, parallel workstreams
 * - Standard: 20 weeks, balanced approach (default)
 * - Conservative: 25 weeks, risk-averse with buffers
 */

export type Pace = 'aggressive' | 'standard' | 'conservative';

export interface PaceConfig {
  name: string;
  totalWeeks: number;
  weeksPerPhase: number;
  parallelFactor: number; // 0-1, higher = more parallel work
  description: string;
  characteristics: string[];
}

export const paceConfigs: Record<Pace, PaceConfig> = {
  aggressive: {
    name: 'Aggressive',
    totalWeeks: 16,
    weeksPerPhase: 1.3,
    parallelFactor: 0.7,
    description: 'Maximum velocity with parallel workstreams',
    characteristics: [
      'Multiple phases running simultaneously',
      'Higher daily task velocity',
      'Tighter deadlines',
      'Less buffer time',
      'Requires dedicated focus'
    ]
  },
  standard: {
    name: 'Standard',
    totalWeeks: 20,
    weeksPerPhase: 1.7,
    parallelFactor: 0.5,
    description: 'Balanced approach with quality gates',
    characteristics: [
      'Sequential phases with strategic overlap',
      'Moderate daily velocity',
      'Built-in testing gates',
      'Reasonable buffer time',
      'Sustainable pace'
    ]
  },
  conservative: {
    name: 'Conservative',
    totalWeeks: 25,
    weeksPerPhase: 2.1,
    parallelFactor: 0.3,
    description: 'Risk-averse with thorough testing',
    characteristics: [
      'Minimal parallel work',
      'Lower daily velocity',
      'Extensive testing at each gate',
      'Generous buffer time',
      'Maximum quality assurance'
    ]
  }
};

export const defaultPace: Pace = 'standard';

export function getPaceConfig(pace: Pace): PaceConfig {
  return paceConfigs[pace];
}

export function calculatePhaseDuration(
  baseWeeks: number,
  pace: Pace
): number {
  const config = paceConfigs[pace];
  return Math.round(baseWeeks * (config.weeksPerPhase / 1.7));
}

export function getEstimatedCompletionDate(
  pace: Pace,
  startDate: Date = new Date()
): Date {
  const config = paceConfigs[pace];
  const completionDate = new Date(startDate);
  completionDate.setDate(completionDate.getDate() + (config.totalWeeks * 7));
  return completionDate;
}
