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

async function stopScannerInstance(instance: any) {
  if (!instance) return
  try { await instance.stop() } catch {}
  try { instance.clear() } catch {}
}

function formatErrorText(t: (key: string) => string, err: unknown) {
  const msg = (err as any)?.message || (err as any)?.name || ''
  if (msg.includes('NotAllowedError') || msg.includes('Permission') || msg.includes('permission')) {
    return t('pos.cameraPermission')
  }
  if (msg.includes('NotReadableError') || msg.includes('in use') || msg.includes('busy')) {
    return t('pos.cameraBusy')
  }
  if (msg.includes('NotFoundError') || msg.includes('no camera') || msg.includes('No camera')) {
    return t('pos.cameraNotFound')
  }
  if (msg.includes('OverconstrainedError') || msg.includes('constraint')) {
    return t('pos.cameraNotFound')
  }
  return t('pos.scannerError')
}

export function BarcodeScanner({ open, onClose, onScan, title }: BarcodeScannerProps) {
  const { t } = useTranslation()
  const scannerRef = useRef<HTMLDivElement>(null)
  const instanceRef = useRef<any>(null)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const startingRef = useRef(false)

  useEffect(() => {
    if (!open) return
    setError('')
    let cancelled = false

    const onSuccess = async (decodedText: string) => {
      await stopScannerInstance(instanceRef.current)
      instanceRef.current = null
      if (!cancelled) {
        onClose()
        await onScan(decodedText)
      }
    }

    const qrbox = (viewfinderWidth: number, viewfinderHeight: number) => {
      const w = Math.min(Math.floor(viewfinderWidth * 0.9), 360)
      return { width: w, height: Math.floor(w * 0.36) }
    }

    const tryStart = async (mod: any) => {
      const el = document.getElementById('barcode-scanner-reader')
      if (!el) return
      el.innerHTML = ''
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = mod
      const scanConfigs = [
        {
          verbose: false,
          useBarCodeDetectorIfSupported: true,
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.CODE_93,
            Html5QrcodeSupportedFormats.ITF,
            Html5QrcodeSupportedFormats.CODABAR,
          ],
        },
        undefined,
      ]
      let started = false
      let lastErr: unknown = null
      for (const cfg of scanConfigs) {
        if (document.getElementById('barcode-scanner-reader')?.childElementCount) break
        const scanner = new Html5Qrcode('barcode-scanner-reader', cfg)
        instanceRef.current = scanner
        try {
          await scanner.start(
            { facingMode: 'environment' },
            { fps: 12, qrbox },
            onSuccess,
            () => {}
          )
          started = true
          break
        } catch (err) {
          lastErr = err
          try { await stopScannerInstance(scanner) } catch {}
          instanceRef.current = null
          el.innerHTML = ''
        }
      }
      if (!started) throw lastErr || new Error('start failed')
    }

    const timer = setTimeout(async () => {
      if (startingRef.current) return
      startingRef.current = true
      try {
        const mod = await import('html5-qrcode')
        try {
          await tryStart(mod)
        } catch (err) {
          if (cancelled || !scannerRef.current) return
          try { await stopScannerInstance(instanceRef.current) } catch {}
          instanceRef.current = null
          if (scannerRef.current) scannerRef.current.innerHTML = ''
          setError(formatErrorText(t, err))
        }
      } catch (err) {
        if (!cancelled) setError(formatErrorText(t, err))
      } finally {
        startingRef.current = false
      }
    }, 300)

    return () => {
      cancelled = true
      clearTimeout(timer)
      if (instanceRef.current) {
        void stopScannerInstance(instanceRef.current)
        instanceRef.current = null
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