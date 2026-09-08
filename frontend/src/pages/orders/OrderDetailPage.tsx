import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, XCircle } from 'lucide-react'
import { ordersApi, ORDER_STATUS_TRANSITIONS } from '@/api/orders'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { LoadingState } from '@/components/common/LoadingState'
import { ErrorState } from '@/components/common/ErrorState'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'

export function OrderDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: order, isLoading, error, refetch } = useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersApi.getOrder(id!),
    enabled: !!id,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['order', id] })
    queryClient.invalidateQueries({ queryKey: ['orders'] })
  }

  const statusMutation = useMutation({
    mutationFn: (status: string) => ordersApi.updateOrderStatus(id!, status),
    onSuccess: () => {
      toast.success(t('common.success'))
      invalidate()
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || t('common.error')),
  })

  const cancelMutation = useMutation({
    mutationFn: () => ordersApi.cancelOrder(id!),
    onSuccess: () => {
      toast.success(t('common.success'))
      invalidate()
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || t('common.error')),
  })

  if (isLoading) return <LoadingState />
  if (error) return <ErrorState onRetry={refetch} />
  if (!order) return null

  const nextStatuses = (ORDER_STATUS_TRANSITIONS[order.status as string] || []).filter((s) => s !== 'CANCELLED')

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${t('orders.orderDetail')} #${order.order_number}`}
        action={
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('common.back')}
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>{t('orders.orderStatus')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <StatusBadge status={order.status} />
            {nextStatuses.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {nextStatuses.map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    onClick={() => statusMutation.mutate(s)}
                    disabled={statusMutation.isPending}
                  >
                    {t(`statuses.${s}`)}
                  </Button>
                ))}
              </div>
            )}
            {order.is_cancellable && (
              <Button
                variant="outline"
                size="sm"
                className="text-red-600"
                onClick={() => {
                  if (confirm(t('common.areYouSure'))) cancelMutation.mutate()
                }}
                disabled={cancelMutation.isPending}
              >
                <XCircle className="mr-1 h-4 w-4" />
                {t('orders.cancelOrder')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('orders.customerInfo')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500">{t('customers.customerName')}</span>
              <span className="font-medium text-gray-900 dark:text-white">{order.customer?.full_name || t('pos.walkInCustomer')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{t('orders.orderStatus')}</span>
              <StatusBadge status={order.status} />
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{t('common.date')}</span>
              <span className="text-gray-900 dark:text-white">{new Date(order.created_at).toLocaleString()}</span>
            </div>
            {order.delivery_address && (
              <div>
                <span className="text-gray-500">{t('orders.deliveryAddress')}</span>
                <p className="mt-1 text-gray-900 dark:text-white">{order.delivery_address}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('orders.items')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {order.items.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3 dark:border-gray-800">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{item.product?.name || 'Product'}</p>
                    <p className="text-xs text-gray-500">{item.quantity} x {formatCurrency(item.unit_price)}</p>
                  </div>
                  <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(item.total)}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 border-t border-gray-200 pt-3 dark:border-gray-700 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t('pos.subtotal')}</span>
                <span className="text-gray-900 dark:text-white">{formatCurrency(order.subtotal)}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t('pos.discount')}</span>
                  <span className="text-red-500">-{formatCurrency(order.discount_amount)}</span>
                </div>
              )}
              {order.delivery_fee > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t('shop.deliveryFee')}</span>
                  <span className="text-gray-900 dark:text-white">{formatCurrency(order.delivery_fee)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold border-t border-gray-200 pt-2 dark:border-gray-700">
                <span>{t('pos.total')}</span>
                <span className="text-primary-600">{formatCurrency(order.total_amount)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
