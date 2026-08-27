import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { ROLE_ROUTES } from '@/config/roleRoutes'

export function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const user = useAuthStore((s) => s.user)

  if (isAuthenticated && user?.role) {
    const home = ROLE_ROUTES[user.role] || '/stores'
    return <Navigate to={home} replace />
  }

  return <>{children}</>
}
