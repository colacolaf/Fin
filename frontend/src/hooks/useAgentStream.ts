/** WebSocket hook for multi-agent streaming. Phase 13. */

import { useCallback, useEffect, useRef, useState } from "react";

interface AgentStreamEvent {
  type: "agent_start" | "agent_done" | "agent_error" | "cross_agent" | "done" | "error";
  agent?: string;
  result?: Record<string, unknown>;
  error?: string;
  data?: Record<string, unknown>;
  summary?: { total: number; succeeded: number; failed: number };
  message?: string;
}

interface AgentState {
  status: "idle" | "running" | "done" | "error";
  result?: Record<string, unknown>;
  error?: string;
}

interface UseAgentStreamReturn {
  connect: (userId: string, skill?: string) => void;
  disconnect: () => void;
  agents: Record<string, AgentState>;
  crossAgent: Record<string, unknown> | null;
  isStreaming: boolean;
  summary: { total: number; succeeded: number; failed: number } | null;
}

const WS_BASE = `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/api/orchestration/stream`;

export function useAgentStream(): UseAgentStreamReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const [agents, setAgents] = useState<Record<string, AgentState>>({
    investment: { status: "idle" },
    debt: { status: "idle" },
    retirement: { status: "idle" },
  });
  const [crossAgent, setCrossAgent] = useState<Record<string, unknown> | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [summary, setSummary] = useState<{ total: number; succeeded: number; failed: number } | null>(null);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const connect = useCallback(
    (userId: string, skill = "portfolio_review") => {
      disconnect();

      const ws = new WebSocket(WS_BASE);
      wsRef.current = ws;
      setIsStreaming(true);
      setAgents({
        investment: { status: "idle" },
        debt: { status: "idle" },
        retirement: { status: "idle" },
      });
      setCrossAgent(null);
      setSummary(null);

      ws.onopen = () => {
        ws.send(JSON.stringify({ user_id: userId, skill }));
      };

      ws.onmessage = (event) => {
        const msg: AgentStreamEvent = JSON.parse(event.data);

        switch (msg.type) {
          case "agent_start":
            setAgents((prev) => ({
              ...prev,
              [msg.agent!]: { status: "running" },
            }));
            break;
          case "agent_done":
            setAgents((prev) => ({
              ...prev,
              [msg.agent!]: { status: "done", result: msg.result },
            }));
            break;
          case "agent_error":
            setAgents((prev) => ({
              ...prev,
              [msg.agent!]: { status: "error", error: msg.error },
            }));
            break;
          case "cross_agent":
            setCrossAgent(msg.data ?? null);
            break;
          case "done":
            setSummary(msg.summary ?? null);
            setIsStreaming(false);
            break;
          case "error":
            setIsStreaming(false);
            break;
        }
      };

      ws.onerror = () => {
        setIsStreaming(false);
      };

      ws.onclose = () => {
        setIsStreaming(false);
      };
    },
    [disconnect]
  );

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return { connect, disconnect, agents, crossAgent, isStreaming, summary };
}