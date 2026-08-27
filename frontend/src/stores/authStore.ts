import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, AuthTokens, UserRoleType, Business } from '@/types'

interface AuthState {
  user: User | null
  tokens: AuthTokens | null
  business: Business | null
  isAuthenticated: boolean
  setAuth: (user: User, tokens: AuthTokens) => void
  setUser: (user: User) => void
  setTokens: (tokens: AuthTokens) => void
  setBusiness: (business: Business) => void
  logout: () => void
  hasRole: (roles: UserRoleType | UserRoleType[]) => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      business: null,
      isAuthenticated: false,

      setAuth: (user, tokens) => {
        set({ user, tokens, isAuthenticated: true })
      },

      setUser: (user) => {
        set({ user })
      },

      setTokens: (tokens) => {
        set({ tokens })
      },

      setBusiness: (business) => {
        set({ business })
      },

      logout: () => {
        set({ user: null, tokens: null, business: null, isAuthenticated: false })
      },

      hasRole: (roles) => {
        const { user } = get()
        if (!user) return false
        if (Array.isArray(roles)) {
          return roles.includes(user.role)
        }
        return user.role === roles
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        business: state.business,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
