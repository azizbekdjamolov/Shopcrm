import api from './client'
import type { Expense, ExpenseCategory, PaginatedResponse } from '@/types'

export interface ExpenseFilters {
  search?: string
  category_id?: string
  branch_id?: string
  start_date?: string
  end_date?: string
  page?: number
  page_size?: number
}

export interface ExpenseCreateData {
  category_id: string
  amount: number
  description: string
  receipt?: string
  branch_id?: string
  date: string
}

export const expensesApi = {
  getExpenses: async (params?: ExpenseFilters): Promise<PaginatedResponse<Expense>> => {
    const response = await api.get<PaginatedResponse<Expense>>('/expenses', { params })
    return response.data
  },

  createExpense: async (data: ExpenseCreateData): Promise<Expense> => {
    const response = await api.post<Expense>('/expenses', data)
    return response.data
  },

  updateExpense: async (id: string, data: Partial<ExpenseCreateData>): Promise<Expense> => {
    const response = await api.patch<Expense>(`/expenses/${id}`, data)
    return response.data
  },

  deleteExpense: async (id: string): Promise<void> => {
    await api.delete(`/expenses/${id}`)
  },

  getCategories: async (): Promise<ExpenseCategory[]> => {
    const response = await api.get<ExpenseCategory[]>('/expense-categories')
    return response.data
  },

  createCategory: async (data: {
    name: string
    description?: string
    budget_limit?: number
  }): Promise<ExpenseCategory> => {
    const response = await api.post<ExpenseCategory>('/expense-categories', data)
    return response.data
  },

  updateCategory: async (id: string, data: {
    name?: string
    description?: string
    budget_limit?: number
  }): Promise<ExpenseCategory> => {
    const response = await api.patch<ExpenseCategory>(`/expense-categories/${id}`, data)
    return response.data
  },

  deleteCategory: async (id: string): Promise<void> => {
    await api.delete(`/expenses/${id}`)
  },

  getExpenseCategories: async (): Promise<any[]> => {
    const response = await api.get('/expense-categories/')
    return response.data?.items || response.data || []
  },

  createExpenseCategory: async (data: { name: string; icon: string }): Promise<any> => {
    const response = await api.post('/expense-categories/', data)
    return response.data
  },

  updateExpenseCategory: async (id: string, data: { name: string; icon: string }): Promise<any> => {
    const response = await api.patch(`/expense-categories/${id}/`, data)
    return response.data
  },

  deleteExpenseCategory: async (id: string): Promise<void> => {
    await api.delete(`/expense-categories/${id}/`)
  },
}
