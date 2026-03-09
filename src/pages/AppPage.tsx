import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { MessageCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { usePresence } from '@/hooks/usePresence'
import { useConversations } from '@/hooks/useConversations'
import { Sidebar } from '@/components/layout/Sidebar'
import { ChatWindow } from '@/components/chat/ChatWindow'
import { SetupUsernamePage } from '@/pages/SetupUsernamePage'
import { supabase } from '@/lib/supabase'
import type { Conversation } from '@/types'

export function AppPage() {
  const { user, profile, signOut, needsUsername, fetchProfile } = useAuth()
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null)
  const [showSidebar, setShowSidebar] = useState(true)

  usePresence(user?.id)

  const { conversations, refetch } = useConversations(user?.id)

  // When new conversation is created, select it
  async function handleNewConversation(conversationId: string) {
    await refetch()
    await loadAndSelectConversation(conversationId)
  }

  async function loadAndSelectConversation(conversationId: string) {
    const { data } = await supabase
      .from('conversations')
      .select(`
        *,
        members:conversation_members(
          *,
          profile:profiles(*)
        )
      `)
      .eq('id', conversationId)
      .single()

    if (data) {
      setActiveConversation(data)
      setShowSidebar(false)
    }
  }

  async function handleSelectConversation(conversationId: string) {
    const found = conversations.find(c => c.id === conversationId)
    if (found) {
      setActiveConversation(found)
      setShowSidebar(false)
    } else {
      await loadAndSelectConversation(conversationId)
    }
    await refetch()
  }

  function handleBack() {
    setShowSidebar(true)
    setActiveConversation(null)
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-[#E8E4DE] border-t-[#A0856C] rounded-full animate-spin" />
      </div>
    )
  }

  if (needsUsername && user) {
    return <SetupUsernamePage userId={user.id} onComplete={() => fetchProfile()} />
  }

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Sidebar - always visible on desktop, conditional on mobile */}
      <div
        className={`
          ${showSidebar ? 'flex' : 'hidden'} md:flex
          w-full md:w-80 lg:w-96 flex-shrink-0
          flex-col
        `}
      >
        <Sidebar
          conversations={conversations}
          currentUser={profile}
          activeConversationId={activeConversation?.id ?? null}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
          onSignOut={signOut}
        />
      </div>

      {/* Chat area */}
      <div className={`flex-1 flex flex-col ${!showSidebar || activeConversation ? 'flex' : 'hidden md:flex'}`}>
        <AnimatePresence mode="wait">
          {activeConversation ? (
            <motion.div
              key={activeConversation.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col h-full"
            >
              <ChatWindow
                conversation={activeConversation}
                currentUserId={user!.id}
                onBack={handleBack}
              />
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="hidden md:flex flex-1 flex-col items-center justify-center gap-4 bg-[#FEFCF9]"
            >
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
  )
}
