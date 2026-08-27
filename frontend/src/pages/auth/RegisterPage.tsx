import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'

export function RegisterPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { register, isRegistering } = useAuth()
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    password_confirm: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const currentLang = i18n.language?.split('-')[0] || 'uz'
  const LANGUAGES = [
    { code: 'uz', label: "O'zbek", flag: '🇺🇿' },
    { code: 'ru', label: 'Русский', flag: '🇷🇺' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
  ]

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!form.first_name) newErrors.first_name = t('errors.required')
    if (!form.email) newErrors.email = t('errors.required')
    if (!form.password) newErrors.password = t('errors.required')
    if (form.password.length < 8) newErrors.password = t('errors.passwordTooShort')
    if (form.password !== form.password_confirm) newErrors.password_confirm = t('errors.passwordMismatch')
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    register(
      {
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        phone: form.phone,
        business_name: '',
        password: form.password,
        password_confirm: form.password_confirm,
      },
      { onSuccess: () => navigate('/stores') }
    )
  }

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [field]: e.target.value })
    if (errors[field]) setErrors({ ...errors, [field]: '' })
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
          <CardTitle className="text-2xl">{t('auth.registerTitle')}</CardTitle>
          <CardDescription>{t('auth.registerSubtitle')}</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <Input
              label={t('auth.firstName')}
              value={form.first_name}
              onChange={handleChange('first_name')}
              error={errors.first_name}
            />
            <Input
              label={t('auth.lastName')}
              value={form.last_name}
              onChange={handleChange('last_name')}
            />
            <Input
              label={t('auth.email')}
              type="email"
              value={form.email}
              onChange={handleChange('email')}
              error={errors.email}
            />
            <Input
              label={t('auth.phone')}
              value={form.phone}
              onChange={handleChange('phone')}
            />
            <Input
              label={t('auth.password')}
              type="password"
              value={form.password}
              onChange={handleChange('password')}
              error={errors.password}
            />
            <Input
              label={t('auth.confirmPassword')}
              type="password"
              value={form.password_confirm}
              onChange={handleChange('password_confirm')}
              error={errors.password_confirm}
            />
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isRegistering}>
              {isRegistering ? t('auth.registering') : t('auth.registerButton')}
            </Button>
            <p className="text-sm text-center text-gray-500 dark:text-gray-400">
              {t('auth.hasAccount')}{' '}
              <Link to="/login" className="text-primary-600 hover:underline dark:text-primary-400">
                {t('auth.loginHere')}
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
