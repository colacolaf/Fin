/** Phase 13: Multi-Agent Orchestration page — live streaming agent dashboard. */
import { useCallback, useState } from "react";
import { useAgentStream } from "../hooks/useAgentStream";
import AgentSelector from "../components/orchestration/AgentSelector";
import AgentStatusBar from "../components/orchestration/AgentStatusBar";
import AgentStream from "../components/orchestration/AgentStream";
import CrossTalk from "../components/orchestration/CrossTalk";
import "../styles/orchestration.css";

type AgentKey = "investment" | "debt" | "retirement";

const SKILLS = [
  { key: "portfolio_review", label: "Portfolio Review" },
  { key: "financial_health", label: "Financial Health" },
  { key: "debt_analysis", label: "Debt Analysis" },
  { key: "retirement_readiness", label: "Retirement Readiness" },
] as const;

export default function MultiAgent() {
  const [selectedAgents, setSelectedAgents] = useState<AgentKey[]>(["investment"]);
  const [skill, setSkill] = useState("portfolio_review");
  const [started, setStarted] = useState(false);
  const { connect, disconnect, agents, crossAgent, isStreaming, summary } = useAgentStream();

  const handleRun = useCallback(() => {
    if (selectedAgents.length === 0) return;
    setStarted(true);
    // TODO: get real user ID from auth context
    connect("demo-user", skill);
  }, [selectedAgents, skill, connect]);

  const handleStop = useCallback(() => {
    disconnect();
    setStarted(false);
  }, [disconnect]);

  // Derive reasoning text from agent results
  const selectedAgent = selectedAgents[0] || "investment";
  const agentResult = agents[selectedAgent]?.result;
  const reasoningText =
    typeof agentResult === "string"
      ? agentResult
      : agentResult
        ? JSON.stringify(agentResult, null, 2)
        : "Waiting for agent reasoning...";

  const conflicts = crossAgent
    ? (crossAgent as { conflicts?: Array<{ category: string; resolution: "pay_debt" | "split" | "invest"; recommendation: string }> }).conflicts || []
    : [];

  return (
    <div className="ocean-page" style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem 1rem" }}>
      <h1 className="ocean-heading">Multi-Agent Orchestration</h1>
      <p className="ocean-subtitle" style={{ marginBottom: "1.5rem" }}>
        Run multiple AI agents in parallel with live reasoning streams
      </p>

      {/* Skill selector */}
      <div style={{ marginBottom: "1rem" }}>
        <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.4rem", color: "var(--muted, #94a3b8)" }}>
          SKILL
        </label>
        <div className="agent-selector">
          {SKILLS.map((s) => (
            <button
              key={s.key}
              className={`agent-chip ${skill === s.key ? "active" : ""}`}
              onClick={() => setSkill(s.key)}
              disabled={isStreaming}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Agent selector */}
      <div style={{ marginBottom: "1rem" }}>
        <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.4rem", color: "var(--muted, #94a3b8)" }}>
          AGENTS
        </label>
        <AgentSelector selected={selectedAgents} onChange={(a) => setSelectedAgents(a as AgentKey[])} />
      </div>

      {/* Run / Stop */}
      <div style={{ marginBottom: "1.5rem", display: "flex", gap: "0.75rem" }}>
        {!isStreaming ? (
          <button
            className="ocean-btn ocean-btn-primary"
            onClick={handleRun}
            disabled={selectedAgents.length === 0}
          >
            ▶ Run All Agents
          </button>
        ) : (
          <button className="ocean-btn ocean-btn-danger" onClick={handleStop}>
            ■ Stop
          </button>
        )}
      </div>

      {/* Summary banner */}
      {summary && (
        <div
          style={{
            padding: "0.75rem 1rem",
            borderRadius: "0.5rem",
            background: "var(--accent-muted, rgba(99,102,241,0.1))",
            border: "1px solid var(--accent, #6366f1)",
            marginBottom: "1rem",
            fontSize: "0.85rem",
          }}
        >
          {summary.succeeded}/{summary.total} agents succeeded
          {summary.failed > 0 && <span style={{ color: "var(--danger, #ef4444)" }}> — {summary.failed} failed</span>}
        </div>
      )}

      {/* Agent Status Bar */}
      {started && <AgentStatusBar agents={agents} />}

      {/* Reasoning Stream */}
      {started && (
        <div style={{ marginTop: "1rem" }}>
          <AgentStream agent={selectedAgent} text={reasoningText} isStreaming={isStreaming} />
        </div>
      )}

      {/* Cross-Agent Insights */}
      {conflicts.length > 0 && (
        <div style={{ marginTop: "1rem" }}>
          <CrossTalk conflicts={conflicts} />
        </div>
      )}
    </div>
  );
}