import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { ROLE_ROUTES } from '@/config/roleRoutes'
import type { UserRoleType } from '@/types'

interface ProtectedRouteProps {
  children: React.ReactNode
  roles?: UserRoleType[]
}

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (roles && user && !roles.includes(user.role)) {
    const homeRoute = ROLE_ROUTES[user.role] || '/dashboard'
    return <Navigate to={homeRoute} replace />
  }

  return <>{children}</>
}
