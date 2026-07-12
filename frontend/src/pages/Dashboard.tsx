import { useState, useEffect, useCallback } from 'react';
import OceanCanvas from '../components/ocean/OceanCanvas';
import AgentPanel from '../components/layout/AgentPanel';
import ChromeShell from '../components/layout/ChromeShell';
import OnboardingCards from '../components/ocean/OnboardingCards';
import CoachMarks from '../components/ocean/CoachMarks';

const TOUR_SHOWN_KEY = 'fin_dashboard_tour_shown';
const ONBOARDING_VISITED_KEY = 'fin.dashboard.visited';
const COACH_MARKS_KEY = 'fin.dashboard.coachMarks';

export default function Dashboard() {
  const [activeAgent, setActiveAgent] = useState<
    'investment' | 'debt' | 'retirement' | null
  >(null);
  const [showCoachMarks, setShowCoachMarks] = useState(false);
  const [onboardingVisible, setOnboardingVisible] = useState(true);

  // Phase 22 — wire the new coach-marks staircase on first visit and gate
  // onboarding-card visibility on prior-agent interaction.
  useEffect(() => {
    let tourWasShown = false;
    let coachProgress = 0;
    let visited = false;
    try {
      tourWasShown = localStorage.getItem(TOUR_SHOWN_KEY) === 'true';
      coachProgress = Number(localStorage.getItem(COACH_MARKS_KEY) ?? '0') || 0;
      visited = localStorage.getItem(ONBOARDING_VISITED_KEY) === 'true';
    } catch {
      /* ignore storage failures */
    }
    setOnboardingVisible(!visited);
    if (!tourWasShown) {
      try {
        localStorage.setItem(TOUR_SHOWN_KEY, 'true');
      } catch {
        /* ignore */
      }
    }
    if (coachProgress < 3) setShowCoachMarks(true);
  }, []);

  const handleSelectAgent = useCallback(
    (agent: 'investment' | 'debt' | 'retirement') => {
      setActiveAgent((prev) => (prev === agent ? null : agent));
      try {
        localStorage.setItem(ONBOARDING_VISITED_KEY, 'true');
      } catch {
        /* ignore */
      }
      setOnboardingVisible(false);
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
          <CoachMarks visible={showCoachMarks} />
          {activeAgent ? (
            <AgentPanel
              agent={activeAgent}
              status={agentState[activeAgent]}
              lastSync={agentState.lastSync}
              onClose={closeAgent}
            />
          ) : (
            <div className="dashboard-onboarding-shell" data-testid="dashboard-onboarding-shell">
              <OnboardingCards
                visible={onboardingVisible}
                onSelect={handleSelectAgent}
                onDismiss={() => setOnboardingVisible(false)}
              />
              <div className="dashboard-placeholder" data-testid="dashboard-placeholder">
                <h2 className="placeholder-title">Fin Dashboard</h2>
                <p className="placeholder-text">
                  Pick an agent above or click a fin in the ocean to dive into a workspace.
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </ChromeShell>
  );
}
