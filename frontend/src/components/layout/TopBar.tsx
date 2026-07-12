/**
 * TopBar — self-contained app bar with freshness pip + quick-settings menu.
 * Reads agent state via useAgentState; navigation via useNavigate.
 * Phase 34 rewrite: drives sync freshness from lastSync age, surfaces quick settings (theme/density/motion) in a popover.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useAgentState,
  type AgentStatus,
} from '../../hooks/useAgentState';
import Popover from './Popover';
import { toast } from '../../hooks/useToast';
import { applySWUpdate } from '../../registerSW';

type FreshnessTier = 'ok' | 'warn' | 'stale';

function freshnessFromLastSync(lastSync: number | null, now: number): {
  tier: FreshnessTier;
  label: string;
} {
  if (lastSync == null) return { tier: 'stale', label: 'Never synced' };
  const ageMin = Math.floor((now - lastSync) / 60000);
  if (ageMin < 5) return { tier: 'ok', label: 'Synced' };
  if (ageMin < 30) return { tier: 'warn', label: `${ageMin}m ago` };
  const hours = Math.floor(ageMin / 60);
  return { tier: 'stale', label: hours > 0 ? `${hours}h ago` : `${ageMin}m ago` };
}

function readSetting(key: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  return localStorage.getItem(`fin.settings.${key}`) ?? fallback;
}
function writeSetting(key: string, value: string): void {
  try {
    localStorage.setItem(`fin.settings.${key}`, value);
    document.documentElement.dataset['themePref'] = value;
    document.documentElement.dataset['densityPref'] = readSetting('density', 'comfortable');
    document.documentElement.dataset['motionPref'] = readSetting('motion', 'auto');
    window.dispatchEvent(
      new CustomEvent('fin:settings-changed', { detail: { key, value } }),
    );
  } catch {
    /* ignore */
  }
}

interface Props {
  onToggleSidebar?: () => void;
  sidebarOpen?: boolean;
  /** Phase 35 — opens the keyboard-shortcuts overlay. */
  onOpenShortcuts?: () => void;
}

export default function TopBar({ onToggleSidebar, sidebarOpen, onOpenShortcuts }: Props) {
  const { agentState, setAgentStatus, markSynced } = useAgentState();
  const [now, setNow] = useState<number>(Date.now());

  // Tick freshness every 60s.
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const fresh = freshnessFromLastSync(agentState.lastSync, now);
  const anyRunning =
    agentState.investment === 'running' ||
    agentState.debt === 'running' ||
    agentState.retirement === 'running';

  const handleSync = (): void => {
    const agents: Array<'investment' | 'debt' | 'retirement'> = [
      'investment',
      'debt',
      'retirement',
    ];
    const promises: Array<Promise<void>> = agents.map(
      (agent, i) =>
        new Promise<void>((resolve) => {
          setAgentStatus(agent, 'loading' as AgentStatus);
          window.setTimeout(() => {
            setAgentStatus(agent, 'running' as AgentStatus);
            window.setTimeout(() => {
              setAgentStatus(agent, 'idle' as AgentStatus);
              resolve();
            }, 1500 - i * 200);
          }, 600 * (i + 1));
        }),
    );

    toast
      .promise(Promise.all(promises), {
        loading: 'Syncing portfolio data\u2026',
        success: 'Synced',
        error: 'Sync failed \u2014 try again',
      })
      .catch(() => {
        /* toast already informed */
      });
    // Mark synced after the simulated run completes for any agent.
    window.setTimeout(() => markSynced(), 4000);
  };

  return (
    <header className="topbar" role="banner" data-testid="app-topbar">
      <div className="topbar-left">
        {onToggleSidebar && (
          <button
            type="button"
            className="topbar-hamburger"
            onClick={onToggleSidebar}
            aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            aria-expanded={!!sidebarOpen}
          >
            <span className="hamburger-line" />
            <span className="hamburger-line" />
            <span className="hamburger-line" />
          </button>
        )}
        <span className="topbar-brand">Fin</span>
      </div>

      <div className="topbar-center">
        <Popover
          trigger={
            <button
              type="button"
              className="sync-pill"
              data-testid="topbar-sync-pill"
              aria-label={`Sync status: ${fresh.label}`}
            >
              <span
                aria-hidden
                className={
                  'freshness-pip ' +
                  `freshness-pip--${fresh.tier}` +
                  (anyRunning ? ' topbar-freshness-pulse' : '')
                }
              />
              <span>{fresh.label}</span>
              <span aria-hidden className="sync-pill__chevron">
                {'\u25BE'}
              </span>
            </button>
          }
          testId="topbar-sync-menu"
          align="center"
          label="Sync status"
        >
          {(close) => (
            <>
              <div className="popover-section-title">Sync</div>
              <button type="button" className="popover-item" onClick={() => { handleSync(); close(); }}>
                <span>Run sync now</span>
                <span className="popover-label">
                  {agentState.lastSync
                    ? new Date(agentState.lastSync).toLocaleTimeString()
                    : 'never'}
                </span>
              </button>
              <div className="popover-divider" />
              <div className="popover-section-title">Service worker</div>
              <button
                type="button"
                className="popover-item"
                onClick={() => { applySWUpdate(); toast.info('Refreshing…'); close(); }}
              >
                <span>Refresh app cache</span>
              </button>
            </>
          )}
        </Popover>
      </div>

      <div className="topbar-right">
        <QuickSettings />
      </div>
    </header>
  );
}

function QuickSettings() {
  const [theme, setTheme] = useState(() => readSetting('theme', 'system'));
  const [density, setDensity] = useState(() => readSetting('density', 'comfortable'));
  const [motion, setMotion] = useState(() => readSetting('motion', 'auto'));
  const navigate = useNavigate();

  return (
    <Popover
      trigger={
        <button
          type="button"
          className="btn-ghost"
          data-testid="topbar-quick-settings"
          aria-label="Quick settings"
          style={{ minHeight: 32, padding: '4px 10px' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
          </svg>
        </button>
      }
      testId="quick-settings-menu"
      align="right"
      label="Quick settings"
    >
      {(close) => (
        <>
          <SettingRadioSection
            title="Theme"
            value={theme}
            options={[
              { value: 'system', label: 'System' },
              { value: 'dark', label: 'Dark' },
              { value: 'light', label: 'Light' },
            ]}
            onSelect={(v) => { setTheme(v); writeSetting('theme', v); close(); }}
          />
          <SettingRadioSection
            title="Density"
            value={density}
            options={[
              { value: 'comfortable', label: 'Comfortable' },
              { value: 'compact', label: 'Compact' },
            ]}
            onSelect={(v) => { setDensity(v); writeSetting('density', v); close(); }}
          />
          <SettingRadioSection
            title="Motion"
            value={motion}
            options={[
              { value: 'auto', label: 'Auto' },
              { value: 'reduced', label: 'Reduced' },
              { value: 'always', label: 'Always' },
            ]}
            onSelect={(v) => { setMotion(v); writeSetting('motion', v); close(); }}
          />
          <div className="popover-divider" />
          <button
            type="button"
            className="popover-item"
            data-testid="qs-shortcuts"
            aria-label="Open keyboard shortcuts"
            onClick={() => { close(); onOpenShortcuts?.(); }}
          >
            <span>Keyboard shortcuts</span>
            <span className="popover-label">?</span>
          </button>
          <button
            type="button"
            className="popover-item"
            onClick={() => { close(); navigate('/settings'); }}
          >
            <span>Open Settings</span>
          </button>
        </>
      )}
    </Popover>
  );
}

interface RadioSectionProps {
  title: string;
  value: string;
  options: { value: string; label: string }[];
  onSelect: (v: string) => void;
}
function SettingRadioSection({ title, value, options, onSelect }: RadioSectionProps) {
  return (
    <>
      <div className="popover-section-title">{title}</div>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="menuitemradio"
          aria-checked={value === o.value}
          className="popover-item"
          onClick={() => onSelect(o.value)}
        >
          <span>{o.label}</span>
          {value === o.value && <span aria-hidden className="popover-label">✓</span>}
        </button>
      ))}
    </>
  );
}
