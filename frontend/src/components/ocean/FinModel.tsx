import type { AgentStatus } from '../../hooks/useAgentState';

interface FinModelProps {
  agent: 'investment' | 'debt' | 'retirement';
  status: AgentStatus;
  selected?: boolean;
  onClick?: () => void;
}

// SVG paths for three distinct fin shapes
const FIN_PATHS: Record<string, string> = {
  // Shark dorsal — sharp, triangular, upward thrust
  investment:
    'M25,70 C25,70 20,50 25,25 C30,10 35,5 40,15 C45,10 45,20 45,30 C48,45 48,55 48,65 Z',
  // Manta pectoral — wide, sweeping, horizontal glide
  debt: 'M15,50 C20,55 30,58 50,60 C55,58 60,50 65,45 C60,55 55,62 45,65 C30,62 20,58 15,50 Z',
  // Whale caudal — large, sweeping tail
  retirement:
    'M10,30 C25,20 40,25 50,35 C50,45 40,60 50,70 C35,70 25,65 10,60 C20,55 25,45 10,30 Z',
};

const ANIMATION_CLASS: Record<string, string> = {
  idle: 'fin-idle',
  loading: 'fin-thinking',
  running: 'fin-running',
  error: 'fin-error',
};

export default function FinModel({ agent, status, selected, onClick }: FinModelProps) {
  const animationClass = ANIMATION_CLASS[status] || 'fin-idle';

  return (
    <div
      className={`fin-model fin-${agent} ${animationClass} ${selected ? 'fin-selected' : ''}`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`${agent} agent — ${status}`}
      data-agent={agent}
      data-status={status}
      data-testid={`fin-${agent}`}
    >
      <svg
        viewBox="0 0 70 80"
        className="fin-svg"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path d={FIN_PATHS[agent]} className="fin-path" />
      </svg>
      <div className={`fin-glow fin-glow-${agent}`} />
    </div>
  );
}