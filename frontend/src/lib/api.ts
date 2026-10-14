import { StateSnapshot, ReplayState, InspectResponse } from "../types/match"

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000"

export async function getState(): Promise<StateSnapshot> {
  const res = await fetch(`${API_BASE}/api/state`)
  if (!res.ok) {
    throw new Error(`Failed to fetch state: ${res.statusText}`)
  }
  return res.json()
}

export async function controlReplay(action: string, over?: number, speed?: number): Promise<ReplayState> {
  const res = await fetch(`${API_BASE}/api/replay/control`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, over, speed }),
  })
  if (!res.ok) {
    throw new Error(`Failed to control replay: ${res.statusText}`)
  }
  return res.json()
}

export async function getInspect(language: string = "en"): Promise<InspectResponse> {
  const res = await fetch(`${API_BASE}/api/catchup/inspect?language=${encodeURIComponent(language)}`)
  if (!res.ok) {
    throw new Error(`Failed to fetch inspection data: ${res.statusText}`)
  }
  return res.json()
}
