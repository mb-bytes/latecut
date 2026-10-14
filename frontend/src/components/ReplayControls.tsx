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
    <div className="w-full bg-card/70 border border-border/80 rounded-2xl p-4 shadow-md backdrop-blur-sm space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={isPlaying ? "destructive" : "default"}
            onClick={() => onControl(isPlaying ? "pause" : "play")}
            className="flex items-center gap-1.5 min-w-[90px]"
          >
            {isPlaying ? (
              <>
                <Pause className="h-4 w-4" /> Pause
              </>
            ) : (
              <>
                <Play className="h-4 w-4" /> Play
              </>
            )}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onControl("restart")}
            className="flex items-center gap-1.5"
          >
            <RotateCcw className="h-4 w-4" /> Restart
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <FastForward className="h-4 w-4 text-muted-foreground" />
          <ToggleGroup
            type="single"
            value={currentSpeed}
            onValueChange={(val) => {
              if (val) onControl("speed", undefined, parseFloat(val))
            }}
            className="bg-secondary/40 p-0.5 rounded-lg border border-border/50"
          >
            <ToggleGroupItem value="1" size="sm" className="text-xs px-2.5">
              1x
            </ToggleGroupItem>
            <ToggleGroupItem value="5" size="sm" className="text-xs px-2.5">
              5x
            </ToggleGroupItem>
            <ToggleGroupItem value="10" size="sm" className="text-xs px-2.5">
              10x
            </ToggleGroupItem>
            <ToggleGroupItem value="30" size="sm" className="text-xs px-2.5">
              30x
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      <div className="pt-2 border-t border-border/40 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-foreground">Join match at over (simulate arriving late)</span>
          <span className="font-mono text-muted-foreground">0 - 20 overs</span>
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
