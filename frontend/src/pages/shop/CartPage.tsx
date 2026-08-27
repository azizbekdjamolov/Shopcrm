import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { Trash2, ShoppingBag, Plus, Minus, ArrowLeft } from 'lucide-react'
import { useCartStore } from '@/stores/cartStore'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'

export function CartPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { items, removeItem, updateQuantity, getTotal, clearCart } = useCartStore()

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <main className="mx-auto max-w-4xl px-4 py-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('shop.cart')}</h1>
          <div className="mt-8 flex flex-col items-center justify-center py-12">
            <ShoppingBag className="h-16 w-16 text-gray-300" />
            <h2 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">{t('shop.cartEmpty')}</h2>
            <p className="mt-1 text-sm text-gray-500">{t('shop.cartEmptyDesc')}</p>
            <Link to="/shop" className="mt-4">
              <Button>{t('shop.continueShopping')}</Button>
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('shop.cart')} ({items.length})</h1>
          <Button variant="ghost" size="sm" onClick={clearCart} className="text-red-500 hover:text-red-600">
            <Trash2 className="mr-1 h-4 w-4" />{t('shop.clearCart')}
          </Button>
        </div>

        <div className="mt-6 space-y-4">
          {items.map((item) => (
            <div key={item.product_id} className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
              {item.image ? (
                <img src={item.image} alt={item.name} className="h-20 w-20 rounded-lg object-cover" />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                  <span className="text-xl font-bold text-gray-300">{item.name[0]}</span>
                </div>
              )}
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 dark:text-white">{item.name}</h3>
                <p className="text-sm text-gray-500">{formatCurrency(item.selling_price)}</p>
              </div>
              <div className="flex items-center rounded-lg border border-gray-300 dark:border-gray-600">
                <button
                  onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                  className="px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800"
                  disabled={item.quantity <= 1}
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="px-3 py-1 text-sm font-medium">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                  className="px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800"
                  disabled={item.quantity >= item.max_quantity}
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
              <p className="w-24 text-right font-bold text-gray-900 dark:text-white">
                {formatCurrency(item.selling_price * item.quantity)}
              </p>
              <button
                onClick={() => removeItem(item.product_id)}
                className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center justify-between text-lg">
            <span className="font-medium text-gray-900 dark:text-white">{t('shop.total')}</span>
            <span className="text-2xl font-bold text-primary-600">{formatCurrency(getTotal())}</span>
          </div>
          <div className="mt-4 flex gap-3">
            <Link to="/shop" className="flex-1">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />{t('shop.continueShopping')}
              </Button>
            </Link>
            <Link to="/shop/checkout" className="flex-1">
              <Button className="w-full" size="lg">{t('shop.checkout')}</Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
