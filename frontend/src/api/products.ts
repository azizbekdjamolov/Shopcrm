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

function toBackendProduct(data: Partial<ProductCreateData>) {
  const payload: Record<string, unknown> = {
    name: data.name,
    description: data.description,
    barcode: data.barcode,
    purchase_price: data.cost_price,
    selling_price: data.selling_price,
    quantity: data.stock_quantity,
    minimum_stock: data.min_stock,
    status: data.is_active === false ? 'inactive' : 'active',
  }
  if (data.category_id) payload.category = data.category_id
  if (data.supplier_id) payload.supplier = data.supplier_id
  return payload
}

function toFrontendProduct(raw: any): Product {
  return {
    ...raw,
    category_id: raw.category_id || raw.category || '',
    supplier_id: raw.supplier_id || raw.supplier || '',
    purchase_price: raw.purchase_price,
    selling_price: raw.selling_price,
    quantity: raw.quantity ?? raw.stock_quantity ?? 0,
    stock_quantity: raw.stock_quantity ?? raw.quantity ?? 0,
    minimum_stock: raw.minimum_stock ?? raw.min_stock ?? 0,
    min_stock: raw.min_stock ?? raw.minimum_stock ?? 0,
    unit: raw.unit || 'piece',
    is_active: raw.is_active ?? raw.status === 'active',
    category:
      typeof raw.category === 'object' && raw.category
        ? raw.category
        : raw.category_name
          ? { id: raw.category_id || raw.category || '', name: raw.category_name }
          : undefined,
  }
}

export const productsApi = {
  getProducts: async (params?: ProductFilters): Promise<PaginatedResponse<Product>> => {
    const response = await api.get<PaginatedResponse<Product>>('/products', { params })
    const data = response.data as any
    const items = (data.items || data.results || data || []).map(toFrontendProduct)
    return { ...data, items, results: items }
  },

  getProduct: async (id: string): Promise<Product> => {
    const response = await api.get<Product>(`/products/${id}`)
    return toFrontendProduct(response.data)
  },

  createProduct: async (data: ProductCreateData): Promise<Product> => {
    const response = await api.post<Product>('/products', toBackendProduct(data))
    return toFrontendProduct(response.data)
  },

  updateProduct: async (id: string, data: Partial<ProductCreateData>): Promise<Product> => {
    const response = await api.patch<Product>(`/products/${id}`, toBackendProduct(data))
    return toFrontendProduct(response.data)
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
