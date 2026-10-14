import React from "react"
import { Toaster, toast } from "sonner"
import { useMatchSocket } from "./hooks/useMatchSocket"
import { useCatchupStream } from "./hooks/useCatchupStream"
import { controlReplay } from "./lib/api"
import { MatchHeader } from "./components/MatchHeader"
import { ScoreboardCard } from "./components/ScoreboardCard"
import { BallFeed } from "./components/BallFeed"
import { ReplayControls } from "./components/ReplayControls"
import { CatchupCard } from "./components/CatchupCard"
import { HowAiWorksPanel } from "./components/HowAiWorksPanel"

export function App() {
  const { state, ballFeed, connected, error: socketError, setState } = useMatchSocket()
  const { status, streamingText, result, error: catchupError, trigger, reset } = useCatchupStream()

  const handleControl = async (action: string, over?: number, speed?: number) => {
    try {
      const updatedReplay = await controlReplay(action, over, speed)
      setState((prev) => (prev ? { ...prev, replay: updatedReplay } : prev))
      if (action === "seek" && over !== undefined) {
        toast.info(`Simulated joining at over ${over}`)
      } else if (action === "speed" && speed !== undefined) {
        toast.info(`Replay speed set to ${speed}x`)
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to control replay")
    }
  }

  const handleTriggerCatchup = (language: "en" | "hinglish") => {
    toast.loading("Generating match catch-up...", { id: "catchup-toast", duration: 1500 })
    trigger(language)
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-start p-3 sm:p-6 lg:p-8 font-sans antialiased selection:bg-primary/20 selection:text-primary">
      <Toaster position="top-right" richColors theme="dark" />
      <div className="w-full max-w-5xl space-y-6">
        <MatchHeader
          battingTeam={state?.batting_team || "Pakistan"}
          bowlingTeam={state?.bowling_team || "India"}
          connected={connected}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <ScoreboardCard state={state} />
            <ReplayControls replay={state?.replay} onControl={handleControl} />
          </div>

          <div className="lg:col-span-1">
            <BallFeed balls={ballFeed} />
          </div>
        </div>

        <CatchupCard
          status={status}
          streamingText={streamingText}
          result={result}
          error={catchupError}
          onTrigger={handleTriggerCatchup}
          onReset={reset}
        />

        <HowAiWorksPanel catchupResult={result} />
      </div>
    </div>
  )
}

export default App
