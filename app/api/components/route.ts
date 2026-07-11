import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/components
 * Get all components for the active methodology
 * Query params:
 * - methodology_id: Specific methodology version ID
 * - pathway: Filter by applicable pathway
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const methodologyId = searchParams.get('methodology_id');
    const pathway = searchParams.get('pathway');
    
    let query = supabase
      .from('tpa_components')
      .select(`
        *,
        indicators:tpa_component_indicators(
          *,
          indicator:tpa_indicators(*)
        )
      `)
      .eq('status', 'active');
    
    // Filter by methodology if provided
    if (methodologyId) {
      query = query.eq('methodology_version_id', methodologyId);
    } else {
      // Get active methodology
      const { data: activeMethodology } = await supabase
        .from('tpa_methodology_versions')
        .select('id')
        .eq('status', 'active')
        .order('effective_from', { ascending: false })
        .limit(1)
        .single();
      
      if (activeMethodology) {
        query = query.eq('methodology_version_id', activeMethodology.id);
      }
    }
    
    // Filter by pathway if provided
    if (pathway) {
      query = query.or(`is_universal.eq.true,applicable_pathways.cs.{${pathway}}`);
    }
    
    const { data: components, error } = await query.order('sort_order', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({ components: components || [] });
  } catch (error) {
    console.error('Error fetching components:', error);
    return NextResponse.json(
      { error: 'Failed to fetch components' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/components
 * Create a new component (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check admin role
    const { data: membership } = await supabase
      .from('tpa_tenant_memberships')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['organization_admin', 'white_label_admin', 'system_admin'])
      .single();
    
    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const body = await request.json();
    
    // Validate required fields
    if (!body.methodology_version_id || !body.code || !body.name || body.default_weight === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: methodology_version_id, code, name, default_weight' },
        { status: 400 }
      );
    }
    
    // Validate weight
    if (body.default_weight < 0 || body.default_weight > 100) {
      return NextResponse.json(
        { error: 'default_weight must be between 0 and 100' },
        { status: 400 }
      );
    }
    
    // Create component
    const { data: component, error } = await supabase
      .from('tpa_components')
      .insert({
        methodology_version_id: body.methodology_version_id,
        code: body.code,
        name: body.name,
        description: body.description,
        default_weight: body.default_weight,
        sort_order: body.sort_order || 0,
        is_universal: body.is_universal ?? true,
        pathway_specific: body.pathway_specific || false,
        applicable_pathways: body.applicable_pathways || [],
        status: body.status || 'active',
        created_by: user.id,
      })
      .select()
      .single();
    
    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Component code already exists for this methodology version' },
          { status: 409 }
        );
      }
      throw error;
    }
    
    return NextResponse.json({ component }, { status: 201 });
  } catch (error) {
    console.error('Error creating component:', error);
    return NextResponse.json(
      { error: 'Failed to create component' },
      { status: 500 }
    );
  }
}
