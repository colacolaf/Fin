import { useState } from 'react';

interface Account {
  name: string;
  type: string;
  limit_total: number;
  current_contribution: number;
  employer_match_pct: number;
  employer_match_limit: number;
}

interface Props {
  accounts: Account[];
}

export default function ContributionOptimizer({ accounts }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  if (!accounts.length) {
    return <div className="contribution-optimizer empty-state">No accounts to optimize</div>;
  }

  return (
    <div className="contribution-optimizer">
      <h3>Contribution Optimizer</h3>
      <p className="optimizer-hint">Maximize employer match then fill tax-advantaged space.</p>
      <ul className="optimizer-list">
        {accounts.map((a) => {
          const usedPct = a.limit_total > 0 ? (a.current_contribution / a.limit_total) * 100 : 100;
          const matchValue = (a.current_contribution * a.employer_match_pct) / 100;
          const effectiveMatch = Math.min(matchValue, a.employer_match_limit || Infinity);
          const isOptimal = effectiveMatch >= (a.employer_match_limit || 0) && usedPct < 100;

          return (
            <li
              key={a.name}
              className={`optimizer-item ${selected === a.name ? 'expanded' : ''} ${isOptimal ? 'optimal' : ''}`}
              onClick={() => setSelected(selected === a.name ? null : a.name)}
            >
              <div className="optimizer-row">
                <span className="opt-name">{a.name}</span>
                <span className="opt-type">{a.type}</span>
                <div className="opt-gauge-track">
                  <span
                    className="opt-gauge-fill"
                    style={{ width: `${Math.min(100, usedPct)}%` }}
                  />
                </div>
                <span className="opt-used">
                  ${a.current_contribution.toLocaleString()} / ${a.limit_total.toLocaleString()}
                </span>
              </div>

              {selected === a.name && (
                <div className="opt-detail">
                  <div className="opt-detail-row">
                    <span>Employer Match</span>
                    <span>{a.employer_match_pct}% up to ${(a.employer_match_limit || 0).toLocaleString()}</span>
                  </div>
                  <div className="opt-detail-row">
                    <span>Current Match Value</span>
                    <span>${effectiveMatch.toLocaleString()}</span>
                  </div>
                  <div className="opt-detail-row">
                    <span>Remaining Space</span>
                    <span>${Math.max(0, a.limit_total - a.current_contribution).toLocaleString()}</span>
                  </div>
                  <div className={`opt-recommendation ${isOptimal ? 'positive' : 'action'}`}>
                    {isOptimal
                      ? '✓ Maxing match. Direct extra to next priority account.'
                      : `⚠ Increase by $${Math.max(0, (a.employer_match_limit || 0) - effectiveMatch).toLocaleString()} to capture full match.`}
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}