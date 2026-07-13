import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { isDemoCredentials, DEMO_USER, DEMO_SESSION, DEMO_MODE_ENABLED } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Check for demo credentials
    if (DEMO_MODE_ENABLED && isDemoCredentials(email, password)) {
      // Return demo session without hitting Supabase
      return NextResponse.json(
        {
          success: true,
          message: 'Demo login successful',
          demoMode: true,
          session: {
            access_token: DEMO_SESSION.access_token,
            refresh_token: DEMO_SESSION.refresh_token,
            expires_at: DEMO_SESSION.expires_at,
          },
          user: {
            id: DEMO_USER.id,
            email: DEMO_USER.email,
          },
        },
        { status: 200 }
      )
    }

    const supabase = createClient()

    // Authenticate user with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }

    if (!data.session) {
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Login successful',
        demoMode: false,
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at,
        },
        user: {
          id: data.user.id,
          email: data.user.email,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred during login' },
      { status: 500 }
    )
  }
}
