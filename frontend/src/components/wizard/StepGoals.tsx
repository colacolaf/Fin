import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import type { Goals, FinancialGoal } from '@fin/shared';
import { GoalsSchema } from '@fin/shared';

interface Props {
  data: Goals | undefined;
  onUpdate: (data: Goals) => void;
  onNext: () => void;
  onBack: () => void;
}

const DEFAULT_GOALS: FinancialGoal[] = [
  { id: 'retirement', label: '🏖️ Retirement', selected: false, targetAmount: undefined, timelineYears: undefined },
  { id: 'house', label: '🏠 Buy a House', selected: false, targetAmount: undefined, timelineYears: undefined },
  { id: 'education', label: '🎓 Education Fund', selected: false, targetAmount: undefined, timelineYears: undefined },
  { id: 'emergency', label: '🛡️ Emergency Fund', selected: false, targetAmount: undefined, timelineYears: undefined },
  { id: 'wealth', label: '📈 Build Wealth', selected: false, targetAmount: undefined, timelineYears: undefined },
  { id: 'other', label: '🎯 Other Goal', selected: false, targetAmount: undefined, timelineYears: undefined },
];

export default function StepGoals({ data, onUpdate, onNext, onBack }: Props) {
  const [goals, setGoals] = useState<FinancialGoal[]>(data?.goals ?? DEFAULT_GOALS);
  const [error, setError] = useState<string | null>(null);

  const toggleGoal = useCallback((id: string) => {
    setGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, selected: !g.selected } : g)),
    );
    setError(null);
  }, []);

  const updateGoalField = useCallback(
    (id: string, field: 'targetAmount' | 'timelineYears', value: string) => {
      setGoals((prev) =>
        prev.map((g) =>
          g.id === id ? { ...g, [field]: value === '' ? undefined : Number(value) } : g,
        ),
      );
    },
    [],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const validated = GoalsSchema.parse({ goals });
      onUpdate(validated);
      setError(null);
      onNext();
    } catch {
      setError('Please select at least one goal');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="wizard-step">
      <div className="wizard-step__content">
        <h2 className="wizard-step__title">What Are Your Goals?</h2>
        <p className="wizard-step__subtitle">
          Select the financial goals that matter most to you. Add target amounts and timelines for each.
        </p>

        {error && <div className="wizard-field__error wizard-field__error--banner">{error}</div>}

        <div className="wizard-goals-grid">
          {goals.map((goal) => (
            <motion.div
              key={goal.id}
              className={`wizard-goal-card ${goal.selected ? 'wizard-goal-card--selected' : ''}`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <label className="wizard-goal-card__header">
                <input
                  type="checkbox"
                  checked={goal.selected}
                  onChange={() => toggleGoal(goal.id)}
                />
                <span>{goal.label}</span>
              </label>

              {goal.selected && (
                <motion.div
                  className="wizard-goal-card__details"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="wizard-field wizard-field--inline">
                    <label>Target Amount ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      placeholder="e.g. 50000"
                      value={goal.targetAmount ?? ''}
                      onChange={(e) => updateGoalField(goal.id, 'targetAmount', e.target.value)}
                    />
                  </div>
                  <div className="wizard-field wizard-field--inline">
                    <label>Timeline (years)</label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      placeholder="e.g. 10"
                      value={goal.timelineYears ?? ''}
                      onChange={(e) => updateGoalField(goal.id, 'timelineYears', e.target.value)}
                    />
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      <div className="wizard-step__actions">
        <button type="button" className="wizard-btn wizard-btn--ghost" onClick={onBack}>
          ← Back
        </button>
        <button type="submit" className="wizard-btn wizard-btn--primary">
          Next: Budget →
        </button>
      </div>
    </form>
  );
}