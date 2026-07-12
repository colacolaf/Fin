import { useEffect, useMemo, useRef, useState } from 'react';
import { useOceanScene } from '../../hooks/useOceanScene';
import type { AgentState } from '../../hooks/useAgentState';
import FinModel from './FinModel';
import Bioluminescence from './Bioluminescence';

interface OceanCanvasProps {
  agentState: AgentState;
  selectedAgent: 'investment' | 'debt' | 'retirement' | null;
  onSelectFin: (agent: 'investment' | 'debt' | 'retirement') => void;
}

/**
 * Phase 22 fix #2 — synchronized fin orbit.
 *
 * Each agent's DOM fin anchor lives in a `.fin-orbit` container centered in
 * the dashboard. We write `--orbit-x` / `--orbit-y` per agent every frame so
 * the 3 fins rotate around the same orbit point at differentiated speeds:
 *
 *   - investment  → slow prose  (0.18 revs/sec)
 *   - debt        → assertive    (0.28 revs/sec)
 *   - retirement  → long horizon (0.13 revs/sec)
 *
 * Honors `prefers-reduced-motion: reduce` by stopping the rAF writer.
 */
function useOrbitWriter(
  refs: React.MutableRefObject<Array<HTMLDivElement | null>>,
  reducedMotion: boolean,
) {
  useEffect(() => {
    if (reducedMotion) return;
    let raf = 0;
    const start = performance.now();
    const angles = [0, (2 * Math.PI) / 3, (4 * Math.PI) / 3];
    const speeds = [0.18, 0.28, 0.13];

    const frame = () => {
      const t = (performance.now() - start) / 1000;
      const radius = Math.min(240, window.innerWidth * 0.18);
      for (let i = 0; i < 3; i++) {
        const el = refs.current[i];
        if (!el) continue;
        const a = angles[i] + t * speeds[i] * Math.PI * 2;
        const x = Math.cos(a) * radius;
        const y = Math.sin(a) * radius * 0.55;
        el.style.setProperty('--orbit-x', `${x}px`);
        el.style.setProperty('--orbit-y', `${y}px`);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [refs, reducedMotion]);
}

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);
  return reduced;
}

export default function OceanCanvas({ agentState, selectedAgent, onSelectFin }: OceanCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const orbitRefs = useRef<Array<HTMLDivElement | null>>([null, null, null]);
  const reducedMotion = useReducedMotion();

  // Phase 22 fix #1 — mouse tracking feeds parallax + camera tilt.
  const mouseRef = useRef({ x: 0, y: 0 });
  useEffect(() => {
    if (reducedMotion) return;
    const onMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX / window.innerWidth - 0.5;
      mouseRef.current.y = e.clientY / window.innerHeight - 0.5;
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [reducedMotion]);

  // Stable options object so useOceanScene doesn't respawn its WebGL context.
  // mouseRef identity never changes — useOceanScene reads `mouseRef.current` on each
  // animation frame and is *not* listed in its dep array.
  const sceneOptions = useMemo(() => ({ mouseRef, reducedMotion }), [reducedMotion]);

  useOceanScene(canvasRef, agentState, sceneOptions);
  useOrbitWriter(orbitRefs, reducedMotion);

  const agents = ['investment', 'debt', 'retirement'] as const;

  return (
    <div className="ocean-scene" data-testid="ocean-scene" data-tour="ocean">
      <canvas
        ref={canvasRef}
        className="ocean-canvas"
        aria-hidden="true"
        data-testid="ocean-canvas"
      />
      <Bioluminescence />
      <div className="fin-overlay" aria-label="Agent fins">
        <div className="fin-orbit" data-testid="fin-orbit">
          {agents.map((agent, i) => (
            <div
              key={agent}
              className="fin-orbit-anchor"
              ref={(el) => {
                orbitRefs.current[i] = el;
              }}
            >
              <FinModel
                agent={agent}
                status={agentState[agent]}
                selected={selectedAgent === agent}
                onClick={() => onSelectFin(agent)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
