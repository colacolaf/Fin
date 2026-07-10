import { useState, useCallback } from 'react';
import OceanCanvas from '../components/ocean/OceanCanvas';
import TopBar from '../components/layout/TopBar';
import Sidebar from '../components/layout/Sidebar';
import AgentPanel from '../components/layout/AgentPanel';
import { useAgentState } from '../hooks/useAgentState';

export default function Dashboard() {
  const { agentState, setAgentStatus, markSynced } = useAgentState();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeAgent, setActiveAgent] = useState<
    'investment' | 'debt' | 'retirement' | null
  >(null);

  const handleSync = useCallback(() => {
    const agents = ['investment', 'debt', 'retirement'] as const;
    agents.forEach((agent, i) => {
      setAgentStatus(agent, 'loading');
      setTimeout(() => setAgentStatus(agent, 'running'), 600 * (i + 1));
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
      <OceanCanvas
        agentState={agentState}
        selectedAgent={activeAgent}
        onSelectFin={handleSelectAgent}
      />
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
        {activeAgent ? (
          <AgentPanel
            agent={activeAgent}
            status={agentState[activeAgent]}
            agentState={agentState}
            active={true}
          />
        ) : (
          <AgentPanel
            agent="investment"
            status={agentState.investment}
            agentState={agentState}
            active={false}
          />
        )}
      </main>
    </div>
  );
}