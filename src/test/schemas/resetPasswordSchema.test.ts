import { describe, it, expect } from 'vitest'
import { z } from 'zod'

const resetPasswordSchema = z
  .object({
    confirmationCode: z.string().length(6, 'Код должен содержать 6 символов'),
    newPassword: z.string().min(6, 'Минимум 6 символов'),
    confirmPassword: z.string().min(1, 'Подтвердите пароль'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  })

const validData = {
  confirmationCode: 'ABC123',
  newPassword: 'newpass',
  confirmPassword: 'newpass',
}

describe('ResetPasswordPage schema', () => {
  it('passes with valid 6-char code and matching passwords', () => {
    expect(resetPasswordSchema.safeParse(validData).success).toBe(true)
  })

  it('fails with code shorter than 6 chars', () => {
    const result = resetPasswordSchema.safeParse({ ...validData, confirmationCode: 'ABC12' })
    expect(result.success).toBe(false)
    expect(result.error!.flatten().fieldErrors.confirmationCode).toContain('Код должен содержать 6 символов')
  })

  it('fails with code longer than 6 chars', () => {
    const result = resetPasswordSchema.safeParse({ ...validData, confirmationCode: 'ABC1234' })
    expect(result.success).toBe(false)
    expect(result.error!.flatten().fieldErrors.confirmationCode).toBeDefined()
  })

  it('fails with empty code', () => {
    const result = resetPasswordSchema.safeParse({ ...validData, confirmationCode: '' })
    expect(result.success).toBe(false)
    expect(result.error!.flatten().fieldErrors.confirmationCode).toBeDefined()
  })

  it('fails with new password shorter than 6 chars', () => {
    const result = resetPasswordSchema.safeParse({ ...validData, newPassword: 'abc', confirmPassword: 'abc' })
    expect(result.success).toBe(false)
    expect(result.error!.flatten().fieldErrors.newPassword).toContain('Минимум 6 символов')
  })

  it('fails when passwords do not match', () => {
    const result = resetPasswordSchema.safeParse({
      ...validData,
      newPassword: 'newpass1',
      confirmPassword: 'newpass2',
    })
    expect(result.success).toBe(false)
    expect(result.error!.flatten().fieldErrors.confirmPassword).toContain('Пароли не совпадают')
  })

  it('passes with exactly 6-char code and 6-char matching passwords', () => {
    const result = resetPasswordSchema.safeParse({
      confirmationCode: 'X1Y2Z3',
      newPassword: 'abc123',
      confirmPassword: 'abc123',
    })
    expect(result.success).toBe(true)
  })
})
