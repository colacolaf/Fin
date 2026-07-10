import { useState, useCallback, useEffect } from 'react';
import OceanCanvas from '../components/ocean/OceanCanvas';
import TopBar from '../components/layout/TopBar';
import Sidebar from '../components/layout/Sidebar';
import AgentPanel from '../components/layout/AgentPanel';
import { useAgentState } from '../hooks/useAgentState';
import TourGuide from '../components/wizard/TourGuide';

const TOUR_SHOWN_KEY = 'fin_dashboard_tour_shown';

export default function Dashboard() {
  const { agentState, setAgentStatus, markSynced } = useAgentState();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeAgent, setActiveAgent] = useState<
    'investment' | 'debt' | 'retirement' | null
  >(null);
  const [showTour, setShowTour] = useState(false);

  // Show tour on first dashboard visit
  useEffect(() => {
    const alreadyShown = localStorage.getItem(TOUR_SHOWN_KEY);
    if (!alreadyShown) {
      setShowTour(true);
      localStorage.setItem(TOUR_SHOWN_KEY, 'true');
    }
  }, []);

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
      <TourGuide run={showTour} onFinish={() => setShowTour(false)} />
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