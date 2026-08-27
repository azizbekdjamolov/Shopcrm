import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, CheckCircle, Clock, Truck, Package, XCircle, Store } from 'lucide-react'
import { ordersApi } from '@/api/orders'
import { formatCurrency } from '@/lib/utils'

const STATUS_STEPS = [
  { key: 'NEW', icon: Store, labelKey: 'shop.statusNew' },
  { key: 'CONFIRMED', icon: CheckCircle, labelKey: 'shop.statusConfirmed' },
  { key: 'PREPARING', icon: Clock, labelKey: 'shop.statusPreparing' },
  { key: 'READY_FOR_DELIVERY', icon: Package, labelKey: 'shop.statusReady' },
  { key: 'COURIER_ASSIGNED', icon: Truck, labelKey: 'shop.statusAssigned' },
  { key: 'ON_THE_WAY', icon: Truck, labelKey: 'shop.statusOnTheWay' },
  { key: 'ARRIVED', icon: CheckCircle, labelKey: 'shop.statusArrived' },
  { key: 'DELIVERED', icon: CheckCircle, labelKey: 'shop.statusDelivered' },
]

const BACKEND_STATUS_MAP: Record<string, string> = {
  'NEW': 'new',
  'CONFIRMED': 'confirmed',
  'PREPARING': 'preparing',
  'READY_FOR_DELIVERY': 'ready_for_delivery',
  'COURIER_ASSIGNED': 'courier_assigned',
  'ON_THE_WAY': 'on_the_way',
  'ARRIVED': 'arrived',
  'DELIVERED': 'delivered',
  'CANCELLED': 'cancelled',
}

const REVERSE_STATUS_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(BACKEND_STATUS_MAP).map(([k, v]) => [v, k])
)

export function OrderTrackingPage() {
  const { t } = useTranslation()
  const { orderNumber } = useParams<{ orderNumber: string }>()
  const [searchInput, setSearchInput] = useState(orderNumber || '')
  const [searchQuery, setSearchQuery] = useState(orderNumber || '')

  const { data: orders, isLoading } = useQuery({
    queryKey: ['shop-orders', searchQuery],
    queryFn: () => ordersApi.getOrders({ search: searchQuery, page: 1, page_size: 10 }),
    enabled: !!searchQuery,
  })

  const order = orders?.items?.[0]
  const backendStatus = order?.status || ''
  const frontendStatus = REVERSE_STATUS_MAP[backendStatus] || backendStatus.toUpperCase()
  const currentStepIndex = STATUS_STEPS.findIndex((s) => s.key === frontendStatus)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchQuery(searchInput)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <main className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('shop.orderTracking')}</h1>
        <p className="mt-2 text-gray-500">{t('shop.trackOrder')}</p>

        <form onSubmit={handleSearch} className="mt-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t('shop.enterOrderNumber')}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="h-12 w-full rounded-xl border border-gray-300 bg-white pl-10 pr-24 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-primary-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-700">
              {t('common.search')}
            </button>
          </div>
        </form>

        {isLoading && (
          <div className="mt-8 text-center text-gray-500">{t('common.loading')}</div>
        )}

        {order && (
          <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">{t('shop.orderNumber')}: <span className="font-medium text-gray-900 dark:text-white">#{order.order_number}</span></p>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                backendStatus === 'delivered' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                backendStatus === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
              }`}>
                {backendStatus}
              </span>
            </div>

            {backendStatus !== 'cancelled' ? (
              <div className="mt-6 space-y-3">
                {STATUS_STEPS.map((step, i) => {
                  const isDone = i <= currentStepIndex
                  const isCurrent = i === currentStepIndex
                  return (
                    <div key={step.key} className="flex items-center gap-3">
                      <div className={`rounded-full p-2 ${
                        isDone
                          ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-400 dark:bg-gray-800'
                      } ${isCurrent ? 'ring-2 ring-green-400' : ''}`}>
                        <step.icon className="h-4 w-4" />
                      </div>
                      <span className={`text-sm ${isDone ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-400'}`}>
                        {t(step.labelKey)}
                      </span>
                      {isCurrent && <span className="ml-auto text-xs text-green-600 font-medium">{t('shop.current')}</span>}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="mt-6 flex items-center gap-3 text-red-500">
                <XCircle className="h-5 w-5" />
                <span className="text-sm font-medium">{t('shop.orderCancelled')}</span>
              </div>
            )}

            <div className="mt-6 border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t('shop.total')}</span>
                <span className="font-bold text-primary-600">{formatCurrency(order.total_amount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t('shop.paymentMethod')}</span>
                <span className="text-gray-900 dark:text-white capitalize">{order.payment_method}</span>
              </div>
              {order.delivery_address && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t('shop.address')}</span>
                  <span className="text-gray-900 dark:text-white">{order.delivery_address}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {!isLoading && searchQuery && !order && (
          <div className="mt-8 text-center text-gray-500">
            <Package className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4">{t('shop.orderNotFound')}</p>
          </div>
        )}
      </main>
    </div>
  )
}
