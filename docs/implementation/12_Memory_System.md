# 12 — Memory System

## What & Why
basic-memory MCP integration for persistent markdown memory. TencentDB Agent Memory for short-term context compression. Per-agent memory nodes. Obsidian-compatible output. Per Memory_system.md.

## Files to Create / Modify
```
backend/
├── services/
│   └── memory_bridge.py     # MCP proxy for basic-memory
├── agents/
│   └── base.py              # add memory load/save to BaseAgent
shared/
├── src/
│   └── mcp_client.ts        # Frontend MCP client for basic-memory
frontend/
├── src/
│   ├── components/
│   │   └── memory/
│   │       ├── MemoryGraph.tsx
│   │       ├── MemoryPanel.tsx
│   │       ├── MemorySearch.tsx
│   │       ├── MemoryTimeline.tsx
│   │       └── MemoryNodeDetail.tsx
│   └── hooks/
│       └── useMemory.ts
~/.fin/memory/               # basic-memory vault dir
```

## Steps
1. Configure basic-memory MCP server in `.rowboat/config/mcp.json`. Path: `~/.fin/memory/`. Install via `npx @basicmachines-co/basic-memory`.
2. `backend/services/memory_bridge.py` — proxy MCP calls from FastAPI to basic-memory: create_note, read_note, update_note, search_notes, list_notes. Transparent pass-through with auth check.
3. `backend/agents/base.py` — add memory_load(): read user-context.md, search recent decisions (limit 10), list patterns. add memory_save(): after agent run, write recommendation note, update user-context stats.
4. Initialize `~/.fin/memory/` directory structure: `recommendations/`, `decisions/`, `preferences/`, `patterns/`, `user-context.md`. Run on first app launch.
5. `shared/src/mcp_client.ts` — typed client for basic-memory MCP: createNote, readNote, searchNotes, listNotes, updateNote. Used by frontend.
6. `useMemory.ts` — hook: fetch nodes (decisions + recommendations), parse wikilinks → edges, build adjacency map. Returns graph data for D3.
7. `MemoryGraph.tsx` — D3 force-directed graph. Nodes = notes, edges = wikilinks. Color by type (recommendation=blue, decision=green, pattern=purple). Zoom/pan.
8. `MemoryPanel.tsx` — collapsible sidebar. Mini graph view. Expand to fullscreen MemoryView.
9. `MemorySearch.tsx` — search bar with debounce. Calls search_notes. Results as clickable list.
10. `MemoryTimeline.tsx` — chronological list of decisions + recommendations. Group by week.
11. `MemoryNodeDetail.tsx` — side drawer. Read full note content (markdown rendered). Show frontmatter metadata, tags, linked notes.
12. Wire frontend: dashboard sidebar integration. Memory icon in bottom-left. Click → mini panel opens. Click expand → fullscreen graph view.
13. TencentDB Agent Memory offload mode (Phase 2 prep): install package, configure offload for long sessions.
14. Playwright: memory panel opens/closes, search works, graph renders nodes, click node → detail drawer.

## Skills to Use
- `subagent-driven-development`
- `code-review-and-quality`
- `superpowers-lab`

## GitHub Repos Needed
- `basicmachines-co/basic-memory` (MCP markdown memory)
- `TencentCloud/TencentDB-Agent-Memory` (context compression, Phase 2)

## Edge Cases & Risks
- MCP server not running → graceful fallback, memory panel shows "Memory unavailable"
- Empty memory (new user) → show onboarding message, "No memories yet"
- Large graph (>100 nodes) → D3 performance, limit visible nodes, zoom-based detail
- Wikilink parse errors → skip malformed links silently, log warning
- Obsidian user edits → system reads updated content, no conflicts (markdown is source of truth)

## Done When
- [ ] basic-memory MCP server configured, writes to ~/.fin/memory/
- [ ] memory_bridge.py proxies all MCP calls with auth
- [ ] BaseAgent loads/saves memory before/after each run
- [ ] Directory structure created on first launch
- [ ] Frontend MemoryPanel shows in sidebar
- [ ] D3 force-directed graph renders nodes + edges from real data
- [ ] Search returns results, click loads detail
- [ ] Detail drawer shows full note with markdown rendering
- [ ] Recommendations saved as markdown notes via MCP
- [ ] Decisions saved when user votes
- [ ] Playwright: full memory flow (open panel, search, graph, detail)
- [ ] Git: review diff, squash merge to main with `[12] Memory system`