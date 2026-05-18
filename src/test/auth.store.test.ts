import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from '../store/auth.store'
import { sign } from './helpers/jwt'

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
    })
  })

  describe('setTokens', () => {
    it('decodes JWT and stores user info', () => {
      const payload = {
        sub: '11111111-1111-1111-1111-111111111111',
        email: 'admin@test.com',
        given_name: 'Ivan',
        family_name: 'Ivanov',
        role: 'Admin' as const,
        exp: Math.floor(Date.now() / 1000) + 3600,
      }
      const token = sign(payload)

      useAuthStore.getState().setTokens({ accessToken: token, refreshToken: 'refresh_token' })

      const { user, accessToken, refreshToken } = useAuthStore.getState()
      expect(user).not.toBeNull()
      expect(user!.email).toBe('admin@test.com')
      expect(user!.firstName).toBe('Ivan')
      expect(user!.lastName).toBe('Ivanov')
      expect(user!.role).toBe('Admin')
      expect(accessToken).toBe(token)
      expect(refreshToken).toBe('refresh_token')
    })

    it('clears state on invalid token', () => {
      useAuthStore.getState().setTokens({ accessToken: 'invalid.token.here', refreshToken: 'r' })

      const { user, accessToken, refreshToken } = useAuthStore.getState()
      expect(user).toBeNull()
      expect(accessToken).toBeNull()
      expect(refreshToken).toBeNull()
    })
  })

  describe('logout', () => {
    it('clears all auth state', () => {
      const payload = {
        sub: 'id',
        email: 'u@t.com',
        given_name: 'A',
        family_name: 'B',
        role: 'Buyer' as const,
        exp: Math.floor(Date.now() / 1000) + 3600,
      }
      useAuthStore.getState().setTokens({ accessToken: sign(payload), refreshToken: 'rt' })

      useAuthStore.getState().logout()

      const { user, accessToken, refreshToken } = useAuthStore.getState()
      expect(user).toBeNull()
      expect(accessToken).toBeNull()
      expect(refreshToken).toBeNull()
    })
  })

  describe('isAuthenticated', () => {
    it('returns false when no token', () => {
      expect(useAuthStore.getState().isAuthenticated()).toBe(false)
    })

    it('returns true for valid non-expired token', () => {
      const payload = {
        sub: 'id',
        email: 'u@t.com',
        given_name: 'A',
        family_name: 'B',
        role: 'Buyer' as const,
        exp: Math.floor(Date.now() / 1000) + 3600,
      }
      useAuthStore.getState().setTokens({ accessToken: sign(payload), refreshToken: 'rt' })

      expect(useAuthStore.getState().isAuthenticated()).toBe(true)
    })

    it('returns false for expired token', () => {
      const payload = {
        sub: 'id',
        email: 'u@t.com',
        given_name: 'A',
        family_name: 'B',
        role: 'Buyer' as const,
        exp: Math.floor(Date.now() / 1000) - 1,
      }
      useAuthStore.setState({ accessToken: sign(payload), user: null, refreshToken: null })

      expect(useAuthStore.getState().isAuthenticated()).toBe(false)
    })

    it('returns false for malformed token', () => {
      useAuthStore.setState({ accessToken: 'bad.token', user: null, refreshToken: null })

      expect(useAuthStore.getState().isAuthenticated()).toBe(false)
    })
  })

  describe('hasRole', () => {
    it('returns false when user is null', () => {
      expect(useAuthStore.getState().hasRole('Admin')).toBe(false)
    })

    it('returns true when user has the role', () => {
      const payload = {
        sub: 'id',
        email: 'u@t.com',
        given_name: 'A',
        family_name: 'B',
        role: 'Manager' as const,
        exp: Math.floor(Date.now() / 1000) + 3600,
      }
      useAuthStore.getState().setTokens({ accessToken: sign(payload), refreshToken: 'rt' })

      expect(useAuthStore.getState().hasRole('Manager')).toBe(true)
    })

    it('returns false when user does not have the role', () => {
      const payload = {
        sub: 'id',
        email: 'u@t.com',
        given_name: 'A',
        family_name: 'B',
        role: 'Buyer' as const,
        exp: Math.floor(Date.now() / 1000) + 3600,
      }
      useAuthStore.getState().setTokens({ accessToken: sign(payload), refreshToken: 'rt' })

      expect(useAuthStore.getState().hasRole('Admin', 'Manager')).toBe(false)
    })

    it('returns true when any of the given roles matches', () => {
      const payload = {
        sub: 'id',
        email: 'u@t.com',
        given_name: 'A',
        family_name: 'B',
        role: 'Admin' as const,
        exp: Math.floor(Date.now() / 1000) + 3600,
      }
      useAuthStore.getState().setTokens({ accessToken: sign(payload), refreshToken: 'rt' })

      expect(useAuthStore.getState().hasRole('Manager', 'Admin')).toBe(true)
    })
  })
})
