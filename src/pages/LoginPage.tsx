import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Mail, Lock, MessageCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      if (error.message.includes('Email not confirmed')) {
        setError('Email не подтверждён. Проверьте почту и нажмите ссылку из письма')
      } else {
        setError('Неверный email или пароль')
      }
      setLoading(false)
    } else {
      navigate('/app')
    }
  }

  return (
    <div className="min-h-screen bg-[#FEFCF9] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[#A0856C] flex items-center justify-center mb-3 shadow-md">
            <MessageCircle size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-[#2D2D2D]">WarmChat</h1>
          <p className="text-sm text-[#8A8A8A] mt-1">Рады видеть тебя снова</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl border border-[#E8E4DE] p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              leftIcon={<Mail size={16} />}
              required
            />
            <Input
              label="Пароль"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              leftIcon={<Lock size={16} />}
              required
            />

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2"
              >
                {error}
              </motion.p>
            )}

            <Button type="submit" loading={loading} className="w-full mt-1">
              Войти
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-[#8A8A8A] mt-5">
          Нет аккаунта?{' '}
          <Link to="/register" className="text-[#A0856C] font-medium hover:underline">
            Зарегистрироваться
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
