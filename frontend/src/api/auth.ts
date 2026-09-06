import api from './client'
import type { User, AuthTokens, LoginRequest, RegisterRequest } from '@/types'

interface ApiResponse<T> {
  error: boolean
  message: string
  data: T
}

export interface ChangePasswordRequest {
  old_password: string
  new_password: string
}

export interface ForgotPasswordRequest {
  email: string
}

interface BackendTokens {
  access: string
  refresh: string
}

interface AuthResponse {
  user: User
  tokens: BackendTokens
  business?: { id: string; name: string; slug: string } | null
}

interface LoginResult extends Omit<AuthResponse, 'tokens'> {
  tokens: AuthTokens
}

const normalizeTokens = (tokens: BackendTokens): AuthTokens => ({
  access_token: tokens.access,
  refresh_token: tokens.refresh,
  token_type: 'bearer',
  expires_in: 3600,
})

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResult> => {
    const response = await api.post<AuthResponse>('/auth/login/', data)
    return {
      user: response.data.user,
      tokens: normalizeTokens(response.data.tokens),
      business: response.data.business,
    }
  },

  register: async (data: RegisterRequest): Promise<LoginResult> => {
    const response = await api.post<AuthResponse>('/auth/register/', data)
    return {
      user: response.data.user,
      tokens: normalizeTokens(response.data.tokens),
      business: response.data.business,
    }
  },

  refreshToken: async (refreshToken: string): Promise<{ access: string; refresh?: string }> => {
    const response = await api.post<{ access: string; refresh?: string }>('/auth/refresh/', {
      refresh: refreshToken,
    })
    return response.data
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout/')
  },

  getMe: async (): Promise<User> => {
    const response = await api.get<User>('/auth/me/')
    return response.data
  },

  changePassword: async (data: ChangePasswordRequest): Promise<void> => {
    await api.post('/auth/change-password/', data)
  },

  forgotPassword: async (data: ForgotPasswordRequest): Promise<void> => {
    await api.post('/auth/forgot-password/', data)
  },
}
