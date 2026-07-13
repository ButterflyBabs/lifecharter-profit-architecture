import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password, pace } = body

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    })

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
    }

    const userId = authData.user.id

    // Create profile in tpa_profiles table
    const { error: profileError } = await supabase
      .from('tpa_profiles')
      .insert({
        id: userId,
        display_name: name,
        email: email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

    if (profileError) {
      console.error('Profile creation error:', profileError)
      // Don't fail the registration if profile creation fails
      // The user can update their profile later
    }

    // Create pace setting in tpa_pace_settings table
    const { error: paceError } = await supabase
      .from('tpa_pace_settings')
      .insert({
        user_id: userId,
        pace: pace || 'standard',
        effective_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

    if (paceError) {
      console.error('Pace settings creation error:', paceError)
      // Don't fail the registration if pace settings creation fails
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Registration successful',
        user: {
          id: userId,
          email: email,
          name: name,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred during registration' },
      { status: 500 }
    )
  }
}
