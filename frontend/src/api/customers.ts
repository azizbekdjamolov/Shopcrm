import api from './client'
import type { Customer, PaginatedResponse, Order } from '@/types'

export interface CustomerFilters {
  search?: string
  is_active?: boolean
  page?: number
  page_size?: number
  ordering?: string
}

export interface CustomerCreateData {
  full_name: string
  phone: string
  email?: string
  address?: string
  notes?: string
}

export const customersApi = {
  getCustomers: async (params?: CustomerFilters): Promise<PaginatedResponse<Customer>> => {
    const response = await api.get<PaginatedResponse<Customer>>('/customers', { params })
    return response.data
  },

  getCustomer: async (id: string): Promise<Customer> => {
    const response = await api.get<Customer>(`/customers/${id}`)
    return response.data
  },

  createCustomer: async (data: CustomerCreateData): Promise<Customer> => {
    const response = await api.post<Customer>('/customers', data)
    return response.data
  },

  updateCustomer: async (id: string, data: Partial<CustomerCreateData>): Promise<Customer> => {
    const response = await api.patch<Customer>(`/customers/${id}`, data)
    return response.data
  },

  deleteCustomer: async (id: string): Promise<void> => {
    await api.delete(`/customers/${id}`)
  },

  getCustomerOrders: async (id: string, params?: {
    page?: number
    page_size?: number
  }): Promise<PaginatedResponse<Order>> => {
    const response = await api.get<PaginatedResponse<Order>>(`/customers/${id}/orders`, { params })
    return response.data
  },
}
