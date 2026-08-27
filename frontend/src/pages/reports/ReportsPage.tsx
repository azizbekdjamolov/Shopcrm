import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { BarChart3, TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package, AlertTriangle } from 'lucide-react'
import { reportsApi, type ReportParams } from '@/api/reports'
import { PageHeader } from '@/components/common/PageHeader'
import { LineChart, BarChart, PieChart } from '@/components/common/Charts'
import { StatCard } from '@/components/common/StatCard'
import { LoadingState } from '@/components/common/LoadingState'
import { ErrorState } from '@/components/common/ErrorState'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'

const PAYMENT_METHOD_COLORS: Record<string, string> = {
  cash: '#22c55e',
  card: '#3b82f6',
  click: '#06b6d4',
  payme: '#a855f7',
  debt: '#f59e0b',
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Cash',
  card: 'Card',
  click: 'Click',
  payme: 'Payme',
  debt: 'Debt',
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
      <BarChart3 className="h-10 w-10 mb-3 opacity-50" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  )
}

export function ReportsPage() {
  const { t } = useTranslation()
  const [params, setParams] = useState<ReportParams>({
    start_date: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
  })

  const { data: sales, isLoading: salesLoading, error: salesError } = useQuery({
    queryKey: ['reports', 'sales', params],
    queryFn: () => reportsApi.getSalesReport(params),
  })

  const { data: profit, isLoading: profitLoading, error: profitError } = useQuery({
    queryKey: ['reports', 'profit', params],
    queryFn: () => reportsApi.getProfitReport(params),
  })

  const { data: expenses, isLoading: expensesLoading } = useQuery({
    queryKey: ['reports', 'expenses', params],
    queryFn: () => reportsApi.getExpenseReport(params),
  })

  const { data: inventory } = useQuery({
    queryKey: ['reports', 'inventory', params],
    queryFn: () => reportsApi.getInventoryReport(params),
  })

  if (salesLoading || profitLoading) return <LoadingState />
  if (salesError || profitError) return <ErrorState />

  const hasData = (sales?.total_sales || 0) > 0
  const paymentData = (sales?.payment_by_method || [])
    .filter((p) => p.total > 0)
    .map((p) => ({
      name: PAYMENT_METHOD_LABELS[p.method] || p.method,
      value: p.total,
      color: PAYMENT_METHOD_COLORS[p.method] || '#6b7280',
    }))

  return (
    <div className="space-y-6">
      <PageHeader title={t('reports.title')} />

      <div className="flex flex-wrap items-end gap-4">
        <Input
          label={t('reports.startDate')}
          type="date"
          value={params.start_date}
          onChange={(e) => setParams({ ...params, start_date: e.target.value })}
          className="w-44"
        />
        <Input
          label={t('reports.endDate')}
          type="date"
          value={params.end_date}
          onChange={(e) => setParams({ ...params, end_date: e.target.value })}
          className="w-44"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t('reports.totalRevenue')}
          value={formatCurrency(sales?.total_sales || 0)}
          icon={<DollarSign className="h-5 w-5" />}
        />
        <StatCard
          title={t('reports.totalOrders')}
          value={String(sales?.total_orders || 0)}
          icon={<ShoppingCart className="h-5 w-5" />}
          change={sales?.average_order_value ? Math.round(sales.average_order_value) : undefined}
          changeLabel={t('reports.avgOrderValue')}
        />
        <StatCard
          title={t('reports.grossProfit')}
          value={formatCurrency(profit?.gross_profit || 0)}
          icon={<TrendingUp className="h-5 w-5" />}
          change={profit?.profit_margin}
          changeLabel={t('reports.profitMargin')}
        />
        <StatCard
          title={t('reports.totalCost')}
          value={formatCurrency(profit?.total_cost || 0)}
          icon={<TrendingDown className="h-5 w-5" />}
        />
      </div>

      {!hasData ? (
        <Card>
          <CardContent>
            <EmptyState message={t('common.noData')} />
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">{t('reports.overview', 'Overview')}</TabsTrigger>
            <TabsTrigger value="payments">{t('reports.payments', 'Payments')}</TabsTrigger>
            <TabsTrigger value="products">{t('reports.products', 'Products')}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader><CardTitle>{t('reports.salesTrend')}</CardTitle></CardHeader>
                <CardContent>
                  {sales?.sales_by_date?.length ? (
                    <LineChart data={sales.sales_by_date} xKey="date" yKey="amount" height={280} />
                  ) : (
                    <EmptyState message={t('common.noData')} />
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>{t('reports.profitTrend')}</CardTitle></CardHeader>
                <CardContent>
                  {profit?.profit_by_date?.length ? (
                    <LineChart data={profit.profit_by_date} xKey="date" yKey="profit" color="#22c55e" height={280} />
                  ) : (
                    <EmptyState message={t('common.noData')} />
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>{t('reports.salesByCategory')}</CardTitle></CardHeader>
                <CardContent>
                  {sales?.sales_by_category?.length ? (
                    <BarChart data={sales.sales_by_category} xKey="category" yKey="amount" height={280} />
                  ) : (
                    <EmptyState message={t('common.noData')} />
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>{t('reports.expensesByCategory')}</CardTitle></CardHeader>
                <CardContent>
                  {expenses?.expenses_by_category?.length ? (
                    <PieChart data={expenses.expenses_by_category} nameKey="category" valueKey="amount" height={280} />
                  ) : (
                    <EmptyState message={t('common.noData')} />
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="payments">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader><CardTitle>{t('reports.salesByPaymentMethod', 'Sales by Payment Method')}</CardTitle></CardHeader>
                <CardContent>
                  {paymentData.length ? (
                    <PieChart data={paymentData} nameKey="name" valueKey="value" height={280} />
                  ) : (
                    <EmptyState message={t('common.noData')} />
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>{t('reports.paymentDetails', 'Payment Details')}</CardTitle></CardHeader>
                <CardContent>
                  {paymentData.length ? (
                    <div className="space-y-3">
                      {paymentData.map((p) => {
                        const pct = sales?.total_sales ? (p.value / sales.total_sales) * 100 : 0
                        return (
                          <div key={p.name}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{p.name}</span>
                              <span className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(p.value)}</span>
                            </div>
                            <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800">
                              <div className="h-2 rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: p.color }} />
                            </div>
                            <p className="text-[10px] text-gray-400 mt-0.5">{pct.toFixed(1)}%</p>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <EmptyState message={t('common.noData')} />
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="products">
            <Card>
              <CardHeader><CardTitle>{t('reports.topProducts', 'Top Products')}</CardTitle></CardHeader>
              <CardContent>
                {sales?.top_products?.length ? (
                  <div className="space-y-3">
                    {sales.top_products.map((p, i) => {
                      const pct = sales.total_sales ? (p.amount / sales.total_sales) * 100 : 0
                      return (
                        <div key={p.product} className="flex items-center gap-4">
                          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                            {i + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between mb-1">
                              <span className="truncate text-sm font-medium text-gray-900 dark:text-white">{p.product}</span>
                              <span className="ml-2 text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(p.amount)}</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800">
                              <div className="h-1.5 rounded-full bg-primary-500" style={{ width: `${Math.min(pct, 100)}%` }} />
                            </div>
                            <p className="text-[10px] text-gray-400">{p.quantity} {t('products.unitPiece')}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <EmptyState message={t('common.noData')} />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
