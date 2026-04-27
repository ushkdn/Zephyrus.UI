import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, Link } from 'react-router-dom'
import { useState } from 'react'
import { authApi } from '../../api/auth.api'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Select'

const schema = z
  .object({
    email: z.string().email('Некорректный email'),
    firstName: z.string().min(1, 'Введите имя'),
    middleName: z.string().min(1, 'Введите отчество'),
    lastName: z.string().min(1, 'Введите фамилию'),
    role: z.string().min(1, 'Выберите роль'),
    password: z.string().min(6, 'Минимум 6 символов'),
    confirmPassword: z.string().min(1, 'Подтвердите пароль'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  })

type FormData = z.infer<typeof schema>

const roleOptions = [
  { value: '1', label: 'Администратор' },
  { value: '2', label: 'Менеджер' },
  { value: '3', label: 'Закупщик' },
]

export function RegisterPage() {
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setServerError(null)
    try {
      const res = await authApi.signUp({
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
        firstName: data.firstName,
        middleName: data.middleName,
        lastName: data.lastName,
        role: Number(data.role),
      })
      if (!res.success) {
        setServerError(res.message ?? 'Ошибка регистрации')
        return
      }
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2000)
    } catch {
      setServerError('Ошибка при регистрации. Попробуйте снова.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-indigo-900 py-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Регистрация</h1>
          <p className="text-sm text-gray-500 mt-1">Создайте аккаунт в Zephyrus</p>
        </div>

        {success ? (
          <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-4 text-sm text-green-700 text-center">
            Аккаунт создан! Перенаправление на вход...
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Имя" placeholder="Иван" error={errors.firstName?.message} {...register('firstName')} />
              <Input label="Фамилия" placeholder="Иванов" error={errors.lastName?.message} {...register('lastName')} />
            </div>
            <Input label="Отчество" placeholder="Иванович" error={errors.middleName?.message} {...register('middleName')} />
            <Input label="Email" type="email" placeholder="you@company.com" error={errors.email?.message} {...register('email')} />
            <Select
              label="Роль"
              options={roleOptions}
              placeholder="Выберите роль"
              error={errors.role?.message}
              {...register('role')}
            />
            <Input label="Пароль" type="password" placeholder="••••••••" error={errors.password?.message} {...register('password')} />
            <Input label="Подтвердите пароль" type="password" placeholder="••••••••" error={errors.confirmPassword?.message} {...register('confirmPassword')} />

            {serverError && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {serverError}
              </div>
            )}

            <Button type="submit" className="w-full" loading={isSubmitting}>
              Зарегистрироваться
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-gray-500">
          Уже есть аккаунт?{' '}
          <Link to="/login" className="text-indigo-600 font-medium hover:underline">
            Войти
          </Link>
        </p>
      </div>
    </div>
  )
}
