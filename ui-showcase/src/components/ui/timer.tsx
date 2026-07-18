"use client"

import * as React from "react"
import { Clock, type LucideIcon } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/* ------------------------------------------------------------------ */
/*  useTimer — the engine                                              */
/* ------------------------------------------------------------------ */

type TimerFormat = "SS.MS" | "MM:SS" | "HH:MM:SS"

interface UseTimerOptions {
  loading?: boolean
  onTick?: (seconds: number, milliseconds: number) => void
  resetOnLoadingChange?: boolean
  format?: TimerFormat
}

interface FormattedTime {
  display: string
  hours: string
  minutes: string
  seconds: string
  milliseconds: string
}

function formatTimer(elapsedSeconds: number, ms: number, format: TimerFormat): FormattedTime {
  const hours = Math.floor(elapsedSeconds / 3600)
  const minutes = Math.floor((elapsedSeconds % 3600) / 60)
  const seconds = elapsedSeconds % 60
  const pad = (n: number, len = 2) => n.toString().padStart(len, "0")

  const base = {
    hours: pad(hours),
    minutes: pad(minutes),
    seconds: pad(seconds),
    milliseconds: pad(ms, 3).slice(0, 2),
  }

  let display: string
  switch (format) {
    case "HH:MM:SS":
      display = `${base.hours}:${base.minutes}:${base.seconds}`
      break
    case "MM:SS":
      display = `${base.minutes}:${base.seconds}`
      break
    case "SS.MS":
    default:
      display = `${base.seconds}.${base.milliseconds}`
      break
  }

  return { display, ...base }
}

/**
 * useTimer — drives the Timer visual components.
 * Tracks elapsed time while `loading` is true. Resets on loading
 * change when `resetOnLoadingChange` is true (default).
 */
function useTimer({
  loading = false,
  onTick,
  resetOnLoadingChange = true,
  format = "SS.MS",
}: UseTimerOptions = {}) {
  const [elapsedTime, setElapsedTime] = React.useState(0)
  const [milliseconds, setMilliseconds] = React.useState(0)
  const [isRunning, setIsRunning] = React.useState(loading)
  const startRef = React.useRef<number | null>(null)
  const elapsedRef = React.useRef(0)
  const rafRef = React.useRef<number | null>(null)
  const onTickRef = React.useRef(onTick)

  React.useEffect(() => {
    onTickRef.current = onTick
  }, [onTick])

  // Sync loading prop → running state. The synchronous reset below is
  // intentional: when `loading` flips we zero the display so the next run
  // starts from 00:00. This is a prop→state sync, not a derived effect.
  React.useEffect(() => {
    if (resetOnLoadingChange) {
      elapsedRef.current = 0
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional reset on prop change
      setElapsedTime(0)
      setMilliseconds(0)
    }
    if (loading) {
      startRef.current = performance.now()
      setIsRunning(true)
    } else {
      setIsRunning(false)
    }
  }, [loading, resetOnLoadingChange])

  // RAF loop
  React.useEffect(() => {
    if (!isRunning || startRef.current == null) return

    const tick = (now: number) => {
      const totalMs = elapsedRef.current + (now - startRef.current!)
      const secs = Math.floor(totalMs / 1000)
      const ms = Math.floor(totalMs % 1000)
      setElapsedTime(secs)
      setMilliseconds(ms)
      onTickRef.current?.(secs, ms)
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (startRef.current != null) {
        elapsedRef.current += performance.now() - startRef.current
        startRef.current = null
      }
    }
  }, [isRunning])

  const start = React.useCallback(() => {
    startRef.current = performance.now()
    setIsRunning(true)
  }, [])

  const stop = React.useCallback(() => {
    if (startRef.current != null) {
      elapsedRef.current += performance.now() - startRef.current
      startRef.current = null
    }
    setIsRunning(false)
  }, [])

  const reset = React.useCallback(() => {
    elapsedRef.current = 0
    startRef.current = isRunning ? performance.now() : null
    setElapsedTime(0)
    setMilliseconds(0)
  }, [isRunning])

  const formattedTime = formatTimer(elapsedTime, milliseconds, format)

  return {
    elapsedTime,
    milliseconds,
    formattedTime,
    isRunning,
    reset,
    start,
    stop,
  }
}

/* ------------------------------------------------------------------ */
/*  Variants                                                          */
/* ------------------------------------------------------------------ */

const timerRootVariants = cva(
  "inline-flex items-center gap-1.5 rounded-md font-mono tabular-nums select-none",
  {
    variants: {
      variant: {
        default: "bg-white/[0.04] text-white/80",
        outline: "border border-white/[0.10] text-white/80",
        ghost: "text-white/60 hover:text-white/80",
        destructive: "bg-[#F87171]/10 text-[#F87171]",
      },
      size: {
        sm: "h-6 px-2 text-[11px] gap-1",
        md: "h-8 px-3 text-xs gap-1.5",
        lg: "h-10 px-4 text-sm gap-2",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
)

const timerIconVariants = cva("shrink-0", {
  variants: {
    size: {
      sm: "h-3 w-3",
      md: "h-3.5 w-3.5",
      lg: "h-4 w-4",
    },
  },
  defaultVariants: {
    size: "md",
  },
})

const timerDisplayVariants = cva("tracking-wider", {
  variants: {
    size: {
      sm: "text-[11px]",
      md: "text-xs",
      lg: "text-sm",
    },
  },
  defaultVariants: {
    size: "md",
  },
})

/* ------------------------------------------------------------------ */
/*  TimerRoot — container                                              */
/* ------------------------------------------------------------------ */

interface TimerRootProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof timerRootVariants> {
  loading?: boolean
}

const TimerRoot = React.forwardRef<HTMLDivElement, TimerRootProps>(
  ({ className, variant, size, loading, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(timerRootVariants({ variant, size }), className)}
        data-running={loading ? "true" : "false"}
        {...props}
      >
        {children}
      </div>
    )
  }
)
TimerRoot.displayName = "TimerRoot"

/* ------------------------------------------------------------------ */
/*  TimerIcon — Clock that pulses while loading                        */
/* ------------------------------------------------------------------ */

interface TimerIconProps extends VariantProps<typeof timerIconVariants> {
  loading?: boolean
  icon?: LucideIcon
  className?: string
}

function TimerIcon({ loading = false, icon: Icon = Clock, size, className }: TimerIconProps) {
  return (
    <Icon
      className={cn(
        timerIconVariants({ size }),
        loading && "animate-pulse text-current",
        className
      )}
      aria-hidden
    />
  )
}

/* ------------------------------------------------------------------ */
/*  TimerDisplay                                                       */
/* ------------------------------------------------------------------ */

interface TimerDisplayProps extends VariantProps<typeof timerDisplayVariants> {
  time: string
  label?: string
  className?: string
}

function TimerDisplay({ time, label, size, className }: TimerDisplayProps) {
  return (
    <span
      className={cn(timerDisplayVariants({ size }), className)}
      role="timer"
      aria-label={label ?? `Elapsed ${time}`}
    >
      {time}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/*  Timer — composed convenience component                             */
/* ------------------------------------------------------------------ */

interface TimerProps
  extends Omit<UseTimerOptions, "loading">,
    VariantProps<typeof timerRootVariants> {
  loading?: boolean
  className?: string
}

function Timer({
  loading = false,
  onTick,
  resetOnLoadingChange,
  format = "SS.MS",
  variant,
  size,
  className,
}: TimerProps) {
  const { formattedTime } = useTimer({ loading, onTick, resetOnLoadingChange, format })
  return (
    <TimerRoot variant={variant} size={size} loading={loading} className={className}>
      <TimerIcon loading={loading} size={size} />
      <TimerDisplay time={formattedTime.display} size={size} />
    </TimerRoot>
  )
}

export {
  Timer,
  TimerRoot,
  TimerIcon,
  TimerDisplay,
  useTimer,
  type TimerFormat,
  type UseTimerOptions,
}
