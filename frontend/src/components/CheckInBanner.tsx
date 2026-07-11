import { useState, useEffect } from "react";
import { executionApi } from "../api/execution";
import type { ExecutionAction } from "../api/execution";

/**
 * Periodic banner shown at top of dashboard for pending check-ins.
 * Shows overdue accepted actions and lets user respond: Done / Skip / Remind Later.
 * Slides in with a subtle transform animation, respects prefers-reduced-motion.
 */
export default function CheckInBanner() {
  const [overdue, setOverdue] = useState<ExecutionAction[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    executionApi
      .pending()
      .then((actions) => {
        if (cancelled) return;
        const now = new Date();
        const overdueActions = actions.filter((a) => {
          if (!a.next_check_in) return false;
          return new Date(a.next_check_in) <= now;
        });
        // Only show non-dismissed
        const active = overdueActions.filter(
          (a) => !dismissed.has(a.action_id)
        );
        setOverdue(active);
        if (active.length > 0) setVisible(true);
      })
      .catch(() => {
        // Silently fail — banner is non-critical
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleExecute = async (actionId: string) => {
    setLoading(actionId);
    try {
      await executionApi.execute(actionId);
      setOverdue((prev) => prev.filter((a) => a.action_id !== actionId));
      if (overdue.length <= 1) setVisible(false);
    } catch {
      // keep visible on failure
    } finally {
      setLoading(null);
    }
  };

  const handleSkip = (actionId: string) => {
    setDismissed((prev) => new Set(prev).add(actionId));
    setOverdue((prev) => prev.filter((a) => a.action_id !== actionId));
    if (overdue.length <= 1) setVisible(false);
  };

  const handleDismiss = () => setVisible(false);

  if (!visible || overdue.length === 0) return null;

  return (
    <div className="check-in-banner" style={bannerStyle}>
      <style>{`
        @keyframes checkInSlideDown {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .check-in-banner {
          animation: checkInSlideDown 400ms cubic-bezier(0.25, 1, 0.5, 1);
        }
        @media (prefers-reduced-motion: reduce) {
          .check-in-banner {
            animation: none;
          }
        }
      `}</style>
      <div style={bannerInner}>
        <div style={bannerIcon}>🔔</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
            {overdue.length === 1
              ? "Got a minute? 1 action needs your attention."
              : `Got a minute? ${overdue.length} actions need your attention.`}
          </div>
          {overdue.map((action) => (
            <div
              key={action.action_id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginTop: 8,
                fontSize: 13,
              }}
            >
              <span
                style={{
                  flex: 1,
                  color: "oklch(0.75 0.01 240)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={action.recommendation_id}
              >
                {action.recommendation_id}
                {action.check_in_count > 0 && (
                  <span style={{ color: "oklch(0.5 0.01 240)", marginLeft: 4 }}>
                    · {action.check_in_count} nudge{action.check_in_count > 1 ? "s" : ""}
                  </span>
                )}
              </span>
              <button
                onClick={() => handleExecute(action.action_id)}
                disabled={loading === action.action_id}
                style={bannerBtn("done")}
              >
                {loading === action.action_id ? "…" : "Done"}
              </button>
              <button
                onClick={() => handleSkip(action.action_id)}
                disabled={loading === action.action_id}
                style={bannerBtn("skip")}
              >
                Skip
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={handleDismiss}
          style={closeBtn}
          aria-label="Dismiss check-in banner"
        >
          ×
        </button>
      </div>
    </div>
  );
}

const bannerStyle: React.CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 50,
  background: "oklch(0.18 0.04 255)",
  borderBottom: "1px solid oklch(0.28 0.04 255)",
  padding: "12px 20px",
};

const bannerInner: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 12,
  maxWidth: 800,
  margin: "0 auto",
};

const bannerIcon: React.CSSProperties = {
  fontSize: 20,
  flexShrink: 0,
  marginTop: 2,
};

const bannerBtn = (variant: "done" | "skip"): React.CSSProperties => ({
  padding: "4px 12px",
  borderRadius: 6,
  border: "none",
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 600,
  background:
    variant === "done"
      ? "oklch(0.27 0.06 160)"
      : "oklch(0.22 0.01 240)",
  color:
    variant === "done"
      ? "oklch(0.85 0.06 160)"
      : "oklch(0.65 0.01 240)",
  whiteSpace: "nowrap",
});

const closeBtn: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "oklch(0.5 0.01 240)",
  fontSize: 20,
  cursor: "pointer",
  padding: "0 4px",
  lineHeight: 1,
};