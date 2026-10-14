import { useState, useCallback, useRef } from "react"
import { CatchupResponse } from "../types/match"

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000"

export type StreamStatus = "idle" | "connecting" | "streaming" | "done" | "error"

export function useCatchupStream() {
  const [status, setStatus] = useState<StreamStatus>("idle")
  const [streamingText, setStreamingText] = useState<string>("")
  const [result, setResult] = useState<CatchupResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const trigger = useCallback(async (language: "en" | "hinglish" = "en") => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const controller = new AbortController()
    abortControllerRef.current = controller

    setStatus("connecting")
    setStreamingText("")
    setResult(null)
    setError(null)

    try {
      const response = await fetch(`${API_BASE}/api/catchup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, away_minutes: 0 }),
        signal: controller.signal,
      })

      if (!response.ok || !response.body) {
        throw new Error(`Catch-up service error: ${response.statusText}`)
      }

      setStatus("streaming")
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const events = buffer.split("\n\n")
        buffer = events.pop() || ""

        for (const evt of events) {
          if (!evt.trim()) continue
          const lines = evt.split("\n")
          let eventType = "message"
          let dataText = ""

          for (const line of lines) {
            if (line.startsWith("event:")) {
              eventType = line.replace("event:", "").trim()
            } else if (line.startsWith("data:")) {
              dataText = line.replace("data:", "").trim()
            }
          }

          if (eventType === "token") {
            try {
              const parsed = JSON.parse(dataText)
              if (parsed.delta) {
                setStreamingText((prev) => prev + parsed.delta)
              }
            } catch (err) {}
          } else if (eventType === "done") {
            try {
              const finalData: CatchupResponse = JSON.parse(dataText)
              setResult(finalData)
              setStatus("done")
            } catch (err) {
              setStatus("done")
            }
          } else if (eventType === "error") {
            setError(dataText || "Failed to generate AI catch-up")
            setStatus("error")
          }
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setError(err.message || "Catch-up stream failed")
        setStatus("error")
      }
    }
  }, [])

  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setStatus("idle")
    setStreamingText("")
    setResult(null)
    setError(null)
  }, [])

  return { trigger, reset, streamingText, result, status, error }
}
