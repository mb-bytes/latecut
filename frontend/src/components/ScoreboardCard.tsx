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
    <Card className="w-full bg-card border border-orange-200/80 rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <CardContent className="p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-orange-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-extrabold tracking-wider uppercase text-orange-600">
                {batting_team}
              </span>
              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-[10px] px-2 py-0.5 font-bold">
                Inn {innings}
              </Badge>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground font-mono">
                {score}/{wickets}
              </span>
              <span className="text-base font-semibold text-muted-foreground font-mono">
                ({overs_str} ov)
              </span>
            </div>
            {state.toss_winner && (
              <p className="text-xs text-muted-foreground mt-1">
                Toss: <span className="text-foreground font-semibold">{state.toss_winner}</span> elected to {state.toss_decision}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2.5 text-xs">
            <div className="bg-orange-50/60 border border-orange-200/70 rounded-xl px-3 py-2 text-center min-w-[76px] shadow-xs">
              <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">CRR</div>
              <div className="text-base font-black font-mono text-foreground">{run_rate.toFixed(2)}</div>
            </div>

            {required_rate !== null && (
              <div className="bg-orange-50/60 border border-orange-200/70 rounded-xl px-3 py-2 text-center min-w-[76px] shadow-xs">
                <div className="text-[10px] text-orange-600 uppercase font-bold tracking-wider">RRR</div>
                <div className="text-base font-black font-mono text-orange-600">{required_rate.toFixed(2)}</div>
              </div>
            )}

            {target !== null && (
              <div className="bg-stone-50 border border-stone-200/80 rounded-xl px-3 py-2 text-center min-w-[76px] shadow-xs">
                <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Target</div>
                <div className="text-base font-black font-mono text-foreground">{target}</div>
              </div>
            )}
          </div>
        </div>

        {runsNeeded !== null && (
          <div className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-semibold flex items-center justify-between shadow-sm">
            <span>Need {runsNeeded} runs to win</span>
            <span className="font-mono text-xs font-bold bg-white/20 px-2 py-0.5 rounded-md">Target: {target}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-stone-50/70 border border-stone-200/80 rounded-xl p-3.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center justify-between">
              <span>Batters</span>
              <span className="text-[10px] text-muted-foreground/80 font-mono">R (B) 4s 6s</span>
            </div>
            <div className="space-y-1.5">
              {current_batters.length === 0 ? (
                <div className="text-xs text-muted-foreground">No active batters</div>
              ) : (
                current_batters.map((b, idx) => (
                  <div key={b.name} className="flex items-center justify-between text-xs py-0.5">
                    <div className="flex items-center gap-1 font-semibold text-foreground truncate max-w-[130px]">
                      <span className="truncate">{b.name}</span>
                      {idx === 0 && <span className="text-orange-500 text-xs font-black">*</span>}
                    </div>
                    <div className="font-mono text-xs flex items-center gap-2.5 text-right">
                      <span className="font-bold text-foreground min-w-[20px]">{b.runs}</span>
                      <span className="text-muted-foreground min-w-[24px]">({b.balls})</span>
                      <span className="text-muted-foreground min-w-[12px]">{b.fours}</span>
                      <span className="text-orange-600 font-bold min-w-[12px]">{b.sixes}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-stone-50/70 border border-stone-200/80 rounded-xl p-3.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center justify-between">
              <span>Bowler</span>
              <span className="text-[10px] text-muted-foreground/80 font-mono">O M R W Econ</span>
            </div>
            {current_bowler ? (
              <div className="flex items-center justify-between text-xs py-0.5">
                <span className="font-semibold text-foreground truncate max-w-[120px]">{current_bowler.name}</span>
                <div className="font-mono text-xs flex items-center gap-2.5">
                  <span className="text-muted-foreground">{current_bowler.overs}</span>
                  <span className="text-muted-foreground">{current_bowler.maidens}</span>
                  <span className="text-muted-foreground">{current_bowler.runs}</span>
                  <span className="font-bold text-rose-600">{current_bowler.wickets}</span>
                  <span className="text-orange-600 font-bold">{current_bowler.economy.toFixed(1)}</span>
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
