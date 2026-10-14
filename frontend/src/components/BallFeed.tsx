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
      return "bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100 font-bold"
    }
    if (b.runs_batter === 6) {
      return "bg-orange-50 text-orange-700 border-orange-400 hover:bg-orange-100 font-black shadow-xs"
    }
    if (b.runs_batter === 4) {
      return "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100 font-bold"
    }
    if (b.runs_extras > 0) {
      return "bg-sky-50 text-sky-800 border-sky-300 hover:bg-sky-100 font-medium"
    }
    return "bg-stone-100 text-stone-700 border-stone-200 font-medium"
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
    <div className="w-full bg-card border border-orange-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-orange-100">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Live Commentary
        </h3>
        <span className="text-[11px] text-orange-600 font-bold font-mono bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
          Last {balls.length} Balls
        </span>
      </div>

      <ScrollArea className="h-48 w-full pr-2">
        {balls.length === 0 ? (
          <div className="text-center py-8 text-xs text-muted-foreground">
            Awaiting deliveries...
          </div>
        ) : (
          <div className="space-y-1.5">
            {balls.map((b) => (
              <div
                key={`${b.innings}-${b.over}-${b.ball}-${b.index}`}
                className="flex items-center justify-between text-xs p-2 rounded-xl bg-stone-50/60 border border-stone-200/70 hover:bg-orange-50/50 hover:border-orange-200 transition-all"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-orange-600 text-xs min-w-[28px]">
                    {b.over}.{b.ball}
                  </span>
                  <span className="text-foreground text-xs font-semibold truncate max-w-[170px]">
                    {b.bowler} to {b.batter}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`text-[10px] px-2 py-0.5 rounded-md ${getBadgeStyle(b)}`}>
                    {getOutcomeText(b)}
                  </Badge>
                  <span className="font-mono font-bold text-stone-600 text-xs min-w-[46px] text-right">
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
