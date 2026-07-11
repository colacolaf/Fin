import { useEffect, useState } from "react";
import { communityApi, type CommunityBenchmarks } from "../api/community";

/**
 * BenchmarkComparison — Shows user metrics vs community percentiles.
 * k-anonymity threshold enforced server-side (10 user minimum).
 * Displays "insufficient data" message when k-anonymity not met.
 */
export default function BenchmarkComparison() {
  const [data, setData] = useState<CommunityBenchmarks | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    communityApi
      .benchmarks()
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
  }, []);

  if (loading) {
    return (
      <div
        style={{
          background: "oklch(0.18 0.005 240)",
          borderRadius: 12,
          border: "1px solid oklch(0.25 0.005 240)",
          padding: 24,
          textAlign: "center",
          color: "oklch(0.5 0.01 240)",
          fontSize: 13,
        }}
      >
        Loading benchmarks…
      </div>
    );
  }

  if (!data || !data.k_anonymity_met) {
    return (
      <div
        style={{
          background: "oklch(0.18 0.005 240)",
          borderRadius: 12,
          border: "1px solid oklch(0.25 0.005 240)",
          padding: 24,
          textAlign: "center",
        }}
      >
        <span style={{ fontSize: 20, display: "block", marginBottom: 8 }}>🔒</span>
        <div style={{ fontSize: 14, fontWeight: 600, color: "oklch(0.75 0.01 240)", marginBottom: 4 }}>
          Insufficient Data
        </div>
        <div style={{ fontSize: 12, color: "oklch(0.5 0.01 240)" }}>
          {data?.message ?? "More participants needed for anonymous benchmarking. Check back soon!"}
        </div>
      </div>
    );
  }

  const metrics = Object.keys(data.benchmarks);

  return (
    <div
      style={{
        background: "oklch(0.18 0.005 240)",
        borderRadius: 12,
        border: "1px solid oklch(0.25 0.005 240)",
        padding: "20px 20px 16px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 600, color: "oklch(0.75 0.01 240)" }}>
          How You Compare
        </span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: "oklch(0.5 0.01 240)",
            background: "oklch(0.22 0.005 240)",
            padding: "2px 10px",
            borderRadius: 100,
          }}
        >
          {data.sample_size} peers
        </span>
      </div>

      {metrics.map((metric) => {
        const bm = data.benchmarks[metric];
        const userPct = data.user_percentiles[metric];
        const userVal = data.user_metrics[metric];

        return (
          <div key={metric} style={{ marginBottom: 16 }}>
            {/* Metric label */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 6,
                fontSize: 12,
              }}
            >
              <span style={{ fontWeight: 600, color: "oklch(0.7 0.01 240)", textTransform: "capitalize" }}>
                {metric.replace(/_/g, " ")}
              </span>
              <span style={{ color: "oklch(0.55 0.01 240)" }}>
                You:{" "}
                <span style={{ fontWeight: 600, color: "oklch(0.8 0.01 240)" }}>
                  {formatMetric(metric, userVal)}
                </span>{" "}
                · Top {formatPercentile(userPct)}%
              </span>
            </div>

            {/* Distribution bar */}
            <div
              style={{
                position: "relative",
                height: 8,
                borderRadius: 4,
                background: "oklch(0.22 0.005 240)",
                overflow: "visible",
              }}
            >
              {/* P25–P50 segment */}
              <div
                style={{
                  position: "absolute",
                  left: `${Math.max(0, Math.min(100, bm.p25 ?? 0))}%`,
                  width: `${Math.max(1, Math.min(100, (bm.p50 ?? 0) - (bm.p25 ?? 0)))}%`,
                  top: 0,
                  bottom: 0,
                  background: "oklch(0.65 0.18 160 / 0.35)",
                }}
              />
              {/* P50–P75 segment */}
              <div
                style={{
                  position: "absolute",
                  left: `${Math.max(0, Math.min(100, bm.p50 ?? 0))}%`,
                  width: `${Math.max(1, Math.min(100, (bm.p75 ?? 0) - (bm.p50 ?? 0)))}%`,
                  top: 0,
                  bottom: 0,
                  background: "oklch(0.65 0.18 160 / 0.55)",
                }}
              />
              {/* P75–P90 segment */}
              <div
                style={{
                  position: "absolute",
                  left: `${Math.max(0, Math.min(100, bm.p75 ?? 0))}%`,
                  width: `${Math.max(1, Math.min(100, (bm.p90 ?? 0) - (bm.p75 ?? 0)))}%`,
                  top: 0,
                  bottom: 0,
                  background: "oklch(0.65 0.18 160 / 0.75)",
                }}
              />

              {/* User marker */}
              <div
                style={{
                  position: "absolute",
                  left: `${Math.max(0, Math.min(98, userPct))}%`,
                  top: -3,
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: "oklch(1 0 0)",
                  border: "2px solid oklch(0.15 0.005 240)",
                  boxShadow: "0 0 6px oklch(0.65 0.18 160 / 0.5)",
                  transition: "left 600ms cubic-bezier(0.25, 1, 0.5, 1)",
                  zIndex: 1,
                }}
              />
            </div>

            {/* Labels */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 4,
                fontSize: 10,
                color: "oklch(0.45 0.01 240)",
              }}
            >
              <span>P25</span>
              <span>P50</span>
              <span>P75</span>
              <span>P90</span>
            </div>
          </div>
        );
      })}

      {/* Privacy note */}
      <div
        style={{
          marginTop: 8,
          padding: "8px 12px",
          borderRadius: 8,
          background: "oklch(0.22 0.005 240)",
          fontSize: 10,
          color: "oklch(0.45 0.01 240)",
          textAlign: "center",
        }}
      >
        🔒 Anonymized · k-anonymity ≥ 10 users per group
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────

function formatMetric(metric: string, value: number): string {
  if (metric.includes("rate") || metric.includes("pct")) {
    return `${value.toFixed(1)}%`;
  }
  if (metric.includes("value") || metric.includes("net_worth") || metric.includes("savings")) {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  }
  if (metric.includes("debt") || metric.includes("ratio")) {
    return value.toFixed(2);
  }
  return String(value);
}

function formatPercentile(pct: number): string {
  if (pct >= 90) return `${pct.toFixed(0)}`;
  if (pct >= 10) return `${pct.toFixed(1)}`;
  return `${pct.toFixed(1)}`;
}