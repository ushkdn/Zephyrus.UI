import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useState } from 'react'
import { authApi } from '../../api/auth.api'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'

const schema = z
  .object({
    confirmationCode: z.string().length(6, 'Код должен содержать 6 символов'),
    newPassword: z.string().min(6, 'Минимум 6 символов'),
    confirmPassword: z.string().min(1, 'Подтвердите пароль'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  })

type FormData = z.infer<typeof schema>

export function ResetPasswordPage() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    if (!userId) return
    setServerError(null)
    try {
      const res = await authApi.resetPassword(userId, {
        confirmationCode: data.confirmationCode,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      })
      if (!res.success) {
        setServerError(res.message ?? 'Не удалось сбросить пароль')
        return
      }
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2000)
    } catch {
      setServerError('Ошибка при сбросе пароля. Попробуйте снова.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-indigo-900">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Zephyrus</h1>
          <p className="text-sm text-gray-500 mt-1">Сброс пароля</p>
        </div>

        {success ? (
          <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-4 text-sm text-green-700 text-center">
            Пароль успешно изменён. Перенаправление на страницу входа...
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <p className="text-sm text-gray-600">
              Введите код из письма и придумайте новый пароль.
            </p>
            <Input
              label="Код подтверждения"
              placeholder="123456"
              maxLength={6}
              error={errors.confirmationCode?.message}
              {...register('confirmationCode')}
            />
            <Input
              label="Новый пароль"
              type="password"
              placeholder="••••••••"
              error={errors.newPassword?.message}
              {...register('newPassword')}
            />
            <Input
              label="Подтвердите пароль"
              type="password"
              placeholder="••••••••"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            {serverError && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {serverError}
              </div>
            )}

            <Button type="submit" className="w-full" loading={isSubmitting}>
              Сбросить пароль
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
