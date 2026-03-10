import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Search, Edit, LogOut, X } from 'lucide-react'
import { ConversationItem } from '@/components/chat/ConversationItem'
import { NewChatModal } from '@/components/chat/NewChatModal'
import { Avatar } from '@/components/ui/Avatar'
import type { Conversation, Profile } from '@/types'

interface SidebarProps {
  conversations: Conversation[]
  currentUser: Profile
  activeConversationId: string | null
  onSelectConversation: (id: string) => void
  onNewConversation: (id: string) => void
  onSignOut: () => void
}

export function Sidebar({
  conversations,
  currentUser,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onSignOut,
}: SidebarProps) {
  const [search, setSearch] = useState('')
  const [showNewChat, setShowNewChat] = useState(false)
  const [showProfile, setShowProfile] = useState(false)

  const filtered = conversations.filter(conv => {
    if (!search) return true
    const q = search.toLowerCase()
    if (conv.type === 'group') return conv.name?.toLowerCase().includes(q)
    const other = conv.members?.find(m => m.user_id !== currentUser.id)?.profile
    return other
      ? `${other.first_name} ${other.last_name}`.toLowerCase().includes(q)
      : false
  })

  return (
    <>
      <div className="flex flex-col h-full bg-[#F5F0EA] border-r border-[#E8E4DE]">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setShowProfile(true)}
              className="flex items-center gap-2.5 group min-w-0 flex-1 overflow-hidden"
            >
              <Avatar
                src={currentUser.avatar_url}
                firstName={currentUser.first_name}
                lastName={currentUser.last_name}
                userId={currentUser.id}
                size="sm"
                isOnline={true}
              />
              <div className="text-left min-w-0">
                <p className="text-sm font-semibold text-[#2D2D2D] group-hover:text-[#A0856C] transition-colors truncate">
                  {currentUser.first_name} {currentUser.last_name}
                </p>
                <p className="text-[11px] text-[#8BAF7E]">
                  {currentUser.username ? `@${currentUser.username}` : 'в сети'}
                </p>
              </div>
            </button>

            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => setShowNewChat(true)}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-[#8A8A8A] hover:bg-[#EDE8E3] hover:text-[#A0856C] transition-all"
                title="Новый чат"
              >
                <Edit size={18} />
              </button>
              <button
                onClick={onSignOut}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-[#8A8A8A] hover:bg-[#EDE8E3] hover:text-red-500 transition-all"
                title="Выйти"
              >
                <LogOut size={17} />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B0A8A0]" />
            <input
              type="text"
              placeholder="Поиск чатов..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-[#E8E4DE] text-sm text-[#2D2D2D] placeholder:text-[#B0A8A0] focus:outline-none focus:ring-2 focus:ring-[#A0856C]/30 focus:border-[#A0856C] transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#B0A8A0] hover:text-[#8A8A8A]"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Conversations list */}
        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {conversations.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
              <div className="w-14 h-14 rounded-2xl bg-[#EDE8E3] flex items-center justify-center">
                <Edit size={24} className="text-[#C8BDB3]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#2D2D2D]">Нет чатов</p>
                <p className="text-xs text-[#8A8A8A] mt-1">Нажми карандаш, чтобы начать общение</p>
              </div>
            </div>
          )}

          {filtered.length === 0 && conversations.length > 0 && (
            <p className="text-center text-sm text-[#8A8A8A] py-8">Ничего не найдено</p>
          )}

          <AnimatePresence>
            {filtered.map((conv, i) => (
              <motion.div
                key={conv.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03, duration: 0.2 }}
              >
                <ConversationItem
                  conversation={conv}
                  currentUserId={currentUser.id}
                  isActive={conv.id === activeConversationId}
                  onClick={() => onSelectConversation(conv.id)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* New Chat Modal */}
      {showNewChat && (
        <NewChatModal
          currentUserId={currentUser.id}
          onClose={() => setShowNewChat(false)}
          onConversationCreated={(id) => {
            setShowNewChat(false)
            onNewConversation(id)
          }}
        />
      )}

      {/* Profile Modal */}
      <AnimatePresence>
        {showProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setShowProfile(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8E4DE]">
                <h2 className="text-base font-semibold text-[#2D2D2D]">Профиль</h2>
                <button
                  onClick={() => setShowProfile(false)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-[#8A8A8A] hover:bg-[#F5F0EA]"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="p-6 flex flex-col items-center gap-4">
                <Avatar
                  src={currentUser.avatar_url}
                  firstName={currentUser.first_name}
                  lastName={currentUser.last_name}
                  userId={currentUser.id}
                  size="xl"
                  isOnline={true}
                />
                <div className="text-center">
                  <p className="text-lg font-semibold text-[#2D2D2D]">
                    {currentUser.first_name} {currentUser.last_name}
                  </p>
                  {currentUser.username && (
                    <p className="text-sm text-[#A0856C] mt-0.5">@{currentUser.username}</p>
                  )}
                  <p className="text-sm text-[#8BAF7E] mt-1">в сети</p>
                </div>
                <div className="w-full rounded-xl bg-[#F5F0EA] px-4 py-3">
                  <p className="text-xs text-[#8A8A8A] mb-0.5">Аккаунт создан</p>
                  <p className="text-sm text-[#2D2D2D]">
                    {new Date(currentUser.created_at).toLocaleDateString('ru-RU', {
                      day: 'numeric', month: 'long', year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
