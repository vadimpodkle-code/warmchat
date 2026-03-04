import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { Message } from '@/types'

export function useMessages(conversationId: string | null, currentUserId: string | undefined) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    if (!conversationId || !currentUserId) return

    setLoading(true)
    fetchMessages()

    // Cleanup previous channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    // Subscribe to new messages in this conversation
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const { data } = await supabase
            .from('messages')
            .select('*, sender:profiles(*), reads:message_reads(*)')
            .eq('id', payload.new.id)
            .single()
          if (data) {
            setMessages(prev => [...prev, data as Message])
            // Mark as read if not our message
            if (data.sender_id !== currentUserId) {
              markAsRead(data.id, currentUserId)
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'message_reads',
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => { fetchMessages() }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId, currentUserId])

  async function fetchMessages() {
    if (!conversationId) return
    const { data } = await supabase
      .from('messages')
      .select('*, sender:profiles(*), reads:message_reads(*)')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (data) {
      setMessages(data as Message[])
      // Mark all unread messages as read
      if (currentUserId) {
        const unread = data.filter(
          m => m.sender_id !== currentUserId &&
          !(m.reads as { user_id: string }[])?.some(r => r.user_id === currentUserId)
        )
        for (const msg of unread) {
          markAsRead(msg.id, currentUserId)
        }
      }
    }
    setLoading(false)
  }

  async function markAsRead(messageId: string, userId: string) {
    await supabase
      .from('message_reads')
      .upsert({ message_id: messageId, user_id: userId }, { onConflict: 'message_id,user_id' })
  }

  async function sendMessage(content: string) {
    if (!conversationId || !currentUserId) return
    const { data } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: currentUserId,
        content: content.trim(),
        file_url: null,
        file_type: null,
        file_name: null,
      })
      .select('*, sender:profiles(*), reads:message_reads(*)')
      .single()
    if (data) {
      setMessages(prev => [...prev, data as Message])
    }
  }

  async function sendFile(file: File) {
    if (!conversationId || !currentUserId) return

    const ext = file.name.split('.').pop()
    const path = `${conversationId}/${Date.now()}.${ext}`
    const bucket = file.type.startsWith('image/') ? 'chat-images' : 'chat-files'

    const { error } = await supabase.storage.from(bucket).upload(path, file)
    if (error) throw error

    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path)

    const isImage = file.type.startsWith('image/')
    const { data } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: currentUserId,
        content: null,
        file_url: publicUrl,
        file_type: isImage ? 'image' : 'file',
        file_name: file.name,
      })
      .select('*, sender:profiles(*), reads:message_reads(*)')
      .single()

    if (data) {
      setMessages(prev => [...prev, data as Message])
    }
  }

  return { messages, loading, sendMessage, sendFile }
}
