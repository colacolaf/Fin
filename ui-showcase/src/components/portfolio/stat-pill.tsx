export function StatPill({
  label,
  value,
  color,
}: {
  label: string
  value: string
  color?: "green" | "red"
}) {
  return (
    <div className="flex flex-col min-w-0">
      <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/[0.38] mb-1">
        {label}
      </span>
      <span
        className="text-[15px] font-semibold tabular-nums"
        style={{
          color:
            color === "green"
              ? "#34D399"
              : color === "red"
                ? "#F87171"
                : "#F7F8FA",
        }}
      >
        {value}
      </span>
    </div>
  )
}
