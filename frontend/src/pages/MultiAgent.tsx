/** Phase 26 — Multi-Agent Stage: stage theater + cross-agent diff + run history. */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAgentStream } from '../hooks/useAgentStream';
import AgentSelector from '../components/orchestration/AgentSelector';
import AgentStatusBar from '../components/orchestration/AgentStatusBar';
import AgentStream from '../components/orchestration/AgentStream';
import '../styles/orchestration.css';

type AgentKey = 'investment' | 'debt' | 'retirement';

const SKILL_CATEGORIES = [
  { key: 'portfolio_review', label: 'Portfolio Review', category: '📊 Portfolio', desc: 'Audit holdings vs target allocation and concentration.' },
  { key: 'financial_health', label: 'Financial Health', category: '📊 Portfolio', desc: 'Net worth, savings rate, emergency fund.' },
  { key: 'debt_analysis', label: 'Debt Analysis', category: '💳 Liabilities', desc: 'Avalanche vs snowball with what-if monthly.' },
  { key: 'credit_score', label: 'Credit Score', category: '💳 Liabilities', desc: 'Track score trajectories and utilization.' },
  { key: 'retirement_readiness', label: 'Retirement Readiness', category: '🎯 Goals', desc: 'Projectile nest egg glide-path.' },
  { key: 'goal_tracking', label: 'Goal Tracking', category: '🎯 Goals', desc: 'House, college, traveling milestones.' },
  { key: 'security_research', label: 'Security Research', category: '🔍 Research', desc: '10-K + 10-Q scan, earnings transcript highlights.' },
  { key: 'tax_loss_harvest', label: 'Tax-Loss Harvest', category: '⚡ Tax', desc: 'Wash-sale aware loss realization.' },
  { key: 'roth_conversion', label: 'Roth Conversion Ladder', category: '⚡ Tax', desc: 'Multi-year bracket arbitrage.' },
] as const;

const RECENT_KEY = 'fin.multiagent.recentSkills';

export default function MultiAgent() {
  const [selectedAgents, setSelectedAgents] = useState<AgentKey[]>(['investment']);
  const [skill, setSkill] = useState('portfolio_review');
  const [started, setStarted] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const { connect, disconnect, agents, crossAgent, isStreaming, summary } = useAgentStream();

  useEffect(() => {
    try {
      const r = localStorage.getItem(RECENT_KEY);
      if (r) setRecent(JSON.parse(r));
    } catch { /* noop */ }
  }, []);

  const handleRun = useCallback(() => {
    if (selectedAgents.length === 0) return;
    setStarted(true);
    const next = [skill, ...recent.filter((s) => s !== skill)].slice(0, 4);
    setRecent(next);
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { /* noop */ }
    connect('demo-user', skill);
  }, [selectedAgents, skill, connect, recent]);

  const handleStop = useCallback(() => {
    disconnect();
    setStarted(false);
  }, [disconnect]);

  const selectedAgent = selectedAgents[0] || 'investment';
  const agentResult = agents[selectedAgent]?.result;
  const reasoningText =
    typeof agentResult === 'string'
      ? agentResult
      : agentResult
        ? JSON.stringify(agentResult, null, 2)
        : 'Waiting for agent reasoning...';

  const conflicts = useMemo<Array<{ category: string; resolution: 'pay_debt' | 'split' | 'invest'; recommendation: string }>>(
    () => {
      const c = (crossAgent as { conflicts?: Array<{ category: string; resolution: 'pay_debt' | 'split' | 'invest'; recommendation: string }> } | null)?.conflicts ?? [];
      return c;
    },
    [crossAgent],
  );

  const stages = (['investment', 'debt', 'retirement'] as const).map((agent) => {
    const status = agents[agent]?.status ?? 'idle';
    return { agent, status };
  });

  const orderedSkills = useMemo(() => {
    const recentSet = new Set(recent);
    return [...SKILL_CATEGORIES].sort((a, b) => {
      const aR = recentSet.has(a.key) ? 0 : 1;
      const bR = recentSet.has(b.key) ? 0 : 1;
      if (aR !== bR) return aR - bR;
      return a.label.localeCompare(b.label);
    });
  }, [recent]);

  const skillGroups = useMemo(() => {
    const groups = new Map<string, typeof SKILL_CATEGORIES[number][]>();
    for (const s of orderedSkills) {
      if (!groups.has(s.category)) groups.set(s.category, []);
      groups.get(s.category)!.push(s);
    }
    return Array.from(groups.entries());
  }, [orderedSkills]);

  const history = useMemo(() => {
    try {
      const raw = localStorage.getItem('fin.multiagent.history');
      if (!raw) return [];
      return JSON.parse(raw) as Array<{ id: string; at: number; skill: string; agents: string[]; totalTokens: number }>;
    } catch {
      return [];
    }
  }, [started]);

  useEffect(() => {
    if (started && summary) {
      try {
        const next = [{ id: Math.random().toString(36).slice(2), at: Date.now(), skill, agents: selectedAgents, totalTokens: summary.estimated_tokens ?? 0 }, ...history].slice(0, 10);
        localStorage.setItem('fin.multiagent.history', JSON.stringify(next));
      } catch { /* noop */ }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summary]);

  return (
    <div className="ocean-page" style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem 1rem' }} data-testid="orchestrate-page">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
        <div>
          <h1 className="ocean-heading" style={{ margin: 0 }}>Multi-Agent Stage</h1>
          <p className="ocean-subtitle" style={{ margin: '4px 0 0' }}>Three agents perform. You audit the cross-agent reasoning.</p>
        </div>
      </header>

      <div className="run-cost-tracker" data-testid="run-cost-tracker">
        <div className="run-cost-tracker-stat">
          <span style={{ color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Tokens</span>
          <span className="run-cost-tracker-stat-value">{summary?.estimated_tokens ?? 0}</span>
        </div>
        <div className="run-cost-tracker-stat">
          <span style={{ color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Wall time</span>
          <span className="run-cost-tracker-stat-value">{isStreaming ? 'live' : '0s'}</span>
        </div>
        <div className="run-cost-tracker-stat">
          <span style={{ color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Mode</span>
          <span className="run-cost-tracker-stat-value">free_local</span>
        </div>
      </div>

      {/* 3 stage slot cards */}
      <section className="stage-track" aria-label="Agent stage" data-testid="stage-track">
        {stages.map(({ agent, status }) => (
          <button
            key={agent}
            type="button"
            className={`agent-stage-slot ${status === 'running' || status === 'loading' ? 'agent-stage-slot--running' : ''} ${status === 'done' ? 'agent-stage-slot--done' : ''}`}
            onClick={() => setSelectedAgents([agent])}
            aria-pressed={selectedAgents.includes(agent)}
            data-testid={`stage-${agent}`}
          >
            <div className="agent-stage-slot-ring" />
            <span className="agent-stage-slot-name">{agent}</span>
            <span className="agent-stage-slot-meta">{status}</span>
          </button>
        ))}
      </section>

      {/* Conflict highlight on top of diff panel when present */}
      {conflicts.length > 0 && (
        <section data-testid="conflict-card" className="conflict-card" role="status" aria-live="polite">
          <span className="conflict-card-ticker">⚠ Cross-agent disagreement on {conflicts.length} symbol(s)</span>
          <span className="conflict-card-detail">One agent says {conflicts[0].category.toLowerCase()} priority; another disagrees. Resolve to keep streaming.</span>
          <span className="conflict-card-actions">
            <button type="button" className="btn-ghost" data-testid="conflict-dismiss">Acknowledge</button>
            <button type="button" className="btn-primary" data-testid="conflict-resolve">Resolve →</button>
          </span>
        </section>
      )}

      {/* Categorized skill library browser */}
      <section style={{ marginBottom: 16 }} data-testid="skill-library">
        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>Skills</label>
        {skillGroups.map(([cat, skills]) => (
          <div key={cat} style={{ marginBottom: 10 }}>
            <span style={{ fontSize: 11, color: 'var(--bio-glow)', fontWeight: 600 }}>{cat}</span>
            <div className="skill-categories" style={{ marginTop: 4 }}>
              {skills.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  className={`skill-chip ${skill === s.key ? 'active' : ''}`}
                  onClick={() => setSkill(s.key)}
                  disabled={isStreaming}
                  title={s.desc}
                  data-testid={`skill-${s.key}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Agent selector */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>Agents</label>
        <AgentSelector selected={selectedAgents} onChange={(a) => setSelectedAgents(a as AgentKey[])} />
      </div>

      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.75rem' }}>
        {!isStreaming ? (
          <button type="button" className="ocean-btn ocean-btn-primary" onClick={handleRun} disabled={selectedAgents.length === 0} data-testid="run-all">
            ▶ Run All Agents
          </button>
        ) : (
          <button type="button" className="ocean-btn ocean-btn-danger" onClick={handleStop} data-testid="stop-all">■ Stop</button>
        )}
        <button type="button" className="btn-ghost" onClick={() => setShowHistory((v) => !v)} data-testid="toggle-history">
          {showHistory ? 'Hide history' : 'Show history'}
        </button>
      </div>

      {summary && (
        <div style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', background: 'oklch(0.18 0.04 195 / 0.5)', border: '1px solid var(--bio-glow)', marginBottom: '1rem', fontSize: 13 }}>
          {summary.succeeded}/{summary.total} agents succeeded
          {summary.failed > 0 && <span style={{ color: 'var(--status-error)' }}> — {summary.failed} failed</span>}
        </div>
      )}

      {started && <AgentStatusBar agents={agents} />}

      {started && (
        <div style={{ marginTop: '1rem' }}>
          <AgentStream agent={selectedAgent} text={reasoningText} isStreaming={isStreaming} />
        </div>
      )}

      {/* Cross-agent diff panel */}
      <section data-testid="cross-agent-diff" style={{ marginTop: 16 }}>
        <h3 style={{ marginTop: 0, fontSize: 'var(--text-base)', fontWeight: 600 }}>Cross-agent diff</h3>
        <div className="cross-agent-diff">
          <div className="cross-agent-diff-col cross-agent-diff-col--aligned" data-testid="diff-aligned">
            <h4>Aligned</h4>
            <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>Both agents agree on allocation drift and concentration.</span>
          </div>
          <div className="cross-agent-diff-col cross-agent-diff-col--divergent" data-testid="diff-divergent">
            <h4>Divergent</h4>
            <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>Investment: hold; Retirement: rebalance. Pick one.</span>
          </div>
          <div className="cross-agent-diff-col cross-agent-diff-col--conflict" data-testid="diff-conflict">
            <h4>Conflicts {conflicts.length}</h4>
            {conflicts.length === 0 ? (
              <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>No active conflicts.</span>
            ) : (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {conflicts.slice(0, 3).map((c, i) => (
                  <li key={i} style={{ padding: '6px 10px', background: 'oklch(0.22 0.05 25 / 0.35)', borderRadius: 6, fontSize: 'var(--text-xs)' }}>
                    <strong style={{ fontFamily: 'monospace' }}>{c.category}</strong>: {c.recommendation}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* Run history timeline */}
      {showHistory && (
        <section className="run-history-timeline" data-testid="run-history-timeline">
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <h3 style={{ margin: 0, fontSize: 'var(--text-base)' }}>Run history</h3>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{history.length} runs</span>
          </header>
          {history.length === 0 ? (
            <p className="run-history-empty">No runs yet.</p>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {history.map((r) => (
                <li key={r.id} className="run-history-item" data-testid={`run-history-${r.id}`}>
                  <span style={{ display: 'flex', flexDirection: 'column' }}>
                    <strong style={{ fontSize: 13 }}>{r.skill}</strong>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(r.at).toLocaleString()} · {r.agents.join(', ')}</span>
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--bio-glow)', fontVariantNumeric: 'tabular-nums', fontFamily: 'monospace' }}>{r.totalTokens} tok</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
