import api from './client'
import type { Sale, PaginatedResponse, PaymentMethodType } from '@/types'

export interface SaleFilters {
  search?: string
  branch_id?: string
  payment_method?: PaymentMethodType
  start_date?: string
  end_date?: string
  page?: number
  page_size?: number
  ordering?: string
}

export interface SaleItemData {
  product_id: string
  quantity: number
  unit_price: number
  discount?: number
}

export interface CreateSaleData {
  branch_id: string
  customer_id?: string
  user_id?: string
  items: SaleItemData[]
  discount_amount?: number
  discount?: number
  payment_method: PaymentMethodType
  notes?: string
}

export const salesApi = {
  getSales: async (params?: SaleFilters): Promise<PaginatedResponse<Sale>> => {
    const response = await api.get<PaginatedResponse<Sale>>('/sales', { params })
    return response.data
  },

  getSale: async (id: string): Promise<Sale> => {
    const response = await api.get<Sale>(`/sales/${id}`)
    return response.data
  },

  createSale: async (data: CreateSaleData): Promise<Sale> => {
    const response = await api.post<Sale>('/sales', data)
    return response.data
  },
}
