import { AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

interface ErrorStateProps {
  message?: string
  onRetry?: () => void
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-red-50 p-4 dark:bg-red-900/20">
        <AlertTriangle className="h-8 w-8 text-red-500" />
      </div>
      <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
        {t('errors.genericError')}
      </h3>
      <p className="mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">
        {message || t('errors.tryAgain')}
      </p>
      {onRetry && (
        <Button onClick={onRetry} className="mt-4">
          {t('common.refresh')}
        </Button>
      )}
    </div>
  )
}
