import { motion, AnimatePresence } from 'framer-motion';

const STEPS = [
  { number: 1, label: 'Broker' },
  { number: 2, label: 'Risk' },
  { number: 3, label: 'Goals' },
  { number: 4, label: 'Budget' },
  { number: 5, label: 'Review' },
];

interface Props {
  currentStep: number;
  direction: number;
  completedSteps: number[];
  onStepClick: (step: number) => void;
}

export default function ProgressBar({ currentStep, completedSteps, onStepClick }: Props) {
  return (
    <nav className="wizard-progress" aria-label="Setup progress">
      {/* Desktop: horizontal steps */}
      <ol className="wizard-progress__desktop">
        {STEPS.map((step, i) => {
          const isCompleted = completedSteps.includes(i);
          const isCurrent = currentStep === i;
          const isClickable = i <= currentStep + 1 && i <= Math.max(...completedSteps, 0) + 1;

          return (
            <li
              key={step.number}
              className={`wizard-progress__step ${isCompleted ? 'wizard-progress__step--completed' : ''} ${isCurrent ? 'wizard-progress__step--current' : ''} ${isClickable ? 'wizard-progress__step--clickable' : ''}`}
            >
              <button
                type="button"
                className="wizard-progress__button"
                onClick={() => isClickable && onStepClick(i)}
                disabled={!isClickable}
                aria-current={isCurrent ? 'step' : undefined}
              >
                <motion.span
                  className="wizard-progress__dot"
                  animate={{
                    scale: isCurrent ? 1.15 : 1,
                    backgroundColor: isCompleted
                      ? 'var(--color-primary)'
                      : isCurrent
                        ? 'var(--color-primary-light)'
                        : 'var(--color-border)',
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <AnimatePresence mode="wait">
                    {isCompleted ? (
                      <motion.span
                        key="check"
                        initial={{ scale: 0, rotate: -90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0 }}
                      >
                        ✓
                      </motion.span>
                    ) : (
                      <motion.span
                        key="number"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                      >
                        {step.number}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.span>

                <span className="wizard-progress__label">{step.label}</span>
              </button>

              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <motion.div
                  className="wizard-progress__connector"
                  initial={false}
                  animate={{
                    backgroundColor:
                      completedSteps.includes(i) ? 'var(--color-primary)' : 'var(--color-border)',
                  }}
                  transition={{ duration: 0.3 }}
                />
              )}
            </li>
          );
        })}
      </ol>

      {/* Mobile: current step indicator */}
      <div className="wizard-progress__mobile">
        <div className="wizard-progress__mobile-bar">
          <motion.div
            className="wizard-progress__mobile-fill"
            animate={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>
        <span className="wizard-progress__mobile-text">
          Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep]?.label}
        </span>
      </div>
    </nav>
  );
}