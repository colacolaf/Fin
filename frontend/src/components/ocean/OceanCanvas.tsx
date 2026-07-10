import { useRef } from 'react';
import { useOceanScene } from '../../hooks/useOceanScene';
import type { AgentState } from '../../hooks/useAgentState';
import FinModel from './FinModel';
import Bioluminescence from './Bioluminescence';

interface OceanCanvasProps {
  agentState: AgentState;
  selectedAgent: 'investment' | 'debt' | 'retirement' | null;
  onSelectFin: (agent: 'investment' | 'debt' | 'retirement') => void;
}

export default function OceanCanvas({ agentState, selectedAgent, onSelectFin }: OceanCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useOceanScene(canvasRef, agentState);

  const agents = ['investment', 'debt', 'retirement'] as const;

  return (
    <div className="ocean-scene" data-testid="ocean-scene">
      <canvas
        ref={canvasRef}
        className="ocean-canvas"
        aria-hidden="true"
        data-testid="ocean-canvas"
      />
      <Bioluminescence />
      <div className="fin-overlay" aria-label="Agent fins">
        {agents.map((agent) => (
          <FinModel
            key={agent}
            agent={agent}
            status={agentState[agent]}
            selected={selectedAgent === agent}
            onClick={() => onSelectFin(agent)}
          />
        ))}
      </div>
    </div>
  );
}