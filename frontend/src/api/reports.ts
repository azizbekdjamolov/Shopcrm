import api from './client'
import type {
  SalesReport,
  ProfitReport,
  ExpenseReport,
  InventoryReport,
  EmployeeReport,
  CustomerReport,
} from '@/types'

export interface ReportParams {
  branch_id?: string
  start_date?: string
  end_date?: string
}

export const reportsApi = {
  getSalesReport: async (params?: ReportParams): Promise<SalesReport> => {
    const response = await api.get<SalesReport>('/reports/sales', { params })
    return response.data
  },

  getProfitReport: async (params?: ReportParams): Promise<ProfitReport> => {
    const response = await api.get<ProfitReport>('/reports/profit', { params })
    return response.data
  },

  getExpenseReport: async (params?: ReportParams): Promise<ExpenseReport> => {
    const response = await api.get<ExpenseReport>('/reports/expenses', { params })
    return response.data
  },

  getInventoryReport: async (params?: ReportParams): Promise<InventoryReport> => {
    const response = await api.get<InventoryReport>('/reports/inventory', { params })
    return response.data
  },

  getEmployeeReport: async (params?: ReportParams): Promise<EmployeeReport> => {
    const response = await api.get<EmployeeReport>('/reports/employees', { params })
    return response.data
  },

  getCustomerReport: async (params?: ReportParams): Promise<CustomerReport> => {
    const response = await api.get<CustomerReport>('/reports/customers', { params })
    return response.data
  },
}
