import api from './client'
import type { Order, OrderStatusType, PaginatedResponse } from '@/types'

export interface OrderFilters {
  search?: string
  status?: OrderStatusType
  branch_id?: string
  start_date?: string
  end_date?: string
  page?: number
  page_size?: number
  ordering?: string
}

export interface OrderItemData {
  product_id: string
  quantity: number
  unit_price: number
  discount?: number
}

export interface CreateOrderData {
  customer_id?: string
  branch_id: string
  business_id?: string
  items: OrderItemData[]
  discount_amount?: number
  delivery_fee?: number
  delivery_address?: string
  delivery_phone?: string
  delivery_notes?: string
  notes?: string
  payment_method?: string
}

function toFrontendOrder(raw: any): Order {
  return {
    ...raw,
    business_id: raw.business_id || raw.business || '',
    customer_id: raw.customer_id || raw.customer || '',
    branch_id: raw.branch_id || raw.branch || '',
    total_amount: raw.total_amount ?? raw.total ?? 0,
    discount_amount: raw.discount_amount ?? raw.discount ?? 0,
    tax_amount: raw.tax_amount ?? 0,
    delivery_fee: raw.delivery_fee ?? 0,
    is_cancellable: !!raw.is_cancellable,
  }
}

function normalizeList(data: any): PaginatedResponse<Order> {
  const items = (data?.items || data?.results || []).map(toFrontendOrder)
  return { ...data, items, results: items }
}

export const ordersApi = {
  getOrders: async (params?: OrderFilters): Promise<PaginatedResponse<Order>> => {
    const response = await api.get<PaginatedResponse<Order>>('/orders', { params })
    return normalizeList(response.data)
  },

  getOrder: async (id: string): Promise<Order> => {
    const response = await api.get<Order>(`/orders/${id}`)
    return toFrontendOrder(response.data)
  },

  trackOrder: async (orderNumber: string): Promise<Order> => {
    const response = await api.get<Order>('/orders/track/', { params: { order_number: orderNumber } })
    return toFrontendOrder(response.data)
  },

  getMyOrders: async (params?: { page?: number; page_size?: number }): Promise<PaginatedResponse<Order>> => {
    const response = await api.get<PaginatedResponse<Order>>('/orders/my/', params ? { params } : undefined)
    return normalizeList(response.data)
  },

  createOrder: async (data: CreateOrderData): Promise<Order> => {
    const response = await api.post<Order>('/orders', data)
    return toFrontendOrder(response.data)
  },

  updateOrderStatus: async (id: string, status: string): Promise<Order> => {
    const response = await api.post<Order>(`/orders/${id}/status/`, { status })
    return toFrontendOrder(response.data)
  },

  cancelOrder: async (id: string, reason?: string): Promise<Order> => {
    const response = await api.post<Order>(`/orders/${id}/cancel/`, { reason })
    return toFrontendOrder(response.data)
  },
}

export const ORDER_STATUS_TRANSITIONS: Record<string, string[]> = {
  NEW: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY_FOR_DELIVERY', 'CANCELLED'],
  READY_FOR_DELIVERY: ['COURIER_ASSIGNED', 'CANCELLED'],
  COURIER_ASSIGNED: ['ON_THE_WAY', 'CANCELLED'],
  ON_THE_WAY: ['ARRIVED'],
  ARRIVED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
}
