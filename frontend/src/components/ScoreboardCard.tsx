import React from "react"
import { Card, CardContent } from "./ui/card"
import { Badge } from "./ui/badge"
import { StateSnapshot } from "../types/match"

interface ScoreboardCardProps {
  state: StateSnapshot | null
}

export const ScoreboardCard: React.FC<ScoreboardCardProps> = ({ state }) => {
  if (!state) {
    return (
      <Card className="w-full bg-card/80 border-border/80 shadow-sm rounded-xl">
        <CardContent className="p-4 text-center text-muted-foreground text-xs">
          Awaiting live match state...
        </CardContent>
      </Card>
    )
  }

  const {
    score,
    wickets,
    overs_str,
    run_rate,
    required_rate,
    current_batters,
    current_bowler,
    batting_team,
    target,
    innings
  } = state

  const runsNeeded = target ? Math.max(0, target - score) : null

  return (
    <Card className="w-full bg-card/90 border-border/80 shadow-md backdrop-blur-sm rounded-xl overflow-hidden">
      <CardContent className="p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-border/60">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs font-bold tracking-wider uppercase text-primary">
                {batting_team}
              </span>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-medium">
                Inn {innings}
              </Badge>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold tracking-tight text-foreground font-mono">
                {score}/{wickets}
              </span>
              <span className="text-base font-semibold text-muted-foreground font-mono">
                ({overs_str} ov)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <div className="bg-secondary/40 border border-border/50 rounded-lg px-2.5 py-1.5 text-center min-w-[70px]">
              <div className="text-[10px] text-muted-foreground uppercase font-medium">CRR</div>
              <div className="text-sm font-bold font-mono text-foreground">{run_rate.toFixed(2)}</div>
            </div>

            {required_rate !== null && (
              <div className="bg-secondary/40 border border-border/50 rounded-lg px-2.5 py-1.5 text-center min-w-[70px]">
                <div className="text-[10px] text-muted-foreground uppercase font-medium">RRR</div>
                <div className="text-sm font-bold font-mono text-emerald-400">{required_rate.toFixed(2)}</div>
              </div>
            )}

            {target !== null && (
              <div className="bg-secondary/40 border border-border/50 rounded-lg px-2.5 py-1.5 text-center min-w-[70px]">
                <div className="text-[10px] text-muted-foreground uppercase font-medium">Target</div>
                <div className="text-sm font-bold font-mono text-foreground">{target}</div>
              </div>
            )}
          </div>
        </div>

        {runsNeeded !== null && (
          <div className="py-1 px-2.5 rounded-lg bg-primary/10 border border-primary/20 text-xs font-medium text-primary flex items-center justify-between">
            <span>Need {runsNeeded} runs from remaining overs</span>
            <span className="font-mono text-[11px] font-semibold">Target {target}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-secondary/20 border border-border/50 rounded-lg p-3">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center justify-between">
              <span>Batters</span>
              <span className="text-[10px] text-muted-foreground/60 font-mono">R (B) 4s 6s</span>
            </div>
            <div className="space-y-1.5">
              {current_batters.length === 0 ? (
                <div className="text-xs text-muted-foreground">No active batters</div>
              ) : (
                current_batters.map((b, idx) => (
                  <div key={b.name} className="flex items-center justify-between text-xs py-0.5">
                    <div className="flex items-center gap-1 font-medium text-foreground truncate max-w-[120px]">
                      <span className="truncate">{b.name}</span>
                      {idx === 0 && <span className="text-primary text-[10px] font-bold">*</span>}
                    </div>
                    <div className="font-mono text-[11px] flex items-center gap-2 text-right">
                      <span className="font-bold text-foreground min-w-[18px]">{b.runs}</span>
                      <span className="text-muted-foreground min-w-[24px]">({b.balls})</span>
                      <span className="text-muted-foreground min-w-[12px]">{b.fours}</span>
                      <span className="text-muted-foreground min-w-[12px]">{b.sixes}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-secondary/20 border border-border/50 rounded-lg p-3">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center justify-between">
              <span>Bowler</span>
              <span className="text-[10px] text-muted-foreground/60 font-mono">O M R W Econ</span>
            </div>
            {current_bowler ? (
              <div className="flex items-center justify-between text-xs py-0.5">
                <span className="font-medium text-foreground truncate max-w-[120px]">{current_bowler.name}</span>
                <div className="font-mono text-[11px] flex items-center gap-2">
                  <span className="text-muted-foreground">{current_bowler.overs}</span>
                  <span className="text-muted-foreground">{current_bowler.maidens}</span>
                  <span className="text-muted-foreground">{current_bowler.runs}</span>
                  <span className="font-bold text-rose-400">{current_bowler.wickets}</span>
                  <span className="text-emerald-400 font-semibold">{current_bowler.economy.toFixed(1)}</span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">Awaiting over</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
