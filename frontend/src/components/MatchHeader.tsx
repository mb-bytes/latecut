import React from "react"
import { Badge } from "./ui/badge"
import { Radio, Trophy, MapPin, Calendar, Coins } from "lucide-react"

interface MatchHeaderProps {
  battingTeam: string
  bowlingTeam: string
  connected: boolean
  isFinished?: boolean
  matchResult?: string | null
  tossWinner?: string
  tossDecision?: string
  venue?: string
  matchDate?: string
  eventName?: string
}

export const MatchHeader: React.FC<MatchHeaderProps> = ({
  battingTeam,
  bowlingTeam,
  connected,
  isFinished = false,
  matchResult = null,
  tossWinner,
  tossDecision,
  venue = "Melbourne Cricket Ground",
  matchDate,
  eventName = "ICC Men's T20 World Cup"
}) => {
  const tossSummary =
    tossWinner && tossDecision
      ? `${tossWinner} won toss & chose to ${tossDecision}`
      : null

  return (
    <header className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-3 px-4 sm:px-5 bg-card border border-orange-200/80 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 border border-orange-500/20 mt-0.5 shadow-sm">
          {isFinished ? (
            <Trophy className="h-5 w-5 text-amber-500" />
          ) : (
            <Radio className="h-5 w-5 text-orange-500 animate-pulse" />
          )}
        </div>
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
              {battingTeam || "Team 1"} vs {bowlingTeam || "Team 2"}
            </h1>
            {isFinished && (
              <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-200 text-[10px] font-semibold px-2 py-0.5">
                RESULT
              </Badge>
            )}
            {tossSummary && (
              <Badge variant="secondary" className="bg-orange-50/80 text-stone-800 border border-orange-200/80 text-[10px] font-medium px-2 py-0.5 flex items-center gap-1">
                <Coins className="h-3 w-3 text-amber-500" />
                <span>{tossSummary}</span>
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground font-normal">
            {isFinished && matchResult ? (
              <span className="font-semibold text-orange-600">{matchResult}</span>
            ) : null}
            {eventName && <span>{eventName}</span>}
            {venue && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3 text-orange-500" />
                <span>{venue}</span>
              </span>
            )}
            {matchDate && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3 text-orange-500" />
                <span>{matchDate}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center shrink-0 bg-stone-50 px-3 py-1.5 rounded-full border border-stone-200/80">
        <span className={`h-2 w-2 rounded-full ${connected ? "bg-emerald-500 shadow-sm shadow-emerald-500/50" : "bg-rose-500"}`} />
        <span className="text-xs font-semibold text-stone-700">
          {connected ? "Connected" : "Reconnecting"}
        </span>
      </div>
    </header>
  )
}
