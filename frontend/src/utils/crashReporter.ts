/**
 * crashReporter — privacy-first local-only crash log writer.
 * Phase 32 requirement: NO network call. localStorage only.
 * Capped at last 20 reports to keep storage bounded.
 */

export interface CrashReport {
  timestamp: string;
  message: string;
  stack?: string;
  componentStack?: string;
  url?: string;
  userAgent?: string;
  locale?: string;
}

const PREFIX = 'fin:crash-';
const RECENT_KEY = 'fin:crash-recent';
const MAX_REPORTS = 20;

function pruneOldReports(): void {
  try {
    const keys = Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .sort();
    while (keys.length > MAX_REPORTS) {
      const oldest = keys.shift();
      if (oldest) localStorage.removeItem(oldest);
    }
  } catch {
    // storage may be unavailable (private mode); ignore.
  }
}

export function writeCrashReport(
  error: Error,
  info: { componentStack?: string } = {},
): CrashReport {
  const report: CrashReport = {
    timestamp: new Date().toISOString(),
    message: error.message,
    stack: error.stack,
    componentStack: info.componentStack,
    url: typeof window !== 'undefined' ? window.location.href : undefined,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    locale: typeof navigator !== 'undefined' ? navigator.language : undefined,
  };
  try {
    const key = `${PREFIX}${Date.now()}`;
    localStorage.setItem(key, JSON.stringify(report));
    localStorage.setItem(RECENT_KEY, key);
    pruneOldReports();
  } catch {
    // crash reporting must never throw.
  }
  return report;
}

export function readRecentCrashReport(): CrashReport | null {
  try {
    const recent = localStorage.getItem(RECENT_KEY);
    if (!recent) return null;
    return JSON.parse(localStorage.getItem(recent) ?? 'null') as CrashReport;
  } catch {
    return null;
  }
}
