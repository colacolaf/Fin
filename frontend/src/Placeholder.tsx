/**
 * Placeholder — the only React component currently rendered by the app.
 *
 * The frontend body has been torn down deliberately. Backend, shared types,
 * API client, hooks, pages, components, and ocean.css were all deleted in
 * a single pass; we're left with this single splash so `npm run dev` boots
 * to a bootable, intentional-looking surface while the chat-agent rebuild
 * is staged.
 *
 * All styling is scoped via inline styles + a small `<style>` block so we
 * don't depend on the deleted `styles/ocean.css` token system.
 */
export default function Placeholder() {
  return (
    <main className="fin-placeholder">
      <style>{PLACEHOLDER_CSS}</style>

      <div className="fin-placeholder__shell">
        <span className="fin-placeholder__eyebrow">private · local · v0</span>

        <h1 className="fin-placeholder__title">
          <span className="fin-placeholder__brand">Fin</span>
        </h1>

        <p className="fin-placeholder__lead">
          The chat agents are being rebuilt from a clean slate.
        </p>
        <p className="fin-placeholder__sub">
          Investment · Debt · Retirement — coming in the next phase.
        </p>

        <ul className="fin-placeholder__slots" aria-label="Future agents">
          <li className="fin-placeholder__slot">
            <span className="fin-placeholder__slot-key">01</span>
            <span className="fin-placeholder__slot-name">Investment</span>
            <span className="fin-placeholder__slot-state">drafted</span>
          </li>
          <li className="fin-placeholder__slot">
            <span className="fin-placeholder__slot-key">02</span>
            <span className="fin-placeholder__slot-name">Debt</span>
            <span className="fin-placeholder__slot-state">drafted</span>
          </li>
          <li className="fin-placeholder__slot">
            <span className="fin-placeholder__slot-key">03</span>
            <span className="fin-placeholder__slot-name">Retirement</span>
            <span className="fin-placeholder__slot-state">drafted</span>
          </li>
        </ul>

        <p className="fin-placeholder__footer">
          Section: <code>/</code> &middot; status: <code>placeholder</code>
        </p>
      </div>
    </main>
  );
}

const PLACEHOLDER_CSS = `
:root {
  /* OKLCH-only, mirrors the deleted ocean.css tokens for visual continuity. */
  --ph-abyss: oklch(13% 0.02 220);
  --ph-deep: oklch(20% 0.03 210);
  --ph-shallow: oklch(35% 0.05 195);
  --ph-primary: oklch(78% 0.12 180);
  --ph-glow: oklch(82% 0.14 175);
  --ph-text: oklch(90% 0.005 200);
  --ph-muted: oklch(65% 0.01 200);
  --ph-border: oklch(40% 0.06 195 / 0.45);
}
.fin-placeholder {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  background:
    radial-gradient(circle at 30% 25%, oklch(28% 0.06 195 / 0.5), transparent 65%),
    radial-gradient(circle at 75% 80%, oklch(22% 0.05 170 / 0.45), transparent 60%),
    var(--ph-abyss);
  color: var(--ph-text);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
}
.fin-placeholder__shell {
  width: 100%;
  max-width: 520px;
  padding: 36px 32px 28px;
  background: oklch(20% 0.015 210 / 0.62);
  border: 1px solid var(--ph-border);
  border-radius: 16px;
  backdrop-filter: blur(20px) saturate(140%);
  -webkit-backdrop-filter: blur(20px) saturate(140%);
  box-shadow: 0 24px 64px oklch(2% 0 0 / 0.45);
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.fin-placeholder__eyebrow {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.18em;
  color: var(--ph-primary);
  text-transform: uppercase;
}
.fin-placeholder__title {
  margin: 0;
  font-size: 56px;
  font-weight: 700;
  letter-spacing: -0.04em;
  line-height: 1;
}
.fin-placeholder__brand {
  background: linear-gradient(140deg, var(--ph-glow), var(--ph-primary));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.fin-placeholder__lead {
  margin: 0;
  font-size: 15px;
  color: var(--ph-text);
  line-height: 1.55;
}
.fin-placeholder__sub {
  margin: 0;
  font-size: 13px;
  color: var(--ph-muted);
}
.fin-placeholder__slots {
  list-style: none;
  margin: 8px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.fin-placeholder__slot {
  display: grid;
  grid-template-columns: 32px 1fr auto;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: oklch(15% 0.015 210 / 0.55);
  border: 1px solid oklch(35% 0.03 195 / 0.4);
  border-radius: 12px;
  font-size: 13px;
}
.fin-placeholder__slot-key {
  color: var(--ph-primary);
  font-family: 'Geist Mono', 'SF Mono', Menlo, monospace;
  font-weight: 700;
  font-size: 11px;
  letter-spacing: 0.06em;
}
.fin-placeholder__slot-name {
  color: var(--ph-text);
  font-weight: 500;
}
.fin-placeholder__slot-state {
  color: var(--ph-muted);
  font-size: 11px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.fin-placeholder__footer {
  margin: 8px 0 0;
  padding-top: 16px;
  border-top: 1px solid oklch(35% 0.03 195 / 0.3);
  font-size: 11px;
  color: var(--ph-muted);
  font-family: 'Geist Mono', 'SF Mono', Menlo, monospace;
  letter-spacing: 0.02em;
}
.fin-placeholder__footer code {
  background: oklch(15% 0.015 210 / 0.7);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  color: var(--ph-primary);
}
@media (prefers-reduced-motion: reduce) {
  .fin-placeholder { background: var(--ph-abyss); }
}
@media (max-width: 480px) {
  .fin-placeholder__shell { padding: 28px 22px 22px; }
  .fin-placeholder__title { font-size: 44px; }
}
`;
