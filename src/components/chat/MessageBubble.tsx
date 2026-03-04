import { motion } from 'motion/react'
import { Check, CheckCheck, FileText, Download } from 'lucide-react'
import { formatMessageTime } from '@/lib/utils'
import type { Message } from '@/types'

interface MessageBubbleProps {
  message: Message
  isOwn: boolean
  showAvatar: boolean
  conversationMembers: string[]
}

export function MessageBubble({ message, isOwn, showAvatar: _showAvatar, conversationMembers }: MessageBubbleProps) {
  const time = formatMessageTime(message.created_at)
  const readByOthers = message.reads?.some(r => r.user_id !== message.sender_id) ?? false
  const deliveredToAll = conversationMembers
    .filter(id => id !== message.sender_id)
    .every(id => message.reads?.some(r => r.user_id === id))

  function getStatus() {
    if (readByOthers) return 'read'
    if (deliveredToAll) return 'delivered'
    return 'sent'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Bubble */}
      <div
        className={`
          max-w-[70%] min-w-[60px] rounded-2xl px-3.5 py-2.5 shadow-sm
          ${isOwn
            ? 'bg-[#E8DED5] rounded-br-md'
            : 'bg-[#F0ECEB] rounded-bl-md'
          }
        `}
      >
        {/* Image */}
        {message.file_type === 'image' && message.file_url && (
          <div className="mb-1.5 -mx-0.5">
            <img
              src={message.file_url}
              alt="Изображение"
              className="rounded-xl max-w-full max-h-64 object-cover"
              loading="lazy"
            />
          </div>
        )}

        {/* File */}
        {message.file_type === 'file' && message.file_url && (
          <a
            href={message.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 mb-1.5 hover:opacity-80 transition-opacity"
          >
            <div className="w-9 h-9 rounded-xl bg-[#A0856C]/15 flex items-center justify-center flex-shrink-0">
              <FileText size={18} className="text-[#A0856C]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[#2D2D2D] truncate">{message.file_name}</p>
              <p className="text-[10px] text-[#8A8A8A]">Файл</p>
            </div>
            <Download size={14} className="text-[#8A8A8A] flex-shrink-0" />
          </a>
        )}

        {/* Text */}
        {message.content && (
          <p className="text-sm text-[#2D2D2D] leading-relaxed whitespace-pre-wrap break-words">
            {message.content}
          </p>
        )}

        {/* Time + Status */}
        <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
          <span className="text-[10px] text-[#8A8A8A]">{time}</span>
          {isOwn && (
            <StatusIcon status={getStatus()} />
          )}
        </div>
      </div>
    </motion.div>
  )
}

function StatusIcon({ status }: { status: 'sent' | 'delivered' | 'read' }) {
  if (status === 'read') {
    return <CheckCheck size={13} className="text-[#A0856C]" />
  }
  if (status === 'delivered') {
    return <CheckCheck size={13} className="text-[#B0A8A0]" />
  }
  return <Check size={13} className="text-[#B0A8A0]" />
}
