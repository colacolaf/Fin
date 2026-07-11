import React, { useState, useEffect } from 'react';
import { searchMemory } from '../../api/memory';
import type { MemoryNote } from '../../api/memory';

const FOLDER_COLORS: Record<string, string> = {
  recommendations: '#2563eb',
  decisions: '#16a34a',
  preferences: '#ea580c',
  patterns: '#7c3aed',
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

const styles: Record<string, React.CSSProperties> = {
  container: {},
  searchInput: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'var(--bg-card, #162A4A)',
    color: 'var(--text-primary, #E8F4FD)',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box' as const,
    marginBottom: 16,
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    padding: 16,
  },
  miniSpinner: {
    width: 20,
    height: 20,
    border: '2px solid rgba(255,255,255,0.1)',
    borderTopColor: '#3B82F6',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  error: {
    padding: '12px 16px',
    borderRadius: 8,
    background: 'rgba(239,68,68,0.1)',
    color: '#EF4444',
    fontSize: 13,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  retryBtn: {
    padding: '4px 12px',
    borderRadius: 6,
    border: 'none',
    background: '#DC2626',
    color: '#fff',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
  },
  emptyQuery: {
    textAlign: 'center' as const,
    padding: 60,
    fontSize: 14,
    color: 'var(--text-muted, #64748B)',
  },
  noResults: {
    textAlign: 'center' as const,
    padding: 40,
    fontSize: 14,
    color: 'var(--text-muted, #64748B)',
  },
  card: {
    background: 'var(--bg-card, #162A4A)',
    borderRadius: 10,
    padding: '16px 20px',
    marginBottom: 10,
    border: '1px solid rgba(255,255,255,0.04)',
  },
  cardTop: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: 600,
    color: 'var(--text-primary, #E8F4FD)',
    margin: 0,
    flex: 1,
  },
  dateText: {
    fontSize: 12,
    color: 'var(--text-muted, #64748B)',
    whiteSpace: 'nowrap',
    marginLeft: 12,
  },
  meta: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  folderBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '2px 8px',
    borderRadius: 10,
    fontSize: 11,
    fontWeight: 500,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.03em',
  },
  tag: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '2px 7px',
    borderRadius: 8,
    fontSize: 10,
    fontWeight: 500,
    background: 'rgba(255,255,255,0.05)',
    color: 'var(--text-muted, #64748B)',
  },
  preview: {
    fontSize: 13,
    color: 'var(--text-secondary, #94A3B8)',
    lineHeight: 1.5,
    margin: 0,
    whiteSpace: 'pre-wrap' as const,
  },
};

export default function MemorySearch() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState<MemoryNote[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Search when debounced query changes
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults(null);
      return;
    }
    let cancelled = false;
    const doSearch = async () => {
      setSearching(true);
      setError(null);
      try {
        const data = await searchMemory(debouncedQuery);
        if (!cancelled) setResults(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Search failed');
      } finally {
        if (!cancelled) setSearching(false);
      }
    };
    doSearch();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  return (
    <div style={styles.container}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <input
        style={styles.searchInput}
        placeholder="🔍 Search across all memory notes..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {searching && (
        <div style={styles.loading}>
          <div style={styles.miniSpinner} />
        </div>
      )}

      {error && (
        <div style={styles.error}>
          <span>{error}</span>
          <button onClick={() => setDebouncedQuery((q) => q)} style={styles.retryBtn}>
            Retry
          </button>
        </div>
      )}

      {!debouncedQuery.trim() && !searching && (
        <div style={styles.emptyQuery}>Search across all memory notes</div>
      )}

      {debouncedQuery.trim() && !searching && !error && results !== null && results.length === 0 && (
        <div style={styles.noResults}>No notes matching "{debouncedQuery}"</div>
      )}

      {results !== null &&
        results.map((note) => {
          const preview =
            note.content.length > 200 ? note.content.slice(0, 200) + '...' : note.content;
          const folderColor = FOLDER_COLORS[note.folder] || '#94A3B8';

          return (
            <div key={note.permalink} style={styles.card}>
              <div style={styles.cardTop}>
                <h4 style={styles.title}>{note.title}</h4>
                <span style={styles.dateText}>{formatDate(note.created_at)}</span>
              </div>
              <div style={styles.meta}>
                <span
                  style={{
                    ...styles.folderBadge,
                    background: `${folderColor}1a`,
                    color: folderColor,
                  }}
                >
                  {note.folder}
                </span>
                {note.tags.map((tag) => (
                  <span key={tag} style={styles.tag}>
                    {tag}
                  </span>
                ))}
              </div>
              <p style={styles.preview}>{preview}</p>
            </div>
          );
        })}
    </div>
  );
}