import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { User, Star, Truck, CheckCircle, Clock } from 'lucide-react'
import api from '@/api/client'
import { useAuthStore } from '@/stores/authStore'
import { Card, CardContent } from '@/components/ui/card'
import { LoadingState } from '@/components/common/LoadingState'
import { StatCard } from '@/components/common/StatCard'

async function fetchCourierStats() {
  const response = await api.get('/deliveries/courier-dashboard/')
  return response.data
}

export function CourierProfilePage() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)

  const { data: stats, isLoading } = useQuery({
    queryKey: ['courier', 'stats'],
    queryFn: fetchCourierStats,
  })

  if (isLoading) return <LoadingState />

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="bg-white shadow-sm dark:bg-gray-900">
        <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('profile.title', 'Profile')}</h1>
        </div>
      </div>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30">
                <User className="h-8 w-8 text-primary-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">{user?.full_name}</h2>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard title={t('delivery.rating', 'Rating')} value={`${stats?.average_rating || 0} ★`} icon={<Star className="h-5 w-5" />} />
          <StatCard title={t('delivery.totalDeliveries', 'Deliveries')} value={String(stats?.total_deliveries || 0)} icon={<Truck className="h-5 w-5" />} />
          <StatCard title={t('delivery.completed', 'Completed')} value={String(stats?.completed_deliveries || 0)} icon={<CheckCircle className="h-5 w-5" />} />
          <StatCard title={t('delivery.pending', 'Pending')} value={String(stats?.pending_deliveries || 0)} icon={<Clock className="h-5 w-5" />} />
        </div>
      </div>
    </div>
  )
}
