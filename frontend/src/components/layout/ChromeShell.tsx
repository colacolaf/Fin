import { useState, useCallback, useEffect, type ReactNode } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useAgentState, type AgentStatus, type AgentState } from '../../hooks/useAgentState';

type ShellState = { agentState: AgentState };

interface ChromeShellProps {
  /** Either a ReactNode (Settings) or a function receiving the owned agent state (Dashboard). */
  children: ReactNode | ((state: ShellState) => ReactNode);
  defaultSidebarOpen?: boolean;
}

const DESKTOP_BREAKPOINT = 1024;

export default function ChromeShell({ children, defaultSidebarOpen = false }: ChromeShellProps) {
  const [open, setOpen] = useState(defaultSidebarOpen);
  const { agentState, setAgentStatus, markSynced } = useAgentState();

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth < DESKTOP_BREAKPOINT) setOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleSync = useCallback(() => {
    const agents: Array<'investment' | 'debt' | 'retirement'> = ['investment', 'debt', 'retirement'];
    agents.forEach((agent, i) => {
      setAgentStatus(agent, 'loading' as AgentStatus);
      setTimeout(() => setAgentStatus(agent, 'running' as AgentStatus), 600 * (i + 1));
    });
    setTimeout(() => markSynced(), 4000);
  }, [setAgentStatus, markSynced]);

  return (
    <div className="dashboard">
      <Sidebar collapsed={!open} />
      <TopBar
        agentState={agentState}
        onSync={handleSync}
        onToggleSidebar={() => setOpen((p) => !p)}
        sidebarOpen={open}
      />
      <main
        className={`dashboard-main ${open ? 'sidebar-open' : ''}`}
        data-testid="dashboard-main"
      >
        {typeof children === 'function' ? children({ agentState }) : children}
      </main>
    </div>
  );
}
