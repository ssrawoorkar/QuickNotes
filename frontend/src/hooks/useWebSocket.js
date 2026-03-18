import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * Manages a WebSocket connection to /ws.
 * @returns {{ connected: boolean, send: function, lastNotes: string }}
 */
export function useWebSocket() {
  const [connected, setConnected] = useState(false)
  const [lastNotes, setLastNotes] = useState('')
  const wsRef = useRef(null)
  const reconnectTimer = useRef(null)

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/ws`
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      setConnected(true)
    }

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        if (msg.type === 'notes' && typeof msg.text === 'string') {
          setLastNotes(msg.text)
        }
      } catch {
        // ignore malformed messages
      }
    }

    ws.onclose = () => {
      setConnected(false)
      wsRef.current = null
      // Attempt reconnect after 2 seconds
      reconnectTimer.current = setTimeout(connect, 2000)
    }

    ws.onerror = () => {
      ws.close()
    }
  }, [])

  useEffect(() => {
    connect()
    return () => {
      clearTimeout(reconnectTimer.current)
      if (wsRef.current) {
        wsRef.current.onclose = null
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [connect])

  const send = useCallback((data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data))
    }
  }, [])

  return { connected, send, lastNotes }
}
