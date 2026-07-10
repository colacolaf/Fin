import { useState, useCallback } from 'react';

export type AgentStatus = 'idle' | 'loading' | 'running' | 'error';

export interface AgentState {
  investment: AgentStatus;
  debt: AgentStatus;
  retirement: AgentStatus;
  lastSync: number | null;
}

const initialState: AgentState = {
  investment: 'idle',
  debt: 'idle',
  retirement: 'idle',
  lastSync: null,
};

export function useAgentState() {
  const [state, setState] = useState<AgentState>(initialState);

  const setAgentStatus = useCallback(
    (agent: keyof Omit<AgentState, 'lastSync'>, status: AgentStatus) => {
      setState((prev) => ({ ...prev, [agent]: status }));
    },
    [],
  );

  const markSynced = useCallback(() => {
    setState((prev) => ({
      investment: 'idle',
      debt: 'idle',
      retirement: 'idle',
      lastSync: Date.now(),
    }));
  }, []);

  return { agentState: state, setAgentStatus, markSynced };
}