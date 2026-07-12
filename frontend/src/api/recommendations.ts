/** Recommendation API — fetch, generate, vote on financial recommendations. */

import { api } from './client';

export interface GenerateRequest {
  agent_type: 'investment' | 'debt' | 'retirement';
  user_message?: string;
  skill?: string;
}

export interface StructuredOutput {
  title?: string;
  summary?: string;
  rationale?: string;
  action?: string;
  ticker?: string;
  quantity?: number;
  agent_type?: string;
  confidence?: {
    overall: number;
    math_certainty: number;
    market_assumptions: number;
    user_goal_alignment: number;
    execution_likelihood: number;
    explanation?: string;
  };
  risks?: string[];
  alternatives?: string[];
  before_state?: Record<string, unknown>;
  after_state?: Record<string, unknown>;
}

export interface GenerateResponse {
  recommendation_id: string;
  agent_type: string;
  structured: StructuredOutput;
  raw_text: string;
  tokens_used: number;
}

export interface VoteRequest {
  vote: 'accepted' | 'rejected' | 'deferred';
  comment?: string;
}

export interface VoteResponse {
  vote_id: string;
  recommendation_id: string;
  vote: string;
}

export interface Recommendation {
  id: string;
  agent_type: string;
  recommendation_type: string;
  ticker: string | null;
  action: string;
  quantity: number | null;
  rationale: string;
  confidence_score: number;
  risks: string;
  alternatives: string;
  before_state: string | null;
  after_state: string | null;
  status: string;
  model_used: string | null;
  tokens_used: number | null;
  created_at: string;
  expires_at: string | null;
}

function paramsToString(params?: Record<string, string | number | undefined>): string {
  if (!params) return '';
  const entries = Object.entries(params).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return '';
  return '?' + new URLSearchParams(entries as [string, string][]).toString();
}

export const recommendationsApi = {
  generate: (request: GenerateRequest) =>
    api<GenerateResponse>('/recommendations/generate', {
      method: 'POST',
      body: JSON.stringify(request),
    }),

  list: (params?: { agent_type?: string; status?: string; limit?: number; offset?: number }) =>
    api<Recommendation[]>(`/recommendations/${paramsToString(params)}`),

  get: (id: string) => api<Recommendation>(`/recommendations/${id}`),

  vote: (id: string, vote: VoteRequest) =>
    api<VoteResponse>(`/recommendations/${id}/vote`, {
      method: 'POST',
      body: JSON.stringify(vote),
    }),

  health: () => api<{ ok: boolean; model: string; available_models: string[] }>('/recommendations/health'),

  // Phase 39 fix T2.2: probe endpoint — returns { empty: true } when there are no active recs.
  empty: () => api<{ empty: boolean }>('/recommendations/empty'),
};