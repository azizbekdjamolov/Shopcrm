import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  TrendingUp,
  ShoppingCart,
  Package,
  Users,
  Wallet,
  AlertTriangle,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { reportsApi } from '@/api/reports'
import { inventoryApi } from '@/api/inventory'
import { useWebSocket } from '@/hooks/useWebSocket'
import { StatCard } from '@/components/common/StatCard'
import { LineChart } from '@/components/common/Charts'
import { StatusBadge } from '@/components/common/StatusBadge'
import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'

type Period = 'today' | 'week' | 'month' | 'year'

export function DashboardPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [period, setPeriod] = useState<Period>('month')

  const handlers = useMemo(() => ({
    notification: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      queryClient.invalidateQueries({ queryKey: ['inventory', 'low-stock'] })
    },
    order_update: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] })
    },
    sale_update: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] })
    },
  }), [queryClient])

  useWebSocket(handlers)

  const { data: salesReport } = useQuery({
    queryKey: ['reports', 'sales', period],
    queryFn: () => reportsApi.getSalesReport({ start_date: getStartDate(period) }),
    retry: false,
    refetchOnWindowFocus: false,
  })

  const { data: profitReport } = useQuery({
    queryKey: ['reports', 'profit', period],
    queryFn: () => reportsApi.getProfitReport({ start_date: getStartDate(period) }),
    retry: false,
    refetchOnWindowFocus: false,
  })

  const { data: lowStock } = useQuery({
    queryKey: ['inventory', 'low-stock'],
    queryFn: () => inventoryApi.getLowStock(),
    retry: false,
    refetchOnWindowFocus: false,
  })

  const periods: { key: Period; label: string }[] = [
    { key: 'today', label: t('dashboard.today') },
    { key: 'week', label: t('dashboard.thisWeek') },
    { key: 'month', label: t('dashboard.thisMonth') },
    { key: 'year', label: t('dashboard.thisYear') },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('dashboard.title')}</h1>
        </div>
        <div className="flex gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
          {periods.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                period === p.key
                  ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t('dashboard.todaySales')}
          value={formatCurrency(salesReport?.total_sales || 0)}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <StatCard
          title={t('dashboard.todayOrders')}
          value={salesReport?.total_orders || 0}
          icon={<ShoppingCart className="h-5 w-5" />}
        />
        <StatCard
          title={t('dashboard.totalProducts')}
          value={salesReport?.top_products?.length || 0}
          icon={<Package className="h-5 w-5" />}
        />
        <StatCard
          title={t('dashboard.debtAmount')}
          value={formatCurrency(profitReport?.gross_profit || 0)}
          icon={<Wallet className="h-5 w-5" />}
          change={profitReport?.profit_margin || 0}
          changeLabel={t('dashboard.profit')}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.salesTrend')}</CardTitle>
          </CardHeader>
          <CardContent>
            {salesReport?.sales_by_date?.length ? (
              <LineChart
                data={salesReport.sales_by_date}
                xKey="date"
                yKey="amount"
                height={250}
              />
            ) : (
              <EmptyState title={t('common.noData')} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.topProducts')}</CardTitle>
          </CardHeader>
          <CardContent>
            {salesReport?.top_products?.length ? (
              <div className="space-y-3">
                {salesReport.top_products.slice(0, 5).map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-5">
                        {idx + 1}.
                      </span>
                      <span className="text-sm text-gray-900 dark:text-white">{item.product}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(item.amount)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {item.quantity} {t('products.unitPiece')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title={t('common.noData')} />
            )}
          </CardContent>
        </Card>
      </div>

      {lowStock && lowStock.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              {t('dashboard.lowStockProducts')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowStock.slice(0, 5).map((product) => (
                <div key={product.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3 dark:border-gray-800">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{product.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{product.barcode}</p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={product.stock_quantity <= 0 ? 'outOfStock' : 'lowStock'} />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {product.stock_quantity} / {product.min_stock}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              className="mt-4 w-full"
              onClick={() => navigate('/inventory')}
            >
              {t('common.view')} {t('inventory.title')}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function getStartDate(period: Period): string {
  const now = new Date()
  switch (period) {
    case 'today':
      return now.toISOString().split('T')[0]
    case 'week':
      const week = new Date(now.setDate(now.getDate() - 7))
      return week.toISOString().split('T')[0]
    case 'month':
      const month = new Date(now.setMonth(now.getMonth() - 1))
      return month.toISOString().split('T')[0]
    case 'year':
      const year = new Date(now.setFullYear(now.getFullYear() - 1))
      return year.toISOString().split('T')[0]
    default:
      return now.toISOString().split('T')[0]
  }
}
