/**
 * ErrorBoundary — catches render-phase crashes anywhere in its subtree.
 * Phase 32: default glassmorphic recovery pane with 3 buttons.
 * Strict-mode safe (class component, no hooks in boundary itself).
 */

import { Component, useState, type ErrorInfo, type ReactNode } from 'react';
import { writeCrashReport } from '../../utils/crashReporter';

interface Props {
  fallback?: (props: { error: Error | null; reset: () => void }) => ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

const INITIAL: State = { hasError: false, error: null };

export default class ErrorBoundary extends Component<Props, State> {
  override state: State = INITIAL;

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    // Always log for dev. The user-facing recovery UI is in render().
    console.error('[ErrorBoundary]', error, info.componentStack);
    this.props.onError?.(error, info);
    try {
      writeCrashReport(error, info);
    } catch {
      // crash reporting must never throw
    }
  }

  reset = (): void => {
    this.setState(INITIAL);
  };

  override render(): ReactNode {
    if (!this.state.hasError) return this.props.children;
    const { fallback } = this.props;
    if (fallback) return fallback({ error: this.state.error, reset: this.reset });
    return <DefaultFallback onReset={this.reset} />;
  }
}

function DefaultFallback({ onReset }: { onReset: () => void }) {
  const [copied, setCopied] = useState(false);

  function copyCrashInfo(): void {
    try {
      const payload = JSON.stringify(
        {
          url: window.location.href,
          ua: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
          ts: new Date().toISOString(),
        },
        null,
        2,
      );
      navigator.clipboard.writeText(payload).then(
        () => {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1500);
        },
        () => {
          // best-effort
        },
      );
    } catch {
      // ignore
    }
  }

  return (
    <div className="error-boundary-fallback" role="alert" data-testid="error-boundary">
      <div className="error-boundary-card">
        <h2 className="error-boundary-title">Something went wrong here</h2>
        <p className="error-boundary-summary">
          The page crashed. Your other tabs and unsaved work are untouched.
        </p>
        <div className="error-boundary-actions">
          <button type="button" className="btn-primary" onClick={onReset}>
            Reload section
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => window.location.reload()}
          >
            Reload app
          </button>
          <button type="button" className="btn-ghost" onClick={copyCrashInfo}>
            {copied ? 'Copied' : 'Save crash log'}
          </button>
        </div>
      </div>
    </div>
  );
}
