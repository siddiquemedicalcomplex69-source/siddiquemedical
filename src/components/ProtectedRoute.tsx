/**
 * components/ProtectedRoute.tsx
 *
 * Client-side route guard for React + Vite SPA.
 * Replaces Next.js middleware.ts — checks auth session and user role
 * before rendering protected pages.
 *
 * Usage:
 *   <ProtectedRoute allowedRoles={['patient']}>
 *     <AppointmentsPage />
 *   </ProtectedRoute>
 *
 *   // Or without role restriction (just require login):
 *   <ProtectedRoute>
 *     <ProfilePage />
 *   </ProtectedRoute>
 */

import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import type { UserRole } from '@/types/database'

// ─── Where each role lands after login ───────────────────────
const ROLE_DASHBOARDS: Record<UserRole, string> = {
  patient   : '/appointments',
  doctor    : '/schedule',
  admin     : '/admin/dashboard',
  lab_staff : '/lab-staff/dashboard',
}

interface ProtectedRouteProps {
  children: React.ReactNode
  /** If set, only these roles can access this route. Others are redirected to their own dashboard. */
  allowedRoles?: UserRole[]
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const navigate  = useNavigate()
  const location  = useLocation()
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    async function checkAuth() {
      // ── Step 1: Check if there's an active session ──────────
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        // Not logged in → redirect to login with a return URL
        navigate(`/login?redirectTo=${encodeURIComponent(location.pathname)}`, { replace: true })
        return
      }

      // ── Step 2: Fetch the user's role from profiles ────────
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      if (error || !profile) {
        // Edge case: profile doesn't exist yet
        navigate('/login', { replace: true })
        return
      }

      const role = (profile as any).role as UserRole

      // ── Step 3: Check role access ──────────────────────────
      if (allowedRoles && !allowedRoles.includes(role)) {
        // User is logged in but wrong role → send to their own dashboard
        navigate(ROLE_DASHBOARDS[role], { replace: true })
        return
      }

      // ── Step 4: All checks passed ──────────────────────────
      setAuthorized(true)
      setLoading(false)
    }

    checkAuth()
  }, [navigate, location.pathname, allowedRoles])

  // ── Loading state: show spinner while checking auth ────────
  if (loading && !authorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
      </div>
    )
  }

  return <>{children}</>
}
