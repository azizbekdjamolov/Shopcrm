import api from './client'
import type { Employee, PaginatedResponse } from '@/types'

export interface EmployeeFilters {
  search?: string
  is_active?: boolean
  branch_id?: string
  page?: number
  page_size?: number
}

export interface EmployeeCreateData {
  user_id?: string
  full_name?: string
  email?: string
  phone?: string
  position: string
  salary: number
  hire_date: string
  branch_id?: string
}

export const employeesApi = {
  getEmployees: async (params?: EmployeeFilters): Promise<PaginatedResponse<Employee>> => {
    const response = await api.get<PaginatedResponse<Employee>>('/employees', { params })
    return response.data
  },

  getEmployee: async (id: string): Promise<Employee> => {
    const response = await api.get<Employee>(`/employees/${id}`)
    return response.data
  },

  createEmployee: async (data: EmployeeCreateData): Promise<Employee> => {
    const response = await api.post<Employee>('/employees', data)
    return response.data
  },

  updateEmployee: async (id: string, data: Partial<EmployeeCreateData & { is_active?: boolean }>): Promise<Employee> => {
    const response = await api.patch<Employee>(`/employees/${id}`, data)
    return response.data
  },

  deleteEmployee: async (id: string): Promise<void> => {
    await api.delete(`/employees/${id}`)
  },

  getPerformance: async (id: string, params?: {
    start_date?: string
    end_date?: string
  }): Promise<{
    score: number
    total_sales: number
    total_orders: number
    average_order_value: number
    attendance_rate: number
    sales_trend: { date: string; amount: number }[]
  }> => {
    const response = await api.get(`/employees/${id}/performance`, { params })
    return response.data
  },
}
