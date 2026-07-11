/**
 * OfflinePage — shown when the user navigates while fully disconnected.
 * Matches offline.html style but as a React component.
 */

export default function OfflinePage() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "2rem",
        textAlign: "center",
      }}
    >
      <div style={{ maxWidth: 360 }}>
        <svg
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#f59e0b"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ margin: "0 auto 1.5rem", display: "block" }}
        >
          <path d="M1 1l22 22" />
          <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
          <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
          <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
          <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
          <path d="M12 20h.01" />
        </svg>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>
          You're offline
        </h1>
        <p style={{ color: "#94a3b8", fontSize: "0.95rem", lineHeight: 1.5, marginBottom: "1.5rem" }}>
          Fin can still show cached portfolios, recommendations, and debt plans.
          Changes you make will sync automatically when you reconnect.
        </p>
        <p style={{ fontSize: "0.8rem", color: "#64748b" }}>
          Reconnect to the internet or check your signal.
        </p>
      </div>
    </div>
  );
}