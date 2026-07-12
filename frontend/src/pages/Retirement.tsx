import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { retirementApi } from '../api/retirement';
import type { RetirementProfile, ProjectionResult, ReadinessResult, ScenarioResult } from '../api/retirement';
import RetirementScore from '../components/retirement/RetirementScore';
import ProjectionChart from '../components/retirement/ProjectionChart';
import AccountBreakdown from '../components/retirement/AccountBreakdown';
import ContributionOptimizer from '../components/retirement/ContributionOptimizer';
import TaxStrategy from '../components/retirement/TaxStrategy';
import EmptyState from '../components/ui/EmptyState';
import { IconEmptyRetire } from '../components/layout/Icons';
import { RetirementSkeleton } from '../components/ui/PageSkeleton';

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

const MOCK_ACCOUNTS = [
  { name: 'Company 401(k)', type: '401k' as const, balance: 85000, contribution_pct: 12 },
  { name: 'Roth IRA', type: 'Roth IRA' as const, balance: 42000, contribution_pct: 8 },
  { name: 'HSA', type: 'HSA' as const, balance: 8500, contribution_pct: 3 },
];

const MOCK_OPTIMIZER_ACCOUNTS = [
  { name: 'Company 401(k)', type: '401(k)', limit_total: 22500, current_contribution: 9000, employer_match_pct: 50, employer_match_limit: 3000 },
  { name: 'Roth IRA', type: 'Roth IRA', limit_total: 6500, current_contribution: 5000, employer_match_pct: 0, employer_match_limit: 0 },
  { name: 'HSA', type: 'HSA', limit_total: 3850, current_contribution: 2400, employer_match_pct: 0, employer_match_limit: 0 },
];

const CAPS = { four01k: 22500, ira: 6500, hsa: 4150 };

export default function RetirementPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<RetirementProfile>(DEFAULT_PROFILE);
  const [projection, setProjection] = useState<ProjectionResult | null>(null);
  const [readiness, setReadiness] = useState<ReadinessResult | null>(null);
  const [scenario, setScenario] = useState<ScenarioResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [equityPct, setEquityPct] = useState(70);
  const [bondPct, setBondPct] = useState(30);
  const [taxProfile, setTaxProfile] = useState<'all-tr' | 'all-roth' | 'mix'>('mix');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [proj, read] = await Promise.all([
        retirementApi.getProjection({ ...profile, equity_pct: equityPct, bond_pct: bondPct }),
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

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Phase 25 fix #2 — glide-path changes trigger projection re-fan (debounced).
  useEffect(() => {
    if (!profile.current_age) return;
    const id = window.setTimeout(() => {
      retirementApi
        .getProjection({ ...profile, equity_pct: equityPct, bond_pct: bondPct })
        .then((proj) => setProjection(proj))
        .catch(() => { /* allow initial-load error banner to win */ });
    }, 220);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [equityPct, bondPct, profile.annual_contribution]);

  const handleChange = (field: keyof RetirementProfile) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile((p) => ({ ...p, [field]: Number(e.target.value) }));
  };

  const bucketFill = useMemo(() => {
    const cap401k = MOCK_OPTIMIZER_ACCOUNTS[0];
    const capIra = MOCK_OPTIMIZER_ACCOUNTS[1];
    const capHsa = MOCK_OPTIMIZER_ACCOUNTS[2];
    const cap401kMatch = cap401k.employer_match_limit ?? 0;
    const fillMatch = cap401kMatch > 0 ? Math.min(100, (cap401kMatch > 0 ? 100 : 0)) : 0; // assume matched when cap401k has employer match
    const currentMatchCaptured = Math.min(100, ((profile.annual_contribution ?? 0) >= cap401kMatch && cap401kMatch > 0 ? 100 : (cap401kMatch > 0 ? (profile.annual_contribution ?? 0) / cap401kMatch * 100 : 0)));
    return {
      match: currentMatchCaptured,
      ira: Math.min(100, ((capIra.current_contribution ?? 0) / CAPS.ira) * 100),
      hsa: Math.min(100, ((capHsa.current_contribution ?? 0) / CAPS.hsa) * 100),
    };
  }, [profile.annual_contribution]);

  return (
    <div className="retirement-dashboard" data-testid="retirement-page">
      <header className="retirement-header">
        <div>
          <h1>Retirement</h1>
          <p className="coach-voice">
            {readiness && readiness.score >= 75
              ? 'Strong glide-path. Hold course.'
              : readiness && readiness.score >= 50
                ? 'Keep contributing — small bumps compound for decades.'
                : 'Bump your 401(k) match first. That single change can move the score by 8–12 points.'}
          </p>
        </div>
        <button className="btn-primary" onClick={load} disabled={loading} data-testid="retirement-refresh">
          {loading ? 'Calculating…' : 'Refresh'}
        </button>
      </header>

      {error && <div className="settings-callout fail" data-testid="retirement-error">{error}</div>}

      {loading && <RetirementSkeleton />}

      {!loading && !error && readiness == null && profile.current_savings === 0 && profile.annual_contribution === 0 ? (
        <EmptyState
          icon={<IconEmptyRetire />}
          title="No retirement goal yet"
          description="Set a target age and contribution rate — projection comes alive once you do."
          slug="retirement-empty"
          cta={{ label: 'Set a goal', onClick: () => navigate('/setup') }}
          secondaryAction={{ label: 'Estimate baseline', onClick: () => {
            setProfile({ ...DEFAULT_PROFILE, current_savings: 25000, annual_contribution: 6000 });
          } }}
        />
      ) : (
        !loading && readiness && profile.current_age !== undefined && profile.retirement_age !== undefined && (
          <RetirementScore
            data={readiness}
            currentAge={profile.current_age}
            retirementAge={profile.retirement_age}
          />
        )
      )}

      {!loading && projection && (
        <ProjectionChart
          data={projection}
          yearsToRetirement={(profile.retirement_age ?? 65) - (profile.current_age ?? 30)}
          glidePath={{ equityPct }}
        />
      )}

      <section className="glide-path" data-testid="glide-path">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <h3 style={{ margin: 0 }}>Glide-path</h3>
          <p className="coach-voice">Drag the equity/bond mix — the projection re-fans instantly.</p>
        </header>
        <div className="glide-path-row">
          <div className="slider" style={{ flex: 1 }}>
            <span className="slider-value">Equity {equityPct}%</span>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={equityPct}
              onChange={(e) => {
                const e2 = Number(e.target.value);
                setEquityPct(e2);
                setBondPct(100 - e2);
              }}
              aria-label="Equity allocation percentage"
              aria-valuenow={equityPct}
              data-testid="glide-equity"
            />
            <span className="slider-value">Bonds {bondPct}%</span>
          </div>
          <button className="btn-ghost" onClick={() => { setEquityPct(70); setBondPct(30); }} data-testid="glide-reset">Reset</button>
        </div>
      </section>

      <section className="bucket-saturation" data-testid="bucket-saturation">
        <article className="bucket-card">
          <span className="bucket-card-name">401(k) Match Capture</span>
          <div className="bucket-card-bar"><div className={`bucket-card-bar-fill ${bucketFill.match >= 100 ? 'bucket-card-bar-fill--matched' : bucketFill.match >= 50 ? 'bucket-card-bar-fill--partial' : 'bucket-card-bar-fill--low'}`} style={{ width: `${bucketFill.match}%` }} /></div>
          <div className="bucket-card-stat"><span>{bucketFill.match.toFixed(0)}%</span><span>${(profile.annual_contribution ?? 0).toLocaleString()}/yr</span></div>
          {bucketFill.match < 100 && (
            <span className="coach-voice">You're leaving ${((6000 - (profile.annual_contribution ?? 0))).toLocaleString()} of free employer match on the table — up your 401(k) cap next pay cycle.</span>
          )}
        </article>
        <article className="bucket-card">
          <span className="bucket-card-name">IRA Contributions</span>
          <div className="bucket-card-bar"><div className={`bucket-card-bar-fill ${bucketFill.ira >= 90 ? 'bucket-card-bar-fill--matched' : 'bucket-card-bar-fill--partial'}`} style={{ width: `${bucketFill.ira}%` }} /></div>
          <div className="bucket-card-stat"><span>{bucketFill.ira.toFixed(0)}%</span><span>$6,500 cap</span></div>
          {bucketFill.ira < 90 && <span className="coach-voice">A few hundred dollars more in your IRA each year buys 6 more years of tax-free growth.</span>}
        </article>
        <article className="bucket-card">
          <span className="bucket-card-name">HSA Contributions</span>
          <div className="bucket-card-bar"><div className={`bucket-card-bar-fill ${bucketFill.hsa >= 90 ? 'bucket-card-bar-fill--matched' : 'bucket-card-bar-fill--partial'}`} style={{ width: `${bucketFill.hsa}%` }} /></div>
          <div className="bucket-card-stat"><span>{bucketFill.hsa.toFixed(0)}%</span><span>$4,150 cap</span></div>
          {bucketFill.hsa < 90 && <span className="coach-voice">HSA money isoproductively compound-taxable + tax-free withdraw → bump contributions to your family cap.</span>}
        </article>
      </section>

      <div className="retirement-grid">
        <AccountBreakdown
          accounts={MOCK_ACCOUNTS}
          totalBalance={projection?.median_nest_egg ?? MOCK_ACCOUNTS.reduce((s, a) => s + a.balance, 0)}
        />
        <ContributionOptimizer accounts={MOCK_OPTIMIZER_ACCOUNTS} />
      </div>

      <div className="retirement-grid">
        <TaxStrategy
          currentTaxBracket={24}
          expectedRetirementBracket={15}
          rothPct={taxProfile === 'all-roth' ? 100 : taxProfile === 'all-tr' ? 0 : 33}
          traditionalPct={taxProfile === 'all-tr' ? 100 : taxProfile === 'all-roth' ? 0 : 55}
          taxablePct={12}
          onChange={setTaxProfile}
        />
        {scenario && (
          <div className="bg-card scenario-summary" style={{ padding: 16 }} data-testid="retirement-scenarios">
            <h3 style={{ marginTop: 0 }}>What-if scenarios</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {scenario.scenarios.slice(0, 3).map((p) => (
                <div key={p.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)' }}>
                  <span>{p.label}</span>
                  <strong style={{ fontVariantNumeric: 'tabular-nums' }}>${Math.round(p.nest_egg).toLocaleString()}</strong>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
