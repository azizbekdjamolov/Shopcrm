import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { ROLE_SIDEBAR_ITEMS } from '@/config/roleRoutes'

const MOBILE_MAX_ITEMS: Record<string, number> = {
  customer: 4,
  courier: 3,
  seller: 2,
}

export function MobileNav() {
  const { t } = useTranslation()
  const { user } = useAuthStore()

  const roleKey = user?.role || 'customer'
  const allItems = ROLE_SIDEBAR_ITEMS[roleKey] || ROLE_SIDEBAR_ITEMS.customer
  const maxItems = MOBILE_MAX_ITEMS[roleKey] ?? 5
  const mobileNavItems = allItems.slice(0, maxItems)

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 lg:hidden">
      <ul className="flex items-center justify-around py-2">
        {mobileNavItems.map((item) => (
          <li key={item.path}>
            <NavLink
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 px-3 py-1 text-xs',
                  isActive
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-gray-500 dark:text-gray-400'
                )
              }
            >
              <item.icon className="h-5 w-5" />
              <span className="truncate">{t(item.translationKey)}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
