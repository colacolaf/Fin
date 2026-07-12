import { useState, useCallback, useEffect } from 'react';
import OceanCanvas from '../components/ocean/OceanCanvas';
import TopBar from '../components/layout/TopBar';
import Sidebar from '../components/layout/Sidebar';
import AgentPanel from '../components/layout/AgentPanel';
import { useAgentState } from '../hooks/useAgentState';
import TourGuide from '../components/wizard/TourGuide';

const TOUR_SHOWN_KEY = 'fin_dashboard_tour_shown';
const DESKTOP_BREAKPOINT = 1024;

/**
 * Sidebar always starts closed (collapsed rail on desktop, hidden drawer on
 * mobile). User opens it via the hamburger.
 */
function useInitialSidebarOpen(): boolean {
  const [open, setOpen] = useState(false);
  // Keep state synced to viewport in case user resizes across breakpoint
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= DESKTOP_BREAKPOINT) setOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return open;
}

export default function Dashboard() {
  const { agentState, setAgentStatus, markSynced } = useAgentState();
  const [sidebarOpen, setSidebarOpen] = useInitialSidebarOpen();
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

  const closeAgent = useCallback(() => setActiveAgent(null), []);

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
      <Sidebar collapsed={!sidebarOpen} />
      <TourGuide run={showTour} onFinish={() => setShowTour(false)} />
      <main
        className={`dashboard-main ${sidebarOpen ? 'sidebar-open' : ''}`}
        data-testid="dashboard-main"
      >
        {activeAgent ? (
          <AgentPanel
            agent={activeAgent}
            status={agentState[activeAgent]}
            lastSync={agentState.lastSync}
            onClose={closeAgent}
          />
        ) : (
          <div className="dashboard-placeholder" data-testid="dashboard-placeholder">
            <h2 className="placeholder-title">Fin Dashboard</h2>
            <p className="placeholder-text">
              Click a fin in the ocean to dive into an agent workspace.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
