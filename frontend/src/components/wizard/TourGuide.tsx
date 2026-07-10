import { useEffect } from 'react';
import { useJoyride, EVENTS, type Step } from 'react-joyride';

interface Props {
  run: boolean;
  onFinish: () => void;
}

const TOUR_STEPS: Step[] = [
  {
    target: '[data-tour="sidebar"]',
    title: 'Navigation Sidebar',
    content:
      'Access your portfolio, debt tools, retirement planner, and settings from here.',
    placement: 'right',
  },
  {
    target: '[data-tour="sync-button"]',
    title: 'Sync Your Accounts',
    content: 'Click here to sync your brokerage accounts and get the latest portfolio data.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="agent-cards"]',
    title: 'AI Agent Cards',
    content:
      'Each agent specializes in a different area. Click any card to dive deeper.',
    placement: 'top',
  },
  {
    target: '[data-tour="settings"]',
    title: 'Settings & Preferences',
    content:
      'Access your profile, connected accounts, and notification preferences here.',
    placement: 'left',
  },
  {
    target: '[data-tour="ocean"]',
    title: 'Fin — Your Dashboard',
    content:
      'Your interactive ocean dashboard. Fin swims here, reacting to your portfolio health.',
    placement: 'center',
  },
];

export default function TourGuide({ run, onFinish }: Props) {
  const { controls, on, Tour } = useJoyride({
    steps: TOUR_STEPS,
    styles: {
      overlay: { backgroundColor: 'rgba(0, 0, 0, 0.5)' },
      tooltip: { backgroundColor: '#ffffff', color: '#1f2937' },
      tooltipContainer: { textAlign: 'left' },
      tooltipTitle: { fontSize: '16px', fontWeight: 600 },
      tooltipContent: { fontSize: '14px', lineHeight: 1.5 },
      tooltipFooter: { marginTop: 8 },
      tooltipFooterSpacer: { flex: 1 },
    },
  });

  // Subscribe to tour end events
  useEffect(() => {
    const unsub = on(EVENTS.TOUR_END, () => {
      onFinish();
    });

    return unsub;
  }, [on, onFinish]);

  // Start/stop based on run prop
  useEffect(() => {
    if (run) {
      controls.start();
    } else {
      controls.stop();
    }
  }, [run, controls]);

  return Tour;
}