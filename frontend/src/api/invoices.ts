import api from './client'
import type { Invoice, PaginatedResponse } from '@/types'

export interface InvoiceFilters {
  status?: string
  customer_id?: string
  start_date?: string
  end_date?: string
  page?: number
  page_size?: number
}

export interface InvoiceItemData {
  description: string
  quantity: number
  unit_price: number
}

export interface CreateInvoiceData {
  customer_id?: string
  items: InvoiceItemData[]
  tax_amount?: number
  due_date?: string
  notes?: string
}

export const invoicesApi = {
  getInvoices: async (params?: InvoiceFilters): Promise<PaginatedResponse<Invoice>> => {
    const response = await api.get<PaginatedResponse<Invoice>>('/invoices', { params })
    return response.data
  },

  getInvoice: async (id: string): Promise<Invoice> => {
    const response = await api.get<Invoice>(`/invoices/${id}`)
    return response.data
  },

  createInvoice: async (data: CreateInvoiceData): Promise<Invoice> => {
    const response = await api.post<Invoice>('/invoices', data)
    return response.data
  },

  updateInvoice: async (id: string, data: Partial<CreateInvoiceData & { status?: string }>): Promise<Invoice> => {
    const response = await api.patch<Invoice>(`/invoices/${id}`, data)
    return response.data
  },

  deleteInvoice: async (id: string): Promise<void> => {
    await api.delete(`/invoices/${id}`)
  },

  generatePdf: async (id: string): Promise<Blob> => {
    const response = await api.get(`/invoices/${id}/pdf`, {
      responseType: 'blob',
    })
    return response.data
  },
}
