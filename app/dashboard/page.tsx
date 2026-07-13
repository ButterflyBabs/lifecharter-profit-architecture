'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { LogOut, User, Settings, ChevronRight, Sparkles } from 'lucide-react'
import DemoBanner from '@/components/demo-banner'
import { getDemoMode, clearDemoMode } from '@/lib/auth'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ email: string; name: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    // Check if user is authenticated
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push('/login')
        return
      }

      // Get user data
      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (authUser) {
        setUser({
          email: authUser.email || '',
          name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
        })
      }

      setLoading(false)
    }

    checkAuth()
  }, [router])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    clearDemoMode()
    router.push('/login')
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-[#F6F1E8] via-[#FDFBF7] to-[#F6F1E8] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-[#D4AF63] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="font-body text-[#1F315B]/70">Loading...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#F6F1E8] via-[#FDFBF7] to-[#F6F1E8]">
      {/* Demo Banner */}
      <DemoBanner />
      
      {/* Header */}
      <header className="bg-[#F6F1E8]/80 backdrop-blur-sm border-b border-[#D4AF63]/20 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-[#1F315B] to-[#5E3B6C] border border-[#D4AF63]/40">
              <span className="text-[#D4AF63] font-display font-bold text-lg">P</span>
            </div>
            <h1 className="font-display text-xl font-bold text-[#1F315B]">The Profit Architecture</h1>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-[#1F315B]/70 hover:text-[#1F315B] hover:bg-[#D4AF63]/10 rounded-xl transition-colors font-body"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="bg-[#FDFBF7] rounded-2xl shadow-sacred border border-[#D4AF63]/20 p-8 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-[#D4AF63]/20 to-[#D4AF63]/5 border border-[#D4AF63]/30">
              <User className="w-8 h-8 text-[#1F315B]" />
            </div>
            <div>
              <p className="font-editorial italic text-[#5E3B6C] text-sm mb-1">Welcome back</p>
              <h2 className="font-display text-2xl font-bold text-[#1F315B] mb-1">
                {user?.name}
              </h2>
              <p className="font-body text-[#1F315B]/60 text-sm">
                {user?.email}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6">
          <Link
            href="/assessment"
            className="group bg-[#FDFBF7] rounded-2xl shadow-sacred border border-[#D4AF63]/20 p-6 hover:shadow-sacred-lg hover:border-[#D4AF63]/40 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-[#2E7C83]/20 to-[#2E7C83]/5 border border-[#2E7C83]/30">
                <Settings className="w-6 h-6 text-[#2E7C83]" />
              </div>
              <ChevronRight className="w-5 h-5 text-[#1F315B]/30 group-hover:text-[#D4AF63] transition-colors" />
            </div>
            <h3 className="font-display text-lg font-semibold text-[#1F315B] mb-1">Start Assessment</h3>
            <p className="font-body text-[#1F315B]/60 text-sm">Begin your business architecture evaluation</p>
          </Link>

          <Link
            href="/profile"
            className="group bg-[#FDFBF7] rounded-2xl shadow-sacred border border-[#D4AF63]/20 p-6 hover:shadow-sacred-lg hover:border-[#D4AF63]/40 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-[#5E3B6C]/20 to-[#5E3B6C]/5 border border-[#5E3B6C]/30">
                <User className="w-6 h-6 text-[#5E3B6C]" />
              </div>
              <ChevronRight className="w-5 h-5 text-[#1F315B]/30 group-hover:text-[#D4AF63] transition-colors" />
            </div>
            <h3 className="font-display text-lg font-semibold text-[#1F315B] mb-1">Your Profile</h3>
            <p className="font-body text-[#1F315B]/60 text-sm">Manage your account settings and preferences</p>
          </Link>
        </div>

        {/* Status */}
        <div className="mt-8 bg-gradient-to-r from-[#1F315B]/5 to-[#5E3B6C]/5 border border-[#D4AF63]/20 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <Sparkles className="w-5 h-5 text-[#D4AF63]" />
            <h3 className="font-display text-sm font-semibold text-[#1F315B] uppercase tracking-wide">
              Account Status
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-[#2E7C83] rounded-full animate-pulse"></div>
            <span className="font-body text-[#1F315B]/80">Active</span>
          </div>
        </div>
      </div>
    </main>
  )
}