import { useState, useEffect, useCallback } from 'react';
import OceanCanvas from '../components/ocean/OceanCanvas';
import AgentPanel from '../components/layout/AgentPanel';
import ChromeShell from '../components/layout/ChromeShell';
import TourGuide from '../components/wizard/TourGuide';

const TOUR_SHOWN_KEY = 'fin_dashboard_tour_shown';

export default function Dashboard() {
  const [activeAgent, setActiveAgent] = useState<
    'investment' | 'debt' | 'retirement' | null
  >(null);
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    const alreadyShown = localStorage.getItem(TOUR_SHOWN_KEY);
    if (!alreadyShown) {
      setShowTour(true);
      localStorage.setItem(TOUR_SHOWN_KEY, 'true');
    }
  }, []);

  const handleSelectAgent = useCallback(
    (agent: 'investment' | 'debt' | 'retirement') => {
      setActiveAgent((prev) => (prev === agent ? null : agent));
    },
    [],
  );

  const closeAgent = useCallback(() => setActiveAgent(null), []);

  return (
    <ChromeShell>
      {({ agentState }) => (
        <>
          <OceanCanvas
            agentState={agentState}
            selectedAgent={activeAgent}
            onSelectFin={handleSelectAgent}
          />
          <TourGuide run={showTour} onFinish={() => setShowTour(false)} />
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
        </>
      )}
    </ChromeShell>
  );
}
