import { useEffect, useMemo, useState } from 'react';
import CodeMirror, { EditorView } from '@uiw/react-codemirror';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import ChromeShell from '../components/layout/ChromeShell';
import {
  IconBrain,
  IconBrain as IconMCP,
  IconConnectors,
  IconDanger,
  IconDashboard as IconAccount,
  IconPrompts as IconAgent,
  IconShield,
  IconUser,
} from '../components/layout/Icons';
import {
  type ConnectorInfo,
  CATALOG,
  MCP_CATALOG,
  triggerIntegrationSync,
  testAlpacaConnection,
} from '../api/integrations';

type Tab = 'account' | 'connections' | 'agents' | 'knowledge' | 'prompts' | 'danger';

interface TabDef {
  key: Tab;
  label: string;
  icon: React.ReactNode;
  blurb: string;
}

const TABS: TabDef[] = [
  { key: 'account', label: 'Account', icon: <IconAccount />, blurb: 'Profile, theme, currency, motion' },
  { key: 'connections', label: 'Connections', icon: <IconConnectors />, blurb: 'Brokers, data sources, MCP servers' },
  { key: 'agents', label: 'Agent Preferences', icon: <IconAgent />, blurb: 'Tune Investment, Debt, Retirement agents' },
  { key: 'knowledge', label: 'Knowledge Layer', icon: <IconBrain />, blurb: 'Memory vault + skill connectors' },
  { key: 'prompts', label: 'System Prompts', icon: <IconMCP />, blurb: 'Under-the-hood agent prompts' },
  { key: 'danger', label: 'Danger Zone', icon: <IconDanger />, blurb: 'Irreversible actions' },
];

// ── Static fallback prompt content (mirrors docs/SystemPrompts/*.md) ─────────
const PROMPTS: { agent: string; title: string; body: string }[] = [
  {
    agent: 'investment',
    title: 'Investment Agent — Portfolio Optimization',
    body: `# Investment Agent

You are a portfolio optimization specialist helping users build diversified, resilient portfolios aligned with their risk tolerance and financial goals. You think like a fee-only fiduciary: always recommend what's best for the user, never what generates fees.

You focus on:
- Diversification and concentration risk
- Tax efficiency and fee optimization
- Behavioral discipline (forced rebalancing)
- Long-term wealth building

## C.O.R.E. Reasoning

1. **Clarify** — User goals, time horizon, tax situation, constraints
2. **Organize** — Map portfolio to asset classes & sectors, build mental model
3. **Reason through trade-offs** — Every recommendation has competing forces. Name them.
4. **Explain risks & uncertainties** — Be blunt about what could go wrong.

## Priority Order

1. Concentration Risk (single holding >20%)
2. Sector Concentration (single sector >35%)
3. Asset Class Drift (actual vs target >10% off)
4. Fee Inefficiency (expense ratio >0.40%)
5. Tax-Loss Harvesting (unrealized loss >$500)
6. Dividend Optimization (only on explicit signal)

## Output Format

Every recommendation: title, what to do, why (3 reasons), confidence score with breakdown, before/after impact, what could go wrong, unknowns, verification steps, disclaimer.`,
  },
  {
    agent: 'debt',
    title: 'Debt Agent — Payoff Strategy',
    body: `# Debt Agent

You help users systematically eliminate debt while preserving — and ideally accelerating — long-term wealth building.

## C.O.R.E. Reasoning

1. **Clarify** — Cash flow, monthly income, minimums, rate environment
2. **Organize** — Avalanche vs Snowball math; behavioral fit
3. **Reason through trade-offs** — Debt payoff vs investing gap (after-tax yield vs interest rate)
4. **Explain risks** — Liquidity constraints, emergency fund adequacy, behavioral burnout

## Discipline

- Mathematically, avalanche (highest rate first) wins almost always.
- But Snowball (smallest balance first) builds momentum when the user is psychologically fragile.
- Never recommend a 401(k) pause to pay debt at >6% APR without flagging the match forfeiture.`,
  },
  {
    agent: 'retirement',
    title: 'Retirement Agent — Readiness + Tax-Advantaged Optimization',
    body: `# Retirement Agent

You ensure users reach their retirement number on time and maximally use tax-advantaged accounts (401k match, IRA, HSA, Roth conversions).

## C.O.R.E. Reasoning

1. **Clarify** — Goal age, target $, current $, monthly contribution capacity
2. **Organize** — Project range across 4% / 6% / 8% / 10% real returns
3. **Reason through trade-offs** — Catch-up contributions, Roth conversion windows, sequence-of-returns risk
4. **Explain risks** — Healthcare, longevity, market crashes in early retirement years

## Priority

1. Capture the full employer match (instant ~50–100% ROI)
2. Max HSA if eligible (triple tax-advantaged)
3. Roth vs Traditional based on current vs expected retirement bracket
4. Catch-up contributions at age 50+
5. Glide-path equity/bond ratio every 5 years`,
  },
];

interface AgentPref {
  agent: 'investment' | 'debt' | 'retirement';
  title: string;
  risk: number; // 1..10
  frequency: 'daily' | 'weekly' | 'monthly';
  minConfidence: number; // 0..100
  description: string;
}

const DEFAULT_PREFS: AgentPref[] = [
  { agent: 'investment', title: 'Investment Agent', risk: 6, frequency: 'weekly', minConfidence: 75, description: 'Diversification, tax efficiency, concentration risk.' },
  { agent: 'debt', title: 'Debt Agent', risk: 4, frequency: 'monthly', minConfidence: 80, description: 'Avalanche default; flips to snowball when morale is low.' },
  { agent: 'retirement', title: 'Retirement Agent', risk: 5, frequency: 'monthly', minConfidence: 70, description: 'Tax-advantaged optimization + projection.' },
];

// ── Inline components ───────────────────────────────────────────────────────
function Eyebrow({ children }: { children: React.ReactNode }) {
  return <span className="settings-eyebrow">{children}</span>;
}

function SettingsSection({
  eyebrow,
  title,
  description,
  right,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="settings-section" data-testid={`settings-section-${eyebrow.toLowerCase().replace(/\s/g, '-')}`}>
      <header className="settings-section-header">
        <div>
          <Eyebrow>{eyebrow}</Eyebrow>
          <h2 className="settings-section-title">{title}</h2>
          {description && <p className="settings-section-description">{description}</p>}
        </div>
        {right && <div className="settings-section-right">{right}</div>}
      </header>
      <div className="settings-section-body">{children}</div>
    </section>
  );
}

function StatusPill({ status }: { status: ConnectorInfo['status'] }) {
  const map: Record<ConnectorInfo['status'], { label: string; tone: string }> = {
    connected: { label: 'Connected', tone: 'ok' },
    syncing: { label: 'Syncing…', tone: 'busy' },
    error: { label: 'Error', tone: 'fail' },
    not_connected: { label: 'Not connected', tone: 'idle' },
  };
  return <span className={`pill pill-${map[status].tone}`}>{map[status].label}</span>;
}

// ── Tab content — kept inline for ponytail reduction ─────────────────────────
function AccountSection() {
  const [email, setEmail] = useState(() => {
    if (typeof window === 'undefined') return 'fin@local.app';
    return localStorage.getItem('fin.user.email') ?? 'fin@local.app';
  });
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>(() => (localStorage.getItem('fin.theme') as 'dark' | 'light' | 'system') ?? 'dark');
  const [currency, setCurrency] = useState(() => localStorage.getItem('fin.currency') ?? 'USD');
  const [reducedMotion, setReducedMotion] = useState(() => localStorage.getItem('fin.reducedMotion') === 'true');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('fin.theme', theme);
  }, [theme]);
  useEffect(() => {
    localStorage.setItem('fin.currency', currency);
  }, [currency]);
  useEffect(() => {
    localStorage.setItem('fin.reducedMotion', reducedMotion ? 'true' : 'false');
  }, [reducedMotion]);
  useEffect(() => {
    if (email.trim()) localStorage.setItem('fin.user.email', email.trim());
    // Notify other components (Sidebar avatar) that the email changed.
    window.dispatchEvent(new CustomEvent('fin:email-changed', { detail: { email } }));
  }, [email]);

  return (
    <SettingsSection eyebrow="Profile" title="Account" description="Local-only mode — your data never leaves your device.">
      <div className="settings-account-card">
        <div className="settings-avatar" aria-hidden="true">
          {(email[0] ?? 'F').toUpperCase()}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0, flex: 1 }}>
          <input
            className="settings-input"
            style={{ minWidth: 0, width: '100%' }}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@local.app"
            aria-label="Email"
            data-testid="settings-email"
          />
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Plan: Local · v21 · Memory MCP ready</span>
        </div>
      </div>

      <div className="settings-row-list">
        <div className="settings-row">
          <div>
            <div className="settings-row-label">Theme</div>
            <div className="settings-row-hint">Dark recommended — Ocean palette is tuned for it.</div>
          </div>
          <div className="seg" role="tablist" aria-label="Theme">
            {(['dark', 'light', 'system'] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                role="tab"
                aria-selected={theme === opt}
                className={theme === opt ? 'active' : ''}
                onClick={() => setTheme(opt)}
                data-testid={`settings-theme-${opt}`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
        <div className="settings-row">
          <div>
            <div className="settings-row-label">Currency</div>
            <div className="settings-row-hint">Used for portfolio display only.</div>
          </div>
          <select
            className="settings-select"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            data-testid="settings-currency"
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
            <option value="JPY">JPY</option>
            <option value="CAD">CAD</option>
          </select>
        </div>
        <div className="settings-row">
          <div>
            <div className="settings-row-label">Reduced motion</div>
            <div className="settings-row-hint">Honor <code>prefers-reduced-motion</code> globally.</div>
          </div>
          <button
            type="button"
            className={`toggle ${reducedMotion ? 'on' : ''}`}
            role="switch"
            aria-checked={reducedMotion}
            onClick={() => setReducedMotion((v) => !v)}
            data-testid="settings-reduced-motion"
          >
            <span className="toggle-thumb" />
          </button>
        </div>
      </div>
    </SettingsSection>
  );
}

function ConnectionsSection() {
  const [items, setItems] = useState<ConnectorInfo[]>(CATALOG);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [alpacaKey, setAlpacaKey] = useState('');
  const [alpacaSecret, setAlpacaSecret] = useState('');
  const [alpacaPaper, setAlpacaPaper] = useState(true);
  const [alpacaBusy, setAlpacaBusy] = useState(false);
  const [alpacaError, setAlpacaError] = useState<string | null>(null);
  const [syncBusy, setSyncBusy] = useState(false);

  // Pull live status from backend (gracefully falls back to CATALOG catalog).
  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const live = await fetch('/api/integrations/').then((r) => (r.ok ? r.json() : []));
        if (cancel || !Array.isArray(live) || live.length === 0) return;
        setItems(live as ConnectorInfo[]);
      } catch { /* ignore */ }
    })();
    return () => { cancel = true; };
  }, []);

  async function handleAlpacaConnect() {
    setAlpacaBusy(true);
    setAlpacaError(null);
    try {
      const res = await testAlpacaConnection({ apiKey: alpacaKey, apiSecret: alpacaSecret, paperTrading: alpacaPaper });
      if (!res.connected) setAlpacaError('Connection test returned no account.');
      else {
        setItems((prev) => prev.map((c) => c.service === 'alpaca' ? { ...c, status: 'connected', paperTrading: alpacaPaper, lastSync: new Date().toISOString() } : c));
        setExpanded(null);
        setAlpacaKey(''); setAlpacaSecret('');
      }
    } catch (e) {
      setAlpacaError(e instanceof Error ? e.message : 'Connection failed');
    } finally {
      setAlpacaBusy(false);
    }
  }

  async function handleSync() {
    setSyncBusy(true);
    try { await triggerIntegrationSync(); } catch { /* ignore */ }
    finally { setSyncBusy(false); }
  }

  const connectedCount = items.filter((c) => c.status === 'connected').length;

  return (
    <SettingsSection
      eyebrow="Integrations"
      title="Connections"
      description={`${connectedCount} of ${items.length} connectors active. Keys are encrypted at rest (AES-256, see backend/utils/encryption.py).`}
      right={
        <button type="button" className="btn-secondary" onClick={handleSync} disabled={syncBusy} data-testid="settings-sync-all">
          {syncBusy ? 'Syncing…' : 'Sync all'}
        </button>
      }
    >
      <div className="connector-grid">
        {items.map((c) => {
          const isOpen = expanded === c.id;
          return (
            <article key={c.id} className={`connector-card ${isOpen ? 'open' : ''}`} data-testid={`connector-${c.id}`}>
              <header className="connector-card-head">
                <div className="connector-card-mark" aria-hidden="true">
                  {c.name.slice(0, 2).toUpperCase()}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <h3 className="connector-card-title">{c.name}</h3>
                  <p className="connector-card-desc">{c.description}</p>
                </div>
                <StatusPill status={c.status} />
              </header>
              <footer className="connector-card-actions">
                <span className="connector-card-meta">
                  {c.lastSync ? `Last sync: ${new Date(c.lastSync).toLocaleString()}` : '—'}
                  {c.paperTrading != null && ` · ${c.paperTrading ? 'Paper' : 'Live'}`}
                </span>
                {c.status === 'connected' ? (
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => setItems((prev) => prev.map((it) => it.id === c.id ? { ...it, status: 'not_connected' } : it))}
                    data-testid={`connector-${c.id}-disconnect`}
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => setExpanded(c.id)}
                    disabled={c.id !== 'alpaca'}
                    data-testid={`connector-${c.id}-connect`}
                  >
                    Connect
                  </button>
                )}
              </footer>
              {isOpen && c.id === 'alpaca' && (
                <div className="connector-expand">
                  <div className="settings-row">
                    <div>
                      <div className="settings-row-label">API key</div>
                      <div className="settings-row-hint">From app.alpaca.markets · API Keys page.</div>
                    </div>
                    <input
                      className="settings-input"
                      value={alpacaKey}
                      onChange={(e) => setAlpacaKey(e.target.value)}
                      placeholder="AKXXXXXXXXXXXXXXXXXX"
                      autoComplete="off"
                      spellCheck={false}
                      data-testid="connector-alpaca-key"
                    />
                  </div>
                  <div className="settings-row">
                    <div>
                      <div className="settings-row-label">Secret</div>
                      <div className="settings-row-hint">Encrypted with AES-256 before storage.</div>
                    </div>
                    <input
                      className="settings-input"
                      type="password"
                      value={alpacaSecret}
                      onChange={(e) => setAlpacaSecret(e.target.value)}
                      placeholder="••••••••••••••••"
                      autoComplete="off"
                      data-testid="connector-alpaca-secret"
                    />
                  </div>
                  <div className="settings-row">
                    <div>
                      <div className="settings-row-label">Environment</div>
                      <div className="settings-row-hint">Paper is recommended for local development.</div>
                    </div>
                    <div className="seg" role="tablist">
                      {([true, false] as const).map((opt) => (
                        <button
                          key={opt ? 'paper' : 'live'}
                          type="button"
                          role="tab"
                          aria-selected={alpacaPaper === opt}
                          className={alpacaPaper === opt ? 'active' : ''}
                          onClick={() => setAlpacaPaper(opt)}
                          data-testid={`connector-alpaca-${opt ? 'paper' : 'live'}`}
                        >
                          {opt ? 'Paper' : 'Live'}
                        </button>
                      ))}
                    </div>
                  </div>
                  {alpacaError && (
                    <div className="settings-callout fail" role="alert">{alpacaError}</div>
                  )}
                  <div className="settings-row" style={{ justifyContent: 'flex-end' }}>
                    <button type="button" className="btn-ghost" onClick={() => setExpanded(null)}>Cancel</button>
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={handleAlpacaConnect}
                      disabled={alpacaBusy || !alpacaKey || !alpacaSecret}
                      data-testid="connector-alpaca-save"
                    >
                      {alpacaBusy ? 'Testing…' : 'Test & save'}
                    </button>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </SettingsSection>
  );
}

function AgentPrefsSection() {
  const [prefs, setPrefs] = useState<AgentPref[]>(DEFAULT_PREFS);
  const update = (idx: number, patch: Partial<AgentPref>) =>
    setPrefs((prev) => prev.map((p, i) => (i === idx ? { ...p, ...patch } : p)));

  return (
    <SettingsSection
      eyebrow="Calibration"
      title="Agent Preferences"
      description="Tune risk aggressiveness, recommendation cadence, and confidence floor per agent."
    >
      <div className="agent-pref-grid">
        {prefs.map((p, idx) => (
          <article key={p.agent} className="agent-pref-card" data-testid={`agent-pref-${p.agent}`}>
            <header className="agent-pref-head">
              <h3 className="agent-pref-title">{p.title}</h3>
              <p className="agent-pref-desc">{p.description}</p>
            </header>
            <div className="settings-row">
              <div className="settings-row-label">Risk tolerance</div>
              <div className="slider">
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={p.risk}
                  onChange={(e) => update(idx, { risk: Number(e.target.value) })}
                  aria-label={`${p.title} risk tolerance`}
                  data-testid={`agent-pref-${p.agent}-risk`}
                />
                <span className="slider-value">{p.risk}/10</span>
              </div>
            </div>
            <div className="settings-row">
              <div className="settings-row-label">Recommendation cadence</div>
              <div className="seg" role="tablist" aria-label={`${p.title} cadence`}>
                {(['daily', 'weekly', 'monthly'] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    role="tab"
                    aria-selected={p.frequency === opt}
                    className={p.frequency === opt ? 'active' : ''}
                    onClick={() => update(idx, { frequency: opt })}
                    data-testid={`agent-pref-${p.agent}-${opt}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            <div className="settings-row">
              <div className="settings-row-label">Min confidence</div>
              <div className="slider">
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={p.minConfidence}
                  onChange={(e) => update(idx, { minConfidence: Number(e.target.value) })}
                  aria-label={`${p.title} minimum confidence`}
                  data-testid={`agent-pref-${p.agent}-confidence`}
                />
                <span className="slider-value">{p.minConfidence}%</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </SettingsSection>
  );
}

function KnowledgeSection() {
  return (
    <SettingsSection
      eyebrow="MCP"
      title="Knowledge Layer"
      description="Model Context Protocol servers — external tools the agents can call. See .rowboat/config/mcp.json for the canonical wiring."
    >
      <div className="mcp-grid">
        {MCP_CATALOG.map((s) => (
          <article key={s.id} className="mcp-card" data-testid={`mcp-${s.id}`}>
            <header className="mcp-card-head">
              <span className="mcp-card-name">{s.name}</span>
              <span className={`pill pill-${s.status === 'running' ? 'ok' : 'idle'}`}>
                {s.status === 'running' ? 'Running' : s.status === 'error' ? 'Error' : 'Stopped'}
              </span>
            </header>
            <p className="mcp-card-desc">{s.description}</p>
            <pre className="mcp-card-cmd"><code>{s.command} {s.args.join(' ')}</code></pre>
          </article>
        ))}
        <article className="mcp-card add-card" data-testid="mcp-add">
          <span className="mcp-add-mark">＋</span>
          <div>
            <strong>Add custom server</strong>
            <p className="mcp-card-desc">Wire a new MCP via .rowboat/config/mcp.json and restart the agent orchestrator.</p>
          </div>
        </article>
      </div>
    </SettingsSection>
  );
}

function PromptsSection() {
  return (
    <SettingsSection
      eyebrow="Read-only"
      title="System Prompts"
      description="The contract each agent operates under. Edit docs/SystemPrompts/*.md in source, or with basic-memory on disk."
    >
      <div className="prompts-stack">
        {PROMPTS.map((p) => (
          <details key={p.agent} className="prompt-card" data-testid={`prompt-${p.agent}`}>
            <summary>
              <span className="prompt-card-title">{p.title}</span>
              <span className="prompt-card-meta">agent: {p.agent}</span>
            </summary>
            <div className="prompt-viewer">
              <CodeMirror
                value={p.body}
                extensions={[
                  markdown({ base: markdownLanguage, codeLanguages: [] }),
                  EditorView.editable.of(false),
                  oneDark,
                ]}
                editable={false}
                basicSetup={{ lineNumbers: false, foldGutter: false, highlightActiveLine: false }}
                aria-label={`${p.agent} system prompt`}
              />
            </div>
          </details>
        ))}
      </div>
    </SettingsSection>
  );
}

function DangerSection() {
  const [confirm, setConfirm] = useState<string | null>(null);
  return (
    <SettingsSection
      eyebrow="Caution"
      title="Danger Zone"
      description="These actions are irreversible. Proceed with care."
    >
      <div className="danger-grid">
        <article className="danger-card" data-testid="danger-clear-memory">
          <header>
            <h3 className="agent-pref-title"><IconBrain /> &nbsp;Clear memory vault</h3>
            <p className="settings-row-hint">Wipes <code>~/.fin/memory/</code>. All decisions, patterns, and preferences deleted.</p>
          </header>
          {confirm === 'memory' ? (
            <div className="danger-confirm">
              <button type="button" className="btn-ghost" onClick={() => setConfirm(null)}>Cancel</button>
              <button type="button" className="btn-danger" onClick={() => setConfirm(null)}>Yes, delete everything</button>
            </div>
          ) : (
            <button type="button" className="btn-danger-ghost" onClick={() => setConfirm('memory')}>Clear vault…</button>
          )}
        </article>
        <article className="danger-card" data-testid="danger-reset-wizard">
          <header>
            <h3 className="agent-pref-title"><IconShield /> &nbsp;Re-run setup wizard</h3>
            <p className="settings-row-hint">Deletes preferences & clears onboarding completion. You'll re-enter broker / risk / goals.</p>
          </header>
          <button type="button" className="btn-danger-ghost">Reset wizard…</button>
        </article>
        <article className="danger-card" data-testid="danger-export">
          <header>
            <h3 className="agent-pref-title"><IconUser /> &nbsp;Export all data</h3>
            <p className="settings-row-hint">Downloads JSON snapshot of settings, memory, and recommendations. Use before any destructive action.</p>
          </header>
          <button type="button" className="btn-secondary">Export…</button>
        </article>
      </div>
    </SettingsSection>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────
export default function Settings() {
  const [tab, setTab] = useState<Tab>('account');

// Hash-deep-link (#connections, etc.) for direct linking from sidebar / docs.
  useEffect(() => {
    const fromHash = (window.location.hash.replace('#', '').split('?')[0] ?? '') as Tab;
    if (TABS.some((t) => t.key === fromHash)) setTab(fromHash);
  }, []);
  useEffect(() => {
    if (tab) window.history.replaceState(null, '', `#${tab}`);
  }, [tab]);

  const body = useMemo(() => {
    switch (tab) {
      case 'account':    return <AccountSection />;
      case 'connections': return <ConnectionsSection />;
      case 'agents':     return <AgentPrefsSection />;
      case 'knowledge':  return <KnowledgeSection />;
      case 'prompts':    return <PromptsSection />;
      case 'danger':     return <DangerSection />;
      default:           return null;
    }
  }, [tab]);

  return (
    <ChromeShell>
      <div className="settings-shell" data-testid="settings-shell">
        <div className="settings-noise" aria-hidden="true" />
      <header className="settings-header">
        <span className="settings-eyebrow">Workspace</span>
        <h1 className="settings-page-title">Settings</h1>
        <p className="settings-page-blurb">
          Configure connectors, calibrate agents, and audit the under-the-hood contract. <kbd>⌘K</kbd> from the memory page jumps to any note.
        </p>
      </header>
      <div className="settings-body">
        <aside className="settings-rail" aria-label="Settings sections">
          <ul>
            {TABS.map((t) => (
              <li key={t.key}>
                <button
                  type="button"
                  className={`settings-rail-item ${tab === t.key ? 'active' : ''}`}
                  onClick={() => setTab(t.key)}
                  aria-current={tab === t.key ? 'page' : undefined}
                  data-testid={`settings-tab-${t.key}`}
                >
                  <span className="settings-rail-icon" aria-hidden="true">{t.icon}</span>
                  <span className="settings-rail-text">
                    <span className="settings-rail-label">{t.label}</span>
                    <span className="settings-rail-blurb">{t.blurb}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </aside>
        <div className="settings-main" data-testid={`settings-pane-${tab}`}>
          {body}
        </div>
      </div>
      </div>
    </ChromeShell>
  );
}
