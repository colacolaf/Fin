/**
 * KeyboardShortcutsOverlay — `?`-triggered searchable shortcut panel.
 * Phase 35 — mirrors CommandPalette glassmorphic shape but smaller + 2-column.
 *
 * Sections: Navigation / Global / Memory / Execution / Backtest / Settings / Help.
 * fuse.js (already in deps) fuzzy-searches label/hint/keywords.
 * useFocusTrap cycle + Escape closes + restore-focus contract.
 *
 * Single action handler: `onInvoke(id)` — host wires the id -> handler map.
 * This keeps the catalog free of side effects (Ponytail: side-effects only at the
 * boundary, not in declarative config).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import Fuse from 'fuse.js';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import {
  SHORTCUT_CATALOG,
  type ShortcutEntry,
  type ShortcutSection,
} from '../../utils/shortcutCatalog';

interface Props {
  open: boolean;
  onClose: () => void;
  /**
   * Host-side runtime dispatch: id -> handler lookup.
   * Optional — clicking a row closes the overlay; power users can press the
   * shortcut key combo directly. YAGNI: no Need for an inline ACTION_MAP yet.
   */
  onInvoke?: (id: string) => void;
}

const SECTION_ORDER: ShortcutSection[] = [
  'Navigation',
  'Global',
  'Memory',
  'Execution',
  'Backtest',
  'Settings',
  'Help',
];

const FUSE_OPTS: ConstructorParameters<typeof Fuse>[1] = {
  includeScore: false,
  threshold: 0.3,
  ignoreLocation: true,
  keys: [
    { name: 'label', weight: 0.7 },
    { name: 'hint', weight: 0.15 },
    { name: 'keywords', weight: 0.15 },
  ],
};

export default function KeyboardShortcutsOverlay({ open, onClose, onInvoke }: Props) {
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const fuse = useMemo(() => new Fuse(SHORTCUT_CATALOG, FUSE_OPTS), []);

  const visibleIds = useMemo<ShortcutEntry[]>(() => {
    if (!query.trim()) return SHORTCUT_CATALOG.slice();
    return fuse.search(query, { limit: 50 }).map((r) => r.item);
  }, [query, fuse]);

  useFocusTrap(overlayRef, {
    active: open,
    initialFocus: inputRef.current ?? undefined,
    onEscape: onClose,
    restoreFocus: true,
  });

  useEffect(() => {
    if (!open) setQuery('');
    setHighlight(0);
  }, [open]);

  useEffect(() => {
    if (highlight >= visibleIds.length) setHighlight(Math.max(0, visibleIds.length - 1));
  }, [highlight, visibleIds.length]);

  // Group visible entries by section.
  const grouped = useMemo<Array<{ section: ShortcutSection; items: ShortcutEntry[] }>>(() => {
    const buckets = new Map<ShortcutSection, ShortcutEntry[]>();
    for (const e of visibleIds) {
      if (!buckets.has(e.section)) buckets.set(e.section, []);
      buckets.get(e.section)!.push(e);
    }
    return SECTION_ORDER
      .filter((s) => buckets.has(s))
      .map((s) => ({ section: s, items: buckets.get(s)! }));
  }, [visibleIds]);

  function commitEntry(id: string): void {
    onClose();
    if (onInvoke) onInvoke(id);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>): void {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => Math.min(visibleIds.length - 1, h + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(0, h - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const r = visibleIds[highlight];
      if (r) commitEntry(r.id);
    }
  }

  if (!open) return null;

  // Compute the flat index of the highlighted entry across groups for active styling.
  let flatCursor = 0;
  let highlightGroupIdx = -1;
  let highlightItemIdx = -1;
  for (let g = 0; g < grouped.length; g++) {
    const items = grouped[g].items;
    if (highlight < flatCursor + items.length) {
      highlightGroupIdx = g;
      highlightItemIdx = highlight - flatCursor;
      break;
    }
    flatCursor += items.length;
  }

  return (
    <div
      ref={overlayRef}
      className="kbd-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
      data-testid="kbd-overlay-root"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="kbd-shortcuts">
        <input
          ref={inputRef}
          className="kbd-shortcuts-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Search shortcuts…"
          aria-label="Search shortcuts"
          autoComplete="off"
          spellCheck={false}
          data-testid="kbd-search-input"
        />
        <div className="kbd-shortcuts-rail" role="presentation" aria-hidden="true">
          {SECTION_ORDER.filter((s) => grouped.some((g) => g.section === s)).map((s) => (
            <button
              key={s}
              type="button"
              className={grouped[highlightGroupIdx]?.section === s ? 'active' : ''}
              tabIndex={-1}
              onClick={() => {
                const idx = grouped.findIndex((g) => g.section === s);
                if (idx >= 0) setHighlight(grouped.slice(0, idx).reduce((sum, g) => sum + g.items.length, 0));
              }}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="kbd-shortcuts-body" data-testid="kbd-body">
          {visibleIds.length === 0 ? (
            <div className="kbd-shortcuts-empty">No shortcuts match &ldquo;{query}&rdquo;.</div>
          ) : (
            grouped.map((g, gi) => (
              <section key={g.section} aria-label={g.section}>
                <div className="kbd-shortcuts-section">{g.section}</div>
                {g.items.map((entry, ii) => {
                  const isActive = gi === highlightGroupIdx && ii === highlightItemIdx;
                  const flat = flatCursor++; // increment flat cursor
                  return (
                    <button
                      key={entry.id}
                      type="button"
                      role="button"
                      className="kbd-row copalette-result"
                      data-palette-active={isActive || undefined}
                      data-testid={`kbd-row-${entry.id}`}
                      onMouseEnter={() => setHighlight(flat)}
                      onClick={() => commitEntry(entry.id)}
                    >
                      <span className="kbd-row-label">
                        <strong>{entry.label}</strong>
                        {entry.hint && (
                          <span style={{ color: 'var(--text-muted)', fontSize: 11, marginLeft: 8 }}>
                            {entry.hint}
                          </span>
                        )}
                      </span>
                      <span className="kbd-row-keys">
                        {entry.combo.split(' ').map((k, i) => (
                          <kbd key={i} className="kbd">
                            {k}
                          </kbd>
                        ))}
                      </span>
                    </button>
                  );
                })}
                {/* flatCursor now equals total entries processed up to and including this group */}
                {gi === highlightGroupIdx && highlightItemIdx >= 0 && null}
              </section>
            ))
          )}
        </div>
        <div className="kbd-shortcuts-footer">
          <span>
            <kbd>?</kbd> open at any time · <kbd>esc</kbd> close
          </span>
          <span>
            <kbd>↑</kbd> <kbd>↓</kbd> navigate · <kbd>↵</kbd> invoke
          </span>
        </div>
      </div>
    </div>
  );
}
