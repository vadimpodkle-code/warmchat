import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Mail, Lock, User, MessageCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirmPassword) {
      setError('Пароли не совпадают')
      return
    }
    if (form.password.length < 6) {
      setError('Пароль должен содержать не менее 6 символов')
      return
    }

    setLoading(true)

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    })

    if (signUpError || !data.user) {
      setError(signUpError?.message ?? 'Ошибка регистрации')
      setLoading(false)
      return
    }

    // Create profile
    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      first_name: form.firstName.trim(),
      last_name: form.lastName.trim(),
      avatar_url: null,
      is_online: true,
    })

    if (profileError) {
      setError('Ошибка создания профиля')
      setLoading(false)
      return
    }

    navigate('/app')
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
          <p className="text-sm text-[#8A8A8A] mt-1">Создай свой аккаунт</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl border border-[#E8E4DE] p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex gap-3">
              <Input
                label="Имя"
                placeholder="Иван"
                value={form.firstName}
                onChange={e => update('firstName', e.target.value)}
                leftIcon={<User size={16} />}
                required
              />
              <Input
                label="Фамилия"
                placeholder="Иванов"
                value={form.lastName}
                onChange={e => update('lastName', e.target.value)}
                required
              />
            </div>

            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => update('email', e.target.value)}
              leftIcon={<Mail size={16} />}
              required
            />
            <Input
              label="Пароль"
              type="password"
              placeholder="Минимум 6 символов"
              value={form.password}
              onChange={e => update('password', e.target.value)}
              leftIcon={<Lock size={16} />}
              required
            />
            <Input
              label="Повторите пароль"
              type="password"
              placeholder="••••••••"
              value={form.confirmPassword}
              onChange={e => update('confirmPassword', e.target.value)}
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
              Создать аккаунт
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-[#8A8A8A] mt-5">
          Уже есть аккаунт?{' '}
          <Link to="/login" className="text-[#A0856C] font-medium hover:underline">
            Войти
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
