import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Package, Star, ChevronRight } from 'lucide-react'
import api from '@/api/client'
import { ordersApi } from '@/api/orders'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingState } from '@/components/common/LoadingState'
import { formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'

const STATUS_STEPS = [
  { key: 'NEW', labelKey: 'shop.statusNew' },
  { key: 'CONFIRMED', labelKey: 'shop.statusConfirmed' },
  { key: 'PREPARING', labelKey: 'shop.statusPreparing' },
  { key: 'READY_FOR_DELIVERY', labelKey: 'shop.statusReady' },
  { key: 'COURIER_ASSIGNED', labelKey: 'shop.statusAssigned' },
  { key: 'ON_THE_WAY', labelKey: 'shop.statusOnTheWay' },
  { key: 'DELIVERED', labelKey: 'shop.statusDelivered' },
]

const BACKEND_TO_FRONTEND: Record<string, string> = {
  'new': 'NEW', 'confirmed': 'CONFIRMED', 'preparing': 'PREPARING',
  'ready_for_delivery': 'READY_FOR_DELIVERY', 'courier_assigned': 'COURIER_ASSIGNED',
  'on_the_way': 'ON_THE_WAY', 'arrived': 'ON_THE_WAY', 'delivered': 'DELIVERED',
}

async function fetchMyOrders() {
  const data = await ordersApi.getMyOrders({ page: 1, page_size: 50 })
  return data
}

async function rateDelivery(data: { delivery_id: string; rating: number; comment: string }) {
  const response = await api.post(`/deliveries/${data.delivery_id}/rate/`, {
    rating: data.rating,
    comment: data.comment,
  })
  return response.data
}

export function MyOrdersPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [ratingModal, setRatingModal] = useState<{ deliveryId: string; orderId: string } | null>(null)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')

  const { data: orders, isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: fetchMyOrders,
  })

  const rateMutation = useMutation({
    mutationFn: rateDelivery,
    onSuccess: () => {
      toast.success(t('delivery.ratingSuccess', 'Rating submitted!'))
      setRatingModal(null)
      setRating(5)
      setComment('')
      queryClient.invalidateQueries({ queryKey: ['my-orders'] })
    },
  })

  if (isLoading) return <LoadingState />

  const orderList = orders?.items || []

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="bg-white shadow-sm dark:bg-gray-900">
        <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('marketplace.myOrders', 'My Orders')}</h1>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        {orderList.length === 0 ? (
          <div className="py-16 text-center">
            <Package className="mx-auto mb-4 h-16 w-16 text-gray-300" />
            <p className="text-lg font-medium text-gray-500">{t('marketplace.noOrders', 'No orders yet')}</p>
            <Button className="mt-4" onClick={() => navigate('/stores')}>{t('marketplace.browseStores', 'Browse Stores')}</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orderList.map((order: any) => {
              const frontendStatus = BACKEND_TO_FRONTEND[order.status] || 'NEW'
              const stepIndex = STATUS_STEPS.findIndex((s) => s.key === frontendStatus)
              const isDelivered = order.status === 'delivered'
              return (
                <Card key={order.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">#{order.order_number}</p>
                        <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleString()}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                        isDelivered ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                        order.status === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                      }`}>
                        {order.status}
                      </span>
                    </div>

                    {order.status !== 'cancelled' && (
                      <div className="mb-3 flex items-center gap-1">
                        {STATUS_STEPS.map((step, i) => (
                          <div key={step.key} className="flex items-center">
                            <div className={`h-2 flex-1 rounded-full ${i <= stepIndex ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}`} style={{ minWidth: 32 }} />
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-primary-600">{formatCurrency(order.total)}</span>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => navigate(`/shop/track/${order.order_number}`)}>
                          {t('marketplace.track', 'Track')} <ChevronRight className="ml-1 h-3 w-3" />
                        </Button>
                        {isDelivered && (
                          <Button size="sm" onClick={() => setRatingModal({ deliveryId: order.delivery?.id, orderId: order.id })}>
                            <Star className="mr-1 h-3 w-3" /> {t('delivery.rate', 'Rate')}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {ratingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900">
            <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">{t('delivery.rateDelivery', 'Rate Delivery')}</h3>
            <div className="mb-4 flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => setRating(star)}>
                  <Star className={`h-8 w-8 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                </button>
              ))}
            </div>
            <textarea
              placeholder={t('delivery.leaveComment', 'Leave a comment (optional)')}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="mb-4 w-full rounded-lg border border-gray-300 p-3 text-sm dark:border-gray-600 dark:bg-gray-800"
              rows={3}
            />
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setRatingModal(null)}>{t('common.cancel')}</Button>
              <Button className="flex-1" onClick={() => rateMutation.mutate({ delivery_id: ratingModal.deliveryId, rating, comment })} disabled={rateMutation.isPending}>
                {t('common.submit')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
