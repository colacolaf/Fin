/**
 * Side-by-side before/after impact visualization for executed recommendations.
 * Shows portfolio value change, allocation shift, tax impact, or any metric pair.
 * Receives data as props — no API calls.
 */
interface BeforeAfterPair {
  label: string;
  before: string;
  after: string;
  /** Positive = improvement (green), negative = worse (red), 0 = neutral */
  delta?: number;
}

interface BeforeAfterProps {
  title: string;
  pairs: BeforeAfterPair[];
  /** Optional timestamp for "before" date */
  beforeDate?: string;
  afterDate?: string;
}

export default function BeforeAfter({
  title,
  pairs,
  beforeDate,
  afterDate,
}: BeforeAfterProps) {
  if (pairs.length === 0) return null;

  return (
    <div className="before-after" style={containerStyle}>
      <style>{`
        @keyframes fadeSlideUp {
          from { transform: translateY(8px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .before-after-row {
          animation: fadeSlideUp 300ms ease both;
        }
        .before-after-row:nth-child(2) { animation-delay: 50ms; }
        .before-after-row:nth-child(3) { animation-delay: 100ms; }
        .before-after-row:nth-child(4) { animation-delay: 150ms; }
        .before-after-row:nth-child(5) { animation-delay: 200ms; }
        @media (prefers-reduced-motion: reduce) {
          .before-after-row { animation: none; }
        }
      `}</style>

      <div style={headerStyle}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{title}</h3>
        {beforeDate && afterDate && (
          <span style={{ fontSize: 12, color: "oklch(0.55 0.01 240)" }}>
            {beforeDate} → {afterDate}
          </span>
        )}
      </div>

      {/* Column headers */}
      <div
        style={{
          display: "flex",
          fontSize: 11,
          color: "oklch(0.5 0.01 240)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          padding: "0 0 6px 0",
          borderBottom: "1px solid oklch(0.18 0.01 240)",
        }}
      >
        <span style={{ flex: 1 }}>Metric</span>
        <span style={{ width: 80, textAlign: "right" }}>Before</span>
        <span style={{ width: 28, textAlign: "center" }}></span>
        <span style={{ width: 80, textAlign: "right" }}>After</span>
        <span style={{ width: 60, textAlign: "right" }}>Δ</span>
      </div>

      {pairs.map((pair, i) => {
        const isPositive = (pair.delta ?? 0) > 0;
        const isNegative = (pair.delta ?? 0) < 0;
        const deltaColor = isPositive
          ? "oklch(0.65 0.18 160)"
          : isNegative
            ? "oklch(0.58 0.17 25)"
            : "oklch(0.55 0.01 240)";
        const deltaPrefix = isPositive ? "+" : "";

        return (
          <div
            key={i}
            className="before-after-row"
            style={{
              display: "flex",
              alignItems: "center",
              padding: "10px 0",
              borderBottom: "1px solid oklch(0.14 0.005 240)",
            }}
          >
            <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>
              {pair.label}
            </span>
            <span
              style={{ width: 80, textAlign: "right", fontSize: 13 }}
            >
              {pair.before}
            </span>
            <span
              style={{
                width: 28,
                textAlign: "center",
                fontSize: 12,
                color: "oklch(0.5 0.01 240)",
              }}
            >
              →
            </span>
            <span
              style={{
                width: 80,
                textAlign: "right",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {pair.after}
            </span>
            <span
              style={{
                width: 60,
                textAlign: "right",
                fontSize: 13,
                fontWeight: 600,
                color: deltaColor,
              }}
            >
              {pair.delta !== undefined ? `${deltaPrefix}${pair.delta}%` : "—"}
            </span>
          </div>
        );
      })}
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  padding: "16px 20px",
  borderRadius: 12,
  background: "oklch(0.16 0.005 240)",
  border: "1px solid oklch(0.2 0.01 240)",
  marginBottom: 16,
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "baseline",
  marginBottom: 12,
};