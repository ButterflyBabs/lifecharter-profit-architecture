import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/methodology
 * Get the active methodology version with all components
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get active methodology
    const { data: methodology, error: methodologyError } = await supabase
      .from('tpa_methodology_versions')
      .select(`
        *,
        components:tpa_components(
          *,
          indicators:tpa_component_indicators(
            *,
            indicator:tpa_indicators(*)
          )
        )
      `)
      .eq('status', 'active')
      .order('effective_from', { ascending: false })
      .limit(1)
      .single();
    
    if (methodologyError) {
      if (methodologyError.code === 'PGRST116') {
        return NextResponse.json({ error: 'No active methodology found' }, { status: 404 });
      }
      throw methodologyError;
    }
    
    return NextResponse.json({ methodology });
  } catch (error) {
    console.error('Error fetching methodology:', error);
    return NextResponse.json(
      { error: 'Failed to fetch methodology' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/methodology
 * Create a new methodology version (admin only)
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
    if (!body.version || !body.name || !body.effective_from) {
      return NextResponse.json(
        { error: 'Missing required fields: version, name, effective_from' },
        { status: 400 }
      );
    }
    
    // Create methodology version
    const { data: methodology, error } = await supabase
      .from('tpa_methodology_versions')
      .insert({
        version: body.version,
        name: body.name,
        description: body.description,
        status: body.status || 'draft',
        effective_from: body.effective_from,
        effective_until: body.effective_until,
        release_notes: body.release_notes,
        changes_summary: body.changes_summary,
        breaking_changes: body.breaking_changes || false,
        created_by: user.id,
      })
      .select()
      .single();
    
    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Methodology version already exists' },
          { status: 409 }
        );
      }
      throw error;
    }
    
    return NextResponse.json({ methodology }, { status: 201 });
  } catch (error) {
    console.error('Error creating methodology:', error);
    return NextResponse.json(
      { error: 'Failed to create methodology' },
      { status: 500 }
    );
  }
}
