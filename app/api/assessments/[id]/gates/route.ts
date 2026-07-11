/**
 * Assessment Gates API Route
 *
 * GET: List critical gates for assessment
 * POST: Create or check for gates
 * PATCH: Update gate status
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { checkCriticalGates, type FinancialData } from '@/lib/assessment/scoring';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/assessments/[id]/gates - List gates
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const severity = searchParams.get('severity');

    // Build query
    let query = supabase
      .from('tpa_critical_gates')
      .select(`
        *,
        assignedTo:assigned_to(id, email),
        owner:owner_id(id, email)
      `)
      .eq('assessment_id', id)
      .order('severity', { ascending: true });

    if (status) {
      query = query.eq('status', status);
    }

    if (severity) {
      query = query.eq('severity', severity);
    }

    const { data: gates, error } = await query;

    if (error) {
      console.error('Error fetching gates:', error);
      return NextResponse.json({ error: 'Failed to fetch gates' }, { status: 500 });
    }

    // Calculate summary
    const summary = {
      total: gates?.length ?? 0,
      bySeverity: {
        critical: gates?.filter(g => g.severity === 'critical').length ?? 0,
        high: gates?.filter(g => g.severity === 'high').length ?? 0,
        medium: gates?.filter(g => g.severity === 'medium').length ?? 0,
        low: gates?.filter(g => g.severity === 'low').length ?? 0
      },
      byStatus: {
        open: gates?.filter(g => g.status === 'open').length ?? 0,
        contained: gates?.filter(g => g.status === 'contained').length ?? 0,
        resolved: gates?.filter(g => g.status === 'resolved').length ?? 0,
        accepted: gates?.filter(g => g.status === 'accepted').length ?? 0
      },
      blockingGrowth: gates?.filter(g => g.blocks_growth && g.status === 'open').length ?? 0,
      blockingSubmission: gates?.filter(g => g.blocks_assessment_submission && g.status === 'open').length ?? 0
    };

    return NextResponse.json({
      gates: gates ?? [],
      summary
    });

  } catch (error) {
    console.error('Error in gates GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/assessments/[id]/gates - Check for gates or create new gate
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
    const body = await request.json();
    const { action = 'check', ...gateData } = body;

    // Fetch assessment
    const { data: assessment, error: assessmentError } = await supabase
      .from('tpa_assessment_runs')
      .select('tenant_id, status')
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

    if (action === 'check') {
      // Auto-detect gates from financial data
      // Fetch responses with financial data
      const { data: responses, error: responsesError } = await supabase
        .from('tpa_section_responses')
        .select('question_key, numeric_value, response_data')
        .eq('assessment_id', id)
        .eq('is_answered', true);

      if (responsesError) {
        console.error('Error fetching responses:', responsesError);
      }

      // Extract financial data from responses
      const financialData: FinancialData = {};
      responses?.forEach(r => {
        const key = r.question_key.toLowerCase();
        if (key.includes('revenue')) financialData.revenue = r.numeric_value ?? undefined;
        if (key.includes('cogs') || key.includes('cost_of_goods')) financialData.costOfGoodsSold = r.numeric_value ?? undefined;
        if (key.includes('expense')) financialData.operatingExpenses = r.numeric_value ?? undefined;
        if (key.includes('net_income')) financialData.netIncome = r.numeric_value ?? undefined;
        if (key.includes('cash')) financialData.cashBalance = r.numeric_value ?? undefined;
        if (key.includes('burn')) financialData.monthlyBurnRate = r.numeric_value ?? undefined;
        if (key.includes('customer') && !key.includes('new')) financialData.totalCustomers = r.numeric_value ?? undefined;
        if (key.includes('new_customer')) financialData.newCustomers = r.numeric_value ?? undefined;
        if (key.includes('churn')) financialData.churnedCustomers = r.numeric_value ?? undefined;
        if (key.includes('marketing')) financialData.marketingSpend = r.numeric_value ?? undefined;
        if (key.includes('employee')) financialData.employeeCount = r.numeric_value ?? undefined;
        if (key.includes('owner_hour')) financialData.ownerHoursPerWeek = r.numeric_value ?? undefined;
      });

      // Check for gates
      const detectedGates = checkCriticalGates(financialData);

      // Create gates that don't already exist
      const createdGates = [];
      for (const gate of detectedGates) {
        // Check if gate already exists
        const { data: existing } = await supabase
          .from('tpa_critical_gates')
          .select('id')
          .eq('assessment_id', id)
          .eq('gate_key', gate.gateKey)
          .single();

        if (!existing) {
          const { data: newGate, error: createError } = await supabase
            .from('tpa_critical_gates')
            .insert({
              assessment_id: id,
              tenant_id: assessment.tenant_id,
              gate_key: gate.gateKey,
              title: gate.title,
              description: gate.description,
              gate_category: gate.category,
              severity: gate.severity,
              impact_description: gate.impact,
              resolution_criteria: gate.resolutionCriteria,
              blocks_growth: gate.blocksGrowth,
              blocks_assessment_submission: gate.blocksSubmission,
              detection_method: 'automatic',
              detection_trigger: 'financial_calculation',
              created_by: user.id,
              detected_by: user.id
            })
            .select()
            .single();

          if (!createError && newGate) {
            createdGates.push(newGate);
          }
        }
      }

      return NextResponse.json({
        checked: true,
        detected: detectedGates.length,
        created: createdGates.length,
        gates: createdGates
      });

    } else if (action === 'create') {
      // Manual gate creation
      const {
        gateKey,
        title,
        description,
        category,
        severity,
        impactDescription,
        resolutionCriteria,
        blocksGrowth = true,
        blocksSubmission = false
      } = gateData;

      if (!gateKey || !title || !category || !severity) {
        return NextResponse.json({
          error: 'Missing required fields: gateKey, title, category, severity'
        }, { status: 400 });
      }

      const { data: newGate, error: createError } = await supabase
        .from('tpa_critical_gates')
        .insert({
          assessment_id: id,
          tenant_id: assessment.tenant_id,
          gate_key: gateKey,
          title,
          description,
          gate_category: category,
          severity,
          impact_description: impactDescription,
          resolution_criteria: resolutionCriteria,
          blocks_growth: blocksGrowth,
          blocks_assessment_submission: blocksSubmission,
          detection_method: 'facilitator_review',
          created_by: user.id,
          detected_by: user.id
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating gate:', createError);
        return NextResponse.json({ error: 'Failed to create gate' }, { status: 500 });
      }

      return NextResponse.json({ gate: newGate }, { status: 201 });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Error in gates POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/assessments/[id]/gates - Update gate status
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
      gateId,
      status,
      assignedTo,
      targetResolutionDate,
      resolutionNotes,
      containmentMeasures
    } = body;

    if (!gateId) {
      return NextResponse.json({ error: 'Gate ID is required' }, { status: 400 });
    }

    // Fetch assessment for permission check
    const { data: assessment } = await supabase
      .from('tpa_assessment_runs')
      .select('tenant_id')
      .eq('id', id)
      .single();

    if (!assessment) {
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

    // Build update data
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      updated_by: user.id
    };

    if (status) updateData.status = status;
    if (assignedTo !== undefined) updateData.assigned_to = assignedTo;
    if (targetResolutionDate !== undefined) updateData.target_resolution_date = targetResolutionDate;
    if (resolutionNotes !== undefined) updateData.resolution_notes = resolutionNotes;
    if (containmentMeasures !== undefined) updateData.containment_measures = containmentMeasures;

    // If resolving, set resolved info
    if (status === 'resolved') {
      updateData.resolved_at = new Date().toISOString();
      updateData.resolved_by = user.id;
      updateData.blocks_growth = false;
      updateData.blocks_assessment_submission = false;
    }

    // If containing, set containment info
    if (status === 'contained') {
      updateData.containment_expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
    }

    const { data: updatedGate, error: updateError } = await supabase
      .from('tpa_critical_gates')
      .update(updateData)
      .eq('id', gateId)
      .eq('assessment_id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating gate:', updateError);
      return NextResponse.json({ error: 'Failed to update gate' }, { status: 500 });
    }

    return NextResponse.json({ gate: updatedGate });

  } catch (error) {
    console.error('Error in gates PATCH:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
