'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    pace: 'standard',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      // Registration successful - redirect to dashboard
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const paceOptions = [
    { value: 'standard', label: 'Standard (20 weeks) - Recommended', icon: '🌿', color: '#5E3B6C' },
    { value: 'aggressive', label: 'Aggressive (16 weeks)', icon: '⚡', color: '#2E7C83' },
    { value: 'conservative', label: 'Conservative (25 weeks)', icon: '🐢', color: '#1F315B' },
  ]

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
          <p className="font-editorial italic text-[#5E3B6C] text-lg mb-2">Begin Your Journey</p>
          <h2 className="font-display text-4xl font-bold text-[#1F315B]">Get Started</h2>
          <p className="mt-3 font-body text-[#1F315B]/70">
            Create your account to begin your assessment
          </p>
        </div>

        <div className="bg-[#FDFBF7] rounded-2xl shadow-sacred border border-[#D4AF63]/20 p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-700 text-sm font-body">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-[#1F315B] mb-2 font-body">
                Full name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                disabled={loading}
                className="w-full px-4 py-3 rounded-xl border border-[#D4AF63]/30 bg-[#F6F1E8] text-[#1F315B] placeholder-[#1F315B]/40 focus:outline-none focus:ring-2 focus:ring-[#D4AF63]/50 focus:border-[#D4AF63] transition-all font-body disabled:bg-[#F6F1E8]/50 disabled:cursor-not-allowed"
                placeholder="Your name"
              />
            </div>

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
                minLength={6}
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
                className="w-full px-4 py-3 rounded-xl border border-[#D4AF63]/30 bg-[#F6F1E8] text-[#1F315B] placeholder-[#1F315B]/40 focus:outline-none focus:ring-2 focus:ring-[#D4AF63]/50 focus:border-[#D4AF63] transition-all font-body disabled:bg-[#F6F1E8]/50 disabled:cursor-not-allowed"
                placeholder="••••••••"
              />
              <p className="mt-1.5 text-xs font-body text-[#1F315B]/50">Must be at least 6 characters</p>
            </div>

            <div>
              <label htmlFor="pace" className="block text-sm font-medium text-[#1F315B] mb-2 font-body">
                Preferred pace
              </label>
              <div className="relative">
                <select
                  id="pace"
                  name="pace"
                  value={formData.pace}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full px-4 py-3 rounded-xl border border-[#D4AF63]/30 bg-[#F6F1E8] text-[#1F315B] focus:outline-none focus:ring-2 focus:ring-[#D4AF63]/50 focus:border-[#D4AF63] transition-all font-body disabled:bg-[#F6F1E8]/50 disabled:cursor-not-allowed appearance-none cursor-pointer"
                >
                  {paceOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.icon} {option.label}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#1F315B]/50">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3.5 bg-gradient-to-r from-[#D4AF63] to-[#E8D5A3] text-[#1F315B] rounded-xl font-semibold hover:shadow-xl hover:shadow-[#D4AF63]/30 transition-all duration-300 font-body disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 border border-[#D4AF63]/50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#1F315B] border-t-transparent rounded-full animate-spin"></div>
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm font-body text-[#1F315B]/70">
              Already have an account?{' '}
              <Link href="/login" className="text-[#5E3B6C] hover:text-[#1F315B] font-medium transition-colors">
                Sign in
              </Link>
            </p>
          </div>
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