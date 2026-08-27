import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { productsApi, type ProductCreateData } from '@/api/products'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingState } from '@/components/common/LoadingState'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'

export function ProductFormPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = !!id

  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productsApi.getProduct(id!),
    enabled: isEdit,
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await productsApi.getCategories()
      return Array.isArray(res) ? res : (res as any)?.results || []
    },
  })

  const [form, setForm] = useState<ProductCreateData>({
    name: '',
    barcode: '',
    description: '',
    category_id: '',
    supplier_id: '',
    cost_price: 0,
    selling_price: 0,
    stock_quantity: 0,
    min_stock: 5,
    unit: 'piece',
  })

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name,
        barcode: product.barcode || '',
        description: product.description || '',
        category_id: product.category_id,
        supplier_id: product.supplier_id || '',
        cost_price: product.purchase_price,
        selling_price: product.selling_price,
        stock_quantity: product.quantity,
        min_stock: product.minimum_stock,
        unit: product.unit,
      })
    }
  }, [product])

  const mutation = useMutation({
    mutationFn: (data: ProductCreateData) =>
      isEdit ? productsApi.updateProduct(id!, data) : productsApi.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success(isEdit ? t('products.updateSuccess') : t('products.createSuccess'))
      navigate('/products')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate(form)
  }

  if (isEdit && productLoading) return <LoadingState />

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title={isEdit ? t('products.editProduct') : t('products.addProduct')}
        action={
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('common.back')}
          </Button>
        }
      />
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>{t('products.productForm')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label={t('products.productName')}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <Input
                label={t('products.barcode')}
                value={form.barcode}
                onChange={(e) => setForm({ ...form, barcode: e.target.value })}
              />
              <Select
                label={t('products.category')}
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                options={(categories || []).map((c: any) => ({ value: c.id, label: c.name }))}
                placeholder={t('products.selectCategory')}
              />
              <Input
                label={t('products.costPrice')}
                type="number"
                value={form.cost_price}
                onChange={(e) => setForm({ ...form, cost_price: Number(e.target.value) })}
                required
              />
              <Input
                label={t('products.sellingPrice')}
                type="number"
                value={form.selling_price}
                onChange={(e) => setForm({ ...form, selling_price: Number(e.target.value) })}
                required
              />
              <Input
                label={t('products.currentStock')}
                type="number"
                value={form.stock_quantity}
                onChange={(e) => setForm({ ...form, stock_quantity: Number(e.target.value) })}
              />
              <Input
                label={t('products.minStock')}
                type="number"
                value={form.min_stock}
                onChange={(e) => setForm({ ...form, min_stock: Number(e.target.value) })}
              />
              <Select
                label={t('products.unit')}
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                options={[
                  { value: 'piece', label: t('products.unitPiece') },
                  { value: 'kg', label: t('products.unitKg') },
                  { value: 'liter', label: t('products.unitLiter') },
                  { value: 'meter', label: t('products.unitMeter') },
                ]}
              />
            </div>
            <Textarea
              label={t('common.description')}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
            />
          </CardContent>
          <CardFooter className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? t('common.processing') : t('common.save')}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
