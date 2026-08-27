import api from './client'
import type { Business, User, Subscription, PaginatedResponse } from '@/types'

export interface AdminStats {
  total_businesses: number
  total_users: number
  active_subscriptions: number
  total_revenue: number
  businesses_by_plan: { plan: string; count: number }[]
  users_by_role: { role: string; count: number }[]
  revenue_by_month: { month: string; amount: number }[]
}

export const adminApi = {
  getStats: async (): Promise<AdminStats> => {
    const response = await api.get<AdminStats>('/admin/stats')
    return response.data
  },

  getBusinesses: async (params?: {
    search?: string
    page?: number
    page_size?: number
  }): Promise<PaginatedResponse<Business>> => {
    const response = await api.get<PaginatedResponse<Business>>('/admin/businesses', { params })
    return response.data
  },

  getUsers: async (params?: {
    search?: string
    role?: string
    page?: number
    page_size?: number
  }): Promise<PaginatedResponse<User>> => {
    const response = await api.get<PaginatedResponse<User>>('/admin/users', { params })
    return response.data
  },

  getSubscriptions: async (params?: {
    status?: string
    page?: number
    page_size?: number
  }): Promise<PaginatedResponse<Subscription>> => {
    const response = await api.get<PaginatedResponse<Subscription>>('/admin/subscriptions', { params })
    return response.data
  },

  toggleBusinessActive: async (id: string): Promise<Business> => {
    const response = await api.patch<Business>(`/admin/businesses/${id}/toggle`)
    return response.data
  },

  toggleUserActive: async (id: string): Promise<User> => {
    const response = await api.patch<User>(`/admin/users/${id}/toggle`)
    return response.data
  },
}
