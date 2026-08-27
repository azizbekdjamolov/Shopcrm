import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Building2, Users, TrendingUp, ShoppingBag, CreditCard, BarChart3, Shield } from 'lucide-react'
import { adminApi } from '@/api/admin'
import { PageHeader } from '@/components/common/PageHeader'
import { StatCard } from '@/components/common/StatCard'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { LoadingState } from '@/components/common/LoadingState'
import { ErrorState } from '@/components/common/ErrorState'
import { formatCurrency } from '@/lib/utils'

export function AdminDashboardPage() {
  const { t } = useTranslation()

  const { data: stats, isLoading, error, refetch } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: adminApi.getStats,
  })

  if (isLoading) return <LoadingState />
  if (error) return <ErrorState onRetry={refetch} />

  return (
    <div className="space-y-6">
      <PageHeader title={t('admin.platformDashboard', 'Platform Dashboard')} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title={t('admin.totalBusinesses', 'Total Businesses')} value={String(stats?.total_businesses || 0)} icon={<Building2 className="h-5 w-5" />} />
        <StatCard title={t('admin.totalUsers', 'Total Users')} value={String(stats?.total_users || 0)} icon={<Users className="h-5 w-5" />} />
        <StatCard title={t('admin.activeSubscriptions', 'Active Subscriptions')} value={String(stats?.active_subscriptions || 0)} icon={<CreditCard className="h-5 w-5" />} />
        <StatCard title={t('admin.totalRevenue', 'Total Revenue')} value={formatCurrency(stats?.total_revenue || 0)} icon={<BarChart3 className="h-5 w-5" />} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>{t('admin.revenueByMonth', 'Revenue by Month')}</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(stats?.revenue_by_month || []).map((item: any) => (
                <div key={item.month} className="flex items-center justify-between rounded-lg border border-gray-100 p-3 dark:border-gray-800">
                  <p className="font-medium text-gray-900 dark:text-white">{item.month}</p>
                  <span className="font-semibold text-primary-600">{formatCurrency(item.amount)}</span>
                </div>
              ))}
              {!(stats?.revenue_by_month?.length) && (
                <p className="py-4 text-center text-gray-500">{t('common.noData', 'No data')}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t('admin.businessesByPlan', 'Businesses by Plan')}</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(stats?.businesses_by_plan || []).map((item: any) => (
                <div key={item.plan} className="flex items-center justify-between rounded-lg border border-gray-100 p-3 dark:border-gray-800">
                  <p className="font-medium text-gray-900 dark:text-white capitalize">{item.plan}</p>
                  <span className="rounded-full bg-primary-100 px-3 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                    {item.count}
                  </span>
                </div>
              ))}
              {!(stats?.businesses_by_plan?.length) && (
                <p className="py-4 text-center text-gray-500">{t('common.noData', 'No data')}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
