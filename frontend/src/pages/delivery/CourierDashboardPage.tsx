import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Truck, CheckCircle, Clock, Phone, MapPin, Package, History, Star } from 'lucide-react'
import { deliveryApi } from '@/api/delivery'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { LoadingState } from '@/components/common/LoadingState'
import { formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'

const STATUS_COLORS: Record<string, string> = {
  assigned: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  accepted: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  picked_up: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  on_the_way: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  arrived: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
  delivered: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
}

export function CourierDashboardPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const { data: deliveries, isLoading } = useQuery({
    queryKey: ['deliveries', 'my'],
    queryFn: () => deliveryApi.getMyDeliveries({ page: 1, page_size: 50 }),
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: any }) => deliveryApi.updateDeliveryStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] })
      toast.success(t('delivery.statusUpdated', 'Status updated'))
    },
  })

  const allDeliveries = deliveries?.items || []
  const activeDeliveries = allDeliveries.filter((d: any) => !['delivered', 'failed', 'returned'].includes(d.status))
  const completedDeliveries = allDeliveries.filter((d: any) => d.status === 'delivered')

  const getNextAction = (status: string) => {
    switch (status) {
      case 'assigned': return { label: t('delivery.accept', 'Accept'), next: 'accepted' }
      case 'accepted': return { label: t('delivery.pickup', 'Pick Up'), next: 'picked_up' }
      case 'picked_up': return { label: t('delivery.startDelivery', 'Start Delivery'), next: 'on_the_way' }
      case 'on_the_way': return { label: t('delivery.arrived', 'Arrived'), next: 'arrived' }
      case 'arrived': return { label: t('delivery.delivered', 'Delivered'), next: 'delivered' }
      default: return null
    }
  }

  if (isLoading) return <LoadingState />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('delivery.courierDashboard', 'Courier Dashboard')}</h1>
        <div className="flex gap-3 text-center">
          <div className="rounded-lg bg-primary-50 px-4 py-2 dark:bg-primary-900/20">
            <p className="text-lg font-bold text-primary-600">{activeDeliveries.length}</p>
            <p className="text-[10px] text-gray-500">{t('delivery.active', 'Active')}</p>
          </div>
          <div className="rounded-lg bg-green-50 px-4 py-2 dark:bg-green-900/20">
            <p className="text-lg font-bold text-green-600">{completedDeliveries.length}</p>
            <p className="text-[10px] text-gray-500">{t('delivery.completed', 'Completed')}</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">{t('delivery.active', 'Active')} ({activeDeliveries.length})</TabsTrigger>
          <TabsTrigger value="history">{t('delivery.history', 'History')} ({completedDeliveries.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          {activeDeliveries.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                <p className="text-gray-500">{t('delivery.noActiveDeliveries', 'No active deliveries')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {activeDeliveries.map((delivery: any) => {
                const action = getNextAction(delivery.status)
                return (
                  <Card key={delivery.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">#{delivery.order?.order_number || delivery.id?.slice(0, 8)}</p>
                          <span className={`inline-block mt-1 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[delivery.status] || ''}`}>
                            {delivery.status?.replace('_', ' ')}
                          </span>
                        </div>
                        {action && (
                          <Button size="sm" onClick={() => updateStatusMutation.mutate({ id: delivery.id, status: action.next })} disabled={updateStatusMutation.isPending}>
                            {action.label}
                          </Button>
                        )}
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                          <span>{delivery.delivery_address || delivery.order?.delivery_address || '-'}</span>
                        </div>
                        {delivery.delivery_phone && (
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                            <a href={`tel:${delivery.delivery_phone}`} className="text-primary-600 hover:underline">{delivery.delivery_phone}</a>
                          </div>
                        )}
                        {delivery.order?.total && (
                          <div className="flex justify-between border-t border-gray-100 pt-2 dark:border-gray-800">
                            <span className="text-gray-500">{t('pos.total', 'Total')}</span>
                            <span className="font-bold text-primary-600">{formatCurrency(delivery.order.total)}</span>
                          </div>
                        )}
                        {delivery.notes && (
                          <p className="rounded bg-gray-50 p-2 text-xs text-gray-500 dark:bg-gray-800">{delivery.notes}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history">
          {completedDeliveries.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <History className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                <p className="text-gray-500">{t('delivery.noHistory', 'No delivery history')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {completedDeliveries.map((delivery: any) => (
                <div key={delivery.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3 dark:border-gray-800">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">#{delivery.order?.order_number || delivery.id?.slice(0, 8)}</p>
                    <p className="text-xs text-gray-500">{delivery.delivered_at ? new Date(delivery.delivered_at).toLocaleString() : '-'}</p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
