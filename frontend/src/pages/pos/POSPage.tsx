import { useState, useCallback, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Search, ShoppingCart, Plus, Minus, Trash2, X, User, CreditCard,
  Banknote, Smartphone, AlertTriangle, CheckCircle2, Barcode, Receipt,
  ArrowRight, Package, StickyNote, Printer, RotateCcw,
} from 'lucide-react'
import { productsApi } from '@/api/products'
import { salesApi, type CreateSaleData } from '@/api/sales'
import { customersApi } from '@/api/customers'
import { Button } from '@/components/ui/button'
import { BarcodeScanner } from '@/components/common/BarcodeScanner'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/utils'
import { PaymentMethod } from '@/types'
import toast from 'react-hot-toast'

interface CartItem {
  product_id: string
  name: string
  price: number
  quantity: number
  stock: number
  image?: string
  discount: number
}

interface CompletedSale {
  id: string
  sale_number?: string
  total: number
  payment_method: string
  items: { name: string; quantity: number; unit_price: number; total: number }[]
  created_at: string
  customer_name?: string
}

const PAYMENT_ICONS: Record<string, typeof Banknote> = {
  cash: Banknote,
  card: CreditCard,
  click: Smartphone,
  payme: Smartphone,
  debt: AlertTriangle,
}

const PAYMENT_COLORS: Record<string, string> = {
  cash: 'bg-emerald-500 hover:bg-emerald-600 text-white',
  card: 'bg-blue-500 hover:bg-blue-600 text-white',
  click: 'bg-cyan-500 hover:bg-cyan-600 text-white',
  payme: 'bg-purple-500 hover:bg-purple-600 text-white',
  debt: 'bg-amber-500 hover:bg-amber-600 text-white',
}

export function POSPage() {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [discount, setDiscount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState<string>(PaymentMethod.CASH)
  const [customerId, setCustomerId] = useState<string | undefined>()
  const [debtCustomerId, setDebtCustomerId] = useState<string | undefined>()
  const [showPayment, setShowPayment] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [cashReceived, setCashReceived] = useState<number>(0)
  const [notes, setNotes] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [completedSale, setCompletedSale] = useState<CompletedSale | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const { data: products } = useQuery({
    queryKey: ['products', 'pos', search, selectedCategory],
    queryFn: () => productsApi.getProducts({
      search: search || undefined,
      page: 1,
      page_size: 100,
      is_active: true,
      category_id: selectedCategory || undefined,
    }),
  })

  const { data: customers } = useQuery({
    queryKey: ['customers', 'list'],
    queryFn: () => customersApi.getCustomers({ page: 1, page_size: 200 }),
  })

  const { data: registeredUsers } = useQuery({
    queryKey: ['users', 'registered'],
    queryFn: customersApi.getRegisteredUsers,
    staleTime: 60_000,
  })

  const queryClient = useQueryClient()

  const saleMutation = useMutation({
    mutationFn: (data: CreateSaleData) => salesApi.createSale(data),
    onSuccess: (sale) => {
      const cartItems = cart.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        total: item.price * item.quantity - item.discount,
      }))
      const customerName = paymentMethod === 'debt'
        ? registeredUsers?.find((u) => u.id === debtCustomerId)?.full_name
        : customerId
          ? customers?.items?.find((c: any) => c.id === customerId)?.full_name
          : undefined
      setCompletedSale({
        id: sale.id,
        sale_number: (sale as any).sale_number,
        total: sale.total_amount || total,
        payment_method: paymentMethod,
        items: cartItems,
        created_at: new Date().toISOString(),
        customer_name: customerName,
      })
      setCart([])
      setDiscount(0)
      setCustomerId(undefined)
      setDebtCustomerId(undefined)
      setCashReceived(0)
      setNotes('')
      setShowPayment(false)
      queryClient.invalidateQueries({ queryKey: ['products', 'pos'] })
      queryClient.invalidateQueries({ queryKey: ['customers', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['users', 'registered'] })
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail || err?.message || t('pos.saleFailed')
      toast.error(msg)
    },
  })

  useEffect(() => {
    if (products?.items) {
      const inStock = products.items.filter((p: any) => (Number(p.quantity ?? p.stock_quantity ?? 0)) > 0)
      const cats = [...new Set(inStock.map((p: any) => p.category_name).filter(Boolean))] as string[]
      setCategories(cats)
    }
  }, [products])

  const stopScanner = useCallback(() => {
    setShowScanner(false)
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault()
        searchRef.current?.focus()
      }
      if (e.key === 'F4' && cart.length > 0) {
        e.preventDefault()
        setShowPayment(true)
      }
      if (e.key === 'Escape') {
        if (completedSale) {
          setCompletedSale(null)
        } else if (showPayment) {
          setShowPayment(false)
        } else if (showScanner) {
          setShowScanner(false)
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [cart.length, showPayment, showScanner, completedSale, stopScanner])

  const addToCart = useCallback((product: any) => {
    setCart((prev) => {
      const stock = Number(product.quantity ?? product.stock_quantity ?? 0)
      if (stock <= 0) {
        toast.error(t('pos.insufficientStock'))
        return prev
      }
      const existing = prev.find((item) => item.product_id === product.id)
      if (existing) {
        if (existing.quantity >= stock) {
          toast.error(t('pos.insufficientStock'))
          return prev
        }
        return prev.map((item) =>
          item.product_id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      }
      return [
        ...prev,
        {
          product_id: product.id,
          name: product.name,
          price: product.selling_price,
          quantity: 1,
          stock: product.quantity || product.stock_quantity || 0,
          image: product.image,
          discount: 0,
        },
      ]
    })
  }, [t])

  const handleBarcodeScan = useCallback(async (decodedText: string) => {
    const byBarcode = await productsApi.getProductByBarcode(decodedText)
    if (byBarcode) {
      addToCart(byBarcode)
      toast.success(`${t('pos.addedToCart')}: ${byBarcode.name}`)
      return
    }
    const res = await productsApi.getProducts({ search: decodedText, page: 1, page_size: 10, is_active: true })
    if (res?.items?.length) {
      const exact = res.items.find((p: any) => p.barcode === decodedText)
      addToCart(exact || res.items[0])
      toast.success(`${t('pos.addedToCart')}: ${(exact || res.items[0]).name}`)
    } else {
      toast.error(`${t('pos.productNotFound')}: ${decodedText}`)
    }
  }, [addToCart, t])

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product_id !== productId) return item
          const newQty = item.quantity + delta
          if (newQty > item.stock) {
            toast.error(t('pos.insufficientStock'))
            return item
          }
          return { ...item, quantity: newQty }
        })
        .filter((item) => item.quantity > 0)
    )
  }

  const setItemDiscount = (productId: string, value: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.product_id === productId ? { ...item, discount: Math.max(0, value) } : item
      )
    )
  }

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product_id !== productId))
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity - item.discount, 0)
  const total = Math.max(0, subtotal - discount)
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const change = paymentMethod === 'cash' && cashReceived > total ? cashReceived - total : 0

  const handleCheckout = () => {
    if (cart.length === 0) return
    if (paymentMethod === 'cash' && cashReceived < total) {
      toast.error(t('pos.cashInsufficient'))
      return
    }
    if (paymentMethod === 'debt' && !debtCustomerId) {
      toast.error(t('pos.selectCustomerForDebt'))
      return
    }
    saleMutation.mutate({
      branch_id: 'default',
      customer_id: paymentMethod === 'debt' ? undefined : customerId,
      user_id: paymentMethod === 'debt' ? debtCustomerId : undefined,
      items: cart.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.price,
        discount: item.discount,
      })),
      discount: discount,
      payment_method: paymentMethod as any,
      notes: notes || undefined,
    })
  }

  return (
    <div className="flex h-[calc(100vh-6rem)] gap-4">
      {/* LEFT: Products */}
      <div className="flex-1 flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center gap-3 border-b border-gray-200 p-4 dark:border-gray-700">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              ref={searchRef}
              type="text"
              placeholder={`${t('pos.searchProduct')}... (F2)`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 w-full rounded-lg border border-gray-300 bg-gray-50 pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowScanner(true)} className="flex items-center gap-2 whitespace-nowrap">
            <Barcode className="h-4 w-4" />
            <span className="hidden sm:inline">{t('pos.scanBarcode')}</span>
          </Button>
        </div>

        {categories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto border-b border-gray-200 px-4 py-2 dark:border-gray-700 scrollbar-hide">
            <button
              onClick={() => setSelectedCategory('')}
              className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                !selectedCategory ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              {t('common.all')}
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(selectedCategory === cat ? '' : cat)}
                className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  selectedCategory === cat ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4">
          {!(products?.items ?? []).some((p: any) => (Number(p.quantity ?? p.stock_quantity ?? 0)) > 0) ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Package className="h-12 w-12 mb-3 opacity-50" />
              <p className="text-sm font-medium">{t('pos.noProducts')}</p>
              <p className="text-xs">{t('pos.tryDifferentSearch')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {(products?.items ?? [])
                .filter((p: any) => (Number(p.quantity ?? p.stock_quantity ?? 0)) > 0)
                .map((product: any) => {
                const inCart = cart.find((i) => i.product_id === product.id)
                const outOfStock = (product.quantity || product.stock_quantity || 0) === 0
                return (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    disabled={outOfStock}
                    className={`relative flex flex-col items-center rounded-xl border p-3 text-center transition-all hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed ${
                      inCart
                        ? 'border-primary-400 bg-primary-50 ring-2 ring-primary-200 dark:border-primary-600 dark:bg-primary-900/20 dark:ring-primary-800'
                        : 'border-gray-200 bg-white hover:border-primary-300 dark:border-gray-700 dark:bg-gray-900'
                    }`}
                  >
                    {inCart && (
                      <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-[10px] font-bold text-white">
                        {inCart.quantity}
                      </span>
                    )}
                    {product.image ? (
                      <img src={product.image} alt="" className="h-14 w-14 rounded-lg object-cover mb-2" />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 mb-2">
                        <span className="text-lg font-bold text-gray-400">{product.name[0]}</span>
                      </div>
                    )}
                    <p className="w-full truncate text-xs font-medium text-gray-900 dark:text-white">{product.name}</p>
                    <p className="text-sm font-bold text-primary-600 dark:text-primary-400">{formatCurrency(product.selling_price)}</p>
                    <p className={`text-[10px] ${outOfStock ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                      {outOfStock ? t('pos.outOfStock') : `${product.quantity || product.stock_quantity || 0} ${t('products.unitPiece')}`}
                    </p>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Cart */}
      <div className="w-[380px] flex flex-col rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-gray-500" />
            <h2 className="font-semibold text-gray-900 dark:text-white">{t('pos.cart')}</h2>
          </div>
          {itemCount > 0 && (
            <span className="rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-bold text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
              {itemCount}
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <ShoppingCart className="h-10 w-10 mb-3 opacity-50" />
              <p className="text-sm font-medium">{t('pos.emptyCart')}</p>
              <p className="text-xs">{t('pos.scanOrSearch')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {cart.map((item) => (
                <div key={item.product_id} className="rounded-lg border border-gray-100 p-3 dark:border-gray-800">
                  <div className="flex items-start gap-3">
                    {item.image ? (
                      <img src={item.image} alt="" className="h-10 w-10 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                        <span className="text-sm font-bold text-gray-400">{item.name[0]}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{item.name}</p>
                      <p className="text-xs text-gray-500">{formatCurrency(item.price)} × {item.quantity}</p>
                    </div>
                    <button onClick={() => removeFromCart(item.product_id)} className="rounded p-1 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => updateQuantity(item.product_id, -1)}
                        className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product_id, 1)}
                        disabled={item.quantity >= item.stock}
                        className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 hover:bg-gray-100 disabled:opacity-40 dark:border-gray-700 dark:hover:bg-gray-800"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                      <span className="text-[10px] text-gray-400 ml-1">/ {item.stock}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(item.price * item.quantity - item.discount)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="border-t border-gray-200 p-4 space-y-3 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 flex-shrink-0 text-gray-400" />
              {paymentMethod === 'debt' ? (
                <select
                  value={debtCustomerId || ''}
                  onChange={(e) => setDebtCustomerId(e.target.value || undefined)}
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                >
                  <option value="">{t('pos.selectCustomerForDebt')}</option>
                  {(registeredUsers || []).map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name || u.email}{u.email && (u.full_name && u.full_name !== u.email ? ` — ${u.email}` : '')}
                    </option>
                  ))}
                </select>
              ) : (
                <select
                  value={customerId || ''}
                  onChange={(e) => setCustomerId(e.target.value || undefined)}
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                >
                  <option value="">{t('pos.walkInCustomer')}</option>
                  {customers?.items?.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.full_name}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder={t('pos.discountAmount')}
                  type="number"
                  min="0"
                  value={discount || ''}
                  onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                />
              </div>
              <div className="flex-1">
                <div className="relative">
                  <StickyNote className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder={t('pos.notes')}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="h-[38px] w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm focus:border-primary-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5 rounded-lg bg-gray-50 p-3 text-sm dark:bg-gray-800">
              <div className="flex justify-between">
                <span className="text-gray-500">{t('pos.subtotal')}</span>
                <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('pos.discount')}</span>
                  <span className="font-medium text-red-500">-{formatCurrency(discount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-gray-200 pt-2 dark:border-gray-700">
                <span className="font-semibold text-gray-900 dark:text-white">{t('pos.total')}</span>
                <span className="text-xl font-bold text-primary-600">{formatCurrency(total)}</span>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-1.5">
              {(['cash', 'card', 'click', 'payme', 'debt'] as const).map((method) => {
                const Icon = PAYMENT_ICONS[method]
                return (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={`flex flex-col items-center gap-1 rounded-lg py-2 text-[10px] font-medium transition-all ${
                      paymentMethod === method
                        ? PAYMENT_COLORS[method] + ' scale-105 shadow-md'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {method.toUpperCase()}
                  </button>
                )
              })}
            </div>

            <Button
              className="w-full h-12 text-base font-bold"
              size="lg"
              onClick={() => setShowPayment(true)}
              disabled={saleMutation.isPending}
            >
              <Receipt className="mr-2 h-5 w-5" />
              {saleMutation.isPending ? t('common.processing') : `${t('pos.pay')} ${formatCurrency(total)}`}
            </Button>
          </div>
        )}
      </div>

      {/* PAYMENT MODAL */}
      {showPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30">
                {(() => { const I = PAYMENT_ICONS[paymentMethod]; return <I className="h-7 w-7 text-primary-600" /> })()}
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('pos.confirmPayment')}</h3>
              <p className="mt-1 text-sm text-gray-500">{t('pos.total')}: <span className="font-bold text-primary-600">{formatCurrency(total)}</span></p>
            </div>

            {paymentMethod === 'cash' && (
              <div className="mb-4 space-y-3">
                <Input
                  label={t('pos.cashReceived')}
                  type="number"
                  min="0"
                  value={cashReceived || ''}
                  onChange={(e) => setCashReceived(Number(e.target.value) || 0)}
                  autoFocus
                />
                {cashReceived >= total && (
                  <div className="rounded-lg bg-emerald-50 p-3 text-center dark:bg-emerald-900/20">
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">{t('pos.change')}</p>
                    <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(change)}</p>
                  </div>
                )}
                {cashReceived > 0 && cashReceived < total && (
                  <div className="rounded-lg bg-red-50 p-3 text-center dark:bg-red-900/20">
                    <p className="text-xs text-red-600 dark:text-red-400">{t('pos.shortage')}</p>
                    <p className="text-lg font-bold text-red-700 dark:text-red-300">{formatCurrency(total - cashReceived)}</p>
                  </div>
                )}
              </div>
            )}

            <div className="mb-6 rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
              <p className="text-xs text-gray-500 mb-1">{t('pos.orderSummary')}</p>
              <div className="space-y-1 text-sm">
                {cart.map((item) => (
                  <div key={item.product_id} className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">{item.name} × {item.quantity}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
                {discount > 0 && (
                  <div className="flex justify-between text-red-500">
                    <span>{t('pos.discount')}</span>
                    <span>-{formatCurrency(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-gray-200 pt-1 font-bold dark:border-gray-700">
                  <span>{t('pos.total')}</span>
                  <span className="text-primary-600">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => { setShowPayment(false); setCashReceived(0) }}>
                {t('common.cancel')}
              </Button>
              <Button
                className="flex-1"
                onClick={handleCheckout}
                disabled={saleMutation.isPending || (paymentMethod === 'cash' && cashReceived < total)}
              >
                {saleMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {t('common.processing')}
                  </span>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    {t('pos.confirmSale')}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* BARCODE SCANNER MODAL */}
      <BarcodeScanner
        open={showScanner}
        onClose={stopScanner}
        onScan={handleBarcodeScan}
      />

      {/* RECEIPT MODAL */}
      {completedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900">
            <div className="mb-4 text-center">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                <CheckCircle2 className="h-9 w-9 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('pos.saleCompleted')}</h3>
              <p className="text-xs text-gray-500">#{completedSale.sale_number || completedSale.id.slice(0, 8)}</p>
            </div>

            <div id="receipt-content" className="rounded-lg border border-dashed border-gray-300 p-4 dark:border-gray-600 font-mono text-xs">
              <div className="text-center mb-3 border-b border-gray-200 dark:border-gray-700 pb-3">
                <p className="text-sm font-bold text-gray-900 dark:text-white">{t('pos.receipt', 'RECEIPT')}</p>
                <p className="text-[10px] text-gray-500">{new Date(completedSale.created_at).toLocaleString()}</p>
                {completedSale.customer_name && (
                  <p className="mt-1 text-[10px] text-gray-500">{completedSale.customer_name}</p>
                )}
              </div>

              <div className="space-y-1">
                {completedSale.items.map((item, i) => (
                  <div key={i} className="flex justify-between">
                    <span className="text-gray-700 dark:text-gray-300 truncate max-w-[55%]">{item.name} ×{item.quantity}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(item.total)}</span>
                  </div>
                ))}
              </div>

              <div className="mt-3 border-t border-gray-200 dark:border-gray-700 pt-2 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">{t('pos.total')}</span>
                  <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(completedSale.total)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">{t('pos.paymentMethod', 'Payment')}</span>
                  <span className="text-gray-700 dark:text-gray-300 uppercase">{completedSale.payment_method}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  const el = document.getElementById('receipt-content')
                  if (el) {
                    const w = window.open('', '_blank', 'width=320,height=600')
                    if (w) {
                      w.document.write(`<html><head><title>Receipt</title><style>body{font-family:monospace;font-size:12px;padding:16px;max-width:300px;margin:0 auto}div{margin-bottom:4px}</style></head><body>${el.innerHTML}</body></html>`)
                      w.document.close()
                      w.print()
                    }
                  }
                }}
              >
                <Printer className="mr-2 h-4 w-4" />
                {t('common.print')}
              </Button>
              <Button
                className="flex-1"
                onClick={() => setCompletedSale(null)}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                {t('pos.newSale', 'New Sale')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
