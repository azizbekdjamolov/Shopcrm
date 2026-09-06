import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { ordersApi } from '@/api/orders'
import { useCartStore } from '@/stores/cartStore'
import { useAuthStore } from '@/stores/authStore'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MapAddressPicker } from './MapAddressPicker'
import { formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'

export function CheckoutPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { items, getTotal, clearCart } = useCartStore()
  const user = useAuthStore((s) => s.user)
  const [address, setAddress] = useState(user?.address || '')
  const [paymentMethod, setPaymentMethod] = useState('cash')

  const businessId = [...new Set(items.map((item) => item.business_id).filter(Boolean))][0] || undefined

  const paymentMethods = [
    { key: 'cash', label: t('pos.cash', 'Cash'), icon: '💵' },
    { key: 'card', label: t('pos.card', 'Card'), icon: '💳' },
    { key: 'click', label: 'Click', icon: '📱' },
    { key: 'payme', label: 'Payme', icon: '📱' },
  ]

  const orderMutation = useMutation({
    mutationFn: ordersApi.createOrder,
    onSuccess: (order) => {
      toast.success(t('shop.orderPlaced'))
      clearCart()
      navigate(`/shop/track/${order.order_number}`)
    },
    onError: (error: any) => {
      const details = error?.response?.data?.details
      let msg = error?.response?.data?.message || t('common.error')
      if (details && typeof details === 'object') {
        const first = Object.values(details)[0]
        if (Array.isArray(first)) msg = String(first[0])
        else if (first) msg = String(first)
      }
      toast.error(msg)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (items.length === 0) {
      toast.error(t('shop.cartEmpty'))
      return
    }
    if (!address.trim()) {
      toast.error(t('shop.addressRequired', 'Manzilni kiriting'))
      return
    }
    orderMutation.mutate({
      items: items.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.selling_price,
      })),
      branch_id: '',
      business_id: businessId,
      delivery_address: address,
      payment_method: paymentMethod,
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <main className="mx-auto max-w-2xl px-4 py-8">
        <PageHeader title={t('shop.checkout')} action={
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />{t('common.back')}
          </Button>
        } />

        {items.length > 0 && (
          <Card className="mt-6">
            <CardHeader><CardTitle>{t('shop.orderSummary')}</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.product_id} className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300">{item.name} x{item.quantity}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(item.selling_price * item.quantity)}</span>
                  </div>
                ))}
                <div className="border-t pt-2 mt-2 flex justify-between">
                  <span className="font-bold text-gray-900 dark:text-white">{t('shop.total')}</span>
                  <span className="font-bold text-primary-600">{formatCurrency(getTotal())}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <Card>
            <CardHeader><CardTitle>{t('shop.shippingAddress')}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <MapAddressPicker
                value={address}
                onChange={setAddress}
                placeholder={t('shop.address')}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{t('shop.paymentMethod')}</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {paymentMethods.map((m) => (
                  <button key={m.key} type="button" onClick={() => setPaymentMethod(m.key)} className={`rounded-lg border p-3 text-sm font-medium transition-colors ${paymentMethod === m.key ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/10' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'}`}>
                    <span className="mr-2">{m.icon}</span>{m.label}
                  </button>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" size="lg" disabled={orderMutation.isPending || items.length === 0}>
                {orderMutation.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('common.processing')}</>
                ) : (
                  t('shop.placeOrder')
                )}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </main>
    </div>
  )
}