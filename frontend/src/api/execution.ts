import { api } from "./client";

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

  pending: () => api<ExecutionAction[]>("/execution/pending"),

  stats: () => api<ExecutionStats>("/execution/stats"),
};