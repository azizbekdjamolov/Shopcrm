import api from './client'
import type { Payment, PaginatedResponse, PaymentMethodType, PaymentStatusType } from '@/types'

export interface PaymentFilters {
  method?: PaymentMethodType
  status?: PaymentStatusType
  start_date?: string
  end_date?: string
  page?: number
  page_size?: number
}

export interface CreatePaymentData {
  amount: number
  method: PaymentMethodType
  reference_type?: string
  reference_id?: string
  metadata?: Record<string, unknown>
}

export const paymentsApi = {
  getPayments: async (params?: PaymentFilters): Promise<PaginatedResponse<Payment>> => {
    const response = await api.get<PaginatedResponse<Payment>>('/payments', { params })
    return response.data
  },

  createPayment: async (data: CreatePaymentData): Promise<Payment> => {
    const response = await api.post<Payment>('/payments', data)
    return response.data
  },

  getPayment: async (id: string): Promise<Payment> => {
    const response = await api.get<Payment>(`/payments/${id}`)
    return response.data
  },

  webhook: async (provider: string, payload: Record<string, unknown>): Promise<{ status: string }> => {
    const response = await api.post<{ status: string }>(`/payments/webhook/${provider}`, payload)
    return response.data
  },
}
