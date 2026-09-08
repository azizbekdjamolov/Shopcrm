import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flashlight, X } from 'lucide-react'
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

const BARCODE_FORMATS = [
  'ean_13',
  'ean_8',
  'upc_a',
  'upc_e',
  'code_128',
  'code_39',
  'code_93',
  'itf',
  'codabar',
  'qr_code',
]

interface NativeScannerResult {
  stream: MediaStream
  video: HTMLVideoElement
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  detector: any
  track: MediaStreamTrack
}

export function BarcodeScanner({ open, onClose, onScan, title }: BarcodeScannerProps) {
  const { t } = useTranslation()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const scannerRef = useRef<HTMLDivElement>(null)
  const fallbackInstanceRef = useRef<any>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<number | null>(null)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [torchOn, setTorchOn] = useState(false)
  const [torchSupported, setTorchSupported] = useState(false)
  const torchOnRef = useRef(false)

  const setTorch = async (next: boolean) => {
    const track = streamRef.current?.getVideoTracks()?.[0]
    if (!track) return
    try {
      const constraints: any = { advanced: [{ torch: next }] }
      await track.applyConstraints(constraints as MediaTrackConstraints)
      torchOnRef.current = next
      setTorchOn(next)
      setTorchSupported(true)
    } catch {
      /* torch unsupported on this device */
    }
  }

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((tr) => tr.stop())
      streamRef.current = null
    }
    if (timerRef.current !== null) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (fallbackInstanceRef.current) {
      void stopScannerInstance(fallbackInstanceRef.current)
      fallbackInstanceRef.current = null
    }
    const el = document.getElementById('barcode-scanner-reader')
    if (el) el.innerHTML = ''
  }

  useEffect(() => {
    if (!open) return
    setError('')
    let cancelled = false

    const onSuccess = async (decodedText: string) => {
      if (cancelled) return
      onClose()
      await onScan(decodedText)
    }

    const runNative = async (): Promise<NativeScannerResult | null> => {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      })
      const video = document.createElement('video')
      video.setAttribute('autoplay', 'true')
      video.setAttribute('muted', 'true')
      video.setAttribute('playsinline', 'true')
      video.style.width = '100%'
      video.style.height = '100%'
      video.style.objectFit = 'cover'
      const holder = document.getElementById('barcode-scanner-reader')
      if (!holder) { stream.getTracks().forEach((tr) => tr.stop()); return null }
      holder.appendChild(video)
      const canvas = document.createElement('canvas')
      canvas.style.display = 'none'
      holder.appendChild(canvas)
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) { stream.getTracks().forEach((tr) => tr.stop()); return null }
      video.srcObject = stream
      await new Promise<void>((resolve, reject) => {
        const onPlaying = () => { video.removeEventListener('playing', onPlaying); resolve() }
        video.addEventListener('playing', onPlaying)
        video.onerror = () => reject(new Error('video error'))
        void video.play().catch(reject)
        setTimeout(() => resolve(), 1500)
      })
      const detector = new (window as any).BarcodeDetector({ formats: BARCODE_FORMATS })
      return { stream, video, canvas, ctx, detector, track: stream.getVideoTracks()[0] }
    }

    const startNativeScanning = async (result: NativeScannerResult) => {
      const { video, canvas, ctx, detector } = result
      timerRef.current = window.setInterval(async () => {
        if (cancelled) return
        if (video.readyState < 2) return
        if (canvas.width !== video.videoWidth) canvas.width = video.videoWidth
        if (canvas.height !== video.videoHeight) canvas.height = video.videoHeight
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        try {
          const barcodes = await detector.detect(canvas)
          if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
            onSuccess(String(barcodes[0].rawValue).trim())
          }
        } catch { /* frame error, keep scanning */ }
      }, 80)
    }

    const tryStartHtml5Qrcode = async () => {
      const el = document.getElementById('barcode-scanner-reader')
      if (!el) return
      el.innerHTML = ''
      const mod = await import('html5-qrcode')
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = mod
      const scanner = new Html5Qrcode('barcode-scanner-reader', {
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
          Html5QrcodeSupportedFormats.QR_CODE,
        ],
      })
      fallbackInstanceRef.current = scanner
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 20 },
        onSuccess,
        () => {}
      )
    }

    const start = async () => {
      try {
        if ('BarcodeDetector' in window) {
          try {
            const result = await runNative()
            if (result) {
              streamRef.current = result.stream
              await startNativeScanning(result)
              await setTorch(true)
              return
            }
          } catch {
            if (cancelled) return
            stopStream()
          }
        }
        await tryStartHtml5Qrcode()
      } catch (err) {
        if (!cancelled) {
          stopStream()
          setError(formatErrorText(t, err))
        }
      }
    }

    stopStream()
    void start()

    return () => {
      cancelled = true
      stopStream()
    }
  }, [open, onClose, onScan, t, attempt])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 dark:text-white">{title || t('pos.scanBarcode')}</h3>
          <div className="flex items-center gap-2">
            {torchSupported && (
              <button
                onClick={() => setTorch(!torchOn)}
                title={t('pos.torch')}
                className={`rounded-lg p-1.5 ${
                  torchOn
                    ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'
                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Flashlight className="h-5 w-5" />
              </button>
            )}
            <button onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-800">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div
          id="barcode-scanner-reader"
          ref={scannerRef}
          className="relative min-h-[200px] rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800"
        >
          <canvas ref={canvasRef} className="hidden" />
          {!error && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="relative h-24 w-56 max-w-[80%]">
                <span className="absolute -left-0 -top-0 h-6 w-6 rounded-tl-md border-l-2 border-t-2 border-emerald-400" />
                <span className="absolute -right-0 -top-0 h-6 w-6 rounded-tr-md border-r-2 border-t-2 border-emerald-400" />
                <span className="absolute -bottom-0 -left-0 h-6 w-6 rounded-bl-md border-b-2 border-l-2 border-emerald-400" />
                <span className="absolute -right-0 -bottom-0 h-6 w-6 rounded-br-md border-b-2 border-r-2 border-emerald-400" />
                <div className="absolute inset-x-2 top-1/2 h-px bg-emerald-400/60" />
              </div>
            </div>
          )}
        </div>
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