import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, Eye } from 'lucide-react'
import { ordersApi } from '@/api/orders'
import { DataTable, type Column } from '@/components/common/DataTable'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { OrderStatus } from '@/types'

export function OrdersPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['orders', page, search, statusFilter],
    queryFn: () => ordersApi.getOrders({
      page, page_size: 20, search: search || undefined,
      status: (statusFilter || undefined) as any,
    }),
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => ordersApi.cancelOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })

  const columns: Column<any>[] = [
    { key: 'order_number', label: t('orders.orderNumber'), render: (item) => <span className="font-medium text-primary-600">#{item.order_number}</span> },
    { key: 'customer', label: t('orders.customerInfo'), render: (item) => <span className="text-gray-600 dark:text-gray-300">{item.customer?.full_name || t('pos.walkInCustomer')}</span> },
    { key: 'total_amount', label: t('orders.orderTotal'), sortable: true, render: (item) => <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(item.total_amount)}</span> },
    { key: 'status', label: t('orders.orderStatus'), render: (item) => <StatusBadge status={item.status} /> },
    { key: 'created_at', label: t('common.date'), sortable: true, render: (item) => <span className="text-gray-500">{new Date(item.created_at).toLocaleDateString()}</span> },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('orders.title')}
        action={
          <Button onClick={() => navigate('/orders/new')}>
            <Plus className="mr-2 h-4 w-4" />
            {t('orders.addOrder')}
          </Button>
        }
      />
      <div className="flex gap-2 flex-wrap">
        {['', ...Object.values(OrderStatus)].map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${statusFilter === s ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'}`}
          >
            {s ? t(`statuses.${s}`) : t('common.all')}
          </button>
        ))}
      </div>
      <DataTable
        columns={columns}
        data={data?.items || []}
        isLoading={isLoading}
        searchPlaceholder={t('orders.searchOrders')}
        onSearch={setSearch}
        page={page}
        totalPages={data?.total_pages || 1}
        totalItems={data?.total || 0}
        onPageChange={setPage}
        onRowClick={(item) => navigate(`/orders/${item.id}`)}
        actions={(item) => (
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); navigate(`/orders/${item.id}`) }}>
            <Eye className="h-4 w-4" />
          </Button>
        )}
      />
    </div>
  )
}
