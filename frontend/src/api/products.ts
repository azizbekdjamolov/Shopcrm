import api from './client'
import type { Product, Category, Supplier, PaginatedResponse } from '@/types'

export interface ProductFilters {
  search?: string
  category_id?: string
  is_active?: boolean
  low_stock?: boolean
  page?: number
  page_size?: number
  ordering?: string
}

export interface ProductCreateData {
  name: string
  barcode?: string
  description?: string
  category_id?: string
  supplier_id?: string
  cost_price: number
  selling_price: number
  stock_quantity: number
  min_stock: number
  unit: string
  image?: string
  is_active?: boolean
  is_weighted?: boolean
  tax_rate?: number
}

export const productsApi = {
  getProducts: async (params?: ProductFilters): Promise<PaginatedResponse<Product>> => {
    const response = await api.get<PaginatedResponse<Product>>('/products', { params })
    return response.data
  },

  getProduct: async (id: string): Promise<Product> => {
    const response = await api.get<Product>(`/products/${id}`)
    return response.data
  },

  createProduct: async (data: ProductCreateData): Promise<Product> => {
    const response = await api.post<Product>('/products', data)
    return response.data
  },

  updateProduct: async (id: string, data: Partial<ProductCreateData>): Promise<Product> => {
    const response = await api.patch<Product>(`/products/${id}`, data)
    return response.data
  },

  deleteProduct: async (id: string): Promise<void> => {
    await api.delete(`/products/${id}`)
  },

  getCategories: async (): Promise<Category[]> => {
    const response = await api.get<Category[]>('/categories')
    return response.data
  },

  createCategory: async (data: { name: string; description?: string; parent_id?: string }): Promise<Category> => {
    const response = await api.post<Category>('/categories', data)
    return response.data
  },

  updateCategory: async (id: string, data: { name?: string; description?: string }): Promise<Category> => {
    const response = await api.patch<Category>(`/categories/${id}`, data)
    return response.data
  },

  deleteCategory: async (id: string): Promise<void> => {
    await api.delete(`/categories/${id}`)
  },

  getSuppliers: async (params?: { search?: string; page?: number; page_size?: number }): Promise<PaginatedResponse<Supplier>> => {
    const response = await api.get<PaginatedResponse<Supplier>>('/suppliers', { params })
    return response.data
  },

  getSupplier: async (id: string): Promise<Supplier> => {
    const response = await api.get<Supplier>(`/suppliers/${id}`)
    return response.data
  },

  createSupplier: async (data: {
    name: string
    phone: string
    email?: string
    address?: string
    contact_person?: string
  }): Promise<Supplier> => {
    const response = await api.post<Supplier>('/suppliers', data)
    return response.data
  },

  updateSupplier: async (id: string, data: Partial<{
    name: string
    phone: string
    email?: string
    address?: string
    contact_person?: string
  }>): Promise<Supplier> => {
    const response = await api.patch<Supplier>(`/suppliers/${id}`, data)
    return response.data
  },

  deleteSupplier: async (id: string): Promise<void> => {
    await api.delete(`/suppliers/${id}`)
  },
}
