import { useAuthStore } from '@/stores/authStore'
import type { UserRoleType } from '@/types'

export function usePermission() {
  const { user, hasRole } = useAuthStore()

  const hasPermission = (roles: UserRoleType | UserRoleType[]) => {
    return hasRole(roles)
  }

  const isPlatformAdmin = hasRole('platform_admin')
  const isBusinessOwner = hasRole('owner')
  const isManager = hasRole(['owner', 'admin', 'manager'])
  const isSeller = hasRole(['owner', 'admin', 'manager', 'seller'])
  const isWarehouse = hasRole(['owner', 'admin', 'manager'])
  const isCourier = hasRole('courier')
  const isAccountant = hasRole(['owner', 'admin', 'manager'])

  return {
    user,
    hasPermission,
    isPlatformAdmin,
    isBusinessOwner,
    isManager,
    isSeller,
    isWarehouse,
    isCourier,
    isAccountant,
  }
}
