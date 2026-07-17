"use client"

/**
 * Liquid glass ambient background for debt pages.
 * Renders soft blurred color orbs behind content to create depth.
 * ponytail: pure CSS + Tailwind, no JS animation library needed.
 */

export function LiquidGlassBg({
  primary,
  secondary,
}: {
  primary: string
  secondary: string
}) {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Base dark layer */}
      <div className="absolute inset-0 bg-[#08090C]" />

      {/* Primary orb — top left */}
      <div
        className="absolute -top-[15%] -left-[10%] h-[60%] w-[50%] rounded-full opacity-[0.12] blur-[120px]"
        style={{ background: `radial-gradient(circle, ${primary} 0%, transparent 70%)` }}
      />

      {/* Secondary orb — bottom right */}
      <div
        className="absolute -bottom-[10%] -right-[10%] h-[50%] w-[45%] rounded-full opacity-[0.08] blur-[100px]"
        style={{ background: `radial-gradient(circle, ${secondary} 0%, transparent 70%)` }}
      />

      {/* Small accent orb — center right */}
      <div
        className="absolute top-[30%] right-[5%] h-[30%] w-[25%] rounded-full opacity-[0.06] blur-[80px]"
        style={{ background: `radial-gradient(circle, ${primary} 0%, transparent 70%)` }}
      />

      {/* Subtle noise overlay for texture */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "128px 128px",
        }}
      />

      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(8,9,12,0.6)_100%)]" />
    </div>
  )
}
