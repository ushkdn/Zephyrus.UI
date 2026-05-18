import { describe, it, expect } from 'vitest'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(1, 'Введите пароль'),
})

describe('LoginPage schema', () => {
  it('passes with valid email and password', () => {
    const result = loginSchema.safeParse({ email: 'user@test.com', password: 'pass123' })
    expect(result.success).toBe(true)
  })

  it('fails with missing email', () => {
    const result = loginSchema.safeParse({ email: '', password: 'pass123' })
    expect(result.success).toBe(false)
    const errors = result.error!.flatten().fieldErrors
    expect(errors.email).toBeDefined()
  })

  it('fails with invalid email format', () => {
    const result = loginSchema.safeParse({ email: 'notanemail', password: 'pass123' })
    expect(result.success).toBe(false)
    expect(result.error!.flatten().fieldErrors.email).toContain('Некорректный email')
  })

  it('fails with empty password', () => {
    const result = loginSchema.safeParse({ email: 'user@test.com', password: '' })
    expect(result.success).toBe(false)
    expect(result.error!.flatten().fieldErrors.password).toContain('Введите пароль')
  })

  it('passes with any non-empty password', () => {
    const result = loginSchema.safeParse({ email: 'user@test.com', password: 'a' })
    expect(result.success).toBe(true)
  })
})
