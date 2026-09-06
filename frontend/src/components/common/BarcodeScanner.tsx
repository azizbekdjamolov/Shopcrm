import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BarcodeScannerProps {
  open: boolean
  onClose: () => void
  onScan: (code: string) => void | Promise<void>
  title?: string
}

export function BarcodeScanner({ open, onClose, onScan, title }: BarcodeScannerProps) {
  const { t } = useTranslation()
  const scannerRef = useRef<HTMLDivElement>(null)
  const scannerInstanceRef = useRef<any>(null)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!open) return
    setError('')
    let cancelled = false
    const timer = setTimeout(async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode')
        if (cancelled || !scannerRef.current) return
        if (scannerInstanceRef.current) {
          try { await scannerInstanceRef.current.stop() } catch {}
          scannerInstanceRef.current = null
        }
        scannerRef.current.innerHTML = ''
        const scanner = new Html5Qrcode('barcode-scanner-reader')
        scannerInstanceRef.current = scanner
        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 15,
            qrbox: (viewfinderWidth: number) => {
              const w = Math.min(Math.floor(viewfinderWidth * 0.9), 360)
              return { width: w, height: Math.floor(w * 0.36) }
            },
          },
          async (decodedText) => {
            try { await scanner.stop() } catch {}
            scannerInstanceRef.current = null
            onClose()
            await onScan(decodedText)
          },
          () => {
            if (cancelled) return
          }
        )
      } catch (err) {
        if (!cancelled) {
          const msg = (err as any)?.message || ''
          if (msg.includes('NotAllowedError')) {
            setError(t('pos.cameraPermission'))
          } else if (msg.includes('NotReadableError')) {
            setError(t('pos.cameraBusy'))
          } else if (msg.includes('NotFoundError')) {
            setError(t('pos.cameraNotFound'))
          } else {
            setError(t('pos.scannerError'))
          }
        }
      }
    }, 300)
    return () => {
      cancelled = true
      clearTimeout(timer)
      if (scannerInstanceRef.current) {
        try { scannerInstanceRef.current.stop() } catch {}
        scannerInstanceRef.current = null
      }
    }
  }, [open, onClose, onScan, t, attempt])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 dark:text-white">{title || t('pos.scanBarcode')}</h3>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div
          id="barcode-scanner-reader"
          ref={scannerRef}
          className="min-h-[200px] rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800"
        />
        {error ? (
          <div className="mt-3 space-y-2">
            <p className="text-center text-xs text-red-500">{error}</p>
            <Button variant="outline" className="w-full" onClick={() => setAttempt((a) => a + 1)}>
              {t('common.retry')}
            </Button>
          </div>
        ) : (
          <p className="mt-3 text-center text-xs text-gray-500">{t('pos.scannerHint')}</p>
        )}
        <Button variant="outline" className="mt-3 w-full" onClick={onClose}>
          {t('common.cancel')}
        </Button>
      </div>
    </div>
  )
}