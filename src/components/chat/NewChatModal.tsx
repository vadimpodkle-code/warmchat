import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, Search, Plus, Users, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { Profile } from '@/types'

interface NewChatModalProps {
  currentUserId: string
  onClose: () => void
  onConversationCreated: (conversationId: string) => void
}

export function NewChatModal({ currentUserId, onClose, onConversationCreated }: NewChatModalProps) {
  const [mode, setMode] = useState<'select' | 'direct' | 'group'>('select')
  const [search, setSearch] = useState('')
  const [users, setUsers] = useState<Profile[]>([])
  const [selected, setSelected] = useState<Profile[]>([])
  const [groupName, setGroupName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (search.length < 1) { setUsers([]); return }
    const timeout = setTimeout(() => searchUsers(), 300)
    return () => clearTimeout(timeout)
  }, [search])

  async function searchUsers() {
    const query = search.trim().toLowerCase()
    if (!query) { setUsers([]); return }
    // Поиск только по username
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', currentUserId)
      .ilike('username', `${query}%`)
      .limit(20)
    setUsers(data ?? [])
  }

  function toggleUser(user: Profile) {
    setSelected(prev =>
      prev.some(u => u.id === user.id)
        ? prev.filter(u => u.id !== user.id)
        : [...prev, user]
    )
  }

  async function createDirectChat(user: Profile) {
    setLoading(true)
    setError('')
    try {
      // Check if conversation already exists
      const { data: existing } = await supabase
        .from('conversation_members')
        .select('conversation_id')
        .eq('user_id', currentUserId)

      if (existing?.length) {
        const myConvIds = existing.map(r => r.conversation_id)
        const { data: theirs } = await supabase
          .from('conversation_members')
          .select('conversation_id')
          .eq('user_id', user.id)
          .in('conversation_id', myConvIds)

        if (theirs?.length) {
          for (const row of theirs) {
            const { data: conv } = await supabase
              .from('conversations')
              .select('*')
              .eq('id', row.conversation_id)
              .eq('type', 'direct')
              .single()
            if (conv) {
              onConversationCreated(conv.id)
              return
            }
          }
        }
      }

      // Create new direct conversation
      const { data: conv, error: convError } = await supabase
        .from('conversations')
        .insert({ type: 'direct', created_by: currentUserId })
        .select()
        .single()

      if (convError || !conv) {
        console.error('Failed to create conversation:', convError)
        setError('Не удалось создать чат. Попробуйте ещё раз.')
        return
      }

      // Add both users as members
      const { error: membersError } = await supabase
        .from('conversation_members')
        .insert([
          { conversation_id: conv.id, user_id: currentUserId, is_admin: false },
          { conversation_id: conv.id, user_id: user.id, is_admin: false },
        ])

      if (membersError) {
        console.error('Failed to add members:', membersError)
        setError('Не удалось добавить участников. Попробуйте ещё раз.')
        return
      }

      onConversationCreated(conv.id)
    } catch (err) {
      console.error('Error creating direct chat:', err)
      setError('Произошла ошибка. Попробуйте ещё раз.')
    } finally {
      setLoading(false)
    }
  }

  async function createGroupChat() {
    if (!groupName.trim() || selected.length === 0) return
    setLoading(true)

    const { data: conv } = await supabase
      .from('conversations')
      .insert({ type: 'group', name: groupName.trim(), created_by: currentUserId })
      .select()
      .single()

    if (conv) {
      const members = [
        { conversation_id: conv.id, user_id: currentUserId, is_admin: true },
        ...selected.map(u => ({ conversation_id: conv.id, user_id: u.id, is_admin: false })),
      ]
      await supabase.from('conversation_members').insert(members)
      onConversationCreated(conv.id)
    }
    setLoading(false)
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8E4DE]">
            <h2 className="text-base font-semibold text-[#2D2D2D]">
              {mode === 'select' ? 'Новый чат' : mode === 'direct' ? 'Написать сообщение' : 'Создать группу'}
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-[#8A8A8A] hover:bg-[#F5F0EA] transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Mode select */}
          {mode === 'select' && (
            <div className="p-4 flex flex-col gap-2">
              <button
                onClick={() => setMode('direct')}
                className="flex items-center gap-3 p-3.5 rounded-xl hover:bg-[#F5F0EA] transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-full bg-[#A0856C]/15 flex items-center justify-center">
                  <Plus size={20} className="text-[#A0856C]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#2D2D2D]">Личный чат</p>
                  <p className="text-xs text-[#8A8A8A]">Написать конкретному человеку</p>
                </div>
              </button>
              <button
                onClick={() => setMode('group')}
                className="flex items-center gap-3 p-3.5 rounded-xl hover:bg-[#F5F0EA] transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-full bg-[#8BAF7E]/15 flex items-center justify-center">
                  <Users size={20} className="text-[#8BAF7E]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#2D2D2D]">Группа</p>
                  <p className="text-xs text-[#8A8A8A]">Чат с несколькими участниками</p>
                </div>
              </button>
            </div>
          )}

          {/* Direct or Group user search */}
          {(mode === 'direct' || mode === 'group') && (
            <div className="flex flex-col">
              {mode === 'group' && (
                <div className="px-4 pt-4">
                  <Input
                    placeholder="Название группы"
                    value={groupName}
                    onChange={e => setGroupName(e.target.value)}
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                  />
                </div>
              )}

              {/* Selected users (group) */}
              {mode === 'group' && selected.length > 0 && (
                <div className="flex gap-2 px-4 pt-3 flex-wrap">
                  {selected.map(u => (
                    <button
                      key={u.id}
                      onClick={() => toggleUser(u)}
                      className="flex items-center gap-1.5 bg-[#A0856C]/10 text-[#A0856C] rounded-full px-2.5 py-1 text-xs font-medium hover:bg-[#A0856C]/20 transition-colors"
                    >
                      {u.first_name}
                      <X size={12} />
                    </button>
                  ))}
                </div>
              )}

              <div className="px-4 pt-3 pb-2">
                <div className="flex items-center rounded-xl border border-[#E8E4DE] bg-white focus-within:ring-2 focus-within:ring-[#A0856C]/40 focus-within:border-[#A0856C] transition-all">
                  <Search size={15} className="ml-3 text-[#B0A8A0] flex-shrink-0" />
                  <span className="ml-2 text-sm font-medium text-[#A0856C] select-none flex-shrink-0">@</span>
                  <input
                    type="text"
                    placeholder="username..."
                    value={search}
                    onChange={e => setSearch(e.target.value.replace(/^@/, '').toLowerCase())}
                    autoComplete="new-password"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    data-form-type="other"
                    data-lpignore="true"
                    className="flex-1 py-2.5 pr-3 text-sm text-[#2D2D2D] placeholder:text-[#B0A8A0] bg-transparent focus:outline-none"
                  />
                </div>
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2 mx-4 mb-2"
                >
                  {error}
                </motion.p>
              )}

              <div className="max-h-64 overflow-y-auto px-2 pb-2">
                {users.length === 0 && search.length > 0 && (
                  <p className="text-center text-sm text-[#8A8A8A] py-8">Никого не найдено</p>
                )}
                {users.length === 0 && search.length === 0 && (
                  <p className="text-center text-sm text-[#B0A8A0] py-8">Введите username для поиска</p>
                )}
                {users.map(user => {
                  const isSelected = selected.some(u => u.id === user.id)
                  return (
                    <button
                      key={user.id}
                      disabled={loading}
                      onClick={() => mode === 'direct' ? createDirectChat(user) : toggleUser(user)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#F5F0EA] transition-colors text-left disabled:opacity-50"
                    >
                      <Avatar
                        src={user.avatar_url}
                        firstName={user.first_name}
                        lastName={user.last_name}
                        isOnline={user.is_online}
                        userId={user.id}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#2D2D2D]">
                          {user.first_name} {user.last_name}
                        </p>
                        <p className="text-xs text-[#8A8A8A]">
                          {user.username ? `@${user.username}` : (user.is_online ? 'в сети' : 'не в сети')}
                        </p>
                      </div>
                      {mode === 'group' && isSelected && (
                        <div className="w-5 h-5 rounded-full bg-[#A0856C] flex items-center justify-center flex-shrink-0">
                          <Check size={11} className="text-white" />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>

              {mode === 'group' && (
                <div className="px-4 pb-4 pt-2 border-t border-[#E8E4DE]">
                  <Button
                    className="w-full"
                    disabled={!groupName.trim() || selected.length === 0}
                    loading={loading}
                    onClick={createGroupChat}
                  >
                    Создать группу ({selected.length} участников)
                  </Button>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
