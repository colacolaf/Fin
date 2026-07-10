import { useRef } from 'react';
import { useOceanScene } from '../../hooks/useOceanScene';
import type { AgentState } from '../../hooks/useAgentState';

interface OceanCanvasProps {
  agentState: AgentState;
}

export default function OceanCanvas({ agentState }: OceanCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useOceanScene(canvasRef, agentState);

  return (
    <canvas
      ref={canvasRef}
      className="ocean-canvas"
      aria-hidden="true"
    />
  );
}