import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, CheckCheck } from 'lucide-react'
import { notificationsApi } from '@/api/notifications'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingState } from '@/components/common/LoadingState'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useNotificationStore } from '@/stores/notificationStore'
import toast from 'react-hot-toast'

export function NotificationsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { markAllRead: storeMarkAllRead, markRead: storeMarkRead } = useNotificationStore()

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getNotifications({ page: 1, page_size: 50 }),
  })

  const markReadMutation = useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      storeMarkRead(id)
    },
  })

  const markAllMutation = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      storeMarkAllRead()
      toast.success(t('notifications.markAllRead'))
    },
  })

  if (isLoading) return <LoadingState />

  const notifications = data?.items || []

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('notifications.title')}
        action={
          <Button variant="outline" onClick={() => markAllMutation.mutate()} disabled={markAllMutation.isPending}>
            <CheckCheck className="mr-2 h-4 w-4" />
            {t('notifications.markAllRead')}
          </Button>
        }
      />

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Bell className="h-12 w-12 text-gray-300" />
          <p className="mt-4 text-lg font-medium text-gray-900 dark:text-white">{t('notifications.noNotifications')}</p>
          <p className="text-sm text-gray-500">{t('notifications.noNotificationsDesc')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Card
              key={n.id}
              className={`p-4 cursor-pointer transition-colors ${!n.is_read ? 'border-l-4 border-l-primary-500 bg-primary-50/50 dark:bg-primary-900/5' : ''}`}
              onClick={() => !n.is_read && markReadMutation.mutate(n.id)}
            >
              <div className="flex items-start gap-3">
                <div className={`rounded-full p-2 ${n.type === 'error' ? 'bg-red-100 text-red-600' : n.type === 'warning' ? 'bg-yellow-100 text-yellow-600' : n.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                  <Bell className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">{n.title}</p>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{n.message}</p>
                  <p className="mt-1 text-xs text-gray-400">{new Date(n.created_at).toLocaleString()}</p>
                </div>
                {!n.is_read && <div className="h-2 w-2 rounded-full bg-primary-500" />}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
