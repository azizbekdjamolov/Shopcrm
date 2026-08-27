import axios, { type InternalAxiosRequestConfig, type AxiosError } from 'axios'
import type { AuthTokens, ErrorResponse } from '@/types'

const API_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

let isRefreshing = false
let failedQueue: Array<{
  resolve: (value: unknown) => void
  reject: (reason?: unknown) => void
}> = []

const processQueue = (error: unknown, token: string | null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const stored = localStorage.getItem('auth-storage')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        const tokens: AuthTokens | undefined = parsed.state?.tokens
        if (tokens?.access_token) {
          config.headers.Authorization = `Bearer ${tokens.access_token}`
        }
        const business = parsed.state?.business
        if (business?.id) {
          config.headers['X-Business-ID'] = business.id
        }
      } catch {
        // ignore
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => {
    const data = response.data
    if (data && typeof data === 'object' && 'error' in data && 'data' in data && data.error === false) {
      response.data = data.data
    }
    if (data && typeof data === 'object' && 'results' in data && 'count' in data) {
      response.data = {
        ...data,
        items: data.results,
        total: data.count,
        total_pages: data.page_size ? Math.ceil(data.count / data.page_size) : Math.ceil(data.count / 20),
      }
    }
    return response
  },
  async (error: AxiosError<ErrorResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`
            }
            return api(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const stored = localStorage.getItem('auth-storage')
        if (stored) {
          const parsed = JSON.parse(stored)
          const tokens: AuthTokens | undefined = parsed.state?.tokens
          if (tokens?.refresh_token) {
            const { data } = await axios.post<{ access: string; refresh?: string }>(`${API_URL}/auth/refresh/`, {
              refresh: tokens.refresh_token,
            })
            const newTokens: AuthTokens = {
              access_token: data.access,
              refresh_token: data.refresh || tokens.refresh_token,
              token_type: 'bearer',
              expires_in: 3600,
            }
            const updatedStored = JSON.parse(stored)
            updatedStored.state.tokens = newTokens
            localStorage.setItem('auth-storage', JSON.stringify(updatedStored))
            processQueue(null, newTokens.access_token)
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newTokens.access_token}`
            }
            return api(originalRequest)
          }
        }
      } catch (refreshError) {
        processQueue(refreshError, null)
        localStorage.removeItem('auth-storage')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default api
