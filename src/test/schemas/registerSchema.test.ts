import { describe, it, expect } from 'vitest'
import { z } from 'zod'

const registerSchema = z
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

const validData = {
  email: 'user@test.com',
  firstName: 'Ivan',
  middleName: 'Ivanovich',
  lastName: 'Ivanov',
  role: '3',
  password: 'pass123',
  confirmPassword: 'pass123',
}

describe('RegisterPage schema', () => {
  it('passes with all valid fields', () => {
    expect(registerSchema.safeParse(validData).success).toBe(true)
  })

  it('fails with invalid email', () => {
    const result = registerSchema.safeParse({ ...validData, email: 'bademail' })
    expect(result.success).toBe(false)
    expect(result.error!.flatten().fieldErrors.email).toBeDefined()
  })

  it('fails with empty firstName', () => {
    const result = registerSchema.safeParse({ ...validData, firstName: '' })
    expect(result.success).toBe(false)
    expect(result.error!.flatten().fieldErrors.firstName).toBeDefined()
  })

  it('fails with empty lastName', () => {
    const result = registerSchema.safeParse({ ...validData, lastName: '' })
    expect(result.success).toBe(false)
    expect(result.error!.flatten().fieldErrors.lastName).toBeDefined()
  })

  it('fails with empty middleName', () => {
    const result = registerSchema.safeParse({ ...validData, middleName: '' })
    expect(result.success).toBe(false)
    expect(result.error!.flatten().fieldErrors.middleName).toBeDefined()
  })

  it('fails with empty role', () => {
    const result = registerSchema.safeParse({ ...validData, role: '' })
    expect(result.success).toBe(false)
    expect(result.error!.flatten().fieldErrors.role).toBeDefined()
  })

  it('fails with password shorter than 6 chars', () => {
    const result = registerSchema.safeParse({ ...validData, password: 'abc', confirmPassword: 'abc' })
    expect(result.success).toBe(false)
    expect(result.error!.flatten().fieldErrors.password).toContain('Минимум 6 символов')
  })

  it('fails when passwords do not match', () => {
    const result = registerSchema.safeParse({ ...validData, password: 'pass123', confirmPassword: 'different' })
    expect(result.success).toBe(false)
    expect(result.error!.flatten().fieldErrors.confirmPassword).toContain('Пароли не совпадают')
  })

  it('passes with exactly 6 char password matching confirmPassword', () => {
    const result = registerSchema.safeParse({ ...validData, password: 'abc123', confirmPassword: 'abc123' })
    expect(result.success).toBe(true)
  })
})
