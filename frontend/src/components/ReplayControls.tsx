import React, { useState, useEffect, useRef } from "react"
import { Button } from "./ui/button"
import { Slider } from "./ui/slider"
import { Badge } from "./ui/badge"
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group"
import { Play, Pause, RotateCcw, FastForward, Sliders } from "lucide-react"
import { ReplayState } from "../types/match"

interface ReplayControlsProps {
  replay: ReplayState | undefined
  currentInnings?: number
  currentOverStr?: string
  hasTwoInnings?: boolean
  onControl: (action: string, over?: number, speed?: number, innings?: number) => void
}

export const ReplayControls: React.FC<ReplayControlsProps> = ({
  replay,
  currentInnings = 1,
  currentOverStr = "0.0",
  hasTwoInnings = true,
  onControl,
}) => {
  const isPlaying = replay?.is_playing ?? false
  const currentSpeed = replay?.speed_multiplier ? String(replay.speed_multiplier) : "1"

  // Parse current over number (e.g. "2.4" -> 2)
  const currentOverNum = Math.min(19, Math.max(0, parseInt(currentOverStr.split(".")[0], 10) || 0))
  const [selectedOver, setSelectedOver] = useState<number>(currentOverNum)
  const [selectedInnings, setSelectedInnings] = useState<number>(currentInnings)
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const targetOverRef = useRef<number | null>(null)
  const seekTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Keep in sync with incoming state when not actively dragging or waiting for seek
  useEffect(() => {
    if (isDragging) return

    if (targetOverRef.current !== null) {
      if (currentOverNum === targetOverRef.current) {
        targetOverRef.current = null
        if (seekTimeoutRef.current) clearTimeout(seekTimeoutRef.current)
      } else {
        // Prevent snapping back to old state while seek is propagating
        return
      }
    }

    setSelectedOver(currentOverNum)
  }, [currentOverNum, isDragging])

  useEffect(() => {
    setSelectedInnings(currentInnings)
  }, [currentInnings])

  const handleInningsChange = (newInnings: number) => {
    setSelectedInnings(newInnings)
    targetOverRef.current = selectedOver
    onControl("seek", selectedOver, undefined, newInnings)
  }

  const handleSliderChange = (vals: number[]) => {
    if (vals.length > 0) {
      setIsDragging(true)
      setSelectedOver(vals[0])
    }
  }

  const handleSliderCommit = (vals: number[]) => {
    setIsDragging(false)
    if (vals.length > 0) {
      const over = vals[0]
      setSelectedOver(over)
      targetOverRef.current = over
      if (seekTimeoutRef.current) clearTimeout(seekTimeoutRef.current)
      seekTimeoutRef.current = setTimeout(() => {
        targetOverRef.current = null
      }, 3000)
      onControl("seek", over, undefined, selectedInnings)
    }
  }

  const quickOvers = [0, 5, 10, 15, 19]

  return (
    <div className="w-full bg-card border border-orange-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow space-y-4">
      {/* Top row: Play/Pause/Restart & Speed & Innings toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={isPlaying ? "destructive" : "default"}
            onClick={() => onControl(isPlaying ? "pause" : "play")}
            className="h-8 px-3.5 text-xs font-bold flex items-center gap-1.5 shadow-sm bg-orange-500 hover:bg-orange-600 text-white"
          >
            {isPlaying ? (
              <>
                <Pause className="h-3.5 w-3.5" /> Pause
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current" /> Play
              </>
            )}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onControl("restart")}
            className="h-8 px-2.5 text-xs font-semibold flex items-center gap-1.5 border-orange-200 text-stone-700 hover:bg-orange-50 hover:text-orange-700"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Restart
          </Button>
        </div>

        {/* Innings Switcher */}
        <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200/80">
          <span className="text-[11px] font-semibold text-stone-500 px-1.5">Innings:</span>
          <Button
            type="button"
            size="sm"
            variant={selectedInnings === 1 ? "default" : "ghost"}
            onClick={() => handleInningsChange(1)}
            className={`h-6 px-2.5 text-[11px] font-bold rounded-lg transition-all ${
              selectedInnings === 1 ? "bg-orange-500 text-white shadow-xs" : "text-stone-600 hover:text-stone-900 hover:bg-stone-200/50"
            }`}
          >
            1st Inn
          </Button>
          <Button
            type="button"
            size="sm"
            variant={selectedInnings === 2 ? "default" : "ghost"}
            onClick={() => handleInningsChange(2)}
            className={`h-6 px-2.5 text-[11px] font-bold rounded-lg transition-all ${
              selectedInnings === 2 ? "bg-orange-500 text-white shadow-xs" : "text-stone-600 hover:text-stone-900 hover:bg-stone-200/50"
            }`}
            disabled={!hasTwoInnings}
          >
            2nd Inn
          </Button>
        </div>

        {/* Speed toggle */}
        <div className="flex items-center gap-1.5">
          <FastForward className="h-3.5 w-3.5 text-orange-500" />
          <ToggleGroup
            type="single"
            value={currentSpeed}
            onValueChange={(val) => {
              if (val) onControl("speed", undefined, parseFloat(val))
            }}
            className="bg-stone-100 p-1 rounded-xl border border-stone-200/80"
          >
            {["1", "5", "10", "30"].map((spd) => (
              <ToggleGroupItem
                key={spd}
                value={spd}
                size="sm"
                className="text-[11px] px-2 h-6 font-mono font-bold rounded-lg data-[state=on]:bg-orange-500 data-[state=on]:text-white data-[state=on]:shadow-xs"
              >
                {spd}x
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </div>

      {/* Bottom row: Over Slider with clear numerical over indicator */}
      <div className="pt-3 border-t border-orange-100 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Sliders className="h-3.5 w-3.5 text-orange-500" />
            <span className="font-bold text-foreground">Simulate Match Progress:</span>
            <Badge
              variant="outline"
              className="bg-orange-50 text-orange-700 border-orange-300 font-mono text-xs font-bold px-2 py-0.5"
            >
              Over {selectedOver} (Inn {selectedInnings})
            </Badge>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>Current ball:</span>
            <span className="font-mono font-bold text-foreground bg-stone-100 px-1.5 py-0.5 rounded border border-stone-200/80">{currentOverStr} ov</span>
          </div>
        </div>

        <Slider
          value={[selectedOver]}
          max={19}
          min={0}
          step={1}
          onValueChange={handleSliderChange}
          onValueCommit={handleSliderCommit}
          className="w-full cursor-pointer py-1.5"
        />

        {/* Quick over jump shortcuts */}
        <div className="flex items-center justify-between pt-1 text-xs">
          <span className="text-muted-foreground font-medium">Jump to over:</span>
          <div className="flex items-center gap-1.5">
            {quickOvers.map((ov) => (
              <button
                key={ov}
                type="button"
                onClick={() => {
                  setSelectedOver(ov)
                  targetOverRef.current = ov
                  if (seekTimeoutRef.current) clearTimeout(seekTimeoutRef.current)
                  seekTimeoutRef.current = setTimeout(() => {
                    targetOverRef.current = null
                  }, 3000)
                  onControl("seek", ov, undefined, selectedInnings)
                }}
                className={`px-2.5 py-1 rounded-lg font-mono text-[11px] transition-all border ${
                  selectedOver === ov
                    ? "bg-orange-500 text-white border-orange-500 font-bold shadow-xs"
                    : "bg-orange-50/60 text-stone-700 border-orange-200 hover:bg-orange-100 hover:text-orange-900"
                }`}
              >
                Ov {ov}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
