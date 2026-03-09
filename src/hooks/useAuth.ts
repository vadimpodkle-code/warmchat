import { useState, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data)
    setLoading(false)
  }

  async function updateOnlineStatus(isOnline: boolean) {
    if (!user) return
    await supabase
      .from('profiles')
      .update({ is_online: isOnline, last_seen: new Date().toISOString() })
      .eq('id', user.id)
  }

  async function signOut() {
    await updateOnlineStatus(false)
    await supabase.auth.signOut()
  }

  const needsUsername = profile !== null && profile.username === null

  async function updateUsername(username: string): Promise<{ error: string | null }> {
    if (!user) return { error: 'Не авторизован' }

    const normalized = username.toLowerCase().replace(/^@/, '').trim()

    if (!/^[a-z0-9_]{3,30}$/.test(normalized)) {
      return { error: 'Username: 3-30 символов, только a-z, 0-9, _' }
    }

    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', normalized)
      .neq('id', user.id)
      .maybeSingle()

    if (existing) {
      return { error: 'Этот username уже занят' }
    }

    const { error } = await supabase
      .from('profiles')
      .update({ username: normalized })
      .eq('id', user.id)

    if (error) return { error: error.message }

    await fetchProfile(user.id)
    return { error: null }
  }

  return { user, profile, loading, signOut, fetchProfile: () => user && fetchProfile(user.id), needsUsername, updateUsername }
}
