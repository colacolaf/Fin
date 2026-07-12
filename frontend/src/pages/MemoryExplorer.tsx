import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import MemorySidebar from '../components/memory/MemorySidebar';
import MemoryNoteEditor, {
  type MemoryNoteEditorHandle,
} from '../components/memory/MemoryNoteEditor';
import MemoryOutlinePanel from '../components/memory/MemoryOutlinePanel';
import MemoryCommandPalette from '../components/memory/MemoryCommandPalette';
import MemoryGraph from '../components/memory/MemoryGraph';
import EmptyState from '../components/ui/EmptyState';
import { IconEmptyMemory } from '../components/layout/Icons';
import { useMemory } from '../hooks/useMemory';
import { searchMemory } from '../api/memory';
import { MemorySkeleton } from '../components/ui/PageSkeleton';

type RightPane = 'outline' | 'graph';

export default function MemoryExplorer() {
  const {
    notes,
    activeNote,
    activePermalink,
    folderGroups,
    tagTree,
    pinned,
    recentNotes,
    titleIndex,
    loading,
    error,
    saveStatus,
    setSaveStatus,
    writeAvailable,
    openNote,
    ensureDailyNote,
    togglePin,
    saveNote,
  } = useMemory({ onAutoloadDaily: true });

  const editorRef = useRef<MemoryNoteEditorHandle | null>(null);
  const [filteredTagPath, setFilteredTagPath] = useState<string | null>(null);
  const [rightPane, setRightPane] = useState<RightPane>('outline');
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Global Cmd/Ctrl+K — listener attaches once and uses functional updater.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setPaletteOpen((v) => !v);
        return;
      }
      if (e.key === 'Escape') setPaletteOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleSelect = useCallback(async (permalink: string) => {
    if (editorRef.current) {
      try { await editorRef.current.flushPendingUpdate(); } catch { /* ignore */ }
    }
    await openNote(permalink);
  }, [openNote]);

  const allNotesRef = useRef(notes);
  allNotesRef.current = notes;

  const handleWikilinkClick = useCallback((title: string) => {
    void (async () => {
      const cached = allNotesRef.current.find((n) => n.title === title);
      if (cached) {
        await handleSelect(cached.permalink);
        return;
      }
      try {
        const results = await searchMemory(title);
        const match = results.find((n) => n.title === title) ?? results[0];
        if (match) await handleSelect(match.permalink);
      } catch {
        /* swallow */
      }
    })();
  }, [handleSelect]);

  // Stable callbacks for child memoization (the editor and graph both rebuild
  // expensive extensions / D3 simulations on identity changes of these props).
  const handleGraphNodeSelect = useCallback(
    (title: string) => {
      const match = allNotesRef.current.find((n) => n.title === title);
      if (match) void handleSelect(match.permalink);
    },
    [handleSelect],
  );

  // Folder-filter UI state (multi-select chips).
  const [activeFolders, setActiveFolders] = useState<string[]>([]);
  const toggleFolder = useCallback((folder: string) => {
    setActiveFolders((prev) =>
      prev.includes(folder) ? prev.filter((f) => f !== folder) : [...prev, folder],
    );
  }, []);
  const FOLDER_OPTIONS = [
    { key: 'recommendations', label: 'Recs' },
    { key: 'decisions', label: 'Decisions' },
    { key: 'preferences', label: 'Prefs' },
    { key: 'patterns', label: 'Patterns' },
    { key: 'daily', label: 'Daily' },
  ];

  const visibleNotes = useMemo(() => {
    if (!filteredTagPath) return notes;
    return notes.filter((n) =>
      n.tags.some((t) => t === filteredTagPath || t.startsWith(`${filteredTagPath}/`)),
    );
  }, [notes, filteredTagPath]);

  const visibleFolderGroups = useMemo(() => {
    if (!filteredTagPath) return folderGroups;
    const filtered: typeof folderGroups = {};
    for (const [folder, list] of Object.entries(folderGroups)) {
      filtered[folder] = list.filter((n) =>
        n.tags.some((t) => t === filteredTagPath || t.startsWith(`${filteredTagPath}/`)),
      );
    }
    return filtered;
  }, [folderGroups, filteredTagPath]);

  // Editor autocomplete seed: simple title/folder/permalink tuples.
  const allNotesForAutocomplete = useMemo(
    () => notes.map((n) => ({ title: n.title, permalink: n.permalink, folder: n.folder })),
    [notes],
  );

  // Graph hover preview snippets: title → first 200 chars of body.
  const nodeSnippets = useMemo(() => {
    const out: Record<string, string> = {};
    for (const n of notes) {
      if (!n.content) continue;
      const firstParagraph = n.content
        .split('\n')
        .find((line) => line.trim() && !line.trim().startsWith('#') && !line.trim().startsWith('---'));
      out[n.title] = (firstParagraph ?? '').trim();
    }
    return out;
  }, [notes]);

  return (
    <div className="memory-shell" data-testid="memory-explorer">
      <MemorySidebar
        notes={visibleNotes}
        pinned={pinned}
        recent={recentNotes.map((n) => n.permalink)}
        folderGroups={visibleFolderGroups}
        tagTree={tagTree}
        activePermalink={activePermalink}
        filteredTagPath={filteredTagPath}
        onSelect={handleSelect}
        onTogglePin={togglePin}
        onToggleTag={setFilteredTagPath}
      />

      <main
        className="memory-pane memory-editor-pane"
        aria-label="Note editor"
        data-testid="memory-editor-pane"
      >
        {activeNote ? (
          <>
            <div className="memory-editor-toolbar">
              <span className="memory-editor-toolbar-title" title={activeNote.permalink}>
                {activeNote.title}
              </span>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                {activeNote.folder}
              </span>
            </div>
            <MemoryNoteEditor
              ref={editorRef}
              key={activeNote.permalink}
              note={activeNote}
              knownTitles={titleIndex}
              allNotes={allNotesForAutocomplete}
              saveStatus={saveStatus}
              writeAvailable={writeAvailable}
              onSave={async (content) => {
                setSaveStatus('saving');
                const ok = await saveNote(
                  activeNote.permalink,
                  content,
                  activeNote.frontmatter as Record<string, unknown>,
                );
                setSaveStatus(ok ? 'saved' : 'error');
                if (ok) setTimeout(() => setSaveStatus('idle'), 1200);
                return ok;
              }}
              onWikilinkClick={handleWikilinkClick}
            />
          </>
        ) : (
          loading ? (
            <div data-testid="memory-editor-empty">
              <MemorySkeleton />
            </div>
          ) : notes.length === 0 && !error ? (
            <EmptyState
              icon={<IconEmptyMemory />}
              title="Your vault is empty"
              description="Open a daily note — Fin suggests today's date."
              slug="memory-empty"
              cta={{ label: "Open today's note", onClick: async () => {
                await ensureDailyNote();
              } }}
              secondaryAction={{ label: 'Read tour', onClick: () => {
                document.querySelector('[data-coach-tour-mount]')?.scrollIntoView({
                  behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
                });
              } }}
            />
          ) : (
            <div className="memory-empty" data-testid="memory-editor-empty">
              {error ?? 'No note open — open one from the sidebar (⌘K to search).'}
            </div>
          )
        )}
      </main>

      <div
        className="memory-pane memory-outline-pane"
        aria-label="Memory right panel"
        data-testid="memory-right-pane"
      >
        <div className="memory-pane-header">
          <div className="memory-graph-toggle" role="tablist" aria-label="Right panel view">
            <button
              type="button"
              role="tab"
              aria-selected={rightPane === 'outline'}
              className={rightPane === 'outline' ? 'active' : ''}
              onClick={() => setRightPane('outline')}
              data-testid="memory-pane-outline"
            >
              Outline
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={rightPane === 'graph'}
              className={rightPane === 'graph' ? 'active' : ''}
              onClick={() => setRightPane('graph')}
              data-testid="memory-pane-graph"
            >
              Graph
            </button>
          </div>
        </div>
        {rightPane === 'outline' && activeNote ? (
          <MemoryOutlinePanel
            note={activeNote}
            allNotes={notes}
            onHeaderJump={(line) => editorRef.current?.scrollToLine(line)}
            onOpen={(p) => void handleSelect(p)}
          />
        ) : rightPane === 'graph' ? (
          <div style={{ padding: 8 }} data-testid="memory-graph-pane">
            <div className="memory-graph-toggle" style={{ marginBottom: 8 }} role="group" aria-label="Folder filter">
              {FOLDER_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  className={activeFolders.includes(opt.key) ? 'active' : ''}
                  onClick={() => toggleFolder(opt.key)}
                  aria-pressed={activeFolders.includes(opt.key)}
                  data-testid={`memory-graph-folder-${opt.key}`}
                >
                  {opt.label}
                </button>
              ))}
              {activeFolders.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveFolders([])}
                  data-testid="memory-graph-folder-clear"
                >
                  Clear
                </button>
              )}
            </div>
            <MemoryGraph
              filterTag={filteredTagPath}
              filterFolder={null}
              filterFolders={activeFolders.length > 0 ? activeFolders : null}
              nodeSnippets={nodeSnippets}
              onNodeSelect={handleGraphNodeSelect}
            />
          </div>
        ) : (
          <div className="memory-empty">Open a note to see its outline.</div>
        )}
      </div>

      <MemoryCommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        notes={notes}
        onSelect={openNote}
        flushEditor={async () => {
          if (editorRef.current) await editorRef.current.flushPendingUpdate();
        }}
      />
    </div>
  );
}
