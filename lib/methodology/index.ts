/**
 * The Profit Architecture - Methodology Framework
 * Helper functions for working with the assessment methodology
 */

import { createClient } from '@/lib/supabase/client';

// Types
export interface MethodologyVersion {
  id: string;
  version: string;
  name: string;
  description: string | null;
  status: 'draft' | 'active' | 'retired';
  effective_from: string;
  effective_until: string | null;
  release_notes: string | null;
  changes_summary: string | null;
  breaking_changes: boolean;
}

export interface Component {
  id: string;
  methodology_version_id: string;
  code: string;
  name: string;
  description: string | null;
  default_weight: number;
  sort_order: number;
  is_universal: boolean;
  pathway_specific: boolean;
  applicable_pathways: string[];
  status: 'active' | 'inactive' | 'deprecated';
}

export interface Indicator {
  id: string;
  code: string;
  name: string;
  description: string | null;
  guidance_score_0: string;
  guidance_score_1: string;
  guidance_score_2: string;
  guidance_score_3: string;
  guidance_score_4: string;
  guidance_score_5: string;
  guidance_unknown: string | null;
  applies_to_pathways: string[];
  applies_to_organization_types: string[];
  applies_to_stages: string[];
  default_weight: number;
  status: 'active' | 'inactive' | 'deprecated';
}

export interface ComponentIndicator {
  id: string;
  component_id: string;
  indicator_id: string;
  weight: number;
  sort_order: number;
  component_specific_guidance: string | null;
  status: 'active' | 'inactive';
  indicator?: Indicator;
}

export interface IndicatorScore {
  indicator_id: string;
  score: number | null;
  evidence?: string;
  confidence?: 'high' | 'medium' | 'low';
}

export interface ComponentScore {
  component_id: string;
  weighted_score: number | null;
  indicator_scores: IndicatorScore[];
}

export interface Prompt {
  id: string;
  key: string;
  name: string;
  description: string | null;
  category: 'classification' | 'analysis' | 'synthesis' | 'generation' | 'advisory';
  purpose: string | null;
  expected_inputs: string[] | null;
  expected_outputs: string[] | null;
  input_schema: object | null;
  output_schema: object | null;
  status: 'draft' | 'active' | 'deprecated';
}

export interface PromptVersion {
  id: string;
  prompt_id: string;
  version: string;
  template: string;
  template_format: 'handlebars' | 'jinja2' | 'plain' | 'markdown';
  system_prompt: string | null;
  model_config: object;
  status: 'draft' | 'pending_review' | 'active' | 'rejected' | 'archived';
  submitted_for_review_at: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  change_summary: string | null;
  usage_count: number;
  last_used_at: string | null;
}

/**
 * Get the currently active methodology version
 */
export async function getActiveMethodology(): Promise<MethodologyVersion | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('tpa_methodology_versions')
    .select('*')
    .eq('status', 'active')
    .order('effective_from', { ascending: false })
    .limit(1)
    .single();
  
  if (error || !data) {
    console.error('Error fetching active methodology:', error);
    return null;
  }
  
  return data as MethodologyVersion;
}

/**
 * Get all components for a methodology version
 */
export async function getComponents(
  methodologyVersionId: string
): Promise<Component[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('tpa_components')
    .select('*')
    .eq('methodology_version_id', methodologyVersionId)
    .eq('status', 'active')
    .order('sort_order', { ascending: true });
  
  if (error) {
    console.error('Error fetching components:', error);
    return [];
  }
  
  return data as Component[];
}

/**
 * Get indicators for a specific component
 */
export async function getComponentIndicators(
  componentId: string
): Promise<ComponentIndicator[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('tpa_component_indicators')
    .select(`
      *,
      indicator:tpa_indicators(*)
    `)
    .eq('component_id', componentId)
    .eq('status', 'active')
    .order('sort_order', { ascending: true });
  
  if (error) {
    console.error('Error fetching component indicators:', error);
    return [];
  }
  
  return data as ComponentIndicator[];
}

/**
 * Get all indicators (optionally filtered by pathway)
 */
export async function getIndicators(
  pathway?: string,
  organizationType?: string,
  stage?: string
): Promise<Indicator[]> {
  const supabase = createClient();
  
  let query = supabase
    .from('tpa_indicators')
    .select('*')
    .eq('status', 'active');
  
  // Apply pathway filter if provided
  if (pathway) {
    query = query.or(`applies_to_pathways.cs.{${pathway}},applies_to_pathways.eq.{}`);
  }
  
  const { data, error } = await query.order('code', { ascending: true });
  
  if (error) {
    console.error('Error fetching indicators:', error);
    return [];
  }
  
  // Client-side filtering for more complex cases
  let indicators = data as Indicator[];
  
  if (organizationType) {
    indicators = indicators.filter(
      i => i.applies_to_organization_types.length === 0 || 
           i.applies_to_organization_types.includes(organizationType)
    );
  }
  
  if (stage) {
    indicators = indicators.filter(
      i => i.applies_to_stages.length === 0 || 
           i.applies_to_stages.includes(stage)
    );
  }
  
  return indicators;
}

/**
 * Get applicable indicators for a business based on pathway, type, and stage
 * Uses the database function for server-side filtering
 */
export async function getApplicableIndicators(
  pathway: string,
  organizationType?: string,
  stage?: string
): Promise<{ indicator_id: string; indicator_code: string; indicator_name: string; is_applicable: boolean }[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .rpc('tpa_get_applicable_indicators', {
      p_pathway: pathway,
      p_org_type: organizationType || null,
      p_stage: stage || null
    });
  
  if (error) {
    console.error('Error fetching applicable indicators:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Calculate weighted component score from indicator scores
 */
export async function calculateComponentScore(
  componentId: string,
  indicatorScores: IndicatorScore[]
): Promise<number | null> {
  const supabase = createClient();
  
  // Convert to JSON format expected by the database function
  const scoresJson = indicatorScores.reduce((acc, score) => {
    if (score.score !== null) {
      acc[score.indicator_id] = score.score;
    }
    return acc;
  }, {} as Record<string, number>);
  
  const { data, error } = await supabase
    .rpc('tpa_calculate_component_score', {
      p_component_id: componentId,
      p_indicator_scores: scoresJson
    });
  
  if (error) {
    console.error('Error calculating component score:', error);
    return null;
  }
  
  return data;
}

/**
 * Calculate component score locally (client-side)
 * Use this when you have all the data already loaded
 */
export function calculateComponentScoreLocal(
  componentIndicators: ComponentIndicator[],
  indicatorScores: Map<string, number | null>
): number | null {
  let totalWeightedScore = 0;
  let totalWeight = 0;
  
  for (const ci of componentIndicators) {
    const score = indicatorScores.get(ci.indicator_id);
    if (score !== null && score !== undefined) {
      // Clamp score to 0-5 range
      const clampedScore = Math.max(0, Math.min(5, score));
      totalWeightedScore += clampedScore * ci.weight;
      totalWeight += ci.weight;
    }
  }
  
  if (totalWeight === 0) {
    return null;
  }
  
  return Math.round((totalWeightedScore / totalWeight) * 100) / 100;
}

/**
 * Get a prompt by its key
 */
export async function getPromptByKey(key: string): Promise<Prompt | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('tpa_prompts')
    .select('*')
    .eq('key', key)
    .single();
  
  if (error || !data) {
    console.error('Error fetching prompt:', error);
    return null;
  }
  
  return data as Prompt;
}

/**
 * Get the active version of a prompt
 */
export async function getActivePromptVersion(
  promptId: string
): Promise<PromptVersion | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('tpa_prompt_versions')
    .select('*')
    .eq('prompt_id', promptId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  if (error || !data) {
    console.error('Error fetching active prompt version:', error);
    return null;
  }
  
  return data as PromptVersion;
}

/**
 * Get active prompt with version by key (convenience function)
 */
export async function getActivePrompt(
  promptKey: string
): Promise<{ prompt: Prompt; version: PromptVersion } | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .rpc('tpa_get_active_prompt', {
      p_prompt_key: promptKey
    });
  
  if (error || !data || data.length === 0) {
    console.error('Error fetching active prompt:', error);
    return null;
  }
  
  const result = data[0];
  
  return {
    prompt: {
      id: result.prompt_id,
      key: result.prompt_key,
      name: result.prompt_name,
      // These will need to be fetched separately if needed
    } as Prompt,
    version: {
      id: result.version_id,
      prompt_id: result.prompt_id,
      version: result.version,
      template: result.template,
    } as PromptVersion
  };
}

/**
 * Validate that a prompt version is active and ready for use
 */
export function validatePromptVersion(version: PromptVersion): {
  valid: boolean;
  error?: string;
} {
  if (version.status !== 'active') {
    return {
      valid: false,
      error: `Prompt version is not active (status: ${version.status})`
    };
  }
  
  if (!version.template || version.template.trim().length === 0) {
    return {
      valid: false,
      error: 'Prompt template is empty'
    };
  }
  
  return { valid: true };
}

/**
 * Get all prompts in a category
 */
export async function getPromptsByCategory(
  category: Prompt['category']
): Promise<Prompt[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('tpa_prompts')
    .select('*')
    .eq('category', category)
    .eq('status', 'active')
    .order('name', { ascending: true });
  
  if (error) {
    console.error('Error fetching prompts by category:', error);
    return [];
  }
  
  return data as Prompt[];
}

/**
 * Get methodology summary with all components and indicator counts
 */
export async function getMethodologySummary(
  methodologyVersionId?: string
): Promise<{
  methodology: MethodologyVersion | null;
  components: (Component & { indicator_count: number })[];
  totalIndicators: number;
} | null> {
  const supabase = createClient();
  
  // Get methodology
  let methodology: MethodologyVersion | null;
  
  if (methodologyVersionId) {
    const { data } = await supabase
      .from('tpa_methodology_versions')
      .select('*')
      .eq('id', methodologyVersionId)
      .single();
    methodology = data as MethodologyVersion;
  } else {
    methodology = await getActiveMethodology();
  }
  
  if (!methodology) {
    return null;
  }
  
  // Get components with indicator counts
  const { data: components, error } = await supabase
    .from('tpa_components')
    .select(`
      *,
      indicator_count:tpa_component_indicators(count)
    `)
    .eq('methodology_version_id', methodology.id)
    .eq('status', 'active')
    .order('sort_order', { ascending: true });
  
  if (error) {
    console.error('Error fetching methodology summary:', error);
    return null;
  }
  
  const componentsWithCount = components as (Component & { indicator_count: number })[];
  const totalIndicators = componentsWithCount.reduce(
    (sum, c) => sum + (c.indicator_count || 0), 
    0
  );
  
  return {
    methodology,
    components: componentsWithCount,
    totalIndicators
  };
}

/**
 * Score interpretation helpers
 */
export function interpretScore(score: number | null): {
  label: string;
  color: string;
  description: string;
} {
  if (score === null) {
    return {
      label: 'Unknown',
      color: 'gray',
      description: 'Insufficient data to assess'
    };
  }
  
  if (score < 1) {
    return {
      label: 'Critical',
      color: 'red',
      description: 'Severe issues requiring immediate attention'
    };
  }
  
  if (score < 2) {
    return {
      label: 'Poor',
      color: 'orange',
      description: 'Significant weaknesses present'
    };
  }
  
  if (score < 3) {
    return {
      label: 'Fair',
      color: 'yellow',
      description: 'Below average, room for improvement'
    };
  }
  
  if (score < 4) {
    return {
      label: 'Good',
      color: 'blue',
      description: 'Meeting expectations'
    };
  }
  
  if (score < 5) {
    return {
      label: 'Strong',
      color: 'green',
      description: 'Above average performance'
    };
  }
  
  return {
    label: 'Excellent',
    color: 'emerald',
    description: 'Best-in-class performance'
  };
}

/**
 * Get scoring guidance for an indicator
 */
export function getIndicatorGuidance(
  indicator: Indicator,
  score: number | null
): string {
  if (score === null) {
    return indicator.guidance_unknown || 'No data available';
  }
  
  const scoreKey = `guidance_score_${Math.floor(score)}` as keyof Indicator;
  return (indicator[scoreKey] as string) || 'No guidance available for this score';
}
