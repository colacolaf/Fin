"use client"

import { useEffect, useState } from "react"
import { useAtom } from "jotai"
import { motion, AnimatePresence } from "motion/react"
import { Check, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import ShaderLensBlur, { configAtom } from "@/components/ui/shader-lens-blur"

const loadingMessages = [
  "Initializing secure local environment...",
  "Connecting to brokerage APIs...",
  "Syncing portfolio data...",
  "Loading debt accounts...",
  "Preparing retirement projections...",
  "Waking up AI agents...",
  "Finance OS is ready.",
]

export default function LoadingScreen({
  onComplete,
}: {
  onComplete?: () => void
}) {
  const [config, setConfig] = useAtom(configAtom)
  const [progress, setProgress] = useState(0)

  // Ensure the shader fills the loading screen container.
  useEffect(() => {
    setConfig((prev) => ({ ...prev, width: "100%", height: "100%" }))
  }, [setConfig])
  const [messageIndex, setMessageIndex] = useState(0)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    let rafId: number
    const start = performance.now()
    const duration = 6000 // 6 seconds loading

    const animate = (now: number) => {
      const elapsed = now - start
      const nextProgress = Math.min((elapsed / duration) * 100, 100)
      setProgress(nextProgress)
      setMessageIndex(Math.min(Math.floor((nextProgress / 100) * loadingMessages.length), loadingMessages.length - 1))

      if (nextProgress < 100) {
        rafId = requestAnimationFrame(animate)
      } else {
        setIsReady(true)
        setTimeout(() => onComplete?.(), 800)
      }
    }

    rafId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafId)
  }, [onComplete])

  const colors = [
    { key: "color1", label: "Color 1" },
    { key: "color2", label: "Color 2" },
    { key: "color3", label: "Color 3" },
    { key: "color4", label: "Color 4" },
  ] as const

  return (
    <div className="relative z-0 flex h-full w-full flex-col overflow-hidden rounded-2xl bg-black text-white">
      {/* Full-screen shader background */}
      <div className="absolute inset-0">
        <ShaderLensBlur />
      </div>

      {/* Color palette box — bottom left corner */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="absolute bottom-8 left-8 z-20 rounded-xl border border-white/10 bg-black/40 p-4 backdrop-blur-md"
      >
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-white/60">
          Color Palette
        </p>
        <div className="grid grid-cols-2 gap-3">
          {colors.map(({ key, label }) => (
            <div key={key} className="flex flex-col gap-1">
              <label htmlFor={`loading-color-${key}`} className="text-[10px] text-white/50">
                {label}
              </label>
              <input
                id={`loading-color-${key}`}
                type="color"
                value={config[key as keyof typeof config] as string}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, [key]: e.target.value }))
                }
                className="h-8 w-full cursor-pointer rounded-md border border-white/10 bg-transparent"
              />
            </div>
          ))}
        </div>
      </motion.div>

      {/* Bottom status messages */}
      <div className="absolute bottom-8 right-8 z-20 flex items-center gap-4 rounded-xl border border-white/10 bg-black/40 px-5 py-3 backdrop-blur-md">
        <AnimatePresence mode="wait">
          {isReady ? (
            <motion.div
              key="ready"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2 text-sm font-medium text-emerald-400"
            >
              <Check className="size-4" />
              System Ready
            </motion.div>
          ) : (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-3"
            >
              <Loader2 className="size-4 animate-spin text-white/70" />
              <span className="text-sm text-white/80">
                {loadingMessages[messageIndex]}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-2">
          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full bg-white"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
          <span className="min-w-[3ch] text-right text-xs font-medium tabular-nums text-white/70">
            {Math.round(progress)}%
          </span>
        </div>
      </div>
    </div>
  )
}
