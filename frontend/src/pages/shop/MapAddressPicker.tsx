import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapPin, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MapAddressPickerProps {
  value: string
  onChange: (address: string) => void
  placeholder?: string
}

const TASHKENT: [number, number] = [41.311081, 69.240562]

export function MapAddressPicker({ value, onChange, placeholder }: MapAddressPickerProps) {
  const { t } = useTranslation()
  const [showMap, setShowMap] = useState(false)
  const [loading, setLoading] = useState(false)
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const setMarker = (latlng: L.LatLng) => {
    if (markerRef.current) {
      markerRef.current.setLatLng(latlng)
    } else {
      const icon = L.divIcon({
        className: 'map-pin-icon',
        html: '<div class="leaflet-pin-dot"></div>',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      })
      markerRef.current = L.marker(latlng, { icon }).addTo(mapRef.current!)
    }
  }

  const reverseGeocode = async (latlng: L.LatLng) => {
    setLoading(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latlng.lat}&lon=${latlng.lng}&accept-language=uz,ru,en`,
        { headers: { 'Accept-Language': 'uz,ru,en' } }
      )
      if (!res.ok) throw new Error('geocode failed')
      const data = await res.json()
      onChange(data?.display_name || `${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}`)
    } catch {
      onChange(`${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!showMap || !containerRef.current) return
    if (!mapRef.current) {
      const map = L.map(containerRef.current, { center: TASHKENT, zoom: 13 })
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map)
      map.on('click', (e: L.LeafletMouseEvent) => {
        setMarker(e.latlng)
        reverseGeocode(e.latlng)
      })
      mapRef.current = map
      setTimeout(() => map.invalidateSize(), 150)
    }
    return () => {
      if (!showMap) {
        mapRef.current?.remove()
        mapRef.current = null
        markerRef.current = null
      }
    }
  }, [showMap])

  return (
    <div className="space-y-2">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
      />
      {!showMap ? (
        <Button type="button" variant="outline" size="sm" onClick={() => setShowMap(true)}>
          <MapPin className="mr-2 h-4 w-4" />
          {t('shop.pickOnMap', 'Xaritadan tanlash')}
        </Button>
      ) : (
        <div className="space-y-2">
          <div ref={containerRef} className="h-64 w-full rounded-lg border border-gray-200 dark:border-gray-700" />
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('shop.mapHint', 'Xaritada manzilingizni bosing')}</p>
            <div className="flex items-center gap-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
              <Button type="button" variant="outline" size="sm" onClick={() => setShowMap(false)}>
                {t('common.close', 'Yopish')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}