'use client'

import Link from 'next/link'
import { X, Sparkles } from 'lucide-react'
import { useState, useEffect } from 'react'
import { getDemoMode, clearDemoMode } from '@/lib/auth'

export default function DemoBanner() {
  const [isVisible, setIsVisible] = useState(false)
  const [isDemo, setIsDemo] = useState(false)

  useEffect(() => {
    // Check if we're in demo mode
    const demoMode = getDemoMode()
    setIsDemo(demoMode)
    setIsVisible(demoMode)
  }, [])

  const handleDismiss = () => {
    setIsVisible(false)
  }

  const handleSignUp = () => {
    clearDemoMode()
    // The Link component will handle navigation
  }

  if (!isVisible || !isDemo) {
    return null
  }

  return (
    <div 
      className="sticky top-0 z-50 w-full px-4 py-3"
      style={{ backgroundColor: '#D4AF63' }}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Sparkles className="w-5 h-5 flex-shrink-0" style={{ color: '#1F315B' }} />
          <p 
            className="font-body text-sm font-medium truncate"
            style={{ color: '#1F315B' }}
          >
            🦋 DEMO MODE — This is a preview. Data will not be saved.
          </p>
        </div>
        
        <div className="flex items-center gap-3 flex-shrink-0">
          <Link
            href="/register"
            onClick={handleSignUp}
            className="px-4 py-2 rounded-lg font-body text-sm font-semibold transition-all duration-200 hover:shadow-md whitespace-nowrap"
            style={{ 
              backgroundColor: '#1F315B', 
              color: '#F6F1E8' 
            }}
          >
            Sign Up for Real Account
          </Link>
          
          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-lg transition-colors hover:bg-[#1F315B]/10 flex-shrink-0"
            aria-label="Dismiss demo banner"
          >
            <X className="w-5 h-5" style={{ color: '#1F315B' }} />
          </button>
        </div>
      </div>
    </div>
  )
}
