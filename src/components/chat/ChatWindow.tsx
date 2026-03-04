import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ArrowLeft, MoreVertical, Phone, Search } from 'lucide-react'
import { useMessages } from '@/hooks/useMessages'
import { MessageBubble } from './MessageBubble'
import { MessageInput } from './MessageInput'
import { TypingIndicator } from './TypingIndicator'
import { Avatar } from '@/components/ui/Avatar'
import { formatLastSeen } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import type { Conversation } from '@/types'

interface ChatWindowProps {
  conversation: Conversation
  currentUserId: string
  onBack: () => void
}

export function ChatWindow({ conversation, currentUserId, onBack }: ChatWindowProps) {
  const { messages, loading, sendMessage, sendFile } = useMessages(conversation.id, currentUserId)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [typingUsers, setTypingUsers] = useState<string[]>([])

  const isGroup = conversation.type === 'group'
  const otherMember = !isGroup
    ? conversation.members?.find(m => m.user_id !== currentUserId)?.profile
    : null

  const displayName = isGroup
    ? conversation.name ?? 'Группа'
    : otherMember ? `${otherMember.first_name} ${otherMember.last_name}` : 'Пользователь'

  const memberIds = conversation.members?.map(m => m.user_id) ?? []

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Subscribe to typing events
  useEffect(() => {
    const channel = supabase
      .channel(`typing:${conversation.id}`)
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        const { userId, typing } = payload as { userId: string; typing: boolean }
        if (userId === currentUserId) return
        setTypingUsers(prev =>
          typing ? [...new Set([...prev, userId])] : prev.filter(id => id !== userId)
        )
        // Auto clear after 3s
        if (typing) {
          setTimeout(() => {
            setTypingUsers(prev => prev.filter(id => id !== userId))
          }, 3000)
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [conversation.id, currentUserId])

  function getSubtitle() {
    if (isGroup) {
      return `${conversation.members?.length ?? 0} участников`
    }
    if (otherMember?.is_online) return 'в сети'
    if (otherMember?.last_seen) return formatLastSeen(otherMember.last_seen)
    return ''
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-[#E8E4DE] flex-shrink-0">
        <button
          onClick={onBack}
          className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center text-[#8A8A8A] hover:bg-[#F5F0EA] transition-colors"
        >
          <ArrowLeft size={18} />
        </button>

        {isGroup ? (
          <div className="w-10 h-10 rounded-full bg-[#A0856C] flex items-center justify-center flex-shrink-0">
            <span className="text-white font-semibold text-sm">
              {(conversation.name ?? 'Г').charAt(0).toUpperCase()}
            </span>
          </div>
        ) : (
          <Avatar
            src={otherMember?.avatar_url}
            firstName={otherMember?.first_name ?? '?'}
            lastName={otherMember?.last_name ?? '?'}
            isOnline={otherMember?.is_online}
            userId={otherMember?.id}
            size="sm"
          />
        )}

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#2D2D2D] truncate">{displayName}</p>
          <AnimatePresence mode="wait">
            {typingUsers.length > 0 ? (
              <motion.p
                key="typing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs text-[#A0856C]"
              >
                печатает...
              </motion.p>
            ) : (
              <motion.p
                key="status"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`text-xs ${otherMember?.is_online ? 'text-[#8BAF7E]' : 'text-[#8A8A8A]'}`}
              >
                {getSubtitle()}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-1">
          <button className="w-9 h-9 rounded-xl flex items-center justify-center text-[#8A8A8A] hover:bg-[#F5F0EA] transition-colors">
            <Search size={17} />
          </button>
          <button className="w-9 h-9 rounded-xl flex items-center justify-center text-[#8A8A8A] hover:bg-[#F5F0EA] transition-colors">
            <MoreVertical size={17} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-1.5" style={{ backgroundColor: '#FEFCF9' }}>
        {loading && (
          <div className="flex items-center justify-center h-full">
            <div className="w-7 h-7 border-2 border-[#E8E4DE] border-t-[#A0856C] rounded-full animate-spin" />
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#F5F0EA] flex items-center justify-center">
              <Phone size={28} className="text-[#C8BDB3]" />
            </div>
            <p className="text-sm text-[#8A8A8A]">Начните общение!</p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((message, index) => {
            const prevMsg = messages[index - 1]
            const isOwn = message.sender_id === currentUserId
            const showAvatar = !isOwn && (
              !prevMsg || prevMsg.sender_id !== message.sender_id
            )

            return (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={isOwn}
                showAvatar={showAvatar}
                conversationMembers={memberIds}
              />
            )
          })}
        </AnimatePresence>

        {typingUsers.length > 0 && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <MessageInput
        conversationId={conversation.id}
        currentUserId={currentUserId}
        onSend={sendMessage}
        onSendFile={sendFile}
      />
    </div>
  )
}
