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
    const response = await api.get<any>('/platform-admin/dashboard')
    const d = response.data || {}
    return {
      total_businesses: d.total_businesses || 0,
      total_users: d.total_users || 0,
      active_subscriptions: d.active_businesses || 0,
      total_revenue: d.monthly_revenue || d.total_revenue || 0,
      businesses_by_plan: [],
      users_by_role: [],
      revenue_by_month: [],
    }
  },

  getBusinesses: async (params?: {
    search?: string
    page?: number
    page_size?: number
  }): Promise<PaginatedResponse<Business>> => {
    const response = await api.get<PaginatedResponse<Business>>('/platform-admin/businesses', { params })
    return response.data
  },

  getUsers: async (params?: {
    search?: string
    role?: string
    page?: number
    page_size?: number
  }): Promise<PaginatedResponse<User>> => {
    const response = await api.get<PaginatedResponse<User>>('/platform-admin/users', { params })
    return response.data
  },

  getSubscriptions: async (params?: {
    status?: string
    page?: number
    page_size?: number
  }): Promise<PaginatedResponse<Subscription>> => {
    const response = await api.get<PaginatedResponse<Subscription>>('/platform-admin/subscriptions', { params })
    return response.data
  },

  toggleBusinessActive: async (id: string): Promise<Business> => {
    const response = await api.patch<Business>(`/platform-admin/businesses/${id}/toggle`)
    return response.data
  },

  toggleUserActive: async (id: string): Promise<User> => {
    const response = await api.patch<User>(`/platform-admin/users/${id}/toggle`)
    return response.data
  },
}