import { useTranslation } from 'react-i18next'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LogOut,
  ChevronLeft,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { useSidebarStore } from '@/stores/sidebarStore'
import { ROLE_SIDEBAR_ITEMS } from '@/config/roleRoutes'
import { Avatar } from '@/components/ui/avatar'

export function Sidebar() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { isOpen, isMobile, mobileOpen, toggle, closeMobile } = useSidebarStore()

  const roleKey = user?.role || 'customer'
  const navItems = ROLE_SIDEBAR_ITEMS[roleKey] || ROLE_SIDEBAR_ITEMS.customer

  const handleLogout = async () => {
    await logout()
  }

  const shown = isMobile ? mobileOpen : isOpen

  return (
    <>
      {isMobile && mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex flex-col border-r border-gray-200 bg-white transition-all duration-300 dark:border-gray-700 dark:bg-gray-900',
          isMobile
            ? shown
              ? 'w-64'
              : 'w-0 border-r-0'
            : shown
              ? 'w-64'
              : 'w-20'
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-700">
          {shown && (
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white font-bold text-sm">
                B
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-white">Business OS</span>
            </div>
          )}
          <button
            onClick={toggle}
            className="hidden lg:flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ChevronLeft className={cn('h-5 w-5 text-gray-500 transition-transform', shown && 'rotate-180')} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 scrollbar-hide">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  onClick={() => { if (isMobile) closeMobile() }}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100'
                    )
                  }
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {shown && <span className="truncate">{t(item.translationKey)}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-gray-200 p-4 dark:border-gray-700">
          {shown ? (
            <div className="flex items-center gap-3">
              <Avatar
                src={user?.avatar}
                fallback={user?.full_name}
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user?.full_name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user?.email}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-500 dark:hover:bg-gray-800"
                title={t('auth.logout')}
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-red-500 dark:hover:bg-gray-800"
              title={t('auth.logout')}
            >
              <LogOut className="h-5 w-5" />
            </button>
          )}
        </div>
      </aside>
    </>
  )
}
