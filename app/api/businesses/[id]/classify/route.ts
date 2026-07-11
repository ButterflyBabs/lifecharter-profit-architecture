// app/api/businesses/[id]/classify/route.ts
// Business classification API

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { classifyBusiness, calculateConfidence, type ClassificationInput } from '@/lib/business/classification';
import { z } from 'zod';

// Validation schema for classification
const classifyBusinessSchema = z.object({
  organization_type: z.enum(['for_profit', 'nonprofit', 'social_enterprise', 'cooperative']),
  business_models: z.array(z.enum([
    'product_sales',
    'service_delivery',
    'subscription',
    'membership',
    'licensing',
    'advertising',
    'transaction_fees',
    'freemium',
    'marketplace',
    'franchise',
    'donation_based',
    'grant_funded',
    'hybrid',
  ])).min(1),
  customer_types: z.array(z.enum(['b2b', 'b2c', 'b2b2c', 'b2g', 'hybrid'])).min(1),
  stages: z.array(z.enum([
    'concept_prelaunch',
    'startup_validation',
    'early_traction',
    'established',
    'turnaround',
    'growth',
    'scale',
    'exit_transition',
  ])).min(1),
  has_inventory: z.boolean().optional(),
  has_recurring_revenue: z.boolean().optional(),
  is_capacity_constrained: z.boolean().optional(),
  has_donors: z.boolean().optional(),
  has_grants: z.boolean().optional(),
  has_board: z.boolean().optional(),
  notes: z.string().optional(),
  confirm: z.boolean().default(false),
});

// POST /api/businesses/[id]/classify - Create or update classification
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
    const validationResult = classifyBusinessSchema.safeParse(body);
    
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
      .select('id, tenant_id, organization_type')
      .eq('id', businessId)
      .single();

    if (businessError) {
      if (businessError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Business not found' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Failed to fetch business' }, { status: 500 });
    }

    // Run classification logic
    const classificationInput: ClassificationInput = {
      organizationType: data.organization_type,
      businessModels: data.business_models,
      customerTypes: data.customer_types,
      stages: data.stages,
      hasInventory: data.has_inventory,
      hasRecurringRevenue: data.has_recurring_revenue,
      isCapacityConstrained: data.is_capacity_constrained,
      hasDonors: data.has_donors,
      hasGrants: data.has_grants,
      hasBoard: data.has_board,
    };

    const classification = classifyBusiness(classificationInput);

    // If not confirming, just return the classification result
    if (!data.confirm) {
      return NextResponse.json({
        classification,
        preview: true,
      });
    }

    // Supersede any existing confirmed classifications
    await supabase
      .from('tpa_business_classifications')
      .update({ status: 'superseded' })
      .eq('business_id', businessId)
      .eq('status', 'confirmed');

    // Save the classification
    const { data: savedClassification, error: saveError } = await supabase
      .from('tpa_business_classifications')
      .insert({
        business_id: businessId,
        tenant_id: business.tenant_id,
        organization_type: classification.organizationType,
        business_models: classification.businessModels,
        customer_types: classification.customerTypes,
        stages: classification.stages,
        primary_pathway: classification.primaryPathway,
        secondary_pathways: classification.secondaryPathways,
        confidence: classification.confidence,
        evidence: classification.evidence,
        status: 'confirmed',
        classified_at: new Date().toISOString(),
        classified_by: user.id,
        confirmed_at: new Date().toISOString(),
        confirmed_by: user.id,
        notes: data.notes,
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving classification:', saveError);
      return NextResponse.json({ error: 'Failed to save classification' }, { status: 500 });
    }

    // Update business organization_type if it changed
    if (business.organization_type !== classification.organizationType) {
      await supabase
        .from('tpa_businesses')
        .update({
          organization_type: classification.organizationType,
          updated_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', businessId);
    }

    return NextResponse.json({
      classification: savedClassification,
      preview: false,
    });
  } catch (error) {
    console.error('Error in POST /api/businesses/[id]/classify:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/businesses/[id]/classify - Get classification history
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

    // Fetch classification history
    const { data: classifications, error } = await supabase
      .from('tpa_business_classifications')
      .select(`
        *,
        classified_by_user:tpa_profiles!classified_by(id, display_name, email),
        confirmed_by_user:tpa_profiles!confirmed_by(id, display_name, email)
      `)
      .eq('business_id', businessId)
      .order('classified_at', { ascending: false });

    if (error) {
      console.error('Error fetching classifications:', error);
      return NextResponse.json({ error: 'Failed to fetch classifications' }, { status: 500 });
    }

    return NextResponse.json({ classifications });
  } catch (error) {
    console.error('Error in GET /api/businesses/[id]/classify:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
