/**
 * Authentication utilities including demo mode support
 */

// Demo credentials
export const DEMO_CREDENTIALS = {
  email: 'demo@lifecharter.profit',
  password: 'butterfly2026',
}

// Demo user data
export const DEMO_USER = {
  id: 'demo-user-id',
  email: DEMO_CREDENTIALS.email,
  name: 'Demo User',
  user_metadata: {
    full_name: 'Demo User',
  },
}

// Demo session data
export const DEMO_SESSION = {
  access_token: 'demo-access-token',
  refresh_token: 'demo-refresh-token',
  expires_at: Date.now() + 24 * 60 * 60 * 1000, // 24 hours from now
}

/**
 * Check if credentials match demo credentials
 */
export function isDemoCredentials(email: string, password: string): boolean {
  return email === DEMO_CREDENTIALS.email && password === DEMO_CREDENTIALS.password
}

/**
 * Check if current session is a demo session
 */
export function isDemoSession(accessToken: string | null): boolean {
  return accessToken === DEMO_SESSION.access_token
}

/**
 * Store demo mode in localStorage
 */
export function setDemoMode(enabled: boolean): void {
  if (typeof window !== 'undefined') {
    if (enabled) {
      localStorage.setItem('demoMode', 'true')
    } else {
      localStorage.removeItem('demoMode')
    }
  }
}

/**
 * Check if demo mode is enabled in localStorage
 */
export function getDemoMode(): boolean {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('demoMode') === 'true'
  }
  return false
}

/**
 * Clear demo mode
 */
export function clearDemoMode(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('demoMode')
  }
}

/**
 * Feature flag for demo mode (easy to disable)
 */
export const DEMO_MODE_ENABLED = true
