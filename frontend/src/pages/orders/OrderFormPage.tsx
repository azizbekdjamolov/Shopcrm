import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { ordersApi, type CreateOrderData, type OrderItemData } from '@/api/orders'
import { productsApi } from '@/api/products'
import { customersApi } from '@/api/customers'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'

export function OrderFormPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [form, setForm] = useState<CreateOrderData>({
    branch_id: 'default',
    items: [],
    delivery_address: '',
    delivery_notes: '',
    notes: '',
  })

  const { data: products } = useQuery({
    queryKey: ['products', 'all'],
    queryFn: () => productsApi.getProducts({ page: 1, page_size: 100, is_active: true }),
  })

  const { data: customers } = useQuery({
    queryKey: ['customers', 'list'],
    queryFn: () => customersApi.getCustomers({ page: 1, page_size: 100 }),
  })

  const createMutation = useMutation({
    mutationFn: ordersApi.createOrder,
    onSuccess: () => {
      toast.success(t('orders.addOrder'))
      navigate('/orders')
    },
  })

  const addItem = () => {
    setForm({ ...form, items: [...form.items, { product_id: '', quantity: 1, unit_price: 0 }] })
  }

  const updateItem = (index: number, field: keyof OrderItemData, value: any) => {
    const items = [...form.items]
    ;(items[index] as any)[field] = value
    if (field === 'product_id') {
      const product = products?.items?.find((p) => p.id === value)
      if (product) items[index].unit_price = product.selling_price
    }
    setForm({ ...form, items })
  }

  const removeItem = (index: number) => {
    setForm({ ...form, items: form.items.filter((_, i) => i !== index) })
  }

  const total = form.items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0) - (form.discount_amount || 0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (form.items.length === 0) {
      toast.error(t('orders.addItem'))
      return
    }
    createMutation.mutate(form)
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title={t('orders.addOrder')}
        action={
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />{t('common.back')}
          </Button>
        }
      />
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>{t('orders.items')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              label={t('orders.customerInfo')}
              value={form.customer_id || ''}
              onChange={(e) => setForm({ ...form, customer_id: e.target.value || undefined })}
              options={(customers?.items || []).map((c) => ({ value: c.id, label: c.full_name }))}
              placeholder={t('pos.walkInCustomer')}
            />
            {form.items.map((item, index) => (
              <div key={index} className="flex items-end gap-2">
                <Select
                  label={index === 0 ? t('products.title') : ''}
                  value={item.product_id}
                  onChange={(e) => updateItem(index, 'product_id', e.target.value)}
                  options={(products?.items || []).map((p) => ({ value: p.id, label: `${p.name} (${formatCurrency(p.selling_price)})` }))}
                  placeholder={t('pos.searchProduct')}
                  className="flex-1"
                />
                <Input
                  label={index === 0 ? t('common.quantity') : ''}
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                  className="w-24"
                />
                <Input
                  label={index === 0 ? t('common.price') : ''}
                  type="number"
                  value={item.unit_price}
                  onChange={(e) => updateItem(index, 'unit_price', Number(e.target.value))}
                  className="w-32"
                />
                <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addItem}>
              <Plus className="mr-2 h-4 w-4" />{t('orders.addItem')}
            </Button>
            <Textarea label={t('orders.deliveryAddress')} value={form.delivery_address} onChange={(e) => setForm({ ...form, delivery_address: e.target.value })} rows={2} />
            <Textarea label={t('orders.deliveryNotes')} value={form.delivery_notes || ''} onChange={(e) => setForm({ ...form, delivery_notes: e.target.value })} rows={2} />
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="text-lg font-bold text-primary-600">{t('pos.total')}: {formatCurrency(total)}</div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>{t('common.cancel')}</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? t('common.processing') : t('common.save')}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
