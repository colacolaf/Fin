import { useState, useCallback } from 'react';
import OceanCanvas from '../components/ocean/OceanCanvas';
import TopBar from '../components/layout/TopBar';
import Sidebar from '../components/layout/Sidebar';
import { useAgentState } from '../hooks/useAgentState';

export default function Dashboard() {
  const { agentState, setAgentStatus, markSynced } = useAgentState();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeAgent, setActiveAgent] = useState<
    'investment' | 'debt' | 'retirement' | null
  >(null);

  const handleSync = useCallback(() => {
    // Mock sync sequence — real implementation in Phase 7+
    const agents = ['investment', 'debt', 'retirement'] as const;
    agents.forEach((agent, i) => {
      setAgentStatus(agent, 'loading');
      setTimeout(() => setAgentStatus(agent, 'running'), 600 * (i + 1));
      setTimeout(() => {}, 1200 * (i + 1)); // running for a moment
    });
    setTimeout(() => markSynced(), 4000);
  }, [setAgentStatus, markSynced]);

  const handleSelectAgent = useCallback(
    (agent: 'investment' | 'debt' | 'retirement') => {
      setActiveAgent((prev) => (prev === agent ? null : agent));
    },
    [],
  );

  return (
    <div className="dashboard">
      <OceanCanvas agentState={agentState} />
      <TopBar
        agentState={agentState}
        onSync={handleSync}
        onToggleSidebar={() => setSidebarOpen((p) => !p)}
        sidebarOpen={sidebarOpen}
      />
      <Sidebar
        open={sidebarOpen}
        agentState={agentState}
        onSelectAgent={handleSelectAgent}
        activeAgent={activeAgent}
      />
      <main className={`dashboard-main ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="dashboard-placeholder">
          <h2 className="placeholder-title">
            {activeAgent
              ? `${activeAgent.charAt(0).toUpperCase() + activeAgent.slice(1)} Agent`
              : 'Fin Dashboard'}
          </h2>
          <p className="placeholder-text">
            {activeAgent
              ? 'Agent panel coming in Phase 7–11.'
              : 'Select an agent from the sidebar to begin.'}
          </p>
        </div>
      </main>
    </div>
  );
}