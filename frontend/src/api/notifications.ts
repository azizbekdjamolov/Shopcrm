import api from './client'
import type { Notification, PaginatedResponse } from '@/types'

export const notificationsApi = {
  getNotifications: async (params?: {
    is_read?: boolean
    page?: number
    page_size?: number
  }): Promise<PaginatedResponse<Notification>> => {
    const response = await api.get<PaginatedResponse<Notification>>('/notifications', { params })
    return response.data
  },

  markRead: async (id: string): Promise<Notification> => {
    const response = await api.patch<Notification>(`/notifications/${id}/read`)
    return response.data
  },

  markAllRead: async (): Promise<void> => {
    await api.post('/notifications/read-all')
  },

  getUnreadCount: async (): Promise<{ count: number }> => {
    const response = await api.get<{ count: number }>('/notifications/unread-count')
    return response.data
  },
}
