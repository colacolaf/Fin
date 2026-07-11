import { useEffect, useState } from "react";
import BenchmarkComparison from "../components/BenchmarkComparison";
import Leaderboard from "../components/Leaderboard";
import { communityApi, type CommunityBenchmarks } from "../api/community";

/**
 * CommunityDashboard — Full-page community features:
 * - Benchmark comparison (percentile vs peers)
 * - Leaderboard (anonymized rankings)
 * - Section for recent community activity
 */
export default function CommunityDashboard() {
  const [activeTab, setActiveTab] = useState<"benchmarks" | "leaderboard">("benchmarks");

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 16px" }}>
      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: "oklch(0.9 0.01 240)",
            margin: "0 0 4px 0",
          }}
        >
          Community
        </h1>
        <p style={{ fontSize: 13, color: "oklch(0.55 0.01 240)", margin: 0 }}>
          See how you compare to peers with fully anonymized data.
        </p>
      </div>

      {/* Tab bar */}
      <div
        style={{
          display: "flex",
          gap: 4,
          marginBottom: 20,
          background: "oklch(0.18 0.005 240)",
          borderRadius: 8,
          padding: 4,
          border: "1px solid oklch(0.25 0.005 240)",
        }}
      >
        <button
          onClick={() => setActiveTab("benchmarks")}
          style={{
            flex: 1,
            padding: "10px 16px",
            borderRadius: 6,
            border: "none",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 600,
            transition: "all 150ms ease",
            background:
              activeTab === "benchmarks"
                ? "oklch(0.65 0.18 160 / 0.15)"
                : "transparent",
            color:
              activeTab === "benchmarks"
                ? "oklch(0.65 0.18 160)"
                : "oklch(0.55 0.01 240)",
          }}
        >
          📊 Benchmarks
        </button>
        <button
          onClick={() => setActiveTab("leaderboard")}
          style={{
            flex: 1,
            padding: "10px 16px",
            borderRadius: 6,
            border: "none",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 600,
            transition: "all 150ms ease",
            background:
              activeTab === "leaderboard"
                ? "oklch(0.65 0.18 160 / 0.15)"
                : "transparent",
            color:
              activeTab === "leaderboard"
                ? "oklch(0.65 0.18 160)"
                : "oklch(0.55 0.01 240)",
          }}
        >
          🏆 Leaderboard
        </button>
      </div>

      {/* Content */}
      {activeTab === "benchmarks" ? <BenchmarkComparison /> : <Leaderboard />}

      {/* Footer privacy note */}
      <div
        style={{
          marginTop: 20,
          padding: "12px 16px",
          borderRadius: 8,
          border: "1px solid oklch(0.22 0.005 240)",
          fontSize: 11,
          color: "oklch(0.45 0.01 240)",
          textAlign: "center",
          lineHeight: 1.5,
        }}
      >
        All community data is anonymized with k-anonymity ≥ 10 users per group.
        Your individual portfolio values, identity, and personal data are never shared.
        See our{" "}
        <a href="#" style={{ color: "oklch(0.6 0.15 240)", textDecoration: "underline" }}>
          Privacy Policy
        </a>{" "}
        for details.
      </div>
    </div>
  );
}