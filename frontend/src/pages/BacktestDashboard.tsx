/**
 * BacktestDashboard — strategy builder, backtest runner, results display, paper trading.
 * Composes StrategyBuilder, HistoricalReplay, ResultTransition, and paper trade panel.
 */
import { useEffect, useState, useCallback } from "react";
import StrategyBuilder from "../components/StrategyBuilder";
import HistoricalReplay from "../components/HistoricalReplay";
import ResultTransition from "../components/ResultTransition";
import type { BacktestStats } from "../components/ResultTransition";
import { backtestApi, type BacktestRun, type StrategyTemplate, type PaperPortfolio } from "../api/backtest";

type Tab = "runs" | "paper";

export default function BacktestDashboard() {
  // Run form
  const [symbol, setSymbol] = useState("SPY");
  const [startDate, setStartDate] = useState("2023-01-01");
  const [endDate, setEndDate] = useState("2024-01-01");
  const [initialCash, setInitialCash] = useState(100000);
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyTemplate | null>(null);
  const [timeframe, setTimeframe] = useState("1d");

  // Runs
  const [runs, setRuns] = useState<BacktestRun[]>([]);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [runLoading, setRunLoading] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);

  // Polling for active run
  const [pollId, setPollId] = useState<string | null>(null);

  // Paper trading
  const [tab, setTab] = useState<Tab>("runs");
  const [portfolio, setPortfolio] = useState<PaperPortfolio | null>(null);
  const [paperLoading, setPaperLoading] = useState(false);

  // Load runs on mount
  const fetchRuns = useCallback(async () => {
    try {
      const res = await backtestApi.listRuns(0, 10);
      setRuns(res.runs);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchRuns(); }, [fetchRuns]);

  // Poll active run
  useEffect(() => {
    if (!pollId) return;
    const interval = setInterval(async () => {
      try {
        const run = await backtestApi.getRun(pollId);
        setRuns((prev) => prev.map((r) => (r.id === run.id ? run : r)));
        if (run.status === "completed" || run.status === "failed") {
          setPollId(null);
          setRunLoading(false);
        }
      } catch {
        setPollId(null);
        setRunLoading(false);
        setRunError("Lost connection to backtest runner");
      }
    }, 1500);
    return () => clearInterval(interval);
  }, [pollId]);

  // Load paper portfolio
  const fetchPortfolio = async () => {
    setPaperLoading(true);
    try {
      const p = await backtestApi.paperPortfolio();
      setPortfolio(p);
    } catch { /* ignore */ } finally {
      setPaperLoading(false);
    }
  };

  useEffect(() => {
    if (tab === "paper") fetchPortfolio();
  }, [tab]);

  const handleStartRun = async () => {
    if (!symbol.trim()) return;
    setRunLoading(true);
    setRunError(null);
    try {
      const run = await backtestApi.startRun({
        symbol: symbol.trim().toUpperCase(),
        start_date: startDate,
        end_date: endDate,
        initial_cash: initialCash,
        timeframe,
        strategy_template_id: selectedStrategy?.id,
      });
      setRuns((prev) => [run, ...prev]);
      setActiveRunId(run.id);
      setPollId(run.id);
    } catch (e: unknown) {
      setRunError(e instanceof Error ? e.message : "Failed to start backtest");
      setRunLoading(false);
    }
  };

  // Compute stats for active run
  const activeRun = runs.find((r) => r.id === activeRunId);
  const stats: BacktestStats | null = activeRun
    ? {
        total_return_pct: activeRun.total_return_pct,
        sharpe_ratio: activeRun.sharpe_ratio,
        max_drawdown_pct: activeRun.max_drawdown_pct,
        win_rate_pct: activeRun.win_rate_pct,
        total_trades: activeRun.total_trades,
        final_value: activeRun.final_value,
        initial_cash: activeRun.initial_cash,
      }
    : null;

  // Parse equity curve
  const equityCurve = (() => {
    if (!activeRun?.equity_curve_json) return [];
    try {
      return JSON.parse(activeRun.equity_curve_json) as Array<{ date: string; value: number }>;
    } catch {
      return [];
    }
  })();

  const trades = (() => {
    if (!activeRun?.trades_json) return [];
    try {
      return JSON.parse(activeRun.trades_json) as Array<{ date: string; action: "buy" | "sell"; price: number; size: number; pnl?: number }>;
    } catch {
      return [];
    }
  })();

  const isRunning = runLoading || pollId !== null;

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 16px" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Backtesting & Training</h1>

      {/* Strategy Builder */}
      <StrategyBuilder onSelect={setSelectedStrategy} />
      {selectedStrategy && (
        <div style={{ ...chipStyle, marginBottom: 16 }}>
          Selected: <strong>{selectedStrategy.name}</strong>
          <button className="btn-minimal" onClick={() => setSelectedStrategy(null)}>×</button>
        </div>
      )}

      {/* Run Config */}
      <div style={configCard}>
        <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 600 }}>Run Configuration</h3>
        <div style={configGrid}>
          <Field label="Symbol">
            <input style={inputS} value={symbol} onChange={(e) => setSymbol(e.target.value)} placeholder="SPY" />
          </Field>
          <Field label="Timeframe">
            <select style={inputS} value={timeframe} onChange={(e) => setTimeframe(e.target.value)}>
              <option value="1m">1 minute</option>
              <option value="5m">5 minutes</option>
              <option value="15m">15 minutes</option>
              <option value="1h">1 hour</option>
              <option value="1d">1 day</option>
              <option value="1wk">1 week</option>
            </select>
          </Field>
          <Field label="Start Date">
            <input style={inputS} type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </Field>
          <Field label="End Date">
            <input style={inputS} type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </Field>
          <Field label="Initial Cash">
            <input style={inputS} type="number" value={initialCash} onChange={(e) => setInitialCash(Number(e.target.value))} />
          </Field>
        </div>
        <button style={primaryBtn} onClick={handleStartRun} disabled={isRunning}>
          {isRunning ? "Running…" : "▶ Run Backtest"}
        </button>
        {runError && (
          <p style={{ marginTop: 8, fontSize: 13, color: "oklch(0.58 0.17 25)" }}>{runError}</p>
        )}
      </div>

      {/* Results */}
      <ResultTransition stats={stats} loading={isRunning} error={activeRun?.status === "failed" ? activeRun.error_message : null} />

      {/* Equity curve replay */}
      {equityCurve.length > 0 && (
        <HistoricalReplay equityCurve={equityCurve} trades={trades} />
      )}

      {/* Tab nav: Runs / Paper */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {(["runs", "paper"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "6px 16px",
              borderRadius: 8,
              border: "1px solid",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 500,
              background: tab === t ? "oklch(0.22 0.01 240)" : "transparent",
              color: tab === t ? "oklch(0.92 0.005 240)" : "oklch(0.6 0.01 240)",
              borderColor: tab === t ? "oklch(0.35 0.02 240)" : "oklch(0.18 0.01 240)",
            }}
          >
            {t === "runs" ? "Runs" : "Paper Trading"}
          </button>
        ))}
      </div>

      {/* Runs tab */}
      {tab === "runs" && (
        <div>
          {runs.length === 0 ? (
            <EmptyState>No backtest runs yet. Configure and run one above.</EmptyState>
          ) : (
            runs.map((r) => (
              <div
                key={r.id}
                onClick={() => setActiveRunId(r.id)}
                style={{
                  ...runRow,
                  borderColor: r.id === activeRunId ? "oklch(0.55 0.15 250)" : "oklch(0.2 0.01 240)",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>
                    {r.symbol} · {r.timeframe}
                    <span style={{ ...statusBadge, ...statusColor(r.status) }}>{r.status}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "oklch(0.5 0.01 240)", marginTop: 2 }}>
                    {r.start_date} → {r.end_date}
                    {r.total_return_pct !== null && (
                      <span style={{ marginLeft: 12, color: r.total_return_pct >= 0 ? "oklch(0.65 0.18 160)" : "oklch(0.58 0.17 25)", fontWeight: 600 }}>
                        {r.total_return_pct >= 0 ? "+" : ""}{r.total_return_pct.toFixed(2)}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Paper Trading tab */}
      {tab === "paper" && (
        <div>
          {paperLoading ? (
            <div style={{ textAlign: "center", padding: 32 }}>Loading portfolio…</div>
          ) : portfolio ? (
            <div>
              <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
                <MiniStat label="Total P&L" value={`${(portfolio.total_pnl ?? 0) >= 0 ? "+" : ""}$${portfolio.total_pnl?.toFixed(2) ?? "0.00"}`} color={(portfolio.total_pnl ?? 0) >= 0 ? "oklch(0.65 0.18 160)" : "oklch(0.58 0.17 25)"} />
                <MiniStat label="Positions" value={String(portfolio.position_count)} />
              </div>
              {portfolio.positions.length === 0 ? (
                <EmptyState>No paper positions. Execute a paper trade to get started.</EmptyState>
              ) : (
                portfolio.positions.map((pos, i) => (
                  <div key={i} style={{ ...runRow, cursor: "default" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{pos.symbol} · {pos.quantity} shares</div>
                      <div style={{ fontSize: 11, color: "oklch(0.5 0.01 240)", marginTop: 2 }}>
                        Cost ${pos.cost_basis?.toFixed(2)} · Current ${pos.current_value?.toFixed(2)}
                      </div>
                    </div>
                    <span style={{ fontWeight: 600, fontSize: 13, color: (pos.pnl ?? 0) >= 0 ? "oklch(0.65 0.18 160)" : "oklch(0.58 0.17 25)" }}>
                      {(pos.pnl ?? 0) >= 0 ? "+" : ""}${pos.pnl?.toFixed(2)}
                    </span>
                  </div>
                ))
              )}
            </div>
          ) : (
            <EmptyState>Paper trading data unavailable</EmptyState>
          )}
        </div>
      )}
    </div>
  );
}

// ── Helpers ─────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: 11, color: "oklch(0.5 0.01 240)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</span>
      {children}
    </label>
  );
}

function EmptyState({ children }: { children: string }) {
  return (
    <div style={{ textAlign: "center", padding: 48, color: "oklch(0.5 0.01 240)", borderRadius: 12, border: "1px dashed oklch(0.2 0.01 240)" }}>
      {children}
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ padding: "10px 16px", borderRadius: 8, background: "oklch(0.15 0.005 240)", border: "1px solid oklch(0.2 0.01 240)" }}>
      <div style={{ fontSize: 11, color: "oklch(0.5 0.01 240)" }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: color ?? "oklch(0.85 0.01 240)" }}>{value}</div>
    </div>
  );
}

function statusColor(s: string): React.CSSProperties {
  switch (s) {
    case "completed": return { background: "oklch(0.18 0.04 160)", color: "oklch(0.75 0.1 160)" };
    case "running": case "pending": return { background: "oklch(0.18 0.04 80)", color: "oklch(0.75 0.1 80)" };
    case "failed": return { background: "oklch(0.18 0.04 25)", color: "oklch(0.75 0.1 25)" };
    default: return { background: "oklch(0.18 0.005 240)", color: "oklch(0.6 0.01 240)" };
  }
}

// ── Styles ──────────────────────────────────────────────────────

const configCard: React.CSSProperties = {
  padding: "16px 20px",
  borderRadius: 12,
  background: "oklch(0.16 0.005 240)",
  border: "1px solid oklch(0.2 0.01 240)",
  marginBottom: 16,
};

const configGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
  gap: 12,
  marginBottom: 14,
};

const inputS: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 6,
  border: "1px solid oklch(0.24 0.01 240)",
  background: "oklch(0.12 0.005 240)",
  color: "oklch(0.85 0.01 240)",
  fontSize: 13,
};

const primaryBtn: React.CSSProperties = {
  padding: "8px 20px",
  borderRadius: 8,
  border: "none",
  background: "oklch(0.55 0.15 250)",
  color: "#fff",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};

const chipStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "4px 12px",
  borderRadius: 16,
  background: "oklch(0.18 0.04 250)",
  color: "oklch(0.8 0.05 250)",
  fontSize: 12,
};

const statusBadge: React.CSSProperties = {
  marginLeft: 8,
  padding: "1px 6px",
  borderRadius: 4,
  fontSize: 10,
  fontWeight: 600,
  textTransform: "uppercase",
};

const runRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  padding: "12px 16px",
  borderRadius: 10,
  background: "oklch(0.16 0.005 240)",
  border: "1px solid",
  marginBottom: 6,
  cursor: "pointer",
  transition: "border-color 150ms",
};