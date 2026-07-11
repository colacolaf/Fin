import type { DTIRatio } from '@fin/shared';

interface DTIProps {
  dti: DTIRatio | null;
}

const FMT = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 });

function dtiPctClass(status: string): string {
  if (status === 'danger') return 'dti-bad';
  if (status === 'caution') return 'dti-warn';
  return 'dti-good';
}

function dtiLabel(status: string): string {
  if (status === 'danger') return 'High — lenders see you as risky';
  if (status === 'caution') return 'Moderate — room for improvement';
  return 'Healthy — in a good range';
}

export default function DebtToIncomeRatio({ dti }: DTIProps) {
  if (!dti) {
    return (
      <div className="debt-card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
        <p>No income data available</p>
        <p style={{ fontSize: 'var(--text-xs)', marginTop: '0.5rem' }}>
          Add your monthly income in settings to see your DTI ratio.
        </p>
      </div>
    );
  }

  const ratioPct = Math.min(dti.dti_pct, 100);
  const dtiCls = dtiPctClass(dti.status);

  return (
    <div className="debt-card dti-card" style={{ textAlign: 'center' }}>
      <div className="debt-card-label">Debt-to-Income Ratio</div>
      <div className={`debt-card-value ${dtiCls}`} style={{ fontSize: '2.5rem' }}>
        {dti.dti_pct.toFixed(1)}%
      </div>
      <div className={dtiCls} style={{ fontWeight: 600, marginBottom: '1rem', fontSize: 'var(--text-sm)' }}>
        {dtiLabel(dti.status)}
      </div>

      {/* Visual ratio bar */}
      <div style={{ display: 'flex', height: '12px', borderRadius: '6px', overflow: 'hidden', marginBottom: '0.75rem' }}>
        <div
          style={{
            width: `${ratioPct}%`,
            background: dti.dti_pct >= 50
              ? 'oklch(65% 0.18 25)'
              : dti.dti_pct >= 36
                ? 'oklch(70% 0.14 90)'
                : 'oklch(70% 0.18 155)',
            transition: 'width 600ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        />
        <div
          style={{
            width: `${100 - ratioPct}%`,
            background: 'var(--surface-overlay)',
            transition: 'width 600ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
        <span>Debt: {FMT.format(dti.total_monthly_debt)}/mo</span>
        <span>Income: {FMT.format(dti.monthly_income)}/mo</span>
      </div>
    </div>
  );
}