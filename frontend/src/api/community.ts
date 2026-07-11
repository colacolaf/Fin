import { api } from "./client";

// ── Types ──────────────────────────────────────────────

export interface BenchmarkPercentile {
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  sample_size: number;
}

export interface CommunityBenchmarks {
  profile_bucket: string;
  sample_size: number;
  k_anonymity_met: boolean;
  message?: string;
  benchmarks: Record<string, BenchmarkPercentile>;
  user_percentiles: Record<string, number>;
  user_metrics: Record<string, number>;
}

export interface LeaderboardEntry {
  rank: number;
  pseudonym: string;
  metric_display: string;
  badge?: string;
}

export interface CommunityLeaderboard {
  category: string;
  entries: LeaderboardEntry[];
  total_participants: number;
}

export interface VoteSummary {
  recommendation_id: string;
  accepted: number;
  rejected: number;
  deferred: number;
  total: number;
  consensus: "accepted" | "rejected" | "deferred" | "divided" | "none";
}

// ── API ────────────────────────────────────────────────

export const communityApi = {
  benchmarks: (profileBucket?: string) => {
    const params = profileBucket ? `?profile_bucket=${encodeURIComponent(profileBucket)}` : "";
    return api<CommunityBenchmarks>(`/community/benchmarks${params}`);
  },

  leaderboard: (category?: string, limit?: number) => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (limit) params.set("limit", String(limit));
    const qs = params.toString();
    return api<CommunityLeaderboard>(`/community/leaderboard${qs ? `?${qs}` : ""}`);
  },

  voteSummary: (recommendationId: string) =>
    api<VoteSummary>(`/community/vote-summary/${recommendationId}`),
};