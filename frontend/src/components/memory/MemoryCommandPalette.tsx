import { useEffect, useMemo, useRef, useState } from 'react';
import Fuse from 'fuse.js';
import type { MemoryNote } from '../../api/memory';

interface Props {
  open: boolean;
  onClose: () => void;
  notes: MemoryNote[];
  onSelect: (permalink: string) => Promise<MemoryNote | null>;
  flushEditor?: () => Promise<void>;
}

interface PaletteResult {
  permalink: string;
  title: string;
  folder: string;
  tags: string[];
  snippet: string;
}

const FUSE_OPTIONS: ConstructorParameters<typeof Fuse>[1] = {
  includeScore: false,
  threshold: 0.4,
  ignoreLocation: true,
  keys: [
    { name: 'title', weight: 0.6 },
    { name: 'tags', weight: 0.25 },
    { name: 'folder', weight: 0.05 },
    { name: 'content', weight: 0.1 },
  ],
};

const VIRTUAL_THRESHOLD = 200;

export default function MemoryCommandPalette({ open, onClose, notes, onSelect, flushEditor }: Props) {
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);

  const fuse = useMemo(() => new Fuse(notes, FUSE_OPTIONS), [notes]);

  const results = useMemo<PaletteResult[]>(() => {
    if (!query.trim()) {
      return notes.slice(0, 30).map((n) => toResult(n));
    }
    return fuse.search(query, { limit: 200 }).map((r) => toResult(r.item));
  }, [query, notes, fuse]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('');
      setHighlight(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // Reset highlight when results change
  useEffect(() => {
    setHighlight(0);
  }, [results.length]);

  // Clamp highlight
  useEffect(() => {
    if (highlight >= results.length) setHighlight(Math.max(0, results.length - 1));
  }, [highlight, results.length]);

  // Scroll highlighted into view
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector('[data-palette-active="true"]');
    if (el && 'scrollIntoView' in el) {
      (el as HTMLElement).scrollIntoView({ block: 'nearest' });
    }
  }, [highlight]);

  async function commit(index: number) {
    const r = results[index];
    if (!r) return;
    onClose();
    if (flushEditor) {
      try { await flushEditor(); } catch { /* ignore */ }
    }
    await onSelect(r.permalink);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => Math.min(results.length - 1, h + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(0, h - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      void commit(highlight);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  }

  if (!open) return null;

  const isVirtualized = results.length > VIRTUAL_THRESHOLD;

  return (
    <div
      className="memory-palette-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Memory search"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      data-testid="memory-palette-overlay"
    >
      <div className="memory-palette" data-testid="memory-palette">
        <input
          ref={inputRef}
          className="memory-palette-input"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Search notes, tags, or pick a recent…"
          aria-label="Search memory"
          data-testid="memory-palette-input"
        />
        {results.length === 0 ? (
          <div className="memory-palette-empty">
            {query.trim() ? `No notes matching “${query}”` : 'No notes yet — your daily note will be created on first visit.'}
          </div>
        ) : isVirtualized ? (
          <VirtualResults
            ref={listRef}
            results={results}
            highlight={highlight}
            onHover={setHighlight}
            onSelect={(i) => void commit(i)}
          />
        ) : (
          <ul ref={listRef} className="memory-palette-results" role="listbox">
            {results.map((r, i) => (
              <li key={r.permalink}>
                <button
                  type="button"
                  className="memory-palette-result"
                  data-palette-active={i === highlight}
                  onMouseEnter={() => setHighlight(i)}
                  onClick={() => void commit(i)}
                  data-testid={`memory-palette-result-${r.permalink}`}
                >
                  <span className="memory-palette-result-title">{r.title}</span>
                  <span className="memory-palette-result-meta">
                    <span className="memory-palette-result-tag">{r.folder}</span>
                    {r.tags.slice(0, 4).map((t) => (
                      <span key={t} className="memory-palette-result-tag">#{t}</span>
                    ))}
                    {r.snippet && <span> · {r.snippet}</span>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="memory-palette-hint">
          <span><kbd>↑</kbd> <kbd>↓</kbd> navigate</span>
          <span><kbd>↵</kbd> open</span>
          <span><kbd>esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}

function toResult(n: MemoryNote): PaletteResult {
  const snippet = n.content
    ? n.content
        .split('\n')
        .find((l) => l.trim() && !l.trim().startsWith('#') && !l.trim().startsWith('---'))
        ?.slice(0, 80) ?? ''
    : '';
  return {
    permalink: n.permalink,
    title: n.title,
    folder: n.folder,
    tags: n.tags,
    snippet,
  };
}

interface VirtualProps {
  results: PaletteResult[];
  highlight: number;
  onHover: (i: number) => void;
  onSelect: (i: number) => void;
}

function VirtualResults({ results, highlight, onHover, onSelect }: VirtualProps) {
  const containerRef = useRef<HTMLUListElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const ITEM_HEIGHT = 56;
  const VIEWPORT = 480;
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => setScrollTop(el.scrollTop);
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, []);
  const start = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - 4);
  const end = Math.min(results.length, start + Math.ceil(VIEWPORT / ITEM_HEIGHT) + 8);
  return (
    <ul
      ref={containerRef}
      className="memory-palette-results"
      role="listbox"
      style={{ position: 'relative', overflowY: 'auto', maxHeight: VIEWPORT }}
    >
      <li aria-hidden="true" style={{ height: start * ITEM_HEIGHT }} />
      {results.slice(start, end).map((r, k) => {
        const i = start + k;
        return (
          <li key={r.permalink}>
            <button
              type="button"
              className="memory-palette-result"
              data-palette-active={i === highlight}
              onMouseEnter={() => onHover(i)}
              onClick={() => onSelect(i)}
              data-testid={`memory-palette-result-${r.permalink}`}
            >
              <span className="memory-palette-result-title">{r.title}</span>
              <span className="memory-palette-result-meta">
                <span className="memory-palette-result-tag">{r.folder}</span>
                {r.tags.slice(0, 4).map((t) => (
                  <span key={t} className="memory-palette-result-tag">#{t}</span>
                ))}
                {r.snippet && <span> · {r.snippet}</span>}
              </span>
            </button>
          </li>
        );
      })}
      <li aria-hidden="true" style={{ height: (results.length - end) * ITEM_HEIGHT }} />
    </ul>
  );
}
