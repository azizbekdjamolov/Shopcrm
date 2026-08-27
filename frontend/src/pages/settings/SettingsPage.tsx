import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Settings as SettingsIcon, Building2, Loader2 } from 'lucide-react'
import { useThemeStore } from '@/stores/themeStore'
import { useAuthStore } from '@/stores/authStore'
import { businessesApi } from '@/api/businesses'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import toast from 'react-hot-toast'

export function SettingsPage() {
  const { t, i18n } = useTranslation()
  const { theme, toggleTheme } = useThemeStore()
  const { user, business } = useAuthStore()
  const queryClient = useQueryClient()
  const [businessName, setBusinessName] = useState(business?.name || '')
  const [businessPhone, setBusinessPhone] = useState(business?.phone || '')

  const updateMutation = useMutation({
    mutationFn: () => businessesApi.updateBusiness(business?.id || '', { name: businessName, phone: businessPhone }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business'] })
      toast.success(t('settings.settingsSaved'))
    },
    onError: () => toast.error(t('common.error')),
  })

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader title={t('settings.title')} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            {t('settings.generalSettings')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{t('settings.language')}</p>
              <p className="text-sm text-gray-500">Uzbek, Russian, English</p>
            </div>
            <div className="flex gap-1">
              {[
                { code: 'uz', label: "O'z" },
                { code: 'ru', label: 'Ру' },
                { code: 'en', label: 'En' },
              ].map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => i18n.changeLanguage(lang.code)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${i18n.language === lang.code ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'}`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{t('settings.theme')}</p>
              <p className="text-sm text-gray-500">{theme === 'dark' ? t('settings.darkMode') : theme === 'light' ? t('settings.lightMode') : t('settings.systemMode')}</p>
            </div>
            <Button variant="outline" onClick={toggleTheme}>
              {theme === 'dark' ? t('settings.lightMode') : t('settings.darkMode')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {t('settings.businessSettings')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input label={t('settings.businessName')} value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
          <Input label={t('settings.businessPhone')} value={businessPhone} onChange={(e) => setBusinessPhone(e.target.value)} />
          <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {updateMutation.isPending ? t('common.processing') : t('settings.saveSettings')}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.profile')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-500">{t('auth.fullName')}</span>
            <span className="font-medium text-gray-900 dark:text-white">{user?.full_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">{t('auth.email')}</span>
            <span className="font-medium text-gray-900 dark:text-white">{user?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">{t('auth.phone')}</span>
            <span className="font-medium text-gray-900 dark:text-white">{user?.phone}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">{t('common.status')}</span>
            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">{t('common.active')}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
