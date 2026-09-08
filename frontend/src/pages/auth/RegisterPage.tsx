import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { authApi } from '@/api/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import toast from 'react-hot-toast'

export function RegisterPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { register, isRegistering } = useAuth()
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    password_confirm: '',
    verification_code: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [codeSent, setCodeSent] = useState(false)
  const [codeVerified, setCodeVerified] = useState(false)

  const currentLang = i18n.language?.split('-')[0] || 'uz'
  const LANGUAGES = [
    { code: 'uz', label: "O'zbek", flag: '🇺🇿' },
    { code: 'ru', label: 'Русский', flag: '🇷🇺' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
  ]

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  const sendCodeMutation = useMutation({
    mutationFn: () => authApi.sendVerificationCode(form.email.trim()),
    onSuccess: () => {
      setCodeSent(true)
      toast.success(t('auth.codeSent', 'Emailga tasdiqlash kodi yuborildi'))
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || t('common.error'))
    },
  })

  const verifyCodeMutation = useMutation({
    mutationFn: () => authApi.verifyVerificationCode(form.email.trim(), form.verification_code.trim()),
    onSuccess: (verified) => {
      if (verified) {
        setCodeVerified(true)
        toast.success(t('auth.codeVerified', 'Kod tasdiqlandi'))
      } else {
        toast.error(t('errors.invalidCode', "Kod noto'g'ri yoki muddati o'tgan"))
      }
    },
    onError: () => toast.error(t('errors.invalidCode', "Kod noto'g'ri yoki muddati o'tgan")),
  })

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!form.first_name.trim()) newErrors.first_name = t('errors.required')
    if (!form.email.trim()) newErrors.email = t('errors.required')
    else if (!emailRegex.test(form.email)) newErrors.email = t('errors.emailInvalid')
    if (!form.password) newErrors.password = t('errors.required')
    if (form.password.length < 8) newErrors.password = t('errors.passwordTooShort')
    if (form.password !== form.password_confirm) newErrors.password_confirm = t('errors.passwordMismatch')
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSendCode = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!validate()) return
    sendCodeMutation.mutate()
  }

  const handleVerifyCode = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!form.verification_code.trim()) {
      toast.error(t('errors.required'))
      return
    }
    verifyCodeMutation.mutate()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    if (!codeSent) {
      toast.error(t('auth.sendCodeFirst', 'Avval emailga kod yuboring'))
      return
    }
    if (!codeVerified) {
      toast.error(t('auth.verifyCodeFirst', "Avval kodni tasdiqlang"))
      return
    }
    register(
      {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        business_name: '',
        password: form.password,
        password_confirm: form.password_confirm,
        verification_code: form.verification_code.trim(),
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
              label={t('auth.email')}
              type="email"
              value={form.email}
              onChange={handleChange('email')}
              error={errors.email}
            />
            <div className="grid grid-cols-2 gap-3">
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
            </div>
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

            {!codeSent ? (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleSendCode}
                disabled={sendCodeMutation.isPending}
              >
                {sendCodeMutation.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('auth.sending')}</>
                ) : (
                  t('auth.sendCode')
                )}
              </Button>
            ) : (
              <div className="space-y-3 rounded-lg border border-sky-200 bg-sky-50 p-4 dark:border-sky-900 dark:bg-sky-950/20">
                <p className="text-sm text-sky-800 dark:text-sky-200">
                  {t('auth.codeSentHint', "Emailga yuborilgan 6 xonali kodni kiriting")}: <span className="font-semibold">{form.email}</span>
                </p>
                <Input
                  label={t('auth.verificationCode')}
                  placeholder="000000"
                  maxLength={6}
                  inputMode="numeric"
                  value={form.verification_code}
                  onChange={handleChange('verification_code')}
                  error={errors.verification_code}
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    className="flex-1"
                    variant="default"
                    onClick={handleVerifyCode}
                    disabled={verifyCodeMutation.isPending}
                  >
                    {verifyCodeMutation.isPending ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('auth.verifying')}</>
                    ) : (
                      t('auth.verifyCode')
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => sendCodeMutation.mutate()}
                    disabled={sendCodeMutation.isPending}
                  >
                    {t('auth.resendCode')}
                  </Button>
                </div>
                {codeVerified && (
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">
                    ✓ {t('auth.codeVerified', 'Kod tasdiqlandi')}
                  </p>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isRegistering || !codeVerified}>
              {isRegistering ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('auth.registering')}</>
              ) : (
                t('auth.registerButton')
              )}
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