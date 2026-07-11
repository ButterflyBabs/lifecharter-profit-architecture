/**
 * Assessment Approval API Route
 * 
 * POST: Approve assessment (reviewer action)
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/assessments/[id]/approve - Approve assessment
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse request body
    const body = await request.json().catch(() => ({}));
    const { 
      action = 'approve', // 'approve', 'reject', 'request_changes'
      notes 
    } = body;
    
    // Fetch assessment
    const { data: assessment, error: assessmentError } = await supabase
      .from('tpa_assessment_runs')
      .select('status, tenant_id, assigned_reviewer_id')
      .eq('id', id)
      .single();
    
    if (assessmentError || !assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }
    
    // Check permissions - only senior reviewers and above can approve
    const { data: membership } = await supabase
      .from('tpa_tenant_memberships')
      .select('role')
      .eq('tenant_id', assessment.tenant_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();
    
    const allowedRoles = ['senior_reviewer', 'organization_admin', 'white_label_admin', 'system_admin'];
    if (!membership || !allowedRoles.includes(membership.role)) {
      return NextResponse.json({ error: 'Only senior reviewers and above can approve assessments' }, { status: 403 });
    }
    
    // Check current status
    if (assessment.status !== 'in_review' && assessment.status !== 'submitted') {
      return NextResponse.json({ 
        error: `Cannot approve assessment in ${assessment.status} status` 
      }, { status: 400 });
    }
    
    let updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      updated_by: user.id
    };
    
    // Handle different actions
    switch (action) {
      case 'approve':
        updateData = {
          ...updateData,
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: user.id,
          completed_at: new Date().toISOString()
        };
        break;
        
      case 'reject':
        updateData = {
          ...updateData,
          status: 'held',
          held_at: new Date().toISOString(),
          held_reason: notes || 'Assessment rejected by reviewer'
        };
        break;
        
      case 'request_changes':
        updateData = {
          ...updateData,
          status: 'awaiting_information',
          held_reason: notes || 'Additional information required'
        };
        break;
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
    
    // Update assessment
    const { data: updatedAssessment, error: updateError } = await supabase
      .from('tpa_assessment_runs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating assessment:', updateError);
      return NextResponse.json({ error: 'Failed to process approval' }, { status: 500 });
    }
    
    // If approved, approve all component scores
    if (action === 'approve') {
      const { error: scoresError } = await supabase
        .from('tpa_component_scores')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('assessment_id', id)
        .in('status', ['draft', 'reviewed']);
      
      if (scoresError) {
        console.error('Error approving component scores:', scoresError);
      }
    }
    
    return NextResponse.json({
      success: true,
      action,
      assessment: updatedAssessment
    });
    
  } catch (error) {
    console.error('Error in assessment approve:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
