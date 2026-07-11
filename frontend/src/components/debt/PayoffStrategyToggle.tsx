interface Props {
  strategy: 'avalanche' | 'snowball';
  onChange: (s: 'avalanche' | 'snowball') => void;
  comparison: {
    interest_saved: number;
    months_saved: number;
    recommended: 'avalanche' | 'snowball';
  } | null;
}

const FMT = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 });

export default function PayoffStrategyToggle({ strategy, onChange, comparison }: Props) {
  const savings = comparison?.interest_saved ?? 0;
  const months = comparison?.months_saved ?? 0;

  return (
    <div className="debt-strategy-section">
      <h2>Payoff Strategy</h2>
      <div className="strategy-toggle">
        <button
          className={`strategy-btn ${strategy === 'avalanche' ? 'active' : ''}`}
          onClick={() => onChange('avalanche')}
        >
          <span className="strategy-icon">📉</span>
          <span className="strategy-label">Avalanche</span>
          <span className="strategy-desc">Highest interest first — saves the most money</span>
        </button>

        <button
          className={`strategy-btn ${strategy === 'snowball' ? 'active' : ''}`}
          onClick={() => onChange('snowball')}
        >
          <span className="strategy-icon">⛄</span>
          <span className="strategy-label">Snowball</span>
          <span className="strategy-desc">Smallest balance first — builds momentum</span>
        </button>
      </div>

      {comparison && (savings > 0 || months > 0) && (
        <div className="strategy-comparison-meta">
          <p className="strategy-savings">
            <strong>{comparison.recommended === 'avalanche' ? 'Avalanche' : 'Snowball'}</strong> is recommended:{' '}
            {savings > 0 && `saves ${FMT.format(savings)}`}
            {savings > 0 && months > 0 && ' and '}
            {months > 0 && `${months} fewer months`}.
          </p>
        </div>
      )}

      {comparison && savings <= 0 && months <= 0 && (
        <div className="strategy-comparison-meta">
          <p className="strategy-savings">
            Both strategies are equivalent with your current debts.
          </p>
        </div>
      )}
    </div>
  );
}