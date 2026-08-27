import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, ShoppingCart, Plus, Minus, Check } from 'lucide-react'
import { productsApi } from '@/api/products'
import { useCartStore } from '@/stores/cartStore'
import { LoadingState } from '@/components/common/LoadingState'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'

export function ShopProductDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const addItem = useCartStore((s) => s.addItem)

  const { data: product, isLoading } = useQuery({
    queryKey: ['shop-product', id],
    queryFn: () => productsApi.getProduct(id!),
    enabled: !!id,
  })

  if (isLoading) return <LoadingState />
  if (!product) return null

  const handleAddToCart = () => {
    addItem({
      product_id: product.id,
      name: product.name,
      selling_price: product.selling_price,
      image: product.image,
      max_quantity: product.stock_quantity ?? 999,
    }, quantity)
    setAdded(true)
    toast.success(t('shop.addedToCart'))
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />{t('common.back')}
          </Button>
          <Link to="/shop/cart">
            <Button variant="outline" size="sm">
              <ShoppingCart className="mr-2 h-4 w-4" />{t('shop.cart')}
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {product.image ? (
            <img src={product.image} alt={product.name} className="w-full rounded-xl object-cover aspect-square" />
          ) : (
            <div className="flex aspect-square w-full items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
              <span className="text-6xl font-bold text-gray-300">{product.name[0]}</span>
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{product.name}</h1>
            <p className="mt-2 text-sm text-gray-500">{t('products.barcode')}: {product.barcode}</p>
            <p className="mt-4 text-3xl font-bold text-primary-600">{formatCurrency(product.selling_price)}</p>
            <p className="mt-2 text-sm text-gray-500">
              {(product.stock_quantity ?? 0) > 0 ? (
                <span className="text-green-600">{t('shop.inStock')} ({product.stock_quantity})</span>
              ) : (
                <span className="text-red-500">{t('shop.outOfStock')}</span>
              )}
            </p>
            {product.description && (
              <div className="mt-6">
                <h3 className="font-medium text-gray-900 dark:text-white">{t('shop.productDescription')}</h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{product.description}</p>
              </div>
            )}
            <div className="mt-6 flex items-center gap-4">
              <div className="flex items-center rounded-lg border border-gray-300 dark:border-gray-600">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800"><Minus className="h-4 w-4" /></button>
                <span className="px-4 py-2 text-sm font-medium">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800"><Plus className="h-4 w-4" /></button>
              </div>
              <Button
                size="lg"
                disabled={(product.stock_quantity ?? 0) === 0}
                onClick={handleAddToCart}
                variant={added ? 'default' : 'default'}
                className={added ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                {added ? (
                  <><Check className="mr-2 h-4 w-4" />{t('shop.added')}</>
                ) : (
                  <><ShoppingCart className="mr-2 h-4 w-4" />{t('shop.addToCart')}</>
                )}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
