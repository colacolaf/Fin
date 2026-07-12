import { useEffect, useRef, useState } from 'react';
import type { PayoffPlan } from '@fin/shared';

interface PayoffTimelineProps {
  plan: PayoffPlan | null;
}

interface Milestone {
  month: number;
  label: string;
  pct: number;
  payoffMonth: number;
}

function milestonesForPlan(plan: PayoffPlan | null): Milestone[] {
  if (!plan || !plan.months) return [];
  const totalMonths = Math.max(1, plan.months);
  const checkpoints: Array<{ pct: number; label: string }> = [
    { pct: 0.25, label: '25% cleared' },
    { pct: 0.5, label: 'Halfway' },
    { pct: 0.75, label: '75% cleared' },
  ];
  const result: Milestone[] = checkpoints.map((c) => ({
    month: Math.round(totalMonths * c.pct),
    label: c.label,
    pct: c.pct,
    payoffMonth: totalMonths,
  }));
  result.push({ month: totalMonths, label: 'Debt-free', pct: 1, payoffMonth: totalMonths });
  return result;
}

export default function PayoffTimeline({ plan }: PayoffTimelineProps) {
  const milestones = milestonesForPlan(plan);
  const segRef = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = segRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setRevealed(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setRevealed(true);
            io.disconnect();
          }
        }
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [plan?.months]);

  if (!plan) {
    return (
      <section className="payoff-timeline" data-testid="payoff-timeline">
        <header className="payoff-timeline-header">
          <h2>Payoff timeline</h2>
          <p className="payoff-timeline-empty">Run a strategy to see projected milestones.</p>
        </header>
      </section>
    );
  }

  return (
    <section className="payoff-timeline" data-testid="payoff-timeline">
      <header className="payoff-timeline-header">
        <h2>Payoff timeline</h2>
        <p>
          Total <strong>{plan.months}</strong> months to debt-free · interest <strong>${Math.round(plan.total_interest).toLocaleString()}</strong>
        </p>
      </header>
      <div className={`payoff-track ${revealed ? 'payoff-track--revealed' : ''}`} ref={segRef}>
        <div className="payoff-track-bar" />
        <div className="payoff-track-fill" style={{ width: revealed ? '100%' : '0%' }} />
        {milestones.map((m, i) => (
          <div
            key={i}
            className="payoff-milestone"
            style={{ ['--milestone-x' as string]: `${(m.pct * 100).toFixed(1)}%` }}
            data-pct={`${Math.round(m.pct * 100)}%`}
            data-testid={`payoff-milestone-${Math.round(m.pct * 100)}`}
          >
            <span className="payoff-milestone-dot" />
            <span className="payoff-milestone-label">{m.label}</span>
            <span className="payoff-milestone-time">{m.month === 0 ? 'now' : `${m.month} mo`}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
