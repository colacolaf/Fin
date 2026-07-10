import { useState, useEffect, useRef } from 'react';

interface Options {
  duration?: number;
  decimals?: number;
}

export function useAnimatedNumber(target: number, opts: Options = {}): number {
  const { duration = 800, decimals = 0 } = opts;
  const [value, setValue] = useState(target);
  const raf = useRef<number>(0);
  const startRef = useRef<number>(0);
  const fromRef = useRef(value);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setValue(target);
      return;
    }

    fromRef.current = value;
    startRef.current = 0;

    const animate = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const t = Math.min(elapsed / duration, 1);
      // cubic-bezier(0.22, 1, 0.36, 1) enter curve
      const eased = cubicBezier(t, 0.22, 1, 0.36, 1);
      const current = fromRef.current + (target - fromRef.current) * eased;
      setValue(Number(current.toFixed(decimals)));
      if (t < 1) {
        raf.current = requestAnimationFrame(animate);
      }
    };

    raf.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration, decimals]);

  return value;
}

function cubicBezier(t: number, x1: number, y1: number, x2: number, y2: number): number {
  // Newton-Raphson solve for x -> t param, then evaluate y
  let s = t;
  for (let i = 0; i < 8; i++) {
    const x = bezier(s, x1, x2) - t;
    if (Math.abs(x) < 0.001) break;
    s -= x / bezierDx(s, x1, x2);
  }
  return bezier(Math.max(0, Math.min(1, s)), y1, y2);
}

function bezier(t: number, c1: number, c2: number): number {
  return 3 * (1 - t) ** 2 * t * c1 + 3 * (1 - t) * t ** 2 * c2 + t ** 3;
}

function bezierDx(t: number, c1: number, c2: number): number {
  return 3 * (1 - t) ** 2 * c1 + 6 * (1 - t) * t * (c2 - c1) + 3 * t ** 2 * (1 - c2);
}