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
        const scanner = new Html5Qrcode('barcode-scanner-reader')
        scannerInstanceRef.current = scanner
        await scanner.start(
          { facingMode: 'environment', aspectRatio: 1.777777778 },
          {
            fps: 20,
            qrbox: { width: 500, height: 180 },
            aspectRatio: 1.777777778,
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
      } catch {
        if (!cancelled) setError(t('pos.scannerError'))
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
  }, [open, onClose, onScan, t])

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
        <div id="barcode-scanner-reader" ref={scannerRef} className="rounded-xl overflow-hidden" />
        {error && <p className="mt-3 text-center text-xs text-red-500">{error}</p>}
        <p className="mt-3 text-center text-xs text-gray-500">{t('pos.scannerHint')}</p>
        <Button variant="outline" className="mt-3 w-full" onClick={onClose}>
          {t('common.cancel')}
        </Button>
      </div>
    </div>
  )
}