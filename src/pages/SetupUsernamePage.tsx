import { useState, useEffect, useCallback } from 'react'
import { motion } from 'motion/react'
import { AtSign, Check, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'

interface SetupUsernamePageProps {
  userId: string
  onComplete: () => void
}

export function SetupUsernamePage({ userId, onComplete }: SetupUsernamePageProps) {
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)
  const [available, setAvailable] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)

  const normalized = username.toLowerCase().replace(/[^a-z0-9_]/g, '')
  const isValid = /^[a-z0-9_]{3,30}$/.test(normalized)

  // Check availability with debounce
  const checkAvailability = useCallback(async (value: string) => {
    if (!value || value.length < 3) {
      setAvailable(null)
      setChecking(false)
      return
    }

    setChecking(true)
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', value)
      .neq('id', userId)
      .maybeSingle()

    setAvailable(data === null)
    setChecking(false)
  }, [userId])

  useEffect(() => {
    if (normalized.length < 3) {
      setAvailable(null)
      return
    }

    setChecking(true)
    const timeout = setTimeout(() => checkAvailability(normalized), 500)
    return () => clearTimeout(timeout)
  }, [normalized, checkAvailability])

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')
    setUsername(value)
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid || available === false) return

    setLoading(true)
    setError('')

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ username: normalized })
      .eq('id', userId)

    if (updateError) {
      if (updateError.message.includes('duplicate') || updateError.message.includes('unique')) {
        setError('Этот username уже занят')
      } else {
        setError(updateError.message)
      }
      setLoading(false)
      return
    }

    onComplete()
  }

  return (
    <div className="min-h-full flex items-center justify-center bg-gradient-to-b from-[#FEFCF9] to-[#F5F0EA] p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            className="w-16 h-16 bg-[#A0856C] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
          >
            <AtSign size={28} className="text-white" />
          </motion.div>
          <h1 className="text-xl font-bold text-[#2D2D2D]">Последний шаг!</h1>
          <p className="text-sm text-[#8A8A8A] mt-1">Выберите уникальный username</p>
        </div>

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl p-6 shadow-sm border border-[#E8E4DE]"
        >
          <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
            Имя пользователя
          </label>

          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A0856C] font-medium text-base select-none">
              @
            </span>
            <input
              type="text"
              value={username}
              onChange={handleInput}
              placeholder="username"
              maxLength={30}
              autoFocus
              className="w-full pl-8 pr-10 py-2.5 rounded-xl border border-[#E8E4DE] bg-[#FEFCF9] text-[#2D2D2D] text-base placeholder:text-[#C8BDB3] focus:outline-none focus:ring-2 focus:ring-[#A0856C]/30 focus:border-[#A0856C] transition-all"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {checking && <Loader2 size={16} className="text-[#8A8A8A] animate-spin" />}
              {!checking && available === true && isValid && (
                <Check size={16} className="text-[#8BAF7E]" />
              )}
              {!checking && available === false && (
                <X size={16} className="text-red-400" />
              )}
            </div>
          </div>

          {/* Hints */}
          <div className="mt-2 space-y-1">
            {username.length > 0 && username.length < 3 && (
              <p className="text-xs text-[#8A8A8A]">Минимум 3 символа</p>
            )}
            {available === false && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-red-500"
              >
                Этот username уже занят
              </motion.p>
            )}
            {available === true && isValid && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-[#8BAF7E]"
              >
                @{normalized} свободен!
              </motion.p>
            )}
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-red-500 mt-3"
            >
              {error}
            </motion.p>
          )}

          <Button
            type="submit"
            className="w-full mt-5"
            disabled={!isValid || available !== true || loading}
            loading={loading}
          >
            Продолжить
          </Button>

          <p className="text-xs text-center text-[#B0A8A0] mt-4">
            Только строчные латинские буквы, цифры и _
          </p>
        </motion.form>
      </motion.div>
    </div>
  )
}
