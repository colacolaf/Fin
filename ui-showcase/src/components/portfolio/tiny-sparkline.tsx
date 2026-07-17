/**
 * Lightweight SVG sparkline for table cells.
 * ponytail: replaced ResponsiveContainer + AreaChart with raw <polyline>.
 * Zero dependencies, ~12 data points, 16x24px. No Recharts overhead.
 */

export function TinySparkline({
  data,
  positive,
}: {
  data: number[]
  positive: boolean
}) {
  const color = positive ? "#34D399" : "#F87171"
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const w = 64
  const h = 24
  const padding = 2

  const points = data
    .map((v, i) => {
      const x = padding + (i / (data.length - 1)) * (w - padding * 2)
      const y = h - padding - ((v - min) / range) * (h - padding * 2)
      return `${x},${y}`
    })
    .join(" ")

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className="shrink-0"
      aria-hidden
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
