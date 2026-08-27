import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DialogProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  className?: string
}

function Dialog({ open, onClose, children, className }: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open && !dialog.open) {
      dialog.showModal()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className={cn(
        'backdrop:bg-black/50 rounded-xl border border-gray-200 bg-white p-0 shadow-xl dark:border-gray-700 dark:bg-gray-900 max-w-lg w-full',
        className
      )}
    >
      <div className="relative">{children}</div>
    </dialog>
  )
}

function DialogHeader({
  className,
  onClose,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { onClose?: () => void }) {
  return (
    <div
      className={cn('flex items-center justify-between p-6 pb-0', className)}
      {...props}
    >
      <div>{children}</div>
      {onClose && (
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-300"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  )
}

function DialogTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn('text-lg font-semibold text-gray-900 dark:text-gray-100', className)}
      {...props}
    />
  )
}

function DialogContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('p-6', className)} {...props} />
  )
}

function DialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex justify-end gap-3 p-6 pt-0', className)}
      {...props}
    />
  )
}

export { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter }
