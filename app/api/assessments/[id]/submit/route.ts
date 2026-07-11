/**
 * Assessment Submission API Route
 * 
 * POST: Submit assessment for review
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { validateAssessmentForSubmission } from '@/lib/assessment';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/assessments/[id]/submit - Submit assessment for review
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Fetch assessment with sections and gates
    const { data: assessment, error: assessmentError } = await supabase
      .from('tpa_assessment_runs')
      .select('status, tenant_id, assigned_facilitator_id')
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
    
    // Check if user is assigned facilitator or has higher role
    const isAssigned = assessment.assigned_facilitator_id === user.id;
    const canSubmit = isAssigned || ['senior_reviewer', 'organization_admin', 'white_label_admin', 'system_admin'].includes(membership.role);
    
    if (!canSubmit) {
      return NextResponse.json({ error: 'Only assigned facilitator or reviewers can submit' }, { status: 403 });
    }
    
    // Check current status
    if (assessment.status !== 'in_progress' && assessment.status !== 'awaiting_information') {
      return NextResponse.json({ 
        error: `Cannot submit assessment in ${assessment.status} status` 
      }, { status: 400 });
    }
    
    // Fetch sections for validation
    const { data: sections, error: sectionsError } = await supabase
      .from('tpa_assessment_sections')
      .select('status, required_questions, required_answered')
      .eq('assessment_id', id);
    
    if (sectionsError) {
      console.error('Error fetching sections:', sectionsError);
      return NextResponse.json({ error: 'Failed to validate assessment' }, { status: 500 });
    }
    
    // Fetch blocking gates
    const { data: gates, error: gatesError } = await supabase
      .from('tpa_critical_gates')
      .select('blocks_assessment_submission, status')
      .eq('assessment_id', id)
      .in('status', ['open', 'contained']);
    
    if (gatesError) {
      console.error('Error fetching gates:', gatesError);
    }
    
    // Validate for submission
    const validation = validateAssessmentForSubmission(
      sections?.map(s => ({
        status: s.status,
        requiredQuestions: s.required_questions,
        requiredAnswered: s.required_answered
      })) ?? [],
      gates?.map(g => ({
        blocksSubmission: g.blocks_assessment_submission,
        status: g.status
      })) ?? []
    );
    
    // Parse request body for force flag
    const body = await request.json().catch(() => ({}));
    const forceSubmit = body.force === true;
    
    // If not valid and not forcing, return validation errors
    if (!validation.canSubmit && !forceSubmit) {
      return NextResponse.json({
        error: 'Assessment cannot be submitted',
        validation: {
          canSubmit: false,
          missingRequired: validation.missingRequired,
          blockingGates: validation.blockingGates
        }
      }, { status: 400 });
    }
    
    // Update assessment status to submitted
    const { data: updatedAssessment, error: updateError } = await supabase
      .from('tpa_assessment_runs')
      .update({
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        updated_by: user.id
      })
      .eq('id', id)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error submitting assessment:', updateError);
      return NextResponse.json({ error: 'Failed to submit assessment' }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      assessment: updatedAssessment,
      validation: {
        canSubmit: true,
        warnings: forceSubmit ? {
          missingRequired: validation.missingRequired,
          blockingGates: validation.blockingGates
        } : undefined
      }
    });
    
  } catch (error) {
    console.error('Error in assessment submit:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
