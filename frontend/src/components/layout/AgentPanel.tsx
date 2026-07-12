import type { AgentStatus } from '../../hooks/useAgentState';

interface AgentPanelProps {
  agent: 'investment' | 'debt' | 'retirement';
  status: AgentStatus;
  lastSync: number | null;
  onClose: () => void;
}

const AGENT_LABELS: Record<'investment' | 'debt' | 'retirement', string> = {
  investment: 'Investment Agent',
  debt: 'Debt Agent',
  retirement: 'Retirement Agent',
};

const AGENT_ROLES: Record<'investment' | 'debt' | 'retirement', string> = {
  investment: 'Portfolio Optimizer',
  debt: 'Payoff Strategist',
  retirement: 'Retirement Planner',
};

const STATUS_LABEL: Record<AgentStatus, string> = {
  idle: 'Ready',
  loading: 'Loading…',
  running: 'Analyzing',
  error: 'Error',
};

export default function AgentPanel({ agent, status, lastSync, onClose }: AgentPanelProps) {
  return (
    <div className="agent-workspace" data-testid={`agent-panel-${agent}`}>
      <button
        type="button"
        className="agent-back-btn"
        onClick={onClose}
        aria-label="Back to dashboard"
        data-testid="agent-back"
      >
        ← Back
      </button>

      <aside className="agent-pane agent-sidebar" data-testid="agent-sidebar">
        <header className="agent-sidebar-header">
          <span
            className={`agent-panel-status agent-panel-status-${status}`}
            data-status={status}
          >
            {STATUS_LABEL[status]}
          </span>
          <h2 className="agent-sidebar-title">{AGENT_LABELS[agent]}</h2>
          <p className="agent-sidebar-role">{AGENT_ROLES[agent]}</p>
        </header>

        <section className="agent-stats" aria-label="Agent stats">
          <div className="agent-stat">
            <span className="agent-stat-label">Status</span>
            <span className={`agent-stat-value agent-stat-${status}`}>
              {STATUS_LABEL[status]}
            </span>
          </div>
          <div className="agent-stat">
            <span className="agent-stat-label">Last Sync</span>
            <span className="agent-stat-value">
              {lastSync ? new Date(lastSync).toLocaleTimeString() : 'Never'}
            </span>
          </div>
          <div className="agent-stat">
            <span className="agent-stat-label">Memory</span>
            <span className="agent-stat-value">— entries</span>
          </div>
        </section>

        <section className="agent-memory-list">
          <h3>Recent Patterns</h3>
          <ul className="agent-memory-items">
            <li className="agent-memory-empty">No entries yet</li>
          </ul>
        </section>
      </aside>

      <section className="agent-pane agent-main-pane" data-testid="agent-main-pane">
        <div
          className="agent-recommend-skeleton skeleton skeleton-card"
          data-testid="recommendation-skeleton"
          aria-label="Recommendation placeholder"
        />
        <form
          className="agent-chat-input"
          onSubmit={(e) => e.preventDefault()}
          aria-label="Ask a follow-up question"
        >
          <input
            type="text"
            placeholder="Ask a follow-up question…"
            aria-label="Ask a follow-up question"
            disabled
            data-testid="agent-chat-input"
          />
          <button type="submit" disabled data-testid="agent-chat-send">
            Send
          </button>
        </form>
      </section>
    </div>
  );
}
