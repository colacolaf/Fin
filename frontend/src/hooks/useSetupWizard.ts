import { useState, useCallback, useEffect } from 'react';
import type { SetupWizardData } from '@fin/shared';
import {
  BrokerConnectionSchema,
  RiskToleranceSchema,
  GoalsSchema,
  BudgetSchema,
  SetupWizardDataSchema,
} from '@fin/shared';
import { api } from '../api/client';

const STORAGE_KEY = 'fin_setup_wizard';
const TOTAL_STEPS = 5;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyZodSchema = { parse: (data: unknown) => any; safeParse: (data: unknown) => any };

interface StepSchema {
  key: keyof SetupWizardData;
  schema: AnyZodSchema;
}

interface UseSetupWizardReturn {
  currentStep: number;
  direction: number;
  formData: Partial<SetupWizardData>;
  isComplete: boolean;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (n: number) => void;
  updateStepData: <K extends keyof SetupWizardData>(
    key: K,
    data: SetupWizardData[K],
  ) => void;
  isStepValid: (step: number) => boolean;
  saveToBackend: () => Promise<void>;
  reset: () => void;
}

function loadFromStorage(): Partial<SetupWizardData> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    SetupWizardDataSchema.partial().parse(parsed);
    return parsed as Partial<SetupWizardData>;
  } catch {
    return {};
  }
}

function persistToStorage(data: Partial<SetupWizardData>) {
  if (Object.keys(data).length === 0) {
    localStorage.removeItem(STORAGE_KEY);
  } else {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
}

const STEP_SCHEMAS: Record<number, StepSchema | null> = {
  0: { key: 'broker', schema: BrokerConnectionSchema as unknown as AnyZodSchema },
  1: { key: 'risk', schema: RiskToleranceSchema as unknown as AnyZodSchema },
  2: { key: 'goals', schema: GoalsSchema as unknown as AnyZodSchema },
  3: { key: 'budget', schema: BudgetSchema as unknown as AnyZodSchema },
  4: null,
};

export function useSetupWizard(): UseSetupWizardReturn {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(0);
  const [formData, setFormData] = useState<Partial<SetupWizardData>>(loadFromStorage);

  useEffect(() => {
    persistToStorage(formData);
  }, [formData]);

  const updateStepData = useCallback(
    <K extends keyof SetupWizardData>(key: K, data: SetupWizardData[K]) => {
      setFormData((prev) => ({ ...prev, [key]: data }));
    },
    [],
  );

  const isStepValid = useCallback(
    (step: number): boolean => {
      const entry = STEP_SCHEMAS[step];
      if (!entry) return true;
      const data = formData[entry.key];
      if (data === undefined) return false;
      const result = entry.schema.safeParse(data);
      return result.success === true;
    },
    [formData],
  );

  const nextStep = useCallback(() => {
    const entry = STEP_SCHEMAS[currentStep];
    if (entry) {
      const data = formData[entry.key];
      if (data === undefined) return;
      entry.schema.parse(data);
    }
    if (currentStep < TOTAL_STEPS - 1) {
      setDirection(1);
      setCurrentStep((s) => s + 1);
    }
  }, [currentStep, formData]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep((s) => s - 1);
    }
  }, [currentStep]);

  const goToStep = useCallback(
    (n: number) => {
      if (n < 0 || n >= TOTAL_STEPS) return;
      if (n <= currentStep + 1) {
        setDirection(n > currentStep ? 1 : -1);
        setCurrentStep(n);
      }
    },
    [currentStep],
  );

  const isComplete = useCallback((): boolean => {
    return [0, 1, 2, 3].every((s) => isStepValid(s));
  }, [isStepValid]);

  const saveToBackend = useCallback(async () => {
    if (!isComplete()) {
      throw new Error('Wizard data is incomplete');
    }
    await api('/settings/onboarding', {
      method: 'PUT',
      body: JSON.stringify(formData),
    });
    localStorage.setItem('fin_onboarding_complete', 'true');
    localStorage.removeItem(STORAGE_KEY);
  }, [formData, isComplete]);

  const reset = useCallback(() => {
    setFormData({});
    setCurrentStep(0);
    setDirection(0);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    currentStep,
    direction,
    formData,
    isComplete: isComplete(),
    nextStep,
    prevStep,
    goToStep,
    updateStepData,
    isStepValid,
    saveToBackend,
    reset,
  };
}
