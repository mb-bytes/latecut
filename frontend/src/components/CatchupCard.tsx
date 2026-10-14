import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Skeleton } from "./ui/skeleton"
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group"
import { CheckCircle2, AlertTriangle, BookOpen, Zap, Eye, RotateCw, Compass } from "lucide-react"
import { CatchupResponse } from "../types/match"
import { StreamStatus, StreamingSections } from "../hooks/useCatchupStream"

interface CatchupCardProps {
  status: StreamStatus
  streamingSections: StreamingSections
  result: CatchupResponse | null
  error: string | null
  isMatchOver?: boolean
  onTrigger: (language: "en" | "hinglish") => void
  onReset: () => void
}

export const CatchupCard: React.FC<CatchupCardProps> = ({
  status,
  streamingSections,
  result,
  error,
  isMatchOver = false,
  onTrigger,
  onReset,
}) => {
  const [language, setLanguage] = useState<"en" | "hinglish">("en")

  return (
    <Card className="w-full h-full flex flex-col bg-card/90 border-border/80 shadow-lg backdrop-blur-sm rounded-xl overflow-hidden">
      <CardHeader className="p-4 pb-3 border-b border-border/60 flex flex-row items-center justify-between space-y-0 gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
            <Compass className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold tracking-tight text-foreground">
              Match Catch-Up
            </CardTitle>
            <p className="text-[11px] text-muted-foreground">
              Grounded instant match summary
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ToggleGroup
            type="single"
            value={language}
            onValueChange={(val) => {
              if (val) setLanguage(val as "en" | "hinglish")
            }}
            className="bg-secondary/60 p-0.5 rounded-lg border border-border/50"
          >
            <ToggleGroupItem value="en" size="sm" className="text-[11px] px-2 h-7 font-medium">
              EN
            </ToggleGroupItem>
            <ToggleGroupItem value="hinglish" size="sm" className="text-[11px] px-2 h-7 font-medium">
              Hinglish
            </ToggleGroupItem>
          </ToggleGroup>

          <Button
            size="sm"
            onClick={() => onTrigger(language)}
            disabled={status === "connecting" || status === "streaming"}
            className="h-7 px-3 text-xs font-semibold shadow-sm"
          >
            I Just Joined
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4 flex-1 flex flex-col justify-between space-y-3">
        {status === "idle" && !result && (
          <div className="flex flex-col items-center justify-center flex-1 py-8 text-center space-y-3">
            <div className="h-10 w-10 rounded-full bg-secondary/60 border border-border/50 flex items-center justify-center text-muted-foreground">
              <Compass className="h-5 w-5" />
            </div>
            <div className="max-w-[280px] space-y-1">
              <p className="text-xs font-medium text-foreground">
                Arrived mid-innings?
              </p>
              <p className="text-[11px] text-muted-foreground leading-normal">
                Click &quot;I Just Joined&quot; to get the match story, pivotal turning point, and what to watch next.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onTrigger(language)}
              className="text-xs h-8"
            >
              Catch Me Up
            </Button>
          </div>
        )}

        {status === "connecting" && (
          <div className="space-y-3 py-4 flex-1 flex flex-col justify-center">
            <Skeleton className="h-4 w-3/4 bg-secondary/70" />
            <Skeleton className="h-3 w-full bg-secondary/50" />
            <Skeleton className="h-3 w-5/6 bg-secondary/50" />
            <Skeleton className="h-3 w-2/3 bg-secondary/50" />
            <div className="text-[11px] text-muted-foreground text-center animate-pulse pt-2">
              Synthesizing match facts...
            </div>
          </div>
        )}

        {status === "streaming" && (
          <div className="space-y-2.5 flex-1 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="p-3 rounded-lg bg-secondary/30 border border-border/40 space-y-1">
                <div className="flex items-center gap-1.5 text-primary font-bold text-xs">
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>Story So Far</span>
                </div>
                <p className="text-xs text-foreground/90 leading-relaxed font-sans min-h-[36px]">
                  {streamingSections.story ? (
                    <>
                      {streamingSections.story}
                      {!streamingSections.turning_point && (
                        <span className="inline-block w-1.5 h-3.5 ml-1 bg-primary animate-pulse align-middle" />
                      )}
                    </>
                  ) : (
                    <span className="text-muted-foreground text-[11px] animate-pulse">Drafting match story...</span>
                  )}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-secondary/30 border border-border/40 space-y-1">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs">
                  <Zap className="h-3.5 w-3.5" />
                  <span>Turning Point</span>
                </div>
                <p className="text-xs text-foreground/90 leading-relaxed font-sans min-h-[24px]">
                  {streamingSections.turning_point ? (
                    <>
                      {streamingSections.turning_point}
                      {!streamingSections.watch_next && (
                        <span className="inline-block w-1.5 h-3.5 ml-1 bg-amber-400 animate-pulse align-middle" />
                      )}
                    </>
                  ) : (
                    <span className="text-muted-foreground text-[11px]">
                      {streamingSections.story ? "Analyzing turning point..." : "—"}
                    </span>
                  )}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-secondary/30 border border-border/40 space-y-1">
                <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-xs">
                  <Eye className="h-3.5 w-3.5" />
                  <span>{isMatchOver ? "Match Conclusion" : "Watch Next"}</span>
                </div>
                <p className="text-xs text-foreground/90 leading-relaxed font-sans min-h-[24px]">
                  {streamingSections.watch_next ? (
                    <>
                      {streamingSections.watch_next}
                      <span className="inline-block w-1.5 h-3.5 ml-1 bg-cyan-400 animate-pulse align-middle" />
                    </>
                  ) : (
                    <span className="text-muted-foreground text-[11px]">
                      {streamingSections.turning_point ? "Determining match takeaway..." : "—"}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center justify-between">
            <span>{error || "Catch-up failed"}</span>
            <Button size="sm" variant="outline" onClick={() => onTrigger(language)} className="h-6 text-[10px] px-2">
              Retry
            </Button>
          </div>
        )}

        {(status === "done" || (status === "idle" && result)) && result && (
          <div className="space-y-3 flex-1 flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="p-3 rounded-lg bg-secondary/30 border border-border/40 space-y-1">
                <div className="flex items-center gap-1.5 text-primary font-bold text-xs">
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>Story So Far</span>
                </div>
                <p className="text-xs text-foreground/90 leading-relaxed">
                  {result.story}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-secondary/30 border border-border/40 space-y-1">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs">
                  <Zap className="h-3.5 w-3.5" />
                  <span>Turning Point</span>
                </div>
                <p className="text-xs text-foreground/90 leading-relaxed">
                  {result.turning_point}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-secondary/30 border border-border/40 space-y-1">
                <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-xs">
                  <Eye className="h-3.5 w-3.5" />
                  <span>{isMatchOver ? "Match Conclusion" : "Watch Next"}</span>
                </div>
                <p className="text-xs text-foreground/90 leading-relaxed">
                  {result.watch_next}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[11px]">
              <div className="flex items-center gap-1.5">
                <Badge
                  variant="outline"
                  className={
                    result.grounded
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] font-medium px-1.5 py-0"
                      : "bg-amber-500/10 text-amber-400 border-amber-500/30 text-[10px] font-medium px-1.5 py-0"
                  }
                >
                  {result.grounded ? (
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Grounded
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> Unverified
                    </span>
                  )}
                </Badge>

                {!result.telemetry.ai && (
                  <Badge variant="outline" className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px] px-1.5 py-0">
                    Template
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onTrigger(language)}
                  className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground"
                >
                  <RotateCw className="h-3 w-3 mr-1" /> Refresh
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onReset}
                  className="h-6 px-1.5 text-[10px] text-muted-foreground hover:text-foreground"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
