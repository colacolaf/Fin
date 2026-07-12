/**
 * Welcome — first-run welcome screen on `/` while agent state has never synced.
 * Phase 38a primitive. REPLACES OnboardingCards (Phase 22) on Dashboard while
 * `useAgentState().lastSync === null`. After first sync, OnboardingCards takes over.
 *
 * 3 vertical sections each with: eyebrow, copy, CTA. Below: 3 minimal keyboard
 * shortcut glyphs with `<kbd>` chips matching Settings page styling.
 */
import { useNavigate } from 'react-router-dom';

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <section className="welcome" data-testid="welcome-section" aria-label="Welcome to Fin">
      <header className="welcome-header">
        <span className="welcome-eyebrow">First run</span>
        <h1 className="welcome-title">Oceans are empty until you load data.</h1>
        <p className="welcome-sub">
          Three short steps to get your cockpit alive. Nothing leaves this device.
        </p>
      </header>

      <div className="welcome-steps">
        <article className="welcome-step" data-testid="welcome-step-setup">
          <span className="welcome-step-num" aria-hidden="true">01</span>
          <div className="welcome-step-body">
            <h2>Connect a brokerage or bank</h2>
            <p>Alpaca, Fidelity, or Plaid. Your credentials never leave your machine.</p>
          </div>
          <button
            type="button"
            className="welcome-step-cta"
            onClick={() => navigate('/setup')}
          >
            Run setup →
          </button>
        </article>

        <article className="welcome-step" data-testid="welcome-step-sync">
          <span className="welcome-step-num" aria-hidden="true">02</span>
          <div className="welcome-step-body">
            <h2>Run your first sync</h2>
            <p>Pulls holdings, debt, and contribution rates — feed for every agent.</p>
          </div>
          {/* Sync CTA stays disabled until a brokerage connector is wired in a
             future phase (yagni: no fake "syncing" affordance on first run). */}
          <button
            type="button"
            className="welcome-step-cta"
            disabled
            title="Connect a brokerage first"
          >
            Sync now
          </button>
        </article>

        <article className="welcome-step" data-testid="welcome-step-memory">
          <span className="welcome-step-num" aria-hidden="true">03</span>
          <div className="welcome-step-body">
            <h2>Open a daily note</h2>
            <p>Memory captures decisions, preferences, and patterns — searchable, owned by you.</p>
          </div>
          <button
            type="button"
            className="welcome-step-cta"
            onClick={() => navigate('/memory')}
          >
            Open memory
          </button>
        </article>
      </div>

      <div className="welcome-shortcuts" aria-label="Keyboard shortcuts">
        <div className="welcome-shortcut-card">
          <span className="welcome-shortcut-label">Command palette</span>
          <span className="welcome-shortcut-keys">
            <kbd>⌘K</kbd>
          </span>
        </div>
        <div className="welcome-shortcut-card">
          <span className="welcome-shortcut-label">Jump to…</span>
          <span className="welcome-shortcut-keys">
            <kbd>g</kbd> <kbd>d</kbd> · <kbd>m</kbd> · <kbd>s</kbd>
          </span>
        </div>
        <div className="welcome-shortcut-card">
          <span className="welcome-shortcut-label">Shortcuts overlay</span>
          <span className="welcome-shortcut-keys">
            <kbd>?</kbd>
          </span>
        </div>
      </div>
    </section>
  );
}
