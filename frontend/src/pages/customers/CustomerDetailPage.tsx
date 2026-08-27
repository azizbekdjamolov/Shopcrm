import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { customersApi } from '@/api/customers'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingState } from '@/components/common/LoadingState'
import { ErrorState } from '@/components/common/ErrorState'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'

export function CustomerDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: customer, isLoading, error, refetch } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => customersApi.getCustomer(id!),
    enabled: !!id,
  })

  const { data: orders } = useQuery({
    queryKey: ['customer-orders', id],
    queryFn: () => customersApi.getCustomerOrders(id!, { page: 1, page_size: 10 }),
    enabled: !!id,
  })

  if (isLoading) return <LoadingState />
  if (error) return <ErrorState onRetry={refetch} />
  if (!customer) return null

  return (
    <div className="space-y-6">
      <PageHeader
        title={customer.full_name}
        description={customer.phone}
        action={
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('common.back')}
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-gray-500">{t('customers.totalSpent')}</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(customer.total_spent)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-gray-500">{t('customers.totalOrders')}</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{customer.total_orders}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-gray-500">{t('customers.debtAmount')}</p>
            <p className={`text-xl font-bold ${customer.debt_amount > 0 ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>{formatCurrency(customer.debt_amount)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-gray-500">{t('common.status')}</p>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${customer.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
              {customer.is_active ? t('common.active') : t('common.inactive')}
            </span>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('customers.customerDetail')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-sm text-gray-500">{t('customers.customerPhone')}</p>
                <p className="font-medium text-gray-900 dark:text-white">{customer.phone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('customers.customerEmail')}</p>
                <p className="font-medium text-gray-900 dark:text-white">{customer.email || '-'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-500">{t('customers.customerAddress')}</p>
                <p className="font-medium text-gray-900 dark:text-white">{customer.address || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('customers.orderHistory')}</CardTitle>
          </CardHeader>
          <CardContent>
            {orders?.items?.length ? (
              <div className="space-y-2">
                {orders.items.map((order) => (
                  <div key={order.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3 dark:border-gray-800">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">#{order.order_number}</p>
                      <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(order.total_amount)}</p>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${order.status === 'delivered' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-sm text-gray-500 py-4">{t('common.noData')}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
