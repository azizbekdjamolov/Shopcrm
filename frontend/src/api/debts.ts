import api from './client'
import type { Debt, PaginatedResponse, PaymentMethodType } from '@/types'

export interface DebtFilters {
  search?: string
  status?: string
  customer_id?: string
  page?: number
  page_size?: number
}

export interface DebtPaymentData {
  amount: number
  payment_method: PaymentMethodType
  notes?: string
}

export const debtsApi = {
  getDebts: async (params?: DebtFilters): Promise<PaginatedResponse<Debt>> => {
    const response = await api.get<PaginatedResponse<Debt>>('/debts', { params })
    return response.data
  },

  getDebt: async (id: string): Promise<Debt> => {
    const response = await api.get<Debt>(`/debts/${id}`)
    return response.data
  },

  makePayment: async (id: string, data: DebtPaymentData): Promise<Debt> => {
    const response = await api.post<Debt>(`/debts/${id}/pay`, data)
    return response.data
  },
}
