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
    <header className="w-full flex flex-row items-center justify-between py-2.5 px-4 bg-card/80 backdrop-blur-md border border-border/80 rounded-xl shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
          <Radio className="h-4 w-4 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold tracking-tight text-foreground">
              {battingTeam || "Live"} vs {bowlingTeam || "Match"}
            </h1>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] font-semibold px-1.5 py-0">
              LIVE
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Melbourne Cricket Ground • ICC Men&apos;s T20 World Cup
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${connected ? "bg-emerald-500 shadow-sm shadow-emerald-500/50" : "bg-rose-500"}`} />
        <span className="text-xs font-medium text-muted-foreground">
          {connected ? "Connected" : "Reconnecting"}
        </span>
      </div>
    </header>
  )
}
