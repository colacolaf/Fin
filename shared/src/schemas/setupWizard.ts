import { z } from 'zod';

// ── Broker Connection Step ─────────────────
export const BrokerConnectionSchema = z.object({
  apiKey: z
    .string()
    .min(1, 'API key is required')
    .refine(
      (v) => v.startsWith('PK') || v.startsWith('AK'),
      'API key should start with PK or AK',
    ),
  apiSecret: z
    .string()
    .min(1, 'API secret is required')
    .refine(
      (v) => v.length >= 16,
      'API secret must be at least 16 characters',
    ),
  paperTrading: z.boolean(),
});

// ── Risk Tolerance Step ────────────────────
export const RiskToleranceSchema = z.object({
  riskScore: z.number().min(1).max(10),
  investmentHorizon: z.enum(['short', 'medium', 'long']),
  lossReaction: z.enum(['sell_all', 'hold_and_wait', 'buy_more']),
});

// ── Financial Goals Step ───────────────────
export const FinancialGoalSchema = z.object({
  id: z.string(),
  label: z.string(),
  selected: z.boolean(),
  targetAmount: z.number().min(0).optional(),
  timelineYears: z.number().min(1).max(50).optional(),
});

export const GoalsSchema = z.object({
  goals: z.array(FinancialGoalSchema).min(1, 'Select at least one goal'),
});

// ── Budget Step ────────────────────────────
export const BudgetSchema = z.object({
  monthlyIncome: z.number().min(0, 'Must be 0 or more'),
  monthlyExpenses: z.number().min(0, 'Must be 0 or more'),
  monthlyInvestable: z.number().min(0),
});

// ── Combined wizard data ───────────────────
export const SetupWizardDataSchema = z.object({
  broker: BrokerConnectionSchema,
  risk: RiskToleranceSchema,
  goals: GoalsSchema,
  budget: BudgetSchema,
});

// ── Inferred types ─────────────────────────
export type BrokerConnection = z.infer<typeof BrokerConnectionSchema>;
export type RiskTolerance = z.infer<typeof RiskToleranceSchema>;
export type FinancialGoal = z.infer<typeof FinancialGoalSchema>;
export type Goals = z.infer<typeof GoalsSchema>;
export type Budget = z.infer<typeof BudgetSchema>;
export type SetupWizardData = z.infer<typeof SetupWizardDataSchema>;