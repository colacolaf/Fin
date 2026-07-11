import type { AgentState } from '../../hooks/useAgentState';

interface TopBarProps {
  agentState: AgentState;
  onSync: () => void;
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

const statusLabel: Record<string, string> = {
  idle: 'Synced',
  loading: 'Loading…',
  running: 'Running',
  error: 'Error',
};

export default function TopBar({ agentState, onSync, onToggleSidebar, sidebarOpen }: TopBarProps) {
  const { investment, debt, retirement, lastSync } = agentState;
  const anyRunning = investment === 'running' || debt === 'running' || retirement === 'running';
  const anyError = investment === 'error' || debt === 'error' || retirement === 'error';

  return (
    <header className="topbar" role="banner">
      <div className="topbar-left">
        <button
          className="topbar-hamburger"
          onClick={onToggleSidebar}
          aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          aria-expanded={sidebarOpen}
        >
          <span className="hamburger-line" />
          <span className="hamburger-line" />
          <span className="hamburger-line" />
        </button>
        <span className="topbar-brand">Fin</span>
      </div>

      <div className="topbar-center">
        <button
          className={`sync-indicator ${anyRunning ? 'syncing' : anyError ? 'sync-error' : ''}`}
          onClick={onSync}
          disabled={anyRunning}
          title={lastSync ? `Last sync: ${new Date(lastSync).toLocaleTimeString()}` : 'Never synced'}
        >
          <span className={`sync-dot ${anyRunning ? 'pulse' : anyError ? 'error' : ''}`} />
          <span className="sync-label">
            {anyError ? 'Sync failed' : anyRunning ? 'Syncing…' : statusLabel[investment]}
          </span>
        </button>
      </div>

      <div className="topbar-right">
        {/* No auth — local-only mode */}
      </div>
    </header>
  );
}