import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { MessageCircle, Search, Edit, LogOut, X, ArrowLeft, MoreVertical, Send, Paperclip, Image, Check, CheckCheck, FileText, Users } from 'lucide-react'
import { demoCurrentUser, demoConversations, demoMessages, demoAllUsers } from '@/lib/demo-data'
import { formatMessageTime, formatConversationTime, formatLastSeen, getInitials, getAvatarColor } from '@/lib/utils'
import type { Conversation, Message, Profile } from '@/types'

// =================================================================
// ДЕМО-РЕЖИМ: показывает интерфейс с моковыми данными
// =================================================================

export function DemoAppPage() {
  const [activeConv, setActiveConv] = useState<Conversation | null>(null)
  const [showSidebar, setShowSidebar] = useState(true)
  const [conversations, setConversations] = useState(demoConversations)
  const [localMessages, setLocalMessages] = useState(demoMessages)

  function handleSelectConv(id: string) {
    const conv = conversations.find(c => c.id === id) ?? null
    setActiveConv(conv)
    setShowSidebar(false)
    // Mark as read
    if (conv) {
      setConversations(prev => prev.map(c => c.id === id ? { ...c, unread_count: 0 } : c))
    }
  }

  function handleBack() {
    setShowSidebar(true)
    setActiveConv(null)
  }

  function handleSendMessage(convId: string, text: string) {
    const newMsg: Message = {
      id: `demo-${Date.now()}`,
      conversation_id: convId,
      sender_id: 'user-me',
      content: text,
      file_url: null,
      file_type: null,
      file_name: null,
      created_at: new Date().toISOString(),
      edited_at: null,
      sender: demoCurrentUser,
      reads: [],
    }
    setLocalMessages(prev => ({
      ...prev,
      [convId]: [...(prev[convId] ?? []), newMsg],
    }))
    setConversations(prev => prev.map(c =>
      c.id === convId ? { ...c, last_message: newMsg } : c
    ))
  }

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Demo banner */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#A0856C] text-white text-center py-1.5 text-xs font-medium">
        Демо-режим — данные ненастоящие. Подключите Supabase для реальной работы
      </div>

      <div className="flex h-full w-full pt-7">
        {/* Sidebar */}
        <div className={`${showSidebar ? 'flex' : 'hidden'} md:flex w-full md:w-80 lg:w-96 flex-shrink-0 flex-col bg-[#F5F0EA] border-r border-[#E8E4DE]`}>
          <DemoSidebar
            conversations={conversations}
            activeId={activeConv?.id ?? null}
            onSelect={handleSelectConv}
          />
        </div>

        {/* Chat area */}
        <div className={`flex-1 flex flex-col ${!showSidebar || activeConv ? 'flex' : 'hidden md:flex'}`}>
          <AnimatePresence mode="wait">
            {activeConv ? (
              <motion.div
                key={activeConv.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex-1 flex flex-col h-full"
              >
                <DemoChatWindow
                  conversation={activeConv}
                  messages={localMessages[activeConv.id] ?? []}
                  onBack={handleBack}
                  onSend={(text) => handleSendMessage(activeConv.id, text)}
                />
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hidden md:flex flex-1 flex-col items-center justify-center gap-4 bg-[#FEFCF9]">
                <div className="w-20 h-20 rounded-3xl bg-[#F5F0EA] flex items-center justify-center">
                  <MessageCircle size={36} className="text-[#C8BDB3]" />
                </div>
                <div className="text-center">
                  <p className="text-base font-semibold text-[#2D2D2D]">WarmChat</p>
                  <p className="text-sm text-[#8A8A8A] mt-1">Выберите чат или начните новый</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

// ========== SIDEBAR ==========
function DemoSidebar({ conversations, activeId, onSelect }: {
  conversations: Conversation[]
  activeId: string | null
  onSelect: (id: string) => void
}) {
  const [search, setSearch] = useState('')
  const user = demoCurrentUser

  const filtered = conversations.filter(conv => {
    if (!search) return true
    const q = search.toLowerCase()
    if (conv.type === 'group') return conv.name?.toLowerCase().includes(q)
    const other = conv.members?.find(m => m.user_id !== user.id)?.profile
    return other ? `${other.first_name} ${other.last_name}`.toLowerCase().includes(q) : false
  })

  return (
    <>
      <div className="px-4 pt-4 pb-3 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <DemoAvatar profile={user} size="sm" showOnline />
            <div className="text-left">
              <p className="text-sm font-semibold text-[#2D2D2D]">{user.first_name} {user.last_name}</p>
              <p className="text-[11px] text-[#8BAF7E]">в сети</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button className="w-9 h-9 rounded-xl flex items-center justify-center text-[#8A8A8A] hover:bg-[#EDE8E3] hover:text-[#A0856C] transition-all">
              <Edit size={18} />
            </button>
            <button className="w-9 h-9 rounded-xl flex items-center justify-center text-[#8A8A8A] hover:bg-[#EDE8E3] hover:text-red-500 transition-all">
              <LogOut size={17} />
            </button>
          </div>
        </div>

        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B0A8A0]" />
          <input
            type="text"
            placeholder="Поиск чатов..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-[#E8E4DE] text-sm text-[#2D2D2D] placeholder:text-[#B0A8A0] focus:outline-none focus:ring-2 focus:ring-[#A0856C]/30 focus:border-[#A0856C] transition-all"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#B0A8A0] hover:text-[#8A8A8A]">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2">
        <AnimatePresence>
          {filtered.map((conv, i) => {
            const isGroup = conv.type === 'group'
            const other = !isGroup ? conv.members?.find(m => m.user_id !== user.id)?.profile : null
            const name = isGroup ? conv.name ?? 'Группа' : other ? `${other.first_name} ${other.last_name}` : '?'
            const lastMsg = conv.last_message
            let lastText = ''
            if (lastMsg) {
              if (lastMsg.file_type === 'image') lastText = '📷 Изображение'
              else if (lastMsg.file_type === 'file') lastText = `📎 ${lastMsg.file_name ?? 'Файл'}`
              else lastText = lastMsg.content ?? ''
            }

            return (
              <motion.button
                key={conv.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03, duration: 0.2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelect(conv.id)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-left transition-all duration-150 cursor-pointer ${
                  activeId === conv.id ? 'bg-[#EDE8E3]' : 'hover:bg-[#F5F0EA]'
                }`}
              >
                {isGroup ? (
                  <GroupAvatar name={conv.name} id={conv.id} />
                ) : (
                  <DemoAvatar profile={other!} size="md" showOnline />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-[#2D2D2D] truncate">{name}</span>
                    <span className="text-[11px] text-[#8A8A8A] flex-shrink-0">
                      {lastMsg ? formatConversationTime(lastMsg.created_at) : ''}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <span className="text-xs text-[#8A8A8A] truncate">{lastText || 'Начните общение'}</span>
                    {(conv.unread_count ?? 0) > 0 && (
                      <span className="flex-shrink-0 min-w-[18px] h-[18px] rounded-full bg-[#A0856C] text-white text-[10px] font-semibold flex items-center justify-center px-1">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </motion.button>
            )
          })}
        </AnimatePresence>
      </div>
    </>
  )
}

// ========== CHAT WINDOW ==========
function DemoChatWindow({ conversation, messages, onBack, onSend }: {
  conversation: Conversation
  messages: Message[]
  onBack: () => void
  onSend: (text: string) => void
}) {
  const [text, setText] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const isGroup = conversation.type === 'group'
  const other = !isGroup ? conversation.members?.find(m => m.user_id !== 'user-me')?.profile : null
  const displayName = isGroup ? conversation.name ?? 'Группа' : other ? `${other.first_name} ${other.last_name}` : '?'
  const memberIds = conversation.members?.map(m => m.user_id) ?? []

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleSend() {
    if (!text.trim()) return
    onSend(text.trim())
    setText('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function getSubtitle() {
    if (isGroup) return `${conversation.members?.length ?? 0} участников`
    if (other?.is_online) return 'в сети'
    if (other?.last_seen) return formatLastSeen(other.last_seen)
    return ''
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-[#E8E4DE] flex-shrink-0">
        <button onClick={onBack} className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center text-[#8A8A8A] hover:bg-[#F5F0EA] transition-colors">
          <ArrowLeft size={18} />
        </button>
        {isGroup ? (
          <GroupAvatar name={conversation.name} id={conversation.id} size="sm" />
        ) : (
          <DemoAvatar profile={other!} size="sm" showOnline />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#2D2D2D] truncate">{displayName}</p>
          <p className={`text-xs ${other?.is_online ? 'text-[#8BAF7E]' : 'text-[#8A8A8A]'}`}>
            {getSubtitle()}
          </p>
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
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-1.5 bg-[#FEFCF9]">
        <AnimatePresence initial={false}>
          {messages.map(message => {
            const isOwn = message.sender_id === 'user-me'
            const time = formatMessageTime(message.created_at)
            const readByOthers = message.reads?.some(r => r.user_id !== message.sender_id) ?? false

            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div className={`max-w-[70%] min-w-[60px] rounded-2xl px-3.5 py-2.5 shadow-sm ${
                  isOwn ? 'bg-[#E8DED5] rounded-br-md' : 'bg-[#F0ECEB] rounded-bl-md'
                }`}>
                  {/* Group: show sender name */}
                  {isGroup && !isOwn && message.sender && (
                    <p className="text-xs font-semibold mb-0.5" style={{ color: getAvatarColor(message.sender_id) }}>
                      {message.sender.first_name}
                    </p>
                  )}
                  {message.content && (
                    <p className="text-sm text-[#2D2D2D] leading-relaxed whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                  )}
                  <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <span className="text-[10px] text-[#8A8A8A]">{time}</span>
                    {isOwn && (readByOthers
                      ? <CheckCheck size={13} className="text-[#A0856C]" />
                      : <Check size={13} className="text-[#B0A8A0]" />
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 bg-white border-t border-[#E8E4DE]">
        <div className="flex items-end gap-2">
          <div className="flex gap-1 pb-1.5">
            <button className="w-9 h-9 rounded-xl flex items-center justify-center text-[#8A8A8A] hover:bg-[#F5F0EA] hover:text-[#A0856C] transition-all">
              <Image size={18} />
            </button>
            <button className="w-9 h-9 rounded-xl flex items-center justify-center text-[#8A8A8A] hover:bg-[#F5F0EA] hover:text-[#A0856C] transition-all">
              <Paperclip size={18} />
            </button>
          </div>
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={e => {
                setText(e.target.value)
                if (textareaRef.current) {
                  textareaRef.current.style.height = 'auto'
                  textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
                }
              }}
              onKeyDown={handleKeyDown}
              placeholder="Написать сообщение..."
              rows={1}
              className="w-full resize-none rounded-2xl border border-[#E8E4DE] bg-[#FEFCF9] px-4 py-2.5 text-sm text-[#2D2D2D] placeholder:text-[#B0A8A0] focus:outline-none focus:ring-2 focus:ring-[#A0856C]/30 focus:border-[#A0856C] transition-all leading-relaxed"
              style={{ minHeight: '42px', maxHeight: '120px' }}
            />
          </div>
          <motion.button
            onClick={handleSend}
            disabled={!text.trim()}
            animate={{ scale: text.trim() ? 1 : 0.9, opacity: text.trim() ? 1 : 0.5 }}
            whileTap={{ scale: 0.9 }}
            className="w-10 h-10 rounded-2xl bg-[#A0856C] flex items-center justify-center text-white shadow-sm hover:bg-[#8C7262] transition-colors disabled:pointer-events-none flex-shrink-0"
          >
            <Send size={16} />
          </motion.button>
        </div>
      </div>
    </div>
  )
}

// ========== AVATAR COMPONENTS ==========
function DemoAvatar({ profile, size = 'md', showOnline }: { profile: Profile; size?: 'sm' | 'md'; showOnline?: boolean }) {
  const initials = getInitials(profile.first_name, profile.last_name)
  const color = getAvatarColor(profile.id)
  const sizeClass = size === 'sm' ? 'w-9 h-9 text-xs' : 'w-11 h-11 text-sm'
  const dotClass = size === 'sm' ? 'w-2.5 h-2.5 border' : 'w-3 h-3 border-2'

  return (
    <div className="relative flex-shrink-0">
      <div className={`${sizeClass} rounded-full flex items-center justify-center font-semibold text-white select-none`} style={{ backgroundColor: color }}>
        {initials}
      </div>
      {showOnline && (
        <span className={`absolute bottom-0 right-0 ${dotClass} rounded-full border-white ${profile.is_online ? 'bg-[#8BAF7E]' : 'bg-[#C8BDB3]'}`} />
      )}
    </div>
  )
}

function GroupAvatar({ name, id, size = 'md' }: { name: string | null; id: string; size?: 'sm' | 'md' }) {
  const color = getAvatarColor(id)
  const initial = (name ?? 'Г').charAt(0).toUpperCase()
  const sizeClass = size === 'sm' ? 'w-9 h-9 text-xs' : 'w-11 h-11 text-sm'

  return (
    <div className={`${sizeClass} rounded-full flex items-center justify-center flex-shrink-0`} style={{ backgroundColor: color }}>
      <span className="font-semibold text-white">{initial}</span>
    </div>
  )
}
