import { useEffect, useRef, useState } from 'react';

interface CoachStep {
  selector: string;
  title: string;
  body: string;
}

const STEPS: CoachStep[] = [
  {
    selector: '[data-testid="ocean-scene"]',
    title: 'Click a fin to start',
    body: 'Each fin is an independent agent. Tap one to open its workspace and dive deeper.',
  },
  {
    selector: '[data-testid="nav-memory"]',
    title: 'Open Memory',
    body: 'Capture research, decisions, and notes so every agent remembers your goals and preferences.',
  },
  {
    selector: '[data-testid="nav-settings"]',
    title: 'Connect a broker',
    body: 'Connect once under Settings → Connectors to unlock live portfolio, debt, and backtest signals.',
  },
];

const STORAGE_KEY = 'fin.dashboard.coachMarks';
const PAD = 10;

function readProgress(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (!v) return 0;
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}

function writeProgress(step: number) {
  try {
    localStorage.setItem(STORAGE_KEY, String(step));
  } catch {
    /* localStorage may be blocked — silently no-op */
  }
}

interface CoachMarksProps {
  visible: boolean;
}

export default function CoachMarks({ visible }: CoachMarksProps) {
  const [step, setStep] = useState<number>(readProgress);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!visible) return;
    if (step >= STEPS.length) return;
    const target = STEPS[step].selector;

    const recompute = () => {
      const el = document.querySelector<HTMLElement>(target);
      if (el) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) setRect(r);
      }
      rafRef.current = requestAnimationFrame(recompute);
    };
    recompute();
    return () => cancelAnimationFrame(rafRef.current);
  }, [visible, step]);

  if (!visible || step >= STEPS.length || !rect) return null;

  const advance = () => {
    const next = step + 1;
    writeProgress(next);
    setStep(next);
    setRect(null);
  };
  const skip = () => {
    writeProgress(STEPS.length);
    setStep(STEPS.length);
    setRect(null);
  };

  const current = STEPS[step];
  const tipWidth = 320;
  // Place tooltip below spotlight, but flip above if it would clip the viewport
  const belowTop = rect.bottom + 16;
  const aboveTop = rect.top - 16 - 200;
  const useAbove = belowTop > window.innerHeight - 200 && aboveTop > 16;
  const tipTop = useAbove ? aboveTop : belowTop;
  const tipLeft = Math.max(
    16,
    Math.min(rect.left + rect.width / 2 - tipWidth / 2, window.innerWidth - tipWidth - 16),
  );

  return (
    <div
      className="coach-marks-overlay"
      data-testid="coach-marks"
      role="dialog"
      aria-label={`Onboarding step ${step + 1} of ${STEPS.length}: ${current.title}`}
    >
      <button
        type="button"
        className="coach-marks-spotlight"
        aria-label={`Continue onboarding: ${current.title}`}
        style={{
          left: rect.left - PAD,
          top: rect.top - PAD,
          width: rect.width + PAD * 2,
          height: rect.height + PAD * 2,
        }}
        onClick={advance}
        data-testid="coach-spotlight"
      />
      <div
        className="coach-marks-tooltip"
        style={{ left: tipLeft, top: tipTop, width: tipWidth }}
      >
        <div className="coach-marks-step">
          Step {step + 1} of {STEPS.length}
        </div>
        <h3 className="coach-marks-title">{current.title}</h3>
        <p className="coach-marks-body">{current.body}</p>
        <div className="coach-marks-actions">
          <button
            type="button"
            className="btn-ghost"
            onClick={skip}
            data-testid="coach-skip"
          >
            Skip tour
          </button>
          <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="coach-marks-dots" aria-hidden="true">
              {STEPS.map((_, i) => (
                <span
                  key={i}
                  className={`coach-marks-dot${i === step ? ' active' : ''}`}
                />
              ))}
            </span>
            <button
              type="button"
              className="btn-primary"
              onClick={advance}
              data-testid="coach-next"
            >
              Next
            </button>
          </span>
        </div>
      </div>
    </div>
  );
}
