// app/api/businesses/[id]/classification/route.ts
// TPA Pathway Classification API

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { classifyTPA, validateTPAInput } from '@/lib/classification/tpa-logic';
import type { TPAClassificationInput } from '@/lib/classification/tpa-types';
import { z } from 'zod';

// Validation schema for classification
const classificationSchema = z.object({
  stage: z.enum([
    'idea_stage',
    'pre_revenue',
    'early_stage',
    'growth_stage',
    'established',
    'pivot_turnaround',
  ]),
  revenue_range: z.enum([
    'zero',
    '1_to_50k',
    '50k_to_100k',
    '100k_to_250k',
    '250k_to_500k',
    '500k_to_1m',
    '1m_to_5m',
    '5m_plus',
  ]),
  team_size: z.enum([
    'solo',
    'two_to_five',
    'six_to_ten',
    'eleven_to_25',
    'twenty_six_to_50',
    'fifty_plus',
  ]),
  primary_challenge: z.enum([
    'finding_customers',
    'pricing_profitability',
    'time_overwhelm',
    'systems_processes',
    'team_leadership',
    'cash_flow',
    'marketing',
    'scaling_strategy',
    'product_development',
    'work_life_balance',
  ]),
  growth_intent: z.enum([
    'lifestyle',
    'steady_growth',
    'aggressive_growth',
    'prepare_exit',
    'passive_income',
    'pivot_model',
  ]),
  notes: z.string().optional(),
});

// POST /api/businesses/[id]/classification - Create or update classification
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { id: businessId } = params;
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = classificationSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Get business to verify access and get tenant_id
    const { data: business, error: businessError } = await supabase
      .from('tpa_businesses')
      .select('id, tenant_id')
      .eq('id', businessId)
      .single();

    if (businessError) {
      if (businessError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Business not found' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Failed to fetch business' }, { status: 500 });
    }

    // Run classification logic
    const classificationInput: TPAClassificationInput = {
      stage: data.stage,
      revenueRange: data.revenue_range,
      teamSize: data.team_size,
      primaryChallenge: data.primary_challenge,
      growthIntent: data.growth_intent,
    };

    const classification = classifyTPA(classificationInput);

    // Check if classification already exists
    const { data: existingClassification } = await supabase
      .from('tpa_pathway_classifications')
      .select('id')
      .eq('business_id', businessId)
      .single();

    let savedClassification;
    
    if (existingClassification) {
      // Update existing classification
      const { data: updated, error: updateError } = await supabase
        .from('tpa_pathway_classifications')
        .update({
          stage: data.stage,
          revenue_range: data.revenue_range,
          team_size: data.team_size,
          primary_challenge: data.primary_challenge,
          growth_intent: data.growth_intent,
          pathway: classification.pathway,
          pathway_number: classification.pathwayNumber,
          confidence: classification.confidence,
          notes: data.notes,
          classified_at: new Date().toISOString(),
          classified_by: user.id,
        })
        .eq('id', existingClassification.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating classification:', updateError);
        return NextResponse.json({ error: 'Failed to update classification' }, { status: 500 });
      }
      
      savedClassification = updated;
    } else {
      // Create new classification
      const { data: created, error: createError } = await supabase
        .from('tpa_pathway_classifications')
        .insert({
          business_id: businessId,
          tenant_id: business.tenant_id,
          stage: data.stage,
          revenue_range: data.revenue_range,
          team_size: data.team_size,
          primary_challenge: data.primary_challenge,
          growth_intent: data.growth_intent,
          pathway: classification.pathway,
          pathway_number: classification.pathwayNumber,
          confidence: classification.confidence,
          notes: data.notes,
          classified_at: new Date().toISOString(),
          classified_by: user.id,
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating classification:', createError);
        return NextResponse.json({ error: 'Failed to create classification' }, { status: 500 });
      }
      
      savedClassification = created;
    }

    return NextResponse.json({
      classification: savedClassification,
      result: classification,
    });
  } catch (error) {
    console.error('Error in POST /api/businesses/[id]/classification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/businesses/[id]/classification - Get classification for business
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { id: businessId } = params;
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch classification
    const { data: classification, error } = await supabase
      .from('tpa_pathway_classifications')
      .select('*')
      .eq('business_id', businessId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ classification: null }, { status: 200 });
      }
      console.error('Error fetching classification:', error);
      return NextResponse.json({ error: 'Failed to fetch classification' }, { status: 500 });
    }

    return NextResponse.json({ classification });
  } catch (error) {
    console.error('Error in GET /api/businesses/[id]/classification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/businesses/[id]/classification - Delete classification
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { id: businessId } = params;
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete classification
    const { error } = await supabase
      .from('tpa_pathway_classifications')
      .delete()
      .eq('business_id', businessId);

    if (error) {
      console.error('Error deleting classification:', error);
      return NextResponse.json({ error: 'Failed to delete classification' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/businesses/[id]/classification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
