import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSetupWizard } from '../hooks/useSetupWizard';
import '../styles/wizard.css';
import ProgressBar from '../components/wizard/ProgressBar';
import StepBrokerConnect from '../components/wizard/StepBrokerConnect';
import StepRiskTolerance from '../components/wizard/StepRiskTolerance';
import StepGoals from '../components/wizard/StepGoals';
import StepBudget from '../components/wizard/StepBudget';
import StepReview from '../components/wizard/StepReview';
import TourGuide from '../components/wizard/TourGuide';
import type {
  BrokerConnection,
  RiskTolerance,
  Goals,
  Budget,
} from '@fin/shared';

const STEP_COUNT = 5;

const STEP_LABELS: string[] = [
  'Connect Broker',
  'Risk Profile',
  'Your Goals',
  'Budget',
  'Review & Save',
];

// Mobile-first step transition: slide + fade + slight scale
const stepVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 200 : -200,
    opacity: 0,
    scale: 0.97,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] as const },
  },
  exit: (dir: number) => ({
    x: dir < 0 ? 200 : -200,
    opacity: 0,
    scale: 0.97,
    transition: { duration: 0.2, ease: [0.4, 0, 1, 1] as const },
  }),
};

function buildVisitedSteps(current: number): Set<number> {
  const set = new Set<number>();
  for (let i = 0; i <= current; i++) set.add(i);
  return set;
}

export default function SetupWizard() {
  const wizard = useSetupWizard();
  const [showTour, setShowTour] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleBrokerUpdate = useCallback(
    (data: BrokerConnection) => {
      wizard.updateStepData('broker', data);
      wizard.nextStep();
    },
    [wizard],
  );

  const handleRiskUpdate = useCallback(
    (data: RiskTolerance) => {
      wizard.updateStepData('risk', data);
      wizard.nextStep();
    },
    [wizard],
  );

  const handleGoalsUpdate = useCallback(
    (data: Goals) => {
      wizard.updateStepData('goals', data);
      wizard.nextStep();
    },
    [wizard],
  );

  const handleBudgetUpdate = useCallback(
    (data: Budget) => {
      wizard.updateStepData('budget', data);
      wizard.nextStep();
    },
    [wizard],
  );

  const handleComplete = useCallback(async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await wizard.saveToBackend();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Failed to save settings',
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [wizard]);

  const visitedSteps = buildVisitedSteps(wizard.currentStep);

  return (
    <div className="setup-wizard" data-testid="setup-wizard">
      {/* Header */}
      <header className="wizard-header">
        <h1 className="wizard-title">Welcome to Fin</h1>
        <p className="wizard-subtitle">
          Let's set up your profile in a few quick steps.
        </p>
        <button
          className="wizard-tour-btn"
          onClick={() => setShowTour(true)}
          aria-label="Start guided tour"
        >
          Take a tour
        </button>
      </header>

      {/* Progress bar */}
      <ProgressBar
        currentStep={wizard.currentStep}
        direction={wizard.direction}
        completedSteps={Array.from(visitedSteps)}
        onStepClick={wizard.goToStep}
      />

      {/* Step content with animated transitions */}
      <div className="wizard-content">
        <AnimatePresence mode="wait" custom={wizard.direction} initial={false}>
          <motion.div
            key={wizard.currentStep}
            custom={wizard.direction}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="wizard-step-container"
          >
            {wizard.currentStep === 0 && (
              <StepBrokerConnect
                data={wizard.formData.broker}
                onUpdate={handleBrokerUpdate}
                onNext={wizard.nextStep}
              />
            )}
            {wizard.currentStep === 1 && (
              <StepRiskTolerance
                data={wizard.formData.risk}
                onUpdate={handleRiskUpdate}
                onNext={wizard.nextStep}
                onBack={wizard.prevStep}
              />
            )}
            {wizard.currentStep === 2 && (
              <StepGoals
                data={wizard.formData.goals}
                onUpdate={handleGoalsUpdate}
                onNext={wizard.nextStep}
                onBack={wizard.prevStep}
              />
            )}
            {wizard.currentStep === 3 && (
              <StepBudget
                data={wizard.formData.budget}
                onUpdate={handleBudgetUpdate}
                onNext={wizard.nextStep}
                onBack={wizard.prevStep}
              />
            )}
            {wizard.currentStep === 4 && (
              <StepReview
                data={wizard.formData}
                onBack={wizard.prevStep}
                onEditStep={wizard.goToStep}
                onComplete={handleComplete}
                isSubmitting={isSubmitting}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Tour guide overlay */}
      <TourGuide run={showTour} onFinish={() => setShowTour(false)} />
    </div>
  );
}