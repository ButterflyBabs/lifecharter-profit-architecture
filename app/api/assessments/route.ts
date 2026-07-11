/**
 * Assessments API Route
 * 
 * GET: List assessments
 * POST: Create new assessment
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { AssessmentMode, AssessmentStatus } from '@/lib/assessment/types';

// GET /api/assessments - List assessments
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    const status = searchParams.get('status');
    const mode = searchParams.get('mode');
    const limit = parseInt(searchParams.get('limit') ?? '50');
    const offset = parseInt(searchParams.get('offset') ?? '0');
    
    // Build query
    let query = supabase
      .from('tpa_assessment_runs')
      .select(`
        *,
        business:tpa_businesses(id, name),
        assignedFacilitator:assigned_facilitator_id(id, email),
        assignedReviewer:assigned_reviewer_id(id, email)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    // Apply filters
    if (businessId) {
      query = query.eq('business_id', businessId);
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    if (mode) {
      query = query.eq('mode', mode);
    }
    
    const { data: assessments, error, count } = await query;
    
    if (error) {
      console.error('Error fetching assessments:', error);
      return NextResponse.json({ error: 'Failed to fetch assessments' }, { status: 500 });
    }
    
    return NextResponse.json({ 
      assessments: assessments ?? [],
      pagination: {
        limit,
        offset,
        count: count ?? assessments?.length ?? 0
      }
    });
    
  } catch (error) {
    console.error('Error in assessments GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/assessments - Create new assessment
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse request body
    const body = await request.json();
    const { 
      businessId, 
      methodologyVersionId, 
      mode = 'comprehensive',
      title,
      description,
      isPreliminary = false,
      preliminaryForAssessmentId = null
    } = body;
    
    // Validate required fields
    if (!businessId) {
      return NextResponse.json({ error: 'Business ID is required' }, { status: 400 });
    }
    
    if (!methodologyVersionId) {
      return NextResponse.json({ error: 'Methodology version ID is required' }, { status: 400 });
    }
    
    // Validate mode
    const validModes: AssessmentMode[] = ['pulse', 'comprehensive', 'emergency'];
    if (!validModes.includes(mode)) {
      return NextResponse.json({ error: 'Invalid assessment mode' }, { status: 400 });
    }
    
    // Get business to determine tenant
    const { data: business, error: businessError } = await supabase
      .from('tpa_businesses')
      .select('tenant_id')
      .eq('id', businessId)
      .single();
    
    if (businessError || !business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }
    
    // Check if user has permission to create assessments in this tenant
    const { data: membership, error: membershipError } = await supabase
      .from('tpa_tenant_memberships')
      .select('role')
      .eq('tenant_id', business.tenant_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();
    
    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    const allowedRoles = ['facilitator', 'senior_reviewer', 'organization_admin', 'white_label_admin', 'system_admin'];
    if (!allowedRoles.includes(membership.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    
    // Create assessment
    const { data: assessment, error: createError } = await supabase
      .from('tpa_assessment_runs')
      .insert({
        tenant_id: business.tenant_id,
        business_id: businessId,
        methodology_version_id: methodologyVersionId,
        mode: mode as AssessmentMode,
        status: 'draft' as AssessmentStatus,
        title: title ?? null,
        description: description ?? null,
        is_preliminary: isPreliminary,
        preliminary_for_assessment_id: preliminaryForAssessmentId,
        assigned_facilitator_id: user.id,
        created_by: user.id,
        updated_by: user.id
      })
      .select()
      .single();
    
    if (createError) {
      console.error('Error creating assessment:', createError);
      return NextResponse.json({ error: 'Failed to create assessment' }, { status: 500 });
    }
    
    // Initialize sections for the assessment
    const { data: sectionsInitialized, error: initError } = await supabase.rpc(
      'tpa_initialize_assessment_sections',
      {
        p_assessment_id: assessment.id,
        p_methodology_version_id: methodologyVersionId
      }
    );
    
    if (initError) {
      console.error('Error initializing sections:', initError);
      // Don't fail the request, just log the error
    }
    
    return NextResponse.json({ 
      assessment,
      sectionsInitialized: sectionsInitialized ?? 0
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error in assessments POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
