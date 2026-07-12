/**
 * shortcutCatalog — single source of truth for keyboard shortcuts.
 * Phase 35 primitive. The KeyboardShortcutsOverlay reads from this map;
 * App.tsx's ACTION_MAP (inline) maps id -> handler at runtime.
 *
 * One declaration only — drop duplicated shortcut strings between TopBar
 * menu labels and useGlobalHotkeys registry. No run lambdas (Ponytail: keep
 * catalog free of side effects; the host bindings are the runtime truth).
 */

export type ShortcutSection =
  | 'Navigation'
  | 'Global'
  | 'Memory'
  | 'Execution'
  | 'Backtest'
  | 'Settings'
  | 'Help';

export interface ShortcutEntry {
  /** Unique stable id — used as registry key + data-testid kbd-row-{id}. */
  id: string;
  /** Human-readable combo string — uses the existing chip rendering. */
  combo: string;
  /** 1-line label. */
  label: string;
  /** Section header label. */
  section: ShortcutSection;
  /** Optional hint line (route or behavior). */
  hint?: string;
  /** Optional keywords — surface via Fuse.js. */
  keywords?: string[];
  /** Default false — duplicates useGlobalHotkeys option. */
  allowInInputs?: boolean;
}

export const SHORTCUT_CATALOG: ShortcutEntry[] = [
  // ── Navigation (g + letter, 1.5s window) ────────────────────────────
  { id: 'nav-d', combo: 'g d', section: 'Navigation', label: 'Dashboard', hint: '/', keywords: ['home', 'overview'] },
  { id: 'nav-i', combo: 'g i', section: 'Navigation', label: 'Portfolio', hint: '/portfolio', keywords: ['holdings'] },
  { id: 'nav-o', combo: 'g o', section: 'Navigation', label: 'Debt', hint: '/debt', keywords: ['payoff'] },
  { id: 'nav-r', combo: 'g r', section: 'Navigation', label: 'Retirement', hint: '/retirement', keywords: ['401k', 'ira'] },
  { id: 'nav-m', combo: 'g m', section: 'Navigation', label: 'Memory', hint: '/memory', keywords: ['notes'] },
  { id: 'nav-u', combo: 'g u', section: 'Navigation', label: 'Multi-Agent', hint: '/orchestrate', keywords: ['orchestrate'] },
  { id: 'nav-a', combo: 'g a', section: 'Navigation', label: 'Recommendations', hint: '/recommendations', keywords: ['recs'] },
  { id: 'nav-e', combo: 'g e', section: 'Navigation', label: 'Execution', hint: '/execution', keywords: ['mark executed'] },
  { id: 'nav-c', combo: 'g c', section: 'Navigation', label: 'Community', hint: '/community' },
  { id: 'nav-b', combo: 'g b', section: 'Navigation', label: 'Backtest', hint: '/backtest', keywords: ['strategy'] },
  { id: 'nav-n', combo: 'g n', section: 'Navigation', label: 'Questions', hint: '/questions' },
  { id: 'nav-x', combo: 'g x', section: 'Navigation', label: 'Research', hint: '/research' },
  { id: 'nav-s', combo: 'g s', section: 'Navigation', label: 'Settings', hint: '/settings', keywords: ['account'] },

  // ── Global ──────────────────────────────────────────────────────────
  // NOTE: ⌘K / Ctrl+K are owned by Phase 34 (CommandPalette) — DO NOT register here.
  { id: 'global-shortcuts', combo: '?', section: 'Global', label: 'Open keyboard shortcuts', hint: 'this overlay' },
  { id: 'global-esc', combo: 'esc', section: 'Global', label: 'Close topmost overlay', hint: 'palette or modal' },

  // ── Memory ──────────────────────────────────────────────────────────
  { id: 'memory-palette', combo: '⌘K', section: 'Memory', label: 'Memory palette (on /memory)', hint: 'overrides global' },
  { id: 'memory-link', combo: '[[', section: 'Memory', label: 'Wikilink autocomplete', hint: 'in editor' },
  { id: 'memory-down', combo: 'j', section: 'Memory', label: 'Tree focus down', hint: 'memory sidebar', allowInInputs: true },
  { id: 'memory-up', combo: 'k', section: 'Memory', label: 'Tree focus up', hint: 'memory sidebar', allowInInputs: true },

  // ── Execution ───────────────────────────────────────────────────────
  { id: 'exec-mark', combo: 'e', section: 'Execution', label: 'Mark executed', hint: 'on /execution row' },
  { id: 'exec-skip', combo: 's', section: 'Execution', label: 'Skip', hint: 'on /execution row' },
  { id: 'exec-broker', combo: 'b', section: 'Execution', label: 'Open broker steps', hint: 'expand inline' },

  // ── Backtest ─────────────────────────────────────────────────────────
  { id: 'back-rerun', combo: 'r', section: 'Backtest', label: 'Re-run last config', hint: 'on /backtest' },
  { id: 'back-csv', combo: 'o', section: 'Backtest', label: 'Open active run trade CSV', hint: 'exports' },

  // ── Settings ─────────────────────────────────────────────────────────
  { id: 'set-theme', combo: 't', section: 'Settings', label: 'Jump to Theme row', hint: '/settings' },
  { id: 'set-motion', combo: 'm', section: 'Settings', label: 'Jump to Motion toggle', hint: '/settings' },

  // ── Help ────────────────────────────────────────────────────────────
  { id: 'help-question', combo: '?', section: 'Help', label: 'Show this panel', hint: 'always available' },
];

export function getShortcutById(id: string): ShortcutEntry | undefined {
  return SHORTCUT_CATALOG.find((s) => s.id === id);
}
