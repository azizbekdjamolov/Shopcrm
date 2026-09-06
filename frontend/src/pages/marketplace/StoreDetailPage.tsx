import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Store, ShoppingCart, Package, Plus, Minus } from 'lucide-react'
import api from '@/api/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { LoadingState } from '@/components/common/LoadingState'
import { useCartStore } from '@/stores/cartStore'
import { formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'

async function fetchStoreProducts(businessId: string, params?: { category_id?: string; search?: string }) {
  const response = await api.get(`/marketplace/stores/${businessId}/products/`, { params })
  const data = response.data
  return Array.isArray(data) ? data : data?.data || []
}

async function fetchStoreDetail(businessId: string) {
  const response = await api.get(`/marketplace/stores/${businessId}/`)
  const data = response.data
  return data && typeof data === 'object' && data.id ? data : data?.data || data
}

export function StoreDetailPage() {
  const { t } = useTranslation()
  const { businessId } = useParams<{ businessId: string }>()
  const navigate = useNavigate()
  const [selectedCategory, setSelectedCategory] = useState('')
  const [search, setSearch] = useState('')
  const addItem = useCartStore((s) => s.addItem)

  const { data: store, isLoading: storeLoading } = useQuery({
    queryKey: ['marketplace', 'store', businessId],
    queryFn: () => fetchStoreDetail(businessId!),
    enabled: !!businessId,
  })

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['marketplace', 'products', businessId, selectedCategory, search],
    queryFn: () => fetchStoreProducts(businessId!, { category_id: selectedCategory || undefined, search: search || undefined }),
    enabled: !!businessId,
  })

  const handleAddToCart = (product: any) => {
    if (!product.in_stock) {
      toast.error(t('pos.outOfStock', 'Out of stock'))
      return
    }
    addItem({
      product_id: product.id,
      business_id: businessId,
      name: product.name,
      selling_price: product.selling_price,
      image: product.image,
      max_quantity: product.quantity,
    })
    toast.success(`${product.name} ${t('pos.addedToCart', 'added to cart')}`)
  }

  if (storeLoading) return <LoadingState />

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="bg-white shadow-sm dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <button onClick={() => navigate('/stores')} className="mb-4 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            {t('common.back')}
          </button>
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/30">
              {store?.logo ? <img src={store.logo} alt="" className="h-12 w-12 rounded-lg object-cover" /> : <Store className="h-8 w-8 text-primary-600" />}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">{store?.name}</h1>
              <p className="text-sm text-gray-500">{store?.address}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {store?.categories?.length > 0 && (
          <div className="mb-6 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button onClick={() => setSelectedCategory('')} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${!selectedCategory ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300'}`}>
              {t('common.all')}
            </button>
            {store.categories.map((cat: any) => (
              <button key={cat.id} onClick={() => setSelectedCategory(selectedCategory === cat.id ? '' : cat.id)} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${selectedCategory === cat.id ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300'}`}>
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {productsLoading ? <LoadingState /> : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {(products || []).map((product: any) => (
              <Card key={product.id} className="overflow-hidden">
                <div className="h-40 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  {product.image ? <img src={product.image} alt={product.name} className="h-full w-full object-cover" /> : <Package className="h-12 w-12 text-gray-300" />}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-medium text-gray-900 dark:text-white">{product.name}</h3>
                  <p className="mt-1 text-lg font-bold text-primary-600">{formatCurrency(product.selling_price)}</p>
                  <p className={`text-xs ${product.in_stock ? 'text-green-600' : 'text-red-500'}`}>
                    {product.in_stock ? `${product.quantity} ${t('marketplace.inStock', 'in stock')}` : t('pos.outOfStock', 'Out of stock')}
                  </p>
                  <Button className="mt-3 w-full" size="sm" onClick={() => handleAddToCart(product)} disabled={!product.in_stock}>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    {t('marketplace.addToCart', 'Add to Cart')}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
