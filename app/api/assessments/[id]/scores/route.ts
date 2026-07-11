/**
 * Assessment Scores API Route
 *
 * GET: Get calculated scores for assessment
 * POST: Calculate/refresh scores
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  calculateComponentScore,
  calculateOverallScore,
  toStorageScore,
  type IndicatorScore
} from '@/lib/assessment/scoring';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/assessments/[id]/scores - Get scores
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch assessment
    const { data: assessment, error: assessmentError } = await supabase
      .from('tpa_assessment_runs')
      .select('tenant_id, overall_score, founder_capacity_score, profitability_readiness_score, growth_readiness_score, data_confidence')
      .eq('id', id)
      .single();

    if (assessmentError || !assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    // Fetch component scores with details
    const { data: componentScores, error: scoresError } = await supabase
      .from('tpa_component_scores')
      .select(`
        *,
        component:tpa_components(id, code, name, default_weight)
      `)
      .eq('assessment_id', id)
      .order('score_version', { ascending: false });

    if (scoresError) {
      console.error('Error fetching component scores:', scoresError);
    }

    // Get latest version of each component score
    const latestScores = new Map();
    componentScores?.forEach(score => {
      if (!latestScores.has(score.component_id)) {
        latestScores.set(score.component_id, score);
      }
    });

    return NextResponse.json({
      assessment: {
        overallScore: assessment.overall_score,
        founderCapacityScore: assessment.founder_capacity_score,
        profitabilityReadinessScore: assessment.profitability_readiness_score,
        growthReadinessScore: assessment.growth_readiness_score,
        dataConfidence: assessment.data_confidence
      },
      componentScores: Array.from(latestScores.values()).map(score => ({
        id: score.id,
        componentId: score.component_id,
        componentCode: score.component?.code,
        componentName: score.component?.name,
        rawScore: score.raw_score,
        weightedScore: score.weighted_score,
        weightApplied: score.weight_applied,
        confidenceLevel: score.confidence_level,
        confidenceScore: score.confidence_score,
        dataCompleteness: score.data_completeness,
        status: score.status,
        indicatorScores: score.indicator_scores,
        calculatedAt: score.calculated_at
      }))
    });

  } catch (error) {
    console.error('Error in scores GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/assessments/[id]/scores - Calculate scores
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch assessment
    const { data: assessment, error: assessmentError } = await supabase
      .from('tpa_assessment_runs')
      .select('tenant_id, methodology_version_id, status')
      .eq('id', id)
      .single();

    if (assessmentError || !assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    // Check permissions
    const { data: membership } = await supabase
      .from('tpa_tenant_memberships')
      .select('role')
      .eq('tenant_id', assessment.tenant_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    const allowedRoles = ['facilitator', 'senior_reviewer', 'organization_admin', 'white_label_admin', 'system_admin'];
    if (!membership || !allowedRoles.includes(membership.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Cannot calculate scores for approved/superseded assessments
    if (assessment.status === 'approved' || assessment.status === 'superseded') {
      return NextResponse.json({
        error: `Cannot calculate scores for ${assessment.status} assessment`
      }, { status: 400 });
    }

    // Fetch components for this methodology version
    const { data: components, error: componentsError } = await supabase
      .from('tpa_components')
      .select('id, code, name, default_weight')
      .eq('methodology_version_id', assessment.methodology_version_id)
      .eq('status', 'active');

    if (componentsError) {
      console.error('Error fetching components:', componentsError);
      return NextResponse.json({ error: 'Failed to fetch components' }, { status: 500 });
    }

    // Calculate scores for each component
    const calculatedScores = [];
    for (const component of components ?? []) {
      // Use the database function to calculate component score
      const { data: scoreId, error: calcError } = await supabase.rpc(
        'tpa_calculate_component_score_deterministic',
        {
          p_assessment_id: id,
          p_component_id: component.id,
          p_calculated_by: user.id
        }
      );

      if (calcError) {
        console.error(`Error calculating score for component ${component.id}:`, calcError);
        continue;
      }

      calculatedScores.push({
        componentId: component.id,
        scoreId: scoreId
      });
    }

    // Fetch all calculated scores to compute overall
    const { data: allScores, error: fetchScoresError } = await supabase
      .from('tpa_component_scores')
      .select('raw_score, weighted_score, confidence_score, data_completeness')
      .eq('assessment_id', id)
      .eq('status', 'draft');

    if (fetchScoresError) {
      console.error('Error fetching calculated scores:', fetchScoresError);
    }

    // Calculate overall scores
    const validScores = allScores?.filter(s => s.raw_score !== null) ?? [];

    let overallScore: number | null = null;
    let founderCapacityScore: number | null = null;
    let profitabilityReadinessScore: number | null = null;
    let growthReadinessScore: number | null = null;
    let avgConfidence = 0;
    let avgCompleteness = 0;

    if (validScores.length > 0) {
      // Simple average for overall
      const sumScores = validScores.reduce((sum, s) => sum + (s.raw_score ?? 0), 0);
      overallScore = Math.round(sumScores / validScores.length);

      // Average confidence and completeness
      avgConfidence = Math.round(
        validScores.reduce((sum, s) => sum + (s.confidence_score ?? 0), 0) / validScores.length
      );
      avgCompleteness = Math.round(
        validScores.reduce((sum, s) => sum + (s.data_completeness ?? 0), 0) / validScores.length
      );
    }

    // Update assessment with overall scores
    const { data: updatedAssessment, error: updateError } = await supabase
      .from('tpa_assessment_runs')
      .update({
        overall_score: overallScore,
        founder_capacity_score: founderCapacityScore,
        profitability_readiness_score: profitabilityReadinessScore,
        growth_readiness_score: growthReadinessScore,
        data_confidence: avgConfidence,
        updated_at: new Date().toISOString(),
        updated_by: user.id
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating assessment scores:', updateError);
    }

    return NextResponse.json({
      success: true,
      calculated: calculatedScores.length,
      scores: {
        overall: overallScore,
        founderCapacity: founderCapacityScore,
        profitabilityReadiness: profitabilityReadinessScore,
        growthReadiness: growthReadinessScore,
        confidence: avgConfidence,
        dataCompleteness: avgCompleteness
      },
      assessment: updatedAssessment
    });

  } catch (error) {
    console.error('Error in scores POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
