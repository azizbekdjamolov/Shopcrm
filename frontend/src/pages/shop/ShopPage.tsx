import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, ShoppingCart, Package } from 'lucide-react'
import { productsApi } from '@/api/products'
import { useCartStore } from '@/stores/cartStore'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'

export function ShopPage() {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const itemCount = useCartStore((s) => s.getItemCount())

  const { data: products } = useQuery({
    queryKey: ['shop-products', search],
    queryFn: () => productsApi.getProducts({ search: search || undefined, page: 1, page_size: 50, is_active: true }),
  })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white font-bold text-sm">B</div>
            <span className="text-lg font-bold text-gray-900 dark:text-white">Business OS</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/shop/cart">
              <Button variant="outline" size="sm">
                <ShoppingCart className="mr-2 h-4 w-4" />{t('shop.cart')}
                {itemCount > 0 && (
                  <span className="ml-1 rounded-full bg-primary-600 px-1.5 py-0.5 text-xs text-white">{itemCount}</span>
                )}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t('shop.searchProducts') + '...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-12 w-full rounded-xl border border-gray-300 bg-white pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
        </div>

        {products?.items?.length === 0 ? (
          <div className="py-20 text-center">
            <Package className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4 text-lg text-gray-500">{t('shop.noProducts')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {products?.items?.map((product) => (
              <Link key={product.id} to={`/shop/${product.id}`} className="group rounded-xl border border-gray-200 bg-white p-4 transition-all hover:shadow-lg hover:border-primary-200 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-primary-700">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="aspect-square w-full rounded-lg object-cover" />
                ) : (
                  <div className="flex aspect-square w-full items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                    <span className="text-2xl font-bold text-gray-300">{product.name[0]}</span>
                  </div>
                )}
                <h3 className="mt-3 truncate text-sm font-medium text-gray-900 dark:text-white group-hover:text-primary-600">{product.name}</h3>
                <p className="mt-1 text-lg font-bold text-primary-600 dark:text-primary-400">{formatCurrency(product.selling_price)}</p>
                <p className="mt-1 text-xs text-gray-500">
                  {product.stock_quantity > 0 ? (
                    <span className="text-green-600">{t('shop.inStock')}</span>
                  ) : (
                    <span className="text-red-500">{t('shop.outOfStock')}</span>
                  )}
                </p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
