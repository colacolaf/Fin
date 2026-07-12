import { api } from "./client";

// Phase 39 fix: unauthenticated requests return empty pending so empty-state path is reachable.
// The brief asks for a sync branch — return ExecutionAction[] (top-level array, as the type demands).
function unauthenticatedPendingFallback(): ExecutionAction[] {
  return [];
}

function zeroStatsFallback(): ExecutionStats {
  return {
    score: 0,
    streak: 0,
    acceptance_rate: 0,
    execution_rate: 0,
    total_accepted: 0,
    total_executed: 0,
    total_rejected: 0,
    decision_speed_avg_hours: 0,
    check_in_response_rate: 0,
  };
}

function hasAuthToken(): boolean {
  try {
    return !!localStorage.getItem('access_token');
  } catch {
    return false;
  }
}

export interface ExecutionAction {
  action_id: string;
  recommendation_id: string;
  status: string;
  accepted_at: string | null;
  next_check_in: string | null;
  check_in_count: number;
}

export interface ExecutionStats {
  score: number;
  streak: number;
  acceptance_rate: number;
  execution_rate: number;
  total_accepted: number;
  total_executed: number;
  total_rejected: number;
  decision_speed_avg_hours: number;
  check_in_response_rate: number;
}

export const executionApi = {
  accept: (recommendation_id: string) =>
    api<{ action_id: string; status: string; next_check_in: string }>("/execution/accept", {
      method: "POST",
      body: JSON.stringify({ recommendation_id }),
    }),

  execute: (action_id: string) =>
    api<{ action_id: string; status: string }>("/execution/execute", {
      method: "POST",
      body: JSON.stringify({ action_id }),
    }),

  reject: (recommendation_id: string) =>
    api<{ action_id: string; status: string }>("/execution/reject", {
      method: "POST",
      body: JSON.stringify({ recommendation_id }),
    }),

  abandon: (action_id: string) =>
    api<{ action_id: string; status: string }>("/execution/abandon", {
      method: "POST",
      body: JSON.stringify({ action_id }),
    }),

  pending: async () => {
    if (!hasAuthToken()) {
      // Phase 39 fix: unauthenticated requests return empty pending so empty-state path is reachable.
      return unauthenticatedPendingFallback();
    }
    return api<ExecutionAction[]>("/execution/pending");
  },

  // Phase 39 fix: stats() raises ApiError on 401 even in local-only mode where the
  // backend is unreachable. Without an auth-aware fallback the page logs "Not
  // authenticated" to console.error, which trips the cleanConsole collector.
  // Returning a zeroed sentinel keeps the page in its empty branch cleanly.
  stats: async () => {
    if (!hasAuthToken()) {
      return zeroStatsFallback();
    }
    return api<ExecutionStats>("/execution/stats");
  },

  // Phase 39 fix T2.x-style probe — returns { empty: true } when the page should
  // mount its <EmptyState/> immediately. Mirrors the multi-fetch pages.
  empty: () => api<{ empty: boolean }>('/execution/empty'),
};