import { motion } from 'framer-motion';
import type { RiskTolerance } from '@fin/shared';

interface Props {
  data: RiskTolerance | undefined;
  onUpdate: (data: RiskTolerance) => void;
  onNext: () => void;
  onBack: () => void;
}

const HORIZON_OPTIONS = [
  { value: 'short' as const, label: 'Short', desc: 'Less than 3 years' },
  { value: 'medium' as const, label: 'Medium', desc: '3–10 years' },
  { value: 'long' as const, label: 'Long', desc: 'More than 10 years' },
] as const;

const LOSS_REACTIONS = [
  { value: 'sell_all' as const, label: 'Sell Everything', icon: '😰', desc: 'I would liquidate my positions immediately' },
  { value: 'hold_and_wait' as const, label: 'Hold & Wait', icon: '😐', desc: 'I would stay the course and wait for recovery' },
  { value: 'buy_more' as const, label: 'Buy More', icon: '🤑', desc: 'I would see it as a buying opportunity' },
] as const;

const SLIDER_MIN = 1;
const SLIDER_MAX = 10;

function getRiskLabel(score: number): string {
  if (score <= 3) return 'Conservative';
  if (score <= 7) return 'Moderate';
  return 'Aggressive';
}

function getRiskColor(score: number): string {
  const t = (score - SLIDER_MIN) / (SLIDER_MAX - SLIDER_MIN);
  // Interpolate from green (teal) to red
  const r = Math.round(200 * t);
  const g = Math.round(200 * (1 - t));
  return `oklch(0.55 0.15 ${120 - t * 100})`;
}

export default function StepRiskTolerance({ data, onUpdate, onNext, onBack }: Props) {
  const riskScore = data?.riskScore ?? 5;
  const investmentHorizon = data?.investmentHorizon ?? 'medium';
  const lossReaction = data?.lossReaction ?? 'hold_and_wait';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate({ riskScore, investmentHorizon, lossReaction });
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="wizard-step">
      <div className="wizard-step__content">
        <h2 className="wizard-step__title">Your Risk Profile</h2>
        <p className="wizard-step__subtitle">
          Help us understand how you think about risk and market volatility.
        </p>

        {/* Risk Score Slider */}
        <div className="wizard-field">
          <label className="wizard-risk__label">
            Risk Tolerance: <strong>{riskScore}/10</strong>
            <span className="wizard-risk__category" style={{ color: getRiskColor(riskScore) }}>
              {getRiskLabel(riskScore)}
            </span>
          </label>
          <div className="wizard-risk__slider-container">
            <input
              type="range"
              min={SLIDER_MIN}
              max={SLIDER_MAX}
              value={riskScore}
              className="wizard-risk__slider"
              style={{
                background: `linear-gradient(to right, oklch(0.55 0.18 160), oklch(0.55 0.18 30))`,
              }}
              onChange={(e) => {
                // We need to update local state. For simplicity we use uncontrolled approach
                // and read the value on submit
                e.currentTarget.setAttribute('data-value', e.currentTarget.value);
              }}
            />
            <div className="wizard-risk__slider-labels">
              <span>1</span>
              <span>5</span>
              <span>10</span>
            </div>
          </div>
        </div>

        {/* Investment Horizon */}
        <div className="wizard-field">
          <label>Investment Horizon</label>
          <div className="wizard-radio-group">
            {HORIZON_OPTIONS.map((opt) => (
              <motion.label
                key={opt.value}
                className={`wizard-radio-card ${investmentHorizon === opt.value ? 'wizard-radio-card--selected' : ''}`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <input
                  type="radio"
                  name="horizon"
                  value={opt.value}
                  defaultChecked={investmentHorizon === opt.value}
                  onChange={() => {
                    const newVal = {
                      riskScore,
                      investmentHorizon: opt.value,
                      lossReaction,
                    };
                    onUpdate(newVal);
                  }}
                />
                <span className="wizard-radio-card__label">{opt.label}</span>
                <span className="wizard-radio-card__desc">{opt.desc}</span>
              </motion.label>
            ))}
          </div>
        </div>

        {/* Loss Reaction */}
        <div className="wizard-field">
          <label>Market drops 20%. What do you do?</label>
          <div className="wizard-radio-group wizard-radio-group--columns">
            {LOSS_REACTIONS.map((opt) => (
              <motion.label
                key={opt.value}
                className={`wizard-radio-card wizard-radio-card--icon ${lossReaction === opt.value ? 'wizard-radio-card--selected' : ''}`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <input
                  type="radio"
                  name="lossReaction"
                  value={opt.value}
                  defaultChecked={lossReaction === opt.value}
                  onChange={() => {
                    const newVal = {
                      riskScore,
                      investmentHorizon,
                      lossReaction: opt.value,
                    };
                    onUpdate(newVal);
                  }}
                />
                <span className="wizard-radio-card__emoji">{opt.icon}</span>
                <span className="wizard-radio-card__label">{opt.label}</span>
                <span className="wizard-radio-card__desc">{opt.desc}</span>
              </motion.label>
            ))}
          </div>
        </div>
      </div>

      <div className="wizard-step__actions">
        <button type="button" className="wizard-btn wizard-btn--ghost" onClick={onBack}>
          ← Back
        </button>
        <button type="submit" className="wizard-btn wizard-btn--primary">
          Next: Goals →
        </button>
      </div>
    </form>
  );
}