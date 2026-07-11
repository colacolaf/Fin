import React, { useState, useEffect } from 'react';
import { listMemory } from '../../api/memory';
import type { MemoryNote } from '../../api/memory';

const FOLDER_COLORS: Record<string, string> = {
  recommendations: '#2563eb',
  decisions: '#16a34a',
  preferences: '#ea580c',
  patterns: '#7c3aed',
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
  if (diffDays === 1) {
    return `Yesterday ${d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  }
  if (diffDays < 7) {
    const dayName = d.toLocaleDateString([], { weekday: 'short' });
    return `${dayName} ${d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

function groupNotes(notes: MemoryNote[]) {
  const now = new Date();
  const groups: Record<string, MemoryNote[]> = { Today: [], Yesterday: [], 'This Week': [], Earlier: [] };

  for (const note of notes) {
    const d = new Date(note.created_at);
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) groups['Today'].push(note);
    else if (diffDays === 1) groups['Yesterday'].push(note);
    else if (diffDays < 7) groups['This Week'].push(note);
    else groups['Earlier'].push(note);
  }

  return Object.entries(groups).filter(([, v]) => v.length > 0);
}

const styles: Record<string, React.CSSProperties> = {
  container: {},
  groupHeader: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-muted, #64748B)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    paddingBottom: 8,
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    marginBottom: 16,
    marginTop: 32,
  },
  card: {
    background: 'var(--bg-card, #162A4A)',
    borderRadius: 10,
    padding: '16px 20px',
    marginBottom: 10,
    cursor: 'pointer',
    border: '1px solid rgba(255,255,255,0.04)',
    transition: 'border-color 0.15s',
  },
  cardExpanded: {
    borderColor: 'rgba(59,130,246,0.3)',
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
  fullContent: {
    fontSize: 13,
    color: 'var(--text-secondary, #94A3B8)',
    lineHeight: 1.6,
    margin: 0,
    whiteSpace: 'pre-wrap' as const,
  },
  loading: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    padding: 60,
    gap: 16,
  },
  spinner: {
    width: 32,
    height: 32,
    border: '3px solid rgba(255,255,255,0.1)',
    borderTopColor: '#3B82F6',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  error: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    padding: 60,
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
  },
  retryBtn: {
    padding: '8px 20px',
    borderRadius: 8,
    border: 'none',
    background: '#1E40AF',
    color: '#fff',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
  },
  empty: {
    textAlign: 'center' as const,
    padding: 60,
    fontSize: 14,
    color: 'var(--text-muted, #64748B)',
    lineHeight: 1.6,
  },
};

export default function MemoryTimeline() {
  const [notes, setNotes] = useState<MemoryNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const fetchNotes = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listMemory();
      setNotes(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load memories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const toggle = (permalink: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(permalink)) next.delete(permalink);
      else next.add(permalink);
      return next;
    });
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={styles.spinner} />
        <div style={{ fontSize: 14, color: 'var(--text-muted, #64748B)' }}>Loading memories...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.error}>
        <div style={styles.errorText}>{error}</div>
        <button onClick={fetchNotes} style={styles.retryBtn}>Retry</button>
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div style={styles.empty}>
        No memory notes yet — run agents to generate recommendations and they'll appear here
      </div>
    );
  }

  const groups = groupNotes(notes);

  return (
    <div style={styles.container}>
      {groups.map(([label, groupNotes]) => (
        <div key={label}>
          <div style={{ ...styles.groupHeader, ...(label === 'Today' ? { marginTop: 0 } : {}) }}>
            {label}
          </div>
          {groupNotes.map((note) => {
            const isExpanded = expanded.has(note.permalink);
            const preview =
              note.content.length > 200 ? note.content.slice(0, 200) + '...' : note.content;
            const folderColor = FOLDER_COLORS[note.folder] || '#94A3B8';

            return (
              <div
                key={note.permalink}
                style={{ ...styles.card, ...(isExpanded ? styles.cardExpanded : {}) }}
                onClick={() => toggle(note.permalink)}
              >
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
                {isExpanded ? (
                  <p style={styles.fullContent}>{note.content}</p>
                ) : (
                  <p style={styles.preview}>{preview}</p>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}