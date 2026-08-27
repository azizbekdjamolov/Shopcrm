import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { User, Mail, Phone, MapPin, Save, Send, Link2, Unlink, Globe, Sun, Moon, Monitor } from 'lucide-react'
import api from '@/api/client'
import { useAuthStore } from '@/stores/authStore'
import { useThemeStore } from '@/stores/themeStore'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'

export function CustomerProfilePage() {
  const { t, i18n } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const { theme, setTheme } = useThemeStore()
  const [form, setForm] = useState({
    first_name: user?.full_name?.split(' ')[0] || '',
    last_name: user?.full_name?.split(' ').slice(1).join(' ') || '',
    phone: user?.phone || '',
    address: (user as any)?.address || '',
  })
  const [telegramInput, setTelegramInput] = useState('')

  const currentLang = i18n.language?.split('-')[0] || 'uz'

  const LANGUAGES = [
    { code: 'uz', label: "O'zbek", flag: '🇺🇿' },
    { code: 'ru', label: 'Русский', flag: '🇷🇺' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
  ]

  const THEMES = [
    { value: 'light', label: t('settings.lightMode', 'Light'), icon: Sun },
    { value: 'dark', label: t('settings.darkMode', 'Dark'), icon: Moon },
    { value: 'system', label: t('settings.systemMode', 'System'), icon: Monitor },
  ]

  const updateMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const response = await api.patch('/auth/me/', data)
      return response.data
    },
    onSuccess: (data) => {
      if (data) setUser(data)
      toast.success(t('common.success'))
    },
  })

  const telegramMutation = useMutation({
    mutationFn: async (data: { telegram_username?: string; action: 'connect' | 'disconnect' }) => {
      if (data.action === 'connect') {
        const res = await api.post('/auth/telegram/connect/', { telegram_username: data.telegram_username })
        return res.data
      } else {
        await api.delete('/auth/telegram/connect/')
        return { telegram_username: '' }
      }
    },
    onSuccess: (data) => {
      if (user) setUser({ ...user, telegram_username: data.telegram_username } as any)
      toast.success(t('common.success'))
      setTelegramInput('')
    },
  })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="bg-white shadow-sm dark:bg-gray-900">
        <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('profile.title', 'Profile')}</h1>
        </div>
      </div>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {t('profile.personalInfo', 'Personal Information')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label={t('auth.firstName', 'First Name')} value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
              <Input label={t('auth.lastName', 'Last Name')} value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
              <Input label={t('auth.phone', 'Phone')} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <Input label={t('profile.address', 'Address')} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button onClick={() => updateMutation.mutate(form)} disabled={updateMutation.isPending}>
              <Save className="mr-2 h-4 w-4" />
              {updateMutation.isPending ? t('common.processing') : t('common.save')}
            </Button>
          </CardFooter>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              {t('profile.account', 'Account')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">{t('auth.email')}</span>
                <span className="font-medium text-gray-900 dark:text-white">{user?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t('profile.role')}</span>
                <span className="capitalize text-gray-900 dark:text-white">{user?.role}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              {t('settings.language', 'Language')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    i18n.changeLanguage(lang.code)
                    api.patch('/auth/me/', { preferred_language: lang.code }).catch(() => {})
                    toast.success(`${lang.flag} ${lang.label}`)
                  }}
                  className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                    currentLang === lang.code
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10'
                      : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                  }`}
                >
                  <span className="text-3xl">{lang.flag}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{lang.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              {t('settings.theme', 'Theme')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {THEMES.map((t_) => {
                const Icon = t_.icon
                return (
                  <button
                    key={t_.value}
                    type="button"
                    onClick={() => setTheme(t_.value as any)}
                    className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                      theme === t_.value
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10'
                        : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                    }`}
                  >
                    <Icon className="h-6 w-6 text-gray-700 dark:text-gray-300" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{t_.label}</span>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              {t('profile.telegram', 'Telegram')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {user?.telegram_username ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-gray-900 dark:text-white">@{user.telegram_username}</span>
                </div>
                <Button variant="outline" size="sm" onClick={() => telegramMutation.mutate({ action: 'disconnect' })}>
                  <Unlink className="mr-1 h-3 w-3" />
                  {t('profile.disconnect', 'Disconnect')}
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Input
                  placeholder="@username"
                  value={telegramInput}
                  onChange={(e) => setTelegramInput(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={() => telegramMutation.mutate({ telegram_username: telegramInput, action: 'connect' })} disabled={!telegramInput.trim() || telegramMutation.isPending}>
                  <Link2 className="mr-1 h-3 w-3" />
                  {t('profile.connect', 'Connect')}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
