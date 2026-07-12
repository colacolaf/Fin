import '../../styles/orchestration.css';

export interface Conflict {
  category: string;
  resolution: 'pay_debt' | 'split' | 'invest';
  recommendation: string;
}

interface Props {
  conflicts: Conflict[];
}

const LABELS: Record<string, string> = {
  pay_debt: 'Pay Debt',
  split: 'Split',
  invest: 'Invest',
};

export default function CrossTalk({ conflicts }: Props) {
  if (!conflicts || conflicts.length === 0) return null;
  return (
    <div data-testid="crosstalk-grid" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {conflicts.map((c, i) => (
        <div key={i} className="cross-agent-card" data-testid={`crosstalk-${c.category}`}>
          <h4>⚡ Cross-Agent Insight</h4>
          <p>{c.recommendation}</p>
          <span className={`resolution-badge ${c.resolution}`}>
            {LABELS[c.resolution] || c.resolution}
          </span>
        </div>
      ))}
    </div>
  );
}
