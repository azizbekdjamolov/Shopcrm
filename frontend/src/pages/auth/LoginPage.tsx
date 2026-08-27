import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'

export function LoginPage() {
  const { t, i18n } = useTranslation()
  const { login, isLoggingIn } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

  const currentLang = i18n.language?.split('-')[0] || 'uz'
  const LANGUAGES = [
    { code: 'uz', label: "O'zbek", flag: '🇺🇿' },
    { code: 'ru', label: 'Русский', flag: '🇷🇺' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
  ]

  const validate = () => {
    const newErrors: typeof errors = {}
    if (!form.email) newErrors.email = t('errors.required')
    if (!form.password) newErrors.password = t('errors.required')
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    login(form)
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex justify-center gap-2">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            type="button"
            onClick={() => i18n.changeLanguage(lang.code)}
            className={`flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm transition-all ${
              currentLang === lang.code
                ? 'border-primary-500 bg-primary-50 font-medium dark:bg-primary-900/10'
                : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
            }`}
          >
            <span>{lang.flag}</span>
            <span className="text-gray-900 dark:text-white">{lang.label}</span>
          </button>
        ))}
      </div>

      <Card className="w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-white font-bold text-lg">
            B
          </div>
          <CardTitle className="text-2xl">{t('auth.loginTitle')}</CardTitle>
          <CardDescription>{t('auth.loginSubtitle')}</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <Input
              label={t('auth.email')}
              type="email"
              placeholder={t('auth.enterEmail')}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              error={errors.email}
            />
            <Input
              label={t('auth.password')}
              type="password"
              placeholder={t('auth.enterPassword')}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              error={errors.password}
            />
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoggingIn}>
              {isLoggingIn ? t('auth.loggingIn') : t('auth.loginButton')}
            </Button>
            <p className="text-sm text-center text-gray-500 dark:text-gray-400">
              {t('auth.noAccount')}{' '}
              <Link to="/register" className="text-primary-600 hover:underline dark:text-primary-400">
                {t('auth.registerHere')}
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
