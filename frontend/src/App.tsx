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

export function App() {
  const { state, ballFeed, connected, error: socketError, setState } = useMatchSocket()
  const { status, streamingSections, result, error: catchupError, trigger, reset } = useCatchupStream()

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
    <div className="min-h-screen bg-background text-foreground flex flex-col p-3 sm:p-5 font-sans antialiased selection:bg-primary/20 selection:text-primary">
      <Toaster position="top-right" richColors theme="dark" />
      <div className="w-full max-w-7xl mx-auto space-y-4">
        <MatchHeader
          battingTeam={state?.batting_team || "Pakistan"}
          bowlingTeam={state?.bowling_team || "India"}
          connected={connected}
          isFinished={state?.is_finished}
          matchResult={state?.match_result}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          <div className="lg:col-span-7 flex flex-col gap-4">
            <ScoreboardCard state={state} />
            <ReplayControls replay={state?.replay} onControl={handleControl} />
            <BallFeed balls={ballFeed} />
          </div>

          <div className="lg:col-span-5 flex flex-col gap-4 sticky top-4">
            <CatchupCard
              status={status}
              streamingSections={streamingSections}
              result={result}
              error={catchupError}
              isMatchOver={state?.is_finished}
              onTrigger={handleTriggerCatchup}
              onReset={reset}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
