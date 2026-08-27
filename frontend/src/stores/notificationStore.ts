import { create } from 'zustand'
import type { Notification } from '@/types'

interface NotificationState {
  unreadCount: number
  items: Notification[]
  setUnreadCount: (count: number) => void
  setItems: (items: Notification[]) => void
  markRead: (id: string) => void
  markAllRead: () => void
  incrementUnread: () => void
  decrementUnread: () => void
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 0,
  items: [],

  setUnreadCount: (count) => set({ unreadCount: count }),

  setItems: (items) => {
    const unreadCount = items.filter((n) => !n.is_read).length
    set({ items, unreadCount })
  },

  markRead: (id) =>
    set((state) => {
      const items = state.items.map((n) =>
        n.id === id ? { ...n, is_read: true } : n
      )
      const unreadCount = items.filter((n) => !n.is_read).length
      return { items, unreadCount }
    }),

  markAllRead: () =>
    set((state) => ({
      items: state.items.map((n) => ({ ...n, is_read: true })),
      unreadCount: 0,
    })),

  incrementUnread: () =>
    set((state) => ({ unreadCount: state.unreadCount + 1 })),

  decrementUnread: () =>
    set((state) => ({
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),
}))
