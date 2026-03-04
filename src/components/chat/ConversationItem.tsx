import { motion } from 'motion/react'
import { Avatar } from '@/components/ui/Avatar'
import { formatConversationTime } from '@/lib/utils'
import type { Conversation } from '@/types'
import { Users } from 'lucide-react'
import { getAvatarColor } from '@/lib/utils'

interface ConversationItemProps {
  conversation: Conversation
  currentUserId: string
  isActive: boolean
  onClick: () => void
}

export function ConversationItem({ conversation, currentUserId, isActive, onClick }: ConversationItemProps) {
  const isGroup = conversation.type === 'group'

  // For direct chats, find the other participant
  const otherMember = !isGroup
    ? conversation.members?.find(m => m.user_id !== currentUserId)?.profile
    : null

  const displayName = isGroup
    ? conversation.name ?? 'Группа'
    : otherMember
      ? `${otherMember.first_name} ${otherMember.last_name}`
      : 'Пользователь'

  const lastMsg = conversation.last_message
  let lastMsgText = ''
  if (lastMsg) {
    if (lastMsg.file_type === 'image') lastMsgText = '📷 Изображение'
    else if (lastMsg.file_type === 'file') lastMsgText = `📎 ${lastMsg.file_name ?? 'Файл'}`
    else lastMsgText = lastMsg.content ?? ''
  }

  const unread = conversation.unread_count ?? 0
  const time = lastMsg ? formatConversationTime(lastMsg.created_at) : ''

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-left transition-all duration-150 cursor-pointer
        ${isActive ? 'bg-[#EDE8E3]' : 'hover:bg-[#F5F0EA]'}
      `}
    >
      {/* Avatar */}
      {isGroup ? (
        <GroupAvatar name={conversation.name} conversationId={conversation.id} src={conversation.avatar_url} />
      ) : (
        <Avatar
          src={otherMember?.avatar_url}
          firstName={otherMember?.first_name ?? '?'}
          lastName={otherMember?.last_name ?? '?'}
          isOnline={otherMember?.is_online}
          userId={otherMember?.id}
          size="md"
        />
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-[#2D2D2D] truncate">{displayName}</span>
          <span className="text-[11px] text-[#8A8A8A] flex-shrink-0">{time}</span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <span className="text-xs text-[#8A8A8A] truncate">{lastMsgText || 'Начните общение'}</span>
          {unread > 0 && (
            <span className="flex-shrink-0 min-w-[18px] h-[18px] rounded-full bg-[#A0856C] text-white text-[10px] font-semibold flex items-center justify-center px-1">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </div>
      </div>
    </motion.button>
  )
}

function GroupAvatar({ name, conversationId, src }: { name: string | null; conversationId: string; src: string | null }) {
  const color = getAvatarColor(conversationId)
  const initial = (name ?? 'Г').charAt(0).toUpperCase()

  if (src) {
    return <img src={src} alt={name ?? 'Группа'} className="w-11 h-11 rounded-full object-cover flex-shrink-0" />
  }

  return (
    <div
      className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
      style={{ backgroundColor: color }}
    >
      {name ? (
        <span className="text-sm font-semibold text-white">{initial}</span>
      ) : (
        <Users size={18} className="text-white" />
      )}
    </div>
  )
}
