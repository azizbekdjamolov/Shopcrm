import api from './client'
import type { Inventory, InventoryMovement, Product, PaginatedResponse } from '@/types'

export interface InventoryFilters {
  search?: string
  branch_id?: string
  low_stock?: boolean
  page?: number
  page_size?: number
}

export interface StockAdjustment {
  product_id: string
  branch_id: string
  quantity: number
  type: 'increase' | 'decrease'
  notes?: string
}

export const inventoryApi = {
  getInventory: async (params?: InventoryFilters): Promise<PaginatedResponse<Inventory>> => {
    const response = await api.get<PaginatedResponse<Inventory>>('/inventory', { params })
    return response.data
  },

  adjustStock: async (data: StockAdjustment): Promise<Inventory> => {
    const response = await api.post<Inventory>('/inventory/adjust', data)
    return response.data
  },

  getMovements: async (params?: {
    product_id?: string
    branch_id?: string
    type?: string
    page?: number
    page_size?: number
  }): Promise<PaginatedResponse<InventoryMovement>> => {
    const response = await api.get<PaginatedResponse<InventoryMovement>>('/inventory/movements', { params })
    return response.data
  },

  getLowStock: async (branch_id?: string): Promise<Product[]> => {
    const response = await api.get<Product[]>('/inventory/low-stock', {
      params: branch_id ? { branch_id } : undefined,
    })
    return response.data
  },
}
