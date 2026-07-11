interface Props {
  currentTaxBracket: number;
  expectedRetirementBracket: number;
  rothPct: number;
  traditionalPct: number;
  taxablePct: number;
}

export default function TaxStrategy({
  currentTaxBracket,
  expectedRetirementBracket,
  rothPct,
  traditionalPct,
  taxablePct,
}: Props) {
  const bracketDelta = currentTaxBracket - expectedRetirementBracket;
  let recommendation: string;
  if (bracketDelta > 10) {
    recommendation = 'Traditional-heavy: defer taxes now, withdraw at lower bracket later.';
  } else if (bracketDelta < -5) {
    recommendation = 'Roth-heavy: pay taxes now at lower rate, withdraw tax-free later.';
  } else {
    recommendation = 'Balanced mix: hedge against future tax changes.';
  }

  return (
    <div className="tax-strategy">
      <h3>Tax Strategy</h3>
      <div className="tax-bracket-comparison">
        <div className="tax-bracket current">
          <span className="bracket-label">Current</span>
          <span className="bracket-value">{currentTaxBracket}%</span>
        </div>
        <span className="bracket-arrow">→</span>
        <div className="tax-bracket future">
          <span className="bracket-label">Retirement</span>
          <span className="bracket-value">{expectedRetirementBracket}%</span>
        </div>
      </div>

      <div className="tax-allocation">
        <h4>Tax Treatment Allocation</h4>
        <div className="allocation-bar">
          {rothPct > 0 && (
            <span className="alloc-segment roth" style={{ width: `${rothPct}%` }}>
              {rothPct > 15 ? 'Roth' : ''}
            </span>
          )}
          {traditionalPct > 0 && (
            <span className="alloc-segment traditional" style={{ width: `${traditionalPct}%` }}>
              {traditionalPct > 15 ? 'Traditional' : ''}
            </span>
          )}
          {taxablePct > 0 && (
            <span className="alloc-segment taxable" style={{ width: `${taxablePct}%` }}>
              {taxablePct > 15 ? 'Taxable' : ''}
            </span>
          )}
        </div>
        <div className="allocation-labels">
          <span>Roth {rothPct}%</span>
          <span>Traditional {traditionalPct}%</span>
          <span>Taxable {taxablePct}%</span>
        </div>
      </div>

      <div className="tax-recommendation">
        <strong>Strategy:</strong> {recommendation}
      </div>
    </div>
  );
}