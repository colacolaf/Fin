import { useEffect, useState, useCallback } from "react";
import ScoreRing from "../components/ScoreRing";
import CheckInBanner from "../components/CheckInBanner";
import { executionApi } from "../api/execution";
import type { ExecutionAction, ExecutionStats } from "../api/execution";

type FilterTab = "pending" | "completed" | "rejected";

const statusLabel: Record<string, string> = {
  accepted: "Accepted",
  executed: "Done",
  rejected: "Rejected",
  abandoned: "Abandoned",
};

export default function ExecutionDashboard() {
  const [pending, setPending] = useState<ExecutionAction[]>([]);
  const [stats, setStats] = useState<ExecutionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterTab>("pending");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, s] = await Promise.all([executionApi.pending(), executionApi.stats()]);
      setPending(p);
      setStats(s);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load execution data";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExecute = async (actionId: string) => {
    setActionLoading(actionId);
    try {
      await executionApi.execute(actionId);
      setPending((prev) => prev.filter((a) => a.action_id !== actionId));
      // Refresh stats after action
      const s = await executionApi.stats();
      setStats(s);
    } catch {
      // Keep in list on failure
    } finally {
      setActionLoading(null);
    }
  };

  const handleAbandon = async (actionId: string) => {
    setActionLoading(actionId);
    try {
      await executionApi.abandon(actionId);
      setPending((prev) => prev.filter((a) => a.action_id !== actionId));
      const s = await executionApi.stats();
      setStats(s);
    } catch {
      // Keep in list on failure
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = pending.filter((a) => {
    if (filter === "pending") return a.status === "accepted";
    if (filter === "completed") return a.status === "executed";
    return a.status === "rejected";
  });

  const score = stats ? Math.round(stats.score) : 0;

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 16px" }}>
      <CheckInBanner />
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Execution</h1>

      {/* Error state */}
      {error && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: 8,
            background: "oklch(0.15 0.02 25)",
            color: "oklch(0.72 0.18 25)",
            marginBottom: 16,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>{error}</span>
          <button onClick={fetchData} style={btnReset}>
            Retry
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: "center", padding: 48 }}>
          <div className="spinner" />
          <p style={{ color: "oklch(0.6 0.01 240)", marginTop: 12 }}>Loading execution data…</p>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Score section */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 32,
              marginBottom: 32,
              padding: "24px",
              borderRadius: 12,
              background: "oklch(0.15 0.005 240)",
              border: "1px solid oklch(0.22 0.01 240)",
            }}
          >
            <ScoreRing score={score} size={100} strokeWidth={6} />
            <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 24px" }}>
              <Stat label="Streak" value={`${stats!.streak} days`} />
              <Stat label="Accept Rate" value={`${Math.round(stats!.acceptance_rate * 100)}%`} />
              <Stat label="Exec Rate" value={`${Math.round(stats!.execution_rate * 100)}%`} />
              <Stat label="Check-in Response" value={`${Math.round(stats!.check_in_response_rate * 100)}%`} />
              <Stat label="Accepted" value={String(stats!.total_accepted)} />
              <Stat label="Done" value={String(stats!.total_executed)} />
            </div>
          </div>

          {/* Action list */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {(["pending", "completed", "rejected"] as FilterTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  style={{
                    ...tabButton,
                    background: filter === tab ? "oklch(0.22 0.01 240)" : "transparent",
                    color: filter === tab ? "oklch(0.92 0.005 240)" : "oklch(0.6 0.01 240)",
                    borderColor: filter === tab ? "oklch(0.35 0.02 240)" : "oklch(0.18 0.01 240)",
                  }}
                >
                  {tab[0].toUpperCase() + tab.slice(1)}
                  {tab === "pending" && pending.filter((a) => a.status === "accepted").length > 0 && (
                    <span style={{ marginLeft: 6, fontSize: 12, opacity: 0.7 }}>
                      {pending.filter((a) => a.status === "accepted").length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: 48,
                  color: "oklch(0.5 0.01 240)",
                  borderRadius: 12,
                  border: "1px dashed oklch(0.2 0.01 240)",
                }}
              >
                No {filter} actions
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {filtered.map((action) => (
                  <div
                    key={action.action_id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "14px 18px",
                      borderRadius: 10,
                      background: "oklch(0.16 0.005 240)",
                      border: "1px solid oklch(0.2 0.01 240)",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                        {action.recommendation_id}
                      </div>
                      <div style={{ fontSize: 12, color: "oklch(0.55 0.01 240)" }}>
                        {statusLabel[action.status] ?? action.status}
                        {action.check_in_count > 0 && (
                          <span>
                            {" "}· {action.check_in_count} check-ins
                          </span>
                        )}
                      </div>
                    </div>
                    {action.status === "accepted" && (
                      <div style={{ display: "flex", gap: 8, flexShrink: 0, marginLeft: 16 }}>
                        <button
                          onClick={() => handleExecute(action.action_id)}
                          disabled={actionLoading === action.action_id}
                          style={{
                            ...actionBtn,
                            background: "oklch(0.27 0.06 160)",
                            color: "oklch(0.85 0.06 160)",
                          }}
                        >
                          {actionLoading === action.action_id ? "…" : "Done"}
                        </button>
                        <button
                          onClick={() => handleAbandon(action.action_id)}
                          disabled={actionLoading === action.action_id}
                          style={{
                            ...actionBtn,
                            background: "oklch(0.22 0.01 240)",
                            color: "oklch(0.65 0.01 240)",
                          }}
                        >
                          Skip
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: "oklch(0.55 0.01 240)" }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

const btnReset: React.CSSProperties = {
  background: "none",
  border: "1px solid oklch(0.35 0.02 25)",
  color: "oklch(0.72 0.18 25)",
  padding: "4px 12px",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 13,
};

const tabButton: React.CSSProperties = {
  padding: "6px 16px",
  borderRadius: 8,
  border: "1px solid",
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 500,
  transition: "background 150ms ease",
};

const actionBtn: React.CSSProperties = {
  padding: "6px 14px",
  borderRadius: 6,
  border: "none",
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 600,
};