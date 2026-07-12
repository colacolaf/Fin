import { useMemo, useState } from 'react';
import type { MemoryNote } from '../../api/memory';
import type { TagNode } from '../../hooks/useMemory';

interface MemorySidebarProps {
  notes: MemoryNote[];
  pinned: Set<string>;
  recent: string[];
  folderGroups: Record<string, MemoryNote[]>;
  tagTree: TagNode[];
  activePermalink: string | null;
  filteredTagPath: string | null;
  onSelect: (permalink: string) => void;
  onTogglePin: (permalink: string) => void;
  onToggleTag: (path: string | null) => void;
}

function flattenTags(nodes: TagNode[], depth = 0, expanded: Set<string>): { node: TagNode; depth: number }[] {
  const out: { node: TagNode; depth: number }[] = [];
  for (const n of nodes) {
    out.push({ node: n, depth });
    if (expanded.has(n.fullPath) && n.children.length > 0) {
      out.push(...flattenTags(n.children, depth + 1, expanded));
    }
  }
  return out;
}

export default function MemorySidebar({
  notes,
  pinned,
  recent,
  folderGroups,
  tagTree,
  activePermalink,
  filteredTagPath,
  onSelect,
  onTogglePin,
  onToggleTag,
}: MemorySidebarProps) {
  const [expandedTags, setExpandedTags] = useState<Set<string>>(() => new Set());

  const toggleExpand = (path: string) => {
    setExpandedTags((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const flatTags = useMemo(() => flattenTags(tagTree, 0, expandedTags), [tagTree, expandedTags]);

  const pinnedNotes = useMemo(
    () => [...pinned].map((p) => notes.find((n) => n.permalink === p)).filter((n): n is MemoryNote => !!n),
    [pinned, notes],
  );
  const recentNotes = useMemo(
    () => recent.map((p) => notes.find((n) => n.permalink === p)).filter((n): n is MemoryNote => !!n),
    [recent, notes],
  );

  const folders = ['recommendations', 'decisions', 'preferences', 'patterns', 'daily'] as const;
  const labels: Record<typeof folders[number], string> = {
    recommendations: 'Recommendations',
    decisions: 'Decisions',
    preferences: 'Preferences',
    patterns: 'Patterns',
    daily: 'Daily',
  };

  return (
    <aside className="memory-pane memory-sidebar" aria-label="Memory navigation" data-testid="memory-sidebar">
      <div className="memory-pane-header">
        <span>Knowledge</span>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 400 }}>
          {notes.length} notes
        </span>
      </div>

      {pinnedNotes.length > 0 && (
        <>
          <div className="memory-tree-folder">📌 Pinned</div>
          <ul className="memory-tree" role="tree" aria-label="Pinned notes">
            {pinnedNotes.map((n) => (
              <li key={n.permalink} role="treeitem" aria-expanded={false}>
                <button
                  type="button"
                  className={`memory-tree-item ${n.permalink === activePermalink ? 'active' : ''}`}
                  onClick={() => onSelect(n.permalink)}
                  data-testid={`memory-pin-${n.permalink}`}
                >
                  <span className="memory-tree-item-text">{n.title}</span>
                  <span
                    className="memory-tree-pin-btn pinned"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTogglePin(n.permalink);
                    }}
                    title="Unpin"
                    role="button"
                    aria-label={`Unpin ${n.title}`}
                  >
                    📌
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {recentNotes.length > 0 && (
        <>
          <div className="memory-tree-folder">🕒 Recent</div>
          <ul className="memory-tree" role="tree" aria-label="Recent notes">
            {recentNotes.map((n) => (
              <li key={n.permalink} role="treeitem" aria-expanded={false}>
                <button
                  type="button"
                  className={`memory-tree-item ${n.permalink === activePermalink ? 'active' : ''}`}
                  onClick={() => onSelect(n.permalink)}
                  data-testid={`memory-recent-${n.permalink}`}
                >
                  <span className="memory-tree-item-text">{n.title}</span>
                  <span
                    className={`memory-tree-pin-btn ${pinned.has(n.permalink) ? 'pinned' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onTogglePin(n.permalink);
                    }}
                    title={pinned.has(n.permalink) ? 'Unpin' : 'Pin'}
                    aria-label={`${pinned.has(n.permalink) ? 'Unpin' : 'Pin'} ${n.title}`}
                  >
                    {pinned.has(n.permalink) ? '📌' : '☆'}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {folders.map((f) => {
        const list = folderGroups[f] ?? [];
        if (list.length === 0) return null;
        return (
          <div key={f}>
            <div className="memory-tree-folder">
              {labels[f]}
              <span className="memory-tree-count">{list.length}</span>
            </div>
            <ul className="memory-tree" role="tree" aria-label={`${labels[f]} notes`}>
              {list.map((n) => (
                <li key={n.permalink} role="treeitem" aria-expanded={false}>
                  <button
                    type="button"
                    className={`memory-tree-item ${n.permalink === activePermalink ? 'active' : ''}`}
                    onClick={() => onSelect(n.permalink)}
                    data-testid={`memory-folder-${f}-${n.permalink}`}
                  >
                    <span className="memory-tree-item-text">{n.title}</span>
                    <span
                      className={`memory-tree-pin-btn ${pinned.has(n.permalink) ? 'pinned' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onTogglePin(n.permalink);
                      }}
                      title={pinned.has(n.permalink) ? 'Unpin' : 'Pin'}
                      aria-label={`${pinned.has(n.permalink) ? 'Unpin' : 'Pin'} ${n.title}`}
                    >
                      {pinned.has(n.permalink) ? '📌' : '☆'}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        );
      })}

      {tagTree.length > 0 && (
        <>
          <div className="memory-tree-folder">🏷 Tags</div>
          <ul className="memory-tag-tree" role="tree" aria-label="Tag tree">
            {flatTags.map(({ node, depth }) => (
              <li key={node.fullPath} role="treeitem" aria-expanded={expandedTags.has(node.fullPath)}>
                <button
                  type="button"
                  className={`memory-tag-tree-row ${filteredTagPath === node.fullPath ? 'active' : ''}`}
                  style={{ ['--depth' as string]: String(depth) }}
                  onClick={(e) => {
                    if (node.children.length > 0 && (e.target as HTMLElement).closest('.memory-tag-tree-toggle')) {
                      toggleExpand(node.fullPath);
                    } else {
                      onToggleTag(filteredTagPath === node.fullPath ? null : node.fullPath);
                    }
                  }}
                  data-testid={`memory-tag-${node.fullPath}`}
                >
                  {node.children.length > 0 ? (
                    <span
                      className="memory-tag-tree-toggle"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(node.fullPath);
                      }}
                      role="presentation"
                    >
                      {expandedTags.has(node.fullPath) ? '▾' : '▸'}
                    </span>
                  ) : (
                    <span className="memory-tag-tree-toggle" aria-hidden="true"> </span>
                  )}
                  <span>#{node.name}</span>
                  <span className="memory-tag-tree-count">{node.count}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {notes.length === 0 && (
        <div className="memory-empty">
          No notes yet. Your daily note will be created automatically.
        </div>
      )}
    </aside>
  );
}
