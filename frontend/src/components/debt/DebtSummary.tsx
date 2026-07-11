import type { DebtAccount } from '@fin/shared';

const FMT = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 });

interface Props {
  total_debt: number;
  monthly_payments: number;
  avg_interest_rate: number;
  debt_count: number;
  dti_ratio: {
    dti_ratio: number;
    status: string;
    status_text: string;
    monthly_payments: number;
    monthly_income: number;
  } | null;
}

function dtiClass(dti: number): string {
  if (dti >= 50) return 'dti-bad';
  if (dti >= 36) return 'dti-warn';
  return 'dti-good';
}

export default function DebtSummary({
  total_debt,
  monthly_payments,
  avg_interest_rate,
  debt_count,
  dti_ratio,
}: Props) {
  return (
    <div className="debt-summary-cards">
      <div className="debt-card">
        <div className="debt-card-label">Total Debt</div>
        <div className="debt-card-value">{FMT.format(total_debt)}</div>
      </div>

      <div className="debt-card">
        <div className="debt-card-label">Monthly Payments</div>
        <div className="debt-card-value">{FMT.format(monthly_payments)}</div>
      </div>

      <div className="debt-card">
        <div className="debt-card-label">Avg Interest Rate</div>
        <div className="debt-card-value">{avg_interest_rate.toFixed(1)}%</div>
      </div>

      <div className="debt-card">
        <div className="debt-card-label">Debt-to-Income</div>
        <div className={`debt-card-value ${dti_ratio ? dtiClass(dti_ratio.dti_ratio) : ''}`}>
          {dti_ratio ? `${dti_ratio.dti_ratio.toFixed(1)}%` : 'N/A'}
        </div>
      </div>
    </div>
  );
}