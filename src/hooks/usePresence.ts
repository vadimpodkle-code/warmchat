import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export function usePresence(userId: string | undefined) {
  useEffect(() => {
    if (!userId) return

    // Mark as online when app loads
    supabase
      .from('profiles')
      .update({ is_online: true, last_seen: new Date().toISOString() })
      .eq('id', userId)
      .then(() => {})

    // Mark as offline when tab is closed or hidden
    const handleVisibilityChange = () => {
      supabase
        .from('profiles')
        .update({
          is_online: !document.hidden,
          last_seen: new Date().toISOString(),
        })
        .eq('id', userId)
        .then(() => {})
    }

    const handleBeforeUnload = () => {
      navigator.sendBeacon(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`,
        JSON.stringify({ is_online: false, last_seen: new Date().toISOString() })
      )
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      // Mark offline on cleanup
      supabase
        .from('profiles')
        .update({ is_online: false, last_seen: new Date().toISOString() })
        .eq('id', userId)
        .then(() => {})
    }
  }, [userId])
}
