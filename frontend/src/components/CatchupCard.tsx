import React, { useState } from "react"
import { Card, CardContent } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Skeleton } from "./ui/skeleton"
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group"
import { Sparkles, CheckCircle2, AlertTriangle, BookOpen, Zap, Eye, RefreshCw } from "lucide-react"
import { CatchupResponse } from "../types/match"
import { StreamStatus } from "../hooks/useCatchupStream"

interface CatchupCardProps {
  status: StreamStatus
  streamingText: string
  result: CatchupResponse | null
  error: string | null
  onTrigger: (language: "en" | "hinglish") => void
  onReset: () => void
}

export const CatchupCard: React.FC<CatchupCardProps> = ({
  status,
  streamingText,
  result,
  error,
  onTrigger,
  onReset,
}) => {
  const [language, setLanguage] = useState<"en" | "hinglish">("en")

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-primary/10 via-card to-card border border-primary/20 shadow-lg">
        <div>
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Live Catch-Up
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Arrived late? Get grounded context instantly with key moments and match trajectory.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <ToggleGroup
            type="single"
            value={language}
            onValueChange={(val) => {
              if (val) setLanguage(val as "en" | "hinglish")
            }}
            className="bg-secondary/60 p-1 rounded-xl border border-border/60"
          >
            <ToggleGroupItem value="en" size="sm" className="text-xs px-3">
              English
            </ToggleGroupItem>
            <ToggleGroupItem value="hinglish" size="sm" className="text-xs px-3">
              Hinglish
            </ToggleGroupItem>
          </ToggleGroup>

          <Button
            size="lg"
            onClick={() => onTrigger(language)}
            disabled={status === "connecting" || status === "streaming"}
            className="relative overflow-hidden font-bold tracking-wide shadow-md shadow-primary/20 group"
          >
            <span className="relative z-10 flex items-center gap-2">
              <Sparkles className="h-4 w-4 group-hover:rotate-12 transition-transform" />
              I Just Joined
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-emerald-400 to-primary opacity-0 group-hover:opacity-20 transition-opacity" />
          </Button>
        </div>
      </div>

      {status !== "idle" && (
        <Card className="w-full bg-card/90 border-border/80 shadow-2xl backdrop-blur-md overflow-hidden relative">
          <div className="p-4 sm:p-6 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Catch-Up Summary ({language.toUpperCase()})
                </span>
                {result && (
                  <Badge
                    variant="outline"
                    className={
                      result.grounded
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs font-medium"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/30 text-xs font-medium"
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
                )}
                {result && !result.telemetry.ai && (
                  <Badge variant="outline" className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-xs font-medium">
                    Template Fallback
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onTrigger(language)}
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1" /> Re-check
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onReset}
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  Close
                </Button>
              </div>
            </div>

            {status === "connecting" && (
              <div className="space-y-3 py-4">
                <Skeleton className="h-5 w-3/4 bg-secondary/60" />
                <Skeleton className="h-4 w-full bg-secondary/50" />
                <Skeleton className="h-4 w-5/6 bg-secondary/50" />
                <div className="pt-2 text-xs text-muted-foreground text-center animate-pulse">
                  Analyzing match situation and synthesizing commentary...
                </div>
              </div>
            )}

            {status === "streaming" && (
              <div className="py-2">
                <div className="text-xs text-muted-foreground uppercase font-semibold mb-2 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-primary animate-ping" />
                  Generating Realtime Catch-Up:
                </div>
                <div className="text-sm font-sans leading-relaxed text-foreground/90 bg-secondary/20 p-4 rounded-xl border border-border/40 font-mono">
                  {streamingText}
                  <span className="inline-block w-1.5 h-4 ml-1 bg-primary animate-pulse align-middle" />
                </div>
              </div>
            )}

            {status === "error" && (
              <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-center justify-between">
                <span>{error || "An error occurred during catch-up"}</span>
                <Button size="sm" variant="outline" onClick={() => onTrigger(language)}>
                  Retry
                </Button>
              </div>
            )}

            {status === "done" && result && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-secondary/30 border border-border/50 space-y-2">
                  <div className="flex items-center gap-2 text-primary font-bold text-sm">
                    <BookOpen className="h-4 w-4" />
                    <span>Story so far</span>
                  </div>
                  <p className="text-sm text-foreground/90 leading-relaxed">
                    {result.story}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-secondary/30 border border-border/50 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                    <Zap className="h-4 w-4" />
                    <span>Turning point</span>
                  </div>
                  <p className="text-sm text-foreground/90 leading-relaxed">
                    {result.turning_point}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-secondary/30 border border-border/50 space-y-2">
                  <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                    <Eye className="h-4 w-4" />
                    <span>Watch next</span>
                  </div>
                  <p className="text-sm text-foreground/90 leading-relaxed">
                    {result.watch_next}
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
