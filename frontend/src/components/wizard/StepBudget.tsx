import { useState, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { BudgetSchema, type Budget } from '@fin/shared';

interface Props {
  data: Budget | undefined;
  onUpdate: (data: Budget) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function StepBudget({ data, onUpdate, onNext, onBack }: Props) {
  const [isWarning, setIsWarning] = useState(false);

  const form = useForm<Budget>({
    resolver: zodResolver(BudgetSchema),
    defaultValues: data ?? { monthlyIncome: 0, monthlyExpenses: 0, monthlyInvestable: 0 },
    mode: 'onChange',
  });

  const { register, handleSubmit, watch, setValue, formState: { errors } } = form;
  const income = watch('monthlyIncome');
  const expenses = watch('monthlyExpenses');

  // Auto-compute investable = income - expenses (min 0)
  const autoInvestable = useCallback(() => {
    const investable = Math.max(0, (income || 0) - (expenses || 0));
    setValue('monthlyInvestable', investable);
    setIsWarning((expenses || 0) > (income || 0));
  }, [income, expenses, setValue]);

  useEffect(() => {
    autoInvestable();
  }, [income, expenses, autoInvestable]);

  const onSubmit = (values: Budget) => {
    onUpdate(values);
    onNext();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="wizard-step">
      <div className="wizard-step__content">
        <h2 className="wizard-step__title">Your Monthly Budget</h2>
        <p className="wizard-step__subtitle">
          Tell us about your income and expenses. We'll calculate what's available to invest.
        </p>

        <div className="wizard-field">
          <label htmlFor="monthlyIncome">Monthly Income (after tax, $)</label>
          <input
            id="monthlyIncome"
            type="number"
            min="0"
            step="100"
            placeholder="e.g. 5000"
            {...register('monthlyIncome', { valueAsNumber: true })}
          />
          {errors.monthlyIncome && (
            <span className="wizard-field__error">{errors.monthlyIncome.message}</span>
          )}
        </div>

        <div className="wizard-field">
          <label htmlFor="monthlyExpenses">Monthly Expenses ($)</label>
          <input
            id="monthlyExpenses"
            type="number"
            min="0"
            step="100"
            placeholder="e.g. 3500"
            {...register('monthlyExpenses', { valueAsNumber: true })}
          />
          {errors.monthlyExpenses && (
            <span className="wizard-field__error">{errors.monthlyExpenses.message}</span>
          )}
        </div>

        {isWarning && (
          <div className="wizard-budget-warning">
            ⚠️ Your expenses exceed your income. Consider adjusting your budget to free up investable funds.
          </div>
        )}

        <div className="wizard-budget-result">
          <div className="wizard-budget-result__label">Monthly Investable</div>
          <div className="wizard-budget-result__value">
            ${(income || 0) - (expenses || 0) > 0 ? ((income || 0) - (expenses || 0)).toLocaleString() : '0'}
          </div>
          <div className="wizard-budget-result__annual">
            That's ${(((income || 0) - (expenses || 0)) * 12 > 0 ? ((income || 0) - (expenses || 0)) * 12 : 0).toLocaleString()} per year
          </div>
        </div>
      </div>

      <div className="wizard-step__actions">
        <button type="button" className="wizard-btn wizard-btn--ghost" onClick={onBack}>
          ← Back
        </button>
        <button type="submit" className="wizard-btn wizard-btn--primary">
          Next: Review →
        </button>
      </div>
    </form>
  );
}