import { useEffect, useState } from "react";
import { communityApi, type VoteSummary } from "../api/community";

interface VoteWidgetProps {
  recommendationId: string;
  userVote?: "accepted" | "rejected" | "deferred" | null;
  onVote: (vote: "accepted" | "rejected" | "deferred") => void;
}

const VOTE_OPTIONS = [
  { value: "accepted" as const, label: "Accept", emoji: "✅" },
  { value: "deferred" as const, label: "Defer", emoji: "⏳" },
  { value: "rejected" as const, label: "Reject", emoji: "❌" },
] as const;

/**
 * VoteWidget — Displays community vote counts + allows user to cast a vote.
 * Shows real-time vote summary with consensus indicator.
 * Matches existing ScoreRing/BeforeAfter visual style (OKLCH colors, minimal).
 */
export default function VoteWidget({ recommendationId, userVote, onVote }: VoteWidgetProps) {
  const [summary, setSummary] = useState<VoteSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(userVote ?? null);
  const [submitting, setSubmitting] = useState<string | null>(null);

  // Sync external userVote changes
  useEffect(() => {
    setSelected(userVote ?? null);
  }, [userVote]);

  // Load vote summary on mount
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    communityApi
      .voteSummary(recommendationId)
      .then((data) => {
        if (!cancelled) setSummary(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [recommendationId]);

  const handleVote = async (vote: "accepted" | "rejected" | "deferred") => {
    setSubmitting(vote);
    setSelected(vote);

    try {
      onVote(vote);

      // Refresh summary
      const updated = await communityApi.voteSummary(recommendationId);
      setSummary(updated);
    } catch {
      // Revert on failure
      setSelected(userVote ?? null);
    } finally {
      setSubmitting(null);
    }
  };

  const maxCount = summary ? Math.max(summary.accepted, summary.rejected, summary.deferred, 1) : 1;

  const consensusColor =
    summary?.consensus === "accepted"
      ? "oklch(0.65 0.18 160)"
      : summary?.consensus === "rejected"
        ? "oklch(0.58 0.17 25)"
        : summary?.consensus === "deferred"
          ? "oklch(0.72 0.15 85)"
          : "oklch(0.5 0.01 240)";

  return (
    <div
      className="vote-widget"
      style={{
        background: "oklch(0.18 0.005 240)",
        borderRadius: 12,
        padding: "16px 20px",
        border: "1px solid oklch(0.25 0.005 240)",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: "oklch(0.75 0.01 240)" }}>
          Community Votes
        </span>
        {summary && summary.total > 0 && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 500,
              padding: "2px 8px",
              borderRadius: 100,
              background: `${consensusColor}20`,
              color: consensusColor,
            }}
          >
            {summary.total} vote{summary.total !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Vote bars */}
      {summary && summary.total > 0 ? (
        <div style={{ marginBottom: 16 }}>
          {VOTE_OPTIONS.map(({ value, label, emoji }) => {
            const count = summary[value];
            const pct = summary.total > 0 ? (count / summary.total) * 100 : 0;
            const barColor =
              value === "accepted"
                ? "oklch(0.65 0.18 160)"
                : value === "rejected"
                  ? "oklch(0.58 0.17 25)"
                  : "oklch(0.72 0.15 85)";

            return (
              <div
                key={value}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 6,
                  fontSize: 13,
                }}
              >
                <span style={{ minWidth: 18, textAlign: "center" }}>{emoji}</span>
                <span
                  style={{
                    minWidth: 52,
                    color: "oklch(0.65 0.01 240)",
                    fontWeight: 500,
                  }}
                >
                  {label}
                </span>
                <div style={{ flex: 1, position: "relative", height: 6, borderRadius: 3, background: "oklch(0.22 0.005 240)" }}>
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: 3,
                      background: barColor,
                      width: `${Math.max(pct, 2)}%`,
                      transition: "width 500ms cubic-bezier(0.25, 1, 0.5, 1)",
                    }}
                  />
                </div>
                <span
                  style={{
                    minWidth: 28,
                    textAlign: "right",
                    color: "oklch(0.55 0.01 240)",
                    fontSize: 12,
                  }}
                >
                  {count}
                </span>
              </div>
            );
          })}

          {/* Consensus badge */}
          <div
            style={{
              marginTop: 10,
              fontSize: 12,
              color: consensusColor,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: consensusColor,
                display: "inline-block",
              }}
            />
            {summary.consensus === "accepted"
              ? "Community majority: Accept"
              : summary.consensus === "rejected"
                ? "Community majority: Reject"
                : summary.consensus === "divided"
                  ? "Community is divided"
                  : summary.consensus === "deferred"
                    ? "Community majority: Defer"
                    : "No votes yet"}
          </div>
        </div>
      ) : loading ? (
        <div style={{ color: "oklch(0.5 0.01 240)", fontSize: 13, marginBottom: 16 }}>
          Loading votes…
        </div>
      ) : (
        <div style={{ color: "oklch(0.5 0.01 240)", fontSize: 13, marginBottom: 16 }}>
          No votes yet. Be the first!
        </div>
      )}

      {/* Vote buttons */}
      <div style={{ display: "flex", gap: 8 }}>
        {VOTE_OPTIONS.map(({ value, label, emoji }) => (
          <button
            key={value}
            onClick={() => handleVote(value)}
            disabled={submitting !== null}
            aria-pressed={selected === value}
            style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: 8,
              border:
                selected === value
                  ? value === "accepted"
                    ? "2px solid oklch(0.65 0.18 160)"
                    : value === "rejected"
                      ? "2px solid oklch(0.58 0.17 25)"
                      : "2px solid oklch(0.72 0.15 85)"
                  : "1px solid oklch(0.25 0.005 240)",
              background:
                selected === value
                  ? value === "accepted"
                    ? "oklch(0.65 0.18 160 / 0.12)"
                    : value === "rejected"
                      ? "oklch(0.58 0.17 25 / 0.12)"
                      : "oklch(0.72 0.15 85 / 0.12)"
                  : "oklch(0.16 0.005 240)",
              color:
                selected === value
                  ? value === "accepted"
                    ? "oklch(0.65 0.18 160)"
                    : value === "rejected"
                      ? "oklch(0.58 0.17 25)"
                      : "oklch(0.72 0.15 85)"
                  : "oklch(0.55 0.01 240)",
              cursor: submitting ? "wait" : "pointer",
              fontSize: 13,
              fontWeight: 600,
              transition: "all 150ms ease",
              opacity: submitting && submitting !== value ? 0.5 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <span>{emoji}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}