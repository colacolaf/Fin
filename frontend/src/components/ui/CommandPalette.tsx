/**
 * CommandPalette — global ⌘K / Ctrl+K palette.
 * Fuse.js fuzzy search across Navigate/Actions/Settings groups.
 * Reuses the same glassmorphic shape as Phase 20's Memory palette.
 * Phase 34 polish: focus-traps itself while open via useFocusTrap.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import Fuse from 'fuse.js';
import { useFocusTrap } from '../../hooks/useFocusTrap';

export interface PaletteItem {
  id: string;
  label: string;
  hint?: string;
  group: 'Navigate' | 'Actions' | 'Settings';
  keywords?: string[];
  run: () => void;
}

interface Props {
  open: boolean;
  onClose: () => void;
  items: PaletteItem[]; // injected by host so it can wire `navigate` + sync handlers.
}

const FUSE_OPTS: ConstructorParameters<typeof Fuse>[1] = {
  includeScore: false,
  threshold: 0.4,
  ignoreLocation: true,
  keys: [
    { name: 'label', weight: 0.7 },
    { name: 'hint', weight: 0.15 },
    { name: 'keywords', weight: 0.15 },
  ],
};

export default function CommandPalette({ open, onClose, items }: Props) {
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const fuse = useMemo(() => new Fuse(items, FUSE_OPTS), [items]);

  const results = useMemo<PaletteItem[]>(() => {
    if (!query.trim()) return items.slice(0, 30);
    return fuse.search(query, { limit: 30 }).map((r) => r.item);
  }, [query, items, fuse]);

  // Phase 34: focus-trap (Tab/Shift+Tab cycle, restore focus on close).
  // Initial focus on the search input. Escape via onEscape closes; onClose
  // is the host's setter that calls our parent's setPaletteOpen(false).
  useFocusTrap(overlayRef, {
    active: open,
    initialFocus: inputRef.current ?? undefined,
    onEscape: onClose,
    restoreFocus: true,
  });

  useEffect(() => {
    if (highlight >= results.length) setHighlight(Math.max(0, results.length - 1));
  }, [highlight, results.length]);

  // Scroll highlight into view
  useEffect(() => {
    if (!overlayRef.current) return;
    const el = overlayRef.current.querySelector('[data-palette-active="true"]');
    if (el && 'scrollIntoView' in el) {
      (el as HTMLElement).scrollIntoView({ block: 'nearest' });
    }
  }, [highlight]);

  function commit(item: PaletteItem): void {
    onClose();
    item.run();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>): void {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => Math.min(results.length - 1, h + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(0, h - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const r = results[highlight];
      if (r) commit(r);
    }
    // Escape close is handled by useFocusTrap.onEscape.
  }

  if (!open) return null;

  // Group results by section label while preserving order.
  const grouped: { group: PaletteItem['group']; items: PaletteItem[] }[] = [];
  for (const r of results) {
    const last = grouped[grouped.length - 1];
    if (last && last.group === r.group) {
      last.items.push(r);
    } else {
      grouped.push({ group: r.group, items: [r] });
    }
  }

  return (
    <div
      ref={overlayRef}
      className="copalette-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Search Fin"
      data-testid="copalette-root"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="copalette">
        <input
          ref={inputRef}
          className="copalette-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Search Fin \u2014 try \u2018sync\u2019 or \u2018memory\u2019\u2026"
          aria-label="Search Fin"
          aria-autocomplete="list"
          aria-controls="copalette-results"
          aria-activedescendant={
            results[highlight] ? `copalette-opt-${results[highlight].id}` : undefined
          }
        />
        {results.length === 0 ? (
          <div className="copalette-empty">No matches for &ldquo;{query}&rdquo;.</div>
        ) : (
          <div
            id="copalette-results"
            className="copalette-results"
            role="listbox"
            aria-label="Fin search results"
          >
            {grouped.map((g) => (
              <div key={g.group} className="copalette-section" role="presentation">
                <div className="copalette-section-label" aria-hidden>
                  {g.group}
                </div>
                {g.items.map((r) => {
                  const flatIndex = results.indexOf(r);
                  const active = flatIndex === highlight;
                  return (
                    <button
                      key={r.id}
                      id={`copalette-opt-${r.id}`}
                      type="button"
                      role="option"
                      aria-selected={active}
                      className={
                        'copalette-result' + (active ? ' is-active' : '')
                      }
                      data-palette-active={active || undefined}
                      onMouseEnter={() => setHighlight(flatIndex)}
                      onClick={() => commit(r)}
                    >
                      <span className="copalette-result-label">{r.label}</span>
                      {r.hint && <span className="copalette-result-hint">{r.hint}</span>}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        )}
        <div className="copalette-footer">
          <span>
            <kbd>{'\u2191'}</kbd> <kbd>{'\u2193'}</kbd> navigate
          </span>
          <span>
            <kbd>{'\u21B5'}</kbd> open
          </span>
          <span>
            <kbd>esc</kbd> close
          </span>
        </div>
      </div>
    </div>
  );
}
