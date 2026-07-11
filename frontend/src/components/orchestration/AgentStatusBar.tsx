/** Phase 13: Agent status bar — live dot indicators for each agent. */
import "../../styles/orchestration.css";

type Status = "idle" | "running" | "done" | "error";

interface AgentInfo {
  status: Status;
  error?: string;
}

interface Props {
  agents: Record<string, AgentInfo>;
}

const LABELS: Record<string, string> = {
  investment: "Investment",
  debt: "Debt",
  retirement: "Retirement",
};

export default function AgentStatusBar({ agents }: Props) {
  return (
    <div className="agent-status-bar">
      {Object.entries(agents).map(([key, info]) => (
        <div key={key} className="agent-status-item" title={info.error}>
          <span className={`agent-status-dot ${info.status}`} />
          <span className="agent-status-label">{LABELS[key] || key}</span>
        </div>
      ))}
    </div>
  );
}