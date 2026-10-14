import React, { useEffect } from "react"
import { Toaster, toast } from "sonner"
import { useMatchSocket } from "./hooks/useMatchSocket"
import { useCatchupStream } from "./hooks/useCatchupStream"
import { controlReplay, getState } from "./lib/api"
import { MatchHeader } from "./components/MatchHeader"
import { ScoreboardCard } from "./components/ScoreboardCard"
import { BallFeed } from "./components/BallFeed"
import { ReplayControls } from "./components/ReplayControls"
import { CatchupCard } from "./components/CatchupCard"
import { HowAiWorksPanel } from "./components/HowAiWorksPanel"

export function App() {
  const { state, ballFeed, connected, error: socketError, setState } = useMatchSocket()
  const { status, streamingSections, result, error: catchupError, trigger, reset } = useCatchupStream()

  // Manage toast notifications for catchup stream
  useEffect(() => {
    if (status === "done") {
      toast.success("Match catch-up generated!", { id: "catchup-toast", duration: 2500 })
    } else if (status === "error") {
      toast.error(catchupError || "Failed to generate catch-up", { id: "catchup-toast", duration: 3000 })
    }
  }, [status, catchupError])

  const handleControl = async (
    action: string,
    over?: number,
    speed?: number,
    innings?: number
  ) => {
    try {
      const updatedReplay = await controlReplay(action, over, speed, innings)
      if (action === "seek" || action === "restart") {
        try {
          const freshState = await getState()
          setState(freshState)
        } catch {
          setState((prev) => (prev ? { ...prev, replay: updatedReplay } : prev))
        }
      } else {
        setState((prev) => (prev ? { ...prev, replay: updatedReplay } : prev))
      }

      if (action === "seek" && over !== undefined) {
        toast.info(`Simulated: Over ${over} (Innings ${innings ?? (state?.innings ?? 1)})`)
      } else if (action === "speed" && speed !== undefined) {
        toast.info(`Replay speed set to ${speed}x`)
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to control replay")
    }
  }

  const handleTriggerCatchup = (language: "en" | "hinglish") => {
    toast.loading("Generating match catch-up...", { id: "catchup-toast" })
    trigger(language)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/50 via-background to-orange-50/30 text-foreground flex flex-col p-3 sm:p-6 font-sans antialiased selection:bg-primary/20 selection:text-primary">
      <Toaster position="top-right" richColors theme="light" />
      <div className="w-full max-w-7xl mx-auto space-y-5">
        <MatchHeader
          battingTeam={state?.batting_team || "Pakistan"}
          bowlingTeam={state?.bowling_team || "India"}
          connected={connected}
          isFinished={state?.is_finished}
          matchResult={state?.match_result}
          tossWinner={state?.toss_winner}
          tossDecision={state?.toss_decision}
          venue={state?.venue}
          matchDate={state?.match_date}
          eventName={state?.event_name}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-7 flex flex-col gap-4">
            <ScoreboardCard state={state} />
            <ReplayControls
              replay={state?.replay}
              currentInnings={state?.innings}
              currentOverStr={state?.overs_str}
              hasTwoInnings={state?.has_two_innings}
              onControl={handleControl}
            />
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

        <HowAiWorksPanel catchupResult={result} />
      </div>
    </div>
  )
}

export default App
