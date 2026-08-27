import api from './client'
import type { Delivery, DeliveryStatusType, PaginatedResponse, CourierRating } from '@/types'

export interface DeliveryFilters {
  status?: DeliveryStatusType
  courier_id?: string
  start_date?: string
  end_date?: string
  page?: number
  page_size?: number
}

export const deliveryApi = {
  getDeliveries: async (params?: DeliveryFilters): Promise<PaginatedResponse<Delivery>> => {
    const response = await api.get<PaginatedResponse<Delivery>>('/deliveries', { params })
    return response.data
  },

  getDelivery: async (id: string): Promise<Delivery> => {
    const response = await api.get<Delivery>(`/deliveries/${id}`)
    return response.data
  },

  assignCourier: async (deliveryId: string, courierId: string): Promise<Delivery> => {
    const response = await api.post<Delivery>(`/deliveries/${deliveryId}/assign`, {
      courier_id: courierId,
    })
    return response.data
  },

  updateDeliveryStatus: async (id: string, status: DeliveryStatusType, notes?: string): Promise<Delivery> => {
    const response = await api.patch<Delivery>(`/deliveries/${id}/status`, { status, notes })
    return response.data
  },

  getMyDeliveries: async (params?: DeliveryFilters): Promise<PaginatedResponse<Delivery>> => {
    const response = await api.get<PaginatedResponse<Delivery>>('/deliveries/my', { params })
    return response.data
  },

  rateCourier: async (deliveryId: string, data: {
    rating: number
    comment?: string
  }): Promise<CourierRating> => {
    const response = await api.post<CourierRating>(`/deliveries/${deliveryId}/rate`, data)
    return response.data
  },
}
