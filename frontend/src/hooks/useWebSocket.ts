import { useEffect, useRef, useCallback } from 'react'
import { useAuthStore } from '@/stores/authStore'

type WebSocketMessage = {
  type: string
  data: Record<string, unknown>
}

type WebSocketHandler = (data: Record<string, unknown>) => void

const WS_BASE = import.meta.env.VITE_API_URL || '/api'

export function useWebSocket(handlers: Record<string, WebSocketHandler>) {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const user = useAuthStore((s) => s.user)

  const connect = useCallback(() => {
    if (!user) return

    let base: string
    if (WS_BASE.startsWith('http')) {
      const apiOrigin = WS_BASE.replace(/^https?:\/\//, '')
      const host = apiOrigin.split('/')[0]
      const wsProto = WS_BASE.startsWith('https:') ? 'wss:' : 'ws:'
      base = `${wsProto}//${host}`
    } else {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      base = `${protocol}//${window.location.host}`
    }
    const wsUrl = `${base.replace(/\/$/, '')}/ws/business/`

    try {
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('[WS] Connected')
      }

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          const handler = handlers[message.type]
          if (handler) {
            handler(message.data)
          }
        } catch {
          // ignore parse errors
        }
      }

      ws.onclose = () => {
        console.log('[WS] Disconnected, reconnecting in 5s...')
        reconnectTimeoutRef.current = setTimeout(connect, 5000)
      }

      ws.onerror = () => {
        ws.close()
      }
    } catch {
      reconnectTimeoutRef.current = setTimeout(connect, 5000)
    }
  }, [user, handlers])

  useEffect(() => {
    connect()
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [connect])

  return wsRef
}
