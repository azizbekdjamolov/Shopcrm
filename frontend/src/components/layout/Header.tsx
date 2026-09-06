import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  Menu,
  Search,
  Bell,
  Sun,
  Moon,
  Crown,
  ChevronDown,
  LogOut,
  Settings,
  User,
  Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { useThemeStore } from '@/stores/themeStore'
import { useSidebarStore } from '@/stores/sidebarStore'
import { useNotificationStore } from '@/stores/notificationStore'
import { Avatar } from '@/components/ui/avatar'

export function Header() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { resolved, toggleTheme } = useThemeStore()
  const { toggleMobile } = useSidebarStore()
  const { unreadCount } = useNotificationStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [langOpen, setLangOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const langRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  const languages = [
    { code: 'uz', label: "O'zbek", flag: '\u{1F1FA}\u{1F1FF}' },
    { code: 'ru', label: 'Русский', flag: '\u{1F1F7}\u{1F1FA}' },
    { code: 'en', label: 'English', flag: '\u{1F1EC}\u{1F1E7}' },
  ]

  const currentLang = languages.find((l) => l.code === i18n.language) || languages[0]

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false)
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false)
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`)
    }
  }

  const handleLogout = async () => {
    await logout()
  }

  const initials = user?.full_name
    ? user.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() || 'U'

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center border-b border-gray-200 bg-white px-4 dark:border-gray-700 dark:bg-gray-900">
      <button
        onClick={toggleMobile}
        className="mr-3 rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden dark:hover:bg-gray-800"
      >
        <Menu className="h-5 w-5" />
      </button>

      <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-sm">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={t('common.search') + '...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          />
        </div>
      </form>

      <div className="ml-auto flex items-center gap-1">
        <div className="relative" ref={langRef}>
          <button
            onClick={() => { setLangOpen(!langOpen); setProfileOpen(false); setNotifOpen(false) }}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <span className="text-base leading-none">{currentLang.flag}</span>
            <span className="hidden sm:inline text-xs font-medium">{currentLang.label}</span>
            <ChevronDown className="h-3 w-3 text-gray-400" />
          </button>
          {langOpen && (
            <div className="absolute right-0 top-full mt-1 w-40 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => { i18n.changeLanguage(lang.code); setLangOpen(false) }}
                  className={cn(
                    'flex w-full items-center gap-2.5 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700',
                    i18n.language === lang.code && 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300'
                  )}
                >
                  <span className="text-base leading-none">{lang.flag}</span>
                  <span>{lang.label}</span>
                  {i18n.language === lang.code && <Check className="ml-auto h-3.5 w-3.5" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={toggleTheme}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400"
          title={resolved === 'dark' ? t('settings.lightMode') : resolved === 'luxury' ? t('settings.luxuryMode') : t('settings.darkMode')}
        >
          {resolved === 'dark' ? <Sun className="h-4 w-4" /> : resolved === 'luxury' ? <Crown className="h-4 w-4 text-yellow-500" /> : <Moon className="h-4 w-4" />}
        </button>

        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setNotifOpen(!notifOpen); setLangOpen(false); setProfileOpen(false) }}
            className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-full mt-1 w-72 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
              <div className="border-b border-gray-100 px-4 py-2.5 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{t('notifications.title')}</p>
              </div>
              <div className="p-4 text-center">
                <Bell className="mx-auto h-8 w-8 text-gray-300 dark:text-gray-600" />
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{t('notifications.noNotifications')}</p>
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={profileRef}>
          <button
            onClick={() => { setProfileOpen(!profileOpen); setLangOpen(false); setNotifOpen(false) }}
            className="flex items-center gap-2 rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
              {user?.avatar ? (
                <Avatar src={user.avatar} size="sm" />
              ) : (
                initials
              )}
            </div>
            <ChevronDown className="hidden sm:block h-3 w-3 text-gray-500" />
          </button>
          {profileOpen && (
            <div className="absolute right-0 top-full mt-1 w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
              <div className="border-b border-gray-100 px-4 py-2.5 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.full_name || user?.email}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
              </div>
              <button
                onClick={() => { navigate('/settings'); setProfileOpen(false) }}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <User className="h-4 w-4" />
                {t('settings.profile')}
              </button>
              <button
                onClick={() => { navigate('/settings'); setProfileOpen(false) }}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <Settings className="h-4 w-4" />
                {t('settings.title')}
              </button>
              <div className="my-1 border-t border-gray-100 dark:border-gray-700" />
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                <LogOut className="h-4 w-4" />
                {t('auth.logout')}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
