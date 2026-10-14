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
    <Card className="w-full h-full flex flex-col bg-card border border-orange-200/80 shadow-md hover:shadow-lg transition-shadow rounded-2xl overflow-hidden">
      <CardHeader className="p-4 sm:p-5 pb-3 sm:pb-3.5 border-b border-orange-100 flex flex-row items-center justify-between space-y-0 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 border border-orange-500/20 shadow-xs">
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
            className="bg-stone-100 p-0.5 rounded-xl border border-stone-200/80"
          >
            <ToggleGroupItem
              value="en"
              size="sm"
              className="text-[11px] px-2.5 h-7 font-bold rounded-lg data-[state=on]:bg-orange-500 data-[state=on]:text-white data-[state=on]:shadow-xs"
            >
              EN
            </ToggleGroupItem>
            <ToggleGroupItem
              value="hinglish"
              size="sm"
              className="text-[11px] px-2.5 h-7 font-bold rounded-lg data-[state=on]:bg-orange-500 data-[state=on]:text-white data-[state=on]:shadow-xs"
            >
              Hinglish
            </ToggleGroupItem>
          </ToggleGroup>

          <Button
            size="sm"
            onClick={() => onTrigger(language)}
            disabled={status === "connecting" || status === "streaming"}
            className="h-8 px-3.5 text-xs font-bold shadow-sm bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl"
          >
            LateCut
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3.5">
        {status === "idle" && !result && (
          <div className="flex flex-col items-center justify-center flex-1 py-10 text-center space-y-3.5">
            <div className="h-12 w-12 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 shadow-xs">
              <Compass className="h-6 w-6" />
            </div>
            <div className="max-w-[280px] space-y-1">
              <p className="text-sm font-bold text-foreground">
                Arrived mid-innings?
              </p>
              <p className="text-xs text-muted-foreground leading-normal">
                Click &quot;LateCut&quot; to get the match story, pivotal turning point, and what to watch next.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => onTrigger(language)}
              className="text-xs h-8 px-4 font-bold bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-xs"
            >
              Catch Me Up
            </Button>
          </div>
        )}

        {status === "connecting" && (
          <div className="space-y-3 py-6 flex-1 flex flex-col justify-center">
            <Skeleton className="h-4 w-3/4 bg-orange-100/60" />
            <Skeleton className="h-3 w-full bg-stone-100" />
            <Skeleton className="h-3 w-5/6 bg-stone-100" />
            <Skeleton className="h-3 w-2/3 bg-stone-100" />
            <div className="text-xs font-semibold text-orange-600 text-center animate-pulse pt-3">
              Synthesizing match facts...
            </div>
          </div>
        )}

        {status === "streaming" && (
          <div className="space-y-3 flex-1 flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="p-3.5 rounded-xl bg-orange-50/50 border border-orange-200/80 space-y-1.5 shadow-xs">
                <div className="flex items-center gap-1.5 text-orange-600 font-bold text-xs">
                  <BookOpen className="h-4 w-4" />
                  <span>Story So Far</span>
                </div>
                <p className="text-xs text-stone-800 leading-relaxed font-sans min-h-[36px]">
                  {streamingSections.story ? (
                    <>
                      {streamingSections.story}
                      {!streamingSections.turning_point && (
                        <span className="inline-block w-1.5 h-3.5 ml-1 bg-orange-500 animate-pulse align-middle" />
                      )}
                    </>
                  ) : (
                    <span className="text-muted-foreground text-xs animate-pulse">Drafting match story...</span>
                  )}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200/80 space-y-1.5 shadow-xs">
                <div className="flex items-center gap-1.5 text-amber-700 font-bold text-xs">
                  <Zap className="h-4 w-4" />
                  <span>Turning Point</span>
                </div>
                <p className="text-xs text-stone-800 leading-relaxed font-sans min-h-[24px]">
                  {streamingSections.turning_point ? (
                    <>
                      {streamingSections.turning_point}
                      {!streamingSections.watch_next && (
                        <span className="inline-block w-1.5 h-3.5 ml-1 bg-amber-500 animate-pulse align-middle" />
                      )}
                    </>
                  ) : (
                    <span className="text-muted-foreground text-xs">
                      {streamingSections.story ? "Analyzing turning point..." : "—"}
                    </span>
                  )}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/80 space-y-1.5 shadow-xs">
                <div className="flex items-center gap-1.5 text-orange-600 font-bold text-xs">
                  <Eye className="h-4 w-4" />
                  <span>{isMatchOver ? "Match Conclusion" : "Watch Next"}</span>
                </div>
                <p className="text-xs text-stone-800 leading-relaxed font-sans min-h-[24px]">
                  {streamingSections.watch_next ? (
                    <>
                      {streamingSections.watch_next}
                      <span className="inline-block w-1.5 h-3.5 ml-1 bg-orange-500 animate-pulse align-middle" />
                    </>
                  ) : (
                    <span className="text-muted-foreground text-xs">
                      {streamingSections.turning_point ? "Determining match takeaway..." : "—"}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center justify-between">
            <span className="font-medium">{error || "Catch-up failed"}</span>
            <Button size="sm" variant="outline" onClick={() => onTrigger(language)} className="h-6 text-[10px] px-2 font-bold">
              Retry
            </Button>
          </div>
        )}

        {(status === "done" || (status === "idle" && result)) && result && (
          <div className="space-y-3.5 flex-1 flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="p-3.5 rounded-xl bg-orange-50/50 border border-orange-200/80 space-y-1.5 shadow-xs">
                <div className="flex items-center gap-1.5 text-orange-600 font-bold text-xs">
                  <BookOpen className="h-4 w-4" />
                  <span>Story So Far</span>
                </div>
                <p className="text-xs text-stone-800 leading-relaxed font-normal">
                  {result.story}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200/80 space-y-1.5 shadow-xs">
                <div className="flex items-center gap-1.5 text-amber-700 font-bold text-xs">
                  <Zap className="h-4 w-4" />
                  <span>Turning Point</span>
                </div>
                <p className="text-xs text-stone-800 leading-relaxed font-normal">
                  {result.turning_point}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/80 space-y-1.5 shadow-xs">
                <div className="flex items-center gap-1.5 text-orange-600 font-bold text-xs">
                  <Eye className="h-4 w-4" />
                  <span>{isMatchOver ? "Match Conclusion" : "Watch Next"}</span>
                </div>
                <p className="text-xs text-stone-800 leading-relaxed font-normal">
                  {result.watch_next}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2.5 border-t border-orange-100 text-xs">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={
                    result.grounded
                      ? "bg-emerald-50 text-emerald-800 border-emerald-300 text-[10px] font-bold px-2 py-0.5 shadow-xs"
                      : "bg-amber-50 text-amber-800 border-amber-300 text-[10px] font-bold px-2 py-0.5 shadow-xs"
                  }
                >
                  {result.grounded ? (
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Grounded
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 text-amber-600" /> Unverified
                    </span>
                  )}
                </Badge>

                {!result.telemetry.ai && (
                  <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 text-[10px] font-semibold px-2 py-0.5">
                    Template
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onTrigger(language)}
                  className="h-7 px-2 text-xs font-semibold text-stone-600 hover:text-orange-600 hover:bg-orange-50"
                >
                  <RotateCw className="h-3.5 w-3.5 mr-1" /> Refresh
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onReset}
                  className="h-7 px-2 text-xs font-semibold text-stone-600 hover:text-rose-600 hover:bg-rose-50"
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
