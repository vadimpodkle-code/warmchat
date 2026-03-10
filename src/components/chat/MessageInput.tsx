import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Send, Paperclip, Image, X, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface MessageInputProps {
  conversationId: string
  currentUserId: string
  onSend: (text: string) => Promise<void>
  onSendFile: (file: File) => Promise<void>
  onResize?: () => void
}

export function MessageInput({ conversationId, currentUserId, onSend, onSendFile, onResize }: MessageInputProps) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [preview, setPreview] = useState<{ file: File; url: string } | null>(null)
  const [isTyping, setIsTyping] = useState(false)
  const [fileError, setFileError] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevHeightRef = useRef<number>(42)

  const updateTyping = useCallback(async (typing: boolean) => {
    if (isTyping === typing) return
    setIsTyping(typing)
    await supabase.channel(`typing:${conversationId}`).send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId: currentUserId, typing },
    })
  }, [conversationId, currentUserId, isTyping])

  function handleTextChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value)
    // Auto resize
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      const newHeight = Math.min(textareaRef.current.scrollHeight, 120)
      textareaRef.current.style.height = `${newHeight}px`
      // Only notify parent when height actually changed (to avoid scroll on every keystroke)
      if (newHeight !== prevHeightRef.current) {
        prevHeightRef.current = newHeight
        onResize?.()
      }
    }
    // Typing indicator
    updateTyping(true)
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => updateTyping(false), 2000)
  }

  async function handleSend() {
    if ((!text.trim() && !preview) || sending) return
    setSending(true)
    setFileError('')

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    updateTyping(false)

    try {
      if (preview) {
        await onSendFile(preview.file)
        setPreview(null)
      }
      if (text.trim()) {
        await onSend(text.trim())
        setText('')
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto'
          prevHeightRef.current = 42
          onResize?.()
        }
      }
    } catch {
      setFileError('Не удалось отправить файл. Проверьте соединение.')
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileError('')
    const url = URL.createObjectURL(file)
    setPreview({ file, url })
    e.target.value = ''
  }

  const canSend = (text.trim().length > 0 || preview !== null) && !sending

  return (
    <div className="px-4 pt-3 bg-white border-t border-[#E8E4DE] flex-shrink-0" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
      {/* File error */}
      <AnimatePresence>
        {fileError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-2 flex items-center gap-2 text-sm text-red-500 bg-red-50 rounded-xl px-3 py-2"
          >
            <AlertCircle size={14} className="flex-shrink-0" />
            {fileError}
          </motion.div>
        )}
      </AnimatePresence>

      {/* File preview */}
      <AnimatePresence>
        {preview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-2"
          >
            <div className="relative inline-block">
              {preview.file.type.startsWith('image/') ? (
                <img src={preview.url} alt="Preview" className="h-20 rounded-xl object-cover" />
              ) : (
                <div className="flex items-center gap-2 bg-[#F5F0EA] rounded-xl px-3 py-2">
                  <span className="text-sm text-[#2D2D2D] font-medium truncate max-w-[200px]">
                    {preview.file.name}
                  </span>
                </div>
              )}
              <button
                onClick={() => setPreview(null)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#8A8A8A] rounded-full flex items-center justify-center hover:bg-[#6A6A6A] transition-colors"
              >
                <X size={10} className="text-white" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-end gap-2">
        {/* Attachment buttons */}
        <div className="flex gap-1 pb-[3px]">
          <button
            onClick={() => imageInputRef.current?.click()}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[#8A8A8A] hover:bg-[#F5F0EA] hover:text-[#A0856C] transition-all"
          >
            <Image size={18} />
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[#8A8A8A] hover:bg-[#F5F0EA] hover:text-[#A0856C] transition-all"
          >
            <Paperclip size={18} />
          </button>
        </div>

        {/* Text input + send button together — no gap/border between them */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder="Написать сообщение..."
            rows={1}
            className="w-full resize-none rounded-2xl border border-[#E8E4DE] bg-[#FEFCF9] pl-4 pr-12 py-2.5 text-sm text-[#2D2D2D] placeholder:text-[#B0A8A0] focus:outline-none focus:ring-2 focus:ring-[#A0856C]/30 focus:border-[#A0856C] transition-all leading-relaxed"
            style={{ minHeight: '42px', maxHeight: '120px', overflowY: 'auto' }}
          />
          <motion.button
            onClick={handleSend}
            disabled={!canSend}
            animate={{ scale: canSend ? 1 : 0.85, opacity: canSend ? 1 : 0.4 }}
            whileTap={{ scale: 0.9 }}
            className="absolute right-[5px] bottom-[3px] w-9 h-9 rounded-xl bg-[#A0856C] flex items-center justify-center text-white hover:bg-[#8C7262] transition-colors disabled:pointer-events-none"
          >
            {sending ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send size={15} />
            )}
          </motion.button>
        </div>
      </div>

      {/* Hidden inputs */}
      <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} />
    </div>
  )
}
