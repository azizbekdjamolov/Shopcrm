import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { DollarSign, Calendar, Download, Eye, ShoppingCart, CreditCard, Banknote, Smartphone, AlertTriangle } from 'lucide-react'
import { salesApi, type SaleFilters } from '@/api/sales'
import { DataTable, type Column } from '@/components/common/DataTable'
import { PageHeader } from '@/components/common/PageHeader'
import { StatCard } from '@/components/common/StatCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogHeader, DialogTitle, DialogContent } from '@/components/ui/dialog'
import { formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'

const PAYMENT_BADGES: Record<string, { bg: string; text: string; icon: typeof Banknote }> = {
  cash: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', icon: Banknote },
  card: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', icon: CreditCard },
  click: { bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-700 dark:text-cyan-300', icon: Smartphone },
  payme: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', icon: Smartphone },
  debt: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', icon: AlertTriangle },
}

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Naqd',
  card: 'Karta',
  click: 'Click',
  payme: 'Payme',
  debt: 'Qarz',
}

export function SalesPage() {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [selectedSale, setSelectedSale] = useState<any>(null)
  const [params, setParams] = useState<SaleFilters>({
    start_date: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
  })

  const { data, isLoading } = useQuery({
    queryKey: ['sales', page, search, params],
    queryFn: () => salesApi.getSales({
      page,
      page_size: 20,
      search: search || undefined,
      start_date: params.start_date,
      end_date: params.end_date,
    }),
  })

  const totalSales = data?.items?.reduce((sum: number, sale: any) => sum + Number(sale.total || 0), 0) || 0
  const totalItems = data?.items?.length || 0
  const avgSale = totalItems > 0 ? totalSales / totalItems : 0

  const columns: Column<any>[] = [
    {
      key: 'sale_number',
      label: t('sales.receiptNumber', 'Receipt #'),
      render: (item) => (
        <span className="font-medium text-primary-600">#{item.sale_number}</span>
      ),
    },
    {
      key: 'seller',
      label: t('sales.seller', 'Seller'),
      render: (item) => (
        <span className="text-gray-600 dark:text-gray-300">{item.seller_name || '-'}</span>
      ),
    },
    {
      key: 'customer',
      label: t('sales.customer', 'Customer'),
      render: (item) => (
        <span className="text-gray-600 dark:text-gray-300">{item.customer_name || t('pos.walkInCustomer', 'Walk-in')}</span>
      ),
    },
    {
      key: 'total',
      label: t('common.total', 'Total'),
      sortable: true,
      render: (item) => (
        <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(item.total)}</span>
      ),
    },
    {
      key: 'payment_method',
      label: t('sales.paymentMethod', 'Payment'),
      render: (item) => {
        const badge = PAYMENT_BADGES[item.payment_method] || PAYMENT_BADGES.cash
        const Icon = badge.icon
        return (
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${badge.bg} ${badge.text}`}>
            <Icon className="h-3 w-3" />
            {PAYMENT_LABELS[item.payment_method] || item.payment_method}
          </span>
        )
      },
    },
    {
      key: 'status',
      label: t('common.status', 'Status'),
      render: (item) => {
        const colors: Record<string, string> = {
          completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
          cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
          refunded: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
        }
        return (
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${colors[item.status] || colors.completed}`}>
            {item.status}
          </span>
        )
      },
    },
    {
      key: 'created_at',
      label: t('common.date', 'Date'),
      sortable: true,
      render: (item) => (
        <span className="text-gray-500 text-sm">{new Date(item.created_at).toLocaleDateString()}</span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('sales.title', 'Sales')}
        action={
          <Button variant="outline" onClick={() => toast.success(t('common.export', 'Export coming soon'))}>
            <Download className="mr-2 h-4 w-4" />
            {t('common.export', 'Export')}
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title={t('sales.totalSales', 'Total Sales')}
          value={formatCurrency(totalSales)}
          icon={<DollarSign className="h-5 w-5" />}
        />
        <StatCard
          title={t('sales.totalReceipts', 'Total Receipts')}
          value={String(data?.total || 0)}
          icon={<ShoppingCart className="h-5 w-5" />}
        />
        <StatCard
          title={t('sales.avgSale', 'Average Sale')}
          value={formatCurrency(avgSale)}
          icon={<DollarSign className="h-5 w-5" />}
        />
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <Input
          label={t('reports.startDate', 'Start Date')}
          type="date"
          value={params.start_date || ''}
          onChange={(e) => setParams({ ...params, start_date: e.target.value })}
          className="w-44"
        />
        <Input
          label={t('reports.endDate', 'End Date')}
          type="date"
          value={params.end_date || ''}
          onChange={(e) => setParams({ ...params, end_date: e.target.value })}
          className="w-44"
        />
      </div>

      <DataTable
        columns={columns}
        data={data?.items || []}
        isLoading={isLoading}
        searchPlaceholder={t('sales.searchSales', 'Search sales...')}
        onSearch={setSearch}
        page={page}
        totalPages={data?.total_pages || 1}
        totalItems={data?.total || 0}
        onPageChange={setPage}
        actions={(item) => (
          <Button variant="ghost" size="icon" onClick={() => setSelectedSale(item)}>
            <Eye className="h-4 w-4" />
          </Button>
        )}
      />

      {selectedSale && (
        <Dialog open onClose={() => setSelectedSale(null)}>
          <DialogHeader onClose={() => setSelectedSale(null)}>
            <DialogTitle>{t('sales.saleDetails', 'Sale Details')} — #{selectedSale.sale_number}</DialogTitle>
          </DialogHeader>
          <DialogContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">{t('sales.seller', 'Seller')}</p>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedSale.seller_name || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500">{t('sales.customer', 'Customer')}</p>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedSale.customer_name || t('pos.walkInCustomer', 'Walk-in')}</p>
                </div>
                <div>
                  <p className="text-gray-500">{t('sales.paymentMethod', 'Payment')}</p>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${(PAYMENT_BADGES[selectedSale.payment_method] || PAYMENT_BADGES.cash).bg} ${(PAYMENT_BADGES[selectedSale.payment_method] || PAYMENT_BADGES.cash).text}`}>
                    {PAYMENT_LABELS[selectedSale.payment_method] || selectedSale.payment_method}
                  </span>
                </div>
                <div>
                  <p className="text-gray-500">{t('common.date', 'Date')}</p>
                  <p className="font-medium text-gray-900 dark:text-white">{new Date(selectedSale.created_at).toLocaleString()}</p>
                </div>
              </div>

              {selectedSale.items?.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-medium text-gray-900 dark:text-white">{t('pos.orderSummary', 'Items')}</p>
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800">
                    {selectedSale.items.map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between px-3 py-2 text-sm">
                        <div>
                          <span className="text-gray-900 dark:text-white">{item.product_name}</span>
                          <span className="ml-2 text-gray-500">×{item.quantity}</span>
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(item.total)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('pos.subtotal', 'Subtotal')}</span>
                  <span className="text-gray-900 dark:text-white">{formatCurrency(selectedSale.subtotal)}</span>
                </div>
                {Number(selectedSale.discount) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t('pos.discount', 'Discount')}</span>
                    <span className="text-red-500">-{formatCurrency(selectedSale.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-gray-200 pt-1 font-bold dark:border-gray-700">
                  <span>{t('common.total', 'Total')}</span>
                  <span className="text-primary-600">{formatCurrency(selectedSale.total)}</span>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
