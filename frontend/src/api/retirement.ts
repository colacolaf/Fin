import { api } from './client';

export interface RetirementProfile {
  current_age?: number;
  retirement_age?: number;
  current_savings?: number;
  annual_contribution?: number;
  annual_income?: number;
  assumed_return?: number;
  inflation_rate?: number;
  desired_income?: number;
  social_security?: number;
  employer_match_pct?: number;
  employer_match_limit?: number;
}

// ── Backend-aligned response types ─────────────────────
// Backend returns flat arrays + percentiles, not transformed.

export interface ProjectionResult {
  median_nest_egg: number;
  p10_nest_egg: number;
  p90_nest_egg: number;
  success_rate: number;
  median_monthly_income: number;
  p10_monthly_income: number;
  p90_monthly_income: number;
  funded_percentage: number;
  years: number[];
  median_path: number[];
  p10_path: number[];
  p90_path: number[];
}

export interface ReadinessResult {
  score: number;
  label: string;
  breakdown: {
    projection: number;
    savings_rate: number;
    funded_ratio: number;
    age_benchmark: number;
  };
  details: {
    success_rate: number;
    savings_rate_pct: number;
    funded_percentage: number;
    age_target_multiple: number;
    age_actual_multiple: number;
    median_nest_egg: number;
    median_monthly_income: number;
  };
}

export interface ScenarioPoint {
  label: string;
  nest_egg: number;
  success_rate: number;
  score: number;
}

export interface ScenarioResult {
  scenario_type: string;
  base_nest_egg: number;
  base_success_rate: number;
  scenarios: ScenarioPoint[];
}

export const retirementApi = {
  async getProjection(profile: RetirementProfile): Promise<ProjectionResult> {
    return api('/api/retirement/projection', {
      method: 'POST',
      body: JSON.stringify(profile),
    });
  },

  async getReadiness(profile: RetirementProfile): Promise<ReadinessResult> {
    return api('/api/retirement/readiness', {
      method: 'POST',
      body: JSON.stringify(profile),
    });
  },

  async getScenarios(params: {
    scenario_type: string;
    current_age: number;
    retirement_age: number;
    current_savings: number;
    annual_contribution: number;
    annual_income: number;
    assumed_return?: number;
    inflation_rate?: number;
    desired_income?: number;
    social_security?: number;
  }): Promise<ScenarioResult> {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) search.set(k, String(v));
    });
    return api(`/api/retirement/scenarios?${search.toString()}`);
  },

  async quickScore(params: {
    current_age: number;
    retirement_age: number;
    current_savings: number;
    annual_contribution: number;
    annual_income: number;
  }): Promise<ReadinessResult> {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => search.set(k, String(v)));
    return api(`/api/retirement/quick-score?${search.toString()}`);
  },
};