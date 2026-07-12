/**
 * Phase 30 — Backtest Lab: curated strategy gallery + multi-run overlay + paper trading + CSV + glassmorphic code.
 */
import { useEffect, useState, useCallback, useMemo } from 'react';
import StrategyBuilder from '../components/StrategyBuilder';
import HistoricalReplay from '../components/HistoricalReplay';
import ResultTransition from '../components/ResultTransition';
import type { BacktestStats } from '../components/ResultTransition';
import { backtestApi, type BacktestRun, type StrategyTemplate, type PaperPortfolio } from '../api/backtest';

type Tab = 'runs' | 'paper';

const STRATEGY_TEMPLATES: Array<{ id: string; name: string; desc: string; sharpe: number; category: 'Trend' | 'Mean Reversion' | 'Income' | 'Defensive'; codeSnippet: string }> = [
  { id: 't-rsi-reversion', name: 'RSI Reversion', desc: 'Mean-revert on oversold RSI(14) on Russell 2k universe.', sharpe: 1.4, category: 'Mean Reversion', codeSnippet: '# RSI Reversion:\nif rsi(14) < 30 and not held: buy(spy, 0.4)\nif rsi(14) > 70 and held: sell(spy)' },
  { id: 't-buy-the-dip', name: 'Buy-the-Dip SPY', desc: 'Add $1k to SPY on any -3% daily close.', sharpe: 1.0, category: 'Trend', codeSnippet: '# Buy the dip:\nif close < sma(50) and daily% < -3: add(spy, 1000)\nif close > sma(200): hold' },
  { id: 't-tax-loss', name: 'Tax-Loss Harvest Weekly', desc: 'Realize losses when wash-sale window is clean.', sharpe: 0.6, category: 'Defensive', codeSnippet: '# Tax-loss harvest:\nif pnl% < -5 and within_window: sell, lock_loss\ncalendar.add(days=30)\ncalendar.add(days=30) → rebuy' },
  { id: 't-div-yield', name: 'Dividend Yield Ladder', desc: 'Rotate into highest-yield div aristocrats monthly.', sharpe: 0.9, category: 'Income', codeSnippet: '# Div yield ladder:\nholdings = top_n_by(div_yield, 12, among=aristocrats)\nmonthly: rebalance_to_target_weight()' },
  { id: 't-vol-target', name: 'Vol-Target 12%', desc: 'Position size inversely to 20d realized vol.', sharpe: 1.2, category: 'Defensive', codeSnippet: '# Vol-target 12:\nsize = target_vol / realized_vol(20)\nif size < 0: cash' },
  { id: 't-trend-mom', name: 'Trend Momentum 12-1', desc: 'Top-momentum 12-1 month rotation.', sharpe: 1.5, category: 'Trend', codeSnippet: '# Momentum:\nuniverse = spy + agg_etfs\nrank = mom(12-1)\nrebalance_monthly_to_top_quartile()' },
  { id: 't-bond-ladder', name: 'Bond Ladder 1-7y', desc: 'Strip treasury ladder; reinvest on maturity.', sharpe: 0.4, category: 'Income', codeSnippet: '# Bond ladder:\nbuckets = [1y, 2y, 3y, 5y, 7y]\nmonthly: invest in nearest bucket' },
];

const RUN_STROKES = ['var(--run-1)', 'var(--run-2)', 'var(--run-3)'];

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows.map((r) => r.map((v) => (v.includes(',') ? `"${v}"` : v)).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

export default function BacktestDashboard() {
  const [symbol, setSymbol] = useState('SPY');
  const [startDate, setStartDate] = useState('2023-01-01');
  const [endDate, setEndDate] = useState('2024-01-01');
  const [initialCash, setInitialCash] = useState(100000);
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyTemplate | null>(null);
  const [timeframe, setTimeframe] = useState('1d');
  const [galleryFilter, setGalleryFilter] = useState<'All' | 'Trend' | 'Mean Reversion' | 'Income' | 'Defensive'>('All');

  const [runs, setRuns] = useState<BacktestRun[]>([]);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [runLoading, setRunLoading] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [pollId, setPollId] = useState<string | null>(null);

  const [tab, setTab] = useState<Tab>('runs');
  const [portfolio, setPortfolio] = useState<PaperPortfolio | null>(null);
  const [paperLoading, setPaperLoading] = useState(false);
  const [selectedRuns, setSelectedRuns] = useState<Set<string>>(new Set());

  const fetchRuns = useCallback(async () => {
    try {
      const res = await backtestApi.listRuns(0, 10);
      setRuns(res.runs);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchRuns(); }, [fetchRuns]);

  useEffect(() => {
    if (!pollId) return;
    const interval = setInterval(async () => {
      try {
        const run = await backtestApi.getRun(pollId);
        setRuns((prev) => prev.map((r) => (r.id === run.id ? run : r)));
        if (run.status === 'completed' || run.status === 'failed') {
          setPollId(null);
          setRunLoading(false);
        }
      } catch {
        setPollId(null);
        setRunLoading(false);
        setRunError('Lost connection to backtest runner');
      }
    }, 1500);
    return () => clearInterval(interval);
  }, [pollId]);

  const fetchPortfolio = async () => {
    setPaperLoading(true);
    try {
      const p = await backtestApi.paperPortfolio();
      setPortfolio(p);
    } catch { /* ignore */ } finally { setPaperLoading(false); }
  };

  useEffect(() => {
    if (tab === 'paper') fetchPortfolio();
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
        strategy_template_id: selectedStrategy?.id ?? undefined,
      });
      setRuns((prev) => [run, ...prev]);
      setActiveRunId(run.id);
      setPollId(run.id);
    } catch (e: unknown) {
      setRunError(e instanceof Error ? e.message : 'Failed to start backtest');
      setRunLoading(false);
    }
  };

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

  const equityCurve = useMemo(() => {
    if (!activeRun?.equity_curve_json) return [];
    try { return JSON.parse(activeRun.equity_curve_json) as Array<{ date: string; value: number }>; } catch { return []; }
  }, [activeRun?.equity_curve_json]);

  const trades = useMemo(() => {
    if (!activeRun?.trades_json) return [];
    try { return JSON.parse(activeRun.trades_json) as Array<{ date: string; action: 'buy' | 'sell'; price: number; size: number; pnl?: number }>; } catch { return []; }
  }, [activeRun?.trades_json]);

  const overlayRuns = useMemo(() => {
    return runs.filter((r) => selectedRuns.has(r.id) && r.id !== activeRunId).slice(0, 2);
  }, [runs, selectedRuns, activeRunId]);

  const overlayCurves = useMemo(() => {
    return overlayRuns.map((r) => {
      try { return { run: r, points: JSON.parse(r.equity_curve_json ?? '[]') as Array<{ date: string; value: number }> }; }
      catch { return { run: r, points: [] }; }
    });
  }, [overlayRuns]);

  const filteredStrategies = STRATEGY_TEMPLATES.filter((s) => galleryFilter === 'All' || s.category === galleryFilter);

  const handleExportTrades = () => {
    const rows = [['timestamp', 'ticker', 'action', 'price', 'quantity', 'pnl']];
    for (const t of trades) rows.push([t.date, symbol, t.action, String(t.price), String(t.size), String(t.pnl ?? '')]);
    downloadCsv(`fin_backtest_trades_${activeRunId ?? 'demo'}.csv`, rows);
  };

  const handleExportEquity = () => {
    const rows = [['timestamp', 'value']];
    for (const p of equityCurve) rows.push([p.date, String(p.value)]);
    downloadCsv(`fin_backtest_equity_${activeRunId ?? 'demo'}.csv`, rows);
  };

  const isRunning = runLoading || pollId !== null;

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 16px' }} data-testid="backtest-page">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 'var(--text-2xl)', fontWeight: 700 }}>Backtest Lab</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>Curated templates · multi-run overlay · inline paper trading.</p>
        </div>
      </header>

      {/* Phase 30 — Strategy template gallery (fix #1) */}
      <section className="strategy-gallery" data-testid="strategy-gallery" aria-label="Strategy templates">
        {(['All', 'Trend', 'Mean Reversion', 'Income', 'Defensive'] as const).map((cat) => (
          <button
            key={cat}
            type="button"
            className={`multi-run-chip ${galleryFilter === cat ? 'multi-run-chip--active' : ''}`}
            onClick={() => setGalleryFilter(cat)}
            data-testid={`gallery-filter-${cat}`}
          >
            {cat}
          </button>
        ))}
        {filteredStrategies.map((s) => (
          <article
            key={s.id}
            className="strategy-template-card"
            data-testid={`strategy-template-${s.id}`}
            onClick={() => setSelectedStrategy({ id: s.id, user_id: 'demo', name: s.name, description: s.desc, category: s.category, strategy_code: s.codeSnippet, params_json: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })}
          >
            <span className="strategy-template-card-name">{s.name}</span>
            <span style={{ fontSize: 10, color: 'var(--bio-glow)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{s.category}</span>
            <p className="strategy-template-card-desc">{s.desc}</p>
            <span className="strategy-template-card-sharpe">Expected Sharpe ~{s.sharpe}</span>
          </article>
        ))}
      </section>

      <StrategyBuilder onSelect={setSelectedStrategy} />
      {selectedStrategy && (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 16, background: 'oklch(0.28 0.06 180 / 0.5)', color: 'oklch(0.85 0.06 180)', fontSize: 12, marginBottom: 16 }}>
          Selected: <strong>{selectedStrategy.name}</strong>
          <button className="btn-minimal" type="button" onClick={() => setSelectedStrategy(null)} aria-label="Clear selected strategy">×</button>
        </div>
      )}

      <section style={{ padding: '16px 20px', borderRadius: 12, background: 'oklch(0.18 0.015 205 / 0.45)', border: '1px solid var(--memory-pane-border)', marginBottom: 16 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600 }}>Run configuration</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12, marginBottom: 14 }}>
          <Field label="Symbol">
            <input value={symbol} onChange={(e) => setSymbol(e.target.value)} placeholder="SPY" className="settings-input" />
          </Field>
          <Field label="Timeframe">
            <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)} className="settings-select">
              <option value="1d">1 day</option><option value="1h">1 hour</option><option value="5m">5 min</option><option value="1wk">1 week</option>
            </select>
          </Field>
          <Field label="Start Date">
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="settings-input" />
          </Field>
          <Field label="End Date">
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="settings-input" />
          </Field>
          <Field label="Initial Cash">
            <input type="number" value={initialCash} onChange={(e) => setInitialCash(Number(e.target.value))} className="settings-input" />
          </Field>
        </div>
        <button type="button" className="btn-primary" onClick={handleStartRun} disabled={isRunning} data-testid="run-backtest">
          {isRunning ? 'Running…' : '▶ Run backtest'}
        </button>
        {runError && <p style={{ marginTop: 8, fontSize: 13, color: 'oklch(0.58 0.17 25)' }}>{runError}</p>}
      </section>

      {/* Phase 30 — Multi-run overlay (fix #3) */}
      {runs.length > 1 && (
        <div className="multi-run-overlay" data-testid="multi-run-overlay">
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Overlay prior runs</span>
          {runs.slice(0, 5).filter((r) => r.id !== activeRunId).map((r, i) => (
            <button
              key={r.id}
              type="button"
              className={`multi-run-chip ${selectedRuns.has(r.id) ? 'multi-run-chip--active' : ''}`}
              onClick={() => {
                setSelectedRuns((prev) => {
                  const next = new Set(prev);
                  if (next.has(r.id)) next.delete(r.id);
                  else if (next.size < 2) next.add(r.id);
                  return next;
                });
              }}
              data-testid={`overlay-${r.id}`}
              style={{ borderColor: selectedRuns.has(r.id) ? RUN_STROKES[i % 3] : undefined }}
            >
              {r.symbol} · {r.timeframe}
            </button>
          ))}
        </div>
      )}

      <ResultTransition stats={stats} loading={isRunning} error={activeRun?.status === 'failed' ? activeRun.error_message : null} />

      {/* Equity curve + trade markers + multi-run overlay */}
      {(equityCurve.length > 0 || overlayCurves.length > 0) && (
        <HistoricalReplay
          equityCurve={equityCurve}
          trades={trades}
          overlayCurves={overlayCurves.map((o, i) => ({ points: o.points, label: o.run.symbol, stroke: RUN_STROKES[i] }))}
        />
      )}

      {/* Phase 30 — CSV export (fix #5) */}
      {(equityCurve.length > 0 || trades.length > 0) && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button type="button" className="btn-secondary" onClick={handleExportTrades} data-testid="export-trades">Export trades CSV</button>
          <button type="button" className="btn-secondary" onClick={handleExportEquity} data-testid="export-equity">Export equity CSV</button>
        </div>
      )}

      {/* Phase 30 — Code preview in glassmorphic pane (fix #6) */}
      {selectedStrategy && (
        <section className="code-pane" data-testid="strategy-code" aria-label="Strategy source code">
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--bio-glow)', textTransform: 'uppercase' }}>{selectedStrategy.name} — source</span>
          <pre style={{ margin: '8px 0 0', fontFamily: 'monospace', fontSize: 12, lineHeight: 1.6, color: 'oklch(0.85 0.06 170)', whiteSpace: 'pre-wrap' }}>
            {selectedStrategy.strategy_code}
          </pre>
        </section>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['runs', 'paper'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            className={`multi-run-chip ${tab === t ? 'multi-run-chip--active' : ''}`}
            onClick={() => setTab(t)}
            data-testid={`backtest-tab-${t}`}
          >
            {t === 'runs' ? 'Runs' : 'Paper Trading'}
          </button>
        ))}
      </div>

      {tab === 'runs' && (
        <div>
          {runs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)', borderRadius: 12, border: '1px dashed var(--memory-pane-border)' }} data-testid="runs-empty">
              No backtest runs yet. Configure and run one above.
            </div>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {runs.map((r) => (
                <li
                  key={r.id}
                  onClick={() => setActiveRunId(r.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 16px',
                    borderRadius: 10,
                    background: 'oklch(0.18 0.015 205 / 0.55)',
                    border: `1px solid ${r.id === activeRunId ? 'var(--bio-glow)' : 'var(--memory-pane-border)'}`,
                    marginBottom: 6,
                    cursor: 'pointer',
                    transition: 'border-color 150ms',
                  }}
                  data-testid={`run-row-${r.id}`}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>
                      {r.symbol} · {r.timeframe}
                      <span style={{ marginLeft: 8, padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', background: r.status === 'completed' ? 'oklch(0.28 0.10 170 / 0.4)' : r.status === 'failed' ? 'oklch(0.28 0.10 25 / 0.4)' : 'oklch(0.28 0.10 80 / 0.4)', color: r.status === 'completed' ? 'var(--delta-pos)' : r.status === 'failed' ? 'var(--delta-neg)' : 'oklch(0.85 0.10 80)' }}>
                        {r.status}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
                      {r.start_date} → {r.end_date}
                      {r.total_return_pct !== null && (
                        <span style={{ marginLeft: 12, color: r.total_return_pct >= 0 ? 'var(--delta-pos)' : 'var(--delta-neg)', fontWeight: 600 }}>
                          {r.total_return_pct >= 0 ? '+' : ''}{r.total_return_pct.toFixed(2)}%
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === 'paper' && (
        <section className="paper-trading-card" data-testid="paper-trading-card">
          {paperLoading ? (
            <div style={{ textAlign: 'center', padding: 32 }}>Loading portfolio…</div>
          ) : portfolio ? (
            <>
              <h3 style={{ marginTop: 0 }}>Paper portfolio</h3>
              <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                <PaperStat label="Total P&L" value={`${(portfolio.total_pnl ?? 0) >= 0 ? '+' : ''}$${portfolio.total_pnl?.toFixed(2) ?? '0.00'}`} tone={(portfolio.total_pnl ?? 0) >= 0 ? 'pos' : 'neg'} />
                <PaperStat label="Positions" value={String(portfolio.position_count)} tone="neutral" />
              </div>
              {portfolio.positions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>No paper positions. Execute a paper trade to get started.</div>
              ) : (
                <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                  {portfolio.positions.map((pos, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--memory-pane-border)' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{pos.symbol} · {pos.quantity} shares</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                          Cost ${pos.cost_basis?.toFixed(2)} · Current ${pos.current_value?.toFixed(2)}
                        </div>
                      </div>
                      <span style={{ fontWeight: 600, fontSize: 13, color: (pos.pnl ?? 0) >= 0 ? 'var(--delta-pos)' : 'var(--delta-neg)' }}>
                        {(pos.pnl ?? 0) >= 0 ? '+' : ''}${pos.pnl?.toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>Paper trading data unavailable</div>
          )}
        </section>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
      {children}
    </label>
  );
}

function PaperStat({ label, value, tone }: { label: string; value: string; tone: 'pos' | 'neg' | 'neutral' }) {
  const color = tone === 'pos' ? 'var(--delta-pos)' : tone === 'neg' ? 'var(--delta-neg)' : 'var(--text-primary)';
  return (
    <div style={{ padding: '10px 16px', borderRadius: 8, background: 'oklch(0.16 0.01 210 / 0.55)', border: '1px solid var(--memory-pane-border)', minWidth: 140 }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    </div>
  );
}
