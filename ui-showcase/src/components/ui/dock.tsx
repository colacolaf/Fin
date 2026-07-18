"use client"

import * as React from "react"
import { motion, useMotionValue, useSpring, useTransform } from "motion/react"
import { cn } from "@/lib/utils"

// ------------------------------------------------------------------
// Dock context
// ------------------------------------------------------------------
interface DockContextValue {
  hovered: boolean
  setIsZooming: (value: boolean) => void
  width: number
  zoomLevel: ReturnType<typeof useMotionValue<number>>
  mouseX: ReturnType<typeof useMotionValue<number>>
  animatingIndexes: number[]
  setAnimatingIndexes: React.Dispatch<React.SetStateAction<number[]>>
}

const DockContext = React.createContext<DockContextValue | null>(null)

function useDock() {
  const context = React.useContext(DockContext)
  if (!context) {
    throw new Error("useDock must be used within a Dock provider")
  }
  return context
}

// ------------------------------------------------------------------
// Window resize hook
// ------------------------------------------------------------------
function useWindowResize(callback: () => void) {
  React.useEffect(() => {
    callback()
    window.addEventListener("resize", callback)
    return () => window.removeEventListener("resize", callback)
  }, [callback])
}

// ------------------------------------------------------------------
// Dock
// ------------------------------------------------------------------
interface DockProps {
  children?: React.ReactNode
  className?: string
}

function Dock({ children, className }: DockProps) {
  const [hovered, setHovered] = React.useState(false)
  const [width, setWidth] = React.useState(0)
  const dockRef = React.useRef<HTMLDivElement>(null)
  const isZooming = React.useRef(false)
  const [animatingIndexes, setAnimatingIndexes] = React.useState<number[]>([])

  const setIsZooming = React.useCallback((value: boolean) => {
    isZooming.current = value
    setHovered(!value)
  }, [])

  const zoomLevel = useMotionValue(1)
  const mouseX = useMotionValue(Infinity)

  useWindowResize(() => {
    setWidth(dockRef.current?.clientWidth || 0)
  })

  return (
    <DockContext.Provider
      value={{
        hovered,
        setIsZooming,
        width,
        zoomLevel,
        mouseX,
        animatingIndexes,
        setAnimatingIndexes,
      }}
    >
      <motion.div
        ref={dockRef}
        className={cn(
          "flex h-14 items-end gap-3 rounded-xl bg-black/90 p-2",
          className
        )}
        onMouseMove={(e) => {
          mouseX.set(e.pageX)
          if (!isZooming.current) {
            setHovered(true)
          }
        }}
        onMouseLeave={() => {
          mouseX.set(Infinity)
          setHovered(false)
        }}
        style={{
          scale: zoomLevel,
        }}
      >
        {children}
      </motion.div>
    </DockContext.Provider>
  )
}

// ------------------------------------------------------------------
// DockCard
// ------------------------------------------------------------------
interface DockCardProps {
  id: string
  children?: React.ReactNode
  className?: string
  index?: number
  onClick?: () => void
}

function DockCard({ id, children, className, index = 0, onClick }: DockCardProps) {
  const { mouseX, setIsZooming, animatingIndexes, setAnimatingIndexes } = useDock()
  const ref = React.useRef<HTMLDivElement>(null)

  const distance = useTransform(() => {
    const bounds = ref.current?.getBoundingClientRect()
    if (!bounds) return Infinity
    const center = bounds.x + bounds.width / 2
    return mouseX.get() - center
  })

  const widthSync = useTransform(distance, [-200, 0, 200], [40, 80, 40])
  const widthSpring = useSpring(widthSync, { mass: 0.1, stiffness: 150, damping: 12 })

  const handleClick = React.useCallback(() => {
    setIsZooming(true)
    setAnimatingIndexes((prev) => (prev.includes(index) ? prev : [...prev, index]))
    setTimeout(() => {
      setAnimatingIndexes((prev) => prev.filter((i) => i !== index))
      setIsZooming(false)
    }, 600)
    onClick?.()
  }, [index, setIsZooming, setAnimatingIndexes, onClick])

  return (
    <motion.div
      ref={ref}
      className={cn(
        "relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-white/10 transition-colors hover:bg-white/20",
        className
      )}
      style={{ width: widthSpring, height: widthSpring }}
      onClick={handleClick}
      animate={
        animatingIndexes.includes(index)
          ? { y: [0, -20, 0], transition: { duration: 0.6 } }
          : {}
      }
    >
      {children}
    </motion.div>
  )
}

// ------------------------------------------------------------------
// DockCardInner
// ------------------------------------------------------------------
interface DockCardInnerProps {
  src?: string
  id?: string
  children?: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

function DockCardInner({ src, children, className, style }: DockCardInnerProps) {
  return (
    <div
      className={cn(
        "relative flex h-full w-full items-center justify-center overflow-hidden rounded-xl",
        className
      )}
      style={{
        ...(src ? {
          backgroundImage: `url(${src})`,
          backgroundSize: "cover" as const,
          backgroundPosition: "center" as const,
        } : {}),
        ...style,
      }}
    >
      {children}
    </div>
  )
}

// ------------------------------------------------------------------
// DockDivider
// ------------------------------------------------------------------
function DockDivider({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "mx-1 h-8 w-px self-center bg-white/20",
        className
      )}
    />
  )
}

export { Dock, DockCard, DockCardInner, DockDivider, useDock }
