/** Phase 13: Agent selector chip bar. */
import "../../styles/orchestration.css";

const AGENTS = [
  { key: "investment", label: "Investment" },
  { key: "debt", label: "Debt" },
  { key: "retirement", label: "Retirement" },
] as const;

type AgentKey = (typeof AGENTS)[number]["key"];

interface Props {
  selected: AgentKey[];
  onChange: (agents: AgentKey[]) => void;
}

export default function AgentSelector({ selected, onChange }: Props) {
  const toggle = (key: AgentKey) => {
    if (selected.includes(key)) {
      onChange(selected.filter((k) => k !== key));
    } else {
      onChange([...selected, key]);
    }
  };

  return (
    <div className="agent-selector">
      {AGENTS.map((a) => (
        <button
          key={a.key}
          className={`agent-chip ${selected.includes(a.key) ? "active" : ""}`}
          onClick={() => toggle(a.key)}
        >
          {a.label}
        </button>
      ))}
    </div>
  );
}