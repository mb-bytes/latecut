import React from "react"
import { Button } from "./ui/button"
import { Slider } from "./ui/slider"
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group"
import { Play, Pause, RotateCcw, FastForward } from "lucide-react"
import { ReplayState } from "../types/match"

interface ReplayControlsProps {
  replay: ReplayState | undefined
  onControl: (action: string, over?: number, speed?: number) => void
}

export const ReplayControls: React.FC<ReplayControlsProps> = ({ replay, onControl }) => {
  const isPlaying = replay?.is_playing ?? false
  const currentSpeed = replay?.speed_multiplier ? String(replay.speed_multiplier) : "1"

  return (
    <div className="w-full bg-card/80 border border-border/80 rounded-xl p-3 sm:p-4 shadow-sm space-y-3">
      <div className="flex flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant={isPlaying ? "destructive" : "default"}
            onClick={() => onControl(isPlaying ? "pause" : "play")}
            className="h-8 px-3 text-xs font-semibold flex items-center gap-1.5"
          >
            {isPlaying ? (
              <>
                <Pause className="h-3.5 w-3.5" /> Pause
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" /> Play
              </>
            )}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onControl("restart")}
            className="h-8 px-2.5 text-xs flex items-center gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Restart
          </Button>
        </div>

        <div className="flex items-center gap-1.5">
          <FastForward className="h-3.5 w-3.5 text-muted-foreground" />
          <ToggleGroup
            type="single"
            value={currentSpeed}
            onValueChange={(val) => {
              if (val) onControl("speed", undefined, parseFloat(val))
            }}
            className="bg-secondary/40 p-0.5 rounded-lg border border-border/50"
          >
            <ToggleGroupItem value="1" size="sm" className="text-[11px] px-2 h-7 font-mono">
              1x
            </ToggleGroupItem>
            <ToggleGroupItem value="5" size="sm" className="text-[11px] px-2 h-7 font-mono">
              5x
            </ToggleGroupItem>
            <ToggleGroupItem value="10" size="sm" className="text-[11px] px-2 h-7 font-mono">
              10x
            </ToggleGroupItem>
            <ToggleGroupItem value="30" size="sm" className="text-[11px] px-2 h-7 font-mono">
              30x
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      <div className="pt-2 border-t border-border/40 space-y-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-medium text-foreground">Join at over (simulate late join)</span>
          <span className="font-mono text-muted-foreground">0 - 20 ov</span>
        </div>
        <Slider
          defaultValue={[0]}
          max={19}
          min={0}
          step={1}
          onValueCommit={(val) => {
            if (val.length > 0) {
              onControl("seek", val[0])
            }
          }}
          className="w-full cursor-pointer py-1"
        />
      </div>
    </div>
  )
}
