import { useCallback, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import CodeMirror, {
  EditorView,
  Decoration,
  ViewPlugin,
  type DecorationSet,
  type PluginValue,
} from '@uiw/react-codemirror';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { autocompletion, type Completion, type CompletionContext } from '@codemirror/autocomplete';
import { oneDark } from '@codemirror/theme-one-dark';
import { RangeSetBuilder } from '@codemirror/state';
import { syntaxTree, HighlightStyle } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';
import type { MemoryNote, SaveStatus } from '../../hooks/useMemory';

export interface MemoryNoteEditorHandle {
  flushPendingUpdate: () => Promise<void>;
  scrollToLine: (line: number) => void;
}

interface Props {
  note: MemoryNote;
  knownTitles: Set<string>;
  allNotes: { title: string; permalink: string; folder: string }[];
  saveStatus: SaveStatus;
  writeAvailable: boolean;
  onSave: (content: string) => Promise<boolean>;
  onDirtyChange?: (dirty: boolean) => void;
  onWikilinkClick: (title: string) => void;
}

// ─── Live preview plugin: marks markdown syntax + adds presentation styling ─
function buildLivePreviewDecorations(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  for (const { from, to } of view.visibleRanges) {
    syntaxTree(view.state).iterate({
      from,
      to,
      enter: (node) => {
        const name = node.name;
        if (
          name.endsWith('Mark') ||
          name === 'HeaderMark' ||
          name === 'EmphasisMark' ||
          name === 'StrongMark' ||
          name === 'CodeMark' ||
          name === 'LinkMark' ||
          name === 'QuoteMark' ||
          name === 'ListMark'
        ) {
          builder.add(node.from, node.to, Decoration.mark({ class: 'cm-formatting' }));
        }
        if (name === 'Header1') {
          builder.add(node.from, node.from, Decoration.line({ class: 'cm-header-1' }));
        } else if (name === 'Header2') {
          builder.add(node.from, node.from, Decoration.line({ class: 'cm-header-2' }));
        } else if (name === 'Header3') {
          builder.add(node.from, node.from, Decoration.line({ class: 'cm-header-3' }));
        } else if (name === 'StrongEmphasis') {
          builder.add(node.from, node.to, Decoration.mark({ class: 'cm-strong' }));
        } else if (name === 'Emphasis') {
          builder.add(node.from, node.to, Decoration.mark({ class: 'cm-em' }));
        } else if (name === 'InlineCode') {
          builder.add(node.from, node.to, Decoration.mark({ class: 'cm-inline-code' }));
        }
      },
    });
  }
  return builder.finish();
}

const livePreviewPlugin = ViewPlugin.fromClass(
  class implements PluginValue {
    decorations: DecorationSet;
    constructor(view: EditorView) {
      this.decorations = buildLivePreviewDecorations(view);
    }
    update(update: { docChanged: boolean; viewportChanged: boolean; view: EditorView }) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = buildLivePreviewDecorations(update.view);
      }
    }
  },
  { decorations: (v) => v.decorations },
);

const wikilinkRegex = /\[\[([^\]\n]+?)\]\]/g;

function buildWikilinkDecorations(
  view: EditorView,
  known: Set<string>,
): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  for (const { from, to } of view.visibleRanges) {
    const text = view.state.doc.sliceString(from, to);
    let m: RegExpExecArray | null;
    wikilinkRegex.lastIndex = 0;
    while ((m = wikilinkRegex.exec(text))) {
      const start = from + m.index;
      const end = start + m[0].length;
      const title = m[1].split('|')[0].trim();
      const cls = known.has(title) ? 'cm-wikilink' : 'cm-wikilink-missing';
      builder.add(start, end, Decoration.mark({ class: cls, attributes: { 'data-wikilink': title } }));
    }
  }
  return builder.finish();
}

function wikilinkPlugin(getKnown: () => Set<string>) {
  return ViewPlugin.fromClass(
    class implements PluginValue {
      decorations: DecorationSet;
      constructor(view: EditorView) {
        this.decorations = buildWikilinkDecorations(view, getKnown());
      }
      update(update: { docChanged: boolean; viewportChanged: boolean; view: EditorView }) {
        if (update.docChanged || update.viewportChanged) {
          this.decorations = buildWikilinkDecorations(update.view, getKnown());
        }
      }
    },
    { decorations: (v) => v.decorations },
  );
}

// Highlight style that maps markdown node names to CSS classes we already ship.
const finHighlight = HighlightStyle.define([
  { tag: t.heading1, class: 'cm-header-1' },
  { tag: t.heading2, class: 'cm-header-2' },
  { tag: t.heading3, class: 'cm-header-3' },
  { tag: t.strong, class: 'cm-strong' },
  { tag: t.emphasis, class: 'cm-em' },
  { tag: t.monospace, class: 'cm-inline-code' },
]);

// ─── Wikilink autocomplete — built-in completion source ────────────────────
function makeWikilinkCompletion(
  getKnown: () => Set<string>,
  getAllNotes: () => { title: string; permalink: string; folder: string }[],
) {
  return (context: CompletionContext): { from: number; options: Completion[] } | null => {
    const match = context.matchBefore(/\[\[([^\]\n]*)/);
    if (!match) return null;
    if (!context.explicit && match.text.length < 2) return null;
    const query = match.text.slice(2).toLowerCase();
    const known = getKnown();
    const all = getAllNotes();
    const titles = new Set(known);
    const options: Completion[] = [];
    // 1) Matching note titles from cache
    for (const note of all) {
      if (titles.has(note.title) && (!query || note.title.toLowerCase().includes(query))) {
        options.push({
          label: note.title,
          type: 'text',
          detail: note.folder,
          apply: `${note.title}]]`,
        });
      }
    }
    // 2) "Create note: …" trailing entry when no exact match
    const trimmed = query.trim();
    if (trimmed && !known.has(trimmed)) {
      options.push({
        label: `Create note: ${trimmed}`,
        type: 'keyword',
        detail: 'Create new',
        apply: `${trimmed}]]`,
      });
    }
    if (options.length === 0) return null;
    return { from: match.from + 2, options };
  };
}

export default function MemoryNoteEditor({
  note,
  knownTitles,
  allNotes,
  saveStatus,
  writeAvailable,
  onSave,
  onDirtyChange,
  onWikilinkClick,
  ref,
}: Props & { ref?: React.Ref<MemoryNoteEditorHandle> }) {
  const viewRef = useRef<EditorView | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestContentRef = useRef<string>(note.content);
  const knownTitlesRef = useRef<Set<string>>(knownTitles);
  const allNotesRef = useRef<{ title: string; permalink: string; folder: string }[]>(allNotes);

  useEffect(() => { knownTitlesRef.current = knownTitles; }, [knownTitles]);
  useEffect(() => { allNotesRef.current = allNotes; }, [allNotes]);

  // Reset content when switching notes
  useEffect(() => {
    latestContentRef.current = note.content;
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    onDirtyChange?.(false);
  }, [note.permalink, note.content, onDirtyChange]);

  const performFlush = useCallback(async (): Promise<void> => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    if (latestContentRef.current === note.content) return;
    await onSave(latestContentRef.current);
  }, [note.content, onSave]);

  const handleChange = useCallback(
    (value: string) => {
      latestContentRef.current = value;
      onDirtyChange?.(true);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        void performFlush();
      }, 800);
    },
    [performFlush, onDirtyChange],
  );

  useImperativeHandle(
    ref,
    (): MemoryNoteEditorHandle => ({
      flushPendingUpdate: performFlush,
      scrollToLine: (line: number) => {
        const view = viewRef.current;
        if (!view) return;
        const lineObj = view.state.doc.line(Math.min(Math.max(1, line + 1), view.state.doc.lines));
        view.dispatch({
          selection: { anchor: lineObj.from },
          effects: EditorView.scrollIntoView(lineObj.from, { y: 'start' }),
        });
        view.focus();
      },
    }),
    [performFlush],
  );

  // Memoized extensions — rebuilds only when note changes (not on every keystroke).
  const wikilinkExt = useMemo(() => wikilinkPlugin(() => knownTitlesRef.current), [note.permalink]);
  const completionExt = useMemo(
    () =>
      autocompletion({
        override: [
          makeWikilinkCompletion(
            () => knownTitlesRef.current,
            () => allNotesRef.current,
          ),
        ],
        activateOnTyping: true,
        closeOnBlur: true,
      }),
    [note.permalink],
  );

  // Stable ref so wikilinkClickExt never needs to be re-created when the parent
  // callback identity changes between renders.
  const wikilinkClickRef = useRef(onWikilinkClick);
  wikilinkClickRef.current = onWikilinkClick;

  const wikilinkClickExt = useMemo(
    () =>
      EditorView.domEventHandlers({
        click(event) {
          const target = event.target as HTMLElement | null;
          if (!target) return;
          const node = target.closest('[data-wikilink]');
          if (!node) return;
          const title = node.getAttribute('data-wikilink');
          if (!title) return;
          event.preventDefault();
          wikilinkClickRef.current(title);
          return true;
        },
      }),
    [note.permalink],
  );

  return (
    <div className="memory-editor-body">
      <CodeMirror
        value={latestContentRef.current}
        extensions={[
          livePreviewPlugin,
          wikilinkExt,
          completionExt,
          wikilinkClickExt,
          finHighlight,
          markdown({ base: markdownLanguage, codeLanguages: [] }),
          EditorView.lineWrapping,
          oneDark,
        ]}
        onChange={handleChange}
        onCreateEditor={(view: EditorView) => { viewRef.current = view; }}
        basicSetup={{
          lineNumbers: true,
          foldGutter: false,
          highlightActiveLine: true,
          highlightActiveLineGutter: true,
          indentOnInput: true,
        }}
        aria-label="Note editor"
        role="textbox"
        data-testid="memory-editor"
      />
      {!writeAvailable && (
        <div className="memory-status-banner" role="status">
          ⚠ Memory writes unavailable — backend write endpoints not yet implemented. Edits stay local until sync rolls out.
        </div>
      )}
      <SaveStatusIndicator status={saveStatus} />
    </div>
  );
}

function SaveStatusIndicator({ status }: { status: SaveStatus }) {
  if (status === 'idle') return null;
  const className = `memory-editor-toolbar-status ${status}`;
  const labels: Record<SaveStatus, string> = {
    idle: '',
    dirty: 'Modified',
    saving: 'Saving…',
    saved: 'Saved ✓',
    error: 'Save failed — retry on switch',
  };
  return (
    <span className={className} data-testid="memory-save-status" role="status">
      {labels[status]}
    </span>
  );
}
