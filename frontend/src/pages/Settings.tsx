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
import Input from '../components/ui/forms/Input';
import Select from '../components/ui/forms/Select';
import Toggle from '../components/ui/forms/Toggle';
import Slider from '../components/ui/forms/Slider';
import SegmentedControl from '../components/ui/forms/SegmentedControl';
import { toast } from '../hooks/useToast';

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

type ThemePref = 'dark' | 'light' | 'system';

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

/**
 * RowLabel — wraps .settings-row-label + .settings-row-hint so the row layout
 * (.settings-row: flex space-between) still aligns label block on the left
 * with the control on the right.
 */
function RowLabel({ label, hint }: { label: string; hint?: React.ReactNode }) {
  return (
    <div>
      <div className="settings-row-label">{label}</div>
      {hint && <div className="settings-row-hint">{hint}</div>}
    </div>
  );
}

// ── Tab content — Account ────────────────────────────────────────────────────
function AccountSection() {
  const [email, setEmail] = useState(() => {
    if (typeof window === 'undefined') return 'fin@local.app';
    return localStorage.getItem('fin.user.email') ?? 'fin@local.app';
  });
  const [theme, setTheme] = useState<ThemePref>(() => (localStorage.getItem('fin.theme') as ThemePref) ?? 'dark');
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
          <Input
            id="settings-email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="you@local.app"
            autoComplete="email"
            style={{ minWidth: 0, width: '100%' }}
            ariaLabel="Email"
            testId="settings-email"
          />
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Plan: Local · v21 · Memory MCP ready</span>
        </div>
      </div>

      <div className="settings-row-list">
        <div className="settings-row">
          <RowLabel label="Theme" hint={<>Dark recommended — Ocean palette is tuned for it.</>} />
          <SegmentedControl<ThemePref>
            value={theme}
            onChange={setTheme}
            ariaLabel="Theme"
            options={[
              { value: 'dark', label: 'dark', testId: 'settings-theme-dark' },
              { value: 'light', label: 'light', testId: 'settings-theme-light' },
              { value: 'system', label: 'system', testId: 'settings-theme-system' },
            ]}
          />
        </div>
        <div className="settings-row">
          <RowLabel label="Currency" hint="Used for portfolio display only." />
          <Select
            id="settings-currency"
            value={currency}
            onChange={setCurrency}
            options={[
              { value: 'USD', label: 'USD' },
              { value: 'EUR', label: 'EUR' },
              { value: 'GBP', label: 'GBP' },
              { value: 'JPY', label: 'JPY' },
              { value: 'CAD', label: 'CAD' },
            ]}
            testId="settings-currency"
          />
        </div>
        <div className="settings-row">
          <RowLabel
            label="Reduced motion"
            hint={<>Honor <code>prefers-reduced-motion</code> globally.</>}
          />
          <Toggle
            checked={reducedMotion}
            onChange={setReducedMotion}
            ariaLabel="Reduced motion"
            testId="settings-reduced-motion"
          />
        </div>
      </div>
    </SettingsSection>
  );
}

// ── Tab content — Connections ───────────────────────────────────────────────
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
        toast.success('Alpaca connected');
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Connection failed';
      setAlpacaError(msg);
      toast.error(`Alpaca connect failed: ${msg}`);
    } finally {
      setAlpacaBusy(false);
    }
  }

  async function handleSync() {
    setSyncBusy(true);
    try {
      await triggerIntegrationSync();
      toast.success('Sync triggered');
    } catch (e) {
      toast.error(`Sync failed: ${e instanceof Error ? e.message : 'unknown error'}`);
    } finally {
      setSyncBusy(false);
    }
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
                    onClick={() => {
                      setItems((prev) => prev.map((it) => it.id === c.id ? { ...it, status: 'not_connected' } : it));
                      toast.info(`${c.name} disconnected`);
                    }}
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
                    <RowLabel
                      label="API key"
                      hint={<>From <code>app.alpaca.markets</code> · API Keys page.</>}
                    />
                    <Input
                      id="connector-alpaca-key"
                      value={alpacaKey}
                      onChange={setAlpacaKey}
                      placeholder="AKXXXXXXXXXXXXXXXXXX"
                      autoComplete="off"
                      ariaLabel="Alpaca API key"
                      style={{ minWidth: 240 }}
                      testId="connector-alpaca-key"
                    />
                  </div>
                  <div className="settings-row">
                    <RowLabel
                      label="Secret"
                      hint={<>Encrypted with AES-256 before storage.</>}
                    />
                    <Input
                      id="connector-alpaca-secret"
                      type="password"
                      maskToggle
                      value={alpacaSecret}
                      onChange={setAlpacaSecret}
                      placeholder="••••••••••••••••"
                      autoComplete="off"
                      ariaLabel="Alpaca API secret"
                      style={{ minWidth: 240 }}
                      testId="connector-alpaca-secret"
                    />
                  </div>
                  <div className="settings-row">
                    <RowLabel label="Environment" hint="Paper is recommended for local development." />
                    <SegmentedControl<boolean>
                      value={alpacaPaper}
                      onChange={setAlpacaPaper}
                      ariaLabel="Alpaca environment"
                      options={[
                        { value: true, label: 'Paper', testId: 'connector-alpaca-paper' },
                        { value: false, label: 'Live', testId: 'connector-alpaca-live' },
                      ]}
                    />
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

// ── Tab content — Agent prefs ────────────────────────────────────────────────
const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
] as const;

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
              <RowLabel label="Risk tolerance" />
              <Slider
                min={1}
                max={10}
                value={p.risk}
                onChange={(v) => update(idx, { risk: v })}
                ariaLabel={`${p.title} risk tolerance`}
                testId={`agent-pref-${p.agent}-risk`}
                labelFormatter={(v) => `${v}/10`}
              />
            </div>
            <div className="settings-row">
              <RowLabel label="Recommendation cadence" />
              <SegmentedControl<typeof p.frequency>
                value={p.frequency}
                onChange={(v) => update(idx, { frequency: v })}
                ariaLabel={`${p.title} cadence`}
                options={FREQUENCY_OPTIONS.map((o) => ({
                  value: o.value,
                  label: o.label,
                  testId: `agent-pref-${p.agent}-${o.value}`,
                }))}
              />
            </div>
            <div className="settings-row">
              <RowLabel label="Min confidence" />
              <Slider
                min={0}
                max={100}
                step={5}
                value={p.minConfidence}
                onChange={(v) => update(idx, { minConfidence: v })}
                ariaLabel={`${p.title} minimum confidence`}
                testId={`agent-pref-${p.agent}-confidence`}
                labelFormatter={(v) => `${v}%`}
              />
            </div>
          </article>
        ))}
      </div>
    </SettingsSection>
  );
}

// ── Tab content — MCP/knowledge ───────────────────────────────────────────────
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

// ── Tab content — Prompts (read-only viewer) ───────────────────────────────────
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

// ── Tab content — Danger zone ─────────────────────────────────────────────────
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
              <button type="button" className="btn-danger" onClick={() => {
                setConfirm(null);
                toast.warn('Memory vault cleared', { duration: 6000 });
              }}>Yes, delete everything</button>
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
