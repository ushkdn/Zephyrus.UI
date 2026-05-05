import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, Link } from 'react-router-dom'
import { useState } from 'react'
import { authApi } from '../../api/auth.api'
import { useAuthStore } from '../../store/auth.store'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'

const schema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(1, 'Введите пароль'),
})

type FormData = z.infer<typeof schema>

export function LoginPage() {
  const navigate = useNavigate()
  const setTokens = useAuthStore((s) => s.setTokens)
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setServerError(null)
    try {
      const res = await authApi.signIn(data)
      if (!res.success) {
        setServerError(res.message ?? 'Ошибка входа')
        return
      }
      setTokens(res.data)
      navigate('/')
    } catch {
      setServerError('Неверный email или пароль')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-indigo-900">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Zephyrus</h1>
          <p className="text-sm text-gray-500 mt-1">Войдите в систему закупок</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Email"
            type="email"
            placeholder="you@company.com"
            error={errors.email?.message}
            {...register('email')}
          />
          <div>
            <Input
              label="Пароль"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />
            <div className="mt-1 text-right">
              <Link to="/forgot-password" className="text-xs text-indigo-600 hover:underline">
                Забыли пароль?
              </Link>
            </div>
          </div>

          {serverError && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {serverError}
            </div>
          )}

          <Button type="submit" className="w-full" loading={isSubmitting}>
            Войти
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Нет аккаунта?{' '}
          <Link to="/register" className="text-indigo-600 font-medium hover:underline">
            Зарегистрироваться
          </Link>
        </p>
      </div>
    </div>
  )
}
