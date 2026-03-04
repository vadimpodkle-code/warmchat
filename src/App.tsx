import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { isDemoMode } from '@/lib/demo-data'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { AppPage } from '@/pages/AppPage'
import { DemoAppPage } from '@/pages/DemoAppPage'

// In demo mode, skip auth entirely and show demo interface
if (isDemoMode) {
  console.log('WarmChat running in DEMO mode — Supabase not configured')
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (user === undefined) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-[#E8E4DE] border-t-[#A0856C] rounded-full animate-spin" />
      </div>
    )
  }

  return user ? <>{children}</> : <Navigate to="/login" replace />
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (user === undefined) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-[#E8E4DE] border-t-[#A0856C] rounded-full animate-spin" />
      </div>
    )
  }

  return user ? <Navigate to="/app" replace /> : <>{children}</>
}

export default function App() {
  // Demo mode — show everything without auth
  if (isDemoMode) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<DemoAppPage />} />
        </Routes>
      </BrowserRouter>
    )
  }

  // Production mode with real Supabase
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/app" replace />} />
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/app" element={<ProtectedRoute><AppPage /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  )
}
