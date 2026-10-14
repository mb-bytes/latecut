import React from "react"
import { Badge } from "./ui/badge"
import { Radio } from "lucide-react"

interface MatchHeaderProps {
  battingTeam: string
  bowlingTeam: string
  connected: boolean
}

export const MatchHeader: React.FC<MatchHeaderProps> = ({
  battingTeam,
  bowlingTeam,
  connected
}) => {
  return (
    <header className="w-full flex flex-col sm:flex-row items-center justify-between py-4 px-4 sm:px-6 bg-card/60 backdrop-blur-md border border-border/80 rounded-2xl mb-6 shadow-lg shadow-black/20">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary border border-primary/30">
          <Radio className="h-5 w-5 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              {battingTeam || "Live"} vs {bowlingTeam || "Match"}
            </h1>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs font-semibold px-2 py-0.5">
              LIVE
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Melbourne Cricket Ground • Super 12
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3 sm:mt-0">
        <span className={`h-2.5 w-2.5 rounded-full ${connected ? "bg-emerald-500 shadow-sm shadow-emerald-500/50" : "bg-rose-500"}`} />
        <span className="text-xs font-medium text-muted-foreground">
          {connected ? "Feed Connected" : "Reconnecting..."}
        </span>
      </div>
    </header>
  )
}
