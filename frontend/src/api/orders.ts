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
  delivery_notes?: string
  notes?: string
  payment_method?: string
}

export const ordersApi = {
  getOrders: async (params?: OrderFilters): Promise<PaginatedResponse<Order>> => {
    const response = await api.get<PaginatedResponse<Order>>('/orders', { params })
    return response.data
  },

  getOrder: async (id: string): Promise<Order> => {
    const response = await api.get<Order>(`/orders/${id}`)
    return response.data
  },

  createOrder: async (data: CreateOrderData): Promise<Order> => {
    const response = await api.post<Order>('/orders', data)
    return response.data
  },

  updateOrderStatus: async (id: string, status: OrderStatusType): Promise<Order> => {
    const response = await api.patch<Order>(`/orders/${id}/status`, { status })
    return response.data
  },

  cancelOrder: async (id: string, reason?: string): Promise<Order> => {
    const response = await api.post<Order>(`/orders/${id}/cancel`, { reason })
    return response.data
  },
}
