import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Conversation, Message } from '@/types'

export function useConversations(userId: string | undefined) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    fetchConversations()

    const channel = supabase
      .channel('conversations-updates')
      // New message → update last message + unread count
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        () => { fetchConversations() }
      )
      // Added to a new conversation → show it in sidebar immediately
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'conversation_members', filter: `user_id=eq.${userId}` },
        () => { fetchConversations() }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId])

  async function fetchConversations() {
    if (!userId) return

    const { data: memberRows } = await supabase
      .from('conversation_members')
      .select('conversation_id')
      .eq('user_id', userId)

    if (!memberRows?.length) {
      setConversations([])
      setLoading(false)
      return
    }

    const conversationIds = memberRows.map(r => r.conversation_id)

    const { data: convs } = await supabase
      .from('conversations')
      .select(`
        *,
        members:conversation_members(
          *,
          profile:profiles(*)
        )
      `)
      .in('id', conversationIds)
      .order('created_at', { ascending: false })

    if (!convs) {
      setLoading(false)
      return
    }

    // Fetch all read message IDs for this user once (outside loop)
    const { data: readsData } = await supabase
      .from('message_reads')
      .select('message_id')
      .eq('user_id', userId)

    const readIds: string[] = readsData?.map(r => r.message_id) ?? []

    // Fetch last message for each conversation
    const convsWithLastMsg = await Promise.all(
      convs.map(async (conv) => {
        const { data: msgs } = await supabase
          .from('messages')
          .select('*, sender:profiles!messages_sender_id_fkey(*)')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)

        // Count unread: messages not sent by me that I haven't read
        let unreadCount = 0
        if (readIds.length > 0) {
          const { count } = await supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .neq('sender_id', userId)
            .not('id', 'in', readIds)
          unreadCount = count ?? 0
        } else {
          const { count } = await supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .neq('sender_id', userId)
          unreadCount = count ?? 0
        }

        return {
          ...conv,
          last_message: (msgs?.[0] as Message) ?? null,
          unread_count: unreadCount,
        }
      })
    )

    // Sort by last message time
    convsWithLastMsg.sort((a, b) => {
      const aTime = a.last_message?.created_at ?? a.created_at
      const bTime = b.last_message?.created_at ?? b.created_at
      return new Date(bTime).getTime() - new Date(aTime).getTime()
    })

    setConversations(convsWithLastMsg)
    setLoading(false)
  }

  return { conversations, loading, refetch: fetchConversations }
}
