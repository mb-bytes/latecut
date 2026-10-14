import { useState, useEffect, useRef, useCallback } from "react"
import { StateSnapshot, BallEvent } from "../types/match"

const WS_BASE = import.meta.env.VITE_WS_URL || "ws://localhost:8000"

export function useMatchSocket() {
  const [state, setState] = useState<StateSnapshot | null>(null)
  const [ballFeed, setBallFeed] = useState<BallEvent[]>([])
  const [connected, setConnected] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const socketRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const backoffRef = useRef<number>(1000)

  const connect = useCallback(() => {
    if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)) {
      return
    }

    try {
      const ws = new WebSocket(`${WS_BASE}/ws/match`)
      socketRef.current = ws

      ws.onopen = () => {
        setConnected(true)
        setError(null)
        backoffRef.current = 1000
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.snapshot) {
            setState(data.snapshot)
          }
          if (data.ball) {
            setBallFeed((prev) => {
              const updated = [data.ball, ...prev]
              return updated.slice(0, 50)
            })
          }
        } catch (err) {
          setError("Failed to parse match data")
        }
      }

      ws.onerror = () => {
        setError("WebSocket connection encountered an error")
      }

      ws.onclose = () => {
        setConnected(false)
        const delay = Math.min(backoffRef.current, 16000)
        backoffRef.current = delay * 2
        reconnectTimeoutRef.current = setTimeout(() => {
          connect()
        }, delay)
      }
    } catch (err) {
      setError("Unable to establish WebSocket connection")
    }
  }, [])

  useEffect(() => {
    connect()

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (socketRef.current) {
        socketRef.current.close()
      }
    }
  }, [connect])

  return { state, ballFeed, connected, error, setState }
}
