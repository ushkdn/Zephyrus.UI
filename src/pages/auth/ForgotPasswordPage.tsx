import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, Link } from 'react-router-dom'
import { useState } from 'react'
import { authApi } from '../../api/auth.api'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'

const schema = z.object({
  email: z.string().email('Некорректный email'),
})

type FormData = z.infer<typeof schema>

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setServerError(null)
    try {
      const res = await authApi.forgotPassword(data)
      if (!res.success) {
        setServerError(res.message ?? 'Ошибка. Попробуйте позже.')
        return
      }
      setUserId(res.data ?? null)
      setSent(true)
    } catch {
      setServerError('Ошибка при отправке запроса. Попробуйте снова.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-indigo-900">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Zephyrus</h1>
          <p className="text-sm text-gray-500 mt-1">Восстановление пароля</p>
        </div>

        {sent ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-4 text-sm text-green-700 text-center">
              Если указанный email зарегистрирован в системе, на него отправлен код подтверждения.
            </div>
            {userId ? (
              <Button className="w-full" onClick={() => navigate(`/reset-password/${userId}`)}>
                Продолжить
              </Button>
            ) : (
              <p className="text-sm text-gray-500 text-center">
                Не получили код? Обратитесь к администратору системы.
              </p>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <p className="text-sm text-gray-600">
              Введите email вашего аккаунта — мы отправим код для сброса пароля.
            </p>
            <Input
              label="Email"
              type="email"
              placeholder="you@company.com"
              error={errors.email?.message}
              {...register('email')}
            />

            {serverError && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {serverError}
              </div>
            )}

            <Button type="submit" className="w-full" loading={isSubmitting}>
              Отправить код
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-gray-500">
          <Link to="/login" className="text-indigo-600 font-medium hover:underline">
            Вернуться ко входу
          </Link>
        </p>
      </div>
    </div>
  )
}
