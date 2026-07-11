// app/api/businesses/route.ts
// Business CRUD API routes

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schema for creating a business
const createBusinessSchema = z.object({
  tenant_id: z.string().uuid(),
  name: z.string().min(1).max(255),
  alias: z.string().max(255).optional(),
  organization_type: z.enum(['for_profit', 'nonprofit', 'social_enterprise', 'cooperative']),
  industry: z.string().optional(),
  industry_other: z.string().optional(),
  location_city: z.string().optional(),
  location_state: z.string().optional(),
  location_country: z.string().default('US'),
  years_operating: z.number().min(0).optional(),
  founded_year: z.number().min(1800).max(new Date().getFullYear()).optional(),
  goals: z.array(z.object({
    id: z.string(),
    text: z.string(),
    priority: z.enum(['critical', 'high', 'medium', 'low']).optional(),
    timeframe: z.enum(['immediate', 'short_term', 'medium_term', 'long_term']).optional(),
  })).default([]),
  concerns: z.array(z.object({
    id: z.string(),
    text: z.string(),
    severity: z.enum(['critical', 'high', 'medium', 'low']).optional(),
  })).default([]),
});

// GET /api/businesses - List businesses
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenant_id');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = supabase
      .from('tpa_businesses')
      .select(`
        *,
        tpa_business_assignments(
          id,
          user_id,
          role,
          status,
          user:tpa_profiles(id, display_name, email, avatar_url)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit)
      .range(offset, offset + limit - 1);

    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data: businesses, error } = await query;

    if (error) {
      console.error('Error fetching businesses:', error);
      return NextResponse.json({ error: 'Failed to fetch businesses' }, { status: 500 });
    }

    return NextResponse.json({ businesses });
  } catch (error) {
    console.error('Error in GET /api/businesses:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/businesses - Create a business
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = createBusinessSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Verify user has access to the tenant
    const { data: membership, error: membershipError } = await supabase
      .from('tpa_tenant_memberships')
      .select('role')
      .eq('tenant_id', data.tenant_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Access denied to tenant' }, { status: 403 });
    }

    // Create business
    const { data: business, error: createError } = await supabase
      .from('tpa_businesses')
      .insert({
        tenant_id: data.tenant_id,
        name: data.name,
        alias: data.alias,
        organization_type: data.organization_type,
        industry: data.industry,
        industry_other: data.industry_other,
        location_city: data.location_city,
        location_state: data.location_state,
        location_country: data.location_country,
        years_operating: data.years_operating,
        founded_year: data.founded_year,
        goals: data.goals,
        concerns: data.concerns,
        created_by: user.id,
        updated_by: user.id,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating business:', createError);
      return NextResponse.json({ error: 'Failed to create business' }, { status: 500 });
    }

    // Create primary facilitator assignment for the creator
    await supabase
      .from('tpa_business_assignments')
      .insert({
        business_id: business.id,
        user_id: user.id,
        tenant_id: data.tenant_id,
        role: 'primary_facilitator',
        status: 'active',
        assigned_by: user.id,
      });

    return NextResponse.json({ business }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/businesses:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
