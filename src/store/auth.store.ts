import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { jwtDecode } from 'jwt-decode'
import type { AuthUser, AuthTokens, UserRole } from '../types'

interface JwtPayload {
  sub: string
  email: string
  given_name: string
  family_name: string
  role: UserRole
  exp: number
}

interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  refreshToken: string | null
  setTokens: (tokens: AuthTokens) => void
  logout: () => void
  isAuthenticated: () => boolean
  hasRole: (...roles: UserRole[]) => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,

      setTokens: (tokens: AuthTokens) => {
        try {
          const payload = jwtDecode<JwtPayload>(tokens.accessToken)
          set({
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            user: { id: payload.sub, email: payload.email, firstName: payload.given_name, lastName: payload.family_name, role: payload.role },
          })
        } catch {
          set({ accessToken: null, refreshToken: null, user: null })
        }
      },

      logout: () => set({ user: null, accessToken: null, refreshToken: null }),

      isAuthenticated: () => {
        const { accessToken } = get()
        if (!accessToken) return false
        try {
          const { exp } = jwtDecode<JwtPayload>(accessToken)
          return Date.now() / 1000 < exp
        } catch {
          return false
        }
      },

      hasRole: (...roles: UserRole[]) => {
        const { user } = get()
        return user ? roles.includes(user.role) : false
      },
    }),
    { name: 'zephyrus-auth' }
  )
)
