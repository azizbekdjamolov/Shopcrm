import { useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/stores/authStore'
import { ROLE_ROUTES } from '@/config/roleRoutes'
import type { LoginRequest, RegisterRequest } from '@/types'
import toast from 'react-hot-toast'

interface AuthResponse {
  user: any
  tokens: any
  business?: { id: string; name: string; slug: string } | null
}

export function useAuth() {
  const { user, isAuthenticated, setAuth, setBusiness, logout: storeLogout, setUser } = useAuthStore()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const { data: currentUser, isLoading: isLoadingUser } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authApi.getMe,
    enabled: isAuthenticated,
    retry: false,
  })

  const loginMutation = useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: async ({ user: userData, tokens, business }: AuthResponse) => {
      setAuth(userData, tokens)
      if (business) setBusiness(business as any)
      queryClient.clear()
      toast.success('Muvaffaqiyatli kirildi')
      const roleKey = userData.role as string
      const redirectPath = ROLE_ROUTES[roleKey] || '/dashboard'
      navigate(redirectPath, { replace: true })
    },
    onError: () => {
      toast.error('Email yoki parol xato')
    },
  })

  const registerMutation = useMutation({
    mutationFn: (data: RegisterRequest) => authApi.register(data),
    onSuccess: async ({ user: userData, tokens, business }: AuthResponse) => {
      setAuth(userData, tokens)
      if (business) setBusiness(business as any)
      queryClient.clear()
      toast.success("Ro'yxatdan muvaffaqiyatli o'tildi")
    },
    onError: () => {
      toast.error("Ro'yxatdan o'tishda xatolik yuz berdi")
    },
  })

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      // ignore
    } finally {
      storeLogout()
      queryClient.clear()
      window.location.href = '/login'
    }
  }, [storeLogout, queryClient])

  const changePasswordMutation = useMutation({
    mutationFn: (data: { old_password: string; new_password: string }) =>
      authApi.changePassword(data),
    onSuccess: () => {
      toast.success('Parol muvaffaqiyatli o\'zgartirildi')
    },
    onError: () => {
      toast.error('Parolni o\'zgartirishda xatolik')
    },
  })

  return {
    user: currentUser || user,
    isAuthenticated,
    isLoadingUser,
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    register: registerMutation.mutate,
    isRegistering: registerMutation.isPending,
    registerError: registerMutation.error,
    logout,
    changePassword: changePasswordMutation.mutate,
    isChangingPassword: changePasswordMutation.isPending,
  }
}
