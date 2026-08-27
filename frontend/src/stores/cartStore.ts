import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  product_id: string
  business_id?: string
  name: string
  selling_price: number
  quantity: number
  image?: string
  max_quantity: number
  discount: number
}

interface CartState {
  items: CartItem[]
  customerId?: string
  discount: number
  addItem: (item: Omit<CartItem, 'quantity' | 'discount'>, quantity?: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  setItemDiscount: (productId: string, discount: number) => void
  setCustomer: (customerId?: string) => void
  setDiscount: (discount: number) => void
  clearCart: () => void
  getTotal: () => number
  getItemCount: () => number
  getSubtotal: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      customerId: undefined,
      discount: 0,

      addItem: (item, quantity = 1) => {
        set((state) => {
          const existing = state.items.find((i) => i.product_id === item.product_id)
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.product_id === item.product_id
                  ? { ...i, quantity: Math.min(i.quantity + quantity, i.max_quantity) }
                  : i
              ),
            }
          }
          return {
            items: [...state.items, { ...item, quantity: Math.min(quantity, item.max_quantity), discount: 0 }],
          }
        })
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((i) => i.product_id !== productId),
        }))
      },

      updateQuantity: (productId, quantity) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.product_id === productId
              ? { ...i, quantity: Math.max(1, Math.min(quantity, i.max_quantity)) }
              : i
          ),
        }))
      },

      setItemDiscount: (productId, discount) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.product_id === productId ? { ...i, discount: Math.max(0, discount) } : i
          ),
        }))
      },

      setCustomer: (customerId) => set({ customerId }),

      setDiscount: (discount) => set({ discount: Math.max(0, discount) }),

      clearCart: () => set({ items: [], customerId: undefined, discount: 0 }),

      getSubtotal: () => {
        return get().items.reduce((sum, item) => sum + item.selling_price * item.quantity - item.discount, 0)
      },

      getTotal: () => {
        const subtotal = get().items.reduce((sum, item) => sum + item.selling_price * item.quantity - item.discount, 0)
        return Math.max(0, subtotal - get().discount)
      },

      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0)
      },
    }),
    {
      name: 'businessos-cart',
    }
  )
)
