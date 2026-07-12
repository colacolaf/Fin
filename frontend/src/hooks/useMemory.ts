import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  type MemoryNote,
  createMemoryNote,
  fetchMemoryGraph,
  listMemory,
  readMemoryNote,
  searchMemory,
  updateMemoryNote,
} from '../api/memory';

const PINNED_STORAGE_KEY = 'fin.memory.pinned';
const RECENT_STORAGE_KEY = 'fin.memory.recent';
const RECENT_MAX = 5;

export type SaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

export interface UseMemoryOptions {
  onAutoloadDaily?: boolean;
}

function loadSet(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed.filter((v): v is string => typeof v === 'string')) : new Set();
  } catch {
    return new Set();
  }
}

function loadList(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

function persistSet(key: string, set: Set<string>): void {
  try {
    localStorage.setItem(key, JSON.stringify([...set]));
  } catch { /* ignore quota errors */ }
}

function persistList(key: string, list: string[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch { /* ignore quota errors */ }
}

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function buildDailyPermalink(date: string): string {
  return `memories/daily/${date}.md`;
}

export function buildDailyContent(date: string): string {
  return [
    '## Today\u2019s Decisions',
    '',
    '## Agent Notes',
    '',
    '## Tomorrow',
    '',
  ].join('\n');
}

export const DAILY_FRONTMATTER = (date: string) => ({
  type: 'daily',
  date,
  tags: ['daily'],
});

export interface TagNode {
  name: string;
  fullPath: string;
  count: number;
  children: TagNode[];
}

export function buildTagTree(notes: MemoryNote[]): TagNode[] {
  const roots = new Map<string, TagNode>();
  for (const note of notes) {
    for (const tag of note.tags) {
      const segments = tag.split('/').filter(Boolean);
      if (segments.length === 0) continue;
      let cursor = roots;
      let parentPath = '';
      for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        parentPath = parentPath ? `${parentPath}/${seg}` : seg;
        let node = cursor.get(seg);
        if (!node) {
          node = { name: seg, fullPath: parentPath, count: 0, children: [] };
          cursor.set(seg, node);
          if (i === 0) roots.set(seg, node);
        }
        node.count += 1;
        cursor = new Map(node.children.map((c) => [c.name, c] as const));
      }
    }
  }
  // Convert children maps into arrays sorted by name
  const sortRec = (nodes: TagNode[]): TagNode[] =>
    nodes
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((n) => ({ ...n, children: sortRec(n.children) }));
  return sortRec([...roots.values()]);
}

// [[Title]] and [[Title|Alias]] both count as backlinks to Title.
const WIKILINK_BACKLINK_RE = /\[\[([^\]\n|]+)(?:\|[^\]\n]+)?\]\]/g;

export function findBacklinks(currentTitle: string, notes: MemoryNote[]): MemoryNote[] {
  if (!currentTitle) return [];
  return notes.filter((n) => {
    if (!n.content) return false;
    WIKILINK_BACKLINK_RE.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = WIKILINK_BACKLINK_RE.exec(n.content))) {
      if (m[1].trim() === currentTitle) return true;
    }
    return false;
  });
}

const FOLDER_ORDER = ['recommendations', 'decisions', 'preferences', 'patterns', 'daily'];

export function groupByFolder(notes: MemoryNote[]): Record<string, MemoryNote[]> {
  const groups: Record<string, MemoryNote[]> = {};
  for (const folder of FOLDER_ORDER) groups[folder] = [];
  for (const note of notes) {
    const folder = note.folder || 'other';
    if (!groups[folder]) groups[folder] = [];
    groups[folder].push(note);
  }
  return groups;
}

export function useMemory(opts: UseMemoryOptions = {}) {
  const { onAutoloadDaily = true } = opts;

  const [notes, setNotes] = useState<MemoryNote[]>([]);
  const [graph, setGraph] = useState<{ nodes: { id: string; tags: string[]; folder: string; type: string; title: string }[]; edges: { source: string; target: string; label: string }[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activePermalink, setActivePermalink] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [writeAvailable, setWriteAvailable] = useState(true);

  const [pinned, setPinned] = useState<Set<string>>(() => loadSet(PINNED_STORAGE_KEY));
  const [recent, setRecent] = useState<string[]>(() => loadList(RECENT_STORAGE_KEY));

  const dailyMountedRef = useRef<string | null>(null);

  // Refresh notes list
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, g] = await Promise.allSettled([
        listMemory(),
        fetchMemoryGraph(),
      ]);
      if (list.status === 'fulfilled') {
        setNotes(list.value);
      } else {
        throw list.reason;
      }
      if (g.status === 'fulfilled') {
        setGraph(g.value as typeof graph);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load memory');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Daily note auto-creation (StrictMode guard: track session-key, not localStorage)
  const ensureDailyNote = useCallback(async (): Promise<MemoryNote | null> => {
    const date = todayIso();
    const sessionKey = `${date}:${Math.random().toString(36).slice(2, 8)}`;
    if (dailyMountedRef.current === sessionKey) return null;
    dailyMountedRef.current = sessionKey;

    const permalink = buildDailyPermalink(date);
    const existing = notes.find((n) => n.permalink === permalink || n.file_path === permalink || n.file_path.endsWith(`/${date}.md`));
    if (existing) {
      setActivePermalink(existing.permalink);
      return existing;
    }

    try {
      const created = await createMemoryNote({
        permalink,
        title: `Daily — ${date}`,
        content: buildDailyContent(date),
        folder: 'daily',
        tags: ['daily'],
        frontmatter: DAILY_FRONTMATTER(date),
      });
      setNotes((prev) => [created, ...prev]);
      setActivePermalink(created.permalink);
      return created;
    } catch (e) {
      // Backend stub not implemented yet — graceful degradation.
      setWriteAvailable(false);
      setError(
        e instanceof Error
          ? `Memory writes unavailable: ${e.message}`
          : 'Memory writes unavailable',
      );
      // Open a transient daily draft locally without persisting
      const placeholder: MemoryNote = {
        permalink,
        title: `Daily — ${date}`,
        content: buildDailyContent(date),
        folder: 'daily',
        tags: ['daily'],
        frontmatter: DAILY_FRONTMATTER(date),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        file_path: permalink,
      };
      setNotes((prev) => [placeholder, ...prev]);
      setActivePermalink(permalink);
      return placeholder;
    }
  }, [notes]);

  useEffect(() => {
    if (!onAutoloadDaily) return;
    if (loading) return;
    void ensureDailyNote();
  }, [onAutoloadDaily, loading, ensureDailyNote]);

  // Open a specific note (fetch full content if not in cache)
  const openNote = useCallback(
    async (permalink: string): Promise<MemoryNote | null> => {
      const fromCache = notes.find((n) => n.permalink === permalink);
      if (fromCache && fromCache.content && fromCache.content.length > 0) {
        setActivePermalink(permalink);
        // Update recent list
        setRecent((prev) => {
          const next = [permalink, ...prev.filter((p) => p !== permalink)].slice(0, RECENT_MAX);
          persistList(RECENT_STORAGE_KEY, next);
          return next;
        });
        return fromCache;
      }
      try {
        const note = await readMemoryNote(permalink);
        setNotes((prev) => {
          if (prev.find((n) => n.permalink === permalink)) {
            return prev.map((n) => (n.permalink === permalink ? note : n));
          }
          return [note, ...prev];
        });
        setActivePermalink(permalink);
        setRecent((prev) => {
          const next = [permalink, ...prev.filter((p) => p !== permalink)].slice(0, RECENT_MAX);
          persistList(RECENT_STORAGE_KEY, next);
          return next;
        });
        return note;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to read note');
        return null;
      }
    },
    [notes],
  );

  // Pin / unpin
  const togglePin = useCallback((permalink: string) => {
    setPinned((prev) => {
      const next = new Set(prev);
      if (next.has(permalink)) next.delete(permalink);
      else next.add(permalink);
      persistSet(PINNED_STORAGE_KEY, next);
      return next;
    });
  }, []);

  // Save (update_note with debouncing handled by editor)
  const saveNote = useCallback(
    async (permalink: string, content: string, frontmatter?: Record<string, unknown>): Promise<boolean> => {
      setSaveStatus('saving');
      try {
        const updated = await updateMemoryNote(permalink, { content, frontmatter });
        setNotes((prev) => prev.map((n) => (n.permalink === permalink ? updated : n)));
        setSaveStatus('saved');
        return true;
      } catch (e) {
        setWriteAvailable(false);
        setSaveStatus('error');
        setError(e instanceof Error ? `Save failed: ${e.message}` : 'Save failed');
        return false;
      }
    },
    [],
  );

  const search = useCallback(async (query: string): Promise<MemoryNote[]> => {
    if (!query.trim()) return [];
    try {
      return await searchMemory(query);
    } catch {
      return [];
    }
  }, []);

  const activeNote = useMemo(
    () => notes.find((n) => n.permalink === activePermalink) ?? null,
    [notes, activePermalink],
  );

  const titleIndex = useMemo(() => {
    const titles = new Set<string>();
    for (const n of notes) if (n.title) titles.add(n.title);
    return titles;
  }, [notes]);

  const folderGroups = useMemo(() => groupByFolder(notes), [notes]);
  const tagTree = useMemo(() => buildTagTree(notes), [notes]);
  const backlinksForActive = useMemo(
    () => (activeNote ? findBacklinks(activeNote.title, notes.filter((n) => n.permalink !== activeNote.permalink)) : []),
    [notes, activeNote],
  );

  const recentNotes = useMemo(
    () => recent.map((p) => notes.find((n) => n.permalink === p)).filter((n): n is MemoryNote => !!n),
    [recent, notes],
  );

  const pinnedNotes = useMemo(
    () => [...pinned].map((p) => notes.find((n) => n.permalink === p)).filter((n): n is MemoryNote => !!n),
    [pinned, notes],
  );

  return {
    // Data
    notes,
    graph,
    activeNote,
    activePermalink,
    setActivePermalink,
    folderGroups,
    tagTree,
    titleIndex,
    recentNotes,
    pinnedNotes,
    pinned,
    backlinksForActive,
    // Status
    loading,
    error,
    saveStatus,
    setSaveStatus,
    writeAvailable,
    // Actions
    refresh,
    openNote,
    ensureDailyNote,
    togglePin,
    saveNote,
    search,
  };
}

export type UseMemoryReturn = ReturnType<typeof useMemory>;
