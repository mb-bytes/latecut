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
      <Card className="w-full bg-card/80 border-border/80 shadow-md">
        <CardContent className="p-6 text-center text-muted-foreground text-sm">
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
    <Card className="w-full bg-card/90 border-border/80 shadow-xl backdrop-blur-md overflow-hidden relative">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-primary to-cyan-500" />
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-border/60">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold tracking-wide uppercase text-primary">
                {batting_team}
              </span>
              <Badge variant="secondary" className="text-xs px-2 py-0.5">
                Innings {innings}
              </Badge>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-5xl font-black tracking-tight text-foreground font-mono">
                {score}/{wickets}
              </span>
              <span className="text-xl font-medium text-muted-foreground font-mono">
                ({overs_str} ov)
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-sm">
            <div className="bg-secondary/40 border border-border/60 rounded-xl px-4 py-2 text-center min-w-[100px]">
              <div className="text-xs text-muted-foreground uppercase font-medium">CRR</div>
              <div className="text-lg font-bold font-mono text-foreground">{run_rate.toFixed(2)}</div>
            </div>

            {required_rate !== null && (
              <div className="bg-secondary/40 border border-border/60 rounded-xl px-4 py-2 text-center min-w-[100px]">
                <div className="text-xs text-muted-foreground uppercase font-medium">RRR</div>
                <div className="text-lg font-bold font-mono text-emerald-400">{required_rate.toFixed(2)}</div>
              </div>
            )}

            {target !== null && (
              <div className="bg-secondary/40 border border-border/60 rounded-xl px-4 py-2 text-center min-w-[100px]">
                <div className="text-xs text-muted-foreground uppercase font-medium">Target</div>
                <div className="text-lg font-bold font-mono text-foreground">{target}</div>
              </div>
            )}
          </div>
        </div>

        {runsNeeded !== null && (
          <div className="mt-3 py-1.5 px-3 rounded-lg bg-primary/10 border border-primary/20 text-xs font-medium text-primary flex items-center justify-between">
            <span>Equation: Need {runsNeeded} runs to win</span>
            <span>Target: {target}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="bg-secondary/20 border border-border/50 rounded-xl p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center justify-between">
              <span>Batters on Crease</span>
              <span className="text-[10px] text-muted-foreground/70">R (B) 4s 6s</span>
            </div>
            <div className="space-y-2">
              {current_batters.length === 0 ? (
                <div className="text-xs text-muted-foreground">No active batters</div>
              ) : (
                current_batters.map((b, idx) => (
                  <div key={b.name} className="flex items-center justify-between text-sm py-1 border-b border-border/30 last:border-0">
                    <div className="flex items-center gap-1.5 font-medium text-foreground">
                      <span>{b.name}</span>
                      {idx === 0 && <span className="text-primary text-xs">*</span>}
                    </div>
                    <div className="font-mono text-xs flex items-center gap-3">
                      <span className="font-bold text-foreground">{b.runs}</span>
                      <span className="text-muted-foreground">({b.balls})</span>
                      <span className="text-muted-foreground">{b.fours}</span>
                      <span className="text-muted-foreground">{b.sixes}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-secondary/20 border border-border/50 rounded-xl p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center justify-between">
              <span>Current Bowler</span>
              <span className="text-[10px] text-muted-foreground/70">O M R W Econ</span>
            </div>
            {current_bowler ? (
              <div className="flex items-center justify-between text-sm py-1">
                <span className="font-medium text-foreground">{current_bowler.name}</span>
                <div className="font-mono text-xs flex items-center gap-3">
                  <span className="text-muted-foreground">{current_bowler.overs}</span>
                  <span className="text-muted-foreground">{current_bowler.maidens}</span>
                  <span className="text-muted-foreground">{current_bowler.runs}</span>
                  <span className="font-bold text-rose-400">{current_bowler.wickets}</span>
                  <span className="text-emerald-400">{current_bowler.economy.toFixed(1)}</span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">Bowler awaiting next over</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
