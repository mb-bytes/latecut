import React from "react"
import { ScrollArea } from "./ui/scroll-area"
import { Badge } from "./ui/badge"
import { BallEvent } from "../types/match"

interface BallFeedProps {
  balls: BallEvent[]
}

export const BallFeed: React.FC<BallFeedProps> = ({ balls }) => {
  const getBadgeStyle = (b: BallEvent) => {
    if (b.is_wicket) {
      return "bg-rose-500/20 text-rose-400 border-rose-500/40 hover:bg-rose-500/30"
    }
    if (b.runs_batter === 6) {
      return "bg-amber-500/20 text-amber-400 border-amber-500/40 hover:bg-amber-500/30"
    }
    if (b.runs_batter === 4) {
      return "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30"
    }
    if (b.runs_extras > 0) {
      return "bg-cyan-500/10 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/20"
    }
    return "bg-secondary text-secondary-foreground border-border/50"
  }

  const getOutcomeText = (b: BallEvent) => {
    if (b.is_wicket) {
      return `W (${b.wicket_kind || "out"})`
    }
    if (b.runs_batter === 6) {
      return "6 RUNS"
    }
    if (b.runs_batter === 4) {
      return "4 RUNS"
    }
    if (b.runs_extras > 0) {
      return `${b.runs_total} (ex)`
    }
    return `${b.runs_total} run`
  }

  return (
    <div className="w-full bg-card/80 border border-border/80 rounded-xl p-3 sm:p-4 shadow-sm">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/50">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Live Commentary
        </h3>
        <span className="text-[10px] text-muted-foreground font-mono">
          Last {balls.length} Balls
        </span>
      </div>

      <ScrollArea className="h-44 w-full pr-2">
        {balls.length === 0 ? (
          <div className="text-center py-8 text-xs text-muted-foreground">
            Awaiting deliveries...
          </div>
        ) : (
          <div className="space-y-1.5">
            {balls.map((b) => (
              <div
                key={`${b.innings}-${b.over}-${b.ball}-${b.index}`}
                className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-secondary/30 border border-border/40 hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-primary text-[11px] min-w-[28px]">
                    {b.over}.{b.ball}
                  </span>
                  <span className="text-foreground text-xs font-medium truncate max-w-[170px]">
                    {b.bowler} to {b.batter}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`text-[10px] font-bold px-1.5 py-0 ${getBadgeStyle(b)}`}>
                    {getOutcomeText(b)}
                  </Badge>
                  <span className="font-mono text-muted-foreground text-[11px] min-w-[44px] text-right">
                    {b.running_score}/{b.running_wickets}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
