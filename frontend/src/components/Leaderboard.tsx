import { useEffect, useState } from "react";
import { communityApi, type CommunityLeaderboard } from "../api/community";

const CATEGORIES = [
  { value: "execution_rate", label: "Execution Rate" },
  { value: "savings_rate", label: "Savings Rate" },
  { value: "portfolio_value", label: "Portfolio Value" },
] as const;

/**
 * Leaderboard — Anonymized community rankings.
 * Pseudonyms are deterministic hashes — no PII.
 * Matches existing ScoreRing/BeforeAfter visual style.
 */
export default function Leaderboard() {
  const [category, setCategory] = useState<string>("execution_rate");
  const [data, setData] = useState<CommunityLeaderboard | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    communityApi
      .leaderboard(category, 20)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [category]);

  return (
    <div
      style={{
        background: "oklch(0.18 0.005 240)",
        borderRadius: 12,
        border: "1px solid oklch(0.25 0.005 240)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid oklch(0.22 0.005 240)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 600, color: "oklch(0.75 0.01 240)" }}>
          Community Leaderboard
        </span>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{
            background: "oklch(0.22 0.005 240)",
            color: "oklch(0.75 0.01 240)",
            border: "1px solid oklch(0.3 0.005 240)",
            borderRadius: 6,
            padding: "4px 10px",
            fontSize: 12,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ padding: 32, textAlign: "center", color: "oklch(0.5 0.01 240)", fontSize: 13 }}>
          Loading…
        </div>
      ) : data && data.entries.length > 0 ? (
        <div style={{ maxHeight: 480, overflowY: "auto" }}>
          {data.entries.map((entry, i) => (
            <div
              key={entry.pseudonym}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 20px",
                borderBottom:
                  i < data.entries.length - 1 ? "1px solid oklch(0.22 0.005 240)" : "none",
                background:
                  entry.rank === 1
                    ? "oklch(0.72 0.15 85 / 0.06)"
                    : entry.rank === 2
                      ? "oklch(0.6 0.02 240 / 0.06)"
                      : entry.rank === 3
                        ? "oklch(0.65 0.18 160 / 0.04)"
                        : "transparent",
          }}
        >
          {/* Rank */}
          <span
            style={{
              minWidth: 28,
              fontWeight: 700,
              fontSize: 14,
              color:
                entry.rank === 1
                  ? "oklch(0.72 0.15 85)"
                  : entry.rank === 2
                    ? "oklch(0.6 0.02 240)"
                    : entry.rank === 3
                      ? "oklch(0.65 0.18 160)"
                      : "oklch(0.5 0.01 240)",
            }}
          >
            {entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : `#${entry.rank}`}
          </span>

          {/* Pseudonym */}
          <span
            style={{
              flex: 1,
              fontSize: 13,
              fontWeight: 600,
              color: "oklch(0.75 0.01 240)",
            }}
          >
            {entry.pseudonym}
          </span>

          {/* Metric */}
          <span
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: "oklch(0.65 0.01 240)",
            }}
          >
            {entry.metric_display}
          </span>

          {/* Badge */}
          {entry.badge && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: 100,
                background: "oklch(0.65 0.18 160 / 0.15)",
                color: "oklch(0.65 0.18 160)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              {entry.badge}
            </span>
          )}
        </div>
      ))}
    </div>
  ) : (
    <div style={{ padding: 32, textAlign: "center", color: "oklch(0.5 0.01 240)", fontSize: 13 }}>
      Not enough data yet. Join the community!
    </div>
  )}

  {/* Footer */}
  {data && data.total_participants > 0 && (
    <div
      style={{
        padding: "10px 20px",
        borderTop: "1px solid oklch(0.22 0.005 240)",
        fontSize: 11,
        color: "oklch(0.45 0.01 240)",
        textAlign: "center",
      }}
    >
      {data.total_participants} participant{data.total_participants !== 1 ? "s" : ""} · All
      pseudonyms are anonymous
    </div>
  )}
</div>
);
}