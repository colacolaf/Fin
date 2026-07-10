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

export default function Bioluminescence() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Initialize particles
    const init = () => {
      const arr: Particle[] = [];
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        arr.push(spawnParticle(canvas.width, canvas.height, true));
      }
      particlesRef.current = arr;
    };
    init();

    let lastTime = performance.now();

    const animate = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1); // Cap delta
      lastTime = now;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const particles = particlesRef.current;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.y -= p.speed * dt * 60;
        p.life -= dt;

        if (p.life <= 0 || p.y < -10) {
          particles[i] = spawnParticle(canvas.width, canvas.height, false);
          continue;
        }

        const fadeRatio = p.life / p.maxLife;
        const alpha = p.opacity * fadeRatio;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 80%, 70%, ${alpha})`;
        // Soft outer glow
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

function spawnParticle(w: number, h: number, randomY: boolean): Particle {
  // Hues cluster around teal/blue/green (160–240)
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