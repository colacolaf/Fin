/**
 * Historical Replay — animated equity curve playback from backtest results.
 * Renders SVG line chart with trade markers that appear as the playhead advances.
 * Supports play/pause, scrub, speed control. prefers-reduced-motion respected.
 */
import { useState, useEffect, useRef, useCallback, useMemo } from "react";

interface EquityPoint {
  date: string;
  value: number;
}

interface Trade {
  date: string;
  action: "buy" | "sell";
  price: number;
  size: number;
  pnl?: number;
}

interface Props {
  equityCurve: EquityPoint[];
  trades?: Trade[];
  height?: number;
}

export default function HistoricalReplay({ equityCurve, trades = [], height = 240 }: Props) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0–1
  const [speed, setSpeed] = useState(1); // 1x, 2x, 4x
  const rafRef = useRef<number | null>(null);
  const lastTick = useRef(0);
  const duration = 4000 / speed; // 4s base

  // Clamp
  const points = equityCurve.slice(0, Math.max(1, Math.floor(progress * equityCurve.length)));
  const visibleTrades = trades.filter((_, i) => i / trades.length <= progress);

  // Auto-play tick
  useEffect(() => {
    if (!playing) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }
    lastTick.current = performance.now();
    const tick = (now: number) => {
      const elapsed = now - lastTick.current;
      lastTick.current = now;
      const delta = elapsed / duration;
      setProgress((prev) => {
        const next = Math.min(1, prev + delta);
        if (next >= 1) {
          setPlaying(false);
          return 1;
        }
        return next;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [playing, duration]);

  // Chart dimensions
  const padLeft = 48;
  const padRight = 16;
  const padTop = 16;
  const padBottom = 32;
  const w = 600; // fixed viewport width, scales via viewBox
  const h = height;
  const chartW = w - padLeft - padRight;
  const chartH = h - padTop - padBottom;

  // Compute scales (memoized — invariant across animation frames)
  const { minVal, maxVal, valRange } = useMemo(() => {
    const min = Math.min(...equityCurve.map((p) => p.value));
    const max = Math.max(...equityCurve.map((p) => p.value));
    return { minVal: min, maxVal: max, valRange: max - min || 1 };
  }, [equityCurve]);

  const xScale = (i: number) => padLeft + (i / Math.max(1, equityCurve.length - 1)) * chartW;
  const yScale = (v: number) => padTop + (1 - (v - minVal) / valRange) * chartH;

  // Build SVG path
  const pathD = points
    .map((pt, i) => `${i === 0 ? "M" : "L"} ${xScale(i)},${yScale(pt.value)}`)
    .join(" ");

  // Build area path (for gradient fill)
  const areaD = points.length > 0
    ? `${pathD} L ${xScale(points.length - 1)},${yScale(minVal)} L ${xScale(0)},${yScale(minVal)} Z`
    : "";

  return (
    <div style={containerStyle}>
      <style>{animStyles}</style>

      {/* Controls */}
      <div style={controlsRow}>
        <button className="replay-btn" onClick={() => { setPlaying(!playing); if (progress >= 1) setProgress(0); }}>
          {playing ? "⏸" : "▶"}
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.001}
          value={progress}
          onChange={(e) => { setProgress(parseFloat(e.target.value)); setPlaying(false); }}
          style={scrubberStyle}
        />
        <div style={speedGroup}>
          {[1, 2, 4].map((s) => (
            <button
              key={s}
              className={`replay-btn speed-btn ${speed === s ? "active" : ""}`}
              onClick={() => setSpeed(s)}
            >
              {s}×
            </button>
          ))}
        </div>
        <span style={{ fontSize: 11, color: "oklch(0.5 0.01 240)", minWidth: 48, textAlign: "right" }}>
          {Math.round(progress * 100)}%
        </span>
      </div>

      {/* Chart */}
      <svg
        viewBox={`0 0 ${w} ${h}`}
        style={{ width: "100%", height: "auto", display: "block" }}
        role="img"
        aria-label="Equity curve replay"
      >
        <defs>
          <linearGradient id="equity-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.55 0.15 250)" stopOpacity={0.25} />
            <stop offset="100%" stopColor="oklch(0.55 0.15 250)" stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
          const y = yScale(minVal + valRange * frac);
          return (
            <g key={frac}>
              <line x1={padLeft} y1={y} x2={w - padRight} y2={y} stroke="oklch(0.2 0.01 240)" strokeWidth={1} />
              <text x={padLeft - 6} y={y + 4} textAnchor="end" fontSize={10} fill="oklch(0.45 0.01 240)">
                {Math.round(minVal + valRange * frac)}
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        <path d={areaD} fill="url(#equity-grad)" />

        {/* Equity line */}
        <path d={pathD} fill="none" stroke="oklch(0.55 0.15 250)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

        {/* Trade markers */}
        {visibleTrades.map((t, i) => {
          const idx = equityCurve.findIndex((p) => p.date === t.date);
          if (idx < 0) return null;
          const cx = xScale(idx);
          const cy = yScale(equityCurve[idx].value);
          const isBuy = t.action === "buy";
          const color = isBuy ? "oklch(0.65 0.18 160)" : "oklch(0.58 0.17 25)";
          const symbol = isBuy ? "▲" : "▼";
          return (
            <g key={i} className="trade-marker" style={{ animationDelay: `${i * 30}ms` }}>
              <circle cx={cx} cy={cy} r={isBuy ? 7 : 5} fill={color} fillOpacity={0.15} />
              <text x={cx} y={isBuy ? cy - 10 : cy + 14} textAnchor="middle" fontSize={11} fill={color}>
                {symbol}
              </text>
            </g>
          );
        })}

        {/* Playhead */}
        {points.length > 0 && (
          <line
            x1={xScale(points.length - 1)}
            y1={padTop}
            x2={xScale(points.length - 1)}
            y2={h - padBottom}
            stroke="oklch(0.8 0.01 240)"
            strokeWidth={1}
            strokeDasharray="4 4"
          />
        )}

        {/* Date labels */}
        {equityCurve.length > 1 && (
          <>
            <text x={padLeft} y={h - 4} fontSize={10} fill="oklch(0.45 0.01 240)" textAnchor="start">
              {equityCurve[0]?.date?.slice(0, 10)}
            </text>
            <text x={w - padRight} y={h - 4} fontSize={10} fill="oklch(0.45 0.01 240)" textAnchor="end">
              {equityCurve[equityCurve.length - 1]?.date?.slice(0, 10)}
            </text>
          </>
        )}
      </svg>

      {/* Trade log */}
      {visibleTrades.length > 0 && (
        <div style={tradeLogStyle}>
          {visibleTrades.slice(-5).map((t, i) => (
            <div key={i} className="trade-log-item" style={tradeLogItemStyle(t.action)}>
              <span style={{ fontWeight: 600 }}>{t.action.toUpperCase()}</span>
              <span>{t.size} @ {t.price?.toFixed(2)}</span>
              <span>{t.date?.slice(0, 10)}</span>
              {t.pnl !== undefined && (
                <span style={{ color: (t.pnl ?? 0) >= 0 ? "oklch(0.65 0.18 160)" : "oklch(0.58 0.17 25)" }}>
                  {(t.pnl ?? 0) >= 0 ? "+" : ""}{t.pnl?.toFixed(2)}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────────

const animStyles = `
  @keyframes markerPop {
    from { opacity: 0; transform: scale(0.3); }
    to { opacity: 1; transform: scale(1); }
  }
  .trade-marker {
    animation: markerPop 200ms ease-out both;
  }
  @media (prefers-reduced-motion: reduce) {
    .trade-marker { animation: none; }
    .replay-btn { transition: none; }
  }
  .replay-btn {
    background: oklch(0.18 0.01 240);
    border: 1px solid oklch(0.24 0.01 240);
    color: oklch(0.8 0.01 240);
    border-radius: 6px;
    padding: 4px 10px;
    font-size: 14px;
    cursor: pointer;
    transition: background 150ms;
  }
  .replay-btn:hover { background: oklch(0.22 0.01 240); }
  .speed-btn.active { border-color: oklch(0.55 0.15 250); color: oklch(0.7 0.12 250); }
`;

const containerStyle: React.CSSProperties = {
  padding: "16px 20px",
  borderRadius: 12,
  background: "oklch(0.16 0.005 240)",
  border: "1px solid oklch(0.2 0.01 240)",
  marginBottom: 16,
};

const controlsRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  marginBottom: 12,
};

const scrubberStyle: React.CSSProperties = {
  flex: 1,
  accentColor: "oklch(0.55 0.15 250)",
  height: 4,
};

const speedGroup: React.CSSProperties = {
  display: "flex",
  gap: 4,
};

const tradeLogStyle: React.CSSProperties = {
  marginTop: 8,
  borderTop: "1px solid oklch(0.2 0.01 240)",
  paddingTop: 8,
};

const tradeLogItemStyle = (action: string): React.CSSProperties => ({
  display: "flex",
  gap: 16,
  fontSize: 11,
  fontFamily: "'SF Mono', 'Fira Code', monospace",
  color: "oklch(0.65 0.01 240)",
  padding: "3px 0",
  borderLeft: `3px solid ${action === "buy" ? "oklch(0.65 0.18 160)" : "oklch(0.58 0.17 25)"}`,
  paddingLeft: 10,
});