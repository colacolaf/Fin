import type { AgentState, AgentStatus } from '../../hooks/useAgentState';

interface SidebarProps {
  open: boolean;
  agentState: AgentState;
  onSelectAgent: (agent: 'investment' | 'debt' | 'retirement') => void;
  activeAgent: 'investment' | 'debt' | 'retirement' | null;
}

interface AgentPanel {
  key: 'investment' | 'debt' | 'retirement';
  label: string;
  icon: string;
  status: AgentStatus;
}

export default function Sidebar({ open, agentState, onSelectAgent, activeAgent }: SidebarProps) {
  const panels: AgentPanel[] = [
    { key: 'investment', label: 'Investment', icon: '▲', status: agentState.investment },
    { key: 'debt', label: 'Debt', icon: '◆', status: agentState.debt },
    { key: 'retirement', label: 'Retirement', icon: '●', status: agentState.retirement },
  ];

  const statusDot = (status: AgentStatus) => {
    if (status === 'running') return 'running';
    if (status === 'error') return 'error';
    if (status === 'loading') return 'loading';
    return 'idle';
  };

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`} role="navigation" aria-label="Agent navigation">
      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Agents</div>
        {panels.map((panel) => (
          <button
            key={panel.key}
            className={`sidebar-item ${activeAgent === panel.key ? 'active' : ''}`}
            onClick={() => onSelectAgent(panel.key)}
            aria-current={activeAgent === panel.key ? 'page' : undefined}
          >
            <span className={`sidebar-item-icon ${panel.key}`}>{panel.icon}</span>
            <span className="sidebar-item-label">{panel.label}</span>
            <span
              className={`sidebar-status-dot ${statusDot(panel.status)}`}
              aria-label={panel.status}
            />
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-sync-info">
          {agentState.lastSync ? (
            <span className="sync-time">
              Last sync: {new Date(agentState.lastSync).toLocaleTimeString()}
            </span>
          ) : (
            <span className="sync-time">Not synced</span>
          )}
        </div>
      </div>
    </aside>
  );
}