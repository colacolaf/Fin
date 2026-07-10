import type { AgentState, AgentStatus } from '../../hooks/useAgentState';

interface AgentPanelProps {
  agent: 'investment' | 'debt' | 'retirement';
  status: AgentStatus;
  agentState: AgentState;
  active: boolean;
}

const AGENT_LABELS: Record<string, string> = {
  investment: 'Investment Agent',
  debt: 'Debt Agent',
  retirement: 'Retirement Agent',
};

const AGENT_DESCRIPTIONS: Record<string, string> = {
  investment:
    'Portfolio analysis, asset allocation, and risk assessment. Full recommendations engine coming in Phase 7–9.',
  debt: 'Debt payoff strategies, refinancing analysis, and cashflow optimization. Coming in Phase 10.',
  retirement:
    'Retirement projections, savings targets, and withdrawal strategies. Coming in Phase 11.',
};

const STATUS_LABEL: Record<string, string> = {
  idle: 'Ready',
  loading: 'Loading…',
  running: 'Analyzing',
  error: 'Error',
};

export default function AgentPanel({ agent, status, agentState, active }: AgentPanelProps) {
  if (!active) {
    return (
      <div className="dashboard-placeholder" data-testid="dashboard-placeholder">
        <h2 className="placeholder-title">Fin Dashboard</h2>
        <p className="placeholder-text">Select an agent from the sidebar to begin.</p>
      </div>
    );
  }

  const lastSync = agentState.lastSync
    ? new Date(agentState.lastSync).toLocaleTimeString()
    : null;

  return (
    <div className="agent-panel" data-testid={`agent-panel-${agent}`}>
      <header className="agent-panel-header">
        <div className="agent-panel-title-row">
          <h2 className="agent-panel-title">{AGENT_LABELS[agent]}</h2>
          <span
            className={`agent-panel-status agent-panel-status-${status}`}
            data-status={status}
          >
            {STATUS_LABEL[status]}
          </span>
        </div>
        {lastSync && <p className="agent-panel-sync-time">Last synced: {lastSync}</p>}
      </header>

      <div className="agent-panel-body">
        <p className="agent-panel-description">{AGENT_DESCRIPTIONS[agent]}</p>

        <div className="agent-panel-stats">
          <div className="agent-stat">
            <span className="agent-stat-label">Status</span>
            <span className={`agent-stat-value agent-stat-${status}`}>
              {STATUS_LABEL[status]}
            </span>
          </div>
          <div className="agent-stat">
            <span className="agent-stat-label">Last Sync</span>
            <span className="agent-stat-value">
              {lastSync || 'Never'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}