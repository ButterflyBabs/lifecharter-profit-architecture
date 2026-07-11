import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/prompts
 * Get all prompts or filter by category/key
 * Query params:
 * - category: Filter by category
 * - key: Get specific prompt by key
 * - include_versions: Include all versions (default: false)
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
    const category = searchParams.get('category');
    const key = searchParams.get('key');
    const includeVersions = searchParams.get('include_versions') === 'true';
    
    let query = supabase.from('tpa_prompts').select('*');
    
    // Filter by category
    if (category) {
      query = query.eq('category', category);
    }
    
    // Filter by key
    if (key) {
      query = query.eq('key', key).single();
    } else {
      query = query.order('category', { ascending: true }).order('name', { ascending: true });
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    // If single prompt requested, fetch its versions
    if (key && data) {
      const { data: versions } = await supabase
        .from('tpa_prompt_versions')
        .select('*')
        .eq('prompt_id', (data as any).id)
        .order('created_at', { ascending: false });
      
      return NextResponse.json({
        prompt: data,
        versions: versions || []
      });
    }
    
    // If include_versions requested, fetch for all prompts
    if (includeVersions && Array.isArray(data)) {
      const promptsWithVersions = await Promise.all(
        data.map(async (prompt) => {
          const { data: versions } = await supabase
            .from('tpa_prompt_versions')
            .select('*')
            .eq('prompt_id', prompt.id)
            .order('created_at', { ascending: false });
          
          return { ...prompt, versions: versions || [] };
        })
      );
      
      return NextResponse.json({ prompts: promptsWithVersions });
    }
    
    return NextResponse.json({ prompts: data || [] });
  } catch (error) {
    console.error('Error fetching prompts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prompts' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/prompts
 * Create a new prompt (admin only)
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
    if (!body.key || !body.name || !body.category) {
      return NextResponse.json(
        { error: 'Missing required fields: key, name, category' },
        { status: 400 }
      );
    }
    
    // Validate category
    const validCategories = ['classification', 'analysis', 'synthesis', 'generation', 'advisory'];
    if (!validCategories.includes(body.category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      );
    }
    
    // Create prompt
    const { data: prompt, error } = await supabase
      .from('tpa_prompts')
      .insert({
        key: body.key,
        name: body.name,
        description: body.description,
        category: body.category,
        purpose: body.purpose,
        expected_inputs: body.expected_inputs || [],
        expected_outputs: body.expected_outputs || [],
        input_schema: body.input_schema,
        output_schema: body.output_schema,
        status: body.status || 'draft',
        created_by: user.id,
      })
      .select()
      .single();
    
    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Prompt key already exists' },
          { status: 409 }
        );
      }
      throw error;
    }
    
    // Create initial version if template provided
    if (body.template && prompt) {
      const { error: versionError } = await supabase
        .from('tpa_prompt_versions')
        .insert({
          prompt_id: prompt.id,
          version: body.version || '1.0.0',
          template: body.template,
          template_format: body.template_format || 'handlebars',
          system_prompt: body.system_prompt,
          model_config: body.model_config || {},
          status: 'draft',
          change_summary: body.change_summary || 'Initial version',
          created_by: user.id,
        });
      
      if (versionError) {
        console.error('Error creating initial prompt version:', versionError);
      }
    }
    
    return NextResponse.json({ prompt }, { status: 201 });
  } catch (error) {
    console.error('Error creating prompt:', error);
    return NextResponse.json(
      { error: 'Failed to create prompt' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/prompts
 * Update prompt status or submit for review
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    
    if (!body.prompt_id) {
      return NextResponse.json(
        { error: 'Missing prompt_id' },
        { status: 400 }
      );
    }
    
    // Handle version submission for review
    if (body.action === 'submit_for_review' && body.version_id) {
      const { data, error } = await supabase.rpc('tpa_submit_prompt_for_review', {
        p_version_id: body.version_id,
        p_user_id: user.id
      });
      
      if (error) {
        throw error;
      }
      
      if (!data) {
        return NextResponse.json(
          { error: 'Version not found or not in draft status' },
          { status: 400 }
        );
      }
      
      return NextResponse.json({ success: true, message: 'Submitted for review' });
    }
    
    // Handle version review (approve/reject)
    if (body.action === 'review' && body.version_id) {
      // Check reviewer permissions
      const { data: membership } = await supabase
        .from('tpa_tenant_memberships')
        .select('role')
        .eq('user_id', user.id)
        .in('role', ['senior_reviewer', 'organization_admin', 'white_label_admin', 'system_admin'])
        .single();
      
      if (!membership) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      
      const { data, error } = await supabase.rpc('tpa_review_prompt_version', {
        p_version_id: body.version_id,
        p_reviewer_id: user.id,
        p_approved: body.approved,
        p_notes: body.notes
      });
      
      if (error) {
        throw error;
      }
      
      if (!data) {
        return NextResponse.json(
          { error: 'Version not found or not pending review' },
          { status: 400 }
        );
      }
      
      return NextResponse.json({ 
        success: true, 
        message: body.approved ? 'Version approved' : 'Version rejected'
      });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating prompt:', error);
    return NextResponse.json(
      { error: 'Failed to update prompt' },
      { status: 500 }
    );
  }
}
