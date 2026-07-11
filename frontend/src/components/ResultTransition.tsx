/**
 * ResultTransition — animated stat cards for backtest results.
 * Numbers count up from 0, cards stagger-fade in, color coding for positive/negative.
 * Handles loading, success, error states. prefers-reduced-motion respected.
 */
import { useState, useEffect, useRef } from "react";

export interface BacktestStats {
  total_return_pct: number | null;
  sharpe_ratio: number | null;
  max_drawdown_pct: number | null;
  win_rate_pct: number | null;
  total_trades: number | null;
  final_value: number | null;
  initial_cash?: number;
}

interface Props {
  stats: BacktestStats | null;
  loading?: boolean;
  error?: string | null;
}

export default function ResultTransition({ stats, loading, error }: Props) {
  return (
    <div style={containerStyle}>
      <style>{styles}</style>

      {loading ? (
        <div style={stateRow}>
          <div className="pulse-dot" />
          <span style={{ fontSize: 13, color: "oklch(0.55 0.01 240)" }}>Running backtest…</span>
        </div>
      ) : error ? (
        <div style={stateRow}>
          <span style={{ fontSize: 13, color: "oklch(0.58 0.17 25)" }}>⚠ {error}</span>
        </div>
      ) : stats ? (
        <div className="stats-grid" style={gridStyle}>
          <StatCard label="Total Return" value={stats.total_return_pct} suffix="%" isPct />
          <StatCard label="Sharpe" value={stats.sharpe_ratio} decimals={2} />
          <StatCard label="Max Drawdown" value={stats.max_drawdown_pct} suffix="%" isPct isDrawdown />
          <StatCard label="Win Rate" value={stats.win_rate_pct} suffix="%" />
          <StatCard label="Trades" value={stats.total_trades} decimals={0} />
          <StatCard label="Final Value" value={stats.final_value} prefix="$" decimals={0} />
        </div>
      ) : (
        <div style={stateRow}>
          <span style={{ fontSize: 13, color: "oklch(0.45 0.01 240)" }}>Run a backtest to see results</span>
        </div>
      )}
    </div>
  );
}

// ── Stat Card with count-up animation ──────────────────────────

function StatCard({
  label,
  value,
  prefix = "",
  suffix = "",
  decimals = 1,
  isPct = false,
  isDrawdown = false,
}: {
  label: string;
  value: number | null;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  isPct?: boolean;
  isDrawdown?: boolean;
}) {
  const [display, setDisplay] = useState(0);
  const target = value ?? 0;
  const frameRef = useRef<number | null>(null);
  const startRef = useRef(0);

  useEffect(() => {
    startRef.current = display;
    const duration = 600; // ms for count-up
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      const current = startRef.current + (target - startRef.current) * eased;
      setDisplay(current);
      if (t < 1) {
        frameRef.current = requestAnimationFrame(tick);
      }
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [target]);

  const abs = Math.abs(display);
  const formattedNum = decimals === 0 ? Math.round(abs).toString() : abs.toFixed(decimals);

  // Color logic
  let color = "oklch(0.75 0.01 240)";
  if (value !== null) {
    if (isDrawdown) {
      color = value < -10 ? "oklch(0.58 0.17 25)" : value < 0 ? "oklch(0.6 0.1 60)" : "oklch(0.65 0.18 160)";
    } else if (isPct) {
      color = value > 0 ? "oklch(0.65 0.18 160)" : value < 0 ? "oklch(0.58 0.17 25)" : "oklch(0.75 0.01 240)";
    } else {
      color = "oklch(0.75 0.01 240)";
    }
  }

  return (
    <div className="stat-card" style={cardStyle}>
      <span style={{ fontSize: 11, color: "oklch(0.5 0.01 240)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
        {label}
      </span>
      <span style={{ fontSize: 22, fontWeight: 700, color, fontVariantNumeric: "tabular-nums" }}>
        {prefix}{formattedNum}{suffix}
      </span>
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────────

const styles = `
  @keyframes cardSlideIn {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 1; }
  }
  .stat-card {
    animation: cardSlideIn 350ms ease-out both;
  }
  .stat-card:nth-child(1) { animation-delay: 0ms; }
  .stat-card:nth-child(2) { animation-delay: 60ms; }
  .stat-card:nth-child(3) { animation-delay: 120ms; }
  .stat-card:nth-child(4) { animation-delay: 180ms; }
  .stat-card:nth-child(5) { animation-delay: 240ms; }
  .stat-card:nth-child(6) { animation-delay: 300ms; }
  .pulse-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: oklch(0.55 0.15 250);
    animation: pulse 1s ease-in-out infinite;
  }
  @media (prefers-reduced-motion: reduce) {
    .stat-card { animation: none; }
    .pulse-dot { animation: none; opacity: 0.6; }
  }
`;

const containerStyle: React.CSSProperties = {
  padding: "16px 20px",
  borderRadius: 12,
  background: "oklch(0.16 0.005 240)",
  border: "1px solid oklch(0.2 0.01 240)",
  marginBottom: 16,
};

const stateRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "12px 0",
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
  gap: 12,
};

const cardStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  padding: "12px 14px",
  borderRadius: 10,
  background: "oklch(0.13 0.005 240)",
  border: "1px solid oklch(0.18 0.01 240)",
};