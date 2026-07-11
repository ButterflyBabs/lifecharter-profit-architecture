// app/api/businesses/[id]/team/route.ts
// Team member management API

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schema for creating a team member
const createTeamMemberSchema = z.object({
  name: z.string().min(1).max(255),
  role: z.string().min(1).max(255),
  role_category: z.enum(['owner', 'leadership', 'operations', 'sales', 'marketing', 'finance', 'technical', 'support', 'other']).optional(),
  capacity_hours: z.number().min(0).max(168).optional(),
  capacity_type: z.enum(['full_time', 'part_time', 'contract', 'variable']).optional(),
  cost_per_hour: z.number().min(0).optional(),
  cost_per_month: z.number().min(0).optional(),
  employment_type: z.enum(['employee', 'contractor', 'owner', 'volunteer', 'intern']).optional(),
  start_date: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

// GET /api/businesses/[id]/team - List team members
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

    // Fetch team members
    const { data: teamMembers, error } = await supabase
      .from('tpa_business_team_members')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching team members:', error);
      return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 });
    }

    return NextResponse.json({ teamMembers });
  } catch (error) {
    console.error('Error in GET /api/businesses/[id]/team:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/businesses/[id]/team - Add a team member
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
    const validationResult = createTeamMemberSchema.safeParse(body);
    
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

    // Create team member
    const { data: teamMember, error: createError } = await supabase
      .from('tpa_business_team_members')
      .insert({
        business_id: businessId,
        tenant_id: business.tenant_id,
        name: data.name,
        role: data.role,
        role_category: data.role_category,
        capacity_hours: data.capacity_hours,
        capacity_type: data.capacity_type,
        cost_per_hour: data.cost_per_hour,
        cost_per_month: data.cost_per_month,
        employment_type: data.employment_type,
        start_date: data.start_date,
        email: data.email,
        phone: data.phone,
        notes: data.notes,
        created_by: user.id,
        updated_by: user.id,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating team member:', createError);
      return NextResponse.json({ error: 'Failed to create team member' }, { status: 500 });
    }

    return NextResponse.json({ teamMember }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/businesses/[id]/team:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
