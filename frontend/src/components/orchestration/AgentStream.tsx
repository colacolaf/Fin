/** Phase 13: Agent reasoning stream with typewriter animation. */
import { useEffect, useState } from "react";
import "../../styles/orchestration.css";

interface Props {
  agent: string;
  text: string;
  isStreaming: boolean;
}

export default function AgentStream({ agent, text, isStreaming }: Props) {
  const [displayed, setDisplayed] = useState("");
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (!text) { setDisplayed(""); setIdx(0); return; }
    if (!isStreaming) { setDisplayed(text); return; }
    if (idx < text.length) {
      const chunk = Math.min(1 + Math.floor(Math.random() * 3), text.length - idx);
      const timer = setTimeout(() => {
        setDisplayed((prev) => prev + text.slice(idx, idx + chunk));
        setIdx((i) => i + chunk);
      }, 25 + Math.random() * 15);
      return () => clearTimeout(timer);
    }
  }, [text, isStreaming, idx]);

  return (
    <div className="reasoning-stream">
      <div className="reasoning-stream__header">
        <span className="reasoning-stream__agent-icon">{agent.charAt(0).toUpperCase()}</span>
        {agent} Agent Reasoning
      </div>
      <div className={`reasoning-stream__text ${isStreaming ? "streaming" : ""}`}>
        {displayed}
        {isStreaming && <span className="reasoning-stream__cursor" />}
      </div>
    </div>
  );
}