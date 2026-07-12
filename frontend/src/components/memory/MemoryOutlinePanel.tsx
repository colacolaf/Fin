import { useMemo } from 'react';
import type { MemoryNote } from '../../api/memory';

interface Props {
  note: MemoryNote;
  allNotes: MemoryNote[];
  onHeaderJump: (line: number) => void;
  onOpen: (permalink: string) => void;
}

interface Header {
  depth: 1 | 2 | 3;
  text: string;
  line: number;
}

const HEADER_RE = /^(#{1,3})\s+(.*)$/;

export function extractHeaders(content: string, offset = 0): Header[] {
  const headers: Header[] = [];
  if (!content) return headers;
  const lines = content.split('\n');
  let line = offset;
  for (const raw of lines) {
    const m = raw.match(HEADER_RE);
    if (m) {
      const depth = m[1].length as 1 | 2 | 3;
      headers.push({ depth, text: m[2].trim(), line });
    }
    line += 1;
  }
  return headers;
}

export default function MemoryOutlinePanel({ note, allNotes, onHeaderJump, onOpen }: Props) {
  const headers = useMemo(() => extractHeaders(note.content), [note.content]);
  const backlinks = useMemo(
    () => {
      if (!note.title) return [];
      const needle = `[[${note.title}]]`;
      return allNotes.filter((n) => n.permalink !== note.permalink && n.content?.includes(needle));
    },
    [allNotes, note.permalink, note.title],
  );

  return (
    <aside className="memory-pane memory-outline-pane" aria-label="Outline and backlinks" data-testid="memory-outline">
      <div className="memory-pane-header">
        <span>Outline</span>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 400 }}>
          {headers.length}
        </span>
      </div>
      {headers.length === 0 ? (
        <div className="memory-empty">No headers yet — write a # heading to start the outline.</div>
      ) : (
        <ul className="memory-outline-list" role="tree" aria-label="Document headings">
          {headers.map((h, i) => (
            <li key={`${h.line}-${i}`} role="treeitem" aria-expanded={false}>
              <button
                type="button"
                className="memory-outline-item"
                data-depth={h.depth}
                onClick={() => onHeaderJump(h.line)}
                data-testid={`memory-outline-${h.line}`}
              >
                {h.text}
              </button>
            </li>
          ))}
        </ul>
      )}

      {note.tags.length > 0 && (
        <div style={{ padding: '8px 16px 4px', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {note.tags.map((t) => (
            <span key={t} className="memory-palette-result-tag" title={`Filter by tag #${t}`}>
              #{t}
            </span>
          ))}
        </div>
      )}

      <div className="memory-backlinks">
        <div className="memory-backlinks-title">
          🔗 Backlinks <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>{backlinks.length}</span>
        </div>
        {backlinks.length === 0 ? (
          <div className="memory-empty" style={{ padding: '12px 16px', fontSize: 'var(--text-xs)' }}>
            No notes link here yet.
          </div>
        ) : (
          <ul role="list" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {backlinks.map((b) => (
              <li key={b.permalink}>
                <button
                  type="button"
                  className="memory-backlink"
                  onClick={() => onOpen(b.permalink)}
                  data-testid={`memory-backlink-${b.permalink}`}
                >
                  <span>{b.title}</span>
                  <span className="memory-backlink-meta">{b.folder}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
