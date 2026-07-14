# Memory System Design

Version: 2.0 | Status: Draft

## Overview

The memory system is a lightweight, file-based store of every conversation between the user and the finance agents. It is intentionally backend-first and minimal on the UI layer. The only frontend entry point is a search panel inside **Settings**.

The previous "Agent Memory" widget on the dashboard is replaced by a **Recent News** widget. The actual memory backend remains a searchable archive of chat files that agents can read when they need context.

## Goals

1. **Local-first**: All chat history lives as plain files on the user's machine.
2. **Agent-readable**: Agents can search and load relevant past conversations at the start of a new chat.
3. **Minimal UI**: The user interacts with memory only through a search panel in Settings.
4. **Lightweight**: No vector database, no LLM extraction, no heavy dependencies.
5. **Future-proof**: The file format and search API are simple enough to later add semantic search or encryption.

## What Changed from v1

| v1 (old) | v2 (this doc) |
|---|---|
| Obsidian-style memory graph on the dashboard | **Recent News** widget on the dashboard (placeholder only) |
| Visual graph of memories | Searchable file archive of chat transcripts |
| Prominent UI for memory | Memory accessed only through Settings |
| Complex rendering (PixiJS/Cytoscape) | Plain files + keyword search |

## File Storage

### Location

```
<user-data-dir>/
  memory/
    portfolio/
      2026-07-13T14-32-00Z_portfolio-agent.json
      2026-07-14T09-11-22Z_portfolio-agent.json
    debt/
      2026-07-13T15-00-00Z_debt-agent.json
    retirement/
      2026-07-14T11-45-00Z_retirement-agent.json
```

- `<user-data-dir>` is the same directory that holds `user-context.json`.
- One folder per agent.
- Each chat session is one JSON file.
- File naming: `<ISO-timestamp>_<agent-slug>.json`.

### File Format

Each file is a lightweight JSON object:

```json
{
  "id": "2026-07-13T14-32-00Z_portfolio-agent",
  "agent": "portfolio",
  "category": "Rebalancing",
  "createdAt": "2026-07-13T14:32:00Z",
  "updatedAt": "2026-07-13T14:35:00Z",
  "messages": [
    {
      "role": "user",
      "content": "Should I rebalance my portfolio?",
      "timestamp": "2026-07-13T14:32:00Z"
    },
    {
      "role": "assistant",
      "content": "Your tech concentration is now 22%...",
      "timestamp": "2026-07-13T14:32:15Z"
    }
  ]
}
```

### Design Decisions

- **JSON over Markdown**: Easier to parse, search, and extend with metadata.
- **One file per session**: Keeps reads/writes simple and atomic.
- **Plain text for now**: Encryption can be added later without changing the schema.

## Search

### Strategy

Simple keyword search across all chat files. No embeddings, no vector DB.

### Search API

```typescript
interface SearchMemoryOptions {
  query?: string
  agent?: "portfolio" | "debt" | "retirement"
  startDate?: string // ISO date
  endDate?: string // ISO date
  limit?: number
}

interface MemoryResult {
  id: string
  agent: string
  createdAt: string
  updatedAt: string
  preview: string // first matching snippet
  matches: number
}

async function searchMemory(options: SearchMemoryOptions): Promise<MemoryResult[]>
```

### Behavior

- If `query` is empty, return the most recent sessions.
- Search is case-insensitive.
- Results are ranked by recency and number of matches.
- Preview shows the first matching sentence with the keyword highlighted.

## Settings UI

The memory search panel lives in Settings.

### Layout

```
┌─────────────────────────────────────┐
│ Memory Search                       │
│ ┌─────────────────────────────────┐ │
│ │ Search past conversations...    │ │
│ └─────────────────────────────────┘ │
│ Agent: [All ▼]  From: [date] To: [date] │
│                                     │
│ Results                             │
│ • Portfolio Agent — Jul 13, 2025    │
│   "Should I rebalance my portfolio?"│
│ • Debt Agent — Jul 12, 2025         │
│   "Pay off my credit card first..." │
└─────────────────────────────────────┘
```

### Features

- Search input
- Agent filter dropdown
- Date range filters
- Click a result to open the full chat transcript in a read-only view
- Optional: export a chat to Markdown

## Chat File Lifecycle

A new chat file is created when the user opens a new chat session with an agent. Before the first message is sent, the agent shows a small popup asking the user to pick a category for the chat (e.g., "Retirement planning", "Debt payoff", "Tax optimization", "General"). The chosen category is stored in the chat file metadata.

```
User opens Portfolio Agent chat  → show category popup
User selects category            → create file in memory/portfolio/
User sends first message         → append user message
Assistant replies                → append assistant message
User closes chat panel           → flush file to disk
```

- One file per chat session.
- Files are written incrementally during the session and flushed on close.
- If the app crashes, the latest in-memory messages may be lost; this is acceptable for v2.

## Agent Integration

When an agent starts a new conversation, it may optionally load relevant memory. The default behavior is:

1. Load the User Context File (existing behavior).
2. If the user's first message is not a greeting, call `searchMemory({ query: userMessage, agent: currentAgent, limit: 3 })`.
3. Inject the most relevant past messages into the system prompt as context.

### Context Injection Limits

To avoid token bloat, agents receive only a small, fixed amount of memory context:

- Maximum **3** relevant chat sessions.
- Maximum **5** messages per session.
- Maximum **2,000** characters total.

If the retrieved memory exceeds these limits, it is truncated from the oldest messages forward.

### Example Prompt Injection

```
Recent relevant conversations:
- Portfolio Agent, 2026-07-13: User asked about rebalancing due to tech concentration.
```

## Dashboard: Recent News Widget

The dashboard no longer shows the memory graph. In its place is a **Recent News** widget.

### v2 Scope

- The widget is a placeholder in the dashboard template.
- It displays a title and a short placeholder message.
- Real content (market updates, recent recommendations, alerts) is out of scope for this version.

### Template Label

```
┌────────────────────┐
│   RECENT NEWS      │
│                    │
│  (latest updates   │
│   will appear      │
│   here)            │
│                    │
└────────────────────┘
```

## Future Enhancements

1. **Encryption**: Encrypt memory files with the app's encryption key.
2. **Semantic search**: Add embeddings for better retrieval.
3. **Memory extraction**: Auto-extract facts/preferences from chats.
4. **Recent News content**: Populate the dashboard widget with real updates.
5. **Chat continuation**: Allow users to resume a past conversation from the search results.

## Open Questions

- Should memory files be pruned or archived after a certain age?
- Should the user be able to delete individual messages or entire sessions?
- Should agents automatically log every recommendation as a separate memory entry?
