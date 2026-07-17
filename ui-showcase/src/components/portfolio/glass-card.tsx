import { cn } from "@/lib/utils"

export function GlassCard({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "rounded-xl bg-white/[0.03] backdrop-blur-xl",
        "border border-white/[0.06]",
        className
      )}
    >
      {children}
    </div>
  )
}
