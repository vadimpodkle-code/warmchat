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

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

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
            .select('*, sender:profiles!messages_sender_id_fkey(*), reads:message_reads(*)')
            .eq('id', payload.new.id)
            .single()
          if (data) {
            setMessages(prev => {
              // Deduplicate: message may already be in state from sendMessage()
              if (prev.some(m => m.id === (data as Message).id)) return prev
              return [...prev, data as Message]
            })
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
        },
        (payload) => {
          const messageId = payload.new?.message_id
          if (messageId) {
            // Update read status in-place — no need to re-fetch all messages
            setMessages(prev =>
              prev.map(m =>
                m.id === messageId
                  ? { ...m, reads: [...(m.reads ?? []), payload.new] }
                  : m
              )
            )
          }
        }
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
      .select('*, sender:profiles!messages_sender_id_fkey(*), reads:message_reads(*)')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (data) {
      setMessages(data as Message[])
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
      .select('*, sender:profiles!messages_sender_id_fkey(*), reads:message_reads(*)')
      .single()
    if (data) {
      // Optimistic: add immediately for instant feedback
      // The realtime subscription will deduplicate if it fires
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
      .select('*, sender:profiles!messages_sender_id_fkey(*), reads:message_reads(*)')
      .single()

    if (data) {
      setMessages(prev => [...prev, data as Message])
    }
  }

  return { messages, loading, sendMessage, sendFile }
}
