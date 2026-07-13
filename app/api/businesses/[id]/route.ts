// app/api/businesses/[id]/route.ts
// Single business CRUD operations

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schema for updating a business
const updateBusinessSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  alias: z.string().max(255).optional().nullable(),
  organization_type: z.enum(['for_profit', 'nonprofit', 'social_enterprise', 'cooperative']).optional(),
  industry: z.string().optional().nullable(), // Legacy field
  industry_category: z.string().optional(),
  industry_subcategory: z.string().optional(),
  industry_other: z.string().optional().nullable(),
  location_city: z.string().optional().nullable(),
  location_state: z.string().optional().nullable(),
  location_country: z.string().optional().nullable(),
  years_operating: z.number().min(0).optional().nullable(),
  founded_year: z.number().min(1800).max(new Date().getFullYear()).optional().nullable(),
  status: z.enum(['active', 'inactive', 'archived']).optional(),
  goals: z.array(z.object({
    id: z.string(),
    text: z.string(),
    priority: z.enum(['critical', 'high', 'medium', 'low']).optional(),
    timeframe: z.enum(['immediate', 'short_term', 'medium_term', 'long_term']).optional(),
    type: z.enum(['predefined', 'other']).optional(),
  })).optional(),
  concerns: z.array(z.object({
    id: z.string(),
    text: z.string(),
    severity: z.enum(['critical', 'high', 'medium', 'low']).optional(),
    type: z.enum(['predefined', 'other']).optional(),
  })).optional(),
});

// GET /api/businesses/[id] - Get a single business
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { id } = params;
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch business with related data
    const { data: business, error } = await supabase
      .from('tpa_businesses')
      .select(`
        *,
        tpa_business_assignments(
          id,
          user_id,
          role,
          status,
          assigned_at,
          user:tpa_profiles(id, display_name, email, avatar_url)
        ),
        tpa_business_classifications(
          *,
          classified_by_user:tpa_profiles!classified_by(id, display_name, email)
        ),
        tpa_business_team_members(*),
        tpa_business_goals(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Business not found' }, { status: 404 });
      }
      console.error('Error fetching business:', error);
      return NextResponse.json({ error: 'Failed to fetch business' }, { status: 500 });
    }

    return NextResponse.json({ business });
  } catch (error) {
    console.error('Error in GET /api/businesses/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/businesses/[id] - Update a business
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { id } = params;
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateBusinessSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Check if business exists and user has access
    const { data: existingBusiness, error: fetchError } = await supabase
      .from('tpa_businesses')
      .select('tenant_id')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Business not found' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Failed to fetch business' }, { status: 500 });
    }

    // Build industry field from category and subcategory if provided
    let industryValue = data.industry;
    if (data.industry_category) {
      industryValue = data.industry_subcategory
        ? `${data.industry_category}:${data.industry_subcategory}`
        : data.industry_category;
    }

    // Update business
    const updateData: Record<string, unknown> = {
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.alias !== undefined) updateData.alias = data.alias;
    if (data.organization_type !== undefined) updateData.organization_type = data.organization_type;
    if (industryValue !== undefined) updateData.industry = industryValue;
    if (data.industry_other !== undefined) updateData.industry_other = data.industry_other;
    if (data.location_city !== undefined) updateData.location_city = data.location_city;
    if (data.location_state !== undefined) updateData.location_state = data.location_state;
    if (data.location_country !== undefined) updateData.location_country = data.location_country;
    if (data.years_operating !== undefined) updateData.years_operating = data.years_operating;
    if (data.founded_year !== undefined) updateData.founded_year = data.founded_year;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.goals !== undefined) updateData.goals = data.goals;
    if (data.concerns !== undefined) updateData.concerns = data.concerns;

    const { data: business, error: updateError } = await supabase
      .from('tpa_businesses')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating business:', updateError);
      return NextResponse.json({ error: 'Failed to update business' }, { status: 500 });
    }

    return NextResponse.json({ business });
  } catch (error) {
    console.error('Error in PUT /api/businesses/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/businesses/[id] - Delete a business
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { id } = params;
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if business exists
    const { data: existingBusiness, error: fetchError } = await supabase
      .from('tpa_businesses')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Business not found' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Failed to fetch business' }, { status: 500 });
    }

    // Delete business (cascade will handle related records)
    const { error: deleteError } = await supabase
      .from('tpa_businesses')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting business:', deleteError);
      return NextResponse.json({ error: 'Failed to delete business' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/businesses/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
