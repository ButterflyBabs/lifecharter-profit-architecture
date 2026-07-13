'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DEMO_CREDENTIALS, DEMO_MODE_ENABLED, setDemoMode } from '@/lib/auth'
import { Sparkles } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await performLogin(formData.email, formData.password)
  }

  const handleDemoLogin = async () => {
    await performLogin(DEMO_CREDENTIALS.email, DEMO_CREDENTIALS.password, true)
  }

  const performLogin = async (email: string, password: string, isDemo: boolean = false) => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }

      // Set the session in the client
      const supabase = createClient()
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      })

      // Handle session error but don't block demo mode
      if (sessionError) {
        console.warn('Session set warning:', sessionError)
      }

      // Set demo mode flag if this is a demo login
      // This must be set AFTER session is stored so dashboard can detect it
      if (isDemo || data.demoMode) {
        setDemoMode(true)
      }

      // Login successful - redirect to dashboard
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#F6F1E8] via-[#FDFBF7] to-[#F6F1E8] flex items-center justify-center py-12 px-4 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-[#CDBFD6]/15 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-80 h-80 bg-[#2E7C83]/10 rounded-full blur-3xl" />
      
      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 bg-gradient-to-br from-[#1F315B] to-[#5E3B6C] border border-[#D4AF63]/40 shadow-sacred">
            <span className="text-[#D4AF63] font-display font-bold text-2xl">P</span>
          </div>
          <p className="font-editorial italic text-[#5E3B6C] text-lg mb-2">Welcome Back</p>
          <h2 className="font-display text-4xl font-bold text-[#1F315B]">Sign In</h2>
          <p className="mt-3 font-body text-[#1F315B]/70">
            Continue your journey with The Profit Architecture
          </p>
        </div>

        <div className="bg-[#FDFBF7] rounded-2xl shadow-sacred border border-[#D4AF63]/20 p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-700 text-sm font-body">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#1F315B] mb-2 font-body">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                className="w-full px-4 py-3 rounded-xl border border-[#D4AF63]/30 bg-[#F6F1E8] text-[#1F315B] placeholder-[#1F315B]/40 focus:outline-none focus:ring-2 focus:ring-[#D4AF63]/50 focus:border-[#D4AF63] transition-all font-body disabled:bg-[#F6F1E8]/50 disabled:cursor-not-allowed"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#1F315B] mb-2 font-body">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
                className="w-full px-4 py-3 rounded-xl border border-[#D4AF63]/30 bg-[#F6F1E8] text-[#1F315B] placeholder-[#1F315B]/40 focus:outline-none focus:ring-2 focus:ring-[#D4AF63]/50 focus:border-[#D4AF63] transition-all font-body disabled:bg-[#F6F1E8]/50 disabled:cursor-not-allowed"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3.5 bg-gradient-to-r from-[#1F315B] to-[#2a3f6e] text-[#F6F1E8] rounded-xl font-semibold hover:shadow-lg hover:shadow-[#1F315B]/25 transition-all duration-300 font-body disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 border border-[#D4AF63]/30"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#F6F1E8] border-t-transparent rounded-full animate-spin"></div>
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Demo Login Button */}
          {DEMO_MODE_ENABLED && (
            <div className="mt-4 pt-4 border-t border-[#D4AF63]/20">
              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={loading}
                className="w-full px-4 py-3 bg-[#D4AF63]/10 hover:bg-[#D4AF63]/20 text-[#1F315B] rounded-xl font-semibold transition-all duration-300 font-body disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 border border-[#D4AF63]/40"
              >
                <Sparkles className="w-4 h-4" />
                {loading ? 'Signing in...' : 'Try Demo Mode'}
              </button>
              <p className="mt-2 text-center text-xs font-body text-[#1F315B]/50">
                Preview the platform without creating an account
              </p>
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm font-body text-[#1F315B]/70">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-[#5E3B6C] hover:text-[#1F315B] font-medium transition-colors">
                Get started
              </Link>
            </p>
          </div>
          
          {/* Demo credentials hint */}
          {DEMO_MODE_ENABLED && (
            <div className="mt-4 p-3 bg-[#D4AF63]/5 rounded-lg border border-[#D4AF63]/20">
              <p className="text-xs font-body text-[#1F315B]/60 text-center">
                <span className="font-medium">Demo credentials:</span><br />
                Email: {DEMO_CREDENTIALS.email}<br />
                Password: {DEMO_CREDENTIALS.password}
              </p>
            </div>
          )}
        </div>

        <div className="text-center">
          <Link href="/" className="text-sm font-body text-[#1F315B]/60 hover:text-[#1F315B] transition-colors">
            ← Back to home
          </Link>
        </div>
      </div>
    </main>
  )
}