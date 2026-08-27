import api from './client'
import type { Business, PaginatedResponse } from '@/types'

export interface BusinessCreateData {
  name: string
  description?: string
  phone?: string
  email?: string
  address?: string
}

export interface MarketplaceSettings {
  id: string
  is_public: boolean
  delivery_enabled: boolean
  delivery_fee: number
  min_order_amount: number
  store_description: string
  store_phone: string
  store_address: string
  extra_data: Record<string, any>
  created_at: string
  updated_at: string
}

export const businessesApi = {
  getBusinesses: async (): Promise<PaginatedResponse<Business>> => {
    const response = await api.get<PaginatedResponse<Business>>('/businesses')
    return response.data
  },

  getBusiness: async (id: string): Promise<Business> => {
    const response = await api.get<Business>(`/businesses/${id}`)
    return response.data
  },

  createBusiness: async (data: BusinessCreateData): Promise<Business> => {
    const response = await api.post<Business>('/businesses', data)
    return response.data
  },

  updateBusiness: async (id: string, data: Partial<BusinessCreateData>): Promise<Business> => {
    const response = await api.patch<Business>(`/businesses/${id}`, data)
    return response.data
  },

  deleteBusiness: async (id: string): Promise<void> => {
    await api.delete(`/businesses/${id}`)
  },

  getBusinessMembers: async (businessId: string): Promise<any[]> => {
    const response = await api.get<any[]>(`/businesses/${businessId}/members/`)
    return response.data
  },

  addMember: async (businessId: string, data: { user_id: string; role: string }): Promise<any> => {
    const response = await api.post<any>(`/businesses/${businessId}/add_member/`, data)
    return response.data
  },

  getMarketplaceSettings: async (): Promise<MarketplaceSettings> => {
    const response = await api.get<MarketplaceSettings>('/businesses/marketplace-settings/')
    return response.data
  },

  updateMarketplaceSettings: async (data: Partial<MarketplaceSettings>): Promise<MarketplaceSettings> => {
    const response = await api.patch<MarketplaceSettings>('/businesses/marketplace-settings/', data)
    return response.data
  },
}
