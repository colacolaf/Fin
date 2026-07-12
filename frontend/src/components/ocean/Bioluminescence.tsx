import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  hue: number;
  life: number;
  maxLife: number;
}

const PARTICLE_COUNT = 60;
const FIN_BLEED_CAP = 36;
const FIN_SITES = 3; // matches the 3 agent fins
const FIN_HUES = [170, 220, 155]; // investment teal, debt blue, retirement green-teal

export default function Bioluminescence() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const finBleedRef = useRef<Particle[]>([]);
  const finEmitCooldownRef = useRef<number[]>([0, 0, 0]);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const bleedRateMs = isReducedMotion ? 1100 : 320; // half rate under reduced motion

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // ── Ambient noise particles (existing behavior preserved) ──
    const init = () => {
      const arr: Particle[] = [];
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        arr.push(spawnAmbient(canvas.width, canvas.height, true));
      }
      particlesRef.current = arr;
    };
    init();

    let lastTime = performance.now();
    const startMs = performance.now();

    const animate = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      const elapsed = (performance.now() - startMs) / 1000;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // ── Phase 22 fix #6 — fin-aware ambient bleed ──
      // Compute the 3 synchronized orbit positions in screen space.
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const radius = Math.min(240, canvas.width * 0.18);
      const angles = [0, (2 * Math.PI) / 3, (4 * Math.PI) / 3];
      const speeds = [0.18, 0.28, 0.13];
      const sites: Array<{ x: number; y: number; hue: number }> = [];
      for (let i = 0; i < FIN_SITES; i++) {
        const a = angles[i] + elapsed * speeds[i] * Math.PI * 2;
        sites.push({
          x: cx + Math.cos(a) * radius,
          y: cy + Math.sin(a) * radius * 0.55,
          hue: FIN_HUES[i],
        });
      }

      // Cooldown-based emit per fin site, capped.
      const dtMs = dt * 1000;
      for (let i = 0; i < FIN_SITES; i++) {
        finEmitCooldownRef.current[i] -= dtMs;
        if (
          finEmitCooldownRef.current[i] <= 0 &&
          finBleedRef.current.length < FIN_BLEED_CAP
        ) {
          const site = sites[i];
          finBleedRef.current.push(spawnFinBleed(site.x, site.y, site.hue));
          finEmitCooldownRef.current[i] = bleedRateMs;
        }
      }

      // Update + draw fin bleed (2s soft fade).
      const bleed = finBleedRef.current;
      for (let i = bleed.length - 1; i >= 0; i--) {
        const p = bleed[i];
        p.life -= dt;
        if (p.life <= 0) {
          bleed.splice(i, 1);
          continue;
        }
        const fade = p.life / p.maxLife;
        const alpha = p.opacity * Math.sin(fade * Math.PI); // 0 → 0.3 → 0
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 80%, 70%, ${alpha})`;
        ctx.shadowColor = `hsla(${p.hue}, 80%, 70%, ${alpha * 0.6})`;
        ctx.shadowBlur = p.size * 2.5;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // ── Ambient particles (unchanged) ──
      const particles = particlesRef.current;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.y -= p.speed * dt * 60;
        p.life -= dt;

        if (p.life <= 0 || p.y < -10) {
          particles[i] = spawnAmbient(canvas.width, canvas.height, false);
          continue;
        }

        const fadeRatio = p.life / p.maxLife;
        const alpha = p.opacity * fadeRatio;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 80%, 70%, ${alpha})`;
        ctx.shadowColor = `hsla(${p.hue}, 80%, 70%, ${alpha * 0.5})`;
        ctx.shadowBlur = p.size * 2;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="bioluminescence-canvas"
      aria-hidden="true"
      data-testid="bioluminescence"
    />
  );
}

function spawnAmbient(w: number, h: number, randomY: boolean): Particle {
  const hue = 160 + Math.random() * 80;
  return {
    x: Math.random() * w,
    y: randomY ? Math.random() * h : h + Math.random() * 20,
    size: 1 + Math.random() * 3,
    speed: 0.3 + Math.random() * 1.2,
    opacity: 0.15 + Math.random() * 0.35,
    hue,
    life: 3 + Math.random() * 12,
    maxLife: 3 + Math.random() * 12,
  };
}

// Spawn a single short-lived particle near a screen-projected fin position.
function spawnFinBleed(x: number, y: number, hue: number): Particle {
  return {
    x: x + (Math.random() - 0.5) * 24,
    y: y + (Math.random() - 0.5) * 24,
    size: 2 + Math.random() * 2,
    speed: 0,
    opacity: 0.3 + Math.random() * 0.2,
    hue,
    life: 2,
    maxLife: 2,
  };
}
