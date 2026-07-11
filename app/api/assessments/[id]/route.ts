/**
 * Assessment Detail API Route
 * 
 * GET: Get assessment details
 * PATCH: Update assessment
 * DELETE: Delete assessment
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { isValidStatusTransition, AssessmentStatus } from '@/lib/assessment/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/assessments/[id] - Get assessment details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Fetch assessment with related data
    const { data: assessment, error } = await supabase
      .from('tpa_assessment_runs')
      .select(`
        *,
        business:tpa_businesses(id, name, organization_type),
        methodology:tpa_methodology_versions(id, version_number, status),
        assignedFacilitator:assigned_facilitator_id(id, email, raw_user_meta_data),
        assignedReviewer:assigned_reviewer_id(id, email, raw_user_meta_data),
        preliminaryFor:preliminary_for_assessment_id(id, assessment_number),
        supersededBy:superseded_by_assessment_id(id, assessment_number)
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
      }
      console.error('Error fetching assessment:', error);
      return NextResponse.json({ error: 'Failed to fetch assessment' }, { status: 500 });
    }
    
    // Fetch sections
    const { data: sections, error: sectionsError } = await supabase
      .from('tpa_assessment_sections')
      .select('*')
      .eq('assessment_id', id)
      .order('sort_order', { ascending: true });
    
    if (sectionsError) {
      console.error('Error fetching sections:', sectionsError);
    }
    
    // Fetch critical gates
    const { data: gates, error: gatesError } = await supabase
      .from('tpa_critical_gates')
      .select('*')
      .eq('assessment_id', id)
      .order('severity', { ascending: true });
    
    if (gatesError) {
      console.error('Error fetching gates:', gatesError);
    }
    
    // Calculate progress
    const totalSections = sections?.length ?? 0;
    const completedSections = sections?.filter(s => s.status === 'complete' || s.status === 'provisional').length ?? 0;
    const overallProgress = totalSections > 0 
      ? Math.round((sections?.reduce((sum, s) => sum + s.progress_percentage, 0) ?? 0) / totalSections)
      : 0;
    
    // Check for blocking gates
    const blockingGates = gates?.filter(g => g.blocks_growth && g.status === 'open').length ?? 0;
    
    return NextResponse.json({
      assessment,
      sections: sections ?? [],
      gates: gates ?? [],
      summary: {
        totalSections,
        completedSections,
        overallProgress,
        blockingGates,
        canSubmit: overallProgress >= 80 && blockingGates === 0,
        canApprove: assessment.status === 'in_review'
      }
    });
    
  } catch (error) {
    console.error('Error in assessment GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/assessments/[id] - Update assessment
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse request body
    const body = await request.json();
    const { 
      status,
      title,
      description,
      assignedFacilitatorId,
      assignedReviewerId,
      heldReason,
      determinedPathway,
      determinedStage
    } = body;
    
    // Fetch current assessment
    const { data: currentAssessment, error: fetchError } = await supabase
      .from('tpa_assessment_runs')
      .select('status')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Failed to fetch assessment' }, { status: 500 });
    }
    
    // Validate status transition if status is being updated
    if (status && status !== currentAssessment.status) {
      if (!isValidStatusTransition(currentAssessment.status as AssessmentStatus, status as AssessmentStatus)) {
        return NextResponse.json({ 
          error: `Invalid status transition from ${currentAssessment.status} to ${status}` 
        }, { status: 400 });
      }
    }
    
    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      updated_by: user.id
    };
    
    if (status) updateData.status = status;
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (assignedFacilitatorId !== undefined) updateData.assigned_facilitator_id = assignedFacilitatorId;
    if (assignedReviewerId !== undefined) updateData.assigned_reviewer_id = assignedReviewerId;
    if (heldReason !== undefined) updateData.held_reason = heldReason;
    if (determinedPathway !== undefined) updateData.determined_pathway = determinedPathway;
    if (determinedStage !== undefined) updateData.determined_stage = determinedStage;
    
    // Update assessment
    const { data: assessment, error: updateError } = await supabase
      .from('tpa_assessment_runs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating assessment:', updateError);
      return NextResponse.json({ error: 'Failed to update assessment' }, { status: 500 });
    }
    
    return NextResponse.json({ assessment });
    
  } catch (error) {
    console.error('Error in assessment PATCH:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/assessments/[id] - Delete assessment
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user has admin permissions
    const { data: assessment } = await supabase
      .from('tpa_assessment_runs')
      .select('tenant_id')
      .eq('id', id)
      .single();
    
    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }
    
    const { data: membership } = await supabase
      .from('tpa_tenant_memberships')
      .select('role')
      .eq('tenant_id', assessment.tenant_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();
    
    const adminRoles = ['organization_admin', 'white_label_admin', 'system_admin'];
    if (!membership || !adminRoles.includes(membership.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    
    // Delete assessment (cascades to sections, responses, etc.)
    const { error: deleteError } = await supabase
      .from('tpa_assessment_runs')
      .delete()
      .eq('id', id);
    
    if (deleteError) {
      console.error('Error deleting assessment:', deleteError);
      return NextResponse.json({ error: 'Failed to delete assessment' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error in assessment DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
