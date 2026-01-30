import { useState, useEffect } from "react";
import { Play, Pause, RotateCcw, Coffee, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useTimer } from "@/context/TimerContext";

/**
 * Study Timer Component
 * 
 * Uses global TimerContext so timer state persists when
 * the component unmounts (e.g., when mobile Sheet closes).
 */
const StudyTimer = () => {
  const {
    focusMinutes,
    breakMinutes,
    mode,
    timeLeft,
    isRunning,
    sessions,
    setFocusMinutes,
    setBreakMinutes,
    toggleTimer,
    resetTimer,
    switchMode,
  } = useTimer();

  const FOCUS_TIME = focusMinutes * 60;
  const BREAK_TIME = breakMinutes * 60;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = mode === "focus"
    ? ((FOCUS_TIME - timeLeft) / FOCUS_TIME) * 100
    : ((BREAK_TIME - timeLeft) / BREAK_TIME) * 100;

  return (
    <div className="p-4 bg-card rounded-xl border border-border">
      {/* Header with settings */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-foreground">Study Timer</span>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Settings className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64" align="end">
            <div className="space-y-4">
              <div>
                <Label htmlFor="focus" className="text-sm">Focus Duration (minutes)</Label>
                <Input
                  id="focus"
                  type="number"
                  min={1}
                  max={120}
                  value={focusMinutes}
                  onChange={(e) => setFocusMinutes(Number(e.target.value))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="break" className="text-sm">Break Duration (minutes)</Label>
                <Input
                  id="break"
                  type="number"
                  min={1}
                  max={60}
                  value={breakMinutes}
                  onChange={(e) => setBreakMinutes(Number(e.target.value))}
                  className="mt-1"
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-1 p-1 bg-secondary/50 rounded-lg mb-4">
        <button
          onClick={() => switchMode("focus")}
          className={cn(
            "flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all",
            mode === "focus"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Focus
        </button>
        <button
          onClick={() => switchMode("break")}
          className={cn(
            "flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-1",
            mode === "break"
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Coffee className="w-3.5 h-3.5" />
          Break
        </button>
      </div>

      {/* Timer display */}
      <div className="relative flex items-center justify-center mb-4">
        <div className="relative w-32 h-32">
          <svg className="w-full h-full -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="56"
              fill="none"
              stroke="hsl(var(--secondary))"
              strokeWidth="8"
            />
            <circle
              cx="64"
              cy="64"
              r="56"
              fill="none"
              stroke={mode === "focus" ? "hsl(var(--primary))" : "hsl(var(--accent))"}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 56}`}
              strokeDashoffset={`${2 * Math.PI * 56 * (1 - progress / 100)}`}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl font-mono font-bold text-foreground">
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        <Button variant="ghost" size="icon" onClick={resetTimer}>
          <RotateCcw className="w-4 h-4" />
        </Button>
        <Button
          variant={mode === "focus" ? "default" : "accent"}
          size="icon"
          className="h-12 w-12 rounded-full"
          onClick={toggleTimer}
        >
          {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
        </Button>
        <div className="w-10" />
      </div>

      {/* Sessions count */}
      <div className="mt-4 text-center">
        <p className="text-xs text-muted-foreground">
          Sessions completed: <span className="text-primary font-medium">{sessions}</span>
        </p>
      </div>
    </div>
  );
};

export default StudyTimer;
