import { useTranslation } from 'react-i18next'
import { AlertTriangle } from 'lucide-react'
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  variant?: 'destructive' | 'default'
  loading?: boolean
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  variant = 'destructive',
  loading,
}: ConfirmDialogProps) {
  const { t } = useTranslation()

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader onClose={onClose}>
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-red-100 p-2 dark:bg-red-900/30">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
          <DialogTitle>{title || t('common.areYouSure')}</DialogTitle>
        </div>
      </DialogHeader>
      <DialogContent>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {message || t('common.deleteMessage')}
        </p>
      </DialogContent>
      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={loading}>
          {cancelText || t('common.cancel')}
        </Button>
        <Button
          variant={variant === 'destructive' ? 'destructive' : 'default'}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? t('common.processing') : confirmText || t('common.confirm')}
        </Button>
      </DialogFooter>
    </Dialog>
  )
}
