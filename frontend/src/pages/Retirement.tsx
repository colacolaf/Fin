import { useEffect, useState } from 'react';
import { retirementApi } from '../api/retirement';
import type {
  RetirementProfile,
  ProjectionResult,
  ReadinessResult,
  ScenarioResult,
} from '../api/retirement';
import RetirementScore from '../components/retirement/RetirementScore';
import ProjectionChart from '../components/retirement/ProjectionChart';
import AccountBreakdown from '../components/retirement/AccountBreakdown';
import ContributionOptimizer from '../components/retirement/ContributionOptimizer';
import TaxStrategy from '../components/retirement/TaxStrategy';

const DEFAULT_PROFILE: RetirementProfile = {
  current_age: 30,
  retirement_age: 65,
  current_savings: 0,
  annual_contribution: 0,
  annual_income: 75000,
  assumed_return: 0.07,
  inflation_rate: 0.03,
  desired_income: 60000,
  social_security: 24000,
  employer_match_pct: 50,
  employer_match_limit: 6000,
};

// Mock accounts until we have a real account endpoint
const MOCK_ACCOUNTS = [
  { name: 'Company 401(k)', type: '401k' as const, balance: 85000, contribution_pct: 12 },
  { name: 'Roth IRA', type: 'Roth IRA' as const, balance: 42000, contribution_pct: 8 },
  { name: 'HSA', type: 'HSA' as const, balance: 8500, contribution_pct: 3 },
];

const MOCK_OPTIMIZER_ACCOUNTS = [
  {
    name: 'Company 401(k)',
    type: '401(k)',
    limit_total: 22500,
    current_contribution: 9000,
    employer_match_pct: 50,
    employer_match_limit: 3000,
  },
  {
    name: 'Roth IRA',
    type: 'Roth IRA',
    limit_total: 6500,
    current_contribution: 5000,
    employer_match_pct: 0,
    employer_match_limit: 0,
  },
  {
    name: 'HSA',
    type: 'HSA',
    limit_total: 3850,
    current_contribution: 2400,
    employer_match_pct: 0,
    employer_match_limit: 0,
  },
];

export default function RetirementPage() {
  const [profile, setProfile] = useState<RetirementProfile>(DEFAULT_PROFILE);
  const [projection, setProjection] = useState<ProjectionResult | null>(null);
  const [readiness, setReadiness] = useState<ReadinessResult | null>(null);
  const [scenario, setScenario] = useState<ScenarioResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [proj, read] = await Promise.all([
        retirementApi.getProjection(profile),
        retirementApi.getReadiness(profile),
      ]);
      setProjection(proj);
      setReadiness(read);

      const scen = await retirementApi.getScenarios({
        scenario_type: 'contribution',
        current_age: profile.current_age ?? 30,
        retirement_age: profile.retirement_age ?? 65,
        current_savings: profile.current_savings ?? 0,
        annual_contribution: profile.annual_contribution ?? 0,
        annual_income: profile.annual_income ?? 0,
      });
      setScenario(scen);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load retirement data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (field: keyof RetirementProfile) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile((p) => ({ ...p, [field]: Number(e.target.value) }));
  };

  return (
    <div className="retirement-dashboard">
      <header className="retirement-header">
        <h1>Retirement Analysis</h1>
        <button className="btn btn-primary" onClick={load} disabled={loading}>
          {loading ? 'Calculating...' : 'Refresh'}
        </button>
      </header>

      {error && <div className="alert alert-danger">{error}</div>}

      <section className="retirement-inputs">
        <h3>Your Profile</h3>
        <div className="input-grid">
          {[
            ['current_age', 'Age'],
            ['retirement_age', 'Retirement Age'],
            ['current_savings', 'Savings ($)'],
            ['annual_contribution', 'Annual Contrib ($)'],
            ['annual_income', 'Income ($)'],
            ['desired_income', 'Desired Income ($)'],
            ['social_security', 'Social Security ($)'],
            ['assumed_return', 'Return (%)'],
            ['inflation_rate', 'Inflation (%)'],
          ].map(([field, label]) => (
            <label key={field} className="input-label">
              {label}
              <input
                type="number"
                className="input-field"
                value={profile[field as keyof RetirementProfile] ?? ''}
                onChange={handleChange(field as keyof RetirementProfile)}
                step={field === 'assumed_return' || field === 'inflation_rate' ? '0.01' : '1'}
              />
            </label>
          ))}
        </div>
      </section>

      {loading && <div className="loading-skeleton">Loading retirement projections...</div>}

      {!loading && readiness && (
        <RetirementScore data={readiness} />
      )}

      {!loading && projection && (
        <ProjectionChart
          data={projection}
          yearsToRetirement={(profile.retirement_age ?? 65) - (profile.current_age ?? 30)}
        />
      )}

      <section className="retirement-grid">
        <div className="grid-item">
          <AccountBreakdown
            accounts={MOCK_ACCOUNTS}
            totalBalance={projection?.median_nest_egg ?? MOCK_ACCOUNTS.reduce((s, a) => s + a.balance, 0)}
          />
        </div>
        <div className="grid-item">
          <ContributionOptimizer accounts={MOCK_OPTIMIZER_ACCOUNTS} />
        </div>
      </section>

      <section className="retirement-grid">
        <div className="grid-item">
          <TaxStrategy
            currentTaxBracket={24}
            expectedRetirementBracket={15}
            rothPct={33}
            traditionalPct={55}
            taxablePct={12}
          />
        </div>
        {scenario && (
          <div className="grid-item scenario-summary">
            <h3>What-If Scenario</h3>
            <div className="scenario-points">
              {scenario.scenarios.map((p) => (
                <div key={p.label} className="scenario-point">
                  <span className="scenario-label">{p.label}</span>
                  <span className="scenario-value">${Math.round(p.nest_egg).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}