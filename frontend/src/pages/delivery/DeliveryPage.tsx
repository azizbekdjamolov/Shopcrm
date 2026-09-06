import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Truck, Eye } from 'lucide-react'
import { deliveryApi } from '@/api/delivery'
import { DataTable, type Column } from '@/components/common/DataTable'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { DeliveryStatus } from '@/types'

export function DeliveryPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['deliveries', page, statusFilter],
    queryFn: () => deliveryApi.getDeliveries({
      page, page_size: 20,
      status: (statusFilter || undefined) as any,
    }),
  })

  const columns: Column<any>[] = [
    { key: 'order', label: t('orders.orderNumber'), render: (item) => <span className="font-medium text-primary-600">#{item.order?.order_number || '-'}</span> },
    { key: 'courier', label: t('orders.courier'), render: (item) => <span className="text-gray-600 dark:text-gray-300">{item.courier?.full_name || '-'}</span> },
    { key: 'pickup_address', label: t('delivery.pickupAddress'), render: (item) => <span className="text-sm text-gray-600 dark:text-gray-300 truncate max-w-[200px] block">{item.pickup_address}</span> },
    { key: 'delivery_address', label: t('delivery.deliveryAddress'), render: (item) => <span className="text-sm text-gray-600 dark:text-gray-300 truncate max-w-[200px] block">{item.delivery_address}</span> },
    { key: 'status', label: t('common.status'), render: (item) => <StatusBadge status={item.status} /> },
    { key: 'created_at', label: t('common.date'), render: (item) => <span className="text-gray-500">{new Date(item.created_at).toLocaleDateString()}</span> },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title={t('delivery.title')} />
      <div className="flex gap-2 flex-wrap">
        {['', ...Object.values(DeliveryStatus)].map((s) => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${statusFilter === s ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'}`}>
            {s ? t(`statuses.${s}`) : t('common.all')}
          </button>
        ))}
      </div>
      <DataTable
        columns={columns}
        data={data?.items || []}
        isLoading={isLoading}
        page={page}
        totalPages={data?.total_pages || 1}
        totalItems={data?.total || 0}
        onPageChange={setPage}
        actions={(item) => (
          <Button variant="ghost" size="icon" onClick={() => item.order?.id && navigate(`/orders/${item.order.id}`)}><Eye className="h-4 w-4" /></Button>
        )}
      />
    </div>
  )
}
