import { motion } from 'framer-motion';
import type { SetupWizardData } from '@fin/shared';

interface Props {
  data: Partial<SetupWizardData>;
  onComplete: () => void;
  onBack: () => void;
  onEditStep: (step: number) => void;
  isSubmitting: boolean;
}

function maskSecret(secret: string): string {
  if (!secret) return 'Not set';
  return '•'.repeat(Math.min(secret.length, 16));
}

function getRiskLabel(score: number): string {
  if (score <= 3) return 'Conservative';
  if (score <= 7) return 'Moderate';
  return 'Aggressive';
}

const HORIZON_LABELS: Record<string, string> = {
  short: 'Short (< 3 years)',
  medium: 'Medium (3–10 years)',
  long: 'Long (> 10 years)',
};

const LOSS_LABELS: Record<string, string> = {
  sell_all: 'Sell Everything',
  hold_and_wait: 'Hold & Wait',
  buy_more: 'Buy More',
};

const ANIMATION = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3, ease: 'easeOut' as const },
};

export default function StepReview({ data, onComplete, onBack, onEditStep, isSubmitting }: Props) {
  const broker = data.broker;
  const risk = data.risk;
  const goals = data.goals?.goals ?? [];
  const budget = data.budget;
  const selectedGoals = goals.filter((g) => g.selected);

  return (
    <motion.div
      className="wizard-step"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.3 }}
    >
      <div className="wizard-step__content">
        <h2 className="wizard-step__title">Review Your Setup</h2>
        <p className="wizard-step__subtitle">
          Take a look at everything before you finish. You can go back and edit any section.
        </p>

        {/* Broker Section */}
        <motion.section className="wizard-review-section" {...ANIMATION} transition={{ delay: 0 }}>
          <div className="wizard-review-section__header">
            <h3>🔗 Broker Connection</h3>
            <button
              type="button"
              className="wizard-btn wizard-btn--link"
              onClick={() => onEditStep(0)}
            >
              Edit
            </button>
          </div>
          <dl className="wizard-review-section__details">
            <div>
              <dt>API Key</dt>
              <dd>{broker?.apiKey ?? 'Not set'}</dd>
            </div>
            <div>
              <dt>API Secret</dt>
              <dd>{broker?.apiSecret ? maskSecret(broker.apiSecret) : 'Not set'}</dd>
            </div>
            <div>
              <dt>Trading Mode</dt>
              <dd>{broker?.paperTrading ? '📝 Paper Trading' : '💰 Live Trading'}</dd>
            </div>
          </dl>
        </motion.section>

        {/* Risk Section */}
        <motion.section className="wizard-review-section" {...ANIMATION} transition={{ delay: 0.1 }}>
          <div className="wizard-review-section__header">
            <h3>🎯 Risk Profile</h3>
            <button
              type="button"
              className="wizard-btn wizard-btn--link"
              onClick={() => onEditStep(1)}
            >
              Edit
            </button>
          </div>
          {risk ? (
            <dl className="wizard-review-section__details">
              <div>
                <dt>Risk Score</dt>
                <dd>
                  {risk.riskScore}/10 — {getRiskLabel(risk.riskScore)}
                </dd>
              </div>
              <div>
                <dt>Horizon</dt>
                <dd>{HORIZON_LABELS[risk.investmentHorizon] ?? risk.investmentHorizon}</dd>
              </div>
              <div>
                <dt>Market Drop Reaction</dt>
                <dd>{LOSS_LABELS[risk.lossReaction] ?? risk.lossReaction}</dd>
              </div>
            </dl>
          ) : (
            <p className="wizard-review-section__empty">Not completed yet</p>
          )}
        </motion.section>

        {/* Goals Section */}
        <motion.section className="wizard-review-section" {...ANIMATION} transition={{ delay: 0.2 }}>
          <div className="wizard-review-section__header">
            <h3>🎯 Financial Goals</h3>
            <button
              type="button"
              className="wizard-btn wizard-btn--link"
              onClick={() => onEditStep(2)}
            >
              Edit
            </button>
          </div>
          {selectedGoals.length > 0 ? (
            <ul className="wizard-review-goals-list">
              {selectedGoals.map((g) => (
                <li key={g.id}>
                  <span>{g.label.replace(/^[^\s]+\s/, '')}</span>
                  {g.targetAmount && (
                    <span className="wizard-review-goal-amount">
                      ${g.targetAmount.toLocaleString()}
                    </span>
                  )}
                  {g.timelineYears && (
                    <span className="wizard-review-goal-timeline">
                      {g.timelineYears} years
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="wizard-review-section__empty">No goals selected</p>
          )}
        </motion.section>

        {/* Budget Section */}
        <motion.section className="wizard-review-section" {...ANIMATION} transition={{ delay: 0.3 }}>
          <div className="wizard-review-section__header">
            <h3>💰 Budget</h3>
            <button
              type="button"
              className="wizard-btn wizard-btn--link"
              onClick={() => onEditStep(3)}
            >
              Edit
            </button>
          </div>
          {budget ? (
            <dl className="wizard-review-section__details">
              <div>
                <dt>Monthly Income</dt>
                <dd>${budget.monthlyIncome.toLocaleString()}</dd>
              </div>
              <div>
                <dt>Monthly Expenses</dt>
                <dd>${budget.monthlyExpenses.toLocaleString()}</dd>
              </div>
              <div>
                <dt>Monthly Investable</dt>
                <dd className="wizard-review-highlight">
                  ${budget.monthlyInvestable.toLocaleString()}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="wizard-review-section__empty">Not completed yet</p>
          )}
        </motion.section>

        {/* Confirmation */}
        <motion.div
          className="wizard-review-confirm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p className="wizard-review-confirm__text">
            By completing setup, you agree that Fin can analyze your portfolio and provide recommendations. Your data stays private and encrypted.
          </p>
        </motion.div>
      </div>

      <div className="wizard-step__actions">
        <button type="button" className="wizard-btn wizard-btn--ghost" onClick={onBack}>
          ← Back
        </button>
        <button
          type="button"
          className="wizard-btn wizard-btn--primary wizard-btn--complete"
          onClick={onComplete}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <span className="wizard-spinner" />
          ) : (
            <>✓ Complete Setup</>
          )}
        </button>
      </div>
    </motion.div>
  );
}