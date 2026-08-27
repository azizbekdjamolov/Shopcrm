import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="text-center">
        <p className="text-6xl font-bold text-gray-200 dark:text-gray-800">404</p>
        <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">{t('errors.notFound')}</h1>
        <p className="mt-2 text-gray-500">{t('errors.notFoundDesc')}</p>
        <Link to="/" className="mt-6 inline-block">
          <Button>
            <Home className="mr-2 h-4 w-4" />{t('common.goHome')}
          </Button>
        </Link>
      </div>
    </div>
  )
}
