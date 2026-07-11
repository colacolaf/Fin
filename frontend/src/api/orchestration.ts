/** Phase 13: Multi-agent orchestration API client. */

import { api } from "./client";

export interface MultiAgentResult {
  summary: {
    total: number;
    succeeded: number;
    failed: number;
  };
  agents: Record<
    string,
    {
      status: "done" | "error";
      result?: Record<string, unknown>;
      error?: string;
      reasoning?: string;
    }
  >;
  cross_agent?: {
    conflicts?: Array<{
      category: string;
      resolution: "pay_debt" | "split" | "invest";
      recommendation: string;
    }>;
  };
}

export async function runMultiAgent(
  userId: string,
  skill: string,
  agents: string[]
): Promise<MultiAgentResult> {
  return api<MultiAgentResult>("/orchestration/run", {
    method: "POST",
    body: JSON.stringify({ user_id: userId, skill, agents }),
  });
}