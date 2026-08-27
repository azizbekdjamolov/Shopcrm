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

export const authApi = {
  login: async (data: LoginRequest): Promise<{ user: User; tokens: AuthTokens }> => {
    const response = await api.post<{ user: User; tokens: AuthTokens }>('/auth/login/', data)
    return response.data
  },

  register: async (data: RegisterRequest): Promise<{ user: User; tokens: AuthTokens }> => {
    const response = await api.post<{ user: User; tokens: AuthTokens }>('/auth/register/', data)
    return response.data
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
